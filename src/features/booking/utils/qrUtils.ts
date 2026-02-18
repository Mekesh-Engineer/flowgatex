import { logger } from '@/lib/logger';

export interface QRPayload {
  ticketId: string;
  userId: string;
  eventId: string;
  transactionId: string;
  bookingId: string;
  /** Unix timestamp when the ticket was issued */
  issuedAt: number;
  /** Attendee name printed on the ticket */
  attendeeName?: string;
  /** Attendee email for verification */
  attendeeEmail?: string;
  /** Tier name for gate-level access control */
  tierName?: string;
  /** Gate access level: 0=General, 1=VIP, 2=All-Access */
  gateAccessLevel?: number;
  /** Event title for quick visual reference at the gate */
  eventTitle?: string;
  /** ISO date string of the event */
  eventDate?: string;
  /** ISO date string when the ticket expires (defaults to eventDate) */
  expiresAt?: string;
}

/**
 * Map a tier name to a numeric gate access level.
 * 0 = General, 1 = VIP, 2 = All-Access / Backstage
 */
export function tierToAccessLevel(tierName?: string): number {
  if (!tierName) return 0;
  const lower = tierName.toLowerCase();
  if (lower.includes('all-access') || lower.includes('backstage') || lower.includes('all access')) return 2;
  if (lower.includes('vip')) return 1;
  return 0; // General / Student / default
}

/**
 * Build the raw QR payload object.
 */
export function generateQRPayload(data: Omit<QRPayload, 'issuedAt'>): QRPayload {
  return { ...data, issuedAt: Date.now() };
}

/**
 * Create a SHA-256 hex digest of the payload using the Web Crypto API.
 */
// TODO: Move this secret to a secure backend environment variable (e.g. Cloud Functions)
// In a production environment, signing must happen server-side to prevent tampering.
const SIGNING_SECRET = 'flowgatex-secure-signing-key-v1';

export async function hashPayload(payload: QRPayload): Promise<string> {
  const encoder = new TextEncoder();
  // Include the secret in the data to be hashed (HMAC-like construction)
  const dataToSign = JSON.stringify(payload) + SIGNING_SECRET;
  const data = encoder.encode(dataToSign);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Combine payload + signature into a single Base64-encoded string for the QR code.
 * The resulting structure matches the documented spec:
 * { ...payload, signature: hash } → JSON.stringify → Base64
 */
export function createSecureQRData(payload: QRPayload, hash: string): string {
  const combined = JSON.stringify({ ...payload, signature: hash });
  return btoa(combined);
}

/**
 * Decode a secure QR data string and verify its hash integrity.
 * Returns the payload if valid, throws if tampered.
 */
export async function verifyQRData(
  qrString: string
): Promise<{ valid: boolean; payload: QRPayload; reason?: string }> {
  try {
    const decoded = atob(qrString);
    const parsed = JSON.parse(decoded) as QRPayload & { signature?: string; hash?: string };

    // Extract signature (supports both naming conventions)
    const signature = parsed.signature || parsed.hash;
    if (!signature) {
      return { valid: false, payload: parsed as QRPayload, reason: 'Malformed QR data — no signature' };
    }

    // Reconstruct payload without signature/hash for hashing
    const { signature: _sig, hash: _hash, ...payloadOnly } = parsed as any;
    const payload = payloadOnly as QRPayload;

    const recomputedHash = await hashPayload(payload);

    if (recomputedHash !== signature) {
      logger.warn('🔒 QR hash mismatch — potential tampering');
      return { valid: false, payload, reason: 'Hash mismatch — possible fraud' };
    }

    return { valid: true, payload };
  } catch (error) {
    logger.error('QR verification failed:', error);
    return {
      valid: false,
      payload: {} as QRPayload,
      reason: 'Invalid QR data format',
    };
  }
}
