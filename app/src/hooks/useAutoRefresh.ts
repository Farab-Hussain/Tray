import { useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

/**
 * Custom hook for auto-refreshing data when screen comes into focus
 * Also supports interval-based auto-refresh for real-time updates
 * @param refreshFunction - Function to call to refresh data
 * @param options - Configuration options
 * @returns void
 */
export const useAutoRefresh = (
  refreshFunction: () => void | Promise<void>,
  options: {
    enabled?: boolean;
    refreshOnFocus?: boolean;
    refreshInterval?: number; // in milliseconds
    debounceMs?: number; // debounce delay for refresh calls
  } = {}
) => {
  const {
    enabled = true,
    refreshOnFocus = true,
    refreshInterval,
    debounceMs = 500,
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Debounced refresh function
  const debouncedRefresh = useCallback(async () => {
    if (!enabled || !isMountedRef.current) return;

    // Clear existing debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Schedule refresh after debounce delay
    debounceRef.current = setTimeout(async () => {
      if (isMountedRef.current && enabled) {
        try {
          await refreshFunction();
        } catch (error) {
                    if (__DEV__) {
            console.error('Error in auto-refresh:', error)
          };
        }
      }
    }, debounceMs);
  }, [refreshFunction, enabled, debounceMs]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      if (!enabled || !refreshOnFocus) return;

      isMountedRef.current = true;
      debouncedRefresh();

      return () => {
        // Cleanup on blur (optional - you might want to keep refreshing)
      };
    }, [enabled, refreshOnFocus, debouncedRefresh])
  );

  // Interval-based refresh
  useEffect(() => {
    if (!enabled || !refreshInterval) {
      return;
    }

    intervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        debouncedRefresh();
      }
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, refreshInterval, debouncedRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return { refresh: debouncedRefresh };
};

