/**
 * Design System for Halifax FinSync
 * 
 * This is the main entry point for the design system.
 * Import components and tokens from here to ensure consistency.
 */

// Design Tokens
export { DesignTokens, Colors, ThemeColors, Spacing, Typography as TypographyTokens, Layout, Animation, Breakpoints, Accessibility } from './tokens';

// Theme Provider
export { ThemeProvider, useTheme, useColors, useTokens, useIsDark } from './ThemeProvider';
export type { ColorScheme, ThemeContextValue } from './ThemeProvider';

// Core Components
export { Button } from './components/Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './components/Button';

export { Card } from './components/Card';
export type { CardProps, CardVariant } from './components/Card';

export { Input } from './components/Input';
export type { InputProps } from './components/Input';

export { 
  Typography, 
  Heading1, 
  Heading2, 
  Heading3, 
  Heading4, 
  Heading5, 
  Heading6,
  BodyText,
  BodyTextLarge,
  BodyTextSmall,
  Label,
  LabelSmall,
  Caption,
  Amount,
  AmountLarge
} from './components/Typography';
export type { TypographyProps, TypographyVariant, TextColor } from './components/Typography';

// Layout Components
export {
  ResponsiveContainer,
  Grid,
  Stack,
  ResponsiveLayout,
  SafeScroll,
  useResponsiveValue,
  useResponsiveDimensions
} from './components/Layout';
export type {
  ResponsiveContainerProps,
  GridProps,
  StackProps,
  ResponsiveLayoutProps,
  SafeScrollProps
} from './components/Layout';

// Re-export commonly used types for convenience
export type {
  ColorScheme as Theme,
} from './ThemeProvider';