// ---------------------------------------------------------------------------
// queryCache.js — In-memory & sessionStorage client-side query caching.
// Provides instant cache hits and automatic TTL expiration.
// ---------------------------------------------------------------------------

class QueryCache {
  constructor() {
    this.memoryCache = new Map()
    this.prefix = 'bore_barrel_cache_'
  }

  /**
   * Generate storage key
   */
  _getKey(key) {
    return `${this.prefix}${key}`
  }

  /**
   * Retrieve item from cache if not expired.
   * @param {string} key
   * @returns {any|null}
   */
  get(key) {
    const now = Date.now()

    // 1. Check in-memory cache first
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key)
      if (entry.expiresAt > now) {
        return entry.data
      }
      this.memoryCache.delete(key)
    }

    // 2. Check sessionStorage fallback
    try {
      const raw = sessionStorage.getItem(this._getKey(key))
      if (raw) {
        const entry = JSON.parse(raw)
        if (entry.expiresAt > now) {
          // Re-populate in-memory cache for speed
          this.memoryCache.set(key, entry)
          return entry.data
        }
        sessionStorage.removeItem(this._getKey(key))
      }
    } catch {
      // sessionStorage unavailable
    }

    return null
  }

  /**
   * Set item in cache with a TTL (in milliseconds).
   * @param {string} key
   * @param {any} data
   * @param {number} ttlMs - Default 2 minutes (120,000ms)
   */
  set(key, data, ttlMs = 120000) {
    const entry = {
      data,
      expiresAt: Date.now() + ttlMs,
      cachedAt: Date.now(),
    }

    this.memoryCache.set(key, entry)

    try {
      sessionStorage.setItem(this._getKey(key), JSON.stringify(entry))
    } catch {
      // Storage full or unavailable
    }
  }

  /**
   * Invalidate specific key or keys matching a prefix pattern.
   * @param {string} pattern - Key or prefix, e.g. 'products' or 'reviews'
   */
  invalidate(pattern) {
    // Invalidate in memory
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key)
      }
    }

    // Invalidate in sessionStorage
    try {
      const storageKeys = Object.keys(sessionStorage)
      for (const k of storageKeys) {
        if (k.startsWith(this.prefix) && k.includes(pattern)) {
          sessionStorage.removeItem(k)
        }
      }
    } catch {
      // ignore
    }
  }

  /**
   * Invalidate all queries
   */
  clear() {
    this.memoryCache.clear()
    try {
      const storageKeys = Object.keys(sessionStorage)
      for (const k of storageKeys) {
        if (k.startsWith(this.prefix)) {
          sessionStorage.removeItem(k)
        }
      }
    } catch {
      // ignore
    }
  }
}

export const queryCache = new QueryCache()
export default queryCache
