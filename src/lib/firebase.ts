import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, Auth } from 'firebase/auth';
import { initializeFirestore, Firestore, persistentLocalCache, persistentMultipleTabManager, getFirestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getDatabase, Database } from 'firebase/database';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaV3Provider, AppCheck } from 'firebase/app-check';
import { logger } from '@/lib/logger';

// ============================================================================
// FRONTEND-ONLY DEVELOPMENT MODE
// ============================================================================
// VITE_MOCK_MODE is kept for compatibility, but mock auth is disabled.
// When true, we still attempt to use Firebase if configured.
const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true';

// Check if Firebase credentials are valid (not demo/placeholder values)
const hasValidCredentials = () => {
  const required = [
    import.meta.env.VITE_FIREBASE_API_KEY,
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    import.meta.env.VITE_FIREBASE_PROJECT_ID,
    import.meta.env.VITE_FIREBASE_APP_ID,
  ];

  if (required.some((value) => !value || value.includes('DEMO') || value.includes('REPLACE'))) {
    return false;
  }

  return true;
};

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// ============================================================================
// Initialize Firebase (only if valid credentials)
// ============================================================================
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let realtimeDb: Database | null = null;
let storage: FirebaseStorage | null = null;
let appCheck: AppCheck | null = null;

export let firebaseEnabled = hasValidCredentials();

if (MOCK_MODE) {
  logger.warn('VITE_MOCK_MODE is true but mock auth is disabled; Firebase will still be used if configured.');
}

if (firebaseEnabled) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    logger.error('❌ Firebase app initialization failed:', error);
    firebaseEnabled = false;
  }
}

if (firebaseEnabled && app) {
  try {
    auth = getAuth(app);
  } catch (error) {
    logger.error('❌ Firebase Auth initialization failed:', error);
    firebaseEnabled = false;
  }

  if (firebaseEnabled) {
    try {
      // Initialize Firestore with persistent cache
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      });
    } catch (error) {
      logger.warn('⚠️ Firestore persistence failed. Falling back to memory cache:', error);
      try {
        db = getFirestore(app);
      } catch (fallbackError) {
        logger.error('❌ Firestore initialization failed:', fallbackError);
        db = null;
      }
    }

    try {
      // Initialize Realtime Database
      realtimeDb = getDatabase(app);
    } catch (error) {
      logger.warn('⚠️ Realtime Database initialization failed:', error);
    }

    try {
      // Initialize Storage
      storage = getStorage(app);
    } catch (error) {
      logger.warn('⚠️ Storage initialization failed:', error);
    }

    // Initialize App Check (reCAPTCHA v3) if site key is provided
    const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (recaptchaSiteKey) {
      try {
        appCheck = initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(recaptchaSiteKey),
          isTokenAutoRefreshEnabled: true,
        });
        logger.log('🛡️ Firebase App Check initialized');
      } catch (appCheckError) {
        logger.warn('⚠️ App Check initialization failed:', appCheckError);
      }
    }

    logger.log('✅ Firebase initialized successfully');
    logger.log('🔥 Services: Auth, Firestore, Realtime DB, Storage');
  }
}

if (!firebaseEnabled) {
  if (MOCK_MODE) {
    logger.warn('VITE_MOCK_MODE is true but mock auth is disabled. Firebase requires valid credentials.');
  }
  logger.warn('Firebase credentials not configured - Firebase auth is disabled.');
  logger.log('To enable Firebase, update .env.local with valid credentials');
}

// Export Firebase services (will be null in mock mode)
export { auth, db, realtimeDb, storage, appCheck };

// Helper to get Firestore with runtime null check
export const getDb = (): Firestore => {
  if (!db) {
    throw new Error('Firestore is not initialized. Make sure Firebase is properly configured.');
  }
  return db;
};

// Helper to get Auth with runtime null check
export const getAuthInstance = (): Auth => {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized. Make sure Firebase is properly configured.');
  }
  return auth;
};

// Helper to get Realtime Database with runtime null check
export const getRealtimeDb = (): Database => {
  if (!realtimeDb) {
    throw new Error('Realtime Database is not initialized. Make sure Firebase is properly configured.');
  }
  return realtimeDb;
};

// Helper to get Storage with runtime null check
export const getStorageInstance = (): FirebaseStorage => {
  if (!storage) {
    throw new Error('Firebase Storage is not initialized. Make sure Firebase is properly configured.');
  }
  return storage;
};

// Auth providers (only create if Firebase is enabled)
export const googleProvider = firebaseEnabled ? new GoogleAuthProvider() : null;
export const facebookProvider = firebaseEnabled ? new FacebookAuthProvider() : null;

// Configure providers (only if enabled)
if (googleProvider) {
  googleProvider.setCustomParameters({
    prompt: 'select_account',
  });
}

// Analytics (only if supported and enabled)
export const initAnalytics = async () => {
  if (firebaseEnabled && import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
    const supported = await isSupported();
    if (supported && app) {
      return getAnalytics(app);
    }
  }
  return null;
};

export default app;






