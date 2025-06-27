/**
 * Storage Keys and Constants for FinSync Financial App
 * Centralized storage key management with type safety
 */

export const STORAGE_KEYS = {
  // Core data entities
  TRANSACTIONS: 'finsync_transactions',
  CATEGORIES: 'finsync_categories',
  ACCOUNTS: 'finsync_accounts',
  RECEIPTS: 'finsync_receipts',
  INVESTMENTS: 'finsync_investments',
  BUDGETS: 'finsync_budgets',
  REMINDERS: 'finsync_reminders',
  
  // User data
  USER_PROFILE: 'finsync_user_profile',
  APP_SETTINGS: 'finsync_app_settings',
  
  // Aggregated data
  SPENDING_ANALYTICS: 'finsync_spending_analytics',
  CATEGORY_TOTALS: 'finsync_category_totals',
  MONTHLY_SUMMARIES: 'finsync_monthly_summaries',
  INVESTMENT_PERFORMANCE: 'finsync_investment_performance',
  
  // System data
  DATA_VERSION: 'finsync_data_version',
  LAST_SYNC: 'finsync_last_sync',
  BACKUP_METADATA: 'finsync_backup_metadata',
  MIGRATION_STATUS: 'finsync_migration_status',
  
  // Cache data
  RECEIPT_CACHE: 'finsync_receipt_cache',
  CATEGORY_CACHE: 'finsync_category_cache',
  QUICK_STATS: 'finsync_quick_stats',
  
  // Temporary data
  DRAFT_TRANSACTION: 'finsync_draft_transaction',
  TEMP_RECEIPT: 'finsync_temp_receipt',
  ONBOARDING_STATE: 'finsync_onboarding_state',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

/**
 * Storage configuration constants
 */
export const STORAGE_CONFIG = {
  DATA_VERSION: '1.0.0',
  MAX_BACKUP_FILES: 5,
  BACKUP_RETENTION_DAYS: 30,
  CACHE_EXPIRY_HOURS: 24,
  QUICK_STATS_REFRESH_MINUTES: 15,
  MAX_TRANSACTION_BATCH_SIZE: 100,
  MAX_RECEIPT_SIZE_MB: 10,
} as const;

/**
 * Storage prefixes for different data types
 */
export const STORAGE_PREFIXES = {
  CORE_DATA: 'finsync_',
  USER_DATA: 'finsync_user_',
  CACHE_DATA: 'finsync_cache_',
  TEMP_DATA: 'finsync_temp_',
  BACKUP_DATA: 'finsync_backup_',
  MIGRATION_DATA: 'finsync_migration_',
} as const;

/**
 * Default storage options for different data types
 */
export const DEFAULT_STORAGE_OPTIONS = {
  CORE_DATA: {
    encrypt: true,
    compress: false,
  },
  USER_DATA: {
    encrypt: true,
    compress: false,
  },
  CACHE_DATA: {
    encrypt: false,
    compress: true,
    expiry: 24 * 60 * 60 * 1000, // 24 hours
  },
  TEMP_DATA: {
    encrypt: false,
    compress: false,
    expiry: 60 * 60 * 1000, // 1 hour
  },
  BACKUP_DATA: {
    encrypt: true,
    compress: true,
  },
} as const;

/**
 * Storage validation rules
 */
export const STORAGE_VALIDATION = {
  MAX_KEY_LENGTH: 250,
  MAX_VALUE_SIZE_MB: 50,
  REQUIRED_FIELDS: {
    TRANSACTION: ['id', 'amount', 'date', 'category', 'type'],
    CATEGORY: ['id', 'name', 'type'],
    ACCOUNT: ['id', 'name', 'type', 'currency'],
    RECEIPT: ['id', 'imageUri'],
    INVESTMENT: ['id', 'symbol', 'shares', 'purchasePrice'],
  },
} as const;

/**
 * Error codes for storage operations
 */
export const STORAGE_ERROR_CODES = {
  INVALID_KEY: 'INVALID_KEY',
  INVALID_DATA: 'INVALID_DATA',
  STORAGE_FULL: 'STORAGE_FULL',
  ENCRYPTION_FAILED: 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED: 'DECRYPTION_FAILED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  MIGRATION_FAILED: 'MIGRATION_FAILED',
  BACKUP_FAILED: 'BACKUP_FAILED',
  RESTORE_FAILED: 'RESTORE_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SYNC_CONFLICT: 'SYNC_CONFLICT',
} as const;

/**
 * Storage event types for observers
 */
export const STORAGE_EVENTS = {
  DATA_CHANGED: 'storage:data_changed',
  BACKUP_CREATED: 'storage:backup_created',
  RESTORE_COMPLETED: 'storage:restore_completed',
  MIGRATION_STARTED: 'storage:migration_started',
  MIGRATION_COMPLETED: 'storage:migration_completed',
  SYNC_STARTED: 'storage:sync_started',
  SYNC_COMPLETED: 'storage:sync_completed',
  ERROR_OCCURRED: 'storage:error_occurred',
} as const;

/**
 * Utility functions for storage key management
 */
export class StorageKeyUtils {
  /**
   * Generate a timestamped key for backups
   */
  static generateBackupKey(baseKey: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${STORAGE_PREFIXES.BACKUP_DATA}${baseKey}_${timestamp}`;
  }

  /**
   * Generate a cache key with expiry
   */
  static generateCacheKey(entityType: string, entityId: string): string {
    return `${STORAGE_PREFIXES.CACHE_DATA}${entityType}_${entityId}`;
  }

  /**
   * Generate a temporary key
   */
  static generateTempKey(operation: string): string {
    const timestamp = Date.now();
    return `${STORAGE_PREFIXES.TEMP_DATA}${operation}_${timestamp}`;
  }

  /**
   * Validate storage key format
   */
  static validateKey(key: string): boolean {
    return (
      key.length <= STORAGE_VALIDATION.MAX_KEY_LENGTH &&
      key.startsWith(STORAGE_PREFIXES.CORE_DATA) &&
      /^[a-zA-Z0-9_-]+$/.test(key)
    );
  }

  /**
   * Extract entity type from storage key
   */
  static extractEntityType(key: string): string | null {
    const parts = key.split('_');
    return parts.length >= 2 ? parts[1] : null;
  }

  /**
   * Check if key is a core data key
   */
  static isCoreDataKey(key: string): boolean {
    return key.startsWith(STORAGE_PREFIXES.CORE_DATA);
  }

  /**
   * Check if key is a cache key
   */
  static isCacheKey(key: string): boolean {
    return key.startsWith(STORAGE_PREFIXES.CACHE_DATA);
  }

  /**
   * Check if key is a temporary key
   */
  static isTempKey(key: string): boolean {
    return key.startsWith(STORAGE_PREFIXES.TEMP_DATA);
  }

  /**
   * Get all keys for a specific entity type
   */
  static getKeysForEntityType(entityType: string): string[] {
    const keys = Object.values(STORAGE_KEYS).filter((key) => 
      key.includes(entityType.toLowerCase())
    );
    return keys;
  }

  /**
   * Generate a unique key for new entities
   */
  static generateUniqueKey(entityType: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${STORAGE_PREFIXES.CORE_DATA}${entityType}_${timestamp}_${random}`;
  }
}

export default STORAGE_KEYS;