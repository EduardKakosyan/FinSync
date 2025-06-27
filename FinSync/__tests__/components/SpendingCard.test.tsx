import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SpendingCard, { TotalSpendingCard, TotalIncomeCard, NetIncomeCard, AverageSpendingCard } from '../../src/components/transaction/SpendingCard';

describe('SpendingCard Component', () => {
  const mockProps = {
    title: 'Total Spending',
    amount: 1234.56,
    currency: 'CAD' as const,
    change: {
      amount: -50.25,
      percentage: -5.2,
      period: 'vs last month',
    },
    icon: 'card-outline' as const,
    iconColor: '#FF3B30',
    lastUpdated: new Date('2024-01-15T10:30:00Z'),
  };

  describe('Basic Rendering', () => {
    it('renders correctly with all props', () => {
      const { getByText } = render(<SpendingCard {...mockProps} />);
      
      expect(getByText('Total Spending')).toBeTruthy();
      expect(getByText('$1,234.56')).toBeTruthy();
      expect(getByText('vs last month')).toBeTruthy();
    });

    it('renders with minimal props', () => {
      const minimalProps = {
        title: 'Test Card',
        amount: 100,
      };
      
      const { getByText } = render(<SpendingCard {...minimalProps} />);
      
      expect(getByText('Test Card')).toBeTruthy();
      expect(getByText('$100.00')).toBeTruthy();
    });

    it('renders loading state', () => {
      const { getByText } = render(
        <SpendingCard title="Loading Test" amount={0} isLoading={true} />
      );
      
      expect(getByText('Loading...')).toBeTruthy();
    });

    it('renders error state', () => {
      const { getByText } = render(
        <SpendingCard 
          title="Error Test" 
          amount={0} 
          error="Failed to load data" 
        />
      );
      
      expect(getByText('Failed to load data')).toBeTruthy();
    });
  });

  describe('Currency Formatting', () => {
    it('formats CAD currency correctly', () => {
      const { getByText } = render(
        <SpendingCard title="CAD Test" amount={1500.75} currency="CAD" />
      );
      
      expect(getByText('$1,500.75')).toBeTruthy();
    });

    it('formats USD currency correctly', () => {
      const { getByText } = render(
        <SpendingCard title="USD Test" amount={2500.99} currency="USD" />
      );
      
      expect(getByText('$2,500.99')).toBeTruthy();
    });

    it('handles large amounts', () => {
      const { getByText } = render(
        <SpendingCard title="Large Amount" amount={1234567.89} />
      );
      
      expect(getByText('$1,234,567.89')).toBeTruthy();
    });

    it('handles zero amount', () => {
      const { getByText } = render(
        <SpendingCard title="Zero Amount" amount={0} />
      );
      
      expect(getByText('$0.00')).toBeTruthy();
    });
  });

  describe('Change Indicators', () => {
    it('displays positive change correctly', () => {
      const positiveChange = {
        amount: 123.45,
        percentage: 10.5,
        period: 'vs last week',
      };
      
      const { getByText } = render(
        <SpendingCard 
          title="Positive Change" 
          amount={1000} 
          change={positiveChange}
        />
      );
      
      expect(getByText('$123.45')).toBeTruthy();
      expect(getByText('(10.50%)')).toBeTruthy();
      expect(getByText('vs last week')).toBeTruthy();
    });

    it('displays negative change correctly', () => {
      const negativeChange = {
        amount: -67.89,
        percentage: -8.3,
        period: 'vs last month',
      };
      
      const { getByText } = render(
        <SpendingCard 
          title="Negative Change" 
          amount={750} 
          change={negativeChange}
        />
      );
      
      expect(getByText('$67.89')).toBeTruthy();
      expect(getByText('(8.30%)')).toBeTruthy();
      expect(getByText('vs last month')).toBeTruthy();
    });

    it('handles zero change', () => {
      const zeroChange = {
        amount: 0,
        percentage: 0,
        period: 'no change',
      };
      
      const { getByText } = render(
        <SpendingCard 
          title="Zero Change" 
          amount={500} 
          change={zeroChange}
        />
      );
      
      expect(getByText('$0.00')).toBeTruthy();
      expect(getByText('(0.00%)')).toBeTruthy();
    });
  });

  describe('Trend Display', () => {
    it('displays positive trend correctly', () => {
      const trendData = {
        isPositive: true,
        description: 'Income up',
      };
      
      const { getByText } = render(
        <SpendingCard 
          title="Trend Test" 
          amount={1000} 
          showTrend={true}
          trendData={trendData}
        />
      );
      
      expect(getByText('Income up')).toBeTruthy();
    });

    it('displays negative trend correctly', () => {
      const trendData = {
        isPositive: false,
        description: 'Spending down',
      };
      
      const { getByText } = render(
        <SpendingCard 
          title="Trend Test" 
          amount={800} 
          showTrend={true}
          trendData={trendData}
        />
      );
      
      expect(getByText('Spending down')).toBeTruthy();
    });

    it('hides trend when showTrend is false', () => {
      const trendData = {
        isPositive: true,
        description: 'Should not show',
      };
      
      const { queryByText } = render(
        <SpendingCard 
          title="No Trend" 
          amount={1000} 
          showTrend={false}
          trendData={trendData}
        />
      );
      
      expect(queryByText('Should not show')).toBeNull();
    });
  });

  describe('Interactive Behavior', () => {
    it('handles press events when onPress is provided', () => {
      const mockOnPress = jest.fn();
      
      const { getByText } = render(
        <SpendingCard 
          title="Clickable Card" 
          amount={1000} 
          onPress={mockOnPress}
        />
      );
      
      fireEvent.press(getByText('Clickable Card'));
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('does not crash when pressed without onPress handler', () => {
      const { getByText } = render(
        <SpendingCard title="Non-clickable Card" amount={1000} />
      );
      
      // Should not throw when pressed
      expect(() => {
        fireEvent.press(getByText('Non-clickable Card'));
      }).not.toThrow();
    });
  });

  describe('Preset Card Variants', () => {
    it('renders TotalSpendingCard correctly', () => {
      const { getByText } = render(
        <TotalSpendingCard amount={1234.56} />
      );
      
      expect(getByText('Total Spending')).toBeTruthy();
      expect(getByText('$1,234.56')).toBeTruthy();
    });

    it('renders TotalIncomeCard correctly', () => {
      const { getByText } = render(
        <TotalIncomeCard amount={2500.00} />
      );
      
      expect(getByText('Total Income')).toBeTruthy();
      expect(getByText('$2,500.00')).toBeTruthy();
    });

    it('renders NetIncomeCard with positive amount', () => {
      const { getByText } = render(
        <NetIncomeCard amount={750.25} />
      );
      
      expect(getByText('Net Income')).toBeTruthy();
      expect(getByText('$750.25')).toBeTruthy();
      expect(getByText('Positive balance')).toBeTruthy();
    });

    it('renders NetIncomeCard with negative amount', () => {
      const { getByText } = render(
        <NetIncomeCard amount={-250.75} />
      );
      
      expect(getByText('Net Income')).toBeTruthy();
      expect(getByText('-$250.75')).toBeTruthy();
      expect(getByText('Negative balance')).toBeTruthy();
    });

    it('renders AverageSpendingCard correctly', () => {
      const { getByText } = render(
        <AverageSpendingCard amount={45.67} period="day" />
      );
      
      expect(getByText('Average Spending')).toBeTruthy();
      expect(getByText('$45.67')).toBeTruthy();
      expect(getByText('Per day')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('provides accessible labels for screen readers', () => {
      const { getByRole } = render(
        <SpendingCard 
          title="Accessible Card" 
          amount={1000} 
          onPress={() => {}}
        />
      );
      
      // TouchableOpacity should have button role
      expect(getByRole('button')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles very small amounts', () => {
      const { getByText } = render(
        <SpendingCard title="Small Amount" amount={0.01} />
      );
      
      expect(getByText('$0.01')).toBeTruthy();
    });

    it('handles negative amounts', () => {
      const { getByText } = render(
        <SpendingCard title="Negative Amount" amount={-500.25} />
      );
      
      expect(getByText('-$500.25')).toBeTruthy();
    });

    it('handles undefined optional props gracefully', () => {
      expect(() => {
        render(
          <SpendingCard 
            title="Test" 
            amount={100} 
            change={undefined}
            trendData={undefined}
            subtitle={undefined}
            lastUpdated={undefined}
          />
        );
      }).not.toThrow();
    });
  });
});