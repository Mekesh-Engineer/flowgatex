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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRazorpayOrder = void 0;
const functions = __importStar(require("firebase-functions"));
const firestore_1 = require("firebase-admin/firestore");
const razorpay_1 = __importDefault(require("razorpay"));
const db = (0, firestore_1.getFirestore)();
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
exports.createRazorpayOrder = functions.https.onCall(async (request) => {
    // Auth check
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be signed in.');
    }
    const { bookingId, amount, currency = 'INR', receipt } = request.data;
    if (!bookingId || !amount || typeof amount !== 'number' || amount <= 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid bookingId or amount.');
    }
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
        throw new functions.https.HttpsError('failed-precondition', 'Razorpay credentials not configured.');
    }
    const razorpay = new razorpay_1.default({
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
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        return {
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: keyId,
        };
    }
    catch (error) {
        console.error('Error creating Razorpay order:', error);
        throw new functions.https.HttpsError('internal', `Failed to create payment order: ${error.message}`);
    }
});
//# sourceMappingURL=createOrder.js.map