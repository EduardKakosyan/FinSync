import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SPACING, FONTS } from '../../src/constants';
import { enhancedTransactionService } from '../../src/services/EnhancedTransactionService';
import { formatCurrency } from '../../src/utils/currencyUtils';

interface QuickStats {
  today: { amount: number; formatted: string; transactionCount: number };
  thisWeek: { amount: number; formatted: string; transactionCount: number };
  thisMonth: { amount: number; formatted: string; transactionCount: number };
  lastUpdated: Date;
}

const AnalyticsScreen = () => {
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await enhancedTransactionService.getQuickStats();
      
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatsCard = ({ 
    title, 
    amount, 
    formatted, 
    count, 
    icon, 
    color 
  }: {
    title: string;
    amount: number;
    formatted: string;
    count: number;
    icon: string;
    color: string;
  }) => (
    <View style={styles.statsCard}>
      <View style={styles.statsHeader}>
        <View style={[styles.statsIcon, { backgroundColor: color }]}>
          <Ionicons name={icon as any} size={20} color="white" />
        </View>
        <Text style={styles.statsTitle}>{title}</Text>
      </View>
      
      <Text style={styles.statsAmount}>{formatted}</Text>
      <Text style={styles.statsCount}>
        {count} transaction{count !== 1 ? 's' : ''}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={loadAnalytics}>
            <Ionicons name="refresh" size={24} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        </View>

        {stats && (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Spending Overview</Text>
            
            <View style={styles.statsGrid}>
              <StatsCard
                title="Today"
                amount={stats.today.amount}
                formatted={stats.today.formatted}
                count={stats.today.transactionCount}
                icon="today"
                color={COLORS.PRIMARY}
              />
              
              <StatsCard
                title="This Week"
                amount={stats.thisWeek.amount}
                formatted={stats.thisWeek.formatted}
                count={stats.thisWeek.transactionCount}
                icon="calendar"
                color={COLORS.INFO}
              />
            </View>
            
            <StatsCard
              title="This Month"
              amount={stats.thisMonth.amount}
              formatted={stats.thisMonth.formatted}
              count={stats.thisMonth.transactionCount}
              icon="stats-chart"
              color={COLORS.SUCCESS}
            />
            
            <View style={styles.insightsSection}>
              <Text style={styles.sectionTitle}>Insights</Text>
              
              <View style={styles.insightCard}>
                <Ionicons name="trending-up" size={24} color={COLORS.SUCCESS} />
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Spending Trend</Text>
                  <Text style={styles.insightText}>
                    You've spent {stats.thisMonth.formatted} this month
                  </Text>
                </View>
              </View>
              
              <View style={styles.insightCard}>
                <Ionicons name="bulb" size={24} color={COLORS.WARNING} />
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Smart Tip</Text>
                  <Text style={styles.insightText}>
                    Try using transaction templates to speed up entry
                  </Text>
                </View>
              </View>
            </View>
            
            <Text style={styles.lastUpdated}>
              Last updated: {stats.lastUpdated.toLocaleString()}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
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
  refreshButton: {
    padding: SPACING.SM,
    borderRadius: 8,
  },
  content: {
    padding: SPACING.MD,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
    marginBottom: SPACING.MD,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.SM,
    marginBottom: SPACING.MD,
  },
  statsCard: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    padding: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  statsIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.SM,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
  },
  statsAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.BOLD,
    marginBottom: SPACING.XS,
  },
  statsCount: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
  },
  insightsSection: {
    marginTop: SPACING.LG,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    padding: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  insightContent: {
    flex: 1,
    marginLeft: SPACING.MD,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
    marginBottom: SPACING.XS,
  },
  insightText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
  },
  lastUpdated: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
    textAlign: 'center',
    marginTop: SPACING.LG,
  },
});

export default AnalyticsScreen;