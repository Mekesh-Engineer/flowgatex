import { UserRole, EventCategory, EventStatus, BookingStatus, PaymentStatus } from '@/lib/constants';

// User types
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  role: UserRole;
  emailVerified: boolean;
  createdAt?: string;
  preferences?: {
    categories?: EventCategory[];
    cities?: string[];
  };
}

// Event types
export interface Venue {
  name: string;
  address: string;
  city: string;
  state: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  capacity: number;
}

export interface TicketTier {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  quantity: number;
  sold: number;
  available: number;
  benefits?: string[];
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  organizerId: string;
  organizerName: string;
  venue: Venue;
  dates: {
    start: string;
    end: string;
    registrationDeadline: string;
  };
  ticketTiers: TicketTier[];
  images: string[];
  status: EventStatus;
  featured: boolean;
  tags: string[];
  features?: string[];
  createdAt: string;
  updatedAt: string;
}

// Booking types
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

// Payment types
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

// Filter types
export interface EventFilters {
  category?: EventCategory;
  search?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
  status?: EventStatus;
}
