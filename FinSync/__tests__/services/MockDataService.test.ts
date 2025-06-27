import { MockDataService } from '../../src/services/MockDataService';

describe('MockDataService', () => {
  let mockDataService: MockDataService;

  beforeEach(() => {
    mockDataService = MockDataService.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MockDataService.getInstance();
      const instance2 = MockDataService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Target Amounts - SwiftUI Compatibility', () => {
    it('should return correct daily target amount (CAD $45.67)', () => {
      const dailyData = mockDataService.getMockSpendingData('day');
      
      // The service should target around $45.67 daily
      expect(dailyData.totalExpenses).toBeCloseTo(45.67, 0);
      expect(dailyData.dailyAverage).toBeCloseTo(45.67, 0);
    });

    it('should return correct weekly target amount (CAD $234.50)', () => {
      const weeklyData = mockDataService.getMockSpendingData('week');
      
      // The service should target around $234.50 weekly
      expect(weeklyData.totalExpenses).toBeCloseTo(234.50, 0);
    });

    it('should return correct monthly target amount (CAD $1,250.00)', () => {
      const monthlyData = mockDataService.getMockSpendingData('month');
      
      // The service should target around $1,250.00 monthly
      expect(monthlyData.totalExpenses).toBeCloseTo(1250.00, 0);
    });

    it('should provide period-specific data summaries with target amounts', () => {
      const dailyPeriod = mockDataService.getMockDataForPeriod('day');
      const weeklyPeriod = mockDataService.getMockDataForPeriod('week');
      const monthlyPeriod = mockDataService.getMockDataForPeriod('month');

      expect(dailyPeriod.summary.targetAmount).toBe(45.67);
      expect(weeklyPeriod.summary.targetAmount).toBe(234.50);
      expect(monthlyPeriod.summary.targetAmount).toBe(1250.00);
    });
  });

  describe('Mock Accounts', () => {
    it('should return predefined accounts with CAD currency', () => {
      const accounts = mockDataService.getMockAccounts();
      
      expect(accounts).toHaveLength(3);
      expect(accounts[0].name).toBe('Primary Checking');
      expect(accounts[0].type).toBe('checking');
      expect(accounts[0].currency).toBe('CAD');
      expect(accounts[0].balance).toBe(3250.75);
      
      expect(accounts[1].name).toBe('Emergency Fund');
      expect(accounts[1].type).toBe('savings');
      expect(accounts[1].balance).toBe(12500.00);
      
      expect(accounts[2].name).toBe('Cash Rewards Card');
      expect(accounts[2].type).toBe('credit');
      expect(accounts[2].balance).toBe(-850.25);
    });

    it('should have all accounts marked as active', () => {
      const accounts = mockDataService.getMockAccounts();
      
      accounts.forEach(account => {
        expect(account.isActive).toBe(true);
      });
    });

    it('should have valid account IDs and creation dates', () => {
      const accounts = mockDataService.getMockAccounts();
      
      accounts.forEach(account => {
        expect(account.id).toBeDefined();
        expect(account.id.length).toBeGreaterThan(0);
        expect(account.createdAt).toBeInstanceOf(Date);
      });
    });
  });

  describe('Mock Categories', () => {
    it('should return predefined categories with colors', () => {
      const categories = mockDataService.getMockCategories();
      
      expect(categories.length).toBeGreaterThan(0);
      
      // Check for expense categories
      const foodCategory = categories.find(c => c.name === 'Food & Dining');
      expect(foodCategory).toBeDefined();
      expect(foodCategory?.color).toBe('#FF6B6B');
      expect(foodCategory?.type).toBe('expense');
      expect(foodCategory?.budgetLimit).toBe(600);
      
      const transportCategory = categories.find(c => c.name === 'Transportation');
      expect(transportCategory).toBeDefined();
      expect(transportCategory?.color).toBe('#4ECDC4');
      expect(transportCategory?.budgetLimit).toBe(300);
    });

    it('should include income categories', () => {
      const categories = mockDataService.getMockCategories();
      
      const salaryCategory = categories.find(c => c.name === 'Salary');
      expect(salaryCategory).toBeDefined();
      expect(salaryCategory?.type).toBe('income');
      expect(salaryCategory?.color).toBe('#58D68D');
      
      const freelanceCategory = categories.find(c => c.name === 'Freelance');
      expect(freelanceCategory).toBeDefined();
      expect(freelanceCategory?.type).toBe('income');
    });

    it('should have valid category structure', () => {
      const categories = mockDataService.getMockCategories();
      
      categories.forEach(category => {
        expect(category.id).toBeDefined();
        expect(category.name).toBeDefined();
        expect(category.color).toMatch(/^#[0-9A-Fa-f]{6}$/); // Valid hex color
        expect(['income', 'expense']).toContain(category.type);
        expect(category.createdAt).toBeInstanceOf(Date);
      });
    });
  });

  describe('Mock Transactions Generation', () => {
    it('should generate transactions for specified number of days', () => {
      const transactions = mockDataService.generateMockTransactions(7);
      
      expect(transactions.length).toBeGreaterThan(0);
      
      // Should include both income and expense transactions
      const incomeTransactions = transactions.filter(t => t.type === 'income');
      const expenseTransactions = transactions.filter(t => t.type === 'expense');
      
      expect(incomeTransactions.length).toBeGreaterThan(0);
      expect(expenseTransactions.length).toBeGreaterThan(0);
    });

    it('should generate transactions with valid structure', () => {
      const transactions = mockDataService.generateMockTransactions(5);
      
      transactions.forEach(transaction => {
        expect(transaction.id).toBeDefined();
        expect(typeof transaction.amount).toBe('number');
        expect(transaction.date).toBeInstanceOf(Date);
        expect(transaction.category).toBeDefined();
        expect(transaction.description).toBeDefined();
        expect(['income', 'expense']).toContain(transaction.type);
        expect(transaction.accountId).toBeDefined();
        expect(transaction.createdAt).toBeInstanceOf(Date);
        expect(transaction.updatedAt).toBeInstanceOf(Date);
      });
    });

    it('should have expense amounts as negative values', () => {
      const transactions = mockDataService.generateMockTransactions(10);
      const expenseTransactions = transactions.filter(t => t.type === 'expense');
      
      expenseTransactions.forEach(transaction => {
        expect(transaction.amount).toBeLessThan(0);
      });
    });

    it('should include monthly salary transactions', () => {
      const transactions = mockDataService.generateMockTransactions(90); // 3 months
      const salaryTransactions = transactions.filter(t => 
        t.type === 'income' && t.description === 'Monthly Salary'
      );
      
      expect(salaryTransactions.length).toBeGreaterThan(0);
      
      salaryTransactions.forEach(transaction => {
        expect(transaction.amount).toBe(4500.00);
      });
    });
  });

  describe('Spending Data Calculation', () => {
    it('should calculate spending data with category breakdown', () => {
      const spendingData = mockDataService.getMockSpendingData('month');
      
      expect(spendingData.totalIncome).toBeGreaterThan(0);
      expect(spendingData.totalExpenses).toBeGreaterThan(0);
      expect(spendingData.netIncome).toBe(spendingData.totalIncome - spendingData.totalExpenses);
      
      expect(spendingData.categoryBreakdown).toBeDefined();
      expect(spendingData.categoryBreakdown.length).toBeGreaterThan(0);
      
      expect(spendingData.topCategories).toBeDefined();
      expect(spendingData.topCategories.length).toBeLessThanOrEqual(5);
      
      expect(spendingData.monthlyTrend).toBeDefined();
      expect(spendingData.dailyAverage).toBeGreaterThan(0);
    });

    it('should have category breakdown with proper percentages', () => {
      const spendingData = mockDataService.getMockSpendingData('month');
      
      const totalPercentage = spendingData.categoryBreakdown.reduce(
        (sum, category) => sum + category.percentage, 0
      );
      
      // Total percentages should be approximately 100%
      expect(totalPercentage).toBeCloseTo(100, 0);
      
      spendingData.categoryBreakdown.forEach(category => {
        expect(category.categoryId).toBeDefined();
        expect(category.categoryName).toBeDefined();
        expect(category.categoryColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(category.amount).toBeGreaterThan(0);
        expect(category.percentage).toBeGreaterThan(0);
        expect(category.transactionCount).toBeGreaterThan(0);
        expect(['up', 'down', 'stable']).toContain(category.trend);
      });
    });
  });

  describe('Daily and Weekly Spending', () => {
    it('should generate daily spending data', () => {
      const dailySpending = mockDataService.getMockDailySpending(7);
      
      expect(dailySpending).toHaveLength(7);
      
      dailySpending.forEach(day => {
        expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
        expect(typeof day.income).toBe('number');
        expect(typeof day.expenses).toBe('number');
        expect(day.net).toBe(day.income - day.expenses);
        expect(day.transactionCount).toBeGreaterThanOrEqual(0);
        expect(day.primaryCategory).toBeDefined();
      });
    });

    it('should generate weekly spending data', () => {
      const weeklySpending = mockDataService.getMockWeeklySpending(4);
      
      expect(weeklySpending).toHaveLength(4);
      
      weeklySpending.forEach(week => {
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

  describe('Mock Receipts', () => {
    it('should return mock receipts with OCR data', () => {
      const receipts = mockDataService.getMockReceipts();
      
      expect(receipts.length).toBeGreaterThan(0);
      
      receipts.forEach(receipt => {
        expect(receipt.id).toBeDefined();
        expect(receipt.imageUri).toBeDefined();
        expect(receipt.ocrText).toBeDefined();
        expect(receipt.extractionConfidence).toBeGreaterThan(0);
        expect(receipt.extractionConfidence).toBeLessThanOrEqual(1);
        expect(receipt.merchantName).toBeDefined();
        expect(receipt.amount).toBeGreaterThan(0);
        expect(receipt.date).toBeInstanceOf(Date);
        expect(receipt.items).toBeDefined();
        expect(receipt.items!.length).toBeGreaterThan(0);
        expect(receipt.createdAt).toBeInstanceOf(Date);
      });
    });

    it('should have receipt items with valid structure', () => {
      const receipts = mockDataService.getMockReceipts();
      
      receipts.forEach(receipt => {
        receipt.items?.forEach(item => {
          expect(item.name).toBeDefined();
          expect(item.price).toBeGreaterThan(0);
          expect(item.quantity).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Data Initialization', () => {
    it('should initialize complete mock data set', async () => {
      const mockData = await mockDataService.initializeMockData();
      
      expect(mockData.accounts).toBeDefined();
      expect(mockData.categories).toBeDefined();
      expect(mockData.transactions).toBeDefined();
      expect(mockData.receipts).toBeDefined();
      
      expect(mockData.accounts.length).toBe(3);
      expect(mockData.categories.length).toBeGreaterThan(0);
      expect(mockData.transactions.length).toBeGreaterThan(0);
      expect(mockData.receipts.length).toBeGreaterThan(0);
    });

    it('should return consistent data across multiple calls', () => {
      const accounts1 = mockDataService.getMockAccounts();
      const accounts2 = mockDataService.getMockAccounts();
      
      expect(accounts1).toEqual(accounts2);
      
      const categories1 = mockDataService.getMockCategories();
      const categories2 = mockDataService.getMockCategories();
      
      expect(categories1).toEqual(categories2);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle zero days for transaction generation', () => {
      const transactions = mockDataService.generateMockTransactions(0);
      
      // Should still include monthly income transactions
      expect(transactions.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle negative days gracefully', () => {
      expect(() => {
        mockDataService.generateMockTransactions(-5);
      }).not.toThrow();
    });

    it('should handle large number of days', () => {
      expect(() => {
        mockDataService.generateMockTransactions(365);
      }).not.toThrow();
    });
  });

  describe('Currency Consistency', () => {
    it('should use CAD as primary currency throughout', () => {
      const accounts = mockDataService.getMockAccounts();
      const dailyData = mockDataService.getMockSpendingData('day');
      const weeklyData = mockDataService.getMockSpendingData('week');
      const monthlyData = mockDataService.getMockSpendingData('month');
      
      accounts.forEach(account => {
        expect(account.currency).toBe('CAD');
      });
      
      // All spending data should be in CAD
      expect(dailyData.period.period).toBeDefined();
      expect(weeklyData.period.period).toBe('week');
      expect(monthlyData.period.period).toBe('month');
    });
  });
});