// =============================================================================
// Ai_heatmap.tsx — ESP32-CAM AI People Detection & Heatmap Dashboard
// =============================================================================
// Real-time crowd density visualization.
// Polls GET /heatmap from ESP32-CAM, renders 8×10 heat grid on canvas,
// SVG bounding-box overlay for raw detection view, controls for sensitivity
// and export. Uses WebSocket when available, falls back to HTTP polling.
// =============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Flame,
    Eye,
    Video,
    RefreshCw,
    Download,
    Pause,
    Play,
    Settings2,
    Activity,
    Users,
    TrendingUp,
    Wifi,
    WifiOff,
    ChevronDown,
    Cpu,
    Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';

// =============================================================================
// TYPES
// =============================================================================

interface AiHeatmapProps {
    deviceId: string;
    esp32Url: string | null;
    sensitivity?: 'low' | 'medium' | 'high';
    onTabSwitch?: (tab: string) => void;
}

interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
    class?: string;
}

interface ZoneSummary {
    zone_a: number;
    zone_b: number;
    zone_c: number;
    peak: number;
}

interface HeatmapResponse {
    timestamp: string;
    total_detected: number;
    inference_ms: number;
    model: string;
    confidence_threshold: number;
    zones: Array<{ row: number; col: number; count: number }>;
    predictions: Array<{
        x: number;
        y: number;
        w: number;
        h: number;
        confidence: number;
        class?: string;
    }>;
    zone_summary: ZoneSummary;
}

type ViewMode = 'heatmap' | 'rawdetection' | 'livestream';
type Sensitivity = 'low' | 'medium' | 'high';
type ConnectionState = 'connected' | 'slow' | 'reconnecting' | 'disconnected' | 'no-device';

// =============================================================================
// CONSTANTS
// =============================================================================

const ROWS = 8;
const COLS = 10;
const DEFAULT_REFRESH_MS = 3000;
const emptyGrid = (): number[][] => Array.from({ length: ROWS }, () => Array(COLS).fill(0) as number[]);

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 22 } },
};

// =============================================================================
// HEAT COLOR SCALE
// =============================================================================

const heatColor = (value: number, max: number): string => {
    const t = Math.min(value / Math.max(max, 1), 1);
    if (t === 0) return 'rgba(15, 23, 42, 0)';
    if (t < 0.2) return `rgba(0, 200, 255, ${(0.15 + t * 1.5).toFixed(3)})`;
    if (t < 0.4) return `rgba(0, 255, 120, ${(0.3 + t).toFixed(3)})`;
    if (t < 0.6) return `rgba(255, 220, 0, ${(0.5 + t * 0.7).toFixed(3)})`;
    if (t < 0.8) return `rgba(255, 120, 0, ${(0.65 + t * 0.4).toFixed(3)})`;
    return `rgba(255, 40, 40, ${(0.8 + t * 0.2).toFixed(3)})`;
};

// =============================================================================
// CANVAS DRAWING
// =============================================================================

const drawHeatmap = (
    canvas: HTMLCanvasElement,
    grid: number[][],
    prevGrid: number[][],
    animProgress: number,
) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cw = canvas.width / COLS;
    const ch = canvas.height / ROWS;
    const maxVal = Math.max(...grid.flat(), 1);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#0a0e17');
    bgGrad.addColorStop(1, '#0f1729');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = 'rgba(0, 220, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * cw, 0);
        ctx.lineTo(c * cw, canvas.height);
        ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * ch);
        ctx.lineTo(canvas.width, r * ch);
        ctx.stroke();
    }

    // Heat cells — interpolated
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const prev = prevGrid[r]?.[c] ?? 0;
            const curr = grid[r][c];
            const value = prev + (curr - prev) * animProgress;

            if (value < 0.1) continue;

            const x = c * cw;
            const y = r * ch;
            const cx = x + cw / 2;
            const cy = y + ch / 2;

            const radius = Math.max(cw, ch) * 0.85;
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
            grad.addColorStop(0, heatColor(value, maxVal));
            grad.addColorStop(1, 'transparent');

            ctx.fillStyle = grad;
            ctx.fillRect(x - cw * 0.4, y - ch * 0.4, cw * 1.8, ch * 1.8);

            // Count label
            if (curr > 0) {
                ctx.fillStyle = curr > maxVal * 0.5 ? '#ffffff' : 'rgba(255,255,255,0.5)';
                ctx.font = `bold ${Math.max(11, cw * 0.3)}px 'JetBrains Mono', monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(String(curr), cx, cy);
            }
        }
    }

    // Center overlay — total count
    const total = grid.flat().reduce((a, b) => a + b, 0);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.floor(canvas.width * 0.1)}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(total), canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = `${Math.floor(canvas.width * 0.035)}px sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText('DETECTED', canvas.width / 2, canvas.height / 2 + 28);
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/** Connection status indicator */
const ConnectionStatus: React.FC<{
    state: ConnectionState;
    inferenceMs: number | null;
}> = ({ state, inferenceMs }) => {
    const config: Record<ConnectionState, { color: string; label: string; dot: string; pulse: boolean }> = {
        connected: { color: 'text-emerald-400', label: 'CONNECTED', dot: 'bg-emerald-400', pulse: true },
        slow: { color: 'text-yellow-400', label: 'SLOW', dot: 'bg-yellow-400', pulse: true },
        reconnecting: { color: 'text-blue-400', label: 'RECONNECTING...', dot: 'bg-blue-400', pulse: true },
        disconnected: { color: 'text-red-400', label: 'DISCONNECTED', dot: 'bg-red-500', pulse: false },
        'no-device': { color: 'text-gray-400', label: 'CONNECT DEVICE FIRST', dot: 'bg-gray-500', pulse: false },
    };
    const c = config[state];
    return (
        <span className={cn('text-xs font-mono flex items-center gap-1.5', c.color)}>
            <span className={cn('inline-block w-2 h-2 rounded-full', c.dot, c.pulse && 'animate-pulse')} />
            {c.label}
            {inferenceMs !== null && state === 'connected' && (
                <span className="text-gray-500"> · {inferenceMs}ms</span>
            )}
        </span>
    );
};

/** SVG bounding box overlay for Raw Detection view */
const DetectionOverlay: React.FC<{ boxes: BoundingBox[] }> = ({ boxes }) => (
    <div
        className="relative w-full rounded-xl overflow-hidden"
        style={{ minHeight: 380, background: '#050810' }}
    >
        {/* Scanline texture */}
        <div
            className="absolute inset-0 pointer-events-none"
            style={{
                background:
                    'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,100,0.012) 4px)',
                zIndex: 1,
            }}
        />

        {/* Bounding boxes */}
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 2 }}>
            {boxes.map((box, i) => {
                const left = box.x - box.width / 2;
                const top = box.y - box.height / 2;
                const confColor =
                    box.confidence > 0.8 ? '#00ff88' : box.confidence > 0.6 ? '#fbbf24' : '#f87171';
                return (
                    <g key={i}>
                        <rect
                            x={`${left}%`}
                            y={`${top}%`}
                            width={`${box.width}%`}
                            height={`${box.height}%`}
                            fill="none"
                            stroke={confColor}
                            strokeWidth="1.5"
                            style={{ filter: `drop-shadow(0 0 4px ${confColor}80)` }}
                        />
                        {/* Confidence label */}
                        <foreignObject x={`${left}%`} y={`${Math.max(top - 5, 0)}%`} width="80" height="20">
                            <div
                                style={{
                                    background: confColor,
                                    color: '#000',
                                    fontSize: '9px',
                                    fontWeight: 800,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    padding: '1px 5px',
                                    borderRadius: '2px 2px 2px 0',
                                    whiteSpace: 'nowrap',
                                    display: 'inline-block',
                                }}
                            >
                                PERSON {(box.confidence * 100).toFixed(0)}%
                            </div>
                        </foreignObject>
                    </g>
                );
            })}
        </svg>

        {/* No detections state */}
        {boxes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 3 }}>
                <div className="text-center">
                    <div className="text-5xl mb-3 opacity-40">👁</div>
                    <p className="text-emerald-400 font-mono text-sm">SCANNING...</p>
                    <p className="text-gray-500 text-xs mt-1">No persons detected in frame</p>
                </div>
            </div>
        )}
    </div>
);

/** Live MJPEG stream view */
const LiveStreamView: React.FC<{ esp32Url: string; connected: boolean }> = ({ esp32Url, connected }) => {
    const [streamError, setStreamError] = useState(false);
    const streamSrc = `${esp32Url}/stream`;

    return (
        <div
            className="relative w-full rounded-xl overflow-hidden"
            style={{ minHeight: 380, background: '#050810' }}
        >
            {/* Live indicator */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1">
                <span className={cn(
                    'w-2 h-2 rounded-full',
                    connected && !streamError ? 'bg-red-500 animate-pulse' : 'bg-gray-500'
                )} />
                <span className="text-[10px] font-mono text-white uppercase tracking-wide">
                    {connected && !streamError ? 'LIVE' : 'OFFLINE'}
                </span>
            </div>

            {connected && !streamError ? (
                <img
                    src={streamSrc}
                    alt="ESP32-CAM Live Stream"
                    className="w-full h-auto rounded-xl"
                    style={{ minHeight: 340, objectFit: 'contain', background: '#000' }}
                    onError={() => setStreamError(true)}
                />
            ) : (
                <div className="flex flex-col items-center justify-center h-80 text-center">
                    <div className="text-5xl mb-3 opacity-30">📹</div>
                    <p className="text-gray-400 font-mono text-sm">
                        {streamError ? 'Stream disconnected' : 'Camera offline'}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                        {streamError
                            ? 'Check ESP32-CAM connection and try again'
                            : 'Connect to the ESP32-CAM device to view live feed'}
                    </p>
                    {streamError && (
                        <button
                            onClick={() => setStreamError(false)}
                            className="mt-3 px-4 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 text-xs font-medium hover:bg-blue-600/30 transition-colors"
                        >
                            Retry Stream
                        </button>
                    )}
                </div>
            )}

            {/* Scanline overlay */}
            <div
                className="absolute inset-0 pointer-events-none rounded-xl"
                style={{
                    background:
                        'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,100,0.006) 4px)',
                    zIndex: 1,
                }}
            />
        </div>
    );
};

/** Color legend bar */
const HeatmapLegend: React.FC = () => (
    <div className="flex items-center justify-center gap-3 py-2 text-[10px] font-mono text-gray-400">
        {[
            { color: 'bg-cyan-400/70', label: '0–2' },
            { color: 'bg-green-400/70', label: '3–5' },
            { color: 'bg-yellow-400/80', label: '6–8' },
            { color: 'bg-orange-400/80', label: '9–11' },
            { color: 'bg-red-500/90', label: '12+' },
        ].map((l) => (
            <span key={l.label} className="flex items-center gap-1">
                <span className={cn('w-3 h-3 rounded-sm', l.color)} />
                {l.label}
            </span>
        ))}
    </div>
);

/** Stats card */
const StatCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: number | string;
    sub?: string;
    accent?: string;
}> = ({ icon, label, value, sub, accent = 'text-cyan-400' }) => (
    <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-4 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-wide">
            {icon}
            {label}
        </div>
        <div className={cn('text-2xl font-bold font-mono', accent)}>{value}</div>
        {sub && <div className="text-[10px] text-gray-500">{sub}</div>}
    </div>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function AiHeatmap({
    deviceId,
    esp32Url,
    sensitivity: initialSensitivity = 'medium',
    onTabSwitch,
}: AiHeatmapProps) {
    // ── State ──
    const [viewMode, setViewMode] = useState<ViewMode>('heatmap');
    const [heatmapGrid, setHeatmapGrid] = useState<number[][]>(emptyGrid);
    const [prevGrid, setPrevGrid] = useState<number[][]>(emptyGrid);
    const [predictions, setPredictions] = useState<BoundingBox[]>([]);
    const [totalDetected, setTotalDetected] = useState(0);
    const [zoneSummary, setZoneSummary] = useState<ZoneSummary>({
        zone_a: 0,
        zone_b: 0,
        zone_c: 0,
        peak: 0,
    });
    const [peakTime, setPeakTime] = useState<string | null>(null);
    const [inferenceMs, setInferenceMs] = useState<number | null>(null);
    const [modelName, setModelName] = useState('YOLOv8-Nano');
    const [connected, setConnected] = useState(false);
    const [consecutiveFails, setConsecutiveFails] = useState(0);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [sensitivity, setSensitivity] = useState<Sensitivity>(initialSensitivity);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [refreshInterval] = useState(DEFAULT_REFRESH_MS);
    const [isExporting, setIsExporting] = useState(false);
    const [isRescanning, setIsRescanning] = useState(false);
    const [sensitivityOpen, setSensitivityOpen] = useState(false);

    // ── Refs ──
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animFrameRef = useRef<number | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const heatmapGridRef = useRef(heatmapGrid);

    // Keep ref in sync
    useEffect(() => {
        heatmapGridRef.current = heatmapGrid;
    }, [heatmapGrid]);

    // ── Derived ──
    const connectionState: ConnectionState = !esp32Url
        ? 'no-device'
        : !connected
            ? consecutiveFails >= 3
                ? 'disconnected'
                : consecutiveFails >= 2
                    ? 'reconnecting'
                    : consecutiveFails === 1
                        ? 'slow'
                        : 'disconnected'
            : inferenceMs && inferenceMs > 1000
                ? 'slow'
                : 'connected';

    // ── Update heatmap data + trigger animation ──
    const updateHeatmap = useCallback(
        (data: HeatmapResponse) => {
            // Use ref to get latest grid without triggering effect re-run
            const currentGrid = heatmapGridRef.current;
            setPrevGrid(currentGrid);
            if (z.row >= 0 && z.row < ROWS && z.col >= 0 && z.col < COLS) {
                newGrid[z.row][z.col] = z.count;
            }
        }
            setHeatmapGrid(newGrid);

    // Map predictions
    const boxes: BoundingBox[] = (data.predictions || []).map((p) => ({
        x: p.x,
        y: p.y,
        width: p.w,
        height: p.h,
        confidence: p.confidence,
        class: p.class,
    }));
    setPredictions(boxes);

    setTotalDetected(data.total_detected);
    setZoneSummary(data.zone_summary);
    setInferenceMs(data.inference_ms);
    if (data.model) setModelName(data.model);
    setLastUpdated(new Date());

    // Track peak time
    if (data.total_detected > (zoneSummary.peak || 0)) {
        setPeakTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    }
},
[zoneSummary.peak],
    );

// ── Canvas animation loop ──
useEffect(() => {
    if (viewMode !== 'heatmap' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const duration = 400;
    const start = performance.now();

    const frame = (timestamp: number) => {
        const progress = Math.min((timestamp - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        drawHeatmap(canvas, heatmapGrid, prevGrid, eased);
        if (progress < 1) {
            animFrameRef.current = requestAnimationFrame(frame);
        }
    };

    animFrameRef.current = requestAnimationFrame(frame);

    return () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
}, [heatmapGrid, prevGrid, viewMode]);

// ── Data fetching: WebSocket + HTTP polling ──
useEffect(() => {
    if (!esp32Url || !autoRefresh) return;

    let wsConnected = false;

    // Strategy 1: WebSocket
    try {
        const hostname = new URL(esp32Url).hostname;
        const ws = new WebSocket(`ws://${hostname}:81`);
        wsRef.current = ws;

        ws.onopen = () => {
            wsConnected = true;
            setConnected(true);
            setConsecutiveFails(0);
            setConnectionError(null);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // The WebSocket may send sensor data or heatmap data
                if (data.zones || data.total_detected !== undefined) {
                    updateHeatmap(data as HeatmapResponse);
                    setConnected(true);
                    setConsecutiveFails(0);
                }
            } catch {
                // Invalid JSON — ignore
            }
        };

        ws.onerror = () => {
            wsConnected = false;
            startPolling();
        };

        ws.onclose = () => {
            wsConnected = false;
            startPolling();
        };
    } catch {
        startPolling();
    }

    // Strategy 2: HTTP polling fallback
    function startPolling() {
        if (wsConnected || pollRef.current) return;

        pollRef.current = setInterval(async () => {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 5000);

                const res = await fetch(`${esp32Url}/heatmap`, {
                    signal: controller.signal,
                    cache: 'no-store',
                });
                clearTimeout(timeout);

                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data: HeatmapResponse = await res.json();

                updateHeatmap(data);
                setConsecutiveFails(0);
                setConnected(true);
                setConnectionError(null);
            } catch {
                setConsecutiveFails((prev) => {
                    const next = prev + 1;
                    if (next >= 3) {
                        setConnected(false);
                        setConnectionError('Device unreachable — check network');
                    }
                    return next;
                });
            }
        }, refreshInterval);
    }

    // If WS doesn't connect within 3s, start polling
    const wsFallbackTimer = setTimeout(() => {
        if (!wsConnected) startPolling();
    }, 3000);

    return () => {
        clearTimeout(wsFallbackTimer);
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [esp32Url, autoRefresh, refreshInterval]);

// ── Controls ──
const handleSensitivityChange = useCallback(
    async (level: Sensitivity) => {
        setSensitivity(level);
        setSensitivityOpen(false);
        if (!esp32Url) return;
        try {
            await fetch(`${esp32Url}/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sensitivity: level }),
            });
        } catch {
            console.warn('Sensitivity update failed — ESP32 unreachable');
        }
    },
    [esp32Url],
);

const handleRescan = useCallback(async () => {
    if (!esp32Url) return;
    setIsRescanning(true);
    try {
        const res = await fetch(`${esp32Url}/heatmap?force=true`, { cache: 'no-store' });
        if (res.ok) {
            const data: HeatmapResponse = await res.json();
            updateHeatmap(data);
        }
    } catch {
        // Rescan failed
    } finally {
        setIsRescanning(false);
    }
}, [esp32Url, updateHeatmap]);

const handleExport = useCallback(async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        // Add watermark
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(0, canvas.height - 28, canvas.width, 28);
        ctx.fillStyle = '#00ff88';
        ctx.font = '11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(
            `FlowGateX · ${new Date().toLocaleString()} · Detected: ${totalDetected}`,
            10,
            canvas.height - 10,
        );
        ctx.restore();
    }

    const link = document.createElement('a');
    link.download = `heatmap_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    // Re-draw clean heatmap after export
    drawHeatmap(canvas, heatmapGrid, prevGrid, 1);
    setIsExporting(false);
}, [totalDetected, heatmapGrid, prevGrid]);

// =========================================================================
// NO DEVICE CONNECTED — EMPTY STATE
// =========================================================================

if (!esp32Url) {
    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center justify-center py-24 gap-6 text-center"
        >
            <div className="text-7xl opacity-25">📡</div>
            <div>
                <h3 className="text-white font-semibold text-lg mb-2">No Device Connected</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto">
                    Connect to an ESP32-CAM device first using the Device Connect tab, then return here to
                    view live heatmap data.
                </p>
            </div>
            {onTabSwitch && (
                <Button variant="primary" size="sm" onClick={() => onTabSwitch('connect')}>
                    Go to Device Connect →
                </Button>
            )}
        </motion.div>
    );
}

// =========================================================================
// MAIN RENDER
// =========================================================================

return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
        {/* ── HEADER ── */}
        <motion.div
            variants={itemVariants}
            className="bg-neutral-800/70 border border-neutral-700/50 rounded-2xl p-5"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <Flame size={20} className="text-orange-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            AI Heatmap — People Count
                            <Badge variant="info" className="text-[10px] font-mono">
                                LIVE
                            </Badge>
                        </h2>
                        <p className="text-xs text-gray-500">
                            Device: {deviceId} · Model: {modelName} ·{' '}
                            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Waiting for data...'}
                        </p>
                    </div>
                </div>
                <ConnectionStatus state={connectionState} inferenceMs={inferenceMs} />
            </div>

            {/* Connection error banner */}
            {connectionError && (
                <div className="mt-3 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                    <WifiOff size={14} />
                    {connectionError}
                </div>
            )}
        </motion.div>

        {/* ── VIEW TOGGLE ── */}
        <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
            <button
                onClick={() => setViewMode('heatmap')}
                className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    viewMode === 'heatmap'
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        : 'bg-neutral-800/50 text-gray-400 border border-neutral-700/50 hover:text-white',
                )}
            >
                <Flame size={15} />
                Heatmap View
            </button>
            <button
                onClick={() => setViewMode('rawdetection')}
                className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    viewMode === 'rawdetection'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-neutral-800/50 text-gray-400 border border-neutral-700/50 hover:text-white',
                )}
            >
                <Eye size={15} />
                Raw Detection
            </button>
            <button
                onClick={() => setViewMode('livestream')}
                className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    viewMode === 'livestream'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-neutral-800/50 text-gray-400 border border-neutral-700/50 hover:text-white',
                )}
            >
                <Video size={15} />
                Live Camera
            </button>
        </motion.div>

        {/* ── MAIN CANVAS / DETECTION VIEW ── */}
        <motion.div
            variants={itemVariants}
            className="bg-neutral-800/70 border border-neutral-700/50 rounded-2xl p-4 overflow-hidden"
        >
            {viewMode === 'heatmap' ? (
                <>
                    <canvas
                        ref={canvasRef}
                        width={800}
                        height={480}
                        className="w-full rounded-xl"
                        style={{ imageRendering: 'auto', background: '#0a0e17' }}
                    />
                    <HeatmapLegend />
                </>
            ) : viewMode === 'rawdetection' ? (
                <DetectionOverlay boxes={predictions} />
            ) : (
                <LiveStreamView esp32Url={esp32Url} connected={connected} />
            )}
        </motion.div>

        {/* ── CONTROLS PANEL ── */}
        <motion.div
            variants={itemVariants}
            className="bg-neutral-800/70 border border-neutral-700/50 rounded-2xl p-4"
        >
            <div className="flex flex-wrap items-center gap-3">
                {/* Rescan */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRescan}
                    disabled={isRescanning}
                    isLoading={isRescanning}
                >
                    <RefreshCw size={14} className={cn('mr-1.5', isRescanning && 'animate-spin')} />
                    Rescan
                </Button>

                {/* Sensitivity dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setSensitivityOpen(!sensitivityOpen)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-neutral-700/50 border border-neutral-600/50 text-gray-300 hover:text-white transition-colors"
                    >
                        <Settings2 size={14} />
                        Sensitivity:{' '}
                        <span className="capitalize text-white">{sensitivity}</span>
                        <ChevronDown size={14} />
                    </button>
                    {sensitivityOpen && (
                        <div className="absolute top-full mt-1 left-0 z-20 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl overflow-hidden min-w-[140px]">
                            {(['low', 'medium', 'high'] as Sensitivity[]).map((level) => (
                                <button
                                    key={level}
                                    onClick={() => handleSensitivityChange(level)}
                                    className={cn(
                                        'w-full text-left px-4 py-2 text-sm hover:bg-neutral-700 transition-colors capitalize',
                                        sensitivity === level ? 'text-cyan-400 bg-neutral-700/50' : 'text-gray-300',
                                    )}
                                >
                                    {level}
                                    <span className="text-[10px] text-gray-500 ml-2">
                                        {level === 'low' ? '0.30' : level === 'medium' ? '0.50' : '0.70'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Export PNG */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    disabled={isExporting || viewMode !== 'heatmap'}
                    isLoading={isExporting}
                >
                    <Download size={14} className="mr-1.5" />
                    Export PNG
                </Button>

                {/* Auto-refresh toggle */}
                <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-gray-400">Auto-refresh:</span>
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                            autoRefresh
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-neutral-700/50 text-gray-400 border border-neutral-600/50',
                        )}
                    >
                        {autoRefresh ? <Play size={12} /> : <Pause size={12} />}
                        {autoRefresh ? `ON (${refreshInterval / 1000}s)` : 'PAUSED'}
                    </button>
                </div>
            </div>
        </motion.div>

        {/* ── STATS BAR ── */}
        <motion.div variants={itemVariants}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                    icon={<Users size={14} />}
                    label="Zone A (Left)"
                    value={zoneSummary.zone_a}
                    accent="text-cyan-400"
                />
                <StatCard
                    icon={<Activity size={14} />}
                    label="Zone B (Center)"
                    value={zoneSummary.zone_b}
                    accent="text-emerald-400"
                />
                <StatCard
                    icon={<Users size={14} />}
                    label="Zone C (Right)"
                    value={zoneSummary.zone_c}
                    accent="text-purple-400"
                />
                <StatCard
                    icon={<TrendingUp size={14} />}
                    label="Peak Today"
                    value={zoneSummary.peak}
                    sub={peakTime ? `at ${peakTime}` : undefined}
                    accent="text-orange-400"
                />
            </div>
        </motion.div>

        {/* ── FOOTER ── */}
        <motion.div
            variants={itemVariants}
            className="bg-neutral-800/40 border border-neutral-700/30 rounded-xl px-4 py-3"
        >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500 font-mono">
                <span className="flex items-center gap-1">
                    <Cpu size={12} /> Device: {deviceId}
                </span>
                <span className="flex items-center gap-1">
                    <Zap size={12} /> Model: {modelName}
                </span>
                <span className="flex items-center gap-1">
                    <Wifi size={12} /> Inference: {inferenceMs ?? '—'}ms
                </span>
                <span className="flex items-center gap-1">
                    <Activity size={12} /> Fails: {consecutiveFails}
                </span>
                {lastUpdated && (
                    <span className="ml-auto">Last Updated: {lastUpdated.toLocaleTimeString()}</span>
                )}
            </div>
        </motion.div>
    </motion.div>
);
}
