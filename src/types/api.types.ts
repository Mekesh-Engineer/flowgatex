/**
 * FlowGateX API Type Definitions
 * Based on API Documentation v1.0
 *
 * Event/Venue/TicketTier types are re-exported from their canonical source
 * at @/features/events/types/event.types to avoid duplication.
 */

export type {
  CreateEventData,
  TicketTier,
  EventCategory,
} from '@/features/events/types/event.types';

// ==========================================
// Common Types
// ==========================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ==========================================
// Authentication Types
// ==========================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  phone: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
}

// ==========================================
// User Types
// ==========================================

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  role: 'user' | 'organizer' | 'admin' | 'superadmin';
  verified: boolean;
  createdAt: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  categories: string[];
  cities: string[];
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

// ==========================================
// Event Date Types (API-specific wrapper)
// ==========================================

export interface EventDates {
  start: string;
  end: string;
  registrationDeadline: string;
}

// ==========================================
// Booking Types
// ==========================================

export interface Booking {
  id: string;
  userId: string;
  eventId: string;
  tickets: BookedTicket[];
  attendees: Attendee[];
  totalAmount: number;
  discount: number;
  finalAmount: number;
  currency: string;
  status: BookingStatus;
  paymentId?: string;
  qrCode: string;
  createdAt: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'expired' | 'refunded';

export interface BookedTicket {
  tierId: string;
  tierName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Attendee {
  name: string;
  email: string;
  phone: string;
}

export interface CreateBookingRequest {
  eventId: string;
  tickets: {
    tierId: string;
    quantity: number;
  }[];
  attendees: Attendee[];
  discountCode?: string;
}

// ==========================================
// Payment Types
// ==========================================

export interface Payment {
  paymentId: string;
  orderId: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: string;
  gateway: PaymentGateway;
  transactionId?: string;
  createdAt: string;
}

export type PaymentGateway = 'razorpay' | 'cashfree' | 'stripe';

export type PaymentStatus =
  | 'created'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export interface CreatePaymentOrderRequest {
  bookingId: string;
  amount: number;
  currency: string;
  gateway: PaymentGateway;
}

export interface VerifyPaymentRequest {
  orderId: string;
  paymentId: string;
  signature: string;
  gateway: PaymentGateway;
}

// ==========================================
// Analytics Types
// ==========================================

export interface EventAnalytics {
  views: number;
  bookings: number;
  revenue: number;
  attendance: number;
}

export interface OrganizerAnalytics {
  overview: {
    totalEvents: number;
    activeEvents: number;
    totalRevenue: number;
    totalAttendees: number;
  };
  revenue: {
    byMonth: Array<{
      month: string;
      revenue: number;
      bookings: number;
    }>;
  };
}

