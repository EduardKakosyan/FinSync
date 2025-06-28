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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { COLORS, SPACING, FONTS } from '@/constants';
import { CreateTransactionInput, Account, Category } from '@/types';
import { enhancedTransactionService } from '@/services/EnhancedTransactionService';
import { accountService } from '@/services/storage/AccountService';
import { categoryService } from '@/services/categoryService';
import SmartAmountInput from '@/components/transaction/SmartAmountInput';
import IntelligentCategoryPicker from '@/components/transaction/IntelligentCategoryPicker';
import { formatCurrency, parseAmountFromInput } from '@/utils/currencyUtils';

interface FormData {
  amount: string;
  description: string;
  category: string;
  type: 'income' | 'expense';
  date: Date;
  accountId: string;
  notes?: string;
  location?: string;
  tags: string[];
}

interface FormErrors {
  amount?: string;
  description?: string;
  category?: string;
  accountId?: string;
  general?: string;
}

interface SmartSuggestion {
  id: string;
  type: 'description' | 'amount' | 'category' | 'template';
  title: string;
  subtitle: string;
  data: Partial<FormData>;
  confidence: number;
  icon: string;
}

const AdvancedAddTransactionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [smartPanelAnim] = useState(new Animated.Value(0));

  // Form state
  const [formData, setFormData] = useState<FormData>({
    amount: '',
    description: '',
    category: '',
    type: 'expense',
    date: new Date(),
    accountId: '',
    notes: '',
    location: '',
    tags: [],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Data state
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [recentAmounts, setRecentAmounts] = useState<number[]>([]);
  const [recentCategories, setRecentCategories] = useState<string[]>([]);

  // Initialize data and animations
  useEffect(() => {
    loadInitialData();
    startEntranceAnimation();
  }, []);

  // Handle route parameters
  useEffect(() => {
    const params = route.params as any;
    if (params) {
      if (params.transactionType) {
        setFormData(prev => ({ ...prev, type: params.transactionType }));
      }
      if (params.prefillData) {
        setFormData(prev => ({ ...prev, ...params.prefillData }));
      }
    }
  }, [route.params]);

  // Generate smart suggestions when form data changes
  useEffect(() => {
    if (formData.description.length > 2 || formData.amount) {
      generateSmartSuggestions();
    }
  }, [formData.description, formData.amount, formData.type]);

  const startEntranceAnimation = () => {
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
  };

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Load accounts
      const accountsResponse = await accountService.getActiveAccounts();
      setAccounts(accountsResponse);
      
      if (accountsResponse.length > 0 && !formData.accountId) {
        setFormData(prev => ({ ...prev, accountId: accountsResponse[0].id }));
      }

      // Load categories
      const categoriesResponse = await categoryService.getAll();
      setCategories(categoriesResponse);

      // Load recent transactions for intelligence
      const recentResponse = await enhancedTransactionService.getTransactions(
        { type: 'month' },
        false
      );
      
      if (recentResponse.success && recentResponse.data) {
        const recent = recentResponse.data.slice(0, 20);
        setRecentTransactions(recent);
        
        // Extract insights
        const amounts = [...new Set(recent.map(t => Math.abs(t.amount)))]
          .sort((a, b) => b - a)
          .slice(0, 5);
        setRecentAmounts(amounts);
        
        const categoryNames = [...new Set(recent.map(t => t.category))]
          .slice(0, 5);
        setRecentCategories(categoryNames);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSmartSuggestions = useCallback(() => {
    const suggestions: SmartSuggestion[] = [];
    
    // Description-based suggestions
    if (formData.description.length > 2) {
      const descLower = formData.description.toLowerCase();
      
      // Find similar past transactions
      const similarTransactions = recentTransactions.filter(t => 
        t.description.toLowerCase().includes(descLower) ||
        descLower.includes(t.description.toLowerCase().split(' ')[0])
      ).slice(0, 3);
      
      similarTransactions.forEach((transaction, index) => {
        suggestions.push({
          id: `similar-${index}`,
          type: 'template',
          title: `Use "${transaction.description}"`,
          subtitle: `${formatCurrency(Math.abs(transaction.amount), 'CAD')} • ${transaction.category}`,
          data: {
            amount: Math.abs(transaction.amount).toFixed(2),
            category: transaction.category,
            type: transaction.type,
          },
          confidence: 0.8,
          icon: 'copy-outline',
        });
      });
      
      // Smart category suggestions based on keywords
      const categoryMatches = getSmartCategoryMatches(descLower, categories);
      categoryMatches.forEach((match, index) => {
        suggestions.push({
          id: `category-${index}`,
          type: 'category',
          title: `Try "${match.category.name}"`,
          subtitle: `${Math.round(match.confidence * 100)}% match`,
          data: { category: match.category.name },
          confidence: match.confidence,
          icon: 'pricetag-outline',
        });
      });
    }
    
    // Amount-based suggestions
    if (formData.amount && parseAmountFromInput(formData.amount) > 0) {
      const amount = parseAmountFromInput(formData.amount);
      const roundedAmounts = [
        Math.round(amount / 5) * 5,
        Math.round(amount / 10) * 10,
        Math.round(amount / 20) * 20,
      ].filter(a => a !== amount && a > 0);
      
      roundedAmounts.slice(0, 2).forEach((roundedAmount, index) => {
        suggestions.push({
          id: `amount-${index}`,
          type: 'amount',
          title: `Round to ${formatCurrency(roundedAmount, 'CAD')}`,
          subtitle: 'Commonly used amount',
          data: { amount: roundedAmount.toFixed(2) },
          confidence: 0.6,
          icon: 'calculator-outline',
        });
      });
    }
    
    // Time-based suggestions
    const timeBasedSuggestions = getTimeBasedSuggestions();
    suggestions.push(...timeBasedSuggestions);
    
    // Sort by confidence and limit
    const sortedSuggestions = suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 6);
    
    setSmartSuggestions(sortedSuggestions);
    
    // Show smart panel if we have good suggestions
    if (sortedSuggestions.length > 0 && !showSmartSuggestions) {
      setShowSmartSuggestions(true);
      Animated.timing(smartPanelAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [formData.description, formData.amount, recentTransactions, categories]);

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

  const applySuggestion = useCallback((suggestion: SmartSuggestion) => {
    updateFormData(suggestion.data);
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Vibration.vibrate([30]);
    }
    
    // Hide suggestions panel after applying
    Animated.timing(smartPanelAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowSmartSuggestions(false);
    });
  }, [updateFormData]);

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

    if (!formData.accountId) {
      newErrors.accountId = 'Please select an account';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      // Scroll to first error
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setIsLoading(true);
    try {
      const transactionData: CreateTransactionInput = {
        amount: formData.type === 'expense' 
          ? -Math.abs(parseAmountFromInput(formData.amount))
          : Math.abs(parseAmountFromInput(formData.amount)),
        description: formData.description.trim(),
        category: formData.category,
        type: formData.type,
        date: formData.date,
        accountId: formData.accountId,
      };

      const result = await enhancedTransactionService.createTransaction(transactionData);
      
      if (result.success) {
        // Success haptic
        if (Platform.OS === 'ios') {
          Vibration.vibrate([50, 50, 50]);
        }
        
        Alert.alert(
          'Success!',
          `Transaction saved: ${formatCurrency(Math.abs(transactionData.amount), 'CAD')}`,
          [
            {
              text: 'Add Another',
              onPress: () => {
                // Reset form but keep some data
                setFormData(prev => ({
                  ...prev,
                  amount: '',
                  description: '',
                  category: '',
                  date: new Date(),
                  notes: '',
                  location: '',
                  tags: [],
                }));
                setShowSmartSuggestions(false);
              },
            },
            {
              text: 'Done',
              style: 'default',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to save transaction');
      }
    } catch (error) {
      console.error('Transaction save error:', error);
      Alert.alert('Error', 'Failed to save transaction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedAccount = accounts.find(acc => acc.id === formData.accountId);

  if (isLoading && accounts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
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
            onPress={() => navigation.goBack()}
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

          {/* Intelligent Category Picker */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <IntelligentCategoryPicker
              selectedCategory={formData.category}
              onCategorySelect={(category) => updateFormData({ category })}
              transactionType={formData.type}
              description={formData.description}
              amount={parseAmountFromInput(formData.amount)}
              recentCategories={recentCategories}
            />
            {errors.category && (
              <Text style={styles.errorText}>{errors.category}</Text>
            )}
          </View>

          {/* Account Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <TouchableOpacity
              style={[
                styles.accountSelector,
                errors.accountId && styles.inputError,
              ]}
              onPress={() => {
                Alert.alert(
                  'Select Account',
                  'Choose the account for this transaction',
                  accounts.map(account => ({
                    text: `${account.name} (${formatCurrency(account.balance, account.currency)})`,
                    onPress: () => updateFormData({ accountId: account.id }),
                  })).concat([{ text: 'Cancel', style: 'cancel' }])
                );
              }}
            >
              <View style={styles.accountInfo}>
                {selectedAccount ? (
                  <>
                    <Text style={styles.accountName}>{selectedAccount.name}</Text>
                    <Text style={styles.accountBalance}>
                      Balance: {formatCurrency(selectedAccount.balance, selectedAccount.currency)}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.accountPlaceholder}>Select account</Text>
                )}
              </View>
              <Ionicons name="chevron-down" size={20} color={COLORS.TEXT_SECONDARY} />
            </TouchableOpacity>
            {errors.accountId && (
              <Text style={styles.errorText}>{errors.accountId}</Text>
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
              <View style={styles.dateActions}>
                <TouchableOpacity
                  style={styles.quickDateButton}
                  onPress={() => updateFormData({ date: new Date() })}
                >
                  <Text style={styles.quickDateText}>Today</Text>
                </TouchableOpacity>
              </View>
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

        {/* Smart Suggestions Panel */}
        {showSmartSuggestions && smartSuggestions.length > 0 && (
          <Animated.View style={[
            styles.smartSuggestionsPanel,
            {
              opacity: smartPanelAnim,
              transform: [
                {
                  translateY: smartPanelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                  }),
                },
              ],
            },
          ]}>
            <View style={styles.smartHeader}>
              <View style={styles.smartTitleContainer}>
                <Ionicons name="bulb" size={16} color={COLORS.WARNING} />
                <Text style={styles.smartTitle}>Smart Suggestions</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Animated.timing(smartPanelAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                  }).start(() => {
                    setShowSmartSuggestions(false);
                  });
                }}
              >
                <Ionicons name="close" size={20} color={COLORS.TEXT_SECONDARY} />
              </TouchableOpacity>
            </View>
            
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsContainer}
            >
              {smartSuggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={suggestion.id}
                  style={styles.suggestionCard}
                  onPress={() => applySuggestion(suggestion)}
                >
                  <View style={styles.suggestionHeader}>
                    <Ionicons 
                      name={suggestion.icon as any} 
                      size={16} 
                      color={COLORS.PRIMARY} 
                    />
                    <View style={[
                      styles.confidenceBadge,
                      { backgroundColor: getConfidenceColor(suggestion.confidence) },
                    ]}>
                      <Text style={styles.confidenceText}>
                        {Math.round(suggestion.confidence * 100)}%
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                  <Text style={styles.suggestionSubtitle}>{suggestion.subtitle}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
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
  );
};

// Helper functions

function getSmartCategoryMatches(description: string, categories: Category[]): Array<{ category: Category; confidence: number }> {
  const matches: Array<{ category: Category; confidence: number }> = [];
  
  const keywords = {
    'food & dining': ['restaurant', 'food', 'lunch', 'dinner', 'coffee', 'pizza', 'meal', 'eat'],
    'transportation': ['uber', 'taxi', 'gas', 'fuel', 'parking', 'metro', 'bus', 'transport'],
    'shopping': ['store', 'amazon', 'mall', 'buy', 'purchase', 'shop', 'retail'],
    'entertainment': ['movie', 'cinema', 'game', 'concert', 'show', 'streaming', 'entertainment'],
    'bills & utilities': ['electric', 'water', 'internet', 'phone', 'cable', 'bill', 'utility'],
    'health & medical': ['doctor', 'hospital', 'pharmacy', 'medicine', 'dental', 'health'],
  };
  
  categories.forEach(category => {
    const categoryLower = category.name.toLowerCase();
    let confidence = 0;
    
    // Direct name match
    if (description.includes(categoryLower) || categoryLower.includes(description)) {
      confidence = 0.9;
    } else {
      // Keyword matching
      const categoryKeywords = keywords[categoryLower] || [];
      const matchingKeywords = categoryKeywords.filter(keyword => 
        description.includes(keyword)
      );
      confidence = matchingKeywords.length * 0.2;
    }
    
    if (confidence > 0.3) {
      matches.push({ category, confidence: Math.min(confidence, 0.95) });
    }
  });
  
  return matches.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}

function getTimeBasedSuggestions(): SmartSuggestion[] {
  const now = new Date();
  const hour = now.getHours();
  const suggestions: SmartSuggestion[] = [];
  
  // Lunch time suggestions
  if (hour >= 11 && hour <= 14) {
    suggestions.push({
      id: 'lunch-suggestion',
      type: 'template',
      title: 'Lunch expense',
      subtitle: 'It\'s lunch time!',
      data: {
        description: 'Lunch',
        category: 'Food & Dining',
        type: 'expense',
        amount: '15.00',
      },
      confidence: 0.7,
      icon: 'restaurant-outline',
    });
  }
  
  // Coffee time suggestions
  if ((hour >= 7 && hour <= 10) || (hour >= 14 && hour <= 16)) {
    suggestions.push({
      id: 'coffee-suggestion',
      type: 'template',
      title: 'Coffee break',
      subtitle: 'Perfect time for coffee!',
      data: {
        description: 'Coffee',
        category: 'Food & Dining',
        type: 'expense',
        amount: '5.50',
      },
      confidence: 0.6,
      icon: 'cafe-outline',
    });
  }
  
  return suggestions;
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return COLORS.SUCCESS;
  if (confidence >= 0.6) return COLORS.WARNING;
  if (confidence >= 0.4) return COLORS.INFO;
  return COLORS.TEXT_SECONDARY;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingText: {
    marginTop: SPACING.MD,
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
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
    flex: 1,
  },
  dateActions: {
    flexDirection: 'row',
    gap: SPACING.SM,
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
  smartSuggestionsPanel: {
    backgroundColor: COLORS.SURFACE,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    padding: SPACING.MD,
    maxHeight: 150,
  },
  smartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.SM,
  },
  smartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  smartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
  },
  suggestionsContainer: {
    gap: SPACING.SM,
  },
  suggestionCard: {
    backgroundColor: COLORS.BACKGROUND,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    padding: SPACING.SM,
    width: 140,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.XS,
  },
  confidenceBadge: {
    paddingHorizontal: SPACING.XS,
    paddingVertical: 1,
    borderRadius: 6,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: FONTS.BOLD,
  },
  suggestionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
    marginBottom: 2,
  },
  suggestionSubtitle: {
    fontSize: 10,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
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