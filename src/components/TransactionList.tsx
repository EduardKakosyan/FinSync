import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Colors, Typography } from '../constants/colors';
import { Transaction, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../types';

interface TransactionListProps {
  transactions: Transaction[];
  onTransactionPress?: (transaction: Transaction) => void;
}

export default function TransactionList({ transactions, onTransactionPress }: TransactionListProps) {
  const getCategoryDetails = (transaction: Transaction) => {
    const categories = transaction.type === 'expense' 
      ? DEFAULT_EXPENSE_CATEGORIES 
      : DEFAULT_INCOME_CATEGORIES;
    
    return categories.find(cat => cat.id === transaction.category) || {
      name: transaction.category,
      color: Colors.text.secondary,
    };
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const transactionDate = new Date(date);
    
    if (transactionDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (transactionDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return transactionDate.toLocaleDateString('en-CA', {
      month: 'short',
      day: 'numeric',
      year: transactionDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const category = getCategoryDetails(item);
    const isExpense = item.type === 'expense';
    
    return (
      <TouchableOpacity
        style={styles.transactionItem}
        onPress={() => onTransactionPress?.(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
          <Text style={styles.categoryIconText}>
            {category.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionCategory}>{category.name}</Text>
          {item.description ? (
            <Text style={styles.transactionDescription} numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}
          <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
        </View>
        
        <Text style={[
          styles.transactionAmount,
          isExpense ? styles.expenseAmount : styles.incomeAmount
        ]}>
          {isExpense ? '-' : '+'}${item.amount.toFixed(2)}
        </Text>
      </TouchableOpacity>
    );
  };

  const calculateTotal = () => {
    return transactions.reduce((total, transaction) => {
      return transaction.type === 'expense' 
        ? total - transaction.amount 
        : total + transaction.amount;
    }, 0);
  };

  if (transactions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No transactions yet</Text>
        <Text style={styles.emptySubtext}>Add your first transaction to get started</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryLabel}>Net Total</Text>
        <Text style={[
          styles.summaryAmount,
          calculateTotal() >= 0 ? styles.positiveAmount : styles.negativeAmount
        ]}>
          ${Math.abs(calculateTotal()).toFixed(2)}
        </Text>
      </View>
      
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryContainer: {
    backgroundColor: Colors.surface,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: Colors.shadow.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  summaryAmount: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
  },
  positiveAmount: {
    color: Colors.secondary,
  },
  negativeAmount: {
    color: Colors.danger,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIconText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
  },
  transactionDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  transactionDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.light,
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
  },
  expenseAmount: {
    color: Colors.danger,
  },
  incomeAmount: {
    color: Colors.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});