/**
 * Firebase Account Service for FinSync
 * Handles all account operations with Firestore
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
  Timestamp,
  DocumentData,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './FirebaseConfig';
import { Account } from '../../types';

export interface FirebaseAccount extends Omit<Account, 'createdAt' | 'updatedAt' | 'lastSyncedAt'> {
  createdAt: Timestamp;
  updatedAt: Timestamp | null;
  lastSyncedAt: Timestamp | null;
}

export class FirebaseAccountService {
  private readonly collectionName = 'accounts';
  private readonly collection = collection(db, this.collectionName);

  /**
   * Convert Account to Firestore format
   */
  private toFirestore(account: Account): FirebaseAccount {
    return {
      ...account,
      createdAt: Timestamp.fromDate(account.createdAt),
      updatedAt: account.updatedAt ? Timestamp.fromDate(account.updatedAt) : null,
      lastSyncedAt: account.lastSyncedAt ? Timestamp.fromDate(account.lastSyncedAt) : null,
    };
  }

  /**
   * Convert Firestore document to Account
   */
  private fromFirestore(doc: DocumentData): Account {
    const data = doc as FirebaseAccount;
    return {
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : undefined,
      lastSyncedAt: data.lastSyncedAt ? data.lastSyncedAt.toDate() : undefined,
    };
  }

  /**
   * Create a new account
   */
  async create(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account> {
    const id = doc(this.collection).id;
    const now = new Date();
    const newAccount: Account = {
      ...account,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(this.collection, id), {
      ...this.toFirestore(newAccount),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return newAccount;
  }

  /**
   * Get an account by ID
   */
  async getById(id: string): Promise<Account | null> {
    const docRef = doc(this.collection, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return this.fromFirestore({ ...docSnap.data(), id: docSnap.id });
  }

  /**
   * Get all accounts
   */
  async getAll(): Promise<Account[]> {
    const q = query(this.collection, orderBy('name'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => 
      this.fromFirestore({ ...doc.data(), id: doc.id })
    );
  }

  /**
   * Get accounts by type
   */
  async getByType(type: Account['type']): Promise<Account[]> {
    const q = query(this.collection, where('type', '==', type), orderBy('name'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => 
      this.fromFirestore({ ...doc.data(), id: doc.id })
    );
  }

  /**
   * Update an account
   */
  async update(id: string, updates: Partial<Account>): Promise<Account> {
    const docRef = doc(this.collection, id);
    const existingDoc = await getDoc(docRef);

    if (!existingDoc.exists()) {
      throw new Error('Account not found');
    }

    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.balance !== undefined) updateData.balance = updates.balance;
    if (updates.currency !== undefined) updateData.currency = updates.currency;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.institution !== undefined) updateData.institution = updates.institution;
    if (updates.color !== undefined) updateData.color = updates.color;
    if (updates.icon !== undefined) updateData.icon = updates.icon;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.lastSyncedAt !== undefined) {
      updateData.lastSyncedAt = Timestamp.fromDate(updates.lastSyncedAt);
    }
    
    updateData.updatedAt = serverTimestamp();

    await updateDoc(docRef, updateData);

    const updatedDoc = await getDoc(docRef);
    return this.fromFirestore({ ...updatedDoc.data(), id: updatedDoc.id });
  }

  /**
   * Update account balance
   */
  async updateBalance(id: string, newBalance: number): Promise<Account> {
    return this.update(id, { balance: newBalance, lastSyncedAt: new Date() });
  }

  /**
   * Delete an account
   */
  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.collection, id));
  }

  /**
   * Get active accounts
   */
  async getActiveAccounts(): Promise<Account[]> {
    const q = query(this.collection, where('isActive', '==', true), orderBy('name'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => 
      this.fromFirestore({ ...doc.data(), id: doc.id })
    );
  }

  /**
   * Get total balance across all accounts
   */
  async getTotalBalance(currency?: string): Promise<number> {
    const accounts = await this.getActiveAccounts();
    
    if (currency) {
      return accounts
        .filter(account => account.currency === currency)
        .reduce((total, account) => total + account.balance, 0);
    }

    // For mixed currencies, this is a simplified sum (should use exchange rates in production)
    return accounts.reduce((total, account) => total + account.balance, 0);
  }

  /**
   * Initialize default account
   */
  async initializeDefault(): Promise<void> {
    const existingAccounts = await this.getAll();
    if (existingAccounts.length > 0) {
      return; // Already initialized
    }

    await this.create({
      name: 'Main Account',
      type: 'checking',
      balance: 0,
      currency: 'USD',
      institution: 'Default Bank',
      color: '#007AFF',
      icon: '🏦',
      isActive: true,
      isDefault: true,
    });
  }
}

// Export singleton instance
export const firebaseAccountService = new FirebaseAccountService();
export default firebaseAccountService;