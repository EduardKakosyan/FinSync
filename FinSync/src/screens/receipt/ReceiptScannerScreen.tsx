import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { COLORS, SPACING, FONTS } from '@/constants';

const ReceiptScannerScreen = () => {
  const navigation = useNavigation();

  const handleScanReceipt = () => {
    Alert.alert(
      'Coming Soon',
      'Receipt scanning feature will be available soon!'
    );
  };

  const handleSelectFromGallery = () => {
    Alert.alert(
      'Coming Soon',
      'Photo selection feature will be available soon!'
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons
          name='camera-outline'
          size={100}
          color={COLORS.TEXT_SECONDARY}
        />
        <Text style={styles.title}>Scan Receipt</Text>
        <Text style={styles.subtitle}>
          Capture your receipts to automatically extract transaction details
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleScanReceipt}
          >
            <Ionicons name='camera' size={24} color='white' />
            <Text style={styles.primaryButtonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSelectFromGallery}
          >
            <Ionicons name='images' size={24} color={COLORS.PRIMARY} />
            <Text style={styles.secondaryButtonText}>Select from Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.LG,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.LG,
    fontFamily: FONTS.BOLD,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: SPACING.MD,
    lineHeight: 22,
    fontFamily: FONTS.REGULAR,
  },
  actions: {
    width: '100%',
    marginTop: SPACING.XXL,
  },
  primaryButton: {
    backgroundColor: COLORS.PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.MD,
    borderRadius: 12,
    marginBottom: SPACING.MD,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: SPACING.SM,
    fontFamily: FONTS.BOLD,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.MD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.PRIMARY,
    marginLeft: SPACING.SM,
    fontFamily: FONTS.SEMIBOLD,
  },
});

export default ReceiptScannerScreen;
