import React, { ReactNode, useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import { useTokens } from '../ThemeProvider';

export interface ResponsiveContainerProps {
  children: ReactNode;
  style?: ViewStyle;
  maxWidth?: number;
  padding?: keyof typeof import('../tokens').Spacing;
  centered?: boolean;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  style,
  maxWidth = 768, // Standard tablet breakpoint
  padding = 'md',
  centered = true,
}) => {
  const tokens = useTokens();
  const { width: screenWidth } = useResponsiveDimensions();

  const containerStyle: ViewStyle = {
    flex: 1,
    paddingHorizontal: tokens.Spacing[padding],
    maxWidth: screenWidth > maxWidth ? maxWidth : screenWidth,
    width: '100%',
    ...(centered && screenWidth > maxWidth ? { alignSelf: 'center' } : {}),
  };

  return (
    <View style={[containerStyle, style]}>
      {children}
    </View>
  );
};

export interface GridProps {
  children: ReactNode;
  columns?: number;
  spacing?: keyof typeof import('../tokens').Spacing;
  style?: ViewStyle;
  minItemWidth?: number;
}

export const Grid: React.FC<GridProps> = ({
  children,
  columns,
  spacing = 'md',
  style,
  minItemWidth = 200,
}) => {
  const tokens = useTokens();
  const { width: screenWidth } = useResponsiveDimensions();
  
  // Calculate responsive columns based on screen width
  const getResponsiveColumns = (): number => {
    if (columns) return columns;
    
    const availableWidth = screenWidth - (tokens.Spacing[spacing] * 2);
    const calculatedColumns = Math.floor(availableWidth / (minItemWidth + tokens.Spacing[spacing]));
    return Math.max(1, calculatedColumns);
  };

  const numColumns = getResponsiveColumns();
  const gap = tokens.Spacing[spacing];

  return (
    <View style={[styles.grid, { gap }, style]}>
      {React.Children.map(children, (child, index) => (
        <View
          style={[
            styles.gridItem,
            {
              flex: 1,
              minWidth: minItemWidth,
              maxWidth: `${100 / numColumns}%`,
            },
          ]}
        >
          {child}
        </View>
      ))}
    </View>
  );
};

export interface StackProps {
  children: ReactNode;
  direction?: 'row' | 'column';
  spacing?: keyof typeof import('../tokens').Spacing;
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  wrap?: boolean;
  style?: ViewStyle;
}

export const Stack: React.FC<StackProps> = ({
  children,
  direction = 'column',
  spacing = 'md',
  align = 'stretch',
  justify = 'flex-start',
  wrap = false,
  style,
}) => {
  const tokens = useTokens();
  const gap = tokens.Spacing[spacing];

  const stackStyle: ViewStyle = {
    flexDirection: direction,
    alignItems: align,
    justifyContent: justify,
    flexWrap: wrap ? 'wrap' : 'nowrap',
    gap,
  };

  return (
    <View style={[stackStyle, style]}>
      {children}
    </View>
  );
};

export interface ResponsiveLayoutProps {
  children: ReactNode;
  breakpoint?: number;
  mobileLayout: ReactNode;
  tabletLayout?: ReactNode;
  style?: ViewStyle;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  breakpoint = 768,
  mobileLayout,
  tabletLayout,
  style,
}) => {
  const { width: screenWidth } = useResponsiveDimensions();
  const isTablet = screenWidth >= breakpoint;

  return (
    <View style={[{ flex: 1 }, style]}>
      {isTablet && tabletLayout ? tabletLayout : mobileLayout}
      {children}
    </View>
  );
};

export interface SafeScrollProps {
  children: ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  refreshControl?: React.ReactElement;
  showsVerticalScrollIndicator?: boolean;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
}

export const SafeScroll: React.FC<SafeScrollProps> = ({
  children,
  style,
  contentContainerStyle,
  refreshControl,
  showsVerticalScrollIndicator = false,
  keyboardShouldPersistTaps = 'handled',
}) => {
  const tokens = useTokens();

  return (
    <ScrollView
      style={[{ flex: 1 }, style]}
      contentContainerStyle={[
        {
          paddingBottom: tokens.Spacing.xl, // Safe area for bottom navigation
        },
        contentContainerStyle,
      ]}
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
    >
      {children}
    </ScrollView>
  );
};

// Hook for responsive dimensions
export const useResponsiveDimensions = () => {
  const dimensions = Dimensions.get('window');
  
  return {
    width: dimensions.width,
    height: dimensions.height,
    isTablet: dimensions.width >= 768,
    isLargeTablet: dimensions.width >= 1024,
    isPhone: dimensions.width < 768,
    isIPhone13Pro: dimensions.width === 390 && dimensions.height === 844,
    isCompactPhone: dimensions.width < 390, // Phones smaller than iPhone 13 Pro
    orientation: dimensions.width > dimensions.height ? 'landscape' : 'portrait',
  };
};

// Hook for responsive values
export const useResponsiveValue = <T,>(
  mobile: T,
  tablet?: T,
  breakpoint: number = 768
): T => {
  const { width: screenWidth } = useResponsiveDimensions();
  const isTablet = screenWidth >= breakpoint;
  return isTablet && tablet !== undefined ? tablet : mobile;
};

// Hook for iPhone 13 Pro optimized spacing
export const useOptimizedSpacing = () => {
  const { isIPhone13Pro, isCompactPhone, width } = useResponsiveDimensions();
  const tokens = useTokens();
  
  if (isIPhone13Pro) {
    return {
      screenPadding: tokens.Spacing.iphone13Pro.screenPadding,
      cardSpacing: tokens.Spacing.iphone13Pro.cardSpacing,
      sectionSpacing: tokens.Spacing.iphone13Pro.sectionSpacing,
      headerSpacing: tokens.Spacing.iphone13Pro.headerSpacing,
      contentSpacing: tokens.Spacing.iphone13Pro.contentSpacing,
      bottomSafe: tokens.Spacing.iphone13Pro.bottomSafe,
      topSafe: tokens.Spacing.iphone13Pro.topSafe,
      verticalTight: tokens.Spacing.iphone13Pro.verticalTight,
      verticalNormal: tokens.Spacing.iphone13Pro.verticalNormal,
      verticalRelaxed: tokens.Spacing.iphone13Pro.verticalRelaxed,
      verticalLoose: tokens.Spacing.iphone13Pro.verticalLoose,
    };
  }
  
  // Fallback for other devices
  return {
    screenPadding: isCompactPhone ? tokens.Spacing.md : tokens.Spacing.lg,
    cardSpacing: tokens.Spacing.md,
    sectionSpacing: tokens.Spacing.lg,
    headerSpacing: tokens.Spacing.lg,
    contentSpacing: tokens.Spacing.md,
    bottomSafe: tokens.Spacing.xl,
    topSafe: tokens.Spacing.md,
    verticalTight: tokens.Spacing.sm,
    verticalNormal: tokens.Spacing.md,
    verticalRelaxed: tokens.Spacing.lg,
    verticalLoose: tokens.Spacing.xl,
  };
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    flexGrow: 1,
  },
});

export default {
  ResponsiveContainer,
  Grid,
  Stack,
  ResponsiveLayout,
  SafeScroll,
  useResponsiveValue,
  useResponsiveDimensions,
  useOptimizedSpacing,
};