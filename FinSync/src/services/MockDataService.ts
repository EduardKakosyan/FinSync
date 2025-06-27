/**
 * Mock Data Service for FinSync Financial App
 * Provides mock data matching the SwiftUI version for development and testing
 * Target amounts: Daily CAD $45.67, Weekly CAD $234.50, Monthly CAD $1,250.00
 */

import {
  Transaction,
  Category,
  Account,
  Receipt,
  SpendingData,
  CategorySpending,
  MonthlySpending,
  DailySpending,
  WeeklySpending,
  DateRange,
  CreateTransactionInput,
  CreateCategoryInput,
  CreateAccountInput,
} from '../types';
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
  addDays,
  format,
  parseISO,
} from 'date-fns';

export class MockDataService {
  private static instance: MockDataService;
  private readonly baseDate = new Date(); // Current date as reference

  // Target amounts matching SwiftUI version
  private readonly TARGET_DAILY_AMOUNT = 45.67;
  private readonly TARGET_WEEKLY_AMOUNT = 234.50;
  private readonly TARGET_MONTHLY_AMOUNT = 1250.00;

  private constructor() {}

  public static getInstance(): MockDataService {
    if (!MockDataService.instance) {
      MockDataService.instance = new MockDataService();
    }
    return MockDataService.instance;
  }

  /**
   * Get mock accounts
   */
  getMockAccounts(): Account[] {
    return [
      {
        id: 'acc_primary',
        name: 'Primary Checking',
        type: 'checking',
        balance: 3250.75,
        currency: 'CAD',
        isActive: true,
        createdAt: subMonths(this.baseDate, 6),
      },
      {
        id: 'acc_savings',
        name: 'Emergency Fund',
        type: 'savings',
        balance: 12500.00,
        currency: 'CAD',
        isActive: true,
        createdAt: subMonths(this.baseDate, 8),
      },
      {
        id: 'acc_credit',
        name: 'Cash Rewards Card',
        type: 'credit',
        balance: -850.25,
        currency: 'CAD',
        isActive: true,
        createdAt: subMonths(this.baseDate, 4),
      },
    ];
  }

  /**
   * Get mock categories with colors
   */
  getMockCategories(): Category[] {
    return [
      // Expense Categories
      {
        id: 'cat_food',
        name: 'Food & Dining',
        color: '#FF6B6B',
        type: 'expense',
        budgetLimit: 600,
        createdAt: subMonths(this.baseDate, 12),
      },
      {
        id: 'cat_transport',
        name: 'Transportation',
        color: '#4ECDC4',
        type: 'expense',
        budgetLimit: 300,
        createdAt: subMonths(this.baseDate, 12),
      },
      {
        id: 'cat_shopping',
        name: 'Shopping',
        color: '#45B7D1',
        type: 'expense',
        budgetLimit: 400,
        createdAt: subMonths(this.baseDate, 12),
      },
      {
        id: 'cat_entertainment',
        name: 'Entertainment',
        color: '#96CEB4',
        type: 'expense',
        budgetLimit: 200,
        createdAt: subMonths(this.baseDate, 12),
      },
      {
        id: 'cat_utilities',
        name: 'Bills & Utilities',
        color: '#FFEAA7',
        type: 'expense',
        budgetLimit: 250,
        createdAt: subMonths(this.baseDate, 12),
      },
      {
        id: 'cat_healthcare',
        name: 'Healthcare',
        color: '#DDA0DD',
        type: 'expense',
        budgetLimit: 150,
        createdAt: subMonths(this.baseDate, 12),
      },
      {
        id: 'cat_education',
        name: 'Education',
        color: '#98D8C8',
        type: 'expense',
        createdAt: subMonths(this.baseDate, 12),
      },
      {
        id: 'cat_travel',
        name: 'Travel',
        color: '#F7DC6F',
        type: 'expense',
        createdAt: subMonths(this.baseDate, 12),
      },
      // Income Categories
      {
        id: 'cat_salary',
        name: 'Salary',
        color: '#58D68D',
        type: 'income',
        createdAt: subMonths(this.baseDate, 12),
      },
      {
        id: 'cat_freelance',
        name: 'Freelance',
        color: '#85C1E9',
        type: 'income',
        createdAt: subMonths(this.baseDate, 12),
      },
      {
        id: 'cat_investments',
        name: 'Investments',
        color: '#F8C471',
        type: 'income',
        createdAt: subMonths(this.baseDate, 12),
      },
    ];
  }

  /**
   * Generate mock transactions to achieve target spending amounts
   */
  generateMockTransactions(days: number = 30): Transaction[] {
    const transactions: Transaction[] = [];
    const categories = this.getMockCategories();
    const accounts = this.getMockAccounts();
    const primaryAccount = accounts[0];

    // Generate daily transactions to reach target amounts
    for (let i = 0; i < days; i++) {
      const date = subDays(this.baseDate, i);
      const dailyTransactions = this.generateDailyTransactions(date, categories, primaryAccount);
      transactions.push(...dailyTransactions);
    }

    // Add monthly salary
    const monthlyIncome = this.generateMonthlyIncome(categories, primaryAccount);
    transactions.push(...monthlyIncome);

    return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Generate daily transactions to reach target daily amount
   */
  private generateDailyTransactions(
    date: Date,
    categories: Category[],
    account: Account
  ): Transaction[] {
    const transactions: Transaction[] = [];
    const expenseCategories = categories.filter(c => c.type === 'expense');
    
    // Distribute daily target amount across categories
    const dailyExpenses = this.distributeDailyExpenses(expenseCategories);
    
    dailyExpenses.forEach((expense, index) => {
      if (expense.amount > 0) {
        transactions.push({
          id: `txn_${date.getTime()}_${index}`,
          amount: -expense.amount, // Negative for expenses
          date: new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000), // Random time within day
          category: expense.categoryId,
          description: expense.description,
          type: 'expense',
          accountId: account.id,
          createdAt: date,
          updatedAt: date,
        });
      }
    });

    return transactions;
  }

  /**
   * Distribute daily target amount across expense categories
   */
  private distributeDailyExpenses(categories: Category[]): Array<{
    categoryId: string;
    amount: number;
    description: string;
  }> {
    const expenseTemplates = [
      { categoryId: 'cat_food', descriptions: ['Coffee Shop', 'Lunch', 'Grocery Store', 'Restaurant', 'Fast Food'], weight: 0.35 },
      { categoryId: 'cat_transport', descriptions: ['Gas Station', 'Transit Pass', 'Parking', 'Uber/Taxi'], weight: 0.20 },
      { categoryId: 'cat_shopping', descriptions: ['Clothing Store', 'Online Purchase', 'Department Store', 'Pharmacy'], weight: 0.15 },
      { categoryId: 'cat_entertainment', descriptions: ['Movie Theater', 'Streaming Service', 'Concert', 'Gaming'], weight: 0.10 },
      { categoryId: 'cat_utilities', descriptions: ['Phone Bill', 'Internet', 'Electricity', 'Water'], weight: 0.08 },
      { categoryId: 'cat_healthcare', descriptions: ['Pharmacy', 'Doctor Visit', 'Gym Membership'], weight: 0.07 },
      { categoryId: 'cat_education', descriptions: ['Books', 'Online Course', 'Supplies'], weight: 0.03 },
      { categoryId: 'cat_travel', descriptions: ['Hotel', 'Flight', 'Travel Insurance'], weight: 0.02 },
    ];

    const expenses: Array<{ categoryId: string; amount: number; description: string }> = [];
    
    // Not every category every day - add some randomness
    const shouldIncludeCategory = (weight: number) => Math.random() < weight * 2; // Adjust probability

    expenseTemplates.forEach(template => {
      if (shouldIncludeCategory(template.weight)) {
        const amount = this.TARGET_DAILY_AMOUNT * template.weight * (0.5 + Math.random()); // Vary amounts
        const description = template.descriptions[Math.floor(Math.random() * template.descriptions.length)];
        
        expenses.push({
          categoryId: template.categoryId,
          amount: Math.round(amount * 100) / 100, // Round to cents
          description,
        });
      }
    });

    return expenses;
  }

  /**
   * Generate monthly income transactions
   */
  private generateMonthlyIncome(categories: Category[], account: Account): Transaction[] {
    const transactions: Transaction[] = [];
    const salaryCategory = categories.find(c => c.id === 'cat_salary');
    const freelanceCategory = categories.find(c => c.id === 'cat_freelance');
    
    // Monthly salary (1st of each month for last 3 months)
    for (let i = 0; i < 3; i++) {
      const salaryDate = subMonths(startOfMonth(this.baseDate), i);
      
      if (salaryCategory) {
        transactions.push({
          id: `txn_salary_${salaryDate.getTime()}`,
          amount: 4500.00, // Monthly salary
          date: addDays(salaryDate, 1), // 1st of month
          category: salaryCategory.id,
          description: 'Monthly Salary',
          type: 'income',
          accountId: account.id,
          createdAt: salaryDate,
          updatedAt: salaryDate,
        });
      }
    }

    // Occasional freelance income
    if (freelanceCategory) {
      transactions.push({
        id: `txn_freelance_${this.baseDate.getTime()}`,
        amount: 750.00,
        date: subDays(this.baseDate, 10),
        category: freelanceCategory.id,
        description: 'Freelance Project',
        type: 'income',
        accountId: account.id,
        createdAt: subDays(this.baseDate, 10),
        updatedAt: subDays(this.baseDate, 10),
      });
    }

    return transactions;
  }

  /**
   * Get mock spending data for different periods
   */
  getMockSpendingData(period: 'day' | 'week' | 'month'): SpendingData {
    const now = this.baseDate;
    let dateRange: DateRange;
    let targetAmount: number;

    switch (period) {
      case 'day':
        dateRange = {
          startDate: startOfDay(now),
          endDate: endOfDay(now),
          period: 'custom',
        };
        targetAmount = this.TARGET_DAILY_AMOUNT;
        break;
      case 'week':
        dateRange = {
          startDate: startOfWeek(now),
          endDate: endOfWeek(now),
          period: 'week',
        };
        targetAmount = this.TARGET_WEEKLY_AMOUNT;
        break;
      case 'month':
        dateRange = {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now),
          period: 'month',
        };
        targetAmount = this.TARGET_MONTHLY_AMOUNT;
        break;
    }

    return this.generateSpendingDataForPeriod(dateRange, targetAmount);
  }

  /**
   * Generate spending data for a specific period
   */
  private generateSpendingDataForPeriod(dateRange: DateRange, targetAmount: number): SpendingData {
    const categories = this.getMockCategories();
    const expenseCategories = categories.filter(c => c.type === 'expense');
    
    // Generate category breakdown
    const categoryBreakdown: CategorySpending[] = expenseCategories.map(category => {
      const weight = this.getCategoryWeight(category.id);
      const amount = targetAmount * weight;
      
      return {
        categoryId: category.id,
        categoryName: category.name,
        categoryColor: category.color,
        amount: Math.round(amount * 100) / 100,
        percentage: weight * 100,
        transactionCount: Math.floor(weight * 10) + 1,
        budgetLimit: category.budgetLimit,
        budgetUsed: category.budgetLimit ? (amount / category.budgetLimit) * 100 : undefined,
        trend: Math.random() > 0.5 ? 'up' : 'down',
        previousPeriodAmount: amount * (0.8 + Math.random() * 0.4), // ±20% variation
      };
    }).filter(cat => cat.amount > 0);

    // Sort by amount descending
    categoryBreakdown.sort((a, b) => b.amount - a.amount);

    const totalExpenses = categoryBreakdown.reduce((sum, cat) => sum + cat.amount, 0);
    const totalIncome = this.calculateIncomeForPeriod(dateRange);

    return {
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      categoryBreakdown,
      monthlyTrend: this.generateMonthlyTrend(dateRange),
      dailyAverage: this.TARGET_DAILY_AMOUNT,
      topCategories: categoryBreakdown.slice(0, 5),
      period: dateRange,
    };
  }

  /**
   * Get category weight for distribution
   */
  private getCategoryWeight(categoryId: string): number {
    const weights: Record<string, number> = {
      'cat_food': 0.35,
      'cat_transport': 0.20,
      'cat_shopping': 0.15,
      'cat_entertainment': 0.10,
      'cat_utilities': 0.08,
      'cat_healthcare': 0.07,
      'cat_education': 0.03,
      'cat_travel': 0.02,
    };
    return weights[categoryId] || 0;
  }

  /**
   * Calculate income for period
   */
  private calculateIncomeForPeriod(dateRange: DateRange): number {
    if (dateRange.period === 'month') {
      return 4500.00; // Monthly salary
    } else if (dateRange.period === 'week') {
      return 4500.00 / 4.33; // Weekly portion of monthly salary
    } else {
      return 4500.00 / 30; // Daily portion of monthly salary
    }
  }

  /**
   * Generate monthly trend data
   */
  private generateMonthlyTrend(dateRange: DateRange): MonthlySpending[] {
    const trends: MonthlySpending[] = [];
    
    for (let i = 0; i < 6; i++) {
      const monthDate = subMonths(this.baseDate, i);
      const monthlyAmount = this.TARGET_MONTHLY_AMOUNT * (0.8 + Math.random() * 0.4); // ±20% variation
      
      trends.push({
        month: format(monthDate, 'yyyy-MM'),
        year: monthDate.getFullYear(),
        monthName: format(monthDate, 'MMMM'),
        totalIncome: 4500.00,
        totalExpenses: monthlyAmount,
        netIncome: 4500.00 - monthlyAmount,
        transactionCount: Math.floor(monthlyAmount / this.TARGET_DAILY_AMOUNT) + Math.floor(Math.random() * 10),
        topCategory: 'Food & Dining',
        savings: 4500.00 - monthlyAmount,
        savingsRate: ((4500.00 - monthlyAmount) / 4500.00) * 100,
      });
    }

    return trends.reverse(); // Oldest first
  }

  /**
   * Get mock daily spending data
   */
  getMockDailySpending(days: number = 30): DailySpending[] {
    const dailyData: DailySpending[] = [];
    
    for (let i = 0; i < days; i++) {
      const date = subDays(this.baseDate, i);
      const dailyAmount = this.TARGET_DAILY_AMOUNT * (0.5 + Math.random()); // Vary daily amounts
      
      dailyData.push({
        date: format(date, 'yyyy-MM-dd'),
        income: i % 30 === 0 ? 4500.00 : 0, // Salary on 1st of month
        expenses: Math.round(dailyAmount * 100) / 100,
        net: (i % 30 === 0 ? 4500.00 : 0) - dailyAmount,
        transactionCount: Math.floor(Math.random() * 5) + 1,
        primaryCategory: 'Food & Dining',
      });
    }

    return dailyData.reverse(); // Oldest first
  }

  /**
   * Get mock weekly spending data
   */
  getMockWeeklySpending(weeks: number = 12): WeeklySpending[] {
    const weeklyData: WeeklySpending[] = [];
    
    for (let i = 0; i < weeks; i++) {
      const weekStart = startOfWeek(subWeeks(this.baseDate, i));
      const weekEnd = endOfWeek(subWeeks(this.baseDate, i));
      const weeklyAmount = this.TARGET_WEEKLY_AMOUNT * (0.8 + Math.random() * 0.4); // ±20% variation
      
      // Generate daily breakdown for the week
      const dailyBreakdown: DailySpending[] = [];
      for (let j = 0; j < 7; j++) {
        const dayDate = addDays(weekStart, j);
        const dayAmount = weeklyAmount / 7 * (0.5 + Math.random()); // Vary daily amounts
        
        dailyBreakdown.push({
          date: format(dayDate, 'yyyy-MM-dd'),
          income: 0,
          expenses: Math.round(dayAmount * 100) / 100,
          net: -dayAmount,
          transactionCount: Math.floor(Math.random() * 3) + 1,
          primaryCategory: 'Food & Dining',
        });
      }
      
      weeklyData.push({
        weekStart,
        weekEnd,
        weekNumber: i + 1,
        income: 4500.00 / 4.33, // Weekly portion of monthly salary
        expenses: weeklyAmount,
        net: (4500.00 / 4.33) - weeklyAmount,
        dailyBreakdown,
        averageDaily: weeklyAmount / 7,
      });
    }

    return weeklyData.reverse(); // Oldest first
  }

  /**
   * Get mock receipts
   */
  getMockReceipts(): Receipt[] {
    return [
      {
        id: 'receipt_1',
        imageUri: 'mock://receipt1.jpg',
        ocrText: 'STARBUCKS\nCoffee - $4.50\nTax - $0.17\nTotal - $4.67',
        extractionConfidence: 0.95,
        merchantName: 'Starbucks',
        amount: 4.67,
        date: subDays(this.baseDate, 1),
        items: [
          { name: 'Coffee', price: 4.50, quantity: 1 },
          { name: 'Tax', price: 0.17, quantity: 1 },
        ],
        transactionId: 'txn_receipt_1',
        createdAt: subDays(this.baseDate, 1),
      },
      {
        id: 'receipt_2',
        imageUri: 'mock://receipt2.jpg',
        ocrText: 'METRO GROCERY\nBread - $3.99\nMilk - $4.25\nTotal - $8.24',
        extractionConfidence: 0.88,
        merchantName: 'Metro',
        amount: 8.24,
        date: subDays(this.baseDate, 3),
        items: [
          { name: 'Bread', price: 3.99, quantity: 1 },
          { name: 'Milk', price: 4.25, quantity: 1 },
        ],
        transactionId: 'txn_receipt_2',
        createdAt: subDays(this.baseDate, 3),
      },
    ];
  }

  /**
   * Initialize mock data in storage
   */
  async initializeMockData(): Promise<{
    accounts: Account[];
    categories: Category[];
    transactions: Transaction[];
    receipts: Receipt[];
  }> {
    const accounts = this.getMockAccounts();
    const categories = this.getMockCategories();
    const transactions = this.generateMockTransactions(30);
    const receipts = this.getMockReceipts();

    return {
      accounts,
      categories,
      transactions,
      receipts,
    };
  }

  /**
   * Get mock data for specific time period with exact target amounts
   */
  getMockDataForPeriod(period: 'day' | 'week' | 'month') {
    const spendingData = this.getMockSpendingData(period);
    const transactions = this.generateMockTransactions(period === 'day' ? 1 : period === 'week' ? 7 : 30);
    
    return {
      spendingData,
      transactions: transactions.slice(0, period === 'day' ? 5 : period === 'week' ? 20 : 50),
      summary: {
        totalExpenses: spendingData.totalExpenses,
        totalIncome: spendingData.totalIncome,
        netIncome: spendingData.netIncome,
        period: period,
        targetAmount: period === 'day' ? this.TARGET_DAILY_AMOUNT : 
                     period === 'week' ? this.TARGET_WEEKLY_AMOUNT : 
                     this.TARGET_MONTHLY_AMOUNT,
      }
    };
  }
}

// Export singleton instance
export const mockDataService = MockDataService.getInstance();
export default mockDataService;