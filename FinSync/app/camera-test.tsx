import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet, SafeAreaView } from 'react-native';
import { Button } from '../src/design-system';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';

export default function CameraTest() {
  const [status, setStatus] = useState<string>('Ready');

  const testCamera = async () => {
    try {
      setStatus('Requesting camera permissions...');
      
      // Request camera permissions
      const { status } = await Camera.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        setStatus('Camera permission denied');
        Alert.alert('Permission denied', 'Camera access is required to capture images.');
        return;
      }

      setStatus('Opening camera...');
      
      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        setStatus(`Image captured: ${result.assets[0].uri}`);
        Alert.alert('Success', 'Image captured successfully!');
      } else {
        setStatus('Camera cancelled');
      }
    } catch (error) {
      setStatus(`Error: ${error}`);
      Alert.alert('Error', `Camera error: ${error}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Camera Test</Text>
        <Text style={styles.status}>Status: {status}</Text>
        
        <Button 
          variant="primary" 
          size="large" 
          onPress={testCamera}
          style={styles.button}
        >
          Test Camera
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
  status: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    marginTop: 20,
  },
});