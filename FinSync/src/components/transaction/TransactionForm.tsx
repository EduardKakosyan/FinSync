import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Transaction, CreateTransactionInput, UpdateTransactionInput, Category, Account } from '@/types';
import { COLORS, SPACING, FONTS } from '@/constants';
import { formatCurrency, parseAmountFromInput, isValidAmountInput } from '@/utils/currencyUtils';
import CategoryPicker from '@/components/common/CategoryPicker';

interface TransactionFormProps {
  transaction?: Transaction;
  onSubmit: (data: CreateTransactionInput | UpdateTransactionInput) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  currency?: 'CAD' | 'USD';
  accounts?: Account[];
  categories?: Category[];
  mode?: 'create' | 'edit';
  initialType?: 'income' | 'expense';
  style?: any;
}

interface FormData {
  amount: string;
  description: string;
  category: string;
  type: 'income' | 'expense';
  date: Date;
  accountId: string;
  receiptId?: string;
}

interface FormErrors {
  amount?: string;
  description?: string;
  category?: string;
  accountId?: string;
  general?: string;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  transaction,
  onSubmit,
  onCancel,
  loading = false,
  currency = 'CAD',
  accounts = [],
  categories = [],
  mode = 'create',
  initialType = 'expense',
  style,
}) => {
  const [formData, setFormData] = useState<FormData>(() => ({
    amount: transaction ? transaction.amount.toString() : '',
    description: transaction?.description || '',
    category: transaction?.category || '',
    type: transaction?.type || initialType,
    date: transaction?.date || new Date(),
    accountId: transaction?.accountId || (accounts[0]?.id || ''),
    receiptId: transaction?.receiptId,
  }));

  const [errors, setErrors] = useState<FormErrors>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (transaction && mode === 'edit') {
      setFormData({
        amount: transaction.amount.toString(),
        description: transaction.description,
        category: transaction.category,
        type: transaction.type,
        date: transaction.date,
        accountId: transaction.accountId,
        receiptId: transaction.receiptId,
      });
    }
  }, [transaction, mode]);

  const updateFormData = useCallback((updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
    
    // Clear related errors when data changes
    const newErrors = { ...errors };
    Object.keys(updates).forEach(key => {
      if (newErrors[key as keyof FormErrors]) {
        delete newErrors[key as keyof FormErrors];
      }
    });
    setErrors(newErrors);
  }, [errors]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Amount validation
    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (!isValidAmountInput(formData.amount)) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (parseAmountFromInput(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 3) {
      newErrors.description = 'Description must be at least 3 characters';
    }

    // Category validation
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    // Account validation
    if (!formData.accountId) {
      newErrors.accountId = 'Account is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const transactionData = {
        amount: parseAmountFromInput(formData.amount),
        description: formData.description.trim(),
        category: formData.category,
        type: formData.type,
        date: formData.date,
        accountId: formData.accountId,
        ...(formData.receiptId && { receiptId: formData.receiptId }),
      };

      if (mode === 'edit' && transaction) {
        await onSubmit({ ...transactionData, id: transaction.id } as UpdateTransactionInput);
      } else {
        await onSubmit(transactionData as CreateTransactionInput);
      }
    } catch (error) {
      console.error('Error submitting transaction:', error);
      setErrors({ general: 'Failed to save transaction. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onCancel },
        ]
      );
    } else {
      onCancel?.();
    }
  };

  const formatAmountDisplay = (value: string) => {
    const numericValue = parseAmountFromInput(value);
    if (numericValue > 0) {
      return formatCurrency(numericValue, currency, { showCurrencySymbol: false });
    }
    return value;
  };

  const selectedAccount = accounts.find(acc => acc.id === formData.accountId);

  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {mode === 'edit' ? 'Edit Transaction' : 'Add Transaction'}
          </Text>
          {mode === 'edit' && transaction && (
            <Text style={styles.subtitle}>
              Created {new Date(transaction.createdAt).toLocaleDateString()}
            </Text>
          )}
        </View>

        {/* General Error */}
        {errors.general && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color={COLORS.DANGER} />
            <Text style={styles.errorText}>{errors.general}</Text>
          </View>
        )}

        {/* Transaction Type Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Type</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                formData.type === 'expense' && styles.typeButtonActive,
              ]}
              onPress={() => updateFormData({ type: 'expense' })}
              disabled={loading || isSubmitting}
            >
              <Ionicons
                name="remove-circle"
                size={20}
                color={formData.type === 'expense' ? 'white' : COLORS.DANGER}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  formData.type === 'expense' && styles.typeButtonTextActive,
                ]}
              >
                Expense
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.typeButton,
                formData.type === 'income' && styles.typeButtonActive,
              ]}
              onPress={() => updateFormData({ type: 'income' })}
              disabled={loading || isSubmitting}
            >
              <Ionicons
                name="add-circle"
                size={20}
                color={formData.type === 'income' ? 'white' : COLORS.SUCCESS}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  formData.type === 'income' && styles.typeButtonTextActive,
                ]}
              >
                Income
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amount</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>{currency === 'CAD' ? '$' : '$'}</Text>
            <TextInput
              style={[
                styles.amountInput,
                errors.amount && styles.inputError,
              ]}
              value={formData.amount}
              onChangeText={(text) => updateFormData({ amount: text })}
              placeholder="0.00"
              placeholderTextColor={COLORS.TEXT_SECONDARY}
              keyboardType="decimal-pad"
              editable={!loading && !isSubmitting}
              accessibilityLabel="Transaction amount"
            />
          </View>
          {errors.amount && (
            <Text style={styles.fieldError}>{errors.amount}</Text>
          )}
        </View>

        {/* Description Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={[
              styles.input,
              errors.description && styles.inputError,
            ]}
            value={formData.description}
            onChangeText={(text) => updateFormData({ description: text })}
            placeholder="Enter description"
            placeholderTextColor={COLORS.TEXT_SECONDARY}
            editable={!loading && !isSubmitting}
            accessibilityLabel="Transaction description"
          />
          {errors.description && (
            <Text style={styles.fieldError}>{errors.description}</Text>
          )}
        </View>

        {/* Category Picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <CategoryPicker
            selectedCategory={formData.category}
            onCategorySelect={(category) => updateFormData({ category })}
            type={formData.type}
            disabled={loading || isSubmitting}
          />
          {errors.category && (
            <Text style={styles.fieldError}>{errors.category}</Text>
          )}
        </View>

        {/* Account Selector */}
        {accounts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <TouchableOpacity
              style={[
                styles.accountSelector,
                errors.accountId && styles.inputError,
              ]}
              onPress={() => {
                // Show account picker modal
                Alert.alert(
                  'Select Account',
                  'Choose the account for this transaction',
                  accounts.map(account => ({
                    text: `${account.name} (${formatCurrency(account.balance, account.currency)})`,
                    onPress: () => updateFormData({ accountId: account.id }),
                  })).concat([{ text: 'Cancel', style: 'cancel' }])
                );
              }}
              disabled={loading || isSubmitting}
            >
              <View style={styles.accountInfo}>
                {selectedAccount && (
                  <>
                    <Text style={styles.accountName}>{selectedAccount.name}</Text>
                    <Text style={styles.accountBalance}>
                      Balance: {formatCurrency(selectedAccount.balance, selectedAccount.currency)}
                    </Text>
                  </>
                )}
                {!selectedAccount && (
                  <Text style={styles.accountPlaceholder}>Select account</Text>
                )}
              </View>
              <Ionicons name="chevron-down" size={20} color={COLORS.TEXT_SECONDARY} />
            </TouchableOpacity>
            {errors.accountId && (
              <Text style={styles.fieldError}>{errors.accountId}</Text>
            )}
          </View>
        )}

        {/* Date Picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
            disabled={loading || isSubmitting}
          >
            <Ionicons name="calendar-outline" size={20} color={COLORS.PRIMARY} />
            <Text style={styles.dateText}>
              {formData.date.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={formData.date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  updateFormData({ date: selectedDate });
                }
              }}
            />
          )}
        </View>

        {/* Receipt Attachment */}
        {formData.receiptId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Receipt</Text>
            <View style={styles.receiptContainer}>
              <Ionicons name="document-attach" size={20} color={COLORS.PRIMARY} />
              <Text style={styles.receiptText}>Receipt attached</Text>
              <TouchableOpacity
                onPress={() => updateFormData({ receiptId: undefined })}
                disabled={loading || isSubmitting}
              >
                <Ionicons name="close-circle" size={20} color={COLORS.DANGER} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          disabled={loading || isSubmitting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.submitButton,
            (loading || isSubmitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={loading || isSubmitting}
        >
          {(loading || isSubmitting) ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.submitButtonText}>
              {mode === 'edit' ? 'Update' : 'Save'} Transaction
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.BOLD,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
    marginTop: SPACING.XS,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: SPACING.SM,
    margin: SPACING.MD,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.DANGER,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.DANGER,
    fontFamily: FONTS.REGULAR,
    marginLeft: SPACING.SM,
    flex: 1,
  },
  section: {
    padding: SPACING.MD,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
    marginBottom: SPACING.SM,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: SPACING.SM,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.MD,
    borderRadius: 12,
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    gap: SPACING.SM,
  },
  typeButtonActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
  },
  typeButtonTextActive: {
    color: 'white',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    paddingHorizontal: SPACING.MD,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.BOLD,
    marginRight: SPACING.SM,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.BOLD,
    paddingVertical: SPACING.MD,
  },
  input: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    padding: SPACING.MD,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.REGULAR,
  },
  inputError: {
    borderColor: COLORS.DANGER,
  },
  fieldError: {
    fontSize: 12,
    color: COLORS.DANGER,
    fontFamily: FONTS.REGULAR,
    marginTop: SPACING.XS,
  },
  accountSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    padding: SPACING.MD,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
  },
  accountBalance: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
    marginTop: 2,
  },
  accountPlaceholder: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    padding: SPACING.MD,
    gap: SPACING.SM,
  },
  dateText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.REGULAR,
  },
  receiptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    padding: SPACING.MD,
    gap: SPACING.SM,
  },
  receiptText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.REGULAR,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    gap: SPACING.SM,
  },
  cancelButton: {
    flex: 1,
    padding: SPACING.MD,
    borderRadius: 12,
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
  },
  submitButton: {
    flex: 2,
    padding: SPACING.MD,
    borderRadius: 12,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: FONTS.BOLD,
  },
});

export default TransactionForm;