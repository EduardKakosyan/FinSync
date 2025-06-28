import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { COLORS, SPACING, FONTS } from '../../src/constants';
import TransactionTemplates from '../../src/components/transaction/TransactionTemplates';
import { CreateTransactionInput } from '../../src/types';

const AddTransactionScreen = () => {
  const [showTemplates, setShowTemplates] = useState(false);

  const handleUseAdvancedForm = () => {
    // For now, we'll navigate to a simple form since we're using Expo Router
    router.push('/advanced-add-transaction');
  };

  const handleQuickTransaction = (type: 'income' | 'expense') => {
    router.push({
      pathname: '/advanced-add-transaction',
      params: { transactionType: type },
    });
  };

  const handleSelectTemplate = (template: Partial<CreateTransactionInput>) => {
    router.push({
      pathname: '/advanced-add-transaction',
      params: { 
        prefillData: JSON.stringify(template),
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Ionicons name="add-circle" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.title}>Add Transaction</Text>
          </View>
          <Text style={styles.subtitle}>
            Choose how you'd like to add your transaction
          </Text>
        </View>

        <View style={styles.options}>
          {/* Advanced Form Option */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={handleUseAdvancedForm}
          >
            <View style={styles.optionHeader}>
              <View style={[styles.optionIcon, { backgroundColor: COLORS.PRIMARY }]}>
                <Ionicons name="sparkles" size={24} color="white" />
              </View>
              <View style={styles.aiIndicator}>
                <Text style={styles.aiText}>AI Powered</Text>
              </View>
            </View>
            <Text style={styles.optionTitle}>Smart Entry Form</Text>
            <Text style={styles.optionDescription}>
              Use our intelligent form with smart suggestions, category matching, and auto-completion
            </Text>
            <View style={styles.optionFeatures}>
              <View style={styles.feature}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.SUCCESS} />
                <Text style={styles.featureText}>Smart amount suggestions</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.SUCCESS} />
                <Text style={styles.featureText}>Intelligent category matching</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.SUCCESS} />
                <Text style={styles.featureText}>Recent transaction insights</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Quick Entry Options */}
          <View style={styles.quickOptions}>
            <Text style={styles.sectionTitle}>Quick Entry</Text>
            
            <View style={styles.quickButtonsRow}>
              <TouchableOpacity
                style={[styles.quickButton, { backgroundColor: COLORS.DANGER }]}
                onPress={() => handleQuickTransaction('expense')}
              >
                <Ionicons name="remove-circle" size={20} color="white" />
                <Text style={styles.quickButtonText}>Expense</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.quickButton, { backgroundColor: COLORS.SUCCESS }]}
                onPress={() => handleQuickTransaction('income')}
              >
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.quickButtonText}>Income</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Templates Option */}
          <TouchableOpacity
            style={styles.templateCard}
            onPress={() => setShowTemplates(true)}
          >
            <View style={styles.templateHeader}>
              <View style={[styles.optionIcon, { backgroundColor: COLORS.INFO }]}>
                <Ionicons name="bookmark" size={24} color="white" />
              </View>
              <Text style={styles.templateTitle}>Use Template</Text>
            </View>
            <Text style={styles.templateDescription}>
              Choose from saved templates for recurring transactions
            </Text>
            <View style={styles.templatePreview}>
              <View style={styles.previewItem}>
                <Ionicons name="cafe" size={14} color={COLORS.WARNING} />
                <Text style={styles.previewText}>Coffee - $5.50</Text>
              </View>
              <View style={styles.previewItem}>
                <Ionicons name="car" size={14} color={COLORS.INFO} />
                <Text style={styles.previewText}>Gas - $60.00</Text>
              </View>
              <View style={styles.previewItem}>
                <Ionicons name="restaurant" size={14} color={COLORS.SUCCESS} />
                <Text style={styles.previewText}>Lunch - $15.00</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Recent Transactions */}
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <Text style={styles.sectionSubtitle}>
              Tap to create a similar transaction
            </Text>
            
            <View style={styles.recentList}>
              <TouchableOpacity
                style={styles.recentItem}
                onPress={() => handleSelectTemplate({
                  description: 'Starbucks Coffee',
                  amount: 5.50,
                  category: 'Food & Dining',
                  type: 'expense',
                })}
              >
                <View style={styles.recentIcon}>
                  <Ionicons name="cafe" size={16} color={COLORS.WARNING} />
                </View>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentDescription}>Starbucks Coffee</Text>
                  <Text style={styles.recentDetails}>Food & Dining • Yesterday</Text>
                </View>
                <Text style={styles.recentAmount}>$5.50</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.recentItem}
                onPress={() => handleSelectTemplate({
                  description: 'Groceries',
                  amount: 127.50,
                  category: 'Food & Dining',
                  type: 'expense',
                })}
              >
                <View style={styles.recentIcon}>
                  <Ionicons name="basket" size={16} color={COLORS.SUCCESS} />
                </View>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentDescription}>Groceries</Text>
                  <Text style={styles.recentDetails}>Food & Dining • 2 days ago</Text>
                </View>
                <Text style={styles.recentAmount}>$127.50</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.recentItem}
                onPress={() => handleSelectTemplate({
                  description: 'Gas Station',
                  amount: 58.20,
                  category: 'Transportation',
                  type: 'expense',
                })}
              >
                <View style={styles.recentIcon}>
                  <Ionicons name="car" size={16} color={COLORS.INFO} />
                </View>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentDescription}>Gas Station</Text>
                  <Text style={styles.recentDetails}>Transportation • 3 days ago</Text>
                </View>
                <Text style={styles.recentAmount}>$58.20</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Transaction Templates Modal */}
        <TransactionTemplates
          visible={showTemplates}
          onClose={() => setShowTemplates(false)}
          onSelectTemplate={handleSelectTemplate}
        />
      </ScrollView>
    </SafeAreaView>
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
    backgroundColor: COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
    marginBottom: SPACING.SM,
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
    fontFamily: FONTS.REGULAR,
    textAlign: 'center',
  },
  options: {
    padding: SPACING.MD,
  },
  optionCard: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 16,
    padding: SPACING.LG,
    marginBottom: SPACING.LG,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.MD,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiIndicator: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: SPACING.SM,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.WARNING,
    fontFamily: FONTS.BOLD,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.BOLD,
    marginBottom: SPACING.SM,
  },
  optionDescription: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
    lineHeight: 22,
    marginBottom: SPACING.MD,
  },
  optionFeatures: {
    gap: SPACING.SM,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.REGULAR,
  },
  quickOptions: {
    marginBottom: SPACING.LG,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
    marginBottom: SPACING.SM,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
    marginBottom: SPACING.MD,
  },
  quickButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.MD,
  },
  quickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.LG,
    borderRadius: 12,
    gap: SPACING.SM,
  },
  quickButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: FONTS.SEMIBOLD,
  },
  templateCard: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 16,
    padding: SPACING.LG,
    marginBottom: SPACING.LG,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  templateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
  },
  templateDescription: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
    marginBottom: SPACING.MD,
  },
  templatePreview: {
    gap: SPACING.SM,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  previewText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
  },
  recentSection: {
    marginBottom: SPACING.LG,
  },
  recentList: {
    gap: SPACING.SM,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    padding: SPACING.MD,
  },
  recentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.MD,
  },
  recentInfo: {
    flex: 1,
  },
  recentDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
  },
  recentDetails: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
    marginTop: 2,
  },
  recentAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.DANGER,
    fontFamily: FONTS.SEMIBOLD,
  },
});

export default AddTransactionScreen;