/**
 * Enhanced Category Service for FinSync Financial App
 * Provides advanced category management with color support and analytics integration
 */

import {
  Category,
  CreateCategoryInput,
  ApiResponse,
  CategorySpending,
  ValidationResult,
} from '../types';
import { categoryService as baseCategoryService } from './storage/CategoryService';
import { validationService } from './ValidationService';
import { currencyService } from './CurrencyService';
import { mockDataService } from './MockDataService';

export interface CategoryWithStats extends Category {
  transactionCount: number;
  totalAmount: number;
  percentage: number;
  averageTransaction: number;
  lastUsed?: Date;
  formatted: {
    totalAmount: string;
    averageTransaction: string;
    percentage: string;
  };
  budgetStatus?: {
    utilized: number;
    remaining: number;
    status: 'under' | 'near' | 'over' | 'exceeded';
    color: string;
  };
}

export interface CategoryAnalytics {
  totalCategories: number;
  activeCategories: number;
  topSpendingCategories: CategoryWithStats[];
  budgetCategories: CategoryWithStats[];
  unusedCategories: Category[];
  colorUsage: Array<{
    color: string;
    count: number;
    categories: string[];
  }>;
}

export interface ColorPalette {
  primary: string[];
  expense: string[];
  income: string[];
  neutral: string[];
  recommended: string[];
}

export class EnhancedCategoryService {
  private static instance: EnhancedCategoryService;
  private colorPalette: ColorPalette = {
    primary: [
      '#FF6B6B', // Red
      '#4ECDC4', // Teal
      '#45B7D1', // Blue
      '#96CEB4', // Light Green
      '#FFEAA7', // Yellow
      '#DDA0DD', // Plum
      '#98D8C8', // Mint
      '#F7DC6F', // Light Yellow
    ],
    expense: [
      '#FF6B6B', // Food & Dining
      '#4ECDC4', // Transportation
      '#45B7D1', // Shopping
      '#96CEB4', // Entertainment
      '#FFEAA7', // Bills & Utilities
      '#DDA0DD', // Healthcare
      '#98D8C8', // Education
      '#F7DC6F', // Travel
      '#BB8FCE', // Home & Garden
      '#85C1E9', // Insurance
      '#F8C471', // Taxes
      '#D5DBDB', // Miscellaneous
    ],
    income: [
      '#58D68D', // Salary
      '#85C1E9', // Freelance
      '#F8C471', // Investments
      '#52C41A', // Business
      '#FA8C16', // Gifts
      '#A0D911', // Other Income
    ],
    neutral: [
      '#8E8E93',
      '#C7C7CC',
      '#D1D1D6',
      '#E5E5EA',
    ],
    recommended: [
      '#007AFF', // Primary blue
      '#5856D6', // Purple
      '#AF52DE', // Light purple
      '#FF2D92', // Pink
      '#FF3B30', // Red
      '#FF9500', // Orange
      '#FFCC00', // Yellow
      '#34C759', // Green
      '#00C7BE', // Teal
      '#5AC8FA', // Light blue
    ],
  };

  private constructor() {}

  public static getInstance(): EnhancedCategoryService {
    if (!EnhancedCategoryService.instance) {
      EnhancedCategoryService.instance = new EnhancedCategoryService();
    }
    return EnhancedCategoryService.instance;
  }

  /**
   * Create category with enhanced validation and color management
   */
  async createCategory(
    input: CreateCategoryInput,
    autoAssignColor: boolean = false
  ): Promise<ApiResponse<Category>> {
    try {
      // Get existing categories for validation
      const existingCategories = await baseCategoryService.getAll();
      
      // Validate category
      const validation = validationService.validateCategory(input, existingCategories);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          message: validation.errors.map(e => e.message).join(', '),
        };
      }

      let categoryInput = { ...input };

      // Auto-assign color if requested or not provided
      if (autoAssignColor || !categoryInput.color) {
        categoryInput.color = this.getRecommendedColor(existingCategories, categoryInput.type);
      }

      // Create category using base service
      const category = await baseCategoryService.create(categoryInput);

      return {
        success: true,
        data: category,
        message: 'Category created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create category',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get categories with transaction statistics
   */
  async getCategoriesWithStats(
    type?: 'income' | 'expense',
    includeUnused: boolean = true
  ): Promise<ApiResponse<CategoryWithStats[]>> {
    try {
      // Get categories
      const allCategories = await baseCategoryService.getAll();
      const categories = type ? allCategories.filter(c => c.type === type) : allCategories;

      // Get mock transaction data for stats
      const mockData = mockDataService.generateMockTransactions(30);
      
      const categoriesWithStats: CategoryWithStats[] = [];

      for (const category of categories) {
        const categoryTransactions = mockData.filter(t => 
          t.category === category.id || t.category === category.name
        );

        const totalAmount = categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const transactionCount = categoryTransactions.length;
        const averageTransaction = transactionCount > 0 ? totalAmount / transactionCount : 0;
        const lastUsed = categoryTransactions.length > 0
          ? new Date(Math.max(...categoryTransactions.map(t => t.date.getTime())))
          : undefined;

        // Skip unused categories if requested
        if (!includeUnused && transactionCount === 0) {
          continue;
        }

        // Calculate percentage (would need total expenses for real calculation)
        const percentage = totalAmount > 0 ? Math.random() * 30 : 0; // Mock percentage

        // Calculate budget status if budget limit exists
        let budgetStatus: CategoryWithStats['budgetStatus'];
        if (category.budgetLimit) {
          const utilized = (totalAmount / category.budgetLimit) * 100;
          const remaining = Math.max(0, category.budgetLimit - totalAmount);
          
          let status: 'under' | 'near' | 'over' | 'exceeded' = 'under';
          let color = '#34C759'; // Green
          
          if (utilized >= 100) {
            status = 'exceeded';
            color = '#FF3B30'; // Red
          } else if (utilized >= 90) {
            status = 'over';
            color = '#FF9500'; // Orange
          } else if (utilized >= 75) {
            status = 'near';
            color = '#FF9500'; // Orange
          }

          budgetStatus = {
            utilized,
            remaining,
            status,
            color,
          };
        }

        const categoryWithStats: CategoryWithStats = {
          ...category,
          transactionCount,
          totalAmount,
          percentage,
          averageTransaction,
          lastUsed,
          formatted: {
            totalAmount: currencyService.formatAmount(totalAmount),
            averageTransaction: currencyService.formatAmount(averageTransaction),
            percentage: `${percentage.toFixed(1)}%`,
          },
          budgetStatus,
        };

        categoriesWithStats.push(categoryWithStats);
      }

      // Sort by total amount descending
      categoriesWithStats.sort((a, b) => b.totalAmount - a.totalAmount);

      return {
        success: true,
        data: categoriesWithStats,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get categories with stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get category analytics and insights
   */
  async getCategoryAnalytics(): Promise<ApiResponse<CategoryAnalytics>> {
    try {
      const categoriesResponse = await this.getCategoriesWithStats();
      if (!categoriesResponse.success) {
        return categoriesResponse as any;
      }

      const categoriesWithStats = categoriesResponse.data!;
      const allCategories = await baseCategoryService.getAll();

      const activeCategories = categoriesWithStats.filter(c => c.transactionCount > 0);
      const topSpendingCategories = activeCategories
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 5);

      const budgetCategories = categoriesWithStats.filter(c => c.budgetStatus);
      const unusedCategories = allCategories.filter(c => 
        !categoriesWithStats.find(cs => cs.id === c.id && cs.transactionCount > 0)
      );

      // Analyze color usage
      const colorUsage = this.analyzeColorUsage(allCategories);

      const analytics: CategoryAnalytics = {
        totalCategories: allCategories.length,
        activeCategories: activeCategories.length,
        topSpendingCategories,
        budgetCategories,
        unusedCategories,
        colorUsage,
      };

      return {
        success: true,
        data: analytics,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get category analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get recommended color for new category
   */
  getRecommendedColor(
    existingCategories: Category[],
    type: 'income' | 'expense'
  ): string {
    const usedColors = new Set(existingCategories.map(c => c.color.toLowerCase()));
    const palette = type === 'income' ? this.colorPalette.income : this.colorPalette.expense;

    // Find first unused color in type-specific palette
    for (const color of palette) {
      if (!usedColors.has(color.toLowerCase())) {
        return color;
      }
    }

    // Fall back to primary palette
    for (const color of this.colorPalette.primary) {
      if (!usedColors.has(color.toLowerCase())) {
        return color;
      }
    }

    // Fall back to recommended palette
    for (const color of this.colorPalette.recommended) {
      if (!usedColors.has(color.toLowerCase())) {
        return color;
      }
    }

    // Generate random color if all are used
    return this.generateRandomColor();
  }

  /**
   * Get color palette for category type
   */
  getColorPalette(type?: 'income' | 'expense' | 'all'): string[] {
    switch (type) {
      case 'income':
        return [...this.colorPalette.income, ...this.colorPalette.primary];
      case 'expense':
        return [...this.colorPalette.expense, ...this.colorPalette.primary];
      default:
        return [
          ...this.colorPalette.primary,
          ...this.colorPalette.expense,
          ...this.colorPalette.income,
          ...this.colorPalette.recommended,
        ];
    }
  }

  /**
   * Validate category color
   */
  validateColor(color: string): {
    isValid: boolean;
    isRecommended: boolean;
    suggestions: string[];
  } {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const isValid = hexColorRegex.test(color);
    
    const allRecommended = [
      ...this.colorPalette.primary,
      ...this.colorPalette.expense,
      ...this.colorPalette.income,
      ...this.colorPalette.recommended,
    ];
    
    const isRecommended = allRecommended.includes(color.toUpperCase());
    
    const suggestions = isValid ? [] : [
      'Color must be in hex format (e.g., #FF0000)',
      'Use the color picker to select from recommended colors',
    ];

    return {
      isValid,
      isRecommended,
      suggestions,
    };
  }

  /**
   * Update category with validation
   */
  async updateCategory(
    id: string,
    updates: Partial<CreateCategoryInput>
  ): Promise<ApiResponse<Category>> {
    try {
      // Get existing category
      const existing = await baseCategoryService.getById(id);
      if (!existing) {
        return {
          success: false,
          error: 'Category not found',
        };
      }

      // Get all categories for validation
      const allCategories = await baseCategoryService.getAll();
      const otherCategories = allCategories.filter(c => c.id !== id);
      
      // Merge updates with existing data for validation
      const merged = { ...existing, ...updates };
      
      // Validate updated category
      const validation = validationService.validateCategory(merged, otherCategories);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          message: validation.errors.map(e => e.message).join(', '),
        };
      }

      // Update category using base service
      const category = await baseCategoryService.update(id, updates);

      return {
        success: true,
        data: category,
        message: 'Category updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update category',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete category with impact analysis
   */
  async deleteCategory(
    id: string,
    handleSubcategories: 'delete' | 'orphan' = 'orphan'
  ): Promise<ApiResponse<{
    deleted: boolean;
    affectedSubcategories: number;
    affectedTransactions: number;
  }>> {
    try {
      // Get subcategories
      const subcategories = await baseCategoryService.getSubcategories(id);
      
      // Get transactions using this category (mock implementation)
      const mockTransactions = mockDataService.generateMockTransactions(30);
      const affectedTransactions = mockTransactions.filter(t => t.category === id);

      // Delete category using base service
      const deleted = await baseCategoryService.delete(id, handleSubcategories);

      return {
        success: deleted,
        data: {
          deleted,
          affectedSubcategories: subcategories.length,
          affectedTransactions: affectedTransactions.length,
        },
        message: deleted ? 'Category deleted successfully' : 'Failed to delete category',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete category',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get top categories by spending
   */
  async getTopCategories(
    limit: number = 5,
    type?: 'income' | 'expense'
  ): Promise<ApiResponse<CategoryWithStats[]>> {
    try {
      const categoriesResponse = await this.getCategoriesWithStats(type, false);
      if (!categoriesResponse.success) {
        return categoriesResponse;
      }

      const topCategories = categoriesResponse.data!
        .filter(c => c.transactionCount > 0)
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, limit);

      return {
        success: true,
        data: topCategories,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get top categories',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Initialize default categories with optimized colors
   */
  async initializeDefaultCategories(): Promise<ApiResponse<Category[]>> {
    try {
      const existingCategories = await baseCategoryService.getAll();
      if (existingCategories.length > 0) {
        return {
          success: false,
          error: 'Categories already exist',
          message: 'Cannot initialize default categories when categories already exist',
        };
      }

      const defaultCategories = mockDataService.getMockCategories();
      const createdCategories: Category[] = [];

      for (const categoryData of defaultCategories) {
        try {
          const category = await baseCategoryService.create({
            name: categoryData.name,
            color: categoryData.color,
            type: categoryData.type,
            budgetLimit: categoryData.budgetLimit,
          });
          createdCategories.push(category);
        } catch (error) {
          console.warn(`Failed to create default category ${categoryData.name}:`, error);
        }
      }

      return {
        success: true,
        data: createdCategories,
        message: `Successfully created ${createdCategories.length} default categories`,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to initialize default categories',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Private helper methods

  private analyzeColorUsage(categories: Category[]): Array<{
    color: string;
    count: number;
    categories: string[];
  }> {
    const colorMap = new Map<string, string[]>();

    categories.forEach(category => {
      const color = category.color.toUpperCase();
      const existing = colorMap.get(color) || [];
      existing.push(category.name);
      colorMap.set(color, existing);
    });

    return Array.from(colorMap.entries()).map(([color, categoryNames]) => ({
      color,
      count: categoryNames.length,
      categories: categoryNames,
    })).sort((a, b) => b.count - a.count);
  }

  private generateRandomColor(): string {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 60 + Math.floor(Math.random() * 40); // 60-100%
    const lightness = 50 + Math.floor(Math.random() * 30); // 50-80%
    
    return this.hslToHex(hue, saturation, lightness);
  }

  private hslToHex(h: number, s: number, l: number): string {
    const sNorm = s / 100;
    const lNorm = l / 100;
    
    const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = lNorm - c / 2;
    
    let r = 0, g = 0, b = 0;
    
    if (0 <= h && h < 60) {
      r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
      r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
      r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
      r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
      r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
      r = c; g = 0; b = x;
    }
    
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
  }

  /**
   * Get category suggestions based on description
   */
  getCategorySuggestions(
    description: string,
    type: 'income' | 'expense'
  ): Promise<ApiResponse<Category[]>> {
    // This would use ML/AI in a real implementation
    // For now, return a simple keyword-based suggestion
    const keywords = description.toLowerCase();
    const suggestions: string[] = [];

    if (type === 'expense') {
      if (keywords.includes('coffee') || keywords.includes('restaurant') || keywords.includes('food')) {
        suggestions.push('Food & Dining');
      }
      if (keywords.includes('gas') || keywords.includes('uber') || keywords.includes('taxi')) {
        suggestions.push('Transportation');
      }
      if (keywords.includes('movie') || keywords.includes('netflix') || keywords.includes('game')) {
        suggestions.push('Entertainment');
      }
      // Add more keyword mappings...
    }

    // Return mock implementation
    return Promise.resolve({
      success: true,
      data: [],
      message: 'Category suggestions feature coming soon',
    });
  }

  /**
   * Validate category
   */
  validateCategory(
    input: Partial<CreateCategoryInput>,
    existingCategories: Category[] = []
  ): ValidationResult {
    return validationService.validateCategory(input, existingCategories);
  }
}

// Export singleton instance
export const enhancedCategoryService = EnhancedCategoryService.getInstance();
export default enhancedCategoryService;