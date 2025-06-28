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

import { COLORS, SPACING, FONTS } from '../../src/constants';
import { Transaction } from '../../src/types';
import { enhancedTransactionService } from '../../src/services/EnhancedTransactionService';
import { formatCurrency } from '../../src/utils/currencyUtils';

const TransactionsScreen = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const response = await enhancedTransactionService.getTransactions(
        { type: 'month' },
        true
      );
      
      if (response.success && response.data) {
        setTransactions(response.data);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
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
    <TouchableOpacity style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <Ionicons
          name={item.type === 'income' ? 'add-circle' : 'remove-circle'}
          size={24}
          color={item.type === 'income' ? COLORS.SUCCESS : COLORS.DANGER}
        />
      </View>
      
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionDescription}>{item.description}</Text>
        <Text style={styles.transactionDetails}>
          {item.category} • {item.formatted?.date || new Date(item.date).toLocaleDateString()}
        </Text>
      </View>
      
      <Text style={[
        styles.transactionAmount,
        { color: item.type === 'income' ? COLORS.SUCCESS : COLORS.DANGER }
      ]}>
        {item.formatted?.amount || formatCurrency(Math.abs(item.amount), 'CAD')}
      </Text>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="wallet-outline" size={64} color={COLORS.TEXT_SECONDARY} />
      <Text style={styles.emptyTitle}>No transactions yet</Text>
      <Text style={styles.emptySubtitle}>
        Start tracking your finances by adding your first transaction
      </Text>
      <TouchableOpacity style={styles.addButton} onPress={handleAddTransaction}>
        <Ionicons name="add" size={20} color="white" />
        <Text style={styles.addButtonText}>Add Transaction</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleAddTransaction}>
          <Ionicons name="add" size={24} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={TransactionItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={!loading ? EmptyState : null}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.BOLD,
  },
  headerButton: {
    padding: SPACING.SM,
    borderRadius: 8,
  },
  listContainer: {
    padding: SPACING.MD,
    flexGrow: 1,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    padding: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.MD,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
  },
  transactionDetails: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: FONTS.BOLD,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.XXL,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.BOLD,
    marginTop: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
    textAlign: 'center',
    paddingHorizontal: SPACING.LG,
    marginBottom: SPACING.LG,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderRadius: 12,
    gap: SPACING.SM,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: FONTS.SEMIBOLD,
  },
});

export default TransactionsScreen;