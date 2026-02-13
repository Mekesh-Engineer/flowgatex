/**
 * FlowGateX Centralized Type Re-exports
 *
 * This file re-exports canonical types from their feature modules so that
 * consumers who prefer a single import path can use `@/types`.
 *
 * Canonical sources:
 *  - User/Auth types  → @/features/auth/types/auth.types
 *  - Event types      → @/features/events/types/event.types
 *  - Constants/Enums  → @/lib/constants
 */

import { BookingStatus, PaymentStatus } from '@/lib/constants';

// Re-export canonical types
export type { AuthUser as User } from '@/features/auth/types/auth.types';
export type { CreateEventData, TicketTier, EventCategory } from '@/features/events/types/event.types';

// Booking types (defined here — no dedicated feature type file yet)
export interface Attendee {
  name: string;
  email: string;
  phone?: string;
}

export interface BookingTicket {
  tierId: string;
  tierName: string;
  quantity: number;
  price: number;
  qrCodes?: string[];
}

export interface Booking {
  id: string;
  userId: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  tickets: BookingTicket[];
  attendees: Attendee[];
  totalAmount: number;
  discount?: number;
  finalAmount: number;
  status: BookingStatus;
  paymentId?: string;
  bookingDate: string;
}

// Payment types (defined here — no dedicated feature type file yet)
export interface Payment {
  id: string;
  orderId: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method?: string;
  gateway: 'razorpay' | 'cashfree';
  transactionId?: string;
  createdAt: string;
  capturedAt?: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
