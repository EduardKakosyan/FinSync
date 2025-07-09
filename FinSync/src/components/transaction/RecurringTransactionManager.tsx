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
      `Are you sure you want to delete the recurring transaction \"${transaction.description}\"?`,\n      [\n        { text: 'Cancel', style: 'cancel' },\n        {\n          text: 'Delete',\n          style: 'destructive',\n          onPress: async () => {\n            try {\n              await firebaseTransactionService.delete(transaction.id);\n              await loadRecurringTransactions();\n              Alert.alert('Success', 'Recurring transaction deleted successfully');\n            } catch (error) {\n              console.error('Error deleting recurring transaction:', error);\n              Alert.alert('Error', 'Failed to delete recurring transaction');\n            }\n          },\n        },\n      ]\n    );\n  };\n\n  const formatRecurringInfo = (transaction: any) => {\n    const { isRecurring, recurringInterval, recurringDay, recurringEndDate } = transaction;\n    \n    if (!isRecurring) return null;\n\n    let intervalText = '';\n    switch (recurringInterval) {\n      case 'weekly':\n        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];\n        intervalText = `Every ${days[recurringDay || 0]}`;\n        break;\n      case 'monthly':\n        intervalText = `Monthly on the ${recurringDay || 1}${getOrdinalSuffix(recurringDay || 1)}`;\n        break;\n      case 'yearly':\n        intervalText = 'Yearly on the same date';\n        break;\n    }\n\n    const endText = recurringEndDate ? ` until ${new Date(recurringEndDate).toLocaleDateString()}` : '';\n    return `${intervalText}${endText}`;\n  };\n\n  const getOrdinalSuffix = (day: number) => {\n    if (day >= 11 && day <= 13) return 'th';\n    switch (day % 10) {\n      case 1: return 'st';\n      case 2: return 'nd';\n      case 3: return 'rd';\n      default: return 'th';\n    }\n  };\n\n  if (isLoading) {\n    return (\n      <Card style={{ padding: 20, alignItems: 'center' }}>\n        <Typography variant=\"body2\">Loading recurring transactions...</Typography>\n      </Card>\n    );\n  }\n\n  return (\n    <View>\n      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>\n        <Typography variant=\"h5\" style={{ color: theme.colors.text }}>\n          Recurring Transactions\n        </Typography>\n        <Button\n          variant=\"outline\"\n          onPress={processRecurringTransactions}\n          disabled={isProcessing}\n          loading={isProcessing}\n        >\n          Process Due\n        </Button>\n      </View>\n\n      {recurringTransactions.length === 0 ? (\n        <Card style={{ padding: 20, alignItems: 'center' }}>\n          <Ionicons name=\"repeat-outline\" size={48} color={theme.colors.textSecondary} />\n          <Typography variant=\"body2\" style={{ color: theme.colors.textSecondary, marginTop: 12, textAlign: 'center' }}>\n            No recurring transactions set up yet.\n            Create one to automate your regular income or expenses.\n          </Typography>\n        </Card>\n      ) : (\n        <ScrollView style={{ maxHeight: 400 }}>\n          {recurringTransactions.map((transaction) => {\n            const recurringInfo = formatRecurringInfo(transaction);\n            return (\n              <Card key={transaction.id} style={{ marginBottom: 12 }}>\n                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>\n                  <View style={{ flex: 1 }}>\n                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>\n                      <Typography variant=\"body1\" style={{ color: theme.colors.text, fontWeight: '600' }}>\n                        {transaction.description}\n                      </Typography>\n                      <View style={{\n                        backgroundColor: transaction.type === 'income' ? theme.colors.success : theme.colors.error,\n                        paddingHorizontal: 8,\n                        paddingVertical: 2,\n                        borderRadius: 12,\n                        marginLeft: 8,\n                      }}>\n                        <Typography variant=\"caption\" style={{ color: '#FFFFFF' }}>\n                          {transaction.type.toUpperCase()}\n                        </Typography>\n                      </View>\n                    </View>\n                    \n                    <Typography variant=\"h6\" style={{ \n                      color: transaction.type === 'income' ? theme.colors.success : theme.colors.error,\n                      marginBottom: 4,\n                    }}>\n                      ${transaction.amount.toFixed(2)}\n                    </Typography>\n                    \n                    {recurringInfo && (\n                      <Typography variant=\"body2\" style={{ color: theme.colors.textSecondary }}>\n                        {recurringInfo}\n                      </Typography>\n                    )}\n                  </View>\n                  \n                  <View style={{ flexDirection: 'row', gap: 8 }}>\n                    {onTransactionSelect && (\n                      <TouchableOpacity\n                        style={{\n                          padding: 8,\n                          backgroundColor: theme.colors.primary,\n                          borderRadius: 8,\n                        }}\n                        onPress={() => onTransactionSelect(transaction)}\n                      >\n                        <Ionicons name=\"pencil\" size={16} color=\"#FFFFFF\" />\n                      </TouchableOpacity>\n                    )}\n                    \n                    <TouchableOpacity\n                      style={{\n                        padding: 8,\n                        backgroundColor: theme.colors.error,\n                        borderRadius: 8,\n                      }}\n                      onPress={() => deleteRecurringTransaction(transaction)}\n                    >\n                      <Ionicons name=\"trash\" size={16} color=\"#FFFFFF\" />\n                    </TouchableOpacity>\n                  </View>\n                </View>\n              </Card>\n            );\n          })}\n        </ScrollView>\n      )}\n    </View>\n  );\n};\n\nexport default RecurringTransactionManager;