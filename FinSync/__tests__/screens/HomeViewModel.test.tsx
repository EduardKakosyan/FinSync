import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useHomeViewModel } from "../../src/screens/home/HomeViewModel";
import {
  SpendingData,
  CategorySpending,
  Transaction,
  DateRange,
} from "../../src/types";

// Mock data service
const mockDataService = {
  fetchSpendingData: jest.fn(),
  fetchRecentTransactions: jest.fn(),
  fetchCategoryBreakdown: jest.fn(),
};

const mockSpendingData: SpendingData = {
  totalIncome: 5000.0,
  totalExpenses: 2750.5,
  netIncome: 2249.5,
  categoryBreakdown: [],
  monthlyTrend: [],
  dailyAverage: 91.68,
  topCategories: [],
  period: {
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-01-31"),
    period: "month",
  },
};

const mockCategoryBreakdown: CategorySpending[] = [
  {
    categoryId: "cat-1",
    categoryName: "Food & Dining",
    categoryColor: "#FF6B6B",
    amount: 850.0,
    percentage: 30.9,
    transactionCount: 24,
    trend: "up",
    budgetLimit: 1000.0,
    budgetUsed: 850.0,
    previousPeriodAmount: 720.0,
  },
];

const mockRecentTransactions: Transaction[] = [
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
];

describe("HomeViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDataService.fetchSpendingData.mockResolvedValue(mockSpendingData);
    mockDataService.fetchRecentTransactions.mockResolvedValue(
      mockRecentTransactions
    );
    mockDataService.fetchCategoryBreakdown.mockResolvedValue(
      mockCategoryBreakdown
    );
  });

  describe("Initial State", () => {
    it("should have correct default values", () => {
      const { result } = renderHook(() => useHomeViewModel(mockDataService));

      expect(result.current.selectedPeriod).toBe("week");
      expect(result.current.spendingData).toBeNull();
      expect(result.current.recentTransactions).toEqual([]);
      expect(result.current.categoryBreakdown).toEqual([]);
      expect(result.current.isLoading).toBe(true); // Loading starts immediately
      expect(result.current.isRefreshing).toBe(false);
      expect(result.current.errorMessage).toBeNull();
    });

    it("should load data on mount", async () => {
      const { result } = renderHook(() => useHomeViewModel(mockDataService));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockDataService.fetchSpendingData).toHaveBeenCalledWith(
        expect.objectContaining({
          period: "week",
        })
      );
      expect(mockDataService.fetchRecentTransactions).toHaveBeenCalledWith(5);
      expect(mockDataService.fetchCategoryBreakdown).toHaveBeenCalledWith(
        expect.objectContaining({
          period: "week",
        })
      );
    });
  });

  describe("Period Selection", () => {
    it("should update selected period and reload data", async () => {
      const { result } = renderHook(() => useHomeViewModel(mockDataService));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.changePeriod("month");
      });

      expect(result.current.selectedPeriod).toBe("month");

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockDataService.fetchSpendingData).toHaveBeenCalledWith(
        expect.objectContaining({
          period: "month",
        })
      );
    });

    it("should not reload data if same period is selected", async () => {
      const { result } = renderHook(() => useHomeViewModel(mockDataService));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCallCount =
        mockDataService.fetchSpendingData.mock.calls.length;

      act(() => {
        result.current.changePeriod("week"); // Same as default
      });

      expect(mockDataService.fetchSpendingData).toHaveBeenCalledTimes(
        initialCallCount
      );
    });

    it("should generate correct date range for day period", async () => {
      const { result } = renderHook(() => useHomeViewModel(mockDataService));

      act(() => {
        result.current.changePeriod("day");
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const lastCall = mockDataService.fetchSpendingData.mock.calls[
        mockDataService.fetchSpendingData.mock.calls.length - 1
      ][0] as DateRange;

      expect(lastCall.period).toBe("custom");

      // Check that it's today's range (start of day to now)
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);

      expect(lastCall.startDate.getTime()).toBe(startOfDay.getTime());
    });
  });

  describe("Data Loading", () => {
    it("should handle successful data loading", async () => {
      const { result } = renderHook(() => useHomeViewModel(mockDataService));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.spendingData).toEqual(mockSpendingData);
      expect(result.current.recentTransactions).toEqual(mockRecentTransactions);
      expect(result.current.categoryBreakdown).toEqual(mockCategoryBreakdown);
      expect(result.current.errorMessage).toBeNull();
    });

    it("should handle loading errors", async () => {
      const errorMessage = "Network error";
      mockDataService.fetchSpendingData.mockRejectedValue(
        new Error(errorMessage)
      );

      const { result } = renderHook(() => useHomeViewModel(mockDataService));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.errorMessage).toBe("Failed to load spending data");
      expect(result.current.spendingData).toBeNull();
    });

    it("should set loading state correctly during data fetch", async () => {
      const { result } = renderHook(() => useHomeViewModel(mockDataService));

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("Refresh Functionality", () => {
    it("should set refreshing state during refresh", async () => {
      const { result } = renderHook(() => useHomeViewModel(mockDataService));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.refresh();
      });

      expect(result.current.isRefreshing).toBe(true);

      await waitFor(() => {
        expect(result.current.isRefreshing).toBe(false);
      });
    });

    it("should reload data when refresh is called", async () => {
      const { result } = renderHook(() => useHomeViewModel(mockDataService));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCallCount =
        mockDataService.fetchSpendingData.mock.calls.length;

      act(() => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.isRefreshing).toBe(false);
      });

      expect(mockDataService.fetchSpendingData).toHaveBeenCalledTimes(
        initialCallCount + 1
      );
    });
  });

  describe("Time Period Edge Cases", () => {
    it("should handle rapid period changes without race conditions", async () => {
      const { result } = renderHook(() => useHomeViewModel(mockDataService));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Test individual period changes work correctly
      act(() => {
        result.current.changePeriod("day");
      });
      expect(result.current.selectedPeriod).toBe("day");

      act(() => {
        result.current.changePeriod("month");
      });
      expect(result.current.selectedPeriod).toBe("month");

      act(() => {
        result.current.changePeriod("week");
      });
      expect(result.current.selectedPeriod).toBe("week");

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should generate correct date ranges for all periods", async () => {
      const { result } = renderHook(() => useHomeViewModel(mockDataService));

      // Test week period
      act(() => {
        result.current.changePeriod("week");
      });

      await waitFor(() => {
        expect(mockDataService.fetchSpendingData).toHaveBeenCalledWith(
          expect.objectContaining({
            period: "week",
          })
        );
      });

      // Test month period
      act(() => {
        result.current.changePeriod("month");
      });

      await waitFor(() => {
        expect(mockDataService.fetchSpendingData).toHaveBeenCalledWith(
          expect.objectContaining({
            period: "month",
          })
        );
      });
    });

    it("should not cause infinite re-renders", async () => {
      const { result } = renderHook(() => useHomeViewModel(mockDataService));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const callCountAfterMount =
        mockDataService.fetchSpendingData.mock.calls.length;

      // Wait a bit to ensure no additional calls
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockDataService.fetchSpendingData).toHaveBeenCalledTimes(
        callCountAfterMount
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle concurrent period changes", async () => {
      const { result } = renderHook(() => useHomeViewModel(mockDataService));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.changePeriod("day");
        result.current.changePeriod("month");
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.selectedPeriod).toBe("month");
    });

    it("should handle empty data responses", async () => {
      mockDataService.fetchSpendingData.mockResolvedValue({
        ...mockSpendingData,
        totalExpenses: 0,
        categoryBreakdown: [],
        topCategories: [],
      });
      mockDataService.fetchRecentTransactions.mockResolvedValue([]);
      mockDataService.fetchCategoryBreakdown.mockResolvedValue([]);

      const { result } = renderHook(() => useHomeViewModel(mockDataService));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.spendingData?.totalExpenses).toBe(0);
      expect(result.current.recentTransactions).toEqual([]);
      expect(result.current.categoryBreakdown).toEqual([]);
    });
  });
});
