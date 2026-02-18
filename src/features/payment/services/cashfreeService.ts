import type { CashfreeOptions, PaymentResult } from '../types/payment.types';
import api from '@/services/api';
import { logger } from '@/lib/logger';

const CASHFREE_APP_ID = import.meta.env.VITE_CASHFREE_APP_ID;

export const initiateCashfreePayment = async (
  options: CashfreeOptions
): Promise<PaymentResult> => {
  try {
    // Create order on backend
    const response = await api.post('/payments/cashfree/create-order', {
      ...options,
      appId: CASHFREE_APP_ID,
    });

    const { paymentLink, orderId } = response.data;

    // Redirect to Cashfree payment page
    window.location.href = paymentLink;

    return {
      success: true,
      orderId,
    };
  } catch (error) {
    logger.error('Cashfree payment error:', error);
    return {
      success: false,
      error: 'Failed to initiate payment',
    };
  }
};

export const verifyCashfreePayment = async (orderId: string): Promise<boolean> => {
  try {
    const response = await api.get(`/payments/cashfree/verify/${orderId}`);
    return response.data.success;
  } catch (error) {
    logger.error('Cashfree verification error:', error);
    return false;
  }
};
