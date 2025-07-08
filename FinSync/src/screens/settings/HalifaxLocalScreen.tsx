import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { COLORS, SPACING, FONTS } from '@/constants';
import { halifaxLocalService, HSTCalculation, LocalBankInfo } from '@/services/HalifaxLocalService';
import { formatCurrency } from '@/utils/currencyUtils';

const HalifaxLocalScreen = () => {
  const navigation = useNavigation();
  const [hstAmount, setHstAmount] = useState('');
  const [hstCalculation, setHstCalculation] = useState<HSTCalculation | null>(null);
  const [localBanks, setLocalBanks] = useState<LocalBankInfo[]>([]);
  const [showHSTCalculator, setShowHSTCalculator] = useState(false);
  const [includesHST, setIncludesHST] = useState(false);

  useEffect(() => {
    loadLocalData();
  }, []);

  const loadLocalData = () => {
    const banks = halifaxLocalService.getLocalBanks();
    setLocalBanks(banks);
  };

  const calculateHST = () => {
    const amount = parseFloat(hstAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    const calculation = halifaxLocalService.calculateHST(amount, includesHST);
    setHstCalculation(calculation);
  };

  const handleBankContact = (bank: LocalBankInfo, contactType: 'phone' | 'website') => {
    if (contactType === 'phone') {
      Linking.openURL(`tel:${bank.contact.phone}`);
    } else {
      Linking.openURL(bank.contact.website);
    }
  };

  const renderHSTCalculator = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>HST Calculator</Text>
        <TouchableOpacity
          onPress={() => setShowHSTCalculator(!showHSTCalculator)}
          style={styles.toggleButton}
        >
          <Ionicons
            name={showHSTCalculator ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={COLORS.PRIMARY}
          />
        </TouchableOpacity>
      </View>

      {showHSTCalculator && (
        <View style={styles.calculatorContent}>
          <Text style={styles.calculatorDescription}>
            Calculate Nova Scotia HST (14%) for your purchases
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Amount ($)</Text>
            <TextInput
              style={styles.textInput}
              value={hstAmount}
              onChangeText={setHstAmount}
              keyboardType="numeric"
              placeholder="Enter amount"
              placeholderTextColor={COLORS.TEXT_SECONDARY}
            />
          </View>

          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setIncludesHST(!includesHST)}
            >
              <Ionicons
                name={includesHST ? 'checkbox' : 'square-outline'}
                size={20}
                color={COLORS.PRIMARY}
              />
              <Text style={styles.checkboxLabel}>Amount includes HST</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.calculateButton} onPress={calculateHST}>
            <Text style={styles.calculateButtonText}>Calculate HST</Text>
          </TouchableOpacity>

          {hstCalculation && (
            <View style={styles.calculationResult}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Subtotal:</Text>
                <Text style={styles.resultValue}>{formatCurrency(hstCalculation.subtotal)}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>HST (14%):</Text>
                <Text style={styles.resultValue}>{formatCurrency(hstCalculation.hstAmount)}</Text>
              </View>
              <View style={[styles.resultRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>{formatCurrency(hstCalculation.total)}</Text>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderLocalBanks = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Local Halifax Banks</Text>
      <Text style={styles.cardDescription}>
        Banking options available in Halifax and Nova Scotia
      </Text>

      {localBanks.map((bank) => (
        <View key={bank.id} style={styles.bankItem}>
          <View style={styles.bankHeader}>
            <Text style={styles.bankName}>{bank.name}</Text>
            <View style={[styles.bankTypeBadge, {
              backgroundColor: bank.type === 'credit_union' ? COLORS.SUCCESS + '20' : COLORS.PRIMARY + '20'
            }]}>
              <Text style={[styles.bankTypeText, {
                color: bank.type === 'credit_union' ? COLORS.SUCCESS : COLORS.PRIMARY
              }]}>
                {bank.type.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.bankLocation}>{bank.location}</Text>
          
          <View style={styles.bankServices}>
            {bank.services.slice(0, 3).map((service, index) => (
              <Text key={index} style={styles.serviceItem}>• {service}</Text>
            ))}
            {bank.services.length > 3 && (
              <Text style={styles.serviceItem}>• +{bank.services.length - 3} more</Text>
            )}
          </View>

          <View style={styles.bankActions}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => handleBankContact(bank, 'phone')}
            >
              <Ionicons name="call" size={16} color={COLORS.PRIMARY} />
              <Text style={styles.contactButtonText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => handleBankContact(bank, 'website')}
            >
              <Ionicons name="globe" size={16} color={COLORS.PRIMARY} />
              <Text style={styles.contactButtonText}>Website</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  const renderTaxInfo = () => {
    const taxInfo = halifaxLocalService.getLocalTaxInfo();

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nova Scotia Tax Information</Text>
        
        <View style={styles.taxGrid}>
          <View style={styles.taxItem}>
            <Text style={styles.taxLabel}>Provincial Tax</Text>
            <Text style={styles.taxValue}>{(taxInfo.provincialTaxRate * 100).toFixed(1)}%</Text>
          </View>
          <View style={styles.taxItem}>
            <Text style={styles.taxLabel}>Federal Tax</Text>
            <Text style={styles.taxValue}>{(taxInfo.federalTaxRate * 100).toFixed(1)}%</Text>
          </View>
          <View style={styles.taxItem}>
            <Text style={styles.taxLabel}>RRSP Limit</Text>
            <Text style={styles.taxValue}>{formatCurrency(taxInfo.rrspLimit)}</Text>
          </View>
          <View style={styles.taxItem}>
            <Text style={styles.taxLabel}>TFSA Limit</Text>
            <Text style={styles.taxValue}>{formatCurrency(taxInfo.tfsaLimit)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderLocalRecommendations = () => {
    const recommendations = halifaxLocalService.getLocalRecommendations();

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Halifax Living Tips</Text>
        
        <View style={styles.recommendationSection}>
          <Text style={styles.recommendationTitle}>Banking</Text>
          {recommendations.banking.slice(0, 2).map((tip, index) => (
            <Text key={index} style={styles.recommendationText}>• {tip}</Text>
          ))}
        </View>

        <View style={styles.recommendationSection}>
          <Text style={styles.recommendationTitle}>Transportation</Text>
          {recommendations.transportation.slice(0, 2).map((tip, index) => (
            <Text key={index} style={styles.recommendationText}>• {tip}</Text>
          ))}
        </View>

        <View style={styles.recommendationSection}>
          <Text style={styles.recommendationTitle}>Savings</Text>
          {recommendations.savings.slice(0, 2).map((tip, index) => (
            <Text key={index} style={styles.recommendationText}>• {tip}</Text>
          ))}
        </View>
      </View>
    );
  };

  const renderSeasonalTips = () => {
    const seasonalTips = halifaxLocalService.getSeasonalTips();

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{seasonalTips.season} Financial Tips</Text>
        {seasonalTips.tips.map((tip, index) => (
          <View key={index} style={styles.seasonalTip}>
            <Ionicons name="leaf" size={16} color={COLORS.SUCCESS} />
            <Text style={styles.seasonalTipText}>{tip}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Halifax Local Guide</Text>
        <Text style={styles.headerSubtitle}>
          Financial tools and information for Halifax, Nova Scotia residents
        </Text>
      </View>

      {renderHSTCalculator()}
      {renderLocalBanks()}
      {renderTaxInfo()}
      {renderLocalRecommendations()}
      {renderSeasonalTips()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    padding: SPACING.LG,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.BOLD,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: SPACING.XS,
    fontFamily: FONTS.REGULAR,
  },
  card: {
    backgroundColor: COLORS.CARD,
    marginHorizontal: SPACING.MD,
    marginBottom: SPACING.MD,
    padding: SPACING.LG,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.BOLD,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.SM,
    fontFamily: FONTS.REGULAR,
  },
  toggleButton: {
    padding: SPACING.SM,
  },
  calculatorContent: {
    marginTop: SPACING.MD,
  },
  calculatorDescription: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.MD,
    fontFamily: FONTS.REGULAR,
  },
  inputContainer: {
    marginBottom: SPACING.MD,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
    fontFamily: FONTS.SEMIBOLD,
  },
  textInput: {
    backgroundColor: COLORS.BACKGROUND,
    borderWidth: 1,
    borderColor: COLORS.DIVIDER,
    borderRadius: 8,
    padding: SPACING.MD,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.REGULAR,
  },
  checkboxContainer: {
    marginBottom: SPACING.MD,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.SM,
    fontFamily: FONTS.REGULAR,
  },
  calculateButton: {
    backgroundColor: COLORS.PRIMARY,
    padding: SPACING.MD,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  calculateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: FONTS.BOLD,
  },
  calculationResult: {
    backgroundColor: COLORS.BACKGROUND,
    padding: SPACING.MD,
    borderRadius: 8,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.SM,
  },
  resultLabel: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.DIVIDER,
    paddingTop: SPACING.SM,
    marginTop: SPACING.SM,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.BOLD,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    fontFamily: FONTS.BOLD,
  },
  bankItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.DIVIDER,
    paddingVertical: SPACING.MD,
  },
  bankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  bankName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
    fontFamily: FONTS.BOLD,
  },
  bankTypeBadge: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: 8,
  },
  bankTypeText: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: FONTS.BOLD,
  },
  bankLocation: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.SM,
    fontFamily: FONTS.REGULAR,
  },
  bankServices: {
    marginBottom: SPACING.SM,
  },
  serviceItem: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
  },
  bankActions: {
    flexDirection: 'row',
    gap: SPACING.MD,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: COLORS.PRIMARY + '15',
    borderRadius: 8,
  },
  contactButtonText: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    marginLeft: SPACING.XS,
    fontWeight: '600',
    fontFamily: FONTS.SEMIBOLD,
  },
  taxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: SPACING.MD,
  },
  taxItem: {
    width: '48%',
    alignItems: 'center',
    padding: SPACING.MD,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 8,
    marginBottom: SPACING.SM,
  },
  taxLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
  },
  taxValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginTop: SPACING.XS,
    fontFamily: FONTS.BOLD,
  },
  recommendationSection: {
    marginBottom: SPACING.MD,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
    fontFamily: FONTS.BOLD,
  },
  recommendationText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS,
    fontFamily: FONTS.REGULAR,
  },
  seasonalTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.SM,
  },
  seasonalTipText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.SM,
    flex: 1,
    fontFamily: FONTS.REGULAR,
  },
});

export default HalifaxLocalScreen;