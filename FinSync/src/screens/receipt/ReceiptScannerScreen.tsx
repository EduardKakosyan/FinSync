import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { COLORS, SPACING, FONTS } from '@/constants';
import { ocrService } from '@/services/ocr';
import { receiptService } from '@/services/storage/ReceiptService';
import { transactionService } from '@/services/storage/TransactionService';
import { ReceiptStackParamList } from '@/types';
import { ReceiptExtractedDataPreview } from '@/components/receipt/ReceiptExtractedDataPreview';

type NavigationProp = StackNavigationProp<ReceiptStackParamList, 'ReceiptScanner'>;

const ReceiptScannerScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      setCapturedImage(photo.uri);
      await processReceipt(photo.uri);
    } catch (error) {
      Alert.alert('Error', 'Failed to take picture');
      console.error('Camera error:', error);
    }
  };

  const selectFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
        await processReceipt(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
      console.error('Gallery error:', error);
    }
  };

  const processReceipt = async (imageUri: string) => {
    setIsProcessing(true);
    try {
      // Process with OCR
      const result = await ocrService.extractTextFromImage(imageUri);
      
      if (result.success && result.data) {
        setOcrResult(result.data);
        
        // Save receipt
        const receipt = await receiptService.create({
          imageUri,
          ocrText: result.data.text,
          extractionConfidence: result.data.confidence,
          merchantName: result.data.extractedData.merchantName,
          amount: result.data.extractedData.amount || result.data.extractedData.total,
          date: result.data.extractedData.date || new Date(),
          items: result.data.extractedData.items,
          transactionId: undefined,
          createdAt: new Date(),
        });

        // Check if we should create a transaction automatically
        if (result.data.confidence > 0.85 && result.data.extractedData.total) {
          Alert.alert(
            'Create Transaction?',
            'Would you like to create a transaction from this receipt?',
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => navigateToReceiptDetails(receipt.id),
              },
              {
                text: 'Create',
                onPress: () => createTransactionFromReceipt(receipt),
              },
            ]
          );
        } else {
          navigateToReceiptDetails(receipt.id);
        }
      } else {
        Alert.alert('OCR Failed', result.error || 'Failed to extract text from receipt');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process receipt');
      console.error('OCR error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const createTransactionFromReceipt = async (receipt: any) => {
    try {
      const transaction = await transactionService.create({
        amount: receipt.amount || 0,
        date: receipt.date || new Date(),
        category: receipt.extractedData?.category || 'Shopping',
        description: receipt.merchantName || 'Receipt Transaction',
        type: 'expense',
        receiptId: receipt.id,
        accountId: 'default', // You might want to let user select account
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Update receipt with transaction ID
      await receiptService.linkToTransaction(receipt.id, transaction.id);

      navigation.navigate('ReceiptDetails', { receiptId: receipt.id });
    } catch (error) {
      Alert.alert('Error', 'Failed to create transaction');
      console.error('Transaction creation error:', error);
    }
  };

  const navigateToReceiptDetails = (receiptId: string) => {
    navigation.navigate('ReceiptDetails', { receiptId });
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setOcrResult(null);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Ionicons name="camera-off-outline" size={100} color={COLORS.TEXT_SECONDARY} />
          <Text style={styles.title}>Camera Permission Required</Text>
          <Text style={styles.subtitle}>
            Please grant camera permission to scan receipts
          </Text>
        </View>
      </View>
    );
  }

  if (capturedImage) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          
          {isProcessing ? (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color="white" />
              <Text style={styles.processingText}>Processing receipt...</Text>
            </View>
          ) : (
            ocrResult && (
              <ReceiptExtractedDataPreview
                merchantName={ocrResult.extractedData.merchantName}
                amount={ocrResult.extractedData.total || ocrResult.extractedData.amount}
                date={ocrResult.extractedData.date}
                items={ocrResult.extractedData.items}
                confidence={ocrResult.confidence}
                onRetake={retakePhoto}
              />
            )
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={CameraType.back}
        ratio="4:3"
      >
        <View style={styles.cameraOverlay}>
          <View style={styles.frameGuide}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          
          <Text style={styles.guideText}>Align receipt within frame</Text>
        </View>
      </Camera>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.galleryButton}
          onPress={selectFromGallery}
        >
          <Ionicons name="images" size={30} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.captureButton}
          onPress={takePicture}
        >
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>

        <View style={styles.placeholder} />
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
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameGuide: {
    width: '80%',
    aspectRatio: 3 / 4,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: 'white',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  guideText: {
    color: 'white',
    fontSize: 16,
    marginTop: SPACING.LG,
    fontFamily: FONTS.REGULAR,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: SPACING.XL,
    paddingHorizontal: SPACING.LG,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 50,
    height: 50,
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
  previewContainer: {
    flex: 1,
  },
  previewImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    resizeMode: 'contain',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: 'white',
    fontSize: 18,
    marginTop: SPACING.MD,
    fontFamily: FONTS.REGULAR,
  },
});

export default ReceiptScannerScreen;