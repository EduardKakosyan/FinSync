import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';
import { Transaction } from '../types';

// Polling-only fallback service for when WebChannel fails
export class FirebasePollingService {
  private db: any;
  private activeSubscriptions: Map<string, NodeJS.Timer> = new Map();
  private isPollingMode = false;

  constructor(db: any) {
    this.db = db;
  }

  enablePollingMode() {
    this.isPollingMode = true;
    console.log('🔄 Firebase switched to polling-only mode (WebChannel disabled)');
  }

  disablePollingMode() {
    this.isPollingMode = false;
    console.log('⚡ Firebase switched back to real-time mode');
  }

  isInPollingMode(): boolean {
    return this.isPollingMode;
  }

  subscribeToTransactionsPolling(
    callback: (transactions: Transaction[]) => void,
    startDate?: Date,
    endDate?: Date,
    pollInterval: number = 3000
  ): () => void {
    if (!this.db) {
      console.error('❌ Database not initialized for polling');
      return () => {};
    }

    const subscriptionId = `transactions_${Date.now()}_${Math.random()}`;
    let isActive = true;
    let lastFetch = 0;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 5;

    const fetchTransactions = async () => {
      if (!isActive) return;

      const now = Date.now();
      if (now - lastFetch < pollInterval) return;

      try {
        let q = query(collection(this.db, 'transactions'), orderBy('date', 'desc'));
        
        if (startDate && endDate) {
          q = query(
            collection(this.db, 'transactions'),
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

        callback(transactions);
        lastFetch = now;
        consecutiveErrors = 0; // Reset error count on success
        
      } catch (error) {
        consecutiveErrors++;
        console.error(`❌ Polling error (${consecutiveErrors}/${maxConsecutiveErrors}):`, error);
        
        if (consecutiveErrors >= maxConsecutiveErrors) {
          console.error('❌ Max consecutive polling errors reached, stopping subscription');
          isActive = false;
          this.cleanup(subscriptionId);
          return;
        }
        
        // Exponential backoff on errors
        const backoffDelay = Math.min(pollInterval * Math.pow(2, consecutiveErrors), 30000);
        setTimeout(fetchTransactions, backoffDelay);
        return;
      }

      // Schedule next poll
      if (isActive) {
        const nextPoll = setTimeout(fetchTransactions, pollInterval);
        this.activeSubscriptions.set(subscriptionId, nextPoll);
      }
    };

    // Start polling immediately
    fetchTransactions();

    // Return cleanup function
    return () => {
      isActive = false;
      this.cleanup(subscriptionId);
    };
  }

  private cleanup(subscriptionId: string) {
    const timer = this.activeSubscriptions.get(subscriptionId);
    if (timer) {
      clearTimeout(timer);
      this.activeSubscriptions.delete(subscriptionId);
    }
  }

  cleanupAll() {
    this.activeSubscriptions.forEach((timer) => clearTimeout(timer));
    this.activeSubscriptions.clear();
    console.log('🧹 All polling subscriptions cleaned up');
  }

  getActiveSubscriptionCount(): number {
    return this.activeSubscriptions.size;
  }
}

// Singleton instance
let pollingService: FirebasePollingService | null = null;

export const getPollingService = (db: any): FirebasePollingService => {
  if (!pollingService) {
    pollingService = new FirebasePollingService(db);
  }
  return pollingService;
};

export const cleanupPollingService = () => {
  if (pollingService) {
    pollingService.cleanupAll();
    pollingService = null;
  }
};