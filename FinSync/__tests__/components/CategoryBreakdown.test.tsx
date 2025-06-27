import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CategoryBreakdown, { TopCategoriesBreakdown, BudgetCategoriesBreakdown } from '../../src/components/transaction/CategoryBreakdown';
import { CategorySpending } from '../../src/types';

describe('CategoryBreakdown Component', () => {
  const mockCategories: CategorySpending[] = [
    {
      categoryId: 'cat_food',
      categoryName: 'Food & Dining',
      categoryColor: '#FF6B6B',
      amount: 450.75,
      percentage: 35.2,
      transactionCount: 12,
      budgetLimit: 600,
      budgetUsed: 75.1,
      trend: 'up',
      previousPeriodAmount: 420.30,
    },
    {
      categoryId: 'cat_transport',
      categoryName: 'Transportation',
      categoryColor: '#4ECDC4',
      amount: 280.50,
      percentage: 21.9,
      transactionCount: 8,
      budgetLimit: 300,
      budgetUsed: 93.5,
      trend: 'down',
      previousPeriodAmount: 310.20,
    },
    {
      categoryId: 'cat_shopping',
      categoryName: 'Shopping',
      categoryColor: '#45B7D1',
      amount: 195.25,
      percentage: 15.3,
      transactionCount: 5,
      trend: 'stable',
      previousPeriodAmount: 190.80,
    },
  ];

  describe('Basic Rendering', () => {
    it('renders categories correctly', () => {
      const { getByText } = render(
        <CategoryBreakdown categories={mockCategories} />
      );
      
      expect(getByText('Food & Dining')).toBeTruthy();
      expect(getByText('Transportation')).toBeTruthy();
      expect(getByText('Shopping')).toBeTruthy();
      expect(getByText('$450.75')).toBeTruthy();
      expect(getByText('$280.50')).toBeTruthy();
      expect(getByText('$195.25')).toBeTruthy();
    });

    it('displays transaction counts correctly', () => {
      const { getByText } = render(
        <CategoryBreakdown categories={mockCategories} />
      );
      
      expect(getByText('12 transactions')).toBeTruthy();
      expect(getByText('8 transactions')).toBeTruthy();
      expect(getByText('5 transactions')).toBeTruthy();
    });

    it('displays singular transaction count', () => {
      const singleTransactionCategory: CategorySpending[] = [{
        categoryId: 'cat_single',
        categoryName: 'Single Category',
        categoryColor: '#000000',
        amount: 100,
        percentage: 100,
        transactionCount: 1,
        trend: 'stable',
      }];

      const { getByText } = render(
        <CategoryBreakdown categories={singleTransactionCategory} />
      );
      
      expect(getByText('1 transaction')).toBeTruthy();
    });

    it('displays percentages correctly', () => {
      const { getByText } = render(
        <CategoryBreakdown categories={mockCategories} />
      );
      
      expect(getByText('35.20%')).toBeTruthy();
      expect(getByText('21.90%')).toBeTruthy();
      expect(getByText('15.30%')).toBeTruthy();
    });
  });

  describe('Loading and Empty States', () => {
    it('displays loading state', () => {
      const { getByText } = render(
        <CategoryBreakdown categories={[]} isLoading={true} />
      );
      
      expect(getByText('Loading categories...')).toBeTruthy();
    });

    it('displays empty state with default message', () => {
      const { getByText } = render(
        <CategoryBreakdown categories={[]} />
      );
      
      expect(getByText('No spending data available')).toBeTruthy();
    });

    it('displays empty state with custom message', () => {
      const { getByText } = render(
        <CategoryBreakdown 
          categories={[]} 
          emptyStateText="No categories found for this period"
        />
      );
      
      expect(getByText('No categories found for this period')).toBeTruthy();
    });
  });

  describe('Currency Formatting', () => {
    it('formats CAD currency correctly', () => {
      const { getByText } = render(
        <CategoryBreakdown categories={mockCategories} currency="CAD" />
      );
      
      expect(getByText('$450.75')).toBeTruthy();
    });

    it('formats USD currency correctly', () => {
      const { getByText } = render(
        <CategoryBreakdown categories={mockCategories} currency="USD" />
      );
      
      expect(getByText('$450.75')).toBeTruthy();
    });
  });

  describe('Budget Information Display', () => {
    it('shows budget info when enabled', () => {
      const { getByText } = render(
        <CategoryBreakdown 
          categories={mockCategories} 
          showBudgetInfo={true}
        />
      );
      
      expect(getByText('Budget: $600.00')).toBeTruthy();
      expect(getByText('Budget: $300.00')).toBeTruthy();
      expect(getByText('75.10% used')).toBeTruthy();
      expect(getByText('93.50% used')).toBeTruthy();
    });

    it('shows remaining budget correctly', () => {
      const { getByText } = render(
        <CategoryBreakdown 
          categories={mockCategories} 
          showBudgetInfo={true}
        />
      );
      
      expect(getByText('$149.25 left')).toBeTruthy();
      expect(getByText('$19.50 left')).toBeTruthy();
    });

    it('shows over budget correctly', () => {
      const overBudgetCategories: CategorySpending[] = [{
        categoryId: 'cat_over',
        categoryName: 'Over Budget',
        categoryColor: '#FF0000',
        amount: 650,
        percentage: 100,
        transactionCount: 10,
        budgetLimit: 500,
        budgetUsed: 130,
        trend: 'up',
      }];

      const { getByText } = render(
        <CategoryBreakdown 
          categories={overBudgetCategories} 
          showBudgetInfo={true}
        />
      );
      
      expect(getByText('$150.00 over')).toBeTruthy();
      expect(getByText('130.00% used')).toBeTruthy();
    });

    it('hides budget info when disabled', () => {
      const { queryByText } = render(
        <CategoryBreakdown 
          categories={mockCategories} 
          showBudgetInfo={false}
        />
      );
      
      expect(queryByText('Budget:')).toBeNull();
      expect(queryByText('% used')).toBeNull();
    });
  });

  describe('Trend Display', () => {
    it('shows trend indicators when enabled', () => {
      const { getByText } = render(
        <CategoryBreakdown 
          categories={mockCategories} 
          showTrend={true}
        />
      );
      
      expect(getByText('up')).toBeTruthy();
      expect(getByText('down')).toBeTruthy();
      expect(getByText('stable')).toBeTruthy();
    });

    it('hides trend indicators when disabled', () => {
      const { queryByText } = render(
        <CategoryBreakdown 
          categories={mockCategories} 
          showTrend={false}
        />
      );
      
      expect(queryByText('up')).toBeNull();
      expect(queryByText('down')).toBeNull();
    });
  });

  describe('Interactive Behavior', () => {
    it('handles category press events', () => {
      const mockOnPress = jest.fn();
      
      const { getByText } = render(
        <CategoryBreakdown 
          categories={mockCategories} 
          onCategoryPress={mockOnPress}
        />
      );
      
      fireEvent.press(getByText('Food & Dining'));
      expect(mockOnPress).toHaveBeenCalledWith(mockCategories[0]);
    });

    it('does not crash when pressed without handler', () => {
      const { getByText } = render(
        <CategoryBreakdown categories={mockCategories} />
      );
      
      expect(() => {
        fireEvent.press(getByText('Food & Dining'));
      }).not.toThrow();
    });
  });

  describe('Header and Total Display', () => {
    it('shows header with total amount', () => {
      const totalAmount = 1000.50;
      
      const { getByText } = render(
        <CategoryBreakdown 
          categories={mockCategories} 
          totalAmount={totalAmount}
        />
      );
      
      expect(getByText('Category Breakdown')).toBeTruthy();
      expect(getByText('Total: $1,000.50')).toBeTruthy();
    });

    it('hides header when no total provided', () => {
      const { queryByText } = render(
        <CategoryBreakdown categories={mockCategories} />
      );
      
      expect(queryByText('Category Breakdown')).toBeNull();
      expect(queryByText('Total:')).toBeNull();
    });
  });

  describe('Maximum Categories and View All', () => {
    const manyCategories: CategorySpending[] = Array.from({ length: 10 }, (_, i) => ({
      categoryId: `cat_${i}`,
      categoryName: `Category ${i + 1}`,
      categoryColor: '#000000',
      amount: 100 - (i * 10),
      percentage: 10,
      transactionCount: 5,
      trend: 'stable' as const,
    }));

    it('limits categories when maxCategories is set', () => {
      const { getByText, queryByText } = render(
        <CategoryBreakdown 
          categories={manyCategories} 
          maxCategories={3}
        />
      );
      
      expect(getByText('Category 1')).toBeTruthy();
      expect(getByText('Category 2')).toBeTruthy();
      expect(getByText('Category 3')).toBeTruthy();
      expect(queryByText('Category 4')).toBeNull();
    });

    it('shows view all button when more categories exist', () => {
      const mockViewAll = jest.fn();
      
      const { getByText } = render(
        <CategoryBreakdown 
          categories={manyCategories} 
          maxCategories={3}
          showViewAllButton={true}
          onViewAllPress={mockViewAll}
        />
      );
      
      expect(getByText('View all 10 categories')).toBeTruthy();
      
      fireEvent.press(getByText('View all 10 categories'));
      expect(mockViewAll).toHaveBeenCalled();
    });

    it('hides view all button when disabled', () => {
      const { queryByText } = render(
        <CategoryBreakdown 
          categories={manyCategories} 
          maxCategories={3}
          showViewAllButton={false}
        />
      );
      
      expect(queryByText('View all')).toBeNull();
    });
  });

  describe('Preset Variants', () => {
    it('renders TopCategoriesBreakdown correctly', () => {
      const { getByText } = render(
        <TopCategoriesBreakdown categories={mockCategories} />
      );
      
      expect(getByText('Food & Dining')).toBeTruthy();
    });

    it('renders BudgetCategoriesBreakdown correctly', () => {
      const { getByText } = render(
        <BudgetCategoriesBreakdown categories={mockCategories} />
      );
      
      // Should only show categories with budgets
      expect(getByText('Food & Dining')).toBeTruthy();
      expect(getByText('Transportation')).toBeTruthy();
      expect(getByText('Budget: $600.00')).toBeTruthy();
    });

    it('shows empty state for budget categories with no budgets', () => {
      const noBudgetCategories: CategorySpending[] = [{
        categoryId: 'cat_no_budget',
        categoryName: 'No Budget',
        categoryColor: '#000000',
        amount: 100,
        percentage: 100,
        transactionCount: 1,
        trend: 'stable',
      }];

      const { getByText } = render(
        <BudgetCategoriesBreakdown categories={noBudgetCategories} />
      );
      
      expect(getByText('No budgets set for categories')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('provides accessible labels for category items', () => {
      const { getByLabelText } = render(
        <CategoryBreakdown 
          categories={mockCategories} 
          onCategoryPress={() => {}}
        />
      );
      
      expect(getByLabelText('Food & Dining category with $450.75 spent')).toBeTruthy();
    });

    it('provides accessible labels for view all button', () => {
      const manyCategories: CategorySpending[] = Array.from({ length: 10 }, (_, i) => ({
        categoryId: `cat_${i}`,
        categoryName: `Category ${i + 1}`,
        categoryColor: '#000000',
        amount: 100,
        percentage: 10,
        transactionCount: 1,
        trend: 'stable' as const,
      }));

      const { getByLabelText } = render(
        <CategoryBreakdown 
          categories={manyCategories} 
          maxCategories={3}
          showViewAllButton={true}
          onViewAllPress={() => {}}
        />
      );
      
      expect(getByLabelText('View all categories')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero amounts gracefully', () => {
      const zeroCategories: CategorySpending[] = [{
        categoryId: 'cat_zero',
        categoryName: 'Zero Amount',
        categoryColor: '#000000',
        amount: 0,
        percentage: 0,
        transactionCount: 0,
        trend: 'stable',
      }];

      const { getByText } = render(
        <CategoryBreakdown categories={zeroCategories} />
      );
      
      expect(getByText('$0.00')).toBeTruthy();
      expect(getByText('0 transactions')).toBeTruthy();
    });

    it('handles categories without budget limits', () => {
      const noBudgetCategory: CategorySpending[] = [{
        categoryId: 'cat_no_limit',
        categoryName: 'No Budget Limit',
        categoryColor: '#000000',
        amount: 100,
        percentage: 100,
        transactionCount: 1,
        trend: 'stable',
        // No budgetLimit property
      }];

      expect(() => {
        render(
          <CategoryBreakdown 
            categories={noBudgetCategory} 
            showBudgetInfo={true}
          />
        );
      }).not.toThrow();
    });

    it('handles very long category names', () => {
      const longNameCategory: CategorySpending[] = [{
        categoryId: 'cat_long',
        categoryName: 'This is a very long category name that should be handled gracefully by the component',
        categoryColor: '#000000',
        amount: 100,
        percentage: 100,
        transactionCount: 1,
        trend: 'stable',
      }];

      expect(() => {
        render(<CategoryBreakdown categories={longNameCategory} />);
      }).not.toThrow();
    });
  });
});