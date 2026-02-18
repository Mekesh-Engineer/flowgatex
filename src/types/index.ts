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

import { PaymentStatus } from '@/lib/constants';

// Re-export canonical types
export type { AuthUser as User } from '@/features/auth/types/auth.types';
export type { CreateEventData, TicketTier, EventCategory } from '@/features/events/types/event.types';

// Booking types — canonical source: @/features/booking/types/booking.types
export type { Attendee, BookingTicket, Booking, CreateBookingData } from '@/features/booking/types/booking.types';

// Transaction types — canonical source: @/features/booking/types/transaction.types
export type { Transaction, CreateTransactionData, TransactionFilter } from '@/features/booking/types/transaction.types';

// Ticket types — canonical source: @/features/booking/types/ticket.types
export type { Ticket, CreateTicketData, TicketStatus } from '@/features/booking/types/ticket.types';

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
