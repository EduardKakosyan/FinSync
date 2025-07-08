import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import {
  Typography,
  Card,
  Button,
  useColors,
  useTokens,
  Heading1,
  Heading2,
  BodyText,
  Caption,
  Label,
  Amount,
  Stack,
  Grid,
  useResponsiveDimensions
} from '../../src/design-system';

// Stock data interface
interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap?: number;
  volume?: number;
  high52Week?: number;
  low52Week?: number;
  lastUpdated: Date;
}

// Mock stock data for demonstration
const DEMO_STOCKS: StockData[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 193.60,
    change: 2.85,
    changePercent: 1.49,
    marketCap: 2980000000000,
    volume: 45230000,
    high52Week: 199.62,
    low52Week: 164.08,
    lastUpdated: new Date(),
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 142.56,
    change: -1.23,
    changePercent: -0.85,
    marketCap: 1780000000000,
    volume: 28450000,
    high52Week: 153.78,
    low52Week: 121.46,
    lastUpdated: new Date(),
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    price: 248.42,
    change: 8.76,
    changePercent: 3.66,
    marketCap: 789000000000,
    volume: 67890000,
    high52Week: 278.98,
    low52Week: 138.80,
    lastUpdated: new Date(),
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    price: 378.85,
    change: 4.12,
    changePercent: 1.10,
    marketCap: 2810000000000,
    volume: 21340000,
    high52Week: 384.30,
    low52Week: 309.45,
    lastUpdated: new Date(),
  },
];

const StocksScreen = () => {
  const colors = useColors();
  const tokens = useTokens();
  const { isTablet } = useResponsiveDimensions();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [watchlist, setWatchlist] = useState<StockData[]>(DEMO_STOCKS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatMarketCap = (value: number) => {
    if (value >= 1000000000000) {
      return `$${(value / 1000000000000).toFixed(2)}T`;
    } else if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    return `$${value.toFixed(2)}`;
  };

  const formatVolume = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K`;
    }
    return value.toString();
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const found = DEMO_STOCKS.find(stock => 
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        stock.name.toLowerCase().includes(query.toLowerCase())
      );
      
      if (found && !watchlist.some(s => s.symbol === found.symbol)) {
        setWatchlist([...watchlist, found]);
      }
      
      setLoading(false);
    }, 1000);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const StockCard = ({ stock }: { stock: StockData }) => {
    const isPositive = stock.change >= 0;
    const changeColor = isPositive ? colors.success : colors.error;
    const changeIcon = isPositive ? 'trending-up' : 'trending-down';

    return (
      <Card 
        variant="default" 
        style={{ marginBottom: tokens.Spacing.md }}
        onPress={() => {
          // Navigate to detailed stock view
          Alert.alert(
            `${stock.symbol} Details`,
            `Market Cap: ${formatMarketCap(stock.marketCap || 0)}\nVolume: ${formatVolume(stock.volume || 0)}\n52W High: ${formatCurrency(stock.high52Week || 0)}\n52W Low: ${formatCurrency(stock.low52Week || 0)}\n\nLast Updated: ${stock.lastUpdated.toLocaleString()}`,
            [
              { text: 'Add to Portfolio', onPress: () => console.log('Add to portfolio') },
              { text: 'View Chart', onPress: () => console.log('View chart') },
              { text: 'Close', style: 'cancel' },
            ]
          );
        }}
      >
        <View style={{ padding: tokens.Spacing.md }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: tokens.Spacing.sm,
          }}>
            <View style={{ flex: 1 }}>
              <Typography variant="h4" style={{ marginBottom: tokens.Spacing.xs }}>
                {stock.symbol}
              </Typography>
              <Caption color="secondary">{stock.name}</Caption>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Amount style={{ marginBottom: tokens.Spacing.xs }}>
                {formatCurrency(stock.price)}
              </Amount>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: tokens.Spacing.xs,
              }}>
                <Ionicons name={changeIcon} size={16} color={changeColor} />
                <Typography variant="labelSmall" style={{ color: changeColor }}>
                  {isPositive ? '+' : ''}{formatCurrency(stock.change)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                </Typography>
              </View>
            </View>
          </View>
          
          {/* Stock metrics */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: tokens.Spacing.sm,
            paddingTop: tokens.Spacing.sm,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}>
            <View style={{ alignItems: 'center' }}>
              <Caption color="secondary">Market Cap</Caption>
              <Typography variant="labelSmall" style={{ marginTop: 2 }}>
                {formatMarketCap(stock.marketCap || 0)}
              </Typography>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Caption color="secondary">Volume</Caption>
              <Typography variant="labelSmall" style={{ marginTop: 2 }}>
                {formatVolume(stock.volume || 0)}
              </Typography>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Caption color="secondary">52W Range</Caption>
              <Typography variant="labelSmall" style={{ marginTop: 2 }}>
                {formatCurrency(stock.low52Week || 0)} - {formatCurrency(stock.high52Week || 0)}
              </Typography>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  const MarketIndices = () => (
    <Card variant="default" style={{ marginBottom: tokens.Spacing.lg }}>
      <View style={{ padding: tokens.Spacing.md }}>
        <Typography variant="h4" style={{ marginBottom: tokens.Spacing.md }}>
          Market Indices
        </Typography>
        <Grid columns={isTablet ? 3 : 1} spacing="md">
          {[
            { name: 'S&P 500', value: 4783.35, change: 23.87, changePercent: 0.50 },
            { name: 'Dow Jones', value: 37248.04, change: -106.37, changePercent: -0.29 },
            { name: 'NASDAQ', value: 14857.71, change: 84.96, changePercent: 0.58 },
          ].map((index, i) => {
            const isPositive = index.change >= 0;
            const changeColor = isPositive ? colors.success : colors.error;
            
            return (
              <View key={i} style={{ alignItems: 'center' }}>
                <Typography variant="labelSmall" style={{ marginBottom: tokens.Spacing.xs }}>
                  {index.name}
                </Typography>
                <Typography variant="amount" style={{ marginBottom: tokens.Spacing.xs }}>
                  {index.value.toLocaleString()}
                </Typography>
                <Typography variant="labelSmall" style={{ color: changeColor }}>
                  {isPositive ? '+' : ''}{index.change.toFixed(2)} ({isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%)
                </Typography>
              </View>
            );
          })}
        </Grid>
      </View>
    </Card>
  );

  const APISetupGuide = () => (
    <Card variant="outlined" style={{ marginBottom: tokens.Spacing.lg }}>
      <View style={{ padding: tokens.Spacing.md }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: tokens.Spacing.sm,
          marginBottom: tokens.Spacing.md,
        }}>
          <Ionicons name="settings" size={20} color={colors.warning} />
          <Typography variant="h4">API Setup Required</Typography>
        </View>
        
        <BodyText color="secondary" style={{ marginBottom: tokens.Spacing.md }}>
          To access real-time stock data, you'll need to configure API keys for:
        </BodyText>
        
        <View style={{ gap: tokens.Spacing.sm, marginBottom: tokens.Spacing.md }}>
          {[
            { service: 'Alpha Vantage', purpose: 'Stock prices and market data', url: 'https://www.alphavantage.co/support/#api-key' },
            { service: 'Yahoo Finance', purpose: 'Alternative stock data source', url: 'https://rapidapi.com/apidojo/api/yahoo-finance1' },
            { service: 'Perplexity AI', purpose: 'AI-powered stock analysis', url: 'https://docs.perplexity.ai/docs/getting-started' },
          ].map((api, index) => (
            <View key={index} style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: tokens.Spacing.sm,
            }}>
              <Ionicons name="link" size={14} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Typography variant="labelSmall" style={{ fontWeight: '600' }}>
                  {api.service}
                </Typography>
                <Caption color="secondary">{api.purpose}</Caption>
              </View>
            </View>
          ))}
        </View>
        
        <Button
          variant="ghost"
          size="small"
          leftIcon={<Ionicons name="document-text" size={16} color={colors.primary} />}
          onPress={() => {
            Alert.alert(
              'API Setup Guide',
              'Complete setup instructions:\n\n1. Sign up for Alpha Vantage API key\n2. Get Yahoo Finance API access via RapidAPI\n3. Register for Perplexity AI API\n4. Add keys to your .env file\n5. Configure API endpoints in services\n\nSee the documentation for detailed setup instructions.',
              [
                { text: 'View Demo Mode', onPress: () => console.log('Demo mode') },
                { text: 'Setup Later', style: 'cancel' },
              ]
            );
          }}
        >
          View Setup Guide
        </Button>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: tokens.Spacing.lg,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}>
          <Heading1>Stocks</Heading1>
          <TouchableOpacity 
            style={{ padding: tokens.Spacing.sm }} 
            onPress={() => {
              Alert.alert(
                'Portfolio',
                'Portfolio management features:\n\n• Track your investments\n• View performance metrics\n• Set price alerts\n• Analyze holdings\n\nComing soon!',
                [{ text: 'OK' }]
              );
            }}
          >
            <Ionicons name="pie-chart" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={{ padding: tokens.Spacing.lg }}>
          {/* Search */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: tokens.Layout.borderRadius.md,
            paddingHorizontal: tokens.Spacing.md,
            paddingVertical: tokens.Spacing.sm,
            marginBottom: tokens.Spacing.lg,
          }}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={{
                flex: 1,
                marginLeft: tokens.Spacing.sm,
                fontSize: 16,
                color: colors.textPrimary,
              }}
              placeholder="Search stocks (e.g., AAPL, GOOGL)"
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => handleSearch(searchQuery)}
            />
            {loading && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>

          {/* API Setup Guide */}
          <APISetupGuide />

          {/* Market Indices */}
          <MarketIndices />

          {/* Watchlist */}
          <View style={{ marginBottom: tokens.Spacing.lg }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: tokens.Spacing.md,
            }}>
              <Typography variant="h3">My Watchlist</Typography>
              <Button
                variant="ghost"
                size="small"
                leftIcon={<Ionicons name="add" size={16} color={colors.primary} />}
                onPress={() => {
                  Alert.prompt(
                    'Add to Watchlist',
                    'Enter stock symbol (e.g., AAPL)',
                    (symbol) => {
                      if (symbol) {
                        handleSearch(symbol);
                      }
                    }
                  );
                }}
              >
                Add Stock
              </Button>
            </View>
            
            {watchlist.length === 0 ? (
              <Card variant="outlined" style={{ padding: tokens.Spacing.xl }}>
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="trending-up" size={48} color={colors.textSecondary} />
                  <Typography variant="h4" style={{ marginTop: tokens.Spacing.md, marginBottom: tokens.Spacing.sm }}>
                    No Stocks in Watchlist
                  </Typography>
                  <BodyText color="secondary" align="center">
                    Search and add stocks to track their performance
                  </BodyText>
                </View>
              </Card>
            ) : (
              <View>
                {watchlist.map((stock, index) => (
                  <StockCard key={stock.symbol} stock={stock} />
                ))}
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View style={{ marginBottom: tokens.Spacing.lg }}>
            <Typography variant="h3" style={{ marginBottom: tokens.Spacing.md }}>
              Quick Actions
            </Typography>
            <Grid columns={isTablet ? 2 : 1} spacing="md">
              <Card variant="outlined" onPress={() => {
                Alert.alert(
                  'Market News',
                  'Stay updated with:\n\n• Real-time market news\n• Earnings reports\n• Economic indicators\n• Analyst ratings\n\nFeature coming soon!',
                  [{ text: 'OK' }]
                );
              }}>
                <View style={{ padding: tokens.Spacing.md, alignItems: 'center' }}>
                  <Ionicons name="newspaper" size={32} color={colors.info} />
                  <Typography variant="labelSmall" style={{ marginTop: tokens.Spacing.sm }}>
                    Market News
                  </Typography>
                </View>
              </Card>
              
              <Card variant="outlined" onPress={() => {
                Alert.alert(
                  'Price Alerts',
                  'Set up notifications for:\n\n• Price targets\n• Percentage changes\n• Volume alerts\n• News mentions\n\nFeature coming soon!',
                  [{ text: 'OK' }]
                );
              }}>
                <View style={{ padding: tokens.Spacing.md, alignItems: 'center' }}>
                  <Ionicons name="notifications" size={32} color={colors.warning} />
                  <Typography variant="labelSmall" style={{ marginTop: tokens.Spacing.sm }}>
                    Price Alerts
                  </Typography>
                </View>
              </Card>
            </Grid>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default StocksScreen;