# FlowGateX: Comprehensive Firebase Integration Guide

This document provides a complete setup and architectural guide for FlowGateX's integration with Google Firebase. It serves as the definitive source for configuring, securing, and understanding the backend infrastructure.

---

## 📋 Table of Contents

1. [Architectural Overview](#architectural-overview)
2. [Firebase Services Setup](#firebase-services-setup)
   - [Authentication](#1-authentication)
   - [Cloud Firestore](#2-cloud-firestore-database)
   - [Firebase Storage](#3-firebase-storage)
   - [Realtime Database](#4-realtime-database)
   - [Cloud Functions (Backend API)](#5-cloud-functions--backend-api)
3. [Configuration & Initialization](#configuration--initialization)
4. [Security & Rules](#security--rules)
5. [API Endpoints & Integration](#api-endpoints--integration)
6. [Authentication Flows](#authentication-flows)
7. [Error Handling Strategy](#error-handling-strategy)
8. [Best Practices](#best-practices)

---

## 🏗️ Architectural Overview

FlowGateX utilizes a **Serverless-First Hybrid Architecture**:

1.  **Direct-to-Database (Frontend)**: The React frontend interacts directly with Firestore for 90% of operations (reading events, checking availability, user profile updates). This ensures low latency and reduces backend overhead.
2.  **Secure Backend (API)**: Sensitive operations (payments, heavy analytics) are routed through a secured API layer (typically Firebase Cloud Functions or a dedicated Node.js server) using the `api.ts` service.

### Role of Firebase
| Service | Purpose in FlowGateX |
| :--- | :--- |
| **Authentication** | Identity management, social login, and ID token generation. |
| **Firestore** | Primary NoSQL database for users, events, bookings, and relational data. |
| **Storage** | Asset hosting for user avatars, event banners, and generated tickets (PDF/PNG). |
| **Realtime DB** | (Optional) Presence systems or high-frequency live counters. |
| **App Check** | Abuse protection (ReCAPTCHA v3). |

---

## 🛠️ Firebase Services Setup

### 1. Authentication
**Enabled Providers:**
- **Email/Password**: Standard flow.
- **Google**: Social login.
- **Facebook**: Social login.

**Configuration:**
- Go to Firebase Console -> Authentication -> Sign-in methods.
- Enable the providers listed above.
- Add your authorized domains (e.g., `localhost`, `flowgatex.vercel.app`).

### 2. Cloud Firestore (Database)
**Location**: Multi-region or closest to user base (e.g., `asia-south1`).
**Mode**: Production Mode.

**Key Collections:**
- `users`: User profiles and settings.
- `events`: Event details and availability.
- `bookings`: Booking records.
- `tickets`: Generated ticket data.
- `transactions`: Payment history.
- `devices`: IoT device configurations.

### 3. Firebase Storage
**Rules**: Strict ownership enforcement.
**Bucket Structure**:
- `/users/{uid}/`: User-specific files (avatars).
- `/events/{eventId}/`: Event-specific assets (banners).
- `/public/`: Global assets.

### 4. Realtime Database
*Current Usage*: Minimal/Reserved.
*Potential Use*: Live attendee counters during check-in.

### 5. Cloud Functions / Backend API
While the frontend is separated, FlowGateX expects a backend for specific endpoints found in `src/services/api.ts`.
*Recommended Setup*: Deploy these as HTTP-triggered Cloud Functions.

---

## ⚙️ Configuration & Initialization

### 1. Environment Variables
Create `.env.local` in the project root:

```env
# Firebase Public Config
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Security (App Check)
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_key

# Backend API
VITE_API_BASE_URL=https://your-api-domain.com/api
```

### 2. Initialization Code
Located in `src/services/firebase.ts`.
- Initializes the Firebase App.
- Sets up Persistence for Firestore (Offline support).
- Initializes App Check (if key provided).

---

## 🔒 Security & Rules

Security is enforced via **Firebase Security Rules**.

### Firestore Rules (`firestore.rules`)
- **Users**: Read own profile; Admin reads all. Write own profile (except sensitive fields like `role`).
- **Events**: Public read. Organizer/Admin write. Features specific validations (e.g., "Org Admin" can only edit their org's events).
- **Bookings**: User reads own. Admin reads all. Creation restricted to authenticated users.

**Best Practice**: Always validate `request.auth.uid` against the document's `userId` or `organizerId`.

### Storage Rules (`storage.rules`)
- **Images**: Only allow `image/*` content types.
- **Size Limit**: Restrict file size (e.g., < 5MB).
- **Path Security**: Ensure users can only write to `/users/{request.auth.uid}/*`.

---

## 📡 API Endpoints & Integration

The internal API service (`src/services/api.ts`) standardizes requests to your backend (Cloud Functions).

### Request Format
All requests automatically include the Firebase ID Token.
```typescript
{
  headers: {
    Authorization: "Bearer <firebase_id_token>"
  }
}
```

### Key Endpoints
| Context | Endpoint | Method | Purpose |
| :--- | :--- | :--- | :--- |
| **Payment** | `/payments/cashfree/create-order` | POST | Initialize payment session. |
| **Payment** | `/payments/cashfree/verify/{id}` | GET | Verify server-side payment status. |
| **Analytics** | `/analytics/overview` | GET | Aggregated platform stats. |
| **Analytics** | `/analytics/revenue` | GET | Sensitive financial reporting. |

### Feature Integration
- **Payments**: Frontend initiates booking -> Backend creates order -> Frontend handles payment -> Backend verifies -> Frontend updates UI.
- **IoT**: Devices sync via Firestore listeners (`onSnapshot`) for real-time validation.

---

## 🔑 Authentication Flows

### 1. Email/Password
**File**: `src/features/auth/services/authService.ts`
- **Method**: `signInWithEmailAndPassword`
- **Response**: User Credentials -> Fetch Firestore Profile -> Merge & Return.

### 2. Social OAuth (Google/Facebook)
**File**: `src/features/auth/services/authService.ts`
- **Method**: `signInWithPopup`
- **Logic**:
  1. Authenticate with provider.
  2. Check if Firestore `users/{uid}` exists.
  3. If new: Create profile with data from provider (Name, Email, Photo).
  4. If existing: Update last login timestamp.

### 3. Role-Based Access Control (RBAC)
- **Roles**: Stored in Firestore `users/{uid}.role`.
- **Implementation**: Frontend guards (`ProtectedRoute`) + Firestore Security Rules (`function isAdmin()`).

---

## ⚠️ Error Handling Strategy

FlowGateX uses a unified error handling capability in `api.ts`.

### Common Error Codes
| Code | Description | Handling Strategy |
| :--- | :--- | :--- |
| `auth/user-not-found` | User does not exist. | Prompt registration. |
| `auth/wrong-password` | Invalid credentials. | Show "Invalid email or password". |
| `permission-denied` | Firestore rule rejection. | Check user role / ownership. |
| `UNAUTHORIZED` (API) | Token invalid/expired. | Auto-refresh token or redirect login. |
| `RATE_LIMIT_EXCEEDED`| Too many API calls. | Backoff with `Retry-After` header. |

### Client-Side Handling
```typescript
try {
  await someFirebaseOperation();
} catch (error) {
  // Logger captures strictly in Dev
  logger.error(error);
  // Toast displays user-friendly message
  showError(error.code === 'permission-denied' ? 'Access Denied' : 'Something went wrong');
}
```

---

## 🏆 Best Practices & Maintenance

### Performance
1. **Indexes**: Ensure `firestore.indexes.json` is deployed. Vital for complex queries (e.g., "Events by City AND Date").
2. **CDN**: Firebase Hosting automatically serves static assets via global CDN.
3. **Optimistic Updates**: UI updates immediately; rollback on Firestore error.

### Modularity
- **Services**: All Firebase logic resides in `src/services/` or `src/features/*/services/`.
- **Hooks**: React components interact with services via Hooks (`useAuth`, `useCartSync`). *Never* call Firebase SDKs directly in UI components.

### Deployment
- **Frontend**: `firebase deploy --only hosting`
- **Rules**: `firebase deploy --only firestore:rules,storage:rules`
- **Functions**: `firebase deploy --only functions` (if using custom backend).

---

**FlowGateX Engineering Team**
*Last Updated: February 2026*
