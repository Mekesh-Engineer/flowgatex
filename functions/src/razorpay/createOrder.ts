import * as functions from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import Razorpay from 'razorpay';

const db = getFirestore();

/**
 * Creates a Razorpay order server-side.
 * Called from the client via httpsCallable.
 *
 * Input:
 *  - bookingId: string
 *  - amount: number (in INR, e.g. 500)
 *  - currency: string (default 'INR')
 *  - receipt: string (optional, defaults to bookingId)
 *
 * Returns:
 *  - orderId: Razorpay order ID
 *  - amount: amount in paise
 *  - currency: currency code
 *  - key: Razorpay key ID (public)
 */
export const createRazorpayOrder = functions.https.onCall(
  async (request) => {
  // Auth check
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be signed in.');
  }

  const { bookingId, currency = 'INR', receipt } = request.data;
  // NOTE: We ignore `amount` from client to prevent tampering. We fetch it from the booking doc.

  if (!bookingId) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid bookingId.');
  }

  // Fetch booking to get the correct amount
  const bookingDoc = await db.collection('bookings').doc(bookingId).get();
  if (!bookingDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Booking not found.');
  }
  const bookingData = bookingDoc.data();
  const amount = bookingData?.finalAmount || bookingData?.totalAmount;

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    throw new functions.https.HttpsError('failed-precondition', 'Invalid booking amount.');
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Razorpay credentials not configured.'
    );
  }

  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  try {
    // Convert INR to paise
    const amountInPaise = Math.round(amount * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: receipt || bookingId,
      payment_capture: true, // Auto-capture payment on success (credits to merchant account)
      notes: {
        bookingId,
        userId: request.auth.uid,
      },
    });

    // Update booking with Razorpay order ID
    await db.collection('bookings').doc(bookingId).update({
      razorpayOrderId: order.id,
      status: 'payment_pending',
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: keyId,
    };
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    throw new functions.https.HttpsError(
      'internal',
      `Failed to create payment order: ${error.message}`
    );
  }
});
