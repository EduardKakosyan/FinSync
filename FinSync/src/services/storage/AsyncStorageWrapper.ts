/**
 * AsyncStorage Wrapper for FinSync Financial App
 * Provides secure, encrypted storage with error handling and data validation
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StorageOptions {
  encrypt?: boolean;
  compress?: boolean;
  expiry?: number; // milliseconds
}

export interface StorageItem<T = any> {
  data: T;
  timestamp: number;
  version: string;
  checksum?: string;
  expiry?: number;
}

export class StorageError extends Error {
  constructor(
    message: string,
    public code: string,
    public key?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Secure AsyncStorage wrapper with encryption, compression, and validation
 */
export class AsyncStorageWrapper {
  private static readonly VERSION = '1.0.0';
  private static readonly DEFAULT_OPTIONS: StorageOptions = {
    encrypt: true,
    compress: false,
  };

  /**
   * Store data with optional encryption and compression
   */
  static async setItem<T>(
    key: string,
    value: T,
    options: StorageOptions = {}
  ): Promise<void> {
    try {
      const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
      const storageItem: StorageItem<T> = {
        data: value,
        timestamp: Date.now(),
        version: this.VERSION,
        expiry: mergedOptions.expiry
          ? Date.now() + mergedOptions.expiry
          : undefined,
      };

      let serializedData = JSON.stringify(storageItem);

      // Add checksum for data integrity
      storageItem.checksum = await this.generateChecksum(serializedData);
      serializedData = JSON.stringify(storageItem);

      // Simple encryption (in production, use proper encryption library)
      if (mergedOptions.encrypt) {
        serializedData = this.simpleEncrypt(serializedData);
      }

      await AsyncStorage.setItem(key, serializedData);
    } catch (error) {
      throw new StorageError(
        `Failed to store data for key: ${key}`,
        'STORAGE_SET_ERROR',
        key,
        error as Error
      );
    }
  }

  /**
   * Retrieve data with automatic decryption and validation
   */
  static async getItem<T>(key: string): Promise<T | null> {
    try {
      const rawData = await AsyncStorage.getItem(key);
      if (!rawData) {
        return null;
      }

      let serializedData = rawData;

      // Decrypt if needed
      try {
        serializedData = this.simpleDecrypt(serializedData);
      } catch {
        // If decryption fails, assume data is not encrypted
        serializedData = rawData;
      }

      const storageItem: StorageItem<T> = JSON.parse(serializedData);

      // Check expiry
      if (storageItem.expiry && Date.now() > storageItem.expiry) {
        await this.removeItem(key);
        return null;
      }

      // Validate checksum if present
      if (storageItem.checksum) {
        const dataForChecksum = JSON.stringify({
          ...storageItem,
          checksum: undefined,
        });
        const expectedChecksum = await this.generateChecksum(dataForChecksum);
        if (storageItem.checksum !== expectedChecksum) {
          throw new StorageError(
            'Data integrity check failed',
            'CHECKSUM_MISMATCH',
            key
          );
        }
      }

      return storageItem.data;
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError(
        `Failed to retrieve data for key: ${key}`,
        'STORAGE_GET_ERROR',
        key,
        error as Error
      );
    }
  }

  /**
   * Remove item from storage
   */
  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      throw new StorageError(
        `Failed to remove data for key: ${key}`,
        'STORAGE_REMOVE_ERROR',
        key,
        error as Error
      );
    }
  }

  /**
   * Clear all storage (use with caution)
   */
  static async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      throw new StorageError(
        'Failed to clear storage',
        'STORAGE_CLEAR_ERROR',
        undefined,
        error as Error
      );
    }
  }

  /**
   * Get all keys from storage
   */
  static async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      throw new StorageError(
        'Failed to get all keys',
        'STORAGE_KEYS_ERROR',
        undefined,
        error as Error
      );
    }
  }

  /**
   * Get multiple items at once
   */
  static async multiGet<T>(keys: string[]): Promise<Record<string, T | null>> {
    try {
      const results: Record<string, T | null> = {};
      
      // Use Promise.all for concurrent operations
      const promises = keys.map(async (key) => {
        try {
          const value = await this.getItem<T>(key);
          return { key, value };
        } catch (error) {
          console.warn(`Failed to get item for key ${key}:`, error);
          return { key, value: null };
        }
      });

      const resolved = await Promise.all(promises);
      resolved.forEach(({ key, value }) => {
        results[key] = value;
      });

      return results;
    } catch (error) {
      throw new StorageError(
        'Failed to get multiple items',
        'STORAGE_MULTI_GET_ERROR',
        undefined,
        error as Error
      );
    }
  }

  /**
   * Set multiple items at once
   */
  static async multiSet<T>(
    items: Record<string, T>,
    options: StorageOptions = {}
  ): Promise<void> {
    try {
      const promises = Object.entries(items).map(([key, value]) =>
        this.setItem(key, value, options)
      );
      await Promise.all(promises);
    } catch (error) {
      throw new StorageError(
        'Failed to set multiple items',
        'STORAGE_MULTI_SET_ERROR',
        undefined,
        error as Error
      );
    }
  }

  /**
   * Get storage usage statistics
   */
  static async getStorageStats(): Promise<{
    totalKeys: number;
    estimatedSize: number;
    oldestItem?: { key: string; timestamp: number };
    newestItem?: { key: string; timestamp: number };
  }> {
    try {
      const keys = await this.getAllKeys();
      const appKeys = keys.filter((key) => key.startsWith('finsync_'));
      
      let estimatedSize = 0;
      let oldestItem: { key: string; timestamp: number } | undefined;
      let newestItem: { key: string; timestamp: number } | undefined;

      for (const key of appKeys) {
        try {
          const rawData = await AsyncStorage.getItem(key);
          if (rawData) {
            estimatedSize += rawData.length;
            
            // Try to get timestamp for sorting
            try {
              const decrypted = this.simpleDecrypt(rawData);
              const item: StorageItem = JSON.parse(decrypted);
              
              if (!oldestItem || item.timestamp < oldestItem.timestamp) {
                oldestItem = { key, timestamp: item.timestamp };
              }
              if (!newestItem || item.timestamp > newestItem.timestamp) {
                newestItem = { key, timestamp: item.timestamp };
              }
            } catch {
              // Skip if can't parse timestamp
            }
          }
        } catch {
          // Skip problematic keys
        }
      }

      return {
        totalKeys: appKeys.length,
        estimatedSize,
        oldestItem,
        newestItem,
      };
    } catch (error) {
      throw new StorageError(
        'Failed to get storage statistics',
        'STORAGE_STATS_ERROR',
        undefined,
        error as Error
      );
    }
  }

  /**
   * Simple encryption/decryption (use proper crypto library in production)
   */
  private static simpleEncrypt(text: string): string {
    // Simple Base64 encoding for demo - use proper encryption in production
    const encoded = Buffer.from(text, 'utf8').toString('base64');
    return `encrypted_${encoded}`;
  }

  private static simpleDecrypt(text: string): string {
    if (!text.startsWith('encrypted_')) {
      throw new Error('Not encrypted data');
    }
    const encoded = text.replace('encrypted_', '');
    return Buffer.from(encoded, 'base64').toString('utf8');
  }

  /**
   * Generate checksum for data integrity
   */
  private static async generateChecksum(data: string): Promise<string> {
    // Simple checksum - use proper hashing in production
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
}

export default AsyncStorageWrapper;