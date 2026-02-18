"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRazorpayPayment = void 0;
const functions = __importStar(require("firebase-functions"));
const firestore_1 = require("firebase-admin/firestore");
const crypto = __importStar(require("crypto"));
const db = (0, firestore_1.getFirestore)();
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
exports.verifyRazorpayPayment = functions.https.onCall(async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be signed in.');
    }
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = request.data;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required payment fields.');
    }
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
        throw new functions.https.HttpsError('failed-precondition', 'Razorpay secret not configured.');
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
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        throw new functions.https.HttpsError('permission-denied', 'Payment signature verification failed.');
    }
    const now = firestore_1.FieldValue.serverTimestamp();
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
    if (bookingData) {
        const transactionRef = db.collection('transactions').doc();
        batch.set(transactionRef, {
            id: transactionRef.id,
            bookingId,
            userId: request.auth.uid,
            eventId: bookingData.eventId,
            eventTitle: bookingData.eventTitle || '',
            eventDate: bookingData.eventDate || '',
            ticketDetails: (bookingData.tickets || []).map((t) => ({
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
    try {
        if (bookingData && bookingData.eventId) {
            const ticketCount = bookingData.ticketCount || bookingData.quantity || 1;
            await db
                .collection('events')
                .doc(bookingData.eventId)
                .update({
                'capacity.sold': firestore_1.FieldValue.increment(ticketCount),
                updatedAt: now,
            });
        }
    }
    catch (err) {
        console.error('Failed to decrement capacity (non-fatal):', err);
    }
    return {
        verified: true,
        bookingId,
    };
});
//# sourceMappingURL=verifyPayment.js.map