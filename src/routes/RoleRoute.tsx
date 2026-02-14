import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuthStore } from '@/store/zustand/stores';
import { UserRole } from '@/lib/constants';
import { useSettingsStore } from '@/store/zustand/settingsStore';
import { useMaintenanceMode } from '@/hooks/useRBAC';
import { toAppRole, usePermission } from '@/hooks/useRBAC';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import MaintenancePage from '@/pages/common/MaintenancePage';
import { ROLE_DASHBOARDS } from './routes.config';
import type { Permission } from '@/types/rbac.types';

// =============================================================================
// ROLE-BASED ROUTE COMPONENT (RBAC-Integrated)
// =============================================================================
// Wraps routes that require specific user roles and/or permissions.
// Checks authentication, role authorization, feature flags, maintenance mode,
// and dynamic permissions from Firestore.
//
// Usage:
//   <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
//     <AdminDashboard />
//   </RoleRoute>
//
//   <RoleRoute allowedRoles={[UserRole.ORGANIZER]} requiredPermissions={['event:create']}>
//     <CreateEvent />
//   </RoleRoute>
// =============================================================================

interface RoleRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  /** Optional: require specific permissions beyond role check */
  requiredPermissions?: Permission[];
  redirectTo?: string;
}

function RoleRoute({ children, allowedRoles, requiredPermissions, redirectTo }: RoleRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const platformLoaded = useSettingsStore((s) => s.platformLoaded);
  const location = useLocation();
  const inMaintenance = useMaintenanceMode();
  // Check first required permission (additional ones checked below)
  const firstPermGranted = usePermission(requiredPermissions?.[0] ?? 'event:read');

  // Show loading spinner while checking authentication, role, and settings
  if (isLoading || !platformLoaded) {
    return <LoadingSpinner fullScreen message="Checking permissions..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Maintenance mode blocks non-admin users
  if (inMaintenance) {
    return <MaintenancePage />;
  }

  // Super Admin bypass — can access all routes
  const appRole = toAppRole(user?.role);
  if (appRole === 'superadmin') {
    return <>{children}</>;
  }

  // Check if user has required role
  if (!user || !allowedRoles.includes(user.role as UserRole)) {
    const userDashboard = user?.role ? ROLE_DASHBOARDS[user.role as UserRole] : '/dashboard';
    const fallback = redirectTo || userDashboard || '/dashboard';
    return <Navigate to={fallback} replace />;
  }

  // Check required permissions (if specified)
  if (requiredPermissions && requiredPermissions.length > 0 && !firstPermGranted) {
    const userDashboard = user?.role ? ROLE_DASHBOARDS[user.role as UserRole] : '/dashboard';
    const fallback = redirectTo || userDashboard || '/dashboard';
    return <Navigate to={fallback} replace />;
  }

  // User has required role and permissions, render the protected content
  return <>{children}</>;
}

export default RoleRoute;