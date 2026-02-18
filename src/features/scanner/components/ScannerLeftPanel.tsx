// =============================================================================
// ScannerLeftPanel — Stats grid, recent scans feed, settings, export
// =============================================================================

import {
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Clock,
    Settings,
    Download,
    Search,
    Trash2,
    ScanLine,
    FileSpreadsheet,
    FileJson,
    FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Toggle from '@/components/common/Toggle';
import { relativeTime } from '../utils/scanner.utils';
import type { ScanResult, ScanStats, ScannerSettings } from '../types/scanner.types';

interface ScannerLeftPanelProps {
    stats: ScanStats;
    statPercents: { valid: string; invalid: string; duplicate: string };
    filteredScans: ScanResult[];
    settings: ScannerSettings;
    searchTerm: string;
    onSearchChange: (v: string) => void;
    onClearHistory: () => void;
    onSettingsChange: (patch: Partial<ScannerSettings>) => void;
    onExport: (format: 'csv' | 'json' | 'pdf') => void;
    onSelectScan: (scan: ScanResult) => void;
}

export function ScannerLeftPanel({
    stats,
    statPercents,
    filteredScans,
    settings,
    searchTerm,
    onSearchChange,
    onClearHistory,
    onSettingsChange,
    onExport,
    onSelectScan,
}: ScannerLeftPanelProps) {
    return (
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
                    <div className="scanner-stat-card__value scanner-stat-card__value--valid">
                        {stats.valid}
                    </div>
                    <div className="scanner-stat-card__sub">{statPercents.valid}%</div>
                </div>
                <div className="scanner-stat-card scanner-stat-card--invalid">
                    <div className="scanner-stat-card__label">
                        <XCircle size={14} /> Invalid
                    </div>
                    <div className="scanner-stat-card__value scanner-stat-card__value--invalid">
                        {stats.invalid}
                    </div>
                    <div className="scanner-stat-card__sub">{statPercents.invalid}%</div>
                </div>
                <div className="scanner-stat-card scanner-stat-card--duplicate">
                    <div className="scanner-stat-card__label">
                        <AlertTriangle size={14} /> Duplicates
                    </div>
                    <div className="scanner-stat-card__value scanner-stat-card__value--duplicate">
                        {stats.duplicates}
                    </div>
                    <div className="scanner-stat-card__sub">{statPercents.duplicate}%</div>
                </div>
            </div>

            {/* Recent Scans Feed */}
            <div className="scanner-recent-feed">
                <div className="scanner-recent-feed__header">
                    <h3>
                        <Clock size={14} /> Recent Scans
                    </h3>
                    <div className="scanner-recent-feed__actions">
                        <button
                            onClick={onClearHistory}
                            className="scanner-icon-btn scanner-icon-btn--danger"
                            title="Clear History"
                        >
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
                        onChange={(e) => onSearchChange(e.target.value)}
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
                                onClick={() => onSelectScan(scan)}
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
                                        <span className="scanner-recent-item__time">
                                            {relativeTime(scan.timestamp)}
                                        </span>
                                    </div>
                                    <span className="scanner-recent-item__detail">
                                        {scan.status === 'valid'
                                            ? `${scan.tier} • ${scan.ticketId}`
                                            : scan.message || scan.ticketId}
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
                        onChange={(v) => onSettingsChange({ continuousScan: v })}
                        label="Continuous Scan"
                        description="Auto-scan next ticket"
                        size="sm"
                    />
                    <Toggle
                        checked={settings.soundEnabled}
                        onChange={(v) => onSettingsChange({ soundEnabled: v })}
                        label="Sound"
                        description="Play beep on scan"
                        size="sm"
                    />
                    <Toggle
                        checked={settings.vibrationEnabled}
                        onChange={(v) => onSettingsChange({ vibrationEnabled: v })}
                        label="Vibration"
                        description="Vibrate on result"
                        size="sm"
                    />
                    <Toggle
                        checked={settings.autoSave}
                        onChange={(v) => onSettingsChange({ autoSave: v })}
                        label="Auto-Save"
                        description="Save to local storage"
                        size="sm"
                    />
                    <Toggle
                        checked={settings.showSystemLog}
                        onChange={(v) => onSettingsChange({ showSystemLog: v })}
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
                    <button onClick={() => onExport('csv')} className="scanner-export-btn">
                        <FileSpreadsheet size={14} /> CSV
                    </button>
                    <button onClick={() => onExport('json')} className="scanner-export-btn">
                        <FileJson size={14} /> JSON
                    </button>
                    <button onClick={() => onExport('pdf')} className="scanner-export-btn">
                        <FileText size={14} /> PDF
                    </button>
                </div>
            </div>
        </aside>
    );
}
