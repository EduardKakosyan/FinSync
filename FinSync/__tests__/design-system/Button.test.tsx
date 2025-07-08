import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Button } from '../../src/design-system/components/Button';
import { ThemeProvider } from '../../src/design-system/ThemeProvider';

// Mock Platform for React Native
jest.doMock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: (platforms: any) => platforms.ios || platforms.default,
}));

const MockThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

// Mock icon components for testing
const MockIcon = ({ name }: { name: string }) => <Text>{name}</Text>;

describe('Button Component', () => {
  const renderWithTheme = (component: React.ReactElement) => {
    return render(<MockThemeProvider>{component}</MockThemeProvider>);
  };

  describe('Basic rendering', () => {
    it('renders with default props', () => {
      const { getByText } = renderWithTheme(
        <Button>Default Button</Button>
      );
      expect(getByText('Default Button')).toBeTruthy();
    });

    it('renders with custom text', () => {
      const { getByText } = renderWithTheme(
        <Button>Custom Text</Button>
      );
      expect(getByText('Custom Text')).toBeTruthy();
    });

    it('applies testID correctly', () => {
      const { getByTestId } = renderWithTheme(
        <Button testID="test-button">Test Button</Button>
      );
      expect(getByTestId('test-button')).toBeTruthy();
    });
  });

  describe('Variant styles', () => {
    const variants = ['primary', 'secondary', 'ghost', 'destructive'] as const;
    
    variants.forEach(variant => {
      it(`renders ${variant} variant`, () => {
        const { getByText } = renderWithTheme(
          <Button variant={variant}>{variant} button</Button>
        );
        expect(getByText(`${variant} button`)).toBeTruthy();
      });
    });
  });

  describe('Size styles', () => {
    const sizes = ['small', 'medium', 'large'] as const;
    
    sizes.forEach(size => {
      it(`renders ${size} size`, () => {
        const { getByText } = renderWithTheme(
          <Button size={size}>{size} button</Button>
        );
        expect(getByText(`${size} button`)).toBeTruthy();
      });
    });
  });

  describe('States', () => {
    it('renders disabled state', () => {
      const { getByText, getByRole } = renderWithTheme(
        <Button disabled>Disabled Button</Button>
      );
      
      const button = getByRole('button');
      expect(button.props.accessibilityState.disabled).toBe(true);
      expect(getByText('Disabled Button')).toBeTruthy();
    });

    it('renders loading state', () => {
      const { getByRole, queryByText } = renderWithTheme(
        <Button loading>Loading Button</Button>
      );
      
      const button = getByRole('button');
      expect(button.props.accessibilityState.busy).toBe(true);
      // Text should not be visible when loading
      expect(queryByText('Loading Button')).toBeNull();
    });

    it('hides text when loading', () => {
      const { queryByText } = renderWithTheme(
        <Button loading>Hidden Text</Button>
      );
      
      // Text should be hidden when loading
      expect(queryByText('Hidden Text')).toBeNull();
    });

    it('renders full width button', () => {
      const { getByText } = renderWithTheme(
        <Button fullWidth>Full Width Button</Button>
      );
      expect(getByText('Full Width Button')).toBeTruthy();
    });
  });

  describe('Interaction', () => {
    it('calls onPress when pressed', () => {
      const mockOnPress = jest.fn();
      const { getByRole } = renderWithTheme(
        <Button onPress={mockOnPress}>Press Me</Button>
      );
      
      const button = getByRole('button');
      fireEvent.press(button);
      
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when disabled', () => {
      const mockOnPress = jest.fn();
      const { getByRole } = renderWithTheme(
        <Button onPress={mockOnPress} disabled>Disabled Button</Button>
      );
      
      const button = getByRole('button');
      fireEvent.press(button);
      
      expect(mockOnPress).not.toHaveBeenCalled();
    });

    it('does not call onPress when loading', () => {
      const mockOnPress = jest.fn();
      const { getByRole } = renderWithTheme(
        <Button onPress={mockOnPress} loading>Loading Button</Button>
      );
      
      const button = getByRole('button');
      fireEvent.press(button);
      
      expect(mockOnPress).not.toHaveBeenCalled();
    });
  });

  describe('Icons', () => {
    it('renders with left icon', () => {
      const { getByText } = renderWithTheme(
        <Button leftIcon={<MockIcon name="left-icon" />}>
          Button with Left Icon
        </Button>
      );
      
      expect(getByText('left-icon')).toBeTruthy();
      expect(getByText('Button with Left Icon')).toBeTruthy();
    });

    it('renders with right icon', () => {
      const { getByText } = renderWithTheme(
        <Button rightIcon={<MockIcon name="right-icon" />}>
          Button with Right Icon
        </Button>
      );
      
      expect(getByText('right-icon')).toBeTruthy();
      expect(getByText('Button with Right Icon')).toBeTruthy();
    });

    it('renders with both left and right icons', () => {
      const { getByText } = renderWithTheme(
        <Button 
          leftIcon={<MockIcon name="left-icon" />}
          rightIcon={<MockIcon name="right-icon" />}
        >
          Button with Both Icons
        </Button>
      );
      
      expect(getByText('left-icon')).toBeTruthy();
      expect(getByText('right-icon')).toBeTruthy();
      expect(getByText('Button with Both Icons')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has correct accessibility role', () => {
      const { getByRole } = renderWithTheme(
        <Button>Accessible Button</Button>
      );
      
      expect(getByRole('button')).toBeTruthy();
    });

    it('applies accessibility label', () => {
      const { getByLabelText } = renderWithTheme(
        <Button accessibilityLabel="Custom button label">Button</Button>
      );
      
      expect(getByLabelText('Custom button label')).toBeTruthy();
    });

    it('applies accessibility hint', () => {
      const { getByRole } = renderWithTheme(
        <Button accessibilityHint="Tap to perform action">Button</Button>
      );
      
      const button = getByRole('button');
      expect(button.props.accessibilityHint).toBe('Tap to perform action');
    });

    it('sets correct accessibility state for disabled button', () => {
      const { getByRole } = renderWithTheme(
        <Button disabled>Disabled Button</Button>
      );
      
      const button = getByRole('button');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });

    it('sets correct accessibility state for loading button', () => {
      const { getByRole } = renderWithTheme(
        <Button loading>Loading Button</Button>
      );
      
      const button = getByRole('button');
      expect(button.props.accessibilityState.busy).toBe(true);
      expect(button.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('Custom styling', () => {
    it('accepts custom style prop', () => {
      const { getByText } = renderWithTheme(
        <Button style={{ marginTop: 20 }}>Styled Button</Button>
      );
      expect(getByText('Styled Button')).toBeTruthy();
    });

    it('accepts custom textStyle prop', () => {
      const { getByText } = renderWithTheme(
        <Button textStyle={{ textTransform: 'uppercase' }}>Styled Text</Button>
      );
      expect(getByText('Styled Text')).toBeTruthy();
    });
  });

  describe('Variant and size combinations', () => {
    const variants = ['primary', 'secondary', 'ghost', 'destructive'] as const;
    const sizes = ['small', 'medium', 'large'] as const;
    
    variants.forEach(variant => {
      sizes.forEach(size => {
        it(`renders ${variant} variant with ${size} size`, () => {
          const { getByText } = renderWithTheme(
            <Button variant={variant} size={size}>
              {variant} {size}
            </Button>
          );
          expect(getByText(`${variant} ${size}`)).toBeTruthy();
        });
      });
    });
  });

  describe('Loading state with variants', () => {
    const variants = ['primary', 'secondary', 'ghost', 'destructive'] as const;
    
    variants.forEach(variant => {
      it(`shows loading spinner for ${variant} variant`, () => {
        const { getByRole } = renderWithTheme(
          <Button variant={variant} loading>Loading {variant}</Button>
        );
        
        const button = getByRole('button');
        expect(button.props.accessibilityState.busy).toBe(true);
      });
    });
  });
});