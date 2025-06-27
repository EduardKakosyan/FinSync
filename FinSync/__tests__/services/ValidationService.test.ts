import { ValidationService } from '../../src/services/ValidationService';
import { Transaction, Category, Account, Receipt, CreateTransactionInput } from '../../src/types';

describe('ValidationService', () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = ValidationService.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ValidationService.getInstance();
      const instance2 = ValidationService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Transaction Validation', () => {
    const validTransaction: Partial<CreateTransactionInput> = {
      amount: 100.50,
      date: new Date('2024-01-15'),
      category: 'cat_food',
      description: 'Grocery shopping',
      type: 'expense',
      accountId: 'acc_1',
    };

    it('should validate a valid transaction', () => {
      const result = validationService.validateTransaction(validTransaction);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require all mandatory fields', () => {
      const incompleteTransaction: Partial<CreateTransactionInput> = {
        amount: 100,
        // Missing required fields
      };

      const result = validationService.validateTransaction(incompleteTransaction);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      const requiredFields = ['date', 'category', 'description', 'type', 'accountId'];
      requiredFields.forEach(field => {
        const fieldError = result.errors.find(e => e.field === field && e.code === 'REQUIRED');
        expect(fieldError).toBeDefined();
      });
    });

    describe('Amount Validation', () => {
      it('should reject negative amounts', () => {
        const transaction = { ...validTransaction, amount: -100 };
        const result = validationService.validateTransaction(transaction);
        
        expect(result.isValid).toBe(false);
        const amountError = result.errors.find(e => e.field === 'amount');
        expect(amountError).toBeDefined();
        expect(amountError!.code).toBe('MIN_VALUE');
      });

      it('should reject zero amounts', () => {
        const transaction = { ...validTransaction, amount: 0 };
        const result = validationService.validateTransaction(transaction);
        
        expect(result.isValid).toBe(false);
        const amountError = result.errors.find(e => e.field === 'amount');
        expect(amountError).toBeDefined();
      });

      it('should reject amounts exceeding maximum', () => {
        const transaction = { ...validTransaction, amount: 2000000 }; // Over $1M limit
        const result = validationService.validateTransaction(transaction);
        
        expect(result.isValid).toBe(false);
        const amountError = result.errors.find(e => e.field === 'amount');
        expect(amountError).toBeDefined();
        expect(amountError!.code).toBe('MAX_VALUE');
      });

      it('should warn for large amounts', () => {
        const transaction = { ...validTransaction, amount: 15000 }; // Large amount
        const result = validationService.validateTransaction(transaction);
        
        expect(result.isValid).toBe(true);
        const amountWarning = result.warnings.find(w => w.field === 'amount');
        expect(amountWarning).toBeDefined();
        expect(amountWarning!.code).toBe('LARGE_AMOUNT');
      });

      it('should reject non-numeric amounts', () => {
        const transaction = { ...validTransaction, amount: 'invalid' as any };
        const result = validationService.validateTransaction(transaction);
        
        expect(result.isValid).toBe(false);
        const amountError = result.errors.find(e => e.field === 'amount');
        expect(amountError).toBeDefined();
        expect(amountError!.code).toBe('INVALID_TYPE');
      });
    });

    describe('Date Validation', () => {
      it('should reject future dates when not allowed', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 10);
        
        const transaction = { ...validTransaction, date: futureDate };
        const result = validationService.validateTransaction(transaction);
        
        expect(result.isValid).toBe(false);
        const dateError = result.errors.find(e => e.field === 'date');
        expect(dateError).toBeDefined();
        expect(dateError!.code).toBe('FUTURE_DATE');
      });

      it('should allow future dates when enabled in rules', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 10);
        
        const transaction = { ...validTransaction, date: futureDate };
        const result = validationService.validateTransaction(transaction, {
          allowFutureTransactions: true,
        });
        
        expect(result.isValid).toBe(true);
      });

      it('should warn for very old dates', () => {
        const oldDate = new Date();
        oldDate.setFullYear(oldDate.getFullYear() - 2);
        
        const transaction = { ...validTransaction, date: oldDate };
        const result = validationService.validateTransaction(transaction);
        
        expect(result.isValid).toBe(true);
        const dateWarning = result.warnings.find(w => w.field === 'date');
        expect(dateWarning).toBeDefined();
        expect(dateWarning!.code).toBe('OLD_DATE');
      });

      it('should reject invalid date objects', () => {
        const transaction = { ...validTransaction, date: new Date('invalid') };
        const result = validationService.validateTransaction(transaction);
        
        expect(result.isValid).toBe(false);
        const dateError = result.errors.find(e => e.field === 'date');
        expect(dateError).toBeDefined();
        expect(dateError!.code).toBe('INVALID_DATE');
      });

      it('should reject non-date values', () => {
        const transaction = { ...validTransaction, date: 'not-a-date' as any };
        const result = validationService.validateTransaction(transaction);
        
        expect(result.isValid).toBe(false);
        const dateError = result.errors.find(e => e.field === 'date');
        expect(dateError).toBeDefined();
        expect(dateError!.code).toBe('INVALID_TYPE');
      });
    });

    describe('Description Validation', () => {
      it('should reject empty descriptions', () => {
        const transaction = { ...validTransaction, description: '' };
        const result = validationService.validateTransaction(transaction);
        
        expect(result.isValid).toBe(false);
        const descError = result.errors.find(e => e.field === 'description');
        expect(descError).toBeDefined();
        expect(descError!.code).toBe('EMPTY_STRING');
      });

      it('should reject descriptions that are too long', () => {
        const longDescription = 'A'.repeat(250); // Over 200 character limit
        const transaction = { ...validTransaction, description: longDescription };
        const result = validationService.validateTransaction(transaction);
        
        expect(result.isValid).toBe(false);
        const descError = result.errors.find(e => e.field === 'description');
        expect(descError).toBeDefined();
        expect(descError!.code).toBe('MAX_LENGTH');
      });

      it('should warn for very short descriptions', () => {
        const transaction = { ...validTransaction, description: 'ab' };
        const result = validationService.validateTransaction(transaction);
        
        expect(result.isValid).toBe(true);
        const descWarning = result.warnings.find(w => w.field === 'description');
        expect(descWarning).toBeDefined();
        expect(descWarning!.code).toBe('SHORT_DESCRIPTION');
      });

      it('should reject non-string descriptions', () => {
        const transaction = { ...validTransaction, description: 123 as any };
        const result = validationService.validateTransaction(transaction);
        
        expect(result.isValid).toBe(false);
        const descError = result.errors.find(e => e.field === 'description');
        expect(descError).toBeDefined();
        expect(descError!.code).toBe('INVALID_TYPE');
      });
    });

    describe('Type Validation', () => {
      it('should accept valid transaction types', () => {
        const incomeTransaction = { ...validTransaction, type: 'income' as const };
        const expenseTransaction = { ...validTransaction, type: 'expense' as const };
        
        expect(validationService.validateTransaction(incomeTransaction).isValid).toBe(true);
        expect(validationService.validateTransaction(expenseTransaction).isValid).toBe(true);
      });

      it('should reject invalid transaction types', () => {
        const transaction = { ...validTransaction, type: 'invalid' as any };
        const result = validationService.validateTransaction(transaction);
        
        expect(result.isValid).toBe(false);
        const typeError = result.errors.find(e => e.field === 'type');
        expect(typeError).toBeDefined();
        expect(typeError!.code).toBe('INVALID_VALUE');
      });
    });

    describe('Business Rules Validation', () => {
      it('should warn when income has negative amount', () => {
        const transaction = { 
          ...validTransaction, 
          type: 'income' as const, 
          amount: -100 
        };
        const result = validationService.validateTransaction(transaction);
        
        // Should be invalid due to negative amount, but also have business rule warning
        expect(result.isValid).toBe(false);
        const businessWarning = result.warnings.find(w => w.code === 'NEGATIVE_INCOME');
        expect(businessWarning).toBeDefined();
      });

      it('should warn when expense has positive amount', () => {
        const transaction = { 
          ...validTransaction, 
          type: 'expense' as const, 
          amount: 100 // Positive amount for expense
        };
        const result = validationService.validateTransaction(transaction);
        
        expect(result.isValid).toBe(true);
        const businessWarning = result.warnings.find(w => w.code === 'POSITIVE_EXPENSE');
        expect(businessWarning).toBeDefined();
      });
    });
  });

  describe('Category Validation', () => {
    const validCategory = {
      name: 'Food & Dining',
      color: '#FF6B6B',
      type: 'expense' as const,
      budgetLimit: 500,
    };

    it('should validate a valid category', () => {
      const result = validationService.validateCategory(validCategory);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require category name', () => {
      const category = { ...validCategory, name: '' };
      const result = validationService.validateCategory(category);
      
      expect(result.isValid).toBe(false);
      const nameError = result.errors.find(e => e.field === 'name');
      expect(nameError).toBeDefined();
      expect(nameError!.code).toBe('REQUIRED');
    });

    it('should validate color format', () => {
      const invalidColorCategory = { ...validCategory, color: 'invalid-color' };
      const result = validationService.validateCategory(invalidColorCategory);
      
      expect(result.isValid).toBe(false);
      const colorError = result.errors.find(e => e.field === 'color');
      expect(colorError).toBeDefined();
      expect(colorError!.code).toBe('INVALID_FORMAT');
    });

    it('should accept valid hex colors', () => {
      const validColors = ['#FF0000', '#00FF00', '#0000FF', '#ABC', '#123456'];
      
      validColors.forEach(color => {
        const category = { ...validCategory, color };
        const result = validationService.validateCategory(category);
        expect(result.isValid).toBe(true);
      });
    });

    it('should validate category type', () => {
      const invalidTypeCategory = { ...validCategory, type: 'invalid' as any };
      const result = validationService.validateCategory(invalidTypeCategory);
      
      expect(result.isValid).toBe(false);
      const typeError = result.errors.find(e => e.field === 'type');
      expect(typeError).toBeDefined();
      expect(typeError!.code).toBe('INVALID_VALUE');
    });

    it('should prevent duplicate category names', () => {
      const existingCategories: Category[] = [{
        id: 'cat_1',
        name: 'Food & Dining',
        color: '#FF0000',
        type: 'expense',
        createdAt: new Date(),
      }];

      const duplicateCategory = { ...validCategory, name: 'Food & Dining' };
      const result = validationService.validateCategory(
        duplicateCategory, 
        existingCategories
      );
      
      expect(result.isValid).toBe(false);
      const duplicateError = result.errors.find(e => e.code === 'DUPLICATE_NAME');
      expect(duplicateError).toBeDefined();
    });

    it('should allow duplicate names when enabled', () => {
      const existingCategories: Category[] = [{
        id: 'cat_1',
        name: 'Food & Dining',
        color: '#FF0000',
        type: 'expense',
        createdAt: new Date(),
      }];

      const duplicateCategory = { ...validCategory, name: 'Food & Dining' };
      const result = validationService.validateCategory(
        duplicateCategory, 
        existingCategories,
        { allowDuplicateCategories: true }
      );
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('Account Validation', () => {
    const validAccount = {
      name: 'Primary Checking',
      type: 'checking' as const,
      balance: 1000.50,
      currency: 'CAD' as const,
    };

    it('should validate a valid account', () => {
      const result = validationService.validateAccount(validAccount);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require account name', () => {
      const account = { ...validAccount, name: '' };
      const result = validationService.validateAccount(account);
      
      expect(result.isValid).toBe(false);
      const nameError = result.errors.find(e => e.field === 'name');
      expect(nameError).toBeDefined();
      expect(nameError!.code).toBe('REQUIRED');
    });

    it('should validate account type', () => {
      const validTypes = ['checking', 'savings', 'credit', 'investment'];
      
      validTypes.forEach(type => {
        const account = { ...validAccount, type: type as any };
        const result = validationService.validateAccount(account);
        expect(result.isValid).toBe(true);
      });

      const invalidAccount = { ...validAccount, type: 'invalid' as any };
      const result = validationService.validateAccount(invalidAccount);
      expect(result.isValid).toBe(false);
    });

    it('should validate balance when negative balances not allowed', () => {
      const negativeAccount = { ...validAccount, balance: -500 };
      const result = validationService.validateAccount(negativeAccount, {
        allowNegativeBalance: false,
      });
      
      expect(result.isValid).toBe(false);
      const balanceError = result.errors.find(e => e.field === 'balance');
      expect(balanceError).toBeDefined();
      expect(balanceError!.code).toBe('NEGATIVE_BALANCE');
    });

    it('should warn for very low balances', () => {
      const lowBalanceAccount = { ...validAccount, balance: -15000 };
      const result = validationService.validateAccount(lowBalanceAccount);
      
      const balanceWarning = result.warnings.find(w => w.field === 'balance');
      expect(balanceWarning).toBeDefined();
      expect(balanceWarning!.code).toBe('LOW_BALANCE');
    });
  });

  describe('Receipt Validation', () => {
    const validReceipt: Partial<Receipt> = {
      imageUri: 'file://path/to/receipt.jpg',
      extractionConfidence: 0.85,
      amount: 45.67,
      date: new Date('2024-01-15'),
      items: [
        { name: 'Coffee', price: 4.50, quantity: 1 },
        { name: 'Muffin', price: 3.25, quantity: 1 },
      ],
    };

    it('should validate a valid receipt', () => {
      const result = validationService.validateReceipt(validReceipt);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require image URI', () => {
      const receipt = { ...validReceipt, imageUri: '' };
      const result = validationService.validateReceipt(receipt);
      
      expect(result.isValid).toBe(false);
      const uriError = result.errors.find(e => e.field === 'imageUri');
      expect(uriError).toBeDefined();
      expect(uriError!.code).toBe('REQUIRED');
    });

    it('should validate extraction confidence range', () => {
      const invalidConfidenceReceipt = { ...validReceipt, extractionConfidence: 1.5 };
      const result = validationService.validateReceipt(invalidConfidenceReceipt);
      
      expect(result.isValid).toBe(false);
      const confidenceError = result.errors.find(e => e.field === 'extractionConfidence');
      expect(confidenceError).toBeDefined();
      expect(confidenceError!.code).toBe('INVALID_RANGE');
    });

    it('should warn for low extraction confidence', () => {
      const lowConfidenceReceipt = { ...validReceipt, extractionConfidence: 0.6 };
      const result = validationService.validateReceipt(lowConfidenceReceipt);
      
      expect(result.isValid).toBe(true);
      const confidenceWarning = result.warnings.find(w => w.field === 'extractionConfidence');
      expect(confidenceWarning).toBeDefined();
      expect(confidenceWarning!.code).toBe('LOW_CONFIDENCE');
    });

    it('should validate receipt items', () => {
      const invalidItemsReceipt = { 
        ...validReceipt, 
        items: [
          { name: '', price: 0, quantity: 0 }, // Invalid item
        ] 
      };
      const result = validationService.validateReceipt(invalidItemsReceipt);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      const nameError = result.errors.find(e => e.field === 'items[0].name');
      const priceError = result.errors.find(e => e.field === 'items[0].price');
      const quantityError = result.errors.find(e => e.field === 'items[0].quantity');
      
      expect(nameError).toBeDefined();
      expect(priceError).toBeDefined();
      expect(quantityError).toBeDefined();
    });
  });

  describe('Bulk Validation', () => {
    it('should validate multiple transactions', () => {
      const transactions: Partial<CreateTransactionInput>[] = [
        {
          amount: 100,
          date: new Date('2024-01-15'),
          category: 'cat_food',
          description: 'Valid transaction',
          type: 'expense',
          accountId: 'acc_1',
        },
        {
          amount: -50, // Invalid negative amount
          date: new Date('2024-01-16'),
          category: 'cat_transport',
          description: 'Invalid transaction',
          type: 'expense',
          accountId: 'acc_1',
        },
      ];

      const result = validationService.validateTransactionsBulk(transactions);
      
      expect(result.totalRecords).toBe(2);
      expect(result.validRecords).toBe(1);
      expect(result.invalidRecords).toBe(1);
      expect(result.results).toHaveLength(2);
      
      expect(result.results[0].isValid).toBe(true);
      expect(result.results[1].isValid).toBe(false);
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize transaction input', () => {
      const dirtyInput = {
        amount: '  100.50  ',
        date: '2024-01-15',
        category: '  Food & Dining  ',
        description: '  Grocery shopping with extra spaces  ',
        type: 'expense',
        accountId: '  acc_1  ',
      };

      const sanitized = validationService.sanitizeTransactionInput(dirtyInput);
      
      expect(sanitized.amount).toBe(100.50);
      expect(sanitized.date).toBeInstanceOf(Date);
      expect(sanitized.category).toBe('Food & Dining');
      expect(sanitized.description).toBe('Grocery shopping with extra spaces');
      expect(sanitized.type).toBe('expense');
      expect(sanitized.accountId).toBe('acc_1');
    });

    it('should handle invalid input gracefully', () => {
      const invalidInput = {
        amount: 'not-a-number',
        date: 'invalid-date',
        category: null,
        description: undefined,
        type: 'invalid-type',
        accountId: 123,
      };

      const sanitized = validationService.sanitizeTransactionInput(invalidInput);
      
      expect(sanitized.amount).toBe(0);
      expect(sanitized.date).toBeInstanceOf(Date);
      expect(sanitized.category).toBe('');
      expect(sanitized.description).toBe('');
      expect(sanitized.type).toBe('expense'); // Default fallback
      expect(sanitized.accountId).toBe('');
    });
  });

  describe('Data Integrity Validation', () => {
    it('should identify orphaned transactions and missing references', async () => {
      const transactions: Transaction[] = [
        {
          id: 'txn_1',
          amount: 100,
          date: new Date(),
          category: 'missing_category',
          description: 'Test',
          type: 'expense',
          accountId: 'missing_account',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const categories: Category[] = [];
      const accounts: Account[] = [];

      const result = await validationService.validateDataIntegrity(
        transactions,
        categories,
        accounts
      );

      expect(result.success).toBe(true);
      const data = result.data!;
      
      expect(data.orphanedTransactions).toHaveLength(1);
      expect(data.missingCategories).toContain('missing_category');
      expect(data.missingAccounts).toContain('missing_account');
    });
  });
});