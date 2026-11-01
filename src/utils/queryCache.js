// src/utils/queryCache.js

class QueryCache {
  constructor(defaultTTL = 5 * 60 * 1000) { // Default cache: 5 menit
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  // Membuat key unik berdasarkan endpoint dan parameter query
  generateKey(prefix, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        if (params[key] !== undefined && params[key] !== '') {
          acc[key] = params[key];
        }
        return acc;
      }, {});
    return `${prefix}:${JSON.stringify(sortedParams)}`;
  }

  // Mengambil data dari cache jika masih valid (belum expired)
  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() > cached.expiry;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  // Menyimpan data ke dalam cache
  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
      timestamp: Date.now(),
    });
  }

  // Menghapus cache berdasarkan prefix (saat mutasi data)
  invalidate(prefix) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  // Menghapus seluruh cache
  clear() {
    this.cache.clear();
  }
}

export const queryCache = new QueryCache();
