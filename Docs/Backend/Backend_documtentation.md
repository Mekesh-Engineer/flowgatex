# FlowGateX — Backend Documentation

> Complete backend reference covering Firebase configuration, Cloud Functions, Firestore data models, security rules, service layer, and API patterns.

---

## Table of Contents

1. [Overview](#overview)
2. [Firebase Configuration](#firebase-configuration)
3. [Firestore Data Models](#firestore-data-models)
4. [Cloud Functions](#cloud-functions)
5. [Service Layer](#service-layer)
6. [Authentication Service](#authentication-service)
7. [API Client (Axios)](#api-client-axios)
8. [Environment Variables](#environment-variables)
9. [Firestore Security Rules](#firestore-security-rules)
10. [Error Handling](#error-handling)

---

## Overview

The FlowGateX backend is a **serverless architecture** built entirely on Firebase. The frontend communicates directly with Firestore for most operations, while Cloud Functions handle payment processing and other server-side tasks.

**Firebase SDK Version:** v12.9.x (modular/tree-shakable imports)

---

## Firebase Configuration

### Initialization

**File:** `src/services/firebase.ts` (210 lines)

```typescript
// Services initialized:
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
const storage = getStorage(app);
const rtdb = getDatabase(app);
const functions = getFunctions(app);
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(siteKey),
});
```

**Key Features:**

- Persistent local cache with multi-tab manager for offline support
- App Check (ReCAPTCHA v3) for request validation
- Conditional analytics initialization (`isSupported()` check)
- Credential validation — rejects demo/placeholder API keys
- Mock mode compatibility flag (`VITE_MOCK_MODE`)

### Exported Instances

| Export             | Type                   | Purpose                                 |
| ------------------ | ---------------------- | --------------------------------------- |
| `app`              | `FirebaseApp`          | Firebase app instance                   |
| `auth`             | `Auth`                 | Authentication service                  |
| `db`               | `Firestore`            | Database service                        |
| `storage`          | `FirebaseStorage`      | File storage                            |
| `rtdb`             | `Database`             | Realtime database                       |
| `functions`        | `Functions`            | Cloud Functions                         |
| `googleProvider`   | `GoogleAuthProvider`   | Google OAuth                            |
| `facebookProvider` | `FacebookAuthProvider` | Facebook OAuth                          |
| `firebaseEnabled`  | `boolean`              | Whether Firebase is properly configured |

---

## Firestore Data Models

### Users Collection (`users/{uid}`)

```typescript
interface FirestoreUser {
  // Identity
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;

  // Role & Status
  role: AppRole; // 'user' | 'organizer' | 'org_admin' | 'admin' | 'superadmin'
  accountStatus: AccountStatus; // 'active' | 'suspended' | 'deleted' | 'pending_verification'

  // Profile (nested)
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
    bio?: string;
    location?: string;
    dateOfBirth?: string;
    gender?: string;
  };

  // Organizer Info (for organizer role)
  organizerInfo?: {
    organizationName: string;
    description: string;
    website?: string;
    socialLinks: Record<string, string>;
    verified: boolean;
    approvalStatus: 'pending' | 'approved' | 'rejected';
  };

  // Preferences
  preferences: {
    language: string;
    timezone: string;
    currency: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    privacy: {
      profileVisibility: 'public' | 'private';
      showEmail: boolean;
    };
  };

  // Security
  security: {
    twoFactorEnabled: boolean;
    lastLogin: Timestamp;
    loginCount: number;
    passwordChangedAt?: Timestamp;
  };

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Events Collection (`events/{eventId}`)

```typescript
interface Event {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  format: EventFormat;

  // Schedule
  startDate: Timestamp;
  endDate: Timestamp;
  timezone: string;

  // Venue
  venue: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    coordinates: { lat: number; lng: number };
    capacity: number;
  };

  // Tickets
  tickets: TicketTier[];

  // Media
  coverImage: string;
  gallery: string[];
  videoUrl?: string;

  // Organizer
  organizerId: string;
  organizerName: string;

  // Status
  status: 'draft' | 'published' | 'completed' | 'cancelled';

  // Metadata
  tags: string[];
  totalBookings: number;
  totalRevenue: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Bookings Collection (`bookings/{bookingId}`)

```typescript
interface Booking {
  id: string;
  userId: string;
  eventId: string;
  tickets: BookingTicket[];

  // Pricing
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  serviceFee: number; // ₹12 per ticket
  finalAmount: number;
  promoCode?: string;

  // Status
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  paymentMethod: string;
  transactionId: string;

  // Attendee Info
  attendees: Attendee[];

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Tickets Collection (`tickets/{ticketId}`)

```typescript
interface Ticket {
  id: string;
  bookingId: string;
  eventId: string;
  userId: string;
  tierId: string;
  tierName: string;
  price: number;

  // QR Code
  qrCode: string; // Base64-encoded SHA-256 signed payload
  qrPayload: {
    ticketId: string;
    userId: string;
    eventId: string;
    transactionId: string;
    bookingId: string;
    timestamp: string;
    gateAccessLevel: number;
  };

  // Status
  status: 'valid' | 'used' | 'cancelled' | 'expired';
  checkedInAt?: Timestamp;
  checkedInBy?: string; // Scanner device/user ID

  // Attendee
  attendeeName: string;
  attendeeEmail: string;

  // Timestamps
  createdAt: Timestamp;
}
```

### Transactions Collection (`transactions/{txnId}`)

```typescript
interface Transaction {
  id: string;
  bookingId: string;
  userId: string;
  eventId: string;

  // Payment
  amount: number;
  currency: 'INR';
  gateway: 'razorpay' | 'cashfree' | 'mock';
  gatewayTransactionId: string;
  gatewayOrderId: string;

  // Status
  status: 'pending' | 'success' | 'failed' | 'refunded';

  // Breakdown
  serviceFee: number;
  taxAmount: number;
  discountAmount: number;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Settings Collection (`SettingInfo/{docId}`)

```typescript
// Platform Settings (SettingInfo/platform)
interface PlatformSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  featureFlags: FeatureFlags;
  security: SecuritySettings;

  // Payment
  serviceFeePerTicket: number; // default: 12 (₹)
  taxRate: number; // default: 0.18 (18% GST)

  updatedAt: Timestamp;
  updatedBy: string;
}

// Organization Settings (SettingInfo/organization_{orgId})
interface OrganizationSettings {
  organizationId: string;
  name: string;
  rolePermissions?: Record<AppRole, Permission[]>;
  featureOverrides?: Partial<FeatureFlags>;
  updatedAt: Timestamp;
}
```

### Devices Collection (`devices/{deviceId}`)

```typescript
interface IoTDevice {
  id: string;
  eventId: string;
  organizerId: string;

  // Device Info
  name: string;
  type: 'scanner' | 'crowd_monitor' | 'sensor_hub' | 'gate_controller';
  status: 'online' | 'offline' | 'error' | 'maintenance';

  // Hardware
  firmwareVersion: string;
  macAddress: string;
  ipAddress: string;
  batteryLevel: number;

  // Config
  location: string; // Physical location at venue
  gateNumber: number;

  // Metrics
  lastPing: Timestamp;
  totalScans: number;
  successfulScans: number;
  failedScans: number;

  // Sensor Readings (sub-collection: devices/{id}/readings)
  // Each reading: { temperature, humidity, gasLevel, crowdDensity, timestamp }

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Cart Collection (`cart/{uid}`)

```typescript
interface CartDocument {
  userId: string;
  items: CartItem[];
  promoCode?: string;
  discountAmount: number;
  updatedAt: Timestamp;
}
```

---

## Cloud Functions

### Directory Structure

```
functions/
├── src/
│   ├── index.ts              # Function exports
│   └── razorpay/             # Payment handlers
│       ├── createOrder.ts    # Create Razorpay order
│       └── verifyPayment.ts  # Verify payment signature
├── lib/                      # Compiled output
├── package.json
└── tsconfig.json
```

### Payment Functions

#### Create Razorpay Order

```typescript
// Callable function
exports.createRazorpayOrder = functions.https.onCall(async (data, context) => {
  // 1. Verify authenticated user
  // 2. Validate order data
  // 3. Create order via Razorpay API
  // 4. Return order ID to client
});
```

#### Verify Payment

```typescript
// HTTP webhook endpoint
exports.razorpayWebhook = functions.https.onRequest(async (req, res) => {
  // 1. Verify webhook signature
  // 2. Extract payment details
  // 3. Create booking in Firestore (transaction)
  // 4. Generate tickets
  // 5. Decrement inventory
  // 6. Send confirmation
});
```

---

## Service Layer

### Service Architecture

```
Pages/Components → Custom Hooks → Service Functions → Firebase SDK → Firestore
```

### Global Services (`src/services/`)

| File                 | Lines | Purpose                             |
| -------------------- | ----- | ----------------------------------- |
| `firebase.ts`        | 210   | Firebase initialization and exports |
| `api.ts`             | 223   | Axios client with auth interceptor  |
| `userService.ts`     | 569   | User CRUD with nested field support |
| `settingsService.ts` | 256   | Platform/org settings CRUD          |
| `razorpay.ts`        | 99    | Razorpay script loader and types    |

### Feature Services (`src/features/*/services/`)

| Feature     | Service Files                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **auth**    | `authService.ts`                                                                                                                                 |
| **booking** | `bookingService.ts`, `cartService.ts`, `inventoryService.ts`, `promoService.ts`, `refundService.ts`, `ticketService.ts`, `transactionService.ts` |
| **events**  | `eventService.ts`                                                                                                                                |
| **iot**     | `iotService.ts`                                                                                                                                  |
| **payment** | `razorpayService.ts`, `cashfreeService.ts`, `mockPaymentService.ts`                                                                              |
| **user**    | `userService.ts`                                                                                                                                 |

---

## Authentication Service

**File:** `src/features/auth/services/authService.ts`

### Supported Auth Providers

| Provider       | Method                              |
| -------------- | ----------------------------------- |
| Email/Password | `signInWithEmailAndPassword()`      |
| Google OAuth   | `signInWithPopup(googleProvider)`   |
| Facebook OAuth | `signInWithPopup(facebookProvider)` |

### Auth Flow

```
User submits credentials →
  Firebase Auth validates →
    JWT token issued →
      Auth state listener fires (onAuthStateChanged) →
        Fetch user profile from Firestore users/{uid} →
          Update Zustand auth store →
            Redirect to role-specific dashboard
```

### Role-Dashboard Mapping

| Role         | Dashboard Path |
| ------------ | -------------- |
| `user`       | `/dashboard`   |
| `organizer`  | `/organizer`   |
| `org_admin`  | `/organizer`   |
| `admin`      | `/admin`       |
| `superadmin` | `/superadmin`  |

---

## API Client (Axios)

**File:** `src/services/api.ts` (223 lines)

### Configuration

```typescript
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});
```

### Request Interceptor

Automatically attaches Firebase Auth token:

```typescript
apiClient.interceptors.request.use(async config => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Response Interceptor

Handles errors and extracts rate limit info:

```typescript
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Extract rate limit headers
    // Map HTTP status to ApiErrorCode
    // Throw structured error
  }
);
```

### Error Codes

| Code            | HTTP Status | Description              |
| --------------- | ----------- | ------------------------ |
| `NETWORK_ERROR` | —           | No network connection    |
| `UNAUTHORIZED`  | 401         | Invalid/expired token    |
| `FORBIDDEN`     | 403         | Insufficient permissions |
| `NOT_FOUND`     | 404         | Resource not found       |
| `RATE_LIMITED`  | 429         | Too many requests        |
| `SERVER_ERROR`  | 500         | Internal server error    |

---

## Environment Variables

**File:** `.env.example`

### Required Variables

| Variable                            | Description          |
| ----------------------------------- | -------------------- |
| `VITE_FIREBASE_API_KEY`             | Firebase API key     |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID`          | Firebase project ID  |
| `VITE_FIREBASE_APP_ID`              | Firebase app ID      |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Storage bucket URL   |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID        |
| `VITE_FIREBASE_DATABASE_URL`        | Realtime DB URL      |

### Optional Variables

| Variable                | Default          | Description               |
| ----------------------- | ---------------- | ------------------------- |
| `VITE_RAZORPAY_KEY_ID`  | —                | Razorpay public key       |
| `VITE_MOCK_MODE`        | `false`          | Enable mock auth/payments |
| `VITE_ENABLE_PWA`       | `true`           | Enable PWA features       |
| `VITE_ENABLE_ANALYTICS` | `false`          | Enable analytics          |
| `VITE_APP_NAME`         | `FlowGateX`      | Application name          |
| `VITE_APP_URL`          | `localhost:5173` | Application URL           |

### Environment Validation

**File:** `src/lib/env.ts` (147 lines)

Environment variables are validated at build time using Zod schemas:

```typescript
const envSchema = z.object({
  VITE_FIREBASE_API_KEY: z.string().min(1),
  VITE_FIREBASE_PROJECT_ID: z.string().min(1),
  // ... other required fields
});
```

---

## Firestore Security Rules

**File:** `firestore.rules`

### Key Rules

```
// Users: Read own profile, write own profile
match /users/{userId} {
  allow read: if request.auth.uid == userId;
  allow write: if request.auth.uid == userId;
}

// Events: Public read, organizer write
match /events/{eventId} {
  allow read: if true;
  allow create: if isOrganizer();
  allow update: if isEventOwner(eventId);
}

// Bookings: Owner read/write
match /bookings/{bookingId} {
  allow read: if isBookingOwner(bookingId);
  allow create: if request.auth != null;
}

// Settings: Admin read/write
match /SettingInfo/{docId} {
  allow read: if request.auth != null;
  allow write: if isAdmin();
}
```

---

## Error Handling

### Client-Side Error Handling

```
Service call →
  Try/catch block →
    If Firebase error:
      Map to user-friendly message →
        Show SweetAlert2 toast
    If network error:
      Show offline indicator →
        Queue for retry (if applicable)
    If validation error:
      Show form field errors (React Hook Form)
```

### Error Logging

**File:** `src/lib/logger.ts`

| Method           | Environment      | Behavior        |
| ---------------- | ---------------- | --------------- |
| `logger.log()`   | Development only | Console output  |
| `logger.warn()`  | Development only | Console warning |
| `logger.error()` | All environments | Always logged   |

### Error Boundary

**Component:** `src/components/common/ErrorBoundary.tsx`

Catches unhandled React errors and displays a fallback UI with retry option.
