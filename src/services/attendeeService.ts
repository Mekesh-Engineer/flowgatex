// =============================================================================
// ATTENDEE SERVICE — Attendee records, booking management, check-in data
// =============================================================================

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { getDb } from './firebase';
import { logger } from '@/lib/logger';
import { logAdminAction } from './auditService';
import type { AttendeeRecord, AttendeeFilters, ServiceResult } from '@/types/admin.types';

const PAGE_SIZE = 50;

function docToBooking(snap: QueryDocumentSnapshot<DocumentData>): AttendeeRecord {
  const data = snap.data();
  return {
    id: snap.id,
    userId: data.userId || '',
    userName: data.userName || data.attendeeName || '',
    userEmail: data.userEmail || data.attendeeEmail || '',
    userAvatar: data.userAvatar || undefined,
    eventId: data.eventId || '',
    eventTitle: data.eventTitle || '',
    ticketCount: data.ticketCount || data.quantity || 1,
    ticketTier: data.ticketTier || data.tierName || '',
    totalAmount: data.totalAmount || data.amount || 0,
    platformFee: data.platformFee || 0,
    organizerAmount: data.organizerAmount || 0,
    status: data.status || 'confirmed',
    checkedInAt: data.checkedInAt || null,
    createdAt: data.createdAt || Timestamp.now(),
    updatedAt: data.updatedAt || undefined,
  };
}

// =============================================================================
// SUBSCRIPTIONS
// =============================================================================

export function subscribeToAttendees(
  filters: AttendeeFilters,
  callback: (attendees: AttendeeRecord[]) => void
): Unsubscribe {
  try {
    const db = getDb();
    let q = query(
      collection(db, 'bookings'),
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE)
    );

    if (filters.eventId) q = query(q, where('eventId', '==', filters.eventId));
    if (filters.userId) q = query(q, where('userId', '==', filters.userId));
    if (filters.status) q = query(q, where('status', '==', filters.status));
    if (filters.dateFrom) q = query(q, where('createdAt', '>=', Timestamp.fromDate(filters.dateFrom)));

    return onSnapshot(q, (snap) => {
      let attendees = snap.docs.map(docToBooking);

      if (filters.search) {
        const s = filters.search.toLowerCase();
        attendees = attendees.filter(
          (a) =>
            a.userName.toLowerCase().includes(s) ||
            a.userEmail.toLowerCase().includes(s) ||
            a.eventTitle.toLowerCase().includes(s)
        );
      }

      if (filters.ticketType) {
        attendees = attendees.filter((a) => a.ticketTier === filters.ticketType);
      }

      callback(attendees);
    }, (error) => {
      logger.error('Error subscribing to attendees', error);
      callback([]);
    });
  } catch {
    callback([]);
    return () => {};
  }
}

// =============================================================================
// ACTIONS
// =============================================================================

export async function cancelBooking(
  bookingId: string,
  adminUid: string,
  adminEmail: string
): Promise<ServiceResult> {
  try {
    const db = getDb();
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
      cancelledBy: adminUid,
      updatedAt: serverTimestamp(),
    });

    await logAdminAction('booking:cancel', `bookings/${bookingId}`, {
      resourceType: 'booking',
      performedBy: adminUid,
      performedByEmail: adminEmail,
      severity: 'warning',
      details: { reason: 'Admin manual cancellation' },
    });

    return { success: true };
  } catch (error) {
    logger.error('Cancel booking failed', error);
    return { success: false, error: 'Failed to cancel booking' };
  }
}

export async function manualCheckIn(
  bookingId: string,
  adminUid: string,
  adminEmail: string
): Promise<ServiceResult> {
  try {
    const db = getDb();
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      status: 'checked_in',
      checkedInAt: serverTimestamp(),
      checkedInBy: adminUid,
      updatedAt: serverTimestamp(),
    });

    await logAdminAction('booking:check_in', `bookings/${bookingId}`, {
      resourceType: 'booking',
      performedBy: adminUid,
      performedByEmail: adminEmail,
      severity: 'info',
      details: { reason: 'Admin manual check-in override' },
    });

    return { success: true };
  } catch (error) {
    logger.error('Manual check-in failed', error);
    return { success: false, error: 'Failed to check in attendee' };
  }
}
