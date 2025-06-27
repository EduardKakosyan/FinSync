/**
 * Data Migration Service for FinSync Financial App
 * Handles schema migrations, version management, automated upgrades,
 * and data transformation between different app versions
 */

import AsyncStorageWrapper, { StorageError } from './AsyncStorageWrapper';
import StorageService from './StorageService';
import { STORAGE_KEYS, STORAGE_CONFIG } from './StorageKeys';
import {
  MigrationInfo,
  MigrationStep,
  StorageMetadata,
  Transaction,
  Category,
  Receipt,
  Account,
  Investment,
  ValidationResult,
} from '../../types';

export interface MigrationScript {
  version: string;
  description: string;
  up: (data: any) => Promise<any>;
  down: (data: any) => Promise<any>;
  validate?: (data: any) => Promise<ValidationResult>;
  dependencies?: string[];
  breaking?: boolean;
}

export interface MigrationContext {
  fromVersion: string;
  toVersion: string;
  dataKeys: string[];
  backupCreated: boolean;
  dryRun: boolean;
}

export interface MigrationResult {
  success: boolean;
  fromVersion: string;
  toVersion: string;
  migratedKeys: string[];
  errors: string[];
  warnings: string[];
  timeElapsed: number;
  dataBackupId?: string;
}

export interface DataVersionInfo {
  version: string;
  installDate: Date;
  lastMigration?: Date;
  pendingMigrations: string[];
  compatibilityMode?: boolean;
}

/**
 * Data Migration Service
 */
export class DataMigration {
  private static instance: DataMigration | null = null;
  private migrationScripts: Map<string, MigrationScript> = new Map();
  private currentVersion: string = STORAGE_CONFIG.DATA_VERSION;

  private constructor() {
    this.initializeMigrationScripts();
  }

  /**
   * Singleton pattern for consistent instance
   */
  static getInstance(): DataMigration {
    if (!this.instance) {
      this.instance = new DataMigration();
    }
    return this.instance;
  }

  /**
   * Check if migration is needed
   */
  async checkMigrationNeeded(): Promise<{
    needed: boolean;
    currentVersion: string;
    targetVersion: string;
    pendingMigrations: string[];
  }> {
    const versionInfo = await this.getDataVersionInfo();
    const pendingMigrations = await this.getPendingMigrations(versionInfo.version);

    return {
      needed: pendingMigrations.length > 0,
      currentVersion: versionInfo.version,
      targetVersion: this.currentVersion,
      pendingMigrations,
    };
  }

  /**
   * Perform migration with safety checks
   */
  async migrate(options: {
    dryRun?: boolean;
    createBackup?: boolean;
    skipValidation?: boolean;
  } = {}): Promise<MigrationResult> {
    const startTime = Date.now();
    const { dryRun = false, createBackup = true, skipValidation = false } = options;

    try {
      // Get current version info
      const versionInfo = await this.getDataVersionInfo();
      const pendingMigrations = await this.getPendingMigrations(versionInfo.version);

      if (pendingMigrations.length === 0) {
        return {
          success: true,
          fromVersion: versionInfo.version,
          toVersion: this.currentVersion,
          migratedKeys: [],
          errors: [],
          warnings: [],
          timeElapsed: Date.now() - startTime,
        };
      }

      // Create backup if requested
      let dataBackupId: string | undefined;
      if (createBackup && !dryRun) {
        const backupService = await import('./DataBackup');
        const backup = backupService.DataBackup.getInstance();
        const backupResult = await backup.createBackup(`pre_migration_${Date.now()}`);
        dataBackupId = backupResult.id;
      }

      // Create migration info
      const migrationInfo: MigrationInfo = {
        fromVersion: versionInfo.version,
        toVersion: this.currentVersion,
        startedAt: new Date(),
        status: 'in_progress',
        steps: pendingMigrations.map(version => ({
          id: version,
          description: this.migrationScripts.get(version)?.description || `Migration to ${version}`,
          status: 'pending',
        })),
      };

      if (!dryRun) {
        await this.saveMigrationInfo(migrationInfo);
      }

      const migratedKeys: string[] = [];
      const errors: string[] = [];
      const warnings: string[] = [];

      // Execute migrations in order
      for (const version of pendingMigrations) {
        const script = this.migrationScripts.get(version);
        if (!script) {
          errors.push(`Migration script not found for version ${version}`);
          continue;
        }

        try {
          // Update step status
          const stepIndex = migrationInfo.steps.findIndex(s => s.id === version);
          if (stepIndex >= 0) {
            migrationInfo.steps[stepIndex].status = 'pending';
            migrationInfo.steps[stepIndex].startedAt = new Date();
            if (!dryRun) {
              await this.saveMigrationInfo(migrationInfo);
            }
          }

          // Get data to migrate
          const dataKeys = await this.getDataKeysForMigration(version);
          const migrationData = await this.loadMigrationData(dataKeys);

          // Validate before migration if required
          if (!skipValidation && script.validate) {
            const validation = await script.validate(migrationData);
            if (!validation.isValid) {
              errors.push(`Validation failed for ${version}: ${validation.errors.map(e => e.message).join(', ')}`);
              continue;
            }
          }

          // Execute migration
          const migratedData = await script.up(migrationData);

          if (!dryRun) {
            // Save migrated data
            await this.saveMigrationData(dataKeys, migratedData);
            migratedKeys.push(...dataKeys);
          }

          // Update step status
          if (stepIndex >= 0) {
            migrationInfo.steps[stepIndex].status = 'completed';
            migrationInfo.steps[stepIndex].completedAt = new Date();
            if (!dryRun) {
              await this.saveMigrationInfo(migrationInfo);
            }
          }

        } catch (error) {
          const errorMessage = `Migration failed for version ${version}: ${error}`;
          errors.push(errorMessage);

          // Update step status
          const stepIndex = migrationInfo.steps.findIndex(s => s.id === version);
          if (stepIndex >= 0) {
            migrationInfo.steps[stepIndex].status = 'failed';
            migrationInfo.steps[stepIndex].errorMessage = errorMessage;
            if (!dryRun) {
              await this.saveMigrationInfo(migrationInfo);
            }
          }
        }
      }

      // Update migration status
      const success = errors.length === 0;
      migrationInfo.status = success ? 'completed' : 'failed';
      migrationInfo.completedAt = new Date();
      if (errors.length > 0) {
        migrationInfo.errorMessage = errors.join('; ');
      }

      if (!dryRun) {
        await this.saveMigrationInfo(migrationInfo);

        // Update version info if successful
        if (success) {
          await this.updateDataVersionInfo({
            version: this.currentVersion,
            installDate: versionInfo.installDate,
            lastMigration: new Date(),
            pendingMigrations: [],
          });
        }
      }

      return {
        success,
        fromVersion: versionInfo.version,
        toVersion: this.currentVersion,
        migratedKeys,
        errors,
        warnings,
        timeElapsed: Date.now() - startTime,
        dataBackupId,
      };

    } catch (error) {
      return {
        success: false,
        fromVersion: 'unknown',
        toVersion: this.currentVersion,
        migratedKeys: [],
        errors: [`Migration failed: ${error}`],
        warnings: [],
        timeElapsed: Date.now() - startTime,
      };
    }
  }

  /**
   * Rollback migration to previous version
   */
  async rollback(targetVersion: string): Promise<MigrationResult> {
    const startTime = Date.now();

    try {
      const versionInfo = await this.getDataVersionInfo();
      const currentVersion = versionInfo.version;

      if (currentVersion === targetVersion) {
        return {
          success: true,
          fromVersion: currentVersion,
          toVersion: targetVersion,
          migratedKeys: [],
          errors: [],
          warnings: ['Already at target version'],
          timeElapsed: Date.now() - startTime,
        };
      }

      // Get migration scripts to rollback
      const scriptsToRollback = this.getScriptsToRollback(currentVersion, targetVersion);
      const migratedKeys: string[] = [];
      const errors: string[] = [];
      const warnings: string[] = [];

      // Execute rollbacks in reverse order
      for (const version of scriptsToRollback.reverse()) {
        const script = this.migrationScripts.get(version);
        if (!script) {
          errors.push(`Rollback script not found for version ${version}`);
          continue;
        }

        try {
          // Get data to rollback
          const dataKeys = await this.getDataKeysForMigration(version);
          const migrationData = await this.loadMigrationData(dataKeys);

          // Execute rollback
          const rolledBackData = await script.down(migrationData);

          // Save rolled back data
          await this.saveMigrationData(dataKeys, rolledBackData);
          migratedKeys.push(...dataKeys);

        } catch (error) {
          errors.push(`Rollback failed for version ${version}: ${error}`);
        }
      }

      const success = errors.length === 0;

      if (success) {
        // Update version info
        await this.updateDataVersionInfo({
          version: targetVersion,
          installDate: versionInfo.installDate,
          lastMigration: new Date(),
          pendingMigrations: [],
        });
      }

      return {
        success,
        fromVersion: currentVersion,
        toVersion: targetVersion,
        migratedKeys,
        errors,
        warnings,
        timeElapsed: Date.now() - startTime,
      };

    } catch (error) {
      return {
        success: false,
        fromVersion: 'unknown',
        toVersion: targetVersion,
        migratedKeys: [],
        errors: [`Rollback failed: ${error}`],
        warnings: [],
        timeElapsed: Date.now() - startTime,
      };
    }
  }

  /**
   * Get migration history
   */
  async getMigrationHistory(): Promise<MigrationInfo[]> {
    try {
      const history = await AsyncStorageWrapper.getItem<MigrationInfo[]>(`${STORAGE_KEYS.MIGRATION_STATUS}_history`);
      return history || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Validate data integrity after migration
   */
  async validateMigrationIntegrity(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check data integrity
      const integrityReport = await StorageService.checkDataIntegrity();
      
      if (integrityReport.corruptedRecords > 0) {
        errors.push(`Found ${integrityReport.corruptedRecords} corrupted records`);
      }

      if (integrityReport.missingReferences > 0) {
        warnings.push(`Found ${integrityReport.missingReferences} missing references`);
      }

      // Check version consistency
      const versionInfo = await this.getDataVersionInfo();
      if (versionInfo.version !== this.currentVersion) {
        warnings.push(`Version mismatch: stored ${versionInfo.version}, expected ${this.currentVersion}`);
      }

      // Validate each data store
      const coreDataKeys = [
        STORAGE_KEYS.TRANSACTIONS,
        STORAGE_KEYS.CATEGORIES,
        STORAGE_KEYS.ACCOUNTS,
        STORAGE_KEYS.RECEIPTS,
        STORAGE_KEYS.INVESTMENTS,
      ];

      for (const key of coreDataKeys) {
        try {
          const data = await AsyncStorageWrapper.getItem(key);
          if (data && Array.isArray(data)) {
            for (const item of data) {
              if (!item.id || !item.createdAt) {
                errors.push(`Invalid data structure in ${key}: missing required fields`);
                break;
              }
            }
          }
        } catch (error) {
          errors.push(`Failed to validate ${key}: ${error}`);
        }
      }

    } catch (error) {
      errors.push(`Validation failed: ${error}`);
    }

    return {
      isValid: errors.length === 0,
      errors: errors.map(message => ({
        field: 'migration',
        message,
        code: 'MIGRATION_VALIDATION_ERROR',
      })),
      warnings: warnings.map(message => ({
        field: 'migration',
        message,
        code: 'MIGRATION_VALIDATION_WARNING',
      })),
    };
  }

  /**
   * Private helper methods
   */
  private initializeMigrationScripts(): void {
    // Migration from 1.0.0 to 1.1.0
    this.migrationScripts.set('1.1.0', {
      version: '1.1.0',
      description: 'Add parent category support and budget limits',
      up: async (data: any) => {
        // Add parentCategoryId field to categories
        if (data[STORAGE_KEYS.CATEGORIES]) {
          data[STORAGE_KEYS.CATEGORIES] = data[STORAGE_KEYS.CATEGORIES].map((category: any) => ({
            ...category,
            parentCategoryId: category.parentCategoryId || null,
            budgetLimit: category.budgetLimit || null,
          }));
        }
        return data;
      },
      down: async (data: any) => {
        // Remove parentCategoryId and budgetLimit fields
        if (data[STORAGE_KEYS.CATEGORIES]) {
          data[STORAGE_KEYS.CATEGORIES] = data[STORAGE_KEYS.CATEGORIES].map((category: any) => {
            const { parentCategoryId, budgetLimit, ...rest } = category;
            return rest;
          });
        }
        return data;
      },
      validate: async (data: any) => {
        const errors: any[] = [];
        if (data[STORAGE_KEYS.CATEGORIES]) {
          for (const category of data[STORAGE_KEYS.CATEGORIES]) {
            if (!category.id || !category.name || !category.type) {
              errors.push({
                field: 'category',
                message: 'Missing required fields',
                code: 'MISSING_FIELDS',
              });
            }
          }
        }
        return { isValid: errors.length === 0, errors, warnings: [] };
      },
    });

    // Migration from 1.1.0 to 1.2.0
    this.migrationScripts.set('1.2.0', {
      version: '1.2.0',
      description: 'Add receipt OCR confidence and metadata',
      up: async (data: any) => {
        // Add extractionConfidence field to receipts
        if (data[STORAGE_KEYS.RECEIPTS]) {
          data[STORAGE_KEYS.RECEIPTS] = data[STORAGE_KEYS.RECEIPTS].map((receipt: any) => ({
            ...receipt,
            extractionConfidence: receipt.extractionConfidence || null,
            items: receipt.items || [],
          }));
        }
        return data;
      },
      down: async (data: any) => {
        // Remove extractionConfidence and items fields
        if (data[STORAGE_KEYS.RECEIPTS]) {
          data[STORAGE_KEYS.RECEIPTS] = data[STORAGE_KEYS.RECEIPTS].map((receipt: any) => {
            const { extractionConfidence, items, ...rest } = receipt;
            return rest;
          });
        }
        return data;
      },
    });

    // Migration from 1.2.0 to 1.3.0
    this.migrationScripts.set('1.3.0', {
      version: '1.3.0',
      description: 'Add investment tracking and portfolio management',
      up: async (data: any) => {
        // Initialize investments if not present
        if (!data[STORAGE_KEYS.INVESTMENTS]) {
          data[STORAGE_KEYS.INVESTMENTS] = [];
        }
        
        // Add updatedAt field to transactions
        if (data[STORAGE_KEYS.TRANSACTIONS]) {
          data[STORAGE_KEYS.TRANSACTIONS] = data[STORAGE_KEYS.TRANSACTIONS].map((transaction: any) => ({
            ...transaction,
            updatedAt: transaction.updatedAt || transaction.createdAt,
          }));
        }
        
        return data;
      },
      down: async (data: any) => {
        // Remove investments and updatedAt fields
        delete data[STORAGE_KEYS.INVESTMENTS];
        
        if (data[STORAGE_KEYS.TRANSACTIONS]) {
          data[STORAGE_KEYS.TRANSACTIONS] = data[STORAGE_KEYS.TRANSACTIONS].map((transaction: any) => {
            const { updatedAt, ...rest } = transaction;
            return rest;
          });
        }
        
        return data;
      },
    });
  }

  private async getDataVersionInfo(): Promise<DataVersionInfo> {
    const versionInfo = await AsyncStorageWrapper.getItem<DataVersionInfo>(STORAGE_KEYS.DATA_VERSION);
    
    if (!versionInfo) {
      // First time setup
      const defaultInfo: DataVersionInfo = {
        version: '1.0.0',
        installDate: new Date(),
        pendingMigrations: [],
      };
      
      await this.updateDataVersionInfo(defaultInfo);
      return defaultInfo;
    }
    
    return versionInfo;
  }

  private async updateDataVersionInfo(info: DataVersionInfo): Promise<void> {
    await AsyncStorageWrapper.setItem(STORAGE_KEYS.DATA_VERSION, info, {
      encrypt: true,
      compress: false,
    });
  }

  private async getPendingMigrations(currentVersion: string): Promise<string[]> {
    const allVersions = Array.from(this.migrationScripts.keys()).sort(this.compareVersions);
    const currentIndex = allVersions.indexOf(currentVersion);
    
    if (currentIndex === -1) {
      // Current version not found, return all migrations
      return allVersions;
    }
    
    return allVersions.slice(currentIndex + 1);
  }

  private compareVersions(a: string, b: string): number {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);
    
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i] || 0;
      const bPart = bParts[i] || 0;
      
      if (aPart < bPart) return -1;
      if (aPart > bPart) return 1;
    }
    
    return 0;
  }

  private async getDataKeysForMigration(version: string): Promise<string[]> {
    // Return all core data keys for migration
    return [
      STORAGE_KEYS.TRANSACTIONS,
      STORAGE_KEYS.CATEGORIES,
      STORAGE_KEYS.ACCOUNTS,
      STORAGE_KEYS.RECEIPTS,
      STORAGE_KEYS.INVESTMENTS,
      STORAGE_KEYS.BUDGETS,
    ];
  }

  private async loadMigrationData(dataKeys: string[]): Promise<any> {
    const data: any = {};
    
    for (const key of dataKeys) {
      try {
        data[key] = await AsyncStorageWrapper.getItem(key);
      } catch (error) {
        // Skip missing keys
        data[key] = null;
      }
    }
    
    return data;
  }

  private async saveMigrationData(dataKeys: string[], data: any): Promise<void> {
    const operations = dataKeys.map(key => ({
      type: 'set' as const,
      key,
      value: data[key],
      options: { encrypt: true, compress: false },
    }));
    
    await StorageService.executeBatch(operations);
  }

  private async saveMigrationInfo(info: MigrationInfo): Promise<void> {
    // Save current migration info
    await AsyncStorageWrapper.setItem(STORAGE_KEYS.MIGRATION_STATUS, info, {
      encrypt: true,
      compress: false,
    });
    
    // Add to history
    const history = await this.getMigrationHistory();
    history.push(info);
    
    // Keep only last 10 migrations in history
    const trimmedHistory = history.slice(-10);
    
    await AsyncStorageWrapper.setItem(`${STORAGE_KEYS.MIGRATION_STATUS}_history`, trimmedHistory, {
      encrypt: true,
      compress: false,
    });
  }

  private getScriptsToRollback(fromVersion: string, toVersion: string): string[] {
    const allVersions = Array.from(this.migrationScripts.keys()).sort(this.compareVersions);
    const fromIndex = allVersions.indexOf(fromVersion);
    const toIndex = allVersions.indexOf(toVersion);
    
    if (fromIndex === -1 || toIndex === -1 || fromIndex <= toIndex) {
      return [];
    }
    
    return allVersions.slice(toIndex + 1, fromIndex + 1);
  }
}

export default DataMigration;