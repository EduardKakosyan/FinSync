# 🚀 FinSync API Setup Guide

## Complete Setup Instructions for Stock Data & AI Features

This guide will help you set up all the necessary APIs to enable real-time stock data and AI-powered features in your FinSync app.

## 📋 Prerequisites

- Node.js and npm installed
- Expo CLI configured
- FinSync project running locally

## 🔑 Required API Keys

### 1. Alpha Vantage API (Stock Data)
**Purpose**: Real-time stock prices, market data, and financial indicators

**Setup Steps**:
1. Go to [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Sign up for a free account
3. Copy your API key
4. Free tier: 500 requests/day, 5 requests/minute

**Environment Variable**:
```
ALPHA_VANTAGE_API_KEY=your_api_key_here
```

### 2. Yahoo Finance API (Alternative Stock Data)
**Purpose**: Alternative stock data source with more comprehensive data

**Setup Steps**:
1. Go to [RapidAPI Yahoo Finance](https://rapidapi.com/apidojo/api/yahoo-finance1)
2. Subscribe to the API (free tier available)
3. Copy your RapidAPI key
4. Free tier: 500 requests/month

**Environment Variable**:
```
YAHOO_FINANCE_API_KEY=your_rapidapi_key_here
```

### 3. Perplexity AI API (AI-Powered Analysis)
**Purpose**: AI-powered stock analysis and market insights

**Setup Steps**:
1. Go to [Perplexity AI Docs](https://docs.perplexity.ai/docs/getting-started)
2. Sign up for API access
3. Generate your API key
4. Free tier: 100 requests/day

**Environment Variable**:
```
PERPLEXITY_API_KEY=your_perplexity_key_here
```

### 4. News API (Market News)
**Purpose**: Real-time financial news and market updates

**Setup Steps**:
1. Go to [News API](https://newsapi.org/register)
2. Register for free account
3. Copy your API key
4. Free tier: 1,000 requests/day

**Environment Variable**:
```
NEWS_API_KEY=your_news_api_key_here
```

## 🛠️ Implementation Steps

### Step 1: Create Environment File
Create a `.env` file in your project root:

```bash
# Stock Data APIs
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
YAHOO_FINANCE_API_KEY=your_yahoo_finance_key

# AI Services
PERPLEXITY_API_KEY=your_perplexity_key

# News Service
NEWS_API_KEY=your_news_api_key

# Optional: Additional APIs
FINNHUB_API_KEY=your_finnhub_key
POLYGON_API_KEY=your_polygon_key
```

### Step 2: Install Required Dependencies
```bash
npm install axios react-native-dotenv
```

### Step 3: Configure API Services

Create `/src/services/api/StockApiService.ts`:

```typescript
import axios from 'axios';
import { 
  ALPHA_VANTAGE_API_KEY, 
  YAHOO_FINANCE_API_KEY,
  PERPLEXITY_API_KEY,
  NEWS_API_KEY 
} from '@env';

export class StockApiService {
  private alphaVantageBase = 'https://www.alphavantage.co/query';
  private yahooFinanceBase = 'https://yahoo-finance127.p.rapidapi.com';
  private perplexityBase = 'https://api.perplexity.ai/chat/completions';
  private newsApiBase = 'https://newsapi.org/v2';

  // Alpha Vantage - Real-time stock data
  async getStockQuote(symbol: string) {
    try {
      const response = await axios.get(this.alphaVantageBase, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: ALPHA_VANTAGE_API_KEY,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Alpha Vantage API error:', error);
      throw error;
    }
  }

  // Yahoo Finance - Comprehensive stock data
  async getStockDetails(symbol: string) {
    try {
      const response = await axios.get(`${this.yahooFinanceBase}/stock/${symbol}`, {
        headers: {
          'X-RapidAPI-Key': YAHOO_FINANCE_API_KEY,
          'X-RapidAPI-Host': 'yahoo-finance127.p.rapidapi.com',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Yahoo Finance API error:', error);
      throw error;
    }
  }

  // Perplexity AI - Stock analysis
  async getStockAnalysis(symbol: string) {
    try {
      const response = await axios.post(
        this.perplexityBase,
        {
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'user',
              content: `Analyze the stock ${symbol}. Provide insights on recent performance, key metrics, and market outlook.`
            }
          ],
          max_tokens: 500,
          temperature: 0.2,
        },
        {
          headers: {
            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Perplexity AI API error:', error);
      throw error;
    }
  }

  // News API - Market news
  async getMarketNews() {
    try {
      const response = await axios.get(`${this.newsApiBase}/everything`, {
        params: {
          q: 'stock market OR finance OR economy',
          sortBy: 'publishedAt',
          language: 'en',
          pageSize: 10,
          apiKey: NEWS_API_KEY,
        },
      });
      return response.data.articles;
    } catch (error) {
      console.error('News API error:', error);
      throw error;
    }
  }
}

export const stockApiService = new StockApiService();
```

### Step 4: Update Stock Screen

Replace the mock data in `/app/(tabs)/explore.tsx` with real API calls:

```typescript
import { stockApiService } from '../../src/services/api/StockApiService';

// In your StocksScreen component
const handleSearch = async (query: string) => {
  if (!query.trim()) return;
  
  setLoading(true);
  try {
    const stockData = await stockApiService.getStockQuote(query);
    const stockDetails = await stockApiService.getStockDetails(query);
    
    // Process and add to watchlist
    const newStock = {
      symbol: query.toUpperCase(),
      name: stockDetails.name || 'Unknown',
      price: stockData.price || 0,
      change: stockData.change || 0,
      changePercent: stockData.changePercent || 0,
      // ... other fields
    };
    
    setWatchlist([...watchlist, newStock]);
  } catch (error) {
    Alert.alert('Error', 'Failed to fetch stock data. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

### Step 5: Configure Babel for Environment Variables

Add to `babel.config.js`:

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env',
          blacklist: null,
          whitelist: null,
          safe: false,
          allowUndefined: true,
        },
      ],
    ],
  };
};
```

## 📱 iPhone 13 Pro Optimizations

### Screen Specifications
- **Resolution**: 390 × 844 points
- **Safe Area**: Account for notch and home indicator
- **Density**: 3x (@3x assets)

### Responsive Design Tips
```typescript
// Use these dimensions for iPhone 13 Pro
const iPhone13ProDimensions = {
  width: 390,
  height: 844,
  safeAreaTop: 47,
  safeAreaBottom: 34,
};

// In your components
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isIPhone13Pro = screenWidth === 390 && screenHeight === 844;
```

## 🔧 Advanced Features

### 1. Real-time Stock Updates
```typescript
// WebSocket connection for real-time data
const connectWebSocket = () => {
  const ws = new WebSocket('wss://ws.finnhub.io?token=YOUR_FINNHUB_TOKEN');
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // Update stock prices in real-time
    updateStockPrices(data);
  };
};
```

### 2. Price Alerts
```typescript
// Local notifications for price alerts
import * as Notifications from 'expo-notifications';

const setupPriceAlert = async (symbol: string, targetPrice: number) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${symbol} Price Alert`,
      body: `${symbol} has reached your target price of $${targetPrice}`,
    },
    trigger: null, // Trigger based on price condition
  });
};
```

### 3. Portfolio Tracking
```typescript
// Portfolio management service
export class PortfolioService {
  async addToPortfolio(symbol: string, shares: number, purchasePrice: number) {
    // Store in AsyncStorage or database
    const portfolio = await this.getPortfolio();
    portfolio.push({
      symbol,
      shares,
      purchasePrice,
      dateAdded: new Date(),
    });
    await AsyncStorage.setItem('portfolio', JSON.stringify(portfolio));
  }
  
  async calculatePortfolioValue() {
    const portfolio = await this.getPortfolio();
    let totalValue = 0;
    
    for (const holding of portfolio) {
      const currentPrice = await stockApiService.getStockQuote(holding.symbol);
      totalValue += holding.shares * currentPrice.price;
    }
    
    return totalValue;
  }
}
```

## 🚨 Error Handling & Rate Limiting

```typescript
// Implement rate limiting and error handling
class ApiRateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  canMakeRequest(apiKey: string, limit: number, timeWindow: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(apiKey) || [];
    
    // Remove old requests outside time window
    const recentRequests = requests.filter(time => now - time < timeWindow);
    
    if (recentRequests.length >= limit) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(apiKey, recentRequests);
    return true;
  }
}
```

## 📊 Testing Your Setup

### 1. Test API Connections
```bash
# Test Alpha Vantage
curl "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=YOUR_API_KEY"

# Test Yahoo Finance
curl -X GET "https://yahoo-finance127.p.rapidapi.com/stock/AAPL" \
  -H "X-RapidAPI-Key: YOUR_RAPIDAPI_KEY"
```

### 2. Test in App
1. Launch the app
2. Navigate to Stocks tab
3. Search for "AAPL"
4. Verify real-time data appears
5. Test AI analysis features

## 🎯 Production Deployment

### Environment Variables for Production
```bash
# Expo
expo install expo-constants

# Access in app
import Constants from 'expo-constants';
const apiKey = Constants.expoConfig?.extra?.alphaVantageApiKey;
```

### App Configuration
```javascript
// app.config.js
export default {
  expo: {
    name: 'FinSync',
    extra: {
      alphaVantageApiKey: process.env.ALPHA_VANTAGE_API_KEY,
      yahooFinanceApiKey: process.env.YAHOO_FINANCE_API_KEY,
      perplexityApiKey: process.env.PERPLEXITY_API_KEY,
      newsApiKey: process.env.NEWS_API_KEY,
    },
  },
};
```

## 🔍 Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Check if API key is correctly set in .env
   - Verify API key hasn't expired
   - Check rate limits

2. **CORS Issues**
   - Use proper API endpoints
   - Check if API requires specific headers

3. **Data Format Issues**
   - Check API response format
   - Handle missing data gracefully

### Debug Mode
```typescript
const DEBUG_MODE = __DEV__;

if (DEBUG_MODE) {
  console.log('API Response:', response.data);
}
```

## 📈 Performance Optimization

1. **Caching**: Implement data caching for frequently accessed stocks
2. **Debouncing**: Add debouncing for search queries
3. **Pagination**: Implement pagination for large datasets
4. **Lazy Loading**: Load stock data on-demand

## 🎉 Congratulations!

You now have a fully functional stock tracking app with:
- ✅ Real-time stock data
- ✅ AI-powered analysis
- ✅ Market news integration
- ✅ iPhone 13 Pro optimization
- ✅ Professional UI/UX

## 📞 Support

If you need help with the setup:
1. Check the troubleshooting section
2. Review API documentation
3. Test with demo data first
4. Verify all environment variables are set correctly

Happy investing! 🚀📊