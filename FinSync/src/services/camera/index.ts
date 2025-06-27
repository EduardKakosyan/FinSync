// Camera service for receipt capture functionality
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Alert } from 'react-native';

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
   * Request camera permissions
   */
  async requestCameraPermissions(): Promise<boolean> {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
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
   * Capture image from camera
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

      const result = await ImagePicker.launchCameraAsync({
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
      console.error('Error capturing image:', error);
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