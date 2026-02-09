import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firebaseEnabled } from '@/lib/firebase';
import { mockAuthService } from '@/lib/mockAuth';
import { useAppDispatch, useAppSelector } from '@/store/redux/hooks';
import { setUser, clearUser, setLoading } from '@/store/redux/slices/authSlice';
import { getUserData } from '../services/authService';
import { UserRole } from '@/lib/constants';

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading, error } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Use mock auth if Firebase is disabled
    if (!firebaseEnabled) {
      const unsubscribe = mockAuthService.onAuthStateChanged((mockUser) => {
        dispatch(setLoading(true));

        if (mockUser) {
          dispatch(
            setUser({
              uid: mockUser.uid,
              email: mockUser.email,
              displayName: mockUser.displayName,
              photoURL: mockUser.photoURL,
              phoneNumber: mockUser.phoneNumber,
              role: (mockUser.role as UserRole) || UserRole.USER,
              emailVerified: mockUser.emailVerified,
              createdAt: mockUser.createdAt instanceof Date ? mockUser.createdAt.toISOString() : String(mockUser.createdAt),
            })
          );
        } else {
          dispatch(clearUser());
        }
      });

      return () => unsubscribe();
    }

    // Use Firebase auth
    const unsubscribe = onAuthStateChanged(auth!, async (firebaseUser) => {
      dispatch(setLoading(true));

      if (firebaseUser) {
        try {
          // Get additional user data from Firestore
          const userData = await getUserData(firebaseUser.uid);

          dispatch(
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              phoneNumber: firebaseUser.phoneNumber,
              role: userData?.role || UserRole.USER,
              emailVerified: firebaseUser.emailVerified,
              createdAt: userData?.createdAt,
            })
          );
        } catch (error) {
          console.error('Error fetching user data:', error);
          dispatch(clearUser());
        }
      } else {
        dispatch(clearUser());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    isAdmin: user?.role === UserRole.ADMIN,
    isOrganizer: user?.role === UserRole.ORGANIZER,
  };
}

export default useAuth;
