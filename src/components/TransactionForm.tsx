import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Colors, Typography } from '../constants/colors';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, OCRResult } from '../types';
import { addTransaction } from '../services/firebase';
import CameraCapture from './CameraCapture';
import { debugLogger } from '../utils/debugLogger';

interface TransactionFormProps {
  onSuccess?: () => void;
}

export default function TransactionForm({ onSuccess }: TransactionFormProps) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFromOCR, setIsFromOCR] = useState(false);
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);

  const categories = type === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES;

  const handleOCRResult = (result: OCRResult) => {
    debugLogger.log('OCR result received in form', result);
    
    if (result.success && result.data) {
      const { amount: ocrAmount, description: ocrDescription, category: ocrCategory, merchant } = result.data;
      
      // Auto-fill form fields with OCR data
      if (ocrAmount) {
        setAmount(ocrAmount.toString());
      }
      
      if (ocrDescription || merchant) {
        const desc = ocrDescription || merchant || '';
        setDescription(desc);
      }
      
      if (ocrCategory) {
        // Find matching category
        const matchingCategory = categories.find(cat => cat.id === ocrCategory);
        if (matchingCategory) {
          setSelectedCategory(ocrCategory);
        } else {
          // If no exact match, try 'other' or first category
          setSelectedCategory('other');
        }
      }
      
      // Mark as OCR-filled and store confidence
      setIsFromOCR(true);
      setOcrConfidence(result.confidence || null);
      
      debugLogger.log('Form auto-filled from OCR', {
        amount: ocrAmount,
        description: ocrDescription || merchant,
        category: ocrCategory,
        confidence: result.confidence
      });
    }
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setSelectedCategory('');
    setIsFromOCR(false);
    setOcrConfidence(null);
  };

  const handleSubmit = async () => {
    if (!amount || !selectedCategory) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      await addTransaction({
        type,
        amount: numAmount,
        category: selectedCategory,
        description,
        date: new Date(),
      });

      // Reset form
      resetForm();
      
      Alert.alert('Success', 'Transaction added successfully');
      onSuccess?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to add transaction');
      console.error('Error adding transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* OCR Camera Capture */}
        <CameraCapture 
          onOCRResult={handleOCRResult}
          disabled={isSubmitting}
        />
        
        {/* OCR Confidence Indicator */}
        {isFromOCR && ocrConfidence !== null && (
          <View style={styles.ocrIndicator}>
            <Text style={styles.ocrIndicatorText}>
              📷 Auto-filled from receipt ({ocrConfidence}% confidence)
            </Text>
            <TouchableOpacity onPress={resetForm}>
              <Text style={styles.ocrClearText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === 'expense' && styles.typeButtonActive,
              type === 'expense' && { backgroundColor: Colors.danger }
            ]}
            onPress={() => setType('expense')}
          >
            <Text style={[
              styles.typeButtonText,
              type === 'expense' && styles.typeButtonTextActive
            ]}>
              Expense
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === 'income' && styles.typeButtonActive,
              type === 'income' && { backgroundColor: Colors.secondary }
            ]}
            onPress={() => setType('income')}
          >
            <Text style={[
              styles.typeButtonText,
              type === 'income' && styles.typeButtonTextActive
            ]}>
              Income
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Amount (CAD)</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={Colors.text.light}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonActive,
                  selectedCategory === category.id && { backgroundColor: category.color }
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === category.id && styles.categoryButtonTextActive
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Add a note..."
            placeholderTextColor={Colors.text.light}
            multiline
          />
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Adding...' : 'Add Transaction'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
  },
  typeButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
  },
  typeButtonTextActive: {
    color: Colors.text.inverse,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  amountInput: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
    paddingVertical: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    margin: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryButtonActive: {
    borderColor: 'transparent',
  },
  categoryButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
  },
  categoryButtonTextActive: {
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.medium,
  },
  descriptionInput: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.inverse,
  },
  ocrIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  ocrIndicatorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.medium,
  },
  ocrClearText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.inverse,
    textDecorationLine: 'underline',
  },
});