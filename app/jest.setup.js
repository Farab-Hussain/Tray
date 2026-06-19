// jest.setup.js
import 'react-native-gesture-handler/jestSetup';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map();
  return {
    getItem: jest.fn(key => Promise.resolve(store.get(key) ?? null)),
    setItem: jest.fn((key, value) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    removeItem: jest.fn(key => {
      store.delete(key);
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      store.clear();
      return Promise.resolve();
    }),
    multiGet: jest.fn(keys => Promise.resolve(keys.map(key => [key, store.get(key) ?? null]))),
    multiSet: jest.fn(entries => {
      entries.forEach(([key, value]) => store.set(key, value));
      return Promise.resolve();
    }),
    multiRemove: jest.fn(keys => {
      keys.forEach(key => store.delete(key));
      return Promise.resolve();
    }),
  };
});

jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY' },
  getGenericPassword: jest.fn(() => Promise.resolve(false)),
  setGenericPassword: jest.fn(() => Promise.resolve(true)),
  resetGenericPassword: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('@firebase/auth', () => ({
  getReactNativePersistence: jest.fn(() => ({})),
}));

// Mock Firebase modules
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({
    options: {},
    name: 'test-app',
    automaticDataCollectionEnabled: false,
  })),
  registerVersion: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  initializeAuth: jest.fn(() => ({
    currentUser: null,
    onAuthStateChanged: jest.fn(),
  })),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
      where: jest.fn(() => ({
        isEqual: jest.fn(),
        arrayContains: jest.fn(),
        arrayContainsAny: jest.fn(),
        in: jest.fn(),
        notIn: jest.fn(),
      })),
      orderBy: jest.fn(),
      limit: jest.fn(),
      get: jest.fn(),
      getDocs: jest.fn(),
      add: jest.fn(),
      setDoc: jest.fn(),
      updateDoc: jest.fn(),
      deleteDoc: jest.fn(),
    })),
  })),
}));

jest.mock('firebase/database', () => ({
  getDatabase: jest.fn(() => ({
    ref: jest.fn(() => ({
      set: jest.fn(),
      get: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    })),
  })),
}));

// Mock react-native-image-picker
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn((_, cb) => {
    const result = { didCancel: false, assets: [{ uri: 'test-image-uri' }] };
    cb && cb(result);
    return Promise.resolve(result);
  }),
  launchCamera: jest.fn((_, cb) => {
    const result = { didCancel: false, assets: [{ uri: 'test-camera-uri' }] };
    cb && cb(result);
    return Promise.resolve(result);
  }),
}));
