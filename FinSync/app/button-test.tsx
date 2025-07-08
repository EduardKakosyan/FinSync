import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Button } from '../src/design-system';

export default function ButtonTest() {
  const [count, setCount] = useState(0);

  const handlePress = () => {
    setCount(count + 1);
    Alert.alert('Button Pressed', `Count: ${count + 1}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Button Test</Text>
        <Text style={styles.counter}>Count: {count}</Text>
        
        <View style={styles.buttonContainer}>
          <Button 
            variant="primary" 
            size="large" 
            onPress={handlePress}
            style={styles.button}
          >
            Primary Button
          </Button>
          
          <Button 
            variant="secondary" 
            size="large" 
            onPress={handlePress}
            style={styles.button}
          >
            Secondary Button
          </Button>
          
          <Button 
            variant="ghost" 
            size="large" 
            onPress={handlePress}
            style={styles.button}
          >
            Ghost Button
          </Button>
          
          <Button 
            variant="destructive" 
            size="large" 
            onPress={handlePress}
            style={styles.button}
          >
            Destructive Button
          </Button>
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
    color: '#fff',
    marginBottom: 20,
  },
  counter: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 30,
  },
  buttonContainer: {
    width: '100%',
    gap: 20,
  },
  button: {
    width: '100%',
  },
});