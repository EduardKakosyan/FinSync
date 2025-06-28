// Full-screen camera interface for receipt capture
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Animated,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';
import { cameraService } from '@/services/camera';

interface CameraScreenProps {
  onCapture?: (imageUri: string) => void;
  onCancel?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CameraScreen: React.FC<CameraScreenProps> = ({ onCapture, onCancel }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('auto');
  const [facing, setFacing] = useState<CameraType>('back');
  const [focusAnimation] = useState(new Animated.Value(0));
  const [guidelineOpacity] = useState(new Animated.Value(0.7));

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
    startGuidelineAnimation();
  }, [permission]);

  const handlePermissionRequest = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Camera Permission Required',
          'This app needs camera access to scan receipts. Please enable camera permissions in your device settings.',
          [
            { text: 'Cancel', onPress: handleCancel },
            { text: 'Settings', onPress: () => {/* Open settings */ } },
          ]
        );
      }
    }
  };

  const startGuidelineAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(guidelineOpacity, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(guidelineOpacity, {
          toValue: 0.7,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);

      // Show focus animation
      Animated.sequence([
        Animated.timing(focusAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(focusAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: true,
        skipProcessing: false,
      });

      if (photo) {
        if (onCapture) {
          onCapture(photo.uri);
        } else {
          // Navigate to preview screen
          (navigation as any).navigate('ReceiptPreview', {
            imageUri: photo.uri,
          });
        }
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert(
        'Capture Error',
        'Failed to capture photo. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCapturing(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigation.goBack();
    }
  };

  const toggleFlash = () => {
    const modes: ('off' | 'on' | 'auto')[] = ['off', 'on', 'auto'];
    const currentIndex = modes.indexOf(flashMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setFlashMode(modes[nextIndex]);
  };

  const getFlashIcon = () => {
    switch (flashMode) {
      case 'on':
        return 'flash';
      case 'off':
        return 'flash-off';
      case 'auto':
        return 'flash-outline';
      default:
        return 'flash-outline';
    }
  };


  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color={COLORS.TEXT_SECONDARY} />
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionMessage}>
          Please enable camera access to scan receipts
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={handlePermissionRequest}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flashMode}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Scan Receipt</Text>
          
          <TouchableOpacity style={styles.headerButton} onPress={toggleFlash}>
            <Ionicons name={getFlashIcon()} size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Receipt Guidelines */}
        <View style={styles.guidelineContainer}>
          <Animated.View 
            style={[
              styles.guideline,
              { opacity: guidelineOpacity }
            ]}
          >
            <View style={styles.guidelineCorner} />
            <View style={[styles.guidelineCorner, styles.topRight]} />
            <View style={[styles.guidelineCorner, styles.bottomLeft]} />
            <View style={[styles.guidelineCorner, styles.bottomRight]} />
          </Animated.View>
          
          <Text style={styles.guidelineText}>
            Position receipt within the frame
          </Text>
        </View>

        {/* Focus Animation */}
        <Animated.View
          style={[
            styles.focusIndicator,
            {
              opacity: focusAnimation,
              transform: [
                {
                  scale: focusAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1.2, 0.8],
                  }),
                },
              ],
            },
          ]}
        />

        {/* Bottom Controls */}
        <View style={styles.controls}>
          <View style={styles.controlsRow}>
            {/* Gallery Button */}
            <TouchableOpacity
              style={styles.galleryButton}
              onPress={() => {
                // Handle gallery selection
                cameraService.selectFromGallery().then(result => {
                  if (result && onCapture) {
                    onCapture(result.uri);
                  }
                });
              }}
            >
              <Ionicons name="images" size={24} color="white" />
            </TouchableOpacity>

            {/* Capture Button */}
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleCapture}
              disabled={isCapturing}
            >
              <View style={styles.captureButtonInner}>
                {isCapturing ? (
                  <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                ) : (
                  <View style={styles.captureButtonDot} />
                )}
              </View>
            </TouchableOpacity>

            {/* Tips Button */}
            <TouchableOpacity
              style={styles.tipsButton}
              onPress={() => {
                Alert.alert(
                  'Scanning Tips',
                  '• Ensure good lighting\n• Keep receipt flat\n• Align receipt within guidelines\n• Avoid shadows and glare\n• Make sure text is readable',
                  [{ text: 'Got it' }]
                );
              }}
            >
              <Ionicons name="help-circle" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingText: {
    marginTop: SPACING.MD,
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
    padding: SPACING.LG,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.LG,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.MD,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginTop: SPACING.XL,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: SPACING.LG,
    paddingBottom: SPACING.MD,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  guidelineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.XL,
  },
  guideline: {
    width: screenWidth * 0.8,
    height: screenHeight * 0.4,
    position: 'relative',
  },
  guidelineCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: 'white',
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    left: 'auto',
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    top: 'auto',
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  guidelineText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: SPACING.LG,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.MD,
  },
  focusIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 100,
    height: 100,
    marginTop: -50,
    marginLeft: -50,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 50,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    paddingHorizontal: SPACING.LG,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.PRIMARY,
  },
  captureButtonDot: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.PRIMARY,
  },
  tipsButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CameraScreen;