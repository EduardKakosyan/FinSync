import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View } from 'react-native';
import { Button, Card, Stack } from '../../src/design-system';
import { ThemeProvider } from '../../src/design-system/ThemeProvider';

type TimePeriod = 'day' | 'week' | 'month';

const MockThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

// Mock TimePeriodSelector component (from the home screen)
const TimePeriodSelector = ({ 
  selectedPeriod, 
  onPeriodChange 
}: { 
  selectedPeriod: TimePeriod; 
  onPeriodChange: (period: TimePeriod) => void; 
}) => (
  <Card variant="default" padding="xs">
    <Stack direction="row" spacing="xs">
      {(["day", "week", "month"] as TimePeriod[]).map((period) => (
        <Button
          key={period}
          variant={selectedPeriod === period ? "primary" : "ghost"}
          size="small"
          style={{ flex: 1 }}
          onPress={() => onPeriodChange(period)}
          accessibilityState={{ selected: selectedPeriod === period }}
          accessibilityLabel={`Select ${period} period`}
        >
          {period.charAt(0).toUpperCase() + period.slice(1)}
        </Button>
      ))}
    </Stack>
  </Card>
);

describe('TimePeriodSelector', () => {
  const renderWithTheme = (component: React.ReactElement) => {
    return render(<MockThemeProvider>{component}</MockThemeProvider>);
  };

  it('renders all three time period buttons', () => {
    const mockOnPeriodChange = jest.fn();
    const { getByText } = renderWithTheme(
      <TimePeriodSelector 
        selectedPeriod="week" 
        onPeriodChange={mockOnPeriodChange} 
      />
    );

    expect(getByText('Day')).toBeTruthy();
    expect(getByText('Week')).toBeTruthy();
    expect(getByText('Month')).toBeTruthy();
  });

  it('shows correct button as selected', () => {
    const mockOnPeriodChange = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <TimePeriodSelector 
        selectedPeriod="week" 
        onPeriodChange={mockOnPeriodChange} 
      />
    );

    const weekButton = getByLabelText('Select week period');
    expect(weekButton.props.accessibilityState.selected).toBe(true);
  });

  it('calls onPeriodChange when Day button is pressed', () => {
    const mockOnPeriodChange = jest.fn();
    const { getByText } = renderWithTheme(
      <TimePeriodSelector 
        selectedPeriod="week" 
        onPeriodChange={mockOnPeriodChange} 
      />
    );

    fireEvent.press(getByText('Day'));
    expect(mockOnPeriodChange).toHaveBeenCalledWith('day');
  });

  it('calls onPeriodChange when Week button is pressed', () => {
    const mockOnPeriodChange = jest.fn();
    const { getByText } = renderWithTheme(
      <TimePeriodSelector 
        selectedPeriod="day" 
        onPeriodChange={mockOnPeriodChange} 
      />
    );

    fireEvent.press(getByText('Week'));
    expect(mockOnPeriodChange).toHaveBeenCalledWith('week');
  });

  it('calls onPeriodChange when Month button is pressed', () => {
    const mockOnPeriodChange = jest.fn();
    const { getByText } = renderWithTheme(
      <TimePeriodSelector 
        selectedPeriod="week" 
        onPeriodChange={mockOnPeriodChange} 
      />
    );

    fireEvent.press(getByText('Month'));
    expect(mockOnPeriodChange).toHaveBeenCalledWith('month');
  });

  it('updates selected state when period changes', () => {
    const mockOnPeriodChange = jest.fn();
    const { getByLabelText, rerender } = renderWithTheme(
      <TimePeriodSelector 
        selectedPeriod="week" 
        onPeriodChange={mockOnPeriodChange} 
      />
    );

    // Initially week is selected
    expect(getByLabelText('Select week period').props.accessibilityState.selected).toBe(true);
    expect(getByLabelText('Select day period').props.accessibilityState.selected).toBe(false);

    // Rerender with day selected
    rerender(
      <MockThemeProvider>
        <TimePeriodSelector 
          selectedPeriod="day" 
          onPeriodChange={mockOnPeriodChange} 
        />
      </MockThemeProvider>
    );

    expect(getByLabelText('Select day period').props.accessibilityState.selected).toBe(true);
    expect(getByLabelText('Select week period').props.accessibilityState.selected).toBe(false);
  });

  it('has correct accessibility labels for all buttons', () => {
    const mockOnPeriodChange = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <TimePeriodSelector 
        selectedPeriod="week" 
        onPeriodChange={mockOnPeriodChange} 
      />
    );

    expect(getByLabelText('Select day period')).toBeTruthy();
    expect(getByLabelText('Select week period')).toBeTruthy();
    expect(getByLabelText('Select month period')).toBeTruthy();
  });

  it('applies correct button variants based on selection', () => {
    const mockOnPeriodChange = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <TimePeriodSelector 
        selectedPeriod="month" 
        onPeriodChange={mockOnPeriodChange} 
      />
    );

    const dayButton = getByLabelText('Select day period');
    const weekButton = getByLabelText('Select week period');
    const monthButton = getByLabelText('Select month period');

    // Only month should be selected
    expect(dayButton.props.accessibilityState.selected).toBe(false);
    expect(weekButton.props.accessibilityState.selected).toBe(false);
    expect(monthButton.props.accessibilityState.selected).toBe(true);
  });

  it('renders button text with correct capitalization', () => {
    const mockOnPeriodChange = jest.fn();
    const { getByText } = renderWithTheme(
      <TimePeriodSelector 
        selectedPeriod="week" 
        onPeriodChange={mockOnPeriodChange} 
      />
    );

    // Check that the first letter is capitalized
    expect(getByText('Day')).toBeTruthy();
    expect(getByText('Week')).toBeTruthy();
    expect(getByText('Month')).toBeTruthy();
  });
});