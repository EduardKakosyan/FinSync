/**
 * Data Backup Service for FinSync Financial App
 * Provides comprehensive backup and restore functionality with compression,
 * encryption, integrity verification, and automatic backup scheduling
 */

import AsyncStorageWrapper, { StorageError } from './AsyncStorageWrapper';
import StorageService, { CompressionResult } from './StorageService';
import { STORAGE_KEYS, STORAGE_CONFIG, DEFAULT_STORAGE_OPTIONS } from './StorageKeys';
import {
  BackupInfo,
  StorageMetadata,
  DataIntegrityReport,
  ValidationResult,
  ValidationError,
} from '../../types';

export interface BackupOptions {
  includeMetadata?: boolean;
  compress?: boolean;
  encrypt?: boolean;
  includeReceipts?: boolean;
  includeCache?: boolean;
  description?: string;
  tags?: string[];
}

export interface RestoreOptions {
  overwriteExisting?: boolean;
  skipValidation?: boolean;
  includeReceipts?: boolean;
  createBackupBeforeRestore?: boolean;
  selectiveRestore?: {
    transactions?: boolean;
    categories?: boolean;
    accounts?: boolean;
    receipts?: boolean;
    investments?: boolean;
    budgets?: boolean;
  };
}

export interface BackupData {
  metadata: StorageMetadata;
  version: string;
  createdAt: Date;
  data: {
    [STORAGE_KEYS.TRANSACTIONS]?: any[];
    [STORAGE_KEYS.CATEGORIES]?: any[];
    [STORAGE_KEYS.ACCOUNTS]?: any[];
    [STORAGE_KEYS.RECEIPTS]?: any[];
    [STORAGE_KEYS.INVESTMENTS]?: any[];
    [STORAGE_KEYS.BUDGETS]?: any[];
    [STORAGE_KEYS.USER_PROFILE]?: any;
    [STORAGE_KEYS.APP_SETTINGS]?: any;
  };
  integrity: {
    checksum: string;
    recordCounts: Record<string, number>;
  };
}

export interface RestoreResult {
  success: boolean;
  restoredKeys: string[];
  skippedKeys: string[];
  errors: string[];
  warnings: string[];
  recordsRestored: number;
  timeElapsed: number;
  integrityCheck?: ValidationResult;
}

export interface BackupSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM format
  maxBackups: number;
  autoCleanup: boolean;
  includeReceipts: boolean;
}

/**
 * Data Backup Service
 */
export class DataBackup {
  private static instance: DataBackup | null = null;
  private readonly maxBackupSize = 100 * 1024 * 1024; // 100MB
  private readonly compressionThreshold = 1024; // 1KB

  private constructor() {}

  /**
   * Singleton pattern for consistent instance
   */
  static getInstance(): DataBackup {
    if (!this.instance) {
      this.instance = new DataBackup();
    }
    return this.instance;
  }

  /**
   * Create comprehensive backup
   */
  async createBackup(
    name?: string,
    options: BackupOptions = {}
  ): Promise<BackupInfo> {
    const startTime = Date.now();
    
    const {
      includeMetadata = true,
      compress = true,
      encrypt = true,
      includeReceipts = true,
      includeCache = false,
      description = '',
      tags = [],
    } = options;

    try {
      // Generate backup ID and filename
      const backupId = this.generateBackupId();
      const filename = name || `backup_${backupId}`;

      // Collect data to backup
      const backupData = await this.collectBackupData({
        includeMetadata,
        includeReceipts,
        includeCache,
      });

      // Calculate record counts and integrity data
      const recordCounts = this.calculateRecordCounts(backupData.data);
      const checksum = await this.generateBackupChecksum(backupData);

      // Add integrity information
      backupData.integrity = {
        checksum,
        recordCounts,
      };

      // Serialize backup data
      let serializedData = JSON.stringify(backupData);
      let originalSize = serializedData.length;

      // Compress if requested and beneficial
      let compressionRatio = 1;
      if (compress && originalSize > this.compressionThreshold) {
        const compressionResult = await StorageService.compressData(serializedData);
        if (compressionResult.compressionRatio < 0.9) { // Only if 10%+ compression
          serializedData = compressionResult.data;
          compressionRatio = compressionResult.compressionRatio;
        }
      }

      // Encrypt if requested
      if (encrypt) {
        serializedData = await this.encryptBackupData(serializedData);
      }

      // Validate backup size
      const finalSize = serializedData.length;
      if (finalSize > this.maxBackupSize) {
        throw new StorageError(
          `Backup size (${this.formatBytes(finalSize)}) exceeds maximum allowed size (${this.formatBytes(this.maxBackupSize)})`,
          'BACKUP_TOO_LARGE'
        );
      }

      // Store backup
      const backupKey = this.getBackupKey(backupId);
      await AsyncStorageWrapper.setItem(backupKey, serializedData, {
        encrypt: false, // Already encrypted if needed
        compress: false, // Already compressed if needed
      });

      // Create backup info
      const backupInfo: BackupInfo = {
        id: backupId,
        filename,
        createdAt: new Date(),
        size: finalSize,
        recordCounts,
        metadata: {
          version: STORAGE_CONFIG.DATA_VERSION,
          createdAt: new Date(),
          updatedAt: new Date(),
          recordCount: Object.values(recordCounts).reduce((sum, count) => sum + count, 0),
          dataSize: finalSize,
          checksum,
        },
        isEncrypted: encrypt,
      };

      // Store backup info
      await this.storeBackupInfo(backupInfo);

      // Update backup metadata
      await this.updateBackupMetadata();

      // Clean up old backups if needed
      await this.cleanupOldBackups();

      return backupInfo;

    } catch (error) {
      throw new StorageError(
        `Failed to create backup: ${error}`,
        'BACKUP_CREATION_FAILED',
        undefined,
        error as Error
      );
    }
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<BackupInfo[]> {
    try {
      const backupList = await AsyncStorageWrapper.getItem<BackupInfo[]>(`${STORAGE_KEYS.BACKUP_METADATA}_list`);
      return backupList || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get backup details
   */
  async getBackupInfo(backupId: string): Promise<BackupInfo | null> {
    try {
      const backups = await this.listBackups();
      return backups.find(b => b.id === backupId) || null;
    } catch (error) {

      return null;
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(
    backupId: string,
    options: RestoreOptions = {}
  ): Promise<RestoreResult> {
    const startTime = Date.now();
    
    const {
      overwriteExisting = false,
      skipValidation = false,
      includeReceipts = true,
      createBackupBeforeRestore = true,
      selectiveRestore,
    } = options;

    const result: RestoreResult = {
      success: false,
      restoredKeys: [],
      skippedKeys: [],
      errors: [],
      warnings: [],
      recordsRestored: 0,
      timeElapsed: 0,
    };

    try {
      // Get backup info
      const backupInfo = await this.getBackupInfo(backupId);
      if (!backupInfo) {
        result.errors.push(`Backup not found: ${backupId}`);
        return result;
      }

      // Create backup before restore if requested
      if (createBackupBeforeRestore) {
        try {
          await this.createBackup(`pre_restore_${Date.now()}`, {
            description: `Automatic backup before restoring ${backupId}`,
          });
        } catch (error) {
          result.warnings.push(`Failed to create pre-restore backup: ${error}`);
        }
      }

      // Load backup data
      const backupData = await this.loadBackupData(backupId, backupInfo.isEncrypted);

      // Validate backup integrity
      if (!skipValidation) {
        const integrityCheck = await this.validateBackupIntegrity(backupData);
        result.integrityCheck = integrityCheck;
        
        if (!integrityCheck.isValid) {
          result.errors.push(`Backup integrity check failed: ${integrityCheck.errors.map(e => e.message).join(', ')}`);
          return result;
        }
      }

      // Determine what to restore
      const dataKeys = this.getRestoreKeys(selectiveRestore, includeReceipts);

      // Restore data
      for (const key of dataKeys) {
        try {
          const dataToRestore = backupData.data[key as keyof typeof backupData.data];
          
          if (!dataToRestore) {
            result.skippedKeys.push(key);
            continue;
          }

          // Check if data exists and handle overwrite logic
          if (!overwriteExisting) {
            const existingData = await AsyncStorageWrapper.getItem(key);
            if (existingData) {
              result.skippedKeys.push(key);
              result.warnings.push(`Skipped ${key} - data exists and overwrite not enabled`);
              continue;
            }
          }

          // Restore the data
          await AsyncStorageWrapper.setItem(key, dataToRestore, DEFAULT_STORAGE_OPTIONS.CORE_DATA);
          result.restoredKeys.push(key);
          
          if (Array.isArray(dataToRestore)) {
            result.recordsRestored += dataToRestore.length;
          } else {
            result.recordsRestored += 1;
          }

        } catch (error) {
          result.errors.push(`Failed to restore ${key}: ${error}`);
        }
      }

      // Update storage metadata for restored keys
      for (const key of result.restoredKeys) {
        try {
          const data = await AsyncStorageWrapper.getItem(key);
          if (data) {
            await StorageService.updateStorageMetadata(key, data);
          }
        } catch (error) {
          result.warnings.push(`Failed to update metadata for ${key}: ${error}`);
        }
      }

      result.success = result.errors.length === 0;
      result.timeElapsed = Date.now() - startTime;

      return result;

    } catch (error) {
      result.errors.push(`Restore failed: ${error}`);
      result.timeElapsed = Date.now() - startTime;
      return result;
    }
  }

  /**
   * Delete backup
   */
  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      // Remove backup data
      const backupKey = this.getBackupKey(backupId);
      await AsyncStorageWrapper.removeItem(backupKey);

      // Remove from backup list
      const backups = await this.listBackups();
      const updatedBackups = backups.filter(b => b.id !== backupId);
      await AsyncStorageWrapper.setItem(`${STORAGE_KEYS.BACKUP_METADATA}_list`, updatedBackups);

      // Update backup metadata
      await this.updateBackupMetadata();

      return true;

    } catch (error) {
      return false;
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(): Promise<{
    totalBackups: number;
    totalSize: number;
    oldestBackup?: Date;
    newestBackup?: Date;
    averageSize: number;
    compressionSavings: number;
  }> {
    const backups = await this.listBackups();
    
    if (backups.length === 0) {
      return {
        totalBackups: 0,
        totalSize: 0,
        averageSize: 0,
        compressionSavings: 0,
      };
    }

    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
    const dates = backups.map(b => b.createdAt).sort((a, b) => a.getTime() - b.getTime());

    return {
      totalBackups: backups.length,
      totalSize,
      oldestBackup: dates[0],
      newestBackup: dates[dates.length - 1],
      averageSize: totalSize / backups.length,
      compressionSavings: 0, // Would calculate from compression ratios
    };
  }

  /**
   * Setup automatic backup schedule
   */
  async setupBackupSchedule(schedule: BackupSchedule): Promise<void> {
    await AsyncStorageWrapper.setItem(`${STORAGE_KEYS.BACKUP_METADATA}_schedule`, schedule);
    
    if (schedule.enabled) {
      // Setup background task for automatic backups
      // This would integrate with React Native background tasks
      console.log('Backup schedule configured:', schedule);
    }
  }

  /**
   * Get backup schedule
   */
  async getBackupSchedule(): Promise<BackupSchedule | null> {
    return await AsyncStorageWrapper.getItem<BackupSchedule>(`${STORAGE_KEYS.BACKUP_METADATA}_schedule`);
  }

  /**
   * Validate backup integrity
   */
  async validateBackupIntegrity(backupData: BackupData): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: any[] = [];

    try {
      // Verify checksum
      const calculatedChecksum = await this.generateBackupChecksum(backupData);
      if (calculatedChecksum !== backupData.integrity.checksum) {
        errors.push({
          field: 'checksum',
          message: 'Backup checksum mismatch - data may be corrupted',
          code: 'CHECKSUM_MISMATCH',
        });
      }

      // Verify record counts
      const actualRecordCounts = this.calculateRecordCounts(backupData.data);
      for (const [key, expectedCount] of Object.entries(backupData.integrity.recordCounts)) {
        const actualCount = actualRecordCounts[key] || 0;
        if (actualCount !== expectedCount) {
          errors.push({
            field: key,
            message: `Record count mismatch for ${key}: expected ${expectedCount}, got ${actualCount}`,
            code: 'RECORD_COUNT_MISMATCH',
          });
        }
      }

      // Validate data structure
      for (const [key, data] of Object.entries(backupData.data)) {
        if (Array.isArray(data)) {
          for (const item of data) {
            if (!item.id || !item.createdAt) {
              errors.push({
                field: key,
                message: `Invalid data structure in ${key}: missing required fields`,
                code: 'INVALID_DATA_STRUCTURE',
              });
              break;
            }
          }
        }
      }

      // Check version compatibility
      if (backupData.version && backupData.version !== STORAGE_CONFIG.DATA_VERSION) {
        warnings.push({
          field: 'version',
          message: `Version mismatch: backup is ${backupData.version}, current is ${STORAGE_CONFIG.DATA_VERSION}`,
          code: 'VERSION_MISMATCH',
        });
      }

    } catch (error) {
      errors.push({
        field: 'validation',
        message: `Integrity check failed: ${error}`,
        code: 'VALIDATION_ERROR',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Private helper methods
   */
  private generateBackupId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `backup_${timestamp}_${random}`;
  }

  private getBackupKey(backupId: string): string {
    return `${STORAGE_KEYS.BACKUP_METADATA}_data_${backupId}`;
  }

  private async collectBackupData(options: {
    includeMetadata: boolean;
    includeReceipts: boolean;
    includeCache: boolean;
  }): Promise<BackupData> {
    const data: BackupData['data'] = {};

    // Core data keys
    const coreKeys = [
      STORAGE_KEYS.TRANSACTIONS,
      STORAGE_KEYS.CATEGORIES,
      STORAGE_KEYS.ACCOUNTS,
      STORAGE_KEYS.BUDGETS,
      STORAGE_KEYS.USER_PROFILE,
      STORAGE_KEYS.APP_SETTINGS,
    ];

    if (options.includeReceipts) {
      coreKeys.push(STORAGE_KEYS.RECEIPTS, STORAGE_KEYS.INVESTMENTS);
    }

    // Load data
    for (const key of coreKeys) {
      try {
        const keyData = await AsyncStorageWrapper.getItem(key);
        if (keyData) {
          data[key as keyof BackupData['data']] = keyData;
        }
      } catch (error) {
        console.warn(`Failed to load ${key} for backup:`, error);
      }
    }

    return {
      metadata: {
        version: STORAGE_CONFIG.DATA_VERSION,
        createdAt: new Date(),
        updatedAt: new Date(),
        recordCount: 0, // Will be calculated
        dataSize: 0, // Will be calculated
      },
      version: STORAGE_CONFIG.DATA_VERSION,
      createdAt: new Date(),
      data,
      integrity: {
        checksum: '', // Will be calculated
        recordCounts: {}, // Will be calculated
      },
    };
  }

  private calculateRecordCounts(data: BackupData['data']): Record<string, number> {
    const counts: Record<string, number> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        counts[key] = value.length;
      } else if (value) {
        counts[key] = 1;
      } else {
        counts[key] = 0;
      }
    }
    
    return counts;
  }

  private async generateBackupChecksum(backupData: BackupData): Promise<string> {
    // Create a stable string representation for checksumming
    const dataForChecksum = {
      version: backupData.version,
      data: backupData.data,
    };
    
    const dataString = JSON.stringify(dataForChecksum, Object.keys(dataForChecksum).sort());
    
    // Generate checksum using FNV-1a hash
    let hash = 2166136261;
    for (let i = 0; i < dataString.length; i++) {
      hash ^= dataString.charCodeAt(i);
      hash *= 16777619;
    }
    return (hash >>> 0).toString(16);
  }

  private async encryptBackupData(data: string): Promise<string> {
    // Simple encryption - in production, use proper crypto library
    const encoded = Buffer.from(data, 'utf8').toString('base64');
    return `encrypted_backup_${encoded}`;
  }

  private async decryptBackupData(encryptedData: string): Promise<string> {
    if (!encryptedData.startsWith('encrypted_backup_')) {
      throw new Error('Invalid encrypted backup format');
    }
    const encoded = encryptedData.replace('encrypted_backup_', '');
    return Buffer.from(encoded, 'base64').toString('utf8');
  }

  private async loadBackupData(backupId: string, isEncrypted: boolean): Promise<BackupData> {
    const backupKey = this.getBackupKey(backupId);
    let data = await AsyncStorageWrapper.getItem<string>(backupKey);
    
    if (!data) {
      throw new Error(`Backup data not found: ${backupId}`);
    }

    // Decrypt if needed
    if (isEncrypted) {
      data = await this.decryptBackupData(data);
    }

    // Decompress if needed
    try {
      data = await StorageService.decompressData(data);
    } catch {
      // Data might not be compressed
    }

    return JSON.parse(data);
  }

  private async storeBackupInfo(backupInfo: BackupInfo): Promise<void> {
    const backups = await this.listBackups();
    backups.push(backupInfo);
    
    // Sort by creation date, newest first
    backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    await AsyncStorageWrapper.setItem(`${STORAGE_KEYS.BACKUP_METADATA}_list`, backups);
  }

  private async updateBackupMetadata(): Promise<void> {
    const backups = await this.listBackups();
    const metadata = {
      totalBackups: backups.length,
      totalSize: backups.reduce((sum, b) => sum + b.size, 0),
      lastBackup: backups.length > 0 ? backups[0].createdAt : undefined,
      lastCleanup: new Date(),
    };
    
    await AsyncStorageWrapper.setItem(STORAGE_KEYS.BACKUP_METADATA, metadata);
  }

  private async cleanupOldBackups(): Promise<void> {
    const schedule = await this.getBackupSchedule();
    const maxBackups = schedule?.maxBackups || STORAGE_CONFIG.MAX_BACKUP_FILES;
    
    if (!schedule?.autoCleanup) {
      return;
    }

    const backups = await this.listBackups();
    
    if (backups.length > maxBackups) {
      // Sort by creation date and keep only the newest ones
      backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const backupsToDelete = backups.slice(maxBackups);
      
      for (const backup of backupsToDelete) {
        await this.deleteBackup(backup.id);
      }
    }

    // Also clean up backups older than retention period
    const retentionDays = STORAGE_CONFIG.BACKUP_RETENTION_DAYS;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const expiredBackups = backups.filter(b => b.createdAt < cutoffDate);
    for (const backup of expiredBackups) {
      await this.deleteBackup(backup.id);
    }
  }

  private getRestoreKeys(
    selectiveRestore?: RestoreOptions['selectiveRestore'],
    includeReceipts: boolean = true
  ): string[] {
    if (!selectiveRestore) {
      // Restore all core data
      const keys = [
        STORAGE_KEYS.TRANSACTIONS,
        STORAGE_KEYS.CATEGORIES,
        STORAGE_KEYS.ACCOUNTS,
        STORAGE_KEYS.BUDGETS,
        STORAGE_KEYS.USER_PROFILE,
        STORAGE_KEYS.APP_SETTINGS,
      ];
      
      if (includeReceipts) {
        keys.push(STORAGE_KEYS.RECEIPTS, STORAGE_KEYS.INVESTMENTS);
      }
      
      return keys;
    }

    const keys: string[] = [];
    
    if (selectiveRestore.transactions) keys.push(STORAGE_KEYS.TRANSACTIONS);
    if (selectiveRestore.categories) keys.push(STORAGE_KEYS.CATEGORIES);
    if (selectiveRestore.accounts) keys.push(STORAGE_KEYS.ACCOUNTS);
    if (selectiveRestore.budgets) keys.push(STORAGE_KEYS.BUDGETS);
    if (selectiveRestore.receipts && includeReceipts) keys.push(STORAGE_KEYS.RECEIPTS);
    if (selectiveRestore.investments) keys.push(STORAGE_KEYS.INVESTMENTS);
    
    return keys;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default DataBackup;