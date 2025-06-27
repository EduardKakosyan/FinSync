import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SPACING, FONTS } from '@/constants';

const AnalyticsScreen = () => {
  const StatCard = ({
    title,
    value,
    icon,
    color,
  }: {
    title: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics & Insights</Text>
        <Text style={styles.subtitle}>
          Track your financial patterns and trends
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          title='Total Expenses'
          value='$0.00'
          icon='trending-down-outline'
          color={COLORS.DANGER}
        />
        <StatCard
          title='Total Income'
          value='$0.00'
          icon='trending-up-outline'
          color={COLORS.SUCCESS}
        />
        <StatCard
          title='Net Worth'
          value='$0.00'
          icon='analytics-outline'
          color={COLORS.PRIMARY}
        />
        <StatCard
          title='Savings Rate'
          value='0%'
          icon='wallet-outline'
          color={COLORS.WARNING}
        />
      </View>

      <View style={styles.emptyContainer}>
        <Ionicons
          name='stats-chart-outline'
          size={64}
          color={COLORS.TEXT_SECONDARY}
        />
        <Text style={styles.emptyText}>No data to analyze yet</Text>
        <Text style={styles.emptySubtext}>
          Add some transactions to see your financial insights and trends
        </Text>
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
    padding: SPACING.MD,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.BOLD,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.XS,
    fontFamily: FONTS.REGULAR,
  },
  statsGrid: {
    padding: SPACING.MD,
  },
  statCard: {
    backgroundColor: COLORS.SURFACE,
    padding: SPACING.MD,
    borderRadius: 12,
    marginBottom: SPACING.MD,
    borderLeftWidth: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.SM,
    fontFamily: FONTS.SEMIBOLD,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.BOLD,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.XXL,
    marginTop: SPACING.LG,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.MD,
    fontFamily: FONTS.SEMIBOLD,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.XS,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: FONTS.REGULAR,
  },
});

export default AnalyticsScreen;
