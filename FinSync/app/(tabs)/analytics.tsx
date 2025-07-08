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

import { useColors, useTokens, Typography, Card, Button, Heading1, BodyText, Caption } from '../../src/design-system';
import { enhancedTransactionService } from '../../src/services/EnhancedTransactionService';
import { formatCurrency } from '../../src/utils/currencyUtils';

interface QuickStats {
  today: { amount: number; formatted: string; transactionCount: number };
  thisWeek: { amount: number; formatted: string; transactionCount: number };
  thisMonth: { amount: number; formatted: string; transactionCount: number };
  lastUpdated: Date;
}

const AnalyticsScreen = () => {
  const colors = useColors();
  const tokens = useTokens();
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
    <Card variant="default" style={{ flex: 1, marginBottom: tokens.Spacing.md }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: tokens.Spacing.sm
      }}>
        <View style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: tokens.Spacing.sm
        }}>
          <Ionicons name={icon as any} size={20} color={colors.textInverse} />
        </View>
        <Typography variant="label">{title}</Typography>
      </View>
      
      <Typography variant="amountLarge" style={{ color: colors.textPrimary, marginBottom: tokens.Spacing.xs }}>
        {formatted}
      </Typography>
      <Caption color="secondary">
        {count} transaction{count !== 1 ? 's' : ''}
      </Caption>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <BodyText color="secondary">Loading analytics...</BodyText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: tokens.Spacing.lg,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border
        }}>
          <Heading1>Analytics</Heading1>
          <TouchableOpacity 
            style={{ padding: tokens.Spacing.sm, borderRadius: 8 }} 
            onPress={loadAnalytics}
          >
            <Ionicons name="refresh" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {stats && (
          <View style={{ padding: tokens.Spacing.lg }}>
            <Typography variant="h3" style={{ marginBottom: tokens.Spacing.md }}>
              Spending Overview
            </Typography>
            
            <View style={{
              flexDirection: 'row',
              gap: tokens.Spacing.md,
              marginBottom: tokens.Spacing.md
            }}>
              <StatsCard
                title="Today"
                amount={stats.today.amount}
                formatted={stats.today.formatted}
                count={stats.today.transactionCount}
                icon="today"
                color={colors.primary}
              />
              
              <StatsCard
                title="This Week"
                amount={stats.thisWeek.amount}
                formatted={stats.thisWeek.formatted}
                count={stats.thisWeek.transactionCount}
                icon="calendar"
                color={colors.info}
              />
            </View>
            
            <StatsCard
              title="This Month"
              amount={stats.thisMonth.amount}
              formatted={stats.thisMonth.formatted}
              count={stats.thisMonth.transactionCount}
              icon="stats-chart"
              color={colors.success}
            />
            
            <View style={{ marginTop: tokens.Spacing.lg }}>
              <Typography variant="h3" style={{ marginBottom: tokens.Spacing.md }}>
                Insights
              </Typography>
              
              <Card variant="default" style={{ marginBottom: tokens.Spacing.sm }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: tokens.Spacing.md
                }}>
                  <Ionicons name="trending-up" size={24} color={colors.success} />
                  <View style={{ flex: 1, marginLeft: tokens.Spacing.md }}>
                    <Typography variant="labelSmall" style={{ fontWeight: '600', marginBottom: tokens.Spacing.xs }}>
                      Spending Trend
                    </Typography>
                    <BodyText color="secondary">
                      You've spent {stats.thisMonth.formatted} this month
                    </BodyText>
                  </View>
                </View>
              </Card>
              
              <Card variant="default" style={{ marginBottom: tokens.Spacing.sm }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: tokens.Spacing.md
                }}>
                  <Ionicons name="bulb" size={24} color={colors.warning} />
                  <View style={{ flex: 1, marginLeft: tokens.Spacing.md }}>
                    <Typography variant="labelSmall" style={{ fontWeight: '600', marginBottom: tokens.Spacing.xs }}>
                      Smart Tip
                    </Typography>
                    <BodyText color="secondary">
                      Try using transaction templates to speed up entry
                    </BodyText>
                  </View>
                </View>
              </Card>
            </View>
            
            <Caption color="secondary" align="center" style={{ marginTop: tokens.Spacing.lg }}>
              Last updated: {stats.lastUpdated.toLocaleString()}
            </Caption>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles removed - using design system components

export default AnalyticsScreen;