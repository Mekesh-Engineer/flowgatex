/**
 * FlowGateX API Type Definitions
 * Based on API Documentation v1.0
 */

// ==========================================
// Common Types
// ==========================================

export interface ApiResponse<T = any> {
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
  role: 'user' | 'organizer' | 'admin';
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
// Event Types
// ==========================================

export interface Event {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  venue: Venue;
  dates: EventDates;
  ticketTiers: TicketTier[];
  images: string[];
  organizerId: string;
  organizerName: string;
  status: EventStatus;
  features: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type EventCategory =
  | 'music'
  | 'sports'
  | 'conference'
  | 'workshop'
  | 'exhibition'
  | 'festival'
  | 'meetup'
  | 'other';

export type EventStatus = 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';

export interface Venue {
  name: string;
  address: string;
  city: string;
  state: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  capacity: number;
}

export interface EventDates {
  start: string;
  end: string;
  registrationDeadline: string;
}

export interface TicketTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  sold: number;
  available: number;
  benefits: string[];
}

export interface EventFilters extends PaginationParams {
  category?: EventCategory;
  search?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
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

