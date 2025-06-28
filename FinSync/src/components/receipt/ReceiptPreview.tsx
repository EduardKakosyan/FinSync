// Receipt preview component for confirming captured images
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';
import { receiptStorageService } from '@/services/storage';
import { ocrService } from '@/services/ocr';
import { Receipt } from '@/types';

interface ReceiptPreviewProps {
  imageUri: string;
  onConfirm?: (receipt: Receipt) => void;
  onCancel?: () => void;
  onRetake?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({
  imageUri,
  onConfirm,
  onCancel,
  onRetake,
}) => {
  const navigation = useNavigation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Get image dimensions for proper display
    Image.getSize(
      imageUri,
      (width, height) => {
        const aspectRatio = width / height;
        const displayWidth = screenWidth - (SPACING.LG * 2);
        setImageSize({
          width: displayWidth,
          height: displayWidth / aspectRatio,
        });
      },
      (error) => {
        console.error('Error getting image size:', error);
        setImageError(true);
      }
    );
  }, [imageUri]);

  const handleConfirm = async () => {
    try {
      setIsProcessing(true);

      // Save image to storage
      const saveResult = await receiptStorageService.saveReceiptImage(imageUri);
      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Failed to save image');
      }

      // Process with OCR
      const ocrResult = await ocrService.extractTextFromImage(imageUri);
      
      const receipt: Receipt = {
        id: `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        imageUri: saveResult.data!,
        createdAt: new Date(),
        ocrText: ocrResult.success ? ocrResult.data?.text : undefined,
        extractionConfidence: ocrResult.success ? ocrResult.data?.confidence : undefined,
        merchantName: ocrResult.success ? ocrResult.data?.extractedData.merchantName : undefined,
        amount: ocrResult.success ? ocrResult.data?.extractedData.amount : undefined,
        date: ocrResult.success ? ocrResult.data?.extractedData.date : undefined,
        items: ocrResult.success ? ocrResult.data?.extractedData.items : undefined,
      };

      // Save receipt metadata
      const receiptSaveResult = await receiptStorageService.saveReceipt(receipt);
      if (!receiptSaveResult.success) {
        throw new Error(receiptSaveResult.error || 'Failed to save receipt');
      }

      if (onConfirm) {
        onConfirm(receipt);
      } else {
        // Navigate to receipt details
        (navigation as any).navigate('ReceiptDetails', {
          receiptId: receipt.id,
        });
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
      Alert.alert(
        'Processing Error',
        'Failed to process receipt. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigation.goBack();
    }
  };

  const handleRetake = () => {
    if (onRetake) {
      onRetake();
    } else {
      navigation.goBack();
    }
  };

  const handleRotate = () => {
    // TODO: Implement image rotation functionality
    Alert.alert(
      'Coming Soon',
      'Image rotation feature will be available in a future update.',
      [{ text: 'OK' }]
    );
  };

  if (imageError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="image-outline" size={64} color={COLORS.TEXT_SECONDARY} />
        <Text style={styles.errorTitle}>Image Not Found</Text>
        <Text style={styles.errorMessage}>
          The image could not be loaded. Please try taking another photo.
        </Text>
        <TouchableOpacity style={styles.errorButton} onPress={handleRetake}>
          <Text style={styles.errorButtonText}>Take Another Photo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
            <Ionicons name="close" size={24} color={COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Preview Receipt</Text>
          
          <TouchableOpacity style={styles.headerButton} onPress={handleRotate}>
            <Ionicons name="refresh-outline" size={24} color={COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
        </View>

        {/* Image Preview */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={[
              styles.image,
              imageSize.width > 0 && imageSize,
            ]}
            resizeMode="contain"
            onError={() => setImageError(true)}
          />
          
          {/* Image overlay for quality indicators */}
          <View style={styles.imageOverlay}>
            <View style={styles.qualityIndicator}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.SUCCESS} />
              <Text style={styles.qualityText}>Good Quality</Text>
            </View>
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Tips for Better Results</Text>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark" size={16} color={COLORS.SUCCESS} />
            <Text style={styles.tipText}>Ensure all text is clearly visible</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark" size={16} color={COLORS.SUCCESS} />
            <Text style={styles.tipText}>Receipt is flat and not wrinkled</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark" size={16} color={COLORS.SUCCESS} />
            <Text style={styles.tipText}>Good lighting without shadows</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleRetake}
          disabled={isProcessing}
        >
          <Ionicons name="camera" size={20} color={COLORS.PRIMARY} />
          <Text style={styles.secondaryButtonText}>Retake</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, isProcessing && styles.disabledButton]}
          onPress={handleConfirm}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.primaryButtonText}>Processing...</Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Process Receipt</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  imageContainer: {
    margin: SPACING.LG,
    borderRadius: BORDER_RADIUS.LG,
    backgroundColor: COLORS.SURFACE,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    minHeight: 200,
    backgroundColor: COLORS.LIGHT,
  },
  imageOverlay: {
    position: 'absolute',
    top: SPACING.MD,
    right: SPACING.MD,
  },
  qualityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
  },
  qualityText: {
    marginLeft: SPACING.XS,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.SUCCESS,
  },
  tipsContainer: {
    margin: SPACING.LG,
    padding: SPACING.MD,
    backgroundColor: COLORS.SURFACE,
    borderRadius: BORDER_RADIUS.MD,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },
  tipText: {
    marginLeft: SPACING.SM,
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  actions: {
    flexDirection: 'row',
    padding: SPACING.LG,
    backgroundColor: COLORS.BACKGROUND,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    gap: SPACING.MD,
  },
  primaryButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    gap: SPACING.SM,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.SURFACE,
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    gap: SPACING.SM,
  },
  secondaryButtonText: {
    color: COLORS.PRIMARY,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: COLORS.TEXT_SECONDARY,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
    padding: SPACING.LG,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.LG,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.MD,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginTop: SPACING.XL,
  },
  errorButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReceiptPreview;