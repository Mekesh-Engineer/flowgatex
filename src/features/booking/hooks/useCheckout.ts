import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/zustand/stores';
import { createBooking, updateBookingStatus, updateBookingTickets } from '../services/bookingService';
import { useCart } from './useCart';
import { showSuccess, showError } from '@/components/common/Toast';
import { BookingStatus } from '@/lib/constants';
import type { Attendee } from '../types/booking.types';
import { logger } from '@/lib/logger';
import { openRazorpay, type RazorpaySuccessResponse, type RazorpayOptions } from '@/services/razorpay';
import { validatePromoCode } from '../services/promoService';
import { incrementPromoUsage } from '../services/promoService';
import { createTransaction } from '../services/transactionService';
import { createTickets } from '../services/ticketService';
import { checkAvailability, decrementTicketAvailability, restoreTicketAvailability } from '../services/inventoryService';
import type { PromoCode } from '../types/promo.types';
import { httpsCallable } from 'firebase/functions';
import { getFunctionsInstance } from '@/lib/firebase';

/** Flat service fee per ticket (INR) */
const SERVICE_FEE_PER_TICKET = 10;

/** Whether to use server-side Cloud Functions for payment (recommended for production) */
const USE_SERVER_SIDE_PAYMENT = import.meta.env.VITE_USE_SERVER_PAYMENT === 'true';

export function useCheckout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, emptyCart, totalPrice, totalItems, removeFromCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);

  // Derived totals
  const serviceFee = useMemo(() => totalItems * SERVICE_FEE_PER_TICKET, [totalItems]);
  const taxAmount = 0; // placeholder — can be dynamic later
  const finalTotal = Math.max(0, totalPrice + serviceFee + taxAmount - discount);

  const applyPromo = async (code: string) => {
    if (!items.length) return;
    setIsLoading(true);
    try {
      const result = await validatePromoCode(code, items[0].eventId, totalPrice);
      if (result.isValid && result.promo) {
        setDiscount(result.discountAmount);
        setAppliedPromo(result.promo);
        showSuccess(`Promo applied: ${result.message}`);
      } else {
        setDiscount(0);
        setAppliedPromo(null);
        showError(result.message || 'Invalid promo code');
      }
    } catch {
      showError('Failed to apply promo');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async (attendees: Attendee[]) => {
    if (!user) {
      showError('Please login to continue');
      navigate('/login');
      return;
    }

    if (items.length === 0) {
      showError('Your cart is empty');
      return;
    }

    setIsLoading(true);

    let bookingId: string | null = null;
    let tierUpdates: { tierId: string; quantity: number }[] = [];

    try {
      // 0. Check ticket availability before proceeding
      const tierRequests = items.map((item) => ({
        tierId: item.tierId,
        quantity: item.quantity,
      }));
      const unavailable = await checkAvailability(items[0].eventId, tierRequests);

      // Collect issues
      let removedItemsCount = 0;
      const issues: string[] = [];

      unavailable.forEach((u) => {
        // Automatically remove invalid or completely sold out tiers
        if (u.tierName.includes('Unknown Tier') || u.available === 0) {
          removeFromCart(items[0].eventId, u.tierId);
          removedItemsCount++;
        } else {
          // Keep track of valid tiers with insufficient quantity
          issues.push(`${u.tierName} (${u.available} left, need ${u.requested})`);
        }
      });

      // If we removed items, we must return to let the UI update.
      // The user will need to click Checkout again with the clean cart.
      if (removedItemsCount > 0) {
        showError('Some items in your cart are no longer available and have been removed. Please review and try again.');
        return;
      }

      // If we have insufficient quantity but didn't remove the item automatically
      if (issues.length > 0) {
        showError(`Insufficient tickets: ${issues.join(', ')}`);
        return;
      }

      // 1. Decrement ticket inventory (RESERVE)
      tierUpdates = items.map((item) => ({
        tierId: item.tierId,
        quantity: item.quantity,
      }));
      await decrementTicketAvailability(items[0].eventId, tierUpdates);

      // 2. Create Pending Booking
      const bookingData = {
        eventId: items[0].eventId,
        tickets: items.map(item => ({
          tierId: item.tierId,
          tierName: item.tierName,
          quantity: item.quantity,
          price: item.price,
        })),
        attendees,
        couponCode: appliedPromo?.code,
      };

      bookingId = await createBooking(
        user.uid,
        bookingData,
        items[0].eventTitle,
        items[0].eventDate || new Date().toISOString(),
        discount,
        items[0].eventImage,
        items[0].venue,
        serviceFee,
        taxAmount
      );

      // 3. Build Razorpay options (server-side or client-side)
      let razorpayBaseOptions: Omit<RazorpayOptions, 'handler'>;

      if (USE_SERVER_SIDE_PAYMENT) {
        // --- SERVER-SIDE: Create order via Cloud Function ---
        const functionsInstance = getFunctionsInstance();
        const createOrderFn = httpsCallable<
          { bookingId: string; amount: number; currency: string },
          { orderId: string; amount: number; currency: string; key: string }
        >(functionsInstance, 'createRazorpayOrder');

        const orderResult = await createOrderFn({
          bookingId,
          amount: finalTotal,
          currency: 'INR',
        });

        const { orderId, key } = orderResult.data;

        razorpayBaseOptions = {
          key,
          amount: Math.round(finalTotal * 100),
          currency: 'INR',
          name: 'FlowGateX Events',
          description: `Booking for ${items[0].eventTitle}`,
          image: 'https://flowgatex.com/logo.png',
          order_id: orderId,
          prefill: {
            name: user.displayName || attendees[0].name,
            email: user.email || attendees[0].email,
            contact: attendees[0].phone,
          },
          theme: { color: '#00A3DB' },
        };
      } else {
        // --- CLIENT-SIDE flow ---
        razorpayBaseOptions = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: Math.round(finalTotal * 100),
          currency: 'INR',
          name: 'FlowGateX Events',
          description: `Booking for ${items[0].eventTitle}`,
          image: 'https://flowgatex.com/logo.png',
          prefill: {
            name: user.displayName || attendees[0].name,
            email: user.email || attendees[0].email,
            contact: attendees[0].phone,
          },
          theme: { color: '#00A3DB' },
        };
      }

      // 4. Open Razorpay and AWAIT payment result via promise wrapper
      //    This ensures isLoading stays true and handlePayment doesn't
      //    return until the user completes or dismisses payment.
      const paymentResult = await new Promise<{
        success: boolean;
        paymentId?: string;
        orderId?: string;
        signature?: string;
      }>((resolve) => {
        const fullOptions = {
          ...razorpayBaseOptions,
          handler: (response: RazorpaySuccessResponse) => {
            resolve({
              success: true,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
            });
          },
          modal: {
            ondismiss: () => {
              resolve({ success: false });
            },
          },
        };
        openRazorpay(fullOptions as RazorpayOptions).catch(() => resolve({ success: false }));
      });

      // 5. Handle payment dismissal / cancellation
      if (!paymentResult.success) {
        logger.log('Payment cancelled/dismissed - Performing rollback');
        await restoreTicketAvailability(items[0].eventId, tierUpdates);
        await updateBookingStatus(bookingId, BookingStatus.CANCELLED);
        showError('Payment cancelled. Reservation released.');
        return;
      }

      // 6. Confirm payment — server-side verification or client-side record creation
      if (USE_SERVER_SIDE_PAYMENT && paymentResult.orderId && paymentResult.signature) {
        await confirmPaymentServerSide(
          bookingId,
          paymentResult.paymentId!,
          paymentResult.orderId,
          paymentResult.signature,
          attendees
        );
      } else {
        await confirmPayment(bookingId, paymentResult.paymentId!, attendees);
      }

    } catch (error: unknown) {
      logger.error('Checkout error:', error);
      const msg = error instanceof Error ? error.message : 'Failed to process payment';
      showError(msg);

      // Attempt rollback if booking was created
      if (bookingId && tierUpdates.length > 0) {
        try {
          await restoreTicketAvailability(items[0].eventId, tierUpdates);
          await updateBookingStatus(bookingId, BookingStatus.CANCELLED);
        } catch (rollbackError) {
          logger.error('Rollback failed:', rollbackError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const confirmPayment = async (bookingId: string, paymentId: string, attendees: Attendee[]) => {
    // 1. Confirm booking status — critical step
    try {
      await updateBookingStatus(bookingId, BookingStatus.CONFIRMED, paymentId);
    } catch (err) {
      logger.error('Failed to update booking status (payment was successful):', err);
      // Continue — payment succeeded, we still want to create records
    }

    // 2. Create transaction record
    let transactionId = '';
    try {
      transactionId = await createTransaction({
        userId: user!.uid,
        bookingId,
        eventId: items[0].eventId,
        eventTitle: items[0].eventTitle,
        eventDate: items[0].eventDate || new Date().toISOString(),
        ticketDetails: items.map((item) => ({
          tierId: item.tierId,
          tierName: item.tierName,
          quantity: item.quantity,
          unitPrice: item.price,
          subtotal: item.price * item.quantity,
        })),
        amountPaid: finalTotal,
        discountApplied: discount,
        serviceFee,
        taxAmount,
        paymentMethod: 'razorpay',
        razorpayPaymentId: paymentId,
        promoCode: appliedPromo?.code,
      });
    } catch (err) {
      logger.error('Failed to create transaction record:', err);
    }

    // 3. Create ticket documents with secure QR codes
    try {
      const createdTickets = await createTickets(
        items.map((item, idx) => ({
          userId: user!.uid,
          eventId: items[0].eventId,
          eventTitle: items[0].eventTitle,
          eventDate: items[0].eventDate || new Date().toISOString(),
          bookingId,
          transactionId: transactionId || bookingId,
          tierId: item.tierId,
          tierName: item.tierName,
          attendeeName: attendees[idx]?.name || attendees[0]?.name || user!.displayName || '',
          attendeeEmail: attendees[idx]?.email || attendees[0]?.email || user!.email || '',
          expiresAt: items[0].eventDate || undefined,
        })),
        Object.fromEntries(items.map((item) => [item.tierId, item.quantity]))
      );

      // 4. Update booking with generated QR codes
      const ticketsByTier: Record<string, string[]> = {};
      createdTickets.forEach(t => {
        if (!ticketsByTier[t.tierId]) ticketsByTier[t.tierId] = [];
        ticketsByTier[t.tierId].push(t.qrData);
      });

      const updatedBookingTickets = items.map(item => ({
        tierId: item.tierId,
        tierName: item.tierName,
        quantity: item.quantity,
        price: item.price,
        qrCodes: ticketsByTier[item.tierId] || []
      }));

      await updateBookingTickets(bookingId, updatedBookingTickets);
    } catch (err) {
      logger.error('Failed to create tickets/QR codes:', err);
    }

    // 5. Increment promo usage count (non-blocking)
    if (appliedPromo?.code) {
      await incrementPromoUsage(appliedPromo.code).catch((err) =>
        logger.error('Promo usage increment failed (non-blocking):', err)
      );
    }

    // 6. Always clear cart & navigate — payment was successful
    emptyCart();
    showSuccess('Payment successful! Redirecting...');
    navigate(`/booking-success?id=${bookingId}`);
  };

  /**
   * Server-side payment verification via Cloud Function.
   * The function handles: signature verification, booking update, transaction creation,
   * and capacity decrement atomically on the server.
   */
  const confirmPaymentServerSide = async (
    bookingId: string,
    paymentId: string,
    orderId: string,
    signature: string,
    attendees: Attendee[]
  ) => {
    let transactionId = bookingId; // Fallback

    // 1. Verify signature server-side (handles booking update + transaction creation atomically)
    try {
      const functionsInstance = getFunctionsInstance();
      const verifyPaymentFn = httpsCallable<
        {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
          bookingId: string;
        },
        { verified: boolean; bookingId: string; transactionId?: string }
      >(functionsInstance, 'verifyRazorpayPayment');

      const result = await verifyPaymentFn({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        bookingId,
      });

      if (!result.data.verified) {
        throw new Error('Payment signature verification failed');
      }

      if (result.data.transactionId) {
        transactionId = result.data.transactionId;
      }
    } catch (err) {
      logger.error('Server-side verification call failed:', err);
      showError('Payment verification failed. Please contact support.');
      // Do NOT proceed to create tickets if verification fails
      // Ideally, we should also revert the inventory reservation here, 
      // but the payment was successful on Razorpay side, so it's a critical state.
      // Better to stop here and let support handle it than issuing invalid tickets.
      return;
    }

    // 2. Create ticket documents with secure QR codes
    try {
      const createdTickets = await createTickets(
        items.map((item, idx) => ({
          userId: user!.uid,
          eventId: items[0].eventId,
          eventTitle: items[0].eventTitle,
          eventDate: items[0].eventDate || new Date().toISOString(),
          bookingId,
          transactionId, // Use the verified transaction ID
          tierId: item.tierId,
          tierName: item.tierName,
          attendeeName: attendees[idx]?.name || attendees[0]?.name || user!.displayName || '',
          attendeeEmail: attendees[idx]?.email || attendees[0]?.email || user!.email || '',
          expiresAt: items[0].eventDate || undefined,
        })),
        Object.fromEntries(items.map((item) => [item.tierId, item.quantity]))
      );

      // Update booking with generated QR codes
      const ticketsByTier: Record<string, string[]> = {};
      createdTickets.forEach((t) => {
        if (!ticketsByTier[t.tierId]) ticketsByTier[t.tierId] = [];
        ticketsByTier[t.tierId].push(t.qrData);
      });

      const updatedBookingTickets = items.map((item) => ({
        tierId: item.tierId,
        tierName: item.tierName,
        quantity: item.quantity,
        price: item.price,
        qrCodes: ticketsByTier[item.tierId] || [],
      }));

      await updateBookingTickets(bookingId, updatedBookingTickets);
    } catch (err) {
      logger.error('Failed to create tickets/QR codes:', err);
    }

    // 3. Increment promo usage (non-blocking)
    if (appliedPromo?.code) {
      await incrementPromoUsage(appliedPromo.code).catch((err) =>
        logger.error('Promo usage increment failed (non-blocking):', err)
      );
    }

    // 4. Always clear cart & navigate — payment was successful
    emptyCart();
    showSuccess('Payment verified! Redirecting...');
    navigate(`/booking-success?id=${bookingId}`);
  };

  return {
    items,
    totalPrice,
    serviceFee,
    taxAmount,
    discount,
    finalTotal,
    isLoading,
    appliedPromo,
    applyPromo,
    handlePayment,
  };
}

export default useCheckout;
