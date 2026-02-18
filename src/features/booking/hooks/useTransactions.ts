import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/zustand/stores';
import {
  getUserTransactions,
  filterTransactions,
} from '../services/transactionService';
import type { Transaction, TransactionFilter } from '../types/transaction.types';
import { PaymentStatus } from '@/lib/constants';

/**
 * React-Query hook that fetches the current user's transactions from Firestore
 * and exposes derived stats + client-side filtering helpers.
 */
export function useTransactions(filter: TransactionFilter = 'all') {
  const user = useAuthStore((s) => s.user);

  const {
    data: allTransactions = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Transaction[]>({
    queryKey: ['transactions', user?.uid],
    queryFn: () => getUserTransactions(user!.uid),
    enabled: !!user?.uid,
    staleTime: 30_000, // 30s
  });

  // Apply client-side filter
  const transactions = filterTransactions(allTransactions, filter);

  // Derived stats
  const totalSpent = allTransactions
    .filter((t) => t.paymentStatus === PaymentStatus.SUCCESS)
    .reduce((sum, t) => sum + t.amountPaid, 0);

  const totalRefunds = allTransactions
    .filter((t) => t.paymentStatus === PaymentStatus.REFUNDED)
    .reduce((sum, t) => sum + t.amountPaid, 0);

  const balance = totalRefunds; // refund credits available

  return {
    transactions,
    allTransactions,
    isLoading,
    isError,
    error,
    refetch,
    totalSpent,
    totalRefunds,
    balance,
  };
}
