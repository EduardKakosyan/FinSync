import { DataAggregationService } from '../../src/services/DataAggregationService';
import { Transaction, Category } from '../../src/types';

describe('DataAggregationService', () => {
  let dataAggregationService: DataAggregationService;
  let mockTransactions: Transaction[];
  let mockCategories: Category[];

  beforeEach(() => {
    dataAggregationService = DataAggregationService.getInstance();
    
    // Create mock categories
    mockCategories = [
      {
        id: 'cat_food',
        name: 'Food & Dining',
        color: '#FF6B6B',
        type: 'expense',
        budgetLimit: 600,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: 'cat_transport',
        name: 'Transportation',
        color: '#4ECDC4',
        type: 'expense',
        budgetLimit: 300,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: 'cat_salary',
        name: 'Salary',
        color: '#58D68D',
        type: 'income',
        createdAt: new Date('2024-01-01'),
      },
    ];

    // Create mock transactions
    const baseDate = new Date('2024-01-15');
    mockTransactions = [
      // Income transactions
      {
        id: 'txn_1',
        amount: 4500.00,
        date: new Date('2024-01-01'),
        category: 'cat_salary',
        description: 'Monthly Salary',
        type: 'income',
        accountId: 'acc_1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      // Expense transactions
      {
        id: 'txn_2',
        amount: -150.75,
        date: new Date('2024-01-10'),
        category: 'cat_food',
        description: 'Grocery Shopping',
        type: 'expense',
        accountId: 'acc_1',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
      },
      {
        id: 'txn_3',
        amount: -50.25,
        date: new Date('2024-01-12'),
        category: 'cat_transport',
        description: 'Gas Station',
        type: 'expense',
        accountId: 'acc_1',
        createdAt: new Date('2024-01-12'),
        updatedAt: new Date('2024-01-12'),
      },
      {
        id: 'txn_4',
        amount: -25.50,
        date: new Date('2024-01-15'),
        category: 'cat_food',
        description: 'Coffee Shop',
        type: 'expense',
        accountId: 'acc_1',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      },
    ];
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = DataAggregationService.getInstance();
      const instance2 = DataAggregationService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('calculateSpendingData', () => {
    it('should calculate spending data for a month period', async () => {
      const filter = {
        type: 'month' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const result = await dataAggregationService.calculateSpendingData(
        mockTransactions,
        mockCategories,
        filter
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const data = result.data!;
      expect(data.totalIncome).toBe(4500.00);
      expect(data.totalExpenses).toBe(226.50); // 150.75 + 50.25 + 25.50
      expect(data.netIncome).toBe(4273.50); // 4500 - 226.50
      expect(data.categoryBreakdown).toHaveLength(2); // food and transport
      expect(data.topCategories.length).toBeLessThanOrEqual(5);
      expect(data.dailyAverage).toBeGreaterThan(0);
    });

    it('should handle empty transaction list', async () => {
      const filter = {
        type: 'month' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const result = await dataAggregationService.calculateSpendingData(
        [],
        mockCategories,
        filter
      );

      expect(result.success).toBe(true);
      expect(result.data!.totalIncome).toBe(0);
      expect(result.data!.totalExpenses).toBe(0);
      expect(result.data!.netIncome).toBe(0);
      expect(result.data!.categoryBreakdown).toHaveLength(0);
    });

    it('should filter transactions by date range correctly', async () => {
      const filter = {
        type: 'custom' as const,
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-14'),
      };

      const result = await dataAggregationService.calculateSpendingData(
        mockTransactions,
        mockCategories,
        filter
      );

      expect(result.success).toBe(true);
      const data = result.data!;
      
      // Should only include transactions from Jan 10-14
      expect(data.totalExpenses).toBe(201.00); // 150.75 + 50.25
      expect(data.totalIncome).toBe(0); // No income in this range
    });
  });

  describe('getDailySpendingData', () => {
    it('should calculate spending data for a specific day', async () => {
      const targetDate = new Date('2024-01-15');
      
      const result = await dataAggregationService.getDailySpendingData(
        mockTransactions,
        mockCategories,
        targetDate
      );

      expect(result.success).toBe(true);
      const data = result.data!;
      
      expect(data.totalExpenses).toBe(25.50); // Only coffee shop transaction
      expect(data.totalIncome).toBe(0);
      expect(data.netIncome).toBe(-25.50);
    });
  });

  describe('getWeeklySpendingData', () => {
    it('should calculate spending data for a week', async () => {
      const targetDate = new Date('2024-01-15');
      
      const result = await dataAggregationService.getWeeklySpendingData(
        mockTransactions,
        mockCategories,
        targetDate
      );

      expect(result.success).toBe(true);
      const data = result.data!;
      
      expect(data.totalExpenses).toBeGreaterThan(0);
      expect(data.period.period).toBe('week');
    });
  });

  describe('getMonthlySpendingData', () => {
    it('should calculate spending data for a month', async () => {
      const targetDate = new Date('2024-01-15');
      
      const result = await dataAggregationService.getMonthlySpendingData(
        mockTransactions,
        mockCategories,
        targetDate
      );

      expect(result.success).toBe(true);
      const data = result.data!;
      
      expect(data.totalIncome).toBe(4500.00);
      expect(data.totalExpenses).toBe(226.50);
      expect(data.period.period).toBe('month');
    });
  });

  describe('calculateCategoryAnalytics', () => {
    it('should calculate category analytics with trends', async () => {
      const filter = {
        type: 'month' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const result = await dataAggregationService.calculateCategoryAnalytics(
        mockTransactions,
        mockCategories,
        filter
      );

      expect(result.success).toBe(true);
      const data = result.data!;
      
      expect(data.categorySpending).toBeDefined();
      expect(data.topCategories).toBeDefined();
      expect(data.categoryTrends).toBeDefined();
      expect(data.budgetAnalysis).toBeDefined();

      // Check that categories with spending are included
      const foodCategory = data.categorySpending.find(c => c.categoryId === 'cat_food');
      expect(foodCategory).toBeDefined();
      expect(foodCategory!.amount).toBe(176.25); // 150.75 + 25.50

      const transportCategory = data.categorySpending.find(c => c.categoryId === 'cat_transport');
      expect(transportCategory).toBeDefined();
      expect(transportCategory!.amount).toBe(50.25);
    });

    it('should calculate budget analysis for categories with budgets', async () => {
      const filter = {
        type: 'month' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const result = await dataAggregationService.calculateCategoryAnalytics(
        mockTransactions,
        mockCategories,
        filter
      );

      expect(result.success).toBe(true);
      const data = result.data!;
      
      const budgetAnalysis = data.budgetAnalysis;
      expect(budgetAnalysis.length).toBeGreaterThan(0);

      const foodBudget = budgetAnalysis.find(b => b.categoryId === 'cat_food');
      expect(foodBudget).toBeDefined();
      expect(foodBudget!.budgetAmount).toBe(600);
      expect(foodBudget!.spentAmount).toBe(176.25);
      expect(foodBudget!.remainingAmount).toBe(423.75);
      expect(foodBudget!.utilizationPercentage).toBeCloseTo(29.375, 2);
      expect(foodBudget!.status).toBe('under');
    });
  });

  describe('generateDailyBreakdown', () => {
    it('should generate daily breakdown for a period', async () => {
      const filter = {
        type: 'custom' as const,
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-15'),
      };

      const result = await dataAggregationService.generateDailyBreakdown(
        mockTransactions,
        mockCategories,
        filter
      );

      expect(result.success).toBe(true);
      const data = result.data!;
      
      expect(data).toHaveLength(6); // 6 days inclusive
      
      data.forEach(day => {
        expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(typeof day.income).toBe('number');
        expect(typeof day.expenses).toBe('number');
        expect(day.net).toBe(day.income - day.expenses);
        expect(typeof day.transactionCount).toBe('number');
      });

      // Check specific dates have correct amounts
      const jan15 = data.find(d => d.date === '2024-01-15');
      expect(jan15!.expenses).toBe(25.50);
      expect(jan15!.transactionCount).toBe(1);
    });
  });

  describe('generateWeeklyBreakdown', () => {
    it('should generate weekly breakdown with daily details', async () => {
      const filter = {
        type: 'month' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const result = await dataAggregationService.generateWeeklyBreakdown(
        mockTransactions,
        mockCategories,
        filter
      );

      expect(result.success).toBe(true);
      const data = result.data!;
      
      expect(data.length).toBeGreaterThan(0);
      
      data.forEach(week => {
        expect(week.weekStart).toBeInstanceOf(Date);
        expect(week.weekEnd).toBeInstanceOf(Date);
        expect(week.weekNumber).toBeGreaterThan(0);
        expect(typeof week.income).toBe('number');
        expect(typeof week.expenses).toBe('number');
        expect(week.net).toBe(week.income - week.expenses);
        expect(week.dailyBreakdown).toHaveLength(7);
        expect(week.averageDaily).toBe(week.expenses / 7);
      });
    });
  });

  describe('calculateSpendingInsights', () => {
    it('should calculate comprehensive spending insights', async () => {
      const currentBalance = 5000;
      
      const result = await dataAggregationService.calculateSpendingInsights(
        mockTransactions,
        mockCategories,
        currentBalance
      );

      expect(result.success).toBe(true);
      const data = result.data!;
      
      expect(typeof data.averageDaily).toBe('number');
      expect(typeof data.averageWeekly).toBe('number');
      expect(typeof data.averageMonthly).toBe('number');
      expect(data.peakSpendingDay).toBeDefined();
      expect(data.peakSpendingCategory).toBeDefined();
      expect(['increasing', 'decreasing', 'stable']).toContain(data.spendingVelocity);
      expect(Array.isArray(data.unusualTransactions)).toBe(true);
      expect(typeof data.savingsRate).toBe('number');
      expect(typeof data.burnRate).toBe('number');
    });

    it('should calculate correct savings rate', async () => {
      const result = await dataAggregationService.calculateSpendingInsights(
        mockTransactions,
        mockCategories,
        1000
      );

      expect(result.success).toBe(true);
      const data = result.data!;
      
      // With income of 4500 and expenses of 226.50, savings rate should be high
      expect(data.savingsRate).toBeGreaterThan(90);
    });
  });

  describe('compareSpendingPeriods', () => {
    it('should compare spending between two periods', async () => {
      const currentFilter = {
        type: 'month' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const comparisonFilter = {
        type: 'month' as const,
        startDate: new Date('2023-12-01'),
        endDate: new Date('2023-12-31'),
      };

      const result = await dataAggregationService.compareSpendingPeriods(
        mockTransactions,
        mockCategories,
        currentFilter,
        comparisonFilter
      );

      expect(result.success).toBe(true);
      const data = result.data!;
      
      expect(data.current).toBeDefined();
      expect(data.comparison).toBeDefined();
      expect(data.changes).toBeDefined();
      
      expect(typeof data.changes.totalExpensesChange).toBe('number');
      expect(typeof data.changes.totalIncomeChange).toBe('number');
      expect(typeof data.changes.netIncomeChange).toBe('number');
      expect(Array.isArray(data.changes.categoryChanges)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid date ranges gracefully', async () => {
      const filter = {
        type: 'custom' as const,
        startDate: new Date('2024-01-31'),
        endDate: new Date('2024-01-01'), // End before start
      };

      const result = await dataAggregationService.calculateSpendingData(
        mockTransactions,
        mockCategories,
        filter
      );

      // Should still succeed but with empty results
      expect(result.success).toBe(true);
    });

    it('should handle missing categories gracefully', async () => {
      const filter = {
        type: 'month' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const result = await dataAggregationService.calculateSpendingData(
        mockTransactions,
        [], // Empty categories
        filter
      );

      expect(result.success).toBe(true);
      expect(result.data!.categoryBreakdown.length).toBeGreaterThan(0);
      
      // Categories should use transaction category IDs as names
      const breakdown = result.data!.categoryBreakdown;
      breakdown.forEach(category => {
        expect(category.categoryName).toBeDefined();
        expect(category.categoryColor).toBe('#007AFF'); // Default color
      });
    });
  });

  describe('Data Consistency', () => {
    it('should ensure category breakdown amounts sum to total expenses', async () => {
      const filter = {
        type: 'month' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const result = await dataAggregationService.calculateSpendingData(
        mockTransactions,
        mockCategories,
        filter
      );

      expect(result.success).toBe(true);
      const data = result.data!;
      
      const categoryTotal = data.categoryBreakdown.reduce(
        (sum, category) => sum + category.amount,
        0
      );
      
      expect(categoryTotal).toBeCloseTo(data.totalExpenses, 2);
    });

    it('should ensure percentages in category breakdown sum to 100%', async () => {
      const filter = {
        type: 'month' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const result = await dataAggregationService.calculateSpendingData(
        mockTransactions,
        mockCategories,
        filter
      );

      expect(result.success).toBe(true);
      const data = result.data!;
      
      if (data.categoryBreakdown.length > 0) {
        const totalPercentage = data.categoryBreakdown.reduce(
          (sum, category) => sum + category.percentage,
          0
        );
        
        expect(totalPercentage).toBeCloseTo(100, 1);
      }
    });

    it('should sort categories by amount in descending order', async () => {
      const filter = {
        type: 'month' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const result = await dataAggregationService.calculateSpendingData(
        mockTransactions,
        mockCategories,
        filter
      );

      expect(result.success).toBe(true);
      const data = result.data!;
      
      for (let i = 1; i < data.categoryBreakdown.length; i++) {
        expect(data.categoryBreakdown[i-1].amount)
          .toBeGreaterThanOrEqual(data.categoryBreakdown[i].amount);
      }
    });
  });
});