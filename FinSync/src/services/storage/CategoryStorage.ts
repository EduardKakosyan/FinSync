/**
 * Category Storage Service for FinSync Financial App
 * Provides category management with default categories, hierarchy support,
 * budget integration, and comprehensive category analytics
 */

import BaseDataService, { BaseEntity, DataServiceOptions } from './BaseDataService';
import StorageService from './StorageService';
import { STORAGE_KEYS, DEFAULT_STORAGE_OPTIONS } from './StorageKeys';
import {
  Category,
  CreateCategoryInput,
  ValidationResult,
  ValidationError,
  CategorySpending,
  Budget,
  Transaction,
} from '../../types';

export interface CategoryWithMetadata extends Category {
  transactionCount?: number;
  totalSpent?: number;
  budgetAmount?: number;
  budgetUsed?: number;
  budgetRemaining?: number;
  children?: CategoryWithMetadata[];
  parent?: CategoryWithMetadata;
  isDefault?: boolean;
}

export interface CategoryHierarchy {
  root: CategoryWithMetadata[];
  byId: Map<string, CategoryWithMetadata>;
  byType: Map<'income' | 'expense', CategoryWithMetadata[]>;
}

export interface DefaultCategoryConfig {
  name: string;
  color: string;
  type: 'income' | 'expense';
  icon?: string;
  parentCategory?: string;
  budgetLimit?: number;
  isSystemCategory?: boolean;
}

/**
 * Category Storage Service
 */
export class CategoryStorage extends BaseDataService<Category> {
  private static instance: CategoryStorage | null = null;
  private categoryHierarchy: CategoryHierarchy | null = null;

  constructor(options?: DataServiceOptions) {
    super(STORAGE_KEYS.CATEGORIES, 'category', options);
  }

  /**
   * Singleton pattern for consistent instance
   */
  static getInstance(options?: DataServiceOptions): CategoryStorage {
    if (!this.instance) {
      this.instance = new CategoryStorage(options);
    }
    return this.instance;
  }

  /**
   * Initialize with default categories if none exist
   */
  async initializeWithDefaults(): Promise<void> {
    const existingCategories = await this.getAll();
    
    if (existingCategories.length === 0) {
      console.log('No categories found, initializing with defaults...');
      await this.createDefaultCategories();
    }
    
    // Always rebuild hierarchy after initialization
    await this.buildCategoryHierarchy();
  }

  /**
   * Create default categories
   */
  async createDefaultCategories(): Promise<Category[]> {
    // Start with empty categories for clean user experience
    const defaultCategories: DefaultCategoryConfig[] = [];

    const createdCategories: Category[] = [];
    const parentMap = new Map<string, string>(); // child name -> parent name

    // First pass: create all categories and track parent relationships
    for (const config of defaultCategories) {
      const categoryData: CreateCategoryInput = {
        name: config.name,
        color: config.color,
        type: config.type,
        budgetLimit: config.budgetLimit,
      };

      const category = await this.create(categoryData);
      createdCategories.push(category);

      if (config.parentCategory) {
        parentMap.set(config.name, config.parentCategory);
      }
    }

    // Second pass: set up parent-child relationships
    for (const category of createdCategories) {
      const parentName = parentMap.get(category.name);
      if (parentName) {
        const parentCategory = createdCategories.find(c => c.name === parentName);
        if (parentCategory) {
          await this.update(category.id, { parentCategoryId: parentCategory.id });
        }
      }
    }

    // Update storage metadata
    await StorageService.updateStorageMetadata(this.storageKey, await this.getAll());

    return createdCategories;
  }

  /**
   * Create category with hierarchy validation
   */
  async createCategory(categoryData: CreateCategoryInput): Promise<Category> {
    // Validate category data
    const validation = this.validateCategoryData(categoryData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Check for duplicate names
    const existingCategories = await this.getAll();
    const duplicate = existingCategories.find(c => 
      c.name.toLowerCase() === categoryData.name.toLowerCase() &&
      c.type === categoryData.type
    );
    
    if (duplicate) {
      throw new Error(`Category '${categoryData.name}' already exists for type '${categoryData.type}'`);
    }

    // Validate parent category if specified
    if (categoryData.parentCategoryId) {
      const parentCategory = await this.getById(categoryData.parentCategoryId);
      if (!parentCategory) {
        throw new Error(`Parent category not found: ${categoryData.parentCategoryId}`);
      }
      if (parentCategory.type !== categoryData.type) {
        throw new Error('Parent category must be of the same type (income/expense)');
      }
    }

    const category = await this.create(categoryData);
    
    // Rebuild hierarchy after creation
    await this.buildCategoryHierarchy();
    
    // Update storage metadata
    await StorageService.updateStorageMetadata(this.storageKey, await this.getAll());
    
    return category;
  }

  /**
   * Update category with hierarchy validation
   */
  async updateCategory(id: string, updates: Partial<CreateCategoryInput>): Promise<Category> {
    const existingCategory = await this.getById(id);
    if (!existingCategory) {
      throw new Error(`Category not found: ${id}`);
    }

    // Validate parent category changes
    if (updates.parentCategoryId) {
      const parentCategory = await this.getById(updates.parentCategoryId);
      if (!parentCategory) {
        throw new Error(`Parent category not found: ${updates.parentCategoryId}`);
      }
      
      // Prevent circular references
      if (await this.wouldCreateCircularReference(id, updates.parentCategoryId)) {
        throw new Error('Cannot set parent category - would create circular reference');
      }
    }

    const updatedCategory = await this.update(id, updates);
    
    // Rebuild hierarchy after update
    await this.buildCategoryHierarchy();
    
    return updatedCategory;
  }

  /**
   * Delete category with children handling
   */
  async deleteCategory(id: string, moveChildrenToParent: boolean = true): Promise<boolean> {
    const category = await this.getById(id);
    if (!category) {
      return false;
    }

    // Check if category has transactions
    const hasTransactions = await this.hasTransactions(id);
    if (hasTransactions) {
      throw new Error('Cannot delete category with existing transactions');
    }

    // Handle children
    const children = await this.getChildCategories(id);
    if (children.length > 0) {
      if (moveChildrenToParent) {
        // Move children to this category's parent
        for (const child of children) {
          await this.update(child.id, { parentCategoryId: category.parentCategoryId });
        }
      } else {
        throw new Error('Cannot delete category with children. Move children first.');
      }
    }

    const deleted = await this.delete(id);
    
    if (deleted) {
      // Rebuild hierarchy after deletion
      await this.buildCategoryHierarchy();
    }
    
    return deleted;
  }

  /**
   * Get category hierarchy
   */
  async getCategoryHierarchy(): Promise<CategoryHierarchy> {
    if (!this.categoryHierarchy) {
      await this.buildCategoryHierarchy();
    }
    return this.categoryHierarchy!;
  }

  /**
   * Get categories by type
   */
  async getCategoriesByType(type: 'income' | 'expense'): Promise<Category[]> {
    const categories = await this.getAll();
    return categories.filter(c => c.type === type);
  }

  /**
   * Get root categories (no parent)
   */
  async getRootCategories(): Promise<Category[]> {
    const categories = await this.getAll();
    return categories.filter(c => !c.parentCategoryId);
  }

  /**
   * Get child categories
   */
  async getChildCategories(parentId: string): Promise<Category[]> {
    const categories = await this.getAll();
    return categories.filter(c => c.parentCategoryId === parentId);
  }

  /**
   * Get category with spending data
   */
  async getCategoryWithSpending(
    categoryId: string,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<CategoryWithMetadata | null> {
    const category = await this.getById(categoryId);
    if (!category) {
      return null;
    }

    // Load transaction data (would need to import TransactionStorage)
    // For now, returning basic category data
    const categoryWithMetadata: CategoryWithMetadata = {
      ...category,
      transactionCount: 0,
      totalSpent: 0,
      budgetAmount: category.budgetLimit || 0,
      budgetUsed: 0,
      budgetRemaining: category.budgetLimit || 0,
      children: [],
      isDefault: false,
    };

    return categoryWithMetadata;
  }

  /**
   * Get category usage statistics
   */
  async getCategoryStats(): Promise<{
    totalCategories: number;
    incomeCategories: number;
    expenseCategories: number;
    categoriesWithBudgets: number;
    categoriesWithChildren: number;
    maxDepth: number;
  }> {
    const categories = await this.getAll();
    
    const incomeCategories = categories.filter(c => c.type === 'income').length;
    const expenseCategories = categories.filter(c => c.type === 'expense').length;
    const categoriesWithBudgets = categories.filter(c => c.budgetLimit).length;
    const categoriesWithChildren = categories.filter(c => 
      categories.some(child => child.parentCategoryId === c.id)
    ).length;

    // Calculate max depth
    const maxDepth = this.calculateMaxDepth(categories);

    return {
      totalCategories: categories.length,
      incomeCategories,
      expenseCategories,
      categoriesWithBudgets,
      categoriesWithChildren,
      maxDepth,
    };
  }

  /**
   * Required implementations from BaseDataService
   */
  protected validateEntity(entity: Partial<Category>): ValidationResult {
    return this.validateCategoryData(entity);
  }

  protected transformForStorage(entity: Category): any {
    return {
      ...entity,
      createdAt: entity.createdAt.toISOString(),
    };
  }

  protected transformFromStorage(data: any): Category {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
    };
  }

  protected filterByText(entities: Category[], text: string): Category[] {
    const searchText = text.toLowerCase();
    return entities.filter(c => 
      c.name.toLowerCase().includes(searchText)
    );
  }

  /**
   * Private helper methods
   */
  private async buildCategoryHierarchy(): Promise<void> {
    const categories = await this.getAll();
    const byId = new Map<string, CategoryWithMetadata>();
    const byType = new Map<'income' | 'expense', CategoryWithMetadata[]>();
    
    // Convert to CategoryWithMetadata
    const categoryMetadata: CategoryWithMetadata[] = categories.map(c => ({
      ...c,
      children: [],
      transactionCount: 0,
      totalSpent: 0,
      budgetAmount: c.budgetLimit || 0,
      budgetUsed: 0,
      budgetRemaining: c.budgetLimit || 0,
      isDefault: false,
    }));

    // Build maps
    categoryMetadata.forEach(c => {
      byId.set(c.id, c);
      
      const typeArray = byType.get(c.type) || [];
      typeArray.push(c);
      byType.set(c.type, typeArray);
    });

    // Build parent-child relationships
    categoryMetadata.forEach(category => {
      if (category.parentCategoryId) {
        const parent = byId.get(category.parentCategoryId);
        if (parent) {
          parent.children!.push(category);
          category.parent = parent;
        }
      }
    });

    // Get root categories
    const root = categoryMetadata.filter(c => !c.parentCategoryId);

    this.categoryHierarchy = {
      root,
      byId,
      byType,
    };
  }

  private async wouldCreateCircularReference(categoryId: string, parentId: string): Promise<boolean> {
    const visited = new Set<string>();
    let currentId = parentId;

    while (currentId && !visited.has(currentId)) {
      if (currentId === categoryId) {
        return true;
      }
      
      visited.add(currentId);
      const category = await this.getById(currentId);
      currentId = category?.parentCategoryId || '';
    }

    return false;
  }

  private async hasTransactions(categoryId: string): Promise<boolean> {
    // This would need to check the transaction storage
    // For now, returning false as a placeholder
    return false;
  }

  private calculateMaxDepth(categories: Category[]): number {
    const categoryMap = new Map<string, Category>();
    categories.forEach(c => categoryMap.set(c.id, c));

    let maxDepth = 0;

    const calculateDepth = (categoryId: string, currentDepth: number = 0): number => {
      const category = categoryMap.get(categoryId);
      if (!category) return currentDepth;

      if (category.parentCategoryId) {
        return calculateDepth(category.parentCategoryId, currentDepth + 1);
      }

      return currentDepth;
    };

    categories.forEach(category => {
      const depth = calculateDepth(category.id);
      maxDepth = Math.max(maxDepth, depth);
    });

    return maxDepth;
  }

  private validateCategoryData(data: Partial<Category>): ValidationResult {
    const errors: ValidationError[] = [];
    
    if (!data.name || data.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Category name is required',
        code: 'MISSING_NAME',
        value: data.name,
      });
    }

    if (data.name && data.name.length > 50) {
      errors.push({
        field: 'name',
        message: 'Category name must be less than 50 characters',
        code: 'NAME_TOO_LONG',
        value: data.name,
      });
    }
    
    if (!data.color || !this.isValidColor(data.color)) {
      errors.push({
        field: 'color',
        message: 'Valid color is required (hex format)',
        code: 'INVALID_COLOR',
        value: data.color,
      });
    }
    
    if (!data.type || !['income', 'expense'].includes(data.type)) {
      errors.push({
        field: 'type',
        message: 'Type must be either income or expense',
        code: 'INVALID_TYPE',
        value: data.type,
      });
    }

    if (data.budgetLimit && (data.budgetLimit < 0 || data.budgetLimit > 1000000)) {
      errors.push({
        field: 'budgetLimit',
        message: 'Budget limit must be between 0 and 1,000,000',
        code: 'INVALID_BUDGET_LIMIT',
        value: data.budgetLimit,
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  private isValidColor(color: string): boolean {
    // Simple hex color validation
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  }
}

export default CategoryStorage;