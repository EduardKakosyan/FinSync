import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { COLORS, SPACING, FONTS } from '@/constants';
import { Transaction, Category, TransactionStackParamList } from '@/types';
import { DetailedTransactionItem } from '@/components/transaction/TransactionItem';

type TransactionListScreenNavigationProp = StackNavigationProp<
  TransactionStackParamList,
  'TransactionList'
>;

const TransactionListScreen = () => {
  const navigation = useNavigation<TransactionListScreenNavigationProp>();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchQuery, selectedPeriod]);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Mock data - replace with actual API calls
      const mockTransactions: Transaction[] = [
        {
          id: 'trans-1',
          amount: 4.50,
          date: new Date(),
          category: 'Food & Dining',
          description: 'Coffee Shop',
          type: 'expense',
          accountId: 'acc-1',
          receiptId: 'receipt-1',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'trans-2',
          amount: 3500.00,
          date: new Date(Date.now() - 86400000),
          category: 'Salary',
          description: 'Monthly Salary',
          type: 'income',
          accountId: 'acc-1',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'trans-3',
          amount: 45.20,
          date: new Date(Date.now() - 172800000),
          category: 'Transportation',
          description: 'Gas Station',
          type: 'expense',
          accountId: 'acc-1',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'trans-4',
          amount: 125.00,
          date: new Date(Date.now() - 259200000),
          category: 'Shopping',
          description: 'Online Purchase',
          type: 'expense',
          accountId: 'acc-1',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'trans-5',
          amount: 85.75,
          date: new Date(Date.now() - 345600000),
          category: 'Food & Dining',
          description: 'Restaurant Dinner',
          type: 'expense',
          accountId: 'acc-1',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockCategories: Category[] = [
        {
          id: 'cat-1',
          name: 'Food & Dining',
          color: '#FF6B6B',
          type: 'expense',
          createdAt: new Date()
        },
        {
          id: 'cat-2',
          name: 'Transportation',
          color: '#4ECDC4',
          type: 'expense',
          createdAt: new Date()
        },
        {
          id: 'cat-3',
          name: 'Shopping',
          color: '#45B7D1',
          type: 'expense',
          createdAt: new Date()
        },
        {
          id: 'cat-4',
          name: 'Salary',
          color: '#58D68D',
          type: 'income',
          createdAt: new Date()
        }
      ];

      setTransactions(mockTransactions);
      setCategories(mockCategories);
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError('Failed to load transactions');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(query) ||
        transaction.category.toLowerCase().includes(query)
      );
    }

    // Filter by time period
    if (selectedPeriod !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (selectedPeriod) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(transaction => transaction.date >= cutoffDate);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => b.date.getTime() - a.date.getTime());

    setFilteredTransactions(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const handleTransactionPress = (transaction: Transaction) => {
    navigation.navigate('TransactionDetails', {
      transactionId: transaction.id,
      mode: 'view'
    });
  };

  const handleEditTransaction = (transaction: Transaction) => {
    navigation.navigate('EditTransaction', {
      transactionId: transaction.id
    });
  };

  const handleDeleteTransaction = async (transaction: Transaction) => {
    try {
      // Mock deletion - replace with actual API call
      console.log('Deleting transaction:', transaction.id);
      
      // Remove from local state
      setTransactions(prev => prev.filter(t => t.id !== transaction.id));
      
      Alert.alert('Success', 'Transaction deleted successfully');
    } catch (err) {
      console.error('Error deleting transaction:', err);
      Alert.alert('Error', 'Failed to delete transaction');
    }
  };

  const getCategoryForTransaction = (transaction: Transaction): Category | undefined => {
    return categories.find(cat => cat.name === transaction.category);
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <DetailedTransactionItem
      transaction={item}
      category={getCategoryForTransaction(item)}
      onPress={handleTransactionPress}
      onEdit={handleEditTransaction}
      onDelete={handleDeleteTransaction}
      onReceiptPress={(receiptId) => {
        // Navigate to receipt details
        console.log('Navigate to receipt:', receiptId);
      }}
    />
  );

  const PeriodSelector = () => (
    <View style={styles.periodSelector}>
      {(['all', 'week', 'month', 'year'] as const).map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text style={[
            styles.periodButtonText,
            selectedPeriod === period && styles.periodButtonTextActive
          ]}>
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search and Filter Header */}
      <View style={styles.headerContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.TEXT_SECONDARY} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor={COLORS.TEXT_SECONDARY}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.TEXT_SECONDARY} />
            </TouchableOpacity>
          )}
        </View>
        
        <PeriodSelector />
      </View>

      {/* Transaction List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransactionItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name='receipt-outline'
              size={64}
              color={COLORS.TEXT_SECONDARY}
            />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No matching transactions' : 'No transactions yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery 
                ? 'Try adjusting your search or time period'
                : 'Add your first transaction to get started'
              }
            </Text>
            {searchQuery && (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.clearSearchText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ListHeaderComponent={
          filteredTransactions.length > 0 ? (
            <View style={styles.listHeader}>
              <Text style={styles.resultCount}>
                {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
                {searchQuery && ` matching "${searchQuery}"`}
              </Text>
            </View>
          ) : null
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddTransaction', {
          transactionType: 'expense'
        })}
      >
        <Ionicons name='add' size={24} color='white' />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.XL,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
    marginTop: SPACING.MD,
  },
  headerContainer: {
    backgroundColor: COLORS.SURFACE,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 12,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    marginBottom: SPACING.SM,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.REGULAR,
    marginLeft: SPACING.SM,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 12,
    padding: SPACING.XS,
  },
  periodButton: {
    flex: 1,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.SM,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.SEMIBOLD,
  },
  periodButtonTextActive: {
    color: 'white',
  },
  listContainer: {
    paddingBottom: 100, // Space for FAB
  },
  listHeader: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  resultCount: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.XXL,
    paddingHorizontal: SPACING.MD,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.MD,
    fontFamily: FONTS.SEMIBOLD,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.XS,
    textAlign: 'center',
    fontFamily: FONTS.REGULAR,
    lineHeight: 20,
  },
  clearSearchButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.SM,
    borderRadius: 8,
    marginTop: SPACING.MD,
  },
  clearSearchText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    fontFamily: FONTS.SEMIBOLD,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.LG,
    right: SPACING.LG,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default TransactionListScreen;