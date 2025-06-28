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
    // Initialize mock categories
    this.categories = [
      {
        id: "cat-1",
        name: "Food & Dining",
        color: "#FF6B6B",
        type: "expense",
        createdAt: new Date("2024-01-01"),
      },
      {
        id: "cat-2",
        name: "Transportation",
        color: "#4ECDC4",
        type: "expense",
        createdAt: new Date("2024-01-01"),
      },
      {
        id: "cat-3",
        name: "Shopping",
        color: "#45B7D1",
        type: "expense",
        createdAt: new Date("2024-01-01"),
      },
      {
        id: "cat-4",
        name: "Entertainment",
        color: "#96CEB4",
        type: "expense",
        createdAt: new Date("2024-01-01"),
      },
      {
        id: "cat-5",
        name: "Bills & Utilities",
        color: "#FFEAA7",
        type: "expense",
        createdAt: new Date("2024-01-01"),
      },
      {
        id: "cat-6",
        name: "Salary",
        color: "#00B894",
        type: "income",
        createdAt: new Date("2024-01-01"),
      },
    ];

    // Initialize mock account
    this.accounts = [
      {
        id: "acc-1",
        name: "RBC Checking",
        type: "checking",
        balance: 5000.0,
        currency: "CAD",
        isActive: true,
        createdAt: new Date("2024-01-01"),
      },
    ];

    // Initialize mock transactions
    this.transactions = [
      {
        id: "trans-1",
        amount: 4.5,
        date: new Date(),
        category: "Food & Dining",
        description: "Coffee Shop",
        type: "expense",
        accountId: "acc-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "trans-2",
        amount: 3500.0,
        date: new Date(Date.now() - 86400000),
        category: "Salary",
        description: "Monthly Salary",
        type: "income",
        accountId: "acc-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "trans-3",
        amount: 45.2,
        date: new Date(Date.now() - 172800000),
        category: "Transportation",
        description: "Gas Station",
        type: "expense",
        accountId: "acc-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "trans-4",
        amount: 89.99,
        date: new Date(Date.now() - 259200000),
        category: "Shopping",
        description: "Online Purchase",
        type: "expense",
        accountId: "acc-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "trans-5",
        amount: 125.0,
        date: new Date(Date.now() - 345600000),
        category: "Bills & Utilities",
        description: "Electricity Bill",
        type: "expense",
        accountId: "acc-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
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
}

// Export singleton instance for backward compatibility
export const mockDataService = MockDataService.getInstance();
