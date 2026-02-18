// =============================================================================
// ORGANIZER STORE — Shared real-time state across all Organizer dashboard pages
// =============================================================================
// This Zustand store provides the *active event* context, live scan statistics,
// IoT device fleet, and recent activity. Any organizer page (Scanner, Analytics,
// IoT Devices, Attendees, etc.) can read / write to this store so that data
// updates propagate across views in real time without prop-drilling.
// =============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IoTDevice } from '@/features/iot/types/iot.types';
import type { ScanResult, ScanStats, ScannerSettings, LogEntry } from '@/features/scanner/types/scanner.types';
import {
  DEFAULT_SCANNER_SETTINGS,
  DEFAULT_SCAN_STATS,
  MAX_RECENT_SCANS,
  MAX_LOG_ENTRIES,
} from '@/features/scanner/constants/scanner.constants';

// ─── State shape ────────────────────────────────────────────────────────────

interface OrganizerState {
  // ── Active event context (shared across ALL organizer pages) ────────────
  activeEventId: string | null;
  activeEventTitle: string | null;

  // ── Scan statistics (live, updated by scanner + attendee pages) ─────────
  scanStats: ScanStats;

  // ── Recent scan results (shared between scanner + attendee management) ──
  recentScans: ScanResult[];

  // ── IoT device fleet (shared between scanner + IoT devices page) ────────
  iotDevices: IoTDevice[];

  // ── Scanner settings (persist across page navigations) ──────────────────
  scannerSettings: ScannerSettings;

  // ── System logs (scanner terminal output) ───────────────────────────────
  logs: LogEntry[];

  // ── Network status (used by multiple pages for offline indicators) ──────
  isOnline: boolean;

  // ── Actions ─────────────────────────────────────────────────────────────
  setActiveEvent: (id: string, title?: string) => void;
  clearActiveEvent: () => void;

  setScanStats: (stats: ScanStats) => void;
  incrementStat: (field: 'total' | 'valid' | 'invalid' | 'duplicates', by?: number) => void;
  decrementStat: (field: 'total' | 'valid' | 'invalid' | 'duplicates', by?: number) => void;

  addScanResult: (result: ScanResult) => void;
  clearRecentScans: () => void;

  setIoTDevices: (devices: IoTDevice[]) => void;

  updateScannerSettings: (patch: Partial<ScannerSettings>) => void;

  addLog: (type: LogEntry['type'], message: string) => void;
  clearLogs: () => void;

  setOnline: (online: boolean) => void;
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useOrganizerStore = create<OrganizerState>()(
  persist(
    (set, get) => ({
      // ── Defaults ───────────────────────────────────────────────────────
      activeEventId: null,
      activeEventTitle: null,
      scanStats: { ...DEFAULT_SCAN_STATS },
      recentScans: [],
      iotDevices: [],
      scannerSettings: { ...DEFAULT_SCANNER_SETTINGS },
      logs: [],
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,

      // ── Active event ───────────────────────────────────────────────────
      setActiveEvent: (id, title) =>
        set({ activeEventId: id, activeEventTitle: title ?? null }),

      clearActiveEvent: () =>
        set({
          activeEventId: null,
          activeEventTitle: null,
          scanStats: { ...DEFAULT_SCAN_STATS },
          recentScans: [],
          logs: [],
        }),

      // ── Stats ──────────────────────────────────────────────────────────
      setScanStats: (stats) => set({ scanStats: stats }),

      incrementStat: (field, by = 1) =>
        set((state) => ({
          scanStats: { ...state.scanStats, [field]: state.scanStats[field] + by },
        })),

      decrementStat: (field, by = 1) =>
        set((state) => ({
          scanStats: {
            ...state.scanStats,
            [field]: Math.max(0, state.scanStats[field] - by),
          },
        })),

      // ── Recent scans ──────────────────────────────────────────────────
      addScanResult: (result) =>
        set((state) => ({
          recentScans: [result, ...state.recentScans].slice(0, MAX_RECENT_SCANS),
          scanStats: {
            ...state.scanStats,
            total: state.scanStats.total + 1,
            valid: state.scanStats.valid + (result.status === 'valid' ? 1 : 0),
            invalid: state.scanStats.invalid + (result.status === 'invalid' ? 1 : 0),
            duplicates: state.scanStats.duplicates + (result.status === 'duplicate' ? 1 : 0),
          },
        })),

      clearRecentScans: () => set({ recentScans: [] }),

      // ── IoT ────────────────────────────────────────────────────────────
      setIoTDevices: (devices) => set({ iotDevices: devices }),

      // ── Settings ───────────────────────────────────────────────────────
      updateScannerSettings: (patch) =>
        set((state) => ({
          scannerSettings: { ...state.scannerSettings, ...patch },
        })),

      // ── Logs ───────────────────────────────────────────────────────────
      addLog: (type, message) => {
        const time = new Date().toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        set((state) => ({
          logs: [...state.logs.slice(-(MAX_LOG_ENTRIES - 1)), { time, type, message }],
        }));
      },

      clearLogs: () => set({ logs: [] }),

      // ── Network ────────────────────────────────────────────────────────
      setOnline: (online) => set({ isOnline: online }),
    }),
    {
      name: 'flowgatex-organizer',
      partialize: (state) => ({
        activeEventId: state.activeEventId,
        activeEventTitle: state.activeEventTitle,
        scannerSettings: state.scannerSettings,
        // Don't persist volatile data: recentScans, iotDevices, logs, scanStats
      }),
    }
  )
);

// ─── Derived selectors (for memoisation) ────────────────────────────────────

/** Number of IoT devices currently online */
export const selectOnlineDeviceCount = (state: OrganizerState): number =>
  state.iotDevices.filter((d) => d.status === 'online').length;

/** Capacity percentage (0-100) */
export const selectCapacityPercent = (state: OrganizerState): string =>
  state.scanStats.capacity > 0
    ? ((state.scanStats.total / state.scanStats.capacity) * 100).toFixed(0)
    : '0';

/** Valid / Invalid / Duplicate percentages */
export const selectStatPercents = (state: OrganizerState) => {
  const { total, valid, invalid, duplicates } = state.scanStats;
  return {
    valid: total > 0 ? ((valid / total) * 100).toFixed(1) : '0.0',
    invalid: total > 0 ? ((invalid / total) * 100).toFixed(1) : '0.0',
    duplicate: total > 0 ? ((duplicates / total) * 100).toFixed(1) : '0.0',
  };
};
