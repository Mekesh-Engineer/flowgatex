// =============================================================================
// ROUTE PATH CONSTANTS — Single source of truth for all route paths
// =============================================================================

export const ROUTES = {
  // Public
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
  EVENTS: '/events',

  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Public
  SEARCH: '/search',
  CATEGORY: '/category/:slug',

  // User / Attendee (protected)
  DASHBOARD: '/dashboard',
  CHECKOUT: '/checkout',
  BOOKING_SUCCESS: '/booking-success',
  PROFILE: '/profile',
  SUPPORT: '/support',
  MY_BOOKINGS: '/dashboard/bookings',
  FAVORITES: '/dashboard/favorites',
  WALLET: '/dashboard/wallet',
  SETTINGS: '/dashboard/settings',

  // Organizer
  ORGANIZER: '/organizer',
  CREATE_EVENT: '/organizer/events/create',
  ORGANIZER_EVENTS: '/organizer/events',
  EVENT_ANALYTICS: '/organizer/analytics',
  ATTENDEE_MANAGEMENT: '/organizer/attendees',
  PAYOUTS: '/organizer/payouts',
  IOT_DEVICES: '/organizer/devices',
  MARKETING: '/organizer/marketing',

  // Admin
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_ORGANIZERS: '/admin/organizers',
  ADMIN_EVENTS: '/admin/events',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_REPORTS: '/admin/reports',

  // Super Admin
  SUPER_ADMIN: '/superadmin',

  // Fallback
  NOT_FOUND: '*',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
