import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Modal, Alert } from 'react-native';
import { Colors, Typography } from './src/constants/colors';
import { SPACING, SCREEN_DIMENSIONS } from './src/constants/dimensions';
import { Transaction, TransactionPeriod } from './src/types';
import { subscribeToTransactions, initializeFirebase } from './src/services/firebase';
import { getDateRange, formatCurrency } from './src/utils/dateHelpers';
import TransactionForm from './src/components/TransactionForm';
import TransactionList from './src/components/TransactionList';
import TaxSummary from './src/components/TaxSummary';
import ConnectionStatus from './src/components/ConnectionStatus';
import { connectionMonitor } from './src/utils/connectionMonitor';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<TransactionPeriod>('daily');
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeFirebase()
      .then(({ db }) => {
        // Initialize connection monitor with database instance
        connectionMonitor.initialize(db);
        
        const { startDate, endDate } = getDateRange(selectedPeriod);
        const unsubscribe = subscribeToTransactions(
          (transactionData) => {
            setTransactions(transactionData);
            setFilteredTransactions(transactionData);
            setIsLoading(false);
          },
          startDate,
          endDate
        );
        return unsubscribe;
      })
      .catch((error) => {
        console.error('Firebase initialization failed:', error);
        Alert.alert('Error', 'Failed to connect to database');
        setIsLoading(false);
      });
  }, [selectedPeriod]);

  // Cleanup connection monitor on unmount
  useEffect(() => {
    return () => {
      connectionMonitor.cleanup();
    };
  }, []);

  const handlePeriodChange = (period: TransactionPeriod) => {
    setSelectedPeriod(period);
    setIsLoading(true);
  };

  const onTransactionAdded = () => {
    setShowForm(false);
  };

  const calculateBalance = () => {
    return filteredTransactions.reduce((total, transaction) => {
      return transaction.type === 'expense' 
        ? total - transaction.amount 
        : total + transaction.amount;
    }, 0);
  };

  const balance = calculateBalance();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ConnectionStatus />
      
      <View style={styles.header}>
        <Text style={styles.title}>FinSync</Text>
        <Text style={styles.subtitle}>Halifax, NS • CAD</Text>
        
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={[
            styles.balanceAmount,
            balance >= 0 ? styles.positiveBalance : styles.negativeBalance
          ]}>
            {formatCurrency(Math.abs(balance))}
          </Text>
        </View>
      </View>

      <View style={styles.periodSelector}>
        {(['daily', 'weekly', 'monthly'] as TransactionPeriod[]).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive
            ]}
            onPress={() => handlePeriodChange(period)}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.periodButtonTextActive
            ]}>
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TaxSummary transactions={filteredTransactions} period={selectedPeriod} />

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading transactions...</Text>
          </View>
        ) : (
          <TransactionList 
            transactions={filteredTransactions}
            onTransactionPress={(transaction) => {
              // Future: Navigate to transaction details
              console.log('Transaction pressed:', transaction);
            }}
          />
        )}
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowForm(true)}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Text style={styles.modalCloseButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Transaction</Text>
            <View style={styles.modalPlaceholder} />
          </View>
          
          <TransactionForm onSuccess={onTransactionAdded} />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    position: 'relative',
  },
  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  title: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  balanceContainer: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
  },
  positiveBalance: {
    color: Colors.secondary,
  },
  negativeBalance: {
    color: Colors.danger,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: 12,
    padding: 4,
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
  },
  periodButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
  },
  periodButtonTextActive: {
    color: Colors.text.inverse,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  addButton: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.bottomSafeArea + SPACING.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    fontSize: Typography.fontSize['2xl'],
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.bold,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  modalCloseButton: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  modalPlaceholder: {
    width: 50,
  },
});