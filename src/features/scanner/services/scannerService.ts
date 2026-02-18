// =============================================================================
// SCANNER SERVICE — Firebase-backed ticket validation & audit pipeline
// =============================================================================
// All Firestore operations for the scanner feature are centralised here.
// Each function performs strict input validation before touching the database.
// =============================================================================

import {
  collection,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb } from '@/services/firebase';
import { COLLECTIONS } from '@/lib/firebaseCollections';
import { verifyQRData } from '@/features/booking/utils/qrUtils';
import { getTicketById, updateTicketStatus, getEventTickets } from '@/features/booking/services/ticketService';
import { validateQRCode as iotValidateQR } from '@/features/iot/services/iotService';
import { logger } from '@/lib/logger';
import { gateAccessLabel } from '../utils/scanner.utils';
import type { ScanResult, ScanMethod, ScanStats, OverridePayload } from '../types/scanner.types';
import type { IoTDevice } from '@/features/iot/types/iot.types';

// ─── Input validation helpers ───────────────────────────────────────────────

function assertNonEmptyString(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
}

function assertValidEventId(eventId: unknown): asserts eventId is string {
  assertNonEmptyString(eventId, 'eventId');
  if ((eventId as string).length > 128) {
    throw new Error('eventId exceeds maximum length (128)');
  }
}

function assertValidTicketId(ticketId: unknown): asserts ticketId is string {
  assertNonEmptyString(ticketId, 'ticketId');
  if ((ticketId as string).length > 128) {
    throw new Error('ticketId exceeds maximum length (128)');
  }
}

// ─── Stats loader ───────────────────────────────────────────────────────────

/**
 * Load aggregated scan stats from Firestore for a given event.
 * Returns a ScanStats object with all counts derived from the tickets collection.
 */
export async function loadEventScanStats(eventId: string): Promise<ScanStats> {
  assertValidEventId(eventId);

  const tickets = await getEventTickets(eventId);
  const used = tickets.filter((t) => t.status === 'used').length;
  const cancelled = tickets.filter((t) => t.status === 'cancelled').length;
  const expired = tickets.filter((t) => t.status === 'expired').length;

  return {
    total: used,
    valid: used,
    invalid: cancelled + expired,
    duplicates: 0,
    capacity: tickets.length || 500,
  };
}

// ─── QR Validation Pipeline ────────────────────────────────────────────────

export interface ValidateTicketOptions {
  qrData: string;
  method: ScanMethod;
  activeEventId: string;
  staffUid: string;
  staffName: string;
  isOnline: boolean;
  iotDevices: IoTDevice[];
  onLog: (type: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARNING' | 'SYS', message: string) => void;
}

/**
 * Full QR ticket validation pipeline:
 *  1. Verify QR cryptographic signature
 *  2. Look up ticket in Firestore
 *  3. Check ticket status (used → duplicate, cancelled/expired → invalid)
 *  4. Check event match
 *  5. Mark ticket as used
 *  6. Write audit log
 *  7. Send IoT gate command
 *
 * Every step validates its inputs before proceeding.
 */
export async function validateTicket(opts: ValidateTicketOptions): Promise<ScanResult> {
  const { qrData, method, activeEventId, staffUid, staffName, isOnline, iotDevices, onLog } = opts;

  // ── Pre-checks ──────────────────────────────────────────────────────────
  if (!qrData || typeof qrData !== 'string' || qrData.trim().length === 0) {
    return buildInvalidResult('Empty or malformed QR data', method);
  }

  if (qrData.length > 10_000) {
    return buildInvalidResult('QR data exceeds maximum length', method);
  }

  assertValidEventId(activeEventId);

  onLog('INFO', 'Verifying QR signature...');

  // ── Step 1: Verify cryptographic signature ────────────────────────────
  let verification: Awaited<ReturnType<typeof verifyQRData>>;
  try {
    verification = await verifyQRData(qrData);
  } catch (err: any) {
    logger.error('QR verification threw:', err);
    return buildInvalidResult('QR verification error — corrupted data', method);
  }

  if (!verification.valid) {
    onLog('ERROR', `Signature invalid: ${verification.reason}`);
    return buildInvalidResult(
      verification.reason || 'QR code signature invalid — possible tampering',
      method
    );
  }

  const payload = verification.payload;

  // ── Payload integrity checks ──────────────────────────────────────────
  if (!payload.ticketId || typeof payload.ticketId !== 'string') {
    return buildInvalidResult('QR payload missing ticketId field', method);
  }

  if (payload.ticketId.length > 128) {
    return buildInvalidResult('ticketId in QR payload exceeds max length', method);
  }

  onLog('INFO', `Signature valid. Querying ticket: ${payload.ticketId}`);

  // ── Step 2: Look up ticket in Firestore ───────────────────────────────
  try {
    const ticket = await getTicketById(payload.ticketId);

    if (!ticket) {
      onLog('ERROR', `Ticket ${payload.ticketId} not found in Firestore.`);
      return {
        id: generateResultId(),
        ticketId: payload.ticketId,
        name: payload.attendeeName || 'Unknown',
        tier: payload.tierName || 'N/A',
        status: 'invalid',
        message: 'Ticket not found in system',
        timestamp: new Date(),
        scanMethod: method,
      };
    }

    // ── Step 3: Check ticket status ───────────────────────────────────────
    if (ticket.status === 'used') {
      const scannedAtDate = parseFirestoreTimestamp(ticket.scannedAt);

      onLog('WARNING', `Ticket ${ticket.id} already used at ${scannedAtDate.toLocaleTimeString()}.`);

      return {
        id: generateResultId(),
        ticketId: ticket.id,
        name: payload.attendeeName || ticket.attendeeName || 'Unknown',
        email: payload.attendeeEmail || ticket.attendeeEmail,
        tier: ticket.tierName,
        gateAccess: gateAccessLabel(ticket.gateAccessLevel),
        bookingId: ticket.bookingId,
        eventTitle: ticket.eventTitle,
        eventDate: ticket.eventDate,
        status: 'duplicate',
        message: `Already checked in at ${scannedAtDate.toLocaleTimeString()}`,
        timestamp: new Date(),
        scanMethod: method,
        firstCheckIn: {
          time: scannedAtDate,
          gate: 'Main Entrance',
          device: ticket.scannedBy || 'Unknown',
          staff: staffName || 'Staff',
        },
        overrideCount: 0,
      };
    }

    if (ticket.status === 'cancelled') {
      onLog('ERROR', `Ticket ${ticket.id} is cancelled.`);
      return {
        id: generateResultId(),
        ticketId: ticket.id,
        name: payload.attendeeName || 'Unknown',
        tier: ticket.tierName,
        status: 'invalid',
        message: 'Ticket has been cancelled',
        timestamp: new Date(),
        scanMethod: method,
      };
    }

    if (ticket.status === 'expired') {
      onLog('ERROR', `Ticket ${ticket.id} has expired.`);
      return {
        id: generateResultId(),
        ticketId: ticket.id,
        name: payload.attendeeName || 'Unknown',
        tier: ticket.tierName,
        status: 'invalid',
        message: 'Ticket has expired',
        timestamp: new Date(),
        scanMethod: method,
      };
    }

    // ── Step 4: Check event match ─────────────────────────────────────────
    if (ticket.eventId !== activeEventId) {
      onLog('ERROR', `Ticket ${ticket.id} belongs to event ${ticket.eventId}, not ${activeEventId}.`);
      return {
        id: generateResultId(),
        ticketId: ticket.id,
        name: payload.attendeeName || 'Unknown',
        tier: ticket.tierName,
        status: 'invalid',
        message: 'Ticket is for a different event',
        timestamp: new Date(),
        scanMethod: method,
      };
    }

    // ── Step 5: Mark as used ──────────────────────────────────────────────
    await updateTicketStatus(ticket.id, 'used', staffUid || undefined);
    onLog('SUCCESS', `Ticket ${ticket.id} marked as used in Firestore.`);

    // ── Step 6: Write audit log ───────────────────────────────────────────
    await writeAuditLog({
      action: 'check_in',
      ticketId: ticket.id,
      eventId: activeEventId,
      attendeeName: payload.attendeeName || ticket.attendeeName,
      staffUid: staffUid || 'unknown',
      staffName: staffName || 'Unknown Staff',
      scanMethod: method,
      gate: 'Main Entrance',
    });

    // ── Step 7: Send IoT gate command ─────────────────────────────────────
    await sendGateCommand(
      iotDevices,
      ticket.id,
      ticket.gateAccessLevel ?? 0,
      onLog
    );

    return {
      id: generateResultId(),
      ticketId: ticket.id,
      name: payload.attendeeName || ticket.attendeeName || 'Attendee',
      email: payload.attendeeEmail || ticket.attendeeEmail,
      tier: ticket.tierName,
      gateAccess: gateAccessLabel(ticket.gateAccessLevel),
      bookingId: ticket.bookingId,
      eventTitle: ticket.eventTitle,
      eventDate: ticket.eventDate,
      status: 'valid',
      timestamp: new Date(),
      scanMethod: method,
    };
  } catch (err: any) {
    onLog('ERROR', `Firestore query failed: ${err.message}`);

    // ── Offline fallback via IoT service ────────────────────────────────
    if (!isOnline) {
      onLog('INFO', 'Attempting offline validation via IoT service...');
      try {
        const iotResult = await iotValidateQR(qrData, activeEventId);
        return {
          id: generateResultId(),
          ticketId: iotResult.ticketId || 'QUEUED',
          name: iotResult.attendeeName || 'Offline Scan',
          tier: iotResult.tierName || 'Unknown',
          status: iotResult.success ? 'valid' : 'invalid',
          message: iotResult.success ? 'Validated offline — queued for sync' : iotResult.error,
          timestamp: new Date(),
          scanMethod: method,
        };
      } catch (iotErr: any) {
        logger.error('IoT offline validation failed:', iotErr);
      }
    }

    return {
      id: generateResultId(),
      ticketId: payload.ticketId,
      name: payload.attendeeName || 'Unknown',
      tier: payload.tierName || 'N/A',
      status: 'invalid',
      message: 'Validation failed — please retry',
      timestamp: new Date(),
      scanMethod: method,
    };
  }
}

// ─── Manual ticket validation ───────────────────────────────────────────────

export interface ManualValidateOptions {
  ticketId: string;
  activeEventId: string;
  staffUid: string;
  staffName: string;
  iotDevices: IoTDevice[];
  onLog: (type: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARNING' | 'SYS', message: string) => void;
}

/**
 * Validate a manually entered ticket ID.
 * Performs the same status checks as QR validation but skips signature verification.
 */
export async function validateManualTicket(opts: ManualValidateOptions): Promise<ScanResult> {
  const { ticketId, activeEventId, staffUid, staffName, iotDevices, onLog } = opts;

  assertValidTicketId(ticketId);
  assertValidEventId(activeEventId);

  onLog('INFO', `Manual entry received: ${ticketId.toUpperCase()}`);

  const ticket = await getTicketById(ticketId.trim());

  if (!ticket) {
    onLog('ERROR', `Ticket ${ticketId} not found.`);
    return {
      id: generateResultId(),
      ticketId: ticketId.toUpperCase(),
      name: 'Unknown',
      tier: 'N/A',
      status: 'invalid',
      message: 'Ticket ID not found in system',
      timestamp: new Date(),
      scanMethod: 'manual',
    };
  }

  // Status checks
  let status: 'valid' | 'invalid' | 'duplicate' = 'valid';
  let message = '';

  if (ticket.status === 'used') {
    status = 'duplicate';
    message = 'Already checked in';
  } else if (ticket.status === 'cancelled' || ticket.status === 'expired') {
    status = 'invalid';
    message = `Ticket ${ticket.status}`;
  } else if (ticket.eventId !== activeEventId) {
    status = 'invalid';
    message = 'Ticket belongs to a different event';
  } else {
    // Valid → mark used
    await updateTicketStatus(ticket.id, 'used', staffUid || undefined);
    await sendGateCommand(iotDevices, ticket.id, ticket.gateAccessLevel ?? 0, onLog);
    await writeAuditLog({
      action: 'check_in',
      ticketId: ticket.id,
      eventId: activeEventId,
      attendeeName: ticket.attendeeName,
      staffUid: staffUid || 'unknown',
      staffName: staffName || 'Unknown Staff',
      scanMethod: 'manual',
      gate: 'Main Entrance',
    });
    onLog('SUCCESS', `Ticket ${ticket.id} checked in via manual entry.`);
  }

  return {
    id: generateResultId(),
    ticketId: ticket.id,
    name: ticket.attendeeName || 'Manual Entry',
    email: ticket.attendeeEmail,
    tier: ticket.tierName,
    gateAccess: gateAccessLabel(ticket.gateAccessLevel),
    bookingId: ticket.bookingId,
    eventTitle: ticket.eventTitle,
    status,
    message,
    timestamp: new Date(),
    scanMethod: 'manual',
  };
}

// ─── Override ───────────────────────────────────────────────────────────────

/**
 * Record an organiser override and send gate command.
 * Validates all fields before writing to Firestore.
 */
export async function processOverride(
  payload: OverridePayload,
  iotDevices: IoTDevice[],
  onLog: (type: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARNING' | 'SYS', message: string) => void
): Promise<void> {
  assertValidTicketId(payload.ticketId);
  assertValidEventId(payload.eventId);
  assertNonEmptyString(payload.reason, 'override reason');
  assertNonEmptyString(payload.category, 'override category');

  await addDoc(collection(getDb(), COLLECTIONS.AUDIT_LOGS), {
    action: 'override_check_in',
    ticketId: payload.ticketId,
    eventId: payload.eventId,
    reason: payload.reason,
    category: payload.category,
    staffUid: payload.staffUid || 'unknown',
    staffName: payload.staffName || 'Unknown Staff',
    timestamp: serverTimestamp(),
  });

  await sendGateCommand(iotDevices, payload.ticketId, 0, onLog);

  onLog('SUCCESS', `Override approved for ${payload.ticketId}.`);
}

// ─── IoT Gate Commands ──────────────────────────────────────────────────────

/**
 * Send a gate-open command to all online turnstile devices.
 */
export async function sendGateCommand(
  devices: IoTDevice[],
  ticketId: string,
  accessLevel: number,
  onLog: (type: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARNING' | 'SYS', message: string) => void
): Promise<void> {
  const gates = devices.filter((d) => d.type === 'turnstile' && d.status === 'online');
  if (gates.length === 0) return;

  for (const gate of gates) {
    try {
      await updateDoc(doc(getDb(), COLLECTIONS.DEVICES, gate.id), {
        lastCommand: 'open',
        lastCommandTicket: ticketId,
        lastCommandAccess: accessLevel,
        lastCommandAt: serverTimestamp(),
      });
      onLog('SYS', `Gate command sent to ${gate.name} (access level ${accessLevel}).`);
    } catch {
      onLog('WARNING', `Failed to send gate command to ${gate.name}.`);
    }
  }
}

// ─── Audit Logging ──────────────────────────────────────────────────────────

interface AuditEntry {
  action: string;
  ticketId: string;
  eventId: string;
  attendeeName?: string;
  staffUid: string;
  staffName: string;
  scanMethod: string;
  gate: string;
}

async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await addDoc(collection(getDb(), COLLECTIONS.AUDIT_LOGS), {
      ...entry,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    // Audit log failure must never block a scan
    logger.warn('Audit log write failed:', err);
  }
}

// ─── Private helpers ────────────────────────────────────────────────────────

function generateResultId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildInvalidResult(message: string, method: ScanMethod): ScanResult {
  return {
    id: generateResultId(),
    ticketId: 'UNKNOWN',
    name: 'Unknown',
    tier: 'N/A',
    status: 'invalid',
    message,
    timestamp: new Date(),
    scanMethod: method,
  };
}

function parseFirestoreTimestamp(ts: any): Date {
  if (!ts) return new Date();
  if (ts instanceof Date) return ts;
  if (typeof ts === 'string') return new Date(ts);
  if (typeof ts === 'object' && 'seconds' in ts) return new Date(ts.seconds * 1000);
  return new Date();
}
