import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginWithEmail, loginWithGoogle, loginWithFacebook, getUserData } from '../services/authService';
import { auth } from '@/services/firebase';
import { ROLE_DASHBOARDS } from '@/routes/routes.config';
import { UserRole } from '@/lib/constants';
import { showSuccess, showError } from '@/components/common/Toast';
import type { SignupRole } from '../types/registration.types';

export function useLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the intended destination from location state, or fallback to role-based dashboard
  const getRedirectPath = async (): Promise<string> => {
    const from = (location.state as any)?.from?.pathname;
    if (from && from !== '/login' && from !== '/register') {
      return from;
    }

    // Determine role-based dashboard
    const firebaseUser = auth?.currentUser;
    if (firebaseUser) {
      try {
        const userProfile = await getUserData(firebaseUser.uid);
        const targetRole = (userProfile?.role as UserRole) || UserRole.USER;
        return ROLE_DASHBOARDS[targetRole] || '/dashboard';
      } catch {
        return '/dashboard';
      }
    }
    return '/dashboard';
  };

  const login = async (email: string, password: string, role?: SignupRole) => {
    setIsLoading(true);
    setError(null);

    try {
      await loginWithEmail({ email, password, role });
      const targetPath = await getRedirectPath();
      showSuccess('Welcome back!');
      navigate(targetPath, { replace: true });
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      const message =
        error.code === 'auth/invalid-credential' || 
        error.code === 'auth/user-not-found' || 
        error.code === 'auth/wrong-password'
          ? 'Invalid email or password. Please try again.'
          : error.code === 'auth/unauthorized-role'
          ? error.message || 'You are not authorized to login with this role.'
          : error.message || 'Login failed';
      setError(message);
      showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const loginGoogle = async (role?: SignupRole) => {
    setIsLoading(true);
    setError(null);

    try {
      await loginWithGoogle(role);
      const targetPath = await getRedirectPath();
      showSuccess('Welcome!');
      navigate(targetPath, { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google login failed';
      setError(message);
      showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const loginFacebook = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await loginWithFacebook();
      const targetPath = await getRedirectPath();
      showSuccess('Welcome!');
      navigate(targetPath, { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Facebook login failed';
      setError(message);
      showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    loginGoogle,
    loginFacebook,
    isLoading,
    error,
  };
}

export default useLogin;
