import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useColors, useTokens, Typography, Card, Button, Heading1, BodyText, Caption } from '../../src/design-system';
import { Transaction } from '../../src/types';
import { enhancedTransactionService } from '../../src/services/EnhancedTransactionService';
import { formatCurrency } from '../../src/utils/currencyUtils';

const TransactionsScreen = () => {
  const colors = useColors();
  const tokens = useTokens();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Configure enhanced service to use real Firebase data
    enhancedTransactionService.updateConfiguration({
      useMockData: false,
      autoFormat: true,
      enableCaching: true,
    });
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      console.log('🔍 Loading transactions...');
      const response = await enhancedTransactionService.getTransactions(
        { type: 'month' },
        true
      );
      
      console.log('📊 Transaction response:', response);
      
      if (response.success && response.data) {
        console.log('✅ Found transactions:', response.data.length);
        console.log('💾 First transaction:', response.data[0]);
        setTransactions(response.data);
      } else {
        console.log('❌ No transactions found or error:', response.error);
      }
    } catch (error) {
      console.error('💥 Failed to load transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const handleAddTransaction = () => {
    router.push('/(tabs)/add-transaction');
  };

  const TransactionItem = ({ item }: { item: Transaction & { formatted?: any } }) => (
    <Card variant="default" style={{ marginBottom: tokens.Spacing.sm }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: tokens.Spacing.md
      }}>
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.surfaceElevated,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: tokens.Spacing.md
        }}>
          <Ionicons
            name={item.type === 'income' ? 'add-circle' : 'remove-circle'}
            size={24}
            color={item.type === 'income' ? colors.success : colors.error}
          />
        </View>
        
        <View style={{ flex: 1 }}>
          <Typography variant="body" style={{ fontWeight: '600', marginBottom: 2 }}>
            {item.description}
          </Typography>
          <Caption color="secondary">
            {item.category} • {item.formatted?.date || new Date(item.date).toLocaleDateString()}
          </Caption>
        </View>
        
        <Typography variant="amount" style={{
          color: item.type === 'income' ? colors.success : colors.error
        }}>
          {typeof item.formatted?.amount === 'string' 
            ? item.formatted.amount 
            : item.formatted?.amount?.formatted || formatCurrency(Math.abs(item.amount), 'CAD')}
        </Typography>
      </View>
    </Card>
  );

  const EmptyState = () => (
    <View style={{
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: tokens.Spacing.xxxl
    }}>
      <Ionicons name="wallet-outline" size={64} color={colors.textSecondary} />
      <Typography variant="h3" style={{ marginTop: tokens.Spacing.md, marginBottom: tokens.Spacing.sm }}>
        No transactions yet
      </Typography>
      <BodyText color="secondary" align="center" style={{
        paddingHorizontal: tokens.Spacing.lg,
        marginBottom: tokens.Spacing.lg
      }}>
        Start tracking your finances by adding your first transaction
      </BodyText>
      <Button
        variant="primary"
        size="large"
        leftIcon={<Ionicons name="add" size={20} color={colors.textInverse} />}
        onPress={handleAddTransaction}
      >
        Add Transaction
      </Button>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: tokens.Spacing.lg,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
      }}>
        <Heading1>Transactions</Heading1>
        <TouchableOpacity 
          style={{ padding: tokens.Spacing.sm, borderRadius: 8 }} 
          onPress={handleAddTransaction}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={TransactionItem}
        contentContainerStyle={{
          padding: tokens.Spacing.lg,
          flexGrow: 1
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={!loading ? EmptyState : null}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

// Styles removed - using design system components

export default TransactionsScreen;