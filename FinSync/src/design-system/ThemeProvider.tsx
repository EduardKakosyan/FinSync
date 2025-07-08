import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeColors, DesignTokens } from './tokens';

export type ColorScheme = 'light' | 'dark';

export interface ThemeContextValue {
  colorScheme: ColorScheme;
  colors: typeof ThemeColors.light;
  tokens: typeof DesignTokens;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  colorScheme?: ColorScheme; // Optional override for manual theme setting
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  colorScheme: overrideColorScheme 
}) => {
  const systemColorScheme = useColorScheme();
  const activeColorScheme = overrideColorScheme || systemColorScheme || 'light';
  
  const isDark = activeColorScheme === 'dark';
  const colors = isDark ? ThemeColors.dark : ThemeColors.light;

  const value: ThemeContextValue = {
    colorScheme: activeColorScheme,
    colors,
    tokens: DesignTokens,
    isDark,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Convenience hooks for common use cases
export const useColors = () => useTheme().colors;
export const useTokens = () => useTheme().tokens;
export const useIsDark = () => useTheme().isDark;