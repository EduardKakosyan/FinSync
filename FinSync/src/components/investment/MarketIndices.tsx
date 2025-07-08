import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SPACING, FONTS } from '@/constants';
import { stockApiService } from '@/services/investment/StockApiService';

interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export const MarketIndices: React.FC = () => {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMarketData();
  }, []);

  const loadMarketData = async () => {
    try {
      const overview = await stockApiService.getMarketOverview();
      setIndices(overview.indices);
    } catch (error) {
      console.error('Error loading market data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {indices.map((index) => {
        const isPositive = index.change >= 0;
        return (
          <View key={index.name} style={styles.indexCard}>
            <Text style={styles.indexName}>{index.name}</Text>
            <Text style={styles.indexValue}>{index.value.toFixed(2)}</Text>
            <View style={styles.changeRow}>
              <Ionicons
                name={isPositive ? 'arrow-up' : 'arrow-down'}
                size={12}
                color={isPositive ? COLORS.SUCCESS : COLORS.ERROR}
              />
              <Text style={[
                styles.changeText,
                { color: isPositive ? COLORS.SUCCESS : COLORS.ERROR }
              ]}>
                {Math.abs(index.change).toFixed(2)}
              </Text>
              <Text style={[
                styles.changePercent,
                { color: isPositive ? COLORS.SUCCESS : COLORS.ERROR }
              ]}>
                ({index.changePercent >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%)
              </Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.SM,
  },
  contentContainer: {
    paddingHorizontal: SPACING.MD,
  },
  loadingContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indexCard: {
    backgroundColor: COLORS.CARD,
    padding: SPACING.MD,
    marginRight: SPACING.SM,
    borderRadius: 12,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  indexName: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '600',
    fontFamily: FONTS.SEMIBOLD,
  },
  indexValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginVertical: SPACING.XS,
    fontFamily: FONTS.BOLD,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 2,
    fontFamily: FONTS.SEMIBOLD,
  },
  changePercent: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: FONTS.MEDIUM,
  },
});