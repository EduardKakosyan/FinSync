import React, { ReactNode } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { useTheme } from '../ThemeProvider';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: { selected?: boolean; disabled?: boolean; busy?: boolean };
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  onPress,
  style,
  textStyle,
  testID,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  leftIcon,
  rightIcon,
}) => {
  const { colors, tokens } = useTheme();

  // Simplified button styles
  const getButtonStyles = (): ViewStyle => {
    const base: ViewStyle = {
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
    };

    // Size styles
    let sizeStyle: ViewStyle = {};
    switch (size) {
      case 'small':
        sizeStyle = {
          paddingHorizontal: 16,
          paddingVertical: 8,
          minHeight: 36,
        };
        break;
      case 'medium':
        sizeStyle = {
          paddingHorizontal: 24,
          paddingVertical: 12,
          minHeight: 44,
        };
        break;
      case 'large':
        sizeStyle = {
          paddingHorizontal: 32,
          paddingVertical: 16,
          minHeight: 52,
        };
        break;
    }

    // Variant styles
    let variantStyle: ViewStyle = {};
    switch (variant) {
      case 'primary':
        variantStyle = {
          backgroundColor: disabled ? '#9CA3AF' : colors.primary,
          borderColor: disabled ? '#9CA3AF' : colors.primary,
        };
        break;
      case 'secondary':
        variantStyle = {
          backgroundColor: 'transparent',
          borderColor: disabled ? '#9CA3AF' : colors.primary,
        };
        break;
      case 'ghost':
        variantStyle = {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
        break;
      case 'destructive':
        variantStyle = {
          backgroundColor: disabled ? '#9CA3AF' : colors.error,
          borderColor: disabled ? '#9CA3AF' : colors.error,
        };
        break;
    }

    const fullWidthStyle: ViewStyle = fullWidth ? { width: '100%' } : {};

    return {
      ...base,
      ...sizeStyle,
      ...variantStyle,
      ...fullWidthStyle,
    };
  };

  // Simplified text styles
  const getTextStyles = (): TextStyle => {
    const base: TextStyle = {
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
      fontFamily: 'System',
    };

    // Size text styles
    let sizeTextStyle: TextStyle = {};
    switch (size) {
      case 'small':
        sizeTextStyle = { fontSize: 14 };
        break;
      case 'medium':
        sizeTextStyle = { fontSize: 16 };
        break;
      case 'large':
        sizeTextStyle = { fontSize: 16 };
        break;
    }

    // Variant text styles - Use explicit colors
    let variantTextStyle: TextStyle = {};
    switch (variant) {
      case 'primary':
        variantTextStyle = {
          color: disabled ? '#6B7280' : '#FFFFFF',
        };
        break;
      case 'secondary':
        variantTextStyle = {
          color: disabled ? '#6B7280' : colors.primary,
        };
        break;
      case 'ghost':
        variantTextStyle = {
          color: disabled ? '#6B7280' : colors.primary,
        };
        break;
      case 'destructive':
        variantTextStyle = {
          color: disabled ? '#6B7280' : '#FFFFFF',
        };
        break;
    }

    return {
      ...base,
      ...sizeTextStyle,
      ...variantTextStyle,
    };
  };

  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      onPress();
    }
  };

  const buttonStyles = getButtonStyles();
  const textStyles = getTextStyles();

  const showLoadingSpinner = loading;
  const showContent = !loading;

  const spinnerColor = variant === 'primary' || variant === 'destructive' 
    ? '#FFFFFF' 
    : colors.primary;

  return (
    <TouchableOpacity
      style={[buttonStyles, style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
        ...accessibilityState,
      }}
    >
      {showLoadingSpinner && (
        <ActivityIndicator 
          size="small" 
          color={spinnerColor}
          style={{ marginRight: showContent ? 8 : 0 }}
        />
      )}
      
      {showContent && (
        <View style={styles.contentContainer}>
          {leftIcon && (
            <View style={[styles.iconContainer, { marginRight: 8 }]}>
              {leftIcon}
            </View>
          )}
          
          <Text style={[textStyles, textStyle]}>
            {children}
          </Text>
          
          {rightIcon && (
            <View style={[styles.iconContainer, { marginLeft: 8 }]}>
              {rightIcon}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Button;