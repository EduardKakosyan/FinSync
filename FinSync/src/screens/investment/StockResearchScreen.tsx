import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { COLORS, SPACING, FONTS } from '@/constants';
import { perplexityApiService, StockResearchResponse } from '@/services/investment/PerplexityApiService';
import { stockApiService, StockSearchResult } from '@/services/investment/StockApiService';
import { formatCurrency } from '@/utils/currencyUtils';

const StockResearchScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [research, setResearch] = useState<StockResearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await stockApiService.searchStocks(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectStock = async (symbol: string) => {
    setSelectedStock(symbol);
    setSearchResults([]);
    setSearchQuery(symbol);
    await loadStockResearch(symbol);
  };

  const loadStockResearch = async (symbol: string) => {
    setLoading(true);
    try {
      const researchData = await perplexityApiService.researchStock(symbol);
      setResearch(researchData);
    } catch (error) {
      console.error('Research error:', error);
      Alert.alert('Error', 'Failed to load stock research');
    } finally {
      setLoading(false);
    }
  };

  const renderSearchResults = () => {
    if (searchResults.length === 0 || searchQuery.length < 2) return null;

    return (
      <View style={styles.searchResults}>
        {searchResults.map((result) => (
          <TouchableOpacity
            key={result.symbol}
            style={styles.searchResultItem}
            onPress={() => handleSelectStock(result.symbol)}
          >
            <View>
              <Text style={styles.resultSymbol}>{result.symbol}</Text>
              <Text style={styles.resultName}>{result.name}</Text>
              <Text style={styles.resultType}>{result.type} • {result.region}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderResearch = () => {
    if (!research) return null;

    const getOutlookColor = () => {
      switch (research.analysis.outlook) {
        case 'bullish':
          return COLORS.SUCCESS;
        case 'bearish':
          return COLORS.ERROR;
        default:
          return COLORS.WARNING;
      }
    };

    return (
      <ScrollView style={styles.researchContainer}>
        <View style={styles.researchHeader}>
          <Text style={styles.companyName}>{research.companyName}</Text>
          <Text style={styles.symbol}>{research.symbol}</Text>
          <View style={[styles.outlookBadge, { backgroundColor: getOutlookColor() + '20' }]}>
            <Text style={[styles.outlookText, { color: getOutlookColor() }]}>
              {research.analysis.outlook.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analysis Summary</Text>
          <Text style={styles.summaryText}>{research.analysis.summary}</Text>
        </View>

        {research.analysis.priceTarget && (
          <View style={styles.priceTargetSection}>
            <Text style={styles.sectionTitle}>Price Target</Text>
            <Text style={styles.priceTarget}>
              {formatCurrency(research.analysis.priceTarget)}
            </Text>
            <Text style={styles.timeHorizon}>{research.analysis.timeHorizon}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Strengths</Text>
          {research.analysis.strengths.map((strength, index) => (
            <View key={index} style={styles.listItem}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.SUCCESS} />
              <Text style={styles.listText}>{strength}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Risks</Text>
          {research.analysis.risks.map((risk, index) => (
            <View key={index} style={styles.listItem}>
              <Ionicons name="warning" size={16} color={COLORS.WARNING} />
              <Text style={styles.listText}>{risk}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Highlights</Text>
          <View style={styles.financialsGrid}>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Revenue</Text>
              <Text style={styles.financialValue}>{research.financials.revenue}</Text>
            </View>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Growth</Text>
              <Text style={styles.financialValue}>{research.financials.growth}</Text>
            </View>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Profitability</Text>
              <Text style={styles.financialValue}>{research.financials.profitability}</Text>
            </View>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Debt</Text>
              <Text style={styles.financialValue}>{research.financials.debt}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sources</Text>
          <View style={styles.sourcesContainer}>
            {research.sources.map((source, index) => (
              <Text key={index} style={styles.source}>{source}</Text>
            ))}
          </View>
        </View>

        <Text style={styles.lastUpdated}>
          Last updated: {research.lastUpdated.toLocaleString()}
        </Text>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.TEXT_SECONDARY} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stocks (e.g., AAPL, Tesla, Royal Bank)"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              handleSearch(text);
            }}
            autoCapitalize="characters"
          />
          {searching && <ActivityIndicator size="small" color={COLORS.PRIMARY} />}
        </View>
        {renderSearchResults()}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Researching {selectedStock}...</Text>
        </View>
      ) : research ? (
        renderResearch()
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color={COLORS.TEXT_SECONDARY} />
          <Text style={styles.emptyTitle}>Stock Research</Text>
          <Text style={styles.emptyText}>
            Search for any stock symbol to get AI-powered research and analysis
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  searchContainer: {
    padding: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.DIVIDER,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.CARD,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.SM,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.REGULAR,
  },
  searchResults: {
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
    marginTop: SPACING.SM,
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.DIVIDER,
  },
  resultSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.BOLD,
  },
  resultName: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    marginTop: 2,
    fontFamily: FONTS.REGULAR,
  },
  resultType: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
    fontFamily: FONTS.REGULAR,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.MD,
    fontFamily: FONTS.REGULAR,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.XXL,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.MD,
    fontFamily: FONTS.BOLD,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.SM,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: FONTS.REGULAR,
  },
  researchContainer: {
    flex: 1,
    padding: SPACING.MD,
  },
  researchHeader: {
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    fontFamily: FONTS.BOLD,
  },
  symbol: {
    fontSize: 18,
    color: COLORS.PRIMARY,
    marginTop: SPACING.XS,
    fontFamily: FONTS.SEMIBOLD,
  },
  outlookBadge: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS,
    borderRadius: 16,
    marginTop: SPACING.SM,
  },
  outlookText: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: FONTS.BOLD,
  },
  section: {
    marginBottom: SPACING.LG,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
    fontFamily: FONTS.BOLD,
  },
  summaryText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 24,
    fontFamily: FONTS.REGULAR,
  },
  priceTargetSection: {
    backgroundColor: COLORS.CARD,
    padding: SPACING.MD,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },
  priceTarget: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    fontFamily: FONTS.BOLD,
  },
  timeHorizon: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.XS,
    fontFamily: FONTS.REGULAR,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.SM,
  },
  listText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.SM,
    flex: 1,
    lineHeight: 22,
    fontFamily: FONTS.REGULAR,
  },
  financialsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  financialItem: {
    width: '48%',
    backgroundColor: COLORS.CARD,
    padding: SPACING.MD,
    borderRadius: 12,
    marginBottom: SPACING.SM,
  },
  financialLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
  },
  financialValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.XS,
    fontFamily: FONTS.SEMIBOLD,
  },
  sourcesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  source: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY + '15',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: 8,
    marginRight: SPACING.SM,
    marginBottom: SPACING.XS,
    fontFamily: FONTS.MEDIUM,
  },
  lastUpdated: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: SPACING.LG,
    fontFamily: FONTS.REGULAR,
  },
});

export default StockResearchScreen;