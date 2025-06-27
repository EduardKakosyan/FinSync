import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { COLORS, SPACING, FONTS } from '@/constants';

const AddTransactionScreen = () => {
  const navigation = useNavigation();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');

  const handleSave = () => {
    if (!amount || !description || !category) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // TODO: Save transaction to store
    Alert.alert('Success', 'Transaction saved successfully', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === 'expense' && styles.typeButtonActive,
            ]}
            onPress={() => setType('expense')}
          >
            <Text
              style={[
                styles.typeButtonText,
                type === 'expense' && styles.typeButtonTextActive,
              ]}
            >
              Expense
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === 'income' && styles.typeButtonActive,
            ]}
            onPress={() => setType('income')}
          >
            <Text
              style={[
                styles.typeButtonText,
                type === 'income' && styles.typeButtonTextActive,
              ]}
            >
              Income
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder='0.00'
            keyboardType='numeric'
            placeholderTextColor={COLORS.TEXT_SECONDARY}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder='Enter description'
            placeholderTextColor={COLORS.TEXT_SECONDARY}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <TextInput
            style={styles.input}
            value={category}
            onChangeText={setCategory}
            placeholder='Select category'
            placeholderTextColor={COLORS.TEXT_SECONDARY}
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Transaction</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  form: {
    padding: SPACING.MD,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: SPACING.LG,
  },
  typeButton: {
    flex: 1,
    padding: SPACING.MD,
    borderRadius: 12,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    marginHorizontal: SPACING.XS,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  typeButtonActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
  },
  typeButtonTextActive: {
    color: 'white',
  },
  inputGroup: {
    marginBottom: SPACING.MD,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
    fontFamily: FONTS.SEMIBOLD,
  },
  input: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    padding: SPACING.MD,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.REGULAR,
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    padding: SPACING.MD,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: SPACING.LG,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: FONTS.BOLD,
  },
});

export default AddTransactionScreen;
