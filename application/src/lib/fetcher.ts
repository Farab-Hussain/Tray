import { API_URL } from "@env"
import axios from "axios"
import { auth } from "./firebase"
import { handleApiError } from "../utils/toast"

const baseURL = API_URL;

// Test the API connection immediately
console.log('🧪 Testing API connection...');
fetch(baseURL + '/health')
  .then(response => {
    console.log('✅ Health check response:', response.status);
    return response.text();
  })
  .then(data => {
    console.log('✅ Health check data:', data);
  })
  .catch(error => {
    console.error('❌ Health check failed:', error);
  });

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
      // Force refresh token to ensure it's valid (not cached/expired)
      const token = await user.getIdToken(true);
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Firebase token attached to request:', config.url);
    } else {
      console.warn('⚠️ No authenticated user found for request:', config.url);
    }
  } catch (error) {
    console.error('❌ Error getting Firebase token:', error);
  }
  return config;
});

// Add response interceptor for better error logging
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.url, response.status);
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
      console.warn('ℹ️ Expected 404:', url);
      return Promise.reject(error);
    }

    // Only show toast for unexpected errors
    if (status && status >= 400) {
      handleApiError(error);
    }

    // Still log detailed error info for debugging
    console.error('❌ API Error Details:');
    console.error('  - URL:', url);
    console.error('  - Method:', error.config?.method);
    console.error('  - Status:', status);
    console.error('  - Status Text:', error.response?.statusText);
    console.error('  - Response Data:', error.response?.data);
    console.error('  - Error Message:', error.message);
    console.error('  - Error Code:', error.code);
    console.error('  - Full Error:', error);
    
    return Promise.reject(error);
  }
);

export const fetcher = async (url: string) => {
  try {
    const res = await api.get(url);
    return res.data;
  } catch (err) {
    console.error("Fetcher error:", err);
    throw err;
  }
};