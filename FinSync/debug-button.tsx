import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, ThemeProvider, useTheme, useColors } from './src/design-system';

const DebugButton = () => {
  const { colors, tokens } = useTheme();
  
  console.log('Colors object:', colors);
  console.log('Primary color:', colors.primary);
  console.log('Text inverse color:', colors.textInverse);
  console.log('Text primary color:', colors.textPrimary);
  console.log('Text secondary color:', colors.textSecondary);
  
  return (
    <View style={styles.container}>
      <Text style={[styles.debug, { color: colors.textPrimary }]}>
        Debug Info:
      </Text>
      <Text style={[styles.debug, { color: colors.textPrimary }]}>
        Primary: {colors.primary}
      </Text>
      <Text style={[styles.debug, { color: colors.textPrimary }]}>
        Text Inverse: {colors.textInverse}
      </Text>
      <Text style={[styles.debug, { color: colors.textPrimary }]}>
        Text Primary: {colors.textPrimary}
      </Text>
      
      <Button variant="primary" style={{ marginTop: 20 }}>
        Primary Button
      </Button>
      
      <Button variant="secondary" style={{ marginTop: 10 }}>
        Secondary Button
      </Button>
      
      <Button variant="ghost" style={{ marginTop: 10 }}>
        Ghost Button
      </Button>
      
      <Button variant="destructive" style={{ marginTop: 10 }}>
        Destructive Button
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  debug: {
    fontSize: 14,
    marginBottom: 5,
  },
});

export default function DebugApp() {
  return (
    <ThemeProvider colorScheme="light">
      <DebugButton />
    </ThemeProvider>
  );
}