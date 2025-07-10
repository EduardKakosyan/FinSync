export const Colors = {
  primary: '#1E3A8A', // Deep blue - represents trust and stability
  primaryLight: '#3B82F6', // Lighter blue for interactive elements
  primaryDark: '#1E40AF',
  
  secondary: '#10B981', // Green - represents growth and income
  secondaryLight: '#34D399',
  secondaryDark: '#059669',
  
  accent: '#F59E0B', // Amber - for important CTAs
  accentLight: '#FCD34D',
  accentDark: '#D97706',
  
  danger: '#EF4444', // Red - for expenses and alerts
  dangerLight: '#F87171',
  dangerDark: '#DC2626',
  
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceLight: '#F9FAFB',
  
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    light: '#9CA3AF',
    inverse: '#FFFFFF',
  },
  
  border: '#E5E7EB',
  divider: '#F3F4F6',
  
  shadow: {
    light: 'rgba(0, 0, 0, 0.05)',
    medium: 'rgba(0, 0, 0, 0.1)',
    dark: 'rgba(0, 0, 0, 0.2)',
  },
} as const;

export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;