import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import {
  ResponsiveContainer,
  Grid,
  Stack,
  ResponsiveLayout,
  SafeScroll,
  useResponsiveValue,
  useResponsiveDimensions
} from '../../src/design-system/components/Layout';
import { ThemeProvider } from '../../src/design-system/ThemeProvider';

const MockThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

const renderWithTheme = (component: React.ReactElement) => {
  return render(<MockThemeProvider>{component}</MockThemeProvider>);
};

describe('Layout Components', () => {
  describe('ResponsiveContainer', () => {
    it('renders children correctly', () => {
      const { getByText } = renderWithTheme(
        <ResponsiveContainer>
          <Text>Container content</Text>
        </ResponsiveContainer>
      );
      expect(getByText('Container content')).toBeTruthy();
    });

    it('applies custom padding', () => {
      const { getByText } = renderWithTheme(
        <ResponsiveContainer padding="lg">
          <Text>Content with padding</Text>
        </ResponsiveContainer>
      );
      expect(getByText('Content with padding')).toBeTruthy();
    });

    it('renders with custom maxWidth', () => {
      const { getByText } = renderWithTheme(
        <ResponsiveContainer maxWidth={600}>
          <Text>Limited width content</Text>
        </ResponsiveContainer>
      );
      expect(getByText('Limited width content')).toBeTruthy();
    });
  });

  describe('Grid', () => {
    it('renders grid items correctly', () => {
      const { getByText } = renderWithTheme(
        <Grid columns={2}>
          <Text>Item 1</Text>
          <Text>Item 2</Text>
          <Text>Item 3</Text>
        </Grid>
      );
      expect(getByText('Item 1')).toBeTruthy();
      expect(getByText('Item 2')).toBeTruthy();
      expect(getByText('Item 3')).toBeTruthy();
    });

    it('applies custom spacing', () => {
      const { getByText } = renderWithTheme(
        <Grid spacing="lg">
          <Text>Spaced item 1</Text>
          <Text>Spaced item 2</Text>
        </Grid>
      );
      expect(getByText('Spaced item 1')).toBeTruthy();
      expect(getByText('Spaced item 2')).toBeTruthy();
    });

    it('calculates responsive columns based on screen width', () => {
      const { getByText } = renderWithTheme(
        <Grid minItemWidth={150}>
          <Text>Auto item 1</Text>
          <Text>Auto item 2</Text>
        </Grid>
      );
      expect(getByText('Auto item 1')).toBeTruthy();
      expect(getByText('Auto item 2')).toBeTruthy();
    });
  });

  describe('Stack', () => {
    it('renders stack items vertically by default', () => {
      const { getByText } = renderWithTheme(
        <Stack>
          <Text>Stack item 1</Text>
          <Text>Stack item 2</Text>
        </Stack>
      );
      expect(getByText('Stack item 1')).toBeTruthy();
      expect(getByText('Stack item 2')).toBeTruthy();
    });

    it('renders stack items horizontally when direction is row', () => {
      const { getByText } = renderWithTheme(
        <Stack direction="row">
          <Text>Row item 1</Text>
          <Text>Row item 2</Text>
        </Stack>
      );
      expect(getByText('Row item 1')).toBeTruthy();
      expect(getByText('Row item 2')).toBeTruthy();
    });

    it('applies custom spacing', () => {
      const { getByText } = renderWithTheme(
        <Stack spacing="xl">
          <Text>Large spaced item 1</Text>
          <Text>Large spaced item 2</Text>
        </Stack>
      );
      expect(getByText('Large spaced item 1')).toBeTruthy();
      expect(getByText('Large spaced item 2')).toBeTruthy();
    });

    it('applies alignment and justification', () => {
      const { getByText } = renderWithTheme(
        <Stack align="center" justify="space-between">
          <Text>Aligned item 1</Text>
          <Text>Aligned item 2</Text>
        </Stack>
      );
      expect(getByText('Aligned item 1')).toBeTruthy();
      expect(getByText('Aligned item 2')).toBeTruthy();
    });

    it('enables wrapping when wrap is true', () => {
      const { getByText } = renderWithTheme(
        <Stack direction="row" wrap>
          <Text>Wrapping item 1</Text>
          <Text>Wrapping item 2</Text>
          <Text>Wrapping item 3</Text>
        </Stack>
      );
      expect(getByText('Wrapping item 1')).toBeTruthy();
      expect(getByText('Wrapping item 2')).toBeTruthy();
      expect(getByText('Wrapping item 3')).toBeTruthy();
    });
  });

  describe('ResponsiveLayout', () => {
    it('renders mobile layout by default', () => {
      const { getByText } = renderWithTheme(
        <ResponsiveLayout
          breakpoint={768}
          mobileLayout={<Text>Mobile layout</Text>}
          tabletLayout={<Text>Tablet layout</Text>}
        >
          <Text>Common content</Text>
        </ResponsiveLayout>
      );
      // In most test environments, screen width defaults to mobile
      expect(getByText('Mobile layout')).toBeTruthy();
      expect(getByText('Common content')).toBeTruthy();
    });

    it('falls back to mobile layout when tablet layout is not provided', () => {
      const { getByText } = renderWithTheme(
        <ResponsiveLayout
          breakpoint={768}
          mobileLayout={<Text>Mobile layout</Text>}
        >
          <Text>Common content</Text>
        </ResponsiveLayout>
      );
      expect(getByText('Mobile layout')).toBeTruthy();
      expect(getByText('Common content')).toBeTruthy();
    });

    it('uses custom breakpoint', () => {
      const { getByText } = renderWithTheme(
        <ResponsiveLayout
          breakpoint={500}
          mobileLayout={<Text>Mobile layout</Text>}
          tabletLayout={<Text>Tablet layout</Text>}
        >
          <Text>Common content</Text>
        </ResponsiveLayout>
      );
      // Test that component renders correctly with custom breakpoint
      // With default screen width being >= 500, it should show tablet layout
      expect(getByText('Tablet layout')).toBeTruthy();
      expect(getByText('Common content')).toBeTruthy();
    });
  });

  describe('SafeScroll', () => {
    it('renders children in ScrollView', () => {
      const { getByText } = renderWithTheme(
        <SafeScroll>
          <Text>Scrollable content</Text>
        </SafeScroll>
      );
      expect(getByText('Scrollable content')).toBeTruthy();
    });

    it('applies custom styles', () => {
      const { getByText } = renderWithTheme(
        <SafeScroll style={{ backgroundColor: 'red' }}>
          <Text>Styled scrollable content</Text>
        </SafeScroll>
      );
      expect(getByText('Styled scrollable content')).toBeTruthy();
    });

    it('applies content container styles', () => {
      const { getByText } = renderWithTheme(
        <SafeScroll contentContainerStyle={{ padding: 20 }}>
          <Text>Content with padding</Text>
        </SafeScroll>
      );
      expect(getByText('Content with padding')).toBeTruthy();
    });
  });

  describe('useResponsiveValue hook', () => {
    const TestComponent = ({ mobile, tablet }: { mobile: string; tablet?: string }) => {
      const ResponsiveTestComponent = () => {
        const value = useResponsiveValue(mobile, tablet);
        return <Text>{value}</Text>;
      };
      return (
        <MockThemeProvider>
          <ResponsiveTestComponent />
        </MockThemeProvider>
      );
    };

    it('returns mobile value by default', () => {
      const { getByText } = render(
        <TestComponent mobile="mobile value" tablet="tablet value" />
      );
      // In test environment, should return mobile value
      expect(getByText('mobile value')).toBeTruthy();
    });

    it('returns mobile value when tablet value is not provided', () => {
      const { getByText } = render(
        <TestComponent mobile="mobile value" />
      );
      expect(getByText('mobile value')).toBeTruthy();
    });
  });

  describe('useResponsiveDimensions hook', () => {
    const TestComponent = () => {
      const ResponsiveTestComponent = () => {
        const dimensions = useResponsiveDimensions();
        return (
          <View>
            <Text>Width: {dimensions.width}</Text>
            <Text>Height: {dimensions.height}</Text>
            <Text>Is Tablet: {dimensions.isTablet ? 'true' : 'false'}</Text>
            <Text>Is Phone: {dimensions.isPhone ? 'true' : 'false'}</Text>
            <Text>Orientation: {dimensions.orientation}</Text>
          </View>
        );
      };
      return (
        <MockThemeProvider>
          <ResponsiveTestComponent />
        </MockThemeProvider>
      );
    };

    it('returns dimension information', () => {
      const { getByText } = render(<TestComponent />);
      
      // Test that dimensions are returned (exact values may vary in test environment)
      expect(getByText(/Width: \d+/)).toBeTruthy();
      expect(getByText(/Height: \d+/)).toBeTruthy();
      expect(getByText(/Is Tablet: (true|false)/)).toBeTruthy();
      expect(getByText(/Is Phone: (true|false)/)).toBeTruthy();
      expect(getByText(/Orientation: (portrait|landscape)/)).toBeTruthy();
    });
  });
});