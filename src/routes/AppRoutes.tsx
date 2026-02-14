import { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Mainlayout';
import DashboardLayout from '@/components/layout/dashboard/DashboardLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import { UserRole } from '@/lib/constants';
import {
  publicRoutes,
  authRoutes,
  protectedRoutes,
  organizerRoutes,
  adminRoutes,
  superAdminRoutes,
  fallbackRoute,
} from './routes.config';

// =============================================================================
// APP ROUTES COMPONENT
// =============================================================================
// Main routing configuration with role-based access control
//
// Route Categories:
// 1. Public Routes - Available to everyone (with Layout)
// 2. Auth Routes - Login/Register pages (no Layout)
// 3. Protected Routes - Authenticated users only (with DashboardLayout)
// 4. Organizer Routes - Organizers, Admins, Super Admins
// 5. Admin Routes - Admins and Super Admins
// 6. Super Admin Routes - Super Admins only
// =============================================================================

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen message="Loading page..." />}>
      <Routes>
        {/* ═══════════════════════════════════════════════════════════════
            PUBLIC ROUTES
            Layout: MainLayout (with Navbar & Footer)
            Access: Everyone
            Routes: Home, About, Contact, Events, Event Details
            ═══════════════════════════════════════════════════════════════ */}
        <Route element={<Layout />}>
          {publicRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>

        {/* ═══════════════════════════════════════════════════════════════
            AUTH ROUTES
            Layout: None (full-page auth screens)
            Access: Unauthenticated users only
            Routes: Login, Register, Forgot Password
            ═══════════════════════════════════════════════════════════════ */}
        {authRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}

        {/* ═══════════════════════════════════════════════════════════════
            ALL DASHBOARD ROUTES (Single DashboardLayout instance)
            Layout: DashboardLayout
            Access: Role-based per route
            
            Using a single DashboardLayout wrapper prevents unnecessary
            remounts when navigating between different role-based pages
            (e.g., /profile, /organizer, /admin). Each child route still
            has its own access control guard.
            ═══════════════════════════════════════════════════════════════ */}
        <Route element={<DashboardLayout />}>
          {/* User/Attendee routes — all authenticated users */}
          {protectedRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={<ProtectedRoute>{route.element}</ProtectedRoute>}
            />
          ))}

          {/* Organizer routes — organizer, org_admin, admin, superadmin */}
          {organizerRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <RoleRoute
                  allowedRoles={[
                    UserRole.ORGANIZER,
                    UserRole.ORG_ADMIN,
                    UserRole.ADMIN,
                    UserRole.SUPER_ADMIN,
                  ]}
                >
                  {route.element}
                </RoleRoute>
              }
            />
          ))}

          {/* Admin routes — admin, superadmin */}
          {adminRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
                  {route.element}
                </RoleRoute>
              }
            />
          ))}

          {/* Super Admin routes — superadmin only */}
          {superAdminRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <RoleRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                  {route.element}
                </RoleRoute>
              }
            />
          ))}
        </Route>

        {/* ═══════════════════════════════════════════════════════════════
            FALLBACK ROUTE (404)
            Layout: MainLayout
            Access: Everyone
            Route: Any unmatched paths
            ═══════════════════════════════════════════════════════════════ */}
        <Route element={<Layout />}>
          <Route path={fallbackRoute.path} element={fallbackRoute.element} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
