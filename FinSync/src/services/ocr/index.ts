// Enhanced OCR service for receipt text extraction and processing
import { ReceiptItem } from '@/types';
import { OCR_CONFIDENCE_THRESHOLD } from '@/constants';

export interface OCRResult {
  text: string;
  confidence: number;
  extractedData: ExtractedReceiptData;
  processingTime: number;
  ocrMethod: 'google-vision' | 'simulation' | 'local';
}

export interface ExtractedReceiptData {
  merchantName?: string;
  amount?: number;
  date?: Date;
  items?: ReceiptItem[];
  tax?: number;
  tip?: number;
  total?: number;
  subtotal?: number;
  address?: string;
  phone?: string;
  category?: string;
  paymentMethod?: string;
}

export interface OCRServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  processingTime?: number;
}

export interface GoogleVisionCredentials {
  apiKey: string;
  projectId?: string;
}

export class OCRService {
  private static instance: OCRService;
  private googleVisionApiKey?: string;
  private isGoogleVisionEnabled: boolean = false;

  public static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  /**
   * Configure Google Vision API credentials
   */
  public configureGoogleVision(credentials: GoogleVisionCredentials): void {
    this.googleVisionApiKey = credentials.apiKey;
    this.isGoogleVisionEnabled = !!credentials.apiKey;
  }

  /**
   * Extract text from receipt image using available OCR methods
   */
  async extractTextFromImage(imageUri: string): Promise<OCRServiceResult<OCRResult>> {
    const startTime = Date.now();
    
    try {
      // Try Google Vision API first if configured
      if (this.isGoogleVisionEnabled && this.googleVisionApiKey) {
        try {
          const visionResult = await this.extractTextWithGoogleVision(imageUri);
          if (visionResult.success) {
            return {
              ...visionResult,
              processingTime: Date.now() - startTime,
            };
          }
        } catch (error) {
          console.warn('Google Vision API failed, falling back to simulation:', error);
        }
      }

      // Fallback to simulation
      const simulatedResult = await this.simulateOCR(imageUri);
      
      return {
        ...simulatedResult,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Error extracting text from image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to extract text from image',
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Extract text using Google Vision API
   */
  private async extractTextWithGoogleVision(imageUri: string): Promise<OCRServiceResult<OCRResult>> {
    if (!this.googleVisionApiKey) {
      throw new Error('Google Vision API key not configured');
    }

    try {
      // Convert image to base64
      const base64Image = await this.imageToBase64(imageUri);
      
      // Call Google Vision API
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.googleVisionApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                image: {
                  content: base64Image,
                },
                features: [
                  {
                    type: 'TEXT_DETECTION',
                    maxResults: 1,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Google Vision API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.responses?.[0]?.error) {
        throw new Error(`Google Vision API error: ${result.responses[0].error.message}`);
      }

      const textAnnotations = result.responses?.[0]?.textAnnotations;
      if (!textAnnotations || textAnnotations.length === 0) {
        throw new Error('No text detected in image');
      }

      const fullText = textAnnotations[0].description || '';
      const confidence = this.calculateGoogleVisionConfidence(textAnnotations);
      const extractedData = this.parseReceiptText(fullText);

      return {
        success: true,
        data: {
          text: fullText,
          confidence,
          extractedData,
          processingTime: 0, // Will be set by caller
          ocrMethod: 'google-vision',
        },
      };
    } catch (error) {
      console.error('Google Vision API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Google Vision API failed',
      };
    }
  }

  /**
   * Convert image URI to base64
   */
  private async imageToBase64(imageUri: string): Promise<string> {
    try {
      // For Expo, we can use FileSystem to read the image
      const FileSystem = await import('expo-file-system');
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      throw new Error(`Failed to convert image to base64: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate confidence score from Google Vision text annotations
   */
  private calculateGoogleVisionConfidence(textAnnotations: any[]): number {
    if (!textAnnotations || textAnnotations.length <= 1) {
      return 0.5; // Default confidence for minimal text
    }

    // Skip the first annotation (full text) and calculate average confidence
    const wordAnnotations = textAnnotations.slice(1);
    let totalConfidence = 0;
    let confidenceCount = 0;

    wordAnnotations.forEach(annotation => {
      if (annotation.confidence !== undefined) {
        totalConfidence += annotation.confidence;
        confidenceCount++;
      }
    });

    if (confidenceCount === 0) {
      return 0.8; // Default high confidence if no per-word confidence available
    }

    return Math.min(1.0, totalConfidence / confidenceCount);
  }

  /**
   * Simulate OCR processing for development and testing
   */
  private async simulateOCR(imageUri: string): Promise<OCRServiceResult<OCRResult>> {
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate various Canadian receipt formats
      const mockTexts = [
        // Grocery store
        `
        SOBEYS GROCERY STORE
        1234 Queen St W, Toronto ON
        Tel: (416) 555-0123
        GST#: R123456789
        
        Date: ${new Date().toLocaleDateString('en-CA')}
        Time: ${new Date().toLocaleTimeString()}
        
        Bananas (1.2kg)         $2.99
        Milk 2% 4L             $5.49
        Bread Wonder           $2.79
        Ground Beef (1lb)      $8.99
        
        Subtotal              $20.26
        HST (13%)              $2.63
        Total                 $22.89
        
        Payment: Debit Card
        Thank you for shopping!
        `,
        // Restaurant
        `
        TIM HORTONS #4521
        456 College St, Toronto ON M5T 1P9
        Tel: (416) 555-0456
        HST#: 123456789RT0001
        
        ${new Date().toLocaleDateString('en-CA')} ${new Date().toLocaleTimeString()}
        
        Double Double           $1.99
        Boston Cream Donut      $1.49  
        Breakfast Sandwich      $4.99
        Hash Browns             $1.99
        
        Subtotal               $10.46
        HST (13%)               $1.36
        Total                  $11.82
        
        Debit Chip
        Thank you!
        `,
        // Retail store
        `
        CANADIAN TIRE CORP
        789 Yonge St, Toronto ON
        (416) 555-0789
        
        ${new Date().toLocaleDateString('en-CA')}
        
        Motor Oil 5W30          $24.99
        Air Freshener           $3.99
        Windshield Wipers       $19.99
        
        Subtotal               $48.97
        HST (13%)               $6.37
        Total                  $55.34
        
        VISA ****1234
        APPROVED
        `
      ];

      const randomText = mockTexts[Math.floor(Math.random() * mockTexts.length)];
      const extractedData = this.parseReceiptText(randomText);
      
      return {
        success: true,
        data: {
          text: randomText.trim(),
          confidence: 0.85 + Math.random() * 0.1, // Random confidence 0.85-0.95
          extractedData,
          processingTime: 0, // Will be set by caller
          ocrMethod: 'simulation',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OCR simulation failed',
      };
    }
  }

  /**
   * Enhanced parsing for Canadian receipt formats
   */
  private parseReceiptText(text: string): ExtractedReceiptData {
    try {
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      const extractedData: ExtractedReceiptData = {};

      // Extract merchant name
      extractedData.merchantName = this.extractMerchantName(lines);

      // Extract address and phone
      extractedData.address = this.extractAddress(lines);
      extractedData.phone = this.extractPhone(lines);

      // Extract date
      extractedData.date = this.extractDate(text);

      // Extract items and amounts
      const itemsData = this.extractItems(lines);
      extractedData.items = itemsData.items;

      // Extract totals (Canadian tax formats)
      const totals = this.extractCanadianTotals(lines);
      extractedData.subtotal = totals.subtotal;
      extractedData.tax = totals.tax;
      extractedData.total = totals.total;
      extractedData.amount = totals.total; // Keep for backward compatibility
      extractedData.tip = totals.tip;

      // Extract payment method
      extractedData.paymentMethod = this.extractPaymentMethod(lines);

      // Determine category based on merchant and items
      extractedData.category = this.determineCategory(extractedData);

      return extractedData;
    } catch (error) {
      console.error('Error parsing receipt text:', error);
      return {};
    }
  }

  /**
   * Extract address from receipt lines
   */
  private extractAddress(lines: string[]): string | undefined {
    const addressPatterns = [
      /^\d+\s+[A-Za-z\s]+(St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Way|Place|Pl)\b.*$/i,
      /^[A-Za-z\s]+,\s*(ON|AB|BC|MB|NB|NL|NS|NT|NU|PE|QC|SK|YT)\b/i,
    ];

    for (const line of lines.slice(1, 6)) { // Check lines 2-6
      for (const pattern of addressPatterns) {
        if (pattern.test(line)) {
          return line;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract phone number from receipt lines
   */
  private extractPhone(lines: string[]): string | undefined {
    const phonePattern = /(?:Tel:|Phone:)?\s*\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/i;
    
    for (const line of lines.slice(0, 8)) { // Check first 8 lines
      const match = line.match(phonePattern);
      if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
      }
    }

    return undefined;
  }

  /**
   * Enhanced Canadian totals extraction (HST, GST, PST)
   */
  private extractCanadianTotals(lines: string[]): {
    subtotal?: number;
    tax?: number;
    total?: number;
    tip?: number;
  } {
    const totals: any = {};
    
    const totalPatterns: { [key: string]: RegExp[] } = {
      subtotal: [
        /(?:Subtotal|Sub[\s-]?Total)[:\s]+\$?([\d,]+\.?\d{0,2})/i,
      ],
      tax: [
        /(?:HST|GST|PST|Tax)[^$\d]*\$?([\d,]+\.?\d{0,2})/i,
        /(?:Tax|HST|GST|PST).*?\$+([\d,]+\.?\d{0,2})/i,
      ],
      total: [
        /(?:Total|TOTAL)[:\s]+\$?([\d,]+\.?\d{0,2})/i,
        /(?:Amount|AMOUNT)[:\s]+\$?([\d,]+\.?\d{0,2})/i,
      ],
      tip: [
        /(?:Tip|Gratuity|TIP)[:\s]+\$?([\d,]+\.?\d{0,2})/i,
      ],
    };

    for (const line of lines) {
      for (const [key, patterns] of Object.entries(totalPatterns)) {
        for (const pattern of patterns) {
          const match = line.match(pattern);
          if (match && !totals[key]) { // Only set if not already found
            const amount = parseFloat(match[1].replace(/,/g, ''));
            // Additional validation for tax amounts - they should be reasonable
            if (!isNaN(amount) && amount >= 0) {
              // For tax, ensure it's not a percentage (typically less than 50% for any reasonable tax)
              if (key === 'tax' && amount > 50) {
                continue; // Skip this match, it's likely a percentage
              }
              totals[key] = amount;
            }
          }
        }
      }
    }

    return totals;
  }

  /**
   * Extract payment method
   */
  private extractPaymentMethod(lines: string[]): string | undefined {
    const paymentPatterns = [
      /(?:Payment:|Paid with:)?\s*(Credit Card|Debit Card|Cash|Visa|MasterCard|Amex|American Express|Interac)/i,
      /(VISA|MC|AMEX|DEBIT|CASH|INTERAC)/i,
      /\*{4}\d{4}/i, // Card number pattern
    ];

    for (const line of lines.slice(-10)) { // Check last 10 lines
      for (const pattern of paymentPatterns) {
        const match = line.match(pattern);
        if (match) {
          return match[1] || match[0];
        }
      }
    }

    return undefined;
  }

  /**
   * Smart category detection based on merchant and items
   */
  private determineCategory(data: ExtractedReceiptData): string | undefined {
    const merchantName = data.merchantName?.toLowerCase() || '';
    const items = data.items || [];

    // Merchant-based categorization (Canadian businesses)
    const merchantPatterns = {
      'Food & Dining': [
        'tim hortons', 'mcdonalds', 'subway', 'pizza', 'restaurant', 'cafe', 'coffee',
        'harvey\'s', 'a&w', 'wendy\'s', 'kfc', 'swiss chalet', 'kelsey\'s'
      ],
      'Groceries': [
        'sobeys', 'loblaws', 'metro', 'fortinos', 'freshco', 'food basics',
        'independent', 'valu-mart', 'your independent grocer', 'zehrs', 'superstore'
      ],
      'Transportation': [
        'petro-canada', 'shell', 'esso', 'husky', 'chevron', 'gas', 'fuel',
        'ttc', 'go transit', 'uber', 'taxi'
      ],
      'Shopping': [
        'walmart', 'canadian tire', 'costco', 'home depot', 'rona', 'lowes',
        'dollarama', 'winners', 'marshalls', 'shoppers drug mart'
      ],
      'Healthcare': [
        'shoppers drug mart', 'pharmacy', 'rexall', 'medical', 'dental', 'clinic'
      ],
    };

    // Check merchant patterns
    for (const [category, patterns] of Object.entries(merchantPatterns)) {
      if (patterns.some(pattern => merchantName.includes(pattern))) {
        return category;
      }
    }

    // Item-based categorization fallback
    const foodKeywords = ['milk', 'bread', 'meat', 'coffee', 'sandwich', 'burger', 'pizza'];
    const hasFood = items.some(item => 
      foodKeywords.some(keyword => item.name.toLowerCase().includes(keyword))
    );

    if (hasFood) {
      return merchantName.includes('restaurant') || merchantName.includes('cafe') 
        ? 'Food & Dining' 
        : 'Groceries';
    }

    return undefined;
  }

  /**
   * Enhanced merchant name extraction for Canadian businesses
   */
  private extractMerchantName(lines: string[]): string | undefined {
    // Enhanced patterns for Canadian businesses
    const businessPatterns = [
      /^[A-Z\s&'\.#\-]+$/, // All caps business names with common punctuation
      /\b(STORE|SHOP|MARKET|RESTAURANT|CAFE|HOTEL|GAS|STATION|PHARMACY|TIRE|DEPOT)\b/i,
      /\b(INC|LLC|LTD|CORP|CO|LIMITED)\b/i,
      /\b(TIM HORTONS|CANADIAN TIRE|SOBEYS|LOBLAWS|METRO|SHOPPERS)\b/i, // Common Canadian chains
    ];

    // Skip patterns that indicate non-business lines
    const skipPatterns = [
      /^\d+\s+[A-Za-z\s]+(St|Street|Ave|Avenue|Rd|Road)/i, // Address lines
      /Tel:|Phone:|GST#:|HST#:/i, // Contact/tax info
      /\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/i, // Date formats
      /^\s*[\d\-\/\:]+\s*$/, // Date/time only lines
    ];

    for (const line of lines.slice(0, 5)) { // Check first 5 lines
      if (line.length < 3 || line.length > 60) continue;
      
      // Skip non-business lines
      if (skipPatterns.some(pattern => pattern.test(line))) {
        continue;
      }
      
      // Check business patterns
      for (const pattern of businessPatterns) {
        if (pattern.test(line)) {
          return this.cleanMerchantName(line);
        }
      }
    }

    // Fallback to first reasonable line
    const fallback = lines.find(line => 
      line.length > 3 && 
      line.length < 60 && 
      !skipPatterns.some(pattern => pattern.test(line))
    );

    return fallback ? this.cleanMerchantName(fallback) : undefined;
  }

  /**
   * Clean and standardize merchant names
   */
  private cleanMerchantName(name: string): string {
    return name
      .replace(/^#\d+\s*/, '') // Remove store numbers at start
      .replace(/\s+#\d+$/, '') // Remove store numbers at end
      .replace(/\s{2,}/g, ' ') // Multiple spaces to single
      .trim();
  }

  /**
   * Extract date from receipt text
   */
  private extractDate(text: string): Date | undefined {
    const datePatterns = [
      /Date:\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
      /(\d{1,2}\/\d{1,2}\/\d{2,4})/g,
      /(\d{1,2}-\d{1,2}-\d{2,4})/g,
      /(\d{4}-\d{1,2}-\d{1,2})/g,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        const dateStr = match[1] || match[0];
        const parsedDate = new Date(dateStr);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract items and prices from receipt text
   */
  private extractItems(lines: string[]): { items: ReceiptItem[] } {
    const items: ReceiptItem[] = [];
    
    // Pattern to match item lines with prices
    const itemPattern = /^(.+?)\s+\$?([\d,]+\.?\d{0,2})$/;
    
    for (const line of lines) {
      // Skip common header/footer lines
      if (this.isHeaderOrFooterLine(line)) {
        continue;
      }

      const match = line.match(itemPattern);
      if (match) {
        const name = match[1].trim();
        const priceStr = match[2].replace(/,/g, '');
        const price = parseFloat(priceStr);

        if (!isNaN(price) && price > 0 && name.length > 0) {
          items.push({
            name,
            price,
            quantity: 1, // Default to 1, could be enhanced to detect quantity
          });
        }
      }
    }

    return { items };
  }

  /**
   * Extract totals (subtotal, tax, tip, total) from receipt text
   */
  private extractTotals(lines: string[]): {
    total?: number;
    tax?: number;
    tip?: number;
    subtotal?: number;
  } {
    const totals: any = {};
    
    const totalPatterns: { [key: string]: RegExp[] } = {
      total: [
        /Total[:\s]+\$?([\d,]+\.?\d{0,2})/i,
        /Amount[:\s]+\$?([\d,]+\.?\d{0,2})/i,
      ],
      tax: [
        /Tax[:\s]+\$?([\d,]+\.?\d{0,2})/i,
        /HST[:\s]+\$?([\d,]+\.?\d{0,2})/i,
        /GST[:\s]+\$?([\d,]+\.?\d{0,2})/i,
      ],
      tip: [
        /Tip[:\s]+\$?([\d,]+\.?\d{0,2})/i,
        /Gratuity[:\s]+\$?([\d,]+\.?\d{0,2})/i,
      ],
      subtotal: [
        /Subtotal[:\s]+\$?([\d,]+\.?\d{0,2})/i,
        /Sub[\s-]?Total[:\s]+\$?([\d,]+\.?\d{0,2})/i,
      ],
    };

    for (const line of lines) {
      for (const [key, patterns] of Object.entries(totalPatterns)) {
        for (const pattern of patterns) {
          const match = line.match(pattern);
          if (match) {
            const amount = parseFloat(match[1].replace(/,/g, ''));
            if (!isNaN(amount) && amount >= 0) {
              totals[key] = amount;
            }
          }
        }
      }
    }

    return totals;
  }

  /**
   * Check if a line is likely a header or footer (not an item)
   */
  private isHeaderOrFooterLine(line: string): boolean {
    const skipPatterns = [
      /^[A-Z\s&]+$/, // All caps (likely business name)
      /\d{1,4}\s+.+\s+(st|street|ave|avenue|rd|road|blvd|boulevard)/i, // Address
      /tel:|phone:|fax:/i, // Contact info
      /date:|time:|transaction/i, // Transaction info
      /thank\s+you/i, // Thank you message
      /visit\s+us/i, // Visit us message
      /payment:|card:|cash/i, // Payment info
      /subtotal|tax|total|amount/i, // Total lines
      /^\s*[\d\-\/\:]+\s*$/, // Date/time only lines
      /^[*\-=_]+$/, // Decorative lines
    ];

    return skipPatterns.some(pattern => pattern.test(line));
  }

  /**
   * Validate extracted data quality
   */
  validateExtractedData(data: ExtractedReceiptData): {
    isValid: boolean;
    confidence: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let confidenceScore = 1.0;

    // Check if merchant name exists and is reasonable
    if (!data.merchantName) {
      issues.push('No merchant name detected');
      confidenceScore -= 0.2;
    } else if (data.merchantName.length < 2) {
      issues.push('Merchant name seems too short');
      confidenceScore -= 0.1;
    }

    // Check if total amount exists and is reasonable
    if (!data.amount && !data.total) {
      issues.push('No total amount detected');
      confidenceScore -= 0.3;
    } else {
      const total = data.amount || data.total || 0;
      if (total <= 0) {
        issues.push('Total amount is zero or negative');
        confidenceScore -= 0.2;
      } else if (total > 10000) {
        issues.push('Total amount seems unusually high');
        confidenceScore -= 0.1;
      }
    }

    // Check date validity
    if (data.date) {
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      if (data.date < oneYearAgo || data.date > oneWeekFromNow) {
        issues.push('Date seems unusual (too old or in future)');
        confidenceScore -= 0.1;
      }
    }

    // Check items
    if (!data.items || data.items.length === 0) {
      issues.push('No items detected');
      confidenceScore -= 0.2;
    } else {
      const invalidItems = data.items.filter(item => 
        !item.name || item.name.length < 2 || item.price <= 0
      );
      if (invalidItems.length > 0) {
        issues.push(`${invalidItems.length} items have invalid data`);
        confidenceScore -= (invalidItems.length / data.items.length) * 0.2;
      }
    }

    return {
      isValid: confidenceScore >= OCR_CONFIDENCE_THRESHOLD,
      confidence: Math.max(0, confidenceScore),
      issues,
    };
  }

  /**
   * Preprocess image for better OCR results
   */
  async preprocessImage(imageUri: string): Promise<string> {
    // For now, return the original image
    // In the future, could add image enhancement:
    // - Contrast adjustment
    // - Noise reduction
    // - Perspective correction
    // - Rotation correction
    return imageUri;
  }

  /**
   * Get OCR service status and configuration
   */
  getServiceStatus(): {
    isGoogleVisionEnabled: boolean;
    hasApiKey: boolean;
    supportedMethods: string[];
  } {
    return {
      isGoogleVisionEnabled: this.isGoogleVisionEnabled,
      hasApiKey: !!this.googleVisionApiKey,
      supportedMethods: [
        ...(this.isGoogleVisionEnabled ? ['google-vision'] : []),
        'simulation',
      ],
    };
  }

  /**
   * Validate OCR configuration
   */
  validateConfiguration(): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!this.isGoogleVisionEnabled) {
      issues.push('Google Vision API not configured');
      recommendations.push('Configure Google Vision API for production use');
    }

    if (this.googleVisionApiKey && this.googleVisionApiKey.length < 20) {
      issues.push('Google Vision API key appears invalid');
      recommendations.push('Verify your Google Vision API key');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations,
    };
  }

  /**
   * Get recommended confidence threshold based on OCR method
   */
  getRecommendedConfidenceThreshold(method: 'google-vision' | 'simulation' | 'local'): number {
    switch (method) {
      case 'google-vision':
        return 0.85; // Higher threshold for cloud OCR
      case 'simulation':
        return 0.75; // Lower threshold for simulation
      case 'local':
        return 0.70; // Lower threshold for local OCR
      default:
        return OCR_CONFIDENCE_THRESHOLD;
    }
  }
}

// Export singleton instance
export const ocrService = OCRService.getInstance();

// Export utility function for easy Google Vision setup
export const configureGoogleVision = (apiKey: string): void => {
  ocrService.configureGoogleVision({ apiKey });
};