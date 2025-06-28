import { useState, useEffect, useCallback } from "react";
import {
  SpendingData,
  CategorySpending,
  Transaction,
  DateRange,
} from "../../types";
import { MockDataService } from "../../services/MockDataService";

type TimePeriod = "day" | "week" | "month";

interface DataServiceProtocol {
  fetchSpendingData(period: DateRange): Promise<SpendingData>;
  fetchRecentTransactions(limit?: number): Promise<Transaction[]>;
  fetchCategoryBreakdown(period: DateRange): Promise<CategorySpending[]>;
}

export const useHomeViewModel = (dataService?: DataServiceProtocol) => {
  // Create stable dataService instance
  const [stableDataService] = useState<DataServiceProtocol>(
    () => dataService || new MockDataService()
  );
  const [spendingData, setSpendingData] = useState<SpendingData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("week");
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  );
  const [categoryBreakdown, setCategoryBreakdown] = useState<
    CategorySpending[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getDateRange = useCallback((period: TimePeriod): DateRange => {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case "day":
        startDate.setHours(0, 0, 0, 0);
        return {
          startDate,
          endDate: new Date(now.getTime()),
          period: "custom",
        };
      case "week":
        startDate.setDate(now.getDate() - 7);
        return {
          startDate,
          endDate: now,
          period: "week",
        };
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        return {
          startDate,
          endDate: now,
          period: "month",
        };
      default:
        return {
          startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          endDate: now,
          period: "week",
        };
    }
  }, []);

  const loadData = useCallback(
    async (refresh = false) => {
      try {
        setErrorMessage(null);
        if (refresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        const dateRange = getDateRange(selectedPeriod);

        const [spendingResult, transactionsResult, categoryResult] =
          await Promise.all([
            stableDataService.fetchSpendingData(dateRange),
            stableDataService.fetchRecentTransactions(5),
            stableDataService.fetchCategoryBreakdown(dateRange),
          ]);

        setSpendingData(spendingResult);
        setRecentTransactions(transactionsResult);
        setCategoryBreakdown(categoryResult);
      } catch (error) {
        console.error("Failed to load data:", error);
        setErrorMessage("Failed to load spending data");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedPeriod, stableDataService, getDateRange]
  );

  const changePeriod = useCallback(
    (newPeriod: TimePeriod) => {
      if (newPeriod !== selectedPeriod) {
        setSelectedPeriod(newPeriod);
      }
    },
    [selectedPeriod]
  );

  const refresh = useCallback(() => {
    loadData(true);
  }, [loadData]);

  // Load data when selectedPeriod changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    // State
    spendingData,
    selectedPeriod,
    recentTransactions,
    categoryBreakdown,
    isLoading,
    isRefreshing,
    errorMessage,

    // Actions
    changePeriod,
    refresh,
    loadData,
  };
};
