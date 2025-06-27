import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { COLORS, SPACING, FONTS } from '@/constants';

const ReceiptDetailsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Receipt Details</Text>
      <Text style={styles.subtitle}>Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.LG,
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
    marginTop: SPACING.MD,
    fontFamily: FONTS.REGULAR,
  },
});

export default ReceiptDetailsScreen;
