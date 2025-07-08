import React, { forwardRef, ReactNode, useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../ThemeProvider';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onRightIconPress?: () => void;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  multiline?: boolean;
  numberOfLines?: number;
  testID?: string;
}

export const Input = forwardRef<TextInput, InputProps>(({
  label,
  placeholder,
  error,
  hint,
  disabled = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  inputStyle,
  multiline = false,
  numberOfLines = 1,
  testID,
  onFocus,
  onBlur,
  ...textInputProps
}, ref) => {
  const { colors, tokens } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const getInputContainerStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: tokens.Layout.borderRadius.md,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: multiline ? 'flex-start' : 'center',
      minHeight: tokens.Layout.touchTarget.minimum,
      paddingHorizontal: tokens.Spacing.md,
      paddingVertical: multiline ? tokens.Spacing.md : tokens.Spacing.sm,
    };

    let variantStyle: ViewStyle;

    if (error) {
      variantStyle = {
        backgroundColor: colors.surface,
        borderColor: colors.error,
      };
    } else if (isFocused) {
      variantStyle = {
        backgroundColor: colors.background,
        borderColor: colors.primary,
        ...tokens.Layout.shadows.sm,
      };
    } else {
      variantStyle = {
        backgroundColor: disabled ? colors.border : colors.surface,
        borderColor: colors.border,
      };
    }

    return {
      ...baseStyle,
      ...variantStyle,
    };
  };

  const getInputStyles = (): TextStyle => {
    return {
      flex: 1,
      fontSize: tokens.Typography.textStyles.body.fontSize,
      lineHeight: tokens.Typography.textStyles.body.lineHeight,
      fontFamily: tokens.Typography.fonts.primary,
      color: disabled ? colors.textTertiary : colors.textPrimary,
      textAlignVertical: multiline ? 'top' : 'center',
      paddingVertical: 0, // Remove default padding to control it via container
    };
  };

  const getLabelStyles = (): TextStyle => {
    return {
      fontSize: tokens.Typography.textStyles.label.fontSize,
      lineHeight: tokens.Typography.textStyles.label.lineHeight,
      fontFamily: tokens.Typography.fonts.primaryMedium,
      color: colors.textPrimary,
      marginBottom: tokens.Spacing.xs,
    };
  };

  const getHelpTextStyles = (isError: boolean): TextStyle => {
    return {
      fontSize: tokens.Typography.textStyles.caption.fontSize,
      lineHeight: tokens.Typography.textStyles.caption.lineHeight,
      fontFamily: tokens.Typography.fonts.primary,
      color: isError ? colors.error : colors.textSecondary,
      marginTop: tokens.Spacing.xs,
    };
  };

  const inputContainerStyles = getInputContainerStyles();
  const inputStyles = getInputStyles();
  const labelStyles = getLabelStyles();

  return (
    <View style={style}>
      {label && (
        <Text style={labelStyles}>{label}</Text>
      )}
      
      <View style={inputContainerStyles}>
        {leftIcon && (
          <View style={[styles.iconContainer, { marginRight: tokens.Spacing.sm }]}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          ref={ref}
          style={[inputStyles, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          multiline={multiline}
          numberOfLines={numberOfLines}
          testID={testID}
          accessibilityLabel={label || placeholder}
          accessibilityState={{
            disabled,
          }}
          {...textInputProps}
        />
        
        {rightIcon && (
          <TouchableOpacity
            style={[styles.iconContainer, { marginLeft: tokens.Spacing.sm }]}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            accessibilityRole={onRightIconPress ? 'button' : undefined}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {(error || hint) && (
        <Text style={getHelpTextStyles(!!error)}>
          {error || hint}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

Input.displayName = 'Input';

export default Input;