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

export const DEFAULT_CATEGORIES = [] as const;

// Theme colors with light/dark mode support
const tintColorLight = '#007AFF';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// Application-specific colors
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
