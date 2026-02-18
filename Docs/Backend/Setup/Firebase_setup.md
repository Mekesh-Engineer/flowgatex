# Firebase Setup & Configuration

This guide details the Firebase setup for FlowGateX, including authentication, database schema, security rules, and environment configuration.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Environment Configuration](#environment-configuration)
4. [Authentication](#authentication)
5. [Cloud Firestore](#cloud-firestore)
   - [Schema & Collections](#schema--collections)
   - [Security Rules](#firestore-security-rules)
   - [Indexes](#indexes)
6. [Firebase Storage](#firebase-storage)
   - [Bucket Structure](#bucket-structure)
   - [Storage Rules](#storage-rules)
7. [Realtime Database](#realtime-database)
8. [App Check](#app-check)
9. [Deployment](#deployment)

---

## 🛠️ Prerequisites

- **Node.js** (v16 or higher)
- **Firebase CLI**: Install globally via `npm install -g firebase-tools`
- **Google Account**: To access [Firebase Console](https://console.firebase.google.com/)

---

## 🚀 Project Setup

1. **Create Project**: Go to Firebase Console and create a new project (e.g., `flowgatex-prod`).
2. **Register App**: Add a "Web" app to the project.
3. **Enable Services**:
   - **Authentication**: Enable Email/Password, Google, and Facebook providers.
   - **Firestore Database**: Create database in "Production Mode".
   - **Storage**: Set up a bucket.
   - **Realtime Database**: Create a database (if used for live sync).

---

## 🌍 Environment Configuration

Copy `.env.example` to `.env.local` and populate the Firebase keys.

```bash
cp .env.example .env.local
```

### Required Variables

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Public API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth Domain (`project-id.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage Bucket (`project-id.appspot.com`) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID for FCM |
| `VITE_FIREBASE_APP_ID` | App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Analytics ID (Optional) |
| `VITE_RECAPTCHA_SITE_KEY` | (Optional) For App Check |

> **Note**: These keys are safe to expose in the frontend code.

---

## 🔐 Authentication

FlowGateX uses **Firebase Authentication** for user management.

### Enabled Providers
1. **Email/Password**: Standard signup/login.
2. **Google**: OAuth provider.
3. **Facebook**: OAuth provider.

### Custom Claims & Roles
We use a **Hybrid Role System**:
1. **Firestore Role**: Stored in `users/{uid}` document (`role` field). The primary source of truth for frontend logic.
2. **Auth Claims** (Optional): Can be set via Cloud Functions for stricter backend validation (not currently implemented in client-only flow).

**Supported Roles**:
- `user` (Default)
- `organizer`
- `org_admin`
- `admin`
- `superadmin`

---

## 🗄️ Cloud Firestore

### Schema & Collections

| Collection | Path Format | Description | Access Level |
|------------|-------------|-------------|--------------|
| **Users** | `users/{uid}` | User profiles, settings, roles | Owner (Read/Write), Admin (Read/Write) |
| **Events** | `events/{id}` | Event details, tickets, venue | Public (Read), Organizer (Write own), Admin (Write all) |
| **Bookings** | `bookings/{id}` | User bookings, status | Owner (Read), Admin (Read/Write) |
| **Tickets** | `tickets/{id}` | Generated tickets with QR data | Owner (Read), Admin/Organizer (Read) |
| **Transactions** | `transactions/{id}` | Payment records | Owner (Read), Admin (Read) |
| **Settings** | `SettingInfo/{doc}` | Platform/Org settings (`platform`, `organization_{id}`) | Admin (Write Platform), Org Admin (Write Org) |
| **IoT Devices** | `devices/{id}` | device config & status | Organizer/Admin |
| **Audit Logs** | `audit_logs/{id}` | System activity logs | Admin only |

### Firestore Security Rules

Core rules are defined in `firestore.rules`. Key patterns:

1. **Role Helpers**:
   ```javascript
   function isAdmin() {
     return isAuthenticated() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
   }
   ```

2. **Ownership Checks**:
   ```javascript
   function isOwner(userId) {
     return request.auth.uid == userId;
   }
   ```

3. **Feature Flags**:
   Some writes (like Event Creation) check `SettingInfo/platform` feature flags.

### Indexes

Composite indexes are required for complex queries. These are defined in `firestore.indexes.json` and deployed automatically.

**Key Indexes**:
- `events`: `category` ASC, `dates.start` ASC
- `events`: `city` ASC, `dates.start` ASC
- `bookings`: `userId` ASC, `createdAt` DESC

---

## 📦 Firebase Storage

### Bucket Structure

| Path | Description | Access Rules |
|------|-------------|--------------|
| `/users/{uid}/profile/*` | User avatars | Public Read, Owner Write (Max 2MB, Image only) |
| `/events/{eventId}/*` | Event banners/images | Public Read, Organizer Write (Max 5MB, Image only) |
| `/documents/{userId}/*` | Private user docs | Owner Read, No Client Write (Admin/Backend only) |
| `/tickets/{ticketId}/*` | QR Code images | Owner Read, No Client Write |
| `/public/*` | General assets | Public Read, Admin Write |

### Storage Rules

Rules in `storage.rules` enforce:
- **Authentication**: Users must be logged in.
- **Ownership**: Users can only upload to their own folders.
- **File Validation**: Content-type must be image (`image/*`) and size limits applied.

---

## ⚡ Realtime Database

Used for low-latency features if needed (e.g., live chat or presence).
*Current Status: Initialized but primary data flow uses Firestore real-time listeners (`onSnapshot`).*

---

## 🛡️ App Check

**ReCAPTCHA v3** is configured to protect API resources from abuse.
- Enable App Check in Firebase Console.
- Register your site key in `.env.local` (`VITE_RECAPTCHA_SITE_KEY`).

---

## 🚀 Deployment

### 1. Login to Firebase CLI
```bash
firebase login
```

### 2. Select Project
```bash
firebase use your-project-id
```

### 3. Deploy Rules & Indexes
To update security rules and indexes without deploying the frontend:
```bash
firebase deploy --only firestore,storage
```

### 4. Deploy Frontend (Hosting)
The build output (`dist/`) is deployed to Firebase Hosting.
```bash
npm run build
firebase deploy --only hosting
```

### 5. Local Emulators (Testing)
Run a local Firebase environment for testing:
```bash
firebase emulators:start
```
*Requires configuration in `firebase.json`.*

---

## ⚠️ Best Practices

1. **Never commit `.env.local`**: Contains your specific project config (though public, it varies by environment).
2. **Test Rules**: Always test `firestore.rules` changes in the [Rules Playground](https://console.firebase.google.com/u/0/project/_/firestore/rules) before deploying.
3. **Backup**: Enable automatic daily backups for Firestore in the Google Cloud Console.
4. **Indexes**: Do not manually create indexes in the console if possible; let the app throw a "Missing Index" error link, or define them in `firestore.indexes.json` to keep IaC (Infrastructure as Code) consistent.
