/**
 * Environment Variable Validation
 * Validates required environment variables on app startup
 */

import { API_URL } from '@env';
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
} from '@env';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate all required environment variables
 */
export const validateEnvironment = (): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Production-only validations
  if (!__DEV__) {
    // API_URL is required in production
    if (!API_URL) {
      errors.push('API_URL is required in production');
    } else {
      // Production API must use HTTPS
      if (!API_URL.startsWith('https://')) {
        errors.push('API_URL must use HTTPS in production');
      }
      // Production API cannot be localhost
      if (
        API_URL.includes('localhost') ||
        API_URL.includes('127.0.0.1') ||
        API_URL.includes('0.0.0.0')
      ) {
        errors.push('API_URL cannot be localhost in production');
      }
    }
  } else {
    // Development warnings
    if (!API_URL || API_URL.includes('localhost')) {
      warnings.push(
        'API_URL is using localhost - this will not work on mobile devices',
      );
    }
  }

  // Firebase configuration validation
  const firebaseConfig = {
    FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID,
  };

  const missingFirebaseKeys: string[] = [];
  Object.entries(firebaseConfig).forEach(([key, value]) => {
    if (!value || value.trim() === '') {
      missingFirebaseKeys.push(key);
    }
  });

  if (missingFirebaseKeys.length > 0) {
    errors.push(
      `Missing Firebase configuration: ${missingFirebaseKeys.join(', ')}`,
    );
  }

  // Validate Firebase project ID format
  if (FIREBASE_PROJECT_ID && !/^[a-z0-9-]+$/.test(FIREBASE_PROJECT_ID)) {
    warnings.push('FIREBASE_PROJECT_ID format may be invalid');
  }

  // Validate API URL format
  if (API_URL) {
    try {
      new URL(API_URL);
    } catch {
      errors.push('API_URL is not a valid URL');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Log validation results
 */
export const logValidationResults = (result: ValidationResult): void => {
  if (result.errors.length > 0) {
    console.error('❌ Environment Validation Errors:');
    result.errors.forEach(error => {
      console.error(`   - ${error}`);
    });
  }

  if (result.warnings.length > 0 && __DEV__) {
    console.warn('⚠️ Environment Validation Warnings:');
    result.warnings.forEach(warning => {
      console.warn(`   - ${warning}`);
    });
  }

  if (result.isValid && result.warnings.length === 0) {
    if (__DEV__) {
      console.log('✅ Environment validation passed');
    }
  }
};

/**
 * Validate environment and throw if invalid in production
 */
export const validateEnvironmentOrThrow = (): void => {
  const result = validateEnvironment();
  logValidationResults(result);

  if (!result.isValid && !__DEV__) {
    throw new Error(
      `Environment validation failed:\n${result.errors.join('\n')}`,
    );
  }
};

