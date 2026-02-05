import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerWithEmail } from '../services/authService';
import { showSuccess, showError } from '@/components/common/Toast';

export function useRegister() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (email: string, password: string, displayName: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await registerWithEmail({ email, password, displayName });
      showSuccess('Account created successfully!');
      navigate('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    register,
    isLoading,
    error,
  };
}

export default useRegister;
