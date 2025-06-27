import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  Category,
  ApiResponse,
} from '@/types';
import { transactionService } from '@/services/transactionService';
import { DEFAULT_CATEGORIES } from '@/constants';

// State interface
interface TransactionState {
  transactions: Transaction[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  stats: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    transactionCount: number;
    averageExpense: number;
    categorySummary: Record<string, { total: number; count: number; type: 'income' | 'expense' }>;
  } | null;
}

// Action types
type TransactionAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'SET_STATS'; payload: TransactionState['stats'] };

// Context interface
interface TransactionContextType {
  state: TransactionState;
  // Transaction actions
  loadTransactions: () => Promise<void>;
  createTransaction: (input: CreateTransactionInput) => Promise<ApiResponse<Transaction>>;
  updateTransaction: (input: UpdateTransactionInput) => Promise<ApiResponse<Transaction>>;
  deleteTransaction: (id: string) => Promise<ApiResponse<boolean>>;
  getTransactionsByDateRange: (startDate: Date, endDate: Date) => Promise<Transaction[]>;
  getTransactionsByCategory: (category: string) => Promise<Transaction[]>;
  searchTransactions: (query: string) => Promise<Transaction[]>;
  refreshStats: () => Promise<void>;
  clearError: () => void;
}

// Initial state
const initialState: TransactionState = {
  transactions: [],
  categories: [],
  loading: false,
  error: null,
  stats: null,
};

// Reducer
const transactionReducer = (state: TransactionState, action: TransactionAction): TransactionState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload, loading: false, error: null };
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
        loading: false,
        error: null,
      };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t =>
          t.id === action.payload.id ? action.payload : t
        ),
        loading: false,
        error: null,
      };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload),
        loading: false,
        error: null,
      };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    default:
      return state;
  }
};

// Create contexts
const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

// Provider component
interface TransactionProviderProps {
  children: ReactNode;
}

export const TransactionProvider: React.FC<TransactionProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(transactionReducer, initialState);

  // Initialize categories
  useEffect(() => {
    const initializeCategories = () => {
      const categoriesWithIds: Category[] = DEFAULT_CATEGORIES.map((cat, index) => ({
        id: `cat_${index + 1}`,
        name: cat.name,
        color: cat.color,
        type: cat.type,
        createdAt: new Date(),
      }));
      dispatch({ type: 'SET_CATEGORIES', payload: categoriesWithIds });
    };

    initializeCategories();
  }, []);

  // Load transactions on mount
  useEffect(() => {
    loadTransactions();
  }, []);

  // Action implementations
  const loadTransactions = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await transactionService.getTransactions();
      
      if (response.success && response.data) {
        dispatch({ type: 'SET_TRANSACTIONS', payload: response.data });
        // Also refresh stats when transactions are loaded
        await refreshStats();
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to load transactions' });
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to load transactions' 
      });
    }
  };

  const createTransaction = async (input: CreateTransactionInput): Promise<ApiResponse<Transaction>> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await transactionService.createTransaction(input);
      
      if (response.success && response.data) {
        dispatch({ type: 'ADD_TRANSACTION', payload: response.data });
        // Refresh stats after creating transaction
        await refreshStats();
        return response;
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to create transaction' });
        return response;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create transaction';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const updateTransaction = async (input: UpdateTransactionInput): Promise<ApiResponse<Transaction>> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await transactionService.updateTransaction(input);
      
      if (response.success && response.data) {
        dispatch({ type: 'UPDATE_TRANSACTION', payload: response.data });
        // Refresh stats after updating transaction
        await refreshStats();
        return response;
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to update transaction' });
        return response;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update transaction';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const deleteTransaction = async (id: string): Promise<ApiResponse<boolean>> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await transactionService.deleteTransaction(id);
      
      if (response.success) {
        dispatch({ type: 'DELETE_TRANSACTION', payload: id });
        // Refresh stats after deleting transaction
        await refreshStats();
        return response;
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to delete transaction' });
        return response;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete transaction';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const getTransactionsByDateRange = async (startDate: Date, endDate: Date): Promise<Transaction[]> => {
    try {
      const response = await transactionService.getTransactionsByDateRange(startDate, endDate);
      if (response.success && response.data) {
        return response.data;
      }
      dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to fetch transactions by date range' });
      return [];
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to fetch transactions by date range' 
      });
      return [];
    }
  };

  const getTransactionsByCategory = async (category: string): Promise<Transaction[]> => {
    try {
      const response = await transactionService.getTransactionsByCategory(category);
      if (response.success && response.data) {
        return response.data;
      }
      dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to fetch transactions by category' });
      return [];
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to fetch transactions by category' 
      });
      return [];
    }
  };

  const searchTransactions = async (query: string): Promise<Transaction[]> => {
    try {
      const response = await transactionService.searchTransactions(query);
      if (response.success && response.data) {
        return response.data;
      }
      dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to search transactions' });
      return [];
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to search transactions' 
      });
      return [];
    }
  };

  const refreshStats = async (): Promise<void> => {
    try {
      const response = await transactionService.getTransactionStats();
      if (response.success && response.data) {
        dispatch({ type: 'SET_STATS', payload: response.data });
      }
    } catch (error) {
      // Don't dispatch error for stats refresh as it's not critical
      console.warn('Failed to refresh stats:', error);
    }
  };

  const clearError = (): void => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const contextValue: TransactionContextType = {
    state,
    loadTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionsByDateRange,
    getTransactionsByCategory,
    searchTransactions,
    refreshStats,
    clearError,
  };

  return (
    <TransactionContext.Provider value={contextValue}>
      {children}
    </TransactionContext.Provider>
  );
};

// Custom hook to use the context
export const useTransactions = (): TransactionContextType => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};

export default TransactionContext;