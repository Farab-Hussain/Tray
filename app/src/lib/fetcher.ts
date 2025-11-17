import { API_URL } from "@env"
import axios, { InternalAxiosRequestConfig } from "axios"
import { auth } from "./firebase"
import { handleApiError } from "../utils/toast"

// Module-level variable to track backend unavailable logging
let backendUnavailableLogged = false;

// Get API URL from environment, with fallback
const baseURL = API_URL || 'http://localhost:4000';

// Helper function to detect ngrok errors (HTML error pages)
export const isNgrokError = (error: any): boolean => {
  if (!error?.response?.data) return false;
  
  const responseData = error.response.data;
  
  // Check if response is HTML (ngrok error pages are HTML)
  if (typeof responseData === 'string') {
    return responseData.includes('<!DOCTYPE html>') && 
           (responseData.includes('ngrok') || 
            responseData.includes('ERR_NGROK_8012') ||
            responseData.includes('dial tcp') ||
            responseData.includes('connection refused'));
  }
  
  // Check if it's an object that might contain HTML
  if (typeof responseData === 'object') {
    const dataString = JSON.stringify(responseData);
    return dataString.includes('ngrok') && dataString.includes('ERR_NGROK');
  }
  
  return false;
};

// Validate API URL is set
if (!API_URL || API_URL.includes('localhost')) {
  console.warn('⚠️ API_URL is using localhost - this will not work on mobile devices!');
  console.warn('⚠️ Please set API_URL in .env to your backend URL (e.g., ngrok URL for mobile development)');
}

if (__DEV__) {
  console.log('🔗 API Base URL:', baseURL);
}

// Test the API connection immediately (only in dev)
if (__DEV__) {
  fetch(baseURL + '/health')
    .then(response => {
      if (__DEV__) console.log('✅ Health check response:', response.status);
      return response.text();
    })
    .then(() => {
      if (__DEV__) console.log('✅ Health check: OK');
    })
    .catch(error => {
      if (__DEV__) console.error('❌ Health check failed:', error.message);
    });
}

// Create axios instance with automatic token attachment
export const api = axios.create({ 
  baseURL: baseURL,
  timeout: 15000, // 15 second timeout for all requests (longer than middleware timeout)
  headers: {
    'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning on free tier
    'Cache-Control': 'no-cache, no-store, must-revalidate', // Prevent caching
    'Pragma': 'no-cache', // HTTP 1.0 compatibility
  }
});

// Add request interceptor to attach Firebase ID token
api.interceptors.request.use(async (config) => {
  try {
    // Log request details for uploads (for debugging)
    if (config.url?.includes('/upload/') && __DEV__) {
      console.log('📤 [Request Interceptor] Upload request:', {
        url: config.url,
        method: config.method,
        hasData: !!config.data,
        dataType: config.data?.constructor?.name || typeof config.data,
        isFormData: config.data instanceof FormData,
        baseURL: config.baseURL,
      });
    }

    // Get current user - wait for auth state if needed
    let user = auth.currentUser;
    
    // If no current user but this is an auth route, wait a bit for auth to initialize
    // This handles race conditions where auth state hasn't loaded yet
    if (!user && config.url?.includes('/auth/')) {
      // Wait up to 1 second for auth to initialize
      const maxWait = 1000;
      const startTime = Date.now();
      while (!user && (Date.now() - startTime) < maxWait) {
        await new Promise<void>(resolve => setTimeout(() => resolve(), 100));
        user = auth.currentUser;
      }
    }
    
    if (user) {
      try {
        // Try to get token (without forcing refresh first to avoid network issues)
        let token = await user.getIdToken(false);
        
        // If token is expired or null, try refreshing
        if (!token) {
          if (__DEV__) {
            console.log('🔄 [Request Interceptor] Token is null, refreshing...');
          }
          token = await user.getIdToken(true);
        }
        
        if (token && token.trim() !== '') {
          config.headers.Authorization = `Bearer ${token}`;
          if (__DEV__) {
            if (config.url?.includes('/upload/')) {
              console.log('✅ [Request Interceptor] Firebase token attached to upload request');
            } else if (config.url?.includes('/auth/me')) {
              console.log('✅ [Request Interceptor] Firebase token attached to /auth/me request');
              console.log(`📤 [Request Interceptor] Making request to: ${config.baseURL}${config.url}`);
              console.log(`📤 [Request Interceptor] Method: ${config.method?.toUpperCase()}`);
              console.log(`📤 [Request Interceptor] Has Authorization header: ${!!config.headers.Authorization}`);
              console.log(`📤 [Request Interceptor] Token length: ${token.length} characters`);
            }
          }
        } else {
          if (__DEV__) {
            console.warn(`⚠️ [Request Interceptor] Failed to get Firebase token for request: ${config.url}`);
            console.warn('   User exists but token is empty/null');
          }
        }
      } catch (tokenError: any) {
        // Handle network errors gracefully
        if (tokenError.code === 'auth/network-request-failed') {
          if (__DEV__) {
            console.warn(`⚠️ [Request Interceptor] Network error getting Firebase token for: ${config.url}`);
            console.warn('   Request will proceed without token (backend will handle 401)');
          }
          // Request will proceed without auth (backend will handle 401)
        } else {
          console.error(`❌ [Request Interceptor] Error getting Firebase token for ${config.url}:`, tokenError.code || tokenError.message);
        }
      }
    } else {
      if (__DEV__) {
        console.warn(`⚠️ [Request Interceptor] No authenticated user found for request: ${config.url}`);
        console.warn('   Request will proceed without Authorization header (backend will handle 401)');
      }
    }
  } catch (error: any) {
    console.error(`❌ [Request Interceptor] Error in auth interceptor for ${config.url}:`, error.message || error);
    // Continue with request even if auth fails (backend will handle 401)
  }
  return config;
});

// Extend axios config type to include custom properties
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  __isRetry?: boolean;
  __suppressOriginalError?: boolean;
  __suppressErrorToast?: boolean;
}

// Add response interceptor with automatic retry logic
api.interceptors.response.use(
  (response) => {
    // Mark successful response to indicate retry was successful (if it was a retry)
    const config = response.config as ExtendedAxiosRequestConfig;
    if (config.__isRetry) {
      if (__DEV__) {
        console.log('✅ API Response (retry succeeded):', response.config.url, response.status);
      }
      // Clear retry flag to prevent infinite loops
      delete config.__isRetry;
    } else {
      if (__DEV__) {
        console.log('✅ API Response:', response.config.url, response.status);
      }
    }
    return response;
  },
  async (error) => {
    const config = (error.config || {}) as ExtendedAxiosRequestConfig;
    const url = config.url || '';
    const status = error.response?.status;
    
    // Check if this is already a retry attempt (prevent infinite loops)
    const isRetry = config.__isRetry === true;
    
    // Skip retry for certain cases
    const isAvailability404 =
      status === 404 && url.includes('/consultant-flow/profiles') && url.includes('/availability');
    const isProfile404 =
      status === 404 && url.includes('/consultant-flow/profiles') && !url.includes('/availability');
    const isUser404 =
      status === 404 && url.includes('/auth/users/');
    const isService404 =
      status === 404 && url.includes('/consultants/services/');
    
    // Check if this is an ngrok connection error (backend is down)
    const isNgrokConnError = isNgrokError(error);
    
    // Check for backend unavailable errors (503, connection refused, etc.)
    const isBackendUnavailable = 
      status === 503 || 
      status === 502 ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ERR_CONNECTION_REFUSED' ||
      error.message?.includes('connection refused') ||
      error.message?.includes('ECONNREFUSED');
    
    // Check if this is an upload request (FormData can't be reused, so don't retry uploads on timeout)
    const isUploadRequest = url.includes('/upload/');
    const isTimeoutError = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
    
    // Don't retry for expected 404s, switch-role 403s, ngrok errors, or backend unavailable
    // Also don't retry if this is already a retry attempt
    // Don't retry upload requests on timeout (FormData can't be reused)
    // Retry for network errors, timeouts (client-side), and transient server errors (500, 504, etc.)
    const shouldRetry = !isRetry && 
                       !isNgrokConnError && 
                       !isBackendUnavailable &&
                       !isAvailability404 && 
                       !isProfile404 && 
                       !isUser404 && 
                       !isService404 &&
                       !(status === 403 && url.includes('/auth/switch-role') && error.response?.data?.action === 'create_consultant_profile') &&
                       !(isUploadRequest && isTimeoutError) && // Don't retry uploads on timeout
                       // Only retry for network errors, client-side timeouts, or transient server errors
                       (error.code === 'ECONNABORTED' || 
                        error.code === 'ERR_NETWORK' || 
                        error.code === 'ERR_INTERNET_DISCONNECTED' ||
                        error.message?.includes('timeout') ||
                        error.message?.includes('Network Error') ||
                        (status && status >= 500 && status < 600 && status !== 502 && status !== 503));
    
    // If we should retry and haven't already retried, do a retry
    if (shouldRetry) {
      // Mark this as a retry attempt
      config.__isRetry = true;
      // Mark the original error to suppress it if retry succeeds
      config.__suppressOriginalError = true;
      
      if (__DEV__) {
        console.log('🔄 API request failed, retrying once...', url);
      }
      
      // Wait a bit before retrying (exponential backoff with small delay)
      await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
      
      try {
        // Preserve the original config for retry (important for FormData uploads)
        // Axios should preserve the config, but we need to ensure FormData is not lost
        const retryConfig = {
          ...config,
          // Preserve data for POST/PUT requests (especially FormData)
          // Don't recreate FormData - use the original data object
          data: config.data,
          // Preserve all original headers (axios handles Content-Type for FormData)
          headers: {
            ...config.headers,
          },
          // Ensure method is preserved
          method: config.method || 'GET',
        };
        
        // For FormData uploads, axios automatically sets Content-Type to multipart/form-data
        // So we don't need to manually set it - just preserve the config
        if (__DEV__) {
          console.log('🔄 Retrying request with preserved config:', {
            url: retryConfig.url,
            method: retryConfig.method,
            hasData: !!retryConfig.data,
            dataType: retryConfig.data?.constructor?.name || typeof retryConfig.data,
          });
        }
        
        // Retry the request with preserved config
        const retryResponse = await api(retryConfig);
        
        // Retry succeeded - suppress the original error
        if (__DEV__) {
          console.log('✅ API retry succeeded, original error suppressed:', url);
        }
        
        // Return successful response (original error is silently ignored)
        return retryResponse;
      } catch (retryError: any) {
        // Retry also failed - show error as normal
        if (__DEV__) {
          console.log('❌ API retry also failed:', url);
        }
        // Continue to normal error handling below
        error = retryError;
      }
    }
    
    // Normal error handling (either no retry needed, or retry also failed)
    if (isNgrokConnError || isBackendUnavailable) {
      // Don't show toast for ngrok/backend unavailable errors - they indicate backend is down
      // Let the calling code handle it (e.g., fallback to Firebase or show appropriate message)
      // Only log once per session to reduce console noise (use a simple check)
      if (__DEV__) {
        // Suppress repeated backend unavailable warnings - only log occasionally
        const shouldLog = !backendUnavailableLogged || Math.random() < 0.1; // Log ~10% of the time
        if (shouldLog) {
          backendUnavailableLogged = true;
          if (isNgrokConnError) {
            console.warn('⚠️ Backend unavailable (ngrok connection error):', url);
            console.warn('   The backend server at localhost:4000 is not running or ngrok cannot connect.');
            console.warn('   (Subsequent backend unavailable errors will be suppressed to reduce console noise)');
          } else {
            console.warn('⚠️ Backend unavailable:', url, `Status: ${status || error.code || 'Connection refused'}`);
            console.warn('   (Subsequent backend unavailable errors will be suppressed to reduce console noise)');
          }
          // Reset after 30 seconds to allow occasional logging
          setTimeout(() => {
            backendUnavailableLogged = false;
          }, 30000);
        }
      }
      // Attach flags so calling code knows it's a backend connection issue
      (error as any).isBackendUnavailable = true;
      (error as any).isNgrokError = isNgrokConnError;
      (error as any).backendUnavailable = true; // Additional flag for compatibility
      return Promise.reject(error);
    }

    // Don't show toast for expected 404s (availability, profile, user, service not found)
    if (isAvailability404 || isProfile404 || isUser404 || isService404) {
      // Only log expected 404s in dev mode, and only once per URL
      if (__DEV__) {
        // Suppress expected 404 warnings - they're normal (students don't have consultant profiles)
        // console.warn('ℹ️ Expected 404:', url);
      }
      return Promise.reject(error);
    }

    // Don't show toast/log for 403 errors from switch-role when consultant profile is missing
    // This is expected behavior - the app will show a friendly alert instead
    const isSwitchRole403 = 
      status === 403 && 
      url.includes('/auth/switch-role') && 
      error.response?.data?.action === 'create_consultant_profile';
    
    if (isSwitchRole403) {
      // Silently reject - let the calling code handle it with an alert
      return Promise.reject(error);
    }

    // Only show toast for unexpected errors (and only if retry didn't succeed)
    // Also skip if error is marked as handled or should suppress toast
    // Also skip for login-related backend unavailable errors (handled by login screen)
    const isLoginBackendError = 
      url.includes('/auth/me') && 
      (isBackendUnavailable || isNgrokConnError || error.code === 'ECONNABORTED');
    
    const shouldSuppressToast = 
      config.__suppressOriginalError || 
      config.__suppressErrorToast ||
      (error as any).__suppressErrorToast ||
      (error as any).__handled ||
      isLoginBackendError;
    
    if (status && status >= 400 && !shouldSuppressToast) {
      handleApiError(error);
    }

    // Only log detailed error info in development (skip for ngrok errors, backend unavailable, and expected switch-role 403)
    if (__DEV__ && !isNgrokConnError && !isBackendUnavailable && !isSwitchRole403) {
      if (config.__suppressOriginalError) {
        // Original error was suppressed because retry succeeded
        console.log('ℹ️ Original error suppressed (retry succeeded):', url);
      } else {
        console.error('❌ API Error Details:');
        console.error('  - URL:', url);
        console.error('  - Method:', config?.method);
        console.error('  - Status:', status);
        console.error('  - Status Text:', error.response?.statusText);
        console.error('  - Response Data:', error.response?.data);
        console.error('  - Error Message:', error.message);
        console.error('  - Error Code:', error.code);
      }
    } else if (!isNgrokConnError && !isBackendUnavailable && !isSwitchRole403 && !config.__suppressOriginalError) {
      // In production, only log minimal error info
      console.error('❌ API Error:', url, status, error.message);
    }
    
    // Clear retry flags before rejecting
    delete config.__isRetry;
    delete config.__suppressOriginalError;
    
    return Promise.reject(error);
  }
);

export const fetcher = async (url: string) => {
  try {
    const res = await api.get(url);
    return res.data;
  } catch (err: any) {
    // Don't log expected 404s (they're handled by the interceptor)
    const isExpected404 = 
      err?.response?.status === 404 && (
        url.includes('/consultant-flow/profiles') ||
        url.includes('/auth/users/') ||
        url.includes('/consultants/services/')
      );
    
    // Don't log backend unavailable errors (they're handled by the interceptor)
    const isBackendUnavailable = 
      err?.isBackendUnavailable || 
      err?.isNgrokError || 
      err?.backendUnavailable ||
      err?.response?.status === 503 ||
      err?.response?.status === 502;
    
    // Only log unexpected errors
    if (!isExpected404 && !isBackendUnavailable && __DEV__) {
      console.error("Fetcher error:", err);
    }
    throw err;
  }
};