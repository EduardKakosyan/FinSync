/**
 * Analytics-specific type definitions
 */

export interface TimeSeriesData {
  label: string;
  value: number;
  date: Date;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color: string;
    type?: 'line' | 'bar' | 'pie';
  }>;
}

export interface TrendAnalysis {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercentage: number;
  averageValue: number;
  projectedValue?: number;
}

export interface BudgetStatus {
  categoryId: string;
  categoryName: string;
  budgeted: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
  daysRemaining: number;
  projectedOverspend?: number;
  status: 'on_track' | 'warning' | 'over_budget';
}

export interface FinancialHealth {
  score: number; // 0-100
  factors: {
    savingsRate: number;
    debtToIncome: number;
    emergencyFund: number;
    budgetAdherence: number;
  };
  recommendations: string[];
  lastUpdated: Date;
}