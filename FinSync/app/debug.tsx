import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';

export default function DebugScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Debug Screen</Text>
        
        {/* Basic TouchableOpacity test */}
        <TouchableOpacity style={styles.basicButton} onPress={() => console.log('Basic button pressed')}>
          <Text style={styles.basicButtonText}>Basic Button Test</Text>
        </TouchableOpacity>
        
        {/* Primary button style test */}
        <TouchableOpacity style={styles.primaryButton} onPress={() => console.log('Primary button pressed')}>
          <Text style={styles.primaryButtonText}>Primary Button Test</Text>
        </TouchableOpacity>
        
        {/* Secondary button style test */}
        <TouchableOpacity style={styles.secondaryButton} onPress={() => console.log('Secondary button pressed')}>
          <Text style={styles.secondaryButtonText}>Secondary Button Test</Text>
        </TouchableOpacity>
        
        {/* Text visibility test */}
        <View style={styles.textContainer}>
          <Text style={styles.whiteText}>White text should be visible</Text>
          <Text style={styles.blackText}>Black text should be visible</Text>
          <Text style={styles.blueText}>Blue text should be visible</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 30,
  },
  basicButton: {
    backgroundColor: '#666666',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    width: '80%',
  },
  basicButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    width: '80%',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginBottom: 30,
    width: '80%',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  whiteText: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 10,
  },
  blackText: {
    color: '#000000',
    fontSize: 16,
    marginBottom: 10,
  },
  blueText: {
    color: '#007AFF',
    fontSize: 16,
    marginBottom: 10,
  },
});