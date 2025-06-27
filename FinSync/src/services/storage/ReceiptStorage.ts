/**
 * Receipt Storage Service for FinSync Financial App
 * Provides comprehensive receipt management with metadata persistence,
 * OCR data storage, file path management, and image processing capabilities
 */

import BaseDataService, { BaseEntity, DataServiceOptions } from './BaseDataService';
import StorageService from './StorageService';
import { STORAGE_KEYS, DEFAULT_STORAGE_OPTIONS, STORAGE_CONFIG } from './StorageKeys';
import {
  Receipt,
  ReceiptItem,
  ValidationResult,
  ValidationError,
  Transaction,
} from '../../types';

export interface ReceiptMetadata {
  fileSize: number;
  dimensions?: { width: number; height: number };
  format: string;
  originalName?: string;
  compressionRatio?: number;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  ocrProcessedAt?: Date;
  thumbnailPath?: string;
}

export interface OCRProcessingResult {
  text: string;
  confidence: number;
  processingTime: number;
  extractedData: {
    merchantName?: string;
    totalAmount?: number;
    date?: Date;
    items?: ReceiptItem[];
    taxAmount?: number;
    tipAmount?: number;
    paymentMethod?: string;
    receiptNumber?: string;
  };
  rawOCRData?: any;
}

export interface ReceiptSearchQuery {
  text?: string;
  merchantName?: string;
  dateRange?: { startDate: Date; endDate: Date };
  amountRange?: { min?: number; max?: number };
  hasTransaction?: boolean;
  ocrConfidenceMin?: number;
  processingStatus?: ReceiptMetadata['processingStatus'];
  sortBy?: 'date' | 'amount' | 'confidence' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ReceiptWithTransaction extends Receipt {
  transaction?: Transaction;
  metadata?: ReceiptMetadata;
}

export interface ReceiptAnalytics {
  totalReceipts: number;
  processedReceipts: number;
  averageConfidence: number;
  totalAmount: number;
  uniqueMerchants: number;
  receiptsWithTransactions: number;
  storageUsed: number;
  processingSuccessRate: number;
}

/**
 * Receipt Storage Service
 */
export class ReceiptStorage extends BaseDataService<Receipt> {
  private static instance: ReceiptStorage | null = null;
  private readonly maxReceiptSizeMB = STORAGE_CONFIG.MAX_RECEIPT_SIZE_MB;

  constructor(options?: DataServiceOptions) {
    super(STORAGE_KEYS.RECEIPTS, 'receipt', options);
  }

  /**
   * Singleton pattern for consistent instance
   */
  static getInstance(options?: DataServiceOptions): ReceiptStorage {
    if (!this.instance) {
      this.instance = new ReceiptStorage(options);
    }
    return this.instance;
  }

  /**
   * Create receipt with file validation and metadata generation
   */
  async createReceipt(
    imageUri: string,
    ocrData?: Partial<OCRProcessingResult>
  ): Promise<Receipt> {
    // Validate image file
    await this.validateImageFile(imageUri);
    
    // Generate metadata
    const metadata = await this.generateReceiptMetadata(imageUri);

    const receiptData: Omit<Receipt, 'id' | 'createdAt'> = {
      imageUri: await this.processAndStoreImage(imageUri),
      ocrText: ocrData?.text,
      extractionConfidence: ocrData?.confidence,
      merchantName: ocrData?.extractedData?.merchantName,
      amount: ocrData?.extractedData?.totalAmount,
      date: ocrData?.extractedData?.date,
      items: ocrData?.extractedData?.items,
    };

    const receipt = await this.create(receiptData);

    // Store metadata separately
    await this.storeReceiptMetadata(receipt.id, metadata);

    // Store OCR processing result if provided
    if (ocrData) {
      await this.storeOCRResult(receipt.id, ocrData);
    }

    // Update storage metadata
    await StorageService.updateStorageMetadata(this.storageKey, await this.getAll());

    return receipt;
  }

  /**
   * Update receipt with OCR processing results
   */
  async updateReceiptWithOCR(
    receiptId: string,
    ocrResult: OCRProcessingResult
  ): Promise<Receipt> {
    const receipt = await this.getById(receiptId);
    if (!receipt) {
      throw new Error(`Receipt not found: ${receiptId}`);
    }

    const updates: Partial<Receipt> = {
      ocrText: ocrResult.text,
      extractionConfidence: ocrResult.confidence,
      merchantName: ocrResult.extractedData.merchantName,
      amount: ocrResult.extractedData.totalAmount,
      date: ocrResult.extractedData.date,
      items: ocrResult.extractedData.items,
    };

    const updatedReceipt = await this.update(receiptId, updates);

    // Store full OCR result
    await this.storeOCRResult(receiptId, ocrResult);

    // Update metadata
    const metadata = await this.getReceiptMetadata(receiptId);
    if (metadata) {
      metadata.processingStatus = 'completed';
      metadata.ocrProcessedAt = new Date();
      await this.storeReceiptMetadata(receiptId, metadata);
    }

    return updatedReceipt;
  }

  /**
   * Link receipt to transaction
   */
  async linkReceiptToTransaction(receiptId: string, transactionId: string): Promise<Receipt> {
    const receipt = await this.getById(receiptId);
    if (!receipt) {
      throw new Error(`Receipt not found: ${receiptId}`);
    }

    return await this.update(receiptId, { transactionId });
  }

  /**
   * Unlink receipt from transaction
   */
  async unlinkReceiptFromTransaction(receiptId: string): Promise<Receipt> {
    const receipt = await this.getById(receiptId);
    if (!receipt) {
      throw new Error(`Receipt not found: ${receiptId}`);
    }

    return await this.update(receiptId, { transactionId: undefined });
  }

  /**
   * Search receipts with advanced filtering
   */
  async searchReceipts(query: ReceiptSearchQuery): Promise<{
    receipts: ReceiptWithTransaction[];
    totalCount: number;
    hasMore: boolean;
  }> {
    let receipts = await this.getAll();

    // Apply filters
    if (query.merchantName) {
      const merchantName = query.merchantName.toLowerCase();
      receipts = receipts.filter(r => 
        r.merchantName?.toLowerCase().includes(merchantName)
      );
    }

    if (query.text) {
      const searchText = query.text.toLowerCase();
      receipts = receipts.filter(r => 
        r.ocrText?.toLowerCase().includes(searchText) ||
        r.merchantName?.toLowerCase().includes(searchText)
      );
    }

    if (query.dateRange) {
      receipts = receipts.filter(r => {
        if (!r.date) return false;
        const receiptDate = new Date(r.date);
        return receiptDate >= query.dateRange!.startDate && 
               receiptDate <= query.dateRange!.endDate;
      });
    }

    if (query.amountRange) {
      const { min, max } = query.amountRange;
      receipts = receipts.filter(r => {
        if (!r.amount) return false;
        if (min !== undefined && r.amount < min) return false;
        if (max !== undefined && r.amount > max) return false;
        return true;
      });
    }

    if (query.hasTransaction !== undefined) {
      receipts = receipts.filter(r => 
        query.hasTransaction ? !!r.transactionId : !r.transactionId
      );
    }

    if (query.ocrConfidenceMin !== undefined) {
      receipts = receipts.filter(r => 
        r.extractionConfidence && r.extractionConfidence >= query.ocrConfidenceMin!
      );
    }

    if (query.processingStatus) {
      // Filter by processing status from metadata
      const filteredIds = new Set<string>();
      for (const receipt of receipts) {
        const metadata = await this.getReceiptMetadata(receipt.id);
        if (metadata?.processingStatus === query.processingStatus) {
          filteredIds.add(receipt.id);
        }
      }
      receipts = receipts.filter(r => filteredIds.has(r.id));
    }

    // Apply sorting
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    receipts = this.sortEntities(receipts, sortBy, sortOrder);

    // Apply pagination
    const totalCount = receipts.length;
    const offset = query.offset || 0;
    const limit = query.limit || 20;
    const paginatedReceipts = receipts.slice(offset, offset + limit);

    // Enhance with metadata and transaction data
    const enhancedReceipts: ReceiptWithTransaction[] = await Promise.all(
      paginatedReceipts.map(async (receipt) => ({
        ...receipt,
        metadata: await this.getReceiptMetadata(receipt.id),
        // transaction: receipt.transactionId ? await this.getTransactionById(receipt.transactionId) : undefined,
      }))
    );

    return {
      receipts: enhancedReceipts,
      totalCount,
      hasMore: offset + limit < totalCount,
    };
  }

  /**
   * Get receipts without linked transactions
   */
  async getUnlinkedReceipts(): Promise<Receipt[]> {
    const receipts = await this.getAll();
    return receipts.filter(r => !r.transactionId);
  }

  /**
   * Get receipts by merchant
   */
  async getReceiptsByMerchant(merchantName: string): Promise<Receipt[]> {
    const receipts = await this.getAll();
    return receipts.filter(r => 
      r.merchantName?.toLowerCase().includes(merchantName.toLowerCase())
    );
  }

  /**
   * Get receipt analytics
   */
  async getReceiptAnalytics(): Promise<ReceiptAnalytics> {
    const receipts = await this.getAll();
    const totalReceipts = receipts.length;

    let processedReceipts = 0;
    let totalConfidence = 0;
    let totalAmount = 0;
    let receiptsWithTransactions = 0;
    let storageUsed = 0;
    const merchants = new Set<string>();

    for (const receipt of receipts) {
      if (receipt.ocrText) {
        processedReceipts++;
        if (receipt.extractionConfidence) {
          totalConfidence += receipt.extractionConfidence;
        }
      }

      if (receipt.amount) {
        totalAmount += receipt.amount;
      }

      if (receipt.transactionId) {
        receiptsWithTransactions++;
      }

      if (receipt.merchantName) {
        merchants.add(receipt.merchantName);
      }

      // Calculate storage usage from metadata
      const metadata = await this.getReceiptMetadata(receipt.id);
      if (metadata) {
        storageUsed += metadata.fileSize;
      }
    }

    const averageConfidence = processedReceipts > 0 ? totalConfidence / processedReceipts : 0;
    const processingSuccessRate = totalReceipts > 0 ? (processedReceipts / totalReceipts) * 100 : 0;

    return {
      totalReceipts,
      processedReceipts,
      averageConfidence,
      totalAmount,
      uniqueMerchants: merchants.size,
      receiptsWithTransactions,
      storageUsed,
      processingSuccessRate,
    };
  }

  /**
   * Clean up orphaned receipt files
   */
  async cleanupOrphanedFiles(): Promise<{
    filesRemoved: number;
    spaceFreed: number;
    errors: string[];
  }> {
    const receipts = await this.getAll();
    const receiptPaths = new Set(receipts.map(r => r.imageUri));
    
    let filesRemoved = 0;
    let spaceFreed = 0;
    const errors: string[] = [];

    // This would need file system integration to actually clean up files
    // For now, returning placeholder data
    return {
      filesRemoved,
      spaceFreed,
      errors,
    };
  }

  /**
   * Generate thumbnail for receipt
   */
  async generateThumbnail(receiptId: string): Promise<string | null> {
    const receipt = await this.getById(receiptId);
    if (!receipt) {
      return null;
    }

    // This would integrate with image processing library
    // For now, returning placeholder
    const thumbnailPath = `${receipt.imageUri}_thumb.jpg`;
    
    // Update metadata with thumbnail path
    const metadata = await this.getReceiptMetadata(receiptId);
    if (metadata) {
      metadata.thumbnailPath = thumbnailPath;
      await this.storeReceiptMetadata(receiptId, metadata);
    }

    return thumbnailPath;
  }

  /**
   * Store receipt metadata
   */
  async storeReceiptMetadata(receiptId: string, metadata: ReceiptMetadata): Promise<void> {
    const metadataKey = `${STORAGE_KEYS.RECEIPTS}_metadata_${receiptId}`;
    await StorageService.executeBatch([{
      type: 'set',
      key: metadataKey,
      value: metadata,
      options: DEFAULT_STORAGE_OPTIONS.CORE_DATA,
    }]);
  }

  /**
   * Get receipt metadata
   */
  async getReceiptMetadata(receiptId: string): Promise<ReceiptMetadata | null> {
    const metadataKey = `${STORAGE_KEYS.RECEIPTS}_metadata_${receiptId}`;
    const results = await StorageService.executeBatch([{
      type: 'get',
      key: metadataKey,
    }]);
    
    return results[0]?.value || null;
  }

  /**
   * Store OCR processing result
   */
  async storeOCRResult(receiptId: string, ocrResult: OCRProcessingResult): Promise<void> {
    const ocrKey = `${STORAGE_KEYS.RECEIPTS}_ocr_${receiptId}`;
    await StorageService.executeBatch([{
      type: 'set',
      key: ocrKey,
      value: ocrResult,
      options: DEFAULT_STORAGE_OPTIONS.CORE_DATA,
    }]);
  }

  /**
   * Get OCR processing result
   */
  async getOCRResult(receiptId: string): Promise<OCRProcessingResult | null> {
    const ocrKey = `${STORAGE_KEYS.RECEIPTS}_ocr_${receiptId}`;
    const results = await StorageService.executeBatch([{
      type: 'get',
      key: ocrKey,
    }]);
    
    return results[0]?.value || null;
  }

  /**
   * Required implementations from BaseDataService
   */
  protected validateEntity(entity: Partial<Receipt>): ValidationResult {
    return this.validateReceiptData(entity);
  }

  protected transformForStorage(entity: Receipt): any {
    return {
      ...entity,
      date: entity.date?.toISOString(),
      createdAt: entity.createdAt.toISOString(),
    };
  }

  protected transformFromStorage(data: any): Receipt {
    return {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
      createdAt: new Date(data.createdAt),
    };
  }

  protected filterByText(entities: Receipt[], text: string): Receipt[] {
    const searchText = text.toLowerCase();
    return entities.filter(r => 
      r.ocrText?.toLowerCase().includes(searchText) ||
      r.merchantName?.toLowerCase().includes(searchText)
    );
  }

  /**
   * Private helper methods
   */
  private async validateImageFile(imageUri: string): Promise<void> {
    // This would integrate with file system to validate image
    // For now, basic validation
    if (!imageUri || imageUri.trim().length === 0) {
      throw new Error('Image URI is required');
    }

    // Check file extension
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const hasValidExtension = validExtensions.some(ext => 
      imageUri.toLowerCase().endsWith(ext)
    );

    if (!hasValidExtension) {
      throw new Error(`Invalid image format. Supported formats: ${validExtensions.join(', ')}`);
    }
  }

  private async generateReceiptMetadata(imageUri: string): Promise<ReceiptMetadata> {
    // This would integrate with file system and image processing
    // For now, returning basic metadata
    return {
      fileSize: 0, // Would calculate actual file size
      format: this.getImageFormat(imageUri),
      originalName: this.getOriginalFileName(imageUri),
      processingStatus: 'pending',
    };
  }

  private async processAndStoreImage(imageUri: string): Promise<string> {
    // This would process and optimize the image, then store it
    // For now, returning the original URI
    return imageUri;
  }

  private getImageFormat(imageUri: string): string {
    const extension = imageUri.split('.').pop()?.toLowerCase();
    return extension || 'unknown';
  }

  private getOriginalFileName(imageUri: string): string {
    return imageUri.split('/').pop() || 'unknown';
  }

  private validateReceiptData(data: Partial<Receipt>): ValidationResult {
    const errors: ValidationError[] = [];
    
    if (!data.imageUri || data.imageUri.trim().length === 0) {
      errors.push({
        field: 'imageUri',
        message: 'Image URI is required',
        code: 'MISSING_IMAGE_URI',
        value: data.imageUri,
      });
    }

    if (data.amount && data.amount < 0) {
      errors.push({
        field: 'amount',
        message: 'Amount must be positive',
        code: 'INVALID_AMOUNT',
        value: data.amount,
      });
    }

    if (data.extractionConfidence && (data.extractionConfidence < 0 || data.extractionConfidence > 1)) {
      errors.push({
        field: 'extractionConfidence',
        message: 'Extraction confidence must be between 0 and 1',
        code: 'INVALID_CONFIDENCE',
        value: data.extractionConfidence,
      });
    }

    if (data.items && Array.isArray(data.items)) {
      data.items.forEach((item, index) => {
        if (!item.name || item.name.trim().length === 0) {
          errors.push({
            field: `items[${index}].name`,
            message: 'Item name is required',
            code: 'MISSING_ITEM_NAME',
            value: item.name,
          });
        }

        if (!item.price || item.price <= 0) {
          errors.push({
            field: `items[${index}].price`,
            message: 'Item price must be greater than 0',
            code: 'INVALID_ITEM_PRICE',
            value: item.price,
          });
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }
}

export default ReceiptStorage;