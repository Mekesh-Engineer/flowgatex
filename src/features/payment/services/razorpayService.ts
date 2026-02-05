import type { RazorpayOptions, RazorpayResponse, PaymentResult } from '../types/payment.types';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
    };
  }
}

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

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
      name: userDetails.name,
      email: userDetails.email,
      contact: userDetails.phone,
    },
    theme: {
      color: '#22d3ee',
    },
  };

  try {
    const razorpay = new window.Razorpay(options);
    razorpay.open();
  } catch (error) {
    onFailure('Payment initialization failed');
  }
};

export const verifyPayment = async (
  paymentId: string,
  orderId: string,
  signature: string
): Promise<boolean> => {
  // This should call your backend to verify the payment
  // For now, we'll return true
  console.log('Verifying payment:', { paymentId, orderId, signature });
  return true;
};
