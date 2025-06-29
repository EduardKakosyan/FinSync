import {
  Transaction,
  Category,
  SpendingData,
  CategorySpending,
  DateRange,
  Account,
  Receipt,
} from "../types";

export class MockDataService {
  private static instance: MockDataService;
  private transactions: Transaction[] = [];
  private categories: Category[] = [];
  private accounts: Account[] = [];
  private receipts: Receipt[] = [];

  constructor() {
    this.initializeMockData();
  }

  // Singleton pattern support for backward compatibility
  public static getInstance(): MockDataService {
    if (!MockDataService.instance) {
      MockDataService.instance = new MockDataService();
    }
    return MockDataService.instance;
  }

  // Reset singleton for testing
  public static resetInstance(): void {
    MockDataService.instance = new MockDataService();
  }

  private initializeMockData() {
    // Initialize with empty data for clean user experience
    this.categories = [];
    this.accounts = [];
    this.transactions = [];
  }

  async fetchSpendingData(period: DateRange): Promise<SpendingData> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate network delay

    const transactionsInPeriod = this.transactions.filter(
      (t) => t.date >= period.startDate && t.date <= period.endDate
    );

    const totalIncome = transactionsInPeriod
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactionsInPeriod
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const netIncome = totalIncome - totalExpenses;
    const dailyAverage =
      totalExpenses /
      Math.max(
        1,
        Math.ceil(
          (period.endDate.getTime() - period.startDate.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );

    return {
      totalIncome,
      totalExpenses,
      netIncome,
      categoryBreakdown: [],
      monthlyTrend: [],
      dailyAverage,
      topCategories: [],
      period,
    };
  }

  async fetchRecentTransactions(limit: number = 10): Promise<Transaction[]> {
    await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate network delay

    return this.transactions
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
  }

  async fetchCategoryBreakdown(period: DateRange): Promise<CategorySpending[]> {
    await new Promise((resolve) => setTimeout(resolve, 75)); // Simulate network delay

    const transactionsInPeriod = this.transactions.filter(
      (t) =>
        t.date >= period.startDate &&
        t.date <= period.endDate &&
        t.type === "expense"
    );

    const totalExpenses = transactionsInPeriod.reduce(
      (sum, t) => sum + t.amount,
      0
    );

    const categoryMap = new Map<string, CategorySpending>();

    transactionsInPeriod.forEach((transaction) => {
      const category = this.categories.find(
        (c) => c.name === transaction.category
      );
      if (!category) return;

      const existing = categoryMap.get(category.id) || {
        categoryId: category.id,
        categoryName: category.name,
        categoryColor: category.color,
        amount: 0,
        percentage: 0,
        transactionCount: 0,
        trend: "stable" as const,
      };

      existing.amount += transaction.amount;
      existing.transactionCount += 1;
      existing.percentage =
        totalExpenses > 0 ? (existing.amount / totalExpenses) * 100 : 0;

      categoryMap.set(category.id, existing);
    });

    return Array.from(categoryMap.values()).sort((a, b) => b.amount - a.amount);
  }

  async fetchTransactions(accountId?: string): Promise<Transaction[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (accountId) {
      return this.transactions.filter((t) => t.accountId === accountId);
    }
    return [...this.transactions];
  }

  async fetchCategories(): Promise<Category[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return [...this.categories];
  }

  async fetchAccounts(): Promise<Account[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return [...this.accounts];
  }

  async createTransaction(
    transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">
  ): Promise<Transaction> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const newTransaction: Transaction = {
      ...transaction,
      id: `trans-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.transactions.push(newTransaction);
    return newTransaction;
  }

  async updateTransaction(
    id: string,
    updates: Partial<Transaction>
  ): Promise<Transaction> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const index = this.transactions.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error("Transaction not found");
    }

    this.transactions[index] = {
      ...this.transactions[index],
      ...updates,
      updatedAt: new Date(),
    };

    return this.transactions[index];
  }

  async deleteTransaction(id: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const index = this.transactions.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error("Transaction not found");
    }

    this.transactions.splice(index, 1);
  }

  async createCategory(
    category: Omit<Category, "id" | "createdAt">
  ): Promise<Category> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const newCategory: Category = {
      ...category,
      id: `cat-${Date.now()}`,
      createdAt: new Date(),
    };

    this.categories.push(newCategory);
    return newCategory;
  }

  async fetchReceipts(): Promise<Receipt[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return [...this.receipts];
  }

  async createReceipt(
    receipt: Omit<Receipt, "id" | "createdAt">
  ): Promise<Receipt> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const newReceipt: Receipt = {
      ...receipt,
      id: `receipt-${Date.now()}`,
      createdAt: new Date(),
    };

    this.receipts.push(newReceipt);
    return newReceipt;
  }

  // Additional methods for compatibility with enhanced services
  generateMockTransactions(count = 50): Transaction[] {
    return this.transactions.slice(0, count);
  }

  getMockCategories(): Category[] {
    return this.categories;
  }

  getMockDataForPeriod(period: DateRange): { 
    transactions: Transaction[], 
    categories: Category[], 
    accounts: Account[] 
  } {
    const transactionsInPeriod = this.transactions.filter(
      (t) => t.date >= period.startDate && t.date <= period.endDate
    );
    
    return {
      transactions: transactionsInPeriod,
      categories: this.categories,
      accounts: this.accounts
    };
  }
}

// Export singleton instance for backward compatibility
export const mockDataService = MockDataService.getInstance();
