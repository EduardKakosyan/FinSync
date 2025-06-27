/**
 * Validation Service for FinSync Financial App
 * Provides comprehensive validation for transaction data and other financial entities
 * Includes business logic validation, data integrity checks, and input sanitization
 */

import {
  Transaction,
  Category,
  Account,
  Receipt,
  Budget,
  Investment,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  CreateTransactionInput,
  CreateCategoryInput,
  CreateAccountInput,
  ApiResponse,
} from '../types';
import { isValid, isAfter, isBefore, parseISO, startOfDay } from 'date-fns';

export interface ValidationRules {
  allowFutureTransactions?: boolean;
  maxTransactionAmount?: number;
  minTransactionAmount?: number;
  maxDescriptionLength?: number;
  requiredFields?: string[];
  allowedCurrencies?: string[];
  maxCategoryNameLength?: number;
  allowDuplicateCategories?: boolean;
  maxAccountNameLength?: number;
  allowNegativeBalance?: boolean;
}

export interface BulkValidationResult {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  results: Array<{
    index: number;
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    data?: any;
  }>;
}

export class ValidationService {
  private static instance: ValidationService;
  private defaultRules: ValidationRules = {
    allowFutureTransactions: false,
    maxTransactionAmount: 1000000, // $1M CAD
    minTransactionAmount: 0.01,
    maxDescriptionLength: 200,
    requiredFields: ['amount', 'date', 'category', 'description', 'type', 'accountId'],
    allowedCurrencies: ['CAD', 'USD'],
    maxCategoryNameLength: 50,
    allowDuplicateCategories: false,
    maxAccountNameLength: 100,
    allowNegativeBalance: true,
  };

  private constructor() {}

  public static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  /**
   * Validate transaction data
   */
  validateTransaction(
    transaction: Partial<CreateTransactionInput> | Partial<Transaction>,
    rules: Partial<ValidationRules> = {}
  ): ValidationResult {
    const validationRules = { ...this.defaultRules, ...rules };
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields validation
    this.validateRequiredFields(transaction, validationRules.requiredFields!, errors);

    // Amount validation
    this.validateAmount(transaction.amount, validationRules, errors, warnings);

    // Date validation
    this.validateDate(transaction.date, validationRules, errors, warnings);

    // Description validation
    this.validateDescription(transaction.description, validationRules, errors, warnings);

    // Type validation
    this.validateTransactionType(transaction.type, errors);

    // Category validation
    this.validateCategoryReference(transaction.category, errors, warnings);

    // Account ID validation
    this.validateAccountReference(transaction.accountId, errors);

    // Receipt ID validation (if provided)
    if (transaction.receiptId) {
      this.validateReceiptReference(transaction.receiptId, warnings);
    }

    // Business logic validations
    this.validateBusinessRules(transaction, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate category data
   */
  validateCategory(
    category: Partial<CreateCategoryInput> | Partial<Category>,
    existingCategories: Category[] = [],
    rules: Partial<ValidationRules> = {}
  ): ValidationResult {
    const validationRules = { ...this.defaultRules, ...rules };
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Name validation
    this.validateCategoryName(category.name, validationRules, errors);

    // Color validation
    this.validateCategoryColor(category.color, errors);

    // Type validation
    this.validateCategoryType(category.type, errors);

    // Budget limit validation
    this.validateBudgetLimit(category.budgetLimit, warnings);

    // Parent category validation
    this.validateParentCategory(category.parentCategoryId, existingCategories, errors);

    // Duplicate name validation
    if (!validationRules.allowDuplicateCategories) {
      this.validateUniqueCategoryName(
        category.name,
        category.type,
        existingCategories,
        errors
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate account data
   */
  validateAccount(
    account: Partial<CreateAccountInput> | Partial<Account>,
    rules: Partial<ValidationRules> = {}
  ): ValidationResult {
    const validationRules = { ...this.defaultRules, ...rules };
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Name validation
    this.validateAccountName(account.name, validationRules, errors);

    // Type validation
    this.validateAccountType(account.type, errors);

    // Balance validation
    this.validateAccountBalance(account.balance, validationRules, errors, warnings);

    // Currency validation
    this.validateCurrency(account.currency, validationRules, errors);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate receipt data
   */
  validateReceipt(receipt: Partial<Receipt>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Image URI validation
    if (!receipt.imageUri || receipt.imageUri.trim().length === 0) {
      errors.push({
        field: 'imageUri',
        message: 'Receipt image URI is required',
        code: 'REQUIRED',
        value: receipt.imageUri,
      });
    }

    // OCR confidence validation
    if (receipt.extractionConfidence !== undefined) {
      if (receipt.extractionConfidence < 0 || receipt.extractionConfidence > 1) {
        errors.push({
          field: 'extractionConfidence',
          message: 'Extraction confidence must be between 0 and 1',
          code: 'INVALID_RANGE',
          value: receipt.extractionConfidence,
        });
      } else if (receipt.extractionConfidence < 0.7) {
        warnings.push({
          field: 'extractionConfidence',
          message: 'Low OCR confidence may indicate poor image quality',
          code: 'LOW_CONFIDENCE',
          suggestion: 'Consider retaking the receipt photo for better accuracy',
        });
      }
    }

    // Amount validation (if extracted)
    if (receipt.amount !== undefined) {
      this.validateAmount(receipt.amount, this.defaultRules, errors, warnings);
    }

    // Date validation (if extracted)
    if (receipt.date !== undefined) {
      this.validateDate(receipt.date, this.defaultRules, errors, warnings);
    }

    // Items validation
    if (receipt.items) {
      this.validateReceiptItems(receipt.items, errors, warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate budget data
   */
  validateBudget(budget: Partial<Budget>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Category ID validation
    if (!budget.categoryId || budget.categoryId.trim().length === 0) {
      errors.push({
        field: 'categoryId',
        message: 'Category ID is required for budget',
        code: 'REQUIRED',
        value: budget.categoryId,
      });
    }

    // Amount validation
    if (!budget.amount || budget.amount <= 0) {
      errors.push({
        field: 'amount',
        message: 'Budget amount must be greater than 0',
        code: 'MIN_VALUE',
        value: budget.amount,
      });
    }

    // Period validation
    if (!budget.period || !['weekly', 'monthly', 'yearly'].includes(budget.period)) {
      errors.push({
        field: 'period',
        message: 'Budget period must be weekly, monthly, or yearly',
        code: 'INVALID_VALUE',
        value: budget.period,
      });
    }

    // Date range validation
    if (budget.startDate && budget.endDate) {
      if (isAfter(budget.startDate, budget.endDate)) {
        errors.push({
          field: 'dateRange',
          message: 'Start date must be before end date',
          code: 'INVALID_DATE_RANGE',
          value: { start: budget.startDate, end: budget.endDate },
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate investment data
   */
  validateInvestment(investment: Partial<Investment>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Symbol validation
    if (!investment.symbol || investment.symbol.trim().length === 0) {
      errors.push({
        field: 'symbol',
        message: 'Investment symbol is required',
        code: 'REQUIRED',
        value: investment.symbol,
      });
    } else if (investment.symbol.length > 10) {
      errors.push({
        field: 'symbol',
        message: 'Investment symbol must be 10 characters or less',
        code: 'MAX_LENGTH',
        value: investment.symbol,
      });
    }

    // Name validation
    if (!investment.name || investment.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Investment name is required',
        code: 'REQUIRED',
        value: investment.name,
      });
    }

    // Shares validation
    if (!investment.shares || investment.shares <= 0) {
      errors.push({
        field: 'shares',
        message: 'Number of shares must be greater than 0',
        code: 'MIN_VALUE',
        value: investment.shares,
      });
    }

    // Purchase price validation
    if (!investment.purchasePrice || investment.purchasePrice <= 0) {
      errors.push({
        field: 'purchasePrice',
        message: 'Purchase price must be greater than 0',
        code: 'MIN_VALUE',
        value: investment.purchasePrice,
      });
    }

    // Current value validation
    if (investment.currentValue !== undefined && investment.currentValue < 0) {
      warnings.push({
        field: 'currentValue',
        message: 'Current value is negative',
        code: 'NEGATIVE_VALUE',
        suggestion: 'Verify current market value',
      });
    }

    // Type validation
    if (!investment.type || !['stock', 'bond', 'crypto', 'etf', 'mutual_fund'].includes(investment.type)) {
      errors.push({
        field: 'type',
        message: 'Investment type must be stock, bond, crypto, etf, or mutual_fund',
        code: 'INVALID_VALUE',
        value: investment.type,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate multiple transactions in bulk
   */
  validateTransactionsBulk(
    transactions: Array<Partial<CreateTransactionInput>>,
    rules: Partial<ValidationRules> = {}
  ): BulkValidationResult {
    const results = transactions.map((transaction, index) => {
      const validation = this.validateTransaction(transaction, rules);
      return {
        index,
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
        data: transaction,
      };
    });

    const validRecords = results.filter(r => r.isValid).length;
    const invalidRecords = results.length - validRecords;

    return {
      totalRecords: transactions.length,
      validRecords,
      invalidRecords,
      results,
    };
  }

  /**
   * Sanitize input data
   */
  sanitizeTransactionInput(input: any): Partial<CreateTransactionInput> {
    return {
      amount: this.sanitizeNumber(input.amount),
      date: this.sanitizeDate(input.date),
      category: this.sanitizeString(input.category),
      description: this.sanitizeString(input.description, this.defaultRules.maxDescriptionLength),
      type: this.sanitizeTransactionType(input.type),
      accountId: this.sanitizeString(input.accountId),
      receiptId: input.receiptId ? this.sanitizeString(input.receiptId) : undefined,
    };
  }

  /**
   * Check data integrity across related entities
   */
  async validateDataIntegrity(
    transactions: Transaction[],
    categories: Category[],
    accounts: Account[]
  ): Promise<ApiResponse<{
    orphanedTransactions: Transaction[];
    missingCategories: string[];
    missingAccounts: string[];
    duplicateTransactions: Transaction[];
    inconsistentBalances: string[];
  }>> {
    try {
      const categoryIds = new Set(categories.map(c => c.id));
      const categoryNames = new Set(categories.map(c => c.name));
      const accountIds = new Set(accounts.map(a => a.id));

      // Find orphaned transactions
      const orphanedTransactions = transactions.filter(t => 
        !accountIds.has(t.accountId)
      );

      // Find missing categories
      const referencedCategories = new Set(transactions.map(t => t.category));
      const missingCategories = Array.from(referencedCategories).filter(cat => 
        !categoryIds.has(cat) && !categoryNames.has(cat)
      );

      // Find missing accounts
      const referencedAccounts = new Set(transactions.map(t => t.accountId));
      const missingAccounts = Array.from(referencedAccounts).filter(acc => 
        !accountIds.has(acc)
      );

      // Find duplicate transactions
      const duplicateTransactions = this.findDuplicateTransactions(transactions);

      // Check for inconsistent balances (placeholder - would need actual balance calculation)
      const inconsistentBalances: string[] = [];

      return {
        success: true,
        data: {
          orphanedTransactions,
          missingCategories,
          missingAccounts,
          duplicateTransactions,
          inconsistentBalances,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to validate data integrity',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Private validation methods

  private validateRequiredFields(
    data: any,
    requiredFields: string[],
    errors: ValidationError[]
  ): void {
    requiredFields.forEach(field => {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        errors.push({
          field,
          message: `${field} is required`,
          code: 'REQUIRED',
          value: data[field],
        });
      }
    });
  }

  private validateAmount(
    amount: any,
    rules: ValidationRules,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (amount === undefined || amount === null) return;

    if (typeof amount !== 'number' || isNaN(amount)) {
      errors.push({
        field: 'amount',
        message: 'Amount must be a valid number',
        code: 'INVALID_TYPE',
        value: amount,
      });
      return;
    }

    if (amount < rules.minTransactionAmount!) {
      errors.push({
        field: 'amount',
        message: `Amount must be at least ${rules.minTransactionAmount}`,
        code: 'MIN_VALUE',
        value: amount,
      });
    }

    if (amount > rules.maxTransactionAmount!) {
      errors.push({
        field: 'amount',
        message: `Amount cannot exceed ${rules.maxTransactionAmount}`,
        code: 'MAX_VALUE',
        value: amount,
      });
    }

    // Warning for unusually large amounts
    if (amount > 10000) {
      warnings.push({
        field: 'amount',
        message: 'Large transaction amount detected',
        code: 'LARGE_AMOUNT',
        suggestion: 'Please verify this amount is correct',
      });
    }
  }

  private validateDate(
    date: any,
    rules: ValidationRules,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!date) return;

    let parsedDate: Date;
    
    if (typeof date === 'string') {
      parsedDate = parseISO(date);
    } else if (date instanceof Date) {
      parsedDate = date;
    } else {
      errors.push({
        field: 'date',
        message: 'Date must be a valid date string or Date object',
        code: 'INVALID_TYPE',
        value: date,
      });
      return;
    }

    if (!isValid(parsedDate)) {
      errors.push({
        field: 'date',
        message: 'Date is not valid',
        code: 'INVALID_DATE',
        value: date,
      });
      return;
    }

    const today = startOfDay(new Date());
    
    if (!rules.allowFutureTransactions && isAfter(parsedDate, today)) {
      errors.push({
        field: 'date',
        message: 'Transaction date cannot be in the future',
        code: 'FUTURE_DATE',
        value: date,
      });
    }

    // Warning for very old transactions
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    if (isBefore(parsedDate, oneYearAgo)) {
      warnings.push({
        field: 'date',
        message: 'Transaction date is more than one year old',
        code: 'OLD_DATE',
        suggestion: 'Verify this date is correct',
      });
    }
  }

  private validateDescription(
    description: any,
    rules: ValidationRules,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!description) return;

    if (typeof description !== 'string') {
      errors.push({
        field: 'description',
        message: 'Description must be a string',
        code: 'INVALID_TYPE',
        value: description,
      });
      return;
    }

    if (description.trim().length === 0) {
      errors.push({
        field: 'description',
        message: 'Description cannot be empty',
        code: 'EMPTY_STRING',
        value: description,
      });
    }

    if (description.length > rules.maxDescriptionLength!) {
      errors.push({
        field: 'description',
        message: `Description must be ${rules.maxDescriptionLength} characters or less`,
        code: 'MAX_LENGTH',
        value: description,
      });
    }

    // Warning for very short descriptions
    if (description.trim().length < 3) {
      warnings.push({
        field: 'description',
        message: 'Very short description',
        code: 'SHORT_DESCRIPTION',
        suggestion: 'Consider adding more detail for better categorization',
      });
    }
  }

  private validateTransactionType(type: any, errors: ValidationError[]): void {
    if (!type || !['income', 'expense'].includes(type)) {
      errors.push({
        field: 'type',
        message: 'Transaction type must be either "income" or "expense"',
        code: 'INVALID_VALUE',
        value: type,
      });
    }
  }

  private validateCategoryReference(
    category: any,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!category) return;

    if (typeof category !== 'string' || category.trim().length === 0) {
      errors.push({
        field: 'category',
        message: 'Category must be a non-empty string',
        code: 'INVALID_TYPE',
        value: category,
      });
    }
  }

  private validateAccountReference(accountId: any, errors: ValidationError[]): void {
    if (!accountId) return;

    if (typeof accountId !== 'string' || accountId.trim().length === 0) {
      errors.push({
        field: 'accountId',
        message: 'Account ID must be a non-empty string',
        code: 'INVALID_TYPE',
        value: accountId,
      });
    }
  }

  private validateReceiptReference(receiptId: any, warnings: ValidationWarning[]): void {
    if (typeof receiptId !== 'string' || receiptId.trim().length === 0) {
      warnings.push({
        field: 'receiptId',
        message: 'Receipt ID should be a non-empty string',
        code: 'INVALID_REFERENCE',
        suggestion: 'Verify receipt ID is correct',
      });
    }
  }

  private validateBusinessRules(
    transaction: any,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Business rule: Income amounts should be positive
    if (transaction.type === 'income' && transaction.amount && transaction.amount < 0) {
      warnings.push({
        field: 'amount',
        message: 'Income transaction has negative amount',
        code: 'NEGATIVE_INCOME',
        suggestion: 'Income amounts are typically positive',
      });
    }

    // Business rule: Expense amounts should be negative
    if (transaction.type === 'expense' && transaction.amount && transaction.amount > 0) {
      warnings.push({
        field: 'amount',
        message: 'Expense transaction has positive amount',
        code: 'POSITIVE_EXPENSE',
        suggestion: 'Expense amounts are typically negative',
      });
    }
  }

  private validateCategoryName(
    name: any,
    rules: ValidationRules,
    errors: ValidationError[]
  ): void {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Category name is required and must be a non-empty string',
        code: 'REQUIRED',
        value: name,
      });
      return;
    }

    if (name.length > rules.maxCategoryNameLength!) {
      errors.push({
        field: 'name',
        message: `Category name must be ${rules.maxCategoryNameLength} characters or less`,
        code: 'MAX_LENGTH',
        value: name,
      });
    }
  }

  private validateCategoryColor(color: any, errors: ValidationError[]): void {
    if (!color || typeof color !== 'string') {
      errors.push({
        field: 'color',
        message: 'Category color is required',
        code: 'REQUIRED',
        value: color,
      });
      return;
    }

    // Validate hex color format
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(color)) {
      errors.push({
        field: 'color',
        message: 'Color must be a valid hex color (e.g., #FF0000)',
        code: 'INVALID_FORMAT',
        value: color,
      });
    }
  }

  private validateCategoryType(type: any, errors: ValidationError[]): void {
    if (!type || !['income', 'expense'].includes(type)) {
      errors.push({
        field: 'type',
        message: 'Category type must be either "income" or "expense"',
        code: 'INVALID_VALUE',
        value: type,
      });
    }
  }

  private validateBudgetLimit(budgetLimit: any, warnings: ValidationWarning[]): void {
    if (budgetLimit !== undefined && budgetLimit <= 0) {
      warnings.push({
        field: 'budgetLimit',
        message: 'Budget limit should be greater than 0',
        code: 'INVALID_BUDGET',
        suggestion: 'Set a positive budget limit or leave empty',
      });
    }
  }

  private validateParentCategory(
    parentCategoryId: any,
    existingCategories: Category[],
    errors: ValidationError[]
  ): void {
    if (parentCategoryId && !existingCategories.find(c => c.id === parentCategoryId)) {
      errors.push({
        field: 'parentCategoryId',
        message: 'Parent category does not exist',
        code: 'INVALID_REFERENCE',
        value: parentCategoryId,
      });
    }
  }

  private validateUniqueCategoryName(
    name: any,
    type: any,
    existingCategories: Category[],
    errors: ValidationError[]
  ): void {
    if (name && type) {
      const duplicate = existingCategories.find(c => 
        c.name.toLowerCase() === name.toLowerCase() && c.type === type
      );
      
      if (duplicate) {
        errors.push({
          field: 'name',
          message: `Category with name "${name}" already exists for ${type} type`,
          code: 'DUPLICATE_NAME',
          value: name,
        });
      }
    }
  }

  private validateAccountName(
    name: any,
    rules: ValidationRules,
    errors: ValidationError[]
  ): void {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Account name is required and must be a non-empty string',
        code: 'REQUIRED',
        value: name,
      });
      return;
    }

    if (name.length > rules.maxAccountNameLength!) {
      errors.push({
        field: 'name',
        message: `Account name must be ${rules.maxAccountNameLength} characters or less`,
        code: 'MAX_LENGTH',
        value: name,
      });
    }
  }

  private validateAccountType(type: any, errors: ValidationError[]): void {
    if (!type || !['checking', 'savings', 'credit', 'investment'].includes(type)) {
      errors.push({
        field: 'type',
        message: 'Account type must be checking, savings, credit, or investment',
        code: 'INVALID_VALUE',
        value: type,
      });
    }
  }

  private validateAccountBalance(
    balance: any,
    rules: ValidationRules,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (balance === undefined || balance === null) return;

    if (typeof balance !== 'number' || isNaN(balance)) {
      errors.push({
        field: 'balance',
        message: 'Account balance must be a valid number',
        code: 'INVALID_TYPE',
        value: balance,
      });
      return;
    }

    if (!rules.allowNegativeBalance && balance < 0) {
      errors.push({
        field: 'balance',
        message: 'Account balance cannot be negative',
        code: 'NEGATIVE_BALANCE',
        value: balance,
      });
    }

    if (balance < -10000) {
      warnings.push({
        field: 'balance',
        message: 'Very low account balance',
        code: 'LOW_BALANCE',
        suggestion: 'Consider reviewing account status',
      });
    }
  }

  private validateCurrency(
    currency: any,
    rules: ValidationRules,
    errors: ValidationError[]
  ): void {
    if (!currency || !rules.allowedCurrencies!.includes(currency)) {
      errors.push({
        field: 'currency',
        message: `Currency must be one of: ${rules.allowedCurrencies!.join(', ')}`,
        code: 'INVALID_VALUE',
        value: currency,
      });
    }
  }

  private validateReceiptItems(
    items: any[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!Array.isArray(items)) {
      errors.push({
        field: 'items',
        message: 'Receipt items must be an array',
        code: 'INVALID_TYPE',
        value: items,
      });
      return;
    }

    items.forEach((item, index) => {
      if (!item.name || typeof item.name !== 'string') {
        errors.push({
          field: `items[${index}].name`,
          message: 'Item name is required and must be a string',
          code: 'REQUIRED',
          value: item.name,
        });
      }

      if (!item.price || typeof item.price !== 'number' || item.price <= 0) {
        errors.push({
          field: `items[${index}].price`,
          message: 'Item price must be a positive number',
          code: 'INVALID_VALUE',
          value: item.price,
        });
      }

      if (item.quantity !== undefined && (typeof item.quantity !== 'number' || item.quantity <= 0)) {
        errors.push({
          field: `items[${index}].quantity`,
          message: 'Item quantity must be a positive number',
          code: 'INVALID_VALUE',
          value: item.quantity,
        });
      }
    });
  }

  // Sanitization methods

  private sanitizeString(value: any, maxLength?: number): string {
    if (typeof value !== 'string') return '';
    let sanitized = value.trim();
    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    return sanitized;
  }

  private sanitizeNumber(value: any): number {
    if (typeof value === 'number' && !isNaN(value)) return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  private sanitizeDate(value: any): Date {
    if (value instanceof Date && isValid(value)) return value;
    if (typeof value === 'string') {
      const parsed = parseISO(value);
      return isValid(parsed) ? parsed : new Date();
    }
    return new Date();
  }

  private sanitizeTransactionType(value: any): 'income' | 'expense' {
    if (value === 'income' || value === 'expense') return value;
    return 'expense'; // Default to expense
  }

  private findDuplicateTransactions(transactions: Transaction[]): Transaction[] {
    const seen = new Set<string>();
    const duplicates: Transaction[] = [];

    transactions.forEach(transaction => {
      // Create a signature for the transaction
      const signature = `${transaction.amount}_${transaction.date.toISOString()}_${transaction.description}_${transaction.accountId}`;
      
      if (seen.has(signature)) {
        duplicates.push(transaction);
      } else {
        seen.add(signature);
      }
    });

    return duplicates;
  }
}

// Export singleton instance
export const validationService = ValidationService.getInstance();
export default validationService;