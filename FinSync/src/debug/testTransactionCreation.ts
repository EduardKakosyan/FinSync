/**
 * Debug script to test transaction creation
 * Run this to verify the transaction flow works correctly
 */

import { firebaseTransactionService } from '../services/firebase/FirebaseTransactionService';
import { parseAmountFromInput } from '../utils/currencyUtils';

export const testTransactionCreation = async () => {
  console.log('🧪 Testing transaction creation flow...');
  
  try {
    // Test 1: Basic transaction creation
    console.log('\n1. Testing basic transaction creation...');
    const basicTransaction = {
      amount: parseAmountFromInput('25.99'),
      description: 'Test coffee purchase',
      category: 'food',
      type: 'expense' as const,
      date: new Date(),
      accountId: 'default-account',
      notes: 'Debug test transaction',
    };
    
    console.log('Transaction data:', basicTransaction);
    
    const result = await firebaseTransactionService.create(basicTransaction);
    console.log('✅ Basic transaction created:', result.id);
    
    // Test 2: Recurring transaction creation
    console.log('\n2. Testing recurring transaction creation...');
    const recurringTransaction = {
      amount: parseAmountFromInput('2000.00'),
      description: 'Monthly salary',
      category: 'income',
      type: 'income' as const,
      date: new Date(),
      accountId: 'default-account',
    };
    
    const recurringResult = await firebaseTransactionService.createRecurring(
      recurringTransaction,
      {
        interval: 'monthly',
        dayOfMonth: 1,
      }
    );
    console.log('✅ Recurring transaction created:', recurringResult.id);
    
    // Test 3: Retrieve transactions
    console.log('\n3. Testing transaction retrieval...');
    const allTransactions = await firebaseTransactionService.getAll({ limit: 10 });
    console.log('✅ Retrieved transactions:', allTransactions.transactions.length);
    
    console.log('\n🎉 All tests passed! Transaction functionality is working correctly.');
    
    return {
      success: true,
      basicTransactionId: result.id,
      recurringTransactionId: recurringResult.id,
      totalTransactions: allTransactions.transactions.length,
    };
    
  } catch (error) {
    console.error('❌ Transaction creation failed:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

export const testFormValidation = () => {
  console.log('🧪 Testing form validation...');
  
  try {
    // Test parseAmountFromInput function
    const testCases = [
      { input: '25.99', expected: 25.99 },
      { input: '$25.99', expected: 25.99 },
      { input: '1,234.56', expected: 1234.56 },
      { input: '', expected: 0 },
      { input: 'abc', expected: 0 },
    ];
    
    testCases.forEach(({ input, expected }) => {
      const result = parseAmountFromInput(input);
      console.log(`Input: "${input}" → ${result} (expected: ${expected})`);
      if (result !== expected) {
        throw new Error(`Validation failed for input "${input}": got ${result}, expected ${expected}`);
      }
    });
    
    console.log('✅ All validation tests passed!');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Validation test failed:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

export const debugTransactionIssue = async () => {
  console.log('🔍 Debugging transaction creation issue...');
  
  // Simulate the exact flow from the advanced-add-transaction screen
  const formData = {
    amount: '25.99',
    description: 'Coffee purchase',
    category: 'food',
    type: 'expense' as const,
    date: new Date(),
    notes: 'Morning coffee',
    accountId: 'default-account',
  };
  
  console.log('Form data:', formData);
  
  // Step 1: Parse amount
  const parsedAmount = parseAmountFromInput(formData.amount);
  console.log('Parsed amount:', parsedAmount);
  
  // Step 2: Create transaction data
  const transactionData = {
    amount: parsedAmount,
    description: formData.description,
    category: formData.category,
    type: formData.type,
    date: formData.date,
    notes: formData.notes,
    accountId: formData.accountId,
  };
  
  console.log('Transaction data:', transactionData);
  
  // Step 3: Validate
  if (!transactionData.amount || transactionData.amount <= 0) {
    console.error('❌ Amount validation failed');
    return { success: false, error: 'Amount must be greater than 0' };
  }
  
  if (!transactionData.description.trim()) {
    console.error('❌ Description validation failed');
    return { success: false, error: 'Description is required' };
  }
  
  if (!transactionData.category) {
    console.error('❌ Category validation failed');
    return { success: false, error: 'Category is required' };
  }
  
  console.log('✅ All validations passed');
  
  // Step 4: Try to create transaction
  try {
    const result = await firebaseTransactionService.create(transactionData);
    console.log('✅ Transaction created successfully:', result.id);
    return { success: true, transactionId: result.id };
  } catch (error) {
    console.error('❌ Firebase transaction creation failed:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

// Export all debug functions
export default {
  testTransactionCreation,
  testFormValidation,
  debugTransactionIssue,
};