import {
  addTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
} from '../../services/firebase';
import {
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  Timestamp,
  collection,
  query,
} from 'firebase/firestore';
import { Transaction } from '../../types';

jest.mock('../../config/env', () => ({
  firebaseConfig: {
    apiKey: 'test-api-key',
    authDomain: 'test.firebaseapp.com',
    projectId: 'test-project',
    storageBucket: 'test.appspot.com',
    messagingSenderId: '123456',
    appId: 'test-app-id',
    measurementId: 'test-measurement-id',
  },
}));

describe('Firebase Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addTransaction', () => {
    it('should add a transaction successfully', async () => {
      const mockDocRef = { id: 'test-id-123' };
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      const transaction = {
        type: 'expense' as const,
        amount: 50.0,
        category: 'groceries',
        description: 'Weekly groceries',
        date: new Date('2025-01-10'),
      };

      const result = await addTransaction(transaction);

      expect(result).toBe('test-id-123');
      expect(addDoc).toHaveBeenCalled();
      expect(collection).toHaveBeenCalledWith(expect.anything(), 'transactions');
    });

    it('should handle errors when adding a transaction', async () => {
      const mockError = new Error('Firebase error');
      (addDoc as jest.Mock).mockRejectedValue(mockError);

      const transaction = {
        type: 'expense' as const,
        amount: 50.0,
        category: 'groceries',
        description: 'Weekly groceries',
        date: new Date(),
      };

      await expect(addTransaction(transaction)).rejects.toThrow('Firebase error');
    });
  });

  describe('getTransactions', () => {
    it('should retrieve all transactions without date filters', async () => {
      const mockTransactions = [
        {
          id: '1',
          type: 'expense',
          amount: 50,
          category: 'groceries',
          description: 'Test',
          date: { toDate: () => new Date('2025-01-10') },
          createdAt: { toDate: () => new Date('2025-01-10') },
          updatedAt: { toDate: () => new Date('2025-01-10') },
        },
      ];

      const mockQuerySnapshot = {
        forEach: (callback: Function) => {
          mockTransactions.forEach((doc) => {
            callback({
              id: doc.id,
              data: () => doc,
            });
          });
        },
      };

      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await getTransactions();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1',
        type: 'expense',
        amount: 50,
        category: 'groceries',
      });
    });

    it('should retrieve transactions with date filters', async () => {
      const mockQuerySnapshot = {
        forEach: jest.fn(),
      };

      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      await getTransactions(startDate, endDate);

      expect(query).toHaveBeenCalled();
      expect(getDocs).toHaveBeenCalled();
    });
  });

  describe('updateTransaction', () => {
    it('should update a transaction successfully', async () => {
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      const updates = {
        amount: 75,
        description: 'Updated description',
      };

      await updateTransaction('test-id', updates);

      expect(updateDoc).toHaveBeenCalled();
    });

    it('should handle errors when updating a transaction', async () => {
      const mockError = new Error('Update failed');
      (updateDoc as jest.Mock).mockRejectedValue(mockError);

      await expect(updateTransaction('test-id', { amount: 75 })).rejects.toThrow(
        'Update failed'
      );
    });
  });

  describe('deleteTransaction', () => {
    it('should delete a transaction successfully', async () => {
      (deleteDoc as jest.Mock).mockResolvedValue(undefined);

      await deleteTransaction('test-id');

      expect(deleteDoc).toHaveBeenCalled();
    });

    it('should handle errors when deleting a transaction', async () => {
      const mockError = new Error('Delete failed');
      (deleteDoc as jest.Mock).mockRejectedValue(mockError);

      await expect(deleteTransaction('test-id')).rejects.toThrow('Delete failed');
    });
  });
});