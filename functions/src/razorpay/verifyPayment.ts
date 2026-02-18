import * as functions from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as crypto from 'crypto';

const db = getFirestore();

/**
 * Verifies a Razorpay payment server-side using HMAC signature verification.
 * Called from the client via httpsCallable after Razorpay checkout success callback.
 *
 * Input:
 *  - razorpay_order_id: string
 *  - razorpay_payment_id: string
 *  - razorpay_signature: string
 *  - bookingId: string
 *
 * Returns:
 *  - verified: boolean
 *  - bookingId: string
 */
export const verifyRazorpayPayment = functions.https.onCall(
  async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be signed in.');
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = request.data;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required payment fields.');
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Razorpay secret not configured.'
    );
  }

  // Verify signature using HMAC SHA256
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body)
    .digest('hex');

  const isValid = expectedSignature === razorpay_signature;

  if (!isValid) {
    // Log and update booking as failed
    console.error(`Payment verification failed for booking: ${bookingId}`);
    await db.collection('bookings').doc(bookingId).update({
      status: 'payment_failed',
      updatedAt: FieldValue.serverTimestamp(),
    });

    throw new functions.https.HttpsError('permission-denied', 'Payment signature verification failed.');
  }

  const now = FieldValue.serverTimestamp();

  // Use a batch to atomically update booking + create transaction
  const batch = db.batch();

  // Update booking status
  const bookingRef = db.collection('bookings').doc(bookingId);
  batch.update(bookingRef, {
    status: 'confirmed',
    paymentMethod: 'razorpay',
    razorpayOrderId: razorpay_order_id,
    razorpaySignature: razorpay_signature,
    paidAt: now,
    verifiedAt: now,
    updatedAt: now,
  });

  // Create/update transaction record with fields matching client Transaction type
  const bookingDoc = await bookingRef.get();
  const bookingData = bookingDoc.data();

  // Generate transaction ID early to return it
  const transactionRef = db.collection('transactions').doc();
  const transactionId = transactionRef.id;

  if (bookingData) {
    batch.set(transactionRef, {
      id: transactionId,
      bookingId,
      userId: request.auth.uid,
      eventId: bookingData.eventId,
      eventTitle: bookingData.eventTitle || '',
      eventDate: bookingData.eventDate || '',
      ticketDetails: (bookingData.tickets || []).map((t: any) => ({
        tierId: t.tierId,
        tierName: t.tierName,
        quantity: t.quantity,
        unitPrice: t.price,
        subtotal: (t.price || 0) * (t.quantity || 0),
      })),
      amountPaid: bookingData.finalAmount || bookingData.totalAmount || 0,
      discountApplied: bookingData.discount || 0,
      serviceFee: bookingData.serviceFee || 0,
      taxAmount: bookingData.taxAmount || 0,
      paymentMethod: 'razorpay',
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      paymentStatus: 'success',
      verificationMethod: 'hmac_sha256',
      paidAt: now,
      verifiedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  await batch.commit();

  // Decrement event capacity (run separately to handle partial failures)
  // Calculate total tickets from the tickets array
  let totalTicketCount = 0;
  if (bookingData && Array.isArray(bookingData.tickets)) {
    totalTicketCount = bookingData.tickets.reduce((sum: number, t: any) => sum + (t.quantity || 0), 0);
  } else if (bookingData) {
    // Fallback if structure is different
    totalTicketCount = bookingData.ticketCount || bookingData.quantity || 1;
  }

  try {
    if (bookingData && bookingData.eventId && totalTicketCount > 0) {
      await db
        .collection('events')
        .doc(bookingData.eventId)
        .update({
          'capacity.sold': FieldValue.increment(totalTicketCount),
          updatedAt: now,
        });
    }
  } catch (err) {
    console.error('Failed to decrement capacity (non-fatal):', err);
  }

  return {
    verified: true,
    bookingId,
    transactionId,
  };
});
