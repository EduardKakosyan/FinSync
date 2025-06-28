/**
 * Currency Service for FinSync Financial App
 * Enhanced CAD currency formatting and conversion utilities
 * Extends the basic currency utilities with additional business logic
 */

import {
  formatCurrency,
  formatTransactionAmount,
  formatAmountForInput,
  parseAmountFromInput,
  isValidAmountInput,
  convertCurrency,
  calculatePercentage,
  formatPercentage,
  calculateTotals,
  getAmountColor,
  formatLargeAmount,
  roundToCents,
  amountsEqual,
  generateAmountRanges,
  Currency,
} from "../utils/currencyUtils";
import { CURRENCIES } from "../constants";
import { ApiResponse } from "../types";

export interface CurrencyPreferences {
  primaryCurrency: Currency;
  secondaryCurrency?: Currency;
  showCurrencySymbol: boolean;
  showCurrencyCode: boolean;
  decimalPlaces: number;
  thousandsSeparator: string;
  decimalSeparator: string;
  symbolPosition: "before" | "after";
  negativeFormat: "parentheses" | "minus" | "red";
}

export interface ExchangeRate {
  from: Currency;
  to: Currency;
  rate: number;
  lastUpdated: Date;
  source: string;
}

export interface AmountDisplayOptions {
  showSign?: boolean;
  showCurrency?: boolean;
  showCode?: boolean;
  compact?: boolean;
  colorize?: boolean;
  precision?: number;
}

export interface BudgetDisplayInfo {
  amount: number;
  currency: Currency;
  status: "under" | "near" | "over" | "exceeded";
  percentage: number;
  remaining: number;
  formattedAmount: string;
  formattedRemaining: string;
  statusColor: string;
}

export class CurrencyService {
  private static instance: CurrencyService;
  private preferences: CurrencyPreferences = {
    primaryCurrency: "CAD",
    secondaryCurrency: "USD",
    showCurrencySymbol: true,
    showCurrencyCode: false,
    decimalPlaces: 2,
    thousandsSeparator: ",",
    decimalSeparator: ".",
    symbolPosition: "before",
    negativeFormat: "minus",
  };

  // Mock exchange rates - in production, these would come from a real API
  private exchangeRates: Map<string, ExchangeRate> = new Map([
    [
      "CAD_USD",
      {
        from: "CAD",
        to: "USD",
        rate: 0.75,
        lastUpdated: new Date(),
        source: "mock",
      },
    ],
    [
      "USD_CAD",
      {
        from: "USD",
        to: "CAD",
        rate: 1.33,
        lastUpdated: new Date(),
        source: "mock",
      },
    ],
  ]);

  private constructor() {}

  public static getInstance(): CurrencyService {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService();
    }
    return CurrencyService.instance;
  }

  /**
   * Format amount with enhanced options and preferences
   */
  formatAmount(
    amount: number,
    currency: Currency = this.preferences.primaryCurrency,
    options: AmountDisplayOptions = {}
  ): string {
    const {
      showSign = false,
      showCurrency = this.preferences.showCurrencySymbol,
      showCode = this.preferences.showCurrencyCode,
      compact = false,
      precision = this.preferences.decimalPlaces,
    } = options;

    if (compact && Math.abs(amount) >= 1000) {
      const absAmount = Math.abs(amount);
      const sign = showSign && amount >= 0 ? "+" : amount < 0 ? "-" : "";

      if (absAmount >= 1000000000) {
        return `${sign}${(absAmount / 1000000000).toFixed(1)}B`;
      } else if (absAmount >= 1000000) {
        return `${sign}${(absAmount / 1000000).toFixed(1)}M`;
      } else if (absAmount >= 1000) {
        return `${sign}${(absAmount / 1000).toFixed(1)}K`;
      }
    }

    let formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    }).format(Math.abs(amount));

    const sign = showSign && amount >= 0 ? "+" : amount < 0 ? "-" : "";
    return `${sign}$${formatted}`;
  }

  /**
   * Format transaction amount with type-specific styling
   */
  formatTransactionAmount(
    amount: number,
    type: "income" | "expense",
    currency: Currency = this.preferences.primaryCurrency,
    options: AmountDisplayOptions = {}
  ): {
    formatted: string;
    color: string;
    sign: "+" | "-";
  } {
    const { colorize = true } = options;

    const formatted = formatTransactionAmount(amount, type, currency);
    const sign = type === "income" ? "+" : "-";

    let color = "#000000"; // Default black
    if (colorize) {
      color = getAmountColor(amount, type, {
        income: "#34C759", // Green
        expense: "#FF3B30", // Red
        neutral: "#8E8E93", // Gray
      });
    }

    return {
      formatted,
      color,
      sign,
    };
  }

  /**
   * Format amount for budget display with status indicators
   */
  formatBudgetAmount(
    spent: number,
    budget: number,
    currency: Currency = this.preferences.primaryCurrency
  ): BudgetDisplayInfo {
    const percentage = budget > 0 ? (spent / budget) * 100 : 0;
    const remaining = Math.max(0, budget - spent);

    let status: "under" | "near" | "over" | "exceeded" = "under";
    let statusColor = "#34C759"; // Green

    if (percentage >= 100) {
      status = "exceeded";
      statusColor = "#FF3B30"; // Red
    } else if (percentage >= 90) {
      status = "over";
      statusColor = "#FF9500"; // Orange
    } else if (percentage >= 75) {
      status = "near";
      statusColor = "#FF9500"; // Orange
    }

    return {
      amount: spent,
      currency,
      status,
      percentage,
      remaining,
      formattedAmount: this.formatAmount(spent, currency),
      formattedRemaining: this.formatAmount(remaining, currency),
      statusColor,
    };
  }

  /**
   * Format spending summary for different periods
   */
  formatSpendingSummary(
    totalIncome: number,
    totalExpenses: number,
    currency: Currency = this.preferences.primaryCurrency
  ): {
    income: string;
    expenses: string;
    net: string;
    netColor: string;
    savingsRate: string;
    savingsRateColor: string;
  } {
    const netIncome = totalIncome - totalExpenses;
    const savingsRateValue =
      totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

    const netColor = netIncome >= 0 ? "#34C759" : "#FF3B30";
    const savingsRateColor =
      savingsRateValue >= 20
        ? "#34C759"
        : savingsRateValue >= 10
          ? "#FF9500"
          : "#FF3B30";

    return {
      income: this.formatAmount(totalIncome, currency),
      expenses: this.formatAmount(totalExpenses, currency),
      net: this.formatAmount(netIncome, currency, { showSign: true }),
      netColor,
      savingsRate: formatPercentage(savingsRateValue / 100),
      savingsRateColor,
    };
  }

  /**
   * Format amounts for comparison between periods
   */
  formatComparison(
    currentAmount: number,
    previousAmount: number,
    currency: Currency = this.preferences.primaryCurrency
  ): {
    current: string;
    previous: string;
    change: string;
    changePercentage: string;
    changeColor: string;
    trend: "up" | "down" | "stable";
  } {
    const change = currentAmount - previousAmount;
    const changePercentage =
      previousAmount !== 0 ? (change / Math.abs(previousAmount)) * 100 : 0;

    let trend: "up" | "down" | "stable" = "stable";
    let changeColor = "#8E8E93"; // Gray

    if (Math.abs(changePercentage) > 5) {
      if (change > 0) {
        trend = "up";
        changeColor = "#FF3B30"; // Red for increased spending
      } else {
        trend = "down";
        changeColor = "#34C759"; // Green for decreased spending
      }
    }

    return {
      current: this.formatAmount(currentAmount, currency),
      previous: this.formatAmount(previousAmount, currency),
      change: this.formatAmount(Math.abs(change), currency, { showSign: true }),
      changePercentage: formatPercentage(Math.abs(changePercentage) / 100),
      changeColor,
      trend,
    };
  }

  /**
   * Convert amount between currencies
   */
  async convertAmount(
    amount: number,
    fromCurrency: Currency,
    toCurrency: Currency
  ): Promise<
    ApiResponse<{
      originalAmount: number;
      convertedAmount: number;
      rate: number;
      fromCurrency: Currency;
      toCurrency: Currency;
      formattedOriginal: string;
      formattedConverted: string;
      lastUpdated: Date;
    }>
  > {
    try {
      if (fromCurrency === toCurrency) {
        return {
          success: true,
          data: {
            originalAmount: amount,
            convertedAmount: amount,
            rate: 1,
            fromCurrency,
            toCurrency,
            formattedOriginal: this.formatAmount(amount, fromCurrency),
            formattedConverted: this.formatAmount(amount, toCurrency),
            lastUpdated: new Date(),
          },
        };
      }

      const rateKey = `${fromCurrency}_${toCurrency}`;
      const exchangeRate = this.exchangeRates.get(rateKey);

      if (!exchangeRate) {
        return {
          success: false,
          error: "Exchange rate not available",
          message: `No exchange rate found for ${fromCurrency} to ${toCurrency}`,
        };
      }

      const convertedAmount = roundToCents(amount * exchangeRate.rate);

      return {
        success: true,
        data: {
          originalAmount: amount,
          convertedAmount,
          rate: exchangeRate.rate,
          fromCurrency,
          toCurrency,
          formattedOriginal: this.formatAmount(amount, fromCurrency),
          formattedConverted: this.formatAmount(convertedAmount, toCurrency),
          lastUpdated: exchangeRate.lastUpdated,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: "Currency conversion failed",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get currency symbol
   */
  getCurrencySymbol(currency: Currency): string {
    const symbols: Record<Currency, string> = {
      CAD: "$",
      USD: "$",
    };
    return symbols[currency] || "$";
  }

  /**
   * Get currency name
   */
  getCurrencyName(currency: Currency, plural: boolean = false): string {
    const names: Record<Currency, { singular: string; plural: string }> = {
      CAD: { singular: "Canadian Dollar", plural: "Canadian Dollars" },
      USD: { singular: "US Dollar", plural: "US Dollars" },
    };

    const currencyInfo = names[currency];
    return plural ? currencyInfo.plural : currencyInfo.singular;
  }

  /**
   * Validate and parse user input
   */
  parseUserInput(input: string): {
    isValid: boolean;
    amount: number;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!input || input.trim() === "") {
      errors.push("Amount is required");
      return { isValid: false, amount: 0, errors };
    }

    if (!isValidAmountInput(input)) {
      errors.push("Please enter a valid amount");
      return { isValid: false, amount: 0, errors };
    }

    const amount = parseAmountFromInput(input);

    if (amount <= 0) {
      errors.push("Amount must be greater than zero");
      return { isValid: false, amount: 0, errors };
    }

    if (amount > 1000000) {
      errors.push("Amount cannot exceed $1,000,000");
      return { isValid: false, amount: 0, errors };
    }

    return {
      isValid: true,
      amount: roundToCents(amount),
      errors: [],
    };
  }

  /**
   * Format input for display in input fields
   */
  formatForInput(amount: number): string {
    if (amount === 0) {
      return "0";
    }
    return formatAmountForInput(amount);
  }

  /**
   * Get amount ranges for filtering
   */
  getAmountRanges(
    currency: Currency = this.preferences.primaryCurrency
  ): Array<{
    label: string;
    min: number;
    max: number;
    formattedLabel: string;
  }> {
    const ranges = generateAmountRanges(currency);
    return ranges.map((range) => ({
      ...range,
      formattedLabel: range.label,
    }));
  }

  /**
   * Calculate and format percentage change
   */
  formatPercentageChange(
    current: number,
    previous: number,
    options: { showSign?: boolean; precision?: number } = {}
  ): {
    percentage: number;
    formatted: string;
    color: string;
    trend: "up" | "down" | "stable";
  } {
    const { showSign = true, precision = 1 } = options;

    const change = current - previous;
    const percentage = previous !== 0 ? (change / Math.abs(previous)) * 100 : 0;

    let trend: "up" | "down" | "stable" = "stable";
    let color = "#8E8E93"; // Gray

    if (Math.abs(percentage) > 1) {
      if (change > 0) {
        trend = "up";
        color = "#FF3B30"; // Red for increase (bad for expenses)
      } else {
        trend = "down";
        color = "#34C759"; // Green for decrease (good for expenses)
      }
    }

    const formattedPercentage = formatPercentage(Math.abs(percentage) / 100, {
      maximumFractionDigits: precision,
    });

    const sign = showSign ? (change >= 0 ? "+" : "-") : "";
    const formatted = `${sign}${formattedPercentage}`;

    return {
      percentage,
      formatted,
      color,
      trend,
    };
  }

  /**
   * Update currency preferences
   */
  updatePreferences(preferences: Partial<CurrencyPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences };
  }

  /**
   * Get current preferences
   */
  getPreferences(): CurrencyPreferences {
    return { ...this.preferences };
  }

  /**
   * Update exchange rates (mock implementation)
   */
  async updateExchangeRates(): Promise<ApiResponse<ExchangeRate[]>> {
    try {
      // In a real app, this would fetch from a currency API
      const mockRates: ExchangeRate[] = [
        {
          from: "CAD",
          to: "USD",
          rate: 0.75 + (Math.random() - 0.5) * 0.02, // Small random variation
          lastUpdated: new Date(),
          source: "mock_api",
        },
        {
          from: "USD",
          to: "CAD",
          rate: 1.33 + (Math.random() - 0.5) * 0.04, // Small random variation
          lastUpdated: new Date(),
          source: "mock_api",
        },
      ];

      // Update internal rates
      mockRates.forEach((rate) => {
        const key = `${rate.from}_${rate.to}`;
        this.exchangeRates.set(key, rate);
      });

      return {
        success: true,
        data: mockRates,
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to update exchange rates",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get current exchange rates
   */
  getExchangeRates(): ExchangeRate[] {
    return Array.from(this.exchangeRates.values());
  }

  /**
   * Check if two amounts are equal (accounting for floating point precision)
   */
  areAmountsEqual(amount1: number, amount2: number): boolean {
    return amountsEqual(amount1, amount2);
  }

  /**
   * Round amount to currency-appropriate precision
   */
  roundAmount(amount: number): number {
    return roundToCents(amount);
  }

  /**
   * Get supported currencies
   */
  getSupportedCurrencies(): Array<{
    code: Currency;
    name: string;
    symbol: string;
  }> {
    return Object.keys(CURRENCIES).map((code) => ({
      code: code as Currency,
      name: this.getCurrencyName(code as Currency),
      symbol: this.getCurrencySymbol(code as Currency),
    }));
  }

  /**
   * Format amount with contextual styling for different UI components
   */
  formatForContext(
    amount: number,
    context:
      | "transaction_list"
      | "summary_card"
      | "budget_card"
      | "chart_label"
      | "input_field",
    currency: Currency = this.preferences.primaryCurrency
  ): string {
    switch (context) {
      case "transaction_list":
        return this.formatAmount(amount, currency, {
          compact: false,
          showCurrency: true,
        });

      case "summary_card":
        return this.formatAmount(amount, currency, {
          compact: true,
          showCurrency: true,
        });

      case "budget_card":
        return this.formatAmount(amount, currency, {
          compact: false,
          showCurrency: true,
        });

      case "chart_label":
        return this.formatAmount(amount, currency, {
          compact: true,
          showCurrency: false,
        });

      case "input_field":
        return this.formatForInput(amount);

      default:
        return this.formatAmount(amount, currency);
    }
  }
}

// Export singleton instance
export const currencyService = CurrencyService.getInstance();
export default currencyService;
