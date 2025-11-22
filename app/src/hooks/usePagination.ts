import { useState, useCallback } from 'react';

/**
 * Custom hook for handling pagination with infinite scroll
 * @param fetchData - Function to fetch data (receives page number, returns { data, pagination })
 * @param initialPage - Initial page number (default: 1)
 * @param pageSize - Number of items per page (default: 20)
 * @returns Object with pagination state and handlers
 */
export const usePagination = <T = any>(
  fetchData: (page: number, pageSize: number) => Promise<{ data: T[]; pagination?: { hasNextPage?: boolean; total?: number } }>,
  initialPage: number = 1,
  pageSize: number = 20
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(async (pageNum: number, reset: boolean = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const response = await fetchData(pageNum, pageSize);
      const newData = response.data || [];
      const pagination = response.pagination;

      if (reset) {
        setData(newData);
      } else {
        setData(prev => [...prev, ...newData]);
      }

      setHasMore(pagination?.hasNextPage ?? (newData.length >= pageSize));
      setPage(pageNum);
    } catch (err: any) {
      console.error('Error loading page:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [fetchData, pageSize]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      loadPage(nextPage, false);
    }
  }, [loadingMore, hasMore, page, loadPage]);

  const refresh = useCallback(async () => {
    setPage(initialPage);
    setHasMore(true);
    await loadPage(initialPage, true);
  }, [initialPage, loadPage]);

  const reset = useCallback(() => {
    setData([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
  }, [initialPage]);

  return {
    data,
    loading,
    loadingMore,
    hasMore,
    error,
    page,
    loadPage,
    loadMore,
    refresh,
    reset,
    setData, // Allow manual data updates
  };
};

