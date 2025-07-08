import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SPACING, FONTS } from '@/constants';
import { formatCurrency } from '@/utils/currencyUtils';

interface PortfolioOverviewProps {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  dayChange: number;
  dayChangePercent: number;
}

export const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({
  totalValue,
  totalCost,
  totalGain,
  totalGainPercent,
  dayChange,
  dayChangePercent,
}) => {
  const isPositiveTotal = totalGain >= 0;
  const isPositiveDay = dayChange >= 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Total Portfolio Value</Text>
        <Text style={styles.totalValue}>{formatCurrency(totalValue)}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Gain/Loss</Text>
          <View style={styles.statValueRow}>
            <Ionicons
              name={isPositiveTotal ? 'trending-up' : 'trending-down'}
              size={16}
              color={isPositiveTotal ? COLORS.SUCCESS : COLORS.ERROR}
            />
            <Text style={[
              styles.statValue,
              { color: isPositiveTotal ? COLORS.SUCCESS : COLORS.ERROR }
            ]}>
              {formatCurrency(Math.abs(totalGain))}
            </Text>
            <Text style={[
              styles.statPercent,
              { color: isPositiveTotal ? COLORS.SUCCESS : COLORS.ERROR }
            ]}>
              ({totalGainPercent >= 0 ? '+' : ''}{totalGainPercent.toFixed(2)}%)
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Today's Change</Text>
          <View style={styles.statValueRow}>
            <Ionicons
              name={isPositiveDay ? 'arrow-up' : 'arrow-down'}
              size={16}
              color={isPositiveDay ? COLORS.SUCCESS : COLORS.ERROR}
            />
            <Text style={[
              styles.statValue,
              { color: isPositiveDay ? COLORS.SUCCESS : COLORS.ERROR }
            ]}>
              {formatCurrency(Math.abs(dayChange))}
            </Text>
            <Text style={[
              styles.statPercent,
              { color: isPositiveDay ? COLORS.SUCCESS : COLORS.ERROR }
            ]}>
              ({dayChangePercent >= 0 ? '+' : ''}{dayChangePercent.toFixed(2)}%)
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.costBasis}>
        <Text style={styles.costLabel}>Cost Basis</Text>
        <Text style={styles.costValue}>{formatCurrency(totalCost)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.CARD,
    marginHorizontal: SPACING.MD,
    marginVertical: SPACING.SM,
    padding: SPACING.LG,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },
  label: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.XS,
    fontFamily: FONTS.BOLD,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS,
    fontFamily: FONTS.REGULAR,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: SPACING.XS,
    fontFamily: FONTS.SEMIBOLD,
  },
  statPercent: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONTS.MEDIUM,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.DIVIDER,
    marginHorizontal: SPACING.MD,
  },
  costBasis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: COLORS.DIVIDER,
  },
  costLabel: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
  },
  costValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
  },
});