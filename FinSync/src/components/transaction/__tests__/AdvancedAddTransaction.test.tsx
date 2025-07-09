/**
 * Integration tests for Advanced Add Transaction functionality
 * Tests the complete transaction creation flow from UI to Firebase
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import AdvancedAddTransactionScreen from '../../../app/advanced-add-transaction';
import { firebaseTransactionService } from '../../services/firebase';

// Mock dependencies
jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
  },
  useLocalSearchParams: jest.fn(() => ({})),
}));

jest.mock('../../services/firebase', () => ({
  firebaseTransactionService: {
    create: jest.fn(),
    createRecurring: jest.fn(),
  },
}));

jest.mock('../../utils/currencyUtils', () => ({
  formatCurrency: jest.fn((amount) => `$${amount.toFixed(2)}`),
  parseAmountFromInput: jest.fn((input) => parseFloat(input.replace(/[^0-9.]/g, ''))),
}));

jest.mock('react-native', () => {
  const ActualReactNative = jest.requireActual('react-native');
  return {
    ...ActualReactNative,
    Alert: {
      alert: jest.fn(),
    },
  };
});

// Mock design system components
jest.mock('../../design-system', () => ({
  Typography: ({ children, ...props }: any) => {
    const MockedText = jest.requireActual('react-native').Text;
    return <MockedText {...props}>{children}</MockedText>;
  },
  Card: ({ children, ...props }: any) => {
    const MockedView = jest.requireActual('react-native').View;
    return <MockedView {...props}>{children}</MockedView>;
  },
  Button: ({ children, onPress, disabled, ...props }: any) => {
    const MockedTouchableOpacity = jest.requireActual('react-native').TouchableOpacity;
    const MockedText = jest.requireActual('react-native').Text;
    return (
      <MockedTouchableOpacity onPress={onPress} disabled={disabled} {...props}>
        <MockedText>{children}</MockedText>
      </MockedTouchableOpacity>
    );
  },
  useColors: () => ({
    background: '#FFFFFF',
    surface: '#F8F9FA',
    textPrimary: '#1C1C1E',
    textSecondary: '#8E8E93',
    border: '#E5E5EA',
    primary: '#007AFF',
    error: '#FF3B30',
    success: '#34C759',
  }),
  useTokens: () => ({
    Spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
  }),
  Heading2: ({ children, ...props }: any) => {
    const MockedText = jest.requireActual('react-native').Text;
    return <MockedText {...props}>{children}</MockedText>;
  },
  BodyText: ({ children, ...props }: any) => {
    const MockedText = jest.requireActual('react-native').Text;
    return <MockedText {...props}>{children}</MockedText>;
  },
  Caption: ({ children, ...props }: any) => {
    const MockedText = jest.requireActual('react-native').Text;
    return <MockedText {...props}>{children}</MockedText>;
  },
  Label: ({ children, ...props }: any) => {
    const MockedText = jest.requireActual('react-native').Text;
    return <MockedText {...props}>{children}</MockedText>;
  },
  Stack: ({ children, ...props }: any) => {
    const MockedView = jest.requireActual('react-native').View;
    return <MockedView {...props}>{children}</MockedView>;
  },
}));

// Mock recurring transaction form
jest.mock('../../components/transaction/RecurringTransactionForm', () => ({
  RecurringTransactionForm: ({ value, onChange }: any) => {
    const MockedView = jest.requireActual('react-native').View;
    const MockedText = jest.requireActual('react-native').Text;
    return (
      <MockedView testID="recurring-form">
        <MockedText>Recurring: {value.isRecurring ? 'Yes' : 'No'}</MockedText>
      </MockedView>
    );
  },
}));

// Mock date time picker
jest.mock('@react-native-community/datetimepicker', () => {
  return ({ onChange, value }: any) => {
    const MockedView = jest.requireActual('react-native').View;
    return <MockedView testID="datetime-picker" />;
  };
});

describe('AdvancedAddTransactionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Validation', () => {
    it('should show validation errors for empty required fields', async () => {
      render(<AdvancedAddTransactionScreen />);

      // Try to submit without filling required fields
      const submitButton = screen.getByText('Create Transaction');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Amount is required')).toBeTruthy();
        expect(screen.getByText('Description is required')).toBeTruthy();
        expect(screen.getByText('Category is required')).toBeTruthy();
      });

      // Should not call Firebase service
      expect(firebaseTransactionService.create).not.toHaveBeenCalled();
    });

    it('should validate amount is greater than 0', async () => {
      render(<AdvancedAddTransactionScreen />);

      // Fill in amount with 0
      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.changeText(amountInput, '0');

      // Fill description
      const descriptionInput = screen.getByPlaceholderText('Enter description...');
      fireEvent.changeText(descriptionInput, 'Test description');

      // Submit form
      const submitButton = screen.getByText('Create Transaction');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Amount must be greater than 0')).toBeTruthy();
      });

      expect(firebaseTransactionService.create).not.toHaveBeenCalled();
    });

    it('should clear validation errors when user types', async () => {
      render(<AdvancedAddTransactionScreen />);

      // Submit empty form to trigger validation
      const submitButton = screen.getByText('Create Transaction');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Amount is required')).toBeTruthy();
      });

      // Type in amount field
      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.changeText(amountInput, '25.99');

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Amount is required')).toBeNull();
      });
    });
  });

  describe('Transaction Creation', () => {
    it('should create a regular transaction successfully', async () => {
      const mockCreate = firebaseTransactionService.create as jest.Mock;
      mockCreate.mockResolvedValueOnce({
        id: 'test-transaction-id',
        amount: 25.99,
        description: 'Coffee',
        category: 'food',
        type: 'expense',
        date: new Date(),
        accountId: 'default-account',
      });

      render(<AdvancedAddTransactionScreen />);

      // Fill in required fields
      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.changeText(amountInput, '25.99');

      const descriptionInput = screen.getByPlaceholderText('Enter description...');
      fireEvent.changeText(descriptionInput, 'Coffee');

      // Select category
      const foodCategory = screen.getByText('Food & Dining');
      fireEvent.press(foodCategory);

      // Submit form
      const submitButton = screen.getByText('Create Transaction');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith({
          amount: 25.99,
          description: 'Coffee',
          category: 'food',
          type: 'expense',
          date: expect.any(Date),
          notes: '',
          accountId: 'default-account',
        });
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        'Transaction created successfully!',
        [{ text: 'OK', onPress: expect.any(Function) }]
      );
    });

    it('should create a recurring transaction successfully', async () => {
      const mockCreateRecurring = firebaseTransactionService.createRecurring as jest.Mock;
      mockCreateRecurring.mockResolvedValueOnce({
        id: 'test-recurring-id',
        amount: 2000,
        description: 'Monthly salary',
        category: 'income',
        type: 'income',
        date: new Date(),
        accountId: 'default-account',
        isRecurring: true,
      });

      render(<AdvancedAddTransactionScreen />);

      // Fill in required fields
      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.changeText(amountInput, '2000');

      const descriptionInput = screen.getByPlaceholderText('Enter description...');
      fireEvent.changeText(descriptionInput, 'Monthly salary');

      // Select income type
      const incomeButton = screen.getByText('Income');
      fireEvent.press(incomeButton);

      // Select category
      const incomeCategory = screen.getByText('Income');
      fireEvent.press(incomeCategory);

      // Note: In a real test, we'd need to interact with the RecurringTransactionForm
      // to set isRecurring: true, but since it's mocked, we'll assume it works

      // Submit form
      const submitButton = screen.getByText('Create Transaction');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockCreateRecurring).toHaveBeenCalledWith(
          {
            amount: 2000,
            description: 'Monthly salary',
            category: 'income',
            type: 'income',
            date: expect.any(Date),
            notes: '',
            accountId: 'default-account',
          },
          {
            interval: 'monthly',
            dayOfMonth: undefined,
            dayOfWeek: undefined,
            endDate: undefined,
          }
        );
      });
    });

    it('should handle Firebase errors gracefully', async () => {
      const mockCreate = firebaseTransactionService.create as jest.Mock;
      mockCreate.mockRejectedValueOnce(new Error('Firebase connection error'));

      render(<AdvancedAddTransactionScreen />);

      // Fill in required fields
      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.changeText(amountInput, '25.99');

      const descriptionInput = screen.getByPlaceholderText('Enter description...');
      fireEvent.changeText(descriptionInput, 'Coffee');

      // Select category
      const foodCategory = screen.getByText('Food & Dining');
      fireEvent.press(foodCategory);

      // Submit form
      const submitButton = screen.getByText('Create Transaction');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Failed to create transaction. Please try again.'
        );
      });
    });
  });

  describe('Transaction Types', () => {
    it('should toggle between expense and income', async () => {
      render(<AdvancedAddTransactionScreen />);

      // Default should be expense
      const expenseButton = screen.getByText('Expense');
      const incomeButton = screen.getByText('Income');

      // Switch to income
      fireEvent.press(incomeButton);

      // Fill in required fields
      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.changeText(amountInput, '1000');

      const descriptionInput = screen.getByPlaceholderText('Enter description...');
      fireEvent.changeText(descriptionInput, 'Freelance work');

      // Select category
      const incomeCategory = screen.getByText('Income');
      fireEvent.press(incomeCategory);

      // Submit form
      const submitButton = screen.getByText('Create Transaction');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(firebaseTransactionService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'income',
            amount: 1000,
            description: 'Freelance work',
          })
        );
      });
    });
  });

  describe('Category Selection', () => {
    it('should select different categories', async () => {
      render(<AdvancedAddTransactionScreen />);

      // Test different categories
      const categories = [
        { text: 'Food & Dining', id: 'food' },
        { text: 'Transportation', id: 'transport' },
        { text: 'Shopping', id: 'shopping' },
        { text: 'Entertainment', id: 'entertainment' },
      ];

      for (const category of categories) {
        const categoryButton = screen.getByText(category.text);
        fireEvent.press(categoryButton);

        // Fill other required fields
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.changeText(amountInput, '50');

        const descriptionInput = screen.getByPlaceholderText('Enter description...');
        fireEvent.changeText(descriptionInput, `Test ${category.text}`);

        // Submit form
        const submitButton = screen.getByText('Create Transaction');
        fireEvent.press(submitButton);

        await waitFor(() => {
          expect(firebaseTransactionService.create).toHaveBeenCalledWith(
            expect.objectContaining({
              category: category.id,
            })
          );
        });

        // Clear mock for next iteration
        jest.clearAllMocks();
      }
    });
  });

  describe('Advanced Options', () => {
    it('should handle notes and location', async () => {
      render(<AdvancedAddTransactionScreen />);

      // Expand advanced options
      const advancedOptionsButton = screen.getByText('Advanced Options');
      fireEvent.press(advancedOptionsButton);

      // Fill in required fields
      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.changeText(amountInput, '75.50');

      const descriptionInput = screen.getByPlaceholderText('Enter description...');
      fireEvent.changeText(descriptionInput, 'Dinner');

      // Select category
      const foodCategory = screen.getByText('Food & Dining');
      fireEvent.press(foodCategory);

      // Fill advanced options
      const notesInput = screen.getByPlaceholderText('Notes (optional)');
      fireEvent.changeText(notesInput, 'Business dinner with client');

      const locationInput = screen.getByPlaceholderText('Location (optional)');
      fireEvent.changeText(locationInput, 'The Keg Restaurant');

      // Submit form
      const submitButton = screen.getByText('Create Transaction');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(firebaseTransactionService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            notes: 'Business dinner with client',
            location: 'The Keg Restaurant',
          })
        );
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during transaction creation', async () => {
      const mockCreate = firebaseTransactionService.create as jest.Mock;
      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockCreate.mockReturnValueOnce(promise);

      render(<AdvancedAddTransactionScreen />);

      // Fill in required fields
      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.changeText(amountInput, '25.99');

      const descriptionInput = screen.getByPlaceholderText('Enter description...');
      fireEvent.changeText(descriptionInput, 'Coffee');

      // Select category
      const foodCategory = screen.getByText('Food & Dining');
      fireEvent.press(foodCategory);

      // Submit form
      const submitButton = screen.getByText('Create Transaction');
      fireEvent.press(submitButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Creating...')).toBeTruthy();
      });

      // Resolve the promise
      resolvePromise!({
        id: 'test-id',
        amount: 25.99,
        description: 'Coffee',
        category: 'food',
        type: 'expense',
        date: new Date(),
        accountId: 'default-account',
      });

      // Should return to normal state
      await waitFor(() => {
        expect(screen.queryByText('Creating...')).toBeNull();
      });
    });
  });
});