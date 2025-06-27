import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  ApiResponse,
  Category,
} from '@/types';
import { STORAGE_KEYS, DEFAULT_CATEGORIES } from '@/constants';

// Mock data for development
const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    amount: -4.5,
    date: new Date(),
    category: 'Food & Dining',
    description: 'Coffee Shop',
    type: 'expense',
    accountId: 'acc1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    amount: 3500.0,
    date: new Date(Date.now() - 86400000), // Yesterday
    category: 'Salary',
    description: 'Monthly Salary',
    type: 'income',
    accountId: 'acc1',
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86400000),
  },
  {
    id: '3',
    amount: -45.2,
    date: new Date(Date.now() - 172800000), // 2 days ago
    category: 'Transportation',
    description: 'Gas Station',
    type: 'expense',
    accountId: 'acc1',
    createdAt: new Date(Date.now() - 172800000),
    updatedAt: new Date(Date.now() - 172800000),
  },
  {
    id: '4',
    amount: -120.5,
    date: new Date(Date.now() - 259200000), // 3 days ago
    category: 'Shopping',
    description: 'Grocery Store',
    type: 'expense',
    accountId: 'acc1',
    createdAt: new Date(Date.now() - 259200000),
    updatedAt: new Date(Date.now() - 259200000),
  },
  {
    id: '5',
    amount: -25.0,
    date: new Date(Date.now() - 345600000), // 4 days ago
    category: 'Entertainment',
    description: 'Movie Theater',
    type: 'expense',
    accountId: 'acc1',
    createdAt: new Date(Date.now() - 345600000),
    updatedAt: new Date(Date.now() - 345600000),
  },
];

class TransactionService {
  // Get all transactions
  async getTransactions(): Promise<ApiResponse<Transaction[]>> {
    try {
      const storedTransactions = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      
      if (storedTransactions) {
        const transactions = JSON.parse(storedTransactions).map((t: any) => ({
          ...t,
          date: new Date(t.date),
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
        }));
        
        return {
          success: true,
          data: transactions,
        };
      }
      
      // Return mock data if no stored transactions
      await this.initializeMockData();
      return {
        success: true,
        data: MOCK_TRANSACTIONS,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch transactions',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get single transaction by ID
  async getTransaction(id: string): Promise<ApiResponse<Transaction>> {
    try {
      const response = await this.getTransactions();
      if (!response.success || !response.data) {
        return {
          success: false,
          error: 'Failed to fetch transactions',
        };
      }

      const transaction = response.data.find(t => t.id === id);
      if (!transaction) {
        return {
          success: false,
          error: 'Transaction not found',
        };
      }

      return {
        success: true,
        data: transaction,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch transaction',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Create new transaction
  async createTransaction(input: CreateTransactionInput): Promise<ApiResponse<Transaction>> {
    try {
      const response = await this.getTransactions();
      if (!response.success || !response.data) {
        return {
          success: false,
          error: 'Failed to fetch existing transactions',
        };
      }

      const newTransaction: Transaction = {
        ...input,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedTransactions = [...response.data, newTransaction];
      await this.saveTransactions(updatedTransactions);

      return {
        success: true,
        data: newTransaction,
        message: 'Transaction created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create transaction',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Update existing transaction
  async updateTransaction(input: UpdateTransactionInput): Promise<ApiResponse<Transaction>> {
    try {
      const response = await this.getTransactions();
      if (!response.success || !response.data) {
        return {
          success: false,
          error: 'Failed to fetch existing transactions',
        };
      }

      const existingTransactionIndex = response.data.findIndex(t => t.id === input.id);
      if (existingTransactionIndex === -1) {
        return {
          success: false,
          error: 'Transaction not found',
        };
      }

      const updatedTransaction: Transaction = {
        ...response.data[existingTransactionIndex],
        ...input,
        updatedAt: new Date(),
      };

      const updatedTransactions = [...response.data];
      updatedTransactions[existingTransactionIndex] = updatedTransaction;
      
      await this.saveTransactions(updatedTransactions);

      return {
        success: true,
        data: updatedTransaction,
        message: 'Transaction updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update transaction',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Delete transaction
  async deleteTransaction(id: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await this.getTransactions();
      if (!response.success || !response.data) {
        return {
          success: false,
          error: 'Failed to fetch existing transactions',
        };
      }

      const filteredTransactions = response.data.filter(t => t.id !== id);
      
      if (filteredTransactions.length === response.data.length) {
        return {
          success: false,
          error: 'Transaction not found',
        };
      }

      await this.saveTransactions(filteredTransactions);

      return {
        success: true,
        data: true,
        message: 'Transaction deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete transaction',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get transactions by date range
  async getTransactionsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<ApiResponse<Transaction[]>> {
    try {
      const response = await this.getTransactions();
      if (!response.success || !response.data) {
        return {
          success: false,
          error: 'Failed to fetch transactions',
        };
      }

      const filteredTransactions = response.data.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });

      return {
        success: true,
        data: filteredTransactions,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch transactions by date range',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get transactions by category
  async getTransactionsByCategory(category: string): Promise<ApiResponse<Transaction[]>> {
    try {
      const response = await this.getTransactions();
      if (!response.success || !response.data) {
        return {
          success: false,
          error: 'Failed to fetch transactions',
        };
      }

      const filteredTransactions = response.data.filter(
        transaction => transaction.category === category
      );

      return {
        success: true,
        data: filteredTransactions,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch transactions by category',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get transaction statistics
  async getTransactionStats(): Promise<ApiResponse<{
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    transactionCount: number;
    averageExpense: number;
    categorySummary: Record<string, { total: number; count: number; type: 'income' | 'expense' }>;
  }>> {
    try {
      const response = await this.getTransactions();
      if (!response.success || !response.data) {
        return {
          success: false,
          error: 'Failed to fetch transactions',
        };
      }

      const transactions = response.data;
      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalExpenses = Math.abs(transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0));
      
      const netIncome = totalIncome - totalExpenses;
      const transactionCount = transactions.length;
      const averageExpense = totalExpenses / (transactions.filter(t => t.type === 'expense').length || 1);

      const categorySummary: Record<string, { total: number; count: number; type: 'income' | 'expense' }> = {};
      
      transactions.forEach(transaction => {
        if (!categorySummary[transaction.category]) {
          categorySummary[transaction.category] = {
            total: 0,
            count: 0,
            type: transaction.type,
          };
        }
        categorySummary[transaction.category].total += Math.abs(transaction.amount);
        categorySummary[transaction.category].count += 1;
      });

      return {
        success: true,
        data: {
          totalIncome,
          totalExpenses,
          netIncome,
          transactionCount,
          averageExpense,
          categorySummary,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to calculate transaction statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Private helper methods
  private async saveTransactions(transactions: Transaction[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private async initializeMockData(): Promise<void> {
    await this.saveTransactions(MOCK_TRANSACTIONS);
  }

  // Clear all data (for development/testing)
  async clearAllTransactions(): Promise<ApiResponse<boolean>> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      return {
        success: true,
        data: true,
        message: 'All transactions cleared successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to clear transactions',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Search transactions
  async searchTransactions(query: string): Promise<ApiResponse<Transaction[]>> {
    try {
      const response = await this.getTransactions();
      if (!response.success || !response.data) {
        return {
          success: false,
          error: 'Failed to fetch transactions',
        };
      }

      const filteredTransactions = response.data.filter(transaction => 
        transaction.description.toLowerCase().includes(query.toLowerCase()) ||
        transaction.category.toLowerCase().includes(query.toLowerCase())
      );

      return {
        success: true,
        data: filteredTransactions,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to search transactions',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const transactionService = new TransactionService();
export default transactionService;