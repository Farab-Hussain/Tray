import { useState, useCallback } from 'react';

/**
 * Custom hook for handling pull-to-refresh functionality
 * @param fetchData - Function to fetch data (should handle loading state internally)
 * @returns Object with refreshing state and handleRefresh function
 */
export const useRefresh = (fetchData: () => void | Promise<void>) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

  return { refreshing, handleRefresh };
};

