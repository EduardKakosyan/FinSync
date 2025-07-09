/**
 * Firebase Category Service for FinSync
 * Handles all category operations with Firestore
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
import { Category } from '../../types';

export interface FirebaseCategory extends Omit<Category, 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp;
  updatedAt: Timestamp | null;
}

export class FirebaseCategoryService {
  private readonly collectionName = 'categories';
  private readonly collection = collection(db, this.collectionName);

  /**
   * Convert Category to Firestore format
   */
  private toFirestore(category: Category): FirebaseCategory {
    return {
      ...category,
      createdAt: Timestamp.fromDate(category.createdAt),
      updatedAt: category.updatedAt ? Timestamp.fromDate(category.updatedAt) : null,
    };
  }

  /**
   * Convert Firestore document to Category
   */
  private fromFirestore(doc: DocumentData): Category {
    const data = doc as FirebaseCategory;
    return {
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : undefined,
    };
  }

  /**
   * Create a new category
   */
  async create(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    const id = doc(this.collection).id;
    const now = new Date();
    const newCategory: Category = {
      ...category,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(this.collection, id), {
      ...this.toFirestore(newCategory),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return newCategory;
  }

  /**
   * Get a category by ID
   */
  async getById(id: string): Promise<Category | null> {
    const docRef = doc(this.collection, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return this.fromFirestore({ ...docSnap.data(), id: docSnap.id });
  }

  /**
   * Get all categories
   */
  async getAll(): Promise<Category[]> {
    const q = query(this.collection, orderBy('name'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => 
      this.fromFirestore({ ...doc.data(), id: doc.id })
    );
  }

  /**
   * Get categories by type
   */
  async getByType(type: 'income' | 'expense' | 'both'): Promise<Category[]> {
    const q = type === 'both' 
      ? query(this.collection, orderBy('name'))
      : query(this.collection, where('type', '==', type), orderBy('name'));
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => 
      this.fromFirestore({ ...doc.data(), id: doc.id })
    );
  }

  /**
   * Update a category
   */
  async update(id: string, updates: Partial<Category>): Promise<Category> {
    const docRef = doc(this.collection, id);
    const existingDoc = await getDoc(docRef);

    if (!existingDoc.exists()) {
      throw new Error('Category not found');
    }

    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.icon !== undefined) updateData.icon = updates.icon;
    if (updates.color !== undefined) updateData.color = updates.color;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.isDefault !== undefined) updateData.isDefault = updates.isDefault;
    if (updates.budget !== undefined) updateData.budget = updates.budget;
    
    updateData.updatedAt = serverTimestamp();

    await updateDoc(docRef, updateData);

    const updatedDoc = await getDoc(docRef);
    return this.fromFirestore({ ...updatedDoc.data(), id: updatedDoc.id });
  }

  /**
   * Delete a category
   */
  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.collection, id));
  }

  /**
   * Initialize default categories
   */
  async initializeDefaults(): Promise<void> {
    const existingCategories = await this.getAll();
    if (existingCategories.length > 0) {
      return; // Already initialized
    }

    const defaultCategories: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[] = [
      // Income categories
      { name: 'Salary', icon: '💰', color: '#00C853', type: 'income', isDefault: true },
      { name: 'Investment', icon: '📈', color: '#2E7D32', type: 'income', isDefault: true },
      { name: 'Business', icon: '💼', color: '#1B5E20', type: 'income', isDefault: true },
      { name: 'Gifts', icon: '🎁', color: '#4CAF50', type: 'income', isDefault: true },
      { name: 'Other Income', icon: '💵', color: '#81C784', type: 'income', isDefault: true },
      
      // Expense categories
      { name: 'Food & Dining', icon: '🍽️', color: '#F44336', type: 'expense', isDefault: true, budget: 500 },
      { name: 'Transportation', icon: '🚗', color: '#E91E63', type: 'expense', isDefault: true, budget: 300 },
      { name: 'Shopping', icon: '🛍️', color: '#9C27B0', type: 'expense', isDefault: true, budget: 400 },
      { name: 'Entertainment', icon: '🎬', color: '#673AB7', type: 'expense', isDefault: true, budget: 200 },
      { name: 'Bills & Utilities', icon: '📱', color: '#3F51B5', type: 'expense', isDefault: true, budget: 800 },
      { name: 'Healthcare', icon: '🏥', color: '#2196F3', type: 'expense', isDefault: true, budget: 200 },
      { name: 'Education', icon: '📚', color: '#03A9F4', type: 'expense', isDefault: true, budget: 300 },
      { name: 'Fitness', icon: '💪', color: '#00BCD4', type: 'expense', isDefault: true, budget: 100 },
      { name: 'Travel', icon: '✈️', color: '#009688', type: 'expense', isDefault: true, budget: 500 },
      { name: 'Insurance', icon: '🛡️', color: '#607D8B', type: 'expense', isDefault: true, budget: 400 },
      { name: 'Rent/Mortgage', icon: '🏠', color: '#795548', type: 'expense', isDefault: true, budget: 1500 },
      { name: 'Savings', icon: '🏦', color: '#FF6F00', type: 'expense', isDefault: true, budget: 1000 },
      { name: 'Other Expense', icon: '💸', color: '#FF5722', type: 'expense', isDefault: true },
    ];

    // Create all default categories
    await Promise.all(defaultCategories.map(category => this.create(category)));
  }
}

// Export singleton instance
export const firebaseCategoryService = new FirebaseCategoryService();
export default firebaseCategoryService;