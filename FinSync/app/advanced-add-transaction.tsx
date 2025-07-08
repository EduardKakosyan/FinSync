import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

import { CreateTransactionInput } from '../src/types';
import { formatCurrency, parseAmountFromInput } from '../src/utils/currencyUtils';
import {
  Typography,
  Card,
  Button,
  useColors,
  useTokens,
  Heading2,
  BodyText,
  Caption,
  Label,
  Stack
} from '../src/design-system';

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
  const colors = useColors();
  const tokens = useTokens();
  
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

  const categories = [
    { id: 'food', name: 'Food & Dining', icon: 'restaurant' },
    { id: 'transport', name: 'Transportation', icon: 'car' },
    { id: 'shopping', name: 'Shopping', icon: 'basket' },
    { id: 'entertainment', name: 'Entertainment', icon: 'film' },
    { id: 'bills', name: 'Bills & Utilities', icon: 'card' },
    { id: 'health', name: 'Health & Medical', icon: 'medical' },
    { id: 'income', name: 'Income', icon: 'trending-up' },
    { id: 'other', name: 'Other', icon: 'ellipsis-horizontal' },
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else {
      const amount = parseAmountFromInput(formData.amount);
      if (amount <= 0) {
        newErrors.amount = 'Amount must be greater than 0';
      }
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const transactionData: CreateTransactionInput = {
        amount: parseAmountFromInput(formData.amount),
        description: formData.description,
        category: formData.category,
        type: formData.type,
        date: formData.date,
        notes: formData.notes,
        location: formData.location,
      };

      // TODO: Save transaction using your service
      console.log('Transaction data:', transactionData);
      
      Alert.alert(
        'Success',
        'Transaction created successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating transaction:', error);
      Alert.alert('Error', 'Failed to create transaction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({ ...formData, date: selectedDate });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: tokens.Spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.surface,
        }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ marginLeft: tokens.Spacing.sm, flex: 1 }}>
            <Heading2>Add Transaction</Heading2>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }}>
          <Stack spacing="lg" style={{ padding: tokens.Spacing.lg }}>
            {/* Transaction Type Selector */}
            <Card variant="default">
              <Label style={{ marginBottom: tokens.Spacing.sm }}>Transaction Type</Label>
              <View style={{ flexDirection: 'row', gap: tokens.Spacing.sm }}>
                <Button
                  variant={formData.type === 'expense' ? 'destructive' : 'secondary'}
                  size="medium"
                  style={{ flex: 1 }}
                  onPress={() => setFormData({ ...formData, type: 'expense' })}
                >
                  Expense
                </Button>
                <Button
                  variant={formData.type === 'income' ? 'primary' : 'secondary'}
                  size="medium"
                  style={{ flex: 1, backgroundColor: formData.type === 'income' ? colors.success : undefined }}
                  onPress={() => setFormData({ ...formData, type: 'income' })}
                >
                  Income
                </Button>
              </View>
            </Card>

            {/* Amount Input */}
            <Card variant="default">
              <Label style={{ marginBottom: tokens.Spacing.sm }}>Amount</Label>
              <TextInput
                style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: colors.textPrimary,
                  backgroundColor: colors.surface,
                  padding: tokens.Spacing.md,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: errors.amount ? colors.error : colors.border,
                }}
                value={formData.amount}
                onChangeText={(text) => {
                  setFormData({ ...formData, amount: text });
                  if (errors.amount) {
                    setErrors({ ...errors, amount: undefined });
                  }
                }}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
              {errors.amount && (
                <Caption color="secondary" style={{ color: colors.error, marginTop: tokens.Spacing.xs }}>
                  {errors.amount}
                </Caption>
              )}
            </Card>

            {/* Description Input */}
            <Card variant="default">
              <Label style={{ marginBottom: tokens.Spacing.sm }}>Description</Label>
              <TextInput
                style={{
                  fontSize: 16,
                  color: colors.textPrimary,
                  backgroundColor: colors.surface,
                  padding: tokens.Spacing.md,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: errors.description ? colors.error : colors.border,
                }}
                value={formData.description}
                onChangeText={(text) => {
                  setFormData({ ...formData, description: text });
                  if (errors.description) {
                    setErrors({ ...errors, description: undefined });
                  }
                }}
                placeholder="Enter description..."
                placeholderTextColor={colors.textSecondary}
              />
              {errors.description && (
                <Caption color="secondary" style={{ color: colors.error, marginTop: tokens.Spacing.xs }}>
                  {errors.description}
                </Caption>
              )}
            </Card>

            {/* Category Selection */}
            <Card variant="default">
              <Label style={{ marginBottom: tokens.Spacing.sm }}>Category</Label>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.Spacing.sm }}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: formData.category === category.id ? colors.primary : colors.surface,
                      padding: tokens.Spacing.sm,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: formData.category === category.id ? colors.primary : colors.border,
                    }}
                    onPress={() => setFormData({ ...formData, category: category.id })}
                  >
                    <Ionicons 
                      name={category.icon as any} 
                      size={16} 
                      color={formData.category === category.id ? '#FFFFFF' : colors.textPrimary} 
                    />
                    <Typography 
                      variant="caption" 
                      style={{ 
                        marginLeft: tokens.Spacing.xs,
                        color: formData.category === category.id ? '#FFFFFF' : colors.textPrimary
                      }}
                    >
                      {category.name}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.category && (
                <Caption color="secondary" style={{ color: colors.error, marginTop: tokens.Spacing.xs }}>
                  {errors.category}
                </Caption>
              )}
            </Card>

            {/* Date Picker */}
            <Card variant="default">
              <Label style={{ marginBottom: tokens.Spacing.sm }}>Date</Label>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.surface,
                  padding: tokens.Spacing.md,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                <Typography variant="body" style={{ marginLeft: tokens.Spacing.sm }}>
                  {formData.date.toLocaleDateString()}
                </Typography>
              </TouchableOpacity>
            </Card>

            {/* Advanced Options */}
            <Card variant="default">
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                onPress={() => setShowAdvancedOptions(!showAdvancedOptions)}
              >
                <Label>Advanced Options</Label>
                <Ionicons 
                  name={showAdvancedOptions ? 'chevron-up' : 'chevron-down'} 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
              
              {showAdvancedOptions && (
                <View style={{ marginTop: tokens.Spacing.md, gap: tokens.Spacing.md }}>
                  <TextInput
                    style={{
                      fontSize: 16,
                      color: colors.textPrimary,
                      backgroundColor: colors.surface,
                      padding: tokens.Spacing.md,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.border,
                      minHeight: 80,
                    }}
                    value={formData.notes}
                    onChangeText={(text) => setFormData({ ...formData, notes: text })}
                    placeholder="Notes (optional)"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    textAlignVertical="top"
                  />
                  
                  <TextInput
                    style={{
                      fontSize: 16,
                      color: colors.textPrimary,
                      backgroundColor: colors.surface,
                      padding: tokens.Spacing.md,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                    value={formData.location}
                    onChangeText={(text) => setFormData({ ...formData, location: text })}
                    placeholder="Location (optional)"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              )}
            </Card>

            {/* Submit Button */}
            <Button
              variant="primary"
              size="large"
              fullWidth
              onPress={handleSubmit}
              disabled={isLoading}
              loading={isLoading}
              style={{ marginTop: tokens.Spacing.md }}
            >
              {isLoading ? 'Creating...' : 'Create Transaction'}
            </Button>
          </Stack>
        </ScrollView>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={formData.date}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AdvancedAddTransactionScreen;