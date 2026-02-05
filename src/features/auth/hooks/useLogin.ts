import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithEmail, loginWithGoogle, loginWithFacebook } from '../services/authService';
import { showSuccess, showError } from '@/components/common/Toast';

export function useLogin() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await loginWithEmail({ email, password });
      showSuccess('Welcome back!');
      navigate('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const loginGoogle = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await loginWithGoogle();
      showSuccess('Welcome!');
      navigate('/dashboard');
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
      showSuccess('Welcome!');
      navigate('/dashboard');
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
