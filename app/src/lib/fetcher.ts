import { API_URL } from "@env"
import axios from "axios"
import { auth } from "./firebase"
import { handleApiError } from "../utils/toast"

// Get API URL from environment, with fallback
const baseURL = API_URL || 'http://localhost:4000';

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
  headers: {
    'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning on free tier
    'Cache-Control': 'no-cache, no-store, must-revalidate', // Prevent caching
    'Pragma': 'no-cache', // HTTP 1.0 compatibility
  }
});

// Add request interceptor to attach Firebase ID token
api.interceptors.request.use(async (config) => {
  try {
    const user = auth.currentUser;
    if (user) {
      try {
        // Try to get token (without forcing refresh first to avoid network issues)
        let token = await user.getIdToken(false);
        
        // If token is expired or null, try refreshing
        if (!token) {
          token = await user.getIdToken(true);
        }
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          if (__DEV__) {
            console.log('✅ Firebase token attached to request:', config.url);
          }
        } else {
          if (__DEV__) {
            console.warn('⚠️ Failed to get Firebase token for request:', config.url);
          }
        }
      } catch (tokenError: any) {
        // Handle network errors gracefully
        if (tokenError.code === 'auth/network-request-failed') {
          console.warn('⚠️ Network error getting Firebase token, proceeding without token:', config.url);
          // Request will proceed without auth (backend will handle 401)
        } else {
          console.error('❌ Error getting Firebase token:', tokenError.code || tokenError.message);
        }
      }
    } else {
      console.warn('⚠️ No authenticated user found for request:', config.url);
    }
  } catch (error: any) {
    console.error('❌ Error in auth interceptor:', error.message || error);
    // Continue with request even if auth fails (backend will handle 401)
  }
  return config;
});

// Add response interceptor for better error logging
api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log('✅ API Response:', response.config.url, response.status);
    }
    return response;
  },
  (error) => {
    const url = error.config?.url || '';
    const status = error.response?.status;
    const isAvailability404 =
      status === 404 && url.includes('/consultant-flow/profiles') && url.includes('/availability');
    const isProfile404 =
      status === 404 && url.includes('/consultant-flow/profiles') && !url.includes('/availability');
    const isUser404 =
      status === 404 && url.includes('/auth/users/');
    const isService404 =
      status === 404 && url.includes('/consultants/services/');

    // Don't show toast for expected 404s (availability, profile, user, service not found)
    if (isAvailability404 || isProfile404 || isUser404 || isService404) {
      // Only log expected 404s in dev mode, and only once per URL
      if (__DEV__) {
        // Suppress expected 404 warnings - they're normal (students don't have consultant profiles)
        // console.warn('ℹ️ Expected 404:', url);
      }
      return Promise.reject(error);
    }

    // Only show toast for unexpected errors
    if (status && status >= 400) {
      handleApiError(error);
    }

    // Only log detailed error info in development
    if (__DEV__) {
      console.error('❌ API Error Details:');
      console.error('  - URL:', url);
      console.error('  - Method:', error.config?.method);
      console.error('  - Status:', status);
      console.error('  - Status Text:', error.response?.statusText);
      console.error('  - Response Data:', error.response?.data);
      console.error('  - Error Message:', error.message);
      console.error('  - Error Code:', error.code);
    } else {
      // In production, only log minimal error info
      console.error('❌ API Error:', url, status, error.message);
    }
    
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
    
    if (!isExpected404 && __DEV__) {
      console.error("Fetcher error:", err);
    }
    throw err;
  }
};