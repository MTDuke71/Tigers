// Cache service using IndexedDB for storing API responses
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class CacheService {
  private static dbName = 'TigersRosterCache';
  private static dbVersion = 1;
  private static storeName = 'apiCache';

  // Cache durations in milliseconds
  private static readonly CACHE_DURATIONS = {
    roster: 30 * 60 * 1000,      // 30 minutes for roster data
    transactions: 60 * 60 * 1000, // 1 hour for transaction data
    playerHistory: 15 * 60 * 1000, // 15 minutes for player history
  };

  private static async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('expiresAt', 'expiresAt');
        }
      };
    });
  }

  static async set<T>(
    key: string, 
    data: T, 
    cacheType: keyof typeof this.CACHE_DURATIONS = 'roster'
  ): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const now = Date.now();
      const cacheEntry: CacheEntry<T> & { key: string } = {
        key,
        data,
        timestamp: now,
        expiresAt: now + this.CACHE_DURATIONS[cacheType]
      };
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put(cacheEntry);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
      
      console.log(`Cached data for key: ${key}, expires in ${this.CACHE_DURATIONS[cacheType] / 1000}s`);
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  static async get<T>(key: string): Promise<T | null> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      const result = await new Promise<CacheEntry<T> & { key: string } | undefined>((resolve, reject) => {
        const request = store.get(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
      
      if (!result) {
        console.log(`Cache miss for key: ${key}`);
        return null;
      }
      
      const now = Date.now();
      if (now > result.expiresAt) {
        console.log(`Cache expired for key: ${key}`);
        await this.delete(key);
        return null;
      }
      
      console.log(`Cache hit for key: ${key}`);
      return result.data;
    } catch (error) {
      console.warn('Failed to get cached data:', error);
      return null;
    }
  }

  static async delete(key: string): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.warn('Failed to delete cached data:', error);
    }
  }

  static async clearExpired(): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('expiresAt');
      
      const now = Date.now();
      const range = IDBKeyRange.upperBound(now);
      
      await new Promise<void>((resolve, reject) => {
        const request = index.openCursor(range);
        request.onerror = () => reject(request.error);
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };
      });
      
      console.log('Cleared expired cache entries');
    } catch (error) {
      console.warn('Failed to clear expired cache:', error);
    }
  }

  static async clearAll(): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
      
      console.log('Cleared all cache entries');
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  static generateRosterKey(date: string): string {
    return `roster_${date}`;
  }

  static generateTransactionsKey(startDate: string, endDate: string, playerId?: number): string {
    const playerSuffix = playerId ? `_player_${playerId}` : '';
    return `transactions_${startDate}_${endDate}${playerSuffix}`;
  }

  static generatePlayerHistoryKey(playerId: number, startDate: string, endDate: string): string {
    return `player_history_${playerId}_${startDate}_${endDate}`;
  }

  // Initialize cache service and clear expired entries
  static async initialize(): Promise<void> {
    try {
      await this.clearExpired();
      console.log('Cache service initialized');
    } catch (error) {
      console.warn('Failed to initialize cache service:', error);
    }
  }
}
