/**
 * Enhanced Transaction Service for FinSync Financial App
 * Integrates all services for comprehensive transaction management
 * Matches SwiftUI version functionality with period-based analytics
 */

import {
  Transaction,
  Category,
  Account,
  CreateTransactionInput,
  UpdateTransactionInput,
  ApiResponse,
  SpendingData,
  SearchQuery,
  SearchResult,
  ValidationResult,
  DateRange,
} from '../types';
import { transactionService as baseTransactionService } from './storage/TransactionService';
import { categoryService as baseCategoryService } from './storage/CategoryService';
import { dataAggregationService, TimePeriod, PeriodFilter } from './DataAggregationService';
import { validationService } from './ValidationService';
import { currencyService } from './CurrencyService';
import { mockDataService } from './MockDataService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  subWeeks,
  subMonths,
  format,
} from 'date-fns';

export interface TransactionServiceOptions {
  useMockData?: boolean;
  autoValidate?: boolean;
  autoFormat?: boolean;
  enableCaching?: boolean;
}

export interface TransactionSummary {
  period: TimePeriod;
  dateRange: DateRange;
  totalTransactions: number;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  averageDaily: number;
  formattedSummary: {
    totalIncome: string;
    totalExpenses: string;
    netIncome: string;
    averageDaily: string;
  };
  spendingData: SpendingData;
}

export interface QuickStats {
  today: {
    amount: number;
    formatted: string;
    transactionCount: number;
  };
  thisWeek: {
    amount: number;
    formatted: string;
    transactionCount: number;
  };
  thisMonth: {
    amount: number;
    formatted: string;
    transactionCount: number;
  };
  lastUpdated: Date;
}

export class EnhancedTransactionService {
  private static instance: EnhancedTransactionService;
  private options: TransactionServiceOptions = {
    useMockData: false,
    autoValidate: true,
    autoFormat: true,
    enableCaching: true,
  };
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): EnhancedTransactionService {
    if (!EnhancedTransactionService.instance) {
      EnhancedTransactionService.instance = new EnhancedTransactionService();
    }
    return EnhancedTransactionService.instance;
  }

  /**
   * Initialize service with options
   */
  initialize(options: Partial<TransactionServiceOptions> = {}): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Create transaction with comprehensive validation and formatting
   */
  async createTransaction(
    input: CreateTransactionInput
  ): Promise<ApiResponse<Transaction>> {
    try {
      // Auto-validate if enabled
      if (this.options.autoValidate) {
        const validation = validationService.validateTransaction(input);
        if (!validation.isValid) {
          return {
            success: false,
            error: 'Validation failed',
            message: validation.errors.map(e => e.message).join(', '),
          };
        }
      }

      // Sanitize and format input
      const sanitizedInput = validationService.sanitizeTransactionInput(input);
      
      // Round amount to cents
      if (sanitizedInput.amount) {
        sanitizedInput.amount = currencyService.roundAmount(sanitizedInput.amount);
      }

      // Create transaction using base service
      const transaction = await baseTransactionService.create(sanitizedInput);
      
      // Clear relevant cache entries
      this.clearCachePattern('transactions_');
      this.clearCachePattern('summary_');
      this.clearCachePattern('stats_');

      return {
        success: true,
        data: transaction,
        message: 'Transaction created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create transaction',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update transaction with validation
   */
  async updateTransaction(
    id: string,
    updates: Partial<CreateTransactionInput>
  ): Promise<ApiResponse<Transaction>> {
    try {
      // Get existing transaction
      const existing = await baseTransactionService.getById(id);
      if (!existing) {
        return {
          success: false,
          error: 'Transaction not found',
        };
      }

      // Merge updates with existing data for validation
      const merged = { ...existing, ...updates };
      
      // Auto-validate if enabled
      if (this.options.autoValidate) {
        const validation = validationService.validateTransaction(merged);
        if (!validation.isValid) {
          return {
            success: false,
            error: 'Validation failed',
            message: validation.errors.map(e => e.message).join(', '),
          };
        }
      }

      // Sanitize updates
      const sanitizedUpdates = validationService.sanitizeTransactionInput(updates);
      
      // Round amount to cents if provided
      if (sanitizedUpdates.amount) {
        sanitizedUpdates.amount = currencyService.roundAmount(sanitizedUpdates.amount);
      }

      // Update transaction using base service
      const transaction = await baseTransactionService.update(id, sanitizedUpdates);
      
      // Clear relevant cache entries
      this.clearCachePattern('transactions_');
      this.clearCachePattern('summary_');
      this.clearCachePattern('stats_');

      return {
        success: true,
        data: transaction,
        message: 'Transaction updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update transaction',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete transaction with cascade handling
   */
  async deleteTransaction(id: string): Promise<ApiResponse<boolean>> {
    try {
      const result = await baseTransactionService.delete(id);
      
      if (result) {
        // Clear relevant cache entries
        this.clearCachePattern('transactions_');
        this.clearCachePattern('summary_');
        this.clearCachePattern('stats_');
      }

      return {
        success: result,
        data: result,
        message: result ? 'Transaction deleted successfully' : 'Transaction not found',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete transaction',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get transactions with enhanced filtering and formatting
   */
  async getTransactions(
    filter: PeriodFilter = { type: 'month' },
    includeFormatted: boolean = true
  ): Promise<ApiResponse<Array<Transaction & { formatted?: any }>>> {
    try {
      const cacheKey = `transactions_${JSON.stringify(filter)}_${includeFormatted}`;
      
      // Check cache first
      if (this.options.enableCaching) {
        const cached = this.getFromCache(cacheKey);
        if (cached) {
          return { success: true, data: cached };
        }
      }

      // Get all transactions
      const allTransactions = this.options.useMockData 
        ? mockDataService.generateMockTransactions(30)
        : await baseTransactionService.getAll();

      // Apply date range filter
      const dateRange = this.getDateRangeFromFilter(filter);
      const filteredTransactions = allTransactions.filter(t =>
        t.date >= dateRange.startDate && t.date <= dateRange.endDate
      );

      // Add formatted data if requested
      let result: Array<Transaction & { formatted?: any }> = filteredTransactions;
      
      if (includeFormatted && this.options.autoFormat) {
        result = filteredTransactions.map(transaction => ({
          ...transaction,
          formatted: {
            amount: currencyService.formatTransactionAmount(
              transaction.amount,
              transaction.type
            ),
            date: format(transaction.date, 'MMM dd, yyyy'),
            time: format(transaction.date, 'HH:mm'),
          },
        }));
      }

      // Cache result
      if (this.options.enableCaching) {
        this.setCache(cacheKey, result);
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get transactions',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get spending summary for a specific period (matching SwiftUI targets)
   */
  async getSpendingSummary(
    period: TimePeriod = 'month'
  ): Promise<ApiResponse<TransactionSummary>> {
    try {
      const cacheKey = `summary_${period}`;
      
      // Check cache first
      if (this.options.enableCaching) {
        const cached = this.getFromCache(cacheKey);
        if (cached) {
          return { success: true, data: cached };
        }
      }

      let transactions: Transaction[];
      let categories: Category[];

      if (this.options.useMockData) {
        // Use mock data with exact target amounts
        const mockData = mockDataService.getMockDataForPeriod(period);
        const spendingData = mockData.spendingData;
        
        const dateRange = this.getDateRangeFromFilter({ type: period });
        
        const summary: TransactionSummary = {
          period,
          dateRange,
          totalTransactions: mockData.transactions.length,
          totalIncome: spendingData.totalIncome,
          totalExpenses: spendingData.totalExpenses,
          netIncome: spendingData.netIncome,
          averageDaily: spendingData.dailyAverage,
          formattedSummary: currencyService.formatSpendingSummary(
            spendingData.totalIncome,
            spendingData.totalExpenses
          ),
          spendingData,
        };

        // Cache result
        if (this.options.enableCaching) {
          this.setCache(cacheKey, summary);
        }

        return {
          success: true,
          data: summary,
        };
      } else {
        // Use real data
        transactions = await baseTransactionService.getAll();
        categories = await baseCategoryService.getAll();

        const filter: PeriodFilter = { type: period };
        const spendingResponse = await dataAggregationService.calculateSpendingData(
          transactions,
          categories,
          filter
        );

        if (!spendingResponse.success) {
          return spendingResponse as any;
        }

        const spendingData = spendingResponse.data!;
        const dateRange = this.getDateRangeFromFilter(filter);

        const summary: TransactionSummary = {
          period,
          dateRange,
          totalTransactions: transactions.length,
          totalIncome: spendingData.totalIncome,
          totalExpenses: spendingData.totalExpenses,
          netIncome: spendingData.netIncome,
          averageDaily: spendingData.dailyAverage,
          formattedSummary: currencyService.formatSpendingSummary(
            spendingData.totalIncome,
            spendingData.totalExpenses
          ),
          spendingData,
        };

        // Cache result
        if (this.options.enableCaching) {
          this.setCache(cacheKey, summary);
        }

        return {
          success: true,
          data: summary,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get spending summary',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get quick stats for dashboard (matching SwiftUI target amounts)
   */
  async getQuickStats(): Promise<ApiResponse<QuickStats>> {
    try {
      const cacheKey = 'stats_quick';
      
      // Check cache first
      if (this.options.enableCaching) {
        const cached = this.getFromCache(cacheKey);
        if (cached) {
          return { success: true, data: cached };
        }
      }

      if (this.options.useMockData) {
        // Use exact target amounts from mock data
        const todayData = mockDataService.getMockDataForPeriod('day');
        const weekData = mockDataService.getMockDataForPeriod('week');
        const monthData = mockDataService.getMockDataForPeriod('month');

        const stats: QuickStats = {
          today: {
            amount: todayData.summary.totalExpenses,
            formatted: currencyService.formatAmount(todayData.summary.totalExpenses),
            transactionCount: todayData.transactions.length,
          },
          thisWeek: {
            amount: weekData.summary.totalExpenses,
            formatted: currencyService.formatAmount(weekData.summary.totalExpenses),
            transactionCount: weekData.transactions.length,
          },
          thisMonth: {
            amount: monthData.summary.totalExpenses,
            formatted: currencyService.formatAmount(monthData.summary.totalExpenses),
            transactionCount: monthData.transactions.length,
          },
          lastUpdated: new Date(),
        };

        // Cache result
        if (this.options.enableCaching) {
          this.setCache(cacheKey, stats);
        }

        return {
          success: true,
          data: stats,
        };
      } else {
        // Calculate from real data
        const transactions = await baseTransactionService.getAll();
        const now = new Date();

        const todayTransactions = transactions.filter(t =>
          t.date >= startOfDay(now) && 
          t.date <= endOfDay(now) &&
          t.type === 'expense'
        );

        const weekTransactions = transactions.filter(t =>
          t.date >= startOfWeek(now) && 
          t.date <= endOfWeek(now) &&
          t.type === 'expense'
        );

        const monthTransactions = transactions.filter(t =>
          t.date >= startOfMonth(now) && 
          t.date <= endOfMonth(now) &&
          t.type === 'expense'
        );

        const todayAmount = todayTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const weekAmount = weekTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const monthAmount = monthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const stats: QuickStats = {
          today: {
            amount: todayAmount,
            formatted: currencyService.formatAmount(todayAmount),
            transactionCount: todayTransactions.length,
          },
          thisWeek: {
            amount: weekAmount,
            formatted: currencyService.formatAmount(weekAmount),
            transactionCount: weekTransactions.length,
          },
          thisMonth: {
            amount: monthAmount,
            formatted: currencyService.formatAmount(monthAmount),
            transactionCount: monthTransactions.length,
          },
          lastUpdated: new Date(),
        };

        // Cache result
        if (this.options.enableCaching) {
          this.setCache(cacheKey, stats);
        }

        return {
          success: true,
          data: stats,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get quick stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Search transactions with enhanced filtering
   */
  async searchTransactions(
    query: SearchQuery
  ): Promise<ApiResponse<SearchResult<Transaction>>> {
    try {
      const startTime = Date.now();
      
      // Get all transactions
      const allTransactions = this.options.useMockData 
        ? mockDataService.generateMockTransactions(90) // More data for search
        : await baseTransactionService.getAll();

      let filteredTransactions = allTransactions;

      // Apply text search
      if (query.text) {
        const searchTerm = query.text.toLowerCase();
        filteredTransactions = filteredTransactions.filter(t =>
          t.description.toLowerCase().includes(searchTerm) ||
          t.category.toLowerCase().includes(searchTerm)
        );
      }

      // Apply date range filter
      if (query.dateRange) {
        filteredTransactions = filteredTransactions.filter(t =>
          t.date >= query.dateRange!.startDate && 
          t.date <= query.dateRange!.endDate
        );
      }

      // Apply category filter
      if (query.categories && query.categories.length > 0) {
        filteredTransactions = filteredTransactions.filter(t =>
          query.categories!.includes(t.category)
        );
      }

      // Apply account filter
      if (query.accounts && query.accounts.length > 0) {
        filteredTransactions = filteredTransactions.filter(t =>
          query.accounts!.includes(t.accountId)
        );
      }

      // Apply transaction type filter
      if (query.transactionTypes && query.transactionTypes.length > 0) {
        filteredTransactions = filteredTransactions.filter(t =>
          query.transactionTypes!.includes(t.type)
        );
      }

      // Apply amount range filter
      if (query.amountRange) {
        filteredTransactions = filteredTransactions.filter(t => {
          const amount = Math.abs(t.amount);
          const min = query.amountRange!.min || 0;
          const max = query.amountRange!.max || Infinity;
          return amount >= min && amount <= max;
        });
      }

      // Apply receipt filter
      if (query.hasReceipt !== undefined) {
        filteredTransactions = filteredTransactions.filter(t =>
          query.hasReceipt ? !!t.receiptId : !t.receiptId
        );
      }

      // Apply sorting
      const sortBy = query.sortBy || 'date';
      const sortOrder = query.sortOrder || 'desc';
      
      filteredTransactions.sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'date':
            comparison = a.date.getTime() - b.date.getTime();
            break;
          case 'amount':
            comparison = Math.abs(a.amount) - Math.abs(b.amount);
            break;
          case 'category':
            comparison = a.category.localeCompare(b.category);
            break;
          case 'description':
            comparison = a.description.localeCompare(b.description);
            break;
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
      });

      // Apply pagination
      const offset = query.offset || 0;
      const limit = query.limit || 50;
      const totalCount = filteredTransactions.length;
      const items = filteredTransactions.slice(offset, offset + limit);

      const result: SearchResult<Transaction> = {
        items,
        totalCount,
        hasMore: offset + limit < totalCount,
        query,
        executedAt: new Date(),
        executionTime: Date.now() - startTime,
      };

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to search transactions',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate transaction data
   */
  validateTransaction(input: Partial<CreateTransactionInput>): ValidationResult {
    return validationService.validateTransaction(input);
  }

  /**
   * Initialize mock data
   */
  async initializeMockData(): Promise<ApiResponse<boolean>> {
    try {
      const mockData = await mockDataService.initializeMockData();
      
      // Store mock data in AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(mockData.transactions));
      await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(mockData.categories));
      await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(mockData.accounts));
      await AsyncStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(mockData.receipts));

      // Clear cache
      this.clearCache();

      return {
        success: true,
        data: true,
        message: 'Mock data initialized successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to initialize mock data',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Clear all data and cache
   */
  async clearAllData(): Promise<ApiResponse<boolean>> {
    try {
      await baseTransactionService.deleteAll();
      this.clearCache();

      return {
        success: true,
        data: true,
        message: 'All data cleared successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to clear data',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Private helper methods

  private getDateRangeFromFilter(filter: PeriodFilter): DateRange {
    const now = new Date();
    const offset = filter.offset || 0;

    if (filter.startDate && filter.endDate) {
      return {
        startDate: filter.startDate,
        endDate: filter.endDate,
        period: filter.type === 'custom' ? 'custom' : filter.type,
      };
    }

    switch (filter.type) {
      case 'day':
        const day = subDays(now, offset);
        return {
          startDate: startOfDay(day),
          endDate: endOfDay(day),
          period: 'custom',
        };
      case 'week':
        const week = subWeeks(now, offset);
        return {
          startDate: startOfWeek(week),
          endDate: endOfWeek(week),
          period: 'week',
        };
      case 'month':
        const month = subMonths(now, offset);
        return {
          startDate: startOfMonth(month),
          endDate: endOfMonth(month),
          period: 'month',
        };
      default:
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now),
          period: 'month',
        };
    }
  }

  private getFromCache(key: string): any {
    if (!this.options.enableCaching) return null;
    
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache(key: string, data: any): void {
    if (!this.options.enableCaching) return;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private clearCache(): void {
    this.cache.clear();
  }

  private clearCachePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get service configuration
   */
  getConfiguration(): TransactionServiceOptions {
    return { ...this.options };
  }

  /**
   * Update service configuration
   */
  updateConfiguration(options: Partial<TransactionServiceOptions>): void {
    this.options = { ...this.options, ...options };
    
    // Clear cache if caching was disabled
    if (options.enableCaching === false) {
      this.clearCache();
    }
  }
}

// Export singleton instance
export const enhancedTransactionService = EnhancedTransactionService.getInstance();
export default enhancedTransactionService;