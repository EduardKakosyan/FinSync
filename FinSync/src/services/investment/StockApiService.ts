// Stock API Service for real-time market data
import { Investment } from '@/types';

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  open: number;
  previousClose: number;
  volume: number;
  marketCap?: number;
  pe?: number;
  eps?: number;
  week52High?: number;
  week52Low?: number;
  dividendYield?: number;
  lastUpdated: Date;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
  matchScore: number;
}

export interface MarketOverview {
  indices: {
    name: string;
    value: number;
    change: number;
    changePercent: number;
  }[];
  topGainers: StockQuote[];
  topLosers: StockQuote[];
  mostActive: StockQuote[];
}

class StockApiService {
  private static instance: StockApiService;
  private apiKey?: string;
  private baseUrl = 'https://api.twelvedata.com/'; // Using Twelve Data API as example
  
  // Cache for API responses
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 60000; // 1 minute cache

  private constructor() {}

  public static getInstance(): StockApiService {
    if (!StockApiService.instance) {
      StockApiService.instance = new StockApiService();
    }
    return StockApiService.instance;
  }

  /**
   * Configure API credentials
   */
  public configure(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Get real-time quote for a stock symbol
   */
  async getQuote(symbol: string): Promise<StockQuote> {
    const cacheKey = `quote_${symbol}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // For demo purposes, returning mock data
      // In production, replace with actual API call
      const mockQuote: StockQuote = {
        symbol: symbol.toUpperCase(),
        name: this.getMockCompanyName(symbol),
        price: this.generateMockPrice(symbol),
        change: this.generateMockChange(),
        changePercent: 0,
        dayHigh: 0,
        dayLow: 0,
        open: 0,
        previousClose: 0,
        volume: Math.floor(Math.random() * 10000000),
        marketCap: Math.floor(Math.random() * 1000000000),
        pe: Math.random() * 30,
        eps: Math.random() * 10,
        week52High: 0,
        week52Low: 0,
        dividendYield: Math.random() * 5,
        lastUpdated: new Date(),
      };

      // Calculate derived values
      mockQuote.previousClose = mockQuote.price - mockQuote.change;
      mockQuote.changePercent = (mockQuote.change / mockQuote.previousClose) * 100;
      mockQuote.open = mockQuote.previousClose + (Math.random() - 0.5) * 2;
      mockQuote.dayHigh = mockQuote.price + Math.random() * 5;
      mockQuote.dayLow = mockQuote.price - Math.random() * 5;
      mockQuote.week52High = mockQuote.price * (1 + Math.random() * 0.5);
      mockQuote.week52Low = mockQuote.price * (1 - Math.random() * 0.3);

      this.setCache(cacheKey, mockQuote);
      return mockQuote;
    } catch (error) {
      console.error('Error fetching stock quote:', error);
      throw error;
    }
  }

  /**
   * Get quotes for multiple symbols
   */
  async getBatchQuotes(symbols: string[]): Promise<Map<string, StockQuote>> {
    const quotes = new Map<string, StockQuote>();
    
    // Fetch quotes in parallel
    const promises = symbols.map(symbol => 
      this.getQuote(symbol).then(quote => quotes.set(symbol, quote))
    );
    
    await Promise.all(promises);
    return quotes;
  }

  /**
   * Search for stocks by name or symbol
   */
  async searchStocks(query: string): Promise<StockSearchResult[]> {
    const cacheKey = `search_${query}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Mock search results for demo
      const mockResults: StockSearchResult[] = [
        {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          type: 'Common Stock',
          region: 'United States',
          currency: 'USD',
          matchScore: 1.0,
        },
        {
          symbol: 'GOOGL',
          name: 'Alphabet Inc.',
          type: 'Common Stock',
          region: 'United States',
          currency: 'USD',
          matchScore: 0.9,
        },
        {
          symbol: 'MSFT',
          name: 'Microsoft Corporation',
          type: 'Common Stock',
          region: 'United States',
          currency: 'USD',
          matchScore: 0.8,
        },
        {
          symbol: 'TD',
          name: 'Toronto-Dominion Bank',
          type: 'Common Stock',
          region: 'Canada',
          currency: 'CAD',
          matchScore: 0.7,
        },
        {
          symbol: 'RY',
          name: 'Royal Bank of Canada',
          type: 'Common Stock',
          region: 'Canada',
          currency: 'CAD',
          matchScore: 0.6,
        },
      ].filter(stock => 
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        stock.name.toLowerCase().includes(query.toLowerCase())
      );

      this.setCache(cacheKey, mockResults);
      return mockResults;
    } catch (error) {
      console.error('Error searching stocks:', error);
      throw error;
    }
  }

  /**
   * Get market overview with indices and top movers
   */
  async getMarketOverview(): Promise<MarketOverview> {
    const cacheKey = 'market_overview';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Mock market overview for demo
      const overview: MarketOverview = {
        indices: [
          {
            name: 'S&P 500',
            value: 4500 + Math.random() * 100,
            change: (Math.random() - 0.5) * 50,
            changePercent: 0,
          },
          {
            name: 'Dow Jones',
            value: 35000 + Math.random() * 500,
            change: (Math.random() - 0.5) * 200,
            changePercent: 0,
          },
          {
            name: 'NASDAQ',
            value: 14000 + Math.random() * 200,
            change: (Math.random() - 0.5) * 100,
            changePercent: 0,
          },
          {
            name: 'TSX',
            value: 20000 + Math.random() * 200,
            change: (Math.random() - 0.5) * 100,
            changePercent: 0,
          },
        ],
        topGainers: [],
        topLosers: [],
        mostActive: [],
      };

      // Calculate change percentages
      overview.indices.forEach(index => {
        index.changePercent = (index.change / (index.value - index.change)) * 100;
      });

      // Generate top movers
      const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];
      for (const symbol of symbols) {
        const quote = await this.getQuote(symbol);
        overview.mostActive.push(quote);
        
        if (quote.changePercent > 2) {
          overview.topGainers.push(quote);
        } else if (quote.changePercent < -2) {
          overview.topLosers.push(quote);
        }
      }

      this.setCache(cacheKey, overview);
      return overview;
    } catch (error) {
      console.error('Error fetching market overview:', error);
      throw error;
    }
  }

  /**
   * Get historical data for a stock
   */
  async getHistoricalData(
    symbol: string,
    interval: '1d' | '1w' | '1m' | '3m' | '1y' = '1m'
  ): Promise<{ date: Date; price: number }[]> {
    const cacheKey = `history_${symbol}_${interval}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Generate mock historical data
      const dataPoints = 30;
      const currentPrice = (await this.getQuote(symbol)).price;
      const history: { date: Date; price: number }[] = [];

      for (let i = dataPoints - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Generate price with random walk
        const randomChange = (Math.random() - 0.5) * 0.02; // ±2% daily change
        const price = currentPrice * (1 - i * 0.001) * (1 + randomChange);
        
        history.push({ date, price });
      }

      this.setCache(cacheKey, history);
      return history;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  }

  /**
   * Calculate portfolio performance
   */
  async calculatePortfolioPerformance(investments: Investment[]): Promise<{
    totalValue: number;
    totalCost: number;
    totalGainLoss: number;
    totalGainLossPercent: number;
    dayChange: number;
    dayChangePercent: number;
  }> {
    const quotes = await this.getBatchQuotes(investments.map(inv => inv.symbol));
    
    let totalValue = 0;
    let totalCost = 0;
    let dayChange = 0;

    for (const investment of investments) {
      const quote = quotes.get(investment.symbol);
      if (quote) {
        const currentValue = quote.price * investment.shares;
        const cost = investment.purchasePrice * investment.shares;
        
        totalValue += currentValue;
        totalCost += cost;
        dayChange += quote.change * investment.shares;
      }
    }

    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
    const dayChangePercent = totalValue > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalGainLoss,
      totalGainLossPercent,
      dayChange,
      dayChangePercent,
    };
  }

  /**
   * Get stock news and research
   */
  async getStockNews(symbol: string): Promise<{
    title: string;
    summary: string;
    source: string;
    publishedAt: Date;
    url: string;
  }[]> {
    // Mock news for demo
    return [
      {
        title: `${symbol} Reports Strong Q4 Earnings`,
        summary: 'Company beats analyst expectations with record revenue growth.',
        source: 'Financial Times',
        publishedAt: new Date(Date.now() - 3600000),
        url: '#',
      },
      {
        title: `Analysts Upgrade ${symbol} Price Target`,
        summary: 'Major investment firms raise price targets following positive guidance.',
        source: 'Bloomberg',
        publishedAt: new Date(Date.now() - 7200000),
        url: '#',
      },
      {
        title: `${symbol} Announces New Product Launch`,
        summary: 'Company unveils innovative solution targeting emerging markets.',
        source: 'Reuters',
        publishedAt: new Date(Date.now() - 86400000),
        url: '#',
      },
    ];
  }

  // Helper methods
  private getMockCompanyName(symbol: string): string {
    const companies: { [key: string]: string } = {
      'AAPL': 'Apple Inc.',
      'GOOGL': 'Alphabet Inc.',
      'MSFT': 'Microsoft Corporation',
      'AMZN': 'Amazon.com Inc.',
      'TSLA': 'Tesla Inc.',
      'TD': 'Toronto-Dominion Bank',
      'RY': 'Royal Bank of Canada',
      'BCE': 'BCE Inc.',
      'CNR': 'Canadian National Railway',
      'SU': 'Suncor Energy Inc.',
    };
    return companies[symbol.toUpperCase()] || `${symbol.toUpperCase()} Corporation`;
  }

  private generateMockPrice(symbol: string): number {
    const basePrices: { [key: string]: number } = {
      'AAPL': 175,
      'GOOGL': 140,
      'MSFT': 380,
      'AMZN': 170,
      'TSLA': 240,
      'TD': 85,
      'RY': 130,
      'BCE': 45,
      'CNR': 160,
      'SU': 40,
    };
    const base = basePrices[symbol.toUpperCase()] || 100;
    return base + (Math.random() - 0.5) * 10;
  }

  private generateMockChange(): number {
    return (Math.random() - 0.5) * 10;
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

export const stockApiService = StockApiService.getInstance();
export default stockApiService;