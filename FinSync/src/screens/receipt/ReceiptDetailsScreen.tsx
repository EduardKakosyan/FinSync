import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { COLORS, SPACING, FONTS } from '@/constants';
import { Receipt, ReceiptStackParamList } from '@/types';
import { receiptService } from '@/services/storage/ReceiptService';
import { transactionService } from '@/services/storage/TransactionService';
import { formatCurrency } from '@/utils/currencyUtils';
import { format } from 'date-fns';

type RouteProps = RouteProp<ReceiptStackParamList, 'ReceiptDetails'>;
type NavigationProp = StackNavigationProp<ReceiptStackParamList, 'ReceiptDetails'>;

const ReceiptDetailsScreen = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { receiptId } = route.params;

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReceipt();
  }, [receiptId]);

  const loadReceipt = async () => {
    try {
      const receiptData = await receiptService.getById(receiptId);
      if (receiptData) {
        setReceipt(receiptData);
        
        // Load linked transaction if exists
        if (receiptData.transactionId) {
          const transactionData = await transactionService.getById(receiptData.transactionId);
          setTransaction(transactionData);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load receipt details');
      console.error('Load receipt error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRescan = () => {
    if (receipt) {
      navigation.navigate('ReceiptScanner');
    }
  };

  const handleCreateTransaction = async () => {
    if (!receipt) return;

    navigation.navigate('AddTransaction', {
      transactionType: 'expense',
      prefillData: {
        amount: receipt.amount || 0,
        date: receipt.date || new Date(),
        description: receipt.merchantName || 'Receipt Transaction',
        receiptId: receipt.id,
      },
    });
  };

  const handleViewTransaction = () => {
    if (transaction) {
      navigation.navigate('TransactionDetails', { 
        transactionId: transaction.id,
        mode: 'view'
      });
    }
  };

  const handleDeleteReceipt = () => {
    Alert.alert(
      'Delete Receipt',
      'Are you sure you want to delete this receipt?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await receiptService.delete(receiptId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete receipt');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  if (!receipt) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Receipt not found</Text>
      </View>
    );
  }

  const confidenceColor = (receipt.extractionConfidence || 0) > 0.8 
    ? COLORS.SUCCESS 
    : (receipt.extractionConfidence || 0) > 0.6 
    ? COLORS.WARNING 
    : COLORS.ERROR;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: receipt.imageUri }} style={styles.receiptImage} />
        
        <TouchableOpacity style={styles.rescanButton} onPress={handleRescan}>
          <Ionicons name="camera" size={20} color="white" />
          <Text style={styles.rescanText}>Rescan</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.header}>
          <Text style={styles.merchantName}>
            {receipt.merchantName || 'Unknown Merchant'}
          </Text>
          <Text style={styles.amount}>
            {formatCurrency(receipt.amount || 0)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={20} color={COLORS.TEXT_SECONDARY} />
          <Text style={styles.infoText}>
            {receipt.date ? format(receipt.date, 'PPP') : 'No date'}
          </Text>
        </View>

        {receipt.extractionConfidence !== undefined && (
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceLabel}>OCR Confidence:</Text>
            <View style={styles.confidenceBar}>
              <View 
                style={[
                  styles.confidenceFill, 
                  { 
                    width: `${receipt.extractionConfidence * 100}%`,
                    backgroundColor: confidenceColor 
                  }
                ]} 
              />
            </View>
            <Text style={[styles.confidenceText, { color: confidenceColor }]}>
              {Math.round(receipt.extractionConfidence * 100)}%
            </Text>
          </View>
        )}

        {receipt.items && receipt.items.length > 0 && (
          <View style={styles.itemsSection}>
            <Text style={styles.sectionTitle}>Items</Text>
            {receipt.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemName}>
                  {item.quantity && item.quantity > 1 ? `${item.quantity}x ` : ''}
                  {item.name}
                </Text>
                <Text style={styles.itemPrice}>
                  {formatCurrency(item.price)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {receipt.ocrText && (
          <View style={styles.ocrSection}>
            <Text style={styles.sectionTitle}>Extracted Text</Text>
            <Text style={styles.ocrText}>{receipt.ocrText}</Text>
          </View>
        )}

        <View style={styles.actions}>
          {transaction ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.viewTransactionButton]}
              onPress={handleViewTransaction}
            >
              <Ionicons name="receipt-outline" size={24} color="white" />
              <Text style={styles.actionButtonText}>View Transaction</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.createTransactionButton]}
              onPress={handleCreateTransaction}
            >
              <Ionicons name="add-circle-outline" size={24} color="white" />
              <Text style={styles.actionButtonText}>Create Transaction</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeleteReceipt}
          >
            <Ionicons name="trash-outline" size={24} color="white" />
            <Text style={styles.actionButtonText}>Delete Receipt</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  errorText: {
    fontSize: 18,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: SPACING.XXL,
    fontFamily: FONTS.REGULAR,
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: COLORS.CARD,
  },
  receiptImage: {
    width: '100%',
    height: 400,
    resizeMode: 'contain',
  },
  rescanButton: {
    position: 'absolute',
    top: SPACING.MD,
    right: SPACING.MD,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 20,
  },
  rescanText: {
    color: 'white',
    marginLeft: SPACING.XS,
    fontFamily: FONTS.MEDIUM,
  },
  detailsContainer: {
    padding: SPACING.MD,
  },
  header: {
    marginBottom: SPACING.MD,
  },
  merchantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.BOLD,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginTop: SPACING.XS,
    fontFamily: FONTS.BOLD,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  infoText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.SM,
    fontFamily: FONTS.REGULAR,
  },
  confidenceContainer: {
    marginVertical: SPACING.MD,
  },
  confidenceLabel: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS,
    fontFamily: FONTS.REGULAR,
  },
  confidenceBar: {
    height: 8,
    backgroundColor: COLORS.DIVIDER,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.XS,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: FONTS.BOLD,
  },
  itemsSection: {
    marginTop: SPACING.LG,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
    fontFamily: FONTS.BOLD,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.DIVIDER,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.REGULAR,
  },
  itemPrice: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
    fontFamily: FONTS.SEMIBOLD,
  },
  ocrSection: {
    marginTop: SPACING.LG,
  },
  ocrText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
    fontFamily: FONTS.REGULAR,
  },
  actions: {
    marginTop: SPACING.XL,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.MD,
    borderRadius: 12,
    marginBottom: SPACING.MD,
  },
  createTransactionButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  viewTransactionButton: {
    backgroundColor: COLORS.SUCCESS,
  },
  deleteButton: {
    backgroundColor: COLORS.ERROR,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: SPACING.SM,
    fontFamily: FONTS.BOLD,
  },
});

export default ReceiptDetailsScreen;