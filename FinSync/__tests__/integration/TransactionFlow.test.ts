/**
 * Integration test for complete transaction flow
 * Tests the end-to-end transaction creation process
 */

import { firebaseTransactionService } from '../../src/services/firebase/FirebaseTransactionService';
import { parseAmountFromInput, formatCurrency } from '../../src/utils/currencyUtils';

// Mock Firebase to simulate real behavior
jest.mock('../../src/services/firebase/FirebaseConfig', () => ({
  db: {
    collection: jest.fn(),
    doc: jest.fn(),
  },
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(() => ({ id: 'test-transaction-id' })),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  deleteDoc: jest.fn(),
  Timestamp: {
    fromDate: jest.fn((date: Date) => ({ toDate: () => date })),
  },
  serverTimestamp: jest.fn(() => ({ isServerTimestamp: true })),
}));

describe('Transaction Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Transaction Creation Flow', () => {
    it('should handle the complete flow from form input to Firebase', async () => {
      // Mock successful Firebase operation
      const mockSetDoc = require('firebase/firestore').setDoc;
      mockSetDoc.mockResolvedValueOnce(undefined);

      // Simulate user input from the form
      const userInput = {
        amount: '25.99',
        description: 'Coffee purchase',
        category: 'food',
        type: 'expense' as const,
        date: new Date('2024-01-15T10:30:00Z'),
        notes: 'Morning coffee',
        accountId: 'default-account',
      };

      // Step 1: Parse amount (this is what the form does)
      const parsedAmount = parseAmountFromInput(userInput.amount);
      expect(parsedAmount).toBe(25.99);

      // Step 2: Create transaction data
      const transactionData = {
        amount: parsedAmount,
        description: userInput.description,
        category: userInput.category,
        type: userInput.type,
        date: userInput.date,
        notes: userInput.notes,
        accountId: userInput.accountId,
      };

      // Step 3: Create transaction
      const result = await firebaseTransactionService.create(transactionData);

      // Verify the result
      expect(result).toMatchObject({
        id: 'test-transaction-id',
        amount: 25.99,
        description: 'Coffee purchase',
        category: 'food',
        type: 'expense',
        accountId: 'default-account',
        notes: 'Morning coffee',
      });

      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
    });

    it('should handle validation errors correctly', async () => {
      const invalidInputs = [
        { amount: '0', description: 'Test', category: 'food', error: 'Amount must be greater than 0' },
        { amount: '25.99', description: '', category: 'food', error: 'Description is required' },
        { amount: '25.99', description: 'Test', category: '', error: 'Category is required' },
        { amount: 'abc', description: 'Test', category: 'food', error: 'Amount must be greater than 0' },
      ];

      for (const input of invalidInputs) {
        const parsedAmount = parseAmountFromInput(input.amount);
        const transactionData = {
          amount: parsedAmount,
          description: input.description,
          category: input.category,
          type: 'expense' as const,
          date: new Date(),
          accountId: 'default-account',
        };

        await expect(firebaseTransactionService.create(transactionData)).rejects.toThrow(
          input.error
        );
      }
    });

    it('should handle different currency formats', async () => {
      const mockSetDoc = require('firebase/firestore').setDoc;
      mockSetDoc.mockResolvedValue(undefined);

      const currencyInputs = [
        { input: '$25.99', expected: 25.99 },
        { input: '1,234.56', expected: 1234.56 },
        { input: '100', expected: 100 },
        { input: '0.01', expected: 0.01 },
      ];

      for (const currencyInput of currencyInputs) {
        const parsedAmount = parseAmountFromInput(currencyInput.input);
        expect(parsedAmount).toBe(currencyInput.expected);

        const transactionData = {
          amount: parsedAmount,
          description: `Test transaction ${currencyInput.input}`,
          category: 'food',
          type: 'expense' as const,
          date: new Date(),
          accountId: 'default-account',
        };

        const result = await firebaseTransactionService.create(transactionData);
        expect(result.amount).toBe(currencyInput.expected);
      }
    });

    it('should handle recurring transactions', async () => {
      const mockSetDoc = require('firebase/firestore').setDoc;
      mockSetDoc.mockResolvedValue(undefined);

      const recurringInput = {
        amount: '2000.00',
        description: 'Monthly salary',
        category: 'income',
        type: 'income' as const,
        date: new Date(),
        accountId: 'default-account',
      };

      const parsedAmount = parseAmountFromInput(recurringInput.amount);
      const transactionData = {
        amount: parsedAmount,
        description: recurringInput.description,
        category: recurringInput.category,
        type: recurringInput.type,
        date: recurringInput.date,
        accountId: recurringInput.accountId,
      };

      const recurringOptions = {
        interval: 'monthly' as const,
        dayOfMonth: 1,
      };

      const result = await firebaseTransactionService.createRecurring(
        transactionData,
        recurringOptions
      );

      expect(result).toMatchObject({
        id: 'test-transaction-id',
        amount: 2000,
        description: 'Monthly salary',
        category: 'income',
        type: 'income',
        isRecurring: true,
        recurringInterval: 'monthly',
        recurringDay: 1,
      });
    });

    it('should format currency correctly for display', () => {
      const amounts = [0, 0.01, 0.99, 1, 10, 100, 1000, 1234.56, 999999.99];
      
      amounts.forEach(amount => {
        const formatted = formatCurrency(amount);
        expect(formatted).toMatch(/^\$[\d,]+\.\d{2}$/);
        
        // Verify round-trip conversion
        const parsed = parseAmountFromInput(formatted);
        expect(parsed).toBe(amount);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle Firebase connection errors', async () => {
      const mockSetDoc = require('firebase/firestore').setDoc;
      mockSetDoc.mockRejectedValue(new Error('Firebase: Client is offline'));

      const transactionData = {
        amount: 25.99,
        description: 'Test transaction',
        category: 'food',
        type: 'expense' as const,
        date: new Date(),
        accountId: 'default-account',
      };

      await expect(firebaseTransactionService.create(transactionData)).rejects.toThrow(
        'Firebase: Client is offline'
      );
    });

    it('should handle permission errors', async () => {
      const mockSetDoc = require('firebase/firestore').setDoc;
      mockSetDoc.mockRejectedValue(new Error('Missing or insufficient permissions'));

      const transactionData = {
        amount: 25.99,
        description: 'Test transaction',
        category: 'food',
        type: 'expense' as const,
        date: new Date(),
        accountId: 'default-account',
      };

      await expect(firebaseTransactionService.create(transactionData)).rejects.toThrow(
        'Missing or insufficient permissions'
      );
    });
  });

  describe('Form Validation Scenarios', () => {
    it('should validate real-world user input scenarios', () => {
      const userInputScenarios = [
        // Valid inputs
        { input: '25.99', valid: true, expected: 25.99 },
        { input: '$25.99', valid: true, expected: 25.99 },
        { input: '1234.56', valid: true, expected: 1234.56 },
        { input: '0.01', valid: true, expected: 0.01 },
        
        // Invalid inputs
        { input: '', valid: false, expected: 0 },
        { input: '0', valid: false, expected: 0 },
        { input: 'abc', valid: false, expected: 0 },
        { input: '$', valid: false, expected: 0 },
        { input: '   ', valid: false, expected: 0 },
      ];

      userInputScenarios.forEach(scenario => {
        const parsedAmount = parseAmountFromInput(scenario.input);
        expect(parsedAmount).toBe(scenario.expected);
        
        const isValid = parsedAmount > 0;
        expect(isValid).toBe(scenario.valid);
      });
    });

    it('should handle edge cases in transaction creation', async () => {
      const mockSetDoc = require('firebase/firestore').setDoc;
      mockSetDoc.mockResolvedValue(undefined);

      // Test minimum amount
      const minTransaction = {
        amount: 0.01,
        description: 'Minimum transaction',
        category: 'other',
        type: 'expense' as const,
        date: new Date(),
        accountId: 'default-account',
      };

      const result = await firebaseTransactionService.create(minTransaction);
      expect(result.amount).toBe(0.01);

      // Test large amount
      const largeTransaction = {
        amount: 999999.99,
        description: 'Large transaction',
        category: 'other',
        type: 'expense' as const,
        date: new Date(),
        accountId: 'default-account',
      };

      const largeResult = await firebaseTransactionService.create(largeTransaction);
      expect(largeResult.amount).toBe(999999.99);
    });
  });
});