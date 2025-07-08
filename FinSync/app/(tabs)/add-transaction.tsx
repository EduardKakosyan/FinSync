import React, { useState } from 'react';
import {
  View,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import {
  Typography,
  Card,
  Button,
  useColors,
  useTokens,
  Heading2,
  BodyText,
  Caption,
  Label
} from '../../src/design-system';
import TransactionTemplates from '../../src/components/transaction/TransactionTemplates';
import { CreateTransactionInput } from '../../src/types';

const AddTransactionScreen = () => {
  const colors = useColors();
  const tokens = useTokens();
  const [showTemplates, setShowTemplates] = useState(false);

  const handleUseAdvancedForm = () => {
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
    <SafeAreaView style={{ 
      flex: 1, 
      backgroundColor: colors.background 
    }}>
      <ScrollView>
        {/* Header */}
        <View style={{
          padding: tokens.Spacing.lg,
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: tokens.Spacing.sm,
            marginBottom: tokens.Spacing.sm,
          }}>
            <Ionicons name="add-circle" size={24} color={colors.primary} />
            <Heading2>Add Transaction</Heading2>
          </View>
          <BodyText color="secondary" align="center">
            Choose how you&apos;d like to add your transaction
          </BodyText>
        </View>

        <View style={{ padding: tokens.Spacing.md }}>
          {/* Smart Entry Form */}
          <Card 
            variant="default" 
            onPress={handleUseAdvancedForm}
            style={{ marginBottom: tokens.Spacing.lg }}
          >
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: tokens.Spacing.md,
            }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons name="sparkles" size={24} color={colors.textInverse} />
              </View>
              <View style={{
                backgroundColor: colors.warning + '20',
                paddingHorizontal: tokens.Spacing.sm,
                paddingVertical: 4,
                borderRadius: 12,
              }}>
                <Caption style={{ 
                  fontWeight: 'bold', 
                  color: colors.warning 
                }}>
                  AI Powered
                </Caption>
              </View>
            </View>
            <Typography variant="h4" style={{ marginBottom: tokens.Spacing.sm }}>
              Smart Entry Form
            </Typography>
            <BodyText color="secondary" style={{ marginBottom: tokens.Spacing.md }}>
              Use our intelligent form with smart suggestions, category matching, and auto-completion
            </BodyText>
            <View style={{ gap: tokens.Spacing.sm }}>
              {[
                'Smart amount suggestions',
                'Intelligent category matching',
                'Recent transaction insights'
              ].map((feature, index) => (
                <View key={index} style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: tokens.Spacing.sm,
                }}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Caption>{feature}</Caption>
                </View>
              ))}
            </View>
          </Card>

          {/* Quick Entry */}
          <View style={{ marginBottom: tokens.Spacing.lg }}>
            <Label style={{ marginBottom: tokens.Spacing.sm }}>
              Quick Entry
            </Label>
            
            <View style={{
              flexDirection: 'row',
              gap: tokens.Spacing.md,
            }}>
              <Button
                variant="destructive"
                size="large"
                style={{ flex: 1 }}
                leftIcon={<Ionicons name="remove-circle" size={20} color={colors.textInverse} />}
                onPress={() => handleQuickTransaction('expense')}
              >
                Expense
              </Button>
              
              <Button
                variant="primary"
                size="large"
                style={{ 
                  flex: 1,
                  backgroundColor: colors.success
                }}
                leftIcon={<Ionicons name="add-circle" size={20} color={colors.textInverse} />}
                onPress={() => handleQuickTransaction('income')}
              >
                Income
              </Button>
            </View>
          </View>

          {/* Templates */}
          <Card 
            variant="default" 
            onPress={() => setShowTemplates(true)}
            style={{ marginBottom: tokens.Spacing.lg }}
          >
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: tokens.Spacing.md,
              marginBottom: tokens.Spacing.sm,
            }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.info,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons name="bookmark" size={24} color={colors.textInverse} />
              </View>
              <Label>Use Template</Label>
            </View>
            <Caption color="secondary" style={{ marginBottom: tokens.Spacing.md }}>
              Choose from saved templates for recurring transactions
            </Caption>
            <View style={{ gap: tokens.Spacing.sm }}>
              {[
                { icon: 'cafe', text: 'Coffee - $5.50', color: colors.warning },
                { icon: 'car', text: 'Gas - $60.00', color: colors.info },
                { icon: 'restaurant', text: 'Lunch - $15.00', color: colors.success }
              ].map((item, index) => (
                <View key={index} style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: tokens.Spacing.sm,
                }}>
                  <Ionicons name={item.icon as any} size={14} color={item.color} />
                  <Caption color="secondary">{item.text}</Caption>
                </View>
              ))}
            </View>
          </Card>

          {/* Recent Transactions */}
          <View style={{ marginBottom: tokens.Spacing.lg }}>
            <Label style={{ marginBottom: tokens.Spacing.sm }}>
              Recent Transactions
            </Label>
            <Caption color="secondary" style={{ marginBottom: tokens.Spacing.md }}>
              Tap to create a similar transaction
            </Caption>
            
            <View style={{ gap: tokens.Spacing.sm }}>
              {[
                {
                  icon: 'cafe',
                  description: 'Starbucks Coffee',
                  category: 'Food & Dining',
                  time: 'Yesterday',
                  amount: 5.50,
                  color: colors.warning,
                  template: {
                    description: 'Starbucks Coffee',
                    amount: 5.50,
                    category: 'Food & Dining',
                    type: 'expense' as const,
                  }
                },
                {
                  icon: 'basket',
                  description: 'Groceries',
                  category: 'Food & Dining',
                  time: '2 days ago',
                  amount: 127.50,
                  color: colors.success,
                  template: {
                    description: 'Groceries',
                    amount: 127.50,
                    category: 'Food & Dining',
                    type: 'expense' as const,
                  }
                },
                {
                  icon: 'car',
                  description: 'Gas Station',
                  category: 'Transportation',
                  time: '3 days ago',
                  amount: 58.20,
                  color: colors.info,
                  template: {
                    description: 'Gas Station',
                    amount: 58.20,
                    category: 'Transportation',
                    type: 'expense' as const,
                  }
                }
              ].map((item, index) => (
                <Card
                  key={index}
                  variant="outlined"
                  onPress={() => handleSelectTemplate(item.template)}
                  style={{ padding: tokens.Spacing.md }}
                >
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                    <View style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: colors.surfaceElevated,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: tokens.Spacing.md,
                    }}>
                      <Ionicons name={item.icon as any} size={16} color={item.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Typography variant="labelSmall" style={{ fontWeight: '600' }}>
                        {item.description}
                      </Typography>
                      <Caption color="secondary" style={{ marginTop: 2 }}>
                        {item.category} • {item.time}
                      </Caption>
                    </View>
                    <Typography variant="labelSmall" style={{ 
                      fontWeight: '600',
                      color: colors.error
                    }}>
                      ${item.amount.toFixed(2)}
                    </Typography>
                  </View>
                </Card>
              ))}
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

export default AddTransactionScreen;