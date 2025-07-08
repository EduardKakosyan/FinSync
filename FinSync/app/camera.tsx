import React from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import CameraScreen from '../src/components/receipt/CameraScreen';

export default function CameraPage() {
  const params = useLocalSearchParams();
  const { returnPath } = params as { returnPath?: string };

  const handleCapture = (imageUri: string) => {
    // Navigate back to the previous screen with the captured image
    if (returnPath) {
      router.push({
        pathname: returnPath as any,
        params: { capturedImageUri: imageUri },
      });
    } else {
      router.push({
        pathname: '/(tabs)/add-transaction',
        params: { capturedImageUri: imageUri },
      });
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={{ flex: 1 }}>
      <CameraScreen 
        onCapture={handleCapture}
        onCancel={handleCancel}
      />
    </View>
  );
}