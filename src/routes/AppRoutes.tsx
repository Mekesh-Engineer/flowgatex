import { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
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
  fallbackRoute,
} from './routes.config';

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen message="Loading page..." />}>
      <Routes>
        {/* Public routes with Layout */}
        <Route element={<Layout />}>
          {publicRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>

        {/* Auth routes without Layout */}
        {authRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}

        {/* Protected routes with Layout */}
        <Route element={<Layout />}>
          {protectedRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={<ProtectedRoute>{route.element}</ProtectedRoute>}
            />
          ))}
        </Route>

        {/* Organizer routes with Layout */}
        <Route element={<Layout />}>
          {organizerRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <RoleRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ADMIN]}>
                  {route.element}
                </RoleRoute>
              }
            />
          ))}
        </Route>

        {/* Admin routes with Layout */}
        <Route element={<Layout />}>
          {adminRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <RoleRoute allowedRoles={[UserRole.ADMIN]}>{route.element}</RoleRoute>
              }
            />
          ))}
        </Route>

        {/* 404 fallback */}
        <Route element={<Layout />}>
          <Route path={fallbackRoute.path} element={fallbackRoute.element} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
