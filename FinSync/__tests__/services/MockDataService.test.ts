import { MockDataService } from "@/services/MockDataService";
import { DateRange } from "@/types";

describe("MockDataService", () => {
  let mockDataService: MockDataService;

  beforeEach(() => {
    mockDataService = MockDataService.getInstance();
    MockDataService.resetInstance(); // Ensure clean state for each test
  });

  describe("Initialization", () => {
    it("should initialize with mock data", async () => {
      const categories = await mockDataService.fetchCategories();
      const accounts = await mockDataService.fetchAccounts();
      const transactions = await mockDataService.fetchTransactions();

      expect(categories.length).toBeGreaterThan(0);
      expect(accounts.length).toBeGreaterThan(0);
      expect(transactions.length).toBeGreaterThan(0);
    });

    it("should have valid category structure", async () => {
      const categories = await mockDataService.fetchCategories();

      categories.forEach((category) => {
        expect(category).toHaveProperty("id");
        expect(category).toHaveProperty("name");
        expect(category).toHaveProperty("color");
        expect(category).toHaveProperty("type");
        expect(category).toHaveProperty("createdAt");
        expect(["income", "expense"]).toContain(category.type);
      });
    });

    it("should have valid account structure", async () => {
      const accounts = await mockDataService.fetchAccounts();

      accounts.forEach((account) => {
        expect(account).toHaveProperty("id");
        expect(account).toHaveProperty("name");
        expect(account).toHaveProperty("type");
        expect(account).toHaveProperty("balance");
        expect(account).toHaveProperty("currency");
        expect(account).toHaveProperty("isActive");
        expect(account.currency).toBe("CAD");
      });
    });
  });

  describe("Spending Data Fetching", () => {
    it("should fetch spending data for a given period", async () => {
      const period: DateRange = {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        period: "week",
      };

      const spendingData = await mockDataService.fetchSpendingData(period);

      expect(spendingData).toHaveProperty("totalIncome");
      expect(spendingData).toHaveProperty("totalExpenses");
      expect(spendingData).toHaveProperty("netIncome");
      expect(spendingData).toHaveProperty("dailyAverage");
      expect(spendingData).toHaveProperty("period");
      expect(spendingData.period).toEqual(period);
    });

    it("should calculate net income correctly", async () => {
      const period: DateRange = {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        period: "month",
      };

      const spendingData = await mockDataService.fetchSpendingData(period);

      expect(spendingData.netIncome).toBe(
        spendingData.totalIncome - spendingData.totalExpenses
      );
    });

    it("should calculate daily average correctly", async () => {
      const period: DateRange = {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        period: "week",
      };

      const spendingData = await mockDataService.fetchSpendingData(period);

      const expectedDays = Math.ceil(
        (period.endDate.getTime() - period.startDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const expectedAverage = spendingData.totalExpenses / expectedDays;

      expect(spendingData.dailyAverage).toBeCloseTo(expectedAverage, 2);
    });
  });

  describe("Recent Transactions Fetching", () => {
    it("should fetch recent transactions with default limit", async () => {
      const transactions = await mockDataService.fetchRecentTransactions();

      expect(Array.isArray(transactions)).toBe(true);
      expect(transactions.length).toBeLessThanOrEqual(10);
    });

    it("should fetch recent transactions with custom limit", async () => {
      const limit = 3;
      const transactions = await mockDataService.fetchRecentTransactions(limit);

      expect(transactions.length).toBeLessThanOrEqual(limit);
    });

    it("should return transactions sorted by date (newest first)", async () => {
      const transactions = await mockDataService.fetchRecentTransactions();

      if (transactions.length > 1) {
        for (let i = 1; i < transactions.length; i++) {
          expect(transactions[i - 1].date.getTime()).toBeGreaterThanOrEqual(
            transactions[i].date.getTime()
          );
        }
      }
    });
  });

  describe("Category Breakdown Fetching", () => {
    it("should fetch category breakdown for a given period", async () => {
      const period: DateRange = {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        period: "month",
      };

      const breakdown = await mockDataService.fetchCategoryBreakdown(period);

      expect(Array.isArray(breakdown)).toBe(true);

      breakdown.forEach((category) => {
        expect(category).toHaveProperty("categoryId");
        expect(category).toHaveProperty("categoryName");
        expect(category).toHaveProperty("categoryColor");
        expect(category).toHaveProperty("amount");
        expect(category).toHaveProperty("percentage");
        expect(category).toHaveProperty("transactionCount");
        expect(category).toHaveProperty("trend");
        expect(typeof category.amount).toBe("number");
        expect(typeof category.percentage).toBe("number");
        expect(["up", "down", "stable"]).toContain(category.trend);
      });
    });

    it("should calculate percentages correctly", async () => {
      const period: DateRange = {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        period: "month",
      };

      const breakdown = await mockDataService.fetchCategoryBreakdown(period);
      const totalPercentage = breakdown.reduce(
        (sum, cat) => sum + cat.percentage,
        0
      );

      if (breakdown.length > 0) {
        expect(totalPercentage).toBeCloseTo(100, 1);
      }
    });

    it("should sort categories by amount (highest first)", async () => {
      const period: DateRange = {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        period: "month",
      };

      const breakdown = await mockDataService.fetchCategoryBreakdown(period);

      if (breakdown.length > 1) {
        for (let i = 1; i < breakdown.length; i++) {
          expect(breakdown[i - 1].amount).toBeGreaterThanOrEqual(
            breakdown[i].amount
          );
        }
      }
    });
  });

  describe("CRUD Operations", () => {
    it("should create a new transaction", async () => {
      const newTransaction = {
        amount: 25.5,
        date: new Date(),
        category: "Food & Dining",
        description: "Test Transaction",
        type: "expense" as const,
        accountId: "acc-1",
      };

      const created = await mockDataService.createTransaction(newTransaction);

      expect(created).toHaveProperty("id");
      expect(created).toHaveProperty("createdAt");
      expect(created).toHaveProperty("updatedAt");
      expect(created.amount).toBe(newTransaction.amount);
      expect(created.description).toBe(newTransaction.description);
    });

    it("should update an existing transaction", async () => {
      const transactions = await mockDataService.fetchTransactions();
      const existingTransaction = transactions[0];

      const updates = {
        amount: 99.99,
        description: "Updated Description",
      };

      const updated = await mockDataService.updateTransaction(
        existingTransaction.id,
        updates
      );

      expect(updated.amount).toBe(updates.amount);
      expect(updated.description).toBe(updates.description);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        existingTransaction.updatedAt.getTime()
      );
    });

    it("should delete an existing transaction", async () => {
      const transactionsBefore = await mockDataService.fetchTransactions();
      const transactionToDelete = transactionsBefore[0];

      await mockDataService.deleteTransaction(transactionToDelete.id);

      const transactionsAfter = await mockDataService.fetchTransactions();
      expect(transactionsAfter.length).toBe(transactionsBefore.length - 1);
      expect(
        transactionsAfter.find((t) => t.id === transactionToDelete.id)
      ).toBeUndefined();
    });

    it("should throw error when updating non-existent transaction", async () => {
      await expect(
        mockDataService.updateTransaction("non-existent-id", { amount: 100 })
      ).rejects.toThrow("Transaction not found");
    });

    it("should throw error when deleting non-existent transaction", async () => {
      await expect(
        mockDataService.deleteTransaction("non-existent-id")
      ).rejects.toThrow("Transaction not found");
    });
  });

  describe("Performance and Async Behavior", () => {
    it("should simulate network delay", async () => {
      const startTime = Date.now();
      await mockDataService.fetchSpendingData({
        startDate: new Date(),
        endDate: new Date(),
        period: "day",
      });
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(90); // Account for 100ms delay
    });

    it("should handle concurrent requests", async () => {
      const promises = [
        mockDataService.fetchSpendingData({
          startDate: new Date(),
          endDate: new Date(),
          period: "day",
        }),
        mockDataService.fetchRecentTransactions(),
        mockDataService.fetchCategories(),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results[0]).toHaveProperty("totalIncome");
      expect(Array.isArray(results[1])).toBe(true);
      expect(Array.isArray(results[2])).toBe(true);
    });
  });
});
