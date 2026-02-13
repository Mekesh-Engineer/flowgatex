# FlowGateX Authentication Workflow Documentation

## Table of Contents

1. [Overview](#overview)
2. [User Registration Workflow](#user-registration-workflow)
3. [Firebase Data Storage](#firebase-data-storage)
4. [Login Workflow](#login-workflow)
5. [Forgot Password & Reset Workflow](#forgot-password--reset-workflow)
6. [System Architecture](#system-architecture)

---

## Overview

FlowGateX implements a comprehensive authentication system with three authentication methods:

- **Email/Password Authentication** (Primary)
- **Google OAuth** (Social Login)
- **Facebook OAuth** (Social Login)

All authentication data is backed by **Firebase Authentication** with additional user profiles stored in **Firestore Database**. The system includes robust error handling, role-based access control, and a self-healing mechanism for data consistency.

### Key Components

- **Firebase Authentication**: Manages user identity and credentials
- **Firestore Database**: Stores extended user profiles and metadata
- **Zustand Store**: Client-side state management for authenticated user
- **Role-Based Routing**: Controls access based on user roles
- **Multi-Step Registration**: 4-step progressive form for user signup

---

## User Registration Workflow

### Registration Overview

The registration process is a **4-step progressive form** that guides users through account creation with role selection and detailed information collection.

### Step-by-Step Process

#### **Step 1: Basic Information**

**File**: [src/pages/auth/RegisterPage.tsx](src/pages/auth/RegisterPage.tsx)

User enters:

- **Email** (required) - validated for proper format
- **Password** (required) - minimum 6 characters, strength meter displays real-time feedback
- **Confirm Password** (required) - must match password field

Validations:

```
- Email: Valid format (RFC 5322 pattern)
- Password:
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character
- Confirm Password: Must match password
```

---

#### **Step 2: Role Selection**

**File**: [src/features/auth/components/RoleSelector.tsx](src/features/auth/components/RoleSelector.tsx)

User selects their role:

- **Attendee** (User) - Basic user role for event attendees
- **Organizer** - User who creates and manages events
- **Admin** - System administrator with elevated privileges
- **Superadmin** - Full system access (rare)

The selected role is stored for later validation and determines:

- Dashboard access and layout
- Feature availability
- Data access permissions

---

#### **Step 3: Detailed Information**

**File**: [src/pages/auth/RegisterPage.tsx](src/pages/auth/RegisterPage.tsx)

User provides:

- **First Name** (required)
- **Last Name** (required)
- **Phone Number** (optional) - validated using international format
- **Date of Birth** (optional) - date picker with validation
- **Gender** (optional) - dropdown selection
- **Location Consent** (optional) - consent for live location tracking

---

#### **Step 4: Review & Confirmation**

**File**: [src/features/auth/components/ReviewScreen.tsx](src/features/auth/components/ReviewScreen.tsx)

User reviews all entered information with ability to:

- Go back and edit any step
- Confirm and submit registration
- Accept terms and conditions
- Consent to marketing emails (optional)
- Consent to WhatsApp notifications (optional)

---

### Registration Service Execution

**File**: [src/features/auth/services/registrationService.ts](src/features/auth/services/registrationService.ts)

When user submits the registration form:

```
┌─────────────────────────────────────────┐
│ 1. Validation Check                     │
│    - Email format                       │
│    - Password strength (6+ chars)       │
│    - All required fields present        │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Firebase Authentication (createUserWithEmailAndPassword) │
│    - Creates user in Firebase Auth system                   │
│    - Generates unique UID                                   │
│    - Stores email & password securely                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│ 3. Update Firebase Auth Profile          │
│    - Set displayName (firstName+lastName)│
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│ 4. Send Email Verification               │
│    - Sends verification email to user    │
│    - Link points to /login?verified=true │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│ 5. Create Firestore User Document                      │
│    - Store extended profile in /users/{uid}            │
│    - Save all metadata and preferences                 │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│ 6. Success Response                  │
│    - Return userId and confirmation   │
│    - Display success message          │
│    - Prompt email verification        │
└──────────────────────────────────────┘
```

---

## Firebase Data Storage

### Firestore User Document Structure

**Collection**: `users`  
**Document ID**: Firebase Auth UID  
**Path**: `/users/{uid}`

```typescript
{
  // Core Identity
  uid: string; // Firebase Auth UID (unique identifier)
  email: string; // Email address (from Auth)

  // Profile Information
  displayName: string; // Full name (firstName + lastName)
  firstName: string; // Given name
  lastName: string; // Family name
  phoneNumber: string | null; // International format
  photoURL: string | null; // Profile picture URL

  // Role & Access Control
  role: 'user' | 'organizer' | 'admin' | 'superadmin';

  // Personal Details
  dob: string | null; // Date of birth (YYYY-MM-DD format)
  gender: 'male' | 'female' | 'other' | null;

  // Email & Phone Verification Status
  emailVerified: boolean; // From Firebase Auth
  phoneVerified: boolean; // Custom field

  // User Consents & Preferences
  consents: {
    terms: boolean; // Terms of Service acceptance
    marketing: boolean; // Marketing emails consent
    whatsapp: boolean; // WhatsApp notifications consent
    liveLocation: boolean; // Live location tracking consent
  }

  // Metadata
  createdAt: Timestamp; // Account creation timestamp
  updatedAt: Timestamp; // Last profile update timestamp
}
```

### Document Creation Flow

**When created during registration:**

```javascript
{
  uid: "user_firebase_uid_123",
  email: "user@example.com",
  displayName: "John Doe",
  firstName: "John",
  lastName: "Doe",
  phoneNumber: "+1234567890",
  photoURL: null,
  role: "user",  // 'attendee' from form mapped to 'user'
  dob: "1990-05-15",
  gender: "male",
  emailVerified: false,
  phoneVerified: false,
  consents: {
    terms: true,        // Required for signup
    marketing: false,
    whatsapp: false,
    liveLocation: false
  },
  createdAt: Timestamp(Feb 11, 2026),
  updatedAt: Timestamp(Feb 11, 2026)
}
```

### Self-Healing Mechanism

FlowGateX includes automatic profile creation for edge cases:

```
If user logs in but no Firestore document exists:
├─ Detected by useAuth hook (10-second timeout)
├─ Creates default profile with basic auth info
├─ Sets role to "user" (default)
├─ Logs warning: "User profile missing in Firestore"
└─ User can continue with limited profile

If user authenticates but doc creation fails:
├─ User still has working Firebase Auth account
├─ Self-healing on next login
├─ Timeouts prevent infinite loading
└─ Graceful fallback to auth data only
```

---

## Login Workflow

### Login Page Interface

**File**: [src/pages/auth/LoginPage.tsx](src/pages/auth/LoginPage.tsx)

Users can log in using:

1. **Email & Password** with role selection
2. **Google OAuth** (single sign-on)
3. **Facebook OAuth** (single sign-on)

### Email/Password Login Flow

```
┌──────────────────────────────┐
│ 1. User Input                │
│    - Email                   │
│    - Password                │
│    - Role Selection          │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│ 2. Form Validation           │
│    - Email format check      │
│    - Password length check   │
│    - Role provided           │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ 3. Firebase Auth Authentication              │
│    (signInWithEmailAndPassword)              │
│    - Query Firebase Auth database            │
│    - Verify credentials                      │
│    - Return Firebase User object             │
└────────────┬─────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ 4. Fetch User Profile from Firestore │
│    - Get /users/{uid} document       │
│    - Extract user metadata           │
│    - Retrieve role information       │
└────────────┬────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ 5. Role Validation                   │
│    - Compare selected role with      │
│      actual user role in Firestore   │
│    - Ensure authorization match      │
│                                      │
│    If mismatch:                      │
│    └─ Sign out user                  │
│    └─ Return error:                  │
│       "unauthorized-role"            │
└────────────┬────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ 6. Update Auth Store (Zustand)       │
│    - Store user object               │
│    - Set isAuthenticated = true      │
│    - Set isLoading = false           │
│    - Cache role information          │
└────────────┬────────────────────────┘
             │
             ▼
┌───────────────────────────────────────┐
│ 7. Role-Based Navigation              │
│    - Read user role from profile      │
│    - Get dashboard URL from config:   │
│      ROLE_DASHBOARDS[role]            │
│    - Navigate to role-specific page   │
│                                       │
│    Examples:                          │
│    - "user" → /dashboard/attendee    │
│    - "organizer" → /dashboard/org    │
│    - "admin" → /dashboard/admin      │
│    - "superadmin" → /dashboard/sudo  │
└───────────────────────────────────────┘
```

### Social Login (Google) Flow

**File**: [src/features/auth/services/authService.ts](src/features/auth/services/authService.ts)

```
┌──────────────────────────────┐
│ 1. Google OAuth Pop-up       │
│    - User clicks Google btn  │
│    - Google login dialog     │
│    - User selects account    │
└────────────┬─────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│ 2. Firebase Google Auth                │
│    (signInWithPopup with googleProvider)
│    - Get Google credential             │
│    - Sign in to Firebase               │
│    - Return Google User data           │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ 3. Check Firestore Profile            │
│    - Query /users/{uid}               │
│    - If exists: use existing profile  │
│    - If not: create new profile       │
└────────────┬────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ 4. Create Firestore User (if missing) │
│    - Split displayName into           │
│      firstName & lastName             │
│    - Set role = "user" (default)      │
│    - Set email/phone verified = true  │
│    - Set terms consent = true         │
│      (assumed for social login)       │
│    - Set timestamps                   │
└────────────┬────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ 5. Update Auth Store                 │
│    - Set authenticated user           │
│    - Update role information          │
└────────────┬────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ 6. Navigate to Dashboard              │
│    - Direct to role-based dashboard   │
└──────────────────────────────────────┘
```

### Real-Time Profile Sync with useAuth Hook

**File**: [src/features/auth/hooks/useAuth.ts](src/features/auth/hooks/useAuth.ts)

The `useAuth()` hook implements continuous profile synchronization:

```typescript
useEffect(() => {
  // Listen for Firebase Auth changes
  const unsubscribe = onAuthStateChanged(auth, firebaseUser => {
    if (firebaseUser) {
      // Set up real-time Firestore listener
      const userRef = doc(db, 'users', firebaseUser.uid);

      // Real-time sync of user profile
      const unsubUserData = onSnapshot(userRef, docSnap => {
        if (docSnap.exists()) {
          // Convert Firestore Timestamps to ISO strings
          const userData = docSnap.data();

          // Update Zustand store with fresh data
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
            // ... other fields
            createdAt: convertTimestamp(userData.createdAt),
            updatedAt: convertTimestamp(userData.updatedAt),
          });
        }
      });

      // Cleanup listener on unmount
      return () => unsubUserData();
    }
  });

  return () => unsubscribe();
}, []);
```

**Benefits of Real-Time Sync:**

- Profile updates instantly across all open browser tabs
- Role changes take effect immediately
- Consent updates reflect in real-time
- Any admin changes to user profile sync without page reload

---

## Forgot Password & Reset Workflow

### Forgot Password Page

**File**: [src/pages/auth/ForgotPasswordPage.tsx](src/pages/auth/ForgotPasswordPage.tsx)

User provides email address to initiate password reset:

```
┌───────────────────────────────┐
│ 1. User Input                 │
│    - Email address (required) │
│    - Validation check         │
└────────┬──────────────────────┘
         │
         ▼
┌───────────────────────────────┐
│ 2. Firebase Password Reset    │
│    (sendPasswordResetEmail)   │
│    - Verify email exists      │
│    - Generate reset token     │
│    - Send reset email         │
└────────┬──────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│ 3. Firebase Sends Email                     │
│    - Contains reset link:                   │
│    - https://[...]?oobCode=<token>&lang=en  │
│    - Link points to ResetPasswordPage       │
│    - Token valid for 24 hours               │
└────────┬────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ 4. User Confirmation Screen  │
│    - "Check your email"      │
│    - Show email entered      │
│    - Option to back to login │
└──────────────────────────────┘
```

---

### Reset Password Page

**File**: [src/pages/auth/ResetPasswordPage.tsx](src/pages/auth/ResetPasswordPage.tsx)

User resets their password using the emailed link:

```
┌─────────────────────────────────────┐
│ 1. Extract Token from URL           │
│    - Query param: ?oobCode=<token>  │
│    - Or: ?token=<token>             │
│    - Validate token exists          │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 2. Password Input & Validation      │
│    - New password (required)        │
│    - Confirm password (required)    │
│    - Display strength meter         │
│                                     │
│    Requirements:                    │
│    ✓ Minimum 8 characters          │
│    ✓ 1 uppercase (A-Z)             │
│    ✓ 1 lowercase (a-z)             │
│    ✓ 1 number (0-9)                │
│    ✓ 1 special char (!@#$%...)     │
│    ✓ Passwords must match          │
└────────┬────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ 3. Firebase Password Reset         │
│    (confirmPasswordReset)          │
│    - Verify token validity         │
│    - Check token expiration        │
│    - Validate new password         │
│    - Update Firebase Auth password │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ 4. Update Firestore Document       │
│    (updateDoc on /users/{uid})    │
│    - Set updatedAt = now           │
│    - Firestore timestamp reflects  │
│      when password was changed     │
└────────┬───────────────────────────┘
         │
         ▼
┌───────────────────────────────────────┐
│ 5. Success & Redirect                 │
│    - Display success message         │
│    - Wait 3 seconds                  │
│    - Auto-redirect to login page     │
│    - User logs in with new password  │
└───────────────────────────────────────┘
```

### Error Handling for Reset Link

```
Invalid/Expired Token Scenarios:

├─ auth/expired-action-code
│  └─ Error: "This reset link has expired.
│            Please request a new one."
│
├─ auth/invalid-action-code
│  └─ Error: "This reset link is invalid.
│            It may have already been used."
│
├─ auth/weak-password
│  └─ Error: "Password is too weak.
│            Please choose a stronger password."
│
└─ No token in URL
   └─ Error: "Invalid Link - This password reset
            link is invalid or has expired."
```

---

### Password Change (While Logged In)

**File**: [src/features/auth/services/authService.ts](src/features/auth/services/authService.ts) - `changePassword()` function

For authenticated users changing password without reset email:

```
┌─────────────────────────────────┐
│ 1. User Provides              │
│    - Current password         │
│    - New password             │
│    - Confirm new password     │
└────────┬──────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ 2. Re-Authentication (Security)  │
│    - Create email credential    │
│      with current password      │
│    - Re-authenticate user       │
│    - Verify current password    │
│      is correct                 │
│                                 │
│    If incorrect:                │
│    └─ Error: "Current password  │
│              is incorrect"      │
└────────┬────────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ 3. Update Password             │
│    (updatePassword)            │
│    - Update Firebase Auth      │
│    - Change encrypted password │
│    - Invalidate old sessions   │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ 4. Update Firestore            │
│    - Set updatedAt = now       │
│    - Record timestamp          │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ 5. Success Response            │
│    - Display success message   │
│    - User remains logged in    │
└────────────────────────────────┘
```

---

## System Architecture

### Technology Stack

| Component              | Technology            | Purpose                               |
| ---------------------- | --------------------- | ------------------------------------- |
| **Authentication**     | Firebase Auth v9+     | User identity & credential management |
| **Database**           | Firestore             | User profiles & extended metadata     |
| **State Management**   | Zustand               | Client-side auth state                |
| **Real-Time Sync**     | Firestore onSnapshot  | Live profile updates                  |
| **OAuth Providers**    | Google & Facebook API | Social login                          |
| **Email Service**      | Firebase Email        | Verification & password reset emails  |
| **Frontend Framework** | React 18+             | UI rendering                          |
| **Router**             | React Router v6+      | Navigation & route protection         |

---

### Directory Structure

```
src/
├── features/auth/
│   ├── components/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── RoleSelector.tsx
│   │   ├── PasswordMeter.tsx
│   │   ├── DateOfBirthPicker.tsx
│   │   ├── ReviewScreen.tsx
│   │   └── ...
│   ├── hooks/
│   │   ├── useAuth.ts           # Real-time profile sync
│   │   ├── useLogin.ts          # Login logic
│   │   ├── useRegister.ts       # Registration hook
│   │   ├── useRegistrationForm.ts # Multi-step form state
│   │   └── useSignupAnalytics.ts
│   ├── services/
│   │   ├── authService.ts       # Firebase auth operations
│   │   └── registrationService.ts # User creation
│   ├── types/
│   │   ├── auth.types.ts        # Auth interfaces
│   │   └── registration.types.ts # Registration interfaces
│   └── utils/
│       ├── validation.ts        # Form validators
│       ├── passwordValidation.ts
│       ├── mobileValidation.ts
│       └── dobValidation.ts
│
├── pages/auth/
│   ├── LoginPage.tsx       # Login UI & orchestration
│   ├── RegisterPage.tsx    # Register UI & steps
│   ├── ForgotPasswordPage.tsx
│   └── ResetPasswordPage.tsx
│
├── lib/
│   ├── firebase.ts         # Firebase config & initialization
│   └── constants.ts        # Role definitions
│
├── store/zustand/
│   └── stores/            # Auth state store
│
└── routes/
    ├── ProtectedRoute.tsx  # Route guards
    ├── RoleRoute.tsx       # Role-based access
    └── routes.config.tsx   # Role dashboard mappings
```

---

### Authentication State Flow

```
              User Not Authenticated
                     │
                     ▼
        ┌────────────────────────┐
        │  Firebase.onAuthState  │
        │  Changed (None)        │
        └────────┬───────────────┘
                 │
                 ▼
    ┌──────────────────────────┐
    │ Set isAuthenticated=false│
    │ Clear user object        │
    │ Clear role info          │
    └────────┬─────────────────┘
             │
             ▼
     User redirected to /login
        (by ProtectedRoute)

    ─────────────────────────────

        User Authenticates
             │
             ▼
┌────────────────────────────────────┐
│ Firebase Auth Sign-In Successful   │
│ - Firebase User object returned    │
│ - UID generated/retrieved          │
└────┬───────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ useAuth Hook Activated               │
│ - onAuthStateChanged fires           │
│ - Firestore listener established    │
└────┬───────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ Firestore Real-Time Listener         │
│ - Fetch /users/{uid}                │
│ - Convert timestamps                │
│ - Extract role, consents, profile   │
└────┬───────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ Update Zustand Auth Store            │
│ - setUser() called                   │
│ - Set isAuthenticated=true           │
│ - Set isLoading=false                │
│ - Keep real-time sync active         │
└────┬───────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ Role-Based Navigation                │
│ - Access ROLE_DASHBOARDS config      │
│ - Navigate to user.role dashboard    │
└──────────────────────────────────────┘
```

---

### Error Handling & Recovery

#### Common Error Scenarios

```typescript
// During Signup
"auth/email-already-in-use"
  → "An account with this email already exists.
     Try signing in instead."

"auth/weak-password"
  → "Password must be at least 6 characters long."

"auth/invalid-email"
  → "Please enter a valid email address."

"auth/operation-not-allowed"
  → "Email/password sign-up is not enabled.
     Contact administrator."

// During Login
"auth/invalid-credential" (v9+)
  → "Invalid email or password. Please try again."

"auth/user-not-found"
  → "No account found with this email."

"auth/wrong-password"
  → "Password is incorrect. Please try again."

"auth/unauthorized-role"
  → "You are not authorized to login as [role].
     Please select the correct role."

// During Password Reset
"auth/expired-action-code"
  → "This reset link has expired.
     Please request a new one."

"auth/invalid-action-code"
  → "This reset link is invalid or may have
     already been used."
```

---

## Security Features

### Password Security

- ✅ Minimum 6 characters (as per Firebase)
- ✅ Password meter provides real-time feedback
- ✅ Passwords hashed by Firebase (bcrypt)
- ✅ Password reset tokens expire in 24 hours
- ✅ Re-authentication required for password changes

### Email Verification

- ✅ Verification email sent after signup
- ✅ User must verify email before full access (future enhancement)
- ✅ Reset emails are time-limited tokens

### Role-Based Access Control

- ✅ Roles stored in Firestore
- ✅ Role validation on login
- ✅ URL-based role selection prevents privilege escalation
- ✅ ProtectedRoute prevents unauthorized access

### OAuth Security

- ✅ Google and Facebook OAuth providers configured
- ✅ ID tokens validated by Firebase
- ✅ Social profiles auto-created with default role

### Data Protection

- ✅ Firestore security rules enforce user-data isolation
- ✅ Firebase Auth provides secure session management
- ✅ All data encrypted in transit (HTTPS)
- ✅ Sensitive data (passwords) never transmitted client-side

---

## Testing Workflows

### Test User Credentials

See [Docs/TEST_CREDENTIALS_GUIDE.md](Docs/TEST_CREDENTIALS_GUIDE.md) for test accounts.

### Manual Testing Scenarios

**Registration Flow**

1. Fill out 4-step form completely
2. Verify email receives verification email
3. Check Firestore document created with all data
4. Verify role is set correctly
5. Test validation messages for invalid inputs

**Login Flow**

1. Log in with email/password
2. Verify correct dashboard loads for role
3. Test role mismatch error
4. Verify real-time profile sync across tabs
5. Test with Google and Facebook OAuth

**Forgot/Reset Password**

1. Request password reset
2. Check email for reset link
3. Click link and enter new password
4. Verify different password requirements display
5. Test with expired/invalid token
6. Log in with new password

**Edge Cases**

1. Firestore doc missing but Auth user exists
2. Logout and login quickly (race condition)
3. Modify Firestore directly (role change)
4. Fire multiple reset requests
5. Delete and recreate account

---

## Configuration

### Environment Variables

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_MOCK_MODE=false  # Set true to use mock auth
```

### Firebase Console Configuration

1. **Authentication**: Enable Email/Password, Google, Facebook providers
2. **Firestore**: Create `users` collection with proper security rules
3. **Email Templates**: Customize verification and password reset emails

---

## Future Enhancements

- [ ] Two-factor authentication (2FA)
- [ ] Email verification requirement before dashboard access
- [ ] Account linking (connect multiple auth methods)
- [ ] Biometric authentication (WebAuthn/FIDO2)
- [ ] Session timeout and activity tracking
- [ ] Login history and device management
- [ ] Passwordless authentication (magic links)
- [ ] Multi-language email templates

---

## Related Documentation

- [Firebase Setup Guide](FIREBASE_SETUP_GUIDE.md)
- [Firebase Quick Start](FIREBASE_QUICK_START.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Test Credentials Guide](TEST_CREDENTIALS_GUIDE.md)
- [API Documentation](API_DOCUMENTATION.md)

---

## Support & Troubleshooting

### Common Issues

**"Email/password sign-up is not enabled"**

- Solution: Go to Firebase Console → Authentication → Sign-in method → Enable Email/Password

**User created but no profile appears**

- Solution: Self-healing mechanism will create profile on next login

**Firestore document missing after signup**

- Solution: Check Firebase Console → Firestore → users collection permissions

**Email not received**

- Solution: Check Firebase Email templates configuration and spam folder

---

**Document Last Updated**: February 11, 2026  
**FlowGateX Version**: 2026 (Current Development)
