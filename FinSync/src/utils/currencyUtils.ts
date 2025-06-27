/**
 * Utility functions for currency formatting and amount calculations
 * Supports CAD and USD currencies with locale-specific formatting
 */

import { CURRENCIES } from '@/constants';

export type Currency = keyof typeof CURRENCIES;

/**
 * Format amount to currency string with proper locale formatting
 * @param amount - The amount to format
 * @param currency - The currency code (CAD or USD)
 * @param options - Additional formatting options
 */
export const formatCurrency = (
  amount: number,
  currency: Currency = 'CAD',
  options: {
    showSign?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showCurrencySymbol?: boolean;
    showCurrencyCode?: boolean;
  } = {}
): string => {
  const {
    showSign = false,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showCurrencySymbol = true,
    showCurrencyCode = false,
  } = options;

  // Determine locale based on currency
  const locale = currency === 'CAD' ? 'en-CA' : 'en-US';
  
  // Format the number with currency
  const formatter = new Intl.NumberFormat(locale, {
    style: showCurrencySymbol ? 'currency' : 'decimal',
    currency: currency,
    minimumFractionDigits,
    maximumFractionDigits,
  });

  let formattedAmount = formatter.format(Math.abs(amount));

  // Add sign if requested or if showing negative amounts
  if (showSign || amount < 0) {
    const sign = amount < 0 ? '-' : '+';
    formattedAmount = `${sign}${formattedAmount}`;
  }

  // Add currency code if requested
  if (showCurrencyCode && !showCurrencySymbol) {
    formattedAmount = `${formattedAmount} ${currency}`;
  }

  return formattedAmount;
};

/**
 * Format amount for display in transaction lists
 * Shows + for income, - for expenses
 */
export const formatTransactionAmount = (
  amount: number,
  type: 'income' | 'expense',
  currency: Currency = 'CAD'
): string => {
  const absoluteAmount = Math.abs(amount);
  const sign = type === 'income' ? '+' : '-';
  
  return `${sign}${formatCurrency(absoluteAmount, currency, { showCurrencySymbol: true })}`;
};

/**
 * Format amount for input fields (without currency symbol)
 */
export const formatAmountForInput = (amount: number): string => {
  return amount.toFixed(2);
};

/**
 * Parse string input to number for currency calculations
 */
export const parseAmountFromInput = (input: string): number => {
  // Remove currency symbols, spaces, and other non-numeric characters except decimal point
  const cleanInput = input.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleanInput);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Validate if amount string is valid for currency input
 */
export const isValidAmountInput = (input: string): boolean => {
  if (!input || input.trim() === '') return false;
  
  const cleanInput = input.replace(/[^\d.-]/g, '');
  
  // Check for valid decimal number pattern
  const decimalPattern = /^\d+(\.\d{0,2})?$/;
  
  return decimalPattern.test(cleanInput) && parseFloat(cleanInput) > 0;
};

/**
 * Convert amount between currencies (mock implementation)
 * In a real app, this would use real exchange rates
 */
export const convertCurrency = (
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number => {
  if (fromCurrency === toCurrency) return amount;
  
  // Mock exchange rates (CAD to USD approximately 0.75)
  const exchangeRates: Record<string, number> = {
    'CAD_USD': 0.75,
    'USD_CAD': 1.33,
  };
  
  const rateKey = `${fromCurrency}_${toCurrency}`;
  const rate = exchangeRates[rateKey] || 1;
  
  return amount * rate;
};

/**
 * Calculate percentage of amount relative to total
 */
export const calculatePercentage = (amount: number, total: number): number => {
  if (total === 0) return 0;
  return (amount / total) * 100;
};

/**
 * Format percentage for display
 */
export const formatPercentage = (
  percentage: number,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string => {
  const { minimumFractionDigits = 0, maximumFractionDigits = 1 } = options;
  
  return percentage.toLocaleString('en', {
    minimumFractionDigits,
    maximumFractionDigits,
    style: 'percent',
  });
};

/**
 * Calculate totals for different transaction types
 */
export const calculateTotals = (
  transactions: Array<{ amount: number; type: 'income' | 'expense' }>
): {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
} => {
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expenses = Math.abs(
    transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  );
  
  return {
    totalIncome: income,
    totalExpenses: expenses,
    netIncome: income - expenses,
  };
};

/**
 * Get color for amount based on value and type
 */
export const getAmountColor = (
  amount: number,
  type: 'income' | 'expense',
  colors: {
    income: string;
    expense: string;
    neutral: string;
  }
): string => {
  if (amount === 0) return colors.neutral;
  return type === 'income' ? colors.income : colors.expense;
};

/**
 * Format large numbers with abbreviations (K, M, B)
 */
export const formatLargeAmount = (
  amount: number,
  currency: Currency = 'CAD'
): string => {
  const absAmount = Math.abs(amount);
  
  if (absAmount >= 1000000000) {
    return `${formatCurrency(amount / 1000000000, currency, { maximumFractionDigits: 1 })}B`;
  } else if (absAmount >= 1000000) {
    return `${formatCurrency(amount / 1000000, currency, { maximumFractionDigits: 1 })}M`;
  } else if (absAmount >= 1000) {
    return `${formatCurrency(amount / 1000, currency, { maximumFractionDigits: 1 })}K`;
  } else {
    return formatCurrency(amount, currency);
  }
};

/**
 * Round amount to nearest cent
 */
export const roundToCents = (amount: number): number => {
  return Math.round(amount * 100) / 100;
};

/**
 * Check if two amounts are equal considering floating point precision
 */
export const amountsEqual = (amount1: number, amount2: number): boolean => {
  return Math.abs(amount1 - amount2) < 0.01;
};

/**
 * Generate amount range for filtering
 */
export const generateAmountRanges = (currency: Currency = 'CAD'): Array<{
  label: string;
  min: number;
  max: number;
}> => {
  return [
    { label: `Under ${formatCurrency(50, currency)}`, min: 0, max: 50 },
    { label: `${formatCurrency(50, currency)} - ${formatCurrency(100, currency)}`, min: 50, max: 100 },
    { label: `${formatCurrency(100, currency)} - ${formatCurrency(500, currency)}`, min: 100, max: 500 },
    { label: `${formatCurrency(500, currency)} - ${formatCurrency(1000, currency)}`, min: 500, max: 1000 },
    { label: `Over ${formatCurrency(1000, currency)}`, min: 1000, max: Infinity },
  ];
};