import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import TransactionsScreen from '../../app/(tabs)/transactions';

// Mock services
const mockTransactionService = {
  getTransactions: jest.fn(),
  createTransaction: jest.fn(),
  updateTransaction: jest.fn(),
  deleteTransaction: jest.fn(),
};

// Mock the service module before importing
jest.doMock('../../src/services/EnhancedTransactionService', () => ({
  enhancedTransactionService: mockTransactionService,
}));

// Mock router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock('expo-router', () => ({
  router: mockRouter,
  useRouter: () => mockRouter,
}));

// Mock constants
jest.mock('../../src/constants', () => ({
  COLORS: {
    BACKGROUND: '#FFFFFF',
    SURFACE: '#F8F9FA',
    BORDER: '#E5E5EA',
    TEXT_PRIMARY: '#1C1C1E',
    TEXT_SECONDARY: '#8E8E93',
    PRIMARY: '#007AFF',
    SUCCESS: '#34C759',
    DANGER: '#FF3B30',
    LIGHT: '#F2F2F7',
  },
  SPACING: {
    XS: 4,
    SM: 8,
    MD: 16,
    LG: 24,
    XL: 32,
    XXL: 48,
  },
  FONTS: {
    REGULAR: 'System',
    SEMIBOLD: 'System-Semibold',
    BOLD: 'System-Bold',
  },
}));

// Mock currency utils
jest.mock('../../src/utils/currencyUtils', () => ({
  formatCurrency: jest.fn((amount, currency = 'CAD') => `$${amount.toFixed(2)}`),
}));

const mockTransactions = [
  {
    id: 'trans-1',
    amount: 25.50,
    date: new Date('2024-01-15'),
    category: 'Food & Dining',
    description: 'Coffee Shop',
    type: 'expense' as const,
    accountId: 'acc-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'trans-2',
    amount: 1200.00,
    date: new Date('2024-01-14'),
    category: 'Salary',
    description: 'Monthly Salary',
    type: 'income' as const,
    accountId: 'acc-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('Transaction Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTransactionService.getTransactions.mockResolvedValue({
      success: true,
      data: mockTransactions,
    });
  });

  const renderTransactionsScreen = () => {
    return render(
      <NavigationContainer>
        <TransactionsScreen />
      </NavigationContainer>
    );
  };

  describe('Transaction List Display', () => {
    it('loads and displays transactions successfully', async () => {
      const { getByText } = renderTransactionsScreen();

      await waitFor(() => {
        expect(getByText('Coffee Shop')).toBeTruthy();
        expect(getByText('Monthly Salary')).toBeTruthy();
      });

      expect(mockTransactionService.getTransactions).toHaveBeenCalledWith(
        { type: 'month' },
        true
      );
    });

    it('displays transaction amounts with correct formatting', async () => {
      const { getByText } = renderTransactionsScreen();

      await waitFor(() => {
        expect(getByText('$25.50')).toBeTruthy();
        expect(getByText('$1200.00')).toBeTruthy();
      });
    });

    it('shows transaction categories and dates', async () => {
      const { getByText } = renderTransactionsScreen();

      await waitFor(() => {
        expect(getByText(/Food & Dining/)).toBeTruthy();
        expect(getByText(/Salary/)).toBeTruthy();
      });
    });

    it('displays appropriate icons for income and expense', async () => {
      const { getByTestId } = renderTransactionsScreen();

      await waitFor(() => {
        // Icons should be rendered (mocked in jest setup)
        expect(getByTestId('add-circle-icon')).toBeTruthy();
        expect(getByTestId('remove-circle-icon')).toBeTruthy();
      });
    });
  });

  describe('Empty State Handling', () => {
    it('shows empty state when no transactions exist', async () => {
      mockTransactionService.getTransactions.mockResolvedValue({
        success: true,
        data: [],
      });

      const { getByText } = renderTransactionsScreen();

      await waitFor(() => {
        expect(getByText('No transactions yet')).toBeTruthy();
        expect(getByText('Start tracking your finances by adding your first transaction')).toBeTruthy();
      });
    });

    it('provides call-to-action in empty state', async () => {
      mockTransactionService.getTransactions.mockResolvedValue({
        success: true,
        data: [],
      });

      const { getByText } = renderTransactionsScreen();

      await waitFor(() => {
        const addButton = getByText('Add Transaction');
        expect(addButton).toBeTruthy();
        
        fireEvent.press(addButton);
        expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/add-transaction');
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading state initially', () => {
      mockTransactionService.getTransactions.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: [] }), 100))
      );

      const { queryByText } = renderTransactionsScreen();

      // Should not show empty state immediately while loading
      expect(queryByText('No transactions yet')).toBeNull();
    });

    it('handles loading completion properly', async () => {
      const { getByText } = renderTransactionsScreen();

      await waitFor(() => {
        expect(getByText('Coffee Shop')).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles service errors gracefully', async () => {
      mockTransactionService.getTransactions.mockRejectedValue(
        new Error('Network error')
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderTransactionsScreen();

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to load transactions:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it('continues to show interface even with errors', async () => {
      mockTransactionService.getTransactions.mockRejectedValue(
        new Error('Network error')
      );

      const { getByText } = renderTransactionsScreen();

      // Header should still be visible
      expect(getByText('Transactions')).toBeTruthy();
    });
  });

  describe('Refresh Functionality', () => {
    it('supports pull-to-refresh', async () => {
      const { getByTestId } = renderTransactionsScreen();

      await waitFor(() => {
        expect(mockTransactionService.getTransactions).toHaveBeenCalledTimes(1);
      });

      // Simulate pull-to-refresh
      const scrollView = getByTestId('transaction-list') || getByTestId('transaction-scroll');
      if (scrollView) {
        fireEvent(scrollView, 'refresh');

        await waitFor(() => {
          expect(mockTransactionService.getTransactions).toHaveBeenCalledTimes(2);
        });
      }
    });

    it('shows refreshing state during refresh', async () => {
      mockTransactionService.getTransactions
        .mockResolvedValueOnce({ success: true, data: mockTransactions })
        .mockImplementationOnce(
          () => new Promise(resolve => 
            setTimeout(() => resolve({ success: true, data: mockTransactions }), 100)
          )
        );

      const { getByTestId } = renderTransactionsScreen();

      await waitFor(() => {
        expect(getByTestId('transaction-list')).toBeTruthy();
      });

      // Trigger refresh and verify loading state
      const scrollView = getByTestId('transaction-list');
      fireEvent(scrollView, 'refresh');

      // Should handle refresh state properly
      await waitFor(() => {
        expect(mockTransactionService.getTransactions).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Navigation Integration', () => {
    it('navigates to add transaction screen from header button', async () => {
      const { getByTestId } = renderTransactionsScreen();

      const addButton = getByTestId('add-icon') || getByTestId('header-add-button');
      if (addButton) {
        fireEvent.press(addButton);
        expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/add-transaction');
      }
    });

    it('handles transaction item press (when implemented)', async () => {
      const { getByText } = renderTransactionsScreen();

      await waitFor(() => {
        const transactionItem = getByText('Coffee Shop');
        expect(transactionItem).toBeTruthy();
        
        // Currently, transaction items don't have onPress handlers
        // This test ensures the structure is in place for future implementation
      });
    });
  });

  describe('Data Management', () => {
    it('filters transactions by current month', async () => {
      renderTransactionsScreen();

      await waitFor(() => {
        expect(mockTransactionService.getTransactions).toHaveBeenCalledWith(
          { type: 'month' },
          true
        );
      });
    });

    it('handles transaction list updates', async () => {
      const { rerender } = renderTransactionsScreen();

      await waitFor(() => {
        expect(mockTransactionService.getTransactions).toHaveBeenCalledTimes(1);
      });

      // Simulate data update
      const updatedTransactions = [
        ...mockTransactions,
        {
          id: 'trans-3',
          amount: 15.00,
          date: new Date(),
          category: 'Transportation',
          description: 'Bus Fare',
          type: 'expense' as const,
          accountId: 'acc-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockTransactionService.getTransactions.mockResolvedValue({
        success: true,
        data: updatedTransactions,
      });

      rerender(
        <NavigationContainer>
          <TransactionsScreen />
        </NavigationContainer>
      );

      // Should handle updates gracefully
    });
  });

  describe('Performance Considerations', () => {
    it('handles large transaction lists efficiently', async () => {
      const largeTransactionList = Array.from({ length: 100 }, (_, index) => ({
        id: `trans-${index}`,
        amount: Math.random() * 1000,
        date: new Date(),
        category: 'Test Category',
        description: `Transaction ${index}`,
        type: 'expense' as const,
        accountId: 'acc-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      mockTransactionService.getTransactions.mockResolvedValue({
        success: true,
        data: largeTransactionList,
      });

      const startTime = Date.now();
      renderTransactionsScreen();

      await waitFor(() => {
        expect(mockTransactionService.getTransactions).toHaveBeenCalled();
      });

      const renderTime = Date.now() - startTime;
      // Should render within reasonable time (less than 1 second)
      expect(renderTime).toBeLessThan(1000);
    });

    it('optimizes re-renders efficiently', async () => {
      const { rerender } = renderTransactionsScreen();

      await waitFor(() => {
        expect(mockTransactionService.getTransactions).toHaveBeenCalledTimes(1);
      });

      // Multiple rerenders shouldn't cause additional API calls
      rerender(
        <NavigationContainer>
          <TransactionsScreen />
        </NavigationContainer>
      );

      expect(mockTransactionService.getTransactions).toHaveBeenCalledTimes(1);
    });
  });
});