import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { COLORS, SPACING, FONTS } from '@/constants';
import { CategorySpending, SpendingData, Transaction, HomeStackParamList } from '@/types';
import { formatCurrency } from '@/utils/currencyUtils';
import { TotalSpendingCard, TotalIncomeCard, NetIncomeCard } from '@/components/transaction/SpendingCard';
import { TopCategoriesBreakdown } from '@/components/transaction/CategoryBreakdown';
import { CompactTransactionItem } from '@/components/transaction/TransactionItem';

type HomeScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'Home'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [spendingData, setSpendingData] = useState<SpendingData | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategorySpending[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setError(null);
      setIsLoading(true);

      // Mock data - replace with actual API calls
      const mockSpendingData: SpendingData = {
        totalIncome: 5000.00,
        totalExpenses: 2750.50,
        netIncome: 2249.50,
        categoryBreakdown: [],
        monthlyTrend: [],
        dailyAverage: 91.68,
        topCategories: [],
        period: {
          startDate: new Date(2024, 0, 1),
          endDate: new Date(),
          period: 'month'
        }
      };

      const mockCategoryBreakdown: CategorySpending[] = [
        {
          categoryId: 'cat-1',
          categoryName: 'Food & Dining',
          categoryColor: '#FF6B6B',
          amount: 850.00,
          percentage: 30.9,
          transactionCount: 24,
          trend: 'up',
          budgetLimit: 1000.00,
          budgetUsed: 850.00,
          previousPeriodAmount: 720.00
        },
        {
          categoryId: 'cat-2',
          categoryName: 'Transportation',
          categoryColor: '#4ECDC4',
          amount: 420.00,
          percentage: 15.3,
          transactionCount: 8,
          trend: 'stable',
          budgetLimit: 500.00,
          budgetUsed: 420.00,
          previousPeriodAmount: 415.00
        },
        {
          categoryId: 'cat-3',
          categoryName: 'Shopping',
          categoryColor: '#45B7D1',
          amount: 680.50,
          percentage: 24.7,
          transactionCount: 12,
          trend: 'down',
          previousPeriodAmount: 780.50
        },
        {
          categoryId: 'cat-4',
          categoryName: 'Entertainment',
          categoryColor: '#96CEB4',
          amount: 320.00,
          percentage: 11.6,
          transactionCount: 6,
          trend: 'up',
          previousPeriodAmount: 250.00
        },
        {
          categoryId: 'cat-5',
          categoryName: 'Bills & Utilities',
          categoryColor: '#FFEAA7',
          amount: 480.00,
          percentage: 17.5,
          transactionCount: 4,
          trend: 'stable',
          budgetLimit: 550.00,
          budgetUsed: 480.00,
          previousPeriodAmount: 485.00
        }
      ];

      const mockRecentTransactions: Transaction[] = [
        {
          id: 'trans-1',
          amount: 4.50,
          date: new Date(),
          category: 'Food & Dining',
          description: 'Coffee Shop',
          type: 'expense',
          accountId: 'acc-1',
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
        }
      ];

      setSpendingData(mockSpendingData);
      setCategoryBreakdown(mockCategoryBreakdown);
      setRecentTransactions(mockRecentTransactions);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleTransactionPress = (transaction: Transaction) => {
    navigation.navigate('TransactionDetails', { 
      transactionId: transaction.id,
      mode: 'view'
    });
  };

  const handleCategoryPress = (category: CategorySpending) => {
    navigation.navigate('CategoryDetails', {
      categoryId: category.categoryId,
      period: spendingData?.period
    });
  };

  const QuickActionCard = ({
    title,
    icon,
    onPress,
    color,
  }: {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    color: string;
  }) => (
    <TouchableOpacity
      style={[styles.quickActionCard, { borderColor: color }]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={32} color={color} />
      <Text style={[styles.quickActionTitle, { color }]}>{title}</Text>
    </TouchableOpacity>
  );

  const BalanceCard = () => (
    <View style={styles.balanceCard}>
      <Text style={styles.balanceLabel}>Total Balance</Text>
      <Text style={styles.balanceAmount}>
        {spendingData ? formatCurrency(spendingData.netIncome, 'CAD') : '$0.00'}
      </Text>
      <Text style={styles.balanceSubtext}>CAD</Text>
      {spendingData && (
        <Text style={styles.balanceChange}>
          Net income this month
        </Text>
      )}
    </View>
  );


  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning!</Text>
          <Text style={styles.subtitle}>Welcome to FinSync</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings' as never)}
        >
          <Ionicons
            name='settings-outline'
            size={24}
            color={COLORS.TEXT_PRIMARY}
          />
        </TouchableOpacity>
      </View>

      <BalanceCard />

      {/* Spending Overview Cards */}
      {spendingData && (
        <View style={styles.spendingCardsContainer}>
          <TotalSpendingCard
            amount={spendingData.totalExpenses}
            change={{
              amount: -150.00,
              percentage: -5.2,
              period: 'vs last month'
            }}
            onPress={() => navigation.navigate('TransactionTab' as never)}
          />
          <TotalIncomeCard
            amount={spendingData.totalIncome}
            change={{
              amount: 200.00,
              percentage: 4.2,
              period: 'vs last month'
            }}
            onPress={() => navigation.navigate('TransactionTab' as never)}
          />
          <NetIncomeCard
            amount={spendingData.netIncome}
            change={{
              amount: 350.00,
              percentage: 18.4,
              period: 'vs last month'
            }}
            onPress={() => navigation.navigate('TransactionTab' as never)}
          />
        </View>
      )}

      {/* Category Breakdown */}
      <View style={styles.categorySection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Categories</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AnalyticsTab' as never)}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <TopCategoriesBreakdown
          categories={categoryBreakdown}
          isLoading={isLoading}
          onCategoryPress={handleCategoryPress}
        />
      </View>

      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <QuickActionCard
            title='Add Transaction'
            icon='add-circle-outline'
            color={COLORS.PRIMARY}
            onPress={() => navigation.navigate('AddTransaction' as never, { 
              transactionType: 'expense'
            })}
          />
          <QuickActionCard
            title='Add Income'
            icon='add-circle-outline'
            color={COLORS.SUCCESS}
            onPress={() => navigation.navigate('AddTransaction' as never, { 
              transactionType: 'income'
            })}
          />
          <QuickActionCard
            title='Scan Receipt'
            icon='camera-outline'
            color={COLORS.WARNING}
            onPress={() => navigation.navigate('ReceiptTab' as never)}
          />
          <QuickActionCard
            title='View Analytics'
            icon='stats-chart-outline'
            color={COLORS.INFO}
            onPress={() => navigation.navigate('AnalyticsTab' as never)}
          />
        </View>
      </View>

      <View style={styles.recentTransactionsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('TransactionTab' as never)}
          >
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.transactionsList}>
          {recentTransactions.map((transaction) => (
            <CompactTransactionItem
              key={transaction.id}
              transaction={transaction}
              onPress={handleTransactionPress}
            />
          ))}
          {recentTransactions.length === 0 && !isLoading && (
            <View style={styles.emptyTransactions}>
              <Ionicons 
                name='receipt-outline' 
                size={32} 
                color={COLORS.TEXT_SECONDARY} 
              />
              <Text style={styles.emptyTransactionsText}>
                No recent transactions
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.MD,
    paddingBottom: SPACING.SM,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.BOLD,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
  },
  settingsButton: {
    padding: SPACING.SM,
  },
  balanceCard: {
    backgroundColor: COLORS.PRIMARY,
    marginHorizontal: SPACING.MD,
    marginVertical: SPACING.SM,
    padding: SPACING.LG,
    borderRadius: 16,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: FONTS.REGULAR,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginVertical: SPACING.XS,
    fontFamily: FONTS.BOLD,
  },
  balanceSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: FONTS.REGULAR,
  },
  balanceChange: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: FONTS.REGULAR,
    marginTop: SPACING.XS,
  },
  spendingCardsContainer: {
    paddingHorizontal: SPACING.MD,
    marginVertical: SPACING.SM,
  },
  categorySection: {
    marginTop: SPACING.MD,
    marginBottom: SPACING.MD,
  },
  emptyTransactions: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.XL,
  },
  emptyTransactionsText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
    marginTop: SPACING.SM,
  },
  quickActionsContainer: {
    paddingHorizontal: SPACING.MD,
    marginVertical: SPACING.MD,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
    fontFamily: FONTS.BOLD,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: COLORS.SURFACE,
    padding: SPACING.MD,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: SPACING.SM,
    borderWidth: 1,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: SPACING.SM,
    textAlign: 'center',
    fontFamily: FONTS.SEMIBOLD,
  },
  recentTransactionsContainer: {
    paddingHorizontal: SPACING.MD,
    marginBottom: SPACING.XL,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  seeAllText: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    fontFamily: FONTS.MEDIUM,
  },
  transactionsList: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: SPACING.SM,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
  },
  transactionCategory: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
    fontFamily: FONTS.REGULAR,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: FONTS.BOLD,
  },
});

export default HomeScreen;
