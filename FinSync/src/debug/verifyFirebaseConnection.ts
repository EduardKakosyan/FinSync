/**
 * Debug script to verify Firebase transaction functionality
 */

import { firebaseTransactionService } from '../services/firebase/FirebaseTransactionService';
import { enhancedTransactionService } from '../services/EnhancedTransactionService';

export const verifyFirebaseConnection = async () => {
  console.log('🔥 Verifying Firebase transaction functionality...');
  
  try {
    // Test 1: Create a transaction directly via Firebase service
    console.log('\n1. Testing direct Firebase transaction creation...');
    const testTransaction = {
      amount: 15.99,
      description: 'Debug test transaction',
      category: 'food',
      type: 'expense' as const,
      date: new Date(),
      accountId: 'default-account',
      notes: 'Firebase connection test',
    };
    
    const directResult = await firebaseTransactionService.create(testTransaction);
    console.log('✅ Direct Firebase creation result:', directResult.id);
    
    // Test 2: Retrieve transactions via Firebase service
    console.log('\n2. Testing direct Firebase transaction retrieval...');
    const { transactions } = await firebaseTransactionService.getAll({ limit: 10 });
    console.log('✅ Direct Firebase retrieval found:', transactions.length, 'transactions');
    
    // Test 3: Create via enhanced service
    console.log('\n3. Testing enhanced service transaction creation...');
    enhancedTransactionService.updateConfiguration({
      useMockData: false,
      autoFormat: true,
      enableCaching: false, // Disable cache for testing
    });
    
    const enhancedResult = await enhancedTransactionService.createTransaction({
      amount: 22.50,
      description: 'Enhanced service test',
      category: 'transport',
      type: 'expense',
      date: new Date(),
      accountId: 'default-account',
    });
    
    console.log('✅ Enhanced service creation:', enhancedResult.success, enhancedResult.data?.id);
    
    // Test 4: Retrieve via enhanced service
    console.log('\n4. Testing enhanced service transaction retrieval...');
    const enhancedRetrieveResult = await enhancedTransactionService.getTransactions(
      { type: 'month' },
      true
    );
    
    console.log('✅ Enhanced service retrieval:', enhancedRetrieveResult.success);
    console.log('📊 Found transactions:', enhancedRetrieveResult.data?.length || 0);
    
    if (enhancedRetrieveResult.data && enhancedRetrieveResult.data.length > 0) {
      console.log('💾 Sample transaction:', {
        id: enhancedRetrieveResult.data[0].id,
        description: enhancedRetrieveResult.data[0].description,
        amount: enhancedRetrieveResult.data[0].amount,
        formatted: enhancedRetrieveResult.data[0].formatted,
      });
    }
    
    // Test 5: Get quick stats
    console.log('\n5. Testing quick stats...');
    const statsResult = await enhancedTransactionService.getQuickStats();
    console.log('✅ Quick stats:', statsResult.success);
    if (statsResult.data) {
      console.log('📈 Today stats:', statsResult.data.today);
      console.log('📈 Month stats:', statsResult.data.thisMonth);
    }
    
    console.log('\n🎉 All Firebase tests completed successfully!');
    return {
      success: true,
      directCreated: directResult.id,
      enhancedCreated: enhancedResult.data?.id,
      totalTransactions: enhancedRetrieveResult.data?.length || 0,
    };
    
  } catch (error) {
    console.error('❌ Firebase verification failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

export default verifyFirebaseConnection;