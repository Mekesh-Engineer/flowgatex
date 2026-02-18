import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb } from '@/services/firebase';
import { PaymentStatus } from '@/lib/constants';
import type {
  Transaction,
  CreateTransactionData,
  TransactionFilter,
} from '../types/transaction.types';
import { logger } from '@/lib/logger';

const COLLECTION = 'transactions';

/**
 * Create a new transaction record after successful payment.
 */
export async function createTransaction(
  data: CreateTransactionData
): Promise<string> {
  const docRef = await addDoc(collection(getDb(), COLLECTION), {
    ...data,
    paymentStatus: PaymentStatus.SUCCESS,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  logger.log('💰 Transaction created:', docRef.id);
  return docRef.id;
}

/**
 * Get all transactions for a user, ordered by newest first.
 */
export async function getUserTransactions(
  userId: string
): Promise<Transaction[]> {
  const q = query(
    collection(getDb(), COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as Transaction
  );
}

/**
 * Get a single transaction by ID.
 */
export async function getTransactionById(
  id: string
): Promise<Transaction | null> {
  const snap = await getDoc(doc(getDb(), COLLECTION, id));
  return snap.exists()
    ? ({ id: snap.id, ...snap.data() } as Transaction)
    : null;
}

/**
 * Look up a transaction by its Razorpay payment ID (for refund lookups).
 */
export async function getTransactionByPaymentId(
  razorpayPaymentId: string
): Promise<Transaction | null> {
  const q = query(
    collection(getDb(), COLLECTION),
    where('razorpayPaymentId', '==', razorpayPaymentId)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...d.data() } as Transaction;
}

/**
 * Update the payment status of a transaction.
 */
export async function updateTransactionStatus(
  id: string,
  status: PaymentStatus
): Promise<void> {
  await updateDoc(doc(getDb(), COLLECTION, id), {
    paymentStatus: status,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Filter transactions client-side based on category.
 */
export function filterTransactions(
  transactions: Transaction[],
  filter: TransactionFilter
): Transaction[] {
  switch (filter) {
    case 'active':
      return transactions.filter(
        (t) => t.paymentStatus === PaymentStatus.SUCCESS
      );
    case 'refunded':
      return transactions.filter(
        (t) => t.paymentStatus === PaymentStatus.REFUNDED
      );
    case 'failed':
      return transactions.filter(
        (t) => t.paymentStatus === PaymentStatus.FAILED
      );
    default:
      return transactions;
  }
}
