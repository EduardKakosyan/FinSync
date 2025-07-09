/**
 * Unit tests for currency utilities
 * Tests amount parsing and formatting functionality
 */

import { formatCurrency, parseAmountFromInput } from '../currencyUtils';

describe('currencyUtils', () => {
  describe('formatCurrency', () => {
    it('should format positive amounts correctly', () => {
      expect(formatCurrency(100)).toBe('$100.00');
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0.99)).toBe('$0.99');
      expect(formatCurrency(0.01)).toBe('$0.01');
    });

    it('should format zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should format large amounts correctly', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
      expect(formatCurrency(999999.99)).toBe('$999,999.99');
    });

    it('should handle decimal precision', () => {
      expect(formatCurrency(10.123)).toBe('$10.12'); // Should round to 2 decimal places
      expect(formatCurrency(10.999)).toBe('$11.00'); // Should round up
    });
  });

  describe('parseAmountFromInput', () => {
    it('should parse plain numbers', () => {
      expect(parseAmountFromInput('100')).toBe(100);
      expect(parseAmountFromInput('1234.56')).toBe(1234.56);
      expect(parseAmountFromInput('0.99')).toBe(0.99);
      expect(parseAmountFromInput('0')).toBe(0);
    });

    it('should parse currency formatted strings', () => {
      expect(parseAmountFromInput('$100')).toBe(100);
      expect(parseAmountFromInput('$1,234.56')).toBe(1234.56);
      expect(parseAmountFromInput('$0.99')).toBe(0.99);
    });

    it('should handle various input formats', () => {
      expect(parseAmountFromInput('100.00')).toBe(100);
      expect(parseAmountFromInput('1,234')).toBe(1234);
      expect(parseAmountFromInput('$1,234.00')).toBe(1234);
      expect(parseAmountFromInput('$ 1,234.56')).toBe(1234.56);
    });

    it('should handle invalid inputs gracefully', () => {
      expect(parseAmountFromInput('')).toBe(0);
      expect(parseAmountFromInput('abc')).toBe(0);
      expect(parseAmountFromInput('$')).toBe(0);
      expect(parseAmountFromInput('   ')).toBe(0);
    });

    it('should handle negative numbers', () => {
      expect(parseAmountFromInput('-100')).toBe(-100);
      expect(parseAmountFromInput('-$100')).toBe(-100);
      expect(parseAmountFromInput('-1,234.56')).toBe(-1234.56);
    });

    it('should handle decimal-only inputs', () => {
      expect(parseAmountFromInput('.99')).toBe(0.99);
      expect(parseAmountFromInput('.5')).toBe(0.5);
      expect(parseAmountFromInput('.')).toBe(0);
    });

    it('should handle multiple decimal points', () => {
      expect(parseAmountFromInput('10.50.25')).toBe(10.5); // parseFloat stops at first valid number
      expect(parseAmountFromInput('1.2.3')).toBe(1.2); // parseFloat stops at first valid number
    });

    it('should handle edge cases', () => {
      expect(parseAmountFromInput('000100')).toBe(100);
      expect(parseAmountFromInput('100.000')).toBe(100);
      expect(parseAmountFromInput('0.0')).toBe(0);
      expect(parseAmountFromInput('00.00')).toBe(0);
    });
  });

  describe('Round-trip conversion', () => {
    it('should maintain precision through format and parse', () => {
      const amounts = [0, 0.01, 0.99, 1, 10, 100, 1000, 1234.56, 999999.99];
      
      amounts.forEach(amount => {
        const formatted = formatCurrency(amount);
        const parsed = parseAmountFromInput(formatted);
        expect(parsed).toBe(amount);
      });
    });
  });

  describe('User input scenarios', () => {
    it('should handle typical user inputs', () => {
      // Common user typing patterns
      expect(parseAmountFromInput('1')).toBe(1);
      expect(parseAmountFromInput('10')).toBe(10);
      expect(parseAmountFromInput('10.')).toBe(10);
      expect(parseAmountFromInput('10.5')).toBe(10.5);
      expect(parseAmountFromInput('10.50')).toBe(10.5);
    });

    it('should handle copy-paste scenarios', () => {
      // When users copy amounts from other apps
      expect(parseAmountFromInput('$1,234.56')).toBe(1234.56);
      expect(parseAmountFromInput('1,234.56 USD')).toBe(1234.56);
      expect(parseAmountFromInput('USD 1,234.56')).toBe(1234.56);
    });

    it('should handle international formats', () => {
      // European format with comma as decimal separator
      expect(parseAmountFromInput('1234,56')).toBe(123456); // Comma removed, becomes 123456
      expect(parseAmountFromInput('1.234,56')).toBe(1.23456); // Comma removed, becomes 1.23456
    });
  });
});