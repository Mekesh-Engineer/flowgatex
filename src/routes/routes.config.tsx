import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { UserRole } from '@/lib/constants';
import { ROUTES } from './paths';

// =============================================================================
// ROLE-BASED ROUTING CONFIGURATION
// =============================================================================
// Routes organized by user role and access level:
// - User/Attendee: Basic event browsing and ticket management
// - Organizer: Event creation, management, and analytics
// - Admin: System administration and user management
// - Super Admin: Complete system control with advanced features
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC PAGES (No authentication required)
// ─────────────────────────────────────────────────────────────────────────────
const HomePage = lazy(() => import('@/pages/public/HomePage'));
const AboutPage = lazy(() => import('@/pages/public/AboutPage'));
const ContactPage = lazy(() => import('@/pages/public/ContactPage'));
const SearchResultsPage = lazy(() => import('@/pages/public/SearchResultsPage'));
const CategoryPage = lazy(() => import('@/pages/public/CategoryPage'));

// ─────────────────────────────────────────────────────────────────────────────
// AUTH PAGES (Unauthenticated users only)
// ─────────────────────────────────────────────────────────────────────────────
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));

// ─────────────────────────────────────────────────────────────────────────────
// EVENT PAGES (Mixed access levels)
// ─────────────────────────────────────────────────────────────────────────────
const EventsPage = lazy(() => import('@/pages/events/EventsPage'));
const EventDetailsPage = lazy(() => import('@/pages/events/EventDetailsPage'));
const CreateEventPage = lazy(() => import('@/pages/events/CreateEventPage'));
const ManageEventPage = lazy(() => import('@/pages/events/ManageEventPage'));

// ─────────────────────────────────────────────────────────────────────────────
// BOOKING PAGES (Authenticated users)
// ─────────────────────────────────────────────────────────────────────────────
const CheckoutPage = lazy(() => import('@/pages/booking/CheckoutPage'));
const BookingSuccessPage = lazy(() => import('@/pages/booking/BookingSuccessPage'));
const CartPage = lazy(() => import('@/pages/booking/CartPage'));
const MyTicketsPage = lazy(() => import('@/pages/booking/MyTicketsPage'));
const TicketDetailPage = lazy(() => import('@/pages/booking/TicketDetailPage'));

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD PAGES (Role-specific)
// ─────────────────────────────────────────────────────────────────────────────
const UserDashboard = lazy(() => import('@/pages/dashboard/Attendee/UserDashboard'));
const MyBookingsPage = lazy(() => import('@/pages/dashboard/Attendee/MyBookingsPage'));
const FavoritesPage = lazy(() => import('@/pages/dashboard/Attendee/FavoritesPage'));
const WalletPage = lazy(() => import('@/pages/dashboard/Attendee/WalletPage'));
const SettingsPage = lazy(() => import('@/pages/dashboard/Attendee/SettingsPage'));

const OrganizerDashboard = lazy(() => import('@/pages/dashboard/Organizer/OrganizerDashboard'));
const MyEventsPage = lazy(() => import('@/pages/dashboard/Organizer/MyEventsPage'));
const EventAnalyticsPage = lazy(() => import('@/pages/dashboard/Organizer/EventAnalyticsPage'));
const AttendeeManagementPage = lazy(() => import('@/pages/dashboard/Organizer/AttendeeManagementPage'));
const PayoutsPage = lazy(() => import('@/pages/dashboard/Organizer/PayoutsPage'));
const IoTDevicesPage = lazy(() => import('@/pages/dashboard/Organizer/IoTDevicesPage'));
const MarketingToolsPage = lazy(() => import('@/pages/dashboard/Organizer/MarketingToolsPage'));

const ScannerPage = lazy(() => import('@/pages/dashboard/Organizer/ScannerPage'));

const AdminDashboard = lazy(() => import('@/pages/dashboard/Admin/AdminDashboard'));
const UserManagementPage = lazy(() => import('@/pages/dashboard/Admin/UserManagementPage'));
const OrganizerApprovalsPage = lazy(() => import('@/pages/dashboard/Admin/OrganizerApprovalsPage'));
const EventModerationPage = lazy(() => import('@/pages/dashboard/Admin/EventModerationPage'));
const PlatformSettingsPage = lazy(() => import('@/pages/dashboard/Admin/PlatformSettingsPage'));
const ReportsPage = lazy(() => import('@/pages/dashboard/Admin/ReportsPage'));
const PromoCodesPage = lazy(() => import('@/pages/dashboard/Admin/PromoCodesPage'));
const AttendeeManagementAdminPage = lazy(() => import('@/pages/dashboard/Admin/AttendeeManagementPage'));
const TransactionMonitoringPage = lazy(() => import('@/pages/dashboard/Admin/TransactionsPage'));
const AuditLogsPage = lazy(() => import('@/pages/dashboard/Admin/AuditLogsPage'));

// ─────────────────────────────────────────────────────────────────────────────
// SUPER ADMIN DASHBOARD PAGES
// ─────────────────────────────────────────────────────────────────────────────
const SuperAdminDashboard = lazy(() => import('@/pages/dashboard/SuperAdmin/SuperAdminDashboard'));
const SuperAdminPlaceholder = lazy(() => import('@/pages/dashboard/SuperAdmin/SuperAdminPlaceholder'));

// Super Admin Specific Pages
const SuperAdminUserManagementPage = lazy(() => import('@/pages/dashboard/SuperAdmin/UserManagementPage'));
const RoleManagementPage = lazy(() => import('@/pages/dashboard/SuperAdmin/RoleManagementPage'));
const SuperAdminPlatformSettingsPage = lazy(() => import('@/pages/dashboard/SuperAdmin/PlatformSettingsPage'));
const AdminManagementPage = lazy(() => import('@/pages/dashboard/SuperAdmin/AdminManagementPage'));
const OrganizationManagementPage = lazy(() => import('@/pages/dashboard/SuperAdmin/OrganizationManagementPage'));
const IoTFleetManagementPage = lazy(() => import('@/pages/dashboard/SuperAdmin/IoTFleetManagementPage'));
const FinancialOverviewPage = lazy(() => import('@/pages/dashboard/SuperAdmin/FinancialOverviewPage'));
const AuditLogViewerPage = lazy(() => import('@/pages/dashboard/SuperAdmin/AuditLogViewerPage'));
const SecurityAlertsPage = lazy(() => import('@/pages/dashboard/SuperAdmin/SecurityAlertsPage'));

// ─────────────────────────────────────────────────────────────────────────────
// COMMON AUTH PAGES (Protected)
// ─────────────────────────────────────────────────────────────────────────────
const UserProfile = lazy(() => import('@/pages/common/UserProfile'));
const SupportPage = lazy(() => import('@/pages/common/SupportPage'));

// ─────────────────────────────────────────────────────────────────────────────
// ERROR PAGES
// ─────────────────────────────────────────────────────────────────────────────
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

export interface AppRoute {
  path: string;
  element: React.ReactNode;
  requiresAuth?: boolean;
  roles?: UserRole[];
  children?: AppRoute[];
  description?: string;
  feature?: string;
}

// =============================================================================
// PUBLIC ROUTES (No authentication required)
// Access: Everyone
// =============================================================================
export const publicRoutes: RouteObject[] = [
  { path: ROUTES.HOME, element: <HomePage /> },
  { path: ROUTES.ABOUT, element: <AboutPage /> },
  { path: ROUTES.CONTACT, element: <ContactPage /> },
  { path: ROUTES.EVENTS, element: <EventsPage /> },
  { path: ROUTES.SEARCH, element: <SearchResultsPage /> },
  { path: ROUTES.CATEGORY, element: <CategoryPage /> },
  { path: ROUTES.SUPPORT, element: <SupportPage /> },
];

// =============================================================================
// AUTH ROUTES (Unauthenticated only - redirect if already logged in)
// Access: Guest users
// =============================================================================
export const authRoutes: RouteObject[] = [
  { path: ROUTES.LOGIN, element: <LoginPage /> },
  { path: ROUTES.REGISTER, element: <RegisterPage /> },
  { path: ROUTES.FORGOT_PASSWORD, element: <ForgotPasswordPage /> },
  { path: ROUTES.RESET_PASSWORD, element: <ResetPasswordPage /> },
];

// =============================================================================
// USER/ATTENDEE ROUTES (Basic authenticated access)
// Access: All authenticated users (user, organizer, admin, superadmin)
// Features:
// - Personal dashboard with ticket overview
// - Booking and checkout process
// - Profile management
// - Ticket history and QR codes
// =============================================================================
export const protectedRoutes: RouteObject[] = [
  { path: ROUTES.DASHBOARD, element: <UserDashboard /> },
  { path: ROUTES.EVENT_DETAILS, element: <EventDetailsPage /> },
  { path: ROUTES.CART, element: <CartPage /> },
  { path: ROUTES.CHECKOUT, element: <CheckoutPage /> },
  { path: ROUTES.BOOKING_SUCCESS, element: <BookingSuccessPage /> },
  { path: ROUTES.MY_TICKETS, element: <MyTicketsPage /> },
  { path: ROUTES.TICKET_DETAIL, element: <TicketDetailPage /> },

  // Common Protected Routes
  { path: ROUTES.PROFILE, element: <UserProfile /> },

  // Attendee Dashboard Routes
  { path: ROUTES.MY_BOOKINGS, element: <MyBookingsPage /> },
  { path: ROUTES.FAVORITES, element: <FavoritesPage /> },
  { path: ROUTES.WALLET, element: <WalletPage /> },
  { path: ROUTES.SETTINGS, element: <SettingsPage /> },
];

// =============================================================================
// ORGANIZER ROUTES (Event management and analytics)
// Access: Organizer, Admin, Super Admin
// Features:
// - Create and manage events
// - Attendees list and check-in control
// - Event analytics and reports
// - IoT device management
// - Communication and notifications
// - Ticket sales management
// =============================================================================
export const organizerRoutes: RouteObject[] = [
  // Main organizer dashboard
  { path: ROUTES.ORGANIZER, element: <OrganizerDashboard /> },

  // Event management
  { path: ROUTES.CREATE_EVENT, element: <CreateEventPage /> },
  { path: '/organizer/events/:id/manage', element: <ManageEventPage /> },

  // Organizer feature pages
  { path: ROUTES.ORGANIZER_EVENTS, element: <MyEventsPage /> },
  { path: ROUTES.EVENT_ANALYTICS, element: <EventAnalyticsPage /> },
  { path: ROUTES.EVENT_ANALYTICS_OVERVIEW, element: <EventAnalyticsPage /> },
  { path: ROUTES.ATTENDEE_MANAGEMENT, element: <AttendeeManagementPage /> },
  { path: ROUTES.ATTENDEE_MANAGEMENT_OVERVIEW, element: <AttendeeManagementPage /> },
  { path: ROUTES.PAYOUTS, element: <PayoutsPage /> },
  { path: ROUTES.IOT_DEVICES, element: <IoTDevicesPage /> },
  { path: ROUTES.MARKETING, element: <MarketingToolsPage /> },
  { path: ROUTES.SCANNER, element: <ScannerPage /> },
];

// =============================================================================
// ADMIN ROUTES (System administration)
// Access: Admin, Super Admin
// Features:
// - User and role management
// - System health monitoring
// - Platform-wide analytics
// - Content moderation
// - Support ticket management
// - Security and audit logs
// =============================================================================
export const adminRoutes: RouteObject[] = [
  // Main admin dashboard
  { path: ROUTES.ADMIN, element: <AdminDashboard /> },

  // Admin feature pages
  { path: ROUTES.ADMIN_USERS, element: <UserManagementPage /> },
  { path: ROUTES.ADMIN_ORGANIZERS, element: <OrganizerApprovalsPage /> },
  { path: ROUTES.ADMIN_EVENTS, element: <EventModerationPage /> },
  { path: ROUTES.ADMIN_PROMO_CODES, element: <PromoCodesPage /> },
  { path: ROUTES.ADMIN_SETTINGS, element: <PlatformSettingsPage /> },
  { path: ROUTES.ADMIN_REPORTS, element: <ReportsPage /> },
  { path: ROUTES.ADMIN_ATTENDEES, element: <AttendeeManagementAdminPage /> },
  { path: ROUTES.ADMIN_TRANSACTIONS, element: <TransactionMonitoringPage /> },
  { path: ROUTES.ADMIN_AUDIT_LOGS, element: <AuditLogsPage /> },
];

// =============================================================================
// SUPER ADMIN ROUTES (Complete system control)
// Access: Super Admin only
// Features:
// - Advanced system configuration
// - Database management
// - API key management
// - Global settings and permissions
// - Advanced security controls
// - System backups and maintenance
// =============================================================================
export const superAdminRoutes: RouteObject[] = [
  // Super admin dashboard — Dedicated Super Admin page
  { path: ROUTES.SUPER_ADMIN, element: <SuperAdminDashboard /> },

  // Specialized Super Admin Pages
  { path: ROUTES.SUPER_ADMIN_USERS, element: <SuperAdminUserManagementPage /> },
  { path: ROUTES.SUPER_ADMIN_SETTINGS, element: <SuperAdminPlatformSettingsPage /> },

  // Additional super admin features
  { path: ROUTES.SUPER_ADMIN_ROLES, element: <RoleManagementPage /> },
  { path: ROUTES.SUPER_ADMIN_ADMINS, element: <AdminManagementPage /> },
  { path: ROUTES.SUPER_ADMIN_ORGS, element: <OrganizationManagementPage /> },
  { path: ROUTES.SUPER_ADMIN_IOT, element: <IoTFleetManagementPage /> },
  { path: ROUTES.SUPER_ADMIN_FINANCE, element: <FinancialOverviewPage /> },
  { path: ROUTES.SUPER_ADMIN_AUDIT, element: <AuditLogViewerPage /> },
  { path: ROUTES.SUPER_ADMIN_SECURITY, element: <SecurityAlertsPage /> },
];

// =============================================================================
// ERROR & FALLBACK ROUTES
// =============================================================================
export const fallbackRoute: RouteObject = {
  path: ROUTES.NOT_FOUND,
  element: <NotFoundPage />,
};

// =============================================================================
// ROLE-BASED ROUTE MAPPING
// Used for dynamic navigation and access control
// =============================================================================
export const ROLE_DASHBOARDS: Record<UserRole, string> = {
  [UserRole.USER]: ROUTES.DASHBOARD,
  [UserRole.ORGANIZER]: ROUTES.ORGANIZER,
  [UserRole.ORG_ADMIN]: ROUTES.ORGANIZER,
  [UserRole.ADMIN]: ROUTES.ADMIN,
  [UserRole.SUPER_ADMIN]: ROUTES.SUPER_ADMIN,
};

// Export defaults
export default {
  publicRoutes,
  authRoutes,
  protectedRoutes,
  organizerRoutes,
  adminRoutes,
  superAdminRoutes,
  fallbackRoute,
  ROLE_DASHBOARDS,
};
