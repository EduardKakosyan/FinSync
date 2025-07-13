import { debugLogger } from '../utils/debugLogger';
import { DEFAULT_NETWORK_CONFIG, getBestOCREndpoint, detectAvailableEndpoints, NetworkOCRConfig } from '../config/ocr';
import { ocrMonitor } from '../utils/ocrMonitor';

/**
 * OCR Service for processing receipt images using nanonets-ocr on LM Studio
 * 
 * This service communicates with a local LM Studio instance running nanonets-ocr
 * to extract transaction data from receipt images.
 */

export interface OCRConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  timeout: number;
}

export interface OCRResult {
  success: boolean;
  data?: {
    amount?: number;
    date?: string;
    description?: string;
    category?: string;
    merchant?: string;
  };
  error?: string;
  confidence?: number;
}

const DEFAULT_CONFIG: OCRConfig = {
  baseURL: 'http://localhost:11434', // Will be auto-detected (Ollama default)
  apiKey: '', // Ollama doesn't require API key
  model: 'benhaotang/Nanonets-OCR-s:latest',
  timeout: 30000
};

class OCRService {
  private config: OCRConfig;
  private networkConfig: NetworkOCRConfig;
  private detectedEndpoint: string | null = null;
  private lastDetectionTime: number = 0;
  private detectionCacheTime: number = 60000; // 1 minute cache

  constructor(config: Partial<OCRConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.networkConfig = DEFAULT_NETWORK_CONFIG;
  }

  /**
   * Ensure we have a valid OCR endpoint
   */
  private async ensureValidEndpoint(): Promise<string> {
    const now = Date.now();
    
    // Use cached endpoint if recent and valid
    if (this.detectedEndpoint && (now - this.lastDetectionTime) < this.detectionCacheTime) {
      return this.detectedEndpoint;
    }
    
    debugLogger.log('Detecting OCR endpoint...', { 
      lastDetection: this.lastDetectionTime,
      cached: this.detectedEndpoint 
    });
    
    // Auto-detect best available endpoint
    const bestEndpoint = await getBestOCREndpoint(this.networkConfig);
    
    if (bestEndpoint) {
      this.detectedEndpoint = bestEndpoint;
      this.lastDetectionTime = now;
      this.config.baseURL = bestEndpoint;
      debugLogger.log('OCR endpoint detected', { endpoint: bestEndpoint });
      return bestEndpoint;
    }
    
    // Fallback to configured baseURL
    debugLogger.log('Using fallback endpoint', { endpoint: this.config.baseURL });
    return this.config.baseURL;
  }

  /**
   * Extract transaction data from a base64 encoded image
   */
  async extractTransactionData(imageBase64: string): Promise<OCRResult> {
    // Start monitoring
    ocrMonitor.startMonitoring(imageBase64.length);
    
    try {
      debugLogger.log('OCR extraction started', { 
        imageSize: imageBase64.length,
        model: this.config.model 
      });

      // Ensure we have a valid endpoint
      ocrMonitor.updateStage('connecting', 'Detecting OCR endpoint...');
      await this.ensureValidEndpoint();

      // Make API call with monitoring
      ocrMonitor.updateStage('sending', 'Sending image to Ollama...');
      const startTime = Date.now();
      const response = await this.callOCRAPI(imageBase64);
      const responseTime = Date.now() - startTime;
      
      // Log network response
      ocrMonitor.logNetworkResponse(response, responseTime);
      
      if (!response.ok) {
        ocrMonitor.updateStage('error', `OCR API error: ${response.status} ${response.statusText}`, {
          status: response.status,
          statusText: response.statusText
        });
        throw new Error(`OCR API error: ${response.status} ${response.statusText}`);
      }

      ocrMonitor.updateStage('receiving', 'Processing Ollama response...');
      const result = await response.json();
      debugLogger.log('OCR API response received', { success: true });

      // Validate Ollama response format
      const responseValidation = ocrMonitor.validateOllamaResponse(result);
      if (!responseValidation.isValid) {
        ocrMonitor.addEvent('warning', 'Response format issues detected', {
          issues: responseValidation.issues
        });
      }

      // Parse the OCR result
      ocrMonitor.updateStage('parsing', 'Extracting transaction data...');
      const extractedData = this.parseOCRResponse(result);
      
      ocrMonitor.updateStage('complete', 'OCR processing completed successfully');
      
      return {
        success: true,
        data: extractedData,
        confidence: this.calculateConfidence(extractedData)
      };

    } catch (error) {
      ocrMonitor.updateStage('error', `OCR extraction failed: ${error.message}`, {
        errorType: error.name,
        stack: error.stack?.substring(0, 500)
      });
      
      debugLogger.error('OCR extraction failed', error);
      debugLogger.error('OCR Troubleshooting Report', ocrMonitor.generateTroubleshootingReport());
      
      return {
        success: false,
        error: error.message || 'Unknown OCR error'
      };
    }
  }

  /**
   * Make API call to Ollama nanonets-ocr endpoint
   */
  private async callOCRAPI(imageBase64: string): Promise<Response> {
    const url = `${this.config.baseURL}/api/chat`;
    
    const systemPrompt = `You are an expert receipt OCR system. Extract transaction information from receipt images and return ONLY a valid JSON object with the following structure:
{
  "amount": number,
  "date": "YYYY-MM-DD",
  "description": "brief description",
  "category": "category name",
  "merchant": "merchant name"
}

Rules:
- Amount should be the total amount paid (positive number)
- Date should be in YYYY-MM-DD format
- Category should be one of: groceries, gas, bills, entertainment, dining, shopping, health, other
- Return ONLY the JSON object, no other text
- If any field cannot be determined, use null`;

    const payload = {
      model: this.config.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: 'Extract transaction details from this receipt image',
          images: [imageBase64.startsWith('data:') ? imageBase64.split(',')[1] : imageBase64]
        }
      ],
      stream: false,
      options: {
        temperature: 0.1,
        num_predict: 500
      }
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Only add authorization header if API key is provided
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    // Log network request details
    ocrMonitor.logNetworkRequest(url, payload);

    return fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
  }

  /**
   * Parse the Ollama OCR API response and extract transaction data
   */
  private parseOCRResponse(response: any): OCRResult['data'] {
    try {
      // Handle both Ollama and OpenAI-compatible response formats
      let content: string;
      
      if (response.message && response.message.content) {
        // Ollama format
        content = response.message.content.trim();
        ocrMonitor.addEvent('info', 'Using Ollama response format', { 
          hasRole: !!response.message.role,
          contentLength: content.length 
        });
      } else if (response.choices && response.choices[0] && response.choices[0].message) {
        // OpenAI-compatible format
        content = response.choices[0].message.content.trim();
        ocrMonitor.addEvent('info', 'Using OpenAI-compatible response format', { 
          choicesCount: response.choices.length,
          contentLength: content.length 
        });
      } else {
        throw new Error('Invalid OCR response format - missing both message.content and choices[0].message.content');
      }

      debugLogger.log('OCR response content', { content });

      // Validate and extract JSON using the monitor
      const jsonValidation = ocrMonitor.validateJSONExtraction(content);
      
      if (!jsonValidation.isValid) {
        ocrMonitor.addEvent('error', 'JSON extraction failed', {
          issues: jsonValidation.issues,
          rawContent: content.substring(0, 500)
        });
        throw new Error(`JSON parsing failed: ${jsonValidation.issues.join(', ')}`);
      }

      const parsedData = jsonValidation.extractedJSON;
      ocrMonitor.addEvent('success', 'Successfully parsed JSON from response', {
        extractedFields: Object.keys(parsedData),
        fieldCount: Object.keys(parsedData).length
      });

      // Validate and clean the parsed data
      const cleanedData = {
        amount: this.parseAmount(parsedData.amount),
        date: this.parseDate(parsedData.date),
        description: this.parseString(parsedData.description),
        category: this.parseCategory(parsedData.category),
        merchant: this.parseString(parsedData.merchant)
      };

      // Log field validation results
      const validFields = Object.entries(cleanedData).filter(([_, value]) => value !== undefined);
      ocrMonitor.addEvent('info', 'Field validation completed', {
        validFields: validFields.length,
        totalFields: Object.keys(cleanedData).length,
        validFieldNames: validFields.map(([key]) => key)
      });

      return cleanedData;

    } catch (error) {
      ocrMonitor.addEvent('error', 'Response parsing failed', {
        errorMessage: error.message,
        responseKeys: response ? Object.keys(response) : 'null response'
      });
      debugLogger.error('Failed to parse OCR response', error);
      return {};
    }
  }

  /**
   * Parse and validate amount
   */
  private parseAmount(value: any): number | undefined {
    if (typeof value === 'number' && value > 0) {
      return Math.round(value * 100) / 100; // Round to 2 decimal places
    }
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^\d.]/g, '');
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed) && parsed > 0) {
        return Math.round(parsed * 100) / 100;
      }
    }
    return undefined;
  }

  /**
   * Parse and validate date
   */
  private parseDate(value: any): string | undefined {
    if (typeof value === 'string') {
      // Try to parse the date and format as YYYY-MM-DD
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    return undefined;
  }

  /**
   * Parse and validate string fields
   */
  private parseString(value: any): string | undefined {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
    return undefined;
  }

  /**
   * Parse and validate category
   */
  private parseCategory(value: any): string | undefined {
    const validCategories = [
      'groceries', 'gas', 'bills', 'entertainment', 
      'dining', 'shopping', 'health', 'other'
    ];
    
    if (typeof value === 'string') {
      const normalized = value.toLowerCase().trim();
      if (validCategories.includes(normalized)) {
        return normalized;
      }
      
      // Try to map common variations
      const categoryMappings: Record<string, string> = {
        'food': 'groceries',
        'restaurant': 'dining',
        'fuel': 'gas',
        'gasoline': 'gas',
        'grocery': 'groceries',
        'supermarket': 'groceries',
        'utilities': 'bills',
        'medical': 'health',
        'healthcare': 'health',
        'retail': 'shopping'
      };
      
      if (categoryMappings[normalized]) {
        return categoryMappings[normalized];
      }
    }
    
    return 'other'; // Default fallback
  }

  /**
   * Calculate confidence score based on extracted data
   */
  private calculateConfidence(data: OCRResult['data']): number {
    if (!data) return 0;
    
    let score = 0;
    let maxScore = 0;
    
    // Amount is most important
    maxScore += 40;
    if (data.amount && data.amount > 0) {
      score += 40;
    }
    
    // Date is important
    maxScore += 25;
    if (data.date) {
      score += 25;
    }
    
    // Description/merchant
    maxScore += 20;
    if (data.description || data.merchant) {
      score += 20;
    }
    
    // Category
    maxScore += 15;
    if (data.category && data.category !== 'other') {
      score += 15;
    } else if (data.category === 'other') {
      score += 5;
    }
    
    return Math.round((score / maxScore) * 100);
  }

  /**
   * Test OCR service connectivity with auto-detection
   */
  async testConnection(): Promise<{ success: boolean; error?: string; endpoint?: string; availableEndpoints?: string[] }> {
    try {
      debugLogger.log('Testing OCR connection...');
      
      // Detect all available endpoints
      const availableEndpoints = await detectAvailableEndpoints(this.networkConfig);
      
      if (availableEndpoints.length === 0) {
        return {
          success: false,
          error: 'No OCR endpoints found. Please ensure LM Studio is running with nanonets-ocr model.',
          availableEndpoints: []
        };
      }
      
      // Use the best available endpoint
      const bestEndpoint = availableEndpoints[0];
      this.detectedEndpoint = bestEndpoint;
      this.config.baseURL = bestEndpoint;
      this.lastDetectionTime = Date.now();
      
      debugLogger.log('OCR connection successful', { 
        endpoint: bestEndpoint,
        totalEndpoints: availableEndpoints.length 
      });
      
      return {
        success: true,
        endpoint: bestEndpoint,
        availableEndpoints
      };
      
    } catch (error) {
      debugLogger.error('OCR connection test failed', error);
      return { 
        success: false, 
        error: `Connection test failed: ${error.message}`,
        availableEndpoints: []
      };
    }
  }

  /**
   * Update OCR configuration
   */
  updateConfig(newConfig: Partial<OCRConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // Clear cached endpoint if baseURL changed
    if (newConfig.baseURL) {
      this.detectedEndpoint = null;
      this.lastDetectionTime = 0;
    }
    debugLogger.log('OCR config updated', this.config);
  }

  /**
   * Update network configuration
   */
  updateNetworkConfig(newNetworkConfig: Partial<NetworkOCRConfig>): void {
    this.networkConfig = { ...this.networkConfig, ...newNetworkConfig };
    // Clear cached endpoint when network config changes
    this.detectedEndpoint = null;
    this.lastDetectionTime = 0;
    debugLogger.log('OCR network config updated', this.networkConfig);
  }

  /**
   * Get current configuration
   */
  getConfig(): { ocr: OCRConfig; network: NetworkOCRConfig; detected?: string } {
    return {
      ocr: this.config,
      network: this.networkConfig,
      detected: this.detectedEndpoint || undefined
    };
  }

  /**
   * Force re-detection of OCR endpoint
   */
  async refreshEndpoint(): Promise<string | null> {
    this.detectedEndpoint = null;
    this.lastDetectionTime = 0;
    return await this.ensureValidEndpoint();
  }
}

// Export singleton instance
export const ocrService = new OCRService();

// Export class for testing
export { OCRService };