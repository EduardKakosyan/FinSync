import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TransactionList from '../../components/TransactionList';
import { Transaction } from '../../types';

describe('TransactionList', () => {
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      type: 'expense',
      amount: 50.0,
      category: 'groceries',
      description: 'Weekly groceries',
      date: new Date('2025-01-10'),
      createdAt: new Date('2025-01-10'),
      updatedAt: new Date('2025-01-10'),
    },
    {
      id: '2',
      type: 'income',
      amount: 2000.0,
      category: 'fulltime',
      description: 'Monthly salary',
      date: new Date('2025-01-01'),
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    },
  ];

  it('should render empty state when no transactions', () => {
    const { getByText } = render(<TransactionList transactions={[]} />);
    
    expect(getByText('No transactions yet')).toBeTruthy();
    expect(getByText('Add your first transaction to get started')).toBeTruthy();
  });

  it('should render transaction list', () => {
    const { getByText } = render(<TransactionList transactions={mockTransactions} />);
    
    expect(getByText('Groceries')).toBeTruthy();
    expect(getByText('Weekly groceries')).toBeTruthy();
    expect(getByText('-$50.00')).toBeTruthy();
    
    expect(getByText('Full-time')).toBeTruthy();
    expect(getByText('Monthly salary')).toBeTruthy();
    expect(getByText('+$2000.00')).toBeTruthy();
  });

  it('should display net total correctly', () => {
    const { getByText } = render(<TransactionList transactions={mockTransactions} />);
    
    expect(getByText('Net Total')).toBeTruthy();
    // Net: +2000 - 50 = 1950
    expect(getByText('$1950.00')).toBeTruthy();
  });

  it('should format dates correctly', () => {
    const today = new Date();
    const todayTransaction: Transaction = {
      ...mockTransactions[0],
      id: '3',
      date: today,
    };
    
    const { getByText } = render(
      <TransactionList transactions={[todayTransaction]} />
    );
    
    expect(getByText('Today')).toBeTruthy();
  });

  it('should call onTransactionPress when item is pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <TransactionList 
        transactions={mockTransactions} 
        onTransactionPress={onPress}
      />
    );
    
    fireEvent.press(getByText('Groceries'));
    
    expect(onPress).toHaveBeenCalledWith(mockTransactions[0]);
  });

  it('should display category colors', () => {
    const { getByText } = render(<TransactionList transactions={mockTransactions} />);
    
    // Categories should have their first letter displayed
    expect(getByText('G')).toBeTruthy(); // Groceries
    expect(getByText('F')).toBeTruthy(); // Full-time
  });

  it('should handle transactions without descriptions', () => {
    const transactionWithoutDesc: Transaction = {
      ...mockTransactions[0],
      description: '',
    };
    
    const { queryByText } = render(
      <TransactionList transactions={[transactionWithoutDesc]} />
    );
    
    expect(queryByText('')).toBeFalsy();
  });

  it('should handle negative net total', () => {
    const expenseOnlyTransactions: Transaction[] = [
      {
        ...mockTransactions[0],
        amount: 100,
      },
      {
        ...mockTransactions[0],
        id: '2',
        amount: 50,
      },
    ];
    
    const { getByText } = render(
      <TransactionList transactions={expenseOnlyTransactions} />
    );
    
    // Net: -100 - 50 = -150
    expect(getByText('$150.00')).toBeTruthy();
  });
});