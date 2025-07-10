import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography } from '../constants/colors';
import { TransactionPeriod } from '../types';

interface PeriodFilterProps {
  selectedPeriod: TransactionPeriod;
  onPeriodChange: (period: TransactionPeriod) => void;
}

const periods: { key: TransactionPeriod; label: string; description: string }[] = [
  { key: 'daily', label: 'Today', description: 'Today\'s transactions' },
  { key: 'weekly', label: 'This Week', description: 'This week\'s transactions' },
  { key: 'monthly', label: 'This Month', description: 'This month\'s transactions' },
];

export default function PeriodFilter({ selectedPeriod, onPeriodChange }: PeriodFilterProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>View Period</Text>
      
      {periods.map((period) => (
        <TouchableOpacity
          key={period.key}
          style={[
            styles.periodItem,
            selectedPeriod === period.key && styles.periodItemActive
          ]}
          onPress={() => onPeriodChange(period.key)}
        >
          <View style={styles.periodContent}>
            <Text style={[
              styles.periodLabel,
              selectedPeriod === period.key && styles.periodLabelActive
            ]}>
              {period.label}
            </Text>
            <Text style={[
              styles.periodDescription,
              selectedPeriod === period.key && styles.periodDescriptionActive
            ]}>
              {period.description}
            </Text>
          </View>
          
          {selectedPeriod === period.key && (
            <View style={styles.activeIndicator} />
          )}
        </TouchableOpacity>
      ))}
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
  },
  periodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: Colors.surfaceLight,
  },
  periodItemActive: {
    backgroundColor: Colors.primary,
  },
  periodContent: {
    flex: 1,
  },
  periodLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
  },
  periodLabelActive: {
    color: Colors.text.inverse,
  },
  periodDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  periodDescriptionActive: {
    color: Colors.text.inverse,
    opacity: 0.8,
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.text.inverse,
  },
});