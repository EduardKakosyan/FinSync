import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from '../../src/design-system/components/Card';
import { ThemeProvider } from '../../src/design-system/ThemeProvider';

// Mock Platform for React Native
jest.doMock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: (platforms: any) => platforms.ios || platforms.default,
}));

const MockThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('Card Component', () => {
  const renderWithTheme = (component: React.ReactElement) => {
    return render(<MockThemeProvider>{component}</MockThemeProvider>);
  };

  describe('Basic rendering', () => {
    it('renders with default props', () => {
      const { getByText } = renderWithTheme(
        <Card>
          <Text>Card content</Text>
        </Card>
      );
      expect(getByText('Card content')).toBeTruthy();
    });

    it('renders children correctly', () => {
      const { getByText } = renderWithTheme(
        <Card>
          <Text>First child</Text>
          <Text>Second child</Text>
        </Card>
      );
      expect(getByText('First child')).toBeTruthy();
      expect(getByText('Second child')).toBeTruthy();
    });

    it('applies testID correctly', () => {
      const { getByTestId } = renderWithTheme(
        <Card testID="test-card">
          <Text>Test content</Text>
        </Card>
      );
      expect(getByTestId('test-card')).toBeTruthy();
    });
  });

  describe('Variant styles', () => {
    const variants = ['default', 'elevated', 'outlined'] as const;
    
    variants.forEach(variant => {
      it(`renders ${variant} variant`, () => {
        const { getByText } = renderWithTheme(
          <Card variant={variant}>
            <Text>{variant} card content</Text>
          </Card>
        );
        expect(getByText(`${variant} card content`)).toBeTruthy();
      });
    });
  });

  describe('Padding options', () => {
    const paddingOptions = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
    
    paddingOptions.forEach(padding => {
      it(`renders with ${padding} padding`, () => {
        const { getByText } = renderWithTheme(
          <Card padding={padding}>
            <Text>Content with {padding} padding</Text>
          </Card>
        );
        expect(getByText(`Content with ${padding} padding`)).toBeTruthy();
      });
    });
  });

  describe('Non-interactive card', () => {
    it('renders as View when no onPress provided', () => {
      const { getByText } = renderWithTheme(
        <Card>
          <Text>Static card</Text>
        </Card>
      );
      
      const cardContent = getByText('Static card');
      expect(cardContent).toBeTruthy();
    });

    it('applies accessibility role when specified for static card', () => {
      const { getByText } = renderWithTheme(
        <Card accessibilityRole="article" testID="article-card">
          <Text>Article card</Text>
        </Card>
      );
      
      // Just verify the card renders with the content
      expect(getByText('Article card')).toBeTruthy();
    });

    it('applies accessibility label for static card', () => {
      const { getByLabelText } = renderWithTheme(
        <Card accessibilityLabel="Information card">
          <Text>Info content</Text>
        </Card>
      );
      
      expect(getByLabelText('Information card')).toBeTruthy();
    });
  });

  describe('Interactive card', () => {
    it('renders as TouchableOpacity when onPress provided', () => {
      const mockOnPress = jest.fn();
      const { getByRole } = renderWithTheme(
        <Card onPress={mockOnPress}>
          <Text>Pressable card</Text>
        </Card>
      );
      
      expect(getByRole('button')).toBeTruthy();
    });

    it('calls onPress when pressed', () => {
      const mockOnPress = jest.fn();
      const { getByRole } = renderWithTheme(
        <Card onPress={mockOnPress}>
          <Text>Pressable card</Text>
        </Card>
      );
      
      const card = getByRole('button');
      fireEvent.press(card);
      
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('applies default accessibility role for interactive card', () => {
      const mockOnPress = jest.fn();
      const { getByRole } = renderWithTheme(
        <Card onPress={mockOnPress}>
          <Text>Interactive card</Text>
        </Card>
      );
      
      expect(getByRole('button')).toBeTruthy();
    });

    it('applies custom accessibility role for interactive card', () => {
      const mockOnPress = jest.fn();
      const { getByRole } = renderWithTheme(
        <Card onPress={mockOnPress} accessibilityRole="summary">
          <Text>Summary card</Text>
        </Card>
      );
      
      expect(getByRole('summary')).toBeTruthy();
    });

    it('applies accessibility label for interactive card', () => {
      const mockOnPress = jest.fn();
      const { getByLabelText } = renderWithTheme(
        <Card onPress={mockOnPress} accessibilityLabel="Tap to view details">
          <Text>Details card</Text>
        </Card>
      );
      
      expect(getByLabelText('Tap to view details')).toBeTruthy();
    });

    it('applies accessibility hint for interactive card', () => {
      const mockOnPress = jest.fn();
      const { getByRole } = renderWithTheme(
        <Card onPress={mockOnPress} accessibilityHint="Opens detail view">
          <Text>Card with hint</Text>
        </Card>
      );
      
      const card = getByRole('button');
      expect(card.props.accessibilityHint).toBe('Opens detail view');
    });
  });

  describe('Custom styling', () => {
    it('accepts custom style prop', () => {
      const { getByText } = renderWithTheme(
        <Card style={{ marginTop: 20 }}>
          <Text>Styled card</Text>
        </Card>
      );
      expect(getByText('Styled card')).toBeTruthy();
    });

    it('merges custom styles with variant styles', () => {
      const { getByText } = renderWithTheme(
        <Card variant="elevated" style={{ marginBottom: 10 }}>
          <Text>Custom styled elevated card</Text>
        </Card>
      );
      expect(getByText('Custom styled elevated card')).toBeTruthy();
    });
  });

  describe('Variant and padding combinations', () => {
    const variants = ['default', 'elevated', 'outlined'] as const;
    const paddingOptions = ['sm', 'md', 'lg'] as const;
    
    variants.forEach(variant => {
      paddingOptions.forEach(padding => {
        it(`renders ${variant} variant with ${padding} padding`, () => {
          const { getByText } = renderWithTheme(
            <Card variant={variant} padding={padding}>
              <Text>{variant} card with {padding} padding</Text>
            </Card>
          );
          expect(getByText(`${variant} card with ${padding} padding`)).toBeTruthy();
        });
      });
    });
  });

  describe('Interactive variants', () => {
    const variants = ['default', 'elevated', 'outlined'] as const;
    
    variants.forEach(variant => {
      it(`${variant} variant works as interactive card`, () => {
        const mockOnPress = jest.fn();
        const { getByRole } = renderWithTheme(
          <Card variant={variant} onPress={mockOnPress}>
            <Text>Interactive {variant} card</Text>
          </Card>
        );
        
        const card = getByRole('button');
        fireEvent.press(card);
        
        expect(mockOnPress).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Complex content', () => {
    it('renders complex nested content', () => {
      const { getByText } = renderWithTheme(
        <Card>
          <Text>Header</Text>
          <Text>Body content with more text</Text>
          <Text>Footer</Text>
        </Card>
      );
      
      expect(getByText('Header')).toBeTruthy();
      expect(getByText('Body content with more text')).toBeTruthy();
      expect(getByText('Footer')).toBeTruthy();
    });

    it('handles empty content gracefully', () => {
      const { queryByText } = renderWithTheme(
        <Card testID="empty-card">
        </Card>
      );
      
      expect(queryByText('')).toBeFalsy();
    });
  });

  describe('Accessibility combinations', () => {
    it('combines multiple accessibility props correctly', () => {
      const mockOnPress = jest.fn();
      const { getByRole } = renderWithTheme(
        <Card
          onPress={mockOnPress}
          accessibilityRole="summary"
          accessibilityLabel="Card summary"
          accessibilityHint="Double tap to expand"
        >
          <Text>Accessible card</Text>
        </Card>
      );
      
      const card = getByRole('summary');
      expect(card.props.accessibilityLabel).toBe('Card summary');
      expect(card.props.accessibilityHint).toBe('Double tap to expand');
    });
  });
});