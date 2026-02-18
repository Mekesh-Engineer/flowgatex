// =============================================================================
// useScanner — Core scanner hook
// =============================================================================
// Encapsulates camera management, scan processing, IoT subscription,
// stats loading, manual/upload flows, export, and override logic.
// Reads/writes from the shared organizerStore so other pages see updates.
// =============================================================================

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/store/zustand/stores';
import { useOrganizerStore, selectOnlineDeviceCount, selectCapacityPercent, selectStatPercents } from '@/store/zustand/organizerStore';
import { useDebounce } from '@/hooks/useDebounce';
import { subscribeToDevices } from '@/features/iot/services/iotService';
import { showSuccess, showError, showInfo } from '@/components/common/Toast';
import {
  validateTicket,
  validateManualTicket,
  processOverride,
  loadEventScanStats,
} from '../services/scannerService';
import {
  playSuccessSound,
  playErrorSound,
  playWarningSound,
  triggerHaptic,
  sanitizeTicketId,
  isValidTicketId,
  downloadFile,
  buildCSV,
  buildJSON,
  exportFilename,
} from '../utils/scanner.utils';
import {
  CAMERA_CONSTRAINTS,
  MAX_UPLOAD_SIZE_BYTES,
  CONTINUOUS_SCAN_DELAY_MS,
  STORAGE_KEY_HISTORY,
  MAX_HISTORY_ITEMS,
} from '../constants/scanner.constants';
import type { ScannerState, ScanResult, OverridePayload } from '../types/scanner.types';

// ─── Hook return type ────────────────────────────────────────────────────────

export interface UseScannerReturn {
  // State
  scannerState: ScannerState;
  currentScan: ScanResult | null;

  // Derived from store
  filteredScans: ScanResult[];
  onlineDevices: number;
  capacityPercent: string;
  statPercents: { valid: string; invalid: string; duplicate: string };

  // UI state
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  flashlightOn: boolean;
  setFlashlightOn: (v: boolean) => void;

  // Modal controls
  isManualModalOpen: boolean;
  setIsManualModalOpen: (v: boolean) => void;
  isOverrideModalOpen: boolean;
  setIsOverrideModalOpen: (v: boolean) => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (v: boolean) => void;
  isHistoryDrawerOpen: boolean;
  setIsHistoryDrawerOpen: (v: boolean) => void;
  isLogExpanded: boolean;
  setIsLogExpanded: (v: boolean) => void;

  // Manual entry
  manualTicketId: string;
  setManualTicketId: (v: string) => void;

  // Override
  overrideCategory: string;
  setOverrideCategory: (v: string) => void;
  overrideReason: string;
  setOverrideReason: (v: string) => void;

  // Refs
  videoRef: React.RefObject<HTMLVideoElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  logContainerRef: React.RefObject<HTMLDivElement | null>;

  // Actions
  handleStartScanning: () => Promise<void>;
  handleStopScanning: () => void;
  handleManualSubmit: (e: React.FormEvent) => Promise<void>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleOverride: () => Promise<void>;
  handleExport: (format: 'csv' | 'json' | 'pdf') => void;
  handleClearHistory: () => void;
  selectScan: (scan: ScanResult) => void;
}

// ─── Hook implementation ────────────────────────────────────────────────────

export function useScanner(): UseScannerReturn {
  const { user } = useAuthStore();

  // ── Store bindings ──────────────────────────────────────────────────────
  const store = useOrganizerStore();
  const {
    activeEventId,
    scanStats,
    recentScans,
    iotDevices,
    scannerSettings: settings,
    logs,
    isOnline,
    addScanResult,
    clearRecentScans,
    setIoTDevices,
    setScanStats,
    updateScannerSettings,
    addLog,
    clearLogs,
    setOnline,
    incrementStat,
    decrementStat,
  } = store;

  const onlineDevices = useOrganizerStore(selectOnlineDeviceCount);
  const capacityPercent = useOrganizerStore(selectCapacityPercent);
  const statPercents = useOrganizerStore(selectStatPercents);

  // ── Local state (not shared across pages) ───────────────────────────────
  const [scannerState, setScannerState] = useState<ScannerState>('idle');
  const [currentScan, setCurrentScan] = useState<ScanResult | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [flashlightOn, setFlashlightOn] = useState(false);

  // Modal state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isLogExpanded, setIsLogExpanded] = useState(true);

  // Manual entry / override
  const [manualTicketId, setManualTicketId] = useState('');
  const [overrideCategory, setOverrideCategory] = useState('re-entry');
  const [overrideReason, setOverrideReason] = useState('');

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Use activeEventId from store, fallback for demo
  const effectiveEventId = activeEventId || 'demo-event-001';

  // ── Filtered scans ────────────────────────────────────────────────────
  const filteredScans = useMemo(() => {
    if (!debouncedSearch) return recentScans;
    const q = debouncedSearch.toLowerCase();
    return recentScans.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.ticketId.toLowerCase().includes(q) ||
        (s.email && s.email.toLowerCase().includes(q))
    );
  }, [recentScans, debouncedSearch]);

  // ── Auto-scroll logs ──────────────────────────────────────────────────
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // ── Online/Offline detection ──────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      addLog('SYS', 'Connection restored. Syncing queued scans...');
    };
    const handleOffline = () => {
      setOnline(false);
      addLog('WARNING', 'Connection lost. Switching to offline mode.');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addLog, setOnline]);

  // ── Subscribe to IoT devices ──────────────────────────────────────────
  useEffect(() => {
    if (!effectiveEventId) return;
    addLog('SYS', 'Subscribing to IoT device fleet...');
    const unsubscribe = subscribeToDevices(effectiveEventId, (devices) => {
      setIoTDevices(devices);
      addLog('INFO', `IoT fleet update: ${devices.length} device(s) connected.`);
    });
    return unsubscribe;
  }, [effectiveEventId, addLog, setIoTDevices]);

  // ── Load initial stats ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const stats = await loadEventScanStats(effectiveEventId);
        if (!cancelled) {
          setScanStats(stats);
          addLog('SYS', `Loaded ticket stats for event. ${stats.valid} already checked in.`);
        }
      } catch {
        if (!cancelled) {
          addLog('WARNING', 'Could not load ticket stats from Firestore. Using local data.');
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [effectiveEventId, addLog, setScanStats]);

  // ── Cleanup on unmount ────────────────────────────────────────────────
  useEffect(() => () => stopCamera(), []);

  // ── Camera management ─────────────────────────────────────────────────

  const startCamera = async (): Promise<boolean> => {
    try {
      setScannerState('initializing');
      addLog('INFO', 'Requesting camera access...');

      const stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      addLog('SUCCESS', 'Camera initialized. QR scanner ready.');
      return true;
    } catch (err: any) {
      setScannerState('camera_error');
      addLog('ERROR', `Camera access failed: ${err.name || err.message}`);
      return false;
    }
  };

  const stopCamera = (): void => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  // ── Process a scan result ─────────────────────────────────────────────

  const processScanResult = useCallback(
    (result: ScanResult) => {
      setCurrentScan(result);
      setScannerState(result.status);
      addScanResult(result);

      // Audio & haptic feedback
      if (result.status === 'valid') {
        addLog('SUCCESS', `${result.ticketId} verified. Access granted for ${result.name}.`);
        if (settings.soundEnabled) playSuccessSound();
        if (settings.vibrationEnabled) triggerHaptic([100]);
      } else if (result.status === 'invalid') {
        addLog('ERROR', `${result.ticketId} rejected: ${result.message}`);
        if (settings.soundEnabled) playErrorSound();
        if (settings.vibrationEnabled) triggerHaptic([100, 50, 100]);
      } else if (result.status === 'duplicate') {
        addLog('WARNING', `${result.ticketId} duplicate attempt. ${result.message}`);
        if (settings.soundEnabled) playWarningSound();
        if (settings.vibrationEnabled) triggerHaptic([100, 50, 100, 50, 100]);
      }

      // Persist to localStorage
      if (settings.autoSave) {
        try {
          const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY) || '[]');
          saved.unshift({ ...result, timestamp: result.timestamp.toISOString() });
          localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(saved.slice(0, MAX_HISTORY_ITEMS)));
        } catch {
          /* ignore */
        }
      }

      // Continuous scan auto-resume
      if (settings.continuousScan && result.status === 'valid') {
        setTimeout(() => {
          if (streamRef.current) {
            setScannerState('scanning');
            addLog('INFO', 'Auto-resuming scan (continuous mode)...');
          }
        }, CONTINUOUS_SCAN_DELAY_MS);
      }
    },
    [addLog, addScanResult, settings]
  );

  // ── Start / Stop scanning ─────────────────────────────────────────────

  const handleStartScanning = async () => {
    const ok = await startCamera();
    if (!ok) return;

    setScannerState('scanning');
    addLog('INFO', 'Scan session started. Camera active.');

    // TODO: Replace with html5-qrcode or jsQR for real QR decoding.
    // This demo interval simulates a detection every 3s.
    scanIntervalRef.current = setInterval(async () => {
      setScannerState('processing');
      addLog('INFO', 'QR code detected. Decrypting payload...');

      // ── Demo: simulate 3 scan outcomes ────────────────────────────────
      const demoResults: ScanResult[] = [
        {
          id: Date.now().toString(),
          ticketId: `TC-${Math.floor(1000 + Math.random() * 9000)}`,
          name: 'Arjun Menon',
          email: 'arjun@example.com',
          tier: 'VIP Backstage',
          gateAccess: 'VIP',
          bookingId: 'BK-2026-001',
          eventTitle: 'TechConf 2026',
          status: 'valid',
          timestamp: new Date(),
          scanMethod: 'camera',
        },
        {
          id: Date.now().toString(),
          ticketId: `TC-${Math.floor(1000 + Math.random() * 9000)}`,
          name: 'Priya Sharma',
          tier: 'General',
          status: 'duplicate',
          message: 'Already checked in at 10:00 AM',
          timestamp: new Date(),
          scanMethod: 'camera',
          firstCheckIn: {
            time: new Date(Date.now() - 3600000),
            gate: 'Gate B',
            device: 'Scanner-02',
            staff: 'John',
          },
        },
        {
          id: Date.now().toString(),
          ticketId: 'TC-0000',
          name: 'Unknown',
          tier: 'N/A',
          status: 'invalid',
          message: 'Ticket expired',
          timestamp: new Date(),
          scanMethod: 'camera',
        },
      ];

      const result = demoResults[Math.floor(Math.random() * demoResults.length)];
      processScanResult(result);

      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    }, 3000);
  };

  const handleStopScanning = () => {
    stopCamera();
    setScannerState('idle');
    addLog('SYS', 'Scanner manually stopped.');
  };

  // ── Manual entry ──────────────────────────────────────────────────────

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = manualTicketId.trim();

    if (!id) {
      showError('Please enter a ticket ID');
      return;
    }

    if (!isValidTicketId(id)) {
      showError('Invalid ticket ID format. Use letters, numbers, and dashes only.');
      return;
    }

    setIsManualModalOpen(false);
    setScannerState('processing');

    try {
      const result = await validateManualTicket({
        ticketId: id,
        activeEventId: effectiveEventId,
        staffUid: user?.uid || 'unknown',
        staffName: user?.displayName || 'Unknown Staff',
        iotDevices,
        onLog: addLog,
      });
      processScanResult(result);
    } catch (err: any) {
      addLog('ERROR', `Manual validation failed: ${err.message}`);
      processScanResult({
        id: Date.now().toString(),
        ticketId: id.toUpperCase(),
        name: 'Unknown',
        tier: 'N/A',
        status: 'invalid',
        message: 'Validation error — try again',
        timestamp: new Date(),
        scanMethod: 'manual',
      });
    }

    setManualTicketId('');
  };

  // ── Image upload ──────────────────────────────────────────────────────

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      showError('Image too large (max 5MB)');
      return;
    }

    if (!file.type.startsWith('image/')) {
      showError('Invalid file type — only images are accepted');
      return;
    }

    setScannerState('processing');
    addLog('INFO', `Processing uploaded image: ${file.name}`);

    // TODO: Integrate jsQR / html5-qrcode for real image QR decoding
    setTimeout(() => {
      processScanResult({
        id: Date.now().toString(),
        ticketId: `TC-UPL-${Math.floor(1000 + Math.random() * 9000)}`,
        name: 'Uploaded QR User',
        tier: 'Standard',
        status: 'valid',
        timestamp: new Date(),
        scanMethod: 'upload',
      });
    }, 1200);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Override ──────────────────────────────────────────────────────────

  const handleOverride = async () => {
    if (!currentScan) {
      showError('No scan selected for override');
      return;
    }

    if (!overrideReason.trim()) {
      showError('Please provide a reason for the override');
      return;
    }

    if (overrideReason.trim().length < 5) {
      showError('Override reason must be at least 5 characters');
      return;
    }

    const payload: OverridePayload = {
      ticketId: currentScan.ticketId,
      category: overrideCategory,
      reason: overrideReason.trim(),
      staffUid: user?.uid || 'unknown',
      staffName: user?.displayName || 'Unknown Staff',
      eventId: effectiveEventId,
    };

    try {
      await processOverride(payload, iotDevices, addLog);

      setCurrentScan({ ...currentScan, status: 'valid', message: 'Override Approved' });
      setScannerState('valid');
      incrementStat('valid');
      decrementStat('duplicates');
      showSuccess('Override approved — entry allowed');
    } catch (err: any) {
      addLog('ERROR', `Override failed: ${err.message}`);
      showError('Override failed');
    }

    setIsOverrideModalOpen(false);
    setOverrideReason('');
    setOverrideCategory('re-entry');
  };

  // ── Export ────────────────────────────────────────────────────────────

  const handleExport = (format: 'csv' | 'json' | 'pdf') => {
    if (recentScans.length === 0) {
      showInfo('No scan data to export');
      return;
    }

    addLog('INFO', `Exporting scan data as ${format.toUpperCase()}...`);

    if (format === 'csv') {
      const content = buildCSV(recentScans);
      downloadFile(content, exportFilename('csv'), 'text/csv');
      addLog('SUCCESS', `Exported ${exportFilename('csv')}`);
      showSuccess(`Exported ${exportFilename('csv')}`);
    } else if (format === 'json') {
      const content = buildJSON(recentScans);
      downloadFile(content, exportFilename('json'), 'application/json');
      addLog('SUCCESS', `Exported ${exportFilename('json')}`);
      showSuccess(`Exported ${exportFilename('json')}`);
    } else {
      showInfo('PDF export requires server-side generation. Use CSV or JSON for now.');
    }
  };

  // ── Clear history ─────────────────────────────────────────────────────

  const handleClearHistory = () => {
    clearRecentScans();
    localStorage.removeItem(STORAGE_KEY_HISTORY);
    addLog('SYS', 'Scan history cleared.');
    showInfo('History cleared');
  };

  // ── Select a scan result ──────────────────────────────────────────────

  const selectScan = (scan: ScanResult) => {
    setCurrentScan(scan);
    setScannerState(scan.status);
  };

  // ── Return ────────────────────────────────────────────────────────────

  return {
    scannerState,
    currentScan,
    filteredScans,
    onlineDevices,
    capacityPercent,
    statPercents,
    searchTerm,
    setSearchTerm,
    flashlightOn,
    setFlashlightOn,
    isManualModalOpen,
    setIsManualModalOpen,
    isOverrideModalOpen,
    setIsOverrideModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    isHistoryDrawerOpen,
    setIsHistoryDrawerOpen,
    isLogExpanded,
    setIsLogExpanded,
    manualTicketId,
    setManualTicketId,
    overrideCategory,
    setOverrideCategory,
    overrideReason,
    setOverrideReason,
    videoRef,
    fileInputRef,
    logContainerRef,
    handleStartScanning,
    handleStopScanning,
    handleManualSubmit,
    handleImageUpload,
    handleOverride,
    handleExport,
    handleClearHistory,
    selectScan,
  };
}
