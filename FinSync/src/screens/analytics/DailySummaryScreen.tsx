import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { COLORS, SPACING, FONTS } from '@/constants';
import { formatCurrency } from '@/utils/currencyUtils';
import { dailyFinancialSummaryService, PersonalizedSummary } from '@/services/DailyFinancialSummaryService';

const DailySummaryScreen = () => {
  const navigation = useNavigation();
  const [summary, setSummary] = useState<PersonalizedSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDailySummary();
  }, []);

  const loadDailySummary = async () => {
    try {
      setLoading(true);
      const summaryData = await dailyFinancialSummaryService.generateDailySummary();
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading daily summary:', error);
      Alert.alert('Error', 'Failed to load daily summary');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDailySummary();
    setRefreshing(false);
  };

  const renderPortfolioSnapshot = () => {
    if (!summary) return null;

    const { portfolioSnapshot } = summary;
    const isPositive = portfolioSnapshot.dayChange >= 0;

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Portfolio Snapshot</Text>
        <Text style={styles.portfolioValue}>
          {formatCurrency(portfolioSnapshot.totalValue)}
        </Text>
        
        <View style={styles.changeRow}>
          <Ionicons
            name={isPositive ? 'trending-up' : 'trending-down'}
            size={16}
            color={isPositive ? COLORS.SUCCESS : COLORS.ERROR}
          />
          <Text style={[
            styles.changeText,
            { color: isPositive ? COLORS.SUCCESS : COLORS.ERROR }
          ]}>
            {formatCurrency(Math.abs(portfolioSnapshot.dayChange))}
          </Text>
          <Text style={[
            styles.changePercent,
            { color: isPositive ? COLORS.SUCCESS : COLORS.ERROR }
          ]}>
            ({portfolioSnapshot.dayChangePercent >= 0 ? '+' : ''}{portfolioSnapshot.dayChangePercent.toFixed(2)}%)
          </Text>
        </View>

        {portfolioSnapshot.topMover && (
          <View style={styles.topMoverContainer}>
            <Text style={styles.topMoverLabel}>Top Mover:</Text>
            <Text style={styles.topMoverText}>
              {portfolioSnapshot.topMover.symbol} ({portfolioSnapshot.topMover.changePercent >= 0 ? '+' : ''}{portfolioSnapshot.topMover.changePercent.toFixed(2)}%)
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderSpendingSummary = () => {
    if (!summary) return null;

    const { recentTransactions } = summary;

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Spending (7 days)</Text>
        
        <View style={styles.spendingGrid}>
          <View style={styles.spendingItem}>
            <Text style={styles.spendingValue}>{recentTransactions.count}</Text>
            <Text style={styles.spendingLabel}>Transactions</Text>
          </View>
          <View style={styles.spendingItem}>
            <Text style={styles.spendingValue}>{formatCurrency(recentTransactions.totalSpent)}</Text>
            <Text style={styles.spendingLabel}>Total Spent</Text>
          </View>
          <View style={styles.spendingItem}>
            <Text style={styles.spendingValue}>{recentTransactions.topCategory}</Text>
            <Text style={styles.spendingLabel}>Top Category</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderAIInsights = () => {
    if (!summary) return null;

    const { aiInsights } = summary;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>AI Insights</Text>
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={12} color={COLORS.PRIMARY} />
            <Text style={styles.aiText}>AI</Text>
          </View>
        </View>

        <View style={styles.insightSection}>
          <Text style={styles.insightTitle}>Market Summary</Text>
          <Text style={styles.insightText}>{aiInsights.marketSummary}</Text>
        </View>

        <View style={styles.insightSection}>
          <Text style={styles.insightTitle}>Canadian Focus</Text>
          <Text style={styles.insightText}>{aiInsights.canadianFocus}</Text>
        </View>

        {aiInsights.portfolioRecommendations.length > 0 && (
          <View style={styles.insightSection}>
            <Text style={styles.insightTitle}>Portfolio Recommendations</Text>
            {aiInsights.portfolioRecommendations.map((recommendation, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Ionicons name="bulb" size={14} color={COLORS.WARNING} />
                <Text style={styles.recommendationText}>{recommendation}</Text>
              </View>
            ))}
          </View>
        )}

        {aiInsights.spendingInsights.length > 0 && (
          <View style={styles.insightSection}>
            <Text style={styles.insightTitle}>Spending Insights</Text>
            {aiInsights.spendingInsights.map((insight, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Ionicons name="trending-down" size={14} color={COLORS.SUCCESS} />
                <Text style={styles.recommendationText}>{insight}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderUpcomingReminders = () => {
    if (!summary || summary.upcomingReminders.length === 0) return null;

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Upcoming Reminders</Text>
        {summary.upcomingReminders.map((reminder, index) => (
          <View key={index} style={styles.reminderItem}>
            <Ionicons name="alarm" size={16} color={COLORS.PRIMARY} />
            <Text style={styles.reminderText}>{reminder}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderMotivationalMessage = () => {
    if (!summary) return null;

    return (
      <View style={[styles.card, styles.motivationalCard]}>
        <Text style={styles.motivationalText}>{summary.motivationalMessage}</Text>
      </View>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('AddTransaction' as never)}
        >
          <Ionicons name="add-circle" size={24} color={COLORS.PRIMARY} />
          <Text style={styles.actionText}>Add Transaction</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('ReceiptScanner' as never)}
        >
          <Ionicons name="camera" size={24} color={COLORS.PRIMARY} />
          <Text style={styles.actionText}>Scan Receipt</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('StockResearch' as never)}
        >
          <Ionicons name="search" size={24} color={COLORS.PRIMARY} />
          <Text style={styles.actionText}>Research Stocks</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Analytics' as never)}
        >
          <Ionicons name="analytics" size={24} color={COLORS.PRIMARY} />
          <Text style={styles.actionText}>View Analytics</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Generating your daily summary...</Text>
      </View>
    );
  }

  if (!summary) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load daily summary</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>{summary.greeting}</Text>
        <Text style={styles.date}>{summary.date.toLocaleDateString()}</Text>
      </View>

      {renderPortfolioSnapshot()}
      {renderSpendingSummary()}
      {renderAIInsights()}
      {renderUpcomingReminders()}
      {renderQuickActions()}
      {renderMotivationalMessage()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.MD,
    fontFamily: FONTS.REGULAR,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: SPACING.XXL,
    fontFamily: FONTS.REGULAR,
  },
  header: {
    padding: SPACING.LG,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    fontFamily: FONTS.BOLD,
  },
  date: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.XS,
    fontFamily: FONTS.REGULAR,
  },
  card: {
    backgroundColor: COLORS.CARD,
    marginHorizontal: SPACING.MD,
    marginBottom: SPACING.MD,
    padding: SPACING.LG,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
    fontFamily: FONTS.BOLD,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY + '20',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: 12,
  },
  aiText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginLeft: SPACING.XS,
    fontFamily: FONTS.BOLD,
  },
  portfolioValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    fontFamily: FONTS.BOLD,
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.SM,
  },
  changeText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: SPACING.XS,
    fontFamily: FONTS.SEMIBOLD,
  },
  changePercent: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONTS.MEDIUM,
  },
  topMoverContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.MD,
    paddingTop: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: COLORS.DIVIDER,
  },
  topMoverLabel: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
  },
  topMoverText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.PRIMARY,
    marginLeft: SPACING.SM,
    fontFamily: FONTS.SEMIBOLD,
  },
  spendingGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spendingItem: {
    flex: 1,
    alignItems: 'center',
  },
  spendingValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.BOLD,
  },
  spendingLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.XS,
    textAlign: 'center',
    fontFamily: FONTS.REGULAR,
  },
  insightSection: {
    marginBottom: SPACING.MD,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
    fontFamily: FONTS.SEMIBOLD,
  },
  insightText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 20,
    fontFamily: FONTS.REGULAR,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.SM,
  },
  recommendationText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.SM,
    flex: 1,
    lineHeight: 20,
    fontFamily: FONTS.REGULAR,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  reminderText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.SM,
    flex: 1,
    fontFamily: FONTS.REGULAR,
  },
  motivationalCard: {
    backgroundColor: COLORS.PRIMARY + '10',
    borderWidth: 1,
    borderColor: COLORS.PRIMARY + '30',
  },
  motivationalText: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: FONTS.SEMIBOLD,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    alignItems: 'center',
    padding: SPACING.MD,
    backgroundColor: COLORS.PRIMARY + '10',
    borderRadius: 12,
    marginBottom: SPACING.SM,
  },
  actionText: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    marginTop: SPACING.XS,
    fontWeight: '600',
    fontFamily: FONTS.SEMIBOLD,
  },
});

export default DailySummaryScreen;