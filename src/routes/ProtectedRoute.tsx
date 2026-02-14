import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/zustand/stores';
import { useMaintenanceMode } from '@/hooks/useRBAC';
import { useSettingsStore } from '@/store/zustand/settingsStore';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import MaintenancePage from '@/pages/common/MaintenancePage';

// =============================================================================
// PROTECTED ROUTE COMPONENT
// =============================================================================
// Wraps routes that require authentication.
// - Shows loading spinner while Auth state is being determined.
// - Redirects to login page if user is not authenticated.
// - Blocks access during maintenance mode (except for admins).
// - Preserves the original destination (location state) for post-login redirect.

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({ children, redirectTo = '/login' }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const platformLoaded = useSettingsStore((s) => s.platformLoaded);
  const location = useLocation();
  const inMaintenance = useMaintenanceMode();

  // 1. Loading State: Wait for Auth + platform settings to load
  if (isLoading || !platformLoaded) {
    return <LoadingSpinner fullScreen message="Verifying authentication..." />;
  }

  // 2. Unauthenticated State: Redirect to Login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // 3. Maintenance Mode: Block non-admin users
  if (inMaintenance) {
    return <MaintenancePage />;
  }

  // 4. Authenticated State: Render the protected page
  return <>{children}</>;
}