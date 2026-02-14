import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  deleteUser,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, facebookProvider, firebaseEnabled } from '@/lib/firebase';
import { logger } from '@/lib/logger';
import { UserRole } from '@/lib/constants';
import type { LoginCredentials, RegisterData, AuthUser } from '../types/auth.types';
import type { SignupRole } from '../types/registration.types';

// ============================================================================
// AUTHENTICATION SERVICE (FIREBASE ONLY)
// ============================================================================
// Requires real Firebase configuration

// Firebase guard helper
const requireFirebase = (needsDb: boolean) => {
  if (!firebaseEnabled || !auth || (needsDb && !db)) {
    throw { code: 'firebase/not-configured', message: 'Firebase is not configured. Please connect Firebase and retry.' };
  }
};
// Login with email/password
export const loginWithEmail = async (credentials: LoginCredentials & { role?: SignupRole }): Promise<User> => {
  requireFirebase(true);

  try {
    const result = await signInWithEmailAndPassword(auth!, credentials.email, credentials.password);
    
    // Self-Healing: Check if user exists in Firestore, if not create
    let userDoc = await getDoc(doc(db!, 'users', result.user.uid));
    let wasAutoCreated = false;
    
    if (!userDoc.exists()) {
      logger.warn('⚠️ User profile missing in Firestore. Creating default profile...');
      const nameParts = result.user.displayName?.split(' ') || ['', ''];
      await setDoc(doc(db!, 'users', result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        firstName: nameParts[0] || null,
        lastName: nameParts.slice(1).join(' ') || null,
        role: UserRole.USER,
        photoURL: result.user.photoURL,
        phoneNumber: result.user.phoneNumber,
        emailVerified: result.user.emailVerified,
        phoneVerified: false,
        dob: null,
        gender: null,
        consents: {
          terms: false,
          marketing: false,
          whatsapp: false,
          liveLocation: false,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isDeleted: false,
      });
      wasAutoCreated = true;
      // Re-fetch so we have fresh data for role validation
      userDoc = await getDoc(doc(db!, 'users', result.user.uid));
    }

    // Role validation: Ensure the selected role matches the user's actual role
    if (credentials.role) {
      // Use freshly-written default role if auto-created, otherwise read from doc
      const userRole = wasAutoCreated
        ? UserRole.USER
        : (userDoc.data()?.role as string | undefined);
      
      // Map SignupRole to UserRole for comparison
      const roleMap: Record<SignupRole, string> = {
        'attendee': UserRole.USER,
        'organizer': UserRole.ORGANIZER,
        'org_admin': UserRole.ORG_ADMIN,
        'admin': UserRole.ADMIN,
        'superadmin': UserRole.SUPER_ADMIN,
      };
      
      const expectedRole = roleMap[credentials.role];
      
      if (userRole !== expectedRole) {
        // Sign out the user since authentication succeeded but authorization failed
        await signOut(auth!);
        
        // Provide a helpful message that tells the user their actual role
        const reverseRoleMap: Record<string, string> = {
          [UserRole.USER]: 'Attendee',
          [UserRole.ORGANIZER]: 'Organizer',
          [UserRole.ORG_ADMIN]: 'Organization Admin',
          [UserRole.ADMIN]: 'Admin',
          [UserRole.SUPER_ADMIN]: 'Super Admin',
        };
        const actualRoleName = reverseRoleMap[userRole || ''] || userRole || 'Unknown';
        
        throw { 
          code: 'auth/unauthorized-role', 
          message: `Your account is registered as "${actualRoleName}". Please select "${actualRoleName}" from the role selector above and try again.` 
        };
      }
    }

    return result.user;
  } catch (error: any) {
    // Map Firebase v9+ error codes to user-friendly messages
    if (error.code === 'auth/invalid-credential') {
      throw { code: 'auth/invalid-credential', message: 'Invalid email or password.' };
    }
    throw error;
  }
};

// Register with email/password
export const registerWithEmail = async (data: RegisterData): Promise<User> => {
  requireFirebase(true);

  const result = await createUserWithEmailAndPassword(auth!, data.email, data.password);
  
  // Update profile with display name
  await updateProfile(result.user, { displayName: data.displayName });

  // Send email verification
  try {
    await sendEmailVerification(result.user, {
      url: `${window.location.origin}/login?verified=true`,
      handleCodeInApp: false,
    });
    logger.log('📧 Verification email sent to:', data.email);
  } catch (verifyErr) {
    logger.warn('⚠️ Could not send verification email:', verifyErr);
  }
  
  // Create user document in Firestore with extended profile fields
  await setDoc(doc(db!, 'users', result.user.uid), {
    uid: result.user.uid,
    email: data.email,
    displayName: data.displayName,
    firstName: data.firstName || null,
    lastName: data.lastName || null,
    role: data.role || UserRole.USER,
    photoURL: null,
    phoneNumber: data.phoneNumber || null,
    dob: data.dob || null,
    gender: data.gender || null,
    location: data.location || null,
    emailVerified: false,
    phoneVerified: false,
    consents: data.consents || {
      terms: data.terms || false,
      marketing: false,
      whatsapp: false,
      liveLocation: false,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isDeleted: false,
  });

  logger.log('✅ User document created in Firestore:', result.user.uid);
  
  return result.user;
};

// Login with Google
export const loginWithGoogle = async (): Promise<User> => {
  requireFirebase(true);

  const result = await signInWithPopup(auth!, googleProvider!);
  
  // Check if user exists in Firestore, if not create with extended fields
  const userDoc = await getDoc(doc(db!, 'users', result.user.uid));
  
  if (!userDoc.exists()) {
    // Split displayName into firstName/lastName
    const nameParts = result.user.displayName?.split(' ') || ['', ''];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    await setDoc(doc(db!, 'users', result.user.uid), {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
      firstName,
      lastName,
      role: UserRole.USER,
      photoURL: result.user.photoURL,
      phoneNumber: result.user.phoneNumber,
      emailVerified: result.user.emailVerified,
      phoneVerified: !!result.user.phoneNumber,
      dob: null,
      gender: null,
      consents: {
        terms: true, // Assumed accepted for social login
        marketing: false,
        whatsapp: false,
        liveLocation: false,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isDeleted: false,
    });
  }
  
  return result.user;
};

// Login with Facebook
export const loginWithFacebook = async (): Promise<User> => {
  requireFirebase(true);

  const result = await signInWithPopup(auth!, facebookProvider!);
  
  const userDoc = await getDoc(doc(db!, 'users', result.user.uid));
  
  if (!userDoc.exists()) {
    // Split displayName into firstName/lastName
    const nameParts = result.user.displayName?.split(' ') || ['', ''];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    await setDoc(doc(db!, 'users', result.user.uid), {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
      firstName,
      lastName,
      role: UserRole.USER,
      photoURL: result.user.photoURL,
      phoneNumber: result.user.phoneNumber,
      emailVerified: result.user.emailVerified,
      phoneVerified: !!result.user.phoneNumber,
      dob: null,
      gender: null,
      consents: {
        terms: true, // Assumed accepted for social login
        marketing: false,
        whatsapp: false,
        liveLocation: false,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isDeleted: false,
    });
  }
  
  return result.user;
};

// Logout
export const logout = async (): Promise<void> => {
  requireFirebase(false);

  await signOut(auth!);
};

// Send password reset email
export const sendPasswordReset = async (email: string): Promise<void> => {
  requireFirebase(false);

  await sendPasswordResetEmail(auth!, email);
};

// Get user data from Firestore
export const getUserData = async (uid: string): Promise<AuthUser | null> => {
  requireFirebase(true);

  const userDoc = await getDoc(doc(db!, 'users', uid));
  
  if (userDoc.exists()) {
    const data = userDoc.data();
    // Convert Firestore Timestamps to ISO strings
    return {
      ...data,
      createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    } as AuthUser;
  }
  
  // Self-Healing: If user is authenticated but has no profile, create one
  if (auth?.currentUser && auth.currentUser.uid === uid) {
    logger.warn('⚠️ User profile missing during fetch. Creating default profile...');
    const currentUser = auth.currentUser;
    const nameParts = currentUser.displayName?.split(' ') || ['', ''];
    const fullName = currentUser.displayName || [nameParts[0], nameParts.slice(1).join(' ')].filter(Boolean).join(' ') || '';
    const newProfile = {
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: currentUser.displayName,
      firstName: nameParts[0] || null,
      lastName: nameParts.slice(1).join(' ') || null,
      photoURL: currentUser.photoURL,
      phoneNumber: currentUser.phoneNumber,
      role: UserRole.USER,
      emailVerified: currentUser.emailVerified,
      phoneVerified: false,
      dob: null,
      gender: null,
      accountStatus: 'active',
      // Structured nested fields for new RBAC/profile system
      profile: {
        fullName,
        email: currentUser.email || '',
        phone: currentUser.phoneNumber || undefined,
        avatarUrl: currentUser.photoURL || undefined,
      },
      preferences: {
        language: 'en',
        timezone: 'UTC',
        currency: 'USD',
        notifications: {
          eventReminders: true,
          promotionalEmails: false,
          pushNotifications: false,
          smsNotifications: false,
          bookingConfirmations: true,
          eventUpdates: true,
          newsletter: false,
          inApp: true,
        },
        smartPreferences: {
          favoriteCategories: true,
          personalizedRecommendations: true,
          autoAddCalendar: false,
          autoFollowOrganizers: true,
        },
      },
      privacy: {
        profileVisibility: 'public',
        showEmail: true,
        showPhone: false,
        showAttendedEvents: true,
      },
      security: {
        twoFactorEnabled: false,
        activeSessions: [],
      },
      consents: {
        terms: false,
        marketing: false,
        whatsapp: false,
        liveLocation: false,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isDeleted: false,
    };
    
    await setDoc(doc(db!, 'users', uid), newProfile);
    
    return {
      ...newProfile,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as unknown as AuthUser;
  }
  
  return null;
};

// Update user profile
export const updateUserProfile = async (
  uid: string,
  updates: Partial<AuthUser>
): Promise<void> => {
  requireFirebase(true);

  // Validate that the user is authenticated and matches the UID
  if (!auth!.currentUser || auth!.currentUser.uid !== uid) {
    throw {
      code: 'auth/unauthorized-user',
      message: 'Cannot update profile: user mismatch or not authenticated.',
    };
  }

  const userRef = doc(db!, 'users', uid);

  // Validate updates
  const validatedUpdates: Record<string, any> = {};
  
  if (updates.displayName !== undefined) {
    if (typeof updates.displayName !== 'string' || updates.displayName.trim().length === 0) {
      throw { code: 'INVALID_DISPLAY_NAME', message: 'Display name cannot be empty.' };
    }
    validatedUpdates.displayName = updates.displayName.trim();
  }
  
  if (updates.firstName !== undefined) validatedUpdates.firstName = updates.firstName?.trim() || null;
  if (updates.lastName !== undefined) validatedUpdates.lastName = updates.lastName?.trim() || null;
  if (updates.phoneNumber !== undefined) validatedUpdates.phoneNumber = updates.phoneNumber?.trim() || null;
  if (updates.dob !== undefined) validatedUpdates.dob = updates.dob || null;
  if (updates.gender !== undefined) validatedUpdates.gender = updates.gender || null;
  if (updates.photoURL !== undefined) validatedUpdates.photoURL = updates.photoURL || null;
  
  // New fields
  if (updates.bio !== undefined) validatedUpdates.bio = updates.bio?.trim() || null;
  if (updates.organizationName !== undefined) validatedUpdates.organizationName = updates.organizationName?.trim() || null;
  if (updates.organizerBio !== undefined) validatedUpdates.organizerBio = updates.organizerBio?.trim() || null;
  if (updates.websiteUrl !== undefined) validatedUpdates.websiteUrl = updates.websiteUrl?.trim() || null;
  
  if (updates.socials !== undefined) validatedUpdates.socials = updates.socials;
  if (updates.businessRegNumber !== undefined) validatedUpdates.businessRegNumber = updates.businessRegNumber?.trim() || null;
  if (updates.taxId !== undefined) validatedUpdates.taxId = updates.taxId?.trim() || null;
  if (updates.verificationStatus !== undefined) validatedUpdates.verificationStatus = updates.verificationStatus;
  if (updates.branding !== undefined) validatedUpdates.branding = updates.branding;

  if (updates.preferences !== undefined) validatedUpdates.preferences = updates.preferences;
  if (updates.privacy !== undefined) validatedUpdates.privacy = updates.privacy;

  validatedUpdates.updatedAt = serverTimestamp();

  try {
    // 1. Update Firestore document
    await updateDoc(userRef, validatedUpdates);
    logger.log('📝 Firestore profile updated for user:', uid);

    // 2. Sync displayName and/or photoURL to Firebase Auth profile (only these fields exist in Auth)
    const authProfileUpdates: { displayName?: string; photoURL?: string } = {};
    
    if (validatedUpdates.displayName !== undefined) {
      authProfileUpdates.displayName = validatedUpdates.displayName || undefined;
    }
    if (validatedUpdates.photoURL !== undefined) {
      authProfileUpdates.photoURL = validatedUpdates.photoURL || undefined;
    }

    if (Object.keys(authProfileUpdates).length > 0) {
      await updateProfile(auth!.currentUser, authProfileUpdates);
      logger.log('🔐 Firebase Auth profile synced for user:', uid);
    }
  } catch (error: any) {
    logger.error('❌ Profile update failed:', error);
    throw {
      code: 'PROFILE_UPDATE_FAILED',
      message: error.message || 'Failed to update profile. Please try again.',
    };
  }
};

// Change password (requires re-authentication)
export const changePassword = async (
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  // Validate input
  if (!currentPassword || typeof currentPassword !== 'string') {
    throw { code: 'INVALID_CURRENT_PASSWORD', message: 'Current password is required.' };
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    throw { code: 'WEAK_PASSWORD', message: 'New password must be at least 6 characters.' };
  }

  if (currentPassword === newPassword) {
    throw { code: 'SAME_PASSWORD', message: 'New password must be different from current password.' };
  }

  if (!firebaseEnabled || !auth?.currentUser || !auth.currentUser.email) {
    throw { code: 'auth/not-authenticated', message: 'You must be logged in to change your password.' };
  }

  const userId = auth.currentUser.uid;

  try {
    // 1. Re-authenticate the user first (Firebase security requirement)
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    
    try {
      await reauthenticateWithCredential(auth.currentUser, credential);
    } catch (error: any) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw { code: 'auth/wrong-password', message: 'Current password is incorrect.' };
      }
      throw error;
    }

    // 2. Update the password
    await updatePassword(auth.currentUser, newPassword);
    logger.log('🔐 Password updated for user:', userId);

    // 3. Update the Firestore timestamp
    if (db) {
      await updateDoc(doc(db, 'users', userId), {
        updatedAt: serverTimestamp(),
      });
      logger.log('📝 Firestore timestamp updated for password change:', userId);
    }
  } catch (error: any) {
    logger.error('❌ Password change failed:', error);
    // Re-throw with consistent error format
    if (error.code === 'auth/wrong-password' || error.code === 'SAME_PASSWORD') {
      throw error;
    }
    throw {
      code: 'PASSWORD_CHANGE_FAILED',
      message: error.message || 'Failed to change password. Please try again.',
    };
  }
};

// Delete user account (requires re-authentication)
export const deleteUserAccount = async (
  currentPassword: string,
): Promise<void> => {
  // Validate input
  if (!currentPassword || typeof currentPassword !== 'string') {
    throw { code: 'INVALID_PASSWORD', message: 'Password is required to delete account.' };
  }

  if (!firebaseEnabled || !auth?.currentUser || !auth.currentUser.email) {
    throw { code: 'auth/not-authenticated', message: 'You must be logged in to delete your account.' };
  }

  const uid = auth.currentUser.uid;
  const email = auth.currentUser.email;

  try {
    // 1. Re-authenticate the user first (Firebase security requirement)
    const credential = EmailAuthProvider.credential(email, currentPassword);
    
    try {
      await reauthenticateWithCredential(auth.currentUser, credential);
    } catch (error: any) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw { code: 'auth/wrong-password', message: 'Password is incorrect. Cannot delete account.' };
      }
      throw error;
    }

    logger.log('🔓 User re-authenticated for account deletion:', uid);

    // 2. Delete Firestore user document first (needs auth to still be valid)
    if (db) {
      try {
        // Mark as deleted before fully removing to prevent race conditions
        await updateDoc(doc(db, 'users', uid), {
          deletedAt: serverTimestamp(),
          isDeleted: true,
          email: null, // Clear sensitive data
          phoneNumber: null,
        });
        logger.log('📝 User marked as deleted in Firestore:', uid);

        // Actually delete the document
        await deleteDoc(doc(db, 'users', uid));
        logger.log('🗑️ Firestore user document deleted:', uid);
      } catch (dbError: any) {
        logger.error('⚠️ Failed to delete Firestore document:', dbError);
        // Continue with auth deletion even if Firestore fails
        // The user can still use their auth account, but profile will be regenerated
      }
    }

    // 3. Delete Firebase Auth account
    try {
      await deleteUser(auth.currentUser);
      logger.log('🗑️ Firebase Auth account deleted:', uid);
    } catch (authError: any) {
      logger.error('❌ Failed to delete Firebase Auth account:', authError);
      throw {
        code: 'AUTH_DELETION_FAILED',
        message: 'Failed to delete authentication. Please contact support.',
      };
    }
  } catch (error: any) {
    logger.error('❌ Account deletion failed:', error);
    // Re-throw known errors or wrap unknown ones
    if (error.code === 'auth/wrong-password' || error.code === 'AUTH_DELETION_FAILED') {
      throw error;
    }
    throw {
      code: 'ACCOUNT_DELETION_FAILED',
      message: error.message || 'Failed to delete account. Please try again.',
    };
  }
};

// Update Platform Settings (Admin)
// Writes to `SettingInfo/platform` collection for RBAC-driven platform config.
export const updatePlatformSettings = async (settings: any): Promise<void> => {
  if (!firebaseEnabled || !auth?.currentUser) {
     throw { code: 'auth/not-authenticated', message: 'Auth not ready.' };
  }

  try {
    // Use the SettingInfo collection (RBAC standard)
    const settingsDoc = doc(db!, 'SettingInfo', 'platform');
    // Using setDoc with merge: true creates the document if it doesn't exist
    await setDoc(settingsDoc, {
      ...settings,
      updatedAt: serverTimestamp(),
      updatedBy: auth.currentUser.uid
    }, { merge: true });
    
    logger.log('⚙️ Platform settings updated in SettingInfo/platform');
  } catch (error: any) {
    logger.error('❌ Failed to update platform settings:', error);
    throw error;
  }
};

// Upload File to Firebase Storage
export const uploadFile = async (file: File, path: string): Promise<string> => {
  // Dynamically import storage modules to avoid SSR/initialization issues
  try {
    const { storage } = await import('@/lib/firebase');
    const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');

    if (!storage) {
      throw { code: 'storage/not-configured', message: 'Firebase Storage is not configured.' };
    }

    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    logger.log('📂 File uploaded successfully:', path);
    return downloadURL;
  } catch (error: any) {
    logger.error('❌ File upload failed:', error);
    throw error;
  }
};


