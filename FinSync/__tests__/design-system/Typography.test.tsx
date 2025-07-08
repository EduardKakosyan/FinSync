import React from 'react';
import { render } from '@testing-library/react-native';
import {
  Typography,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  BodyText,
  BodyTextLarge,
  BodyTextSmall,
  Label,
  LabelSmall,
  Caption,
  Amount,
  AmountLarge,
} from '../../src/design-system/components/Typography';
import { ThemeProvider } from '../../src/design-system/ThemeProvider';

// Mock Platform for React Native
jest.doMock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: (platforms: any) => platforms.ios || platforms.default,
}));

const MockThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('Typography Component', () => {
  const renderWithTheme = (component: React.ReactElement) => {
    return render(<MockThemeProvider>{component}</MockThemeProvider>);
  };

  describe('Typography base component', () => {
    it('renders with default props', () => {
      const { getByText } = renderWithTheme(
        <Typography>Default text</Typography>
      );
      expect(getByText('Default text')).toBeTruthy();
    });

    it('renders with custom variant', () => {
      const { getByText } = renderWithTheme(
        <Typography variant="h1">Header text</Typography>
      );
      expect(getByText('Header text')).toBeTruthy();
    });

    it('renders with custom color', () => {
      const { getByText } = renderWithTheme(
        <Typography color="error">Error text</Typography>
      );
      expect(getByText('Error text')).toBeTruthy();
    });

    it('renders with custom alignment', () => {
      const { getByText } = renderWithTheme(
        <Typography align="center">Centered text</Typography>
      );
      expect(getByText('Centered text')).toBeTruthy();
    });

    it('renders with limited number of lines', () => {
      const { getByText } = renderWithTheme(
        <Typography numberOfLines={2}>Long text that should be truncated</Typography>
      );
      const textElement = getByText('Long text that should be truncated');
      expect(textElement.props.numberOfLines).toBe(2);
    });

    it('applies custom testID', () => {
      const { getByTestId } = renderWithTheme(
        <Typography testID="custom-typography">Test text</Typography>
      );
      expect(getByTestId('custom-typography')).toBeTruthy();
    });

    it('applies accessibility label', () => {
      const { getByLabelText } = renderWithTheme(
        <Typography accessibilityLabel="Custom label">Text content</Typography>
      );
      expect(getByLabelText('Custom label')).toBeTruthy();
    });

    it('sets correct accessibility role for headers', () => {
      const { getByText } = renderWithTheme(
        <Typography variant="h1">Header</Typography>
      );
      const element = getByText('Header');
      expect(element.props.accessibilityRole).toBe('header');
    });

    it('sets correct accessibility role for body text', () => {
      const { getByText } = renderWithTheme(
        <Typography variant="body">Body text</Typography>
      );
      const element = getByText('Body text');
      expect(element.props.accessibilityRole).toBe('text');
    });
  });

  describe('Color variants', () => {
    const colorVariants = ['primary', 'secondary', 'tertiary', 'inverse', 'error', 'success', 'warning'] as const;
    
    colorVariants.forEach(color => {
      it(`renders ${color} color variant`, () => {
        const { getByText } = renderWithTheme(
          <Typography color={color}>{color} text</Typography>
        );
        expect(getByText(`${color} text`)).toBeTruthy();
      });
    });
  });

  describe('Text alignment', () => {
    const alignments = ['left', 'center', 'right'] as const;
    
    alignments.forEach(align => {
      it(`renders ${align} alignment`, () => {
        const { getByText } = renderWithTheme(
          <Typography align={align}>{align} aligned text</Typography>
        );
        expect(getByText(`${align} aligned text`)).toBeTruthy();
      });
    });
  });

  describe('Convenience components', () => {
    const components = [
      { Component: Heading1, name: 'Heading1', text: 'H1 text' },
      { Component: Heading2, name: 'Heading2', text: 'H2 text' },
      { Component: Heading3, name: 'Heading3', text: 'H3 text' },
      { Component: Heading4, name: 'Heading4', text: 'H4 text' },
      { Component: Heading5, name: 'Heading5', text: 'H5 text' },
      { Component: Heading6, name: 'Heading6', text: 'H6 text' },
      { Component: BodyText, name: 'BodyText', text: 'Body text' },
      { Component: BodyTextLarge, name: 'BodyTextLarge', text: 'Large body text' },
      { Component: BodyTextSmall, name: 'BodyTextSmall', text: 'Small body text' },
      { Component: Label, name: 'Label', text: 'Label text' },
      { Component: LabelSmall, name: 'LabelSmall', text: 'Small label text' },
      { Component: Caption, name: 'Caption', text: 'Caption text' },
      { Component: Amount, name: 'Amount', text: '$123.45' },
      { Component: AmountLarge, name: 'AmountLarge', text: '$1,234.56' },
    ];

    components.forEach(({ Component, name, text }) => {
      it(`renders ${name} component`, () => {
        const { getByText } = renderWithTheme(
          <Component>{text}</Component>
        );
        expect(getByText(text)).toBeTruthy();
      });

      it(`${name} accepts additional props`, () => {
        const { getByTestId } = renderWithTheme(
          <Component testID={`test-${name.toLowerCase()}`} color="error">
            {text}
          </Component>
        );
        expect(getByTestId(`test-${name.toLowerCase()}`)).toBeTruthy();
      });
    });
  });

  describe('Heading accessibility', () => {
    const headingComponents = [
      { Component: Heading1, name: 'Heading1' },
      { Component: Heading2, name: 'Heading2' },
      { Component: Heading3, name: 'Heading3' },
      { Component: Heading4, name: 'Heading4' },
      { Component: Heading5, name: 'Heading5' },
      { Component: Heading6, name: 'Heading6' },
    ];

    headingComponents.forEach(({ Component, name }) => {
      it(`${name} has correct accessibility role`, () => {
        const { getByText } = renderWithTheme(
          <Component>Test heading</Component>
        );
        const element = getByText('Test heading');
        expect(element.props.accessibilityRole).toBe('header');
      });
    });
  });

  describe('Amount text components', () => {
    it('Amount component renders monetary values correctly', () => {
      const { getByText } = renderWithTheme(
        <Amount>$1,234.56</Amount>
      );
      expect(getByText('$1,234.56')).toBeTruthy();
    });

    it('AmountLarge component renders large monetary values correctly', () => {
      const { getByText } = renderWithTheme(
        <AmountLarge>$123,456.78</AmountLarge>
      );
      expect(getByText('$123,456.78')).toBeTruthy();
    });
  });

  describe('Style customization', () => {
    it('accepts custom style prop', () => {
      const customStyle = { marginTop: 20 };
      const { getByText } = renderWithTheme(
        <Typography style={customStyle}>Styled text</Typography>
      );
      expect(getByText('Styled text')).toBeTruthy();
    });
  });
});