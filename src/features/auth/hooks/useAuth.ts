import { useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, firebaseEnabled } from '@/lib/firebase';
import { logger } from '@/lib/logger';
import { useAuthStore } from '@/store/zustand/stores';
import { UserRole } from '@/lib/constants';

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    setUser,
    clearUser,
    setLoading,
    setError,
  } = useAuthStore();

  // Keep a ref to the Firestore snapshot unsubscribe so we can clean it up
  const unsubUserDataRef = useRef<(() => void) | null>(null);
  // Use refs for timeouts so we can reliably clean them up
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const authTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const forceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Real Firebase only (no mock auth)
    if (!firebaseEnabled) {
      logger.error('Firebase is not enabled. Check VITE_MOCK_MODE and Firebase credentials.');
      setError('Firebase is not configured. Please connect Firebase to continue.');
      clearUser();
      setLoading(false);
      return;
    }

    if (!auth) {
      logger.error('Firebase Auth is not initialized');
      setError('Firebase Auth is not initialized. Please check Firebase setup.');
      clearUser();
      setLoading(false);
      return;
    }

    // Fallback if auth state never resolves
    authTimeoutRef.current = setTimeout(() => {
      setError('Auth state timed out. Please refresh or check your connection.');
      setLoading(false);
    }, 10000);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // Clean up previous listeners/timeouts
      if (unsubUserDataRef.current) {
        unsubUserDataRef.current();
        unsubUserDataRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
        authTimeoutRef.current = null;
      }
      if (forceTimeoutRef.current) {
        clearTimeout(forceTimeoutRef.current);
        forceTimeoutRef.current = null;
      }

      if (firebaseUser) {
        setLoading(true);

        // Fallback user object (Basic Auth Data)
        const basicUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          phoneNumber: firebaseUser.phoneNumber,
          role: UserRole.USER, // Default role until DB confirms otherwise
          emailVerified: firebaseUser.emailVerified,
          createdAt: new Date().toISOString(),
        };

        if (!db) {
          logger.warn('Firestore not configured. Using Firebase Auth data only.');
          setUser(basicUser);
          setLoading(false);
          return;
        }

        const userRef = doc(db, 'users', firebaseUser.uid);
        let hasDispatched = false;

        // Safety Timeout: If Firestore completely hangs (network), finish loading after 7s
        timeoutRef.current = setTimeout(() => {
          if (!hasDispatched) {
            logger.warn('User profile load timed out. Using basic auth data.');
            setError('User profile load timed out. Using basic auth data.');
            setUser(basicUser);
            setLoading(false);
            hasDispatched = true;
          }
        }, 7000);

        // Extra fallback: forcibly clear loading after 10s regardless
        forceTimeoutRef.current = setTimeout(() => {
          if (!hasDispatched) {
            logger.error('Forcibly ending loading state after 10s. Firestore listener did not respond.');
            setError('User profile listener did not respond. Please retry.');
            setLoading(false);
            hasDispatched = true;
          }
        }, 10000);

        let unsubUserData: (() => void) | null = null;
        try {
          unsubUserData = onSnapshot(
            userRef,
            (docSnap) => {
            // Clear safety timeout on first successful response
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            if (forceTimeoutRef.current) {
              clearTimeout(forceTimeoutRef.current);
              forceTimeoutRef.current = null;
            }

            if (docSnap.exists()) {
              const userData = docSnap.data();

              // Handle soft-deleted users
              if (userData.isDeleted === true) {
                logger.warn('User account is marked as deleted.');
                clearUser();
                setLoading(false);
                hasDispatched = true;
                return;
              }

              // Helper for timestamps
              const toISO = (val: any): string | undefined => {
                if (!val) return undefined;
                if (typeof val.toDate === 'function') return val.toDate().toISOString();
                if (typeof val === 'string') return val;
                if (typeof val === 'number') return new Date(val).toISOString();
                return undefined;
              };

              logger.log('User profile loaded from Firestore:', firebaseUser.uid);

              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email || userData.email,
                displayName: firebaseUser.displayName || userData.displayName,
                firstName: userData.firstName || userData.profile?.fullName?.split(' ')[0] || null,
                lastName: userData.lastName || userData.profile?.fullName?.split(' ').slice(1).join(' ') || null,
                photoURL: firebaseUser.photoURL || userData.photoURL || userData.profile?.avatarUrl || null,
                phoneNumber: firebaseUser.phoneNumber || userData.phoneNumber || userData.profile?.phone || null,
                role: (userData.role as UserRole) || UserRole.USER,
                emailVerified: firebaseUser.emailVerified,
                dob: userData.dob || userData.profile?.dateOfBirth || null,
                gender: userData.gender || userData.profile?.gender || null,
                // RBAC fields
                organizationId: userData.organizationId || undefined,
                accountStatus: userData.accountStatus || 'active',
                consents: userData.consents || {
                  terms: false,
                  marketing: false,
                  whatsapp: false,
                  liveLocation: false,
                },
                // Organizer fields
                bio: userData.bio || userData.profile?.bio || userData.organizerInfo?.organizationName || null,
                organizationName: userData.organizationName || userData.organizerInfo?.organizationName || null,
                organizerBio: userData.organizerBio || null,
                websiteUrl: userData.websiteUrl || userData.organizerInfo?.website || null,
                socials: userData.socials || userData.organizerInfo?.socialLinks || undefined,
                verificationStatus: userData.verificationStatus || userData.organizerInfo?.verificationStatus || undefined,
                // Preferences (supports both flat and nested structures)
                preferences: userData.preferences || undefined,
                privacy: userData.privacy || undefined,
                // Security
                security: userData.security || undefined,
                createdAt: toISO(userData.createdAt),
                updatedAt: toISO(userData.updatedAt),
              });
            } else {
              // If doc doesn't exist yet, load Basic User immediately.
              logger.log('User profile not found in DB yet (using basic auth).');
              setUser(basicUser);
            }

            // Ensure we stop the loading screen in both cases
            setLoading(false);
            hasDispatched = true;
            },
            (error) => {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            if (forceTimeoutRef.current) {
              clearTimeout(forceTimeoutRef.current);
              forceTimeoutRef.current = null;
            }
            logger.error('Firestore listener error:', error);
            setError('Failed to load user profile. Please check your permissions.');

            // On permission error or network error, fallback to basic user
            setUser(basicUser);
            setLoading(false);
            hasDispatched = true;
            }
          );
          unsubUserDataRef.current = unsubUserData;
        } catch (snapshotError) {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          if (forceTimeoutRef.current) {
            clearTimeout(forceTimeoutRef.current);
            forceTimeoutRef.current = null;
          }
          logger.error('Firestore listener failed to initialize:', snapshotError);
          setError('Failed to initialize user profile listener. Please retry.');
          setUser(basicUser);
          setLoading(false);
          hasDispatched = true;
        }
      } else {
        // No user logged in
        clearUser();
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubUserDataRef.current) {
        unsubUserDataRef.current();
        unsubUserDataRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
        authTimeoutRef.current = null;
      }
      if (forceTimeoutRef.current) {
        clearTimeout(forceTimeoutRef.current);
        forceTimeoutRef.current = null;
      }
    };
  }, [setUser, clearUser, setLoading, setError]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    isAdmin: user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN,
    isOrganizer: user?.role === UserRole.ORGANIZER,
    isOrgAdmin: user?.role === UserRole.ORG_ADMIN,
    isSuperAdmin: user?.role === UserRole.SUPER_ADMIN,
  };
}

export default useAuth;
