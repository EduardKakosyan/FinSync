/**
 * Investment Data Service for FinSync Financial App
 * Handles CRUD operations for investment portfolio data
 */

import BaseDataService from './BaseDataService';
import { STORAGE_KEYS } from './StorageKeys';
import {
  Investment,
  ValidationResult,
  ValidationError,
  DateRange,
} from '../../types';
import { isWithinInterval } from 'date-fns';

export class InvestmentService extends BaseDataService<Investment> {
  constructor() {
    super(STORAGE_KEYS.INVESTMENTS, 'investment');
  }

  /**
   * Validate investment data
   */
  protected validateEntity(investment: Partial<Investment>): ValidationResult {
    const errors: ValidationError[] = [];

    // Required fields validation
    if (!investment.symbol || investment.symbol.trim().length === 0) {
      errors.push({
        field: 'symbol',
        message: 'Stock symbol is required',
        code: 'REQUIRED',
        value: investment.symbol,
      });
    }

    if (!investment.name || investment.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Investment name is required',
        code: 'REQUIRED',
        value: investment.name,
      });
    }

    // Validate shares
    if (investment.shares === undefined || investment.shares <= 0) {
      errors.push({
        field: 'shares',
        message: 'Number of shares must be greater than 0',
        code: 'MIN_VALUE',
        value: investment.shares,
      });
    }

    // Validate purchase price
    if (investment.purchasePrice === undefined || investment.purchasePrice <= 0) {
      errors.push({
        field: 'purchasePrice',
        message: 'Purchase price must be greater than 0',
        code: 'MIN_VALUE',
        value: investment.purchasePrice,
      });
    }

    // Validate current value
    if (investment.currentValue !== undefined && investment.currentValue < 0) {
      errors.push({
        field: 'currentValue',
        message: 'Current value cannot be negative',
        code: 'MIN_VALUE',
        value: investment.currentValue,
      });
    }

    // Validate purchase date
    if (investment.purchaseDate && investment.purchaseDate > new Date()) {
      errors.push({
        field: 'purchaseDate',
        message: 'Purchase date cannot be in the future',
        code: 'INVALID_DATE',
        value: investment.purchaseDate,
      });
    }

    // Validate investment type
    const validTypes = ['stock', 'bond', 'crypto', 'etf', 'mutual_fund'];
    if (investment.type && !validTypes.includes(investment.type)) {
      errors.push({
        field: 'type',
        message: `Investment type must be one of: ${validTypes.join(', ')}`,
        code: 'INVALID_VALUE',
        value: investment.type,
      });
    }

    // Validate account ID
    if (!investment.accountId || investment.accountId.trim().length === 0) {
      errors.push({
        field: 'accountId',
        message: 'Account ID is required',
        code: 'REQUIRED',
        value: investment.accountId,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Transform investment for storage
   */
  protected transformForStorage(investment: Investment): any {
    return {
      ...investment,
      purchaseDate: investment.purchaseDate.toISOString(),
      createdAt: investment.createdAt.toISOString(),
      updatedAt: investment.updatedAt.toISOString(),
    };
  }

  /**
   * Transform investment from storage
   */
  protected transformFromStorage(data: any): Investment {
    return {
      ...data,
      purchaseDate: new Date(data.purchaseDate),
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    };
  }

  /**
   * Update investment with current market value
   */
  async updateCurrentValue(investmentId: string, currentValue: number): Promise<Investment> {
    return this.update(investmentId, { 
      currentValue,
      updatedAt: new Date(),
    });
  }

  /**
   * Get investments by account
   */
  async getByAccount(accountId: string): Promise<Investment[]> {
    const investments = await this.getAll();
    return investments.filter(investment => investment.accountId === accountId);
  }

  /**
   * Get investments by type
   */
  async getByType(type: Investment['type']): Promise<Investment[]> {
    const investments = await this.getAll();
    return investments.filter(investment => investment.type === type);
  }

  /**
   * Get investments by symbol
   */
  async getBySymbol(symbol: string): Promise<Investment[]> {
    const investments = await this.getAll();
    return investments.filter(investment => 
      investment.symbol.toUpperCase() === symbol.toUpperCase()
    );
  }

  /**
   * Get investments purchased within date range
   */
  async getByPurchaseDateRange(startDate: Date, endDate: Date): Promise<Investment[]> {
    const investments = await this.getAll();
    return investments.filter(investment =>
      isWithinInterval(investment.purchaseDate, { start: startDate, end: endDate })
    );
  }

  /**
   * Calculate total portfolio value
   */
  async getTotalPortfolioValue(): Promise<number> {
    const investments = await this.getAll();
    return investments.reduce((total, investment) => 
      total + (investment.currentValue * investment.shares), 0
    );
  }

  /**
   * Calculate total cost basis
   */
  async getTotalCostBasis(): Promise<number> {
    const investments = await this.getAll();
    return investments.reduce((total, investment) => 
      total + (investment.purchasePrice * investment.shares), 0
    );
  }

  /**
   * Calculate portfolio gain/loss
   */
  async getPortfolioGainLoss(): Promise<{
    totalGain: number;
    totalGainPercent: number;
    investments: Array<{
      investment: Investment;
      gain: number;
      gainPercent: number;
    }>;
  }> {
    const investments = await this.getAll();
    const results = investments.map(investment => {
      const cost = investment.purchasePrice * investment.shares;
      const value = investment.currentValue * investment.shares;
      const gain = value - cost;
      const gainPercent = cost > 0 ? (gain / cost) * 100 : 0;

      return {
        investment,
        gain,
        gainPercent,
      };
    });

    const totalCost = await this.getTotalCostBasis();
    const totalValue = await this.getTotalPortfolioValue();
    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    return {
      totalGain,
      totalGainPercent,
      investments: results,
    };
  }

  /**
   * Get top performers
   */
  async getTopPerformers(limit: number = 5): Promise<Investment[]> {
    const { investments } = await this.getPortfolioGainLoss();
    return investments
      .sort((a, b) => b.gainPercent - a.gainPercent)
      .slice(0, limit)
      .map(item => item.investment);
  }

  /**
   * Get worst performers
   */
  async getWorstPerformers(limit: number = 5): Promise<Investment[]> {
    const { investments } = await this.getPortfolioGainLoss();
    return investments
      .sort((a, b) => a.gainPercent - b.gainPercent)
      .slice(0, limit)
      .map(item => item.investment);
  }

  /**
   * Get portfolio diversification
   */
  async getPortfolioDiversification(): Promise<{
    byType: Map<Investment['type'], { count: number; value: number; percentage: number }>;
    bySymbol: Map<string, { count: number; value: number; percentage: number }>;
  }> {
    const investments = await this.getAll();
    const totalValue = await this.getTotalPortfolioValue();

    const byType = new Map<Investment['type'], any>();
    const bySymbol = new Map<string, any>();

    // Calculate by type
    for (const investment of investments) {
      const value = investment.currentValue * investment.shares;
      
      // By type
      const typeData = byType.get(investment.type) || { count: 0, value: 0, percentage: 0 };
      typeData.count += 1;
      typeData.value += value;
      byType.set(investment.type, typeData);

      // By symbol
      const symbolData = bySymbol.get(investment.symbol) || { count: 0, value: 0, percentage: 0 };
      symbolData.count += investment.shares;
      symbolData.value += value;
      bySymbol.set(investment.symbol, symbolData);
    }

    // Calculate percentages
    byType.forEach((data, key) => {
      data.percentage = totalValue > 0 ? (data.value / totalValue) * 100 : 0;
    });

    bySymbol.forEach((data, key) => {
      data.percentage = totalValue > 0 ? (data.value / totalValue) * 100 : 0;
    });

    return { byType, bySymbol };
  }

  /**
   * Add shares to existing investment (dollar cost averaging)
   */
  async addShares(
    investmentId: string,
    additionalShares: number,
    purchasePrice: number
  ): Promise<Investment> {
    const investment = await this.getById(investmentId);
    if (!investment) {
      throw new Error(`Investment not found: ${investmentId}`);
    }

    // Calculate new average purchase price
    const totalCost = (investment.purchasePrice * investment.shares) + 
                     (purchasePrice * additionalShares);
    const totalShares = investment.shares + additionalShares;
    const newAveragePrice = totalCost / totalShares;

    return this.update(investmentId, {
      shares: totalShares,
      purchasePrice: newAveragePrice,
      updatedAt: new Date(),
    });
  }

  /**
   * Sell shares from investment
   */
  async sellShares(
    investmentId: string,
    sharesToSell: number,
    sellPrice: number
  ): Promise<{
    investment: Investment;
    realized: {
      proceeds: number;
      costBasis: number;
      gain: number;
      gainPercent: number;
    };
  }> {
    const investment = await this.getById(investmentId);
    if (!investment) {
      throw new Error(`Investment not found: ${investmentId}`);
    }

    if (sharesToSell > investment.shares) {
      throw new Error('Cannot sell more shares than owned');
    }

    const costBasis = investment.purchasePrice * sharesToSell;
    const proceeds = sellPrice * sharesToSell;
    const gain = proceeds - costBasis;
    const gainPercent = costBasis > 0 ? (gain / costBasis) * 100 : 0;

    const remainingShares = investment.shares - sharesToSell;
    
    if (remainingShares === 0) {
      // Sold all shares, delete investment
      await this.delete(investmentId);
      return {
        investment: { ...investment, shares: 0 },
        realized: { proceeds, costBasis, gain, gainPercent },
      };
    } else {
      // Update remaining shares
      const updated = await this.update(investmentId, {
        shares: remainingShares,
        updatedAt: new Date(),
      });

      return {
        investment: updated,
        realized: { proceeds, costBasis, gain, gainPercent },
      };
    }
  }

  /**
   * Get investment statistics
   */
  async getInvestmentStats(): Promise<{
    totalInvestments: number;
    uniqueSymbols: number;
    totalValue: number;
    totalCost: number;
    totalGain: number;
    totalGainPercent: number;
    averageHoldingPeriod: number;
    typeDistribution: Map<Investment['type'], number>;
  }> {
    const investments = await this.getAll();
    const uniqueSymbols = new Set(investments.map(inv => inv.symbol)).size;
    const totalValue = await this.getTotalPortfolioValue();
    const totalCost = await this.getTotalCostBasis();
    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    // Calculate average holding period
    const now = new Date();
    const holdingPeriods = investments.map(inv => 
      (now.getTime() - inv.purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const averageHoldingPeriod = holdingPeriods.length > 0
      ? holdingPeriods.reduce((sum, period) => sum + period, 0) / holdingPeriods.length
      : 0;

    // Type distribution
    const typeDistribution = new Map<Investment['type'], number>();
    investments.forEach(inv => {
      const count = typeDistribution.get(inv.type) || 0;
      typeDistribution.set(inv.type, count + 1);
    });

    return {
      totalInvestments: investments.length,
      uniqueSymbols,
      totalValue,
      totalCost,
      totalGain,
      totalGainPercent,
      averageHoldingPeriod,
      typeDistribution,
    };
  }

  /**
   * Search investments by text
   */
  protected filterByText(investments: Investment[], text: string): Investment[] {
    const searchTerm = text.toLowerCase();
    return investments.filter(investment => {
      return (
        investment.symbol.toLowerCase().includes(searchTerm) ||
        investment.name.toLowerCase().includes(searchTerm) ||
        investment.type.toLowerCase().includes(searchTerm)
      );
    });
  }

  /**
   * Filter by date range
   */
  protected filterByDateRange(investments: Investment[], dateRange: DateRange): Investment[] {
    return investments.filter(investment =>
      isWithinInterval(investment.purchaseDate, {
        start: dateRange.startDate,
        end: dateRange.endDate,
      })
    );
  }
}