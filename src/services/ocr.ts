import { debugLogger } from '../utils/debugLogger';

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
  baseURL: 'http://localhost:1234',
  apiKey: 'lm-studio',
  model: 'nanonets/Nanonets-OCR-s',
  timeout: 30000
};

class OCRService {
  private config: OCRConfig;

  constructor(config: Partial<OCRConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Extract transaction data from a base64 encoded image
   */
  async extractTransactionData(imageBase64: string): Promise<OCRResult> {
    try {
      debugLogger.log('OCR extraction started', { 
        imageSize: imageBase64.length,
        model: this.config.model 
      });

      const response = await this.callOCRAPI(imageBase64);
      
      if (!response.ok) {
        throw new Error(`OCR API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      debugLogger.log('OCR API response received', { success: true });

      // Parse the OCR result
      const extractedData = this.parseOCRResponse(result);
      
      return {
        success: true,
        data: extractedData,
        confidence: this.calculateConfidence(extractedData)
      };

    } catch (error) {
      debugLogger.error('OCR extraction failed', error);
      return {
        success: false,
        error: error.message || 'Unknown OCR error'
      };
    }
  }

  /**
   * Make API call to LM Studio nanonets-ocr endpoint
   */
  private async callOCRAPI(imageBase64: string): Promise<Response> {
    const url = `${this.config.baseURL}/v1/chat/completions`;
    
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
          content: [
            {
              type: 'text',
              text: 'Extract transaction details from this receipt image'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 500
    };

    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify(payload)
    });
  }

  /**
   * Parse the OCR API response and extract transaction data
   */
  private parseOCRResponse(response: any): OCRResult['data'] {
    try {
      if (!response.choices || !response.choices[0] || !response.choices[0].message) {
        throw new Error('Invalid OCR response format');
      }

      const content = response.choices[0].message.content.trim();
      debugLogger.log('OCR response content', { content });

      // Try to parse JSON from the response
      let parsedData;
      try {
        parsedData = JSON.parse(content);
      } catch {
        // If direct parsing fails, try to extract JSON from the response
        const jsonMatch = content.match(/\{[^}]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in OCR response');
        }
      }

      // Validate and clean the parsed data
      return {
        amount: this.parseAmount(parsedData.amount),
        date: this.parseDate(parsedData.date),
        description: this.parseString(parsedData.description),
        category: this.parseCategory(parsedData.category),
        merchant: this.parseString(parsedData.merchant)
      };

    } catch (error) {
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
   * Test OCR service connectivity
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.config.baseURL}/v1/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (response.ok) {
        const models = await response.json();
        const hasOCRModel = models.data?.some((model: any) => 
          model.id?.includes('ocr') || model.id?.includes('Nanonets')
        );
        
        if (hasOCRModel) {
          return { success: true };
        } else {
          return { 
            success: false, 
            error: 'OCR model not found in LM Studio. Please load nanonets/Nanonets-OCR-s model.' 
          };
        }
      } else {
        return { 
          success: false, 
          error: `LM Studio not accessible: ${response.status} ${response.statusText}` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: `Cannot connect to LM Studio: ${error.message}` 
      };
    }
  }

  /**
   * Update OCR configuration
   */
  updateConfig(newConfig: Partial<OCRConfig>): void {
    this.config = { ...this.config, ...newConfig };
    debugLogger.log('OCR config updated', this.config);
  }
}

// Export singleton instance
export const ocrService = new OCRService();

// Export class for testing
export { OCRService };