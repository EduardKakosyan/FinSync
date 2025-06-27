/**
 * Transaction Storage Service for FinSync Financial App
 * Provides comprehensive transaction persistence with CRUD operations,
 * batch processing, advanced search/filtering, and financial analytics
 */

import BaseDataService, { BaseEntity, DataServiceOptions } from './BaseDataService';
import StorageService, { BatchOperation, BatchResult } from './StorageService';
import { STORAGE_KEYS, DEFAULT_STORAGE_OPTIONS } from './StorageKeys';
import {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  SearchQuery,
  SearchResult,
  DateRange,
  ValidationResult,
  ValidationError,
  SpendingData,
  CategorySpending,
  MonthlySpending,
} from '../../types';

export interface TransactionSearchQuery extends SearchQuery {
  accountIds?: string[];
  categoryIds?: string[];
  receiptRequired?: boolean;
  amountRange?: {
    min?: number;
    max?: number;
  };
  types?: ('income' | 'expense')[];
}

export interface TransactionBatchOperation {
  type: 'create' | 'update' | 'delete';
  transaction?: CreateTransactionInput | (UpdateTransactionInput & { id: string });
  transactionId?: string;
}

export interface TransactionAnalytics {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  transactionCount: number;
  averageTransaction: number;
  categoryBreakdown: CategorySpending[];
  monthlyTrend: MonthlySpending[];
  topCategories: CategorySpending[];
  period: DateRange;
}

export interface RecurringTransactionPattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  amount: number;
  category: string;
  description: string;
  nextDueDate: Date;
  isActive: boolean;
}

/**
 * Transaction Storage Service
 */
export class TransactionStorage extends BaseDataService<Transaction> {
  private static instance: TransactionStorage | null = null;

  constructor(options?: DataServiceOptions) {
    super(STORAGE_KEYS.TRANSACTIONS, 'transaction', options);
  }

  /**
   * Singleton pattern for consistent instance
   */
  static getInstance(options?: DataServiceOptions): TransactionStorage {
    if (!this.instance) {
      this.instance = new TransactionStorage(options);
    }
    return this.instance;
  }

  /**
   * Create a new transaction with enhanced validation
   */
  async createTransaction(transactionData: CreateTransactionInput): Promise<Transaction> {
    // Validate transaction data
    const validation = this.validateTransactionData(transactionData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Check for potential duplicates
    const potentialDuplicates = await this.findPotentialDuplicates(transactionData);
    if (potentialDuplicates.length > 0) {
      console.warn('Potential duplicate transactions found:', potentialDuplicates);
    }

    const transaction = await this.create(transactionData);
    
    // Update storage metadata
    await StorageService.updateStorageMetadata(this.storageKey, await this.getAll());
    
    return transaction;
  }

  /**
   * Update transaction with validation
   */
  async updateTransaction(id: string, updates: Partial<UpdateTransactionInput>): Promise<Transaction> {
    const existingTransaction = await this.getById(id);
    if (!existingTransaction) {
      throw new Error(`Transaction not found: ${id}`);
    }

    const updatedData = { ...existingTransaction, ...updates };
    const validation = this.validateTransactionData(updatedData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    const transaction = await this.update(id, updates);
    
    // Update storage metadata
    await StorageService.updateStorageMetadata(this.storageKey, await this.getAll());
    
    return transaction;
  }

  /**
   * Batch transaction operations
   */
  async executeBatchTransactionOperations(
    operations: TransactionBatchOperation[]
  ): Promise<{
    successful: number;
    failed: number;
    results: Array<{ success: boolean; id?: string; error?: string }>;
  }> {
    const results: Array<{ success: boolean; id?: string; error?: string }> = [];
    let successful = 0;
    let failed = 0;

    for (const operation of operations) {
      try {
        switch (operation.type) {
          case 'create':
            if (operation.transaction) {
              const created = await this.createTransaction(operation.transaction as CreateTransactionInput);
              results.push({ success: true, id: created.id });
              successful++;
            }
            break;

          case 'update':
            if (operation.transaction && operation.transactionId) {
              const updated = await this.updateTransaction(
                operation.transactionId,
                operation.transaction as Partial<UpdateTransactionInput>
              );
              results.push({ success: true, id: updated.id });
              successful++;
            }
            break;

          case 'delete':
            if (operation.transactionId) {
              const deleted = await this.delete(operation.transactionId);
              results.push({ success: deleted, id: operation.transactionId });
              if (deleted) successful++;
              else failed++;
            }
            break;
        }
      } catch (error) {
        results.push({
          success: false,
          id: operation.transactionId,
          error: (error as Error).message,
        });
        failed++;
      }
    }

    return { successful, failed, results };
  }

  /**
   * Advanced transaction search with financial filters
   */
  async searchTransactions(query: TransactionSearchQuery): Promise<SearchResult<Transaction>> {
    let transactions = await this.getAll();

    // Apply transaction-specific filters
    if (query.accountIds && query.accountIds.length > 0) {
      transactions = transactions.filter(t => query.accountIds!.includes(t.accountId));
    }

    if (query.categoryIds && query.categoryIds.length > 0) {
      transactions = transactions.filter(t => query.categoryIds!.includes(t.category));
    }

    if (query.types && query.types.length > 0) {
      transactions = transactions.filter(t => query.types!.includes(t.type));
    }

    if (query.amountRange) {
      const { min, max } = query.amountRange;
      if (min !== undefined) {
        transactions = transactions.filter(t => t.amount >= min);
      }
      if (max !== undefined) {
        transactions = transactions.filter(t => t.amount <= max);
      }
    }

    if (query.receiptRequired !== undefined) {
      transactions = transactions.filter(t => 
        query.receiptRequired ? !!t.receiptId : !t.receiptId
      );
    }

    // Apply date range filter
    if (query.dateRange) {
      transactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= query.dateRange!.startDate && 
               transactionDate <= query.dateRange!.endDate;
      });
    }

    // Apply text search
    if (query.text) {
      const searchText = query.text.toLowerCase();
      transactions = transactions.filter(t => 
        t.description.toLowerCase().includes(searchText) ||
        t.category.toLowerCase().includes(searchText)
      );
    }

    // Apply sorting
    const sortBy = query.sortBy || 'date';
    const sortOrder = query.sortOrder || 'desc';
    transactions = this.sortEntities(transactions, sortBy, sortOrder);

    // Apply pagination
    const totalCount = transactions.length;
    const offset = query.offset || 0;
    const limit = query.limit || 50;
    const paginatedTransactions = transactions.slice(offset, offset + limit);

    return {
      items: paginatedTransactions,
      totalCount,
      hasMore: offset + limit < totalCount,
      query,
      executedAt: new Date(),
      executionTime: 0, // Could track actual execution time
    };
  }

  /**
   * Get transactions by date range
   */
  async getTransactionsByDateRange(dateRange: DateRange): Promise<Transaction[]> {
    const transactions = await this.getAll();
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= dateRange.startDate && transactionDate <= dateRange.endDate;
    });
  }

  /**
   * Get transactions by category
   */
  async getTransactionsByCategory(categoryId: string): Promise<Transaction[]> {
    const transactions = await this.getAll();
    return transactions.filter(t => t.category === categoryId);
  }

  /**
   * Get transactions by account
   */
  async getTransactionsByAccount(accountId: string): Promise<Transaction[]> {
    const transactions = await this.getAll();
    return transactions.filter(t => t.accountId === accountId);
  }

  /**
   * Calculate transaction analytics
   */
  async calculateAnalytics(dateRange: DateRange): Promise<TransactionAnalytics> {
    const transactions = await this.getTransactionsByDateRange(dateRange);
    
    const income = transactions.filter(t => t.type === 'income');
    const expenses = transactions.filter(t => t.type === 'expense');
    
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const netIncome = totalIncome - totalExpenses;
    
    // Calculate category breakdown
    const categoryMap = new Map<string, CategorySpending>();
    transactions.forEach(t => {
      const existing = categoryMap.get(t.category) || {
        categoryId: t.category,
        categoryName: t.category, // Would need to lookup actual category name
        categoryColor: '#000000', // Would need to lookup actual category color
        amount: 0,
        percentage: 0,
        transactionCount: 0,
        trend: 'stable' as const,
      };
      
      existing.amount += t.amount;
      existing.transactionCount += 1;
      categoryMap.set(t.category, existing);
    });

    const categoryBreakdown = Array.from(categoryMap.values());
    const totalAmount = Math.abs(totalIncome) + Math.abs(totalExpenses);
    categoryBreakdown.forEach(cat => {
      cat.percentage = totalAmount > 0 ? (cat.amount / totalAmount) * 100 : 0;
    });

    // Calculate monthly trend
    const monthlyMap = new Map<string, MonthlySpending>();
    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const existing = monthlyMap.get(monthKey) || {
        month: monthKey,
        year: date.getFullYear(),
        monthName: date.toLocaleString('default', { month: 'long' }),
        totalIncome: 0,
        totalExpenses: 0,
        netIncome: 0,
        transactionCount: 0,
        savings: 0,
        savingsRate: 0,
      };
      
      if (t.type === 'income') {
        existing.totalIncome += t.amount;
      } else {
        existing.totalExpenses += t.amount;
      }
      existing.transactionCount += 1;
      existing.netIncome = existing.totalIncome - existing.totalExpenses;
      existing.savings = existing.netIncome;
      existing.savingsRate = existing.totalIncome > 0 ? (existing.savings / existing.totalIncome) * 100 : 0;
      
      monthlyMap.set(monthKey, existing);
    });

    const monthlyTrend = Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));
    
    // Get top categories
    const topCategories = categoryBreakdown
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      totalIncome,
      totalExpenses,
      netIncome,
      transactionCount: transactions.length,
      averageTransaction: transactions.length > 0 ? (totalIncome + totalExpenses) / transactions.length : 0,
      categoryBreakdown,
      monthlyTrend,
      topCategories,
      period: dateRange,
    };
  }

  /**
   * Find potential duplicate transactions
   */
  async findPotentialDuplicates(
    transaction: CreateTransactionInput,
    tolerance: { amount: number; hours: number } = { amount: 0.01, hours: 24 }
  ): Promise<Transaction[]> {
    const allTransactions = await this.getAll();
    const transactionDate = new Date(transaction.date);
    
    return allTransactions.filter(existing => {
      const existingDate = new Date(existing.date);
      const hoursDiff = Math.abs(transactionDate.getTime() - existingDate.getTime()) / (1000 * 60 * 60);
      const amountDiff = Math.abs(existing.amount - transaction.amount);
      
      return hoursDiff <= tolerance.hours &&
             amountDiff <= tolerance.amount &&
             existing.category === transaction.category &&
             existing.accountId === transaction.accountId;
    });
  }

  /**
   * Detect recurring transaction patterns
   */
  async detectRecurringPatterns(): Promise<RecurringTransactionPattern[]> {
    const transactions = await this.getAll();
    const patterns: RecurringTransactionPattern[] = [];
    
    // Group transactions by description and amount
    const groupMap = new Map<string, Transaction[]>();
    transactions.forEach(t => {
      const key = `${t.description}_${t.amount}_${t.category}`;
      const existing = groupMap.get(key) || [];
      existing.push(t);
      groupMap.set(key, existing);
    });
    
    // Analyze groups for recurring patterns
    groupMap.forEach((group, key) => {
      if (group.length >= 3) { // Need at least 3 occurrences
        const sortedGroup = group.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const intervals = [];
        
        for (let i = 1; i < sortedGroup.length; i++) {
          const prevDate = new Date(sortedGroup[i - 1].date);
          const currDate = new Date(sortedGroup[i].date);
          const daysDiff = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
          intervals.push(daysDiff);
        }
        
        // Check for consistent intervals
        const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        const tolerance = 3; // 3 days tolerance
        const isConsistent = intervals.every(interval => Math.abs(interval - avgInterval) <= tolerance);
        
        if (isConsistent) {
          let frequency: RecurringTransactionPattern['frequency'];
          if (avgInterval <= 1) frequency = 'daily';
          else if (avgInterval <= 7) frequency = 'weekly';
          else if (avgInterval <= 35) frequency = 'monthly';
          else frequency = 'yearly';
          
          const lastTransaction = sortedGroup[sortedGroup.length - 1];
          const nextDueDate = new Date(lastTransaction.date);
          nextDueDate.setDate(nextDueDate.getDate() + avgInterval);
          
          patterns.push({
            frequency,
            amount: lastTransaction.amount,
            category: lastTransaction.category,
            description: lastTransaction.description,
            nextDueDate,
            isActive: true,
          });
        }
      }
    });
    
    return patterns;
  }

  /**
   * Required implementations from BaseDataService
   */
  protected validateEntity(entity: Partial<Transaction>): ValidationResult {
    return this.validateTransactionData(entity);
  }

  protected transformForStorage(entity: Transaction): any {
    return {
      ...entity,
      date: entity.date.toISOString(),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt?.toISOString(),
    };
  }

  protected transformFromStorage(data: any): Transaction {
    return {
      ...data,
      date: new Date(data.date),
      createdAt: new Date(data.createdAt),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
    };
  }

  protected filterByText(entities: Transaction[], text: string): Transaction[] {
    const searchText = text.toLowerCase();
    return entities.filter(t => 
      t.description.toLowerCase().includes(searchText) ||
      t.category.toLowerCase().includes(searchText)
    );
  }

  protected filterByDateRange(entities: Transaction[], dateRange: DateRange): Transaction[] {
    return entities.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= dateRange.startDate && transactionDate <= dateRange.endDate;
    });
  }

  /**
   * Private helper methods
   */
  private validateTransactionData(data: Partial<Transaction>): ValidationResult {
    const errors: ValidationError[] = [];
    
    if (!data.amount || data.amount <= 0) {
      errors.push({
        field: 'amount',
        message: 'Amount must be greater than 0',
        code: 'INVALID_AMOUNT',
        value: data.amount,
      });
    }
    
    if (!data.date || isNaN(new Date(data.date).getTime())) {
      errors.push({
        field: 'date',
        message: 'Valid date is required',
        code: 'INVALID_DATE',
        value: data.date,
      });
    }
    
    if (!data.category || data.category.trim().length === 0) {
      errors.push({
        field: 'category',
        message: 'Category is required',
        code: 'MISSING_CATEGORY',
        value: data.category,
      });
    }
    
    if (!data.description || data.description.trim().length === 0) {
      errors.push({
        field: 'description',
        message: 'Description is required',
        code: 'MISSING_DESCRIPTION',
        value: data.description,
      });
    }
    
    if (!data.type || !['income', 'expense'].includes(data.type)) {
      errors.push({
        field: 'type',
        message: 'Type must be either income or expense',
        code: 'INVALID_TYPE',
        value: data.type,
      });
    }
    
    if (!data.accountId || data.accountId.trim().length === 0) {
      errors.push({
        field: 'accountId',
        message: 'Account ID is required',
        code: 'MISSING_ACCOUNT',
        value: data.accountId,
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }
}

export default TransactionStorage;