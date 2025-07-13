import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import CameraCapture from '../../components/CameraCapture';
import { ocrService } from '../../services/ocr';

// Mock dependencies
jest.mock('expo-image-picker');
jest.mock('expo-file-system');
jest.mock('../../services/ocr');
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

const mockImagePicker = ImagePicker as jest.Mocked<typeof ImagePicker>;
const mockFileSystem = FileSystem as jest.Mocked<typeof FileSystem>;
const mockOcrService = ocrService as jest.Mocked<typeof ocrService>;

describe('CameraCapture', () => {
  const mockOnOCRResult = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockImagePicker.requestCameraPermissionsAsync.mockResolvedValue({
      status: 'granted',
      expires: 'never',
      granted: true,
      canAskAgain: true
    });
  });

  it('renders scan receipt button', () => {
    const { getByText } = render(
      <CameraCapture onOCRResult={mockOnOCRResult} />
    );

    expect(getByText('Scan Receipt')).toBeTruthy();
    expect(getByText('Tap to capture a receipt and automatically extract transaction details')).toBeTruthy();
  });

  it('shows image options when scan button is pressed', () => {
    const { getByText } = render(
      <CameraCapture onOCRResult={mockOnOCRResult} />
    );

    fireEvent.press(getByText('Scan Receipt'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Add Receipt',
      'Choose how to capture your receipt',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Take Photo' }),
        expect.objectContaining({ text: 'Choose from Gallery' }),
        expect.objectContaining({ text: 'Cancel' }),
      ])
    );
  });

  it('handles successful photo capture and OCR processing', async () => {
    const mockImageUri = 'file://mock-image.jpg';
    const mockBase64 = 'mock-base64-data';
    const mockOCRResult = {
      success: true,
      data: {
        amount: 15.99,
        description: 'Coffee purchase',
        category: 'dining'
      },
      confidence: 85
    };

    mockImagePicker.launchCameraAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: mockImageUri, width: 100, height: 100 }]
    });

    mockFileSystem.readAsStringAsync.mockResolvedValue(mockBase64);
    mockOcrService.extractTransactionData.mockResolvedValue(mockOCRResult);

    const { getByText } = render(
      <CameraCapture onOCRResult={mockOnOCRResult} />
    );

    fireEvent.press(getByText('Scan Receipt'));

    // Simulate pressing "Take Photo" option
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const takePhotoAction = alertCall[2].find((action: any) => action.text === 'Take Photo');
    
    await takePhotoAction.onPress();

    await waitFor(() => {
      expect(mockOnOCRResult).toHaveBeenCalledWith(mockOCRResult);
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Receipt Processed Successfully',
      'Transaction data extracted with 85% confidence.',
      [{ text: 'OK' }]
    );
  });

  it('handles gallery image selection', async () => {
    const mockImageUri = 'file://gallery-image.jpg';
    const mockBase64 = 'gallery-base64-data';
    const mockOCRResult = {
      success: true,
      data: { amount: 25.50 },
      confidence: 70
    };

    mockImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: mockImageUri, width: 200, height: 150 }]
    });

    mockFileSystem.readAsStringAsync.mockResolvedValue(mockBase64);
    mockOcrService.extractTransactionData.mockResolvedValue(mockOCRResult);

    const { getByText } = render(
      <CameraCapture onOCRResult={mockOnOCRResult} />
    );

    fireEvent.press(getByText('Scan Receipt'));

    // Simulate pressing "Choose from Gallery" option
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const galleryAction = alertCall[2].find((action: any) => action.text === 'Choose from Gallery');
    
    await galleryAction.onPress();

    await waitFor(() => {
      expect(mockOnOCRResult).toHaveBeenCalledWith(mockOCRResult);
    });
  });

  it('handles OCR processing failure', async () => {
    const mockImageUri = 'file://mock-image.jpg';
    const mockOCRResult = {
      success: false,
      error: 'Failed to process image'
    };

    mockImagePicker.launchCameraAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: mockImageUri, width: 100, height: 100 }]
    });

    mockFileSystem.readAsStringAsync.mockResolvedValue('mock-base64');
    mockOcrService.extractTransactionData.mockResolvedValue(mockOCRResult);

    const { getByText } = render(
      <CameraCapture onOCRResult={mockOnOCRResult} />
    );

    fireEvent.press(getByText('Scan Receipt'));

    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const takePhotoAction = alertCall[2].find((action: any) => action.text === 'Take Photo');
    
    await takePhotoAction.onPress();

    await waitFor(() => {
      expect(mockOnOCRResult).toHaveBeenCalledWith(mockOCRResult);
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Processing Failed',
      'Failed to process image',
      [{ text: 'OK' }]
    );
  });

  it('handles camera permission denial', async () => {
    mockImagePicker.requestCameraPermissionsAsync.mockResolvedValue({
      status: 'denied',
      expires: 'never',
      granted: false,
      canAskAgain: true
    });

    const { getByText } = render(
      <CameraCapture onOCRResult={mockOnOCRResult} />
    );

    fireEvent.press(getByText('Scan Receipt'));

    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const takePhotoAction = alertCall[2].find((action: any) => action.text === 'Take Photo');
    
    await takePhotoAction.onPress();

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Camera Permission Required',
        'Please enable camera access to capture receipts.',
        [{ text: 'OK' }]
      );
    });

    expect(mockImagePicker.launchCameraAsync).not.toHaveBeenCalled();
  });

  it('handles user canceling image capture', async () => {
    mockImagePicker.launchCameraAsync.mockResolvedValue({
      canceled: true,
      assets: []
    });

    const { getByText } = render(
      <CameraCapture onOCRResult={mockOnOCRResult} />
    );

    fireEvent.press(getByText('Scan Receipt'));

    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const takePhotoAction = alertCall[2].find((action: any) => action.text === 'Take Photo');
    
    await takePhotoAction.onPress();

    // Should not call OCR service if user cancels
    expect(mockOcrService.extractTransactionData).not.toHaveBeenCalled();
    expect(mockOnOCRResult).not.toHaveBeenCalled();
  });

  it('disables button when disabled prop is true', () => {
    const { getByText } = render(
      <CameraCapture onOCRResult={mockOnOCRResult} disabled={true} />
    );

    const button = getByText('Scan Receipt').parent?.parent;
    expect(button?.props.accessibilityState?.disabled).toBe(true);
  });

  it('shows processing state during OCR', async () => {
    const mockImageUri = 'file://mock-image.jpg';
    
    // Mock a long-running OCR process
    const mockOCRPromise = new Promise((resolve) => {
      setTimeout(() => resolve({
        success: true,
        data: { amount: 10.50 },
        confidence: 90
      }), 100);
    });

    mockImagePicker.launchCameraAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: mockImageUri, width: 100, height: 100 }]
    });

    mockFileSystem.readAsStringAsync.mockResolvedValue('mock-base64');
    mockOcrService.extractTransactionData.mockReturnValue(mockOCRPromise as any);

    const { getByText } = render(
      <CameraCapture onOCRResult={mockOnOCRResult} />
    );

    fireEvent.press(getByText('Scan Receipt'));

    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const takePhotoAction = alertCall[2].find((action: any) => action.text === 'Take Photo');
    
    await takePhotoAction.onPress();

    // Should show processing state
    await waitFor(() => {
      expect(getByText('Processing...')).toBeTruthy();
    });

    // Wait for OCR to complete
    await waitFor(() => {
      expect(getByText('Scan Receipt')).toBeTruthy();
    });
  });
});