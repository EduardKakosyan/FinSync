import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '@/constants';
import { formatCurrency, parseAmountFromInput, isValidAmountInput } from '@/utils/currencyUtils';

interface SmartAmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
  currency: 'CAD' | 'USD';
  transactionType: 'income' | 'expense';
  placeholder?: string;
  error?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  suggestedAmounts?: number[];
  recentAmounts?: number[];
}

interface QuickAmount {
  amount: number;
  label: string;
  type: 'suggested' | 'recent' | 'quick';
}

const SmartAmountInput: React.FC<SmartAmountInputProps> = ({
  value,
  onChangeText,
  currency,
  transactionType,
  placeholder = '0.00',
  error,
  autoFocus = false,
  disabled = false,
  onFocus,
  onBlur,
  suggestedAmounts = [],
  recentAmounts = [],
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showQuickAmounts, setShowQuickAmounts] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(1));

  // Quick amount presets
  const quickAmounts: QuickAmount[] = [
    { amount: 5, label: '$5', type: 'quick' },
    { amount: 10, label: '$10', type: 'quick' },
    { amount: 20, label: '$20', type: 'quick' },
    { amount: 50, label: '$50', type: 'quick' },
    { amount: 100, label: '$100', type: 'quick' },
    { amount: 200, label: '$200', type: 'quick' },
  ];

  // Combine all amounts
  const allQuickAmounts: QuickAmount[] = [
    ...recentAmounts.slice(0, 3).map(amount => ({
      amount,
      label: formatCurrency(amount, currency, false),
      type: 'recent' as const,
    })),
    ...suggestedAmounts.slice(0, 2).map(amount => ({
      amount,
      label: formatCurrency(amount, currency, false),
      type: 'suggested' as const,
    })),
    ...quickAmounts.filter(qa => 
      !recentAmounts.includes(qa.amount) && 
      !suggestedAmounts.includes(qa.amount)
    ).slice(0, 4),
  ];

  const currencySymbol = currency === 'CAD' ? '$' : '$';
  const parsedAmount = parseAmountFromInput(value);
  const isValidAmount = isValidAmountInput(value);

  useEffect(() => {
    if (showQuickAmounts) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [showQuickAmounts, fadeAnim]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    // Don't show quick amounts on iOS to avoid focus conflicts
    if (Platform.OS !== 'ios') {
      setShowQuickAmounts(true);
    }
    onFocus?.();
    
    // Gentle haptic feedback
    if (Platform.OS === 'ios') {
      Vibration.vibrate([10]);
    }
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setShowQuickAmounts(false);
    onBlur?.();
  }, [onBlur]);

  const handleQuickAmountPress = useCallback((amount: number) => {
    const formattedAmount = amount.toFixed(2);
    onChangeText(formattedAmount);
    
    // Animate button press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Vibration.vibrate([20]);
    }
    
    setShowQuickAmounts(false);
  }, [onChangeText, scaleAnim]);

  const getAmountColor = () => {
    if (error) return COLORS.DANGER;
    if (!value || parsedAmount === 0) return COLORS.TEXT_SECONDARY;
    if (transactionType === 'income') return COLORS.SUCCESS;
    return COLORS.DANGER;
  };

  const getQuickAmountColor = (type: QuickAmount['type']) => {
    switch (type) {
      case 'recent':
        return COLORS.INFO;
      case 'suggested':
        return COLORS.WARNING;
      default:
        return COLORS.PRIMARY;
    }
  };

  const getQuickAmountIcon = (type: QuickAmount['type']) => {
    switch (type) {
      case 'recent':
        return 'time-outline';
      case 'suggested':
        return 'bulb-outline';
      default:
        return 'cash-outline';
    }
  };

  // Simplified iOS version to avoid RemoteTextInput errors
  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <View style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
          disabled && styles.inputContainerDisabled,
        ]}>
          <Text style={[
            styles.currencySymbol,
            { color: getAmountColor() },
          ]}>
            {currencySymbol}
          </Text>
          
          <TextInput
            style={[
              styles.amountInput,
              { color: getAmountColor() },
            ]}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => { setIsFocused(true); onFocus?.(); }}
            onBlur={() => { setIsFocused(false); onBlur?.(); }}
            placeholder={placeholder}
            placeholderTextColor={COLORS.TEXT_SECONDARY}
            keyboardType="decimal-pad"
            editable={!disabled}
            maxLength={12}
            returnKeyType="done"
            autoCorrect={false}
            autoCapitalize="none"
            spellCheck={false}
          />
        </View>
        
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={14} color={COLORS.DANGER} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Main Amount Input */}
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        error && styles.inputContainerError,
        disabled && styles.inputContainerDisabled,
      ]}>
        <Text style={[
          styles.currencySymbol,
          { color: getAmountColor() },
        ]}>
          {currencySymbol}
        </Text>
        
        <TextInput
          style={[
            styles.amountInput,
            { color: getAmountColor() },
          ]}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={COLORS.TEXT_SECONDARY}
          keyboardType="decimal-pad"
          autoFocus={autoFocus}
          editable={!disabled}
          selectTextOnFocus={true}
          maxLength={12}
          returnKeyType="done"
          blurOnSubmit={true}
          autoCorrect={false}
          autoCapitalize="none"
          spellCheck={false}
        />
        
        {/* Amount Validation Indicator */}
        {value && (
          <View style={styles.validationIndicator}>
            {isValidAmount && parsedAmount > 0 ? (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={COLORS.SUCCESS}
              />
            ) : (
              <Ionicons
                name="alert-circle"
                size={20}
                color={COLORS.DANGER}
              />
            )}
          </View>
        )}
        
        {/* Calculator Icon */}
        <TouchableOpacity
          style={styles.calculatorButton}
          onPress={() => setShowQuickAmounts(!showQuickAmounts)}
          disabled={disabled}
        >
          <Ionicons
            name="calculator-outline"
            size={20}
            color={isFocused ? COLORS.PRIMARY : COLORS.TEXT_SECONDARY}
          />
        </TouchableOpacity>
      </View>

      {/* Formatted Amount Display */}
      {value && isValidAmount && parsedAmount > 0 && (
        <View style={styles.formattedAmountContainer}>
          <Text style={styles.formattedAmountLabel}>Amount:</Text>
          <Text style={[
            styles.formattedAmountText,
            { color: getAmountColor() },
          ]}>
            {formatCurrency(parsedAmount, currency)}
          </Text>
        </View>
      )}

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color={COLORS.DANGER} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Quick Amounts */}
      {showQuickAmounts && allQuickAmounts.length > 0 && (
        <Animated.View
          style={[
            styles.quickAmountsContainer,
            { opacity: fadeAnim },
          ]}
        >
          <Text style={styles.quickAmountsTitle}>Quick Amounts</Text>
          
          <View style={styles.quickAmountsGrid}>
            {allQuickAmounts.map((quickAmount, index) => (
              <Animated.View
                key={`${quickAmount.type}-${quickAmount.amount}`}
                style={[{ transform: [{ scale: scaleAnim }] }]}
              >
                <TouchableOpacity
                  style={[
                    styles.quickAmountButton,
                    { 
                      backgroundColor: getQuickAmountColor(quickAmount.type),
                      opacity: quickAmount.type === 'recent' ? 0.9 : 1,
                    },
                  ]}
                  onPress={() => handleQuickAmountPress(quickAmount.amount)}
                  delayPressIn={50}
                >
                  <Ionicons
                    name={getQuickAmountIcon(quickAmount.type)}
                    size={16}
                    color="white"
                    style={styles.quickAmountIcon}
                  />
                  <Text style={styles.quickAmountText}>
                    {quickAmount.label}
                  </Text>
                  {quickAmount.type === 'recent' && (
                    <View style={styles.recentBadge}>
                      <Text style={styles.recentBadgeText}>Recent</Text>
                    </View>
                  )}
                  {quickAmount.type === 'suggested' && (
                    <View style={styles.suggestedBadge}>
                      <Text style={styles.suggestedBadgeText}>Smart</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
          
          {/* Currency Conversion Hint */}
          {currency !== 'CAD' && (
            <View style={styles.conversionHint}>
              <Ionicons name="swap-horizontal" size={14} color={COLORS.TEXT_SECONDARY} />
              <Text style={styles.conversionHintText}>
                Amounts will be converted to {currency}
              </Text>
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.MD,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    borderRadius: 16,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    minHeight: 60,
  },
  inputContainerFocused: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: '#F8FAFF',
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputContainerError: {
    borderColor: COLORS.DANGER,
    backgroundColor: '#FFF8F8',
  },
  inputContainerDisabled: {
    opacity: 0.6,
    backgroundColor: COLORS.LIGHT,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: FONTS.BOLD,
    marginRight: SPACING.SM,
    minWidth: 20,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: FONTS.BOLD,
    textAlign: 'left',
    paddingVertical: SPACING.XS,
  },
  validationIndicator: {
    marginHorizontal: SPACING.SM,
  },
  calculatorButton: {
    padding: SPACING.XS,
    borderRadius: 8,
  },
  formattedAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.SM,
    paddingHorizontal: SPACING.MD,
  },
  formattedAmountLabel: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.MEDIUM,
    marginRight: SPACING.SM,
  },
  formattedAmountText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.SEMIBOLD,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.SM,
    paddingHorizontal: SPACING.MD,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.DANGER,
    fontFamily: FONTS.REGULAR,
    marginLeft: SPACING.XS,
    flex: 1,
  },
  quickAmountsContainer: {
    marginTop: SPACING.MD,
    padding: SPACING.MD,
    backgroundColor: COLORS.LIGHT,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  quickAmountsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  quickAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.SM,
  },
  quickAmountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: 20,
    minWidth: 80,
    position: 'relative',
  },
  quickAmountIcon: {
    marginRight: SPACING.XS,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    fontFamily: FONTS.SEMIBOLD,
  },
  recentBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.INFO,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  recentBadgeText: {
    fontSize: 8,
    color: 'white',
    fontWeight: 'bold',
    fontFamily: FONTS.BOLD,
  },
  suggestedBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.WARNING,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  suggestedBadgeText: {
    fontSize: 8,
    color: 'white',
    fontWeight: 'bold',
    fontFamily: FONTS.BOLD,
  },
  conversionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.SM,
    paddingTop: SPACING.SM,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  conversionHintText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
    marginLeft: SPACING.XS,
  },
});

export default SmartAmountInput;