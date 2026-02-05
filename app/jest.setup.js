// jest.setup.js
import 'react-native-gesture-handler/jestSetup';

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

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({
    canceled: false,
    uri: 'test-image-uri',
  })),
}));
