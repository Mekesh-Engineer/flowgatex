// Application constants

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'FlowGateX';
export const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:3000';

// User Roles
// IMPORTANT: These values MUST match what's stored in Firestore.
// NORMALIZED: 'attendee' from UI maps to 'user' in DB.
export enum UserRole {
  USER = 'user',
  ORGANIZER = 'organizer',
  ORG_ADMIN = 'org_admin',
  ADMIN = 'admin',
  SUPER_ADMIN = 'superadmin',
}

// Event Categories
export const EVENT_CATEGORIES = [
  { id: 'music', label: 'Music & Festivals', icon: 'Music' },
  { id: 'sports', label: 'Sports & Fitness', icon: 'Trophy' },
  { id: 'conference', label: 'Conferences', icon: 'Users' },
  { id: 'workshop', label: 'Workshops', icon: 'BookOpen' },
  { id: 'networking', label: 'Networking', icon: 'Network' },
  { id: 'arts', label: 'Arts & Culture', icon: 'Palette' },
  { id: 'food', label: 'Food & Drink', icon: 'UtensilsCrossed' },
  { id: 'tech', label: 'Technology', icon: 'Cpu' },
  { id: 'health', label: 'Health & Wellness', icon: 'Heart' },
  { id: 'education', label: 'Education', icon: 'GraduationCap' },
  { id: 'business', label: 'Business', icon: 'Briefcase' },
  { id: 'entertainment', label: 'Entertainment', icon: 'Clapperboard' },
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number]['id'];

// Event Status
export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Booking Status
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

// Payment Status
export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

// IoT Device Types
export enum DeviceType {
  ACCESS_GATE = 'access_gate',
  CAMERA = 'camera',
  SENSOR = 'sensor',
  DISPLAY = 'display',
}

// IoT Device Status
export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  ERROR = 'error',
  MAINTENANCE = 'maintenance',
}

// Navigation items
export const NAV_ITEMS = {
  public: [
    { label: 'Home', path: '/', icon: 'Home' },
    { label: 'Events', path: '/events', icon: 'Calendar' },
    { label: 'About', path: '/about', icon: 'Info' },
    { label: 'Contact', path: '/contact', icon: 'Mail' },
  ],
  user: [
    { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'My Bookings', path: '/dashboard/bookings', icon: 'Ticket' },
    { label: 'Favorites', path: '/dashboard/favorites', icon: 'Heart' },
    { label: 'Wallet', path: '/dashboard/wallet', icon: 'Wallet' },
    { label: 'Settings', path: '/dashboard/settings', icon: 'Settings' },
    { label: 'Support', path: '/support', icon: 'HelpCircle' },
  ],
  organizer: [
    { label: 'Dashboard', path: '/organizer', icon: 'LayoutDashboard' },
    { label: 'My Events', path: '/organizer/events', icon: 'Calendar' },
    { label: 'Payouts', path: '/organizer/payouts', icon: 'DollarSign' },
    { label: 'IoT Devices', path: '/organizer/devices', icon: 'Cpu' },
    { label: 'Marketing', path: '/organizer/marketing', icon: 'Megaphone' },
    { label: 'Scanner', path: '/organizer/scan', icon: 'ScanLine' },
  ],
  
  admin: [
    { label: 'Dashboard', path: '/admin', icon: 'LayoutDashboard' },
    { label: 'Users', path: '/admin/users', icon: 'Users' },
    { label: 'Organizers', path: '/admin/organizers', icon: 'UserCheck' },
    { label: 'Events', path: '/admin/events', icon: 'Calendar' },
    { label: 'Attendees', path: '/admin/attendees', icon: 'ClipboardList' },
    { label: 'Transactions', path: '/admin/transactions', icon: 'CreditCard' },
    { label: 'Reports', path: '/admin/reports', icon: 'TrendingUp' },
    { label: 'Promo Codes', path: '/admin/promo-codes', icon: 'Ticket' },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: 'FileText' },
    { label: 'Settings', path: '/admin/settings', icon: 'Settings' },
  ],
  superadmin: [
    { label: 'Dashboard', path: '/superadmin', icon: 'LayoutDashboard' },
    { label: 'User Management', path: '/superadmin/users', icon: 'Users' },
    { label: 'Role Management', path: '/superadmin/roles', icon: 'Shield' },
    { label: 'Admin Management', path: '/superadmin/admins', icon: 'UserCheck' },
    { label: 'Organizations', path: '/superadmin/organizations', icon: 'Building2' },
    { label: 'IoT Management', path: '/superadmin/iot', icon: 'Cpu' },
    { label: 'Financial Overview', path: '/superadmin/finance', icon: 'DollarSign' },
    { label: 'Audit Logs', path: '/superadmin/audit-logs', icon: 'FileText' },
    { label: 'System Security', path: '/superadmin/security', icon: 'Lock' },
    { label: 'Settings', path: '/superadmin/settings', icon: 'Settings' },
  ],
};

// API endpoints
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    forgotPassword: '/auth/forgot-password',
    verifyEmail: '/auth/verify-email',
  },
  events: {
    list: '/events',
    detail: (id: string) => `/events/${id}`,
    create: '/events',
    update: (id: string) => `/events/${id}`,
    delete: (id: string) => `/events/${id}`,
  },
  bookings: {
    list: '/bookings',
    detail: (id: string) => `/bookings/${id}`,
    create: '/bookings',
    cancel: (id: string) => `/bookings/${id}/cancel`,
  },
  payments: {
    createOrder: '/payment/create-order',
    verify: '/payment/verify',
    refund: (id: string) => `/payment/${id}/refund`,
  },
  users: {
    profile: '/users/profile',
    update: '/users/profile',
  },
};

// File size limits
export const FILE_LIMITS = {
  maxImageSize: 5 * 1024 * 1024, // 5MB
  maxProfilePhotoSize: 2 * 1024 * 1024, // 2MB
  maxImages: 5,
  acceptedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
};

// Pagination defaults
export const PAGINATION = {
  defaultLimit: 20,
  maxLimit: 100,
};