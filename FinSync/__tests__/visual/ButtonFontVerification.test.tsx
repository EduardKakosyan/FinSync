import React from 'react';
import { render } from '@testing-library/react-native';
import { Button } from '../../src/design-system/components/Button';
import { ThemeProvider } from '../../src/design-system/ThemeProvider';

const MockThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('Button Font Verification', () => {
  const renderWithTheme = (component: React.ReactElement) => {
    return render(<MockThemeProvider>{component}</MockThemeProvider>);
  };

  it('should render button text properly', () => {
    const { getByText } = renderWithTheme(
      <Button>Test Button</Button>
    );

    const buttonText = getByText('Test Button');
    expect(buttonText).toBeTruthy();
  });

  it('should render all time period buttons with visible text', () => {
    const TimePeriodButtons = () => (
      <>
        <Button variant="primary" size="small">Day</Button>
        <Button variant="ghost" size="small">Week</Button>
        <Button variant="ghost" size="small">Month</Button>
      </>
    );

    const { getByText } = renderWithTheme(<TimePeriodButtons />);

    // Check that all buttons render with visible text
    expect(getByText('Day')).toBeTruthy();
    expect(getByText('Week')).toBeTruthy();
    expect(getByText('Month')).toBeTruthy();
  });

  it('should render different button variants', () => {
    const { getByText } = renderWithTheme(
      <>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
      </>
    );

    expect(getByText('Primary')).toBeTruthy();
    expect(getByText('Secondary')).toBeTruthy();
    expect(getByText('Ghost')).toBeTruthy();
    expect(getByText('Destructive')).toBeTruthy();
  });

  it('should render different button sizes', () => {
    const { getByText } = renderWithTheme(
      <>
        <Button size="small">Small</Button>
        <Button size="medium">Medium</Button>
        <Button size="large">Large</Button>
      </>
    );

    expect(getByText('Small')).toBeTruthy();
    expect(getByText('Medium')).toBeTruthy();
    expect(getByText('Large')).toBeTruthy();
  });

  it('should render receipt capture button', () => {
    const { getByText } = renderWithTheme(
      <Button variant="primary" size="large" fullWidth>
        Scan Receipt
      </Button>
    );

    expect(getByText('Scan Receipt')).toBeTruthy();
  });

  it('should render retry button', () => {
    const { getByText } = renderWithTheme(
      <Button variant="primary">Retry</Button>
    );

    expect(getByText('Retry')).toBeTruthy();
  });
});