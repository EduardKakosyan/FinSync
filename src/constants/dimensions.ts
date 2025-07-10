import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// iPhone 13 Pro dimensions: 390x844 points
export const SCREEN_DIMENSIONS = {
  width,
  height,
  isSmallScreen: width < 375,
  isMediumScreen: width >= 375 && width < 414,
  isLargeScreen: width >= 414,
  isIPhone13Pro: width === 390 && height === 844,
};

// Safe spacing for iPhone 13 Pro
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  statusBar: 44, // iPhone 13 Pro status bar height
  bottomSafeArea: 34, // iPhone 13 Pro bottom safe area
};

// Responsive font scaling
export const getResponsiveFontSize = (baseSize: number) => {
  const scale = width / 390; // Based on iPhone 13 Pro width
  const newSize = baseSize * scale;
  
  // Ensure font sizes don't get too small or too large
  return Math.max(Math.min(newSize, baseSize * 1.2), baseSize * 0.8);
};

// Dynamic spacing based on screen size
export const getResponsiveSpacing = (baseSpacing: number) => {
  if (SCREEN_DIMENSIONS.isSmallScreen) {
    return baseSpacing * 0.8;
  }
  if (SCREEN_DIMENSIONS.isLargeScreen) {
    return baseSpacing * 1.1;
  }
  return baseSpacing;
};

export const BUTTON_HEIGHTS = {
  small: 36,
  medium: 44,
  large: 56,
};

export const CARD_DIMENSIONS = {
  borderRadius: 12,
  shadowRadius: 4,
  padding: getResponsiveSpacing(16),
};