// Floating action button for quick receipt capture
import React, { useState } from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Text,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';
import { cameraService } from '@/services/camera';

interface ReceiptCaptureButtonProps {
  onCaptureComplete?: (imageUri: string) => void;
  style?: any;
  size?: 'small' | 'medium' | 'large';
  showOptions?: boolean;
}

const ReceiptCaptureButton: React.FC<ReceiptCaptureButtonProps> = ({
  onCaptureComplete,
  style,
  size = 'large',
  showOptions = true,
}) => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

  const buttonSizes = {
    small: 48,
    medium: 56,
    large: 64,
  };

  const iconSizes = {
    small: 20,
    medium: 24,
    large: 28,
  };

  const buttonSize = buttonSizes[size];
  const iconSize = iconSizes[size];

  const handlePress = () => {
    // Add press animation
    Animated.sequence([
      Animated.timing(scaleAnim, { duration: 100, toValue: 0.95, useNativeDriver: true }),
      Animated.timing(scaleAnim, { duration: 100, toValue: 1, useNativeDriver: true }),
    ]).start();

    if (showOptions) {
      setShowActionSheet(true);
    } else {
      handleTakePhoto();
    }
  };

  const handleTakePhoto = async () => {
    try {
      setIsLoading(true);
      setShowActionSheet(false);

      // Check camera availability
      const isAvailable = await cameraService.isCameraAvailable();
      if (!isAvailable) {
        Alert.alert(
          'Camera Not Available',
          'Camera is not available on this device.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Capture image
      const result = await cameraService.captureImage({
        quality: 0.8,
        base64: false,
        exif: true,
      });

      if (result) {
        if (onCaptureComplete) {
          onCaptureComplete(result.uri);
        } else {
          // Navigate to receipt scanner with the captured image
          (navigation as any).navigate('ReceiptScanner', { 
            capturedImageUri: result.uri 
          });
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert(
        'Camera Error',
        'Unable to take photo. Please check camera permissions and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFromGallery = async () => {
    try {
      setIsLoading(true);
      setShowActionSheet(false);

      const result = await cameraService.selectFromGallery({
        quality: 0.8,
        base64: false,
        exif: true,
      });

      if (result) {
        if (onCaptureComplete) {
          onCaptureComplete(result.uri);
        } else {
          // Navigate to receipt scanner with the selected image
          (navigation as any).navigate('ReceiptScanner', { 
            capturedImageUri: result.uri 
          });
        }
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      Alert.alert(
        'Gallery Error',
        'Unable to select photo. Please check gallery permissions and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const ActionSheet = () => (
    <Modal
      visible={showActionSheet}
      transparent
      animationType="fade"
      onRequestClose={() => setShowActionSheet(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.actionSheet}>
          <Text style={styles.actionSheetTitle}>Add Receipt</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleTakePhoto}
            disabled={isLoading}
          >
            <Ionicons name="camera" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.actionButtonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSelectFromGallery}
            disabled={isLoading}
          >
            <Ionicons name="images" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.actionButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => setShowActionSheet(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
        <TouchableOpacity
          style={[
            styles.button,
            {
              width: buttonSize,
              height: buttonSize,
              borderRadius: buttonSize / 2,
            },
          ]}
          onPress={handlePress}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons
              name="camera"
              size={iconSize}
              color="white"
            />
          )}
        </TouchableOpacity>
      </Animated.View>

      <ActionSheet />
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: COLORS.BACKGROUND,
    borderTopLeftRadius: BORDER_RADIUS.LG,
    borderTopRightRadius: BORDER_RADIUS.LG,
    padding: SPACING.LG,
    paddingBottom: SPACING.XL,
  },
  actionSheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: SPACING.LG,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.SM,
    backgroundColor: COLORS.SURFACE,
  },
  actionButtonText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.MD,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    marginTop: SPACING.SM,
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
});

export default ReceiptCaptureButton;