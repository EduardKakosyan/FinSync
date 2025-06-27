import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '@/constants';
import { formatCurrency, formatPercentage } from '@/utils/currencyUtils';
import { formatTransactionDate } from '@/utils/dateUtils';

interface SpendingCardProps {
  title: string;
  amount: number;
  currency?: 'CAD' | 'USD';
  change?: {
    amount: number;
    percentage: number;
    period: string; // e.g., "vs last month"
  };
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  backgroundColor?: string;
  textColor?: string;
  onPress?: () => void;
  showTrend?: boolean;
  trendData?: {
    isPositive: boolean;
    description: string;
  };
  subtitle?: string;
  lastUpdated?: Date;
  isLoading?: boolean;
  error?: string;
  style?: any;
}

const SpendingCard: React.FC<SpendingCardProps> = ({
  title,
  amount,
  currency = 'CAD',
  change,
  icon = 'card-outline',
  iconColor = COLORS.PRIMARY,
  backgroundColor = COLORS.SURFACE,
  textColor = COLORS.TEXT_PRIMARY,
  onPress,
  showTrend = false,
  trendData,
  subtitle,
  lastUpdated,
  isLoading = false,
  error,
  style,
}) => {
  const isNegativeChange = change && change.amount < 0;
  const isPositiveChange = change && change.amount > 0;

  const getTrendIcon = () => {
    if (!change) return null;
    return isPositiveChange ? 'trending-up' : 'trending-down';
  };

  const getTrendColor = () => {
    if (!change) return COLORS.TEXT_SECONDARY;
    return isPositiveChange ? COLORS.SUCCESS : COLORS.DANGER;
  };

  const CardContent = () => (
    <View style={[styles.card, { backgroundColor }, style]}>
      <View style={styles.cardHeader}>
        <View style={styles.titleSection}>
          <Ionicons name={icon} size={24} color={iconColor} />
          <Text style={[styles.title, { color: textColor }]}>{title}</Text>
        </View>
        {onPress && (
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>
        )}
      </View>

      {/* Loading State */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color={COLORS.DANGER} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Content - only show when not loading and no error */}
      {!isLoading && !error && (
        <>
          <View style={styles.amountSection}>
            <Text style={[styles.amount, { color: textColor }]}>
              {formatCurrency(amount, currency)}
            </Text>
            
            {subtitle && (
              <Text style={[styles.subtitle, { color: textColor }]}>{subtitle}</Text>
            )}
          </View>

          {change && (
            <View style={styles.changeSection}>
              <View style={styles.changeInfo}>
                <Ionicons 
                  name={getTrendIcon()!} 
                  size={16} 
                  color={getTrendColor()} 
                />
                <Text style={[styles.changeAmount, { color: getTrendColor() }]}>
                  {formatCurrency(Math.abs(change.amount), currency)}
                </Text>
                <Text style={styles.changePercentage}>
                  ({formatPercentage(Math.abs(change.percentage) / 100)})
                </Text>
              </View>
              <Text style={styles.changePeriod}>{change.period}</Text>
            </View>
          )}

          {showTrend && trendData && (
            <View style={styles.trendSection}>
              <View style={styles.trendIndicator}>
                <View style={[
                  styles.trendDot, 
                  { backgroundColor: trendData.isPositive ? COLORS.SUCCESS : COLORS.DANGER }
                ]} />
                <Text style={[
                  styles.trendText,
                  { color: trendData.isPositive ? COLORS.SUCCESS : COLORS.DANGER }
                ]}>
                  {trendData.description}
                </Text>
              </View>
            </View>
          )}

          {lastUpdated && (
            <View style={styles.footer}>
              <Text style={styles.lastUpdated}>
                Updated {formatTransactionDate(lastUpdated)}
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <CardContent />
      </TouchableOpacity>
    );
  }

  return <CardContent />;
};

// Preset card variants for common use cases
export const TotalSpendingCard: React.FC<{
  amount: number;
  change?: SpendingCardProps['change'];
  onPress?: () => void;
}> = ({ amount, change, onPress }) => (
  <SpendingCard
    title="Total Spending"
    amount={amount}
    change={change}
    icon="card-outline"
    iconColor={COLORS.DANGER}
    onPress={onPress}
    showTrend={true}
    trendData={change ? {
      isPositive: change.amount < 0, // Less spending is positive
      description: change.amount < 0 ? 'Spending down' : 'Spending up'
    } : undefined}
  />
);

export const TotalIncomeCard: React.FC<{
  amount: number;
  change?: SpendingCardProps['change'];
  onPress?: () => void;
}> = ({ amount, change, onPress }) => (
  <SpendingCard
    title="Total Income"
    amount={amount}
    change={change}
    icon="trending-up"
    iconColor={COLORS.SUCCESS}
    onPress={onPress}
    showTrend={true}
    trendData={change ? {
      isPositive: change.amount > 0, // More income is positive
      description: change.amount > 0 ? 'Income up' : 'Income down'
    } : undefined}
  />
);

export const NetIncomeCard: React.FC<{
  amount: number;
  change?: SpendingCardProps['change'];
  onPress?: () => void;
}> = ({ amount, change, onPress }) => (
  <SpendingCard
    title="Net Income"
    amount={amount}
    change={change}
    icon="analytics"
    iconColor={amount >= 0 ? COLORS.SUCCESS : COLORS.DANGER}
    backgroundColor={amount >= 0 ? '#E8F5E8' : '#FFEBEE'}
    onPress={onPress}
    subtitle={amount >= 0 ? 'Positive balance' : 'Negative balance'}
  />
);

export const AverageSpendingCard: React.FC<{
  amount: number;
  period: string;
  change?: SpendingCardProps['change'];
  onPress?: () => void;
}> = ({ amount, period, change, onPress }) => (
  <SpendingCard
    title="Average Spending"
    amount={amount}
    change={change}
    icon="bar-chart"
    iconColor={COLORS.WARNING}
    subtitle={`Per ${period}`}
    onPress={onPress}
  />
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: SPACING.MD,
    marginBottom: SPACING.SM,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.SM,
    fontFamily: FONTS.SEMIBOLD,
  },
  moreButton: {
    padding: SPACING.XS,
  },
  amountSection: {
    marginBottom: SPACING.SM,
  },
  amount: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: FONTS.BOLD,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
    marginTop: SPACING.XS,
    fontFamily: FONTS.REGULAR,
  },
  changeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },
  changeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeAmount: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: SPACING.XS,
    fontFamily: FONTS.SEMIBOLD,
  },
  changePercentage: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.XS,
    fontFamily: FONTS.REGULAR,
  },
  changePeriod: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
  },
  trendSection: {
    marginTop: SPACING.XS,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.SM,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FONTS.MEDIUM,
  },
  footer: {
    marginTop: SPACING.SM,
    paddingTop: SPACING.SM,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  lastUpdated: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    fontFamily: FONTS.REGULAR,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.LG,
    gap: SPACING.SM,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: SPACING.SM,
    borderRadius: 8,
    marginVertical: SPACING.SM,
    gap: SPACING.SM,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.DANGER,
    fontFamily: FONTS.REGULAR,
    flex: 1,
  },
});

export default SpendingCard;