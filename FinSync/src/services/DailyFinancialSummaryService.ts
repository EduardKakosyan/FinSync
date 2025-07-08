// Daily Financial Summary Service for FinSync
import { Investment, Transaction } from '@/types';
import { perplexityApiService, DailySummary } from './investment/PerplexityApiService';
import { investmentService } from './storage/InvestmentService';
import { transactionService } from './storage/TransactionService';
import { stockApiService } from './investment/StockApiService';
import { formatCurrency } from '@/utils/currencyUtils';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export interface PersonalizedSummary {
  date: Date;
  greeting: string;
  portfolioSnapshot: {
    totalValue: number;
    dayChange: number;
    dayChangePercent: number;
    topMover: {
      symbol: string;
      change: number;
      changePercent: number;
    } | null;
  };
  recentTransactions: {
    count: number;
    totalSpent: number;
    topCategory: string;
  };
  aiInsights: {
    marketSummary: string;
    portfolioRecommendations: string[];
    spendingInsights: string[];
    canadianFocus: string;
  };
  upcomingReminders: string[];
  motivationalMessage: string;
}

export interface WeeklyReview {
  week: string;
  portfolioPerformance: {
    startValue: number;
    endValue: number;
    change: number;
    changePercent: number;
    bestPerformer: string;
    worstPerformer: string;
  };
  spendingAnalysis: {
    totalSpent: number;
    budgetUtilization: number;
    topCategories: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
    comparedToLastWeek: number;
  };
  achievements: string[];
  actionItems: string[];
  weeklyGoals: string[];
}

class DailyFinancialSummaryService {
  private static instance: DailyFinancialSummaryService;
  
  private constructor() {}

  public static getInstance(): DailyFinancialSummaryService {
    if (!DailyFinancialSummaryService.instance) {
      DailyFinancialSummaryService.instance = new DailyFinancialSummaryService();
    }
    return DailyFinancialSummaryService.instance;
  }

  /**
   * Generate personalized daily summary
   */
  async generateDailySummary(): Promise<PersonalizedSummary> {
    try {
      const [investments, dailyTransactions] = await Promise.all([
        investmentService.getAll(),
        this.getTodaysTransactions(),
      ]);

      // Get portfolio snapshot
      const portfolioSnapshot = await this.getPortfolioSnapshot(investments);
      
      // Get recent spending data
      const recentTransactions = await this.getRecentTransactionsSummary();
      
      // Generate AI insights
      const aiInsights = await this.generateAIInsights(investments, dailyTransactions);
      
      // Get upcoming reminders
      const upcomingReminders = await this.getUpcomingReminders();
      
      // Generate motivational message
      const motivationalMessage = this.generateMotivationalMessage(portfolioSnapshot);

      return {
        date: new Date(),
        greeting: this.generatePersonalizedGreeting(),
        portfolioSnapshot,
        recentTransactions,
        aiInsights,
        upcomingReminders,
        motivationalMessage,
      };
    } catch (error) {
      console.error('Error generating daily summary:', error);
      return this.getFallbackSummary();
    }
  }

  /**
   * Generate weekly financial review
   */
  async generateWeeklyReview(): Promise<WeeklyReview> {
    try {
      const weekStart = startOfDay(subDays(new Date(), 7));
      const weekEnd = endOfDay(new Date());
      
      const [investments, weeklyTransactions] = await Promise.all([
        investmentService.getAll(),
        this.getTransactionsInRange(weekStart, weekEnd),
      ]);

      const portfolioPerformance = await this.getWeeklyPortfolioPerformance(investments);
      const spendingAnalysis = await this.getWeeklySpendingAnalysis(weeklyTransactions);
      const achievements = await this.generateWeeklyAchievements(investments, weeklyTransactions);
      const actionItems = await this.generateActionItems(investments, weeklyTransactions);
      const weeklyGoals = this.generateWeeklyGoals();

      return {
        week: `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd, yyyy')}`,
        portfolioPerformance,
        spendingAnalysis,
        achievements,
        actionItems,
        weeklyGoals,
      };
    } catch (error) {
      console.error('Error generating weekly review:', error);
      return this.getFallbackWeeklyReview();
    }
  }

  /**
   * Get market insights for Halifax, NS
   */
  async getHalifaxMarketInsights(): Promise<{
    localEconomy: string;
    realEstate: string;
    employment: string;
    recommendations: string[];
  }> {
    return {
      localEconomy: 'Halifax economy shows steady growth with strong tech and maritime sectors',
      realEstate: 'Housing market remains active with moderate price appreciation',
      employment: 'Unemployment rate below national average, tech jobs growing',
      recommendations: [
        'Consider exposure to Canadian REITs',
        'Monitor Atlantic Canada tech companies',
        'Take advantage of tax-advantaged accounts (RRSP, TFSA)'
      ]
    };
  }

  // Private helper methods

  private async getTodaysTransactions(): Promise<Transaction[]> {
    try {
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);
      
      const allTransactions = await transactionService.getAll();
      return allTransactions.filter(transaction => 
        transaction.date >= startOfToday && transaction.date <= endOfToday
      );
    } catch (error) {
      console.error('Error getting today\'s transactions:', error);
      return [];
    }
  }

  private async getTransactionsInRange(start: Date, end: Date): Promise<Transaction[]> {
    try {
      const allTransactions = await transactionService.getAll();
      return allTransactions.filter(transaction => 
        transaction.date >= start && transaction.date <= end
      );
    } catch (error) {
      console.error('Error getting transactions in range:', error);
      return [];
    }
  }

  private async getPortfolioSnapshot(investments: Investment[]) {
    if (investments.length === 0) {
      return {
        totalValue: 0,
        dayChange: 0,
        dayChangePercent: 0,
        topMover: null,
      };
    }

    try {
      const portfolioStats = await stockApiService.calculatePortfolioPerformance(investments);
      const quotes = await stockApiService.getBatchQuotes(investments.map(inv => inv.symbol));
      
      // Find top mover
      let topMover = null;
      let maxChange = 0;
      
      for (const investment of investments) {
        const quote = quotes.get(investment.symbol);
        if (quote && Math.abs(quote.changePercent) > Math.abs(maxChange)) {
          maxChange = quote.changePercent;
          topMover = {
            symbol: investment.symbol,
            change: quote.change,
            changePercent: quote.changePercent,
          };
        }
      }

      return {
        totalValue: portfolioStats.totalValue,
        dayChange: portfolioStats.dayChange,
        dayChangePercent: portfolioStats.dayChangePercent,
        topMover,
      };
    } catch (error) {
      console.error('Error getting portfolio snapshot:', error);
      return {
        totalValue: 0,
        dayChange: 0,
        dayChangePercent: 0,
        topMover: null,
      };
    }
  }

  private async getRecentTransactionsSummary() {
    try {
      const last7Days = subDays(new Date(), 7);
      const recentTransactions = await this.getTransactionsInRange(last7Days, new Date());
      
      const expenses = recentTransactions.filter(t => t.type === 'expense');
      const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);
      
      // Find top category
      const categorySpending = new Map<string, number>();
      expenses.forEach(transaction => {
        const current = categorySpending.get(transaction.category) || 0;
        categorySpending.set(transaction.category, current + transaction.amount);
      });
      
      let topCategory = 'No expenses';
      let maxAmount = 0;
      categorySpending.forEach((amount, category) => {
        if (amount > maxAmount) {
          maxAmount = amount;
          topCategory = category;
        }
      });

      return {
        count: expenses.length,
        totalSpent,
        topCategory,
      };
    } catch (error) {
      console.error('Error getting recent transactions summary:', error);
      return {
        count: 0,
        totalSpent: 0,
        topCategory: 'No data',
      };
    }
  }

  private async generateAIInsights(investments: Investment[], transactions: Transaction[]) {
    try {
      // Generate AI-powered insights using Perplexity
      const dailySummary = await perplexityApiService.generateDailySummary(investments);
      
      return {
        marketSummary: dailySummary.marketOverview.sentiment === 'positive' 
          ? 'Markets are showing positive momentum today'
          : dailySummary.marketOverview.sentiment === 'negative'
          ? 'Markets facing headwinds today'
          : 'Mixed market conditions today',
        portfolioRecommendations: dailySummary.portfolioInsights.recommendations,
        spendingInsights: this.generateSpendingInsights(transactions),
        canadianFocus: dailySummary.canadianMarketFocus.tsxPerformance,
      };
    } catch (error) {
      console.error('Error generating AI insights:', error);
      return {
        marketSummary: 'Market data temporarily unavailable',
        portfolioRecommendations: ['Review your portfolio regularly'],
        spendingInsights: ['Track your daily expenses'],
        canadianFocus: 'Canadian market data unavailable',
      };
    }
  }

  private generateSpendingInsights(transactions: Transaction[]): string[] {
    const insights: string[] = [];
    
    if (transactions.length === 0) {
      insights.push('No transactions today - great job staying on budget!');
      return insights;
    }

    const expenses = transactions.filter(t => t.type === 'expense');
    const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);
    
    if (totalSpent > 100) {
      insights.push('Higher spending today - consider if all purchases were necessary');
    } else if (totalSpent > 0) {
      insights.push('Moderate spending today - staying within reasonable limits');
    }

    // Category analysis
    const categories = new Set(expenses.map(t => t.category));
    if (categories.has('Food & Dining')) {
      insights.push('Consider meal planning to reduce dining expenses');
    }
    
    return insights;
  }

  private async getUpcomingReminders(): Promise<string[]> {
    // Mock reminders - in real implementation, this would check reminder service
    return [
      'Review monthly budget this weekend',
      'Consider rebalancing portfolio',
      'Tax season approaching - gather documents',
    ];
  }

  private generatePersonalizedGreeting(): string {
    const hour = new Date().getHours();
    const greetings = {
      morning: ['Good morning! 🌅', 'Rise and shine! ☀️', 'Morning, financial rockstar! 🚀'],
      afternoon: ['Good afternoon! 🌞', 'Hope your day is going well! 💪', 'Afternoon check-in! 📈'],
      evening: ['Good evening! 🌆', 'Wrapping up the day! 🌙', 'Evening review time! ⭐']
    };
    
    let timeOfDay: keyof typeof greetings;
    if (hour < 12) timeOfDay = 'morning';
    else if (hour < 18) timeOfDay = 'afternoon';
    else timeOfDay = 'evening';
    
    const options = greetings[timeOfDay];
    return options[Math.floor(Math.random() * options.length)];
  }

  private generateMotivationalMessage(portfolioSnapshot: any): string {
    const messages = [
      'Every dollar saved is a dollar earned! 💰',
      'Building wealth one day at a time! 📈',
      'Your future self will thank you! 🙏',
      'Consistency is key to financial success! 🔑',
      'Small steps lead to big results! 🎯',
      'You\'re investing in your future! 🌟',
    ];

    if (portfolioSnapshot.dayChange > 0) {
      return 'Great day for your portfolio! Keep up the momentum! 🚀';
    } else if (portfolioSnapshot.dayChange < 0) {
      return 'Market dips are buying opportunities! Stay the course! 💪';
    }
    
    return messages[Math.floor(Math.random() * messages.length)];
  }

  private async getWeeklyPortfolioPerformance(investments: Investment[]) {
    // Mock implementation - would calculate actual weekly performance
    return {
      startValue: 10000,
      endValue: 10250,
      change: 250,
      changePercent: 2.5,
      bestPerformer: 'AAPL (+5.2%)',
      worstPerformer: 'Energy Sector (-1.1%)',
    };
  }

  private async getWeeklySpendingAnalysis(transactions: Transaction[]) {
    const expenses = transactions.filter(t => t.type === 'expense');
    const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate category breakdown
    const categorySpending = new Map<string, number>();
    expenses.forEach(transaction => {
      const current = categorySpending.get(transaction.category) || 0;
      categorySpending.set(transaction.category, current + transaction.amount);
    });
    
    const topCategories = Array.from(categorySpending.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalSpent) * 100,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    return {
      totalSpent,
      budgetUtilization: 75, // Mock budget utilization
      topCategories,
      comparedToLastWeek: -50, // Mock comparison
    };
  }

  private async generateWeeklyAchievements(investments: Investment[], transactions: Transaction[]): Promise<string[]> {
    const achievements: string[] = [];
    
    achievements.push('Stayed within budget for 5 out of 7 days');
    achievements.push('Portfolio outperformed the market this week');
    achievements.push('Tracked all expenses consistently');
    
    return achievements;
  }

  private async generateActionItems(investments: Investment[], transactions: Transaction[]): Promise<string[]> {
    return [
      'Review and categorize any missed transactions',
      'Consider increasing TFSA contributions',
      'Research dividend-paying Canadian stocks',
      'Plan next week\'s grocery budget',
    ];
  }

  private generateWeeklyGoals(): string[] {
    return [
      'Limit dining out to 3 times this week',
      'Save $100 in discretionary spending',
      'Research one new investment opportunity',
      'Review portfolio allocation',
    ];
  }

  private getFallbackSummary(): PersonalizedSummary {
    return {
      date: new Date(),
      greeting: 'Hello! 👋',
      portfolioSnapshot: {
        totalValue: 0,
        dayChange: 0,
        dayChangePercent: 0,
        topMover: null,
      },
      recentTransactions: {
        count: 0,
        totalSpent: 0,
        topCategory: 'No data',
      },
      aiInsights: {
        marketSummary: 'Data temporarily unavailable',
        portfolioRecommendations: [],
        spendingInsights: [],
        canadianFocus: 'Check back later',
      },
      upcomingReminders: [],
      motivationalMessage: 'Keep building your financial future! 💪',
    };
  }

  private getFallbackWeeklyReview(): WeeklyReview {
    return {
      week: 'This week',
      portfolioPerformance: {
        startValue: 0,
        endValue: 0,
        change: 0,
        changePercent: 0,
        bestPerformer: 'N/A',
        worstPerformer: 'N/A',
      },
      spendingAnalysis: {
        totalSpent: 0,
        budgetUtilization: 0,
        topCategories: [],
        comparedToLastWeek: 0,
      },
      achievements: [],
      actionItems: [],
      weeklyGoals: [],
    };
  }
}

export const dailyFinancialSummaryService = DailyFinancialSummaryService.getInstance();
export default dailyFinancialSummaryService;