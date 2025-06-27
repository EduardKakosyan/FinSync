/**
 * Services Index for FinSync Financial App
 * Provides centralized access to all business logic services
 * Supports both enhanced and base service implementations
 */

// Core Services (Enhanced)
export { enhancedTransactionService as TransactionService } from './EnhancedTransactionService';
export { enhancedCategoryService as CategoryService } from './EnhancedCategoryService';
export { dataAggregationService as DataAggregationService } from './DataAggregationService';
export { validationService as ValidationService } from './ValidationService';
export { currencyService as CurrencyService } from './CurrencyService';
export { mockDataService as MockDataService } from './MockDataService';

// Base Services (Direct access for specific use cases)
export { transactionService as BaseTransactionService } from './storage/TransactionService';
export { categoryService as BaseCategoryService } from './storage/CategoryService';
export { default as AccountService } from './storage/AccountService';
export { default as ReceiptService } from './storage/ReceiptService';

// Service Types and Interfaces
export type {
  TransactionServiceOptions,
  TransactionSummary,
  QuickStats,
} from './EnhancedTransactionService';

export type {
  CategoryWithStats,
  CategoryAnalytics,
  ColorPalette,
} from './EnhancedCategoryService';

export type {
  TimePeriod,
  PeriodFilter,
  CategoryAnalytics as DataCategoryAnalytics,
  SpendingInsights,
} from './DataAggregationService';

export type {
  ValidationRules,
  BulkValidationResult,
} from './ValidationService';

export type {
  CurrencyPreferences,
  ExchangeRate,
  AmountDisplayOptions,
  BudgetDisplayInfo,
} from './CurrencyService';

// Utility Services
export { default as AsyncStorageWrapper } from './storage/AsyncStorageWrapper';
export { default as BaseDataService } from './storage/BaseDataService';

// Constants
export { STORAGE_KEYS } from './storage/StorageKeys';

/**
 * Service Manager - Orchestrates all services
 */
class ServiceManager {
  private static instance: ServiceManager;
  private initialized = false;

  private constructor() {}

  public static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  /**
   * Initialize all services with configuration
   */
  async initialize(config: {
    useMockData?: boolean;
    enableValidation?: boolean;
    enableCaching?: boolean;
    currency?: 'CAD' | 'USD';
  } = {}): Promise<{
    success: boolean;
    message: string;
    services: string[];
  }> {
    try {
      const {
        useMockData = false,
        enableValidation = true,
        enableCaching = true,
        currency = 'CAD',
      } = config;

      const initializedServices: string[] = [];

      // Initialize Enhanced Transaction Service
      const { enhancedTransactionService } = await import('./EnhancedTransactionService');
      enhancedTransactionService.initialize({
        useMockData,
        autoValidate: enableValidation,
        enableCaching,
      });
      initializedServices.push('EnhancedTransactionService');

      // Initialize Currency Service
      const { currencyService } = await import('./CurrencyService');
      currencyService.updatePreferences({
        primaryCurrency: currency,
      });
      initializedServices.push('CurrencyService');

      // Update exchange rates
      await currencyService.updateExchangeRates();
      initializedServices.push('CurrencyService.ExchangeRates');

      // Initialize mock data if requested
      if (useMockData) {
        await enhancedTransactionService.initializeMockData();
        initializedServices.push('MockDataService');
      }

      this.initialized = true;

      return {
        success: true,
        message: 'All services initialized successfully',
        services: initializedServices,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        services: [],
      };
    }
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    services: Array<{
      name: string;
      status: 'healthy' | 'degraded' | 'unhealthy';
      lastCheck: Date;
      message?: string;
    }>;
  }> {
    const services = [];
    let healthyCount = 0;

    // Check Transaction Service
    try {
      const { enhancedTransactionService } = await import('./EnhancedTransactionService');
      const config = enhancedTransactionService.getConfiguration();
      services.push({
        name: 'TransactionService',
        status: 'healthy' as const,
        lastCheck: new Date(),
        message: `Cache: ${config.enableCaching ? 'enabled' : 'disabled'}`,
      });
      healthyCount++;
    } catch (error) {
      services.push({
        name: 'TransactionService',
        status: 'unhealthy' as const,
        lastCheck: new Date(),
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Check Category Service
    try {
      const { enhancedCategoryService } = await import('./EnhancedCategoryService');
      services.push({
        name: 'CategoryService',
        status: 'healthy' as const,
        lastCheck: new Date(),
      });
      healthyCount++;
    } catch (error) {
      services.push({
        name: 'CategoryService',
        status: 'unhealthy' as const,
        lastCheck: new Date(),
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Check Currency Service
    try {
      const { currencyService } = await import('./CurrencyService');
      const rates = currencyService.getExchangeRates();
      services.push({
        name: 'CurrencyService',
        status: 'healthy' as const,
        lastCheck: new Date(),
        message: `Exchange rates: ${rates.length} available`,
      });
      healthyCount++;
    } catch (error) {
      services.push({
        name: 'CurrencyService',
        status: 'unhealthy' as const,
        lastCheck: new Date(),
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Check Data Aggregation Service
    try {
      const { dataAggregationService } = await import('./DataAggregationService');
      services.push({
        name: 'DataAggregationService',
        status: 'healthy' as const,
        lastCheck: new Date(),
      });
      healthyCount++;
    } catch (error) {
      services.push({
        name: 'DataAggregationService',
        status: 'unhealthy' as const,
        lastCheck: new Date(),
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Check Validation Service
    try {
      const { validationService } = await import('./ValidationService');
      services.push({
        name: 'ValidationService',
        status: 'healthy' as const,
        lastCheck: new Date(),
      });
      healthyCount++;
    } catch (error) {
      services.push({
        name: 'ValidationService',
        status: 'unhealthy' as const,
        lastCheck: new Date(),
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    const totalServices = services.length;
    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (healthyCount === 0) {
      overall = 'unhealthy';
    } else if (healthyCount < totalServices) {
      overall = 'degraded';
    }

    return {
      overall,
      services,
    };
  }

  /**
   * Reset all services and clear data
   */
  async reset(): Promise<{
    success: boolean;
    message: string;
    clearedServices: string[];
  }> {
    try {
      const clearedServices: string[] = [];

      // Clear transaction data
      const { enhancedTransactionService } = await import('./EnhancedTransactionService');
      await enhancedTransactionService.clearAllData();
      clearedServices.push('TransactionService');

      // Clear base service data
      const { transactionService } = await import('./storage/TransactionService');
      await transactionService.deleteAll();
      clearedServices.push('BaseTransactionService');

      const { categoryService } = await import('./storage/CategoryService');
      await categoryService.deleteAll();
      clearedServices.push('BaseCategoryService');

      this.initialized = false;

      return {
        success: true,
        message: 'All services reset successfully',
        clearedServices,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        clearedServices: [],
      };
    }
  }

  /**
   * Get configuration summary
   */
  async getConfiguration(): Promise<{
    transactionService: any;
    currencyService: any;
    initialized: boolean;
  }> {
    try {
      const { enhancedTransactionService } = await import('./EnhancedTransactionService');
      const { currencyService } = await import('./CurrencyService');

      return {
        transactionService: enhancedTransactionService.getConfiguration(),
        currencyService: currencyService.getPreferences(),
        initialized: this.initialized,
      };
    } catch (error) {
      return {
        transactionService: {},
        currencyService: {},
        initialized: false,
      };
    }
  }

  /**
   * Check if services are initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

export const serviceManager = ServiceManager.getInstance();

/**
 * Quick access to commonly used services
 */
export const Services = {
  // Primary services
  get transactions() {
    return require('./EnhancedTransactionService').enhancedTransactionService;
  },
  get categories() {
    return require('./EnhancedCategoryService').enhancedCategoryService;
  },
  get currency() {
    return require('./CurrencyService').currencyService;
  },
  get validation() {
    return require('./ValidationService').validationService;
  },
  get aggregation() {
    return require('./DataAggregationService').dataAggregationService;
  },
  get mockData() {
    return require('./MockDataService').mockDataService;
  },
  
  // Service manager
  get manager() {
    return serviceManager;
  },
};

/**
 * Initialize services with default configuration
 */
export const initializeServices = async (config?: {
  useMockData?: boolean;
  enableValidation?: boolean;
  enableCaching?: boolean;
  currency?: 'CAD' | 'USD';
}) => {
  return serviceManager.initialize(config);
};

/**
 * Quick setup for development with mock data
 */
export const initializeForDevelopment = async () => {
  return serviceManager.initialize({
    useMockData: true,
    enableValidation: true,
    enableCaching: true,
    currency: 'CAD',
  });
};

/**
 * Quick setup for production
 */
export const initializeForProduction = async () => {
  return serviceManager.initialize({
    useMockData: false,
    enableValidation: true,
    enableCaching: true,
    currency: 'CAD',
  });
};

// Default export
export default Services;