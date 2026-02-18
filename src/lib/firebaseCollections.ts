// =============================================================================
// FIREBASE COLLECTION IDS — Central Registry
// =============================================================================
// All Firestore collection names used across the application.
// Import from this file instead of hardcoding collection strings.
// =============================================================================

/** Core user-facing collections */
export const COLLECTIONS = {
  /** User profiles and account data */
  USERS: 'users',

  /** Events created by organizers */
  EVENTS: 'events',

  /** Ticket documents — one per purchased ticket */
  TICKETS: 'tickets',

  /** Bookings — one per checkout session (may contain multiple tickets) */
  BOOKINGS: 'bookings',

  /** Payment transactions linked to bookings */
  TRANSACTIONS: 'transactions',

  /** Shopping cart items (per-user, per-event) */
  CART: 'cart',

  /** IoT devices (scanners, turnstiles, displays) linked to events */
  DEVICES: 'devices',

  /** Audit trail for check-ins, overrides, and sensitive operations */
  AUDIT_LOGS: 'audit_logs',

  /** Scanner sessions — tracks each scan session with metadata */
  SCANNER_SESSIONS: 'scanner_sessions',

  /** Check-in records — granular per-ticket check-in data */
  CHECK_INS: 'check_ins',

  /** Platform-wide and org-level settings */
  SETTINGS: 'SettingInfo',

  /** Organizer payouts and financial records */
  PAYOUTS: 'payouts',

  /** Marketing campaigns and email blasts */
  CAMPAIGNS: 'campaigns',

  /** Promo / discount codes */
  PROMO_CODES: 'promo_codes',
} as const;

/** Type-safe collection name values */
export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
