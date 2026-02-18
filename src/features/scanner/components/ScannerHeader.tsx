// =============================================================================
// ScannerHeader — Top bar with stats, network status, and IoT indicators
// =============================================================================

import {
    ArrowLeft,
    QrCode,
    Wifi,
    WifiOff,
    BatteryMedium,
    Shield,
    Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScanStats } from '../types/scanner.types';

interface ScannerHeaderProps {
    stats: ScanStats;
    capacityPercent: string;
    isOnline: boolean;
    onlineDevices: number;
    onBack: () => void;
    onOpenSettings: () => void;
}

export function ScannerHeader({
    stats,
    capacityPercent,
    isOnline,
    onlineDevices,
    onBack,
    onOpenSettings,
}: ScannerHeaderProps) {
    return (
        <header className="scanner-header">
            <div className="scanner-header__left">
                <button
                    onClick={onBack}
                    className="scanner-header__back"
                    aria-label="Back to Dashboard"
                >
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
                            isOnline
                                ? 'scanner-header__indicator--online'
                                : 'scanner-header__indicator--offline'
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
                    onClick={onOpenSettings}
                    className="scanner-header__settings-btn"
                    aria-label="Settings (S)"
                    title="Settings (S)"
                >
                    <Settings size={18} />
                </button>
            </div>
        </header>
    );
}
