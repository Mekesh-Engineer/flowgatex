// =============================================================================
// ScannerRightPanel — Validation result card, activity feed, system log
// =============================================================================

import {
    CheckCircle2,
    XCircle,
    AlertTriangle,
    ClipboardList,
    Terminal,
    Trash2,
    ChevronDown,
    ChevronUp,
    Copy,
    ScanLine,
    Mail,
    Ticket,
    Calendar,
    MapPin,
    Clock,
    Hash,
    Shield,
    ShieldAlert,
    FileText,
    Unlock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { showSuccess } from '@/components/common/Toast';
import { relativeTime, logTypeClass } from '../utils/scanner.utils';
import type { ScannerState, ScanResult, LogEntry } from '../types/scanner.types';

interface ScannerRightPanelProps {
    scannerState: ScannerState;
    currentScan: ScanResult | null;
    recentScans: ScanResult[];
    logs: LogEntry[];
    showSystemLog: boolean;
    isLogExpanded: boolean;
    onToggleLogExpanded: () => void;
    onClearLogs: () => void;
    onSelectScan: (scan: ScanResult) => void;
    onStartScanning: () => void;
    onOpenOverride: () => void;
    logContainerRef: React.RefObject<HTMLDivElement | null>;
}

export function ScannerRightPanel({
    scannerState,
    currentScan,
    recentScans,
    logs,
    showSystemLog,
    isLogExpanded,
    onToggleLogExpanded,
    onClearLogs,
    onSelectScan,
    onStartScanning,
    onOpenOverride,
    logContainerRef,
}: ScannerRightPanelProps) {
    const isAwaiting =
        !currentScan ||
        scannerState === 'idle' ||
        scannerState === 'scanning' ||
        scannerState === 'initializing';

    return (
        <aside className="scanner-panel-right">
            {/* ── Validation Result Card ── */}
            <div
                className={cn(
                    'scanner-result-card',
                    currentScan &&
                    scannerState === 'valid' &&
                    'scanner-result-card--valid',
                    currentScan &&
                    scannerState === 'invalid' &&
                    'scanner-result-card--invalid',
                    currentScan &&
                    scannerState === 'duplicate' &&
                    'scanner-result-card--duplicate'
                )}
            >
                {isAwaiting ? (
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
                                currentScan!.status === 'valid' &&
                                'scanner-result-card__status-bar--valid',
                                currentScan!.status === 'invalid' &&
                                'scanner-result-card__status-bar--invalid',
                                currentScan!.status === 'duplicate' &&
                                'scanner-result-card__status-bar--duplicate'
                            )}
                        >
                            {currentScan!.status === 'valid' && (
                                <>
                                    <CheckCircle2 size={18} /> VALID TICKET
                                </>
                            )}
                            {currentScan!.status === 'invalid' && (
                                <>
                                    <XCircle size={18} /> INVALID TICKET
                                </>
                            )}
                            {currentScan!.status === 'duplicate' && (
                                <>
                                    <AlertTriangle size={18} /> ALREADY CHECKED IN
                                </>
                            )}
                        </div>

                        {/* Attendee Info */}
                        <div className="scanner-result-card__attendee">
                            <div className="scanner-result-card__avatar">
                                {currentScan!.status === 'valid' ? (
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                            currentScan!.name
                                        )}&background=16c784&color=fff&size=80`}
                                        alt={currentScan!.name}
                                    />
                                ) : (
                                    <div
                                        className={cn(
                                            'scanner-result-card__avatar-icon',
                                            currentScan!.status === 'invalid' &&
                                            'scanner-result-card__avatar-icon--invalid',
                                            currentScan!.status === 'duplicate' &&
                                            'scanner-result-card__avatar-icon--duplicate'
                                        )}
                                    >
                                        {currentScan!.status === 'invalid' ? (
                                            <ShieldAlert size={28} />
                                        ) : (
                                            <AlertTriangle size={28} />
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="scanner-result-card__info">
                                <h2>{currentScan!.name}</h2>
                                {currentScan!.email && (
                                    <p className="scanner-result-card__email">
                                        <Mail size={12} /> {currentScan!.email}
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
                                <span className="scanner-result-card__mono">
                                    {currentScan!.ticketId}
                                </span>
                            </div>
                            <div className="scanner-result-card__detail-row">
                                <span>
                                    <Hash size={12} /> Tier
                                </span>
                                <span>{currentScan!.tier}</span>
                            </div>
                            {currentScan!.gateAccess && (
                                <div className="scanner-result-card__detail-row">
                                    <span>
                                        <Shield size={12} /> Access Level
                                    </span>
                                    <span>{currentScan!.gateAccess}</span>
                                </div>
                            )}
                            {currentScan!.bookingId && (
                                <div className="scanner-result-card__detail-row">
                                    <span>
                                        <FileText size={12} /> Booking
                                    </span>
                                    <span className="scanner-result-card__mono">
                                        {currentScan!.bookingId}
                                    </span>
                                </div>
                            )}
                            {currentScan!.eventTitle && (
                                <div className="scanner-result-card__detail-row">
                                    <span>
                                        <Calendar size={12} /> Event
                                    </span>
                                    <span>{currentScan!.eventTitle}</span>
                                </div>
                            )}
                        </div>

                        {/* Status-specific content */}
                        {currentScan!.status === 'valid' && (
                            <div className="scanner-result-card__check-in">
                                <div className="scanner-result-card__detail-row">
                                    <span>
                                        <Clock size={12} /> Checked In
                                    </span>
                                    <span className="scanner-result-card__value--valid">
                                        {currentScan!.timestamp.toLocaleTimeString()}
                                    </span>
                                </div>
                                <div className="scanner-result-card__detail-row">
                                    <span>
                                        <MapPin size={12} /> Gate
                                    </span>
                                    <span>Main Entrance</span>
                                </div>
                            </div>
                        )}

                        {currentScan!.status === 'invalid' && (
                            <div className="scanner-result-card__error-box">
                                <XCircle size={16} />
                                <div>
                                    <p className="scanner-result-card__error-reason">
                                        {currentScan!.message}
                                    </p>
                                    <p className="scanner-result-card__error-hint">
                                        Please direct attendee to the support desk.
                                    </p>
                                </div>
                            </div>
                        )}

                        {currentScan!.status === 'duplicate' && (
                            <div className="scanner-result-card__duplicate-box">
                                <div className="scanner-result-card__dup-info">
                                    <AlertTriangle size={16} />
                                    <div>
                                        <p className="scanner-result-card__dup-message">
                                            {currentScan!.message}
                                        </p>
                                        {currentScan!.firstCheckIn && (
                                            <p className="scanner-result-card__dup-detail">
                                                Gate: {currentScan!.firstCheckIn.gate} • Device:{' '}
                                                {currentScan!.firstCheckIn.device}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={onOpenOverride}
                                    className="scanner-btn scanner-btn--override"
                                >
                                    <Unlock size={16} /> Allow Re-Entry
                                </button>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="scanner-result-card__actions">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(
                                        JSON.stringify(currentScan, null, 2)
                                    );
                                    showSuccess('Details copied');
                                }}
                                className="scanner-btn scanner-btn--ghost"
                            >
                                <Copy size={14} /> Copy Details
                            </button>
                            <button
                                onClick={onStartScanning}
                                className="scanner-btn scanner-btn--ghost"
                            >
                                <ScanLine size={14} /> Scan Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Recent Activity Timeline ── */}
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
                            onClick={() => onSelectScan(scan)}
                        >
                            <div
                                className={cn(
                                    'scanner-activity-item__dot',
                                    scan.status === 'valid' &&
                                    'scanner-activity-item__dot--valid',
                                    scan.status === 'invalid' &&
                                    'scanner-activity-item__dot--invalid',
                                    scan.status === 'duplicate' &&
                                    'scanner-activity-item__dot--duplicate'
                                )}
                            />
                            <div className="scanner-activity-item__content">
                                <span className="scanner-activity-item__time">
                                    {relativeTime(scan.timestamp)}
                                </span>
                                <span className="scanner-activity-item__text">
                                    {scan.name} • {scan.tier} • {scan.ticketId}
                                </span>
                                {scan.status !== 'valid' && (
                                    <span className="scanner-activity-item__note">
                                        ({scan.status === 'duplicate' ? 'Duplicate' : scan.message})
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                    {recentScans.length === 0 && (
                        <div className="scanner-activity-feed__empty">No activity yet</div>
                    )}
                </div>
            </div>

            {/* ── System Log ── */}
            {showSystemLog && (
                <div className="scanner-syslog">
                    <div
                        className="scanner-syslog__header"
                        onClick={onToggleLogExpanded}
                    >
                        <div className="scanner-syslog__title">
                            <Terminal size={14} />
                            <span>System Log</span>
                            <div className="scanner-syslog__dot" />
                        </div>
                        <div className="scanner-syslog__actions">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClearLogs();
                                }}
                                title="Clear log"
                            >
                                <Trash2 size={12} />
                            </button>
                            {isLogExpanded ? (
                                <ChevronUp size={14} />
                            ) : (
                                <ChevronDown size={14} />
                            )}
                        </div>
                    </div>
                    {isLogExpanded && (
                        <div ref={logContainerRef} className="scanner-syslog__body">
                            {logs.map((log, idx) => (
                                <div key={idx} className="scanner-syslog__entry">
                                    <span className="scanner-syslog__time">[{log.time}]</span>
                                    <span
                                        className={cn('scanner-syslog__type', logTypeClass(log.type))}
                                    >
                                        {log.type}:
                                    </span>
                                    <span
                                        className={cn(
                                            'scanner-syslog__msg',
                                            log.type === 'ERROR' && 'scanner-syslog__msg--error'
                                        )}
                                    >
                                        {log.message}
                                    </span>
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
    );
}
