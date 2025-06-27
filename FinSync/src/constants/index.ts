// Constants for FinSync Financial Tracking App

export const CURRENCIES = {
  CAD: 'CAD',
  USD: 'USD',
} as const;

export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
} as const;

export const ACCOUNT_TYPES = {
  CHECKING: 'checking',
  SAVINGS: 'savings',
  CREDIT: 'credit',
  INVESTMENT: 'investment',
} as const;

export const INVESTMENT_TYPES = {
  STOCK: 'stock',
  BOND: 'bond',
  CRYPTO: 'crypto',
  ETF: 'etf',
  MUTUAL_FUND: 'mutual_fund',
} as const;

export const BUDGET_PERIODS = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;

export const REMINDER_TYPES = {
  TRANSACTION: 'transaction',
  RECEIPT: 'receipt',
  BUDGET: 'budget',
  INVESTMENT: 'investment',
} as const;

export const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', color: '#FF6B6B', type: 'expense' },
  { name: 'Transportation', color: '#4ECDC4', type: 'expense' },
  { name: 'Shopping', color: '#45B7D1', type: 'expense' },
  { name: 'Entertainment', color: '#96CEB4', type: 'expense' },
  { name: 'Bills & Utilities', color: '#FFEAA7', type: 'expense' },
  { name: 'Healthcare', color: '#DDA0DD', type: 'expense' },
  { name: 'Education', color: '#98D8C8', type: 'expense' },
  { name: 'Travel', color: '#F7DC6F', type: 'expense' },
  { name: 'Salary', color: '#58D68D', type: 'income' },
  { name: 'Freelance', color: '#85C1E9', type: 'income' },
  { name: 'Investments', color: '#F8C471', type: 'income' },
  { name: 'Other Income', color: '#BB8FCE', type: 'income' },
] as const;

export const COLORS = {
  PRIMARY: '#007AFF',
  SECONDARY: '#5856D6',
  SUCCESS: '#34C759',
  DANGER: '#FF3B30',
  WARNING: '#FF9500',
  INFO: '#5AC8FA',
  LIGHT: '#F2F2F7',
  DARK: '#1C1C1E',
  BACKGROUND: '#FFFFFF',
  SURFACE: '#F2F2F7',
  TEXT_PRIMARY: '#000000',
  TEXT_SECONDARY: '#8E8E93',
  BORDER: '#E5E5EA',
} as const;

export const FONTS = {
  REGULAR: 'System',
  MEDIUM: 'System-Medium',
  SEMIBOLD: 'System-Semibold',
  BOLD: 'System-Bold',
} as const;

export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
} as const;

export const BORDER_RADIUS = {
  SM: 4,
  MD: 8,
  LG: 12,
  XL: 16,
  ROUND: 50,
} as const;

export const STORAGE_KEYS = {
  TRANSACTIONS: '@finsync_transactions',
  CATEGORIES: '@finsync_categories',
  ACCOUNTS: '@finsync_accounts',
  RECEIPTS: '@finsync_receipts',
  INVESTMENTS: '@finsync_investments',
  BUDGETS: '@finsync_budgets',
  SETTINGS: '@finsync_settings',
  USER_PROFILE: '@finsync_user_profile',
} as const;

export const OCR_CONFIDENCE_THRESHOLD = 0.7;
export const MAX_RECEIPT_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const FINANCIAL_GOALS = {
  EMERGENCY_FUND_MONTHS: 6,
  SAVINGS_RATE_TARGET: 0.2, // 20%
  DEBT_TO_INCOME_RATIO_MAX: 0.36, // 36%
} as const;
