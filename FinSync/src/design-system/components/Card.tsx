import React, { ReactNode } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../ThemeProvider';

export type CardVariant = 'default' | 'elevated' | 'outlined';

export interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  padding?: keyof typeof import('../tokens').Spacing;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'article' | 'summary' | undefined;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  onPress,
  style,
  testID,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
}) => {
  const { colors, tokens } = useTheme();

  const getCardStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: tokens.Layout.borderRadius.lg,
      padding: tokens.Spacing[padding],
    };

    const variantStyles: Record<CardVariant, ViewStyle> = {
      default: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        ...tokens.Layout.shadows.sm,
      },
      elevated: {
        backgroundColor: colors.surfaceElevated,
        borderWidth: 0,
        ...tokens.Layout.shadows.md,
      },
      outlined: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border,
        shadowOpacity: 0,
        elevation: 0,
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
    };
  };

  const cardStyles = getCardStyles();

  if (onPress) {
    return (
      <TouchableOpacity
        style={[cardStyles, style]}
        onPress={onPress}
        activeOpacity={0.8}
        testID={testID}
        accessibilityRole={accessibilityRole || 'button'}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[cardStyles, style]}
      testID={testID}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  );
};

export default Card;