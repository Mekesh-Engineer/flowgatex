import { useState, useCallback } from 'react';
import { initiateRazorpayPayment } from '../services/razorpayService';
import { processMockPayment } from '../services/mockPaymentService';
import type { PaymentResult } from '../types/payment.types';
import { showSuccess, showError } from '@/components/common/Toast';

// Determine if we should use the mock payment gateway
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;
const useMockPayment = !RAZORPAY_KEY || RAZORPAY_KEY.includes('DEMO') || RAZORPAY_KEY.includes('REPLACE');

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

      // ── Mock payment path ──────────────────────────────────────────
      if (useMockPayment) {
        try {
          const result = await processMockPayment(orderId, amount, currency);
          setPaymentResult(result);
          showSuccess('Payment successful! (simulated)');
          return result;
        } catch {
          const result: PaymentResult = { success: false, error: 'Mock payment failed' };
          setPaymentResult(result);
          showError(result.error!);
          return result;
        } finally {
          setIsProcessing(false);
        }
      }

      // ── Live Razorpay path ─────────────────────────────────────────
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
