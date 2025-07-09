/**
 * Firebase Migration Service for FinSync
 * Handles migration of data from AsyncStorage to Firebase
 */

import AsyncStorageWrapper from '../storage/AsyncStorageWrapper';
import { STORAGE_KEYS } from '../storage/StorageKeys';
import { firebaseTransactionService } from './FirebaseTransactionService';
import { firebaseCategoryService } from './FirebaseCategoryService';
import { firebaseAccountService } from './FirebaseAccountService';
import { Transaction, Category, Account } from '../../types';

export interface MigrationProgress {
  total: number;
  completed: number;
  failed: number;
  currentStep: string;
  errors: string[];
}

export interface MigrationResult {
  success: boolean;
  transactions: { migrated: number; failed: number };
  categories: { migrated: number; failed: number };
  accounts: { migrated: number; failed: number };
  errors: string[];
  duration: number;
}

export class FirebaseMigrationService {
  private progress: MigrationProgress = {
    total: 0,
    completed: 0,
    failed: 0,
    currentStep: '',
    errors: [],
  };

  /**
   * Perform full migration from AsyncStorage to Firebase
   */
  async migrateToFirebase(
    onProgress?: (progress: MigrationProgress) => void
  ): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      success: false,
      transactions: { migrated: 0, failed: 0 },
      categories: { migrated: 0, failed: 0 },
      accounts: { migrated: 0, failed: 0 },
      errors: [],
      duration: 0,
    };

    try {
      // Step 1: Initialize default data in Firebase
      this.updateProgress('Initializing Firebase defaults...', onProgress);
      await this.initializeFirebaseDefaults();

      // Step 2: Migrate Categories
      this.updateProgress('Migrating categories...', onProgress);
      const categoryResult = await this.migrateCategories();
      result.categories = categoryResult;

      // Step 3: Migrate Accounts
      this.updateProgress('Migrating accounts...', onProgress);
      const accountResult = await this.migrateAccounts();
      result.accounts = accountResult;

      // Step 4: Migrate Transactions
      this.updateProgress('Migrating transactions...', onProgress);
      const transactionResult = await this.migrateTransactions();
      result.transactions = transactionResult;

      // Step 5: Clean up (optional - keep AsyncStorage as backup)
      this.updateProgress('Finalizing migration...', onProgress);
      await this.finalizeMigration();

      result.success = true;
      result.duration = Date.now() - startTime;

      this.updateProgress('Migration completed successfully!', onProgress);
    } catch (error) {
      result.errors.push(`Migration failed: ${error}`);
      this.progress.errors.push(`Migration failed: ${error}`);
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Initialize Firebase with default data
   */
  private async initializeFirebaseDefaults(): Promise<void> {
    await firebaseCategoryService.initializeDefaults();
    await firebaseAccountService.initializeDefault();
  }

  /**
   * Migrate categories from AsyncStorage to Firebase
   */
  private async migrateCategories(): Promise<{ migrated: number; failed: number }> {
    const result = { migrated: 0, failed: 0 };

    try {
      const categories = await AsyncStorageWrapper.getItem<Category[]>(STORAGE_KEYS.CATEGORIES);
      if (!categories || categories.length === 0) {
        return result;
      }

      this.progress.total += categories.length;

      for (const category of categories) {
        try {
          await firebaseCategoryService.create({
            name: category.name,
            icon: category.icon,
            color: category.color,
            type: category.type,
            isDefault: category.isDefault,
            budget: category.budget,
          });
          result.migrated++;
          this.progress.completed++;
        } catch (error) {
          result.failed++;
          this.progress.failed++;
          this.progress.errors.push(`Failed to migrate category ${category.name}: ${error}`);
        }
      }
    } catch (error) {
      this.progress.errors.push(`Failed to read categories: ${error}`);
    }

    return result;
  }

  /**
   * Migrate accounts from AsyncStorage to Firebase
   */
  private async migrateAccounts(): Promise<{ migrated: number; failed: number }> {
    const result = { migrated: 0, failed: 0 };

    try {
      const accounts = await AsyncStorageWrapper.getItem<Account[]>(STORAGE_KEYS.ACCOUNTS);
      if (!accounts || accounts.length === 0) {
        return result;
      }

      this.progress.total += accounts.length;

      for (const account of accounts) {
        try {
          await firebaseAccountService.create({
            name: account.name,
            type: account.type,
            balance: account.balance,
            currency: account.currency,
            institution: account.institution,
            color: account.color,
            icon: account.icon,
            isActive: account.isActive,
            isDefault: account.isDefault,
            notes: account.notes,
            lastSyncedAt: account.lastSyncedAt,
          });
          result.migrated++;
          this.progress.completed++;
        } catch (error) {
          result.failed++;
          this.progress.failed++;
          this.progress.errors.push(`Failed to migrate account ${account.name}: ${error}`);
        }
      }
    } catch (error) {
      this.progress.errors.push(`Failed to read accounts: ${error}`);
    }

    return result;
  }

  /**
   * Migrate transactions from AsyncStorage to Firebase
   */
  private async migrateTransactions(): Promise<{ migrated: number; failed: number }> {
    const result = { migrated: 0, failed: 0 };

    try {
      const transactions = await AsyncStorageWrapper.getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS);
      if (!transactions || transactions.length === 0) {
        return result;
      }

      this.progress.total += transactions.length;

      // Get Firebase categories and accounts for mapping
      const firebaseCategories = await firebaseCategoryService.getAll();
      const firebaseAccounts = await firebaseAccountService.getAll();

      // Create mapping from old IDs to new Firebase IDs
      const categoryMap = new Map<string, string>();
      const accountMap = new Map<string, string>();

      // For simplicity, map by name (in production, you'd want a more robust mapping)
      firebaseCategories.forEach(cat => categoryMap.set(cat.name, cat.id));
      firebaseAccounts.forEach(acc => accountMap.set(acc.name, acc.id));

      // Use default account if mapping fails
      const defaultAccount = firebaseAccounts.find(acc => acc.isDefault) || firebaseAccounts[0];

      for (const transaction of transactions) {
        try {
          // Map category and account IDs
          const categoryId = categoryMap.get(transaction.category) || 
                           firebaseCategories.find(c => c.name === 'Other Expense')?.id || 
                           firebaseCategories[0].id;
          
          const accountId = transaction.accountId && accountMap.get(transaction.accountId) || 
                          defaultAccount?.id || 
                          firebaseAccounts[0].id;

          await firebaseTransactionService.create({
            amount: transaction.amount,
            type: transaction.type,
            category: categoryId,
            description: transaction.description,
            date: transaction.date,
            accountId: accountId,
            tags: transaction.tags,
            notes: transaction.notes,
            location: transaction.location,
            receiptId: transaction.receiptId,
          });
          result.migrated++;
          this.progress.completed++;
        } catch (error) {
          result.failed++;
          this.progress.failed++;
          this.progress.errors.push(`Failed to migrate transaction: ${error}`);
        }
      }
    } catch (error) {
      this.progress.errors.push(`Failed to read transactions: ${error}`);
    }

    return result;
  }

  /**
   * Finalize migration
   */
  private async finalizeMigration(): Promise<void> {
    // Store migration status
    await AsyncStorageWrapper.setItem(STORAGE_KEYS.MIGRATION_STATUS, {
      migratedToFirebase: true,
      migrationDate: new Date().toISOString(),
      version: '1.0.0',
    });
  }

  /**
   * Check if migration has already been performed
   */
  async isMigrated(): Promise<boolean> {
    try {
      const status = await AsyncStorageWrapper.getItem(STORAGE_KEYS.MIGRATION_STATUS);
      return status?.migratedToFirebase === true;
    } catch {
      return false;
    }
  }

  /**
   * Update progress and notify callback
   */
  private updateProgress(step: string, onProgress?: (progress: MigrationProgress) => void): void {
    this.progress.currentStep = step;
    if (onProgress) {
      onProgress({ ...this.progress });
    }
  }

  /**
   * Reset migration (for testing)
   */
  async resetMigration(): Promise<void> {
    await AsyncStorageWrapper.removeItem(STORAGE_KEYS.MIGRATION_STATUS);
  }
}

// Export singleton instance
export const firebaseMigrationService = new FirebaseMigrationService();
export default firebaseMigrationService;