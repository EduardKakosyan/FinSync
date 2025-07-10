import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import TransactionForm from '../../components/TransactionForm';
import { addTransaction } from '../../services/firebase';

jest.mock('../../services/firebase');

describe('TransactionForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('should render correctly', () => {
    const { getByText, getByPlaceholderText } = render(<TransactionForm />);
    
    expect(getByText('Expense')).toBeTruthy();
    expect(getByText('Income')).toBeTruthy();
    expect(getByText('Amount (CAD)')).toBeTruthy();
    expect(getByText('Category')).toBeTruthy();
    expect(getByText('Description (Optional)')).toBeTruthy();
    expect(getByPlaceholderText('0.00')).toBeTruthy();
  });

  it('should switch between expense and income types', () => {
    const { getByText } = render(<TransactionForm />);
    
    const incomeButton = getByText('Income');
    fireEvent.press(incomeButton);
    
    // Should show income categories
    expect(getByText('Full-time')).toBeTruthy();
    expect(getByText('Side-projects')).toBeTruthy();
  });

  it('should select a category', () => {
    const { getByText } = render(<TransactionForm />);
    
    const categoryButton = getByText('Groceries');
    fireEvent.press(categoryButton);
    
    // Visual feedback would be tested with snapshot or style checks
  });

  it('should validate required fields', async () => {
    const { getByText } = render(<TransactionForm />);
    
    const submitButton = getByText('Add Transaction');
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Please fill in all required fields'
      );
    });
  });

  it('should validate amount is a positive number', async () => {
    const { getByText, getByPlaceholderText } = render(<TransactionForm />);
    
    const amountInput = getByPlaceholderText('0.00');
    const categoryButton = getByText('Groceries');
    const submitButton = getByText('Add Transaction');
    
    fireEvent.changeText(amountInput, '-50');
    fireEvent.press(categoryButton);
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Please enter a valid amount'
      );
    });
  });

  it('should submit a valid transaction', async () => {
    (addTransaction as jest.Mock).mockResolvedValue('mock-id');
    
    const onSuccess = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <TransactionForm onSuccess={onSuccess} />
    );
    
    const amountInput = getByPlaceholderText('0.00');
    const descriptionInput = getByPlaceholderText('Add a note...');
    const categoryButton = getByText('Groceries');
    const submitButton = getByText('Add Transaction');
    
    fireEvent.changeText(amountInput, '50.99');
    fireEvent.changeText(descriptionInput, 'Weekly shopping');
    fireEvent.press(categoryButton);
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(addTransaction).toHaveBeenCalledWith({
        type: 'expense',
        amount: 50.99,
        category: 'groceries',
        description: 'Weekly shopping',
        date: expect.any(Date),
      });
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        'Transaction added successfully'
      );
      
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should handle submission errors', async () => {
    (addTransaction as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    const { getByText, getByPlaceholderText } = render(<TransactionForm />);
    
    const amountInput = getByPlaceholderText('0.00');
    const categoryButton = getByText('Groceries');
    const submitButton = getByText('Add Transaction');
    
    fireEvent.changeText(amountInput, '50');
    fireEvent.press(categoryButton);
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to add transaction'
      );
    });
  });

  it('should disable submit button while submitting', async () => {
    (addTransaction as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );
    
    const { getByText, getByPlaceholderText } = render(<TransactionForm />);
    
    const amountInput = getByPlaceholderText('0.00');
    const categoryButton = getByText('Groceries');
    const submitButton = getByText('Add Transaction');
    
    fireEvent.changeText(amountInput, '50');
    fireEvent.press(categoryButton);
    fireEvent.press(submitButton);
    
    expect(getByText('Adding...')).toBeTruthy();
  });
});