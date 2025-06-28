import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Vibration,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

import { COLORS, SPACING, FONTS } from '../src/constants';
import { CreateTransactionInput } from '../src/types';
import SmartAmountInput from '../src/components/transaction/SmartAmountInput';
import { formatCurrency, parseAmountFromInput } from '../src/utils/currencyUtils';

interface FormData {
  amount: string;
  description: string;
  category: string;
  type: 'income' | 'expense';
  date: Date;
  notes?: string;
  location?: string;
}

interface FormErrors {
  amount?: string;
  description?: string;
  category?: string;
  general?: string;
}

const AdvancedAddTransactionScreen: React.FC = () => {
  const params = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  // Form state
  const [formData, setFormData] = useState<FormData>(() => {
    let initialData: FormData = {
      amount: '',
      description: '',
      category: '',
      type: 'expense',
      date: new Date(),
      notes: '',
      location: '',
    };

    // Handle prefilled data
    if (params.prefillData && typeof params.prefillData === 'string') {
      try {
        const prefillData = JSON.parse(params.prefillData);
        initialData = { ...initialData, ...prefillData };
        if (prefillData.amount) {
          initialData.amount = prefillData.amount.toString();
        }
      } catch (error) {
        console.error('Error parsing prefill data:', error);
      }
    }

    // Handle transaction type
    if (params.transactionType) {
      initialData.type = params.transactionType as 'income' | 'expense';
    }

    return initialData;
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Mock data for demonstration
  const [recentAmounts] = useState<number[]>([5.50, 15.00, 25.00, 50.00, 100.00]);
  const [categories] = useState<string[]>([
    'Food & Dining',
    'Transportation', 
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Health & Medical',
  ]);

  // Initialize animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const updateFormData = useCallback((updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    
    // Clear related errors
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

    if (!formData.amount.trim() || parseAmountFromInput(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!formData.description.trim() || formData.description.trim().length < 3) {
      newErrors.description = 'Description must be at least 3 characters';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Please select a category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success haptic
      if (Platform.OS === 'ios') {
        Vibration.vibrate([50, 50, 50]);
      }
      
      Alert.alert(
        'Success!',
        `Transaction saved: ${formatCurrency(parseAmountFromInput(formData.amount), 'CAD')}`,
        [
          {
            text: 'Add Another',
            onPress: () => {
              // Reset form
              setFormData({
                amount: '',
                description: '',
                category: '',
                type: formData.type,
                date: new Date(),
                notes: '',
                location: '',
              });
            },
          },
          {
            text: 'Done',
            style: 'default',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Transaction save error:', error);
      Alert.alert('Error', 'Failed to save transaction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
            </TouchableOpacity>
            
            <View style={styles.headerTitle}>
              <Text style={styles.title}>Add Transaction</Text>
              <View style={styles.aiIndicator}>
                <Ionicons name="sparkles" size={16} color={COLORS.WARNING} />
                <Text style={styles.aiText}>AI Powered</Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.advancedButton}
              onPress={() => setShowAdvancedOptions(!showAdvancedOptions)}
            >
              <Ionicons 
                name={showAdvancedOptions ? "options" : "options-outline"} 
                size={24} 
                color={COLORS.PRIMARY} 
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
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
                >
                  <Ionicons
                    name="remove-circle"
                    size={20}
                    color={formData.type === 'expense' ? 'white' : COLORS.DANGER}
                  />
                  <Text style={[
                    styles.typeButtonText,
                    formData.type === 'expense' && styles.typeButtonTextActive,
                  ]}>
                    Expense
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.type === 'income' && styles.typeButtonActive,
                  ]}
                  onPress={() => updateFormData({ type: 'income' })}
                >
                  <Ionicons
                    name="add-circle"
                    size={20}
                    color={formData.type === 'income' ? 'white' : COLORS.SUCCESS}
                  />
                  <Text style={[
                    styles.typeButtonText,
                    formData.type === 'income' && styles.typeButtonTextActive,
                  ]}>
                    Income
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Smart Amount Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amount</Text>
              <SmartAmountInput
                value={formData.amount}
                onChangeText={(amount) => updateFormData({ amount })}
                currency="CAD"
                transactionType={formData.type}
                error={errors.amount}
                recentAmounts={recentAmounts}
                autoFocus
              />
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
                onChangeText={(description) => updateFormData({ description })}
                placeholder="What was this transaction for?"
                placeholderTextColor={COLORS.TEXT_SECONDARY}
                multiline
                numberOfLines={2}
              />
              {errors.description && (
                <Text style={styles.errorText}>{errors.description}</Text>
              )}
            </View>

            {/* Category Picker */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category</Text>
              <TouchableOpacity
                style={[
                  styles.categoryPicker,
                  errors.category && styles.inputError,
                ]}
                onPress={() => {
                  Alert.alert(
                    'Select Category',
                    'Choose a category for this transaction',
                    categories.map(cat => ({
                      text: cat,
                      onPress: () => updateFormData({ category: cat }),
                    })).concat([{ text: 'Cancel' }])
                  );
                }}
              >
                <View style={styles.categoryInfo}>
                  {formData.category ? (
                    <Text style={styles.categoryText}>{formData.category}</Text>
                  ) : (
                    <Text style={styles.categoryPlaceholder}>Select category</Text>
                  )}
                </View>
                <View style={styles.aiCategoryBadge}>
                  <Ionicons name="sparkles" size={12} color={COLORS.WARNING} />
                  <Text style={styles.aiBadgeText}>AI</Text>
                </View>
                <Ionicons name="chevron-down" size={20} color={COLORS.TEXT_SECONDARY} />
              </TouchableOpacity>
              {errors.category && (
                <Text style={styles.errorText}>{errors.category}</Text>
              )}
            </View>

            {/* Date Picker */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={COLORS.PRIMARY} />
                <Text style={styles.dateText}>
                  {formData.date.toLocaleDateString()}
                </Text>
                <TouchableOpacity
                  style={styles.quickDateButton}
                  onPress={() => updateFormData({ date: new Date() })}
                >
                  <Text style={styles.quickDateText}>Today</Text>
                </TouchableOpacity>
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

            {/* Advanced Options */}
            {showAdvancedOptions && (
              <Animated.View style={styles.advancedSection}>
                <Text style={styles.sectionTitle}>Additional Details</Text>
                
                {/* Notes */}
                <View style={styles.advancedField}>
                  <Text style={styles.fieldLabel}>Notes</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.notes}
                    onChangeText={(notes) => updateFormData({ notes })}
                    placeholder="Additional notes (optional)"
                    placeholderTextColor={COLORS.TEXT_SECONDARY}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {/* Location */}
                <View style={styles.advancedField}>
                  <Text style={styles.fieldLabel}>Location</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.location}
                    onChangeText={(location) => updateFormData({ location })}
                    placeholder="Where did this happen? (optional)"
                    placeholderTextColor={COLORS.TEXT_SECONDARY}
                  />
                </View>
              </Animated.View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.submitButton,
                isLoading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="white" />
                  <Text style={styles.submitButtonText}>Save Transaction</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  keyboardContainer: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
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
  backButton: {
    padding: SPACING.SM,
    borderRadius: 8,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.BOLD,
  },
  aiIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  aiText: {
    fontSize: 12,
    color: COLORS.WARNING,
    fontFamily: FONTS.MEDIUM,
  },
  advancedButton: {
    padding: SPACING.SM,
    borderRadius: 8,
  },
  scrollView: {
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
  input: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    padding: SPACING.MD,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.REGULAR,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: COLORS.DANGER,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.DANGER,
    fontFamily: FONTS.REGULAR,
    marginTop: SPACING.XS,
  },
  categoryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    padding: SPACING.MD,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.REGULAR,
  },
  categoryPlaceholder: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
  },
  aiCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: SPACING.XS,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
    marginRight: SPACING.SM,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.WARNING,
    fontFamily: FONTS.BOLD,
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
    flex: 1,
  },
  quickDateButton: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
  },
  quickDateText: {
    fontSize: 12,
    color: 'white',
    fontFamily: FONTS.MEDIUM,
  },
  advancedSection: {
    padding: SPACING.MD,
    backgroundColor: COLORS.LIGHT,
    marginTop: SPACING.MD,
  },
  advancedField: {
    marginBottom: SPACING.MD,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
    marginBottom: SPACING.SM,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    gap: SPACING.SM,
    backgroundColor: COLORS.SURFACE,
  },
  cancelButton: {
    flex: 1,
    padding: SPACING.MD,
    borderRadius: 12,
    backgroundColor: COLORS.LIGHT,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.MD,
    borderRadius: 12,
    backgroundColor: COLORS.PRIMARY,
    gap: SPACING.SM,
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

export default AdvancedAddTransactionScreen;