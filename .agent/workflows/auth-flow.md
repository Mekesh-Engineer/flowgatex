---
description: Complete authentication workflow — signup, login, and forgot-password flows with Firebase
---

# FlowGateX Authentication Workflow

This document describes the **Signup**, **Login**, and **Forgot Password** flows end-to-end, including how user data is stored in Firebase and how each piece connects.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Signup Flow](#2-signup-flow)
3. [Login Flow](#3-login-flow)
4. [Forgot Password Flow](#4-forgot-password-flow)
5. [Firestore Data Model](#5-firestore-data-model)
6. [Role Mapping](#6-role-mapping)
7. [Key Files Reference](#7-key-files-reference)

---

## 1. Architecture Overview

```
┌──────────────┐     Firebase Auth     ┌──────────────────┐
│  React UI    │ ───────────────────►  │ Firebase Auth    │
│  (Forms)     │                       │ (email/password) │
└──────┬───────┘                       └──────────────────┘
       │
       │  Firestore SDK
       ▼
┌──────────────────┐
│ Cloud Firestore  │
│ `users` collection│
└──────────────────┘
```

**Key principle:** Firebase Authentication handles email/password credentials (the "auth record"), while Cloud Firestore stores the extended user profile (role, name, DOB, consents, etc.) in the `users` collection. The Firestore document ID is always `user.uid` from Firebase Auth.

### Services Involved

| Service File | Responsibility |
|---|---|
| `registrationService.ts` | Multi-step signup: creates Auth account + Firestore profile |
| `authService.ts` | Login, logout, social auth, password reset, profile CRUD |
| `firebase.ts` | Firebase SDK initialization (Auth, Firestore, Storage, etc.) |

### Hooks Involved

| Hook | Responsibility |
|---|---|
| `useRegistrationForm.ts` | 4-step registration state machine (validation, navigation, submission) |
| `useLogin.ts` | Login handling with role-based redirect |
| `useAuth.ts` | Global auth state listener (Zustand store + Firestore real-time sync) |

---

## 2. Signup Flow

### 2.1 UI Steps (Multi-Step Registration)

The signup form (`RegisterPage`) uses a **4-step wizard** powered by the `useRegistrationForm` hook:

```
Step 1: Basic Info  →  Step 2: Role Selection  →  Step 3: Additional Details  →  Step 4: Review & Submit
```

#### Step 1 — Basic Info
User enters:
- **First Name** (required)
- **Last Name** (required)
- **Email** (required, validated via regex)
- **Date of Birth** (required, must be 13+)
- **Password** (required, strength-checked via `passwordValidation.ts`)
- **Confirm Password** (must match)
- **Terms acceptance** (required checkbox)

Validation runs via `validateStep1()` in `useRegistrationForm.ts`. On success → go to Step 2.

#### Step 2 — Role Selection
User picks their role:
- `attendee` (default)
- `organizer`
- `admin`
- `superadmin`

No validation needed—default is `attendee`. On selection → go to Step 3.

#### Step 3 — Additional Details
- **Mobile Number** (optional, validated via `mobileValidation.ts`, stored in E.164 format)
- **Gender** (optional)
- **Live Location Consent** (optional, triggers geolocation permission prompt)
- **Marketing / WhatsApp consent** (optional checkboxes)

Validation runs via `validateStep3()`. On success → go to Step 4.

#### Step 4 — Review & Submit
Displays a summary of all entered data. User can click "Edit" to jump back to any step. On **Submit**, calls `handleFinalSubmit()`.

---

### 2.2 What Happens on Submit (Backend)

`handleFinalSubmit()` in `useRegistrationForm.ts` builds a `CreateUserPayload` and calls `createUser()` from `registrationService.ts`:

```
handleFinalSubmit() → createUser(payload) → Firebase
```

**Inside `createUser()` — 4 sequential operations:**

#### Operation 1: Create Firebase Auth Account
```typescript
const userCredential = await createUserWithEmailAndPassword(auth, email, password);
```
- Firebase Auth creates the user record with `email` and `password`
- Returns a `UserCredential` containing `user.uid` (the unique identifier)

#### Operation 2: Update Auth Profile
```typescript
await updateProfile(user, { displayName: `${firstName} ${lastName}` });
```
- Sets `displayName` on the Firebase Auth record (visible in Firebase Console → Authentication)

#### Operation 3: Send Email Verification
```typescript
await sendEmailVerification(user, actionCodeSettings);
```
- Firebase sends a verification email to the user
- The verification link redirects to `/login?verified=true` after clicking

#### Operation 4: Store Profile in Firestore
```typescript
await setDoc(doc(db, 'users', user.uid), {
  uid, email, displayName, firstName, lastName,
  phoneNumber, photoURL, role, emailVerified, phoneVerified,
  dob, gender,
  consents: { terms, marketing, whatsapp, liveLocation },
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});
```

> **Critical role mapping:** The UI role `'attendee'` is normalized to `'user'` before storing:
> ```typescript
> const dbRole = payload.role === 'attendee' ? 'user' : payload.role;
> ```
> This ensures the stored role matches `UserRole.USER` (`'user'`) used by the routing/RBAC system.

**If Firestore write fails:** The user is still created in Firebase Auth. A "self-healing" mechanism in `useAuth.ts` / `getUserData()` detects the missing document and auto-creates a default profile on next login.

---

### 2.3 After Successful Signup

1. The `completed` state becomes `true`
2. A **Confirmation Screen** is shown telling the user to check their email
3. Analytics event `trackSignupSuccess(role, 'email')` fires
4. User must verify their email, then navigate to `/login` to sign in

---

### 2.4 Error Handling

Firebase error codes are mapped to user-friendly messages:

| Firebase Error Code | User Message |
|---|---|
| `auth/email-already-in-use` | "An account with this email already exists." |
| `auth/invalid-email` | "Please enter a valid email address." |
| `auth/operation-not-allowed` | "Email/password sign-up is not enabled." |
| `auth/weak-password` | "Password must be at least 6 characters long." |
| `auth/network-request-failed` | "Network error. Please check your connection." |

---

## 3. Login Flow

### 3.1 UI (LoginForm.tsx)

The login form presents:
1. **Role Selector** — user picks their role (`attendee`, `organizer`, `admin`, `superadmin`)
2. **Email** field
3. **Password** field
4. **Forgot Password?** link → `/forgot-password`
5. **Sign In** button
6. **Social Auth** (Google)

### 3.2 What Happens on Login

`LoginForm.onSubmit()` calls `useLogin().login(email, password, selectedRole)`:

```
LoginForm → useLogin.login() → loginWithEmail() → Firebase
```

**Inside `loginWithEmail()` from `authService.ts`:**

#### Step 1: Authenticate with Firebase Auth
```typescript
const result = await signInWithEmailAndPassword(auth, email, password);
```
- Firebase checks the email/password against its Auth records
- Returns the `User` object with `uid`, `email`, `displayName`, etc.

#### Step 2: Self-Healing Check
```typescript
const userDoc = await getDoc(doc(db, 'users', result.user.uid));
if (!userDoc.exists()) {
  // Auto-create a default profile in Firestore
  await setDoc(doc(db, 'users', result.user.uid), { ...defaultProfile });
}
```
- If the Firestore profile is missing (e.g., Firestore write failed during signup), it's auto-created with defaults

#### Step 3: Role Validation
```typescript
const roleMap = {
  'attendee': 'user',      // UI role → DB role
  'organizer': 'organizer',
  'admin': 'admin',
  'superadmin': 'superadmin',
};

if (userRole !== roleMap[selectedRole]) {
  await signOut(auth);
  throw { code: 'auth/unauthorized-role', message: '...' };
}
```
- The selected UI role is mapped to the DB role
- If the user's stored role doesn't match → **sign out immediately** and throw an unauthorized error
- This prevents an attendee from logging in as admin, etc.

#### Step 4: Post-Login Redirect
Back in `useLogin.ts`, after successful auth:
```typescript
const targetPath = await getRedirectPath();
navigate(targetPath, { replace: true });
```

`getRedirectPath()` determines where to send the user:
1. If there's a saved "from" location (e.g., tried to access a protected page) → redirect there
2. Otherwise, fetch the user profile from Firestore and use `ROLE_DASHBOARDS[role]`:
   - `user` → `/dashboard`
   - `organizer` → `/organizer`
   - `admin` → `/admin`
   - `superadmin` → `/admin`

### 3.3 Auth State Persistence (useAuth.ts)

After login, `useAuth()` sets up a **real-time Firestore listener** on the user document:

```
onAuthStateChanged → onSnapshot(doc(db, 'users', uid)) → Zustand store
```

1. `onAuthStateChanged` fires when Firebase detects a logged-in user
2. A Firestore `onSnapshot` listener attaches to `users/{uid}`
3. Every update to the user document syncs to the Zustand store in real-time
4. Components consuming `useAuth()` re-render with the latest data

**Timeout fallback:** If the Firestore document doesn't appear within 10 seconds (race condition), basic auth data from Firebase Auth is used with `role: 'user'` as default.

### 3.4 How Signup Data Enables Login

The connection between signup and login is through **two data stores**:

| Store | What Signup Writes | What Login Reads |
|---|---|---|
| **Firebase Auth** | `email`, `password` (hashed), `displayName` | Verifies `email` + `password` credentials |
| **Firestore `users/{uid}`** | `role`, `firstName`, `lastName`, `dob`, `consents`, etc. | Reads `role` for authorization + redirect; reads profile for UI |

Without the Firestore document, login still works (thanks to self-healing), but the user defaults to `role: 'user'` with no profile data.

---

## 4. Forgot Password Flow

### 4.1 UI (ForgotPassword.tsx)

1. User navigates to `/forgot-password` (via "Forgot Password?" link on login page)
2. Enters their **email address** (validated via Zod schema `forgotPasswordSchema`)
3. Clicks **"Send Reset Link"**

### 4.2 What Happens on Submit

```
ForgotPassword.onSubmit() → sendPasswordReset(email) → Firebase
```

**Inside `sendPasswordReset()` from `authService.ts`:**
```typescript
await sendPasswordResetEmail(auth, email);
```

- Firebase sends a password reset email to the provided address
- The email contains a **secure link** with an `oobCode` (out-of-band code) generated by Firebase
- The link points to Firebase's hosted action handler (or a custom URL if configured)

### 4.3 User Receives the Email

The email contains a link like:
```
https://<auth-domain>/__/auth/action?mode=resetPassword&oobCode=<code>&apiKey=<key>
```

### 4.4 Password Reset Process

1. User clicks the link in the email
2. Firebase's hosted reset page opens (or your custom page if configured)
3. User enters a **new password**
4. Firebase calls `confirmPasswordReset(auth, oobCode, newPassword)` internally
5. The password is **updated in Firebase Auth** — the user's auth record now has the new password hash

### 4.5 After Password Reset

- **No Firestore update needed!** The password is stored exclusively in Firebase Auth, not in Firestore
- The Firestore `users/{uid}` document is **unchanged** — all profile data (role, name, consents) remains intact
- User navigates to `/login` and signs in with the **new password**
- Login proceeds exactly as described in Section 3 — Firebase Auth verifies the new password, Firestore profile is loaded

### 4.6 Success State in UI

After the email is sent, `ForgotPassword.tsx` shows:
- **"Check Your Email"** heading
- Message: "We've sent password reset instructions to your email."
- **"Back to Sign In"** link → `/login`

### 4.7 Error Handling

| Scenario | Behavior |
|---|---|
| Email not registered | Firebase still returns success (security — doesn't reveal if email exists) |
| Invalid email format | Caught by Zod validation before API call |
| Network error | Toast notification shown |
| Too many requests | Firebase rate-limits; error shown |

---

## 5. Firestore Data Model

### `users` Collection — Document Structure

```typescript
// Document ID = Firebase Auth UID
{
  uid: string;              // Same as document ID
  email: string;            // User's email
  displayName: string;      // "FirstName LastName"
  firstName: string;        // Separate first name
  lastName: string;         // Separate last name
  phoneNumber: string | null;
  photoURL: string | null;
  role: 'user' | 'organizer' | 'admin' | 'superadmin';
  emailVerified: boolean;
  phoneVerified: boolean;
  dob: string | null;       // ISO date string
  gender: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | null;
  organization: string | null;
  department: string | null;
  consents: {
    terms: boolean;
    marketing: boolean;
    whatsapp: boolean;
    liveLocation: boolean;
  };
  createdAt: Timestamp;     // Firestore server timestamp
  updatedAt: Timestamp;     // Firestore server timestamp
}
```

### `authorization_codes` Collection (for organizer/admin roles)

```typescript
{
  code: string;           // e.g., "ORG-2026-ALPHA"
  role: string;           // 'organizer' | 'admin'
  label: string;          // Human-readable label
  active: boolean;
  maxUses?: number;
  usageCount?: number;
  expiresAt?: Timestamp;
}
```

---

## 6. Role Mapping

The system uses two role vocabularies that must stay in sync:

| UI Role (`SignupRole`) | DB Role (`UserRole`) | Dashboard Route |
|---|---|---|
| `attendee` | `user` | `/dashboard` |
| `organizer` | `organizer` | `/organizer` |
| `admin` | `admin` | `/admin` |
| `superadmin` | `superadmin` | `/admin` |

**Where the mapping happens:**
- **Signup:** `registrationService.ts` line 105 — `'attendee'` → `'user'`
- **Login:** `authService.ts` lines 68-73 — `roleMap` for authorization check
- **Constants:** `lib/constants.ts` — `UserRole` enum defines the DB values

---

## 7. Key Files Reference

| File | Path | Purpose |
|---|---|---|
| `firebase.ts` | `src/lib/firebase.ts` | Firebase SDK init, exports `auth`, `db`, providers |
| `constants.ts` | `src/lib/constants.ts` | `UserRole` enum, navigation items |
| `authService.ts` | `src/features/auth/services/authService.ts` | Login, logout, social auth, password reset |
| `registrationService.ts` | `src/features/auth/services/registrationService.ts` | Multi-step registration, email verification, auth code validation |
| `auth.types.ts` | `src/features/auth/types/auth.types.ts` | `LoginCredentials`, `RegisterData`, `AuthUser` types |
| `registration.types.ts` | `src/features/auth/types/registration.types.ts` | `CreateUserPayload`, `SignupRole`, error codes |
| `useRegistrationForm.ts` | `src/features/auth/hooks/useRegistrationForm.ts` | 4-step form state machine |
| `useLogin.ts` | `src/features/auth/hooks/useLogin.ts` | Login + role-based redirect |
| `useAuth.ts` | `src/features/auth/hooks/useAuth.ts` | Global auth listener (Firestore real-time sync) |
| `LoginForm.tsx` | `src/features/auth/components/LoginForm.tsx` | Login page UI |
| `RegisterForm.tsx` | `src/features/auth/components/RegisterForm.tsx` | Simple registration UI (deprecated) |
| `ForgotPassword.tsx` | `src/features/auth/components/ForgotPassword.tsx` | Password reset request UI |
| `validation.ts` | `src/features/auth/utils/validation.ts` | Zod schemas for login, register, forgot-password |
