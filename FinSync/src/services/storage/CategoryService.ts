/**
 * Category Data Service for FinSync Financial App
 * Handles CRUD operations for transaction categories
 * Updated to use Firebase backend
 */

import { firebaseCategoryService } from '../firebase';
import {
  Category,
  ValidationResult,
  ValidationError,
  CreateCategoryInput,
} from '../../types';

export class CategoryService {
  private firebaseService = firebaseCategoryService;

  /**
   * Validate category data
   */
  private validateEntity(category: Partial<Category>): ValidationResult {
    const errors: ValidationError[] = [];

    // Required fields validation
    if (!category.name || category.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Category name is required',
        code: 'REQUIRED',
        value: category.name,
      });
    } else if (category.name.length > 50) {
      errors.push({
        field: 'name',
        message: 'Category name must be 50 characters or less',
        code: 'MAX_LENGTH',
        value: category.name,
      });
    }

    if (!category.color || category.color.trim().length === 0) {
      errors.push({
        field: 'color',
        message: 'Category color is required',
        code: 'REQUIRED',
        value: category.color,
      });
    } else if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(category.color)) {
      errors.push({
        field: 'color',
        message: 'Color must be a valid hex color (e.g., #FF0000)',
        code: 'INVALID_FORMAT',
        value: category.color,
      });
    }

    if (!category.icon) {
      errors.push({
        field: 'icon',
        message: 'Icon is required',
        code: 'REQUIRED',
        value: category.icon,
      });
    }

    if (!category.type || !['income', 'expense', 'both'].includes(category.type)) {
      errors.push({
        field: 'type',
        message: 'Type must be income, expense, or both',
        code: 'INVALID_VALUE',
        value: category.type,
      });
    }

    if (category.budget !== undefined && category.budget < 0) {
      errors.push({
        field: 'budget',
        message: 'Budget cannot be negative',
        code: 'MIN_VALUE',
        value: category.budget,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Create a new category
   */
  async create(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    const validation = this.validateEntity(category);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }
    return this.firebaseService.create(category);
  }

  /**
   * Get a category by ID
   */
  async getById(id: string): Promise<Category | null> {
    return this.firebaseService.getById(id);
  }

  /**
   * Get all categories
   */
  async getAll(): Promise<Category[]> {
    return this.firebaseService.getAll();
  }

  /**
   * Update a category
   */
  async update(id: string, updates: Partial<Category>): Promise<Category> {
    const validation = this.validateEntity(updates);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }
    return this.firebaseService.update(id, updates);
  }

  /**
   * Delete a category
   */
  async delete(id: string): Promise<boolean> {
    await this.firebaseService.delete(id);
    return true;
  }


  /**
   * Get categories by type
   */
  async getByType(type: 'income' | 'expense' | 'both'): Promise<Category[]> {
    return this.firebaseService.getByType(type);
  }

  /**
   * Get category by name and type
   */
  async getByNameAndType(name: string, type: 'income' | 'expense' | 'both'): Promise<Category | null> {
    const categories = await this.getAll();
    return categories.find(category => 
      category.name.toLowerCase() === name.toLowerCase() && category.type === type
    ) || null;
  }

  /**
   * Get expense categories with budgets
   */
  async getExpenseCategoriesWithBudgets(): Promise<Category[]> {
    const categories = await this.getByType('expense');
    return categories.filter(category => category.budget !== undefined && category.budget > 0);
  }

  /**
   * Get default categories
   */
  async getDefaultCategories(): Promise<Category[]> {
    const categories = await this.getAll();
    return categories.filter(category => category.isDefault);
  }

  /**
   * Initialize default categories if needed
   */
  async initializeDefaults(): Promise<void> {
    return this.firebaseService.initializeDefaults();
  }

  /**
   * Get expense categories (common use case)
   */
  async getExpenseCategories(): Promise<Category[]> {
    return this.getByType('expense');
  }

  /**
   * Get income categories (common use case)
   */
  async getIncomeCategories(): Promise<Category[]> {
    return this.getByType('income');
  }

  /**
   * Search categories by name
   */
  async searchByName(searchTerm: string): Promise<Category[]> {
    const categories = await this.getAll();
    const term = searchTerm.toLowerCase();
    return categories.filter(category => 
      category.name.toLowerCase().includes(term)
    );
  }

  /**
   * Get total budget for all expense categories
   */
  async getTotalBudget(): Promise<number> {
    const categories = await this.getExpenseCategoriesWithBudgets();
    return categories.reduce((total, category) => total + (category.budget || 0), 0);
  }





}

// Singleton instance
export const categoryService = new CategoryService();
export default categoryService;