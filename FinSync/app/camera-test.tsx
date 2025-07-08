import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { Button } from '../src/design-system';
import * as ImagePicker from 'expo-image-picker';
import { useCameraPermissions } from 'expo-camera';

export default function CameraTest() {
  const [status, setStatus] = useState<string>('Ready');
  const [permission, requestPermission] = useCameraPermissions();

  const showIPhone13ProTips = () => {
    if (Platform.OS === 'ios') {
      Alert.alert(
        'iPhone 13 Pro Camera Tips',
        '• Keep subjects at least 16-19cm away from camera\n• Use good lighting for better focus\n• Tap to focus on specific areas\n• If focus issues persist, try switching to different lighting',
        [{ text: 'Got it' }]
      );
    }
  };

  const testCamera = async () => {
    try {
      setStatus('Checking camera permissions...');
      
      // Request camera permissions using modern hook
      if (!permission?.granted) {
        const result = await requestPermission();
        if (!result.granted) {
          setStatus('Camera permission denied');
          Alert.alert(
            'Permission denied', 
            'Camera access is required to capture images.',
            [
              { text: 'OK' },
              { text: 'iPhone 13 Pro Tips', onPress: showIPhone13ProTips }
            ]
          );
          return;
        }
      }

      setStatus('Opening camera...');
      
      // Launch camera with iPhone 13 Pro optimizations
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        // iPhone 13 Pro specific optimizations
        ...(Platform.OS === 'ios' && {
          allowsMultipleSelection: false,
          presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
        }),
      });

      if (!result.canceled && result.assets?.[0]) {
        setStatus(`Image captured: ${result.assets[0].uri}`);
        Alert.alert(
          'Success', 
          'Image captured successfully!',
          [
            { text: 'OK' },
            { text: 'Camera Tips', onPress: showIPhone13ProTips }
          ]
        );
      } else {
        setStatus('Camera cancelled');
      }
    } catch (error) {
      setStatus(`Error: ${error}`);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Enhanced error handling for iPhone 13 Pro
      if (errorMessage.includes('focus') || errorMessage.includes('blur')) {
        Alert.alert(
          'Camera Focus Issue',
          'iPhone 13 Pro users: Try moving your subject further away (16-19cm minimum) or ensure better lighting.',
          [
            { text: 'OK' },
            { text: 'More Tips', onPress: showIPhone13ProTips }
          ]
        );
      } else {
        Alert.alert('Error', `Camera error: ${errorMessage}`);
      }
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
        
        <Button 
          variant="secondary" 
          size="medium" 
          onPress={showIPhone13ProTips}
          style={styles.tipsButton}
        >
          iPhone 13 Pro Tips
        </Button>
        
        <Text style={styles.warningText}>
          ⚠️ Note: Full camera functionality requires a development build.{'\n'}
          Expo Go has limitations with iPhone 13 Pro camera access.
        </Text>
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
  tipsButton: {
    marginTop: 15,
  },
  warningText: {
    fontSize: 14,
    color: '#FFD700',
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
});