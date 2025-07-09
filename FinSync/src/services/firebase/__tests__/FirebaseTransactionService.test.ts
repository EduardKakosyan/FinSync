/**
 * Unit tests for Firebase Transaction Service
 * Tests all transaction functionality including creation, validation, and Firebase interactions
 */

import { firebaseTransactionService } from '../FirebaseTransactionService';
import { Transaction, CreateTransactionInput } from '../../../types';

// Mock Firebase
jest.mock('../FirebaseConfig', () => ({
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
  getDocs: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  Timestamp: {
    fromDate: jest.fn((date: Date) => ({ toDate: () => date })),
  },
  serverTimestamp: jest.fn(() => ({ isServerTimestamp: true })),
  startAfter: jest.fn(),
  updateDoc: jest.fn(),
}));

describe('FirebaseTransactionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Transaction Creation', () => {
    const validTransactionData: CreateTransactionInput = {
      amount: 50.00,
      description: 'Coffee purchase',
      category: 'food',
      type: 'expense',
      date: new Date('2024-01-15T10:30:00Z'),
      accountId: 'default-account',
      notes: 'Morning coffee',
      location: 'Starbucks',
    };

    it('should create a valid transaction successfully', async () => {
      const mockSetDoc = require('firebase/firestore').setDoc;
      mockSetDoc.mockResolvedValueOnce(undefined);

      const result = await firebaseTransactionService.create(validTransactionData);

      expect(result).toMatchObject({
        id: 'test-transaction-id',
        amount: 50.00,
        description: 'Coffee purchase',
        category: 'food',
        type: 'expense',
        accountId: 'default-account',
        notes: 'Morning coffee',
        location: 'Starbucks',
      });
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        ...validTransactionData,
        amount: 0,
        description: '',
        category: '',
        type: 'invalid' as any,
      };

      await expect(firebaseTransactionService.create(invalidData)).rejects.toThrow(
        'Validation failed: Amount must be greater than 0, Category is required, Description is required, Type must be either income or expense'
      );
    });

    it('should validate amount is positive', async () => {
      const invalidData = {
        ...validTransactionData,
        amount: -10,
      };

      await expect(firebaseTransactionService.create(invalidData)).rejects.toThrow(
        'Validation failed: Amount must be greater than 0'
      );
    });

    it('should validate transaction type', async () => {
      const invalidData = {
        ...validTransactionData,
        type: 'invalid' as any,
      };

      await expect(firebaseTransactionService.create(invalidData)).rejects.toThrow(
        'Validation failed: Type must be either income or expense'
      );
    });

    it('should validate date is provided', async () => {
      const invalidData = {
        ...validTransactionData,
        date: undefined as any,
      };

      await expect(firebaseTransactionService.create(invalidData)).rejects.toThrow(
        'Validation failed: Date is required'
      );
    });

    it('should handle Firebase errors gracefully', async () => {
      const mockSetDoc = require('firebase/firestore').setDoc;
      mockSetDoc.mockRejectedValueOnce(new Error('Firebase connection error'));

      await expect(firebaseTransactionService.create(validTransactionData)).rejects.toThrow(
        'Firebase connection error'
      );
    });
  });

  describe('Recurring Transactions', () => {
    const validRecurringData: CreateTransactionInput = {
      amount: 2000.00,
      description: 'Monthly salary',
      category: 'income',
      type: 'income',
      date: new Date('2024-01-01T00:00:00Z'),
      accountId: 'default-account',
    };

    it('should create monthly recurring transaction', async () => {
      const mockSetDoc = require('firebase/firestore').setDoc;
      mockSetDoc.mockResolvedValueOnce(undefined);

      const result = await firebaseTransactionService.createRecurring(validRecurringData, {
        interval: 'monthly',
        dayOfMonth: 1,
      });

      expect(result).toMatchObject({
        id: 'test-transaction-id',
        amount: 2000.00,
        description: 'Monthly salary',
        category: 'income',
        type: 'income',
        accountId: 'default-account',
        isRecurring: true,
        recurringInterval: 'monthly',
        recurringDay: 1,
      });
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
    });

    it('should create weekly recurring transaction', async () => {
      const mockSetDoc = require('firebase/firestore').setDoc;
      mockSetDoc.mockResolvedValueOnce(undefined);

      const result = await firebaseTransactionService.createRecurring(validRecurringData, {
        interval: 'weekly',
        dayOfWeek: 1, // Monday
      });

      expect(result).toMatchObject({
        isRecurring: true,
        recurringInterval: 'weekly',
        recurringDay: 1,
      });
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
    });

    it('should create yearly recurring transaction', async () => {
      const mockSetDoc = require('firebase/firestore').setDoc;
      mockSetDoc.mockResolvedValueOnce(undefined);

      const result = await firebaseTransactionService.createRecurring(validRecurringData, {
        interval: 'yearly',
        endDate: new Date('2025-12-31T23:59:59Z'),
      });

      expect(result).toMatchObject({
        isRecurring: true,
        recurringInterval: 'yearly',
        recurringEndDate: new Date('2025-12-31T23:59:59Z'),
      });
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
    });
  });

  describe('Transaction Retrieval', () => {
    it('should get transaction by ID', async () => {
      const mockGetDoc = require('firebase/firestore').getDoc;
      const mockDoc = require('firebase/firestore').doc;
      
      mockDoc.mockReturnValue({ id: 'test-id' });
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          id: 'test-id',
          amount: 25.99,
          description: 'Test transaction',
          category: 'food',
          type: 'expense',
          date: { toDate: () => new Date('2024-01-15T10:30:00Z') },
          createdAt: { toDate: () => new Date('2024-01-15T10:30:00Z') },
          updatedAt: { toDate: () => new Date('2024-01-15T10:30:00Z') },
          accountId: 'default-account',
        }),
        id: 'test-id',
      });

      const result = await firebaseTransactionService.getById('test-id');

      expect(result).toMatchObject({
        id: 'test-id',
        amount: 25.99,
        description: 'Test transaction',
        category: 'food',
        type: 'expense',
        accountId: 'default-account',
      });
      expect(result?.date).toBeInstanceOf(Date);
    });

    it('should return null for non-existent transaction', async () => {
      const mockGetDoc = require('firebase/firestore').getDoc;
      const mockDoc = require('firebase/firestore').doc;
      
      mockDoc.mockReturnValue({ id: 'non-existent' });
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      const result = await firebaseTransactionService.getById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('Transaction Filtering', () => {
    it('should filter transactions by type', async () => {
      const mockGetDocs = require('firebase/firestore').getDocs;
      const mockQuery = require('firebase/firestore').query;
      const mockWhere = require('firebase/firestore').where;
      const mockOrderBy = require('firebase/firestore').orderBy;

      mockQuery.mockReturnValue('mocked-query');
      mockWhere.mockReturnValue('where-constraint');
      mockOrderBy.mockReturnValue('order-constraint');
      
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 'expense-1',
            data: () => ({
              amount: 50.00,
              type: 'expense',
              category: 'food',
              description: 'Lunch',
              date: { toDate: () => new Date() },
              createdAt: { toDate: () => new Date() },
              updatedAt: { toDate: () => new Date() },
            }),
          },
        ],
      });

      const result = await firebaseTransactionService.getAll({ type: 'expense' });

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].type).toBe('expense');
      expect(mockWhere).toHaveBeenCalledWith('type', '==', 'expense');
    });

    it('should filter transactions by category', async () => {
      const mockGetDocs = require('firebase/firestore').getDocs;
      const mockQuery = require('firebase/firestore').query;
      const mockWhere = require('firebase/firestore').where;
      const mockOrderBy = require('firebase/firestore').orderBy;

      mockQuery.mockReturnValue('mocked-query');
      mockWhere.mockReturnValue('where-constraint');
      mockOrderBy.mockReturnValue('order-constraint');
      
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 'food-1',
            data: () => ({
              amount: 30.00,
              type: 'expense',
              category: 'food',
              description: 'Groceries',
              date: { toDate: () => new Date() },
              createdAt: { toDate: () => new Date() },
              updatedAt: { toDate: () => new Date() },
            }),
          },
        ],
      });

      const result = await firebaseTransactionService.getAll({ category: 'food' });

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].category).toBe('food');
      expect(mockWhere).toHaveBeenCalledWith('category', '==', 'food');
    });
  });

  describe('Transaction Updates', () => {
    it('should update transaction successfully', async () => {
      const mockGetDoc = require('firebase/firestore').getDoc;
      const mockUpdateDoc = require('firebase/firestore').updateDoc;
      const mockDoc = require('firebase/firestore').doc;
      
      mockDoc.mockReturnValue({ id: 'test-id' });
      
      // Mock existing transaction
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          id: 'test-id',
          amount: 25.99,
          description: 'Old description',
          category: 'food',
          type: 'expense',
          date: { toDate: () => new Date('2024-01-15T10:30:00Z') },
          createdAt: { toDate: () => new Date('2024-01-15T10:30:00Z') },
          updatedAt: { toDate: () => new Date('2024-01-15T10:30:00Z') },
          accountId: 'default-account',
        }),
      });

      // Mock update success
      mockUpdateDoc.mockResolvedValueOnce(undefined);

      // Mock updated transaction
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          id: 'test-id',
          amount: 30.00,
          description: 'New description',
          category: 'food',
          type: 'expense',
          date: { toDate: () => new Date('2024-01-15T10:30:00Z') },
          createdAt: { toDate: () => new Date('2024-01-15T10:30:00Z') },
          updatedAt: { toDate: () => new Date() },
          accountId: 'default-account',
        }),
        id: 'test-id',
      });

      const result = await firebaseTransactionService.update('test-id', {
        amount: 30.00,
        description: 'New description',
      });

      expect(result.amount).toBe(30.00);
      expect(result.description).toBe('New description');
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    });

    it('should throw error when updating non-existent transaction', async () => {
      const mockGetDoc = require('firebase/firestore').getDoc;
      const mockDoc = require('firebase/firestore').doc;
      
      mockDoc.mockReturnValue({ id: 'non-existent' });
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      await expect(
        firebaseTransactionService.update('non-existent', { amount: 100 })
      ).rejects.toThrow('Transaction not found');
    });
  });

  describe('Transaction Deletion', () => {
    it('should delete transaction successfully', async () => {
      const mockDeleteDoc = require('firebase/firestore').deleteDoc;
      const mockDoc = require('firebase/firestore').doc;
      
      mockDoc.mockReturnValue({ id: 'test-id' });
      mockDeleteDoc.mockResolvedValueOnce(undefined);

      await firebaseTransactionService.delete('test-id');

      expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
    });
  });

  describe('Data Validation Edge Cases', () => {
    it('should handle empty description', async () => {
      const invalidData = {
        amount: 50.00,
        description: '   ', // Only whitespace
        category: 'food',
        type: 'expense' as const,
        date: new Date(),
        accountId: 'default-account',
      };

      await expect(firebaseTransactionService.create(invalidData)).rejects.toThrow(
        'Validation failed: Description is required'
      );
    });

    it('should handle very large amounts', async () => {
      const mockSetDoc = require('firebase/firestore').setDoc;
      mockSetDoc.mockResolvedValueOnce(undefined);

      const largeAmountData = {
        amount: 999999999.99,
        description: 'Large transaction',
        category: 'income',
        type: 'income' as const,
        date: new Date(),
        accountId: 'default-account',
      };

      const result = await firebaseTransactionService.create(largeAmountData);

      expect(result.amount).toBe(999999999.99);
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
    });

    it('should handle minimum positive amount', async () => {
      const mockSetDoc = require('firebase/firestore').setDoc;
      mockSetDoc.mockResolvedValueOnce(undefined);

      const minAmountData = {
        amount: 0.01,
        description: 'Minimum transaction',
        category: 'expense',
        type: 'expense' as const,
        date: new Date(),
        accountId: 'default-account',
      };

      const result = await firebaseTransactionService.create(minAmountData);

      expect(result.amount).toBe(0.01);
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
    });
  });

  describe('Firebase Integration', () => {
    it('should handle Firebase offline scenarios', async () => {
      const mockSetDoc = require('firebase/firestore').setDoc;
      mockSetDoc.mockRejectedValueOnce(new Error('Firebase: Client is offline'));

      const validData = {
        amount: 50.00,
        description: 'Test transaction',
        category: 'food',
        type: 'expense' as const,
        date: new Date(),
        accountId: 'default-account',
      };

      await expect(firebaseTransactionService.create(validData)).rejects.toThrow(
        'Firebase: Client is offline'
      );
    });

    it('should handle Firebase permission errors', async () => {
      const mockSetDoc = require('firebase/firestore').setDoc;
      mockSetDoc.mockRejectedValueOnce(new Error('Missing or insufficient permissions'));

      const validData = {
        amount: 50.00,
        description: 'Test transaction',
        category: 'food',
        type: 'expense' as const,
        date: new Date(),
        accountId: 'default-account',
      };

      await expect(firebaseTransactionService.create(validData)).rejects.toThrow(
        'Missing or insufficient permissions'
      );
    });
  });
});