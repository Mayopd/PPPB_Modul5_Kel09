// src/hooks/useGuns.js
import { useState, useEffect, useCallback } from 'react';
import { gunService } from '../services/gunService';
import { queryCache } from '../utils/queryCache';

export function useGuns(params = {}) {
  const [guns, setGuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const cacheKey = queryCache.generateKey('guns_list', params);

  const fetchGuns = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // 1. Cek apakah data tersedia di cache dan tidak dipaksa refresh
      if (!forceRefresh) {
        const cachedData = queryCache.get(cacheKey);
        if (cachedData) {
          setGuns(cachedData.data || cachedData);
          if (cachedData.pagination) setPagination(cachedData.pagination);
          setLoading(false);
          return;
        }
      }

      // 2. Jika tidak ada di cache, fetch dari API
      const response = await gunService.getGuns(params);

      // 3. Simpan hasil response ke dalam cache
      queryCache.set(cacheKey, response);

      setGuns(response.data || response);
      if (response.pagination) setPagination(response.pagination);
    } catch (err) {
      setError(err.message || 'Gagal memuat data senjata');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  useEffect(() => {
    fetchGuns();
  }, [fetchGuns]);

  // Memaksa ambil ulang dari server & menghapus cache lama
  const refetch = () => {
    queryCache.invalidate('guns_list');
    fetchGuns(true);
  };

  return { guns, loading, error, pagination, refetch };
}

export function useGunDetail(id) {
  const [gun, setGun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cacheKey = `gun_detail:${id}`;

  const fetchGunDetail = useCallback(async (forceRefresh = false) => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);

      if (!forceRefresh) {
        const cachedGun = queryCache.get(cacheKey);
        if (cachedGun) {
          setGun(cachedGun);
          setLoading(false);
          return;
        }
      }

      const data = await gunService.getGunById(id);
      queryCache.set(cacheKey, data);
      setGun(data);
    } catch (err) {
      setError(err.message || 'Gagal memuat detail senjata');
    } finally {
      setLoading(false);
    }
  }, [id, cacheKey]);

  useEffect(() => {
    fetchGunDetail();
  }, [fetchGunDetail]);

  return { gun, loading, error, refetch: () => fetchGunDetail(true) };
}
