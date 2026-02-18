import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    QrCode,
    Camera,
    CameraOff,
    Flashlight,
    FlashlightOff,
    Keyboard,
    Settings,
    ClipboardList,
    Play,
    StopCircle,
    Upload,
    Download,
    Search,
    Trash2,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Wifi,
    WifiOff,
    BatteryMedium,
    Shield,
    ShieldAlert,
    Copy,
    Terminal,
    ChevronDown,
    ChevronUp,
    X,
    RotateCcw,
    FileJson,
    FileSpreadsheet,
    FileText,
    ScanLine,
    Mail,
    Ticket,
    Calendar,
    MapPin,
    Clock,
    Hash,
    Unlock,
    RefreshCw,
} from 'lucide-react';
import {
    collection,
    doc,
    updateDoc,
    addDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { getDb } from '@/services/firebase';
import { verifyQRData } from '@/features/booking/utils/qrUtils';
import { getEventTickets, updateTicketStatus, getTicketById } from '@/features/booking/services/ticketService';
import { subscribeToDevices, validateQRCode as iotValidateQR } from '@/features/iot/services/iotService';
import type { IoTDevice } from '@/features/iot/types/iot.types';
import { useAuthStore } from '@/store/zustand/stores';
import { showSuccess, showError, showInfo } from '@/components/common/Toast';
import Toggle from '@/components/common/Toggle';
import Modal from '@/components/common/Modal';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

// ─── Types ──────────────────────────────────────────────────────────────────

type ScannerState =
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

interface ScanResult {
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
    status: 'valid' | 'invalid' | 'duplicate';
    message?: string;
    timestamp: Date;
    scanMethod: 'camera' | 'manual' | 'upload';
    firstCheckIn?: { time: Date; gate: string; device: string; staff: string };
    overrideCount?: number;
}

interface LogEntry {
    time: string;
    type: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARNING' | 'SYS' | 'READY';
    message: string;
}

interface ScannerSettings {
    continuousScan: boolean;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    autoSave: boolean;
    showSystemLog: boolean;
}

// ─── Audio helpers ──────────────────────────────────────────────────────────

const playTone = (freq: number, duration: number, count = 1) => {
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
};

const playSuccessSound = () => playTone(880, 120, 1);
const playErrorSound = () => playTone(300, 150, 2);
const playWarningSound = () => playTone(600, 100, 3);

const triggerHaptic = (pattern: number[]) => {
    try {
        navigator.vibrate?.(pattern);
    } catch {
        /* not supported */
    }
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const gateAccessLabel = (level?: number): string => {
    if (level === 2) return 'All-Access';
    if (level === 1) return 'VIP';
    return 'General';
};

const relativeTime = (date: Date): string => {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 10) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
};

// ═════════════════════════════════════════════════════════════════════════════
// SCANNER PAGE COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export default function ScannerPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    // ── Core State ────────────────────────────────────────────────────────────
    const [scannerState, setScannerState] = useState<ScannerState>('idle');
    const [currentScan, setCurrentScan] = useState<ScanResult | null>(null);
    const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        valid: 0,
        invalid: 0,
        duplicates: 0,
        capacity: 500,
    });
    const [logs, setLogs] = useState<LogEntry[]>([]);

    // ── Settings ──────────────────────────────────────────────────────────────
    const [settings, setSettings] = useState<ScannerSettings>({
        continuousScan: false,
        soundEnabled: true,
        vibrationEnabled: true,
        autoSave: true,
        showSystemLog: true,
    });

    // ── UI State ──────────────────────────────────────────────────────────────
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
    const [manualTicketId, setManualTicketId] = useState('');
    const [overrideReason, setOverrideReason] = useState('');
    const [overrideCategory, setOverrideCategory] = useState('re-entry');
    const [searchTerm, setSearchTerm] = useState('');
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isLogExpanded, setIsLogExpanded] = useState(true);
    const [flashlightOn, setFlashlightOn] = useState(false);

    // ── IoT State ─────────────────────────────────────────────────────────────
    const [iotDevices, setIotDevices] = useState<IoTDevice[]>([]);
    const [activeEventId] = useState('demo-event-001');

    // ── Refs ───────────────────────────────────────────────────────────────────
    const logContainerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const debouncedSearch = useDebounce(searchTerm, 300);

    // ── Filtered recent scans ─────────────────────────────────────────────────
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

    // ── Logger helper ─────────────────────────────────────────────────────────
    const addLog = useCallback((type: LogEntry['type'], message: string) => {
        const time = new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
        setLogs((prev) => [...prev.slice(-200), { time, type, message }]);
    }, []);

    // ── Auto-scroll logs ──────────────────────────────────────────────────────
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    // ── Online / Offline detection ────────────────────────────────────────────
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            addLog('SYS', 'Connection restored. Syncing queued scans...');
        };
        const handleOffline = () => {
            setIsOnline(false);
            addLog('WARNING', 'Connection lost. Switching to offline mode.');
        };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [addLog]);

    // ── Subscribe to IoT devices ──────────────────────────────────────────────
    useEffect(() => {
        if (!activeEventId) return;
        addLog('SYS', 'Subscribing to IoT device fleet...');
        const unsubscribe = subscribeToDevices(activeEventId, (devices) => {
            setIotDevices(devices);
            addLog('INFO', `IoT fleet update: ${devices.length} device(s) connected.`);
        });
        return unsubscribe;
    }, [activeEventId, addLog]);

    // ── Load initial stats from Firestore ─────────────────────────────────────
    useEffect(() => {
        const loadStats = async () => {
            try {
                const tickets = await getEventTickets(activeEventId);
                const used = tickets.filter((t) => t.status === 'used').length;
                const cancelled = tickets.filter((t) => t.status === 'cancelled').length;
                const expired = tickets.filter((t) => t.status === 'expired').length;
                setStats({
                    total: used,
                    valid: used,
                    invalid: cancelled + expired,
                    duplicates: 0,
                    capacity: tickets.length || 500,
                });
                addLog('SYS', `Loaded ${tickets.length} tickets for event. ${used} already checked in.`);
            } catch {
                addLog('WARNING', 'Could not load ticket stats from Firestore. Using local data.');
            }
        };
        loadStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeEventId]);

    // ── Keyboard shortcuts ────────────────────────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as Element)?.tagName)) return;

            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    if (
                        scannerState === 'idle' ||
                        scannerState === 'ready' ||
                        scannerState === 'paused' ||
                        scannerState === 'valid' ||
                        scannerState === 'invalid' ||
                        scannerState === 'duplicate'
                    ) {
                        handleStartScanning();
                    } else if (scannerState === 'scanning') {
                        handleStopScanning();
                    }
                    break;
                case 'm':
                case 'M':
                    setIsManualModalOpen(true);
                    break;
                case 'f':
                case 'F':
                    setFlashlightOn((p) => !p);
                    break;
                case 's':
                case 'S':
                    setIsSettingsModalOpen(true);
                    break;
                case 'u':
                case 'U':
                    fileInputRef.current?.click();
                    break;
                case 'Escape':
                    setIsManualModalOpen(false);
                    setIsOverrideModalOpen(false);
                    setIsSettingsModalOpen(false);
                    setIsHistoryDrawerOpen(false);
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scannerState]);

    // ── Camera management ─────────────────────────────────────────────────────
    const startCamera = async () => {
        try {
            setScannerState('initializing');
            addLog('INFO', 'Requesting camera access...');

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
            });

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

    const stopCamera = () => {
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

    // Cleanup on unmount
    useEffect(() => () => stopCamera(), []);

    // ── IoT Gate Command ──────────────────────────────────────────────────────
    const sendGateCommand = useCallback(
        async (ticketId: string, accessLevel: number) => {
            const gates = iotDevices.filter((d) => d.type === 'turnstile' && d.status === 'online');
            if (gates.length === 0) return;

            for (const gate of gates) {
                try {
                    await updateDoc(doc(getDb(), 'devices', gate.id), {
                        lastCommand: 'open',
                        lastCommandTicket: ticketId,
                        lastCommandAccess: accessLevel,
                        lastCommandAt: serverTimestamp(),
                    });
                    addLog('SYS', `Gate command sent to ${gate.name} (access level ${accessLevel}).`);
                } catch {
                    addLog('WARNING', `Failed to send gate command to ${gate.name}.`);
                }
            }
        },
        [iotDevices, addLog]
    );

    // ── QR Validation Pipeline ────────────────────────────────────────────────
    const validateTicket = useCallback(
        async (qrData: string, method: ScanResult['scanMethod']): Promise<ScanResult> => {
            addLog('INFO', 'Verifying QR signature...');

            // Step 1: Verify QR signature
            const verification = await verifyQRData(qrData);
            if (!verification.valid) {
                return {
                    id: Date.now().toString(),
                    ticketId: 'UNKNOWN',
                    name: 'Unknown',
                    tier: 'N/A',
                    status: 'invalid',
                    message: verification.reason || 'QR code signature invalid — possible tampering',
                    timestamp: new Date(),
                    scanMethod: method,
                };
            }

            const payload = verification.payload;
            addLog('INFO', `Signature valid. Querying ticket: ${payload.ticketId}`);

            // Step 2: Look up ticket in Firestore
            try {
                const ticket = await getTicketById(payload.ticketId);
                if (!ticket) {
                    return {
                        id: Date.now().toString(),
                        ticketId: payload.ticketId,
                        name: payload.attendeeName || 'Unknown',
                        tier: payload.tierName || 'N/A',
                        status: 'invalid',
                        message: 'Ticket not found in system',
                        timestamp: new Date(),
                        scanMethod: method,
                    };
                }

                // Step 3: Check ticket status
                if (ticket.status === 'used') {
                    const scannedAtDate = ticket.scannedAt
                        ? new Date(
                            typeof ticket.scannedAt === 'string'
                                ? ticket.scannedAt
                                : ticket.scannedAt.seconds * 1000
                        )
                        : new Date();

                    return {
                        id: Date.now().toString(),
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
                            staff: user?.displayName || 'Staff',
                        },
                        overrideCount: 0,
                    };
                }

                if (ticket.status === 'cancelled') {
                    return {
                        id: Date.now().toString(),
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
                    return {
                        id: Date.now().toString(),
                        ticketId: ticket.id,
                        name: payload.attendeeName || 'Unknown',
                        tier: ticket.tierName,
                        status: 'invalid',
                        message: 'Ticket has expired',
                        timestamp: new Date(),
                        scanMethod: method,
                    };
                }

                // Step 4: Check event match
                if (ticket.eventId !== activeEventId) {
                    return {
                        id: Date.now().toString(),
                        ticketId: ticket.id,
                        name: payload.attendeeName || 'Unknown',
                        tier: ticket.tierName,
                        status: 'invalid',
                        message: 'Ticket is for a different event',
                        timestamp: new Date(),
                        scanMethod: method,
                    };
                }

                // Step 5: Valid — Mark as used
                await updateTicketStatus(ticket.id, 'used', user?.uid);
                addLog('SUCCESS', `Ticket ${ticket.id} marked as used in Firestore.`);

                // Step 6: Log check-in to audit
                try {
                    await addDoc(collection(getDb(), 'audit_logs'), {
                        action: 'check_in',
                        ticketId: ticket.id,
                        eventId: activeEventId,
                        attendeeName: payload.attendeeName,
                        staffUid: user?.uid || 'unknown',
                        staffName: user?.displayName || 'Unknown Staff',
                        scanMethod: method,
                        gate: 'Main Entrance',
                        timestamp: serverTimestamp(),
                    });
                } catch {
                    /* audit log failure shouldn't block scan */
                }

                // Step 7: Send gate open command to IoT devices
                sendGateCommand(ticket.id, ticket.gateAccessLevel ?? 0);

                return {
                    id: Date.now().toString(),
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
                addLog('ERROR', `Firestore query failed: ${err.message}`);

                // Offline fallback
                if (!isOnline) {
                    addLog('INFO', 'Attempting offline validation via IoT service...');
                    const iotResult = await iotValidateQR(qrData, activeEventId);
                    return {
                        id: Date.now().toString(),
                        ticketId: iotResult.ticketId || 'QUEUED',
                        name: iotResult.attendeeName || 'Offline Scan',
                        tier: iotResult.tierName || 'Unknown',
                        status: iotResult.success ? 'valid' : 'invalid',
                        message: iotResult.success ? 'Validated offline — queued for sync' : iotResult.error,
                        timestamp: new Date(),
                        scanMethod: method,
                    };
                }

                return {
                    id: Date.now().toString(),
                    ticketId: payload.ticketId,
                    name: payload.attendeeName || 'Unknown',
                    tier: payload.tierName || 'N/A',
                    status: 'invalid',
                    message: 'Validation failed — please retry',
                    timestamp: new Date(),
                    scanMethod: method,
                };
            }
        },
        [activeEventId, addLog, isOnline, sendGateCommand, user]
    );

    // ── Process scan result ───────────────────────────────────────────────────
    const processScanResult = useCallback(
        (result: ScanResult) => {
            setCurrentScan(result);
            setScannerState(result.status);
            setRecentScans((prev) => [result, ...prev].slice(0, 50));

            setStats((prev) => ({
                ...prev,
                total: prev.total + 1,
                valid: prev.valid + (result.status === 'valid' ? 1 : 0),
                invalid: prev.invalid + (result.status === 'invalid' ? 1 : 0),
                duplicates: prev.duplicates + (result.status === 'duplicate' ? 1 : 0),
            }));

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

            // Auto-save to localStorage
            if (settings.autoSave) {
                try {
                    const saved = JSON.parse(localStorage.getItem('scanner-history') || '[]');
                    saved.unshift({ ...result, timestamp: result.timestamp.toISOString() });
                    localStorage.setItem('scanner-history', JSON.stringify(saved.slice(0, 200)));
                } catch {
                    /* ignore */
                }
            }

            // Continuous scan: auto-resume
            if (settings.continuousScan && result.status === 'valid') {
                setTimeout(() => {
                    if (streamRef.current) {
                        setScannerState('scanning');
                        addLog('INFO', 'Auto-resuming scan (continuous mode)...');
                    }
                }, 2000);
            }
        },
        [addLog, settings]
    );

    // ── Start / Stop scanning ─────────────────────────────────────────────────
    const handleStartScanning = async () => {
        const cameraStarted = await startCamera();
        if (!cameraStarted) return;

        setScannerState('scanning');
        addLog('INFO', 'Scan session started. Camera active.');

        // Simulated QR detection loop
        // In production, integrate html5-qrcode or jsQR here for real QR decoding
        scanIntervalRef.current = setInterval(() => {
            setScannerState('processing');
            addLog('INFO', 'QR code detected. Decrypting payload...');

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

    // ── Manual entry ──────────────────────────────────────────────────────────
    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualTicketId.trim()) return;

        setIsManualModalOpen(false);
        setScannerState('processing');
        addLog('INFO', `Manual entry received: ${manualTicketId.toUpperCase()}`);

        try {
            const ticket = await getTicketById(manualTicketId.trim());
            if (ticket) {
                let status: 'valid' | 'invalid' | 'duplicate' = 'valid';
                let message = '';

                if (ticket.status === 'used') {
                    status = 'duplicate';
                    message = 'Already checked in';
                } else if (ticket.status === 'cancelled' || ticket.status === 'expired') {
                    status = 'invalid';
                    message = `Ticket ${ticket.status}`;
                } else {
                    await updateTicketStatus(ticket.id, 'used', user?.uid);
                    sendGateCommand(ticket.id, ticket.gateAccessLevel ?? 0);
                }

                processScanResult({
                    id: Date.now().toString(),
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
                });
            } else {
                processScanResult({
                    id: Date.now().toString(),
                    ticketId: manualTicketId.toUpperCase(),
                    name: 'Unknown',
                    tier: 'N/A',
                    status: 'invalid',
                    message: 'Ticket ID not found in system',
                    timestamp: new Date(),
                    scanMethod: 'manual',
                });
            }
        } catch (err: any) {
            addLog('ERROR', `Manual validation failed: ${err.message}`);
            processScanResult({
                id: Date.now().toString(),
                ticketId: manualTicketId.toUpperCase(),
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

    // ── Image upload ──────────────────────────────────────────────────────────
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showError('Image too large (max 5MB)');
            return;
        }

        setScannerState('processing');
        addLog('INFO', `Processing uploaded image: ${file.name}`);

        // In production: decode QR from image using jsQR or html5-qrcode
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

    // ── Override flow ─────────────────────────────────────────────────────────
    const handleOverride = async () => {
        if (!currentScan || !overrideReason.trim()) return;

        addLog('SYS', `Organizer override for ${currentScan.ticketId}: ${overrideCategory} — ${overrideReason}`);

        try {
            await addDoc(collection(getDb(), 'audit_logs'), {
                action: 'override_check_in',
                ticketId: currentScan.ticketId,
                eventId: activeEventId,
                reason: overrideReason,
                category: overrideCategory,
                staffUid: user?.uid || 'unknown',
                staffName: user?.displayName || 'Unknown Staff',
                timestamp: serverTimestamp(),
            });

            sendGateCommand(currentScan.ticketId, 0);

            setCurrentScan({ ...currentScan, status: 'valid', message: 'Override Approved' });
            setScannerState('valid');
            setStats((prev) => ({
                ...prev,
                valid: prev.valid + 1,
                duplicates: Math.max(0, prev.duplicates - 1),
            }));
            addLog('SUCCESS', `Override approved for ${currentScan.ticketId}.`);
            showSuccess('Override approved — entry allowed');
        } catch (err: any) {
            addLog('ERROR', `Override failed: ${err.message}`);
            showError('Override failed');
        }

        setIsOverrideModalOpen(false);
        setOverrideReason('');
        setOverrideCategory('re-entry');
    };

    // ── Export data ───────────────────────────────────────────────────────────
    const handleExport = (format: 'csv' | 'json' | 'pdf') => {
        addLog('INFO', `Exporting scan data as ${format.toUpperCase()}...`);

        const downloadFile = (content: string, filename: string, type: string) => {
            const blob = new Blob([content], { type });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            addLog('SUCCESS', `Exported: ${filename}`);
            showSuccess(`Exported ${filename}`);
        };

        if (format === 'csv') {
            const headers = 'Name,Email,Ticket ID,Tier,Status,Method,Timestamp\n';
            const rows = recentScans
                .map(
                    (s) =>
                        `"${s.name}","${s.email || ''}","${s.ticketId}","${s.tier}","${s.status}","${s.scanMethod}","${s.timestamp.toISOString()}"`
                )
                .join('\n');
            downloadFile(`${headers}${rows}`, `FlowGateX_Scans_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
        } else if (format === 'json') {
            const data = JSON.stringify(
                recentScans.map((s) => ({ ...s, timestamp: s.timestamp.toISOString() })),
                null,
                2
            );
            downloadFile(
                data,
                `FlowGateX_Scans_${new Date().toISOString().slice(0, 10)}.json`,
                'application/json'
            );
        } else {
            showInfo('PDF export requires server-side generation. Use CSV or JSON for now.');
        }
    };

    // ── Clear history ─────────────────────────────────────────────────────────
    const handleClearHistory = () => {
        setRecentScans([]);
        localStorage.removeItem('scanner-history');
        addLog('SYS', 'Scan history cleared.');
        showInfo('History cleared');
    };

    // ── Computed values ───────────────────────────────────────────────────────
    const validPercent = stats.total > 0 ? ((stats.valid / stats.total) * 100).toFixed(1) : '0.0';
    const invalidPercent = stats.total > 0 ? ((stats.invalid / stats.total) * 100).toFixed(1) : '0.0';
    const duplicatePercent = stats.total > 0 ? ((stats.duplicates / stats.total) * 100).toFixed(1) : '0.0';
    const capacityPercent = stats.capacity > 0 ? ((stats.total / stats.capacity) * 100).toFixed(0) : '0';
    const onlineDevices = iotDevices.filter((d) => d.status === 'online').length;

    // ═════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═════════════════════════════════════════════════════════════════════════
    return (
        <div className="scanner-page">
            {/* ── Header Bar (Desktop & Tablet) ── */}
            <header className="scanner-header">
                <div className="scanner-header__left">
                    <button onClick={() => navigate(-1)} className="scanner-header__back" aria-label="Back to Dashboard">
                        <ArrowLeft size={18} />
                    </button>
                    <div className="scanner-header__brand">
                        <div className="scanner-header__icon">
                            <QrCode size={20} />
                        </div>
                        <div>
                            <h1 className="scanner-header__title">QR Scanner</h1>
                            <p className="scanner-header__subtitle">FlowGateX Command Center</p>
                        </div>
                    </div>
                </div>

                <div className="scanner-header__center">
                    <span className="scanner-header__stat">
                        {stats.total} / {stats.capacity} scanned ({capacityPercent}%)
                    </span>
                </div>

                <div className="scanner-header__right">
                    <div className="scanner-header__indicators">
                        <div
                            className={cn(
                                'scanner-header__indicator',
                                isOnline ? 'scanner-header__indicator--online' : 'scanner-header__indicator--offline'
                            )}
                        >
                            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                            <span>{isOnline ? 'Online' : 'Offline'}</span>
                        </div>
                        <div className="scanner-header__indicator">
                            <BatteryMedium size={14} />
                            <span>85%</span>
                        </div>
                        {onlineDevices > 0 && (
                            <div className="scanner-header__indicator scanner-header__indicator--iot">
                                <Shield size={14} />
                                <span>{onlineDevices} IoT</span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setIsSettingsModalOpen(true)}
                        className="scanner-header__settings-btn"
                        aria-label="Settings (S)"
                        title="Settings (S)"
                    >
                        <Settings size={18} />
                    </button>
                </div>
            </header>

            {/* ── Mobile Compact Stats Bar ── */}
            <div className="scanner-mobile-stats">
                <span>
                    {stats.total}/{stats.capacity}
                </span>
                <span className="scanner-mobile-stats__valid">
                    <CheckCircle2 size={12} /> {stats.valid}
                </span>
                <span className="scanner-mobile-stats__invalid">
                    <XCircle size={12} /> {stats.invalid}
                </span>
                <span className="scanner-mobile-stats__dup">
                    <AlertTriangle size={12} /> {stats.duplicates}
                </span>
                {!isOnline && (
                    <span className="scanner-mobile-stats__offline">
                        <WifiOff size={12} /> Offline
                    </span>
                )}
            </div>

            {/* ── Main Grid ── */}
            <main className="scanner-main">
                {/* ── LEFT PANEL ── */}
                <aside className="scanner-panel-left">
                    {/* Stats Cards */}
                    <div className="scanner-stats-grid">
                        <div className="scanner-stat-card">
                            <div className="scanner-stat-card__label">
                                <ScanLine size={14} /> Total Scans
                            </div>
                            <div className="scanner-stat-card__value">{stats.total}</div>
                            <div className="scanner-stat-card__sub">Today</div>
                        </div>
                        <div className="scanner-stat-card scanner-stat-card--valid">
                            <div className="scanner-stat-card__label">
                                <CheckCircle2 size={14} /> Valid
                            </div>
                            <div className="scanner-stat-card__value scanner-stat-card__value--valid">{stats.valid}</div>
                            <div className="scanner-stat-card__sub">{validPercent}%</div>
                        </div>
                        <div className="scanner-stat-card scanner-stat-card--invalid">
                            <div className="scanner-stat-card__label">
                                <XCircle size={14} /> Invalid
                            </div>
                            <div className="scanner-stat-card__value scanner-stat-card__value--invalid">{stats.invalid}</div>
                            <div className="scanner-stat-card__sub">{invalidPercent}%</div>
                        </div>
                        <div className="scanner-stat-card scanner-stat-card--duplicate">
                            <div className="scanner-stat-card__label">
                                <AlertTriangle size={14} /> Duplicates
                            </div>
                            <div className="scanner-stat-card__value scanner-stat-card__value--duplicate">{stats.duplicates}</div>
                            <div className="scanner-stat-card__sub">{duplicatePercent}%</div>
                        </div>
                    </div>

                    {/* Recent Scans Feed */}
                    <div className="scanner-recent-feed">
                        <div className="scanner-recent-feed__header">
                            <h3>
                                <Clock size={14} /> Recent Scans
                            </h3>
                            <div className="scanner-recent-feed__actions">
                                <button onClick={handleClearHistory} className="scanner-icon-btn scanner-icon-btn--danger" title="Clear History">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="scanner-recent-feed__search">
                            <Search size={14} />
                            <input
                                type="text"
                                placeholder="Search by name, ticket ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="scanner-recent-feed__list">
                            {filteredScans.length === 0 ? (
                                <div className="scanner-recent-feed__empty">No scans yet</div>
                            ) : (
                                filteredScans.map((scan, i) => (
                                    <div
                                        key={`${scan.id}-${i}`}
                                        className={cn(
                                            'scanner-recent-item',
                                            scan.status === 'valid' && 'scanner-recent-item--valid',
                                            scan.status === 'invalid' && 'scanner-recent-item--invalid',
                                            scan.status === 'duplicate' && 'scanner-recent-item--duplicate'
                                        )}
                                        onClick={() => {
                                            setCurrentScan(scan);
                                            setScannerState(scan.status);
                                        }}
                                    >
                                        <div
                                            className={cn(
                                                'scanner-recent-item__dot',
                                                scan.status === 'valid' && 'scanner-recent-item__dot--valid',
                                                scan.status === 'invalid' && 'scanner-recent-item__dot--invalid',
                                                scan.status === 'duplicate' && 'scanner-recent-item__dot--duplicate'
                                            )}
                                        />
                                        <div className="scanner-recent-item__content">
                                            <div className="scanner-recent-item__top">
                                                <span className="scanner-recent-item__name">{scan.name}</span>
                                                <span className="scanner-recent-item__time">{relativeTime(scan.timestamp)}</span>
                                            </div>
                                            <span className="scanner-recent-item__detail">
                                                {scan.status === 'valid' ? `${scan.tier} • ${scan.ticketId}` : scan.message || scan.ticketId}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Settings Card */}
                    <div className="scanner-settings-card">
                        <h3>
                            <Settings size={14} /> Scanner Settings
                        </h3>
                        <div className="scanner-settings-card__options">
                            <Toggle
                                checked={settings.continuousScan}
                                onChange={(v) => setSettings((s) => ({ ...s, continuousScan: v }))}
                                label="Continuous Scan"
                                description="Auto-scan next ticket"
                                size="sm"
                            />
                            <Toggle
                                checked={settings.soundEnabled}
                                onChange={(v) => setSettings((s) => ({ ...s, soundEnabled: v }))}
                                label="Sound"
                                description="Play beep on scan"
                                size="sm"
                            />
                            <Toggle
                                checked={settings.vibrationEnabled}
                                onChange={(v) => setSettings((s) => ({ ...s, vibrationEnabled: v }))}
                                label="Vibration"
                                description="Vibrate on result"
                                size="sm"
                            />
                            <Toggle
                                checked={settings.autoSave}
                                onChange={(v) => setSettings((s) => ({ ...s, autoSave: v }))}
                                label="Auto-Save"
                                description="Save to local storage"
                                size="sm"
                            />
                            <Toggle
                                checked={settings.showSystemLog}
                                onChange={(v) => setSettings((s) => ({ ...s, showSystemLog: v }))}
                                label="System Log"
                                description="Show debug output"
                                size="sm"
                            />
                        </div>
                    </div>

                    {/* Export Data */}
                    <div className="scanner-export-card">
                        <h3>
                            <Download size={14} /> Export Data
                        </h3>
                        <div className="scanner-export-card__buttons">
                            <button onClick={() => handleExport('csv')} className="scanner-export-btn">
                                <FileSpreadsheet size={14} /> CSV
                            </button>
                            <button onClick={() => handleExport('json')} className="scanner-export-btn">
                                <FileJson size={14} /> JSON
                            </button>
                            <button onClick={() => handleExport('pdf')} className="scanner-export-btn">
                                <FileText size={14} /> PDF
                            </button>
                        </div>
                    </div>
                </aside>

                {/* ── CENTER PANEL: Camera Viewport ── */}
                <section className="scanner-viewport-section">
                    <div
                        className={cn(
                            'scanner-viewport',
                            scannerState === 'valid' && 'scanner-viewport--valid',
                            scannerState === 'invalid' && 'scanner-viewport--invalid',
                            scannerState === 'duplicate' && 'scanner-viewport--duplicate'
                        )}
                    >
                        {/* Hidden video element for camera */}
                        <video
                            ref={videoRef}
                            className={cn(
                                'scanner-viewport__video',
                                (scannerState === 'idle' || scannerState === 'camera_error') && 'scanner-viewport__video--hidden'
                            )}
                            playsInline
                            muted
                        />

                        {/* Status Badge */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={scannerState}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="scanner-viewport__badge-wrapper"
                            >
                                <div
                                    className={cn(
                                        'scanner-viewport__badge',
                                        scannerState === 'idle' && 'scanner-viewport__badge--idle',
                                        scannerState === 'initializing' && 'scanner-viewport__badge--init',
                                        scannerState === 'scanning' && 'scanner-viewport__badge--scanning',
                                        scannerState === 'processing' && 'scanner-viewport__badge--processing',
                                        scannerState === 'valid' && 'scanner-viewport__badge--valid',
                                        scannerState === 'invalid' && 'scanner-viewport__badge--invalid',
                                        scannerState === 'duplicate' && 'scanner-viewport__badge--duplicate',
                                        scannerState === 'camera_error' && 'scanner-viewport__badge--error'
                                    )}
                                >
                                    {scannerState === 'idle' && (
                                        <>
                                            <Camera size={16} /> Ready to Scan
                                        </>
                                    )}
                                    {scannerState === 'initializing' && (
                                        <>
                                            <RefreshCw size={16} className="animate-spin" /> Initializing...
                                        </>
                                    )}
                                    {scannerState === 'scanning' && (
                                        <>
                                            <ScanLine size={16} /> Scanning...
                                        </>
                                    )}
                                    {scannerState === 'processing' && (
                                        <>
                                            <RefreshCw size={16} className="animate-spin" /> Processing...
                                        </>
                                    )}
                                    {scannerState === 'valid' && (
                                        <>
                                            <CheckCircle2 size={16} /> Valid Ticket
                                        </>
                                    )}
                                    {scannerState === 'invalid' && (
                                        <>
                                            <XCircle size={16} /> Invalid Ticket
                                        </>
                                    )}
                                    {scannerState === 'duplicate' && (
                                        <>
                                            <AlertTriangle size={16} /> Already Used
                                        </>
                                    )}
                                    {scannerState === 'camera_error' && (
                                        <>
                                            <CameraOff size={16} /> Camera Error
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Crosshair Frame */}
                        <div className={cn('scanner-viewport__frame', scannerState === 'scanning' && 'scanner-viewport__frame--active')}>
                            <div className="scanner-viewport__corner scanner-viewport__corner--tl" />
                            <div className="scanner-viewport__corner scanner-viewport__corner--tr" />
                            <div className="scanner-viewport__corner scanner-viewport__corner--bl" />
                            <div className="scanner-viewport__corner scanner-viewport__corner--br" />
                            <div className="scanner-viewport__crosshair-h" />
                            <div className="scanner-viewport__crosshair-v" />

                            {scannerState === 'scanning' && <div className="scanner-viewport__scanline" />}

                            {scannerState === 'idle' && (
                                <div className="scanner-viewport__idle">
                                    <QrCode size={80} strokeWidth={1} />
                                    <p>Point camera at a QR code</p>
                                    <p className="scanner-viewport__idle-hint">Press Space or click Start to begin</p>
                                </div>
                            )}

                            {scannerState === 'camera_error' && (
                                <div className="scanner-viewport__error">
                                    <CameraOff size={64} />
                                    <h3>Camera Access Denied</h3>
                                    <p>Please check your browser permissions.</p>
                                    <div className="scanner-viewport__error-actions">
                                        <button onClick={handleStartScanning} className="scanner-btn scanner-btn--primary">
                                            <RotateCcw size={16} /> Retry Access
                                        </button>
                                        <button onClick={() => setIsManualModalOpen(true)} className="scanner-btn scanner-btn--secondary">
                                            <Keyboard size={16} /> Manual Entry
                                        </button>
                                    </div>
                                </div>
                            )}

                            {scannerState === 'valid' && (
                                <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="scanner-viewport__success-icon">
                                    <CheckCircle2 size={80} />
                                </motion.div>
                            )}

                            {scannerState === 'invalid' && (
                                <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="scanner-viewport__invalid-icon">
                                    <XCircle size={80} />
                                </motion.div>
                            )}
                        </div>

                        {/* Camera feed status */}
                        <div className="scanner-viewport__status">
                            <div
                                className={cn(
                                    'scanner-viewport__dot',
                                    scannerState !== 'idle' && scannerState !== 'camera_error' && 'scanner-viewport__dot--active'
                                )}
                            />
                            <span>Camera: {scannerState !== 'idle' && scannerState !== 'camera_error' ? 'Active' : 'Standby'}</span>
                        </div>
                    </div>

                    {/* Controls Bar */}
                    <div className="scanner-controls">
                        <div className="scanner-controls__secondary">
                            <button
                                onClick={() => setFlashlightOn(!flashlightOn)}
                                className={cn('scanner-control-btn', flashlightOn && 'scanner-control-btn--active')}
                                title="Flashlight (F)"
                                aria-label="Toggle flashlight"
                            >
                                {flashlightOn ? <Flashlight size={20} /> : <FlashlightOff size={20} />}
                            </button>
                            <button className="scanner-control-btn" title="Switch Camera (C)" aria-label="Switch camera">
                                <Camera size={20} />
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="scanner-control-btn"
                                title="Upload QR Image (U)"
                                aria-label="Upload QR image"
                            >
                                <Upload size={20} />
                            </button>
                            <button
                                onClick={() => setIsManualModalOpen(true)}
                                className="scanner-control-btn"
                                title="Manual Entry (M)"
                                aria-label="Manual entry"
                            >
                                <Keyboard size={20} />
                            </button>
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </div>

                        {scannerState === 'scanning' || scannerState === 'processing' || scannerState === 'initializing' ? (
                            <button onClick={handleStopScanning} className="scanner-btn scanner-btn--danger scanner-btn--lg">
                                <StopCircle size={20} /> Stop Scanning
                            </button>
                        ) : (
                            <button onClick={handleStartScanning} className="scanner-btn scanner-btn--primary scanner-btn--lg">
                                <Play size={20} /> Start Scanning
                            </button>
                        )}
                    </div>
                </section>

                {/* ── RIGHT PANEL ── */}
                <aside className="scanner-panel-right">
                    {/* Validation Result Card */}
                    <div
                        className={cn(
                            'scanner-result-card',
                            currentScan && scannerState === 'valid' && 'scanner-result-card--valid',
                            currentScan && scannerState === 'invalid' && 'scanner-result-card--invalid',
                            currentScan && scannerState === 'duplicate' && 'scanner-result-card--duplicate'
                        )}
                    >
                        {!currentScan || scannerState === 'idle' || scannerState === 'scanning' || scannerState === 'initializing' ? (
                            <div className="scanner-result-card__empty">
                                <Ticket size={48} strokeWidth={1} />
                                <h3>Awaiting Scan...</h3>
                                <p>Position QR code in camera or use manual entry</p>
                            </div>
                        ) : (
                            <div className="scanner-result-card__content">
                                {/* Status Header */}
                                <div
                                    className={cn(
                                        'scanner-result-card__status-bar',
                                        currentScan.status === 'valid' && 'scanner-result-card__status-bar--valid',
                                        currentScan.status === 'invalid' && 'scanner-result-card__status-bar--invalid',
                                        currentScan.status === 'duplicate' && 'scanner-result-card__status-bar--duplicate'
                                    )}
                                >
                                    {currentScan.status === 'valid' && (
                                        <>
                                            <CheckCircle2 size={18} /> VALID TICKET
                                        </>
                                    )}
                                    {currentScan.status === 'invalid' && (
                                        <>
                                            <XCircle size={18} /> INVALID TICKET
                                        </>
                                    )}
                                    {currentScan.status === 'duplicate' && (
                                        <>
                                            <AlertTriangle size={18} /> ALREADY CHECKED IN
                                        </>
                                    )}
                                </div>

                                {/* Attendee Info */}
                                <div className="scanner-result-card__attendee">
                                    <div className="scanner-result-card__avatar">
                                        {currentScan.status === 'valid' ? (
                                            <img
                                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentScan.name)}&background=16c784&color=fff&size=80`}
                                                alt={currentScan.name}
                                            />
                                        ) : (
                                            <div
                                                className={cn(
                                                    'scanner-result-card__avatar-icon',
                                                    currentScan.status === 'invalid' && 'scanner-result-card__avatar-icon--invalid',
                                                    currentScan.status === 'duplicate' && 'scanner-result-card__avatar-icon--duplicate'
                                                )}
                                            >
                                                {currentScan.status === 'invalid' ? <ShieldAlert size={28} /> : <AlertTriangle size={28} />}
                                            </div>
                                        )}
                                    </div>
                                    <div className="scanner-result-card__info">
                                        <h2>{currentScan.name}</h2>
                                        {currentScan.email && (
                                            <p className="scanner-result-card__email">
                                                <Mail size={12} /> {currentScan.email}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Ticket Details */}
                                <div className="scanner-result-card__details">
                                    <div className="scanner-result-card__detail-row">
                                        <span>
                                            <Ticket size={12} /> Ticket ID
                                        </span>
                                        <span className="scanner-result-card__mono">{currentScan.ticketId}</span>
                                    </div>
                                    <div className="scanner-result-card__detail-row">
                                        <span>
                                            <Hash size={12} /> Tier
                                        </span>
                                        <span>{currentScan.tier}</span>
                                    </div>
                                    {currentScan.gateAccess && (
                                        <div className="scanner-result-card__detail-row">
                                            <span>
                                                <Shield size={12} /> Access Level
                                            </span>
                                            <span>{currentScan.gateAccess}</span>
                                        </div>
                                    )}
                                    {currentScan.bookingId && (
                                        <div className="scanner-result-card__detail-row">
                                            <span>
                                                <FileText size={12} /> Booking
                                            </span>
                                            <span className="scanner-result-card__mono">{currentScan.bookingId}</span>
                                        </div>
                                    )}
                                    {currentScan.eventTitle && (
                                        <div className="scanner-result-card__detail-row">
                                            <span>
                                                <Calendar size={12} /> Event
                                            </span>
                                            <span>{currentScan.eventTitle}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Status-specific content */}
                                {currentScan.status === 'valid' && (
                                    <div className="scanner-result-card__check-in">
                                        <div className="scanner-result-card__detail-row">
                                            <span>
                                                <Clock size={12} /> Checked In
                                            </span>
                                            <span className="scanner-result-card__value--valid">{currentScan.timestamp.toLocaleTimeString()}</span>
                                        </div>
                                        <div className="scanner-result-card__detail-row">
                                            <span>
                                                <MapPin size={12} /> Gate
                                            </span>
                                            <span>Main Entrance</span>
                                        </div>
                                    </div>
                                )}

                                {currentScan.status === 'invalid' && (
                                    <div className="scanner-result-card__error-box">
                                        <XCircle size={16} />
                                        <div>
                                            <p className="scanner-result-card__error-reason">{currentScan.message}</p>
                                            <p className="scanner-result-card__error-hint">Please direct attendee to the support desk.</p>
                                        </div>
                                    </div>
                                )}

                                {currentScan.status === 'duplicate' && (
                                    <div className="scanner-result-card__duplicate-box">
                                        <div className="scanner-result-card__dup-info">
                                            <AlertTriangle size={16} />
                                            <div>
                                                <p className="scanner-result-card__dup-message">{currentScan.message}</p>
                                                {currentScan.firstCheckIn && (
                                                    <p className="scanner-result-card__dup-detail">
                                                        Gate: {currentScan.firstCheckIn.gate} • Device: {currentScan.firstCheckIn.device}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <button onClick={() => setIsOverrideModalOpen(true)} className="scanner-btn scanner-btn--override">
                                            <Unlock size={16} /> Allow Re-Entry
                                        </button>
                                    </div>
                                )}

                                {/* Action buttons */}
                                <div className="scanner-result-card__actions">
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(JSON.stringify(currentScan, null, 2));
                                            showSuccess('Details copied');
                                        }}
                                        className="scanner-btn scanner-btn--ghost"
                                    >
                                        <Copy size={14} /> Copy Details
                                    </button>
                                    <button onClick={handleStartScanning} className="scanner-btn scanner-btn--ghost">
                                        <ScanLine size={14} /> Scan Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Recent Activity Timeline */}
                    <div className="scanner-activity-feed">
                        <div className="scanner-activity-feed__header">
                            <h3>
                                <ClipboardList size={14} /> Recent Activity
                            </h3>
                        </div>
                        <div className="scanner-activity-feed__list">
                            {recentScans.slice(0, 10).map((scan, i) => (
                                <div
                                    key={`activity-${scan.id}-${i}`}
                                    className="scanner-activity-item"
                                    onClick={() => {
                                        setCurrentScan(scan);
                                        setScannerState(scan.status);
                                    }}
                                >
                                    <div
                                        className={cn(
                                            'scanner-activity-item__dot',
                                            scan.status === 'valid' && 'scanner-activity-item__dot--valid',
                                            scan.status === 'invalid' && 'scanner-activity-item__dot--invalid',
                                            scan.status === 'duplicate' && 'scanner-activity-item__dot--duplicate'
                                        )}
                                    />
                                    <div className="scanner-activity-item__content">
                                        <span className="scanner-activity-item__time">{relativeTime(scan.timestamp)}</span>
                                        <span className="scanner-activity-item__text">
                                            {scan.name} • {scan.tier} • {scan.ticketId}
                                        </span>
                                        {scan.status !== 'valid' && (
                                            <span className="scanner-activity-item__note">({scan.status === 'duplicate' ? 'Duplicate' : scan.message})</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {recentScans.length === 0 && <div className="scanner-activity-feed__empty">No activity yet</div>}
                        </div>
                    </div>

                    {/* System Log */}
                    {settings.showSystemLog && (
                        <div className="scanner-syslog">
                            <div className="scanner-syslog__header" onClick={() => setIsLogExpanded(!isLogExpanded)}>
                                <div className="scanner-syslog__title">
                                    <Terminal size={14} />
                                    <span>System Log</span>
                                    <div className="scanner-syslog__dot" />
                                </div>
                                <div className="scanner-syslog__actions">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setLogs([]);
                                        }}
                                        title="Clear log"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                    {isLogExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </div>
                            </div>
                            {isLogExpanded && (
                                <div ref={logContainerRef} className="scanner-syslog__body">
                                    {logs.map((log, idx) => (
                                        <div key={idx} className="scanner-syslog__entry">
                                            <span className="scanner-syslog__time">[{log.time}]</span>
                                            <span
                                                className={cn(
                                                    'scanner-syslog__type',
                                                    log.type === 'SUCCESS' && 'scanner-syslog__type--success',
                                                    log.type === 'ERROR' && 'scanner-syslog__type--error',
                                                    log.type === 'WARNING' && 'scanner-syslog__type--warning',
                                                    log.type === 'INFO' && 'scanner-syslog__type--info',
                                                    log.type === 'SYS' && 'scanner-syslog__type--sys',
                                                    log.type === 'READY' && 'scanner-syslog__type--ready'
                                                )}
                                            >
                                                {log.type}:
                                            </span>
                                            <span className={cn('scanner-syslog__msg', log.type === 'ERROR' && 'scanner-syslog__msg--error')}>{log.message}</span>
                                        </div>
                                    ))}
                                    <div className="scanner-syslog__cursor">
                                        <span>&gt; _</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </aside>
            </main>

            {/* ── Mobile Bottom Control Bar ── */}
            <div className="scanner-mobile-controls">
                <button onClick={() => setFlashlightOn(!flashlightOn)} className={cn('scanner-mobile-ctrl-btn', flashlightOn && 'scanner-mobile-ctrl-btn--active')}>
                    {flashlightOn ? <Flashlight size={20} /> : <FlashlightOff size={20} />}
                </button>
                <button className="scanner-mobile-ctrl-btn">
                    <Camera size={20} />
                </button>
                <button
                    onClick={scannerState === 'scanning' || scannerState === 'processing' ? handleStopScanning : handleStartScanning}
                    className="scanner-mobile-ctrl-btn scanner-mobile-ctrl-btn--primary"
                >
                    {scannerState === 'scanning' || scannerState === 'processing' ? <StopCircle size={24} /> : <Play size={24} />}
                </button>
                <button onClick={() => setIsManualModalOpen(true)} className="scanner-mobile-ctrl-btn">
                    <Keyboard size={20} />
                </button>
                <button onClick={() => setIsSettingsModalOpen(true)} className="scanner-mobile-ctrl-btn">
                    <Settings size={20} />
                </button>
                <button onClick={() => setIsHistoryDrawerOpen(true)} className="scanner-mobile-ctrl-btn">
                    <ClipboardList size={20} />
                </button>
            </div>

            {/* ── Mobile Validation Overlay ── */}
            <AnimatePresence>
                {(scannerState === 'valid' || scannerState === 'invalid' || scannerState === 'duplicate') && currentScan && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="scanner-mobile-overlay"
                    >
                        <div className="scanner-mobile-overlay__handle" />
                        <div
                            className={cn(
                                'scanner-mobile-overlay__header',
                                currentScan.status === 'valid' && 'scanner-mobile-overlay__header--valid',
                                currentScan.status === 'invalid' && 'scanner-mobile-overlay__header--invalid',
                                currentScan.status === 'duplicate' && 'scanner-mobile-overlay__header--duplicate'
                            )}
                        >
                            {currentScan.status === 'valid' && (
                                <>
                                    <CheckCircle2 size={24} /> Valid Ticket
                                </>
                            )}
                            {currentScan.status === 'invalid' && (
                                <>
                                    <XCircle size={24} /> Invalid
                                </>
                            )}
                            {currentScan.status === 'duplicate' && (
                                <>
                                    <AlertTriangle size={24} /> Already Used
                                </>
                            )}
                        </div>
                        <div className="scanner-mobile-overlay__body">
                            <h3>{currentScan.name}</h3>
                            <p>
                                {currentScan.tier} • {currentScan.ticketId}
                            </p>
                            {currentScan.message && <p className="scanner-mobile-overlay__msg">{currentScan.message}</p>}
                            {currentScan.status === 'duplicate' && (
                                <button onClick={() => setIsOverrideModalOpen(true)} className="scanner-btn scanner-btn--override scanner-btn--full">
                                    <Unlock size={16} /> Override
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Manual Entry Modal ── */}
            <Modal isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} title="Manual Ticket Entry" size="sm">
                <form onSubmit={handleManualSubmit} className="scanner-manual-form">
                    <div className="scanner-manual-form__field">
                        <label>Ticket ID</label>
                        <input
                            type="text"
                            autoFocus
                            placeholder="e.g. TC-12345"
                            value={manualTicketId}
                            onChange={(e) => setManualTicketId(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                            className="scanner-manual-form__input"
                        />
                        <p className="scanner-manual-form__hint">Enter the alphanumeric code printed below the QR code.</p>
                    </div>
                    <div className="scanner-manual-form__actions">
                        <button type="button" onClick={() => setIsManualModalOpen(false)} className="scanner-btn scanner-btn--secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={!manualTicketId.trim()} className="scanner-btn scanner-btn--primary">
                            <CheckCircle2 size={16} /> Check In
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ── Override Modal ── */}
            <Modal isOpen={isOverrideModalOpen} onClose={() => setIsOverrideModalOpen(false)} title="Override Check-In" size="sm">
                <div className="scanner-override-form">
                    <p className="scanner-override-form__desc">
                        Why are you allowing re-entry for <strong>{currentScan?.name}</strong>?
                    </p>
                    <div className="scanner-override-form__field">
                        <label>Reason Category</label>
                        <select value={overrideCategory} onChange={(e) => setOverrideCategory(e.target.value)} className="scanner-override-form__select">
                            <option value="re-entry">Re-entry (bathroom, parking)</option>
                            <option value="lost-ticket">Lost ticket, rescanned</option>
                            <option value="device-error">Device error, duplicate scan</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div className="scanner-override-form__field">
                        <label>Additional Notes</label>
                        <textarea
                            value={overrideReason}
                            onChange={(e) => setOverrideReason(e.target.value)}
                            placeholder="Provide additional context..."
                            className="scanner-override-form__textarea"
                            rows={3}
                        />
                    </div>
                    <div className="scanner-override-form__actions">
                        <button onClick={() => setIsOverrideModalOpen(false)} className="scanner-btn scanner-btn--secondary">
                            <XCircle size={16} /> Reject Entry
                        </button>
                        <button onClick={handleOverride} disabled={!overrideReason.trim()} className="scanner-btn scanner-btn--primary">
                            <Unlock size={16} /> Allow Re-Entry
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ── Settings Modal (Mobile) ── */}
            <Modal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} title="Scanner Settings" size="md">
                <div className="scanner-settings-modal">
                    <div className="scanner-settings-modal__toggles">
                        <Toggle
                            checked={settings.continuousScan}
                            onChange={(v) => setSettings((s) => ({ ...s, continuousScan: v }))}
                            label="Continuous Scan"
                            description="Auto-scan next ticket after validation"
                        />
                        <Toggle
                            checked={settings.soundEnabled}
                            onChange={(v) => setSettings((s) => ({ ...s, soundEnabled: v }))}
                            label="Sound Feedback"
                            description="Play audio on scan result"
                        />
                        <Toggle
                            checked={settings.vibrationEnabled}
                            onChange={(v) => setSettings((s) => ({ ...s, vibrationEnabled: v }))}
                            label="Haptic Feedback"
                            description="Vibrate on scan result"
                        />
                        <Toggle
                            checked={settings.autoSave}
                            onChange={(v) => setSettings((s) => ({ ...s, autoSave: v }))}
                            label="Auto-Save Scans"
                            description="Save scan history to local storage"
                        />
                        <Toggle
                            checked={settings.showSystemLog}
                            onChange={(v) => setSettings((s) => ({ ...s, showSystemLog: v }))}
                            label="System Log"
                            description="Show technical debug output"
                        />
                    </div>

                    <div className="scanner-settings-modal__section">
                        <h4>IoT Devices</h4>
                        {iotDevices.length === 0 ? (
                            <p className="scanner-settings-modal__empty">No IoT devices connected</p>
                        ) : (
                            <div className="scanner-settings-modal__devices">
                                {iotDevices.map((device) => (
                                    <div key={device.id} className="scanner-settings-modal__device">
                                        <div className={cn('scanner-settings-modal__device-dot', device.status === 'online' && 'scanner-settings-modal__device-dot--online')} />
                                        <span>{device.name}</span>
                                        <span className="scanner-settings-modal__device-type">{device.type}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="scanner-settings-modal__section">
                        <h4>Export Data</h4>
                        <div className="scanner-export-card__buttons">
                            <button onClick={() => handleExport('csv')} className="scanner-export-btn">
                                <FileSpreadsheet size={14} /> CSV
                            </button>
                            <button onClick={() => handleExport('json')} className="scanner-export-btn">
                                <FileJson size={14} /> JSON
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* ── History Drawer (Mobile) ── */}
            <AnimatePresence>
                {isHistoryDrawerOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="scanner-drawer-backdrop"
                            onClick={() => setIsHistoryDrawerOpen(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="scanner-history-drawer"
                        >
                            <div className="scanner-history-drawer__header">
                                <h3>
                                    <ClipboardList size={16} /> Scan History
                                </h3>
                                <button onClick={() => setIsHistoryDrawerOpen(false)}>
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="scanner-recent-feed__search">
                                <Search size={14} />
                                <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                            <div className="scanner-history-drawer__list">
                                {filteredScans.map((scan, i) => (
                                    <div
                                        key={`drawer-${scan.id}-${i}`}
                                        className={cn(
                                            'scanner-recent-item',
                                            scan.status === 'valid' && 'scanner-recent-item--valid',
                                            scan.status === 'invalid' && 'scanner-recent-item--invalid',
                                            scan.status === 'duplicate' && 'scanner-recent-item--duplicate'
                                        )}
                                        onClick={() => {
                                            setCurrentScan(scan);
                                            setScannerState(scan.status);
                                            setIsHistoryDrawerOpen(false);
                                        }}
                                    >
                                        <div
                                            className={cn(
                                                'scanner-recent-item__dot',
                                                scan.status === 'valid' && 'scanner-recent-item__dot--valid',
                                                scan.status === 'invalid' && 'scanner-recent-item__dot--invalid',
                                                scan.status === 'duplicate' && 'scanner-recent-item__dot--duplicate'
                                            )}
                                        />
                                        <div className="scanner-recent-item__content">
                                            <div className="scanner-recent-item__top">
                                                <span className="scanner-recent-item__name">{scan.name}</span>
                                                <span className="scanner-recent-item__time">{relativeTime(scan.timestamp)}</span>
                                            </div>
                                            <span className="scanner-recent-item__detail">
                                                {scan.tier} • {scan.ticketId}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
