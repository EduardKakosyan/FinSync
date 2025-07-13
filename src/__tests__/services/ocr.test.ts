import { OCRService } from '../../services/ocr';

// Mock fetch globally
global.fetch = jest.fn();

describe('OCRService', () => {
  let ocrService: OCRService;
  
  beforeEach(() => {
    ocrService = new OCRService({
      baseURL: 'http://localhost:1234',
      apiKey: 'test-key',
      model: 'nanonets/Nanonets-OCR-s',
      timeout: 5000
    });
    jest.clearAllMocks();
  });

  describe('extractTransactionData', () => {
    it('should successfully extract transaction data from valid OCR response', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              amount: 15.99,
              date: '2025-01-13',
              description: 'Coffee Shop Purchase',
              category: 'dining',
              merchant: 'Starbucks'
            })
          }
        }]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await ocrService.extractTransactionData('fake-base64-image');

      expect(result.success).toBe(true);
      expect(result.data?.amount).toBe(15.99);
      expect(result.data?.date).toBe('2025-01-13');
      expect(result.data?.description).toBe('Coffee Shop Purchase');
      expect(result.data?.category).toBe('dining');
      expect(result.data?.merchant).toBe('Starbucks');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle API errors gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await ocrService.extractTransactionData('fake-base64-image');

      expect(result.success).toBe(false);
      expect(result.error).toContain('OCR API error: 500');
    });

    it('should handle network errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await ocrService.extractTransactionData('fake-base64-image');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should handle invalid JSON response', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Invalid JSON content'
          }
        }]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await ocrService.extractTransactionData('fake-base64-image');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });
  });

  describe('parseAmount', () => {
    it('should parse valid numeric amounts', () => {
      const service = new OCRService();
      // Access private method through any type for testing
      const parseAmount = (service as any).parseAmount.bind(service);

      expect(parseAmount(15.99)).toBe(15.99);
      expect(parseAmount('15.99')).toBe(15.99);
      expect(parseAmount('$15.99')).toBe(15.99);
      expect(parseAmount('CAD 15.99')).toBe(15.99);
    });

    it('should return undefined for invalid amounts', () => {
      const service = new OCRService();
      const parseAmount = (service as any).parseAmount.bind(service);

      expect(parseAmount(-5)).toBeUndefined();
      expect(parseAmount(0)).toBeUndefined();
      expect(parseAmount('invalid')).toBeUndefined();
      expect(parseAmount(null)).toBeUndefined();
    });
  });

  describe('parseCategory', () => {
    it('should map valid categories correctly', () => {
      const service = new OCRService();
      const parseCategory = (service as any).parseCategory.bind(service);

      expect(parseCategory('groceries')).toBe('groceries');
      expect(parseCategory('food')).toBe('groceries');
      expect(parseCategory('restaurant')).toBe('dining');
      expect(parseCategory('fuel')).toBe('gas');
      expect(parseCategory('medical')).toBe('health');
    });

    it('should default to "other" for invalid categories', () => {
      const service = new OCRService();
      const parseCategory = (service as any).parseCategory.bind(service);

      expect(parseCategory('invalid-category')).toBe('other');
      expect(parseCategory('')).toBe('other');
      expect(parseCategory(null)).toBe('other');
    });
  });

  describe('calculateConfidence', () => {
    it('should calculate confidence based on available data', () => {
      const service = new OCRService();
      const calculateConfidence = (service as any).calculateConfidence.bind(service);

      // Perfect data
      const perfectData = {
        amount: 15.99,
        date: '2025-01-13',
        description: 'Test',
        category: 'dining'
      };
      expect(calculateConfidence(perfectData)).toBe(100);

      // Missing some data
      const partialData = {
        amount: 15.99,
        date: '2025-01-13'
      };
      expect(calculateConfidence(partialData)).toBe(65); // 40 + 25

      // No data
      expect(calculateConfidence({})).toBe(0);
      expect(calculateConfidence(null)).toBe(0);
    });
  });

  describe('testConnection', () => {
    it('should return success when OCR model is available', async () => {
      const mockModelsResponse = {
        data: [
          { id: 'nanonets/Nanonets-OCR-s' },
          { id: 'other-model' }
        ]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockModelsResponse
      });

      const result = await ocrService.testConnection();

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error when OCR model is not available', async () => {
      const mockModelsResponse = {
        data: [
          { id: 'other-model' }
        ]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockModelsResponse
      });

      const result = await ocrService.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toContain('OCR model not found');
    });

    it('should return error when LM Studio is not accessible', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Connection refused'));

      const result = await ocrService.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot connect to LM Studio');
    });
  });

  describe('updateConfig', () => {
    it('should update configuration correctly', () => {
      const initialConfig = {
        baseURL: 'http://localhost:1234',
        apiKey: 'initial-key',
        model: 'initial-model',
        timeout: 30000
      };

      const service = new OCRService(initialConfig);
      
      service.updateConfig({
        baseURL: 'http://localhost:5678',
        apiKey: 'new-key'
      });

      // Access private config through any type for testing
      const config = (service as any).config;
      expect(config.baseURL).toBe('http://localhost:5678');
      expect(config.apiKey).toBe('new-key');
      expect(config.model).toBe('initial-model'); // Should remain unchanged
      expect(config.timeout).toBe(30000); // Should remain unchanged
    });
  });
});