/**
 * Category Data Service for FinSync Financial App
 * Handles CRUD operations for transaction categories
 */

import BaseDataService from './BaseDataService';
import { STORAGE_KEYS } from './StorageKeys';
import {
  Category,
  ValidationResult,
  ValidationError,
  CreateCategoryInput,
} from '../../types';

export class CategoryService extends BaseDataService<Category> {
  constructor() {
    super(STORAGE_KEYS.CATEGORIES, 'category');
  }

  /**
   * Validate category data
   */
  protected validateEntity(category: Partial<Category>): ValidationResult {
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

    if (!category.type || !['income', 'expense'].includes(category.type)) {
      errors.push({
        field: 'type',
        message: 'Type must be either income or expense',
        code: 'INVALID_VALUE',
        value: category.type,
      });
    }

    if (category.budgetLimit !== undefined && category.budgetLimit <= 0) {
      errors.push({
        field: 'budgetLimit',
        message: 'Budget limit must be greater than 0',
        code: 'MIN_VALUE',
        value: category.budgetLimit,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Transform category for storage
   */
  protected transformForStorage(category: Category): any {
    return {
      ...category,
      createdAt: category.createdAt.toISOString(),
    };
  }

  /**
   * Transform category from storage
   */
  protected transformFromStorage(data: any): Category {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
    };
  }

  /**
   * Create a new category with validation for duplicates
   */
  async create(categoryData: CreateCategoryInput): Promise<Category> {
    // Check for duplicate names within the same type
    const existing = await this.getByNameAndType(categoryData.name, categoryData.type);
    if (existing) {
      throw new Error(`Category with name "${categoryData.name}" already exists for ${categoryData.type}`);
    }

    return super.create(categoryData);
  }

  /**
   * Get categories by type
   */
  async getByType(type: 'income' | 'expense'): Promise<Category[]> {
    const categories = await this.getAll();
    return categories.filter(category => category.type === type);
  }

  /**
   * Get category by name and type
   */
  async getByNameAndType(name: string, type: 'income' | 'expense'): Promise<Category | null> {
    const categories = await this.getAll();
    return categories.find(category => 
      category.name.toLowerCase() === name.toLowerCase() && category.type === type
    ) || null;
  }

  /**
   * Get parent categories (categories without parent)
   */
  async getParentCategories(): Promise<Category[]> {
    const categories = await this.getAll();
    return categories.filter(category => !category.parentCategoryId);
  }

  /**
   * Get subcategories for a parent category
   */
  async getSubcategories(parentCategoryId: string): Promise<Category[]> {
    const categories = await this.getAll();
    return categories.filter(category => category.parentCategoryId === parentCategoryId);
  }

  /**
   * Get categories with budget limits
   */
  async getCategoriesWithBudgets(): Promise<Category[]> {
    const categories = await this.getAll();
    return categories.filter(category => category.budgetLimit !== undefined);
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
   * Update category budget limit
   */
  async updateBudgetLimit(categoryId: string, budgetLimit: number | undefined): Promise<Category> {
    if (budgetLimit !== undefined && budgetLimit <= 0) {
      throw new Error('Budget limit must be greater than 0');
    }

    return this.update(categoryId, { budgetLimit });
  }

  /**
   * Get category hierarchy (parent-child relationships)
   */
  async getCategoryHierarchy(): Promise<Array<Category & { subcategories: Category[] }>> {
    const categories = await this.getAll();
    const parentCategories = categories.filter(cat => !cat.parentCategoryId);
    
    return parentCategories.map(parent => ({
      ...parent,
      subcategories: categories.filter(cat => cat.parentCategoryId === parent.id),
    }));
  }

  /**
   * Get default categories for initial setup
   */
  static getDefaultCategories(): CreateCategoryInput[] {
    const expenseCategories: CreateCategoryInput[] = [
      { name: 'Food & Dining', color: '#FF6B6B', type: 'expense' },
      { name: 'Shopping', color: '#4ECDC4', type: 'expense' },
      { name: 'Transportation', color: '#45B7D1', type: 'expense' },
      { name: 'Bills & Utilities', color: '#96CEB4', type: 'expense' },
      { name: 'Health & Medical', color: '#FFEAA7', type: 'expense' },
      { name: 'Entertainment', color: '#DDA0DD', type: 'expense' },
      { name: 'Travel', color: '#98D8C8', type: 'expense' },
      { name: 'Education', color: '#F7DC6F', type: 'expense' },
      { name: 'Home & Garden', color: '#BB8FCE', type: 'expense' },
      { name: 'Insurance', color: '#85C1E9', type: 'expense' },
      { name: 'Taxes', color: '#F8C471', type: 'expense' },
      { name: 'Miscellaneous', color: '#D5DBDB', type: 'expense' },
    ];

    const incomeCategories: CreateCategoryInput[] = [
      { name: 'Salary', color: '#52C41A', type: 'income' },
      { name: 'Freelance', color: '#1890FF', type: 'income' },
      { name: 'Investments', color: '#722ED1', type: 'income' },
      { name: 'Business', color: '#13C2C2', type: 'income' },
      { name: 'Gifts', color: '#FA8C16', type: 'income' },
      { name: 'Other Income', color: '#A0D911', type: 'income' },
    ];

    return [...expenseCategories, ...incomeCategories];
  }

  /**
   * Initialize default categories (for first-time setup)
   */
  async initializeDefaultCategories(): Promise<Category[]> {
    const existingCategories = await this.getAll();
    if (existingCategories.length > 0) {
      throw new Error('Categories already exist. Cannot initialize defaults.');
    }

    const defaultCategories = CategoryService.getDefaultCategories();
    const createdCategories: Category[] = [];

    for (const categoryData of defaultCategories) {
      try {
        const category = await this.create(categoryData);
        createdCategories.push(category);
      } catch (error) {
        console.warn(`Failed to create default category ${categoryData.name}:`, error);
      }
    }

    return createdCategories;
  }

  /**
   * Enhanced text search for categories
   */
  protected filterByText(categories: Category[], text: string): Category[] {
    const searchTerm = text.toLowerCase();
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm) ||
      category.type.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Get category color palette (all unique colors)
   */
  async getColorPalette(): Promise<string[]> {
    const categories = await this.getAll();
    const colors = categories.map(cat => cat.color);
    return Array.from(new Set(colors));
  }

  /**
   * Validate category hierarchy (prevent circular references)
   */
  async validateHierarchy(categoryId: string, parentCategoryId?: string): Promise<boolean> {
    if (!parentCategoryId) {
      return true; // No parent, always valid
    }

    if (categoryId === parentCategoryId) {
      return false; // Category cannot be its own parent
    }

    // Check for circular reference
    const categories = await this.getAll();
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
    
    let currentParent = parentCategoryId;
    const visited = new Set<string>();

    while (currentParent) {
      if (visited.has(currentParent)) {
        return false; // Circular reference detected
      }
      
      if (currentParent === categoryId) {
        return false; // Circular reference detected
      }

      visited.add(currentParent);
      const parentCategory = categoryMap.get(currentParent);
      currentParent = parentCategory?.parentCategoryId;
    }

    return true;
  }

  /**
   * Move category to different parent (with validation)
   */
  async moveToParent(categoryId: string, newParentId?: string): Promise<Category> {
    const isValidHierarchy = await this.validateHierarchy(categoryId, newParentId);
    if (!isValidHierarchy) {
      throw new Error('Invalid hierarchy: Circular reference detected');
    }

    return this.update(categoryId, { parentCategoryId: newParentId });
  }

  /**
   * Delete category with subcategory handling
   */
  async delete(id: string, handleSubcategories: 'delete' | 'orphan' = 'orphan'): Promise<boolean> {
    const subcategories = await this.getSubcategories(id);
    
    if (subcategories.length > 0) {
      if (handleSubcategories === 'delete') {
        // Delete all subcategories
        for (const subcategory of subcategories) {
          await super.delete(subcategory.id);
        }
      } else {
        // Orphan subcategories (remove parent reference)
        for (const subcategory of subcategories) {
          await this.update(subcategory.id, { parentCategoryId: undefined });
        }
      }
    }

    return super.delete(id);
  }
}

// Singleton instance
export const categoryService = new CategoryService();
export default categoryService;