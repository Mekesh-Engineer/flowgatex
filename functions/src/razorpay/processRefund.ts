import * as functions from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import Razorpay from 'razorpay';

const db = getFirestore();

/**
 * Processes a refund through Razorpay.
 * Can be called by admin users or triggered by booking cancellation.
 *
 * Input:
 *  - bookingId: string
 *  - reason: string (optional)
 *  - amount: number (optional, for partial refunds; omit for full refund)
 *
 * Returns:
 *  - refundId: Razorpay refund ID
 *  - status: refund status
 */
export const processRefund = functions.https.onCall(
  async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be signed in.');
  }

  const { bookingId, reason, amount } = request.data;

  if (!bookingId) {
    throw new functions.https.HttpsError('invalid-argument', 'bookingId is required.');
  }

  // Fetch booking
  const bookingDoc = await db.collection('bookings').doc(bookingId).get();
  if (!bookingDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Booking not found.');
  }

  const booking = bookingDoc.data()!;

  // Verify user owns this booking or is admin
  const userDoc = await db.collection('users').doc(request.auth.uid).get();
  const userData = userDoc.data();
  const isAdmin = userData?.role === 'admin' || userData?.role === 'organizer';

  if (booking.userId !== request.auth.uid && !isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Not authorized to refund this booking.');
  }

  if (booking.status !== 'confirmed') {
    throw new functions.https.HttpsError(
      'failed-precondition',
      `Cannot refund booking with status: ${booking.status}`
    );
  }

  // Find the corresponding transaction
  // Support both field naming conventions (server-side: paymentStatus/razorpayPaymentId, 
  // legacy: status/gatewayTransactionId)
  let transactionsSnap = await db
    .collection('transactions')
    .where('bookingId', '==', bookingId)
    .where('paymentStatus', '==', 'success')
    .limit(1)
    .get();

  // Fallback: try legacy field name
  if (transactionsSnap.empty) {
    transactionsSnap = await db
      .collection('transactions')
      .where('bookingId', '==', bookingId)
      .where('status', '==', 'completed')
      .limit(1)
      .get();
  }

  if (transactionsSnap.empty) {
    throw new functions.https.HttpsError('not-found', 'No completed transaction found for this booking.');
  }

  const transaction = transactionsSnap.docs[0].data();
  const paymentId = transaction.razorpayPaymentId || transaction.gatewayTransactionId;

  if (!paymentId) {
    throw new functions.https.HttpsError('failed-precondition', 'No payment ID found for refund.');
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new functions.https.HttpsError('failed-precondition', 'Razorpay credentials not configured.');
  }

  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  try {
    const refundPayload: any = {};
    if (amount && typeof amount === 'number') {
      refundPayload.amount = Math.round(amount * 100); // Convert to paise
    }
    if (reason) {
      refundPayload.notes = { reason };
    }

    const refund = await razorpay.payments.refund(paymentId, refundPayload);

    const now = FieldValue.serverTimestamp();
    const batch = db.batch();

    // Update booking status
    batch.update(db.collection('bookings').doc(bookingId), {
      status: 'refunded',
      refundId: refund.id,
      refundReason: reason || 'User requested',
      refundedAt: now,
      updatedAt: now,
    });

    // Update transaction (set both field naming conventions)
    batch.update(transactionsSnap.docs[0].ref, {
      status: 'refunded',
      paymentStatus: 'refunded',
      refundId: refund.id,
      refundAmount: amount || transaction.amount,
      updatedAt: now,
    });

    // Restore event capacity
    if (booking.eventId) {
      const ticketCount = booking.ticketCount || booking.quantity || 1;
      batch.update(db.collection('events').doc(booking.eventId), {
        'capacity.sold': FieldValue.increment(-ticketCount),
        updatedAt: now,
      });
    }

    // Invalidate tickets
    const ticketsSnap = await db
      .collection('tickets')
      .where('bookingId', '==', bookingId)
      .get();

    ticketsSnap.forEach((ticketDoc) => {
      batch.update(ticketDoc.ref, {
        status: 'cancelled',
        updatedAt: now,
      });
    });

    await batch.commit();

    return {
      refundId: refund.id,
      status: 'refunded',
    };
  } catch (error: any) {
    console.error('Refund error:', error);
    throw new functions.https.HttpsError('internal', `Refund failed: ${error.message}`);
  }
});
