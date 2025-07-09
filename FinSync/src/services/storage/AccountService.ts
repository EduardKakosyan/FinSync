/**
 * Account Data Service for FinSync Financial App
 * Handles CRUD operations for financial accounts
 * Updated to use Firebase backend
 */

import { firebaseAccountService } from '../firebase';
import {
  Account,
  ValidationResult,
  ValidationError,
  CreateAccountInput,
  AccountBalance,
} from '../../types';

export class AccountService {
  private firebaseService = firebaseAccountService;

  /**
   * Validate account data
   */
  private validateEntity(account: Partial<Account>): ValidationResult {
    const errors: ValidationError[] = [];

    // Required fields validation
    if (!account.name || account.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Account name is required',
        code: 'REQUIRED',
        value: account.name,
      });
    } else if (account.name.length > 100) {
      errors.push({
        field: 'name',
        message: 'Account name must be 100 characters or less',
        code: 'MAX_LENGTH',
        value: account.name,
      });
    }

    if (!account.type || !['checking', 'savings', 'credit', 'investment', 'loan', 'cash', 'other'].includes(account.type)) {
      errors.push({
        field: 'type',
        message: 'Invalid account type',
        code: 'INVALID_VALUE',
        value: account.type,
      });
    }

    if (account.balance === undefined || account.balance === null) {
      errors.push({
        field: 'balance',
        message: 'Balance is required',
        code: 'REQUIRED',
        value: account.balance,
      });
    } else if (typeof account.balance !== 'number' || isNaN(account.balance)) {
      errors.push({
        field: 'balance',
        message: 'Balance must be a valid number',
        code: 'INVALID_TYPE',
        value: account.balance,
      });
    }

    if (!account.currency || account.currency.length !== 3) {
      errors.push({
        field: 'currency',
        message: 'Currency must be a 3-letter code',
        code: 'INVALID_FORMAT',
        value: account.currency,
      });
    }

    if (!account.color || !/^#[0-9A-F]{6}$/i.test(account.color)) {
      errors.push({
        field: 'color',
        message: 'Color must be a valid hex color',
        code: 'INVALID_FORMAT',
        value: account.color,
      });
    }


    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Create a new account
   */
  async create(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account> {
    const validation = this.validateEntity(account);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }
    return this.firebaseService.create(account);
  }

  /**
   * Get an account by ID
   */
  async getById(id: string): Promise<Account | null> {
    return this.firebaseService.getById(id);
  }

  /**
   * Get all accounts
   */
  async getAll(): Promise<Account[]> {
    return this.firebaseService.getAll();
  }

  /**
   * Update an account
   */
  async update(id: string, updates: Partial<Account>): Promise<Account> {
    const validation = this.validateEntity(updates);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }
    return this.firebaseService.update(id, updates);
  }

  /**
   * Delete an account
   */
  async delete(id: string): Promise<boolean> {
    await this.firebaseService.delete(id);
    return true;
  }


  /**
   * Get account by name
   */
  async getByName(name: string): Promise<Account | null> {
    const accounts = await this.getAll();
    return accounts.find(account => 
      account.name.toLowerCase() === name.toLowerCase()
    ) || null;
  }

  /**
   * Get accounts by type
   */
  async getByType(type: Account['type']): Promise<Account[]> {
    return this.firebaseService.getByType(type);
  }

  /**
   * Get active accounts
   */
  async getActiveAccounts(): Promise<Account[]> {
    return this.firebaseService.getActiveAccounts();
  }

  /**
   * Get inactive accounts
   */
  async getInactiveAccounts(): Promise<Account[]> {
    const accounts = await this.getAll();
    return accounts.filter(account => !account.isActive);
  }

  /**
   * Get accounts by currency
   */
  async getByCurrency(currency: 'CAD' | 'USD'): Promise<Account[]> {
    const accounts = await this.getAll();
    return accounts.filter(account => account.currency === currency);
  }

  /**
   * Update account balance
   */
  async updateBalance(id: string, newBalance: number): Promise<Account> {
    return this.firebaseService.updateBalance(id, newBalance);
  }

  /**
   * Adjust account balance (add or subtract amount)
   */
  async adjustBalance(accountId: string, amount: number): Promise<Account> {
    const account = await this.getById(accountId);
    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }

    const newBalance = account.balance + amount;
    return this.updateBalance(accountId, newBalance);
  }

  /**
   * Activate account
   */
  async activateAccount(accountId: string): Promise<Account> {
    return this.update(accountId, { isActive: true });
  }

  /**
   * Deactivate account
   */
  async deactivateAccount(accountId: string): Promise<Account> {
    return this.update(accountId, { isActive: false });
  }

  /**
   * Get total balance across all accounts
   */
  async getTotalBalance(currency?: string): Promise<number> {
    return this.firebaseService.getTotalBalance(currency);
  }

  /**
   * Get default account
   */
  async getDefaultAccount(): Promise<Account | null> {
    const accounts = await this.getAll();
    return accounts.find(account => account.isDefault) || accounts[0] || null;
  }

  /**
   * Set default account
   */
  async setDefaultAccount(id: string): Promise<void> {
    const accounts = await this.getAll();
    
    // Update all accounts to not be default
    await Promise.all(
      accounts.map(account => 
        account.id !== id && account.isDefault
          ? this.update(account.id, { isDefault: false })
          : Promise.resolve()
      )
    );

    // Set the specified account as default
    await this.update(id, { isDefault: true });
  }

  /**
   * Initialize default account if needed
   */
  async initializeDefault(): Promise<void> {
    return this.firebaseService.initializeDefault();
  }

  /**
   * Get account balances for summary
   */
  async getAccountBalances(): Promise<AccountBalance[]> {
    const accounts = await this.getActiveAccounts();
    
    return accounts.map(account => ({
      accountId: account.id,
      accountName: account.name,
      accountType: account.type,
      balance: account.balance,
      currency: account.currency,
      isActive: account.isActive,
      // lastTransaction would need transaction service integration
    }));
  }

  /**
   * Get accounts summary
   */
  async getAccountsSummary(): Promise<{
    totalAccounts: number;
    activeAccounts: number;
    totalBalance: number;
    byType: Record<string, { count: number; balance: number }>;
  }> {
    const accounts = await this.getAll();
    const activeAccounts = accounts.filter(acc => acc.isActive);

    const byType: Record<string, { count: number; balance: number }> = {};
    
    accounts.forEach(account => {
      if (!byType[account.type]) {
        byType[account.type] = { count: 0, balance: 0 };
      }
      byType[account.type].count++;
      byType[account.type].balance += account.balance;
    });

    return {
      totalAccounts: accounts.length,
      activeAccounts: activeAccounts.length,
      totalBalance: await this.getTotalBalance(),
      byType,
    };
  }


  /**
   * Search accounts by name
   */
  async searchByName(searchTerm: string): Promise<Account[]> {
    const accounts = await this.getAll();
    const term = searchTerm.toLowerCase();
    return accounts.filter(account => 
      account.name.toLowerCase().includes(term) ||
      (account.institution && account.institution.toLowerCase().includes(term))
    );
  }

}

// Singleton instance
export const accountService = new AccountService();
export default accountService;