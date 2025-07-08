import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import {
  Typography,
  Card,
  Button,
  useColors,
  useTokens,
  Heading2,
  BodyText,
  Caption,
  Label,
  useOptimizedSpacing
} from '../../src/design-system';
import TransactionTemplates from '../../src/components/transaction/TransactionTemplates';
import { CreateTransactionInput, Transaction } from '../../src/types';
import { enhancedTransactionService } from '../../src/services/EnhancedTransactionService';
import { format } from 'date-fns';
import { formatCurrency } from '../../src/utils/currencyUtils';

const AddTransactionScreen = () => {
  const colors = useColors();
  const tokens = useTokens();
  const spacing = useOptimizedSpacing();
  const params = useLocalSearchParams();
  const [showTemplates, setShowTemplates] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);

  useEffect(() => {
    loadRecentTransactions();
  }, []);

  useEffect(() => {
    if (params.capturedImageUri) {
      setCapturedImageUri(params.capturedImageUri as string);
      // Navigate to advanced form with captured image
      router.push({
        pathname: '/advanced-add-transaction',
        params: { 
          capturedImageUri: params.capturedImageUri as string
        },
      });
    }
  }, [params.capturedImageUri]);

  const loadRecentTransactions = async () => {
    try {
      setIsLoadingTransactions(true);
      const transactionsResponse = await enhancedTransactionService.getTransactions({ type: 'month' }, false);
      
      if (transactionsResponse.success && transactionsResponse.data) {
        // Get the 3 most recent transactions, sorted by date
        const recent = transactionsResponse.data
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .slice(0, 3);
        setRecentTransactions(recent);
      }
    } catch (error) {
      console.error('Failed to load recent transactions:', error);
      setRecentTransactions([]);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const getTransactionIcon = (transaction: Transaction): string => {
    const category = transaction.category.toLowerCase();
    if (category.includes('food') || category.includes('dining') || category.includes('coffee')) {
      return 'cafe';
    } else if (category.includes('transport') || category.includes('gas') || category.includes('car')) {
      return 'car';
    } else if (category.includes('grocery') || category.includes('shopping')) {
      return 'basket';
    } else if (category.includes('entertainment')) {
      return 'film';
    } else if (category.includes('health')) {
      return 'medical';
    } else if (transaction.type === 'income') {
      return 'trending-up';
    }
    return 'card';
  };

  const getTransactionColor = (transaction: Transaction): string => {
    const category = transaction.category.toLowerCase();
    if (category.includes('food') || category.includes('coffee')) {
      return colors.warning;
    } else if (category.includes('transport')) {
      return colors.info;
    } else if (category.includes('grocery')) {
      return colors.success;
    }
    return colors.primary;
  };

  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays <= 7) {
      return `${diffInDays} days ago`;
    } else {
      return format(date, 'MMM dd');
    }
  };

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

  const handleCameraPress = async () => {
    // Request camera permissions
    const { status } = await Camera.requestCameraPermissionsAsync();
    
    if (status === 'granted') {
      // Launch camera for receipt scanning
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        // Navigate to advanced form with camera result
        router.push({
          pathname: '/advanced-add-transaction',
          params: { 
            receiptImage: result.assets[0].uri,
          },
        });
      }
    } else {
      // Handle permission denied
      console.log('Camera permission denied');
    }
  };

  const handleSelectRecentTransaction = (transaction: Transaction) => {
    const template: Partial<CreateTransactionInput> = {
      description: transaction.description,
      amount: transaction.amount,
      category: transaction.category,
      type: transaction.type,
      date: new Date(),
    };

    handleSelectTemplate(template);
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

          {/* Camera Receipt Scanner */}
          <Card 
            variant="default" 
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
                backgroundColor: colors.success,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons name="camera" size={24} color={colors.textInverse} />
              </View>
              <View style={{
                backgroundColor: colors.info + '20',
                paddingHorizontal: tokens.Spacing.sm,
                paddingVertical: 4,
                borderRadius: 12,
              }}>
                <Caption style={{ 
                  fontWeight: 'bold', 
                  color: colors.info 
                }}>
                  NEW
                </Caption>
              </View>
            </View>
            <Typography variant="h4" style={{ marginBottom: tokens.Spacing.sm }}>
              Scan Receipt
            </Typography>
            <BodyText color="secondary" style={{ marginBottom: tokens.Spacing.md }}>
              Capture or select a receipt photo to automatically extract transaction details
            </BodyText>
            <View style={{ gap: tokens.Spacing.sm }}>
              {[
                'Automatic amount detection',
                'Smart merchant recognition',
                'Quick category assignment'
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
            <View style={{ marginTop: tokens.Spacing.md }}>
              <ReceiptCaptureButton 
                size="medium"
                style={{ alignSelf: 'flex-start' }}
                onCaptureComplete={(imageUri: string) => {
                  router.push({
                    pathname: '/advanced-add-transaction',
                    params: { 
                      capturedImageUri: imageUri
                    },
                  });
                }}
              />
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

          {/* Camera Receipt Scanning */}
          <Card 
            variant="default" 
            onPress={handleCameraPress}
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
                backgroundColor: colors.secondary,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons name="camera" size={24} color={colors.textInverse} />
              </View>
              <Label>Scan Receipt</Label>
            </View>
            <Caption color="secondary" style={{ marginBottom: tokens.Spacing.md }}>
              Use your camera to scan receipts and auto-extract transaction details
            </Caption>
            <View style={{ gap: tokens.Spacing.sm }}>
              {[
                { icon: 'scan', text: 'Auto-extract amounts', color: colors.success },
                { icon: 'text', text: 'Recognize merchant names', color: colors.info },
                { icon: 'time', text: 'Instant transaction creation', color: colors.warning }
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
            
            {isLoadingTransactions ? (
              <Card variant="outlined" style={{ padding: tokens.Spacing.lg }}>
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: tokens.Spacing.sm
                }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Caption color="secondary">Loading recent transactions...</Caption>
                </View>
              </Card>
            ) : recentTransactions.length > 0 ? (
              <View style={{ gap: tokens.Spacing.sm }}>
                {recentTransactions.map((transaction, index) => (
                  <Card
                    key={transaction.id || index}
                    variant="outlined"
                    onPress={() => handleSelectRecentTransaction(transaction)}
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
                        <Ionicons 
                          name={getTransactionIcon(transaction) as any} 
                          size={16} 
                          color={getTransactionColor(transaction)} 
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Typography variant="labelSmall" style={{ fontWeight: '600' }}>
                          {transaction.description}
                        </Typography>
                        <Caption color="secondary" style={{ marginTop: 2 }}>
                          {transaction.category} • {getRelativeTime(transaction.date)}
                        </Caption>
                      </View>
                      <Typography variant="labelSmall" style={{ 
                        fontWeight: '600',
                        color: transaction.type === 'income' ? colors.success : colors.error
                      }}>
                        {transaction.type === 'income' ? '+' : ''}{formatCurrency(transaction.type === 'expense' ? -Math.abs(transaction.amount) : Math.abs(transaction.amount))}
                      </Typography>
                    </View>
                  </Card>
                ))}
              </View>
            ) : (
              <Card variant="outlined" style={{ padding: tokens.Spacing.xl }}>
                <View style={{ 
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: tokens.Spacing.md
                }}>
                  <Ionicons 
                    name="time-outline" 
                    size={48} 
                    color={colors.textSecondary} 
                  />
                  <View style={{ alignItems: 'center' }}>
                    <Typography variant="labelMedium" style={{ 
                      fontWeight: '600',
                      color: colors.textPrimary,
                      marginBottom: tokens.Spacing.xs
                    }}>
                      No Recent Transactions
                    </Typography>
                    <Caption color="secondary" align="center">
                      Once you create some transactions, they'll appear here for quick reuse
                    </Caption>
                  </View>
                  <Button
                    variant="ghost"
                    size="small"
                    leftIcon={<Ionicons name="add" size={16} color={colors.primary} />}
                    onPress={handleUseAdvancedForm}
                    style={{ marginTop: tokens.Spacing.sm }}
                  >
                    Create Your First Transaction
                  </Button>
                </View>
              </Card>
            )}
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