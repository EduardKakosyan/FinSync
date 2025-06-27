import { CurrencyService } from '../../src/services/CurrencyService';

describe('CurrencyService', () => {
  let currencyService: CurrencyService;

  beforeEach(() => {
    currencyService = CurrencyService.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = CurrencyService.getInstance();
      const instance2 = CurrencyService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('formatAmount', () => {
    it('should format CAD currency correctly', () => {
      const formatted = currencyService.formatAmount(1234.56, 'CAD');
      expect(formatted).toBe('$1,234.56');
    });

    it('should format USD currency correctly', () => {
      const formatted = currencyService.formatAmount(1234.56, 'USD');
      expect(formatted).toBe('$1,234.56');
    });

    it('should format zero amounts', () => {
      const formatted = currencyService.formatAmount(0, 'CAD');
      expect(formatted).toBe('$0.00');
    });

    it('should format negative amounts', () => {
      const formatted = currencyService.formatAmount(-123.45, 'CAD');
      expect(formatted).toBe('-$123.45');
    });

    it('should format large amounts', () => {
      const formatted = currencyService.formatAmount(1234567.89, 'CAD');
      expect(formatted).toBe('$1,234,567.89');
    });

    it('should use compact format for large amounts when enabled', () => {
      const formatted = currencyService.formatAmount(1500, 'CAD', { compact: true });
      expect(formatted).toContain('1.5K'); // Should use compact notation
    });

    it('should respect custom precision', () => {
      const formatted = currencyService.formatAmount(123.456789, 'CAD', { precision: 3 });
      expect(formatted).toBe('$123.457'); // Rounded to 3 decimal places
    });

    it('should show sign when requested', () => {
      const formatted = currencyService.formatAmount(123.45, 'CAD', { showSign: true });
      expect(formatted).toBe('+$123.45');
    });
  });

  describe('formatTransactionAmount', () => {
    it('should format income amounts with positive styling', () => {
      const result = currencyService.formatTransactionAmount(1000, 'income', 'CAD');
      
      expect(result.formatted).toContain('1,000');
      expect(result.sign).toBe('+');
      expect(result.color).toBe('#34C759'); // Green for income
    });

    it('should format expense amounts with negative styling', () => {
      const result = currencyService.formatTransactionAmount(500, 'expense', 'CAD');
      
      expect(result.formatted).toContain('500');
      expect(result.sign).toBe('-');
      expect(result.color).toBe('#FF3B30'); // Red for expense
    });

    it('should disable colorization when requested', () => {
      const result = currencyService.formatTransactionAmount(
        1000, 
        'income', 
        'CAD', 
        { colorize: false }
      );
      
      expect(result.color).toBe('#000000'); // Default black
    });
  });

  describe('formatBudgetAmount', () => {
    it('should calculate budget info for under-budget spending', () => {
      const result = currencyService.formatBudgetAmount(300, 500, 'CAD');
      
      expect(result.amount).toBe(300);
      expect(result.currency).toBe('CAD');
      expect(result.status).toBe('under');
      expect(result.percentage).toBe(60);
      expect(result.remaining).toBe(200);
      expect(result.formattedAmount).toBe('$300.00');
      expect(result.formattedRemaining).toBe('$200.00');
      expect(result.statusColor).toBe('#34C759'); // Green
    });

    it('should calculate budget info for near-budget spending', () => {
      const result = currencyService.formatBudgetAmount(400, 500, 'CAD');
      
      expect(result.status).toBe('near');
      expect(result.percentage).toBe(80);
      expect(result.statusColor).toBe('#FF9500'); // Orange
    });

    it('should calculate budget info for over-budget spending', () => {
      const result = currencyService.formatBudgetAmount(475, 500, 'CAD');
      
      expect(result.status).toBe('over');
      expect(result.percentage).toBe(95);
      expect(result.statusColor).toBe('#FF9500'); // Orange
    });

    it('should calculate budget info for exceeded budget', () => {
      const result = currencyService.formatBudgetAmount(600, 500, 'CAD');
      
      expect(result.status).toBe('exceeded');
      expect(result.percentage).toBe(120);
      expect(result.remaining).toBe(0); // Capped at 0
      expect(result.statusColor).toBe('#FF3B30'); // Red
    });

    it('should handle zero budget', () => {
      const result = currencyService.formatBudgetAmount(100, 0, 'CAD');
      
      expect(result.percentage).toBe(0);
      expect(result.remaining).toBe(0);
    });
  });

  describe('formatSpendingSummary', () => {
    it('should format spending summary with positive net income', () => {
      const result = currencyService.formatSpendingSummary(5000, 3000, 'CAD');
      
      expect(result.income).toBe('$5,000.00');
      expect(result.expenses).toBe('$3,000.00');
      expect(result.net).toBe('+$2,000.00');
      expect(result.netColor).toBe('#34C759'); // Green for positive
      expect(result.savingsRate).toBe('40.00%'); // 2000/5000 = 40%
      expect(result.savingsRateColor).toBe('#34C759'); // Green for good savings rate
    });

    it('should format spending summary with negative net income', () => {
      const result = currencyService.formatSpendingSummary(3000, 4000, 'CAD');
      
      expect(result.net).toBe('-$1,000.00');
      expect(result.netColor).toBe('#FF3B30'); // Red for negative
      expect(result.savingsRate).toBe('-33.33%'); // Negative savings rate
    });

    it('should handle zero income', () => {
      const result = currencyService.formatSpendingSummary(0, 1000, 'CAD');
      
      expect(result.savingsRate).toBe('0.00%');
      expect(result.savingsRateColor).toBe('#FF3B30'); // Red for poor savings
    });
  });

  describe('formatComparison', () => {
    it('should format comparison with increased spending', () => {
      const result = currencyService.formatComparison(1200, 1000, 'CAD');
      
      expect(result.current).toBe('$1,200.00');
      expect(result.previous).toBe('$1,000.00');
      expect(result.change).toBe('+$200.00');
      expect(result.changePercentage).toBe('20.00%');
      expect(result.trend).toBe('up');
      expect(result.changeColor).toBe('#FF3B30'); // Red for increased spending
    });

    it('should format comparison with decreased spending', () => {
      const result = currencyService.formatComparison(800, 1000, 'CAD');
      
      expect(result.change).toBe('+$200.00'); // Shows absolute value
      expect(result.changePercentage).toBe('20.00%');
      expect(result.trend).toBe('down');
      expect(result.changeColor).toBe('#34C759'); // Green for decreased spending
    });

    it('should format comparison with stable spending', () => {
      const result = currencyService.formatComparison(1020, 1000, 'CAD');
      
      expect(result.trend).toBe('stable'); // Less than 5% change
      expect(result.changeColor).toBe('#8E8E93'); // Gray for stable
    });

    it('should handle zero previous amount', () => {
      const result = currencyService.formatComparison(500, 0, 'CAD');
      
      expect(result.changePercentage).toBe('0.00%');
      expect(result.trend).toBe('stable');
    });
  });

  describe('convertAmount', () => {
    it('should convert between different currencies', async () => {
      const result = await currencyService.convertAmount(100, 'CAD', 'USD');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.originalAmount).toBe(100);
      expect(result.data!.fromCurrency).toBe('CAD');
      expect(result.data!.toCurrency).toBe('USD');
      expect(result.data!.convertedAmount).toBeGreaterThan(0);
      expect(result.data!.rate).toBeGreaterThan(0);
      expect(result.data!.formattedOriginal).toBe('$100.00');
      expect(result.data!.formattedConverted).toContain('$');
    });

    it('should handle same currency conversion', async () => {
      const result = await currencyService.convertAmount(100, 'CAD', 'CAD');
      
      expect(result.success).toBe(true);
      expect(result.data!.originalAmount).toBe(100);
      expect(result.data!.convertedAmount).toBe(100);
      expect(result.data!.rate).toBe(1);
    });

    it('should handle unsupported currency pairs', async () => {
      const result = await currencyService.convertAmount(100, 'CAD', 'EUR' as any);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Exchange rate not available');
    });
  });

  describe('Currency Information', () => {
    it('should return correct currency symbols', () => {
      expect(currencyService.getCurrencySymbol('CAD')).toBe('$');
      expect(currencyService.getCurrencySymbol('USD')).toBe('$');
    });

    it('should return currency names', () => {
      expect(currencyService.getCurrencyName('CAD')).toBe('Canadian Dollar');
      expect(currencyService.getCurrencyName('CAD', true)).toBe('Canadian Dollars');
      expect(currencyService.getCurrencyName('USD')).toBe('US Dollar');
      expect(currencyService.getCurrencyName('USD', true)).toBe('US Dollars');
    });

    it('should return supported currencies', () => {
      const currencies = currencyService.getSupportedCurrencies();
      
      expect(currencies.length).toBeGreaterThan(0);
      currencies.forEach(currency => {
        expect(currency.code).toBeDefined();
        expect(currency.name).toBeDefined();
        expect(currency.symbol).toBeDefined();
      });

      const cadCurrency = currencies.find(c => c.code === 'CAD');
      expect(cadCurrency).toBeDefined();
      expect(cadCurrency!.symbol).toBe('$');
    });
  });

  describe('parseUserInput', () => {
    it('should parse valid input correctly', () => {
      const result = currencyService.parseUserInput('123.45');
      
      expect(result.isValid).toBe(true);
      expect(result.amount).toBe(123.45);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle currency symbols in input', () => {
      const result = currencyService.parseUserInput('$123.45');
      
      expect(result.isValid).toBe(true);
      expect(result.amount).toBe(123.45);
    });

    it('should handle commas in input', () => {
      const result = currencyService.parseUserInput('1,234.56');
      
      expect(result.isValid).toBe(true);
      expect(result.amount).toBe(1234.56);
    });

    it('should reject empty input', () => {
      const result = currencyService.parseUserInput('');
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe('Amount is required');
    });

    it('should reject zero amounts', () => {
      const result = currencyService.parseUserInput('0');
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe('Amount must be greater than zero');
    });

    it('should reject negative amounts', () => {
      const result = currencyService.parseUserInput('-100');
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe('Amount must be greater than zero');
    });

    it('should reject amounts exceeding maximum', () => {
      const result = currencyService.parseUserInput('2000000');
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe('Amount cannot exceed $1,000,000');
    });

    it('should reject invalid input', () => {
      const result = currencyService.parseUserInput('abc');
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe('Please enter a valid amount');
    });
  });

  describe('formatForInput', () => {
    it('should format amount for input fields', () => {
      const formatted = currencyService.formatForInput(1234.56);
      expect(formatted).toBe('1234.56'); // No currency symbol for input
    });

    it('should handle zero amounts', () => {
      const formatted = currencyService.formatForInput(0);
      expect(formatted).toBe('0');
    });
  });

  describe('getAmountRanges', () => {
    it('should return predefined amount ranges', () => {
      const ranges = currencyService.getAmountRanges('CAD');
      
      expect(ranges.length).toBeGreaterThan(0);
      ranges.forEach(range => {
        expect(range.label).toBeDefined();
        expect(typeof range.min).toBe('number');
        expect(typeof range.max).toBe('number');
        expect(range.formattedLabel).toBeDefined();
        expect(range.min).toBeLessThanOrEqual(range.max);
      });
    });
  });

  describe('formatPercentageChange', () => {
    it('should format positive percentage change', () => {
      const result = currencyService.formatPercentageChange(120, 100);
      
      expect(result.percentage).toBe(20);
      expect(result.formatted).toBe('+20.0%');
      expect(result.trend).toBe('up');
      expect(result.color).toBe('#FF3B30'); // Red for increase (bad for expenses)
    });

    it('should format negative percentage change', () => {
      const result = currencyService.formatPercentageChange(80, 100);
      
      expect(result.percentage).toBe(-20);
      expect(result.formatted).toBe('-20.0%');
      expect(result.trend).toBe('down');
      expect(result.color).toBe('#34C759'); // Green for decrease (good for expenses)
    });

    it('should format stable percentage change', () => {
      const result = currencyService.formatPercentageChange(100.5, 100);
      
      expect(result.trend).toBe('stable'); // Less than 1% change
      expect(result.color).toBe('#8E8E93'); // Gray for stable
    });

    it('should handle zero previous amount', () => {
      const result = currencyService.formatPercentageChange(100, 0);
      
      expect(result.percentage).toBe(0);
      expect(result.trend).toBe('stable');
    });

    it('should respect custom precision', () => {
      const result = currencyService.formatPercentageChange(105.567, 100, { precision: 2 });
      
      expect(result.formatted).toBe('+5.57%');
    });

    it('should hide sign when requested', () => {
      const result = currencyService.formatPercentageChange(120, 100, { showSign: false });
      
      expect(result.formatted).toBe('20.0%'); // No + sign
    });
  });

  describe('updateExchangeRates', () => {
    it('should update exchange rates successfully', async () => {
      const result = await currencyService.updateExchangeRates();
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      
      result.data!.forEach(rate => {
        expect(rate.from).toBeDefined();
        expect(rate.to).toBeDefined();
        expect(rate.rate).toBeGreaterThan(0);
        expect(rate.lastUpdated).toBeInstanceOf(Date);
        expect(rate.source).toBeDefined();
      });
    });

    it('should update internal exchange rates', async () => {
      const oldRates = currencyService.getExchangeRates();
      await currencyService.updateExchangeRates();
      const newRates = currencyService.getExchangeRates();
      
      expect(newRates.length).toBeGreaterThanOrEqual(oldRates.length);
    });
  });

  describe('formatForContext', () => {
    it('should format amounts for different UI contexts', () => {
      const amount = 1234.56;
      
      const transactionList = currencyService.formatForContext(amount, 'transaction_list');
      const summaryCard = currencyService.formatForContext(amount, 'summary_card');
      const budgetCard = currencyService.formatForContext(amount, 'budget_card');
      const chartLabel = currencyService.formatForContext(amount, 'chart_label');
      const inputField = currencyService.formatForContext(amount, 'input_field');
      
      expect(transactionList).toContain('$');
      expect(summaryCard).toContain('$');
      expect(budgetCard).toContain('$');
      expect(chartLabel).toBeDefined();
      expect(inputField).toBe('1234.56'); // Input format without symbol
    });
  });

  describe('Utility Methods', () => {
    it('should check if amounts are equal', () => {
      expect(currencyService.areAmountsEqual(100.00, 100.00)).toBe(true);
      expect(currencyService.areAmountsEqual(100.01, 100.02)).toBe(false);
      expect(currencyService.areAmountsEqual(100.001, 100.002)).toBe(true); // Within precision
    });

    it('should round amounts correctly', () => {
      expect(currencyService.roundAmount(123.456)).toBe(123.46);
      expect(currencyService.roundAmount(123.454)).toBe(123.45);
      expect(currencyService.roundAmount(123.999)).toBe(124.00);
    });
  });

  describe('Preferences Management', () => {
    it('should update currency preferences', () => {
      const newPreferences = {
        primaryCurrency: 'USD' as const,
        showCurrencySymbol: false,
      };
      
      currencyService.updatePreferences(newPreferences);
      const preferences = currencyService.getPreferences();
      
      expect(preferences.primaryCurrency).toBe('USD');
      expect(preferences.showCurrencySymbol).toBe(false);
    });

    it('should return current preferences', () => {
      const preferences = currencyService.getPreferences();
      
      expect(preferences.primaryCurrency).toBeDefined();
      expect(typeof preferences.showCurrencySymbol).toBe('boolean');
      expect(typeof preferences.showCurrencyCode).toBe('boolean');
      expect(typeof preferences.decimalPlaces).toBe('number');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large numbers', () => {
      const formatted = currencyService.formatAmount(999999999.99, 'CAD');
      expect(formatted).toContain('999,999,999.99');
    });

    it('should handle very small numbers', () => {
      const formatted = currencyService.formatAmount(0.01, 'CAD');
      expect(formatted).toBe('$0.01');
    });

    it('should handle floating point precision issues', () => {
      const amount = 0.1 + 0.2; // Results in 0.30000000000000004
      const formatted = currencyService.formatAmount(amount, 'CAD');
      expect(formatted).toBe('$0.30'); // Should be properly rounded
    });
  });
});