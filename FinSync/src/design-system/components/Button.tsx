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

  const getButtonStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: tokens.Layout.borderRadius.md,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: tokens.Layout.touchTarget.minimum,
    };

    // Size styles
    const sizeStyles: Record<ButtonSize, ViewStyle> = {
      small: {
        paddingHorizontal: tokens.Spacing.md,
        paddingVertical: tokens.Spacing.sm,
        minHeight: tokens.Layout.touchTarget.comfortable - 8,
      },
      medium: {
        paddingHorizontal: tokens.Spacing.lg,
        paddingVertical: tokens.Spacing.md,
        minHeight: tokens.Layout.touchTarget.minimum,
      },
      large: {
        paddingHorizontal: tokens.Spacing.xl,
        paddingVertical: tokens.Spacing.lg,
        minHeight: tokens.Layout.touchTarget.large,
      },
    };

    // Variant styles
    const variantStyles: Record<ButtonVariant, ViewStyle> = {
      primary: {
        backgroundColor: disabled ? colors.border : colors.primary,
        borderColor: disabled ? colors.border : colors.primary,
        ...tokens.Layout.shadows.sm,
      },
      secondary: {
        backgroundColor: 'transparent',
        borderColor: disabled ? colors.border : colors.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
      },
      destructive: {
        backgroundColor: disabled ? colors.border : colors.error,
        borderColor: disabled ? colors.border : colors.error,
        ...tokens.Layout.shadows.sm,
      },
    };

    const fullWidthStyle: ViewStyle = fullWidth ? { width: '100%' } : {};

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...fullWidthStyle,
    };
  };

  const getTextStyles = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontFamily: tokens.Typography.fonts.primary,
      fontWeight: '600',
      textAlign: 'center',
    };

    // Size text styles
    const sizeTextStyles: Record<ButtonSize, TextStyle> = {
      small: {
        fontSize: tokens.Typography.textStyles.buttonSmall.fontSize,
        lineHeight: tokens.Typography.textStyles.buttonSmall.lineHeight,
      },
      medium: {
        fontSize: tokens.Typography.textStyles.button.fontSize,
        lineHeight: tokens.Typography.textStyles.button.lineHeight,
      },
      large: {
        fontSize: tokens.Typography.textStyles.button.fontSize,
        lineHeight: tokens.Typography.textStyles.button.lineHeight,
      },
    };

    // Variant text styles
    const variantTextStyles: Record<ButtonVariant, TextStyle> = {
      primary: {
        color: disabled ? colors.textTertiary : '#FFFFFF',
      },
      secondary: {
        color: disabled ? colors.textTertiary : colors.primary,
      },
      ghost: {
        color: disabled ? colors.textTertiary : colors.primary,
      },
      destructive: {
        color: disabled ? colors.textTertiary : '#FFFFFF',
      },
    };

    return {
      ...baseTextStyle,
      ...sizeTextStyles[size],
      ...variantTextStyles[variant],
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
          style={{ marginRight: showContent ? tokens.Spacing.sm : 0 }}
        />
      )}
      
      {showContent && (
        <View style={styles.contentContainer}>
          {leftIcon && (
            <View style={[styles.iconContainer, { marginRight: tokens.Spacing.sm }]}>
              {leftIcon}
            </View>
          )}
          
          <Text style={[textStyles, textStyle]}>
            {children}
          </Text>
          
          {rightIcon && (
            <View style={[styles.iconContainer, { marginLeft: tokens.Spacing.sm }]}>
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