// =============================================================================
// TRANSACTION SERVICE — Firestore transaction reads + Razorpay sync
// =============================================================================

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  Timestamp,
  type Unsubscribe,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getDb, getFunctionsInstance } from './firebase';
import { logger } from '@/lib/logger';
import type {
  AdminTransaction,
  TransactionFilters,
  FinancialSummary,
  Payout,
  RefundParams,
  RefundResult,
} from '@/types/admin.types';

const PAGE_SIZE = 50;

function docToTransaction(snap: QueryDocumentSnapshot<DocumentData>): AdminTransaction {
  const data = snap.data();
  return {
    id: snap.id,
    razorpayPaymentId: data.razorpayPaymentId || data.paymentId || '',
    razorpayOrderId: data.razorpayOrderId || data.orderId || '',
    razorpaySignature: data.razorpaySignature || '',
    bookingId: data.bookingId || '',
    userId: data.userId || '',
    userName: data.userName || '',
    userEmail: data.userEmail || '',
    eventId: data.eventId || '',
    eventTitle: data.eventTitle || '',
    organizerName: data.organizerName || '',
    amount: data.amount || 0,
    platformFee: data.platformFee || 0,
    organizerAmount: data.organizerAmount || (data.amount - (data.platformFee || 0)),
    currency: data.currency || 'INR',
    status: data.status || 'pending',
    gateway: data.gateway || 'razorpay',
    paymentMethod: data.paymentMethod || undefined,
    refundId: data.refundId || undefined,
    refundAmount: data.refundAmount || undefined,
    refundReason: data.refundReason || undefined,
    refundedAt: data.refundedAt || undefined,
    webhookEvents: data.webhookEvents || [],
    createdAt: data.createdAt || Timestamp.now(),
    updatedAt: data.updatedAt || undefined,
  };
}

function docToPayout(snap: QueryDocumentSnapshot<DocumentData>): Payout {
  const data = snap.data();
  return {
    id: snap.id,
    organizerId: data.organizerId || '',
    organizerName: data.organizerName || '',
    amount: data.amount || 0,
    currency: data.currency || 'INR',
    eventIds: data.eventIds || [],
    status: data.status || 'pending',
    razorpayTransferId: data.razorpayTransferId || null,
    requestedAt: data.requestedAt || Timestamp.now(),
    processedAt: data.processedAt || null,
    processedBy: data.processedBy || null,
    blockReason: data.blockReason || null,
  };
}

// =============================================================================
// TRANSACTION SUBSCRIPTIONS
// =============================================================================

export function subscribeToTransactions(
  filters: TransactionFilters,
  callback: (txns: AdminTransaction[]) => void
): Unsubscribe {
  try {
    const db = getDb();
    let q = query(
      collection(db, 'transactions'),
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE)
    );

    if (filters.status) q = query(q, where('status', '==', filters.status));
    if (filters.gateway) q = query(q, where('gateway', '==', filters.gateway));
    if (filters.dateFrom) q = query(q, where('createdAt', '>=', Timestamp.fromDate(filters.dateFrom)));
    if (filters.dateTo) q = query(q, where('createdAt', '<=', Timestamp.fromDate(filters.dateTo)));

    return onSnapshot(q, (snap) => {
      let txns = snap.docs.map(docToTransaction);
      if (filters.search) {
        const s = filters.search.toLowerCase();
        txns = txns.filter(
          (t) =>
            t.razorpayPaymentId.toLowerCase().includes(s) ||
            t.userEmail?.toLowerCase().includes(s) ||
            t.userName?.toLowerCase().includes(s) ||
            t.eventTitle?.toLowerCase().includes(s)
        );
      }
      callback(txns);
    }, (error) => {
      logger.error('Error subscribing to transactions', error);
      callback([]);
    });
  } catch {
    callback([]);
    return () => {};
  }
}

// =============================================================================
// FINANCIAL SUMMARY
// =============================================================================

export function subscribeToFinancialSummary(
  period: FinancialSummary['period'],
  callback: (summary: FinancialSummary) => void
): Unsubscribe {
  try {
    const db = getDb();
    const docRef = doc(db, 'financial_summary', period);
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        callback({
          period,
          grossRevenue: data.grossRevenue || 0,
          platformFee: data.platformFee || 0,
          organizerAmount: data.organizerAmount || 0,
          totalRefunds: data.totalRefunds || 0,
          netRevenue: data.netRevenue || 0,
          transactionCount: data.transactionCount || 0,
          failedCount: data.failedCount || 0,
          updatedAt: data.updatedAt,
        });
      } else {
        callback({
          period,
          grossRevenue: 0,
          platformFee: 0,
          organizerAmount: 0,
          totalRefunds: 0,
          netRevenue: 0,
          transactionCount: 0,
          failedCount: 0,
        });
      }
    });
  } catch {
    return () => {};
  }
}

// =============================================================================
// PAYOUT SUBSCRIPTIONS
// =============================================================================

export function subscribeToPendingPayouts(
  callback: (payouts: Payout[]) => void
): Unsubscribe {
  try {
    const db = getDb();
    const q = query(
      collection(db, 'payouts'),
      where('status', 'in', ['pending', 'processing']),
      orderBy('requestedAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(docToPayout));
    }, (error) => {
      logger.error('Error subscribing to payouts', error);
      callback([]);
    });
  } catch {
    callback([]);
    return () => {};
  }
}

// =============================================================================
// REFUND MANAGEMENT
// =============================================================================

export async function initiateRefund(params: RefundParams): Promise<RefundResult> {
  const fn = getFunctionsInstance();
  const issueRefund = httpsCallable(fn, 'issueRefund');
  const result = await issueRefund({
    transactionId: params.transactionId,
    amount: params.amount,
    reason: params.reason,
    notifyAttendee: params.notify,
  });
  return result.data as RefundResult;
}
