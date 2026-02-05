import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';

// Layout
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Lazy-loaded pages
const HomePage = lazy(() => import('./pages/public/HomePage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const EventsPage = lazy(() => import('./pages/events/EventsPage'));
const EventDetailsPage = lazy(() => import('./pages/events/EventDetailsPage'));
const UserDashboard = lazy(() => import('./pages/dashboard/UserDashboard'));
const OrganizerDashboard = lazy(() => import('./pages/dashboard/OrganizerDashboard'));
const AdminDashboard = lazy(() => import('./pages/dashboard/AdminDashboard'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <div id="main-content">
        <Routes>
          {/* Public routes */}
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailsPage />} />
          </Route>

          {/* Auth routes (no layout) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/organizer/*" element={<OrganizerDashboard />} />
            <Route path="/admin/*" element={<AdminDashboard />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </Suspense>
  );
}

export default App;
