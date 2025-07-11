import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore,
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  deleteDoc,
  doc,
  updateDoc,
  connectFirestoreEmulator,
  enableNetwork,
  disableNetwork,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import { Transaction } from '../types';
import { firebaseConfig } from '../config/env';
import { retryWithExponentialBackoff, handleFirebaseError, isWebChannelError } from '../utils/firebaseErrorHandler';
import { getPollingService } from './firebasePolling';

let app: any;
let db: any;

export const initializeFirebase = async () => {
  try {
    if (!app) {
      app = initializeApp(firebaseConfig);
      
      // Initialize Firestore with proper settings for real-time listeners
      try {
        db = initializeFirestore(app, {
          // Don't force long polling - use WebSockets for real-time updates
          experimentalForceLongPolling: false,
          useFetchStreams: false,
          merge: true
        });
        console.log('✅ Firebase initialized with WebSocket support');
      } catch (error) {
        console.log('Falling back to standard getFirestore');
        const { getFirestore } = await import('firebase/firestore');
        db = getFirestore(app);
      }
      
      // Note: IndexedDB persistence is not available in React Native
      // The SDK will automatically use memory cache for offline support
      console.log('✅ Firebase initialized with memory cache for offline support');
      
      // Enable network with retry
      let retries = 0;
      const maxRetries = 3;
      
      while (retries < maxRetries) {
        try {
          await enableNetwork(db);
          console.log('✅ Firebase network enabled successfully');
          break;
        } catch (networkError) {
          retries++;
          console.warn(`⚠️ Firebase network enable attempt ${retries}/${maxRetries} failed:`, networkError);
          if (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          }
        }
      }
    }
    
    return { app, db };
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    throw error;
  }
};

// Transaction CRUD operations
export const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
  if (!db) await initializeFirebase();
  
  return retryWithExponentialBackoff(async () => {
    const docRef = await addDoc(collection(db, 'transactions'), {
      ...transaction,
      date: Timestamp.fromDate(transaction.date),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    console.log('✅ Transaction added successfully:', docRef.id);
    return docRef.id;
  });
};

export const getTransactions = async (startDate?: Date, endDate?: Date): Promise<Transaction[]> => {
  if (!db) await initializeFirebase();
  
  try {
    let q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
    
    if (startDate && endDate) {
      q = query(
        collection(db, 'transactions'),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        orderBy('date', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    const transactions: Transaction[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        ...data,
        date: data.date.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Transaction);
    });
    
    return transactions;
  } catch (error) {
    console.error('Error getting transactions:', error);
    throw error;
  }
};

export const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
  if (!db) await initializeFirebase();
  
  try {
    const docRef = doc(db, 'transactions', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

export const deleteTransaction = async (id: string) => {
  if (!db) await initializeFirebase();
  
  try {
    await deleteDoc(doc(db, 'transactions', id));
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

export const subscribeToTransactions = (
  callback: (transactions: Transaction[]) => void,
  startDate?: Date,
  endDate?: Date
) => {
  if (!db) {
    initializeFirebase().then(() => subscribeToTransactions(callback, startDate, endDate));
    return () => {};
  }
  
  const pollingService = getPollingService(db);
  
  // Check if we should use polling mode (after WebChannel failures)
  if (pollingService.isInPollingMode()) {
    console.log('🔄 Using polling mode for transactions subscription');
    return pollingService.subscribeToTransactionsPolling(callback, startDate, endDate, 3000);
  }
  
  // Try real-time listeners first
  let q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
  
  if (startDate && endDate) {
    q = query(
      collection(db, 'transactions'),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'desc')
    );
  }
  
  let hasWebChannelError = false;
  
  const unsubscribe = onSnapshot(q, 
    (querySnapshot: QuerySnapshot<DocumentData>) => {
      const transactions: Transaction[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        transactions.push({
          id: doc.id,
          ...data,
          date: data.date.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Transaction);
      });
      
      callback(transactions);
    },
    (error) => {
      console.error('❌ Firestore listener error:', error);
      
      // Handle WebChannel errors by switching to polling mode
      if (isWebChannelError(error)) {
        console.log('🔄 WebChannel error detected, switching to polling mode');
        hasWebChannelError = true;
        
        // Enable polling mode globally
        pollingService.enablePollingMode();
        
        // Unsubscribe from real-time listener
        if (unsubscribe) {
          unsubscribe();
        }
        
        // Start polling fallback
        return pollingService.subscribeToTransactionsPolling(callback, startDate, endDate, 3000);
      } else {
        // Handle other types of errors
        handleFirebaseError(error);
      }
    }
  );
  
  // Return cleanup function that handles both modes
  return () => {
    if (hasWebChannelError) {
      // Already switched to polling, cleanup will be handled by polling service
      return;
    }
    
    if (unsubscribe) {
      unsubscribe();
    }
  };
};