import { BookingStatus, PaymentStatus } from '@/lib/constants';
import { updateBookingStatus } from './bookingService';
import { updateTransactionStatus, getTransactionByPaymentId } from './transactionService';
import { invalidateBookingTickets } from './ticketService';
import { restoreTicketAvailability } from './inventoryService';
import { getBookingById } from './bookingService';
import { logger } from '@/lib/logger';

export interface RefundRequest {
  bookingId: string;
  userId: string;
  reason: string;
}

export interface RefundResult {
  success: boolean;
  message: string;
}

/**
 * Check whether a booking is eligible for a refund.
 */
export async function checkRefundEligibility(
  bookingId: string,
  userId: string
): Promise<{ eligible: boolean; reason?: string }> {
  const booking = await getBookingById(bookingId);

  if (!booking) {
    return { eligible: false, reason: 'Booking not found' };
  }

  if (booking.userId !== userId) {
    return { eligible: false, reason: 'Unauthorized — not your booking' };
  }

  if (booking.status !== BookingStatus.CONFIRMED) {
    return {
      eligible: false,
      reason: `Booking is ${booking.status}. Only confirmed bookings can be refunded.`,
    };
  }

  // Check if event date has passed
  const eventDate = new Date(booking.eventDate);
  if (eventDate < new Date()) {
    return { eligible: false, reason: 'Event has already occurred' };
  }

  return { eligible: true };
}

/**
 * Process a full refund:
 * 1. Update booking status → REFUNDED
 * 2. Update transaction status → REFUNDED
 * 3. Invalidate all tickets (set → cancelled)
 * 4. Restore ticket availability in the event
 *
 * Note: Razorpay refund API call would happen server-side.
 * This function handles the Firestore state updates.
 */
export async function processRefund(request: RefundRequest): Promise<RefundResult> {
  const { bookingId, userId, reason } = request;

  try {
    // 1. Validate eligibility
    const eligibility = await checkRefundEligibility(bookingId, userId);
    if (!eligibility.eligible) {
      return { success: false, message: eligibility.reason || 'Not eligible for refund' };
    }

    const booking = await getBookingById(bookingId);
    if (!booking) {
      return { success: false, message: 'Booking not found' };
    }

    // 2. Update booking status
    await updateBookingStatus(bookingId, BookingStatus.REFUNDED);

    // 3. Update transaction status if payment ID exists
    if (booking.paymentId) {
      const transaction = await getTransactionByPaymentId(booking.paymentId);
      if (transaction) {
        await updateTransactionStatus(transaction.id, PaymentStatus.REFUNDED);
      }
    }

    // 4. Invalidate all tickets for this booking
    await invalidateBookingTickets(bookingId);

    // 5. Restore ticket availability
    const tierUpdates = booking.tickets.map((t) => ({
      tierId: t.tierId,
      quantity: t.quantity,
    }));
    await restoreTicketAvailability(booking.eventId, tierUpdates);

    logger.log(`💸 Refund processed for booking: ${bookingId}, reason: ${reason}`);
    return { success: true, message: 'Refund processed successfully' };
  } catch (error: any) {
    logger.error('Refund processing failed:', error);
    return {
      success: false,
      message: error.message || 'Failed to process refund',
    };
  }
}
