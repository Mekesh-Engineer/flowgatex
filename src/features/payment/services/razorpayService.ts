import type { RazorpayOptions, RazorpayResponse, PaymentResult } from '../types/payment.types';
import { logger } from '@/lib/logger';
import { loadRazorpayScript } from '@/services/razorpay';

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;

export const initiateRazorpayPayment = async (
  orderId: string,
  amount: number,
  currency: string,
  userDetails: { name?: string; email?: string; phone?: string },
  onSuccess: (result: PaymentResult) => void,
  onFailure: (error: string) => void
): Promise<void> => {
  const loaded = await loadRazorpayScript();
  
  if (!loaded) {
    onFailure('Failed to load payment gateway');
    return;
  }

  const options: RazorpayOptions = {
    key: RAZORPAY_KEY,
    amount: amount * 100, // Convert to paise
    currency,
    name: 'FlowGateX',
    description: 'Event Ticket Purchase',
    order_id: orderId,
    handler: (response: RazorpayResponse) => {
      onSuccess({
        success: true,
        paymentId: response.razorpay_payment_id,
        orderId: response.razorpay_order_id,
        signature: response.razorpay_signature,
      });
    },
    prefill: {
      name: userDetails.name || '',
      email: userDetails.email || '',
      contact: userDetails.phone || '',
    },
    theme: {
      color: '#22d3ee',
    },
  };

  try {
    const razorpay = new (window as any).Razorpay(options);
    razorpay.open();
  } catch (error) {
    onFailure('Payment initialization failed');
  }
};

export const verifyPayment = async (
  paymentId: string,
  orderId: string,
  signature: string,
  bookingId: string
): Promise<boolean> => {
  try {
    const { getFunctionsInstance } = await import('@/services/firebase');
    const { httpsCallable } = await import('firebase/functions');
    const functionsInstance = getFunctionsInstance();
    const verifyFn = httpsCallable<
      { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string; bookingId: string },
      { verified: boolean }
    >(functionsInstance, 'verifyRazorpayPayment');

    const result = await verifyFn({
      razorpay_payment_id: paymentId,
      razorpay_order_id: orderId,
      razorpay_signature: signature,
      bookingId,
    });
    return result.data.verified;
  } catch (error) {
    logger.error('Payment verification failed:', error);
    return false;
  }
};
