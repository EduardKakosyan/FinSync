import { getDateRange, formatCurrency, calculateHST } from '../../utils/dateHelpers';

describe('Date Helpers', () => {
  describe('getDateRange', () => {
    beforeEach(() => {
      // Mock current date to ensure consistent tests
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-15T14:30:00'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return today for daily period', () => {
      const { startDate, endDate } = getDateRange('daily');
      
      // Check the date parts are correct, ignoring time zone
      expect(startDate.getDate()).toBe(15);
      expect(startDate.getMonth()).toBe(0); // January
      expect(startDate.getFullYear()).toBe(2025);
      expect(startDate.getHours()).toBe(0);
      expect(startDate.getMinutes()).toBe(0);
      expect(startDate.getSeconds()).toBe(0);
      
      expect(endDate.getDate()).toBe(15);
      expect(endDate.getHours()).toBe(23);
      expect(endDate.getMinutes()).toBe(59);
      expect(endDate.getSeconds()).toBe(59);
    });

    it('should return current week for weekly period', () => {
      const { startDate, endDate } = getDateRange('weekly');
      
      // January 15, 2025 is a Wednesday, so week starts on January 12 (Sunday)
      expect(startDate.getDate()).toBe(12);
      expect(startDate.getMonth()).toBe(0); // January
      expect(startDate.getFullYear()).toBe(2025);
      
      expect(endDate.getDate()).toBe(15);
      expect(endDate.getMonth()).toBe(0);
      expect(endDate.getFullYear()).toBe(2025);
    });

    it('should return current month for monthly period', () => {
      const { startDate, endDate } = getDateRange('monthly');
      
      expect(startDate.getDate()).toBe(1);
      expect(startDate.getMonth()).toBe(0); // January
      expect(startDate.getFullYear()).toBe(2025);
      
      expect(endDate.getDate()).toBe(15);
      expect(endDate.getMonth()).toBe(0);
      expect(endDate.getFullYear()).toBe(2025);
    });
  });

  describe('formatCurrency', () => {
    it('should format positive amounts correctly', () => {
      expect(formatCurrency(100)).toBe('CA$100.00');
      expect(formatCurrency(1234.56)).toBe('CA$1,234.56');
      expect(formatCurrency(0.99)).toBe('CA$0.99');
    });

    it('should format negative amounts correctly', () => {
      expect(formatCurrency(-100)).toBe('-CA$100.00');
      expect(formatCurrency(-1234.56)).toBe('-CA$1,234.56');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('CA$0.00');
    });
  });

  describe('calculateHST', () => {
    it('should calculate HST with default rate', () => {
      expect(calculateHST(100)).toBeCloseTo(14, 2);
      expect(calculateHST(50)).toBeCloseTo(7, 2);
      expect(calculateHST(0)).toBe(0);
    });

    it('should calculate HST with custom rate', () => {
      expect(calculateHST(100, 0.15)).toBe(15);
      expect(calculateHST(100, 0.13)).toBe(13);
    });

    it('should handle decimal amounts', () => {
      expect(calculateHST(99.99)).toBeCloseTo(13.9986, 4);
    });
  });
});