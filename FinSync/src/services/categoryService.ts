import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Category,
  CreateCategoryInput,
  ApiResponse,
} from '@/types';
import { STORAGE_KEYS, DEFAULT_CATEGORIES } from '@/constants';

// Extended category interface for better management
export interface CategoryWithStats extends Category {
  transactionCount: number;
  totalAmount: number;
  lastUsed?: Date;
}

class CategoryService {
  // Get all categories
  async getCategories(): Promise<ApiResponse<Category[]>> {
    try {
      const storedCategories = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
      
      if (storedCategories) {
        const categories = JSON.parse(storedCategories).map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
        }));
        
        return {
          success: true,
          data: categories,
        };
      }
      
      // Initialize with default categories if none exist
      await this.initializeDefaultCategories();
      return this.getCategories(); // Recursive call to get the initialized categories
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch categories',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get category by name
  async getCategoryByName(name: string): Promise<ApiResponse<Category>> {
    try {
      const response = await this.getCategories();
      if (!response.success || !response.data) {
        return {
          success: false,
          error: 'Failed to fetch categories',
        };
      }

      const category = response.data.find(c => c.name === name);
      if (!category) {
        return {
          success: false,
          error: 'Category not found',
        };
      }

      return {
        success: true,
        data: category,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch category',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get categories by type
  async getCategoriesByType(type: 'income' | 'expense'): Promise<ApiResponse<Category[]>> {
    try {
      const response = await this.getCategories();
      if (!response.success || !response.data) {
        return {
          success: false,
          error: 'Failed to fetch categories',
        };
      }

      const filteredCategories = response.data.filter(c => c.type === type);

      return {
        success: true,
        data: filteredCategories,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch categories by type',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Create new category
  async createCategory(input: CreateCategoryInput): Promise<ApiResponse<Category>> {
    try {
      const response = await this.getCategories();
      if (!response.success || !response.data) {
        return {
          success: false,
          error: 'Failed to fetch existing categories',
        };
      }

      // Check if category name already exists
      const existingCategory = response.data.find(c => 
        c.name.toLowerCase() === input.name.toLowerCase()
      );
      
      if (existingCategory) {
        return {
          success: false,
          error: 'Category with this name already exists',
        };
      }

      const newCategory: Category = {
        ...input,
        id: this.generateId(),
        createdAt: new Date(),
      };

      const updatedCategories = [...response.data, newCategory];
      await this.saveCategories(updatedCategories);

      return {
        success: true,
        data: newCategory,
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

  // Update existing category
  async updateCategory(id: string, updates: Partial<CreateCategoryInput>): Promise<ApiResponse<Category>> {
    try {
      const response = await this.getCategories();
      if (!response.success || !response.data) {
        return {
          success: false,
          error: 'Failed to fetch existing categories',
        };
      }

      const existingCategoryIndex = response.data.findIndex(c => c.id === id);
      if (existingCategoryIndex === -1) {
        return {
          success: false,
          error: 'Category not found',
        };
      }

      // Check if new name conflicts with existing categories
      if (updates.name) {
        const nameConflict = response.data.find(c => 
          c.id !== id && c.name.toLowerCase() === updates.name!.toLowerCase()
        );
        
        if (nameConflict) {
          return {
            success: false,
            error: 'Category with this name already exists',
          };
        }
      }

      const updatedCategory: Category = {
        ...response.data[existingCategoryIndex],
        ...updates,
      };

      const updatedCategories = [...response.data];
      updatedCategories[existingCategoryIndex] = updatedCategory;
      
      await this.saveCategories(updatedCategories);

      return {
        success: true,
        data: updatedCategory,
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

  // Delete category
  async deleteCategory(id: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await this.getCategories();
      if (!response.success || !response.data) {
        return {
          success: false,
          error: 'Failed to fetch existing categories',
        };
      }

      const filteredCategories = response.data.filter(c => c.id !== id);
      
      if (filteredCategories.length === response.data.length) {
        return {
          success: false,
          error: 'Category not found',
        };
      }

      await this.saveCategories(filteredCategories);

      return {
        success: true,
        data: true,
        message: 'Category deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete category',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get category colors for UI
  getCategoryColors(): string[] {
    return [
      '#FF6B6B', // Red
      '#4ECDC4', // Teal
      '#45B7D1', // Blue
      '#96CEB4', // Light Green
      '#FFEAA7', // Yellow
      '#DDA0DD', // Plum
      '#98D8C8', // Mint
      '#F7DC6F', // Light Yellow
      '#58D68D', // Green
      '#85C1E9', // Light Blue
      '#F8C471', // Orange
      '#BB8FCE', // Light Purple
      '#F1948A', // Light Red
      '#82E0AA', // Light Green
      '#AED6F1', // Very Light Blue
      '#F9E79F', // Very Light Yellow
    ];
  }

  // Get random color for new category
  getRandomColor(): string {
    const colors = this.getCategoryColors();
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Get category stats with transaction data
  async getCategoriesWithStats(transactions: any[]): Promise<ApiResponse<CategoryWithStats[]>> {
    try {
      const response = await this.getCategories();
      if (!response.success || !response.data) {
        return {
          success: false,
          error: 'Failed to fetch categories',
        };
      }

      const categoriesWithStats: CategoryWithStats[] = response.data.map(category => {
        const categoryTransactions = transactions.filter(t => t.category === category.name);
        const totalAmount = categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const lastUsed = categoryTransactions.length > 0 
          ? new Date(Math.max(...categoryTransactions.map(t => new Date(t.date).getTime())))
          : undefined;

        return {
          ...category,
          transactionCount: categoryTransactions.length,
          totalAmount,
          lastUsed,
        };
      });

      return {
        success: true,
        data: categoriesWithStats,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch categories with stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get most used categories
  async getMostUsedCategories(
    transactions: any[], 
    limit: number = 5
  ): Promise<ApiResponse<CategoryWithStats[]>> {
    try {
      const response = await this.getCategoriesWithStats(transactions);
      if (!response.success || !response.data) {
        return response;
      }

      const sortedCategories = response.data
        .filter(c => c.transactionCount > 0)
        .sort((a, b) => b.transactionCount - a.transactionCount)
        .slice(0, limit);

      return {
        success: true,
        data: sortedCategories,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch most used categories',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Initialize default categories
  private async initializeDefaultCategories(): Promise<void> {
    const categories: Category[] = DEFAULT_CATEGORIES.map((cat, index) => ({
      id: `default_${index + 1}`,
      name: cat.name,
      color: cat.color,
      type: cat.type,
      createdAt: new Date(),
    }));

    await this.saveCategories(categories);
  }

  // Private helper methods
  private async saveCategories(categories: Category[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }

  private generateId(): string {
    return 'cat_' + Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Clear all categories (for development/testing)
  async clearAllCategories(): Promise<ApiResponse<boolean>> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.CATEGORIES);
      return {
        success: true,
        data: true,
        message: 'All categories cleared successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to clear categories',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Reset to default categories
  async resetToDefaults(): Promise<ApiResponse<Category[]>> {
    try {
      await this.clearAllCategories();
      await this.initializeDefaultCategories();
      return this.getCategories();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to reset categories to defaults',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const categoryService = new CategoryService();
export default categoryService;