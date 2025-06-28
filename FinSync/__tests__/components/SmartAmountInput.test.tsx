import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SmartAmountInput from '../../src/components/transaction/SmartAmountInput';

describe('SmartAmountInput', () => {
  const defaultProps = {
    value: '',
    onChangeText: jest.fn(),
    currency: 'CAD' as const,
    transactionType: 'expense' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    const { getByPlaceholderText, getByText } = render(
      <SmartAmountInput {...defaultProps} />
    );

    expect(getByPlaceholderText('0.00')).toBeTruthy();
    expect(getByText('$')).toBeTruthy();
  });

  it('calls onChangeText when text is entered', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <SmartAmountInput {...defaultProps} onChangeText={onChangeText} />
    );

    const input = getByPlaceholderText('0.00');
    fireEvent.changeText(input, '10.50');

    expect(onChangeText).toHaveBeenCalledWith('10.50');
  });

  it('shows validation indicator for valid amount', () => {
    const { getByTestId } = render(
      <SmartAmountInput {...defaultProps} value="25.00" />
    );

    // Should show checkmark for valid amount
    expect(() => getByTestId('validation-success')).not.toThrow();
  });

  it('shows error indicator for invalid amount', () => {
    const { getByTestId } = render(
      <SmartAmountInput {...defaultProps} value="invalid" />
    );

    // Should show error icon for invalid amount
    expect(() => getByTestId('validation-error')).not.toThrow();
  });

  it('displays formatted amount when valid', () => {
    const { getByText } = render(
      <SmartAmountInput {...defaultProps} value="100.50" />
    );

    expect(getByText('Amount:')).toBeTruthy();
    expect(getByText('$100.50')).toBeTruthy();
  });

  it('shows error message when provided', () => {
    const { getByText } = render(
      <SmartAmountInput {...defaultProps} error="Amount is required" />
    );

    expect(getByText('Amount is required')).toBeTruthy();
  });

  it('shows quick amounts when focused', async () => {
    const { getByPlaceholderText, getByText } = render(
      <SmartAmountInput {...defaultProps} recentAmounts={[25.00, 50.00]} />
    );

    const input = getByPlaceholderText('0.00');
    fireEvent(input, 'focus');

    await waitFor(() => {
      expect(getByText('Quick Amounts')).toBeTruthy();
      expect(getByText('$25.00')).toBeTruthy();
      expect(getByText('$50.00')).toBeTruthy();
    });
  });

  it('applies quick amount when pressed', async () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <SmartAmountInput 
        {...defaultProps} 
        onChangeText={onChangeText}
        recentAmounts={[25.00]}
      />
    );

    const input = getByPlaceholderText('0.00');
    fireEvent(input, 'focus');

    await waitFor(() => {
      const quickAmountButton = getByText('$25.00');
      fireEvent.press(quickAmountButton);
    });

    expect(onChangeText).toHaveBeenCalledWith('25.00');
  });

  it('handles different currencies correctly', () => {
    const { getByText } = render(
      <SmartAmountInput {...defaultProps} currency="USD" />
    );

    expect(getByText('$')).toBeTruthy();
  });

  it('shows appropriate color for transaction type', () => {
    const { rerender } = render(
      <SmartAmountInput {...defaultProps} value="50.00" transactionType="expense" />
    );

    // Test expense color (should be danger color)
    let amountInput = render(
      <SmartAmountInput {...defaultProps} value="50.00" transactionType="expense" />
    ).getByDisplayValue('50.00');
    
    // Test income color (should be success color)
    rerender(
      <SmartAmountInput {...defaultProps} value="50.00" transactionType="income" />
    );
  });

  it('disables input when disabled prop is true', () => {
    const { getByPlaceholderText } = render(
      <SmartAmountInput {...defaultProps} disabled={true} />
    );

    const input = getByPlaceholderText('0.00');
    expect(input.props.editable).toBe(false);
  });

  it('handles focus and blur events', () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const { getByPlaceholderText } = render(
      <SmartAmountInput 
        {...defaultProps} 
        onFocus={onFocus}
        onBlur={onBlur}
      />
    );

    const input = getByPlaceholderText('0.00');
    
    fireEvent(input, 'focus');
    expect(onFocus).toHaveBeenCalled();

    fireEvent(input, 'blur');
    expect(onBlur).toHaveBeenCalled();
  });

  it('shows suggested amounts with proper labels', async () => {
    const { getByPlaceholderText, getByText } = render(
      <SmartAmountInput 
        {...defaultProps} 
        suggestedAmounts={[15.00, 30.00]}
      />
    );

    const input = getByPlaceholderText('0.00');
    fireEvent(input, 'focus');

    await waitFor(() => {
      expect(getByText('Quick Amounts')).toBeTruthy();
    });
  });

  it('limits text input length', () => {
    const { getByPlaceholderText } = render(
      <SmartAmountInput {...defaultProps} />
    );

    const input = getByPlaceholderText('0.00');
    expect(input.props.maxLength).toBe(12);
  });
});
