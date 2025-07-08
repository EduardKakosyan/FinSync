import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { COLORS, SPACING, FONTS } from '@/constants';
import { ReceiptItem } from '@/types';
import { formatCurrency } from '@/utils/currencyUtils';

interface ReceiptExtractedDataPreviewProps {
  merchantName?: string;
  amount?: number;
  date?: Date;
  items?: ReceiptItem[];
  confidence: number;
  onRetake: () => void;
}

export const ReceiptExtractedDataPreview: React.FC<ReceiptExtractedDataPreviewProps> = ({
  merchantName,
  amount,
  date,
  items,
  confidence,
  onRetake,
}) => {
  const confidenceColor = confidence > 0.8 
    ? COLORS.SUCCESS 
    : confidence > 0.6 
    ? COLORS.WARNING 
    : COLORS.ERROR;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Receipt Captured</Text>
        <TouchableOpacity onPress={onRetake} style={styles.retakeButton}>
          <Ionicons name="refresh" size={24} color={COLORS.PRIMARY} />
          <Text style={styles.retakeText}>Retake</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.confidenceContainer}>
        <Text style={styles.confidenceLabel}>OCR Confidence</Text>
        <View style={styles.confidenceBar}>
          <View 
            style={[
              styles.confidenceFill, 
              { 
                width: `${confidence * 100}%`,
                backgroundColor: confidenceColor 
              }
            ]} 
          />
        </View>
        <Text style={[styles.confidenceText, { color: confidenceColor }]}>
          {Math.round(confidence * 100)}%
        </Text>
      </View>

      <View style={styles.extractedData}>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Merchant</Text>
          <Text style={styles.value}>{merchantName || 'Not detected'}</Text>
        </View>

        <View style={styles.dataRow}>
          <Text style={styles.label}>Total Amount</Text>
          <Text style={[styles.value, styles.amountText]}>
            {amount ? formatCurrency(amount) : 'Not detected'}
          </Text>
        </View>

        <View style={styles.dataRow}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>
            {date ? format(date, 'PP') : 'Not detected'}
          </Text>
        </View>

        {items && items.length > 0 && (
          <View style={styles.itemsSection}>
            <Text style={styles.itemsTitle}>Items ({items.length})</Text>
            {items.slice(0, 5).map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
              </View>
            ))}
            {items.length > 5 && (
              <Text style={styles.moreItems}>
                ... and {items.length - 5} more items
              </Text>
            )}
          </View>
        )}
      </View>

      {confidence < 0.8 && (
        <View style={styles.warningContainer}>
          <Ionicons name="warning" size={20} color={COLORS.WARNING} />
          <Text style={styles.warningText}>
            Low confidence detection. Please review the extracted data.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    margin: SPACING.MD,
    padding: SPACING.MD,
    maxHeight: 500,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.BOLD,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  retakeText: {
    color: COLORS.PRIMARY,
    marginLeft: SPACING.XS,
    fontFamily: FONTS.MEDIUM,
  },
  confidenceContainer: {
    marginBottom: SPACING.LG,
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
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: SPACING.XS,
    fontFamily: FONTS.BOLD,
  },
  extractedData: {
    marginTop: SPACING.MD,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.DIVIDER,
  },
  label: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
  },
  value: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
    fontFamily: FONTS.SEMIBOLD,
  },
  amountText: {
    color: COLORS.PRIMARY,
    fontSize: 18,
  },
  itemsSection: {
    marginTop: SPACING.MD,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
    fontFamily: FONTS.BOLD,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.XS,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.REGULAR,
  },
  itemPrice: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.MEDIUM,
  },
  moreItems: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontStyle: 'italic',
    marginTop: SPACING.XS,
    fontFamily: FONTS.REGULAR,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WARNING + '20',
    padding: SPACING.MD,
    borderRadius: 8,
    marginTop: SPACING.MD,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.WARNING,
    marginLeft: SPACING.SM,
    fontFamily: FONTS.REGULAR,
  },
});