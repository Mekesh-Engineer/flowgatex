import { BookingStatus } from '@/lib/constants';

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

export interface CreateBookingData {
  eventId: string;
  tickets: Omit<BookingTicket, 'qrCodes'>[];
  attendees: Attendee[];
  couponCode?: string;
}
