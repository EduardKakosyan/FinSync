export interface Transaction {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  description: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface IncomeCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export const DEFAULT_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'groceries', name: 'Groceries', color: '#4CAF50' },
  { id: 'gas', name: 'Gas', color: '#FF9800' },
  { id: 'bills', name: 'Bills', color: '#F44336' },
  { id: 'entertainment', name: 'Entertainment', color: '#9C27B0' },
  { id: 'dining', name: 'Dining', color: '#E91E63' },
  { id: 'shopping', name: 'Shopping', color: '#2196F3' },
  { id: 'health', name: 'Health', color: '#00BCD4' },
  { id: 'other', name: 'Other', color: '#607D8B' },
];

export const DEFAULT_INCOME_CATEGORIES: IncomeCategory[] = [
  { id: 'fulltime', name: 'Full-time', color: '#4CAF50' },
  { id: 'sideproject', name: 'Side-projects', color: '#2196F3' },
  { id: 'misc', name: 'Miscellaneous', color: '#9E9E9E' },
];

export type TransactionPeriod = 'daily' | 'weekly' | 'monthly';

export interface OCRResult {
  success: boolean;
  data?: {
    amount?: number;
    date?: string;
    description?: string;
    category?: string;
    merchant?: string;
  };
  error?: string;
  confidence?: number;
}