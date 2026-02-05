import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, facebookProvider, firebaseEnabled } from '@/lib/firebase';
import { mockAuthService } from '@/lib/mockAuth';
import { UserRole } from '@/lib/constants';
import type { LoginCredentials, RegisterData, AuthUser } from '../types/auth.types';

// ============================================================================
// AUTHENTICATION SERVICE WITH MOCK MODE SUPPORT
// ============================================================================
// Automatically uses mock auth when Firebase is disabled (VITE_MOCK_MODE=true)

// Login with email/password
export const loginWithEmail = async (credentials: LoginCredentials): Promise<User> => {
  if (!firebaseEnabled) {
    const mockUser = await mockAuthService.signIn(credentials.email, credentials.password);
    return mockUser as unknown as User;
  }

  const result = await signInWithEmailAndPassword(auth!, credentials.email, credentials.password);
  return result.user;
};

// Register with email/password
export const registerWithEmail = async (data: RegisterData): Promise<User> => {
  if (!firebaseEnabled) {
    const mockUser = await mockAuthService.signUp(data.email, data.password, data.displayName);
    return mockUser as unknown as User;
  }

  const result = await createUserWithEmailAndPassword(auth!, data.email, data.password);
  
  // Update profile with display name
  await updateProfile(result.user, { displayName: data.displayName });
  
  // Create user document in Firestore
  await setDoc(doc(db!, 'users', result.user.uid), {
    uid: result.user.uid,
    email: data.email,
    displayName: data.displayName,
    role: data.role || UserRole.USER,
    photoURL: null,
    phoneNumber: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return result.user;
};

// Login with Google
export const loginWithGoogle = async (): Promise<User> => {
  if (!firebaseEnabled) {
    const mockUser = await mockAuthService.signInWithGoogle();
    return mockUser as unknown as User;
  }

  const result = await signInWithPopup(auth!, googleProvider!);
  
  // Check if user exists in Firestore, if not create
  const userDoc = await getDoc(doc(db!, 'users', result.user.uid));
  
  if (!userDoc.exists()) {
    await setDoc(doc(db!, 'users', result.user.uid), {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
      role: UserRole.USER,
      photoURL: result.user.photoURL,
      phoneNumber: result.user.phoneNumber,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  
  return result.user;
};

// Login with Facebook
export const loginWithFacebook = async (): Promise<User> => {
  if (!firebaseEnabled) {
    const mockUser = await mockAuthService.signInWithFacebook();
    return mockUser as unknown as User;
  }

  const result = await signInWithPopup(auth!, facebookProvider!);
  
  const userDoc = await getDoc(doc(db!, 'users', result.user.uid));
  
  if (!userDoc.exists()) {
    await setDoc(doc(db!, 'users', result.user.uid), {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
      role: UserRole.USER,
      photoURL: result.user.photoURL,
      phoneNumber: result.user.phoneNumber,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  
  return result.user;
};

// Logout
export const logout = async (): Promise<void> => {
  if (!firebaseEnabled) {
    await mockAuthService.signOut();
    return;
  }

  await signOut(auth!);
};

// Send password reset email
export const sendPasswordReset = async (email: string): Promise<void> => {
  if (!firebaseEnabled) {
    await mockAuthService.resetPassword(email);
    return;
  }

  await sendPasswordResetEmail(auth!, email);
};

// Get user data from Firestore
export const getUserData = async (uid: string): Promise<AuthUser | null> => {
  if (!firebaseEnabled) {
    // In mock mode, return the current user data
    const mockUser = mockAuthService.getCurrentUser();
    return mockUser as unknown as AuthUser;
  }

  const userDoc = await getDoc(doc(db!, 'users', uid));
  
  if (userDoc.exists()) {
    return userDoc.data() as AuthUser;
  }
  
  return null;
};

