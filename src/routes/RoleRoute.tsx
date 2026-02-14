import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuthStore } from '@/store/zustand/stores';
import { UserRole } from '@/lib/constants';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ROLE_DASHBOARDS } from './routes.config';

// =============================================================================
// ROLE-BASED ROUTE COMPONENT
// =============================================================================
// Wraps routes that require specific user roles
// Checks both authentication and role authorization
//
// Access Levels:
// - User/Attendee: Basic access (user role)
// - Organizer: Event management (organizer, admin, superadmin)
// - Admin: System administration (admin, superadmin)
// - Super Admin: Complete control (superadmin only)
//
// Usage:
//   <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
//     <AdminDashboard />
//   </RoleRoute>
// =============================================================================

interface RoleRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

function RoleRoute({ children, allowedRoles, redirectTo }: RoleRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  // Show loading spinner while checking authentication and role
  if (isLoading) {
    return <LoadingSpinner fullScreen message="Checking permissions..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role
  if (!user || !allowedRoles.includes(user.role as UserRole)) {
    // Redirect to user's default dashboard based on their role
    const userDashboard = user?.role ? ROLE_DASHBOARDS[user.role as UserRole] : '/dashboard';
    const fallback = redirectTo || userDashboard || '/dashboard';

    return <Navigate to={fallback} replace />;
  }

  // User has required role, render the protected content
  return <>{children}</>;
}

export default RoleRoute;
