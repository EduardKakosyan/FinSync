// Core type definitions for FinSync Financial Tracking App

export interface Transaction {
  id: string;
  amount: number;
  date: Date;
  category: string;
  description: string;
  type: 'income' | 'expense';
  receiptId?: string;
  accountId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  budgetLimit?: number;
  parentCategoryId?: string;
  type: 'income' | 'expense';
  createdAt: Date;
}

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment';
  balance: number;
  currency: 'CAD' | 'USD';
  isActive: boolean;
  createdAt: Date;
}

export interface Receipt {
  id: string;
  imageUri: string;
  ocrText?: string;
  extractionConfidence?: number;
  merchantName?: string;
  amount?: number;
  date?: Date;
  items?: ReceiptItem[];
  transactionId?: string;
  createdAt: Date;
}

export interface ReceiptItem {
  name: string;
  price: number;
  quantity?: number;
}

export interface Investment {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  purchasePrice: number;
  currentValue: number;
  purchaseDate: Date;
  type: 'stock' | 'bond' | 'crypto' | 'etf' | 'mutual_fund';
  accountId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  spent: number;
  createdAt: Date;
}

export interface Reminder {
  id: string;
  type: 'transaction' | 'receipt' | 'budget' | 'investment';
  title: string;
  message: string;
  scheduledFor: Date;
  isRecurring: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
  createdAt: Date;
}

// Navigation types
export type RootStackParamList = {
  Main: undefined;
  Settings: undefined;
  TransactionDetails: { 
    transactionId: string; 
    mode?: 'view' | 'edit';
  };
  AddTransaction: { 
    transactionType?: 'income' | 'expense';
    prefillData?: Partial<CreateTransactionInput>;
    receiptId?: string;
  };
  EditTransaction: {
    transactionId: string;
  };
  CategoryDetails: {
    categoryId: string;
    period?: DateRange;
  };
  ReceiptScanner: undefined;
  ReceiptDetails: { receiptId: string };
  LoadingScreen: {
    message?: string;
    onComplete?: () => void;
  };
};

export type TabParamList = {
  HomeTab: undefined;
  TransactionTab: undefined;
  ReceiptTab: undefined;
  InvestmentTab: undefined;
  AnalyticsTab: undefined;
};

export type TransactionStackParamList = {
  TransactionList: undefined;
  AddTransaction: { 
    transactionType?: 'income' | 'expense';
    prefillData?: Partial<CreateTransactionInput>;
  };
  TransactionDetails: { 
    transactionId: string; 
    mode?: 'view' | 'edit';
  };
  EditTransaction: {
    transactionId: string;
  };
};

export type HomeStackParamList = {
  Home: undefined;
  CategoryDetails: {
    categoryId: string;
    period?: DateRange;
  };
  TransactionDetails: { 
    transactionId: string; 
    mode?: 'view' | 'edit';
  };
};

export type ReceiptStackParamList = {
  ReceiptScanner: undefined;
  ReceiptDetails: { receiptId: string };
  ReceiptCapture: {
    existingReceiptId?: string;
  };
};

// Store/State types
export interface AppState {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  receipts: Receipt[];
  investments: Investment[];
  budgets: Budget[];
  reminders: Reminder[];
  user: UserProfile | null;
  settings: AppSettings;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  currency: 'CAD' | 'USD';
  timezone: string;
}

export interface AppSettings {
  currency: 'CAD' | 'USD';
  notifications: {
    enabled: boolean;
    dailyReminders: boolean;
    budgetAlerts: boolean;
  };
  privacy: {
    biometricAuth: boolean;
    autoLock: boolean;
  };
  sync: {
    enabled: boolean;
    lastSyncDate?: Date;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type CreateTransactionInput = Omit<
  Transaction,
  'id' | 'createdAt' | 'updatedAt'
>;
export type UpdateTransactionInput = Partial<CreateTransactionInput> & {
  id: string;
};

export type CreateCategoryInput = Omit<Category, 'id' | 'createdAt'>;
export type CreateAccountInput = Omit<Account, 'id' | 'createdAt'>;
export type CreateInvestmentInput = Omit<
  Investment,
  'id' | 'createdAt' | 'updatedAt'
>;

// ===== DATA AGGREGATION AND ANALYTICS MODELS =====

export interface SpendingData {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  categoryBreakdown: CategorySpending[];
  monthlyTrend: MonthlySpending[];
  dailyAverage: number;
  topCategories: CategorySpending[];
  period: DateRange;
}

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  budgetLimit?: number;
  budgetUsed?: number;
  trend: 'up' | 'down' | 'stable';
  previousPeriodAmount?: number;
}

export interface MonthlySpending {
  month: string; // YYYY-MM format
  year: number;
  monthName: string;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  transactionCount: number;
  topCategory?: string;
  savings: number;
  savingsRate: number;
}

export interface DailySpending {
  date: string; // YYYY-MM-DD format
  income: number;
  expenses: number;
  net: number;
  transactionCount: number;
  primaryCategory?: string;
}

export interface WeeklySpending {
  weekStart: Date;
  weekEnd: Date;
  weekNumber: number;
  income: number;
  expenses: number;
  net: number;
  dailyBreakdown: DailySpending[];
  averageDaily: number;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
  period: 'week' | 'month' | 'quarter' | 'year' | 'custom';
}

export interface FinancialSummary {
  period: DateRange;
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netWorth: number;
  savingsRate: number;
  budgetUtilization: number;
  accountBalances: AccountBalance[];
  investmentValue: number;
  investmentGainLoss: number;
  lastUpdated: Date;
}

export interface AccountBalance {
  accountId: string;
  accountName: string;
  accountType: Account['type'];
  balance: number;
  currency: 'CAD' | 'USD';
  lastTransaction?: Date;
  isActive: boolean;
}

export interface BudgetSummary {
  budgetId: string;
  categoryId: string;
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  utilizationPercentage: number;
  status: 'under' | 'near' | 'over' | 'exceeded';
  daysRemaining: number;
  projectedTotal: number;
  trend: 'improving' | 'worsening' | 'stable';
}

export interface InvestmentSummary {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  portfolioBreakdown: InvestmentBreakdown[];
  topPerformers: InvestmentPerformance[];
  worstPerformers: InvestmentPerformance[];
  lastUpdated: Date;
}

export interface InvestmentBreakdown {
  type: Investment['type'];
  value: number;
  percentage: number;
  gainLoss: number;
  gainLossPercentage: number;
  count: number;
}

export interface InvestmentPerformance {
  investmentId: string;
  symbol: string;
  name: string;
  currentValue: number;
  gainLoss: number;
  gainLossPercentage: number;
  dayChange?: number;
  dayChangePercentage?: number;
}

// ===== STORAGE AND PERSISTENCE MODELS =====

export interface StorageMetadata {
  version: string;
  createdAt: Date;
  updatedAt: Date;
  recordCount: number;
  dataSize: number;
  checksum?: string;
}

export interface BackupInfo {
  id: string;
  filename: string;
  createdAt: Date;
  size: number;
  recordCounts: {
    transactions: number;
    categories: number;
    accounts: number;
    receipts: number;
    investments: number;
  };
  metadata: StorageMetadata;
  isEncrypted: boolean;
}

export interface MigrationInfo {
  fromVersion: string;
  toVersion: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  steps: MigrationStep[];
  errorMessage?: string;
}

export interface MigrationStep {
  id: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export interface SyncInfo {
  lastSyncDate?: Date;
  nextSyncDate?: Date;
  syncInProgress: boolean;
  pendingChanges: number;
  conflictCount: number;
  status: 'idle' | 'syncing' | 'error' | 'conflict';
  errorMessage?: string;
}

// ===== VALIDATION AND ERROR MODELS =====

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  suggestion?: string;
}

export interface DataIntegrityReport {
  checkedAt: Date;
  totalRecords: number;
  corruptedRecords: number;
  missingReferences: number;
  duplicateRecords: number;
  issues: DataIssue[];
  repairRecommendations: string[];
}

export interface DataIssue {
  type: 'corruption' | 'missing_reference' | 'duplicate' | 'invalid_data';
  entity: string;
  entityId: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoFixable: boolean;
}

// ===== SEARCH AND FILTERING MODELS =====

export interface SearchQuery {
  text?: string;
  dateRange?: DateRange;
  categories?: string[];
  accounts?: string[];
  transactionTypes?: ('income' | 'expense')[];
  amountRange?: {
    min?: number;
    max?: number;
  };
  hasReceipt?: boolean;
  sortBy?: 'date' | 'amount' | 'category' | 'description';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchResult<T = Transaction> {
  items: T[];
  totalCount: number;
  hasMore: boolean;
  query: SearchQuery;
  executedAt: Date;
  executionTime: number;
}

export interface FilterOptions {
  categories: CategoryOption[];
  accounts: AccountOption[];
  dateRanges: DateRangeOption[];
  amountRanges: AmountRangeOption[];
}

export interface CategoryOption {
  id: string;
  name: string;
  color: string;
  count: number;
  totalAmount: number;
}

export interface AccountOption {
  id: string;
  name: string;
  type: Account['type'];
  count: number;
  balance: number;
}

export interface DateRangeOption {
  label: string;
  value: DateRange;
  isDefault?: boolean;
}

export interface AmountRangeOption {
  label: string;
  min?: number;
  max?: number;
  isDefault?: boolean;
}

// ===== NOTIFICATION AND REMINDER MODELS =====

export interface NotificationSettings {
  enabled: boolean;
  dailyReminders: {
    enabled: boolean;
    time: string; // HH:MM format
    message: string;
  };
  budgetAlerts: {
    enabled: boolean;
    thresholds: number[]; // Percentages like [75, 90, 100]
  };
  receiptReminders: {
    enabled: boolean;
    hoursAfterExpense: number;
  };
  investmentUpdates: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
  };
  syncNotifications: {
    enabled: boolean;
    onError: boolean;
    onSuccess: boolean;
  };
}

// ===== UTILITY TYPES FOR ENHANCED FUNCTIONALITY =====

export type EntityType = 'transaction' | 'category' | 'account' | 'receipt' | 'investment' | 'budget' | 'reminder';

export type SortDirection = 'asc' | 'desc';

export type PaginationInfo = {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type AsyncOperationStatus = {
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
};

// Enhanced create/update input types
export type CreateInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateInput<T> = Partial<CreateInput<T>> & { id: string };
export type PatchInput<T> = Partial<T> & { id: string };
