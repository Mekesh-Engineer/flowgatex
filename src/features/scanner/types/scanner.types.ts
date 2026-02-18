// =============================================================================
// SCANNER TYPES — Shared type definitions for the QR Scanner feature
// =============================================================================

/** All possible states of the scanner state machine */
export type ScannerState =
  | 'idle'
  | 'initializing'
  | 'ready'
  | 'scanning'
  | 'processing'
  | 'valid'
  | 'invalid'
  | 'duplicate'
  | 'paused'
  | 'camera_error';

/** Possible scan method inputs */
export type ScanMethod = 'camera' | 'manual' | 'upload';

/** Possible scan verdict */
export type ScanVerdict = 'valid' | 'invalid' | 'duplicate';

/** First check-in metadata (populated for duplicate scans) */
export interface FirstCheckIn {
  time: Date;
  gate: string;
  device: string;
  staff: string;
}

/** Result of a single ticket scan */
export interface ScanResult {
  id: string;
  ticketId: string;
  name: string;
  email?: string;
  phone?: string;
  tier: string;
  tierPrice?: number;
  gateAccess?: string;
  bookingId?: string;
  eventTitle?: string;
  eventDate?: string;
  status: ScanVerdict;
  message?: string;
  timestamp: Date;
  scanMethod: ScanMethod;
  firstCheckIn?: FirstCheckIn;
  overrideCount?: number;
}

/** System log entry for the terminal output */
export interface LogEntry {
  time: string;
  type: LogLevel;
  message: string;
}

/** Log severity levels */
export type LogLevel = 'INFO' | 'SUCCESS' | 'ERROR' | 'WARNING' | 'SYS' | 'READY';

/** User-configurable scanner settings */
export interface ScannerSettings {
  continuousScan: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  autoSave: boolean;
  showSystemLog: boolean;
}

/** Aggregated scan statistics */
export interface ScanStats {
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
  capacity: number;
}

/** Override request payload */
export interface OverridePayload {
  ticketId: string;
  category: string;
  reason: string;
  staffUid: string;
  staffName: string;
  eventId: string;
}
