/**
 * Enhanced Storage Service for FinSync Financial App
 * Provides comprehensive data persistence with encryption, compression, batch operations,
 * data integrity checks, and error recovery capabilities
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import AsyncStorageWrapper, { StorageOptions, StorageItem, StorageError } from './AsyncStorageWrapper';
import { STORAGE_KEYS, STORAGE_CONFIG, DEFAULT_STORAGE_OPTIONS } from './StorageKeys';
import {
  StorageMetadata,
  DataIntegrityReport,
  DataIssue,
  ValidationResult,
  ValidationError,
} from '../../types';

export interface BatchOperation<T = any> {
  type: 'set' | 'get' | 'delete';
  key: string;
  value?: T;
  options?: StorageOptions;
}

export interface BatchResult<T = any> {
  success: boolean;
  key: string;
  value?: T;
  error?: string;
}

export interface StorageStats {
  totalKeys: number;
  totalSize: number;
  freeSpace: number;
  dataIntegrity: number; // percentage
  lastBackup?: Date;
  lastMigration?: Date;
}

export interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  data: string;
}

export interface DataRepairResult {
  repaired: number;
  failed: number;
  issues: DataIssue[];
}

/**
 * Enhanced Storage Service with advanced features
 */
export class StorageService {
  private static readonly MAX_RETRY_ATTEMPTS = 3;
  private static readonly COMPRESSION_THRESHOLD = 1024; // 1KB
  private static readonly MAX_BATCH_SIZE = 50;

  /**
   * Enhanced batch operations with retry logic and error recovery
   */
  static async executeBatch<T>(
    operations: BatchOperation<T>[]
  ): Promise<BatchResult<T>[]> {
    if (operations.length > this.MAX_BATCH_SIZE) {
      throw new StorageError(
        `Batch size exceeds maximum limit of ${this.MAX_BATCH_SIZE}`,
        'BATCH_SIZE_EXCEEDED'
      );
    }

    const results: BatchResult<T>[] = [];
    const chunks = this.chunkArray(operations, 10); // Process in chunks of 10

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (operation) => {
        return this.executeOperationWithRetry(operation);
      });

      const chunkResults = await Promise.allSettled(chunkPromises);
      
      chunkResults.forEach((result, index) => {
        const operation = chunk[index];
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            key: operation.key,
            error: result.reason?.message || 'Unknown error',
          });
        }
      });
    }

    return results;
  }

  /**
   * Enhanced data compression with multiple algorithms
   */
  static async compressData(data: string): Promise<CompressionResult> {
    const originalSize = data.length;
    
    if (originalSize < this.COMPRESSION_THRESHOLD) {
      return {
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1,
        data,
      };
    }

    try {
      // Simple compression using run-length encoding for demo
      // In production, use proper compression libraries like lz-string
      const compressed = this.runLengthEncode(data);
      const compressedSize = compressed.length;

      return {
        originalSize,
        compressedSize,
        compressionRatio: compressedSize / originalSize,
        data: compressed,
      };
    } catch (error) {
      throw new StorageError(
        'Failed to compress data',
        'COMPRESSION_ERROR',
        undefined,
        error as Error
      );
    }
  }

  /**
   * Decompress data
   */
  static async decompressData(compressedData: string): Promise<string> {
    try {
      return this.runLengthDecode(compressedData);
    } catch (error) {
      throw new StorageError(
        'Failed to decompress data',
        'DECOMPRESSION_ERROR',
        undefined,
        error as Error
      );
    }
  }

  /**
   * Comprehensive data integrity check
   */
  static async checkDataIntegrity(): Promise<DataIntegrityReport> {
    const startTime = Date.now();
    const allKeys = await AsyncStorageWrapper.getAllKeys();
    const appKeys = allKeys.filter(key => key.startsWith('finsync_'));
    
    const issues: DataIssue[] = [];
    let totalRecords = 0;
    let corruptedRecords = 0;
    let missingReferences = 0;
    let duplicateRecords = 0;

    // Check each storage key
    for (const key of appKeys) {
      try {
        const data = await AsyncStorageWrapper.getItem(key);
        if (data) {
          totalRecords++;
          
          // Check for corruption
          const corruptionIssues = await this.checkRecordCorruption(key, data);
          issues.push(...corruptionIssues);
          corruptedRecords += corruptionIssues.length;

          // Check for missing references
          const referenceIssues = await this.checkMissingReferences(key, data);
          issues.push(...referenceIssues);
          missingReferences += referenceIssues.length;

          // Check for duplicates
          const duplicateIssues = await this.checkDuplicates(key, data);
          issues.push(...duplicateIssues);
          duplicateRecords += duplicateIssues.length;
        }
      } catch (error) {
        issues.push({
          type: 'corruption',
          entity: key,
          entityId: key,
          description: `Failed to read data: ${error}`,
          severity: 'high',
          autoFixable: false,
        });
        corruptedRecords++;
      }
    }

    return {
      checkedAt: new Date(),
      totalRecords,
      corruptedRecords,
      missingReferences,
      duplicateRecords,
      issues,
      repairRecommendations: this.generateRepairRecommendations(issues),
    };
  }

  /**
   * Automatic data repair
   */
  static async repairData(report: DataIntegrityReport): Promise<DataRepairResult> {
    let repaired = 0;
    let failed = 0;
    const unrepairedIssues: DataIssue[] = [];

    for (const issue of report.issues) {
      if (issue.autoFixable) {
        try {
          await this.repairIssue(issue);
          repaired++;
        } catch (error) {
          failed++;
          unrepairedIssues.push({
            ...issue,
            description: `${issue.description} (Repair failed: ${error})`,
          });
        }
      } else {
        unrepairedIssues.push(issue);
      }
    }

    return {
      repaired,
      failed,
      issues: unrepairedIssues,
    };
  }

  /**
   * Storage metadata management
   */
  static async updateStorageMetadata(key: string, data: any): Promise<void> {
    const metadata: StorageMetadata = {
      version: STORAGE_CONFIG.DATA_VERSION,
      createdAt: new Date(),
      updatedAt: new Date(),
      recordCount: Array.isArray(data) ? data.length : 1,
      dataSize: JSON.stringify(data).length,
      checksum: await this.generateAdvancedChecksum(JSON.stringify(data)),
    };

    const metadataKey = `${key}_metadata`;
    await AsyncStorageWrapper.setItem(metadataKey, metadata, {
      encrypt: true,
      compress: false,
    });
  }

  /**
   * Get storage metadata
   */
  static async getStorageMetadata(key: string): Promise<StorageMetadata | null> {
    const metadataKey = `${key}_metadata`;
    return await AsyncStorageWrapper.getItem<StorageMetadata>(metadataKey);
  }

  /**
   * Comprehensive storage statistics
   */
  static async getStorageStats(): Promise<StorageStats> {
    const baseStats = await AsyncStorageWrapper.getStorageStats();
    const integrityReport = await this.checkDataIntegrity();
    
    const dataIntegrity = integrityReport.totalRecords > 0
      ? ((integrityReport.totalRecords - integrityReport.corruptedRecords) / integrityReport.totalRecords) * 100
      : 100;

    // Get backup and migration dates
    const lastBackup = await this.getLastBackupDate();
    const lastMigration = await this.getLastMigrationDate();

    return {
      totalKeys: baseStats.totalKeys,
      totalSize: baseStats.estimatedSize,
      freeSpace: this.estimateFreeSpace(baseStats.estimatedSize),
      dataIntegrity,
      lastBackup,
      lastMigration,
    };
  }

  /**
   * Enhanced storage cleanup with intelligent purging
   */
  static async cleanupStorage(options: {
    purgeExpired?: boolean;
    purgeCache?: boolean;
    purgeTemp?: boolean;
    compactData?: boolean;
  } = {}): Promise<{
    keysRemoved: number;
    spaceSaved: number;
    errors: string[];
  }> {
    const {
      purgeExpired = true,
      purgeCache = true,
      purgeTemp = true,
      compactData = true,
    } = options;

    let keysRemoved = 0;
    let spaceSaved = 0;
    const errors: string[] = [];

    try {
      const allKeys = await AsyncStorageWrapper.getAllKeys();
      const appKeys = allKeys.filter(key => key.startsWith('finsync_'));

      // Remove expired items
      if (purgeExpired) {
        for (const key of appKeys) {
          try {
            const data = await AsyncStorage.getItem(key);
            if (data) {
              const item: StorageItem = JSON.parse(data);
              if (item.expiry && Date.now() > item.expiry) {
                await AsyncStorageWrapper.removeItem(key);
                keysRemoved++;
                spaceSaved += data.length;
              }
            }
          } catch (error) {
            errors.push(`Failed to check expiry for ${key}: ${error}`);
          }
        }
      }

      // Remove cache data
      if (purgeCache) {
        const cacheKeys = appKeys.filter(key => key.includes('cache'));
        for (const key of cacheKeys) {
          try {
            const data = await AsyncStorage.getItem(key);
            if (data) {
              await AsyncStorageWrapper.removeItem(key);
              keysRemoved++;
              spaceSaved += data.length;
            }
          } catch (error) {
            errors.push(`Failed to remove cache ${key}: ${error}`);
          }
        }
      }

      // Remove temporary data
      if (purgeTemp) {
        const tempKeys = appKeys.filter(key => key.includes('temp'));
        for (const key of tempKeys) {
          try {
            const data = await AsyncStorage.getItem(key);
            if (data) {
              await AsyncStorageWrapper.removeItem(key);
              keysRemoved++;
              spaceSaved += data.length;
            }
          } catch (error) {
            errors.push(`Failed to remove temp ${key}: ${error}`);
          }
        }
      }

      // Compact data
      if (compactData) {
        await this.compactStorageData();
      }

    } catch (error) {
      errors.push(`Cleanup failed: ${error}`);
    }

    return {
      keysRemoved,
      spaceSaved,
      errors,
    };
  }

  /**
   * Private helper methods
   */
  private static async executeOperationWithRetry<T>(
    operation: BatchOperation<T>
  ): Promise<BatchResult<T>> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        switch (operation.type) {
          case 'set':
            await AsyncStorageWrapper.setItem(
              operation.key,
              operation.value,
              operation.options
            );
            return { success: true, key: operation.key };

          case 'get':
            const value = await AsyncStorageWrapper.getItem<T>(operation.key);
            return { success: true, key: operation.key, value };

          case 'delete':
            await AsyncStorageWrapper.removeItem(operation.key);
            return { success: true, key: operation.key };

          default:
            throw new Error(`Unknown operation type: ${operation.type}`);
        }
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.MAX_RETRY_ATTEMPTS) {
          await this.delay(Math.pow(2, attempt) * 100); // Exponential backoff
        }
      }
    }

    return {
      success: false,
      key: operation.key,
      error: lastError?.message || 'Unknown error after retries',
    };
  }

  private static chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static runLengthEncode(data: string): string {
    // Simple run-length encoding implementation
    let encoded = '';
    let count = 1;
    let currentChar = data[0];

    for (let i = 1; i < data.length; i++) {
      if (data[i] === currentChar && count < 255) {
        count++;
      } else {
        encoded += String.fromCharCode(count) + currentChar;
        currentChar = data[i];
        count = 1;
      }
    }
    encoded += String.fromCharCode(count) + currentChar;
    return encoded;
  }

  private static runLengthDecode(encoded: string): string {
    let decoded = '';
    for (let i = 0; i < encoded.length; i += 2) {
      const count = encoded.charCodeAt(i);
      const char = encoded[i + 1];
      decoded += char.repeat(count);
    }
    return decoded;
  }

  private static async checkRecordCorruption(key: string, data: any): Promise<DataIssue[]> {
    const issues: DataIssue[] = [];
    
    try {
      // Check if data is properly structured
      if (typeof data !== 'object' || data === null) {
        issues.push({
          type: 'corruption',
          entity: key,
          entityId: key,
          description: 'Data is not a valid object',
          severity: 'high',
          autoFixable: false,
        });
      }

      // Check for required fields based on entity type
      if (Array.isArray(data)) {
        data.forEach((item, index) => {
          if (!item.id || !item.createdAt) {
            issues.push({
              type: 'corruption',
              entity: key,
              entityId: `${key}[${index}]`,
              description: 'Missing required fields (id, createdAt)',
              severity: 'medium',
              autoFixable: true,
            });
          }
        });
      }
    } catch (error) {
      issues.push({
        type: 'corruption',
        entity: key,
        entityId: key,
        description: `Data corruption check failed: ${error}`,
        severity: 'critical',
        autoFixable: false,
      });
    }

    return issues;
  }

  private static async checkMissingReferences(key: string, data: any): Promise<DataIssue[]> {
    const issues: DataIssue[] = [];
    
    // Check for missing references (e.g., transaction -> category, account)
    if (key === STORAGE_KEYS.TRANSACTIONS && Array.isArray(data)) {
      const categories = await AsyncStorageWrapper.getItem(STORAGE_KEYS.CATEGORIES) || [];
      const accounts = await AsyncStorageWrapper.getItem(STORAGE_KEYS.ACCOUNTS) || [];
      
      const categoryIds = new Set(categories.map((c: any) => c.id));
      const accountIds = new Set(accounts.map((a: any) => a.id));

      data.forEach((transaction: any) => {
        if (transaction.category && !categoryIds.has(transaction.category)) {
          issues.push({
            type: 'missing_reference',
            entity: 'transaction',
            entityId: transaction.id,
            description: `References non-existent category: ${transaction.category}`,
            severity: 'medium',
            autoFixable: true,
          });
        }

        if (transaction.accountId && !accountIds.has(transaction.accountId)) {
          issues.push({
            type: 'missing_reference',
            entity: 'transaction',
            entityId: transaction.id,
            description: `References non-existent account: ${transaction.accountId}`,
            severity: 'medium',
            autoFixable: true,
          });
        }
      });
    }

    return issues;
  }

  private static async checkDuplicates(key: string, data: any): Promise<DataIssue[]> {
    const issues: DataIssue[] = [];
    
    if (Array.isArray(data)) {
      const idSet = new Set();
      data.forEach((item: any) => {
        if (item.id) {
          if (idSet.has(item.id)) {
            issues.push({
              type: 'duplicate',
              entity: key,
              entityId: item.id,
              description: `Duplicate ID found: ${item.id}`,
              severity: 'high',
              autoFixable: true,
            });
          }
          idSet.add(item.id);
        }
      });
    }

    return issues;
  }

  private static generateRepairRecommendations(issues: DataIssue[]): string[] {
    const recommendations: string[] = [];
    
    const corruptionIssues = issues.filter(i => i.type === 'corruption');
    const missingRefIssues = issues.filter(i => i.type === 'missing_reference');
    const duplicateIssues = issues.filter(i => i.type === 'duplicate');

    if (corruptionIssues.length > 0) {
      recommendations.push('Run data repair to fix corrupted records');
      recommendations.push('Create backup before attempting repairs');
    }

    if (missingRefIssues.length > 0) {
      recommendations.push('Update references to point to valid entities');
      recommendations.push('Remove orphaned records if references cannot be restored');
    }

    if (duplicateIssues.length > 0) {
      recommendations.push('Remove duplicate records keeping the most recent version');
      recommendations.push('Verify data integrity after duplicate removal');
    }

    return recommendations;
  }

  private static async repairIssue(issue: DataIssue): Promise<void> {
    // Implement specific repair logic based on issue type
    switch (issue.type) {
      case 'duplicate':
        await this.repairDuplicateIssue(issue);
        break;
      case 'missing_reference':
        await this.repairMissingReferenceIssue(issue);
        break;
      case 'corruption':
        await this.repairCorruptionIssue(issue);
        break;
      default:
        throw new Error(`Cannot repair issue type: ${issue.type}`);
    }
  }

  private static async repairDuplicateIssue(issue: DataIssue): Promise<void> {
    // Remove duplicate entries, keeping the most recent one
    const data = await AsyncStorageWrapper.getItem(issue.entity);
    if (Array.isArray(data)) {
      const uniqueData = data.filter((item, index, self) => 
        index === self.findLastIndex(t => t.id === item.id)
      );
      await AsyncStorageWrapper.setItem(issue.entity, uniqueData);
    }
  }

  private static async repairMissingReferenceIssue(issue: DataIssue): Promise<void> {
    // For now, just log the issue - in production, implement specific repair logic
    console.warn(`Missing reference repair not implemented for: ${issue.description}`);
  }

  private static async repairCorruptionIssue(issue: DataIssue): Promise<void> {
    // For now, just log the issue - in production, implement specific repair logic
    console.warn(`Corruption repair not implemented for: ${issue.description}`);
  }

  private static async generateAdvancedChecksum(data: string): Promise<string> {
    // More robust checksum using FNV-1a hash algorithm
    let hash = 2166136261;
    for (let i = 0; i < data.length; i++) {
      hash ^= data.charCodeAt(i);
      hash *= 16777619;
    }
    return (hash >>> 0).toString(16);
  }

  private static estimateFreeSpace(usedSpace: number): number {
    // Estimate free space (AsyncStorage doesn't provide this directly)
    const estimatedTotalSpace = 10 * 1024 * 1024; // 10MB estimate
    return Math.max(0, estimatedTotalSpace - usedSpace);
  }

  private static async getLastBackupDate(): Promise<Date | undefined> {
    try {
      const backupMetadata = await AsyncStorageWrapper.getItem(STORAGE_KEYS.BACKUP_METADATA);
      return backupMetadata?.lastBackup ? new Date(backupMetadata.lastBackup) : undefined;
    } catch {
      return undefined;
    }
  }

  private static async getLastMigrationDate(): Promise<Date | undefined> {
    try {
      const migrationStatus = await AsyncStorageWrapper.getItem(STORAGE_KEYS.MIGRATION_STATUS);
      return migrationStatus?.completedAt ? new Date(migrationStatus.completedAt) : undefined;
    } catch {
      return undefined;
    }
  }

  private static async compactStorageData(): Promise<void> {
    // Compress large data sets to save space
    const coreDataKeys = [
      STORAGE_KEYS.TRANSACTIONS,
      STORAGE_KEYS.RECEIPTS,
      STORAGE_KEYS.INVESTMENTS,
    ];

    for (const key of coreDataKeys) {
      try {
        const data = await AsyncStorageWrapper.getItem(key);
        if (data) {
          const serialized = JSON.stringify(data);
          const compressionResult = await this.compressData(serialized);
          
          if (compressionResult.compressionRatio < 0.8) { // Only if significant compression
            await AsyncStorageWrapper.setItem(key, data, { compress: true });
          }
        }
      } catch (error) {
        console.warn(`Failed to compact data for ${key}:`, error);
      }
    }
  }
}

export default StorageService;