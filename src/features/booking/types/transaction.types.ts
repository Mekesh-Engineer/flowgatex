import { PaymentStatus } from '@/lib/constants';

export interface TransactionTicketDetail {
  tierId: string;
  tierName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Transaction {
  [key: string]: unknown;
  id: string;
  userId: string;
  bookingId: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  ticketDetails: TransactionTicketDetail[];
  amountPaid: number;
  discountApplied: number;
  serviceFee: number;
  taxAmount: number;
  paymentMethod: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  paymentStatus: PaymentStatus;
  promoCode?: string;
  paidAt?: string | any;
  verifiedAt?: string | any;
  verificationMethod?: 'server' | 'client';
  createdAt: string | any;
  updatedAt: string | any;
}

export interface CreateTransactionData {
  userId: string;
  bookingId: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  ticketDetails: TransactionTicketDetail[];
  amountPaid: number;
  discountApplied: number;
  serviceFee: number;
  taxAmount: number;
  paymentMethod: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  promoCode?: string;
}

export type TransactionFilter = 'all' | 'active' | 'refunded' | 'failed';
