export interface PaymentOptions {
  amount: number;
  currency: string;
  orderId: string;
  description?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  signature?: string;
  error?: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface CashfreeOptions {
  orderId: string;
  orderAmount: number;
  orderCurrency: string;
  orderNote?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
}
