import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategorySpending } from '@/types';
import { COLORS, SPACING, FONTS } from '@/constants';
import { formatCurrency, formatPercentage } from '@/utils/currencyUtils';

interface CategoryBreakdownProps {
  categories: CategorySpending[];
  isLoading?: boolean;
  currency?: 'CAD' | 'USD';
  totalAmount?: number;
  showBudgetInfo?: boolean;
  showTrend?: boolean;
  onCategoryPress?: (category: CategorySpending) => void;
  emptyStateText?: string;
  maxCategories?: number;
  showViewAllButton?: boolean;
  onViewAllPress?: () => void;
}

interface CategoryItemProps {
  category: CategorySpending;
  currency: 'CAD' | 'USD';
  showBudgetInfo: boolean;
  showTrend: boolean;
  onPress?: (category: CategorySpending) => void;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
  category,
  currency,
  showBudgetInfo,
  showTrend,
  onPress,
}) => {
  const isOverBudget = category.budgetLimit && category.amount > category.budgetLimit;
  const budgetUtilization = category.budgetLimit 
    ? (category.amount / category.budgetLimit) * 100 
    : 0;

  const getTrendIcon = () => {
    switch (category.trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      default:
        return 'remove';
    }
  };

  const getTrendColor = () => {
    switch (category.trend) {
      case 'up':
        return COLORS.DANGER;
      case 'down':
        return COLORS.SUCCESS;
      default:
        return COLORS.TEXT_SECONDARY;
    }
  };

  const ItemContent = () => (
    <View style={styles.categoryItem}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryInfo}>
          <View 
            style={[
              styles.colorIndicator, 
              { backgroundColor: category.categoryColor }
            ]} 
          />
          <View style={styles.categoryDetails}>
            <Text style={styles.categoryName}>{category.categoryName}</Text>
            <View style={styles.categoryMeta}>
              <Text style={styles.transactionCount}>
                {category.transactionCount} transaction{category.transactionCount !== 1 ? 's' : ''}
              </Text>
              {showTrend && (
                <View style={styles.trendContainer}>
                  <Ionicons 
                    name={getTrendIcon()} 
                    size={12} 
                    color={getTrendColor()} 
                  />
                  <Text style={[styles.trendText, { color: getTrendColor() }]}>
                    {category.trend}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.amountSection}>
          <Text style={styles.amount}>
            {formatCurrency(category.amount, currency)}
          </Text>
          <Text style={styles.percentage}>
            {formatPercentage(category.percentage / 100)}
          </Text>
        </View>
      </View>

      {showBudgetInfo && category.budgetLimit && (
        <View style={styles.budgetSection}>
          <View style={styles.budgetInfo}>
            <Text style={styles.budgetText}>
              Budget: {formatCurrency(category.budgetLimit, currency)}
            </Text>
            <Text 
              style={[
                styles.budgetStatus,
                { color: isOverBudget ? COLORS.DANGER : COLORS.SUCCESS }
              ]}
            >
              {formatCurrency(
                category.budgetLimit - category.amount, 
                currency
              )} {isOverBudget ? 'over' : 'left'}
            </Text>
          </View>
          
          <View style={styles.budgetBar}>
            <View 
              style={[
                styles.budgetProgress,
                { 
                  width: `${Math.min(budgetUtilization, 100)}%`,
                  backgroundColor: isOverBudget ? COLORS.DANGER : 
                    budgetUtilization > 80 ? COLORS.WARNING : COLORS.SUCCESS
                }
              ]} 
            />
          </View>
          
          <Text style={styles.budgetPercentage}>
            {formatPercentage(budgetUtilization / 100)} used
          </Text>
        </View>
      )}

      {onPress && (
        <View style={styles.actionIcon}>
          <Ionicons 
            name="chevron-forward" 
            size={16} 
            color={COLORS.TEXT_SECONDARY} 
          />
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity 
        onPress={() => onPress(category)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${category.categoryName} category with ${formatCurrency(category.amount, currency)} spent`}
      >
        <ItemContent />
      </TouchableOpacity>
    );
  }

  return <ItemContent />;
};

const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  categories,
  isLoading = false,
  currency = 'CAD',
  totalAmount,
  showBudgetInfo = false,
  showTrend = false,
  onCategoryPress,
  emptyStateText = 'No spending data available',
  maxCategories,
  showViewAllButton = false,
  onViewAllPress,
}) => {
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  if (categories.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons 
          name="pie-chart-outline" 
          size={48} 
          color={COLORS.TEXT_SECONDARY} 
        />
        <Text style={styles.emptyText}>{emptyStateText}</Text>
      </View>
    );
  }

  const displayCategories = maxCategories 
    ? categories.slice(0, maxCategories)
    : categories;

  const hasMoreCategories = maxCategories && categories.length > maxCategories;

  return (
    <View style={styles.container}>
      {totalAmount !== undefined && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Category Breakdown</Text>
          <Text style={styles.totalAmount}>
            Total: {formatCurrency(totalAmount, currency)}
          </Text>
        </View>
      )}

      <ScrollView 
        showsVerticalScrollIndicator={false}
        style={styles.categoriesList}
      >
        {displayCategories.map((category) => (
          <CategoryItem
            key={category.categoryId}
            category={category}
            currency={currency}
            showBudgetInfo={showBudgetInfo}
            showTrend={showTrend}
            onPress={onCategoryPress}
          />
        ))}

        {(hasMoreCategories && showViewAllButton && onViewAllPress) && (
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={onViewAllPress}
            accessibilityRole="button"
            accessibilityLabel="View all categories"
          >
            <Text style={styles.viewAllText}>
              View all {categories.length} categories
            </Text>
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={COLORS.PRIMARY} 
            />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

// Preset variations
export const TopCategoriesBreakdown: React.FC<{
  categories: CategorySpending[];
  isLoading?: boolean;
  currency?: 'CAD' | 'USD';
  onCategoryPress?: (category: CategorySpending) => void;
}> = ({ categories, isLoading, currency, onCategoryPress }) => (
  <CategoryBreakdown
    categories={categories}
    isLoading={isLoading}
    currency={currency}
    onCategoryPress={onCategoryPress}
    maxCategories={5}
    showViewAllButton={true}
    onViewAllPress={() => {
      // Handle navigation to full category list
      console.log('Navigate to full category breakdown');
    }}
    emptyStateText="No spending categories found"
  />
);

export const BudgetCategoriesBreakdown: React.FC<{
  categories: CategorySpending[];
  isLoading?: boolean;
  currency?: 'CAD' | 'USD';
  onCategoryPress?: (category: CategorySpending) => void;
}> = ({ categories, isLoading, currency, onCategoryPress }) => (
  <CategoryBreakdown
    categories={categories.filter(cat => cat.budgetLimit)}
    isLoading={isLoading}
    currency={currency}
    onCategoryPress={onCategoryPress}
    showBudgetInfo={true}
    showTrend={true}
    emptyStateText="No budgets set for categories"
  />
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.MEDIUM,
  },
  categoriesList: {
    flex: 1,
  },
  categoryItem: {
    backgroundColor: COLORS.SURFACE,
    marginHorizontal: SPACING.MD,
    marginVertical: SPACING.XS,
    borderRadius: 12,
    padding: SPACING.MD,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: SPACING.SM,
    marginTop: 2,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
    marginBottom: SPACING.XS,
  },
  categoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  transactionCount: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '500',
    fontFamily: FONTS.MEDIUM,
    textTransform: 'capitalize',
  },
  amountSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.BOLD,
  },
  percentage: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
    marginTop: SPACING.XS,
  },
  budgetSection: {
    marginTop: SPACING.MD,
    paddingTop: SPACING.SM,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  budgetInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.XS,
  },
  budgetText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
  },
  budgetStatus: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.SEMIBOLD,
  },
  budgetBar: {
    height: 4,
    backgroundColor: COLORS.BORDER,
    borderRadius: 2,
    marginVertical: SPACING.XS,
    overflow: 'hidden',
  },
  budgetProgress: {
    height: '100%',
    borderRadius: 2,
  },
  budgetPercentage: {
    fontSize: 10,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
    textAlign: 'center',
  },
  actionIcon: {
    marginLeft: SPACING.SM,
    justifyContent: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.MD,
    marginHorizontal: SPACING.MD,
    marginVertical: SPACING.SM,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    borderStyle: 'dashed',
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: '600',
    fontFamily: FONTS.SEMIBOLD,
    marginRight: SPACING.XS,
  },
  loadingContainer: {
    padding: SPACING.XL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
    marginTop: SPACING.SM,
  },
  emptyContainer: {
    padding: SPACING.XL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
    textAlign: 'center',
    marginTop: SPACING.SM,
  },
});

export default CategoryBreakdown;