/**
 * Base Data Service for FinSync Financial App
 * Provides common CRUD operations with validation and error handling
 */

import AsyncStorageWrapper, { StorageError } from './AsyncStorageWrapper';
import { STORAGE_KEYS, DEFAULT_STORAGE_OPTIONS, StorageKeyUtils } from './StorageKeys';
import {
  ValidationResult,
  ValidationError,
  EntityType,
  SearchQuery,
  SearchResult,
  PaginationInfo,
} from '../../types';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface DataServiceOptions {
  enableValidation?: boolean;
  enableCaching?: boolean;
  cacheExpiryMs?: number;
  enableEvents?: boolean;
}

export abstract class BaseDataService<T extends BaseEntity> {
  protected storageKey: string;
  protected entityType: EntityType;
  protected options: DataServiceOptions;
  protected cache: Map<string, { data: T; timestamp: number }> = new Map();

  constructor(
    storageKey: string,
    entityType: EntityType,
    options: DataServiceOptions = {}
  ) {
    this.storageKey = storageKey;
    this.entityType = entityType;
    this.options = {
      enableValidation: true,
      enableCaching: true,
      cacheExpiryMs: 5 * 60 * 1000, // 5 minutes
      enableEvents: true,
      ...options,
    };
  }

  /**
   * Abstract methods to be implemented by concrete services
   */
  protected abstract validateEntity(entity: Partial<T>): ValidationResult;
  protected abstract transformForStorage(entity: T): any;
  protected abstract transformFromStorage(data: any): T;

  /**
   * Generate a unique ID for new entities
   */
  protected generateId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${this.entityType}_${timestamp}_${random}`;
  }

  /**
   * Create a new entity
   */
  async create(entityData: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    try {
      const now = new Date();
      const entity: T = {
        ...entityData,
        id: this.generateId(),
        createdAt: now,
        updatedAt: now,
      } as T;

      // Validate entity
      if (this.options.enableValidation) {
        const validation = this.validateEntity(entity);
        if (!validation.isValid) {
          throw new StorageError(
            `Validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
            'VALIDATION_ERROR'
          );
        }
      }

      // Get existing entities
      const entities = await this.getAll();
      
      // Add new entity
      entities.push(entity);

      // Save to storage
      await this.saveAll(entities);

      // Update cache
      if (this.options.enableCaching) {
        this.cache.set(entity.id, { data: entity, timestamp: Date.now() });
      }

      // Emit event
      if (this.options.enableEvents) {
        this.emitEvent('created', entity);
      }

      return entity;
    } catch (error) {
      throw new StorageError(
        `Failed to create ${this.entityType}`,
        'CREATE_ERROR',
        undefined,
        error as Error
      );
    }
  }

  /**
   * Get entity by ID
   */
  async getById(id: string): Promise<T | null> {
    try {
      // Check cache first
      if (this.options.enableCaching) {
        const cached = this.cache.get(id);
        if (cached && Date.now() - cached.timestamp < (this.options.cacheExpiryMs || 0)) {
          return cached.data;
        }
      }

      const entities = await this.getAll();
      const entity = entities.find(e => e.id === id) || null;

      // Update cache
      if (entity && this.options.enableCaching) {
        this.cache.set(id, { data: entity, timestamp: Date.now() });
      }

      return entity;
    } catch (error) {
      throw new StorageError(
        `Failed to get ${this.entityType} by ID: ${id}`,
        'GET_ERROR',
        id,
        error as Error
      );
    }
  }

  /**
   * Get all entities
   */
  async getAll(): Promise<T[]> {
    try {
      const data = await AsyncStorageWrapper.getItem<T[]>(this.storageKey);
      if (!data) {
        return [];
      }

      // Transform data from storage format
      return data.map(item => this.transformFromStorage(item));
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError(
        `Failed to get all ${this.entityType}s`,
        'GET_ALL_ERROR',
        this.storageKey,
        error as Error
      );
    }
  }

  /**
   * Update entity
   */
  async update(id: string, updates: Partial<T>): Promise<T> {
    try {
      const entities = await this.getAll();
      const index = entities.findIndex(e => e.id === id);

      if (index === -1) {
        throw new StorageError(
          `${this.entityType} not found`,
          'NOT_FOUND',
          id
        );
      }

      const existingEntity = entities[index];
      const updatedEntity: T = {
        ...existingEntity,
        ...updates,
        id, // Ensure ID doesn't change
        updatedAt: new Date(),
      };

      // Validate updated entity
      if (this.options.enableValidation) {
        const validation = this.validateEntity(updatedEntity);
        if (!validation.isValid) {
          throw new StorageError(
            `Validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
            'VALIDATION_ERROR',
            id
          );
        }
      }

      // Update in array
      entities[index] = updatedEntity;

      // Save to storage
      await this.saveAll(entities);

      // Update cache
      if (this.options.enableCaching) {
        this.cache.set(id, { data: updatedEntity, timestamp: Date.now() });
      }

      // Emit event
      if (this.options.enableEvents) {
        this.emitEvent('updated', updatedEntity);
      }

      return updatedEntity;
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError(
        `Failed to update ${this.entityType}`,
        'UPDATE_ERROR',
        id,
        error as Error
      );
    }
  }

  /**
   * Delete entity
   */
  async delete(id: string): Promise<boolean> {
    try {
      const entities = await this.getAll();
      const index = entities.findIndex(e => e.id === id);

      if (index === -1) {
        return false;
      }

      const deletedEntity = entities[index];
      entities.splice(index, 1);

      // Save to storage
      await this.saveAll(entities);

      // Remove from cache
      if (this.options.enableCaching) {
        this.cache.delete(id);
      }

      // Emit event
      if (this.options.enableEvents) {
        this.emitEvent('deleted', deletedEntity);
      }

      return true;
    } catch (error) {
      throw new StorageError(
        `Failed to delete ${this.entityType}`,
        'DELETE_ERROR',
        id,
        error as Error
      );
    }
  }

  /**
   * Delete multiple entities
   */
  async deleteMany(ids: string[]): Promise<{ deleted: number; failed: string[] }> {
    const failed: string[] = [];
    let deleted = 0;

    for (const id of ids) {
      try {
        const success = await this.delete(id);
        if (success) {
          deleted++;
        } else {
          failed.push(id);
        }
      } catch (error) {
        failed.push(id);
      }
    }

    return { deleted, failed };
  }

  /**
   * Count entities
   */
  async count(): Promise<number> {
    try {
      const entities = await this.getAll();
      return entities.length;
    } catch (error) {
      throw new StorageError(
        `Failed to count ${this.entityType}s`,
        'COUNT_ERROR',
        this.storageKey,
        error as Error
      );
    }
  }

  /**
   * Check if entity exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const entity = await this.getById(id);
      return entity !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Search entities with query
   */
  async search(query: SearchQuery): Promise<SearchResult<T>> {
    try {
      const startTime = Date.now();
      let entities = await this.getAll();

      // Apply filters
      if (query.text) {
        entities = this.filterByText(entities, query.text);
      }

      if (query.dateRange) {
        entities = this.filterByDateRange(entities, query.dateRange);
      }

      // Apply sorting
      if (query.sortBy) {
        entities = this.sortEntities(entities, query.sortBy, query.sortOrder || 'desc');
      }

      // Apply pagination
      const totalCount = entities.length;
      const offset = query.offset || 0;
      const limit = query.limit || 50;
      const paginatedEntities = entities.slice(offset, offset + limit);

      const executionTime = Date.now() - startTime;

      return {
        items: paginatedEntities,
        totalCount,
        hasMore: offset + limit < totalCount,
        query,
        executedAt: new Date(),
        executionTime,
      };
    } catch (error) {
      throw new StorageError(
        `Failed to search ${this.entityType}s`,
        'SEARCH_ERROR',
        undefined,
        error as Error
      );
    }
  }

  /**
   * Clear all entities (use with caution)
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorageWrapper.removeItem(this.storageKey);
      this.cache.clear();

      if (this.options.enableEvents) {
        this.emitEvent('cleared', null);
      }
    } catch (error) {
      throw new StorageError(
        `Failed to clear ${this.entityType}s`,
        'CLEAR_ERROR',
        this.storageKey,
        error as Error
      );
    }
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    count: number;
    size: number;
    oldestEntity?: T;
    newestEntity?: T;
  }> {
    try {
      const entities = await this.getAll();
      const rawData = await AsyncStorageWrapper.getItem(this.storageKey);
      const size = rawData ? JSON.stringify(rawData).length : 0;

      let oldestEntity: T | undefined;
      let newestEntity: T | undefined;

      if (entities.length > 0) {
        oldestEntity = entities.reduce((oldest, current) => 
          current.createdAt < oldest.createdAt ? current : oldest
        );
        newestEntity = entities.reduce((newest, current) => 
          current.createdAt > newest.createdAt ? current : newest
        );
      }

      return {
        count: entities.length,
        size,
        oldestEntity,
        newestEntity,
      };
    } catch (error) {
      throw new StorageError(
        `Failed to get ${this.entityType} statistics`,
        'STATS_ERROR',
        this.storageKey,
        error as Error
      );
    }
  }

  /**
   * Protected helper methods
   */
  protected async saveAll(entities: T[]): Promise<void> {
    const transformedData = entities.map(entity => this.transformForStorage(entity));
    await AsyncStorageWrapper.setItem(
      this.storageKey,
      transformedData,
      DEFAULT_STORAGE_OPTIONS.CORE_DATA
    );
  }

  protected filterByText(entities: T[], text: string): T[] {
    // Default implementation - override in concrete classes
    return entities;
  }

  protected filterByDateRange(entities: T[], dateRange: any): T[] {
    // Default implementation - override in concrete classes
    return entities;
  }

  protected sortEntities(entities: T[], sortBy: string, sortOrder: 'asc' | 'desc'): T[] {
    return entities.sort((a, b) => {
      const aValue = (a as any)[sortBy];
      const bValue = (b as any)[sortBy];

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  protected emitEvent(event: string, data: T | null): void {
    // Emit storage events - can be enhanced with EventEmitter
    console.log(`[${this.entityType}] ${event}:`, data?.id || 'all');
  }

  /**
   * Cache management
   */
  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; hitRate: number } {
    // Simple cache statistics
    return {
      size: this.cache.size,
      hitRate: 0, // Could track hit/miss ratio
    };
  }
}

export default BaseDataService;