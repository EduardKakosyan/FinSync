/**
 * Receipt Data Service for FinSync Financial App
 * Handles CRUD operations for receipt data and metadata
 */

import BaseDataService from './BaseDataService';
import { STORAGE_KEYS } from './StorageKeys';
import {
  Receipt,
  ReceiptItem,
  ValidationResult,
  ValidationError,
  DateRange,
} from '../../types';
import { isWithinInterval } from 'date-fns';

export class ReceiptService extends BaseDataService<Receipt> {
  constructor() {
    super(STORAGE_KEYS.RECEIPTS, 'receipt');
  }

  /**
   * Validate receipt data
   */
  protected validateEntity(receipt: Partial<Receipt>): ValidationResult {
    const errors: ValidationError[] = [];

    // Required fields validation
    if (!receipt.imageUri || receipt.imageUri.trim().length === 0) {
      errors.push({
        field: 'imageUri',
        message: 'Receipt image URI is required',
        code: 'REQUIRED',
        value: receipt.imageUri,
      });
    }

    // Validate OCR extraction confidence
    if (receipt.extractionConfidence !== undefined) {
      if (receipt.extractionConfidence < 0 || receipt.extractionConfidence > 1) {
        errors.push({
          field: 'extractionConfidence',
          message: 'Extraction confidence must be between 0 and 1',
          code: 'INVALID_RANGE',
          value: receipt.extractionConfidence,
        });
      }
    }

    // Validate amount if present
    if (receipt.amount !== undefined && receipt.amount <= 0) {
      errors.push({
        field: 'amount',
        message: 'Amount must be greater than 0',
        code: 'MIN_VALUE',
        value: receipt.amount,
      });
    }

    // Validate date if present
    if (receipt.date && receipt.date > new Date()) {
      errors.push({
        field: 'date',
        message: 'Receipt date cannot be in the future',
        code: 'INVALID_DATE',
        value: receipt.date,
      });
    }

    // Validate receipt items
    if (receipt.items) {
      receipt.items.forEach((item, index) => {
        if (!item.name || item.name.trim().length === 0) {
          errors.push({
            field: `items[${index}].name`,
            message: 'Receipt item name is required',
            code: 'REQUIRED',
            value: item.name,
          });
        }

        if (item.price <= 0) {
          errors.push({
            field: `items[${index}].price`,
            message: 'Receipt item price must be greater than 0',
            code: 'MIN_VALUE',
            value: item.price,
          });
        }

        if (item.quantity !== undefined && item.quantity <= 0) {
          errors.push({
            field: `items[${index}].quantity`,
            message: 'Receipt item quantity must be greater than 0',
            code: 'MIN_VALUE',
            value: item.quantity,
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

  /**
   * Transform receipt for storage
   */
  protected transformForStorage(receipt: Receipt): any {
    return {
      ...receipt,
      date: receipt.date?.toISOString(),
      createdAt: receipt.createdAt.toISOString(),
    };
  }

  /**
   * Transform receipt from storage
   */
  protected transformFromStorage(data: any): Receipt {
    return {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
      createdAt: new Date(data.createdAt),
    };
  }

  /**
   * Get receipts by date range
   */
  async getByDateRange(startDate: Date, endDate: Date): Promise<Receipt[]> {
    const receipts = await this.getAll();
    return receipts.filter(receipt =>
      receipt.date && isWithinInterval(receipt.date, { start: startDate, end: endDate })
    );
  }

  /**
   * Get receipts by merchant
   */
  async getByMerchant(merchantName: string): Promise<Receipt[]> {
    const receipts = await this.getAll();
    return receipts.filter(receipt =>
      receipt.merchantName?.toLowerCase().includes(merchantName.toLowerCase())
    );
  }

  /**
   * Get receipts linked to transactions
   */
  async getLinkedReceipts(): Promise<Receipt[]> {
    const receipts = await this.getAll();
    return receipts.filter(receipt => receipt.transactionId);
  }

  /**
   * Get unlinked receipts (not associated with transactions)
   */
  async getUnlinkedReceipts(): Promise<Receipt[]> {
    const receipts = await this.getAll();
    return receipts.filter(receipt => !receipt.transactionId);
  }

  /**
   * Get receipts by transaction ID
   */
  async getByTransactionId(transactionId: string): Promise<Receipt[]> {
    const receipts = await this.getAll();
    return receipts.filter(receipt => receipt.transactionId === transactionId);
  }

  /**
   * Get receipts with OCR text
   */
  async getReceiptsWithOCR(): Promise<Receipt[]> {
    const receipts = await this.getAll();
    return receipts.filter(receipt => receipt.ocrText);
  }

  /**
   * Get receipts without OCR text (need processing)
   */
  async getReceiptsWithoutOCR(): Promise<Receipt[]> {
    const receipts = await this.getAll();
    return receipts.filter(receipt => !receipt.ocrText);
  }

  /**
   * Get receipts with low extraction confidence
   */
  async getLowConfidenceReceipts(threshold: number = 0.7): Promise<Receipt[]> {
    const receipts = await this.getAll();
    return receipts.filter(receipt =>
      receipt.extractionConfidence !== undefined &&
      receipt.extractionConfidence < threshold
    );
  }

  /**
   * Get receipts with high extraction confidence
   */
  async getHighConfidenceReceipts(threshold: number = 0.9): Promise<Receipt[]> {
    const receipts = await this.getAll();
    return receipts.filter(receipt =>
      receipt.extractionConfidence !== undefined &&
      receipt.extractionConfidence >= threshold
    );
  }

  /**
   * Update receipt with OCR results
   */
  async updateWithOCR(
    receiptId: string,
    ocrData: {
      ocrText: string;
      extractionConfidence?: number;
      merchantName?: string;
      amount?: number;
      date?: Date;
      items?: ReceiptItem[];
    }
  ): Promise<Receipt> {
    return this.update(receiptId, ocrData);
  }

  /**
   * Link receipt to transaction
   */
  async linkToTransaction(receiptId: string, transactionId: string): Promise<Receipt> {
    return this.update(receiptId, { transactionId });
  }

  /**
   * Unlink receipt from transaction
   */
  async unlinkFromTransaction(receiptId: string): Promise<Receipt> {
    return this.update(receiptId, { transactionId: undefined });
  }

  /**
   * Get receipt statistics
   */
  async getReceiptStats(): Promise<{
    totalReceipts: number;
    linkedReceipts: number;
    unlinkedReceipts: number;
    receiptsWithOCR: number;
    receiptsWithoutOCR: number;
    averageConfidence: number;
    totalAmount: number;
    uniqueMerchants: number;
  }> {
    const receipts = await this.getAll();

    const linkedCount = receipts.filter(r => r.transactionId).length;
    const withOCRCount = receipts.filter(r => r.ocrText).length;
    const withConfidence = receipts.filter(r => r.extractionConfidence !== undefined);
    const averageConfidence = withConfidence.length > 0
      ? withConfidence.reduce((sum, r) => sum + (r.extractionConfidence || 0), 0) / withConfidence.length
      : 0;

    const totalAmount = receipts
      .filter(r => r.amount)
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    const uniqueMerchants = new Set(
      receipts
        .filter(r => r.merchantName)
        .map(r => r.merchantName!.toLowerCase())
    ).size;

    return {
      totalReceipts: receipts.length,
      linkedReceipts: linkedCount,
      unlinkedReceipts: receipts.length - linkedCount,
      receiptsWithOCR: withOCRCount,
      receiptsWithoutOCR: receipts.length - withOCRCount,
      averageConfidence,
      totalAmount,
      uniqueMerchants,
    };
  }

  /**
   * Get merchant names for autocomplete
   */
  async getMerchantNames(): Promise<string[]> {
    const receipts = await this.getAll();
    const merchantNames = receipts
      .filter(receipt => receipt.merchantName)
      .map(receipt => receipt.merchantName!)
      .filter((name, index, array) => array.indexOf(name) === index) // Remove duplicates
      .sort();

    return merchantNames;
  }

  /**
   * Search receipts by text (OCR content, merchant name, items)
   */
  protected filterByText(receipts: Receipt[], text: string): Receipt[] {
    const searchTerm = text.toLowerCase();
    return receipts.filter(receipt => {
      // Search in OCR text
      if (receipt.ocrText?.toLowerCase().includes(searchTerm)) {
        return true;
      }

      // Search in merchant name
      if (receipt.merchantName?.toLowerCase().includes(searchTerm)) {
        return true;
      }

      // Search in receipt items
      if (receipt.items?.some(item => 
        item.name.toLowerCase().includes(searchTerm)
      )) {
        return true;
      }

      // Search in amount
      if (receipt.amount?.toString().includes(searchTerm)) {
        return true;
      }

      return false;
    });
  }

  /**
   * Enhanced date range filtering
   */
  protected filterByDateRange(receipts: Receipt[], dateRange: DateRange): Receipt[] {
    return receipts.filter(receipt =>
      receipt.date && isWithinInterval(receipt.date, {
        start: dateRange.startDate,
        end: dateRange.endDate,
      })
    );
  }

  /**
   * Get receipts requiring review (low confidence or missing data)
   */
  async getReceiptsRequiringReview(): Promise<Receipt[]> {
    const receipts = await this.getAll();
    return receipts.filter(receipt => {
      // Low confidence
      if (receipt.extractionConfidence !== undefined && receipt.extractionConfidence < 0.8) {
        return true;
      }

      // Missing key information
      if (!receipt.merchantName || !receipt.amount || !receipt.date) {
        return true;
      }

      return false;
    });
  }

  /**
   * Get receipts by amount range
   */
  async getByAmountRange(minAmount: number, maxAmount: number): Promise<Receipt[]> {
    const receipts = await this.getAll();
    return receipts.filter(receipt =>
      receipt.amount !== undefined &&
      receipt.amount >= minAmount &&
      receipt.amount <= maxAmount
    );
  }

  /**
   * Clean up old receipts (remove image files from storage)
   */
  async cleanupOldReceipts(daysOld: number): Promise<{
    deletedCount: number;
    errors: string[];
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const receipts = await this.getAll();
    const oldReceipts = receipts.filter(receipt =>
      receipt.createdAt < cutoffDate
    );

    const errors: string[] = [];
    let deletedCount = 0;

    for (const receipt of oldReceipts) {
      try {
        await this.delete(receipt.id);
        deletedCount++;
      } catch (error) {
        errors.push(`Failed to delete receipt ${receipt.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { deletedCount, errors };
  }

  /**
   * Validate receipt image URI
   */
  async validateImageUri(imageUri: string): Promise<boolean> {
    try {
      // Basic URI validation
      if (!imageUri || imageUri.trim().length === 0) {
        return false;
      }

      // Check if it's a valid URI format
      const uriPattern = /^(file:\/\/|content:\/\/|https?:\/\/)/;
      return uriPattern.test(imageUri);
    } catch (error) {
      return false;
    }
  }

  /**
   * Update receipt validation status
   */
  async markAsValidated(receiptId: string): Promise<Receipt> {
    // Add a custom field to track validation status
    const receipt = await this.getById(receiptId);
    if (!receipt) {
      throw new Error(`Receipt not found: ${receiptId}`);
    }

    // You might want to add a 'validated' field to the Receipt interface
    return this.update(receiptId, { 
      extractionConfidence: 1.0 // Mark as fully validated
    });
  }

  /**
   * Bulk update receipts with OCR results
   */
  async bulkUpdateWithOCR(
    updates: Array<{
      receiptId: string;
      ocrData: {
        ocrText: string;
        extractionConfidence?: number;
        merchantName?: string;
        amount?: number;
        date?: Date;
        items?: ReceiptItem[];
      };
    }>
  ): Promise<{ updated: number; failed: number; errors: string[] }> {
    const results = { updated: 0, failed: 0, errors: [] as string[] };

    for (const update of updates) {
      try {
        await this.updateWithOCR(update.receiptId, update.ocrData);
        results.updated++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to update receipt ${update.receiptId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }
}

// Singleton instance
export const receiptService = new ReceiptService();
export default receiptService;