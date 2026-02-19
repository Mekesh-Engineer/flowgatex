// =============================================================================
// AUDIT LOGS PAGE — Chronological, filterable log of all admin actions
// =============================================================================

import { useState, useEffect, useCallback, useMemo, JSX } from 'react';
import {
    FileText, Search, Download, Shield, Clock,
    Activity, AlertTriangle, ChevronDown,
    User, Calendar, Settings, CreditCard, BookOpen,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { subscribeToAuditLogs, formatAuditLogForExport } from '@/services/auditService';
import type { AuditLogEntry, AuditLogFilters } from '@/types/admin.types';

// =============================================================================
// HELPERS
// =============================================================================

const resourceTypeIcons: Record<string, JSX.Element> = {
    user: <User size={14} />,
    event: <Calendar size={14} />,
    organizer: <Shield size={14} />,
    booking: <BookOpen size={14} />,
    transaction: <CreditCard size={14} />,
    settings: <Settings size={14} />,
};

const severityStyles: Record<string, string> = {
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    critical: 'bg-red-500/10 text-red-400 border-red-500/20',
};

function formatTimestamp(timestamp: AuditLogEntry['timestamp']): string {
    try {
        const date = timestamp?.toDate?.();
        if (!date) return '—';
        return new Intl.DateTimeFormat('en-IN', {
            dateStyle: 'short',
            timeStyle: 'short',
        }).format(date);
    } catch {
        return '—';
    }
}

// =============================================================================
// FILTER BAR
// =============================================================================

function AuditFilterBar({
    filters,
    onFilterChange,
}: {
    filters: AuditLogFilters;
    onFilterChange: (f: AuditLogFilters) => void;
}) {
    return (
        <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Search actor */}
            <div className="relative flex-1 min-w-[200px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                    type="text"
                    placeholder="Search by actor email..."
                    value={filters.actor || ''}
                    onChange={(e) => onFilterChange({ ...filters, actor: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-[var(--bg-surface)]
                     border border-[var(--border-default)] rounded-xl
                     text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                     focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 transition-all"
                />
            </div>

            {/* Resource Type */}
            <div className="relative">
                <select
                    title="Filter by resource type"
                    value={filters.resourceType || ''}
                    onChange={(e) => onFilterChange({ ...filters, resourceType: e.target.value || undefined })}
                    className="appearance-none pl-3 pr-8 py-2.5 text-sm bg-[var(--bg-surface)]
                     border border-[var(--border-default)] rounded-xl text-[var(--text-primary)]
                     focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
                >
                    <option value="">All Resources</option>
                    <option value="user">User</option>
                    <option value="event">Event</option>
                    <option value="organizer">Organizer</option>
                    <option value="booking">Booking</option>
                    <option value="transaction">Transaction</option>
                    <option value="settings">Settings</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            </div>

            {/* Severity */}
            <div className="relative">
                <select
                    title="Filter by severity"
                    value={filters.severity || ''}
                    onChange={(e) => onFilterChange({ ...filters, severity: e.target.value || undefined })}
                    className="appearance-none pl-3 pr-8 py-2.5 text-sm bg-[var(--bg-surface)]
                     border border-[var(--border-default)] rounded-xl text-[var(--text-primary)]
                     focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
                >
                    <option value="">All Severities</option>
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            </div>

            {/* Clear */}
            {(filters.actor || filters.resourceType || filters.severity) && (
                <button
                    onClick={() => onFilterChange({})}
                    className="px-3 py-2.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                    Clear
                </button>
            )}
        </div>
    );
}

// =============================================================================
// LOG TIMELINE ITEM
// =============================================================================

function AuditLogItem({ entry }: { entry: AuditLogEntry }) {
    const icon = resourceTypeIcons[entry.resourceType] || <Activity size={14} />;
    const sevStyle = severityStyles[entry.severity] || severityStyles.info;

    return (
        <div className="group flex items-start gap-4 py-4 px-5 border-b border-[var(--border-default)]/50
                    hover:bg-[var(--bg-surface-hover)]/50 transition-colors last:border-b-0">
            {/* Icon */}
            <div
                className={`shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center ${sevStyle}`}
            >
                {icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                        {entry.action.replace(/[_:]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </p>
                    <StatusBadge status={entry.severity} size="sm" dot={false} />
                </div>

                <p className="text-xs text-[var(--text-muted)]">
                    <span className="font-medium text-[var(--text-secondary)]">
                        {entry.performedByEmail || entry.performedBy}
                    </span>
                    {' → '}
                    <span className="font-mono">{entry.resource}</span>
                </p>

                {entry.details?.reason && (
                    <p className="text-xs text-[var(--text-muted)] italic">
                        Reason: {String(entry.details.reason)}
                    </p>
                )}
            </div>

            {/* Timestamp */}
            <div className="shrink-0 text-right">
                <p className="text-xs text-[var(--text-muted)]">{formatTimestamp(entry.timestamp)}</p>
                {entry.ipAddress && (
                    <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">{entry.ipAddress}</p>
                )}
            </div>
        </div>
    );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<AuditLogFilters>({});

    useEffect(() => {
        const unsub = subscribeToAuditLogs(filters, (data) => {
            setLogs(data);
            setLoading(false);
        });
        return () => unsub();
    }, [filters]);

    const handleExport = useCallback(() => {
        const exportData = formatAuditLogForExport(logs);
        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [logs]);

    // Stats
    const stats = useMemo(() => ({
        total: logs.length,
        info: logs.filter((l) => l.severity === 'info').length,
        warning: logs.filter((l) => l.severity === 'warning').length,
        critical: logs.filter((l) => l.severity === 'critical').length,
    }), [logs]);

    return (
        <div className="min-h-screen">
            <AdminPageHeader
                title="Audit Logs"
                subtitle="Comprehensive activity tracking & compliance"
                breadcrumbs={[
                    { label: 'Admin', href: '/admin' },
                    { label: 'Audit Logs' },
                ]}
                primaryAction={{
                    label: 'Export JSON',
                    icon: <Download size={16} />,
                    onClick: handleExport,
                    disabled: logs.length === 0,
                }}
            />

            {/* Stats Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
                        <FileText size={18} className="text-blue-400" />
                    </div>
                    <div>
                        <p className="text-xs text-[var(--text-muted)]">Total Entries</p>
                        <p className="text-lg font-bold text-[var(--text-primary)] tabular-nums">{stats.total}</p>
                    </div>
                </div>
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
                        <Activity size={18} className="text-blue-400" />
                    </div>
                    <div>
                        <p className="text-xs text-[var(--text-muted)]">Info</p>
                        <p className="text-lg font-bold text-blue-400 tabular-nums">{stats.info}</p>
                    </div>
                </div>
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
                        <AlertTriangle size={18} className="text-amber-400" />
                    </div>
                    <div>
                        <p className="text-xs text-[var(--text-muted)]">Warnings</p>
                        <p className="text-lg font-bold text-amber-400 tabular-nums">{stats.warning}</p>
                    </div>
                </div>
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center">
                        <Shield size={18} className="text-red-400" />
                    </div>
                    <div>
                        <p className="text-xs text-[var(--text-muted)]">Critical</p>
                        <p className="text-lg font-bold text-red-400 tabular-nums">{stats.critical}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <AuditFilterBar filters={filters} onFilterChange={setFilters} />

            {/* Log Timeline */}
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
                {loading ? (
                    <div className="space-y-0">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex items-start gap-4 p-5 border-b border-[var(--border-default)]/50">
                                <div className="w-9 h-9 rounded-lg bg-[var(--border-default)] animate-pulse" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3.5 w-48 bg-[var(--border-default)] rounded animate-pulse" />
                                    <div className="h-3 w-64 bg-[var(--border-default)] rounded animate-pulse" />
                                </div>
                                <div className="h-3 w-20 bg-[var(--border-default)] rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-12 text-center">
                        <Clock size={48} className="mx-auto text-[var(--text-muted)] opacity-30 mb-4" />
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No audit logs found</h3>
                        <p className="text-sm text-[var(--text-muted)]">
                            Admin actions will be recorded here automatically
                        </p>
                    </div>
                ) : (
                    <div>
                        {logs.map((entry) => (
                            <AuditLogItem key={entry.id} entry={entry} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
