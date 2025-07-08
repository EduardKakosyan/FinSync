import React, { createRef } from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, TextInput } from 'react-native';
import { Input } from '../../src/design-system/components/Input';
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

describe('Input Component', () => {
  const renderWithTheme = (component: React.ReactElement) => {
    return render(<MockThemeProvider>{component}</MockThemeProvider>);
  };

  describe('Basic rendering', () => {
    it('renders with default props', () => {
      const { getByDisplayValue } = renderWithTheme(
        <Input value="test value" onChangeText={() => {}} />
      );
      expect(getByDisplayValue('test value')).toBeTruthy();
    });

    it('renders with placeholder', () => {
      const { getByPlaceholderText } = renderWithTheme(
        <Input placeholder="Enter text here" />
      );
      expect(getByPlaceholderText('Enter text here')).toBeTruthy();
    });

    it('applies testID correctly', () => {
      const { getByTestId } = renderWithTheme(
        <Input testID="test-input" />
      );
      expect(getByTestId('test-input')).toBeTruthy();
    });
  });

  describe('Label', () => {
    it('renders with label', () => {
      const { getByText } = renderWithTheme(
        <Input label="Email Address" />
      );
      expect(getByText('Email Address')).toBeTruthy();
    });

    it('works without label', () => {
      const { queryByText } = renderWithTheme(
        <Input placeholder="No label input" />
      );
      expect(queryByText('Email Address')).toBeFalsy();
    });
  });

  describe('Error and hint states', () => {
    it('renders with error message', () => {
      const { getByText } = renderWithTheme(
        <Input error="This field is required" />
      );
      expect(getByText('This field is required')).toBeTruthy();
    });

    it('renders with hint message', () => {
      const { getByText } = renderWithTheme(
        <Input hint="Enter your email address" />
      );
      expect(getByText('Enter your email address')).toBeTruthy();
    });

    it('prioritizes error over hint', () => {
      const { getByText, queryByText } = renderWithTheme(
        <Input 
          error="This field is required"
          hint="This hint should not show"
        />
      );
      expect(getByText('This field is required')).toBeTruthy();
      expect(queryByText('This hint should not show')).toBeFalsy();
    });
  });

  describe('Disabled state', () => {
    it('renders disabled input', () => {
      const { getByDisplayValue } = renderWithTheme(
        <Input disabled value="disabled value" onChangeText={() => {}} />
      );
      const input = getByDisplayValue('disabled value');
      expect(input.props.editable).toBe(false);
    });

    it('sets accessibility state for disabled input', () => {
      const { getByDisplayValue } = renderWithTheme(
        <Input disabled value="test" onChangeText={() => {}} />
      );
      const input = getByDisplayValue('test');
      expect(input.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('Focus and blur events', () => {
    it('calls onFocus when input is focused', () => {
      const mockOnFocus = jest.fn();
      const { getByDisplayValue } = renderWithTheme(
        <Input value="test" onChangeText={() => {}} onFocus={mockOnFocus} />
      );
      
      const input = getByDisplayValue('test');
      fireEvent(input, 'focus');
      
      expect(mockOnFocus).toHaveBeenCalledTimes(1);
    });

    it('calls onBlur when input loses focus', () => {
      const mockOnBlur = jest.fn();
      const { getByDisplayValue } = renderWithTheme(
        <Input value="test" onChangeText={() => {}} onBlur={mockOnBlur} />
      );
      
      const input = getByDisplayValue('test');
      fireEvent(input, 'blur');
      
      expect(mockOnBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('Multiline input', () => {
    it('renders multiline input', () => {
      const multilineText = "Line 1\nLine 2\nLine 3";
      const { getByTestId } = renderWithTheme(
        <Input 
          multiline 
          numberOfLines={3}
          value={multilineText} 
          onChangeText={() => {}} 
          testID="multiline-input"
        />
      );
      const input = getByTestId('multiline-input');
      expect(input.props.multiline).toBe(true);
      expect(input.props.numberOfLines).toBe(3);
      expect(input.props.value).toBe(multilineText);
    });

    it('defaults to single line when multiline not specified', () => {
      const { getByDisplayValue } = renderWithTheme(
        <Input value="single line" onChangeText={() => {}} />
      );
      const input = getByDisplayValue('single line');
      expect(input.props.multiline).toBe(false);
    });
  });

  describe('Icons', () => {
    it('renders with left icon', () => {
      const { getByText } = renderWithTheme(
        <Input 
          leftIcon={<MockIcon name="search" />}
          placeholder="Search..."
        />
      );
      expect(getByText('search')).toBeTruthy();
    });

    it('renders with right icon', () => {
      const { getByText } = renderWithTheme(
        <Input 
          rightIcon={<MockIcon name="visibility" />}
          placeholder="Password"
        />
      );
      expect(getByText('visibility')).toBeTruthy();
    });

    it('renders with both left and right icons', () => {
      const { getByText } = renderWithTheme(
        <Input 
          leftIcon={<MockIcon name="email" />}
          rightIcon={<MockIcon name="clear" />}
          placeholder="Email"
        />
      );
      expect(getByText('email')).toBeTruthy();
      expect(getByText('clear')).toBeTruthy();
    });

    it('calls onRightIconPress when right icon is pressed', () => {
      const mockOnRightIconPress = jest.fn();
      const { getByText } = renderWithTheme(
        <Input 
          rightIcon={<MockIcon name="clear" />}
          onRightIconPress={mockOnRightIconPress}
          placeholder="Clearable input"
        />
      );
      
      const iconButton = getByText('clear').parent;
      fireEvent.press(iconButton);
      
      expect(mockOnRightIconPress).toHaveBeenCalledTimes(1);
    });

    it('does not make right icon pressable when onRightIconPress not provided', () => {
      const { getByText } = renderWithTheme(
        <Input 
          rightIcon={<MockIcon name="info" />}
          placeholder="Info input"
        />
      );
      
      const iconContainer = getByText('info').parent;
      expect(iconContainer?.props.accessibilityRole).toBeUndefined();
    });
  });

  describe('Ref handling', () => {
    it('forwards ref to TextInput', () => {
      const inputRef = createRef<TextInput>();
      const { getByDisplayValue } = renderWithTheme(
        <Input ref={inputRef} value="ref test" onChangeText={() => {}} />
      );
      
      expect(inputRef.current).toBeTruthy();
      expect(getByDisplayValue('ref test')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('uses label as accessibility label', () => {
      const { getByLabelText } = renderWithTheme(
        <Input label="Email Address" />
      );
      expect(getByLabelText('Email Address')).toBeTruthy();
    });

    it('uses placeholder as accessibility label when no label provided', () => {
      const { getByLabelText } = renderWithTheme(
        <Input placeholder="Enter your email" />
      );
      expect(getByLabelText('Enter your email')).toBeTruthy();
    });

    it('sets correct accessibility state for disabled input', () => {
      const { getByPlaceholderText } = renderWithTheme(
        <Input placeholder="Disabled input" disabled />
      );
      
      const input = getByPlaceholderText('Disabled input');
      expect(input.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('Text input props passthrough', () => {
    it('passes through additional TextInput props', () => {
      const { getByDisplayValue } = renderWithTheme(
        <Input 
          value="test"
          onChangeText={() => {}}
          autoCapitalize="words"
          autoCorrect={false}
          keyboardType="email-address"
        />
      );
      
      const input = getByDisplayValue('test');
      expect(input.props.autoCapitalize).toBe('words');
      expect(input.props.autoCorrect).toBe(false);
      expect(input.props.keyboardType).toBe('email-address');
    });
  });

  describe('Custom styling', () => {
    it('accepts custom style prop', () => {
      const { getByTestId } = renderWithTheme(
        <Input 
          testID="styled-input"
          style={{ marginTop: 20 }}
          placeholder="Styled input"
        />
      );
      expect(getByTestId('styled-input')).toBeTruthy();
    });

    it('accepts custom inputStyle prop', () => {
      const { getByPlaceholderText } = renderWithTheme(
        <Input 
          placeholder="Custom input style"
          inputStyle={{ fontSize: 18 }}
        />
      );
      expect(getByPlaceholderText('Custom input style')).toBeTruthy();
    });
  });

  describe('Complete form scenarios', () => {
    it('renders complete form field with all props', () => {
      const mockOnChange = jest.fn();
      const mockOnFocus = jest.fn();
      const mockOnBlur = jest.fn();
      const mockOnRightIconPress = jest.fn();
      
      const { getByText, getByDisplayValue, getByLabelText } = renderWithTheme(
        <Input
          label="Password"
          placeholder="Enter your password"
          value="secret123"
          onChangeText={mockOnChange}
          onFocus={mockOnFocus}
          onBlur={mockOnBlur}
          leftIcon={<MockIcon name="lock" />}
          rightIcon={<MockIcon name="visibility" />}
          onRightIconPress={mockOnRightIconPress}
          hint="Password must be at least 8 characters"
          testID="password-input"
        />
      );
      
      expect(getByText('Password')).toBeTruthy();
      expect(getByDisplayValue('secret123')).toBeTruthy();
      expect(getByText('lock')).toBeTruthy();
      expect(getByText('visibility')).toBeTruthy();
      expect(getByText('Password must be at least 8 characters')).toBeTruthy();
      expect(getByLabelText('Password')).toBeTruthy();
    });

    it('renders error state form field', () => {
      const { getByText, getByLabelText } = renderWithTheme(
        <Input
          label="Email"
          placeholder="Enter your email"
          error="Please enter a valid email address"
          leftIcon={<MockIcon name="email" />}
        />
      );
      
      expect(getByText('Email')).toBeTruthy();
      expect(getByText('Please enter a valid email address')).toBeTruthy();
      expect(getByText('email')).toBeTruthy();
      expect(getByLabelText('Email')).toBeTruthy();
    });
  });
});