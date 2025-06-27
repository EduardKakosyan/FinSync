import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SPACING, FONTS } from '@/constants';

const InvestmentScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Investment Portfolio</Text>
        <Text style={styles.subtitle}>
          Track your investments and performance
        </Text>
      </View>

      <View style={styles.portfolioCard}>
        <Text style={styles.portfolioLabel}>Total Portfolio Value</Text>
        <Text style={styles.portfolioValue}>$0.00</Text>
        <Text style={styles.portfolioChange}>+$0.00 (0.00%)</Text>
      </View>

      <View style={styles.emptyContainer}>
        <Ionicons
          name='trending-up-outline'
          size={64}
          color={COLORS.TEXT_SECONDARY}
        />
        <Text style={styles.emptyText}>No investments yet</Text>
        <Text style={styles.emptySubtext}>
          Start tracking your investments to monitor your portfolio performance
        </Text>

        <TouchableOpacity style={styles.addButton}>
          <Ionicons name='add' size={24} color='white' />
          <Text style={styles.addButtonText}>Add Investment</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    padding: SPACING.MD,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.BOLD,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.XS,
    fontFamily: FONTS.REGULAR,
  },
  portfolioCard: {
    backgroundColor: COLORS.SUCCESS,
    marginHorizontal: SPACING.MD,
    marginVertical: SPACING.SM,
    padding: SPACING.LG,
    borderRadius: 16,
    alignItems: 'center',
  },
  portfolioLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: FONTS.REGULAR,
  },
  portfolioValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginVertical: SPACING.XS,
    fontFamily: FONTS.BOLD,
  },
  portfolioChange: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: FONTS.REGULAR,
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
});

export default InvestmentScreen;
