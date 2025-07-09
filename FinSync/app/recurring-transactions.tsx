/**
 * Recurring Transactions Screen
 * Displays and manages recurring transactions
 */

import React from 'react';
import { SafeAreaView, ScrollView, View, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useTokens, Typography, Stack } from '../src/design-system';
import { RecurringTransactionManager } from '../src/components/transaction/RecurringTransactionManager';
import { useRecurringTransactions } from '../src/hooks/useRecurringTransactions';

export default function RecurringTransactionsScreen() {
  const colors = useColors();
  const tokens = useTokens();
  const { isProcessing, lastProcessed, processedCount, error, processManually } = useRecurringTransactions();

  const handleTransactionSelect = (transaction: any) => {
    // Navigate to edit transaction screen
    router.push({
      pathname: '/advanced-add-transaction',
      params: {
        editMode: 'true',
        transactionId: transaction.id,
        prefillData: JSON.stringify({
          amount: transaction.amount,
          description: transaction.description,
          category: transaction.category,
          type: transaction.type,
          date: transaction.date,
          notes: transaction.notes,
        }),
      },
    });
  };

  const createNewRecurringTransaction = () => {
    router.push({
      pathname: '/advanced-add-transaction',
      params: {
        recurring: 'true',
      },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: tokens.Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name=\"arrow-back\" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Typography variant=\"h4\" style={{ marginLeft: tokens.Spacing.sm }}>
            Recurring Transactions
          </Typography>
        </View>
        
        <TouchableOpacity onPress={createNewRecurringTransaction}>
          <Ionicons name=\"add\" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <Stack spacing=\"lg\" style={{ padding: tokens.Spacing.lg }}>
          {/* Status Information */}
          <View style={{
            backgroundColor: colors.surface,
            padding: tokens.Spacing.md,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant=\"body2\" style={{ color: colors.textSecondary }}>
                Last processed: {lastProcessed ? lastProcessed.toLocaleString() : 'Never'}
              </Typography>
              <TouchableOpacity
                onPress={processManually}
                disabled={isProcessing}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: isProcessing ? colors.border : colors.primary,
                  borderRadius: 8,
                }}
              >
                <Typography variant=\"caption\" style={{ color: '#FFFFFF' }}>
                  {isProcessing ? 'Processing...' : 'Process Now'}
                </Typography>
              </TouchableOpacity>
            </View>
            
            {processedCount > 0 && (
              <Typography variant=\"body2\" style={{ color: colors.success, marginTop: 4 }}>
                {processedCount} transaction{processedCount > 1 ? 's' : ''} processed today
              </Typography>
            )}
            
            {error && (
              <Typography variant=\"body2\" style={{ color: colors.error, marginTop: 4 }}>
                Error: {error}
              </Typography>
            )}
          </View>

          {/* Recurring Transactions Manager */}
          <RecurringTransactionManager onTransactionSelect={handleTransactionSelect} />
        </Stack>
      </ScrollView>
    </SafeAreaView>
  );
}