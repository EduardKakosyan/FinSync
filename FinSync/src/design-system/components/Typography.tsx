import React, { ReactNode } from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { useTheme } from '../ThemeProvider';

export type TypographyVariant = 
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'bodyLarge' | 'body' | 'bodySmall'
  | 'label' | 'labelSmall' | 'caption'
  | 'amount' | 'amountLarge'
  | 'button' | 'buttonSmall';

export type TextColor = 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'error' | 'success' | 'warning';

export interface TypographyProps {
  children: ReactNode;
  variant?: TypographyVariant;
  color?: TextColor;
  align?: 'left' | 'center' | 'right';
  style?: TextStyle;
  numberOfLines?: number;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityRole?: 'text' | 'header' | undefined;
}

export const Typography: React.FC<TypographyProps> = ({
  children,
  variant = 'body',
  color = 'primary',
  align = 'left',
  style,
  numberOfLines,
  testID,
  accessibilityLabel,
  accessibilityRole,
  ...textProps
}) => {
  const { colors, tokens } = useTheme();

  const getTextStyles = (): TextStyle => {
    // Base variant styles from design tokens
    const variantStyles = tokens.Typography.textStyles[variant];
    
    // Color mapping
    const colorMap: Record<TextColor, string> = {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
      tertiary: colors.textTertiary,
      inverse: colors.textInverse,
      error: colors.error,
      success: colors.success,
      warning: colors.warning,
    };

    // Font family mapping for special variants
    const getFontFamily = (): string => {
      if (variant.includes('amount')) {
        return tokens.Typography.fonts.monospace;
      }
      if (variant.includes('button') || variant === 'label' || variant === 'labelSmall') {
        return tokens.Typography.fonts.primaryMedium;
      }
      if (variant.startsWith('h')) {
        return tokens.Typography.fonts.primaryBold;
      }
      return tokens.Typography.fonts.primary;
    };

    return {
      fontSize: variantStyles.fontSize,
      lineHeight: variantStyles.fontSize * variantStyles.lineHeight,
      fontWeight: variantStyles.fontWeight,
      letterSpacing: variantStyles.letterSpacing,
      fontFamily: getFontFamily(),
      color: colorMap[color],
      textAlign: align,
    };
  };

  const getAccessibilityRole = () => {
    if (accessibilityRole) return accessibilityRole;
    if (variant.startsWith('h')) return 'header';
    return 'text';
  };

  const textStyles = getTextStyles();

  return (
    <Text
      style={[textStyles, style]}
      numberOfLines={numberOfLines}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={getAccessibilityRole()}
      {...textProps}
    >
      {children}
    </Text>
  );
};

// Convenience components for common use cases
export const Heading1: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h1" {...props} />
);

export const Heading2: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h2" {...props} />
);

export const Heading3: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h3" {...props} />
);

export const Heading4: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h4" {...props} />
);

export const Heading5: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h5" {...props} />
);

export const Heading6: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h6" {...props} />
);

export const BodyText: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="body" {...props} />
);

export const BodyTextLarge: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="bodyLarge" {...props} />
);

export const BodyTextSmall: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="bodySmall" {...props} />
);

export const Label: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="label" {...props} />
);

export const LabelSmall: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="labelSmall" {...props} />
);

export const Caption: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="caption" {...props} />
);

export const Amount: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="amount" {...props} />
);

export const AmountLarge: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="amountLarge" {...props} />
);

export default Typography;