import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wifi,
    WifiOff,
    Radio,
    QrCode,
    Camera,
    RefreshCw,
    Plug,
    PlugZap,
    Unplug,
    Trash2,
    RotateCcw,
    ExternalLink,
    Eye,
    EyeOff,
    ChevronDown,
    ChevronRight,
    Copy,
    Check,
    AlertTriangle,
    Info,
    CheckCircle2,
    XCircle,
    Circle,
    Loader2,
    Globe,
    Signal,
    Monitor,
    X,
    Search,
    Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Toggle from '@/components/common/Toggle';
import { showSuccess, showError, showWarning, showInfo } from '@/components/common/Toast';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp, deleteField, collection, addDoc } from 'firebase/firestore';

// =============================================================================
// TYPES
// =============================================================================

interface IoTDevice {
    id: string;
    name: string;
    type: string;
    status: string;
    event: string;
    location: string;
    lastSync: string;
    battery: number;
    scansToday: number;
    firmware: string;
    lastKnownIp?: string;
}

export interface GatewayProps {
    device: IoTDevice;
    onConnected: (esp32Url: string) => void;
    onDisconnected?: () => void;
}

interface ESP32Device {
    id: string;
    ip: string;
    firmwareVersion: string;
    deviceType: string;
    pingMs: number;
    status: 'reachable' | 'unreachable' | 'slow';
    lastKnownAt: Date;
}

interface LogEntry {
    timestamp: Date;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    detail?: string;
}

type ConnectionStatus = 'idle' | 'scanning' | 'connecting' | 'connected' | 'error' | 'disconnected';

// =============================================================================
// CONSTANTS
// =============================================================================

const HEARTBEAT_OPTIONS = [
    { label: '5s', value: 5 },
    { label: '10s', value: 10 },
    { label: '30s', value: 30 },
    { label: '60s', value: 60 },
];

const MAX_LOG_ENTRIES = 200;

const LOG_ICONS: Record<LogEntry['type'], typeof Info> = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    error: XCircle,
};

const LOG_COLORS: Record<LogEntry['type'], string> = {
    info: 'text-gray-400',
    success: 'text-green-400',
    warning: 'text-amber-400',
    error: 'text-red-400',
};

const STATUS_BADGE: Record<ConnectionStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary'; icon: typeof Circle }> = {
    idle: { label: 'Idle', variant: 'default', icon: Circle },
    scanning: { label: 'Scanning...', variant: 'info', icon: Search },
    connecting: { label: 'Connecting...', variant: 'warning', icon: Loader2 },
    connected: { label: 'Connected', variant: 'success', icon: CheckCircle2 },
    error: { label: 'Error', variant: 'error', icon: XCircle },
    disconnected: { label: 'Disconnected', variant: 'default', icon: Unplug },
};

// Animation variants
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 22 } } };

// =============================================================================
// HELPER: format time
// =============================================================================
const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });

// =============================================================================
// COMPONENT
// =============================================================================

// Helper for timeout-enabled fetch (polyfill for AbortSignal.timeout)
const fetchWithTimeout = async (url: string, ms: number, options: RequestInit = {}) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(id);
    }
};

export default function Gateway({ device, onConnected, onDisconnected }: GatewayProps) {
    // ── State ──
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
    const [discoveredDevices, setDiscoveredDevices] = useState<ESP32Device[]>([]);
    const [, setSelectedEsp] = useState<ESP32Device | null>(null);
    const [manualUrl, setManualUrl] = useState('');
    const [autoReconnect, setAutoReconnect] = useState(() => {
        const stored = localStorage.getItem(`gateway-auto-reconnect-${device.id}`);
        return stored !== null ? stored === 'true' : true;
    });
    const [heartbeatInterval, setHeartbeatInterval] = useState(() => {
        const stored = localStorage.getItem(`gateway-heartbeat-${device.id}`);
        return stored ? parseInt(stored, 10) : 10;
    });
    const [connectionLog, setConnectionLog] = useState<LogEntry[]>([]);
    const [hostUrl, setHostUrl] = useState<string | null>(null);
    const [pingMs, setPingMs] = useState<number | null>(null);
    const [iframeVisible, setIframeVisible] = useState(false);
    const [iframeLoading, setIframeLoading] = useState(true);
    const [qrScannerActive, setQrScannerActive] = useState(false);
    const [expandedLogId, setExpandedLogId] = useState<number | null>(null);
    const [, setFailCount] = useState(0);
    const [testResult, setTestResult] = useState<{ status: 'ok' | 'slow' | 'fail'; ms?: number } | null>(null);
    const [copied, setCopied] = useState(false);
    const [connectingIp, setConnectingIp] = useState<string | null>(null);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // ── Refs ──
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ==========================================================================
    // LOGGING
    // ==========================================================================
    const appendLog = useCallback((type: LogEntry['type'], message: string, detail?: string) => {
        const entry: LogEntry = { timestamp: new Date(), type, message, detail };
        setConnectionLog(prev => {
            const next = [entry, ...prev];
            if (next.length > MAX_LOG_ENTRIES) next.pop();
            return next;
        });

        // Also write to Firestore logs subcollection
        if (db) {
            const levelMap: Record<LogEntry['type'], string> = { info: 'INFO', success: 'INFO', warning: 'WARNING', error: 'ERROR' };
            try {
                addDoc(collection(db, 'iot_devices', device.id, 'logs'), {
                    timestamp: serverTimestamp(),
                    level: levelMap[type],
                    message,
                    source: 'gateway',
                    ...(detail ? { detail } : {}),
                });
            } catch {
                // Silent fail — logging should never break the UI
            }
        }
    }, [device.id]);

    // ==========================================================================
    // DISCOVERY — Method 1: mDNS Probe
    // ==========================================================================
    const probeMdns = useCallback(async (): Promise<ESP32Device | null> => {
        try {
            appendLog('info', '📡 mDNS probe → flowgatex.local...');
            const start = performance.now();
            const res = await fetchWithTimeout('http://flowgatex.local/ping', 800);
            const ms = Math.round(performance.now() - start);
            if (res.ok) {
                const data = await res.json();
                appendLog('success', `📡 mDNS probe → flowgatex.local resolved (${ms}ms)`);
                return {
                    id: data.id || 'ESP32-Unknown',
                    ip: 'flowgatex.local',
                    firmwareVersion: data.fw || 'unknown',
                    deviceType: data.type || 'gate',
                    pingMs: ms,
                    status: ms > 300 ? 'slow' : 'reachable',
                    lastKnownAt: new Date(),
                };
            }
        } catch {
            appendLog('info', '📡 mDNS probe failed — trying other methods');
        }
        return null;
    }, [appendLog]);

    // ==========================================================================
    // DISCOVERY — Method 2: IP Range Sweep
    // ==========================================================================
    const sweepIpRange = useCallback(async (priorityIps: string[]): Promise<ESP32Device[]> => {
        const results: ESP32Device[] = [];

        // Build full IP list
        const ips = new Set<string>();
        // Priority 1 — ESP32 SoftAP default
        ips.add('192.168.4.1');
        // Priority 2 — any priority IPs passed (from Firestore)
        priorityIps.forEach(ip => ips.add(ip));
        // Priority 3–5 — common ranges
        for (let i = 1; i <= 20; i++) ips.add(`192.168.1.${i}`);
        for (let i = 1; i <= 20; i++) ips.add(`192.168.0.${i}`);
        for (let i = 1; i <= 10; i++) ips.add(`10.0.0.${i}`);

        appendLog('info', `📡 Sweeping ${ips.size} addresses...`);

        const probes = Array.from(ips).map(async (ip) => {
            try {
                const start = performance.now();
                const res = await fetchWithTimeout(`http://${ip}/ping`, 800);
                const ms = Math.round(performance.now() - start);
                if (res.ok) {
                    const data = await res.json();
                    return {
                        id: data.id || `ESP32-${ip}`,
                        ip,
                        firmwareVersion: data.fw || 'unknown',
                        deviceType: data.type || 'gate',
                        pingMs: ms,
                        status: (ms > 300 ? 'slow' : 'reachable') as ESP32Device['status'],
                        lastKnownAt: new Date(),
                    };
                }
            } catch {
                // IP not reachable — expected for most
            }
            return null;
        });

        const settled = await Promise.allSettled(probes);
        settled.forEach(r => {
            if (r.status === 'fulfilled' && r.value) results.push(r.value);
        });

        return results;
    }, [appendLog]);

    // ==========================================================================
    // DISCOVERY — Method 3: Firebase Lookup
    // ==========================================================================
    const lookupFirestore = useCallback(async (): Promise<string | null> => {
        appendLog('info', `🔍 Firebase lookup → devices/${device.id}.lastKnownIp`);
        // Use lastKnownIp from device prop if available
        if (device.lastKnownIp) {
            appendLog('info', `🔍 Firebase → lastKnownIp: ${device.lastKnownIp}`);
            return device.lastKnownIp;
        }
        return null;
    }, [device.id, device.lastKnownIp, appendLog]);

    // ==========================================================================
    // COMBINED DISCOVERY
    // ==========================================================================
    const runDiscovery = useCallback(async () => {
        setConnectionStatus('scanning');
        setDiscoveredDevices([]);
        appendLog('info', '🔌 Initializing device scan...');

        // Method 3 first — Firestore lookup for cached IP
        const lastKnownIp = await lookupFirestore();
        const priorityIps = lastKnownIp ? [lastKnownIp] : [];

        // Fire methods 1 & 2 in parallel
        const [mdnsResult, sweepResults] = await Promise.allSettled([
            probeMdns(),
            sweepIpRange(priorityIps),
        ]);

        const found: ESP32Device[] = [];

        if (mdnsResult.status === 'fulfilled' && mdnsResult.value) {
            found.push(mdnsResult.value);
        }

        if (sweepResults.status === 'fulfilled') {
            sweepResults.value.forEach(d => {
                // De-duplicate by IP
                if (!found.some(existing => existing.ip === d.ip)) {
                    found.push(d);
                }
            });
        }

        // Add unreachable device for lastKnownIp if it wasn't found
        if (lastKnownIp && !found.some(d => d.ip === lastKnownIp)) {
            found.push({
                id: `ESP32-${lastKnownIp}`,
                ip: lastKnownIp,
                firmwareVersion: 'unknown',
                deviceType: 'gate',
                pingMs: -1,
                status: 'unreachable',
                lastKnownAt: new Date(),
            });
        }

        setDiscoveredDevices(found);

        if (found.length === 0) {
            appendLog('warning', 'No devices found on network. Make sure you\'re on the same WiFi as the ESP32.');
            setConnectionStatus('idle');
        } else {
            const reachable = found.filter(d => d.status !== 'unreachable').length;
            appendLog('info', `Found ${found.length} device(s) — ${reachable} reachable`);
            setConnectionStatus('idle');
        }
    }, [appendLog, lookupFirestore, probeMdns, sweepIpRange]);

    // ==========================================================================
    // CONNECTION ESTABLISHMENT
    // ==========================================================================
    const initiateConnection = useCallback(async (targetUrl: string) => {
        const ip = targetUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
        setConnectingIp(ip);
        setConnectionStatus('connecting');
        appendLog('info', `🔄 Attempting connection to ${ip}...`);

        try {
            // Step 2 — Ping validation
            const start = performance.now();
            const res = await fetchWithTimeout(`http://${ip}/ping`, 2000);
            const ms = Math.round(performance.now() - start);

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            // Step 3 — Identity verification
            const data = await res.json();
            const deviceIdFromEsp = data.deviceId || data.id;

            if (deviceIdFromEsp && deviceIdFromEsp !== device.id) {
                appendLog('warning', `⚠️ Device ID mismatch: expected ${device.id}, got ${deviceIdFromEsp}`);
                showWarning(`Device ID on network doesn't match selected device (${device.id} vs ${deviceIdFromEsp})`);
                // Still proceed but warn
            }

            // Step 4 — State updates
            const baseUrl = `http://${ip}`;
            setHostUrl(baseUrl);
            setPingMs(ms);
            setConnectionStatus('connected');
            setFailCount(0);
            setConnectingIp(null);

            // Update Firestore
            if (db) {
                try {
                    await updateDoc(doc(db, 'iot_devices', device.id), {
                        lastKnownIp: ip,
                        status: 'online',
                        lastSync: serverTimestamp(),
                    });
                } catch {
                    // Non-critical
                }
            }

            // Callback to parent
            onConnected(baseUrl);

            appendLog('success', `✅ Connected to ${data.id || ip} (${ip}, ${ms}ms)`, JSON.stringify(data, null, 2));
            showSuccess('Device connected — Live Heatmap tab is now active');

        } catch (err) {
            setConnectionStatus('error');
            setConnectingIp(null);
            appendLog('error', `⚠️ Connection failed to ${ip}`, err instanceof Error ? err.message : String(err));
            showError('Cannot reach device. Try manual IP or QR scan.');
        }
    }, [device.id, onConnected, appendLog]);

    // ==========================================================================
    // QR SCANNER
    // ==========================================================================
    const stopQrScanner = useCallback(() => {
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
        setQrScannerActive(false);
    }, []);

    const startQrScanner = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }

            setQrScannerActive(true);
            appendLog('info', '📷 QR scanner activated — point at device QR code');

            // Dynamically import jsQR (or fallback to canvas-based decode)
            scanIntervalRef.current = setInterval(() => {
                if (!videoRef.current || !canvasRef.current) return;
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                // Simple URL detection from QR — using basic pattern matching
                // In production, jsQR library would be used here
                try {
                    // Attempt to use jsQR if available
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const jsQR = (window as any).jsQR;
                    if (jsQR) {
                        const code = jsQR(imageData.data, canvas.width, canvas.height);
                        if (code?.data?.startsWith('http://')) {
                            stopQrScanner();
                            const url = new URL(code.data);
                            setManualUrl(url.origin);
                            initiateConnection(url.origin);
                            appendLog('success', `📷 QR decoded → ${url.origin}`);
                        }
                    }
                } catch {
                    // jsQR not available — scanner still shows camera feed
                }
            }, 250);

        } catch {
            appendLog('error', '📷 Camera permission denied — use manual IP input instead');
            showWarning('Camera permission required for QR scan');
            setQrScannerActive(false);
        }
    }, [appendLog, initiateConnection, stopQrScanner]);

    // ==========================================================================
    // HEARTBEAT / AUTO-RECONNECT
    // ==========================================================================
    useEffect(() => {
        if (!autoReconnect || !hostUrl) {
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
            return;
        }

        heartbeatRef.current = setInterval(async () => {
            try {
                const start = performance.now();
                const res = await fetchWithTimeout(`${hostUrl}/ping`, 2000, { method: 'HEAD' });
                const ms = Math.round(performance.now() - start);
                setPingMs(ms);

                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                if (ms > 500) appendLog('warning', `High latency: ${ms}ms`);

                setFailCount(0);
            } catch {
                setFailCount(prev => {
                    const next = prev + 1;
                    if (next >= 2) {
                        appendLog('error', 'Heartbeat failed twice — re-scanning network');
                        setConnectionStatus('scanning');
                        runDiscovery();
                        return 0;
                    }
                    appendLog('warning', `Heartbeat miss (${next}/2)`);
                    return next;
                });
            }
        }, heartbeatInterval * 1000);

        return () => {
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        };
    }, [autoReconnect, hostUrl, heartbeatInterval, appendLog, runDiscovery]);

    // Persist preferences
    useEffect(() => {
        localStorage.setItem(`gateway-auto-reconnect-${device.id}`, String(autoReconnect));
    }, [autoReconnect, device.id]);

    useEffect(() => {
        localStorage.setItem(`gateway-heartbeat-${device.id}`, String(heartbeatInterval));
    }, [heartbeatInterval, device.id]);

    // Auto-start discovery on mount
    useEffect(() => {
        appendLog('info', '🔌 Device Connect tab opened, initializing scan');
        runDiscovery();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopQrScanner();
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ==========================================================================
    // CONTROL ACTIONS
    // ==========================================================================
    const handleTestConnection = useCallback(async () => {
        if (!hostUrl) return;
        setTestResult(null);
        appendLog('info', '🔌 Testing connection...');

        try {
            const start = performance.now();
            const res = await fetchWithTimeout(`${hostUrl}/ping`, 2000);
            const ms = Math.round(performance.now() - start);

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setPingMs(ms);

            if (ms > 500) {
                setTestResult({ status: 'slow', ms });
                appendLog('warning', `High latency — ${ms}ms. Check WiFi signal.`);
            } else {
                setTestResult({ status: 'ok', ms });
                appendLog('success', `Device reachable — ${ms}ms`);
            }
        } catch {
            setTestResult({ status: 'fail' });
            appendLog('error', 'No response — device offline or IP changed');
        }
    }, [hostUrl, appendLog]);

    const handleDisconnect = useCallback(() => {
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        const prevUrl = hostUrl;
        setHostUrl(null);
        setPingMs(null);
        setIframeVisible(false);
        setConnectionStatus('disconnected');
        setFailCount(0);
        setTestResult(null);
        onDisconnected?.();
        appendLog('info', `🔌 Disconnected from ${prevUrl || 'device'}`);
        showInfo('Device disconnected');
    }, [hostUrl, onDisconnected, appendLog]);

    const handleClearCache = useCallback(async () => {
        appendLog('info', '🗑️ Clearing device cache...');

        // Remove from Firestore
        if (db) {
            try {
                await updateDoc(doc(db, 'iot_devices', device.id), {
                    lastKnownIp: deleteField(),
                });
            } catch {
                // Non-critical
            }
        }

        // Clear localStorage
        localStorage.removeItem(`gateway-auto-reconnect-${device.id}`);
        localStorage.removeItem(`gateway-heartbeat-${device.id}`);

        // Reset discovered list and rescan
        setDiscoveredDevices([]);
        appendLog('success', '🗑️ Cache cleared — rescanning...');
        runDiscovery();
    }, [device.id, appendLog, runDiscovery]);

    const handleResetState = useCallback(() => {
        handleDisconnect();
        setDiscoveredDevices([]);
        setConnectionLog([]);
        setManualUrl('');
        setSelectedEsp(null);
        setAutoReconnect(true);
        setHeartbeatInterval(10);
        setShowResetConfirm(false);

        // Clear localStorage
        localStorage.removeItem(`gateway-auto-reconnect-${device.id}`);
        localStorage.removeItem(`gateway-heartbeat-${device.id}`);

        appendLog('info', '↺ Full state reset complete');
        showInfo('All connection state has been reset');
    }, [handleDisconnect, device.id, appendLog]);

    const handleManualConnect = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!manualUrl.trim()) return;
        const url = manualUrl.startsWith('http') ? manualUrl : `http://${manualUrl}`;
        initiateConnection(url);
    }, [manualUrl, initiateConnection]);

    const handleUseLastKnownIp = useCallback(() => {
        if (device.lastKnownIp) {
            setManualUrl(device.lastKnownIp);
            initiateConnection(device.lastKnownIp);
        }
    }, [device.lastKnownIp, initiateConnection]);

    const copyToClipboard = useCallback((text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, []);

    // ==========================================================================
    // RENDER
    // ==========================================================================
    const statusBadge = STATUS_BADGE[connectionStatus];
    const StatusIcon = statusBadge.icon;
    const reachableCount = discoveredDevices.filter(d => d.status !== 'unreachable').length;

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-5"
        >
            {/* ── HEADER ── */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                            <Radio size={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">ESP32 Device Connection</h2>
                            <p className="text-sm text-gray-500 dark:text-neutral-400">
                                {device.type.replace('_', ' ')}: {device.name}
                                {device.lastKnownIp && <span className="ml-2 text-gray-400">· Last IP: {device.lastKnownIp}</span>}
                            </p>
                        </div>
                    </div>
                    <Badge variant={statusBadge.variant} className="self-start sm:self-auto">
                        <StatusIcon
                            size={14}
                            className={cn('mr-1.5', connectionStatus === 'scanning' || connectionStatus === 'connecting' ? 'animate-spin' : '')}
                        />
                        {statusBadge.label}
                    </Badge>
                </div>
            </motion.div>

            {/* ── SECTION A: SCAN OR ENTER MANUALLY ── */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-5">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-neutral-300 mb-4 uppercase tracking-wide">
                    Scan or Enter Manually
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* QR Scanner Box */}
                    <div className="relative rounded-xl border-2 border-dashed border-gray-200 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-900/50 overflow-hidden"
                        style={{ minHeight: '180px' }}
                    >
                        {qrScannerActive ? (
                            <>
                                <video
                                    ref={videoRef}
                                    className="w-full h-full object-cover absolute inset-0"
                                    playsInline
                                    muted
                                />
                                <canvas ref={canvasRef} className="hidden" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-48 h-48 border-2 border-blue-400 rounded-lg opacity-60" />
                                </div>
                                <div className="absolute bottom-3 left-0 right-0 text-center">
                                    <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
                                        Point at device QR code
                                    </span>
                                </div>
                                <button
                                    onClick={stopQrScanner}
                                    className="absolute top-3 right-3 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80"
                                >
                                    <X size={14} />
                                </button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-8 gap-3">
                                <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                                    <Camera size={24} className="text-blue-500" />
                                </div>
                                <p className="text-sm text-gray-500 dark:text-neutral-400">QR Code Scanner</p>
                                <Button variant="outline" size="sm" onClick={startQrScanner}>
                                    <QrCode size={14} className="mr-1.5" /> Start QR Scan
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Manual IP Input */}
                    <div className="flex flex-col justify-center gap-3">
                        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Or enter IP manually</p>
                        <form onSubmit={handleManualConnect} className="flex gap-2">
                            <input
                                type="text"
                                value={manualUrl}
                                onChange={(e) => setManualUrl(e.target.value)}
                                placeholder="e.g. 192.168.4.1"
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <Button
                                type="submit"
                                variant="primary"
                                size="sm"
                                disabled={!manualUrl.trim() || connectionStatus === 'connecting'}
                                isLoading={connectionStatus === 'connecting' && connectingIp === manualUrl}
                            >
                                <PlugZap size={14} className="mr-1" /> Connect
                            </Button>
                        </form>

                        {device.lastKnownIp && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="self-start"
                                onClick={handleUseLastKnownIp}
                            >
                                <Globe size={14} className="mr-1.5" />
                                Use Last Known IP ({device.lastKnownIp})
                            </Button>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* ── SECTION B: DISCOVERED DEVICES ON NETWORK ── */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wide">
                        Discovered Devices on Network
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                            {reachableCount} of {discoveredDevices.length} reachable
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={runDiscovery}
                            disabled={connectionStatus === 'scanning'}
                            isLoading={connectionStatus === 'scanning'}
                        >
                            <RefreshCw size={14} className="mr-1" /> Re-scan
                        </Button>
                    </div>
                </div>

                {discoveredDevices.length === 0 && connectionStatus !== 'scanning' ? (
                    <div className="text-center py-8 text-gray-400">
                        <WifiOff size={32} className="mx-auto mb-3 opacity-40" />
                        <p className="text-sm font-medium">No devices found</p>
                        <p className="text-xs mt-1">Make sure you're on the same WiFi network as the ESP32 device.</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Tip: Connect to the ESP32 AP hotspot or the same router network.
                        </p>
                    </div>
                ) : connectionStatus === 'scanning' && discoveredDevices.length === 0 ? (
                    <div className="flex flex-col items-center py-8 gap-3">
                        <Loader2 size={28} className="animate-spin text-blue-500" />
                        <p className="text-sm text-gray-500">Scanning network...</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {discoveredDevices.map((d) => {
                            const isConnecting = connectingIp === d.ip;
                            const isConnected = hostUrl === `http://${d.ip}`;

                            return (
                                <div
                                    key={d.ip}
                                    className={cn(
                                        'flex items-center justify-between p-4 rounded-xl border transition-all',
                                        isConnected
                                            ? 'border-green-300 dark:border-green-600 bg-green-50/50 dark:bg-green-500/5'
                                            : 'border-gray-100 dark:border-neutral-700 bg-gray-50/50 dark:bg-neutral-900/30 hover:bg-gray-50 dark:hover:bg-neutral-700/30'
                                    )}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={cn(
                                            'w-3 h-3 rounded-full shrink-0',
                                            d.status === 'reachable' ? 'bg-green-500 animate-pulse' :
                                                d.status === 'slow' ? 'bg-amber-500 animate-pulse' :
                                                    'bg-red-500'
                                        )} />
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-sm text-gray-900 dark:text-white">{d.id}</span>
                                                <span className="text-xs font-mono text-gray-500 dark:text-neutral-400">{d.ip}</span>
                                                {d.status === 'reachable' || d.status === 'slow' ? (
                                                    <span className="text-xs text-gray-400">{d.pingMs}ms</span>
                                                ) : (
                                                    <span className="text-xs text-red-400">timeout</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400 dark:text-neutral-500 truncate">
                                                {d.deviceType} · FW: {d.firmwareVersion} · {d.id}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="shrink-0 ml-3">
                                        {isConnected ? (
                                            <Badge variant="success">
                                                <CheckCircle2 size={12} className="mr-1" /> Connected
                                            </Badge>
                                        ) : d.status === 'unreachable' ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    // Retry single IP
                                                    appendLog('info', `Retrying ${d.ip}...`);
                                                    initiateConnection(d.ip);
                                                }}
                                            >
                                                <RefreshCw size={14} className="mr-1" /> Retry
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => initiateConnection(d.ip)}
                                                disabled={isConnecting}
                                                isLoading={isConnecting}
                                            >
                                                {isConnecting ? 'Connecting...' : (
                                                    <><Plug size={14} className="mr-1" /> Connect</>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </motion.div>

            {/* ── SECTION C: CONTROLS ── */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-5">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-neutral-300 mb-4 uppercase tracking-wide">
                    Controls
                </h3>

                <div className="space-y-4">
                    {/* Auto-Reconnect + Heartbeat */}
                    <div className="flex flex-wrap items-center gap-4">
                        <Toggle
                            checked={autoReconnect}
                            onChange={setAutoReconnect}
                            label="Auto-Reconnect"
                            description={autoReconnect ? 'Heartbeat active' : 'Manual reconnect only'}
                        />

                        {autoReconnect && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 dark:text-neutral-400">Heartbeat every:</span>
                                <select
                                    value={heartbeatInterval}
                                    onChange={(e) => setHeartbeatInterval(Number(e.target.value))}
                                    className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {HEARTBEAT_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {hostUrl && (
                            <Button variant="outline" size="sm" onClick={handleTestConnection}>
                                <Plug size={14} className="mr-1.5" /> Test Connection
                            </Button>
                        )}
                    </div>

                    {/* Test Result */}
                    <AnimatePresence>
                        {testResult && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className={cn(
                                    'px-4 py-2.5 rounded-xl text-sm flex items-center gap-2',
                                    testResult.status === 'ok' && 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400',
                                    testResult.status === 'slow' && 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
                                    testResult.status === 'fail' && 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'
                                )}>
                                    {testResult.status === 'ok' && <><CheckCircle2 size={16} /> Device reachable — {testResult.ms}ms</>}
                                    {testResult.status === 'slow' && <><AlertTriangle size={16} /> High latency — {testResult.ms}ms. Check WiFi signal.</>}
                                    {testResult.status === 'fail' && <><XCircle size={16} /> No response — device offline or IP changed</>}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-neutral-700">
                        <Button variant="ghost" size="sm" onClick={handleClearCache}>
                            <Trash2 size={14} className="mr-1.5" /> Clear Cache
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDisconnect}
                            disabled={!hostUrl}
                        >
                            <Unplug size={14} className="mr-1.5" /> Disconnect
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowResetConfirm(true)}
                        >
                            <RotateCcw size={14} className="mr-1.5" /> Reset State
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* ── Reset Confirmation ── */}
            <AnimatePresence>
                {showResetConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowResetConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-xl p-6 mx-4 max-w-sm w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                                    <AlertTriangle size={20} className="text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">Reset Connection State?</h3>
                                    <p className="text-xs text-gray-500 dark:text-neutral-400">This cannot be undone</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-neutral-400 mb-5">
                                This will disconnect, clear the cache, wipe the connection log, and reset all discovered devices for <strong>{device.name}</strong>.
                            </p>
                            <div className="flex gap-3">
                                <Button variant="danger" size="sm" className="flex-1" onClick={handleResetState}>
                                    <RotateCcw size={14} className="mr-1.5" /> Reset All
                                </Button>
                                <Button variant="ghost" size="sm" className="flex-1" onClick={() => setShowResetConfirm(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── SECTION D: CONNECTION LOG ── */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wide">
                        Connection Log
                    </h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConnectionLog([])}
                        disabled={connectionLog.length === 0}
                    >
                        Clear Log
                    </Button>
                </div>

                <div
                    ref={logContainerRef}
                    className="max-h-64 overflow-y-auto space-y-0.5 font-mono text-xs"
                >
                    {connectionLog.length === 0 ? (
                        <p className="text-center py-6 text-gray-400 font-sans text-sm">No log entries yet</p>
                    ) : (
                        connectionLog.map((entry, i) => {
                            const LogIcon = LOG_ICONS[entry.type];
                            return (
                                <div
                                    key={i}
                                    className={cn(
                                        'flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors',
                                        entry.detail && 'cursor-pointer'
                                    )}
                                    onClick={() => entry.detail && setExpandedLogId(expandedLogId === i ? null : i)}
                                >
                                    <span className="text-gray-400 shrink-0 w-20">{formatTime(entry.timestamp)}</span>
                                    <LogIcon size={14} className={cn('shrink-0 mt-0.5', LOG_COLORS[entry.type])} />
                                    <div className="flex-1 min-w-0">
                                        <span className={cn('text-gray-700 dark:text-neutral-300', LOG_COLORS[entry.type])}>
                                            {entry.message}
                                        </span>
                                        {entry.detail && (
                                            <span className="ml-1.5 text-gray-400">
                                                {expandedLogId === i ? <ChevronDown size={10} className="inline" /> : <ChevronRight size={10} className="inline" />}
                                            </span>
                                        )}
                                        <AnimatePresence>
                                            {expandedLogId === i && entry.detail && (
                                                <motion.pre
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="mt-1 p-2 bg-gray-100 dark:bg-neutral-900 rounded text-xs text-gray-600 dark:text-neutral-400 overflow-x-auto whitespace-pre-wrap"
                                                >
                                                    {entry.detail}
                                                </motion.pre>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </motion.div>

            {/* ── SECTION E: INLINE ESP32 DASHBOARD (after connected) ── */}
            {hostUrl && connectionStatus === 'connected' && (
                <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Globe size={16} className="text-blue-500" />
                            <span className="text-sm font-mono text-gray-700 dark:text-neutral-300">{hostUrl}/dashboard</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(`${hostUrl}/dashboard`, '_blank')}
                            >
                                <ExternalLink size={14} className="mr-1" /> Open in New Tab
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setIframeVisible(prev => !prev);
                                    if (!iframeVisible) setIframeLoading(true);
                                }}
                            >
                                {iframeVisible ? <EyeOff size={14} className="mr-1" /> : <Eye size={14} className="mr-1" />}
                                {iframeVisible ? 'Hide' : 'Show'} Inline View
                            </Button>
                        </div>
                    </div>

                    {iframeVisible && (
                        <div
                            className="relative w-full rounded-xl overflow-hidden border border-blue-200 dark:border-blue-800 shadow-lg"
                            style={{ height: '520px' }}
                        >
                            {/* Loading overlay while iframe loads */}
                            {iframeLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-neutral-900/80 z-10">
                                    <Loader2 size={24} className="animate-spin text-blue-500" />
                                    <p className="ml-3 text-gray-600 dark:text-neutral-400 text-sm">Loading device dashboard...</p>
                                </div>
                            )}

                            <iframe
                                src={`${hostUrl}/dashboard`}
                                className="w-full h-full border-0"
                                title="ESP32 Live Dashboard"
                                sandbox="allow-scripts allow-same-origin allow-forms"
                                onLoad={() => setIframeLoading(false)}
                                onError={() => {
                                    setIframeLoading(false);
                                    appendLog('error', 'iframe failed to load — device may have rebooted');
                                }}
                            />
                        </div>
                    )}
                </motion.div>
            )}

            {/* ── FOOTER ── */}
            {hostUrl && connectionStatus === 'connected' && (
                <motion.div variants={itemVariants} className="bg-gradient-to-r from-gray-50 to-blue-50/50 dark:from-neutral-800 dark:to-blue-500/5 rounded-2xl border border-gray-200 dark:border-neutral-700 px-5 py-4">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-600 dark:text-neutral-400">
                        <span className="flex items-center gap-1.5">
                            <Globe size={13} className="text-blue-500" />
                            Hosting URL:
                            <span className="font-mono text-gray-900 dark:text-white">{hostUrl}/dashboard</span>
                            <button
                                onClick={() => copyToClipboard(`${hostUrl}/dashboard`)}
                                className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-neutral-700"
                                title="Copy URL"
                            >
                                {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                            </button>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Signal size={13} className="text-blue-500" />
                            Network: <span className="font-medium">{getNetworkInfo()}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Monitor size={13} className="text-blue-500" />
                            Device IP: <span className="font-mono">{hostUrl.replace('http://', '')}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Zap size={13} className={cn(pingMs && pingMs > 300 ? 'text-amber-500' : 'text-green-500')} />
                            Ping: <span className="font-semibold">{pingMs ?? '—'}ms</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Wifi size={13} className="text-green-500" />
                            <span className="font-medium">
                                ✅ Connected · Auto-reconnect {autoReconnect ? 'ON' : 'OFF'}
                                {autoReconnect && ` · Heartbeat: ${heartbeatInterval}s`}
                            </span>
                        </span>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}

// =============================================================================
// HELPER: Get Network Info
// =============================================================================
function getNetworkInfo(): string {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const conn = (navigator as any).connection;
        if (conn?.type) return conn.type;
        if (conn?.effectiveType) return conn.effectiveType;
    } catch {
        // Not supported
    }
    return '(network info unavailable)';
}
