/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Firebase
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string;

  // Payment
  readonly VITE_RAZORPAY_KEY_ID: string;
  readonly VITE_CASHFREE_APP_ID?: string;

  // Google
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;

  // App
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_URL: string;
  readonly VITE_API_BASE_URL: string;

  // Feature flags
  readonly VITE_ENABLE_ANALYTICS?: string;
  readonly VITE_ENABLE_PWA?: string;
  readonly VITE_ENABLE_CHATBOT?: string;
  readonly VITE_ENABLE_DEBUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
