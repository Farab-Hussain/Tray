import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { API_URL } from '@env';

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  checkConnection: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

interface NetworkProviderProps {
  children: ReactNode;
}

/**
 * iOS NetInfo often reports isInternetReachable=false right after install / on
 * cellular even when the API is reachable. Only treat the device as offline when
 * there is no network interface, or when a live API probe fails.
 */
async function probeApiReachable(timeoutMs = 5000): Promise<boolean> {
  const base = (API_URL || '').replace(/\/$/, '');
  if (!base || !base.startsWith('http')) {
    return true;
  }

  const withTimeout = async (url: string): Promise<boolean> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });
      return response.ok || response.status === 204;
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    return await withTimeout(`${base}/health`);
  } catch {
    try {
      return await withTimeout('https://clients3.google.com/generate_204');
    } catch {
      return false;
    }
  }
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  // Optimistic default — avoid flashing the offline screen on cold start
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(
    true,
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const probingRef = useRef(false);

  const applyOnline = useCallback((online: boolean, reachable: boolean | null) => {
    setIsConnected(online);
    setIsInternetReachable(reachable);
  }, []);

  const evaluateState = useCallback(
    async (state: NetInfoState) => {
      const hasInterface = state.isConnected ?? false;

      // No Wi‑Fi / cellular at all → definitely offline
      if (!hasInterface) {
        applyOnline(false, false);
        return;
      }

      // Interface is up. NetInfo's isInternetReachable is unreliable on iOS —
      // only probe when it explicitly says false.
      if (state.isInternetReachable === false) {
        if (probingRef.current) return;
        probingRef.current = true;
        try {
          const reachable = await probeApiReachable();
          applyOnline(reachable, reachable);
        } finally {
          probingRef.current = false;
        }
        return;
      }

      // Connected + reachable (true or null/unknown) → stay online
      applyOnline(true, state.isInternetReachable ?? true);
    },
    [applyOnline],
  );

  const checkConnection = useCallback(async () => {
    try {
      const state = await NetInfo.fetch();
      await evaluateState(state);

      if (__DEV__) {
        console.log('🌐 [Network] Connection status:', {
          isConnected: state.isConnected,
          isInternetReachable: state.isInternetReachable,
          type: state.type,
        });
      }
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [Network] Error checking connection:', error);
      }
      // Last resort: probe API before declaring offline
      const reachable = await probeApiReachable();
      applyOnline(reachable, reachable);
    }
  }, [evaluateState, applyOnline]);

  useEffect(() => {
    checkConnection();

    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      // Debounce flapping (common right after install / airplane mode toggle)
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        evaluateState(state).catch(() => undefined);
        if (__DEV__) {
          console.log('🌐 [Network] Connection changed:', {
            isConnected: state.isConnected,
            isInternetReachable: state.isInternetReachable,
            type: state.type,
          });
        }
      }, 600);
    });

    return () => {
      unsubscribe();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [checkConnection, evaluateState]);

  return (
    <NetworkContext.Provider
      value={{
        // Expose interface connectivity; overlay uses this directly.
        // Do NOT AND with isInternetReachable — that caused false offline screens.
        isConnected,
        isInternetReachable,
        checkConnection,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};
