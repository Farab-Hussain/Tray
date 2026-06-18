import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

const SERVICE_PREFIX = 'com.tray.secure';
const ASYNC_FALLBACK_PREFIX = 'secure:';

const serviceForKey = (key: string): string => `${SERVICE_PREFIX}.${key}`;
const asyncFallbackKey = (key: string): string => `${ASYNC_FALLBACK_PREFIX}${key}`;

const isKeychainNativeAvailable = (): boolean =>
  typeof Keychain?.setGenericPassword === 'function';

export async function setSecureItem(key: string, value: string): Promise<void> {
  if (!isKeychainNativeAvailable()) {
    await AsyncStorage.setItem(asyncFallbackKey(key), value);
    return;
  }

  try {
    await Keychain.setGenericPassword(key, value, {
      service: serviceForKey(key),
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (error) {
    if (__DEV__) {
      console.warn('[secureStorage] Keychain write failed, using AsyncStorage fallback:', error);
    }
    await AsyncStorage.setItem(asyncFallbackKey(key), value);
  }
}

export async function getSecureItem(key: string): Promise<string | null> {
  if (isKeychainNativeAvailable()) {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: serviceForKey(key),
      });
      if (credentials && typeof credentials !== 'boolean') {
        return credentials.password;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[secureStorage] Keychain read failed, trying AsyncStorage fallback:', error);
      }
    }
  }

  try {
    return await AsyncStorage.getItem(asyncFallbackKey(key));
  } catch {
    return null;
  }
}

export async function removeSecureItem(key: string): Promise<void> {
  if (isKeychainNativeAvailable()) {
    try {
      await Keychain.resetGenericPassword({ service: serviceForKey(key) });
    } catch {
      // Ignore missing entries during logout/cleanup.
    }
  }

  try {
    await AsyncStorage.removeItem(asyncFallbackKey(key));
  } catch {
    // Ignore missing entries during logout/cleanup.
  }
}

/**
 * Firebase Auth persistence: Keychain on iOS, EncryptedSharedPreferences on Android.
 * Lazily migrates legacy AsyncStorage entries on read.
 */
export const firebaseAuthStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const secureValue = await getSecureItem(key);
    if (secureValue != null) {
      return secureValue;
    }

    const legacyValue = await AsyncStorage.getItem(key);
    if (legacyValue != null) {
      await setSecureItem(key, legacyValue);
      await AsyncStorage.removeItem(key);
    }
    return legacyValue;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await setSecureItem(key, value);
    await AsyncStorage.removeItem(key);
  },
  removeItem: async (key: string): Promise<void> => {
    await removeSecureItem(key);
    await AsyncStorage.removeItem(key);
  },
};

/** Non-auth sensitive tokens (FCM, pending notification payloads). */
export const secureTokenStorage = {
  getItem: getSecureItem,
  setItem: setSecureItem,
  removeItem: removeSecureItem,
};
