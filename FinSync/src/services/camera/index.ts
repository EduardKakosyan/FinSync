// Camera service for receipt capture functionality
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Alert, Platform, Linking } from 'react-native';

export interface CameraPermissions {
  camera: boolean;
  mediaLibrary: boolean;
}

export interface CaptureOptions {
  quality?: number;
  base64?: boolean;
  exif?: boolean;
  skipProcessing?: boolean;
}

export interface CapturedImage {
  uri: string;
  width: number;
  height: number;
  base64?: string;
  exif?: any;
}

export class CameraService {
  private static instance: CameraService;

  public static getInstance(): CameraService {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
  }

  /**
   * Request camera permissions with enhanced error handling
   */
  async requestCameraPermissions(): Promise<boolean> {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      
      if (status === 'granted') {
        return true;
      }
      
      // Enhanced error handling for iPhone 13 Pro users
      if (Platform.OS === 'ios' && status === 'denied') {
        Alert.alert(
          'Camera Permission Required',
          'iPhone 13 Pro users: Camera access is required for receipt scanning. Please enable in Settings.',
          [
            { text: 'Cancel' },
            { text: 'Settings', onPress: () => Linking.openSettings() },
            { text: 'Camera Tips', onPress: this.showIPhone13ProTips }
          ]
        );
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      
      // Enhanced error logging for iPhone 13 Pro
      if (Platform.OS === 'ios') {
        console.warn('iPhone 13 Pro camera permission error:', error);
      }
      
      return false;
    }
  }

  /**
   * Request media library permissions
   */
  async requestMediaLibraryPermissions(): Promise<boolean> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting media library permissions:', error);
      return false;
    }
  }

  /**
   * Check camera permissions status
   */
  async getCameraPermissionStatus(): Promise<boolean> {
    try {
      const { status } = await Camera.getCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking camera permissions:', error);
      return false;
    }
  }

  /**
   * Check media library permissions status
   */
  async getMediaLibraryPermissionStatus(): Promise<boolean> {
    try {
      const { status } = await MediaLibrary.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking media library permissions:', error);
      return false;
    }
  }

  /**
   * Get all camera permissions status
   */
  async getAllPermissions(): Promise<CameraPermissions> {
    const [camera, mediaLibrary] = await Promise.all([
      this.getCameraPermissionStatus(),
      this.getMediaLibraryPermissionStatus(),
    ]);

    return { camera, mediaLibrary };
  }

  /**
   * Request all necessary permissions with user-friendly prompts
   */
  async requestAllPermissions(): Promise<CameraPermissions> {
    // Request camera permission
    const cameraGranted = await this.requestCameraPermissions();
    if (!cameraGranted) {
      Alert.alert(
        'Camera Permission Required',
        'Please allow camera access to scan receipts. You can enable this in Settings.',
        [{ text: 'OK' }]
      );
    }

    // Request media library permission
    const mediaLibraryGranted = await this.requestMediaLibraryPermissions();
    if (!mediaLibraryGranted) {
      Alert.alert(
        'Photo Library Permission Required',
        'Please allow photo library access to save and retrieve receipts. You can enable this in Settings.',
        [{ text: 'OK' }]
      );
    }

    return {
      camera: cameraGranted,
      mediaLibrary: mediaLibraryGranted,
    };
  }

  /**
   * Show iPhone 13 Pro specific tips
   */
  private showIPhone13ProTips = () => {
    if (Platform.OS === 'ios') {
      Alert.alert(
        'iPhone 13 Pro Camera Tips',
        '• Keep subjects at least 16-19cm away from camera\n• Use good lighting for better focus\n• Tap to focus on specific areas\n• Clean your camera lens\n• Try portrait mode for better depth detection\n• If focus issues persist, restart the app',
        [{ text: 'Got it' }]
      );
    }
  };

  /**
   * Capture image from camera with iPhone 13 Pro optimizations
   */
  async captureImage(options: CaptureOptions = {}): Promise<CapturedImage | null> {
    try {
      const permissions = await this.getAllPermissions();
      if (!permissions.camera) {
        const granted = await this.requestCameraPermissions();
        if (!granted) {
          throw new Error('Camera permission not granted');
        }
      }

      // For iOS, we need to make sure the camera is available
      if (Platform.OS === 'ios') {
        const isAvailable = await this.isCameraAvailable();
        if (!isAvailable) {
          throw new Error('Camera not available on this device');
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: options.quality || 0.8,
        base64: options.base64 || false,
        exif: options.exif || false,
        // Enhanced iOS-specific options for iPhone 13 Pro
        ...(Platform.OS === 'ios' && {
          allowsMultipleSelection: false,
          presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
          // Additional optimizations for iPhone 13 Pro
          preferredAssetRepresentationMode: ImagePicker.AssetRepresentationMode.COMPATIBLE,
        }),
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      
      // Enhanced validation for iPhone 13 Pro
      if (Platform.OS === 'ios' && (!asset.width || !asset.height)) {
        console.warn('iPhone 13 Pro: Image dimensions missing, may indicate capture issue');
      }
      
      return {
        uri: asset.uri,
        width: asset.width || 0,
        height: asset.height || 0,
        base64: asset.base64,
        exif: asset.exif,
      };
    } catch (error) {
      console.error('Error capturing image:', error);
      
      // Enhanced error handling for iPhone 13 Pro
      if (Platform.OS === 'ios') {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes('focus') || errorMessage.includes('blur')) {
          Alert.alert(
            'Camera Focus Issue',
            'iPhone 13 Pro users: Try moving your subject further away (16-19cm minimum) or ensure better lighting.',
            [
              { text: 'OK' },
              { text: 'Camera Tips', onPress: this.showIPhone13ProTips }
            ]
          );
        } else if (errorMessage.includes('permission')) {
          Alert.alert(
            'Camera Permission Issue',
            'Please enable camera permissions in Settings > FinSync > Camera',
            [
              { text: 'Cancel' },
              { text: 'Settings', onPress: () => Linking.openSettings() }
            ]
          );
        }
      }
      
      throw error;
    }
  }

  /**
   * Select image from gallery
   */
  async selectFromGallery(options: CaptureOptions = {}): Promise<CapturedImage | null> {
    try {
      const permissions = await this.getAllPermissions();
      if (!permissions.mediaLibrary) {
        const granted = await this.requestMediaLibraryPermissions();
        if (!granted) {
          throw new Error('Media library permission not granted');
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: options.quality || 0.8,
        base64: options.base64 || false,
        exif: options.exif || false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        width: asset.width || 0,
        height: asset.height || 0,
        base64: asset.base64,
        exif: asset.exif,
      };
    } catch (error) {
      console.error('Error selecting image from gallery:', error);
      throw error;
    }
  }

  /**
   * Save image to media library
   */
  async saveToGallery(uri: string): Promise<boolean> {
    try {
      const permissions = await this.getAllPermissions();
      if (!permissions.mediaLibrary) {
        const granted = await this.requestMediaLibraryPermissions();
        if (!granted) {
          throw new Error('Media library permission not granted');
        }
      }

      await MediaLibrary.saveToLibraryAsync(uri);
      return true;
    } catch (error) {
      console.error('Error saving image to gallery:', error);
      return false;
    }
  }

  /**
   * Check if camera is available
   */
  async isCameraAvailable(): Promise<boolean> {
    try {
      const isAvailable = await Camera.isAvailableAsync();
      return isAvailable;
    } catch (error) {
      console.error('Error checking camera availability:', error);
      return false;
    }
  }
}

// Export singleton instance
export const cameraService = CameraService.getInstance();