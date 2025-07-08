/**
 * Design System Tokens for Halifax FinSync
 * 
 * This file contains all design tokens (colors, spacing, typography, etc.)
 * that define the visual language of the application.
 */

// =============================================================================
// COLOR SYSTEM
// =============================================================================

export const Colors = {
  // Primary Brand Colors
  primary: {
    50: '#E3F2FD',
    100: '#BBDEFB', 
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#007AFF', // Main brand color
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
  },

  // Secondary Colors
  secondary: {
    50: '#F3E5F5',
    100: '#E1BEE7',
    200: '#CE93D8',
    300: '#BA68C8',
    400: '#AB47BC',
    500: '#5856D6', // Secondary brand
    600: '#8E24AA',
    700: '#7B1FA2',
    800: '#6A1B9A',
    900: '#4A148C',
  },

  // Neutral Colors
  neutral: {
    0: '#FFFFFF',
    50: '#F8F9FA',
    100: '#F2F2F7',
    200: '#E5E5EA',
    300: '#D1D1D6',
    400: '#C7C7CC',
    500: '#AEAEB2',
    600: '#8E8E93',
    700: '#636366',
    800: '#48484A',
    900: '#1C1C1E',
    1000: '#000000',
  },

  // Semantic Colors
  success: {
    50: '#E8F5E8',
    100: '#C3E6C3',
    200: '#9DD69D',
    300: '#76C576',
    400: '#5AB85A',
    500: '#34C759', // Main success
    600: '#30B34B',
    700: '#2B9D3F',
    800: '#268833',
    900: '#1F6626',
  },

  error: {
    50: '#FFF2F2',
    100: '#FFDBDB',
    200: '#FFC4C4',
    300: '#FFACAC',
    400: '#FF9B9B',
    500: '#FF3B30', // Main error
    600: '#E63529',
    700: '#CC2E22',
    800: '#B3281C',
    900: '#991E13',
  },

  warning: {
    50: '#FFF8E1',
    100: '#FFECB3',
    200: '#FFE082',
    300: '#FFD54F',
    400: '#FFCA28',
    500: '#FF9500', // Main warning
    600: '#FFB300',
    700: '#FFA000',
    800: '#FF8F00',
    900: '#FF6F00',
  },

  info: {
    50: '#E3F2FD',
    100: '#B3E5FC',
    200: '#81D4FA',
    300: '#4FC3F7',
    400: '#29B6F6',
    500: '#5AC8FA', // Main info
    600: '#0288D1',
    700: '#0277BD',
    800: '#01579B',
    900: '#014975',
  },

  // Financial-specific colors
  financial: {
    income: '#34C759',      // Green for income
    expense: '#FF3B30',     // Red for expenses  
    investment: '#5856D6',  // Purple for investments
    savings: '#007AFF',     // Blue for savings
    debt: '#FF9500',        // Orange for debt
    neutral: '#8E8E93',     // Gray for neutral
  },

  // Category colors (for transaction categories)
  categories: {
    food: '#FF6B6B',
    transportation: '#4ECDC4', 
    shopping: '#45B7D1',
    entertainment: '#96CEB4',
    bills: '#FFEAA7',
    health: '#DDA0DD',
    education: '#98D8C8',
    travel: '#F7DC6F',
    business: '#BB8FCE',
    other: '#AED6F1',
  },
} as const;

// Theme-aware colors
export const ThemeColors = {
  light: {
    // Backgrounds
    background: Colors.neutral[0],      // Pure white
    surface: Colors.neutral[50],        // Off-white
    surfaceElevated: Colors.neutral[0], // White with shadow
    
    // Text
    textPrimary: Colors.neutral[900],   // Near black
    textSecondary: Colors.neutral[600], // Medium gray
    textTertiary: Colors.neutral[500],  // Light gray
    textInverse: Colors.neutral[0],     // White
    
    // Borders & Dividers
    border: Colors.neutral[200],        // Light border
    divider: Colors.neutral[100],       // Very light divider
    
    // Interactive
    primary: Colors.primary[500],
    primaryPressed: Colors.primary[600],
    secondary: Colors.secondary[500],
    secondaryPressed: Colors.secondary[600],
    
    // Status
    success: Colors.success[500],
    error: Colors.error[500],
    warning: Colors.warning[500],
    info: Colors.info[500],
    
    // Overlays
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.1)',
  },
  
  dark: {
    // Backgrounds  
    background: Colors.neutral[900],    // Dark background
    surface: Colors.neutral[800],       // Slightly lighter
    surfaceElevated: Colors.neutral[700], // Elevated surface
    
    // Text
    textPrimary: Colors.neutral[0],     // White
    textSecondary: Colors.neutral[400], // Light gray
    textTertiary: Colors.neutral[500],  // Medium gray
    textInverse: Colors.neutral[900],   // Black
    
    // Borders & Dividers
    border: Colors.neutral[700],        // Dark border
    divider: Colors.neutral[800],       // Dark divider
    
    // Interactive
    primary: Colors.primary[400],
    primaryPressed: Colors.primary[500],
    secondary: Colors.secondary[400],
    secondaryPressed: Colors.secondary[500],
    
    // Status
    success: Colors.success[400],
    error: Colors.error[400],
    warning: Colors.warning[400],
    info: Colors.info[400],
    
    // Overlays
    overlay: 'rgba(0, 0, 0, 0.8)',
    overlayLight: 'rgba(255, 255, 255, 0.1)',
  },
} as const;

// =============================================================================
// SPACING SYSTEM
// =============================================================================

export const Spacing = {
  none: 0,
  xs: 4,     // 0.25rem
  sm: 8,     // 0.5rem  
  md: 16,    // 1rem
  lg: 24,    // 1.5rem
  xl: 32,    // 2rem
  xxl: 48,   // 3rem
  xxxl: 64,  // 4rem
  xxxxl: 96, // 6rem
  
  // iPhone 13 Pro specific optimizations (390x844 points)
  iphone13Pro: {
    // Screen-aware spacing for 390pt wide screen
    screenPadding: 16,    // Consistent horizontal padding
    cardSpacing: 12,      // Spacing between cards
    sectionSpacing: 20,   // Spacing between sections
    headerSpacing: 16,    // Header padding
    contentSpacing: 16,   // Content area padding
    bottomSafe: 32,       // Bottom safe area for home indicator
    topSafe: 16,          // Top safe area adjustment
    
    // Optimized vertical spacing for 844pt height
    verticalTight: 8,     // Tight vertical spacing
    verticalNormal: 16,   // Normal vertical spacing
    verticalRelaxed: 24,  // Relaxed vertical spacing
    verticalLoose: 32,    // Loose vertical spacing
  },
} as const;

// =============================================================================
// TYPOGRAPHY SYSTEM
// =============================================================================

export const Typography = {
  // Font families - React Native compliant
  fonts: {
    primary: 'System',           // iOS: SF Pro, Android: Roboto
    primaryMedium: 'System',     // Use with fontWeight: '500'
    primarySemiBold: 'System',   // Use with fontWeight: '600'
    primaryBold: 'System',       // Use with fontWeight: 'bold'
    monospace: 'Menlo',          // For numbers/amounts
  },

  // Font sizes
  fontSizes: {
    xs: 12,   // 0.75rem
    sm: 14,   // 0.875rem
    base: 16, // 1rem (base)
    lg: 18,   // 1.125rem
    xl: 20,   // 1.25rem
    xxl: 24,  // 1.5rem
    xxxl: 28, // 1.75rem
    xxxxl: 32, // 2rem
    xxxxxl: 36, // 2.25rem
    xxxxxxl: 48, // 3rem
  },

  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },

  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },

  // Text styles (semantic)
  textStyles: {
    // Headlines
    h1: {
      fontSize: 32,
      lineHeight: 1.2,
      fontWeight: 'bold',
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 28,
      lineHeight: 1.2,
      fontWeight: 'bold',
      letterSpacing: -0.5,
    },
    h3: {
      fontSize: 24,
      lineHeight: 1.3,
      fontWeight: '600',
      letterSpacing: 0,
    },
    h4: {
      fontSize: 20,
      lineHeight: 1.3,
      fontWeight: '600',
      letterSpacing: 0,
    },
    h5: {
      fontSize: 18,
      lineHeight: 1.4,
      fontWeight: '600',
      letterSpacing: 0,
    },
    h6: {
      fontSize: 16,
      lineHeight: 1.4,
      fontWeight: '600',
      letterSpacing: 0,
    },

    // Body text
    bodyLarge: {
      fontSize: 18,
      lineHeight: 1.6,
      fontWeight: 'normal',
      letterSpacing: 0,
    },
    body: {
      fontSize: 16,
      lineHeight: 1.6,
      fontWeight: 'normal',
      letterSpacing: 0,
    },
    bodySmall: {
      fontSize: 14,
      lineHeight: 1.4,
      fontWeight: 'normal',
      letterSpacing: 0,
    },

    // Labels & UI
    label: {
      fontSize: 14,
      lineHeight: 1.4,
      fontWeight: '500',
      letterSpacing: 0,
    },
    labelSmall: {
      fontSize: 12,
      lineHeight: 1.3,
      fontWeight: '500',
      letterSpacing: 0.5,
    },
    labelMedium: {
      fontSize: 16,
      lineHeight: 1.4,
      fontWeight: '600',
      letterSpacing: 0,
    },
    caption: {
      fontSize: 12,
      lineHeight: 1.3,
      fontWeight: 'normal',
      letterSpacing: 0,
    },

    // Financial amounts
    amount: {
      fontSize: 20,
      lineHeight: 1.2,
      fontWeight: 'bold',
      letterSpacing: 0,
      fontFamily: 'Menlo',
    },
    amountLarge: {
      fontSize: 28,
      lineHeight: 1.2,
      fontWeight: 'bold',
      letterSpacing: -0.5,
      fontFamily: 'Menlo',
    },

    // Buttons
    button: {
      fontSize: 16,
      lineHeight: 1.2,
      fontWeight: '600',
      letterSpacing: 0,
    },
    buttonSmall: {
      fontSize: 14,
      lineHeight: 1.2,
      fontWeight: '600',
      letterSpacing: 0,
    },
  },
} as const;

// =============================================================================
// LAYOUT & SIZING
// =============================================================================

export const Layout = {
  // Border radius
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    round: 50, // For circular elements
    pill: 9999, // For pill-shaped elements
  },

  // Shadows
  shadows: {
    none: 'none',
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 12,
    },
  },

  // Common sizes
  sizes: {
    xs: 16,
    sm: 24,
    md: 32,
    lg: 40,
    xl: 48,
    xxl: 56,
    xxxl: 64,
  },

  // Touch targets (minimum 44pt on iOS)
  touchTarget: {
    minimum: 44,
    comfortable: 48,
    large: 56,
  },
} as const;

// =============================================================================
// COMPONENT VARIANTS
// =============================================================================

export const ComponentVariants = {
  // Button variants
  button: {
    primary: {
      backgroundColor: Colors.primary[500],
      color: Colors.neutral[0],
      borderColor: Colors.primary[500],
    },
    secondary: {
      backgroundColor: 'transparent',
      color: Colors.primary[500],
      borderColor: Colors.primary[500],
    },
    ghost: {
      backgroundColor: 'transparent',
      color: Colors.primary[500],
      borderColor: 'transparent',
    },
    destructive: {
      backgroundColor: Colors.error[500],
      color: Colors.neutral[0],
      borderColor: Colors.error[500],
    },
  },

  // Card variants
  card: {
    default: {
      backgroundColor: Colors.neutral[0],
      borderColor: Colors.neutral[200],
      ...Layout.shadows.sm,
    },
    elevated: {
      backgroundColor: Colors.neutral[0],
      borderColor: 'transparent',
      ...Layout.shadows.md,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderColor: Colors.neutral[200],
      shadowOpacity: 0,
    },
  },

  // Input variants
  input: {
    default: {
      backgroundColor: Colors.neutral[50],
      borderColor: Colors.neutral[200],
      color: Colors.neutral[900],
    },
    focused: {
      backgroundColor: Colors.neutral[0],
      borderColor: Colors.primary[500],
      color: Colors.neutral[900],
    },
    error: {
      backgroundColor: Colors.neutral[50],
      borderColor: Colors.error[500],
      color: Colors.neutral[900],
    },
  },
} as const;

// =============================================================================
// ANIMATION & TIMING
// =============================================================================

export const Animation = {
  // Duration (in milliseconds)
  duration: {
    instant: 0,
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
  },

  // Easing curves
  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
} as const;

// =============================================================================
// BREAKPOINTS (for responsive design)
// =============================================================================

export const Breakpoints = {
  phone: 0,       // 0px and up (all phones)
  tablet: 768,    // 768px and up (tablets)
  desktop: 1024,  // 1024px and up (desktops)
} as const;

// =============================================================================
// ACCESSIBILITY
// =============================================================================

export const Accessibility = {
  // Minimum contrast ratios (WCAG 2.1 AA)
  contrastRatios: {
    normal: 4.5,    // Normal text
    large: 3,       // Large text (18pt+ or 14pt+ bold)
    decorative: 3,  // Non-text elements
  },

  // Focus indicators
  focus: {
    width: 2,
    color: Colors.primary[500],
    offset: 2,
  },

  // Motion preferences
  reducedMotion: {
    duration: 0,
    easing: 'linear',
  },
} as const;

// =============================================================================
// EXPORTS
// =============================================================================

export const DesignTokens = {
  Colors,
  ThemeColors,
  Spacing,
  Typography,
  Layout,
  ComponentVariants,
  Animation,
  Breakpoints,
  Accessibility,
} as const;

export default DesignTokens;