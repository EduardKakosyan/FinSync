import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SPACING, FONTS } from '@/constants';
import { Investment } from '@/types';
import { StockQuote } from '@/services/investment/StockApiService';
import { formatCurrency } from '@/utils/currencyUtils';

interface InvestmentItemProps {
  investment: Investment;
  quote?: StockQuote;
  onPress: () => void;
}

export const InvestmentItem: React.FC<InvestmentItemProps> = ({
  investment,
  quote,
  onPress,
}) => {
  const currentPrice = quote?.price || investment.currentValue;
  const totalValue = currentPrice * investment.shares;
  const totalCost = investment.purchasePrice * investment.shares;
  const gain = totalValue - totalCost;
  const gainPercent = totalCost > 0 ? (gain / totalCost) * 100 : 0;
  const isPositive = gain >= 0;

  const dayChange = quote?.change || 0;
  const dayChangePercent = quote?.changePercent || 0;
  const isDayPositive = dayChange >= 0;

  const getTypeIcon = () => {
    switch (investment.type) {
      case 'stock':
        return 'stats-chart';
      case 'etf':
        return 'pie-chart';
      case 'crypto':
        return 'logo-bitcoin';
      case 'bond':
        return 'document-text';
      case 'mutual_fund':
        return 'analytics';
      default:
        return 'cash';
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.leftSection}>
        <View style={styles.iconContainer}>
          <Ionicons name={getTypeIcon()} size={24} color={COLORS.PRIMARY} />
        </View>
        <View style={styles.info}>
          <Text style={styles.symbol}>{investment.symbol}</Text>
          <Text style={styles.name} numberOfLines={1}>{investment.name}</Text>
          <Text style={styles.shares}>{investment.shares} shares</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <Text style={styles.value}>{formatCurrency(totalValue)}</Text>
        
        <View style={styles.changeRow}>
          <Ionicons
            name={isPositive ? 'arrow-up' : 'arrow-down'}
            size={12}
            color={isPositive ? COLORS.SUCCESS : COLORS.ERROR}
          />
          <Text style={[
            styles.changeValue,
            { color: isPositive ? COLORS.SUCCESS : COLORS.ERROR }
          ]}>
            {formatCurrency(Math.abs(gain))}
          </Text>
          <Text style={[
            styles.changePercent,
            { color: isPositive ? COLORS.SUCCESS : COLORS.ERROR }
          ]}>
            ({gainPercent >= 0 ? '+' : ''}{gainPercent.toFixed(2)}%)
          </Text>
        </View>

        {quote && (
          <View style={styles.dayChangeRow}>
            <Text style={styles.dayChangeLabel}>Today: </Text>
            <Text style={[
              styles.dayChange,
              { color: isDayPositive ? COLORS.SUCCESS : COLORS.ERROR }
            ]}>
              {isDayPositive ? '+' : ''}{dayChangePercent.toFixed(2)}%
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.CARD,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.MD,
    marginBottom: SPACING.SM,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  info: {
    flex: 1,
  },
  symbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.BOLD,
  },
  name: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
    fontFamily: FONTS.REGULAR,
  },
  shares: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
    fontFamily: FONTS.REGULAR,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.BOLD,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  changeValue: {
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 2,
    fontFamily: FONTS.SEMIBOLD,
  },
  changePercent: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FONTS.MEDIUM,
  },
  dayChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dayChangeLabel: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
  },
  dayChange: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FONTS.SEMIBOLD,
  },
});