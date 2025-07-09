/**
 * Recurring Transactions Hook
 * Manages automatic processing of recurring transactions
 */

import { useEffect, useState } from 'react';
import { firebaseTransactionService } from '../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_PROCESSED_KEY = 'last_recurring_processed';
const PROCESSING_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export interface UseRecurringTransactionsResult {
  isProcessing: boolean;
  lastProcessed: Date | null;
  processedCount: number;
  error: string | null;
  processManually: () => Promise<void>;
}

export function useRecurringTransactions(): UseRecurringTransactionsResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastProcessed, setLastProcessed] = useState<Date | null>(null);
  const [processedCount, setProcessedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLastProcessedDate();
    checkAndProcessRecurringTransactions();
  }, []);

  const loadLastProcessedDate = async () => {
    try {
      const lastProcessedString = await AsyncStorage.getItem(LAST_PROCESSED_KEY);
      if (lastProcessedString) {
        setLastProcessed(new Date(lastProcessedString));
      }
    } catch (error) {
      console.error('Error loading last processed date:', error);
    }
  };

  const saveLastProcessedDate = async (date: Date) => {
    try {
      await AsyncStorage.setItem(LAST_PROCESSED_KEY, date.toISOString());
      setLastProcessed(date);
    } catch (error) {
      console.error('Error saving last processed date:', error);
    }
  };

  const shouldProcessRecurring = (lastProcessed: Date | null): boolean => {
    if (!lastProcessed) return true;
    
    const now = new Date();
    const timeSinceLastProcess = now.getTime() - lastProcessed.getTime();
    
    return timeSinceLastProcess >= PROCESSING_INTERVAL;
  };

  const processRecurringTransactions = async (): Promise<number> => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const count = await firebaseTransactionService.processRecurringTransactions();
      setProcessedCount(count);
      
      const now = new Date();
      await saveLastProcessedDate(now);
      
      if (count > 0) {
        console.log(`Processed ${count} recurring transactions`);
      }
      
      return count;
    } catch (error) {
      console.error('Error processing recurring transactions:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      return 0;
    } finally {
      setIsProcessing(false);
    }
  };

  const checkAndProcessRecurringTransactions = async () => {
    try {
      if (shouldProcessRecurring(lastProcessed)) {
        await processRecurringTransactions();
      }
    } catch (error) {
      // Don't let recurring transaction errors block app startup
      console.warn('Recurring transaction check failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to check recurring transactions');
    }
  };

  const processManually = async () => {
    await processRecurringTransactions();
  };

  return {
    isProcessing,
    lastProcessed,
    processedCount,
    error,
    processManually,
  };
}

export default useRecurringTransactions;