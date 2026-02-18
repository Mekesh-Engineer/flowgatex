
import { logger } from '@/lib/logger';

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // 1. Check if Razorpay is already attached to window
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const scriptSrc = 'https://checkout.razorpay.com/v1/checkout.js';
    
    // 2. Check if script is already present (e.g., loading)
    const existingScript = document.querySelector(`script[src="${scriptSrc}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    // 3. Load script
    const script = document.createElement('script');
    script.src = scriptSrc;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayErrorResponse {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: {
      order_id: string;
      payment_id: string;
    };
  };
}

export interface RazorpayOptions {
  key: string;
  amount: number; // in paise
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id?: string; // from backend
  handler: (response: RazorpaySuccessResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, handler: (response: RazorpayErrorResponse) => void) => void;
    };
  }
}

export const openRazorpay = async (options: RazorpayOptions) => {
  const res = await loadRazorpayScript();

  if (!res) {
    logger.error('Razorpay SDK failed to load');
    throw new Error('Razorpay SDK failed to load. Are you online?');
  }

  const rzp = new window.Razorpay(options);
  
  // Optional: Listen for payment failures if needed
  rzp.on('payment.failed', function (response: RazorpayErrorResponse) {
      logger.error('Payment Failed', response.error);
  });

  rzp.open();
};
