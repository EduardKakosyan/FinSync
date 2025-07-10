import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '../constants/colors';
import { Transaction } from '../types';
import { calculateHST, formatCurrency } from '../utils/dateHelpers';

interface TaxSummaryProps {
  transactions: Transaction[];
  period: 'daily' | 'weekly' | 'monthly';
}

export default function TaxSummary({ transactions, period }: TaxSummaryProps) {
  const calculateTaxableExpenses = () => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((total, transaction) => total + transaction.amount, 0);
  };

  const calculateTotalIncome = () => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((total, transaction) => total + transaction.amount, 0);
  };

  const taxableExpenses = calculateTaxableExpenses();
  const totalIncome = calculateTotalIncome();
  const hstOnExpenses = calculateHST(taxableExpenses);
  const netIncome = totalIncome - taxableExpenses;

  const getPeriodLabel = () => {
    switch (period) {
      case 'daily':
        return 'Today';
      case 'weekly':
        return 'This Week';
      case 'monthly':
        return 'This Month';
      default:
        return 'Period';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{getPeriodLabel()} Tax Summary</Text>
      
      <View style={styles.summaryGrid}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Income</Text>
          <Text style={[styles.summaryValue, styles.incomeText]}>
            {formatCurrency(totalIncome)}
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Expenses</Text>
          <Text style={[styles.summaryValue, styles.expenseText]}>
            {formatCurrency(taxableExpenses)}
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>HST Paid (14%)</Text>
          <Text style={[styles.summaryValue, styles.taxText]}>
            {formatCurrency(hstOnExpenses)}
          </Text>
          <Text style={styles.subNote}>Nova Scotia HST on expenses</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Net Income</Text>
          <Text style={[
            styles.summaryValue,
            netIncome >= 0 ? styles.positiveText : styles.negativeText
          ]}>
            {formatCurrency(Math.abs(netIncome))}
          </Text>
        </View>
      </View>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          💡 Tax calculations are estimates based on Nova Scotia HST rate (14%). 
          Consult a tax professional for official tax advice.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    marginBottom: 16,
    padding: 12,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
  },
  incomeText: {
    color: Colors.secondary,
  },
  expenseText: {
    color: Colors.danger,
  },
  taxText: {
    color: Colors.accent,
  },
  positiveText: {
    color: Colors.secondary,
  },
  negativeText: {
    color: Colors.danger,
  },
  subNote: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.light,
    marginTop: 2,
  },
  disclaimer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
  },
  disclaimerText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.xs,
  },
});