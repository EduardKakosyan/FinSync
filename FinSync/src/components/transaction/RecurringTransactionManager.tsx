/**
 * Recurring Transaction Manager Component
 * Displays and manages existing recurring transactions
 */

import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Card, Button, Typography } from '../../design-system';
import { useTheme } from '../../design-system/ThemeProvider';
import { Transaction } from '../../types';
import { firebaseTransactionService } from '../../services/firebase';
import { Ionicons } from '@expo/vector-icons';

interface RecurringTransactionManagerProps {
  onTransactionSelect?: (transaction: Transaction) => void;
}

export const RecurringTransactionManager: React.FC<RecurringTransactionManagerProps> = ({
  onTransactionSelect,
}) => {
  const theme = useTheme();
  const [recurringTransactions, setRecurringTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadRecurringTransactions();
  }, []);

  const loadRecurringTransactions = async () => {
    try {
      setIsLoading(true);
      const transactions = await firebaseTransactionService.getRecurringTransactions();
      setRecurringTransactions(transactions);
    } catch (error) {
      console.error('Error loading recurring transactions:', error);
      Alert.alert('Error', 'Failed to load recurring transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const processRecurringTransactions = async () => {
    try {
      setIsProcessing(true);
      const processedCount = await firebaseTransactionService.processRecurringTransactions();
      
      if (processedCount > 0) {
        Alert.alert(
          'Success',
          `Processed ${processedCount} recurring transaction${processedCount > 1 ? 's' : ''}`,
          [{ text: 'OK', onPress: loadRecurringTransactions }]
        );
      } else {
        Alert.alert('Info', 'No recurring transactions were due for processing');
      }
    } catch (error) {
      console.error('Error processing recurring transactions:', error);
      Alert.alert('Error', 'Failed to process recurring transactions');
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteRecurringTransaction = async (transaction: Transaction) => {
    Alert.alert(
      'Delete Recurring Transaction',
      `Are you sure you want to delete the recurring transaction "${transaction.description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await firebaseTransactionService.delete(transaction.id);
              await loadRecurringTransactions();
              Alert.alert('Success', 'Recurring transaction deleted successfully');
            } catch (error) {
              console.error('Error deleting recurring transaction:', error);
              Alert.alert('Error', 'Failed to delete recurring transaction');
            }
          },
        },
      ]
    );
  };

  const formatRecurringInfo = (transaction: any) => {
    const { isRecurring, recurringInterval, recurringDay, recurringEndDate } = transaction;
    
    if (!isRecurring) return null;

    let intervalText = '';
    switch (recurringInterval) {
      case 'weekly':
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        intervalText = `Every ${days[recurringDay || 0]}`;
        break;
      case 'monthly':
        intervalText = `Monthly on the ${recurringDay || 1}${getOrdinalSuffix(recurringDay || 1)}`;
        break;
      case 'yearly':
        intervalText = 'Yearly on the same date';
        break;
    }

    const endText = recurringEndDate ? ` until ${new Date(recurringEndDate).toLocaleDateString()}` : '';
    return `${intervalText}${endText}`;
  };

  const getOrdinalSuffix = (day: number) => {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  if (isLoading) {
    return (
      <Card style={{ padding: 20, alignItems: 'center' }}>
        <Typography variant="body2">Loading recurring transactions...</Typography>
      </Card>
    );
  }

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography variant="h5" style={{ color: theme.colors.text }}>
          Recurring Transactions
        </Typography>
        <Button
          variant="outline"
          onPress={processRecurringTransactions}
          disabled={isProcessing}
          loading={isProcessing}
        >
          Process Due
        </Button>
      </View>

      {recurringTransactions.length === 0 ? (
        <Card style={{ padding: 20, alignItems: 'center' }}>
          <Ionicons name="repeat-outline" size={48} color={theme.colors.textSecondary} />
          <Typography variant="body2" style={{ color: theme.colors.textSecondary, marginTop: 12, textAlign: 'center' }}>
            No recurring transactions set up yet.
            Create one to automate your regular income or expenses.
          </Typography>
        </Card>
      ) : (
        <ScrollView style={{ maxHeight: 400 }}>
          {recurringTransactions.map((transaction) => {
            const recurringInfo = formatRecurringInfo(transaction);
            return (
              <Card key={transaction.id} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Typography variant="body1" style={{ color: theme.colors.text, fontWeight: '600' }}>
                        {transaction.description}
                      </Typography>
                      <View style={{
                        backgroundColor: transaction.type === 'income' ? theme.colors.success : theme.colors.error,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 12,
                        marginLeft: 8,
                      }}>
                        <Typography variant="caption" style={{ color: '#FFFFFF' }}>
                          {transaction.type.toUpperCase()}
                        </Typography>
                      </View>
                    </View>
                    
                    <Typography variant="h6" style={{ 
                      color: transaction.type === 'income' ? theme.colors.success : theme.colors.error,
                      marginBottom: 4,
                    }}>
                      ${transaction.amount.toFixed(2)}
                    </Typography>
                    
                    {recurringInfo && (
                      <Typography variant="body2" style={{ color: theme.colors.textSecondary }}>
                        {recurringInfo}
                      </Typography>
                    )}
                  </View>
                  
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {onTransactionSelect && (
                      <TouchableOpacity
                        style={{
                          padding: 8,
                          backgroundColor: theme.colors.primary,
                          borderRadius: 8,
                        }}
                        onPress={() => onTransactionSelect(transaction)}
                      >
                        <Ionicons name="pencil" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity
                      style={{
                        padding: 8,
                        backgroundColor: theme.colors.error,
                        borderRadius: 8,
                      }}
                      onPress={() => deleteRecurringTransaction(transaction)}
                    >
                      <Ionicons name="trash" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

export default RecurringTransactionManager;