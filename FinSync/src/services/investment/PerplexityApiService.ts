// Perplexity AI API Service for Stock Research and Financial Analysis
import { Investment } from '@/types';
import { stockApiService } from './StockApiService';

export interface StockResearchResponse {
  symbol: string;
  companyName: string;
  analysis: {
    summary: string;
    strengths: string[];
    risks: string[];
    outlook: 'bullish' | 'bearish' | 'neutral';
    priceTarget?: number;
    timeHorizon?: string;
  };
  financials: {
    revenue: string;
    growth: string;
    profitability: string;
    debt: string;
  };
  sources: string[];
  lastUpdated: Date;
}

export interface DailySummary {
  date: Date;
  marketOverview: {
    sentiment: 'positive' | 'negative' | 'neutral';
    keyEvents: string[];
    economicIndicators: string[];
  };
  portfolioInsights: {
    performance: string;
    topPerformers: string[];
    underperformers: string[];
    recommendations: string[];
  };
  newsHighlights: {
    title: string;
    summary: string;
    relevance: 'high' | 'medium' | 'low';
    symbols: string[];
  }[];
  canadianMarketFocus: {
    tsxPerformance: string;
    sectorHighlights: string[];
    economicNews: string[];
  };
}

export interface MarketNewsItem {
  title: string;
  summary: string;
  fullContent: string;
  source: string;
  publishedAt: Date;
  relevantSymbols: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  impact: 'high' | 'medium' | 'low';
}

class PerplexityApiService {
  private static instance: PerplexityApiService;
  private apiKey?: string;
  private baseUrl = 'https://api.perplexity.ai/chat/completions';
  
  // Cache for API responses
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 3600000; // 1 hour cache

  private constructor() {}

  public static getInstance(): PerplexityApiService {
    if (!PerplexityApiService.instance) {
      PerplexityApiService.instance = new PerplexityApiService();
    }
    return PerplexityApiService.instance;
  }

  /**
   * Configure API credentials
   */
  public configure(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Research a stock symbol using Perplexity AI
   */
  async researchStock(symbol: string): Promise<StockResearchResponse> {
    const cacheKey = `research_${symbol}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const query = this.buildStockResearchQuery(symbol);
      const response = await this.queryPerplexity(query);
      
      // Parse response and structure data
      const research = this.parseStockResearch(symbol, response);
      
      this.setCache(cacheKey, research);
      return research;
    } catch (error) {
      console.error('Error researching stock:', error);
      return this.getFallbackStockResearch(symbol);
    }
  }

  /**
   * Generate daily financial summary using Perplexity AI
   */
  async generateDailySummary(investments: Investment[]): Promise<DailySummary> {
    const cacheKey = `daily_summary_${new Date().toDateString()}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const symbols = investments.map(inv => inv.symbol);
      const query = this.buildDailySummaryQuery(symbols);
      const response = await this.queryPerplexity(query);
      
      const summary = this.parseDailySummary(response);
      
      this.setCache(cacheKey, summary);
      return summary;
    } catch (error) {
      console.error('Error generating daily summary:', error);
      return this.getFallbackDailySummary();
    }
  }

  /**
   * Get market news and analysis
   */
  async getMarketNews(symbols: string[] = []): Promise<MarketNewsItem[]> {
    const cacheKey = `news_${symbols.join(',')}_${new Date().toDateString()}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const query = this.buildNewsQuery(symbols);
      const response = await this.queryPerplexity(query);
      
      const news = this.parseMarketNews(response);
      
      this.setCache(cacheKey, news);
      return news;
    } catch (error) {
      console.error('Error fetching market news:', error);
      return this.getFallbackNews();
    }
  }

  /**
   * Get Canadian market specific insights
   */
  async getCanadianMarketInsights(): Promise<{
    tsxAnalysis: string;
    bankingSector: string;
    resourceSector: string;
    economicOutlook: string;
    currency: string;
  }> {
    const cacheKey = `canadian_insights_${new Date().toDateString()}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const query = this.buildCanadianMarketQuery();
      const response = await this.queryPerplexity(query);
      
      const insights = this.parseCanadianInsights(response);
      
      this.setCache(cacheKey, insights);
      return insights;
    } catch (error) {
      console.error('Error fetching Canadian market insights:', error);
      return this.getFallbackCanadianInsights();
    }
  }

  // Private helper methods

  private async queryPerplexity(query: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Perplexity API key not configured');
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a financial analyst providing accurate, up-to-date market research and analysis. Focus on Canadian markets when relevant.',
          },
          {
            role: 'user',
            content: query,
          },
        ],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  private buildStockResearchQuery(symbol: string): string {
    return `
      Provide a comprehensive analysis of ${symbol} stock including:
      1. Company overview and recent performance
      2. Key strengths and competitive advantages
      3. Major risks and challenges
      4. Current financial metrics (revenue, growth, profitability)
      5. Analyst outlook and price targets
      6. Recent news and developments
      
      Focus on factual, current information with specific data points.
      Include Canadian market context if relevant.
    `;
  }

  private buildDailySummaryQuery(symbols: string[]): string {
    const portfolioSymbols = symbols.length > 0 ? symbols.join(', ') : 'broad market';
    
    return `
      Generate a daily financial market summary for ${new Date().toDateString()} focusing on:
      
      1. Overall market sentiment and key events today
      2. Performance of these portfolio holdings: ${portfolioSymbols}
      3. Canadian market highlights (TSX, major sectors)
      4. Economic indicators and news affecting markets
      5. Actionable insights for retail investors
      
      Keep it concise but informative, highlighting the most important developments.
    `;
  }

  private buildNewsQuery(symbols: string[]): string {
    const stockFilter = symbols.length > 0 ? ` related to ${symbols.join(', ')}` : '';
    
    return `
      Find the top 5 most important financial news stories from today${stockFilter}, including:
      1. Brief summary of each story
      2. Market impact assessment
      3. Relevant stock symbols affected
      4. Sentiment (positive/negative/neutral)
      
      Focus on news that would impact retail investors and Canadian markets.
    `;
  }

  private buildCanadianMarketQuery(): string {
    return `
      Provide insights on the Canadian financial markets today:
      1. TSX performance and sector highlights
      2. Banking sector (RY, TD, BMO, BNS, CM)
      3. Resource sector (energy, mining)
      4. CAD/USD currency movements
      5. Economic developments affecting Canadian markets
      
      Include specific data points and recent trends.
    `;
  }

  private parseStockResearch(symbol: string, response: string): StockResearchResponse {
    // Mock parsing - in real implementation, this would parse the AI response
    return {
      symbol: symbol.toUpperCase(),
      companyName: this.getCompanyName(symbol),
      analysis: {
        summary: `${symbol} shows strong fundamentals with consistent revenue growth and market expansion. Recent quarterly results exceeded expectations.`,
        strengths: [
          'Strong revenue growth',
          'Market-leading position',
          'Solid balance sheet',
          'Experienced management team'
        ],
        risks: [
          'Market volatility',
          'Competitive pressure',
          'Economic headwinds',
          'Regulatory changes'
        ],
        outlook: 'bullish',
        priceTarget: this.generatePriceTarget(symbol),
        timeHorizon: '12 months'
      },
      financials: {
        revenue: '$10.2B (↑15% YoY)',
        growth: '15% revenue growth',
        profitability: 'Net margin: 18%',
        debt: 'Debt/Equity: 0.4x'
      },
      sources: [
        'Bloomberg',
        'Financial Post',
        'Globe and Mail',
        'Yahoo Finance'
      ],
      lastUpdated: new Date()
    };
  }

  private parseDailySummary(response: string): DailySummary {
    // Mock parsing - in real implementation, this would parse the AI response
    return {
      date: new Date(),
      marketOverview: {
        sentiment: 'positive',
        keyEvents: [
          'Fed maintains interest rates',
          'Strong earnings reports',
          'Oil prices stabilize'
        ],
        economicIndicators: [
          'Unemployment rate steady at 3.7%',
          'Inflation showing signs of cooling',
          'Consumer confidence improving'
        ]
      },
      portfolioInsights: {
        performance: 'Portfolio up 1.2% today, outperforming broader market',
        topPerformers: ['AAPL (+2.5%)', 'MSFT (+1.8%)'],
        underperformers: ['Energy sector (-0.5%)'],
        recommendations: [
          'Consider taking profits on tech positions',
          'Monitor energy sector for buying opportunities'
        ]
      },
      newsHighlights: [
        {
          title: 'Tech Stocks Rally on AI Optimism',
          summary: 'Major technology companies see gains as AI investments show promise',
          relevance: 'high',
          symbols: ['AAPL', 'MSFT', 'GOOGL']
        },
        {
          title: 'Canadian Banks Report Strong Q4',
          summary: 'Big Six banks exceed expectations with solid loan growth',
          relevance: 'high',
          symbols: ['RY', 'TD', 'BMO']
        }
      ],
      canadianMarketFocus: {
        tsxPerformance: 'TSX up 0.8%, led by financials and tech',
        sectorHighlights: [
          'Financials +1.2%',
          'Technology +2.1%',
          'Energy -0.3%'
        ],
        economicNews: [
          'Bank of Canada holds rates steady',
          'GDP growth revised upward',
          'Housing market shows resilience'
        ]
      }
    };
  }

  private parseMarketNews(response: string): MarketNewsItem[] {
    // Mock parsing - in real implementation, this would parse the AI response
    return [
      {
        title: 'Federal Reserve Maintains Interest Rates',
        summary: 'Central bank keeps rates unchanged, citing economic stability',
        fullContent: 'The Federal Reserve announced today that it will maintain current interest rates...',
        source: 'Reuters',
        publishedAt: new Date(),
        relevantSymbols: ['SPY', 'QQQ'],
        sentiment: 'positive',
        impact: 'high'
      },
      {
        title: 'Canadian Dollar Strengthens Against USD',
        summary: 'CAD gains ground on positive economic data',
        fullContent: 'The Canadian dollar strengthened today following...',
        source: 'Financial Post',
        publishedAt: new Date(),
        relevantSymbols: ['CAD'],
        sentiment: 'positive',
        impact: 'medium'
      }
    ];
  }

  private parseCanadianInsights(response: string): any {
    return {
      tsxAnalysis: 'TSX Composite gained 0.8% today, outperforming global markets',
      bankingSector: 'Canadian banks showing resilience with strong Q4 earnings',
      resourceSector: 'Oil and gas sector mixed on global demand concerns',
      economicOutlook: 'Bank of Canada maintains dovish stance, supporting growth',
      currency: 'CAD strengthening on positive economic data'
    };
  }

  private getFallbackStockResearch(symbol: string): StockResearchResponse {
    return {
      symbol: symbol.toUpperCase(),
      companyName: this.getCompanyName(symbol),
      analysis: {
        summary: 'Analysis temporarily unavailable. Please check back later.',
        strengths: ['Historical performance', 'Market position'],
        risks: ['Market volatility', 'Economic uncertainty'],
        outlook: 'neutral'
      },
      financials: {
        revenue: 'Data unavailable',
        growth: 'Data unavailable',
        profitability: 'Data unavailable',
        debt: 'Data unavailable'
      },
      sources: [],
      lastUpdated: new Date()
    };
  }

  private getFallbackDailySummary(): DailySummary {
    return {
      date: new Date(),
      marketOverview: {
        sentiment: 'neutral',
        keyEvents: ['Market data temporarily unavailable'],
        economicIndicators: []
      },
      portfolioInsights: {
        performance: 'Analysis unavailable',
        topPerformers: [],
        underperformers: [],
        recommendations: []
      },
      newsHighlights: [],
      canadianMarketFocus: {
        tsxPerformance: 'Data unavailable',
        sectorHighlights: [],
        economicNews: []
      }
    };
  }

  private getFallbackNews(): MarketNewsItem[] {
    return [
      {
        title: 'Market News Temporarily Unavailable',
        summary: 'Please check back later for the latest market updates',
        fullContent: '',
        source: 'FinSync',
        publishedAt: new Date(),
        relevantSymbols: [],
        sentiment: 'neutral',
        impact: 'low'
      }
    ];
  }

  private getFallbackCanadianInsights(): any {
    return {
      tsxAnalysis: 'Analysis temporarily unavailable',
      bankingSector: 'Data unavailable',
      resourceSector: 'Data unavailable',
      economicOutlook: 'Data unavailable',
      currency: 'Data unavailable'
    };
  }

  private getCompanyName(symbol: string): string {
    const companies: { [key: string]: string } = {
      'AAPL': 'Apple Inc.',
      'GOOGL': 'Alphabet Inc.',
      'MSFT': 'Microsoft Corporation',
      'AMZN': 'Amazon.com Inc.',
      'TSLA': 'Tesla Inc.',
      'TD': 'Toronto-Dominion Bank',
      'RY': 'Royal Bank of Canada',
      'BMO': 'Bank of Montreal',
      'BNS': 'Bank of Nova Scotia',
      'CM': 'Canadian Imperial Bank of Commerce',
    };
    return companies[symbol.toUpperCase()] || `${symbol.toUpperCase()} Corporation`;
  }

  private generatePriceTarget(symbol: string): number {
    // Generate a reasonable price target based on current price
    return Math.random() * 50 + 100; // Mock target between $100-150
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

export const perplexityApiService = PerplexityApiService.getInstance();
export default perplexityApiService;