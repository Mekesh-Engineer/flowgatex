// =============================================================================
// USER SERVICE — Firestore `users` Collection CRUD
// =============================================================================
// Handles all reads/writes to the `users/{uid}` collection in Firestore.
// Supports both the new nested structure (profile, organizerInfo, preferences,
// security, privacy) and legacy flat fields for backward compatibility.
// =============================================================================

import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from 'firebase/firestore';

import type { DocumentData } from 'firebase/firestore';

/** Firestore-compatible update payload type */
type FirestoreUpdateData = { [key: string]: DocumentData[string] };
import { db, auth, firebaseEnabled } from './firebase';
import { logger } from '@/lib/logger';
import type {
  FirestoreUser,
  FirestoreUserProfile,
  FirestoreOrganizerInfo,
  FirestoreUserPreferences,
  FirestoreUserPrivacy,
  FirestoreUserSecurity,
  AccountStatus,
} from '@/types/rbac.types';

// =============================================================================
// GUARDS
// =============================================================================

const requireFirestore = () => {
  if (!firebaseEnabled || !db) {
    throw {
      code: 'firebase/not-configured',
      message: 'Firestore is not configured.',
    };
  }
};

const requireAuth = () => {
  if (!auth?.currentUser) {
    throw {
      code: 'auth/not-authenticated',
      message: 'User is not authenticated.',
    };
  }
  return auth.currentUser;
};

// =============================================================================
// READ OPERATIONS
// =============================================================================

/**
 * Fetch a user document from Firestore by UID.
 * Returns null if the document doesn't exist.
 */
export async function getUserDocument(uid: string): Promise<FirestoreUser | null> {
  requireFirestore();

  try {
    const snap = await getDoc(doc(db!, 'users', uid));
    if (!snap.exists()) return null;
    return snap.data() as FirestoreUser;
  } catch (error) {
    logger.error('Failed to fetch user document:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time updates on a user document.
 * Returns an unsubscribe function.
 */
export function subscribeUserDocument(
  uid: string,
  callback: (user: FirestoreUser | null) => void,
): () => void {
  requireFirestore();

  return onSnapshot(
    doc(db!, 'users', uid),
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as FirestoreUser);
      } else {
        callback(null);
      }
    },
    (error) => {
      logger.error('User document listener error:', error);
      callback(null);
    },
  );
}

// =============================================================================
// WRITE OPERATIONS — Structured Firestore writes
// =============================================================================

/**
 * Update user profile fields in `users/{uid}.profile`.
 * Writes to the nested `profile` object in the Firestore document.
 */
export async function updateUserProfileData(
  uid: string,
  profileData: Partial<FirestoreUserProfile>,
): Promise<void> {
  requireFirestore();
  const currentUser = requireAuth();

  if (currentUser.uid !== uid) {
    throw { code: 'auth/unauthorized', message: 'Cannot update another user\'s profile.' };
  }

  const userRef = doc(db!, 'users', uid);

  // Build a flat map of `profile.xxx` keys for Firestore dot-notation update
  const updates: FirestoreUpdateData = { updatedAt: serverTimestamp() };

  if (profileData.fullName !== undefined) updates['profile.fullName'] = profileData.fullName;
  if (profileData.email !== undefined) updates['profile.email'] = profileData.email;
  if (profileData.phone !== undefined) updates['profile.phone'] = profileData.phone || null;
  if (profileData.dateOfBirth !== undefined) updates['profile.dateOfBirth'] = profileData.dateOfBirth || null;
  if (profileData.gender !== undefined) updates['profile.gender'] = profileData.gender || null;
  if (profileData.bio !== undefined) updates['profile.bio'] = profileData.bio || null;
  if (profileData.location !== undefined) updates['profile.location'] = profileData.location || null;
  if (profileData.avatarUrl !== undefined) updates['profile.avatarUrl'] = profileData.avatarUrl || null;

  // Also sync legacy flat fields for backward compat
  if (profileData.fullName !== undefined) {
    const parts = profileData.fullName.split(' ');
    updates['displayName'] = profileData.fullName;
    updates['firstName'] = parts[0] || null;
    updates['lastName'] = parts.slice(1).join(' ') || null;
  }
  if (profileData.phone !== undefined) updates['phoneNumber'] = profileData.phone || null;
  if (profileData.dateOfBirth !== undefined) updates['dob'] = profileData.dateOfBirth || null;
  if (profileData.gender !== undefined) updates['gender'] = profileData.gender || null;
  if (profileData.avatarUrl !== undefined) updates['photoURL'] = profileData.avatarUrl || null;

  try {
    await updateDoc(userRef, updates);
    logger.log('✅ User profile updated:', uid);
  } catch (error) {
    logger.error('❌ Failed to update user profile:', error);
    throw error;
  }
}

/**
 * Update organizer information in `users/{uid}.organizerInfo`.
 */
export async function updateOrganizerInfo(
  uid: string,
  organizerInfo: Partial<FirestoreOrganizerInfo>,
): Promise<void> {
  requireFirestore();
  const currentUser = requireAuth();

  if (currentUser.uid !== uid) {
    throw { code: 'auth/unauthorized', message: 'Cannot update another user\'s organizer info.' };
  }

  const userRef = doc(db!, 'users', uid);
  const updates: FirestoreUpdateData = { updatedAt: serverTimestamp() };

  if (organizerInfo.organizationName !== undefined) {
    updates['organizerInfo.organizationName'] = organizerInfo.organizationName || null;
    updates['organizationName'] = organizerInfo.organizationName || null; // legacy
  }
  if (organizerInfo.website !== undefined) {
    updates['organizerInfo.website'] = organizerInfo.website || null;
    updates['websiteUrl'] = organizerInfo.website || null; // legacy
  }
  if (organizerInfo.socialLinks !== undefined) {
    // Clean undefined values to prevent Firestore errors
    const cleanSocials = Object.entries(organizerInfo.socialLinks).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string | null | undefined>);

    updates['organizerInfo.socialLinks'] = cleanSocials;
    updates['socials'] = cleanSocials; // legacy
  }
  if (organizerInfo.verificationStatus !== undefined) {
    updates['organizerInfo.verificationStatus'] = organizerInfo.verificationStatus;
    updates['verificationStatus'] = organizerInfo.verificationStatus; // legacy
  }
  if (organizerInfo.verificationDocumentUrl !== undefined) {
    updates['organizerInfo.verificationDocumentUrl'] = organizerInfo.verificationDocumentUrl || null;
  }
  if (organizerInfo.branding !== undefined) {
    updates['organizerInfo.branding'] = organizerInfo.branding;
    updates['branding'] = organizerInfo.branding; // legacy
  }

  try {
    await updateDoc(userRef, updates);
    logger.log('✅ Organizer info updated:', uid);
  } catch (error) {
    logger.error('❌ Failed to update organizer info:', error);
    throw error;
  }
}

/**
 * Update user preferences in `users/{uid}.preferences`.
 */
export async function updateUserPreferences(
  uid: string,
  preferences: Partial<FirestoreUserPreferences>,
): Promise<void> {
  requireFirestore();
  const currentUser = requireAuth();

  if (currentUser.uid !== uid) {
    throw { code: 'auth/unauthorized', message: 'Cannot update another user\'s preferences.' };
  }

  const userRef = doc(db!, 'users', uid);
  const updates: FirestoreUpdateData = { updatedAt: serverTimestamp() };

  if (preferences.language !== undefined) updates['preferences.language'] = preferences.language;
  if (preferences.timezone !== undefined) updates['preferences.timezone'] = preferences.timezone;
  if (preferences.currency !== undefined) updates['preferences.currency'] = preferences.currency;
  if (preferences.notifications !== undefined) updates['preferences.notifications'] = preferences.notifications;
  if (preferences.smartPreferences !== undefined) updates['preferences.smartPreferences'] = preferences.smartPreferences;

  try {
    await updateDoc(userRef, updates);
    logger.log('✅ User preferences updated:', uid);
  } catch (error) {
    logger.error('❌ Failed to update user preferences:', error);
    throw error;
  }
}

/**
 * Update user privacy settings in `users/{uid}.privacy`.
 */
export async function updateUserPrivacy(
  uid: string,
  privacy: Partial<FirestoreUserPrivacy>,
): Promise<void> {
  requireFirestore();
  const currentUser = requireAuth();

  if (currentUser.uid !== uid) {
    throw { code: 'auth/unauthorized', message: 'Cannot update another user\'s privacy settings.' };
  }

  const userRef = doc(db!, 'users', uid);
  const updates: FirestoreUpdateData = { updatedAt: serverTimestamp() };

  if (privacy.profileVisibility !== undefined) updates['privacy.profileVisibility'] = privacy.profileVisibility;
  if (privacy.showEmail !== undefined) updates['privacy.showEmail'] = privacy.showEmail;
  if (privacy.showPhone !== undefined) updates['privacy.showPhone'] = privacy.showPhone;
  if (privacy.showAttendedEvents !== undefined) updates['privacy.showAttendedEvents'] = privacy.showAttendedEvents;

  try {
    await updateDoc(userRef, updates);
    logger.log('✅ User privacy updated:', uid);
  } catch (error) {
    logger.error('❌ Failed to update user privacy:', error);
    throw error;
  }
}

/**
 * Update user security settings in `users/{uid}.security`.
 */
export async function updateUserSecurity(
  uid: string,
  security: Partial<FirestoreUserSecurity>,
): Promise<void> {
  requireFirestore();
  const currentUser = requireAuth();

  if (currentUser.uid !== uid) {
    throw { code: 'auth/unauthorized', message: 'Cannot update another user\'s security settings.' };
  }

  const userRef = doc(db!, 'users', uid);
  const updates: FirestoreUpdateData = { updatedAt: serverTimestamp() };

  if (security.twoFactorEnabled !== undefined) updates['security.twoFactorEnabled'] = security.twoFactorEnabled;
  if (security.activeSessions !== undefined) updates['security.activeSessions'] = security.activeSessions;

  try {
    await updateDoc(userRef, updates);
    logger.log('✅ User security settings updated:', uid);
  } catch (error) {
    logger.error('❌ Failed to update user security:', error);
    throw error;
  }
}

/**
 * Combined update — writes profile, preferences, privacy, organizer info
 * in a single Firestore update call. Used by the Save Changes action.
 */
export async function saveFullUserProfile(
  uid: string,
  data: {
    profile?: Partial<FirestoreUserProfile>;
    organizerInfo?: Partial<FirestoreOrganizerInfo>;
    preferences?: Partial<FirestoreUserPreferences>;
    privacy?: Partial<FirestoreUserPrivacy>;
    security?: Partial<FirestoreUserSecurity>;
  },
): Promise<void> {
  requireFirestore();
  const currentUser = requireAuth();

  if (currentUser.uid !== uid) {
    throw { code: 'auth/unauthorized', message: 'Cannot update another user\'s profile.' };
  }

  const userRef = doc(db!, 'users', uid);
  const updates: FirestoreUpdateData = { updatedAt: serverTimestamp() };

  // Profile fields
  if (data.profile) {
    const p = data.profile;
    if (p.fullName !== undefined) {
      updates['profile.fullName'] = p.fullName;
      const parts = p.fullName.split(' ');
      updates['displayName'] = p.fullName;
      updates['firstName'] = parts[0] || null;
      updates['lastName'] = parts.slice(1).join(' ') || null;
    }
    if (p.email !== undefined) updates['profile.email'] = p.email;
    if (p.phone !== undefined) {
      updates['profile.phone'] = p.phone || null;
      updates['phoneNumber'] = p.phone || null;
    }
    if (p.dateOfBirth !== undefined) {
      updates['profile.dateOfBirth'] = p.dateOfBirth || null;
      updates['dob'] = p.dateOfBirth || null;
    }
    if (p.gender !== undefined) {
      updates['profile.gender'] = p.gender || null;
      updates['gender'] = p.gender || null;
    }
    if (p.bio !== undefined) updates['profile.bio'] = p.bio || null;
    if (p.location !== undefined) updates['profile.location'] = p.location || null;
    if (p.avatarUrl !== undefined) {
      updates['profile.avatarUrl'] = p.avatarUrl || null;
      updates['photoURL'] = p.avatarUrl || null;
    }
  }

  // Organizer info
  if (data.organizerInfo) {
    const o = data.organizerInfo;
    if (o.organizationName !== undefined) {
      updates['organizerInfo.organizationName'] = o.organizationName || null;
      updates['organizationName'] = o.organizationName || null;
    }
    if (o.website !== undefined) {
      updates['organizerInfo.website'] = o.website || null;
      updates['websiteUrl'] = o.website || null;
    }
    if (o.socialLinks !== undefined) {
      // Clean undefined values to prevent Firestore errors
      const cleanSocials = Object.entries(o.socialLinks).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string | null | undefined>);

      updates['organizerInfo.socialLinks'] = cleanSocials;
      updates['socials'] = cleanSocials;
    }
    if (o.verificationStatus !== undefined) {
      updates['organizerInfo.verificationStatus'] = o.verificationStatus;
      updates['verificationStatus'] = o.verificationStatus;
    }
    if (o.verificationDocumentUrl !== undefined) {
      updates['organizerInfo.verificationDocumentUrl'] = o.verificationDocumentUrl || null;
    }
    if (o.branding !== undefined) {
      updates['organizerInfo.branding'] = o.branding;
      updates['branding'] = o.branding; // legacy support if needed, otherwise just organizerInfo
    }
  }

  // Preferences — write the full nested object
  if (data.preferences) {
    updates['preferences'] = data.preferences;
  }

  // Privacy
  if (data.privacy) {
    updates['privacy'] = data.privacy;
  }

  // Security
  if (data.security) {
    if (data.security.twoFactorEnabled !== undefined) {
      updates['security.twoFactorEnabled'] = data.security.twoFactorEnabled;
    }
  }

  // Sync Auth profile if displayName or photoURL changed
  if (updates['displayName'] || updates['photoURL']) {
    try {
      const { updateProfile } = await import('firebase/auth');
      const authUpdates: { displayName?: string; photoURL?: string } = {};
      if (updates['displayName']) authUpdates.displayName = updates['displayName'] as string;
      if (updates['photoURL']) authUpdates.photoURL = updates['photoURL'] as string;
      await updateProfile(currentUser, authUpdates);
      logger.log('🔐 Firebase Auth profile synced');
    } catch (err) {
      logger.warn('Failed to sync Auth profile (non-critical):', err);
    }
  }

  try {
    // updateDoc correctly interprets dot-notation keys as nested field paths
    await updateDoc(userRef, updates);
    logger.log('✅ Full user profile saved:', uid);
  } catch (error: unknown) {
    // If the document doesn't exist yet, create it with a full initial structure
    const errCode = (error as { code?: string })?.code;
    if (errCode === 'not-found' || (error instanceof Error && error.message?.includes('No document to update'))) {
      logger.warn('⚠️ User doc not found during update — creating with setDoc...');
      try {
        // Build a properly nested document (NOT dot-notation) for setDoc
        const initialDoc: FirestoreUpdateData = {
          uid,
          role: 'user',
          accountStatus: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          profile: data.profile || {},
          preferences: data.preferences || { language: 'en', timezone: 'UTC', currency: 'USD', notifications: { eventReminders: true, promotionalEmails: false, pushNotifications: false, smsNotifications: false, bookingConfirmations: true, eventUpdates: true, newsletter: false, inApp: true }, smartPreferences: {} },
          privacy: data.privacy || { profileVisibility: 'public', showEmail: true, showPhone: false, showAttendedEvents: true },
          security: { twoFactorEnabled: data.security?.twoFactorEnabled ?? false, activeSessions: [] },
        };
        if (data.organizerInfo) initialDoc['organizerInfo'] = data.organizerInfo;
        // Sync legacy flat fields
        if (data.profile?.fullName) {
          const parts = data.profile.fullName.split(' ');
          initialDoc['displayName'] = data.profile.fullName;
          initialDoc['firstName'] = parts[0] || null;
          initialDoc['lastName'] = parts.slice(1).join(' ') || null;
        }
        if (data.profile?.email) initialDoc['email'] = data.profile.email;
        if (data.profile?.phone) initialDoc['phoneNumber'] = data.profile.phone;
        if (data.profile?.avatarUrl) initialDoc['photoURL'] = data.profile.avatarUrl;
        await setDoc(userRef, initialDoc);
        logger.log('✅ User doc created via setDoc fallback:', uid);
      } catch (createError) {
        logger.error('❌ Failed to create user profile via setDoc fallback:', createError);
        throw createError;
      }
    } else {
      logger.error('❌ Failed to save full user profile:', error);
      throw error;
    }
  }
}

// =============================================================================
// ADMIN OPERATIONS — Requires elevated permissions
// =============================================================================

/**
 * Update a user's account status (admin/super_admin only).
 * Firestore rules enforce the role check.
 */
export async function updateAccountStatus(
  uid: string,
  status: AccountStatus,
): Promise<void> {
  requireFirestore();

  const userRef = doc(db!, 'users', uid);
  await updateDoc(userRef, {
    accountStatus: status,
    updatedAt: serverTimestamp(),
  });
  logger.log(`✅ Account status updated to "${status}" for user:`, uid);
}

/**
 * Update a user's role (admin/super_admin only).
 * Firestore rules enforce the role check.
 */
export async function updateUserRole(
  uid: string,
  role: string,
): Promise<void> {
  requireFirestore();

  const userRef = doc(db!, 'users', uid);
  await updateDoc(userRef, {
    role,
    updatedAt: serverTimestamp(),
  });
  logger.log(`✅ User role updated to "${role}" for user:`, uid);
}

/**
 * Subscribe to all users (admin only)
 */
export function subscribeToAllUsers(callback: (users: FirestoreUser[]) => void): () => void {
  requireFirestore();
  const usersRef = collection(db!, 'users');
  // Order by createdAt desc is good but requires index. If index missing, it will throw.
  // We can try without orderBy first or catch the error.
  const q = query(usersRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map((d) => d.data() as FirestoreUser);
    callback(users);
  }, (error) => {
    logger.error('Failed to subscribe to users:', error);
  });
}

/**
 * Fetch all users (admin only). Returns array of user documents.
 */
export async function getAllUsers(): Promise<FirestoreUser[]> {
  requireFirestore();

  try {
    const usersRef = collection(db!, 'users');
    const snap = await getDocs(usersRef);
    return snap.docs.map((d) => d.data() as FirestoreUser);
  } catch (error) {
    logger.error('Failed to fetch all users:', error);
    throw error;
  }
}

/**
 * Search users by email (admin only).
 */
export async function searchUsersByEmail(email: string): Promise<FirestoreUser[]> {
  requireFirestore();

  try {
    const usersRef = collection(db!, 'users');
    const q = query(usersRef, where('profile.email', '==', email));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as FirestoreUser);
  } catch (error) {
    logger.error('Failed to search users by email:', error);
    throw error;
  }
}

/**
 * Get users by organization ID.
 */
export async function getUsersByOrganization(orgId: string): Promise<FirestoreUser[]> {
  requireFirestore();

  try {
    const usersRef = collection(db!, 'users');
    const q = query(usersRef, where('organizationId', '==', orgId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as FirestoreUser);
  } catch (error) {
    logger.error('Failed to fetch org users:', error);
    throw error;
  }
}
