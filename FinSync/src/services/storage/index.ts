/**
 * FinSync Storage Services - Comprehensive Data Persistence Layer
 * 
 * This module exports all storage services for the FinSync financial app:
 * - Enhanced storage with encryption, compression, and integrity checks
 * - Specialized services for transactions, categories, receipts, etc.
 * - Data migration and backup/restore capabilities
 */

// Core Storage Services
export { default as StorageService } from './StorageService';
export { default as AsyncStorageWrapper, StorageError } from './AsyncStorageWrapper';
export { default as BaseDataService } from './BaseDataService';

// Specialized Storage Services
export { default as TransactionStorage } from './TransactionStorage';
export { default as CategoryStorage } from './CategoryStorage';
export { default as ReceiptStorage } from './ReceiptStorage';

// System Services
export { default as DataMigration } from './DataMigration';
export { default as DataBackup } from './DataBackup';

// Storage Configuration
export * from './StorageKeys';

// Legacy imports for compatibility
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Receipt, ReceiptItem } from '../../types';
import { STORAGE_KEYS } from './StorageKeys';

// Legacy constant for backwards compatibility
const MAX_RECEIPT_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export interface ReceiptStorageData {
  receipts: Receipt[];
  lastModified: number;
}

export interface StorageResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ReceiptStorageService {
  private static instance: ReceiptStorageService;
  private receiptDirectory: string;

  private constructor() {
    this.receiptDirectory = `${FileSystem.documentDirectory}receipts/`;
    this.initializeStorage();
  }

  public static getInstance(): ReceiptStorageService {
    if (!ReceiptStorageService.instance) {
      ReceiptStorageService.instance = new ReceiptStorageService();
    }
    return ReceiptStorageService.instance;
  }

  /**
   * Initialize storage directories
   */
  private async initializeStorage(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.receiptDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.receiptDirectory, {
          intermediates: true,
        });
      }
    } catch (error) {
      console.error('Error initializing receipt storage:', error);
    }
  }

  /**
   * Generate unique filename for receipt image
   */
  private generateFileName(originalUri: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = originalUri.split('.').pop() || 'jpg';
    return `receipt_${timestamp}_${random}.${extension}`;
  }

  /**
   * Get file size of image
   */
  private async getImageSize(uri: string): Promise<number> {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      return info.size || 0;
    } catch (error) {
      console.error('Error getting image size:', error);
      return 0;
    }
  }

  /**
   * Validate image before storage
   */
  private async validateImage(uri: string): Promise<StorageResult<boolean>> {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      
      if (!info.exists) {
        return { success: false, error: 'Image file does not exist' };
      }

      const size = info.size || 0;
      if (size > MAX_RECEIPT_IMAGE_SIZE) {
        return { 
          success: false, 
          error: `Image size (${(size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${MAX_RECEIPT_IMAGE_SIZE / 1024 / 1024}MB)` 
        };
      }

      return { success: true, data: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Save receipt image to local storage
   */
  async saveReceiptImage(imageUri: string): Promise<StorageResult<string>> {
    try {
      // Validate image first
      const validation = await this.validateImage(imageUri);
      if (!validation.success) {
        return validation;
      }

      // Ensure storage directory exists
      await this.initializeStorage();

      // Generate unique filename
      const fileName = this.generateFileName(imageUri);
      const destinationUri = `${this.receiptDirectory}${fileName}`;

      // Copy image to receipt directory
      await FileSystem.copyAsync({
        from: imageUri,
        to: destinationUri,
      });

      return { success: true, data: destinationUri };
    } catch (error) {
      console.error('Error saving receipt image:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save receipt image' 
      };
    }
  }

  /**
   * Delete receipt image from storage
   */
  async deleteReceiptImage(imageUri: string): Promise<StorageResult<boolean>> {
    try {
      const info = await FileSystem.getInfoAsync(imageUri);
      if (info.exists) {
        await FileSystem.deleteAsync(imageUri);
      }
      return { success: true, data: true };
    } catch (error) {
      console.error('Error deleting receipt image:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete receipt image' 
      };
    }
  }

  /**
   * Get all receipts from storage
   */
  async getAllReceipts(): Promise<StorageResult<Receipt[]>> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.RECEIPTS);
      if (!data) {
        return { success: true, data: [] };
      }

      const receiptData: ReceiptStorageData = JSON.parse(data);
      
      // Convert date strings back to Date objects
      const receipts = receiptData.receipts.map(receipt => ({
        ...receipt,
        createdAt: new Date(receipt.createdAt),
        date: receipt.date ? new Date(receipt.date) : undefined,
      }));

      return { success: true, data: receipts };
    } catch (error) {
      console.error('Error getting receipts from storage:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to load receipts' 
      };
    }
  }

  /**
   * Get single receipt by ID
   */
  async getReceiptById(receiptId: string): Promise<StorageResult<Receipt | null>> {
    try {
      const result = await this.getAllReceipts();
      if (!result.success) {
        return result;
      }

      const receipts = result.data || [];
      const receipt = receipts.find(r => r.id === receiptId);

      return { success: true, data: receipt || null };
    } catch (error) {
      console.error('Error getting receipt by ID:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to find receipt' 
      };
    }
  }

  /**
   * Save receipt metadata to storage
   */
  async saveReceipt(receipt: Receipt): Promise<StorageResult<Receipt>> {
    try {
      const result = await this.getAllReceipts();
      let receipts = result.success ? (result.data || []) : [];

      // Check if receipt already exists (update) or is new (add)
      const existingIndex = receipts.findIndex(r => r.id === receipt.id);
      
      if (existingIndex >= 0) {
        receipts[existingIndex] = receipt;
      } else {
        receipts.push(receipt);
      }

      // Sort receipts by creation date (newest first)
      receipts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const storageData: ReceiptStorageData = {
        receipts,
        lastModified: Date.now(),
      };

      await AsyncStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(storageData));

      return { success: true, data: receipt };
    } catch (error) {
      console.error('Error saving receipt:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save receipt' 
      };
    }
  }

  /**
   * Delete receipt and its associated image
   */
  async deleteReceipt(receiptId: string): Promise<StorageResult<boolean>> {
    try {
      const result = await this.getAllReceipts();
      if (!result.success) {
        return result;
      }

      const receipts = result.data || [];
      const receiptIndex = receipts.findIndex(r => r.id === receiptId);
      
      if (receiptIndex === -1) {
        return { success: false, error: 'Receipt not found' };
      }

      const receipt = receipts[receiptIndex];

      // Delete the image file
      const imageDeleteResult = await this.deleteReceiptImage(receipt.imageUri);
      if (!imageDeleteResult.success) {
        console.warn('Failed to delete receipt image:', imageDeleteResult.error);
        // Continue with receipt deletion even if image deletion fails
      }

      // Remove receipt from array
      receipts.splice(receiptIndex, 1);

      const storageData: ReceiptStorageData = {
        receipts,
        lastModified: Date.now(),
      };

      await AsyncStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(storageData));

      return { success: true, data: true };
    } catch (error) {
      console.error('Error deleting receipt:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete receipt' 
      };
    }
  }

  /**
   * Search receipts by merchant name or OCR text
   */
  async searchReceipts(query: string): Promise<StorageResult<Receipt[]>> {
    try {
      const result = await this.getAllReceipts();
      if (!result.success) {
        return result;
      }

      const receipts = result.data || [];
      const searchTerm = query.toLowerCase().trim();

      if (!searchTerm) {
        return { success: true, data: receipts };
      }

      const filteredReceipts = receipts.filter(receipt => {
        return (
          receipt.merchantName?.toLowerCase().includes(searchTerm) ||
          receipt.ocrText?.toLowerCase().includes(searchTerm) ||
          receipt.items?.some(item => 
            item.name.toLowerCase().includes(searchTerm)
          )
        );
      });

      return { success: true, data: filteredReceipts };
    } catch (error) {
      console.error('Error searching receipts:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to search receipts' 
      };
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageResult<{
    totalReceipts: number;
    totalImageSize: number;
    oldestReceipt?: Date;
    newestReceipt?: Date;
  }>> {
    try {
      const result = await this.getAllReceipts();
      if (!result.success) {
        return result;
      }

      const receipts = result.data || [];
      let totalImageSize = 0;

      // Calculate total image size
      for (const receipt of receipts) {
        const size = await this.getImageSize(receipt.imageUri);
        totalImageSize += size;
      }

      const dates = receipts.map(r => new Date(r.createdAt));
      const oldestReceipt = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : undefined;
      const newestReceipt = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : undefined;

      return {
        success: true,
        data: {
          totalReceipts: receipts.length,
          totalImageSize,
          oldestReceipt,
          newestReceipt,
        },
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get storage statistics' 
      };
    }
  }

  /**
   * Clear all receipt data (for testing or reset)
   */
  async clearAllReceipts(): Promise<StorageResult<boolean>> {
    try {
      // Get all receipts first to delete their images
      const result = await this.getAllReceipts();
      if (result.success && result.data) {
        for (const receipt of result.data) {
          await this.deleteReceiptImage(receipt.imageUri);
        }
      }

      // Clear storage
      await AsyncStorage.removeItem(STORAGE_KEYS.RECEIPTS);

      return { success: true, data: true };
    } catch (error) {
      console.error('Error clearing receipts:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to clear receipts' 
      };
    }
  }
}

// Export singleton instance for backwards compatibility
export const receiptStorageService = ReceiptStorageService.getInstance();

/**
 * Enhanced Storage Service Instances
 * Singleton instances of the new storage services for easy access
 */

// Enhanced Storage Service Instances
export const transactionStorage = TransactionStorage.getInstance();
export const categoryStorage = CategoryStorage.getInstance();
export const enhancedReceiptStorage = ReceiptStorage.getInstance();
export const dataMigration = DataMigration.getInstance();
export const dataBackup = DataBackup.getInstance();

/**
 * Storage Initialization Function
 * Initialize all storage services with default categories and migration checks
 */
export async function initializeStorage(): Promise<{
  success: boolean;
  migrations: string[];
  errors: string[];
}> {
  const errors: string[] = [];
  let migrations: string[] = [];

  try {
    // Check for pending migrations
    const migrationCheck = await dataMigration.checkMigrationNeeded();
    
    if (migrationCheck.needed) {
      console.log('Performing data migrations...', migrationCheck.pendingMigrations);
      migrations = migrationCheck.pendingMigrations;
      
      const migrationResult = await dataMigration.migrate({
        createBackup: true,
        dryRun: false,
      });
      
      if (!migrationResult.success) {
        errors.push(`Migration failed: ${migrationResult.errors.join(', ')}`);
      }
    }

    // Initialize categories with defaults
    try {
      await categoryStorage.initializeWithDefaults();
    } catch (error) {
      errors.push(`Category initialization failed: ${error}`);
    }

    // Validate storage integrity
    try {
      const integrityReport = await StorageService.checkDataIntegrity();
      if (integrityReport.corruptedRecords > 0) {
        console.warn('Data integrity issues found:', integrityReport);
        // Attempt auto-repair
        const repairResult = await StorageService.repairData(integrityReport);
        if (repairResult.failed > 0) {
          errors.push(`Data repair partially failed: ${repairResult.failed} issues remain`);
        }
      }
    } catch (error) {
      errors.push(`Integrity check failed: ${error}`);
    }

    return {
      success: errors.length === 0,
      migrations,
      errors,
    };

  } catch (error) {
    errors.push(`Storage initialization failed: ${error}`);
    return {
      success: false,
      migrations,
      errors,
    };
  }
}

/**
 * Storage Statistics Function
 * Get comprehensive statistics about all storage services
 */
export async function getStorageStatistics(): Promise<{
  transactions: { count: number; size: number };
  categories: { count: number; hierarchies: number };
  receipts: { count: number; size: number };
  backups: { count: number; size: number };
  migrations: number;
  integrity: number;
  totalSize: number;
}> {
  try {
    const [
      transactionStats,
      categoryStats,
      receiptStats,
      backupStats,
      storageStats,
      migrationHistory,
    ] = await Promise.all([
      transactionStorage.getStats(),
      categoryStorage.getStats(),
      enhancedReceiptStorage.getReceiptAnalytics(),
      dataBackup.getBackupStats(),
      StorageService.getStorageStats(),
      dataMigration.getMigrationHistory(),
    ]);

    return {
      transactions: {
        count: transactionStats.count,
        size: transactionStats.size,
      },
      categories: {
        count: categoryStats.totalCategories,
        hierarchies: categoryStats.categoriesWithChildren,
      },
      receipts: {
        count: receiptStats.totalReceipts,
        size: receiptStats.storageUsed,
      },
      backups: {
        count: backupStats.totalBackups,
        size: backupStats.totalSize,
      },
      migrations: migrationHistory.length,
      integrity: storageStats.dataIntegrity,
      totalSize: storageStats.totalSize,
    };

  } catch (error) {
    console.error('Failed to get storage statistics:', error);
    return {
      transactions: { count: 0, size: 0 },
      categories: { count: 0, hierarchies: 0 },
      receipts: { count: 0, size: 0 },
      backups: { count: 0, size: 0 },
      migrations: 0,
      integrity: 0,
      totalSize: 0,
    };
  }
}

/**
 * Storage Cleanup Function
 * Perform comprehensive cleanup of storage data
 */
export async function cleanupStorage(options: {
  purgeExpired?: boolean;
  purgeCache?: boolean;
  purgeTemp?: boolean;
  compactData?: boolean;
  cleanupOrphanedFiles?: boolean;
} = {}): Promise<{
  success: boolean;
  keysRemoved: number;
  spaceSaved: number;
  errors: string[];
}> {
  try {
    const results = await Promise.allSettled([
      StorageService.cleanupStorage(options),
      options.cleanupOrphanedFiles ? enhancedReceiptStorage.cleanupOrphanedFiles() : Promise.resolve({ filesRemoved: 0, spaceFreed: 0, errors: [] }),
    ]);

    let totalKeysRemoved = 0;
    let totalSpaceSaved = 0;
    const allErrors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const data = result.value;
        totalKeysRemoved += data.keysRemoved || data.filesRemoved || 0;
        totalSpaceSaved += data.spaceSaved || data.spaceFreed || 0;
        allErrors.push(...(data.errors || []));
      } else {
        allErrors.push(`Cleanup operation ${index} failed: ${result.reason}`);
      }
    });

    return {
      success: allErrors.length === 0,
      keysRemoved: totalKeysRemoved,
      spaceSaved: totalSpaceSaved,
      errors: allErrors,
    };

  } catch (error) {
    return {
      success: false,
      keysRemoved: 0,
      spaceSaved: 0,
      errors: [`Storage cleanup failed: ${error}`],
    };
  }
}