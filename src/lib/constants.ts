// Application constants

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'FlowGateX';
export const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:3000';

// User Roles
export enum UserRole {
  USER = 'user',
  ORGANIZER = 'organizer',
  ADMIN = 'admin',
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
    { label: 'My Tickets', path: '/dashboard/tickets', icon: 'Ticket' },
    { label: 'Event Catalog', path: '/events', icon: 'Calendar' },
    { label: 'Profile Settings', path: '/dashboard/settings', icon: 'Settings' },
    { label: 'Support', path: '/support', icon: 'HelpCircle' },
  ],
  organizer: [
    { label: 'Dashboard', path: '/organizer', icon: 'LayoutDashboard' },
    { label: 'Events', path: '/organizer/events', icon: 'Calendar' },
    { label: 'Analytics', path: '/organizer/analytics', icon: 'BarChart3' },
    { label: 'Attendees', path: '/organizer/attendees', icon: 'Users' },
    { label: 'Settings', path: '/organizer/settings', icon: 'Settings' },
  ],
  admin: [
    { label: 'Dashboard', path: '/admin', icon: 'LayoutDashboard' },
    { label: 'Users', path: '/admin/users', icon: 'Users' },
    { label: 'Events', path: '/admin/events', icon: 'Calendar' },
    { label: 'Analytics', path: '/admin/analytics', icon: 'TrendingUp' },
    { label: 'IoT Devices', path: '/admin/devices', icon: 'Cpu' },
    { label: 'System', path: '/admin/system', icon: 'Server' },
    { label: 'Settings', path: '/admin/settings', icon: 'Settings' },
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
