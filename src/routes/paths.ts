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
  EVENT_DETAILS: '/events/:id',
  CART: '/cart',
  CHECKOUT: '/checkout',
  BOOKING_SUCCESS: '/booking-success',
  MY_TICKETS: '/my-tickets',
  TICKET_DETAIL: '/tickets/:ticketId',
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
  EVENT_ANALYTICS: '/organizer/events/:id/analytics',
  EVENT_ANALYTICS_OVERVIEW: '/organizer/analytics',
  ATTENDEE_MANAGEMENT: '/organizer/events/:id/attendees',
  ATTENDEE_MANAGEMENT_OVERVIEW: '/organizer/attendees',
  PAYOUTS: '/organizer/payouts',
  IOT_DEVICES: '/organizer/devices',
  MARKETING: '/organizer/marketing',
  SCANNER: '/organizer/scan',

  // Admin
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_ORGANIZERS: '/admin/organizers',
  ADMIN_EVENTS: '/admin/events',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_PROMO_CODES: '/admin/promo-codes',

  // Super Admin
  SUPER_ADMIN: '/superadmin',
  SUPER_ADMIN_USERS: '/superadmin/users',
  SUPER_ADMIN_ROLES: '/superadmin/roles',
  SUPER_ADMIN_ADMINS: '/superadmin/admins',
  SUPER_ADMIN_ORGS: '/superadmin/organizations',
  SUPER_ADMIN_IOT: '/superadmin/iot',
  SUPER_ADMIN_FINANCE: '/superadmin/finance',
  SUPER_ADMIN_AUDIT: '/superadmin/audit-logs',
  SUPER_ADMIN_SECURITY: '/superadmin/security',
  SUPER_ADMIN_SETTINGS: '/superadmin/settings',

  // Fallback
  NOT_FOUND: '*',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
