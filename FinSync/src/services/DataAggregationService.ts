/**
 * Data Aggregation Service for FinSync Financial App
 * Handles spending totals, category breakdowns, and period-based analytics
 * Supports Day/Week/Month filtering and comprehensive financial insights
 */

import {
  Transaction,
  Category,
  SpendingData,
  CategorySpending,
  MonthlySpending,
  DailySpending,
  WeeklySpending,
  DateRange,
  FinancialSummary,
  BudgetSummary,
  ApiResponse,
} from '../types';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  startOfQuarter,
  endOfQuarter,
  subDays,
  subWeeks,
  subMonths,
  addDays,
  format,
  isWithinInterval,
  differenceInDays,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  getWeek,
  isSameDay,
  isSameMonth,
} from 'date-fns';

export type TimePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface PeriodFilter {
  type: TimePeriod;
  startDate?: Date;
  endDate?: Date;
  offset?: number; // For getting previous periods (e.g., last month = offset: 1)
}

export interface CategoryAnalytics {
  categorySpending: CategorySpending[];
  topCategories: CategorySpending[];
  categoryTrends: Array<{
    categoryId: string;
    categoryName: string;
    currentPeriod: number;
    previousPeriod: number;
    trend: 'up' | 'down' | 'stable';
    percentageChange: number;
  }>;
  budgetAnalysis: BudgetSummary[];
}

export interface SpendingInsights {
  averageDaily: number;
  averageWeekly: number;
  averageMonthly: number;
  peakSpendingDay: string;
  peakSpendingCategory: string;
  spendingVelocity: 'increasing' | 'decreasing' | 'stable';
  unusualTransactions: Transaction[];
  savingsRate: number;
  burnRate: number; // Days until money runs out at current spending rate
}

export class DataAggregationService {
  private static instance: DataAggregationService;

  private constructor() {}

  public static getInstance(): DataAggregationService {
    if (!DataAggregationService.instance) {
      DataAggregationService.instance = new DataAggregationService();
    }
    return DataAggregationService.instance;
  }

  /**
   * Calculate spending data for a specific period
   */
  async calculateSpendingData(
    transactions: Transaction[],
    categories: Category[],
    filter: PeriodFilter
  ): Promise<ApiResponse<SpendingData>> {
    try {
      const dateRange = this.getDateRangeFromFilter(filter);
      const filteredTransactions = this.filterTransactionsByDateRange(transactions, dateRange);
      
      const totalIncome = this.calculateTotalIncome(filteredTransactions);
      const totalExpenses = this.calculateTotalExpenses(filteredTransactions);
      const netIncome = totalIncome - totalExpenses;

      const categoryBreakdown = this.calculateCategoryBreakdown(
        filteredTransactions,
        categories,
        totalExpenses
      );

      const monthlyTrend = await this.calculateMonthlyTrend(
        transactions,
        categories,
        dateRange
      );

      const dailyAverage = this.calculateDailyAverage(filteredTransactions, dateRange);
      const topCategories = categoryBreakdown
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      const spendingData: SpendingData = {
        totalIncome,
        totalExpenses,
        netIncome,
        categoryBreakdown,
        monthlyTrend,
        dailyAverage,
        topCategories,
        period: dateRange,
      };

      return {
        success: true,
        data: spendingData,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to calculate spending data',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get spending data for current day
   */
  async getDailySpendingData(
    transactions: Transaction[],
    categories: Category[],
    date: Date = new Date()
  ): Promise<ApiResponse<SpendingData>> {
    const filter: PeriodFilter = {
      type: 'day',
      startDate: startOfDay(date),
      endDate: endOfDay(date),
    };

    return this.calculateSpendingData(transactions, categories, filter);
  }

  /**
   * Get spending data for current week
   */
  async getWeeklySpendingData(
    transactions: Transaction[],
    categories: Category[],
    date: Date = new Date()
  ): Promise<ApiResponse<SpendingData>> {
    const filter: PeriodFilter = {
      type: 'week',
      startDate: startOfWeek(date),
      endDate: endOfWeek(date),
    };

    return this.calculateSpendingData(transactions, categories, filter);
  }

  /**
   * Get spending data for current month
   */
  async getMonthlySpendingData(
    transactions: Transaction[],
    categories: Category[],
    date: Date = new Date()
  ): Promise<ApiResponse<SpendingData>> {
    const filter: PeriodFilter = {
      type: 'month',
      startDate: startOfMonth(date),
      endDate: endOfMonth(date),
    };

    return this.calculateSpendingData(transactions, categories, filter);
  }

  /**
   * Calculate category analytics with trends and budget analysis
   */
  async calculateCategoryAnalytics(
    transactions: Transaction[],
    categories: Category[],
    filter: PeriodFilter
  ): Promise<ApiResponse<CategoryAnalytics>> {
    try {
      const dateRange = this.getDateRangeFromFilter(filter);
      const currentTransactions = this.filterTransactionsByDateRange(transactions, dateRange);
      
      // Get previous period for comparison
      const previousDateRange = this.getPreviousPeriodDateRange(dateRange);
      const previousTransactions = this.filterTransactionsByDateRange(transactions, previousDateRange);

      const totalCurrentExpenses = this.calculateTotalExpenses(currentTransactions);
      const totalPreviousExpenses = this.calculateTotalExpenses(previousTransactions);

      const categorySpending = this.calculateCategoryBreakdown(
        currentTransactions,
        categories,
        totalCurrentExpenses
      );

      const topCategories = categorySpending
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      const categoryTrends = this.calculateCategoryTrends(
        currentTransactions,
        previousTransactions,
        categories
      );

      const budgetAnalysis = this.calculateBudgetAnalysis(
        categorySpending,
        categories,
        dateRange
      );

      const analytics: CategoryAnalytics = {
        categorySpending,
        topCategories,
        categoryTrends,
        budgetAnalysis,
      };

      return {
        success: true,
        data: analytics,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to calculate category analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate daily spending breakdown for a period
   */
  async generateDailyBreakdown(
    transactions: Transaction[],
    categories: Category[],
    filter: PeriodFilter
  ): Promise<ApiResponse<DailySpending[]>> {
    try {
      const dateRange = this.getDateRangeFromFilter(filter);
      const days = eachDayOfInterval({ start: dateRange.startDate, end: dateRange.endDate });
      
      const dailyBreakdown: DailySpending[] = days.map(day => {
        const dayTransactions = transactions.filter(t =>
          isSameDay(t.date, day)
        );

        const income = this.calculateTotalIncome(dayTransactions);
        const expenses = this.calculateTotalExpenses(dayTransactions);
        const primaryCategory = this.getPrimaryCategoryForDay(dayTransactions, categories);

        return {
          date: format(day, 'yyyy-MM-dd'),
          income,
          expenses,
          net: income - expenses,
          transactionCount: dayTransactions.length,
          primaryCategory,
        };
      });

      return {
        success: true,
        data: dailyBreakdown,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to generate daily breakdown',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate weekly spending breakdown for a period
   */
  async generateWeeklyBreakdown(
    transactions: Transaction[],
    categories: Category[],
    filter: PeriodFilter
  ): Promise<ApiResponse<WeeklySpending[]>> {
    try {
      const dateRange = this.getDateRangeFromFilter(filter);
      const weeks = eachWeekOfInterval({ start: dateRange.startDate, end: dateRange.endDate });
      
      const weeklyBreakdown: WeeklySpending[] = [];

      for (const weekStart of weeks) {
        const weekEnd = endOfWeek(weekStart);
        const weekTransactions = transactions.filter(t =>
          isWithinInterval(t.date, { start: weekStart, end: weekEnd })
        );

        const income = this.calculateTotalIncome(weekTransactions);
        const expenses = this.calculateTotalExpenses(weekTransactions);

        // Generate daily breakdown for the week
        const dailyBreakdownResponse = await this.generateDailyBreakdown(
          weekTransactions,
          categories,
          { type: 'custom', startDate: weekStart, endDate: weekEnd }
        );

        const dailyBreakdown = dailyBreakdownResponse.success 
          ? dailyBreakdownResponse.data! 
          : [];

        weeklyBreakdown.push({
          weekStart,
          weekEnd,
          weekNumber: getWeek(weekStart),
          income,
          expenses,
          net: income - expenses,
          dailyBreakdown,
          averageDaily: expenses / 7,
        });
      }

      return {
        success: true,
        data: weeklyBreakdown,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to generate weekly breakdown',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Calculate spending insights and patterns
   */
  async calculateSpendingInsights(
    transactions: Transaction[],
    categories: Category[],
    currentBalance: number = 0
  ): Promise<ApiResponse<SpendingInsights>> {
    try {
      // Calculate averages
      const last30Days = subDays(new Date(), 30);
      const recentTransactions = transactions.filter(t => t.date >= last30Days);
      
      const totalExpenses = this.calculateTotalExpenses(recentTransactions);
      const totalIncome = this.calculateTotalIncome(recentTransactions);
      
      const averageDaily = totalExpenses / 30;
      const averageWeekly = averageDaily * 7;
      const averageMonthly = averageDaily * 30;

      // Find peak spending day and category
      const peakSpendingDay = this.findPeakSpendingDay(recentTransactions);
      const peakSpendingCategory = this.findPeakSpendingCategory(recentTransactions, categories);

      // Calculate spending velocity
      const spendingVelocity = this.calculateSpendingVelocity(transactions);

      // Find unusual transactions
      const unusualTransactions = this.findUnusualTransactions(recentTransactions);

      // Calculate financial metrics
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
      const burnRate = averageDaily > 0 ? Math.floor(currentBalance / averageDaily) : Infinity;

      const insights: SpendingInsights = {
        averageDaily,
        averageWeekly,
        averageMonthly,
        peakSpendingDay,
        peakSpendingCategory,
        spendingVelocity,
        unusualTransactions,
        savingsRate,
        burnRate,
      };

      return {
        success: true,
        data: insights,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to calculate spending insights',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Compare spending between two periods
   */
  async compareSpendingPeriods(
    transactions: Transaction[],
    categories: Category[],
    currentFilter: PeriodFilter,
    comparisonFilter: PeriodFilter
  ): Promise<ApiResponse<{
    current: SpendingData;
    comparison: SpendingData;
    changes: {
      totalExpensesChange: number;
      totalIncomeChange: number;
      netIncomeChange: number;
      categoryChanges: Array<{
        categoryId: string;
        categoryName: string;
        currentAmount: number;
        comparisonAmount: number;
        change: number;
        percentageChange: number;
      }>;
    };
  }>> {
    try {
      const currentResponse = await this.calculateSpendingData(transactions, categories, currentFilter);
      const comparisonResponse = await this.calculateSpendingData(transactions, categories, comparisonFilter);

      if (!currentResponse.success || !comparisonResponse.success) {
        return {
          success: false,
          error: 'Failed to calculate spending data for comparison',
        };
      }

      const current = currentResponse.data!;
      const comparison = comparisonResponse.data!;

      // Calculate changes
      const totalExpensesChange = current.totalExpenses - comparison.totalExpenses;
      const totalIncomeChange = current.totalIncome - comparison.totalIncome;
      const netIncomeChange = current.netIncome - comparison.netIncome;

      // Calculate category changes
      const categoryChanges = current.categoryBreakdown.map(currentCat => {
        const comparisonCat = comparison.categoryBreakdown.find(
          c => c.categoryId === currentCat.categoryId
        );
        const comparisonAmount = comparisonCat?.amount || 0;
        const change = currentCat.amount - comparisonAmount;
        const percentageChange = comparisonAmount > 0 
          ? (change / comparisonAmount) * 100 
          : 0;

        return {
          categoryId: currentCat.categoryId,
          categoryName: currentCat.categoryName,
          currentAmount: currentCat.amount,
          comparisonAmount,
          change,
          percentageChange,
        };
      });

      return {
        success: true,
        data: {
          current,
          comparison,
          changes: {
            totalExpensesChange,
            totalIncomeChange,
            netIncomeChange,
            categoryChanges,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to compare spending periods',
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
          period: 'day',
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
      case 'quarter':
        const quarter = subMonths(now, offset * 3);
        return {
          startDate: startOfQuarter(quarter),
          endDate: endOfQuarter(quarter),
          period: 'quarter',
        };
      case 'year':
        const year = subMonths(now, offset * 12);
        return {
          startDate: startOfYear(year),
          endDate: endOfYear(year),
          period: 'year',
        };
      default:
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now),
          period: 'month',
        };
    }
  }

  private getPreviousPeriodDateRange(dateRange: DateRange): DateRange {
    const daysDiff = differenceInDays(dateRange.endDate, dateRange.startDate) + 1;
    
    return {
      startDate: subDays(dateRange.startDate, daysDiff),
      endDate: subDays(dateRange.endDate, daysDiff),
      period: dateRange.period,
    };
  }

  private filterTransactionsByDateRange(transactions: Transaction[], dateRange: DateRange): Transaction[] {
    return transactions.filter(transaction =>
      isWithinInterval(transaction.date, {
        start: dateRange.startDate,
        end: dateRange.endDate,
      })
    );
  }

  private calculateTotalIncome(transactions: Transaction[]): number {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  private calculateTotalExpenses(transactions: Transaction[]): number {
    return Math.abs(
      transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
    );
  }

  private calculateCategoryBreakdown(
    transactions: Transaction[],
    categories: Category[],
    totalExpenses: number
  ): CategorySpending[] {
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const categoryMap = new Map<string, { amount: number; count: number }>();

    expenseTransactions.forEach(transaction => {
      const existing = categoryMap.get(transaction.category) || { amount: 0, count: 0 };
      categoryMap.set(transaction.category, {
        amount: existing.amount + Math.abs(transaction.amount),
        count: existing.count + 1,
      });
    });

    return Array.from(categoryMap.entries()).map(([categoryId, data]) => {
      const category = categories.find(c => c.id === categoryId || c.name === categoryId);
      const percentage = totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0;

      return {
        categoryId,
        categoryName: category?.name || categoryId,
        categoryColor: category?.color || '#007AFF',
        amount: data.amount,
        percentage,
        transactionCount: data.count,
        budgetLimit: category?.budgetLimit,
        budgetUsed: category?.budgetLimit ? (data.amount / category.budgetLimit) * 100 : undefined,
        trend: 'stable', // Would need historical data for real trend calculation
      };
    }).sort((a, b) => b.amount - a.amount);
  }

  private async calculateMonthlyTrend(
    transactions: Transaction[],
    categories: Category[],
    dateRange: DateRange
  ): Promise<MonthlySpending[]> {
    const months = eachMonthOfInterval({
      start: subMonths(dateRange.startDate, 5), // Last 6 months
      end: dateRange.endDate,
    });

    return months.map(month => {
      const monthTransactions = transactions.filter(t =>
        isSameMonth(t.date, month)
      );

      const totalIncome = this.calculateTotalIncome(monthTransactions);
      const totalExpenses = this.calculateTotalExpenses(monthTransactions);
      const savings = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

      // Find top category for the month
      const categoryBreakdown = this.calculateCategoryBreakdown(
        monthTransactions,
        categories,
        totalExpenses
      );
      const topCategory = categoryBreakdown[0]?.categoryName || '';

      return {
        month: format(month, 'yyyy-MM'),
        year: month.getFullYear(),
        monthName: format(month, 'MMMM'),
        totalIncome,
        totalExpenses,
        netIncome: totalIncome - totalExpenses,
        transactionCount: monthTransactions.length,
        topCategory,
        savings,
        savingsRate,
      };
    });
  }

  private calculateDailyAverage(transactions: Transaction[], dateRange: DateRange): number {
    const expenses = this.calculateTotalExpenses(transactions);
    const days = differenceInDays(dateRange.endDate, dateRange.startDate) + 1;
    return days > 0 ? expenses / days : 0;
  }

  private calculateCategoryTrends(
    currentTransactions: Transaction[],
    previousTransactions: Transaction[],
    categories: Category[]
  ) {
    const currentExpenses = this.calculateTotalExpenses(currentTransactions);
    const previousExpenses = this.calculateTotalExpenses(previousTransactions);

    const currentBreakdown = this.calculateCategoryBreakdown(
      currentTransactions,
      categories,
      currentExpenses
    );

    const previousBreakdown = this.calculateCategoryBreakdown(
      previousTransactions,
      categories,
      previousExpenses
    );

    return currentBreakdown.map(current => {
      const previous = previousBreakdown.find(p => p.categoryId === current.categoryId);
      const previousAmount = previous?.amount || 0;
      const change = current.amount - previousAmount;
      const percentageChange = previousAmount > 0 ? (change / previousAmount) * 100 : 0;

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (Math.abs(percentageChange) > 5) {
        trend = change > 0 ? 'up' : 'down';
      }

      return {
        categoryId: current.categoryId,
        categoryName: current.categoryName,
        currentPeriod: current.amount,
        previousPeriod: previousAmount,
        trend,
        percentageChange,
      };
    });
  }

  private calculateBudgetAnalysis(
    categorySpending: CategorySpending[],
    categories: Category[],
    dateRange: DateRange
  ): BudgetSummary[] {
    return categorySpending
      .filter(spending => {
        const category = categories.find(c => c.id === spending.categoryId);
        return category?.budgetLimit;
      })
      .map(spending => {
        const category = categories.find(c => c.id === spending.categoryId);
        const budgetAmount = category!.budgetLimit!;
        const spentAmount = spending.amount;
        const remainingAmount = budgetAmount - spentAmount;
        const utilizationPercentage = (spentAmount / budgetAmount) * 100;

        let status: 'under' | 'near' | 'over' | 'exceeded' = 'under';
        if (utilizationPercentage >= 100) {
          status = 'exceeded';
        } else if (utilizationPercentage >= 90) {
          status = 'over';
        } else if (utilizationPercentage >= 75) {
          status = 'near';
        }

        const daysInPeriod = differenceInDays(dateRange.endDate, dateRange.startDate) + 1;
        const dailySpendRate = spentAmount / daysInPeriod;
        const projectedTotal = dailySpendRate * 30; // Project to 30 days

        return {
          budgetId: `budget_${spending.categoryId}`,
          categoryId: spending.categoryId,
          categoryName: spending.categoryName,
          budgetAmount,
          spentAmount,
          remainingAmount,
          utilizationPercentage,
          status,
          daysRemaining: Math.max(0, Math.floor(remainingAmount / (dailySpendRate || 1))),
          projectedTotal,
          trend: 'stable', // Would need historical data
        };
      });
  }

  private getPrimaryCategoryForDay(transactions: Transaction[], categories: Category[]): string {
    if (transactions.length === 0) return '';

    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    if (expenseTransactions.length === 0) return '';

    // Find category with highest spending for the day
    const categoryTotals = expenseTransactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      return acc;
    }, {} as Record<string, number>);

    const topCategoryId = Object.keys(categoryTotals).reduce((a, b) =>
      categoryTotals[a] > categoryTotals[b] ? a : b
    );

    const category = categories.find(c => c.id === topCategoryId || c.name === topCategoryId);
    return category?.name || topCategoryId;
  }

  private findPeakSpendingDay(transactions: Transaction[]): string {
    const dailyTotals = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const day = format(t.date, 'yyyy-MM-dd');
        acc[day] = (acc[day] || 0) + Math.abs(t.amount);
        return acc;
      }, {} as Record<string, number>);

    const peakDay = Object.keys(dailyTotals).reduce((a, b) =>
      dailyTotals[a] > dailyTotals[b] ? a : b
    );

    return format(new Date(peakDay), 'EEEE'); // Return day name
  }

  private findPeakSpendingCategory(transactions: Transaction[], categories: Category[]): string {
    const categoryTotals = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
        return acc;
      }, {} as Record<string, number>);

    const topCategoryId = Object.keys(categoryTotals).reduce((a, b) =>
      categoryTotals[a] > categoryTotals[b] ? a : b
    );

    const category = categories.find(c => c.id === topCategoryId || c.name === topCategoryId);
    return category?.name || topCategoryId;
  }

  private calculateSpendingVelocity(transactions: Transaction[]): 'increasing' | 'decreasing' | 'stable' {
    const last30Days = subDays(new Date(), 30);
    const recent30 = transactions.filter(t => t.date >= last30Days && t.type === 'expense');
    const previous30 = transactions.filter(t => 
      t.date >= subDays(last30Days, 30) && 
      t.date < last30Days && 
      t.type === 'expense'
    );

    const recentTotal = recent30.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const previousTotal = previous30.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const change = recentTotal - previousTotal;
    const percentageChange = previousTotal > 0 ? (change / previousTotal) * 100 : 0;

    if (Math.abs(percentageChange) < 5) return 'stable';
    return change > 0 ? 'increasing' : 'decreasing';
  }

  private findUnusualTransactions(transactions: Transaction[]): Transaction[] {
    const amounts = transactions.map(t => Math.abs(t.amount));
    const mean = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const stdDev = Math.sqrt(
      amounts.reduce((sum, amt) => sum + Math.pow(amt - mean, 2), 0) / amounts.length
    );

    // Consider transactions more than 2 standard deviations from mean as unusual
    const threshold = mean + (2 * stdDev);

    return transactions.filter(t => Math.abs(t.amount) > threshold);
  }
}

// Export singleton instance
export const dataAggregationService = DataAggregationService.getInstance();
export default dataAggregationService;