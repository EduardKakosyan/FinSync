import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { COLORS, SPACING, FONTS } from '@/constants';
import { Investment } from '@/types';
import { investmentService } from '@/services/storage/InvestmentService';
import { stockApiService, StockQuote } from '@/services/investment/StockApiService';
import { formatCurrency } from '@/utils/currencyUtils';
import { PortfolioOverview } from '@/components/investment/PortfolioOverview';
import { InvestmentItem } from '@/components/investment/InvestmentItem';
import { MarketIndices } from '@/components/investment/MarketIndices';

const InvestmentScreen = () => {
  const navigation = useNavigation();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [quotes, setQuotes] = useState<Map<string, StockQuote>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [portfolioStats, setPortfolioStats] = useState({
    totalValue: 0,
    totalCost: 0,
    totalGain: 0,
    totalGainPercent: 0,
    dayChange: 0,
    dayChangePercent: 0,
  });

  useEffect(() => {
    loadInvestments();
  }, []);

  const loadInvestments = async () => {
    try {
      setLoading(true);
      
      // Load investments from storage
      const investmentData = await investmentService.getAll();
      setInvestments(investmentData);

      // Fetch live quotes
      if (investmentData.length > 0) {
        const symbols = investmentData.map(inv => inv.symbol);
        const quotesData = await stockApiService.getBatchQuotes(symbols);
        setQuotes(quotesData);

        // Calculate portfolio stats
        const stats = await stockApiService.calculatePortfolioPerformance(investmentData);
        setPortfolioStats(stats);
      }
    } catch (error) {
      console.error('Error loading investments:', error);
      Alert.alert('Error', 'Failed to load investment data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInvestments();
    setRefreshing(false);
  };

  const handleAddInvestment = () => {
    navigation.navigate('AddInvestment' as never);
  };

  const handleInvestmentPress = (investment: Investment) => {
    navigation.navigate('InvestmentDetails' as never, { 
      investmentId: investment.id 
    } as never);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="trending-up-outline"
        size={64}
        color={COLORS.TEXT_SECONDARY}
      />
      <Text style={styles.emptyText}>No investments yet</Text>
      <Text style={styles.emptySubtext}>
        Start tracking your investments to monitor your portfolio performance
      </Text>

      <TouchableOpacity style={styles.addButton} onPress={handleAddInvestment}>
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.addButtonText}>Add Investment</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {investments.length > 0 ? (
        <>
          <MarketIndices />
          
          <PortfolioOverview
            totalValue={portfolioStats.totalValue}
            totalCost={portfolioStats.totalCost}
            totalGain={portfolioStats.totalGain}
            totalGainPercent={portfolioStats.totalGainPercent}
            dayChange={portfolioStats.dayChange}
            dayChangePercent={portfolioStats.dayChangePercent}
          />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Holdings</Text>
            <TouchableOpacity onPress={handleAddInvestment}>
              <Ionicons name="add-circle-outline" size={24} color={COLORS.PRIMARY} />
            </TouchableOpacity>
          </View>

          <View style={styles.investmentsList}>
            {investments.map((investment) => {
              const quote = quotes.get(investment.symbol);
              return (
                <InvestmentItem
                  key={investment.id}
                  investment={investment}
                  quote={quote}
                  onPress={() => handleInvestmentPress(investment)}
                />
              );
            })}
          </View>

          <TouchableOpacity style={styles.researchButton} onPress={() => navigation.navigate('StockResearch' as never)}>
            <Ionicons name="search" size={20} color={COLORS.PRIMARY} />
            <Text style={styles.researchButtonText}>Research Stocks</Text>
          </TouchableOpacity>
        </>
      ) : (
        renderEmptyState()
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    marginTop: SPACING.MD,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.BOLD,
  },
  investmentsList: {
    paddingHorizontal: SPACING.MD,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.XXL,
    marginTop: SPACING.LG,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.MD,
    fontFamily: FONTS.SEMIBOLD,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.XS,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: FONTS.REGULAR,
  },
  addButton: {
    backgroundColor: COLORS.PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.MD,
    borderRadius: 12,
    marginTop: SPACING.LG,
    minWidth: 150,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: SPACING.SM,
    fontFamily: FONTS.BOLD,
  },
  researchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.CARD,
    padding: SPACING.MD,
    marginHorizontal: SPACING.MD,
    marginVertical: SPACING.LG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  researchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.PRIMARY,
    marginLeft: SPACING.SM,
    fontFamily: FONTS.SEMIBOLD,
  },
});

export default InvestmentScreen;