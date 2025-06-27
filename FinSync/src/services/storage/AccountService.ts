/**
 * Account Data Service for FinSync Financial App
 * Handles CRUD operations for financial accounts
 */

import BaseDataService from './BaseDataService';
import { STORAGE_KEYS } from './StorageKeys';
import {
  Account,
  ValidationResult,
  ValidationError,
  CreateAccountInput,
  AccountBalance,
} from '../../types';

export class AccountService extends BaseDataService<Account> {
  constructor() {
    super(STORAGE_KEYS.ACCOUNTS, 'account');
  }

  /**
   * Validate account data
   */
  protected validateEntity(account: Partial<Account>): ValidationResult {
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

    if (!account.type || !['checking', 'savings', 'credit', 'investment'].includes(account.type)) {
      errors.push({
        field: 'type',
        message: 'Account type must be checking, savings, credit, or investment',
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

    if (!account.currency || !['CAD', 'USD'].includes(account.currency)) {
      errors.push({
        field: 'currency',
        message: 'Currency must be CAD or USD',
        code: 'INVALID_VALUE',
        value: account.currency,
      });
    }

    if (account.isActive === undefined || account.isActive === null) {
      errors.push({
        field: 'isActive',
        message: 'isActive field is required',
        code: 'REQUIRED',
        value: account.isActive,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Transform account for storage
   */
  protected transformForStorage(account: Account): any {
    return {
      ...account,
      createdAt: account.createdAt.toISOString(),
    };
  }

  /**
   * Transform account from storage
   */
  protected transformFromStorage(data: any): Account {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
    };
  }

  /**
   * Create a new account with validation for duplicates
   */
  async create(accountData: CreateAccountInput): Promise<Account> {
    // Check for duplicate names
    const existing = await this.getByName(accountData.name);
    if (existing) {
      throw new Error(`Account with name "${accountData.name}" already exists`);
    }

    return super.create(accountData);
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
    const accounts = await this.getAll();
    return accounts.filter(account => account.type === type);
  }

  /**
   * Get active accounts only
   */
  async getActiveAccounts(): Promise<Account[]> {
    const accounts = await this.getAll();
    return accounts.filter(account => account.isActive);
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
  async updateBalance(accountId: string, newBalance: number): Promise<Account> {
    if (typeof newBalance !== 'number' || isNaN(newBalance)) {
      throw new Error('Balance must be a valid number');
    }

    return this.update(accountId, { balance: newBalance });
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
   * Get total balance across all active accounts
   */
  async getTotalBalance(currency?: 'CAD' | 'USD'): Promise<number> {
    let accounts = await this.getActiveAccounts();
    
    if (currency) {
      accounts = accounts.filter(account => account.currency === currency);
    }

    return accounts.reduce((total, account) => total + account.balance, 0);
  }

  /**
   * Get balance breakdown by account type
   */
  async getBalanceByType(): Promise<Record<Account['type'], number>> {
    const accounts = await this.getActiveAccounts();
    const breakdown: Record<Account['type'], number> = {
      checking: 0,
      savings: 0,
      credit: 0,
      investment: 0,
    };

    accounts.forEach(account => {
      breakdown[account.type] += account.balance;
    });

    return breakdown;
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
   * Get account summary statistics
   */
  async getAccountSummary(): Promise<{
    totalAccounts: number;
    activeAccounts: number;
    totalBalance: number;
    balanceByType: Record<Account['type'], number>;
    balanceByCurrency: Record<'CAD' | 'USD', number>;
  }> {
    const allAccounts = await this.getAll();
    const activeAccounts = allAccounts.filter(account => account.isActive);

    const balanceByType = await this.getBalanceByType();
    
    const balanceByCurrency = {
      CAD: activeAccounts
        .filter(account => account.currency === 'CAD')
        .reduce((total, account) => total + account.balance, 0),
      USD: activeAccounts
        .filter(account => account.currency === 'USD')
        .reduce((total, account) => total + account.balance, 0),
    };

    return {
      totalAccounts: allAccounts.length,
      activeAccounts: activeAccounts.length,
      totalBalance: activeAccounts.reduce((total, account) => total + account.balance, 0),
      balanceByType,
      balanceByCurrency,
    };
  }

  /**
   * Get default accounts for initial setup
   */
  static getDefaultAccounts(): CreateAccountInput[] {
    return [
      {
        name: 'Checking Account',
        type: 'checking',
        balance: 0,
        currency: 'CAD',
        isActive: true,
      },
      {
        name: 'Savings Account',
        type: 'savings',
        balance: 0,
        currency: 'CAD',
        isActive: true,
      },
      {
        name: 'Credit Card',
        type: 'credit',
        balance: 0,
        currency: 'CAD',
        isActive: true,
      },
    ];
  }

  /**
   * Initialize default accounts (for first-time setup)
   */
  async initializeDefaultAccounts(): Promise<Account[]> {
    const existingAccounts = await this.getAll();
    if (existingAccounts.length > 0) {
      throw new Error('Accounts already exist. Cannot initialize defaults.');
    }

    const defaultAccounts = AccountService.getDefaultAccounts();
    const createdAccounts: Account[] = [];

    for (const accountData of defaultAccounts) {
      try {
        const account = await this.create(accountData);
        createdAccounts.push(account);
      } catch (error) {
        console.warn(`Failed to create default account ${accountData.name}:`, error);
      }
    }

    return createdAccounts;
  }

  /**
   * Enhanced text search for accounts
   */
  protected filterByText(accounts: Account[], text: string): Account[] {
    const searchTerm = text.toLowerCase();
    return accounts.filter(account =>
      account.name.toLowerCase().includes(searchTerm) ||
      account.type.toLowerCase().includes(searchTerm) ||
      account.currency.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Transfer funds between accounts
   */
  async transferFunds(
    fromAccountId: string,
    toAccountId: string,
    amount: number
  ): Promise<{ fromAccount: Account; toAccount: Account }> {
    if (amount <= 0) {
      throw new Error('Transfer amount must be greater than 0');
    }

    if (fromAccountId === toAccountId) {
      throw new Error('Cannot transfer to the same account');
    }

    const fromAccount = await this.getById(fromAccountId);
    const toAccount = await this.getById(toAccountId);

    if (!fromAccount) {
      throw new Error(`Source account not found: ${fromAccountId}`);
    }

    if (!toAccount) {
      throw new Error(`Destination account not found: ${toAccountId}`);
    }

    if (!fromAccount.isActive || !toAccount.isActive) {
      throw new Error('Both accounts must be active for transfers');
    }

    // Check sufficient funds (for non-credit accounts)
    if (fromAccount.type !== 'credit' && fromAccount.balance < amount) {
      throw new Error('Insufficient funds for transfer');
    }

    // Perform transfer
    const updatedFromAccount = await this.adjustBalance(fromAccountId, -amount);
    const updatedToAccount = await this.adjustBalance(toAccountId, amount);

    return {
      fromAccount: updatedFromAccount,
      toAccount: updatedToAccount,
    };
  }

  /**
   * Validate account for deletion (check for dependencies)
   */
  async canDelete(accountId: string): Promise<{ canDelete: boolean; reason?: string }> {
    const account = await this.getById(accountId);
    if (!account) {
      return { canDelete: false, reason: 'Account not found' };
    }

    // In a real app, you'd check for transactions linked to this account
    // For now, we'll allow deletion if the account is inactive and has zero balance
    if (account.isActive) {
      return { canDelete: false, reason: 'Cannot delete active account. Deactivate first.' };
    }

    if (account.balance !== 0) {
      return { canDelete: false, reason: 'Cannot delete account with non-zero balance' };
    }

    return { canDelete: true };
  }

  /**
   * Safe delete with validation
   */
  async safeDelete(accountId: string): Promise<boolean> {
    const validation = await this.canDelete(accountId);
    if (!validation.canDelete) {
      throw new Error(validation.reason || 'Cannot delete account');
    }

    return this.delete(accountId);
  }
}

// Singleton instance
export const accountService = new AccountService();
export default accountService;