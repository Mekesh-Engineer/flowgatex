// =============================================================================
// ADMIN SERVICE - Admin Dashboard Stats & Integrations
// =============================================================================

import {
  collection,
  query,
  where,
  onSnapshot,
  getCountFromServer,
  sum,
  getAggregateFromServer,
  doc,
  orderBy,
  runTransaction,
  updateDoc,
  type Timestamp as FirestoreTimestamp
} from 'firebase/firestore';
import { getDb } from './firebase';
import { logger } from '@/lib/logger';
import { UserRole } from '@/lib/constants';

export interface AdminStats {
  totalUsers: number;
  totalEvents: number;
  platformRevenue: number;
  activeOrganizers: number;
  pendingApprovals: number;
  bookingsToday: number;
  loading: boolean;
}

// Cache duration kept for future use
// const STATS_CACHE_DURATION = 5 * 60 * 1000;

/**
 * Subscribes to admin stats updates.
 * Listens to `system_stats/dashboard` if it exists, otherwise falls back
 * to aggregation queries.
 */
export const subscribeToAdminStats = (
  callback: (stats: AdminStats) => void
): (() => void) => {
  const statsRef = doc(getDb(), 'system_stats', 'dashboard');

  const unsubscribe = onSnapshot(
    statsRef,
    (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.data();
            callback({
                totalUsers: data.totalUsers || 0,
                totalEvents: data.totalEvents || 0,
                platformRevenue: data.platformRevenue || 0,
                activeOrganizers: data.activeOrganizers || 0,
                pendingApprovals: data.pendingApprovals || 0,
                bookingsToday: data.bookingsToday || 0,
                loading: false
            });
        } else {
            logger.warn('system_stats/dashboard doc not found. Falling back to aggregation fetch.');
            fetchAdminStatsAggregates().then(stats => callback(stats));
        }
    },
    (error) => {
      logger.error('Failed to subscribe to admin stats', error);
      fetchAdminStatsAggregates().then(stats => callback(stats));
    }
  );

  return unsubscribe;
};

/**
 * Fetches aggregated stats directly from collections.
 * Uses `getCountFromServer` and `getAggregateFromServer` which are cost-effective.
 */
export const fetchAdminStatsAggregates = async (): Promise<AdminStats> => {
  try {
    // 1. Users Count
    const firestore = getDb();
    const usersColl = collection(firestore, 'users');
    const usersSnapshot = await getCountFromServer(usersColl);
    const totalUsers = usersSnapshot.data().count;

    // 2. Events Count
    const eventsColl = collection(firestore, 'events');
    const eventsSnapshot = await getCountFromServer(eventsColl);
    const totalEvents = eventsSnapshot.data().count;

    // 3. Active Organizers (Role == ORGANIZER)
    const organizersQuery = query(usersColl, where('role', '==', UserRole.ORGANIZER));
    const organizersSnapshot = await getCountFromServer(organizersQuery);
    const activeOrganizers = organizersSnapshot.data().count;

    // 4. Platform Revenue (Sum of transactions amount)
    const transactionsColl = collection(firestore, 'transactions');
    // Note: 'sum' aggregation is available in newer SDKs.
    // Ensure 'amount' is a number field in transactions.
    const revenueSnapshot = await getAggregateFromServer(transactionsColl, {
      totalRevenue: sum('amount')
    });
    const platformRevenue = revenueSnapshot.data().totalRevenue || 0;

    return {
      totalUsers,
      totalEvents,
      activeOrganizers,
      platformRevenue,
      pendingApprovals: 0,
      bookingsToday: 0,
      loading: false
    };

  } catch (error) {
    logger.error('Error fetching admin aggregates', error);
    return {
      totalUsers: 0,
      totalEvents: 0,
      platformRevenue: 0,
      activeOrganizers: 0,
      pendingApprovals: 0,
      bookingsToday: 0,
      loading: false
    };
  }
};

/**
 * ORGANIZER APPROVALS SUBSCRIPTION
 */
export interface OrganizerApplication {
    id: string;
    userId: string;
    name: string;
    email: string;
    organization: string;
    website: string;
    phone: string;
    location: string;
    submittedAt: FirestoreTimestamp | null;
    documents: { name: string; url: string; type: string }[];
    status: 'pending' | 'approved' | 'rejected';
}

export const subscribeToOrganizerRequests = (callback: (requests: OrganizerApplication[]) => void): () => void => {
    const q = query(
        collection(getDb(), 'organizer_access_requests'),
        orderBy('submittedAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as OrganizerApplication);
        callback(requests);
    }, (error) => {
        console.error("Error fetching organizer requests", error);
    });
};
export const approveOrganizerRequest = async (requestId: string, userId: string): Promise<void> => {
    try {
        const firestore = getDb();
        await runTransaction(firestore, async (transaction) => {
            const requestRef = doc(firestore, 'organizer_access_requests', requestId);
            const userRef = doc(firestore, 'users', userId);

            // Verify user exists
            const userSnap = await transaction.get(userRef);
            if (!userSnap.exists()) {
                throw new Error("User associated with this request does not exist.");
            }

            // Update request status
            transaction.update(requestRef, {
                status: 'approved',
                approvedAt: new Date(),
            });

            // Update user role to organizer
            // We preserve existing data, just update role and add organizer info if needed
            transaction.update(userRef, {
                role: 'organizer',
                updatedAt: new Date().toISOString()
            });
        });
        logger.log(`Approved organizer request ${requestId} for user ${userId}`);
    } catch (error) {
        logger.error(`Error approving organizer request ${requestId}`, error);
        throw error;
    }
};

export const rejectOrganizerRequest = async (requestId: string, reason: string): Promise<void> => {
    try {
        const requestRef = doc(getDb(), 'organizer_access_requests', requestId);
        await updateDoc(requestRef, {
            status: 'rejected',
            rejectionReason: reason,
            rejectedAt: new Date()
        });
        logger.log(`Rejected organizer request ${requestId}`);
    } catch (error) {
        logger.error(`Error rejecting organizer request ${requestId}`, error);
        throw error;
    }
};
