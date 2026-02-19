/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Built-in Vite variables
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;

  // Firebase
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string;
  readonly VITE_FIREBASE_DATABASE_URL?: string;
  readonly VITE_RECAPTCHA_SITE_KEY?: string;

  // Payment
  readonly VITE_RAZORPAY_KEY_ID: string;
  readonly VITE_CASHFREE_APP_ID?: string;
  readonly VITE_USE_SERVER_PAYMENT?: string;

  // Google Maps
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_GOOGLE_MAPS_MAP_ID?: string;

  // App
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_URL: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_ENV: 'development' | 'production' | 'staging';
  readonly VITE_MOCK_MODE?: string;
  readonly VITE_USE_EMULATORS?: string;
  readonly VITE_EMULATE_FUNCTIONS_ONLY?: string;

  // Feature flags
  readonly VITE_ENABLE_ANALYTICS?: string;
  readonly VITE_ENABLE_PWA?: string;
  readonly VITE_ENABLE_CHATBOT?: string;
  readonly VITE_ENABLE_DEBUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
