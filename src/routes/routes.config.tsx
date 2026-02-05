import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { UserRole } from '@/lib/constants';

// Public pages
const HomePage = lazy(() => import('@/pages/public/HomePage'));
const AboutPage = lazy(() => import('@/pages/public/AboutPage'));
const ContactPage = lazy(() => import('@/pages/public/ContactPage'));

// Auth pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));

// Event pages
const EventsPage = lazy(() => import('@/pages/events/EventsPage'));
const EventDetailsPage = lazy(() => import('@/pages/events/EventDetailsPage'));
const CreateEventPage = lazy(() => import('@/pages/events/CreateEventPage'));
const ManageEventPage = lazy(() => import('@/pages/events/ManageEventPage'));

// Booking pages
const CheckoutPage = lazy(() => import('@/pages/booking/CheckoutPage'));
const BookingSuccessPage = lazy(() => import('@/pages/booking/BookingSuccessPage'));

// Dashboard pages
const UserDashboard = lazy(() => import('@/pages/dashboard/UserDashboard'));
const OrganizerDashboard = lazy(() => import('@/pages/dashboard/OrganizerDashboard'));
const AdminDashboard = lazy(() => import('@/pages/dashboard/AdminDashboard'));

// 404
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

export interface AppRoute {
  path: string;
  element: React.ReactNode;
  requiresAuth?: boolean;
  roles?: UserRole[];
  children?: AppRoute[];
}

export const publicRoutes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/about', element: <AboutPage /> },
  { path: '/contact', element: <ContactPage /> },
  { path: '/events', element: <EventsPage /> },
  { path: '/events/:id', element: <EventDetailsPage /> },
];

export const authRoutes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
];

export const protectedRoutes: RouteObject[] = [
  { path: '/dashboard', element: <UserDashboard /> },
  { path: '/checkout', element: <CheckoutPage /> },
  { path: '/booking/success', element: <BookingSuccessPage /> },
];

export const organizerRoutes: RouteObject[] = [
  { path: '/organizer', element: <OrganizerDashboard /> },
  { path: '/organizer/events/create', element: <CreateEventPage /> },
  { path: '/organizer/events/:id/manage', element: <ManageEventPage /> },
];

export const adminRoutes: RouteObject[] = [
  { path: '/admin', element: <AdminDashboard /> },
];

export const fallbackRoute: RouteObject = {
  path: '*',
  element: <NotFoundPage />,
};

export default {
  publicRoutes,
  authRoutes,
  protectedRoutes,
  organizerRoutes,
  adminRoutes,
  fallbackRoute,
};
