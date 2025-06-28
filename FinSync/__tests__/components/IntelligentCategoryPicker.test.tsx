import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import IntelligentCategoryPicker from '../../src/components/transaction/IntelligentCategoryPicker';
import { categoryService } from '../../src/services/categoryService';

// Mock the category service
jest.mock('../../src/services/categoryService', () => ({
  categoryService: {
    getCategoriesByType: jest.fn(),
    createCategory: jest.fn(),
  },
}));

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
  {
    id: '3',
    name: 'Salary',
    color: '#58D68D',
    type: 'income',
    createdAt: new Date(),
  },
];

describe('IntelligentCategoryPicker', () => {
  const defaultProps = {
    onCategorySelect: jest.fn(),
    transactionType: 'expense' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (categoryService.getCategoriesByType as jest.Mock).mockResolvedValue({
      success: true,
      data: mockCategories.filter(c => c.type === 'expense'),
    });
  });

  it('renders correctly with placeholder', () => {
    const { getByText } = render(
      <IntelligentCategoryPicker {...defaultProps} />
    );

    expect(getByText('Select category')).toBeTruthy();
  });

  it('shows selected category when provided', () => {
    const { getByText } = render(
      <IntelligentCategoryPicker 
        {...defaultProps} 
        selectedCategory="Food & Dining"
      />
    );

    expect(getByText('Food & Dining')).toBeTruthy();
  });

  it('displays AI badge', () => {
    const { getByText } = render(
      <IntelligentCategoryPicker {...defaultProps} />
    );

    expect(getByText('AI')).toBeTruthy();
  });

  it('opens modal when pressed', async () => {
    const { getByText, getByPlaceholderText } = render(
      <IntelligentCategoryPicker {...defaultProps} />
    );

    fireEvent.press(getByText('Select category'));

    await waitFor(() => {
      expect(getByText('Smart Expense Categories')).toBeTruthy();
      expect(getByPlaceholderText('Search categories...')).toBeTruthy();
    });
  });

  it('loads categories when modal opens', async () => {
    const { getByText } = render(
      <IntelligentCategoryPicker {...defaultProps} />
    );

    fireEvent.press(getByText('Select category'));

    await waitFor(() => {
      expect(categoryService.getCategoriesByType).toHaveBeenCalledWith('expense');
    });
  });

  it('calls onCategorySelect when category is chosen', async () => {
    const onCategorySelect = jest.fn();
    const { getByText } = render(
      <IntelligentCategoryPicker 
        {...defaultProps} 
        onCategorySelect={onCategorySelect}
      />
    );

    fireEvent.press(getByText('Select category'));

    await waitFor(() => {
      const categoryItem = getByText('Food & Dining');
      fireEvent.press(categoryItem);
    });

    expect(onCategorySelect).toHaveBeenCalledWith('Food & Dining');
  });

  it('filters categories by search query', async () => {
    const { getByText, getByPlaceholderText, queryByText } = render(
      <IntelligentCategoryPicker {...defaultProps} />
    );

    fireEvent.press(getByText('Select category'));

    await waitFor(() => {
      const searchInput = getByPlaceholderText('Search categories...');
      fireEvent.changeText(searchInput, 'food');
    });

    await waitFor(() => {
      expect(getByText('Food & Dining')).toBeTruthy();
      expect(queryByText('Transportation')).toBeNull();
    });
  });

  it('shows smart suggestions based on description', async () => {
    const { getByText } = render(
      <IntelligentCategoryPicker 
        {...defaultProps} 
        description="coffee at starbucks"
      />
    );

    fireEvent.press(getByText('Select category'));

    await waitFor(() => {
      expect(getByText('Smart Suggestions')).toBeTruthy();
    });
  });

  it('shows confidence percentages for suggestions', async () => {
    const { getByText } = render(
      <IntelligentCategoryPicker 
        {...defaultProps} 
        description="restaurant lunch"
      />
    );

    fireEvent.press(getByText('Select category'));

    await waitFor(() => {
      // Should show confidence percentages
      expect(getByText(/\d+%/)).toBeTruthy();
    });
  });

  it('displays recent categories section', async () => {
    const { getByText } = render(
      <IntelligentCategoryPicker 
        {...defaultProps} 
        recentCategories={['Food & Dining', 'Transportation']}
      />
    );

    fireEvent.press(getByText('Select category'));

    await waitFor(() => {
      expect(getByText('Recently Used')).toBeTruthy();
    });
  });

  it('handles adding new category', async () => {
    (categoryService.createCategory as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: '4',
        name: 'New Category',
        color: '#FF0000',
        type: 'expense',
        createdAt: new Date(),
      },
    });

    const onCategorySelect = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <IntelligentCategoryPicker 
        {...defaultProps} 
        onCategorySelect={onCategorySelect}
      />
    );

    fireEvent.press(getByText('Select category'));

    await waitFor(() => {
      // Press add button
      const addButton = getByText('add'); // This might need adjustment based on actual icon
      fireEvent.press(addButton);
    });

    await waitFor(() => {
      const nameInput = getByPlaceholderText('Category name');
      fireEvent.changeText(nameInput, 'New Category');
      
      const submitButton = getByText('Add Category');
      fireEvent.press(submitButton);
    });

    expect(categoryService.createCategory).toHaveBeenCalledWith({
      name: 'New Category',
      color: expect.any(String),
      type: 'expense',
    });
  });

  it('shows amount-based suggestions', async () => {
    const { getByText } = render(
      <IntelligentCategoryPicker 
        {...defaultProps} 
        amount={15.00}
        description="lunch"
      />
    );

    fireEvent.press(getByText('Select category'));

    await waitFor(() => {
      expect(getByText('Smart Suggestions')).toBeTruthy();
    });
  });

  it('handles disabled state correctly', () => {
    const { getByText } = render(
      <IntelligentCategoryPicker 
        {...defaultProps} 
        disabled={true}
      />
    );

    const picker = getByText('Select category');
    fireEvent.press(picker);

    // Modal should not open when disabled
    expect(() => getByText('Smart Expense Categories')).toThrow();
  });

  it('closes modal when cancel is pressed', async () => {
    const { getByText, queryByText } = render(
      <IntelligentCategoryPicker {...defaultProps} />
    );

    fireEvent.press(getByText('Select category'));

    await waitFor(() => {
      expect(getByText('Smart Expense Categories')).toBeTruthy();
    });

    fireEvent.press(getByText('Cancel'));

    await waitFor(() => {
      expect(queryByText('Smart Expense Categories')).toBeNull();
    });
  });

  it('handles different transaction types', async () => {
    const { getByText } = render(
      <IntelligentCategoryPicker 
        {...defaultProps} 
        transactionType="income"
      />
    );

    fireEvent.press(getByText('Select category'));

    await waitFor(() => {
      expect(getByText('Smart Income Categories')).toBeTruthy();
    });

    expect(categoryService.getCategoriesByType).toHaveBeenCalledWith('income');
  });
});
