// OCR service for receipt text extraction and processing
import { ReceiptItem } from '@/types';
import { OCR_CONFIDENCE_THRESHOLD } from '@/constants';

export interface OCRResult {
  text: string;
  confidence: number;
  extractedData: ExtractedReceiptData;
}

export interface ExtractedReceiptData {
  merchantName?: string;
  amount?: number;
  date?: Date;
  items?: ReceiptItem[];
  tax?: number;
  tip?: number;
  total?: number;
}

export interface OCRServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class OCRService {
  private static instance: OCRService;

  public static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  /**
   * Extract text from receipt image
   * Note: This is a basic implementation. For production, integrate with
   * services like Google Vision API, AWS Textract, or Azure Computer Vision
   */
  async extractTextFromImage(imageUri: string): Promise<OCRServiceResult<OCRResult>> {
    try {
      // For now, we'll simulate OCR processing
      // In a real implementation, you would call an OCR service here
      const simulatedResult = await this.simulateOCR(imageUri);
      
      if (!simulatedResult.success) {
        return simulatedResult;
      }

      return {
        success: true,
        data: simulatedResult.data,
      };
    } catch (error) {
      console.error('Error extracting text from image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to extract text from image',
      };
    }
  }

  /**
   * Simulate OCR processing for development
   * Replace this with actual OCR service integration
   */
  private async simulateOCR(imageUri: string): Promise<OCRServiceResult<OCRResult>> {
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate extracted text (would come from actual OCR service)
      const mockText = `
        GROCERY STORE
        123 Main St, Anytown
        Tel: (555) 123-4567
        
        Date: ${new Date().toLocaleDateString()}
        Time: ${new Date().toLocaleTimeString()}
        
        Apples                 $3.99
        Milk 2%               $4.25
        Bread Whole Wheat     $2.99
        Eggs Large Dozen      $3.49
        
        Subtotal             $14.72
        Tax (5%)              $0.74
        Total                $15.46
        
        Payment: Credit Card
        Thank you for shopping!
      `;

      const extractedData = this.parseReceiptText(mockText);
      
      return {
        success: true,
        data: {
          text: mockText,
          confidence: 0.85, // Mock confidence score
          extractedData,
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
   * Parse extracted text to identify receipt components
   */
  private parseReceiptText(text: string): ExtractedReceiptData {
    try {
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      const extractedData: ExtractedReceiptData = {};

      // Extract merchant name (usually first non-empty line)
      if (lines.length > 0) {
        extractedData.merchantName = this.extractMerchantName(lines);
      }

      // Extract date
      extractedData.date = this.extractDate(text);

      // Extract items and amounts
      const itemsData = this.extractItems(lines);
      extractedData.items = itemsData.items;

      // Extract totals
      const totals = this.extractTotals(lines);
      extractedData.amount = totals.total;
      extractedData.total = totals.total;
      extractedData.tax = totals.tax;
      extractedData.tip = totals.tip;

      return extractedData;
    } catch (error) {
      console.error('Error parsing receipt text:', error);
      return {};
    }
  }

  /**
   * Extract merchant name from receipt text
   */
  private extractMerchantName(lines: string[]): string | undefined {
    // Look for the first line that looks like a business name
    // Usually the first line or a line with common business identifiers
    const businessPatterns = [
      /^[A-Z\s&]+$/, // All caps business names
      /\b(STORE|SHOP|MARKET|RESTAURANT|CAFE|HOTEL|GAS|STATION)\b/i,
      /\b(INC|LLC|LTD|CORP|CO)\b/i,
    ];

    for (const line of lines.slice(0, 5)) { // Check first 5 lines
      if (line.length < 3 || line.length > 50) continue;
      
      for (const pattern of businessPatterns) {
        if (pattern.test(line)) {
          return line;
        }
      }
    }

    // Fallback to first non-address line
    return lines.find(line => 
      line.length > 3 && 
      line.length < 50 && 
      !line.includes('@') && 
      !line.includes('Tel:') &&
      !line.includes('Date:') &&
      !line.includes('Time:')
    );
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
}

// Export singleton instance
export const ocrService = OCRService.getInstance();