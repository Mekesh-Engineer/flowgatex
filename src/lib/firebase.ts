import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

// ============================================================================
// FRONTEND-ONLY DEVELOPMENT MODE
// ============================================================================
// Set to true to disable Firebase and use mock data for frontend development
const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true';

// Check if Firebase credentials are valid (not demo/placeholder values)
const hasValidCredentials = () => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  return apiKey && !apiKey.includes('DEMO') && !apiKey.includes('REPLACE');
};

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// ============================================================================
// Initialize Firebase (only if not in mock mode and has valid credentials)
// ============================================================================
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

export const firebaseEnabled = !MOCK_MODE && hasValidCredentials();

if (firebaseEnabled) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    console.warn('⚠️ Running in mock mode due to Firebase error');
  }
} else {
  if (MOCK_MODE) {
    console.log('🎭 Running in MOCK MODE - Firebase disabled for frontend-only development');
  } else {
    console.warn('⚠️ Firebase credentials not configured - Running in mock mode');
    console.log('💡 To enable Firebase, update .env.local with valid credentials');
  }
}

// Export Firebase services (will be null in mock mode)
export { auth, db, storage };

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
