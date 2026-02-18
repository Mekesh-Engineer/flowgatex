// =============================================================================
// SCANNER UTILS — Pure helper functions (no React, no Firebase)
// =============================================================================

import type { ScanResult, LogLevel } from '../types/scanner.types';

// ─── Audio Helpers ──────────────────────────────────────────────────────────

/**
 * Play an oscillator tone at the given frequency.
 * @param freq  - Hz frequency
 * @param duration - milliseconds per beep
 * @param count - number of beeps
 */
export function playTone(freq: number, duration: number, count = 1): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    for (let i = 0; i < count; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.value = 0.15;
      const start = ctx.currentTime + i * (duration / 1000 + 0.05);
      osc.start(start);
      osc.stop(start + duration / 1000);
    }
  } catch {
    /* audio not supported */
  }
}

export const playSuccessSound = (): void => playTone(880, 120, 1);
export const playErrorSound = (): void => playTone(300, 150, 2);
export const playWarningSound = (): void => playTone(600, 100, 3);

/**
 * Trigger device vibration with the given pattern.
 * Silently fails on unsupported devices.
 */
export function triggerHaptic(pattern: number[]): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* not supported */
  }
}

// ─── Display Formatters ─────────────────────────────────────────────────────

/** Map numeric gate access level to a human-readable label */
export function gateAccessLabel(level?: number): string {
  if (level === 2) return 'All-Access';
  if (level === 1) return 'VIP';
  return 'General';
}

/** Convert a Date to a human-readable relative time string */
export function relativeTime(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 10) return 'Just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
}

/** Build a formatted timestamp for log entries */
export function formatLogTime(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// ─── Validation Helpers ─────────────────────────────────────────────────────

/** Validate manual ticket ID input */
export function isValidTicketId(id: string): boolean {
  const trimmed = id.trim();
  if (trimmed.length < 3) return false;
  if (trimmed.length > 50) return false;
  return /^[A-Z0-9][-A-Z0-9]*$/i.test(trimmed);
}

/** Sanitise manual ticket ID: uppercase, strip invalid chars */
export function sanitizeTicketId(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9-]/g, '');
}

// ─── Export Helpers ─────────────────────────────────────────────────────────

/** Trigger a file download in the browser */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Build CSV content from scan results */
export function buildCSV(scans: ScanResult[]): string {
  const headers = 'Name,Email,Ticket ID,Tier,Status,Method,Timestamp\n';
  const rows = scans
    .map(
      (s) =>
        `"${escapeCsvField(s.name)}","${escapeCsvField(s.email || '')}","${escapeCsvField(s.ticketId)}","${escapeCsvField(s.tier)}","${s.status}","${s.scanMethod}","${s.timestamp.toISOString()}"`
    )
    .join('\n');
  return `${headers}${rows}`;
}

/** Build JSON export content */
export function buildJSON(scans: ScanResult[]): string {
  return JSON.stringify(
    scans.map((s) => ({ ...s, timestamp: s.timestamp.toISOString() })),
    null,
    2
  );
}

/** Escape a CSV field value (double-quote escaping) */
function escapeCsvField(value: string): string {
  return value.replace(/"/g, '""');
}

/** Generate an export filename with today's date */
export function exportFilename(format: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `FlowGateX_Scans_${date}.${format}`;
}

// ─── Log Color Helper ───────────────────────────────────────────────────────

/** Map log type to a CSS class suffix */
export function logTypeClass(type: LogLevel): string {
  const map: Record<LogLevel, string> = {
    SUCCESS: 'scanner-syslog__type--success',
    ERROR: 'scanner-syslog__type--error',
    WARNING: 'scanner-syslog__type--warning',
    INFO: 'scanner-syslog__type--info',
    SYS: 'scanner-syslog__type--sys',
    READY: 'scanner-syslog__type--ready',
  };
  return map[type] || '';
}
