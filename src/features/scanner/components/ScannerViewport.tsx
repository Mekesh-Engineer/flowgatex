// =============================================================================
// ScannerViewport — Camera viewport, crosshair overlay, controls bar
// =============================================================================

import { AnimatePresence, motion } from 'framer-motion';
import {
    Camera,
    CameraOff,
    Flashlight,
    FlashlightOff,
    Keyboard,
    Upload,
    Play,
    StopCircle,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    QrCode,
    RefreshCw,
    RotateCcw,
    ScanLine,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScannerState } from '../types/scanner.types';

interface ScannerViewportProps {
    scannerState: ScannerState;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    flashlightOn: boolean;
    onToggleFlashlight: () => void;
    onStartScanning: () => void;
    onStopScanning: () => void;
    onOpenManual: () => void;
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ScannerViewport({
    scannerState,
    videoRef,
    fileInputRef,
    flashlightOn,
    onToggleFlashlight,
    onStartScanning,
    onStopScanning,
    onOpenManual,
    onImageUpload,
}: ScannerViewportProps) {
    const isActive =
        scannerState === 'scanning' ||
        scannerState === 'processing' ||
        scannerState === 'initializing';

    return (
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
                        (scannerState === 'idle' || scannerState === 'camera_error') &&
                        'scanner-viewport__video--hidden'
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
                <div
                    className={cn(
                        'scanner-viewport__frame',
                        scannerState === 'scanning' && 'scanner-viewport__frame--active'
                    )}
                >
                    <div className="scanner-viewport__corner scanner-viewport__corner--tl" />
                    <div className="scanner-viewport__corner scanner-viewport__corner--tr" />
                    <div className="scanner-viewport__corner scanner-viewport__corner--bl" />
                    <div className="scanner-viewport__corner scanner-viewport__corner--br" />
                    <div className="scanner-viewport__crosshair-h" />
                    <div className="scanner-viewport__crosshair-v" />

                    {scannerState === 'scanning' && (
                        <div className="scanner-viewport__scanline" />
                    )}

                    {scannerState === 'idle' && (
                        <div className="scanner-viewport__idle">
                            <QrCode size={80} strokeWidth={1} />
                            <p>Point camera at a QR code</p>
                            <p className="scanner-viewport__idle-hint">
                                Press Space or click Start to begin
                            </p>
                        </div>
                    )}

                    {scannerState === 'camera_error' && (
                        <div className="scanner-viewport__error">
                            <CameraOff size={64} />
                            <h3>Camera Access Denied</h3>
                            <p>Please check your browser permissions.</p>
                            <div className="scanner-viewport__error-actions">
                                <button
                                    onClick={onStartScanning}
                                    className="scanner-btn scanner-btn--primary"
                                >
                                    <RotateCcw size={16} /> Retry Access
                                </button>
                                <button
                                    onClick={onOpenManual}
                                    className="scanner-btn scanner-btn--secondary"
                                >
                                    <Keyboard size={16} /> Manual Entry
                                </button>
                            </div>
                        </div>
                    )}

                    {scannerState === 'valid' && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="scanner-viewport__success-icon"
                        >
                            <CheckCircle2 size={80} />
                        </motion.div>
                    )}

                    {scannerState === 'invalid' && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="scanner-viewport__invalid-icon"
                        >
                            <XCircle size={80} />
                        </motion.div>
                    )}
                </div>

                {/* Camera feed status */}
                <div className="scanner-viewport__status">
                    <div
                        className={cn(
                            'scanner-viewport__dot',
                            scannerState !== 'idle' &&
                            scannerState !== 'camera_error' &&
                            'scanner-viewport__dot--active'
                        )}
                    />
                    <span>
                        Camera:{' '}
                        {scannerState !== 'idle' && scannerState !== 'camera_error'
                            ? 'Active'
                            : 'Standby'}
                    </span>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="scanner-controls">
                <div className="scanner-controls__secondary">
                    <button
                        onClick={onToggleFlashlight}
                        className={cn(
                            'scanner-control-btn',
                            flashlightOn && 'scanner-control-btn--active'
                        )}
                        title="Flashlight (F)"
                        aria-label="Toggle flashlight"
                    >
                        {flashlightOn ? <Flashlight size={20} /> : <FlashlightOff size={20} />}
                    </button>
                    <button
                        className="scanner-control-btn"
                        title="Switch Camera (C)"
                        aria-label="Switch camera"
                    >
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
                        onClick={onOpenManual}
                        className="scanner-control-btn"
                        title="Manual Entry (M)"
                        aria-label="Manual entry"
                    >
                        <Keyboard size={20} />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={onImageUpload}
                    />
                </div>

                {isActive ? (
                    <button
                        onClick={onStopScanning}
                        className="scanner-btn scanner-btn--danger scanner-btn--lg"
                    >
                        <StopCircle size={20} /> Stop Scanning
                    </button>
                ) : (
                    <button
                        onClick={onStartScanning}
                        className="scanner-btn scanner-btn--primary scanner-btn--lg"
                    >
                        <Play size={20} /> Start Scanning
                    </button>
                )}
            </div>
        </section>
    );
}
