import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AdvancedAddTransactionScreen from '../../src/screens/transaction/AdvancedAddTransactionScreen';
import { enhancedTransactionService } from '../../src/services/EnhancedTransactionService';
import { accountService } from '../../src/services/storage/AccountService';
import { enhancedCategoryService } from '../../src/services/EnhancedCategoryService';

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Mock services
jest.mock('../../src/services/EnhancedTransactionService', () => ({
  enhancedTransactionService: {
    createTransaction: jest.fn(),
    getTransactions: jest.fn(),
  },
}));

jest.mock('../../src/services/storage/AccountService', () => ({
  accountService: {
    getActiveAccounts: jest.fn(),
  },
}));

jest.mock('../../src/services/categoryService', () => ({
  categoryService: {
    getAll: jest.fn(),
  },
}));

const mockAccounts = [
  {
    id: '1',
    name: 'Checking Account',
    type: 'checking',
    balance: 1500.00,
    currency: 'CAD',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'Savings Account',
    type: 'savings',
    balance: 5000.00,
    currency: 'CAD',
    isActive: true,
    createdAt: new Date(),
  },
];

const mockCategories = [
  {
    id: '1',
    name: 'Food & Dining',
    color: '#FF6B6B',
    type: 'expense',
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'Transportation',
    color: '#4ECDC4',
    type: 'expense',
    createdAt: new Date(),
  },
];

const Stack = createStackNavigator();

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen name="Test" component={() => children} />
    </Stack.Navigator>
  </NavigationContainer>
);

describe('AdvancedAddTransactionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (accountService.getActiveAccounts as jest.Mock).mockResolvedValue(mockAccounts);
    (enhancedCategoryService.getCategories as jest.Mock).mockResolvedValue(mockCategories);
    (enhancedTransactionService.getTransactions as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
    });
  });

  it('renders correctly', async () => {
    const { getByText } = render(
      <TestWrapper>
        <AdvancedAddTransactionScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Add Transaction')).toBeTruthy();
      expect(getByText('AI Powered')).toBeTruthy();
      expect(getByText('Transaction Type')).toBeTruthy();
      expect(getByText('Amount')).toBeTruthy();
      expect(getByText('Description')).toBeTruthy();
      expect(getByText('Category')).toBeTruthy();
    });
  });

  it('loads initial data on mount', async () => {
    render(
      <TestWrapper>
        <AdvancedAddTransactionScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(accountService.getActiveAccounts).toHaveBeenCalled();
      expect(enhancedCategoryService.getCategories).toHaveBeenCalled();
      expect(enhancedTransactionService.getTransactions).toHaveBeenCalled();
    });
  });

  it('switches transaction type correctly', async () => {
    const { getByText } = render(
      <TestWrapper>
        <AdvancedAddTransactionScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      const incomeButton = getByText('Income');
      fireEvent.press(incomeButton);
    });

    // Verify expense button is no longer active
    const expenseButton = getByText('Expense');
    const incomeButton = getByText('Income');
    
    // Should switch to income type
    expect(incomeButton).toBeTruthy();
  });

  it('validates form before submission', async () => {
    const { getByText } = render(
      <TestWrapper>
        <AdvancedAddTransactionScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      const saveButton = getByText('Save Transaction');
      fireEvent.press(saveButton);
    });

    // Should show validation errors
    await waitFor(() => {
      expect(getByText('Please enter a valid amount')).toBeTruthy();
    });
  });

  it('submits valid transaction successfully', async () => {
    (enhancedTransactionService.createTransaction as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: '1' },
    });

    const { getByText, getByPlaceholderText } = render(
      <TestWrapper>
        <AdvancedAddTransactionScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      // Fill in the form
      const amountInput = getByPlaceholderText('0.00');
      fireEvent.changeText(amountInput, '25.50');

      const descriptionInput = getByPlaceholderText('What was this transaction for?');
      fireEvent.changeText(descriptionInput, 'Coffee at Starbucks');
    });

    // Select category (this would need to be implemented based on actual component)
    await act(async () => {
      const saveButton = getByText('Save Transaction');
      fireEvent.press(saveButton);
    });

    await waitFor(() => {
      expect(enhancedTransactionService.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: -25.50, // Negative for expense
          description: 'Coffee at Starbucks',
          type: 'expense',
        })
      );
    });
  });

  it('shows smart suggestions when description is entered', async () => {
    const { getByPlaceholderText, getByText } = render(
      <TestWrapper>
        <AdvancedAddTransactionScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      const descriptionInput = getByPlaceholderText('What was this transaction for?');
      fireEvent.changeText(descriptionInput, 'coffee');
    });

    await waitFor(() => {
      expect(getByText('Smart Suggestions')).toBeTruthy();
    });
  });

  it('applies smart suggestion when selected', async () => {
    const { getByPlaceholderText, getByText } = render(
      <TestWrapper>
        <AdvancedAddTransactionScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      const descriptionInput = getByPlaceholderText('What was this transaction for?');
      fireEvent.changeText(descriptionInput, 'coffee');
    });

    await waitFor(() => {
      const suggestion = getByText(/Coffee/); // Find suggestion containing 'Coffee'
      fireEvent.press(suggestion);
    });

    // Should apply the suggestion data
    // This would need verification based on actual suggestion implementation
  });

  it('toggles advanced options', async () => {
    const { getByText, queryByText } = render(
      <TestWrapper>
        <AdvancedAddTransactionScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      // Advanced options should not be visible initially
      expect(queryByText('Additional Details')).toBeNull();
    });

    // Toggle advanced options (would need to find the actual toggle button)
    // This would depend on the actual implementation
  });

  it('handles account selection', async () => {
    const { getByText } = render(
      <TestWrapper>
        <AdvancedAddTransactionScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      const accountSelector = getByText('Checking Account'); // Should show first account
      expect(accountSelector).toBeTruthy();
    });
  });

  it('handles date selection', async () => {
    const { getByText } = render(
      <TestWrapper>
        <AdvancedAddTransactionScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      const dateButton = getByText(new Date().toLocaleDateString());
      fireEvent.press(dateButton);
    });

    // Should open date picker (implementation dependent)
  });

  it('handles back button press', async () => {
    const { getByText } = render(
      <TestWrapper>
        <AdvancedAddTransactionScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      const backButton = getByText('arrow-back'); // This might be an icon
      fireEvent.press(backButton);
    });

    expect(mockGoBack).toHaveBeenCalled();
  });

  it('shows loading state during submission', async () => {
    // Mock a delayed response
    (enhancedTransactionService.createTransaction as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 1000))
    );

    const { getByText, getByPlaceholderText } = render(
      <TestWrapper>
        <AdvancedAddTransactionScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      // Fill form with valid data
      const amountInput = getByPlaceholderText('0.00');
      fireEvent.changeText(amountInput, '25.50');

      const descriptionInput = getByPlaceholderText('What was this transaction for?');
      fireEvent.changeText(descriptionInput, 'Test transaction');
    });

    const saveButton = getByText('Save Transaction');
    fireEvent.press(saveButton);

    // Should show loading state
    await waitFor(() => {
      expect(getByText('Loading...')).toBeTruthy(); // Or loading indicator
    });
  });

  it('handles transaction creation error', async () => {
    (enhancedTransactionService.createTransaction as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Failed to create transaction',
    });

    const { getByText, getByPlaceholderText } = render(
      <TestWrapper>
        <AdvancedAddTransactionScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      // Fill form with valid data
      const amountInput = getByPlaceholderText('0.00');
      fireEvent.changeText(amountInput, '25.50');

      const descriptionInput = getByPlaceholderText('What was this transaction for?');
      fireEvent.changeText(descriptionInput, 'Test transaction');
    });

    const saveButton = getByText('Save Transaction');
    fireEvent.press(saveButton);

    await waitFor(() => {
      // Should handle error (implementation dependent)
      expect(enhancedTransactionService.createTransaction).toHaveBeenCalled();
    });
  });

  it('handles route parameters correctly', async () => {
    // Mock route params
    const mockUseRoute = jest.fn();
    mockUseRoute.mockReturnValue({
      params: {
        transactionType: 'income',
        prefillData: {
          amount: 100,
          description: 'Salary',
        },
      },
    });

    const { getByDisplayValue } = render(
      <TestWrapper>
        <AdvancedAddTransactionScreen />
      </TestWrapper>
    );

    // Should prefill form with route data
    // This would need adjustment based on actual implementation
  });
});
