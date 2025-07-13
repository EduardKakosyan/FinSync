import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Modal
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Colors, Typography } from '../constants/colors';
import { SPACING } from '../constants/dimensions';
import { ocrService, OCRResult } from '../services/ocr';
import OCRSettings from './OCRSettings';
import { debugLogger } from '../utils/debugLogger';

interface CameraCaptureProps {
  onOCRResult: (result: OCRResult) => void;
  disabled?: boolean;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onOCRResult, disabled = false }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastImageUri, setLastImageUri] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera access to capture receipts.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const convertImageToBase64 = async (uri: string): Promise<string> => {
    try {
      debugLogger.log('Converting image to base64', { uri });
      
      // Read the image file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Determine the image type from the URI
      const imageType = uri.toLowerCase().includes('.png') ? 'png' : 'jpeg';
      const dataUri = `data:image/${imageType};base64,${base64}`;
      
      debugLogger.log('Image converted to base64', { 
        imageType, 
        base64Length: base64.length 
      });
      
      return dataUri;
    } catch (error) {
      debugLogger.error('Failed to convert image to base64', error);
      throw new Error('Failed to process image');
    }
  };

  const processImage = async (uri: string) => {
    setIsProcessing(true);
    setLastImageUri(uri);
    
    try {
      debugLogger.log('Starting OCR processing', { imageUri: uri });
      
      // Convert image to base64
      const base64Image = await convertImageToBase64(uri);
      
      // Test connection first, then extract transaction data
      const connectionTest = await ocrService.testConnection();
      if (!connectionTest.success) {
        throw new Error(connectionTest.error || 'OCR service not available');
      }

      // Extract transaction data using OCR
      const ocrResult = await ocrService.extractTransactionData(base64Image);
      
      debugLogger.log('OCR processing completed', { 
        success: ocrResult.success,
        confidence: ocrResult.confidence 
      });
      
      // Pass result to parent component
      onOCRResult(ocrResult);
      
      if (ocrResult.success && ocrResult.confidence && ocrResult.confidence > 70) {
        Alert.alert(
          'Receipt Processed Successfully',
          `Transaction data extracted with ${ocrResult.confidence}% confidence.`,
          [{ text: 'OK' }]
        );
      } else if (ocrResult.success) {
        Alert.alert(
          'Receipt Processed',
          `Transaction data extracted with low confidence (${ocrResult.confidence || 0}%). Please verify the details.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Processing Failed',
          ocrResult.error || 'Failed to extract transaction data from the receipt.',
          [{ text: 'OK' }]
        );
      }
      
    } catch (error) {
      debugLogger.error('OCR processing failed', error);
      Alert.alert(
        'Processing Error',
        'Failed to process the receipt image. Please try again.',
        [{ text: 'OK' }]
      );
      
      onOCRResult({
        success: false,
        error: error.message || 'Processing failed'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const takePhoto = async () => {
    if (disabled || isProcessing) return;
    
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      debugLogger.log('Launching camera for receipt capture');
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8, // Good balance between quality and file size
        base64: false, // We'll read the file ourselves for better control
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        debugLogger.log('Photo captured successfully', { imageUri });
        await processImage(imageUri);
      }
    } catch (error) {
      debugLogger.error('Camera capture failed', error);
      Alert.alert(
        'Camera Error',
        'Failed to capture photo. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const pickFromGallery = async () => {
    if (disabled || isProcessing) return;

    try {
      debugLogger.log('Launching image picker for receipt selection');
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        debugLogger.log('Image selected from gallery', { imageUri });
        await processImage(imageUri);
      }
    } catch (error) {
      debugLogger.error('Gallery picker failed', error);
      Alert.alert(
        'Gallery Error',
        'Failed to select image. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const showImageOptions = () => {
    if (disabled || isProcessing) return;

    Alert.alert(
      'Add Receipt',
      'Choose how to capture your receipt',
      [
        {
          text: 'Take Photo',
          onPress: takePhoto,
        },
        {
          text: 'Choose from Gallery',
          onPress: pickFromGallery,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.captureButton, disabled && styles.captureButtonDisabled]}
        onPress={showImageOptions}
        disabled={disabled || isProcessing}
      >
        <View style={styles.buttonContent}>
          {isProcessing ? (
            <>
              <ActivityIndicator color={Colors.text.inverse} size="small" />
              <Text style={styles.buttonText}>Processing...</Text>
            </>
          ) : (
            <>
              <Text style={styles.buttonIcon}>📸</Text>
              <Text style={styles.buttonText}>Scan Receipt</Text>
            </>
          )}
        </View>
      </TouchableOpacity>
      
      {lastImageUri && (
        <View style={styles.previewContainer}>
          <Text style={styles.previewLabel}>Last captured:</Text>
          <Image source={{ uri: lastImageUri }} style={styles.previewImage} />
        </View>
      )}
      
      <View style={styles.settingsRow}>
        <Text style={styles.helpText}>
          Tap to capture a receipt and automatically extract transaction details
        </Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowSettings(true)}
        >
          <Text style={styles.settingsButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>
      
      {showSettings && (
        <Modal
          visible={showSettings}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <OCRSettings onClose={() => setShowSettings(false)} />
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
  },
  captureButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    shadowColor: Colors.shadow.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  captureButtonDisabled: {
    backgroundColor: Colors.disabled,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  buttonIcon: {
    fontSize: 20,
  },
  buttonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  previewContainer: {
    marginTop: SPACING.sm,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: SPACING.xs,
  },
  previewImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  helpText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    flex: 1,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  settingsButton: {
    padding: SPACING.sm,
    borderRadius: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingsButtonText: {
    fontSize: 16,
  },
});

export default CameraCapture;