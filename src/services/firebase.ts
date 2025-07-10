import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
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
  updateDoc
} from 'firebase/firestore';
import { Transaction } from '../types';
import { firebaseConfig } from '../config/env';

let app: any;
let db: any;

export const initializeFirebase = async () => {
  try {
    if (!app) {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
    }
    
    return { app, db };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
};

// Transaction CRUD operations
export const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
  if (!db) await initializeFirebase();
  
  try {
    const docRef = await addDoc(collection(db, 'transactions'), {
      ...transaction,
      date: Timestamp.fromDate(transaction.date),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
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
  
  let q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
  
  if (startDate && endDate) {
    q = query(
      collection(db, 'transactions'),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'desc')
    );
  }
  
  return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
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
  });
};