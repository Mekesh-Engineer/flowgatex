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
import type { Ticket, CreateTicketData, TicketStatus } from '../types/ticket.types';
import { generateQRPayload, hashPayload, createSecureQRData, tierToAccessLevel } from '../utils/qrUtils';
import { logger } from '@/lib/logger';

const COLLECTION = 'tickets';

/**
 * Create individual ticket documents for each purchased ticket.
 * Each ticket gets a unique, cryptographically signed QR code.
 */
export async function createTickets(
  ticketDataList: CreateTicketData[],
  quantities: Record<string, number> // tierId → quantity
): Promise<Ticket[]> {
  const createdTickets: Ticket[] = [];

  for (const data of ticketDataList) {
    const qty = quantities[data.tierId] || 1;

    for (let i = 0; i < qty; i++) {
      const gateAccess = data.gateAccessLevel ?? tierToAccessLevel(data.tierName);

      const payload = generateQRPayload({
        ticketId: '', // will be set after doc creation
        userId: data.userId,
        eventId: data.eventId,
        transactionId: data.transactionId,
        bookingId: data.bookingId,
        attendeeName: data.attendeeName,
        attendeeEmail: data.attendeeEmail,
        tierName: data.tierName,
        gateAccessLevel: gateAccess,
        eventTitle: data.eventTitle,
        eventDate: data.eventDate,
        expiresAt: data.expiresAt || data.eventDate,
      });

      // Pre-generate a temporary ID for the payload
      const tempId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      payload.ticketId = tempId;

      const qrHash = await hashPayload(payload);
      const qrData = createSecureQRData(payload, qrHash);

      const docRef = await addDoc(collection(getDb(), COLLECTION), {
        userId: data.userId,
        eventId: data.eventId,
        eventTitle: data.eventTitle,
        eventDate: data.eventDate,
        bookingId: data.bookingId,
        transactionId: data.transactionId,
        tierId: data.tierId,
        tierName: data.tierName,
        attendeeName: data.attendeeName || '',
        attendeeEmail: data.attendeeEmail || '',
        gateAccessLevel: gateAccess,
        expiresAt: data.expiresAt || data.eventDate || null,
        qrData,
        qrHash,
        status: 'valid' as TicketStatus,
        generatedAt: serverTimestamp(),
        regeneratedCount: 0,
      });

      // Update payload with real doc ID and re-hash
      const finalPayload = generateQRPayload({
        ticketId: docRef.id,
        userId: data.userId,
        eventId: data.eventId,
        transactionId: data.transactionId,
        bookingId: data.bookingId,
        attendeeName: data.attendeeName,
        attendeeEmail: data.attendeeEmail,
        tierName: data.tierName,
        gateAccessLevel: gateAccess,
        eventTitle: data.eventTitle,
        eventDate: data.eventDate,
        expiresAt: data.expiresAt || data.eventDate,
      });

      const finalHash = await hashPayload(finalPayload);
      const finalQRData = createSecureQRData(finalPayload, finalHash);

      await updateDoc(docRef, { qrData: finalQRData, qrHash: finalHash });

      createdTickets.push({
        id: docRef.id,
        userId: data.userId,
        eventId: data.eventId,
        eventTitle: data.eventTitle,
        eventDate: data.eventDate,
        bookingId: data.bookingId,
        transactionId: data.transactionId,
        tierId: data.tierId,
        tierName: data.tierName,
        qrData: finalQRData,
        qrHash: finalHash,
        status: 'valid',
        generatedAt: new Date().toISOString(),
        regeneratedCount: 0,
      });

      logger.log(`🎫 Ticket created: ${docRef.id}`);
    }
  }

  return createdTickets;
}

/**
 * Fetch all tickets for a given booking.
 */
export async function getTicketsByBooking(bookingId: string): Promise<Ticket[]> {
  const q = query(
    collection(getDb(), COLLECTION),
    where('bookingId', '==', bookingId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Ticket);
}

/**
 * Fetch all tickets for a given event.
 */
export async function getEventTickets(eventId: string): Promise<Ticket[]> {
  const q = query(
    collection(getDb(), COLLECTION),
    where('eventId', '==', eventId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Ticket);
}

/**
 * Fetch all tickets for a given user.
 */
export async function getTicketsByUser(userId: string): Promise<Ticket[]> {
  const q = query(
    collection(getDb(), COLLECTION),
    where('userId', '==', userId),
    orderBy('generatedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Ticket);
}

/**
 * Get a single ticket by ID.
 */
export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  const snap = await getDoc(doc(getDb(), COLLECTION, ticketId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Ticket) : null;
}

/**
 * Update a ticket's status of (e.g. used, cancelled, expired).
 */
export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus,
  scannedBy?: string
): Promise<void> {
  const updates: Record<string, any> = { status };
  if (status === 'used') {
    updates.scannedAt = serverTimestamp();
    if (scannedBy) updates.scannedBy = scannedBy;
  }
  await updateDoc(doc(getDb(), COLLECTION, ticketId), updates);
  logger.log(`🎫 Ticket ${ticketId} → ${status}`);
}

/**
 * Regenerate QR for a ticket (invalidates old QR).
 */
export async function regenerateTicketQR(
  ticketId: string
): Promise<{ qrData: string; qrHash: string }> {
  const ticketSnap = await getDoc(doc(getDb(), COLLECTION, ticketId));
  if (!ticketSnap.exists()) throw new Error('Ticket not found');

  const ticket = ticketSnap.data() as Ticket;
  if (ticket.status !== 'valid') {
    throw new Error(`Cannot regenerate QR for ticket with status: ${ticket.status}`);
  }

  const payload = generateQRPayload({
    ticketId,
    userId: ticket.userId,
    eventId: ticket.eventId,
    transactionId: ticket.transactionId,
    bookingId: ticket.bookingId,
    attendeeName: ticket.attendeeName,
    attendeeEmail: ticket.attendeeEmail,
    tierName: ticket.tierName,
    gateAccessLevel: ticket.gateAccessLevel ?? tierToAccessLevel(ticket.tierName),
    eventTitle: ticket.eventTitle,
    eventDate: ticket.eventDate,
    expiresAt: ticket.expiresAt || ticket.eventDate,
  });

  const qrHash = await hashPayload(payload);
  const qrData = createSecureQRData(payload, qrHash);

  await updateDoc(doc(getDb(), COLLECTION, ticketId), {
    qrData,
    qrHash,
    regeneratedCount: (ticket.regeneratedCount || 0) + 1,
  });

  logger.log(`🎫 QR regenerated for ticket: ${ticketId}`);
  return { qrData, qrHash };
}

/**
 * Invalidate all tickets for a booking (used during refunds).
 */
export async function invalidateBookingTickets(bookingId: string): Promise<void> {
  const tickets = await getTicketsByBooking(bookingId);
  for (const ticket of tickets) {
    if (ticket.status === 'valid') {
      await updateTicketStatus(ticket.id, 'cancelled');
    }
  }
  logger.log(`🎫 All tickets invalidated for booking: ${bookingId}`);
}
