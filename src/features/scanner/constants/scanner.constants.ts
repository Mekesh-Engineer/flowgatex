// =============================================================================
// SCANNER CONSTANTS — Default values, limits, and configuration
// =============================================================================

import type { ScannerSettings, ScanStats } from '../types/scanner.types';

/** Default scanner settings */
export const DEFAULT_SCANNER_SETTINGS: ScannerSettings = {
  continuousScan: false,
  soundEnabled: true,
  vibrationEnabled: true,
  autoSave: true,
  showSystemLog: true,
};

/** Default scan statistics */
export const DEFAULT_SCAN_STATS: ScanStats = {
  total: 0,
  valid: 0,
  invalid: 0,
  duplicates: 0,
  capacity: 500,
};

/** Maximum history items stored locally */
export const MAX_HISTORY_ITEMS = 200;

/** Maximum recent scans shown in the feed */
export const MAX_RECENT_SCANS = 50;

/** Camera constraints for QR scanning */
export const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: 'environment',
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
};

/** Maximum upload file size in bytes (5 MB) */
export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

/** Delay (ms) before auto-resuming in continuous mode */
export const CONTINUOUS_SCAN_DELAY_MS = 2000;

/** Simulated QR detection interval (ms) — replace with real decoder */
export const QR_DETECTION_INTERVAL_MS = 3000;

/** Max log entries kept in memory */
export const MAX_LOG_ENTRIES = 200;

/** LocalStorage key for scanner history */
export const STORAGE_KEY_HISTORY = 'flowgatex-scanner-history';

/** Override reason categories */
export const OVERRIDE_CATEGORIES = [
  { value: 're-entry', label: 'Re-entry (bathroom, parking)' },
  { value: 'lost-ticket', label: 'Lost ticket, rescanned' },
  { value: 'device-error', label: 'Device error, duplicate scan' },
  { value: 'other', label: 'Other' },
] as const;

/** Manual ticket ID format: uppercase alpha-numeric + dash */
export const TICKET_ID_REGEX = /^[A-Z0-9-]+$/;

/** Minimum ticket ID length for manual entry */
export const MIN_TICKET_ID_LENGTH = 3;

/** Keyboard shortcut map */
export const KEYBOARD_SHORTCUTS = {
  TOGGLE_SCAN: ' ',          // Space
  MANUAL_ENTRY: 'm',
  FLASHLIGHT: 'f',
  SETTINGS: 's',
  UPLOAD: 'u',
  ESCAPE: 'Escape',
} as const;
