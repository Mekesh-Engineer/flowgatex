import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '@/features/auth/hooks/useAuth';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// =============================================================================
// PROTECTED ROUTE COMPONENT
// =============================================================================
// Wraps routes that require authentication.
// - Shows loading spinner while Auth state is being determined.
// - Redirects to login page if user is not authenticated.
// - Preserves the original destination (location state) for post-login redirect.

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({ children, redirectTo = '/login' }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 1. Loading State: Wait for Auth check to complete
  // The 'isLoading' flag is now reliably managed by the corrected useAuth hook.
  if (isLoading) {
    return <LoadingSpinner fullScreen message="Verifying authentication..." />;
  }

  // 2. Unauthenticated State: Redirect to Login
  if (!isAuthenticated) {
    // 'state={{ from: location }}' allows the Login page to redirect 
    // the user back to this page after a successful login.
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // 3. Authenticated State: Render the protected page
  return <>{children}</>;
}