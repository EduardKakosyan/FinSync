/**
 * Transaction Data Service for FinSync Financial App
 * Handles CRUD operations for financial transactions
 */

import BaseDataService from './BaseDataService';
import { STORAGE_KEYS } from './StorageKeys';
import {
  Transaction,
  ValidationResult,
  ValidationError,
  SearchQuery,
  DateRange,
  CategorySpending,
  MonthlySpending,
  SpendingData,
} from '../../types';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export class TransactionService extends BaseDataService<Transaction> {
  constructor() {
    super(STORAGE_KEYS.TRANSACTIONS, 'transaction');
  }

  /**
   * Validate transaction data
   */
  protected validateEntity(transaction: Partial<Transaction>): ValidationResult {
    const errors: ValidationError[] = [];

    // Required fields validation
    if (!transaction.amount) {
      errors.push({
        field: 'amount',
        message: 'Amount is required',
        code: 'REQUIRED',
        value: transaction.amount,
      });
    } else if (transaction.amount <= 0) {
      errors.push({
        field: 'amount',
        message: 'Amount must be greater than 0',
        code: 'MIN_VALUE',
        value: transaction.amount,
      });
    }

    if (!transaction.date) {
      errors.push({
        field: 'date',
        message: 'Date is required',
        code: 'REQUIRED',
        value: transaction.date,
      });
    } else if (transaction.date > new Date()) {
      errors.push({
        field: 'date',
        message: 'Date cannot be in the future',
        code: 'INVALID_DATE',
        value: transaction.date,
      });
    }

    if (!transaction.category) {
      errors.push({
        field: 'category',
        message: 'Category is required',
        code: 'REQUIRED',
        value: transaction.category,
      });
    }

    if (!transaction.description || transaction.description.trim().length === 0) {
      errors.push({
        field: 'description',
        message: 'Description is required',
        code: 'REQUIRED',
        value: transaction.description,
      });
    }

    if (!transaction.type || !['income', 'expense'].includes(transaction.type)) {
      errors.push({
        field: 'type',
        message: 'Type must be either income or expense',
        code: 'INVALID_VALUE',
        value: transaction.type,
      });
    }

    if (!transaction.accountId) {
      errors.push({
        field: 'accountId',
        message: 'Account ID is required',
        code: 'REQUIRED',
        value: transaction.accountId,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Transform transaction for storage (handle Date serialization)
   */
  protected transformForStorage(transaction: Transaction): any {
    return {
      ...transaction,
      date: transaction.date.toISOString(),
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt?.toISOString(),
    };
  }

  /**
   * Transform transaction from storage (parse Date objects)
   */
  protected transformFromStorage(data: any): Transaction {
    return {
      ...data,
      date: new Date(data.date),
      createdAt: new Date(data.createdAt),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
    };
  }

  /**
   * Get transactions by date range
   */
  async getByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    const transactions = await this.getAll();
    return transactions.filter(transaction =>
      isWithinInterval(transaction.date, { start: startDate, end: endDate })
    );
  }

  /**
   * Get transactions by category
   */
  async getByCategory(categoryId: string): Promise<Transaction[]> {
    const transactions = await this.getAll();
    return transactions.filter(transaction => transaction.category === categoryId);
  }

  /**
   * Get transactions by account
   */
  async getByAccount(accountId: string): Promise<Transaction[]> {
    const transactions = await this.getAll();
    return transactions.filter(transaction => transaction.accountId === accountId);
  }

  /**
   * Get transactions by type
   */
  async getByType(type: 'income' | 'expense'): Promise<Transaction[]> {
    const transactions = await this.getAll();
    return transactions.filter(transaction => transaction.type === type);
  }

  /**
   * Get recent transactions
   */
  async getRecent(limit: number = 10): Promise<Transaction[]> {
    const transactions = await this.getAll();
    return transactions
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
  }

  /**
   * Calculate spending data for a date range
   */
  async calculateSpendingData(dateRange: DateRange): Promise<SpendingData> {
    const transactions = await this.getByDateRange(dateRange.startDate, dateRange.endDate);
    
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate category breakdown
    const categoryMap = new Map<string, { amount: number; count: number }>();
    transactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const existing = categoryMap.get(transaction.category) || { amount: 0, count: 0 };
        categoryMap.set(transaction.category, {
          amount: existing.amount + transaction.amount,
          count: existing.count + 1,
        });
      });

    const categoryBreakdown: CategorySpending[] = Array.from(categoryMap.entries()).map(
      ([categoryId, data]) => ({
        categoryId,
        categoryName: categoryId, // Would need category service to get name
        categoryColor: '#007AFF', // Default color
        amount: data.amount,
        percentage: expenses > 0 ? (data.amount / expenses) * 100 : 0,
        transactionCount: data.count,
        trend: 'stable',
      })
    );

    // Sort by amount descending
    categoryBreakdown.sort((a, b) => b.amount - a.amount);

    // Calculate monthly trend (simplified)
    const monthlyTrend = await this.calculateMonthlyTrend(dateRange);

    const daysDiff = Math.ceil(
      (dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netIncome: income - expenses,
      categoryBreakdown,
      monthlyTrend,
      dailyAverage: expenses / (daysDiff || 1),
      topCategories: categoryBreakdown.slice(0, 5),
      period: dateRange,
    };
  }

  /**
   * Calculate monthly spending trend
   */
  private async calculateMonthlyTrend(dateRange: DateRange): Promise<MonthlySpending[]> {
    const transactions = await this.getByDateRange(dateRange.startDate, dateRange.endDate);
    const monthMap = new Map<string, MonthlySpending>();

    transactions.forEach(transaction => {
      const monthKey = format(transaction.date, 'yyyy-MM');
      const existing = monthMap.get(monthKey) || {
        month: monthKey,
        year: transaction.date.getFullYear(),
        monthName: format(transaction.date, 'MMMM'),
        totalIncome: 0,
        totalExpenses: 0,
        netIncome: 0,
        transactionCount: 0,
        savings: 0,
        savingsRate: 0,
      };

      if (transaction.type === 'income') {
        existing.totalIncome += transaction.amount;
      } else {
        existing.totalExpenses += transaction.amount;
      }

      existing.transactionCount++;
      existing.netIncome = existing.totalIncome - existing.totalExpenses;
      existing.savings = existing.netIncome;
      existing.savingsRate = existing.totalIncome > 0 
        ? (existing.savings / existing.totalIncome) * 100 
        : 0;

      monthMap.set(monthKey, existing);
    });

    return Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Get transactions with receipts
   */
  async getTransactionsWithReceipts(): Promise<Transaction[]> {
    const transactions = await this.getAll();
    return transactions.filter(transaction => transaction.receiptId);
  }

  /**
   * Get transactions without receipts
   */
  async getTransactionsWithoutReceipts(): Promise<Transaction[]> {
    const transactions = await this.getAll();
    return transactions.filter(transaction => !transaction.receiptId);
  }

  /**
   * Calculate total by type for date range
   */
  async getTotalByType(
    type: 'income' | 'expense',
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    let transactions = await this.getByType(type);
    
    if (startDate && endDate) {
      transactions = transactions.filter(transaction =>
        isWithinInterval(transaction.date, { start: startDate, end: endDate })
      );
    }

    return transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  }

  /**
   * Get spending summary for current month
   */
  async getCurrentMonthSummary(): Promise<{
    income: number;
    expenses: number;
    net: number;
    transactionCount: number;
    averageDaily: number;
  }> {
    const now = new Date();
    const startDate = startOfMonth(now);
    const endDate = endOfMonth(now);

    const transactions = await this.getByDateRange(startDate, endDate);
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const daysInMonth = endDate.getDate();

    return {
      income,
      expenses,
      net: income - expenses,
      transactionCount: transactions.length,
      averageDaily: expenses / daysInMonth,
    };
  }

  /**
   * Enhanced text search for transactions
   */
  protected filterByText(transactions: Transaction[], text: string): Transaction[] {
    const searchTerm = text.toLowerCase();
    return transactions.filter(transaction =>
      transaction.description.toLowerCase().includes(searchTerm) ||
      transaction.category.toLowerCase().includes(searchTerm) ||
      transaction.amount.toString().includes(searchTerm)
    );
  }

  /**
   * Enhanced date range filtering
   */
  protected filterByDateRange(transactions: Transaction[], dateRange: DateRange): Transaction[] {
    return transactions.filter(transaction =>
      isWithinInterval(transaction.date, {
        start: dateRange.startDate,
        end: dateRange.endDate,
      })
    );
  }

  /**
   * Bulk import transactions
   */
  async bulkImport(transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<{
    imported: number;
    failed: number;
    errors: string[];
  }> {
    const results = { imported: 0, failed: 0, errors: [] as string[] };

    for (const transactionData of transactions) {
      try {
        await this.create(transactionData);
        results.imported++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to import transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }
}

// Singleton instance
export const transactionService = new TransactionService();
export default transactionService;