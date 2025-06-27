import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction, Category } from '@/types';
import { COLORS, SPACING, FONTS } from '@/constants';
import { formatCurrency, formatTransactionAmount } from '@/utils/currencyUtils';
import { formatTransactionDate } from '@/utils/dateUtils';

interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
  showDate?: boolean;
  showCategory?: boolean;
  showAccount?: boolean;
  compact?: boolean;
  onPress?: (transaction: Transaction) => void;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  onReceiptPress?: (receiptId: string) => void;
  swipeEnabled?: boolean;
  currency?: 'CAD' | 'USD';
  style?: any;
}

interface SwipeActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  backgroundColor: string;
  onPress: () => void;
}

const SwipeAction: React.FC<SwipeActionProps> = ({
  icon,
  label,
  color,
  backgroundColor,
  onPress,
}) => (
  <TouchableOpacity
    style={[styles.swipeAction, { backgroundColor }]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    <Ionicons name={icon} size={20} color={color} />
    <Text style={[styles.swipeActionText, { color }]}>{label}</Text>
  </TouchableOpacity>
);

const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  category,
  showDate = true,
  showCategory = true,
  showAccount = false,
  compact = false,
  onPress,
  onEdit,
  onDelete,
  onReceiptPress,
  swipeEnabled = false,
  currency = 'CAD',
  style,
}) => {
  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? COLORS.SUCCESS : COLORS.DANGER;

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete?.(transaction),
        },
      ]
    );
  };

  const getCategoryIcon = (): keyof typeof Ionicons.glyphMap => {
    if (!category) return 'help-circle-outline';
    
    // Map common category names to icons
    const categoryName = category.name.toLowerCase();
    if (categoryName.includes('food') || categoryName.includes('dining')) return 'restaurant-outline';
    if (categoryName.includes('transport') || categoryName.includes('car')) return 'car-outline';
    if (categoryName.includes('shopping') || categoryName.includes('retail')) return 'bag-outline';
    if (categoryName.includes('entertainment') || categoryName.includes('fun')) return 'game-controller-outline';
    if (categoryName.includes('bill') || categoryName.includes('utilities')) return 'receipt-outline';
    if (categoryName.includes('health') || categoryName.includes('medical')) return 'medical-outline';
    if (categoryName.includes('education') || categoryName.includes('school')) return 'school-outline';
    if (categoryName.includes('travel') || categoryName.includes('vacation')) return 'airplane-outline';
    if (categoryName.includes('salary') || categoryName.includes('income')) return 'card-outline';
    if (categoryName.includes('investment')) return 'trending-up-outline';
    
    return isIncome ? 'add-circle-outline' : 'remove-circle-outline';
  };

  const ItemContent = () => (
    <View style={[styles.container, compact && styles.containerCompact, style]}>
      <View style={styles.leftSection}>
        {/* Category Icon */}
        <View style={[styles.iconContainer, { backgroundColor: category?.color || COLORS.TEXT_SECONDARY }]}>
          <Ionicons
            name={getCategoryIcon()}
            size={compact ? 16 : 20}
            color="white"
          />
        </View>

        {/* Transaction Details */}
        <View style={styles.details}>
          <Text 
            style={[styles.description, compact && styles.descriptionCompact]}
            numberOfLines={1}
          >
            {transaction.description}
          </Text>
          
          <View style={styles.metadata}>
            {showCategory && category && (
              <Text style={[styles.category, compact && styles.categoryCompact]}>
                {category.name}
              </Text>
            )}
            
            {showDate && (
              <Text style={[styles.date, compact && styles.dateCompact]}>
                {formatTransactionDate(transaction.date)}
              </Text>
            )}
            
            {showAccount && (
              <Text style={[styles.account, compact && styles.accountCompact]}>
                Account: {transaction.accountId}
              </Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.rightSection}>
        {/* Amount */}
        <Text 
          style={[
            styles.amount, 
            { color: amountColor },
            compact && styles.amountCompact
          ]}
        >
          {formatTransactionAmount(transaction.amount, transaction.type, currency)}
        </Text>

        {/* Receipt Indicator */}
        {transaction.receiptId && (
          <TouchableOpacity
            style={styles.receiptIndicator}
            onPress={() => onReceiptPress?.(transaction.receiptId!)}
            accessibilityRole="button"
            accessibilityLabel="View receipt"
          >
            <Ionicons 
              name="document-attach" 
              size={14} 
              color={COLORS.PRIMARY} 
            />
          </TouchableOpacity>
        )}

        {/* Action Button */}
        {onPress && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onPress(transaction)}
            accessibilityRole="button"
            accessibilityLabel="View transaction details"
          >
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={COLORS.TEXT_SECONDARY} 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // If swipe actions are enabled, wrap in a swipe container
  if (swipeEnabled && (onEdit || onDelete)) {
    return (
      <View style={styles.swipeContainer}>
        {/* Left Swipe Actions */}
        {onEdit && (
          <SwipeAction
            icon="create-outline"
            label="Edit"
            color="white"
            backgroundColor={COLORS.WARNING}
            onPress={() => onEdit(transaction)}
          />
        )}

        {/* Main Content */}
        <TouchableOpacity
          onPress={() => onPress?.(transaction)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Transaction: ${transaction.description}, ${formatCurrency(transaction.amount, currency)}`}
        >
          <ItemContent />
        </TouchableOpacity>

        {/* Right Swipe Actions */}
        {onDelete && (
          <SwipeAction
            icon="trash-outline"
            label="Delete"
            color="white"
            backgroundColor={COLORS.DANGER}
            onPress={handleDelete}
          />
        )}
      </View>
    );
  }

  // Standard non-swipe version
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={() => onPress(transaction)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Transaction: ${transaction.description}, ${formatCurrency(transaction.amount, currency)}`}
      >
        <ItemContent />
      </TouchableOpacity>
    );
  }

  return <ItemContent />;
};

// Preset variations
export const CompactTransactionItem: React.FC<{
  transaction: Transaction;
  category?: Category;
  onPress?: (transaction: Transaction) => void;
  currency?: 'CAD' | 'USD';
}> = ({ transaction, category, onPress, currency }) => (
  <TransactionItem
    transaction={transaction}
    category={category}
    onPress={onPress}
    currency={currency}
    compact={true}
    showDate={false}
    showAccount={false}
  />
);

export const DetailedTransactionItem: React.FC<{
  transaction: Transaction;
  category?: Category;
  onPress?: (transaction: Transaction) => void;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  onReceiptPress?: (receiptId: string) => void;
  currency?: 'CAD' | 'USD';
}> = ({ transaction, category, onPress, onEdit, onDelete, onReceiptPress, currency }) => (
  <TransactionItem
    transaction={transaction}
    category={category}
    onPress={onPress}
    onEdit={onEdit}
    onDelete={onDelete}
    onReceiptPress={onReceiptPress}
    currency={currency}
    swipeEnabled={true}
    showDate={true}
    showCategory={true}
    showAccount={true}
  />
);

export const SearchResultTransactionItem: React.FC<{
  transaction: Transaction;
  category?: Category;
  searchTerm?: string;
  onPress?: (transaction: Transaction) => void;
  currency?: 'CAD' | 'USD';
}> = ({ transaction, category, searchTerm, onPress, currency }) => {
  // Highlight search term in description
  const highlightSearchTerm = (text: string, term?: string) => {
    if (!term) return text;
    // This would need a more sophisticated highlighting implementation
    return text;
  };

  return (
    <TransactionItem
      transaction={{
        ...transaction,
        description: highlightSearchTerm(transaction.description, searchTerm),
      }}
      category={category}
      onPress={onPress}
      currency={currency}
      showDate={true}
      showCategory={true}
      showAccount={true}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    marginHorizontal: SPACING.MD,
    marginVertical: SPACING.XS,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  containerCompact: {
    paddingVertical: SPACING.SM,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.MD,
  },
  details: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
    marginBottom: SPACING.XS,
  },
  descriptionCompact: {
    fontSize: 14,
    marginBottom: 2,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.SM,
  },
  category: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
  },
  categoryCompact: {
    fontSize: 10,
  },
  date: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
  },
  dateCompact: {
    fontSize: 10,
  },
  account: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
  },
  accountCompact: {
    fontSize: 10,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: FONTS.BOLD,
    marginBottom: SPACING.XS,
    textAlign: 'right',
  },
  amountCompact: {
    fontSize: 14,
    marginBottom: 2,
  },
  receiptIndicator: {
    padding: SPACING.XS,
    marginTop: SPACING.XS,
  },
  actionButton: {
    padding: SPACING.XS,
    marginLeft: SPACING.SM,
  },
  swipeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.MD,
    marginVertical: SPACING.XS,
    borderRadius: 12,
    overflow: 'hidden',
  },
  swipeAction: {
    width: 80,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.MD,
  },
  swipeActionText: {
    fontSize: 12,
    fontFamily: FONTS.MEDIUM,
    marginTop: SPACING.XS,
  },
});

export default TransactionItem;