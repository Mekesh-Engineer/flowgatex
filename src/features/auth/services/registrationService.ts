// =============================================================================
// REGISTRATION SERVICE — Firebase Authentication Implementation
// =============================================================================
// Real Firebase Auth implementation for user registration, email verification,
// and user data storage in Firestore.
// =============================================================================

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  updateProfile,
  ActionCodeSettings,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, firebaseEnabled } from '@/lib/firebase';
import type {
  CreateUserPayload,
  CreateUserResponse,
  SendOtpPayload,
  SendOtpResponse,
  VerifyOtpPayload,
  VerifyOtpResponse,
  ValidateAuthCodePayload,
  ValidateAuthCodeResponse,
} from '../types/registration.types';

export type { SendOtpPayload, VerifyOtpPayload };

// ---------------------------------------------------------------------------
// Action Code Settings for Email Verification
// ---------------------------------------------------------------------------

const getActionCodeSettings = (): ActionCodeSettings => ({
  url: `${window.location.origin}/login?verified=true`,
  handleCodeInApp: false,
});

// ---------------------------------------------------------------------------
// Valid Authorization Codes (stored in Firestore in production)
// ---------------------------------------------------------------------------

const VALID_AUTH_CODES: Record<string, { role: string; label: string }> = {
  'ADMIN-2026-FLOWGATEX': { role: 'admin', label: 'Admin Access' },
  'ORG-KEC-2026': { role: 'organizer', label: 'KEC Organizer' },
  'ORG-ACME-2026': { role: 'organizer', label: 'Acme Events Organizer' },
};

// ---------------------------------------------------------------------------
// Service Methods
// ---------------------------------------------------------------------------

/**
 * POST /api/auth/register
 * Creates a new user account with Firebase Authentication and stores
 * additional user data in Firestore.
 */
export async function createUser(
  payload: CreateUserPayload,
): Promise<CreateUserResponse> {
  if (!firebaseEnabled || !auth || !db) {
    throw {
      code: 'FIREBASE_NOT_CONFIGURED',
      message: 'Firebase is not configured. Please contact support.',
    };
  }

  try {
    // 1. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      payload.email,
      payload.password,
    );

    const user = userCredential.user;
    const displayName = `${payload.firstName} ${payload.lastName}`.trim();

    // 2. Update user profile with display name
    await updateProfile(user, {
      displayName,
    });

    // 3. Send email verification
    await sendEmailVerification(user, getActionCodeSettings());

    // 4. Store additional user data in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: payload.email,
      displayName,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phoneNumber: payload.mobile || null,
      photoURL: null,
      role: payload.role || 'user',
      emailVerified: false,
      phoneVerified: false,
      dob: payload.dob || null,
      gender: payload.gender || null,
      organization: payload.organization || null,
      department: payload.department || null,
      consents: {
        terms: payload.consents?.terms || false,
        marketing: payload.consents?.marketing || false,
        whatsapp: payload.consents?.whatsapp || false,
        liveLocation: payload.liveLocationConsent || false,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('✅ User created successfully:', user.uid);
    console.log('📧 Verification email sent to:', payload.email);

    return {
      success: true,
      userId: user.uid,
      email: payload.email,
      role: payload.role || 'attendee',
      message: 'Account created! Please check your email to verify your account.',
    };
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    
    // Map Firebase error codes to user-friendly messages
    const errorMap: Record<string, string> = {
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/operation-not-allowed': 'Email/password accounts are not enabled.',
      'auth/weak-password': 'Please choose a stronger password.',
    };

    throw {
      code: firebaseError.code === 'auth/email-already-in-use' 
        ? 'EMAIL_ALREADY_EXISTS' 
        : firebaseError.code || 'REGISTRATION_FAILED',
      message: errorMap[firebaseError.code || ''] || firebaseError.message || 'Registration failed.',
    };
  }
}

/**
 * POST /api/auth/otp/send
 * Sends email verification link (Firebase doesn't support email OTP natively).
 * For email: Sends verification link via Firebase
 * For SMS: Not implemented (requires Blaze plan)
 */
export async function sendOtp(
  payload: SendOtpPayload,
): Promise<SendOtpResponse> {
  if (!firebaseEnabled || !auth) {
    throw {
      code: 'FIREBASE_NOT_CONFIGURED',
      message: 'Firebase is not configured.',
    };
  }

  if (payload.channel === 'sms') {
    // Phone verification is disabled per user preference
    throw {
      code: 'PHONE_VERIFICATION_DISABLED',
      message: 'Phone verification is not available. Please use email verification.',
    };
  }

  // For email verification during registration, this is handled by createUser
  // This function is called when user needs to re-send verification email
  const currentUser = auth.currentUser;
  
  if (currentUser && currentUser.email?.toLowerCase() === payload.target.toLowerCase()) {
    await sendEmailVerification(currentUser, getActionCodeSettings());
    console.log('📧 Verification email re-sent to:', payload.target);
    
    return {
      success: true,
      message: 'Verification email sent. Please check your inbox and spam folder.',
      expiresIn: 3600, // Email links typically expire in 1 hour
    };
  }

  // If no current user, we need to inform that registration should happen first
  return {
    success: true,
    message: 'Please complete registration first. A verification email will be sent automatically.',
    expiresIn: 3600,
  };
}

/**
 * POST /api/auth/otp/verify
 * For email: Check if user's email is verified in Firebase Auth
 * For SMS: Not implemented
 */
export async function verifyOtp(
  payload: VerifyOtpPayload,
): Promise<VerifyOtpResponse> {
  if (!firebaseEnabled || !auth) {
    throw {
      code: 'FIREBASE_NOT_CONFIGURED',
      message: 'Firebase is not configured.',
    };
  }

  if (payload.channel === 'sms') {
    throw {
      code: 'PHONE_VERIFICATION_DISABLED',
      message: 'Phone verification is not available.',
    };
  }

  // For email verification, check if the user clicked the verification link
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    throw {
      code: 'NO_USER',
      message: 'Please sign in first to verify your email.',
    };
  }

  // Reload user to get latest emailVerified status
  await currentUser.reload();

  if (currentUser.emailVerified) {
    // Update Firestore with verified status
    if (db) {
      await setDoc(
        doc(db, 'users', currentUser.uid),
        { emailVerified: true, updatedAt: serverTimestamp() },
        { merge: true }
      );
    }

    return {
      success: true,
      message: 'Email verified successfully!',
    };
  }

  // Email not yet verified - user needs to click the link
  throw {
    code: 'EMAIL_NOT_VERIFIED',
    message: 'Please click the verification link sent to your email. Check your spam folder if you don\'t see it.',
  };
}

/**
 * POST /api/auth/validate-auth-code
 * Validates an authorization code for admin/organizer signup.
 */
export async function validateAuthCode(
  payload: ValidateAuthCodePayload,
): Promise<ValidateAuthCodeResponse> {
  // In production, this should validate against Firestore or a backend API
  const entry = VALID_AUTH_CODES[payload.code.toUpperCase().trim()];

  if (!entry) {
    throw { code: 'INVALID_AUTH_CODE', message: 'Invalid authorization code.' };
  }

  return {
    success: true,
    message: `Authorization code accepted: ${entry.label}`,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Social Auth flows
// ---------------------------------------------------------------------------

export async function signUpWithGoogle(): Promise<CreateUserResponse> {
  if (!firebaseEnabled || !auth || !googleProvider || !db) {
    throw {
      code: 'FIREBASE_NOT_CONFIGURED',
      message: 'Google sign-up is not available.',
    };
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check if user already exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (!userDoc.exists()) {
      // Create new user document
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        firstName: user.displayName?.split(' ')[0] || '',
        lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
        phoneNumber: user.phoneNumber,
        photoURL: user.photoURL,
        role: 'user',
        emailVerified: user.emailVerified,
        phoneVerified: !!user.phoneNumber,
        dob: null,
        gender: null,
        organization: null,
        department: null,
        consents: {
          terms: true,
          marketing: false,
          whatsapp: false,
          liveLocation: false,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    return {
      success: true,
      userId: user.uid,
      email: user.email || '',
      role: 'attendee',
      message: 'Signed up with Google successfully!',
    };
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    throw {
      code: firebaseError.code || 'GOOGLE_SIGNUP_FAILED',
      message: firebaseError.message || 'Google sign-up failed.',
    };
  }
}

export async function signUpWithPhone(_phone: string): Promise<CreateUserResponse> {
  // Phone authentication is disabled per user preference
  throw {
    code: 'PHONE_SIGNUP_DISABLED',
    message: 'Phone sign-up is not available. Please use email or Google sign-up.',
  };
}
