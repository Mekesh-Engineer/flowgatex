import { useState, useCallback } from 'react';
import { initiateRazorpayPayment } from '../services/razorpayService';
import type { PaymentResult } from '../types/payment.types';
import { showSuccess, showError } from '@/components/common/Toast';

export function usePayment() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

  const processPayment = useCallback(
    async (
      orderId: string,
      amount: number,
      currency: string = 'INR',
      userDetails: { name?: string; email?: string; phone?: string } = {}
    ): Promise<PaymentResult> => {
      setIsProcessing(true);

      return new Promise((resolve) => {
        initiateRazorpayPayment(
          orderId,
          amount,
          currency,
          userDetails,
          (result) => {
            setPaymentResult(result);
            setIsProcessing(false);
            showSuccess('Payment successful!');
            resolve(result);
          },
          (error) => {
            const result = { success: false, error };
            setPaymentResult(result);
            setIsProcessing(false);
            showError(error);
            resolve(result);
          }
        );
      });
    },
    []
  );

  const resetPayment = useCallback(() => {
    setPaymentResult(null);
  }, []);

  return {
    processPayment,
    resetPayment,
    isProcessing,
    paymentResult,
  };
}

export default usePayment;
