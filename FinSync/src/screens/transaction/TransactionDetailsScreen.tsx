import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { Transaction, Category, Account, RootStackParamList, CreateTransactionInput, UpdateTransactionInput } from '@/types';
import { COLORS, SPACING, FONTS } from '@/constants';
import { formatCurrency, formatTransactionAmount } from '@/utils/currencyUtils';
import { formatTransactionDate } from '@/utils/dateUtils';
import TransactionForm from '@/components/transaction/TransactionForm';

// Mock services - replace with actual service imports
import { MockDataService } from '@/services/MockDataService';

type TransactionDetailsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'TransactionDetails'
>;

type TransactionDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  'TransactionDetails'
>;

interface TransactionDetailsScreenProps {}

const TransactionDetailsScreen: React.FC<TransactionDetailsScreenProps> = () => {
  const navigation = useNavigation<TransactionDetailsScreenNavigationProp>();
  const route = useRoute<TransactionDetailsScreenRouteProp>();
  
  const { transactionId, mode = 'view' } = route.params;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTransactionData();
    loadSupportingData();
  }, [transactionId]);

  const loadTransactionData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // In a real app, you would call your transaction service
      const mockTransaction: Transaction = {
        id: transactionId,
        amount: 45.50,
        date: new Date(),
        category: 'Food & Dining',
        description: 'Coffee Shop Purchase',
        type: 'expense',
        accountId: 'account-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCategory: Category = {
        id: 'cat-1',
        name: 'Food & Dining',
        color: '#FF6B6B',
        type: 'expense',
        createdAt: new Date(),
      };

      const mockAccount: Account = {
        id: 'account-1',
        name: 'Main Checking',
        type: 'checking',
        balance: 2500.00,
        currency: 'CAD',
        isActive: true,
        createdAt: new Date(),
      };

      setTransaction(mockTransaction);
      setCategory(mockCategory);
      setAccount(mockAccount);
    } catch (err) {
      console.error('Error loading transaction:', err);
      setError('Failed to load transaction details');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSupportingData = async () => {
    try {
      // Load accounts and categories for editing
      const mockAccounts: Account[] = [
        {
          id: 'account-1',
          name: 'Main Checking',
          type: 'checking',
          balance: 2500.00,
          currency: 'CAD',
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: 'account-2',
          name: 'Savings Account',
          type: 'savings',
          balance: 10000.00,
          currency: 'CAD',
          isActive: true,
          createdAt: new Date(),
        },
      ];

      const mockCategories: Category[] = [
        {
          id: 'cat-1',
          name: 'Food & Dining',
          color: '#FF6B6B',
          type: 'expense',
          createdAt: new Date(),
        },
        {
          id: 'cat-2',
          name: 'Transportation',
          color: '#4ECDC4',
          type: 'expense',
          createdAt: new Date(),
        },
      ];

      setAccounts(mockAccounts);
      setCategories(mockCategories);
    } catch (err) {
      console.error('Error loading supporting data:', err);
    }
  };

  const handleSave = async (data: CreateTransactionInput | UpdateTransactionInput) => {
    try {
      setIsSaving(true);
      
      // In a real app, you would call your transaction service
      console.log('Saving transaction:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert('Success', 'Transaction updated successfully', [
        { 
          text: 'OK', 
          onPress: () => {
            setIsEditing(false);
            // Reload transaction data
            loadTransactionData();
          }
        }
      ]);
    } catch (err) {
      console.error('Error saving transaction:', err);
      Alert.alert('Error', 'Failed to save transaction. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // In a real app, you would call your transaction service
              console.log('Deleting transaction:', transactionId);
              
              Alert.alert('Success', 'Transaction deleted successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (err) {
              console.error('Error deleting transaction:', err);
              Alert.alert('Error', 'Failed to delete transaction. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset any form changes
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading transaction...</Text>
      </View>
    );
  }

  if (error || !transaction) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={COLORS.DANGER} />
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>{error || 'Transaction not found'}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={loadTransactionData}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isEditing) {
    return (
      <TransactionForm
        transaction={transaction}
        onSubmit={handleSave}
        onCancel={handleCancel}
        loading={isSaving}
        accounts={accounts}
        categories={categories}
        mode="edit"
      />
    );
  }

  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? COLORS.SUCCESS : COLORS.DANGER;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Transaction Details</Text>
        
        <TouchableOpacity 
          style={styles.editButton}
          onPress={handleEditToggle}
        >
          <Ionicons name="create-outline" size={24} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Amount Section */}
        <View style={styles.amountSection}>
          <Text style={[styles.amount, { color: amountColor }]}>
            {formatTransactionAmount(transaction.amount, transaction.type)}
          </Text>
          <Text style={styles.description}>{transaction.description}</Text>
        </View>

        {/* Details Section */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.TEXT_SECONDARY} />
              <Text style={styles.detailLabelText}>Date</Text>
            </View>
            <Text style={styles.detailValue}>
              {formatTransactionDate(transaction.date)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <Ionicons name="pricetag-outline" size={20} color={COLORS.TEXT_SECONDARY} />
              <Text style={styles.detailLabelText}>Category</Text>
            </View>
            <View style={styles.categoryValue}>
              {category && (
                <View 
                  style={[styles.categoryIndicator, { backgroundColor: category.color }]} 
                />
              )}
              <Text style={styles.detailValue}>
                {transaction.category}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <Ionicons name="card-outline" size={20} color={COLORS.TEXT_SECONDARY} />
              <Text style={styles.detailLabelText}>Account</Text>
            </View>
            <Text style={styles.detailValue}>
              {account?.name || 'Unknown Account'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <Ionicons name="swap-horizontal-outline" size={20} color={COLORS.TEXT_SECONDARY} />
              <Text style={styles.detailLabelText}>Type</Text>
            </View>
            <View style={styles.typeValue}>
              <Ionicons 
                name={isIncome ? 'add-circle' : 'remove-circle'} 
                size={16} 
                color={amountColor} 
              />
              <Text style={[styles.detailValue, { color: amountColor }]}>
                {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Receipt Section */}
        {transaction.receiptId && (
          <View style={styles.receiptCard}>
            <View style={styles.receiptHeader}>
              <Ionicons name="document-attach" size={20} color={COLORS.PRIMARY} />
              <Text style={styles.receiptTitle}>Receipt Attached</Text>
            </View>
            <TouchableOpacity 
              style={styles.viewReceiptButton}
              onPress={() => {
                // Navigate to receipt details
                console.log('Navigate to receipt:', transaction.receiptId);
              }}
            >
              <Text style={styles.viewReceiptText}>View Receipt</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.PRIMARY} />
            </TouchableOpacity>
          </View>
        )}

        {/* Metadata Section */}
        <View style={styles.metadataCard}>
          <Text style={styles.metadataTitle}>Transaction Information</Text>
          
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Created</Text>
            <Text style={styles.metadataValue}>
              {transaction.createdAt.toLocaleDateString()} at {transaction.createdAt.toLocaleTimeString()}
            </Text>
          </View>
          
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Last Updated</Text>
            <Text style={styles.metadataValue}>
              {transaction.updatedAt.toLocaleDateString()} at {transaction.updatedAt.toLocaleTimeString()}
            </Text>
          </View>
          
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Transaction ID</Text>
            <Text style={styles.metadataValue}>{transaction.id}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.DANGER} />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.editActionButton}
          onPress={handleEditToggle}
        >
          <Ionicons name="create-outline" size={20} color="white" />
          <Text style={styles.editActionButtonText}>Edit Transaction</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    padding: SPACING.XL,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
    marginTop: SPACING.MD,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.XL,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.BOLD,
    marginTop: SPACING.MD,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
    textAlign: 'center',
    marginTop: SPACING.SM,
  },
  retryButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.SM,
    borderRadius: 8,
    marginTop: SPACING.LG,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: FONTS.SEMIBOLD,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  backButton: {
    padding: SPACING.SM,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
  },
  editButton: {
    padding: SPACING.SM,
  },
  content: {
    flex: 1,
  },
  amountSection: {
    alignItems: 'center',
    padding: SPACING.XL,
    backgroundColor: COLORS.SURFACE,
    marginHorizontal: SPACING.MD,
    marginTop: SPACING.MD,
    borderRadius: 16,
  },
  amount: {
    fontSize: 36,
    fontWeight: 'bold',
    fontFamily: FONTS.BOLD,
    marginBottom: SPACING.SM,
  },
  description: {
    fontSize: 18,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.MEDIUM,
    textAlign: 'center',
  },
  detailsCard: {
    backgroundColor: COLORS.SURFACE,
    marginHorizontal: SPACING.MD,
    marginTop: SPACING.MD,
    borderRadius: 12,
    padding: SPACING.MD,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailLabelText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
    marginLeft: SPACING.SM,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.MEDIUM,
    textAlign: 'right',
  },
  categoryValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.SM,
  },
  typeValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.XS,
  },
  receiptCard: {
    backgroundColor: COLORS.SURFACE,
    marginHorizontal: SPACING.MD,
    marginTop: SPACING.MD,
    borderRadius: 12,
    padding: SPACING.MD,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
    marginLeft: SPACING.SM,
  },
  viewReceiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.SM,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 8,
  },
  viewReceiptText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontFamily: FONTS.MEDIUM,
  },
  metadataCard: {
    backgroundColor: COLORS.SURFACE,
    marginHorizontal: SPACING.MD,
    marginTop: SPACING.MD,
    marginBottom: SPACING.XL,
    borderRadius: 12,
    padding: SPACING.MD,
  },
  metadataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
    marginBottom: SPACING.MD,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.XS,
  },
  metadataLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
  },
  metadataValue: {
    fontSize: 12,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.REGULAR,
    textAlign: 'right',
    flex: 1,
    marginLeft: SPACING.SM,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    gap: SPACING.SM,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.MD,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.DANGER,
    gap: SPACING.SM,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.DANGER,
    fontFamily: FONTS.SEMIBOLD,
  },
  editActionButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.MD,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    gap: SPACING.SM,
  },
  editActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    fontFamily: FONTS.SEMIBOLD,
  },
});

export default TransactionDetailsScreen;