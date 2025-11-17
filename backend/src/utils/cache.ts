// src/utils/cache.ts
/**
 * Simple in-memory cache with TTL (Time To Live) and max size limit
 * Used to cache frequently accessed data like user profiles
 * Prevents unbounded memory growth with LRU eviction when max size is reached
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  lastAccessed: number; // For LRU eviction
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes default
  private maxSize: number = 1000; // Maximum number of entries
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
    this.startCleanupInterval();
  }

  /**
   * Get value from cache if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update last accessed time for LRU
    entry.lastAccessed = now;
    return entry.data as T;
  }

  /**
   * Set value in cache with optional TTL
   * Automatically evicts oldest entries if max size is reached
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    
    // If cache is at max size and key doesn't exist, evict oldest entry
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data: value,
      timestamp: now,
      lastAccessed: now,
      ttl: ttl || this.defaultTTL,
    });
  }

  /**
   * Delete a specific key from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Evict the least recently used entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime: number = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clear all expired entries
   * @returns Number of entries cleared
   */
  clearExpired(): number {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    return keysToDelete.length;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get max size
   */
  getMaxSize(): number {
    return this.maxSize;
  }

  /**
   * Set max size and evict if necessary
   */
  setMaxSize(maxSize: number): void {
    this.maxSize = maxSize;
    while (this.cache.size > this.maxSize) {
      this.evictOldest();
    }
  }

  /**
   * Start automatic cleanup interval
   */
  private startCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const cleared = this.clearExpired();
      if (cleared > 0) {
        console.log(`🧹 [Cache] Cleaned up ${cleared} expired entries. Current size: ${this.cache.size}/${this.maxSize}`);
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Stop cleanup interval (useful for testing or shutdown)
   */
  stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let totalSize = 0;

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredCount++;
      }
      // Rough estimate of entry size (in bytes)
      totalSize += JSON.stringify(entry.data).length;
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expiredCount,
      utilizationPercent: Math.round((this.cache.size / this.maxSize) * 100),
      estimatedMemoryMB: Math.round(totalSize / 1024 / 1024 * 100) / 100,
    };
  }
}

// Export singleton instance with max size of 1000 entries
export const cache = new SimpleCache(1000);

// Graceful shutdown - cleanup on process exit
if (typeof process !== 'undefined') {
  const shutdown = () => {
    cache.stopCleanupInterval();
    cache.clear();
    console.log('🧹 [Cache] Cleaned up on shutdown');
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  process.on('exit', shutdown);
}

