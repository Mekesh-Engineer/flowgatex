/**
 * Mock Payment Service – Instant-success stub
 * Used when no Razorpay/Cashfree keys are configured
 * Simulates a 1.5 s processing delay then resolves with a mock payment ID.
 */
import type { PaymentResult } from '../types/payment.types';

const randomId = () =>
  `mock_pay_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export async function processMockPayment(
  orderId: string,
  _amount: number,
  _currency: string = 'INR'
): Promise<PaymentResult> {
  // Simulate gateway processing delay
  await new Promise((r) => setTimeout(r, 1500));

  return {
    success: true,
    paymentId: randomId(),
    orderId,
    signature: 'mock_sig_' + randomId(),
  };
}
