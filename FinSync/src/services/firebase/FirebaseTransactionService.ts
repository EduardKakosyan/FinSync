/**
 * Firebase Transaction Service for FinSync
 * Handles all transaction operations with Firestore
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
  QueryConstraint,
  updateDoc,
  serverTimestamp,
  startAfter,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from './FirebaseConfig';
import { Transaction, ValidationResult, ValidationError, DateRange, SpendingData } from '../../types';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export interface FirebaseTransaction extends Omit<Transaction, 'date' | 'createdAt' | 'updatedAt'> {
  date: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp | null;
  isRecurring?: boolean;
  recurringInterval?: 'monthly' | 'weekly' | 'yearly';
  recurringDay?: number; // Day of month/week for recurring transactions
  recurringEndDate?: Timestamp;
  parentTransactionId?: string; // For tracking recurring transaction instances
}

export class FirebaseTransactionService {
  private readonly collectionName = 'transactions';
  private readonly collection = collection(db, this.collectionName);

  /**
   * Convert Transaction to Firestore format
   */
  private toFirestore(transaction: Transaction): FirebaseTransaction {
    return {
      ...transaction,
      date: Timestamp.fromDate(transaction.date),
      createdAt: Timestamp.fromDate(transaction.createdAt),
      updatedAt: transaction.updatedAt ? Timestamp.fromDate(transaction.updatedAt) : null,
    };
  }

  /**
   * Convert Firestore document to Transaction
   */
  private fromFirestore(doc: DocumentData): Transaction {
    const data = doc as FirebaseTransaction;
    return {
      ...data,
      date: data.date.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : undefined,
    };
  }

  /**
   * Validate transaction data
   */
  private validateTransaction(transaction: Partial<Transaction>): ValidationResult {
    const errors: ValidationError[] = [];

    if (!transaction.amount || transaction.amount <= 0) {
      errors.push({
        field: 'amount',
        message: 'Amount must be greater than 0',
        code: 'INVALID_AMOUNT',
        value: transaction.amount,
      });
    }

    if (!transaction.date) {
      errors.push({
        field: 'date',
        message: 'Date is required',
        code: 'REQUIRED',
        value: transaction.date,
      });
    }

    if (!transaction.category) {
      errors.push({
        field: 'category',
        message: 'Category is required',
        code: 'REQUIRED',
        value: transaction.category,
      });
    }

    if (!transaction.description || transaction.description.trim().length === 0) {
      errors.push({
        field: 'description',
        message: 'Description is required',
        code: 'REQUIRED',
        value: transaction.description,
      });
    }

    if (!transaction.type || !['income', 'expense'].includes(transaction.type)) {
      errors.push({
        field: 'type',
        message: 'Type must be either income or expense',
        code: 'INVALID_TYPE',
        value: transaction.type,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Create a new transaction
   */
  async create(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const validation = this.validateTransaction(transaction);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    const id = doc(this.collection).id;
    const now = new Date();
    const newTransaction: Transaction = {
      ...transaction,
      id,
      createdAt: now,
      updatedAt: now,
    };

    const firestoreData = this.toFirestore(newTransaction);
    await setDoc(doc(this.collection, id), {
      ...firestoreData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return newTransaction;
  }

  /**
   * Create a recurring transaction
   */
  async createRecurring(
    transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
    recurringOptions: {
      interval: 'monthly' | 'weekly' | 'yearly';
      dayOfMonth?: number; // For monthly
      dayOfWeek?: number; // For weekly (0-6, Sunday-Saturday)
      endDate?: Date;
    }
  ): Promise<Transaction> {
    const id = doc(this.collection).id;
    const now = new Date();
    
    const newTransaction: Transaction & { 
      isRecurring: boolean; 
      recurringInterval: string;
      recurringDay?: number;
      recurringEndDate?: Date;
    } = {
      ...transaction,
      id,
      createdAt: now,
      updatedAt: now,
      isRecurring: true,
      recurringInterval: recurringOptions.interval,
      recurringDay: recurringOptions.dayOfMonth || recurringOptions.dayOfWeek,
      recurringEndDate: recurringOptions.endDate,
    };

    const firestoreData = {
      ...this.toFirestore(newTransaction),
      isRecurring: true,
      recurringInterval: recurringOptions.interval,
      recurringDay: recurringOptions.dayOfMonth || recurringOptions.dayOfWeek,
      recurringEndDate: recurringOptions.endDate ? Timestamp.fromDate(recurringOptions.endDate) : null,
    };

    await setDoc(doc(this.collection, id), {
      ...firestoreData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return newTransaction;
  }

  /**
   * Get a transaction by ID
   */
  async getById(id: string): Promise<Transaction | null> {
    const docRef = doc(this.collection, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return this.fromFirestore({ ...docSnap.data(), id: docSnap.id });
  }

  /**
   * Get all transactions with optional filters
   */
  async getAll(filters?: {
    type?: 'income' | 'expense';
    category?: string;
    accountId?: string;
    isRecurring?: boolean;
    dateRange?: DateRange;
    limit?: number;
    lastDoc?: DocumentSnapshot;
  }): Promise<{ transactions: Transaction[]; lastDoc?: DocumentSnapshot }> {
    const constraints: QueryConstraint[] = [];

    if (filters?.type) {
      constraints.push(where('type', '==', filters.type));
    }

    if (filters?.category) {
      constraints.push(where('category', '==', filters.category));
    }

    if (filters?.accountId) {
      constraints.push(where('accountId', '==', filters.accountId));
    }

    if (filters?.isRecurring !== undefined) {
      constraints.push(where('isRecurring', '==', filters.isRecurring));
    }

    if (filters?.dateRange) {
      constraints.push(
        where('date', '>=', Timestamp.fromDate(filters.dateRange.startDate)),
        where('date', '<=', Timestamp.fromDate(filters.dateRange.endDate))
      );
    }

    constraints.push(orderBy('date', 'desc'));

    if (filters?.lastDoc) {
      constraints.push(startAfter(filters.lastDoc));
    }

    if (filters?.limit) {
      constraints.push(limit(filters.limit));
    }

    const q = query(this.collection, ...constraints);
    const querySnapshot = await getDocs(q);

    const transactions = querySnapshot.docs.map(doc => 
      this.fromFirestore({ ...doc.data(), id: doc.id })
    );

    const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

    return { transactions, lastDoc };
  }

  /**
   * Update a transaction
   */
  async update(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const docRef = doc(this.collection, id);
    const existingDoc = await getDoc(docRef);

    if (!existingDoc.exists()) {
      throw new Error('Transaction not found');
    }

    const validation = this.validateTransaction({ ...existingDoc.data(), ...updates });
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    const updateData: any = {};
    
    // Only update fields that are provided
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.date !== undefined) updateData.date = Timestamp.fromDate(updates.date);
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.accountId !== undefined) updateData.accountId = updates.accountId;
    if (updates.receiptId !== undefined) updateData.receiptId = updates.receiptId;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.location !== undefined) updateData.location = updates.location;
    
    updateData.updatedAt = serverTimestamp();

    await updateDoc(docRef, updateData);

    const updatedDoc = await getDoc(docRef);
    return this.fromFirestore({ ...updatedDoc.data(), id: updatedDoc.id });
  }

  /**
   * Delete a transaction
   */
  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.collection, id));
  }

  /**
   * Get transactions by date range
   */
  async getByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    const { transactions } = await this.getAll({ dateRange: { startDate, endDate } });
    return transactions;
  }

  /**
   * Get recurring transactions
   */
  async getRecurringTransactions(): Promise<Transaction[]> {
    const { transactions } = await this.getAll({ isRecurring: true });
    return transactions;
  }

  /**
   * Process recurring transactions (generate instances for current period)
   */
  async processRecurringTransactions(): Promise<number> {
    const recurringTransactions = await this.getRecurringTransactions();
    let processed = 0;

    for (const recurring of recurringTransactions) {
      const firestoreData = recurring as any;
      if (!firestoreData.isRecurring || !firestoreData.recurringInterval) continue;

      // Check if we need to create an instance for this period
      const today = new Date();
      const shouldCreate = this.shouldCreateRecurringInstance(
        recurring.date,
        firestoreData.recurringInterval,
        firestoreData.recurringDay,
        today
      );

      if (shouldCreate) {
        // Create new instance
        await this.create({
          ...recurring,
          date: this.getNextRecurringDate(
            recurring.date,
            firestoreData.recurringInterval,
            firestoreData.recurringDay
          ),
          parentTransactionId: recurring.id,
        });
        processed++;
      }
    }

    return processed;
  }

  /**
   * Calculate spending data
   */
  async calculateSpendingData(dateRange: DateRange): Promise<SpendingData> {
    const transactions = await this.getByDateRange(dateRange.startDate, dateRange.endDate);
    
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const categoryMap = new Map<string, { amount: number; count: number }>();
    transactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const existing = categoryMap.get(transaction.category) || { amount: 0, count: 0 };
        categoryMap.set(transaction.category, {
          amount: existing.amount + transaction.amount,
          count: existing.count + 1,
        });
      });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(
      ([categoryId, data]) => ({
        categoryId,
        categoryName: categoryId,
        categoryColor: '#007AFF',
        amount: data.amount,
        percentage: expenses > 0 ? (data.amount / expenses) * 100 : 0,
        transactionCount: data.count,
        trend: 'stable' as const,
      })
    ).sort((a, b) => b.amount - a.amount);

    const daysDiff = Math.ceil(
      (dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netIncome: income - expenses,
      categoryBreakdown,
      monthlyTrend: [],
      dailyAverage: expenses / (daysDiff || 1),
      topCategories: categoryBreakdown.slice(0, 5),
      period: dateRange,
    };
  }

  /**
   * Helper methods for recurring transactions
   */
  private shouldCreateRecurringInstance(
    lastDate: Date,
    interval: string,
    recurringDay: number | undefined,
    currentDate: Date
  ): boolean {
    const daysSinceLastInstance = Math.floor(
      (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    switch (interval) {
      case 'weekly':
        return daysSinceLastInstance >= 7;
      case 'monthly':
        const lastMonth = lastDate.getMonth();
        const currentMonth = currentDate.getMonth();
        const lastYear = lastDate.getFullYear();
        const currentYear = currentDate.getFullYear();
        return currentYear > lastYear || (currentYear === lastYear && currentMonth > lastMonth);
      case 'yearly':
        return currentDate.getFullYear() > lastDate.getFullYear();
      default:
        return false;
    }
  }

  private getNextRecurringDate(
    lastDate: Date,
    interval: string,
    recurringDay: number | undefined
  ): Date {
    const nextDate = new Date(lastDate);

    switch (interval) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        if (recurringDay) {
          nextDate.setDate(Math.min(recurringDay, new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate()));
        }
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }

    return nextDate;
  }
}

// Export singleton instance
export const firebaseTransactionService = new FirebaseTransactionService();
export default firebaseTransactionService;