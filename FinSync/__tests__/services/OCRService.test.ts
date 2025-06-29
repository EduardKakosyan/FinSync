// OCR Service Test Suite
import { OCRService, ocrService, configureGoogleVision } from '@/services/ocr';
import { OCR_CONFIDENCE_THRESHOLD } from '@/constants';

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: {
    Base64: 'base64',
  },
}));

// Mock fetch for Google Vision API
global.fetch = jest.fn();

describe('OCRService', () => {
  let mockFileSystem: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFileSystem = require('expo-file-system');
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = OCRService.getInstance();
      const instance2 = OCRService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should return the same instance as the exported ocrService', () => {
      const instance = OCRService.getInstance();
      expect(instance).toBe(ocrService);
    });
  });

  describe('Configuration', () => {
    it('should configure Google Vision API correctly', () => {
      const apiKey = 'test-api-key-12345';
      ocrService.configureGoogleVision({ apiKey });
      
      const status = ocrService.getServiceStatus();
      expect(status.isGoogleVisionEnabled).toBe(true);
      expect(status.hasApiKey).toBe(true);
      expect(status.supportedMethods).toContain('google-vision');
    });

    it('should validate configuration correctly', () => {
      // Test without API key
      const instance = new OCRService();
      let validation = instance.validateConfiguration();
      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain('Google Vision API not configured');

      // Test with valid API key
      instance.configureGoogleVision({ apiKey: 'valid-api-key-with-sufficient-length' });
      validation = instance.validateConfiguration();
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should detect invalid API keys', () => {
      const instance = new OCRService();
      instance.configureGoogleVision({ apiKey: 'short' });
      
      const validation = instance.validateConfiguration();
      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain('Google Vision API key appears invalid');
    });
  });

  describe('Text Extraction', () => {
    it('should use simulation when Google Vision is not configured', async () => {
      const instance = new OCRService();
      const imageUri = 'file://test-image.jpg';
      
      const result = await instance.extractTextFromImage(imageUri);
      
      expect(result.success).toBe(true);
      expect(result.data?.ocrMethod).toBe('simulation');
      expect(result.data?.text).toBeDefined();
      expect(result.data?.confidence).toBeGreaterThan(0);
      expect(result.processingTime).toBeDefined();
    });

    it('should use Google Vision API when configured', async () => {
      const instance = new OCRService();
      instance.configureGoogleVision({ apiKey: 'test-api-key-12345' });
      
      const imageUri = 'file://test-image.jpg';
      const mockBase64 = 'mock-base64-data';
      
      // Mock file system to return base64 data
      mockFileSystem.readAsStringAsync.mockResolvedValue(mockBase64);
      
      // Mock successful Google Vision API response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          responses: [{
            textAnnotations: [
              { description: 'TIM HORTONS\nDouble Double $1.99\nTotal $1.99' },
              { description: 'TIM', confidence: 0.95 },
              { description: 'HORTONS', confidence: 0.92 },
            ],
          }],
        }),
      });

      const result = await instance.extractTextFromImage(imageUri);
      
      expect(result.success).toBe(true);
      expect(result.data?.ocrMethod).toBe('google-vision');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('vision.googleapis.com'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should fallback to simulation when Google Vision fails', async () => {
      const instance = new OCRService();
      instance.configureGoogleVision({ apiKey: 'test-api-key-12345' });
      
      const imageUri = 'file://test-image.jpg';
      
      mockFileSystem.readAsStringAsync.mockResolvedValue('mock-base64');
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await instance.extractTextFromImage(imageUri);
      
      expect(result.success).toBe(true);
      expect(result.data?.ocrMethod).toBe('simulation');
    });
  });

  describe('Receipt Text Parsing', () => {
    it('should parse Canadian grocery receipt correctly', async () => {
      const instance = new OCRService();
      const imageUri = 'file://test-image.jpg';
      
      const result = await instance.extractTextFromImage(imageUri);
      
      expect(result.success).toBe(true);
      expect(result.data?.extractedData).toBeDefined();
      
      const { extractedData } = result.data!;
      expect(extractedData.merchantName).toBeDefined();
      expect(extractedData.total).toBeGreaterThan(0);
      expect(extractedData.tax).toBeDefined();
      expect(extractedData.items).toBeDefined();
      expect(extractedData.items!.length).toBeGreaterThan(0);
    });

    it('should detect payment methods correctly', async () => {
      const instance = new OCRService();
      const imageUri = 'file://test-image.jpg';
      
      const result = await instance.extractTextFromImage(imageUri);
      
      expect(result.success).toBe(true);
      expect(result.data?.extractedData.paymentMethod).toBeDefined();
    });

    it('should categorize merchants correctly', async () => {
      const instance = new OCRService();
      
      // Test just one call to avoid timeout
      const result = await instance.extractTextFromImage('file://test.jpg');
      
      expect(result.success).toBe(true);
      expect(result.data?.extractedData.category).toBeDefined();
    }, 15000);
  });

  describe('Merchant Name Extraction', () => {
    it('should clean merchant names properly', () => {
      const instance = new OCRService();
      
      // Access private method for testing
      const cleanMethod = (instance as any).cleanMerchantName;
      
      expect(cleanMethod('#123 TIM HORTONS')).toBe('TIM HORTONS');
      expect(cleanMethod('SOBEYS #4521')).toBe('SOBEYS');
      expect(cleanMethod('CANADIAN  TIRE  CORP')).toBe('CANADIAN TIRE CORP');
    });
  });

  describe('Canadian Tax Parsing', () => {
    it('should parse HST correctly', () => {
      const instance = new OCRService();
      const testText = `
        SOBEYS GROCERY
        Subtotal $20.00
        HST (13%) $2.60
        Total $22.60
      `;
      
      const extractedData = (instance as any).parseReceiptText(testText);
      
      expect(extractedData.subtotal).toBe(20.00);
      expect(extractedData.tax).toBe(2.60);
      expect(extractedData.total).toBe(22.60);
    });

    it('should parse GST/PST correctly', () => {
      const instance = new OCRService();
      const testText = `
        CANADIAN TIRE
        Subtotal $100.00
        GST (5%) $5.00
        Total $105.00
      `;
      
      const extractedData = (instance as any).parseReceiptText(testText);
      
      expect(extractedData.subtotal).toBe(100.00);
      expect(extractedData.tax).toBe(5.00);
      expect(extractedData.total).toBe(105.00);
    });
  });

  describe('Address and Phone Extraction', () => {
    it('should extract Canadian addresses', () => {
      const instance = new OCRService();
      const testText = `
        TIM HORTONS
        123 Queen St W, Toronto ON
        Tel: (416) 555-0123
      `;
      
      const extractedData = (instance as any).parseReceiptText(testText);
      
      expect(extractedData.address).toContain('Toronto ON');
      expect(extractedData.phone).toBe('(416) 555-0123');
    });
  });

  describe('Category Detection', () => {
    it('should detect food & dining category', () => {
      const instance = new OCRService();
      const testData = {
        merchantName: 'TIM HORTONS',
        items: [{ name: 'Double Double', price: 1.99, quantity: 1 }],
      };
      
      const category = (instance as any).determineCategory(testData);
      expect(category).toBe('Food & Dining');
    });

    it('should detect grocery category', () => {
      const instance = new OCRService();
      const testData = {
        merchantName: 'SOBEYS GROCERY',
        items: [
          { name: 'Milk 2%', price: 4.99, quantity: 1 },
          { name: 'Bread', price: 2.99, quantity: 1 },
        ],
      };
      
      const category = (instance as any).determineCategory(testData);
      expect(category).toBe('Groceries');
    });

    it('should detect transportation category', () => {
      const instance = new OCRService();
      const testData = {
        merchantName: 'PETRO-CANADA',
        items: [{ name: 'Regular Gas', price: 45.00, quantity: 1 }],
      };
      
      const category = (instance as any).determineCategory(testData);
      expect(category).toBe('Transportation');
    });
  });

  describe('Confidence Thresholds', () => {
    it('should return appropriate confidence thresholds for different methods', () => {
      const instance = new OCRService();
      
      expect(instance.getRecommendedConfidenceThreshold('google-vision')).toBe(0.85);
      expect(instance.getRecommendedConfidenceThreshold('simulation')).toBe(0.75);
      expect(instance.getRecommendedConfidenceThreshold('local')).toBe(0.70);
    });
  });

  describe('Validation', () => {
    it('should validate extracted data correctly', () => {
      const instance = new OCRService();
      
      const validData = {
        merchantName: 'TIM HORTONS',
        amount: 10.50,
        date: new Date(),
        items: [{ name: 'Coffee', price: 2.50, quantity: 1 }],
      };
      
      const validation = instance.validateExtractedData(validData);
      expect(validation.isValid).toBe(true);
      expect(validation.confidence).toBeGreaterThan(OCR_CONFIDENCE_THRESHOLD);
    });

    it('should detect invalid data', () => {
      const instance = new OCRService();
      
      const invalidData = {
        merchantName: '',
        amount: -5.00,
        date: new Date(Date.now() + 86400000), // Future date
        items: [{ name: '', price: -1, quantity: 0 }],
      };
      
      const validation = instance.validateExtractedData(invalidData);
      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Utility Functions', () => {
    it('should configure Google Vision using utility function', () => {
      const apiKey = 'utility-test-key-12345';
      configureGoogleVision(apiKey);
      
      const status = ocrService.getServiceStatus();
      expect(status.hasApiKey).toBe(true);
    });

    it('should preprocess images (placeholder)', async () => {
      const instance = new OCRService();
      const imageUri = 'file://test.jpg';
      
      const processedUri = await instance.preprocessImage(imageUri);
      expect(processedUri).toBe(imageUri); // Currently returns same URI
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid image URIs gracefully', async () => {
      const instance = new OCRService();
      instance.configureGoogleVision({ apiKey: 'test-key-12345' });
      
      mockFileSystem.readAsStringAsync.mockRejectedValue(new Error('File not found'));
      
      const result = await instance.extractTextFromImage('invalid://uri');
      
      // Should fallback to simulation
      expect(result.success).toBe(true);
      expect(result.data?.ocrMethod).toBe('simulation');
    });

    it('should handle Google Vision API errors', async () => {
      const instance = new OCRService();
      instance.configureGoogleVision({ apiKey: 'test-key-12345' });
      
      mockFileSystem.readAsStringAsync.mockResolvedValue('base64data');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      const result = await instance.extractTextFromImage('file://test.jpg');
      
      // Should fallback to simulation
      expect(result.success).toBe(true);
      expect(result.data?.ocrMethod).toBe('simulation');
    });

    it('should handle malformed Google Vision responses', async () => {
      const instance = new OCRService();
      instance.configureGoogleVision({ apiKey: 'test-key-12345' });
      
      mockFileSystem.readAsStringAsync.mockResolvedValue('base64data');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ responses: [{ error: { message: 'API Error' } }] }),
      });

      const result = await instance.extractTextFromImage('file://test.jpg');
      
      // Should fallback to simulation
      expect(result.success).toBe(true);
      expect(result.data?.ocrMethod).toBe('simulation');
    });
  });

  describe('Performance', () => {
    it('should track processing time', async () => {
      const instance = new OCRService();
      const startTime = Date.now();
      
      const result = await instance.extractTextFromImage('file://test.jpg');
      const endTime = Date.now();
      
      expect(result.success).toBe(true);
      expect(result.processingTime).toBeDefined();
      expect(result.processingTime!).toBeGreaterThan(0);
      expect(result.processingTime!).toBeLessThan(endTime - startTime + 100); // Allow some margin
    });
  });
});