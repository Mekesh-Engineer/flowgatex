// =============================================================================
// ScannerModals — Manual entry, override, settings, history drawer,
//                 mobile controls, mobile validation overlay
// =============================================================================

import { AnimatePresence, motion } from 'framer-motion';
import {
    CheckCircle2,
    XCircle,
    AlertTriangle,
    ClipboardList,
    Flashlight,
    FlashlightOff,
    Camera,
    Keyboard,
    Settings,
    Play,
    StopCircle,
    Search,
    Unlock,
    X,
    WifiOff,
    FileSpreadsheet,
    FileJson,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Modal from '@/components/common/Modal';
import Toggle from '@/components/common/Toggle';
import { sanitizeTicketId, relativeTime } from '../utils/scanner.utils';
import { OVERRIDE_CATEGORIES } from '../constants/scanner.constants';
import type { ScannerState, ScanResult, ScannerSettings } from '../types/scanner.types';
import type { IoTDevice } from '@/features/iot/types/iot.types';

// ─── Mobile Stats Bar ───────────────────────────────────────────────────────

interface MobileStatsBarProps {
    total: number;
    capacity: number;
    valid: number;
    invalid: number;
    duplicates: number;
    isOnline: boolean;
}

export function MobileStatsBar({
    total,
    capacity,
    valid,
    invalid,
    duplicates,
    isOnline,
}: MobileStatsBarProps) {
    return (
        <div className="scanner-mobile-stats">
            <span>
                {total}/{capacity}
            </span>
            <span className="scanner-mobile-stats__valid">
                <CheckCircle2 size={12} /> {valid}
            </span>
            <span className="scanner-mobile-stats__invalid">
                <XCircle size={12} /> {invalid}
            </span>
            <span className="scanner-mobile-stats__dup">
                <AlertTriangle size={12} /> {duplicates}
            </span>
            {!isOnline && (
                <span className="scanner-mobile-stats__offline">
                    <WifiOff size={12} /> Offline
                </span>
            )}
        </div>
    );
}

// ─── Mobile Bottom Controls ─────────────────────────────────────────────────

interface MobileControlsProps {
    scannerState: ScannerState;
    flashlightOn: boolean;
    onToggleFlashlight: () => void;
    onStartScanning: () => void;
    onStopScanning: () => void;
    onOpenManual: () => void;
    onOpenSettings: () => void;
    onOpenHistory: () => void;
}

export function MobileControls({
    scannerState,
    flashlightOn,
    onToggleFlashlight,
    onStartScanning,
    onStopScanning,
    onOpenManual,
    onOpenSettings,
    onOpenHistory,
}: MobileControlsProps) {
    const isActive =
        scannerState === 'scanning' || scannerState === 'processing';

    return (
        <div className="scanner-mobile-controls">
            <button
                onClick={onToggleFlashlight}
                className={cn(
                    'scanner-mobile-ctrl-btn',
                    flashlightOn && 'scanner-mobile-ctrl-btn--active'
                )}
            >
                {flashlightOn ? <Flashlight size={20} /> : <FlashlightOff size={20} />}
            </button>
            <button className="scanner-mobile-ctrl-btn">
                <Camera size={20} />
            </button>
            <button
                onClick={isActive ? onStopScanning : onStartScanning}
                className="scanner-mobile-ctrl-btn scanner-mobile-ctrl-btn--primary"
            >
                {isActive ? <StopCircle size={24} /> : <Play size={24} />}
            </button>
            <button onClick={onOpenManual} className="scanner-mobile-ctrl-btn">
                <Keyboard size={20} />
            </button>
            <button onClick={onOpenSettings} className="scanner-mobile-ctrl-btn">
                <Settings size={20} />
            </button>
            <button onClick={onOpenHistory} className="scanner-mobile-ctrl-btn">
                <ClipboardList size={20} />
            </button>
        </div>
    );
}

// ─── Mobile Validation Overlay ──────────────────────────────────────────────

interface MobileValidationOverlayProps {
    scannerState: ScannerState;
    currentScan: ScanResult | null;
    onOpenOverride: () => void;
}

export function MobileValidationOverlay({
    scannerState,
    currentScan,
    onOpenOverride,
}: MobileValidationOverlayProps) {
    const showOverlay =
        (scannerState === 'valid' ||
            scannerState === 'invalid' ||
            scannerState === 'duplicate') &&
        currentScan;

    return (
        <AnimatePresence>
            {showOverlay && (
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
                            currentScan!.status === 'valid' &&
                            'scanner-mobile-overlay__header--valid',
                            currentScan!.status === 'invalid' &&
                            'scanner-mobile-overlay__header--invalid',
                            currentScan!.status === 'duplicate' &&
                            'scanner-mobile-overlay__header--duplicate'
                        )}
                    >
                        {currentScan!.status === 'valid' && (
                            <>
                                <CheckCircle2 size={24} /> Valid Ticket
                            </>
                        )}
                        {currentScan!.status === 'invalid' && (
                            <>
                                <XCircle size={24} /> Invalid
                            </>
                        )}
                        {currentScan!.status === 'duplicate' && (
                            <>
                                <AlertTriangle size={24} /> Already Used
                            </>
                        )}
                    </div>
                    <div className="scanner-mobile-overlay__body">
                        <h3>{currentScan!.name}</h3>
                        <p>
                            {currentScan!.tier} • {currentScan!.ticketId}
                        </p>
                        {currentScan!.message && (
                            <p className="scanner-mobile-overlay__msg">
                                {currentScan!.message}
                            </p>
                        )}
                        {currentScan!.status === 'duplicate' && (
                            <button
                                onClick={onOpenOverride}
                                className="scanner-btn scanner-btn--override scanner-btn--full"
                            >
                                <Unlock size={16} /> Override
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ─── Manual Entry Modal ─────────────────────────────────────────────────────

interface ManualEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticketId: string;
    onTicketIdChange: (v: string) => void;
    onSubmit: (e: React.FormEvent) => void;
}

export function ManualEntryModal({
    isOpen,
    onClose,
    ticketId,
    onTicketIdChange,
    onSubmit,
}: ManualEntryModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Manual Ticket Entry"
            size="sm"
        >
            <form onSubmit={onSubmit} className="scanner-manual-form">
                <div className="scanner-manual-form__field">
                    <label>Ticket ID</label>
                    <input
                        type="text"
                        autoFocus
                        placeholder="e.g. TC-12345"
                        value={ticketId}
                        onChange={(e) => onTicketIdChange(sanitizeTicketId(e.target.value))}
                        className="scanner-manual-form__input"
                        maxLength={50}
                    />
                    <p className="scanner-manual-form__hint">
                        Enter the alphanumeric code printed below the QR code.
                    </p>
                </div>
                <div className="scanner-manual-form__actions">
                    <button
                        type="button"
                        onClick={onClose}
                        className="scanner-btn scanner-btn--secondary"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!ticketId.trim()}
                        className="scanner-btn scanner-btn--primary"
                    >
                        <CheckCircle2 size={16} /> Check In
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ─── Override Modal ─────────────────────────────────────────────────────────

interface OverrideModalProps {
    isOpen: boolean;
    onClose: () => void;
    attendeeName: string;
    category: string;
    onCategoryChange: (v: string) => void;
    reason: string;
    onReasonChange: (v: string) => void;
    onSubmit: () => void;
}

export function OverrideModal({
    isOpen,
    onClose,
    attendeeName,
    category,
    onCategoryChange,
    reason,
    onReasonChange,
    onSubmit,
}: OverrideModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Override Check-In"
            size="sm"
        >
            <div className="scanner-override-form">
                <p className="scanner-override-form__desc">
                    Why are you allowing re-entry for <strong>{attendeeName}</strong>?
                </p>
                <div className="scanner-override-form__field">
                    <label>Reason Category</label>
                    <select
                        value={category}
                        onChange={(e) => onCategoryChange(e.target.value)}
                        className="scanner-override-form__select"
                    >
                        {OVERRIDE_CATEGORIES.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                                {cat.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="scanner-override-form__field">
                    <label>Additional Notes</label>
                    <textarea
                        value={reason}
                        onChange={(e) => onReasonChange(e.target.value)}
                        placeholder="Provide additional context (min 5 characters)..."
                        className="scanner-override-form__textarea"
                        rows={3}
                        maxLength={500}
                    />
                </div>
                <div className="scanner-override-form__actions">
                    <button
                        onClick={onClose}
                        className="scanner-btn scanner-btn--secondary"
                    >
                        <XCircle size={16} /> Reject Entry
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={!reason.trim() || reason.trim().length < 5}
                        className="scanner-btn scanner-btn--primary"
                    >
                        <Unlock size={16} /> Allow Re-Entry
                    </button>
                </div>
            </div>
        </Modal>
    );
}

// ─── Settings Modal ─────────────────────────────────────────────────────────

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: ScannerSettings;
    onSettingsChange: (patch: Partial<ScannerSettings>) => void;
    iotDevices: IoTDevice[];
    onExport: (format: 'csv' | 'json' | 'pdf') => void;
}

export function SettingsModal({
    isOpen,
    onClose,
    settings,
    onSettingsChange,
    iotDevices,
    onExport,
}: SettingsModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Scanner Settings"
            size="md"
        >
            <div className="scanner-settings-modal">
                <div className="scanner-settings-modal__toggles">
                    <Toggle
                        checked={settings.continuousScan}
                        onChange={(v) => onSettingsChange({ continuousScan: v })}
                        label="Continuous Scan"
                        description="Auto-scan next ticket after validation"
                    />
                    <Toggle
                        checked={settings.soundEnabled}
                        onChange={(v) => onSettingsChange({ soundEnabled: v })}
                        label="Sound Feedback"
                        description="Play audio on scan result"
                    />
                    <Toggle
                        checked={settings.vibrationEnabled}
                        onChange={(v) => onSettingsChange({ vibrationEnabled: v })}
                        label="Haptic Feedback"
                        description="Vibrate on scan result"
                    />
                    <Toggle
                        checked={settings.autoSave}
                        onChange={(v) => onSettingsChange({ autoSave: v })}
                        label="Auto-Save Scans"
                        description="Save scan history to local storage"
                    />
                    <Toggle
                        checked={settings.showSystemLog}
                        onChange={(v) => onSettingsChange({ showSystemLog: v })}
                        label="System Log"
                        description="Show technical debug output"
                    />
                </div>

                <div className="scanner-settings-modal__section">
                    <h4>IoT Devices</h4>
                    {iotDevices.length === 0 ? (
                        <p className="scanner-settings-modal__empty">
                            No IoT devices connected
                        </p>
                    ) : (
                        <div className="scanner-settings-modal__devices">
                            {iotDevices.map((device) => (
                                <div
                                    key={device.id}
                                    className="scanner-settings-modal__device"
                                >
                                    <div
                                        className={cn(
                                            'scanner-settings-modal__device-dot',
                                            device.status === 'online' &&
                                            'scanner-settings-modal__device-dot--online'
                                        )}
                                    />
                                    <span>{device.name}</span>
                                    <span className="scanner-settings-modal__device-type">
                                        {device.type}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="scanner-settings-modal__section">
                    <h4>Export Data</h4>
                    <div className="scanner-export-card__buttons">
                        <button
                            onClick={() => onExport('csv')}
                            className="scanner-export-btn"
                        >
                            <FileSpreadsheet size={14} /> CSV
                        </button>
                        <button
                            onClick={() => onExport('json')}
                            className="scanner-export-btn"
                        >
                            <FileJson size={14} /> JSON
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

// ─── History Drawer ─────────────────────────────────────────────────────────

interface HistoryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    filteredScans: ScanResult[];
    searchTerm: string;
    onSearchChange: (v: string) => void;
    onSelectScan: (scan: ScanResult) => void;
}

export function HistoryDrawer({
    isOpen,
    onClose,
    filteredScans,
    searchTerm,
    onSearchChange,
    onSelectScan,
}: HistoryDrawerProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="scanner-drawer-backdrop"
                        onClick={onClose}
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
                            <button onClick={onClose}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="scanner-recent-feed__search">
                            <Search size={14} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                            />
                        </div>
                        <div className="scanner-history-drawer__list">
                            {filteredScans.map((scan, i) => (
                                <div
                                    key={`drawer-${scan.id}-${i}`}
                                    className={cn(
                                        'scanner-recent-item',
                                        scan.status === 'valid' && 'scanner-recent-item--valid',
                                        scan.status === 'invalid' && 'scanner-recent-item--invalid',
                                        scan.status === 'duplicate' &&
                                        'scanner-recent-item--duplicate'
                                    )}
                                    onClick={() => {
                                        onSelectScan(scan);
                                        onClose();
                                    }}
                                >
                                    <div
                                        className={cn(
                                            'scanner-recent-item__dot',
                                            scan.status === 'valid' &&
                                            'scanner-recent-item__dot--valid',
                                            scan.status === 'invalid' &&
                                            'scanner-recent-item__dot--invalid',
                                            scan.status === 'duplicate' &&
                                            'scanner-recent-item__dot--duplicate'
                                        )}
                                    />
                                    <div className="scanner-recent-item__content">
                                        <div className="scanner-recent-item__top">
                                            <span className="scanner-recent-item__name">
                                                {scan.name}
                                            </span>
                                            <span className="scanner-recent-item__time">
                                                {relativeTime(scan.timestamp)}
                                            </span>
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
    );
}
