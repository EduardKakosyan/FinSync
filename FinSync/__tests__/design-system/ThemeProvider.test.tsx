import React, { useContext } from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { 
  ThemeProvider, 
  useTheme, 
  useColors, 
  useTokens, 
  useIsDark
} from '../../src/design-system/ThemeProvider';
import { Colors, DesignTokens } from '../../src/design-system/tokens';

// Mock Platform for React Native
jest.doMock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: (platforms: any) => platforms.ios || platforms.default,
}));

// Mock Appearance module
const mockAddChangeListener = jest.fn();
const mockRemoveChangeListener = jest.fn();

jest.doMock('react-native/Libraries/Utilities/Appearance', () => ({
  getColorScheme: jest.fn(() => 'light'),
  addChangeListener: mockAddChangeListener,
  removeChangeListener: mockRemoveChangeListener,
}));

// Test components to access theme context
const TestThemeComponent = () => {
  const { colors, tokens, colorScheme } = useTheme();
  
  return (
    <View>
      <Text testID="color-scheme">{colorScheme}</Text>
      <Text testID="primary-color">{colors.primary}</Text>
      <Text testID="background-color">{colors.background}</Text>
      <Text testID="spacing-md">{tokens.Spacing.md}</Text>
    </View>
  );
};

const TestColorsComponent = () => {
  const colors = useColors();
  
  return (
    <View>
      <Text testID="colors-primary">{colors.primary}</Text>
      <Text testID="colors-background">{colors.background}</Text>
      <Text testID="colors-surface">{colors.surface}</Text>
    </View>
  );
};

const TestTokensComponent = () => {
  const tokens = useTokens();
  
  return (
    <View>
      <Text testID="tokens-spacing-sm">{tokens.Spacing.sm}</Text>
      <Text testID="tokens-spacing-md">{tokens.Spacing.md}</Text>
      <Text testID="tokens-border-radius">{tokens.Layout.borderRadius.md}</Text>
    </View>
  );
};

const TestIsDarkComponent = () => {
  const isDark = useIsDark();
  
  return (
    <View>
      <Text testID="is-dark">{isDark ? 'true' : 'false'}</Text>
    </View>
  );
};


describe('ThemeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic functionality', () => {
    it('provides theme context to children', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <TestThemeComponent />
        </ThemeProvider>
      );
      
      expect(getByTestId('color-scheme')).toBeTruthy();
      expect(getByTestId('primary-color')).toBeTruthy();
      expect(getByTestId('background-color')).toBeTruthy();
      expect(getByTestId('spacing-md')).toBeTruthy();
    });


    it('defaults to light theme', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <TestThemeComponent />
        </ThemeProvider>
      );
      
      expect(getByTestId('color-scheme').children[0]).toBe('light');
    });
  });

  describe('Color scheme handling', () => {
    it('accepts initial colorScheme prop', () => {
      const { getByTestId } = render(
        <ThemeProvider colorScheme="dark">
          <TestThemeComponent />
        </ThemeProvider>
      );
      
      expect(getByTestId('color-scheme').children[0]).toBe('dark');
    });

    it('provides correct colors for light theme', () => {
      const { getByTestId } = render(
        <ThemeProvider colorScheme="light">
          <TestThemeComponent />
        </ThemeProvider>
      );
      
      expect(getByTestId('primary-color').children[0]).toBe(Colors.primary[500]);
      expect(getByTestId('background-color').children[0]).toBe(Colors.neutral[0]);
    });

    it('provides correct colors for dark theme', () => {
      const { getByTestId } = render(
        <ThemeProvider colorScheme="dark">
          <TestThemeComponent />
        </ThemeProvider>
      );
      
      expect(getByTestId('primary-color').children[0]).toBe(Colors.primary[400]);
      expect(getByTestId('background-color').children[0]).toBe(Colors.neutral[900]);
    });
  });

  describe('useTheme hook', () => {
    it('returns all theme values', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <TestThemeComponent />
        </ThemeProvider>
      );
      
      expect(getByTestId('color-scheme')).toBeTruthy();
      expect(getByTestId('primary-color')).toBeTruthy();
      expect(getByTestId('spacing-md').children[0]).toBe(DesignTokens.Spacing.md.toString());
    });

    it('throws error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestThemeComponent />);
      }).toThrow();
      
      consoleError.mockRestore();
    });
  });

  describe('useColors hook', () => {
    it('returns color values for light theme', () => {
      const { getByTestId } = render(
        <ThemeProvider colorScheme="light">
          <TestColorsComponent />
        </ThemeProvider>
      );
      
      expect(getByTestId('colors-primary').children[0]).toBe(Colors.primary[500]);
      expect(getByTestId('colors-background').children[0]).toBe(Colors.neutral[0]);
      expect(getByTestId('colors-surface').children[0]).toBe(Colors.neutral[50]);
    });

    it('returns color values for dark theme', () => {
      const { getByTestId } = render(
        <ThemeProvider colorScheme="dark">
          <TestColorsComponent />
        </ThemeProvider>
      );
      
      expect(getByTestId('colors-primary').children[0]).toBe(Colors.primary[400]);
      expect(getByTestId('colors-background').children[0]).toBe(Colors.neutral[900]);
      expect(getByTestId('colors-surface').children[0]).toBe(Colors.neutral[800]);
    });

    it('throws error when used outside provider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestColorsComponent />);
      }).toThrow();
      
      consoleError.mockRestore();
    });
  });

  describe('useTokens hook', () => {
    it('returns design tokens', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <TestTokensComponent />
        </ThemeProvider>
      );
      
      expect(getByTestId('tokens-spacing-sm').children[0]).toBe(DesignTokens.Spacing.sm.toString());
      expect(getByTestId('tokens-spacing-md').children[0]).toBe(DesignTokens.Spacing.md.toString());
      expect(getByTestId('tokens-border-radius').children[0]).toBe(DesignTokens.Layout.borderRadius.md.toString());
    });

    it('throws error when used outside provider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestTokensComponent />);
      }).toThrow();
      
      consoleError.mockRestore();
    });
  });

  describe('useIsDark hook', () => {
    it('returns false for light theme', () => {
      const { getByTestId } = render(
        <ThemeProvider colorScheme="light">
          <TestIsDarkComponent />
        </ThemeProvider>
      );
      
      expect(getByTestId('is-dark').children[0]).toBe('false');
    });

    it('returns true for dark theme', () => {
      const { getByTestId } = render(
        <ThemeProvider colorScheme="dark">
          <TestIsDarkComponent />
        </ThemeProvider>
      );
      
      expect(getByTestId('is-dark').children[0]).toBe('true');
    });

    it('throws error when used outside provider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestIsDarkComponent />);
      }).toThrow();
      
      consoleError.mockRestore();
    });
  });


  describe('Nested providers', () => {
    it('allows nested providers with different themes', () => {
      const InnerTestComponent = () => {
        const { colorScheme } = useTheme();
        return <Text testID="inner-theme">{colorScheme}</Text>;
      };

      const OuterTestComponent = () => {
        const { colorScheme } = useTheme();
        return (
          <View>
            <Text testID="outer-theme">{colorScheme}</Text>
            <ThemeProvider colorScheme="dark">
              <InnerTestComponent />
            </ThemeProvider>
          </View>
        );
      };

      const { getByTestId } = render(
        <ThemeProvider colorScheme="light">
          <OuterTestComponent />
        </ThemeProvider>
      );
      
      expect(getByTestId('outer-theme').children[0]).toBe('light');
      expect(getByTestId('inner-theme').children[0]).toBe('dark');
    });
  });

  describe('Multiple children', () => {
    it('provides theme to multiple children', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <TestThemeComponent />
          <TestColorsComponent />
          <TestTokensComponent />
          <TestIsDarkComponent />
        </ThemeProvider>
      );
      
      expect(getByTestId('color-scheme')).toBeTruthy();
      expect(getByTestId('colors-primary')).toBeTruthy();
      expect(getByTestId('tokens-spacing-sm')).toBeTruthy();
      expect(getByTestId('is-dark').children[0]).toBe('false');
    });
  });
});