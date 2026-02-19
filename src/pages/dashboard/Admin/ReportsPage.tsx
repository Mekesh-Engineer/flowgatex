import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    FileBarChart,
    Clock,
    Play,
    FileText,
    Table,
    FileSpreadsheet,
    RefreshCcw,
    Users,
    DollarSign,
    BarChart3,
    Download,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import StatsCard from '@/components/common/StatsCard';
import { Skeleton, SkeletonCard } from '@/components/common/Skeleton';
import { subscribeToAdminStats, type AdminStats } from '@/services/adminService';
import { subscribeToAuditLogs, formatAuditLogForExport } from '@/services/auditService';
import { subscribeToTransactions } from '@/services/transactionService';
import type { AuditLogEntry, AdminTransaction } from '@/types/admin.types';
import { showSuccess, showError } from '@/components/common/Toast';

// =============================================================================
// TYPES
// =============================================================================

interface GeneratedReport {
    id: string;
    name: string;
    type: string;
    generatedAt: string;
    recordCount: number;
    format: string;
}

const REPORT_TYPES = [
    'Revenue Report',
    'User Growth Report',
    'Transaction Report',
    'Audit Log Report',
];

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 22 } } };

// =============================================================================
// REPORT GENERATOR LOGIC (CSV + JSON exports from live Firestore data)
// =============================================================================

function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function generateCSV(headers: string[], rows: string[][]): string {
    const csvHeaders = headers.join(',');
    const csvRows = rows.map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    );
    return [csvHeaders, ...csvRows].join('\n');
}

// =============================================================================
// COMPONENT
// =============================================================================
export default function ReportsPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [reportType, setReportType] = useState(REPORT_TYPES[0]);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [generating, setGenerating] = useState(false);
    const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
    const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);

    // Live data for report generation
    const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

    useEffect(() => {
        const unsubStats = subscribeToAdminStats((data) => {
            setStats(data);
            setLoading(false);
        });
        const unsubTxn = subscribeToTransactions({}, setTransactions);
        const unsubAudit = subscribeToAuditLogs({}, setAuditLogs);

        return () => {
            unsubStats();
            unsubTxn();
            unsubAudit();
        };
    }, []);

    const handleGenerate = useCallback(() => {
        setGenerating(true);
        const dateStr = new Date().toISOString().split('T')[0];

        try {
            if (reportType === 'Revenue Report' || reportType === 'Transaction Report') {
                const filtered = transactions.filter(txn => {
                    const txnDate = txn.createdAt?.toDate?.();
                    if (!txnDate) return true;
                    if (dateFrom && txnDate < new Date(dateFrom)) return false;
                    if (dateTo && txnDate > new Date(dateTo)) return false;
                    return true;
                });

                if (exportFormat === 'csv') {
                    const headers = ['Payment ID', 'Order ID', 'Attendee', 'Email', 'Event', 'Amount', 'Platform Fee', 'Status', 'Gateway', 'Date'];
                    const rows = filtered.map(txn => [
                        txn.razorpayPaymentId || txn.id,
                        txn.razorpayOrderId || '',
                        txn.userName || '',
                        txn.userEmail || '',
                        txn.eventTitle || '',
                        String(txn.amount / 100),
                        String(txn.platformFee / 100),
                        txn.status,
                        txn.gateway,
                        txn.createdAt?.toDate?.()?.toISOString() || '',
                    ]);
                    downloadFile(generateCSV(headers, rows), `transactions-${dateStr}.csv`, 'text/csv');
                } else {
                    downloadFile(JSON.stringify(filtered, null, 2), `transactions-${dateStr}.json`, 'application/json');
                }

                const report: GeneratedReport = {
                    id: `rpt-${Date.now()}`,
                    name: `${reportType} — ${dateStr}`,
                    type: reportType,
                    generatedAt: new Date().toISOString(),
                    recordCount: filtered.length,
                    format: exportFormat.toUpperCase(),
                };
                setGeneratedReports(prev => [report, ...prev]);
                showSuccess(`${reportType} exported (${filtered.length} records)`);

            } else if (reportType === 'Audit Log Report') {
                const data = formatAuditLogForExport(auditLogs);
                if (exportFormat === 'csv') {
                    const headers = ['Timestamp', 'Action', 'Resource', 'Resource Type', 'Performed By', 'Severity', 'Reason'];
                    const rows = data.map(d => [d.timestamp, d.action, d.resource, d.resourceType, d.performedBy, d.severity, d.reason]);
                    downloadFile(generateCSV(headers, rows), `audit-logs-${dateStr}.csv`, 'text/csv');
                } else {
                    downloadFile(JSON.stringify(data, null, 2), `audit-logs-${dateStr}.json`, 'application/json');
                }

                const report: GeneratedReport = {
                    id: `rpt-${Date.now()}`,
                    name: `Audit Log Report — ${dateStr}`,
                    type: reportType,
                    generatedAt: new Date().toISOString(),
                    recordCount: data.length,
                    format: exportFormat.toUpperCase(),
                };
                setGeneratedReports(prev => [report, ...prev]);
                showSuccess(`Audit logs exported (${data.length} entries)`);

            } else if (reportType === 'User Growth Report') {
                const summaryData = {
                    generatedAt: new Date().toISOString(),
                    totalUsers: stats?.totalUsers || 0,
                    activeOrganizers: stats?.activeOrganizers || 0,
                    pendingApprovals: stats?.pendingApprovals || 0,
                    bookingsToday: stats?.bookingsToday || 0,
                    platformRevenue: stats?.platformRevenue || 0,
                };
                if (exportFormat === 'csv') {
                    const headers = Object.keys(summaryData);
                    const rows = [Object.values(summaryData).map(String)];
                    downloadFile(generateCSV(headers, rows), `user-growth-${dateStr}.csv`, 'text/csv');
                } else {
                    downloadFile(JSON.stringify(summaryData, null, 2), `user-growth-${dateStr}.json`, 'application/json');
                }

                const report: GeneratedReport = {
                    id: `rpt-${Date.now()}`,
                    name: `User Growth Report — ${dateStr}`,
                    type: reportType,
                    generatedAt: new Date().toISOString(),
                    recordCount: 1,
                    format: exportFormat.toUpperCase(),
                };
                setGeneratedReports(prev => [report, ...prev]);
                showSuccess('User Growth report exported');
            }
        } catch (error) {
            console.error(error);
            showError('Failed to generate report');
        } finally {
            setGenerating(false);
        }
    }, [reportType, dateFrom, dateTo, exportFormat, transactions, auditLogs, stats]);

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-56" rounded="lg" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} className="h-28" />)}</div>
                <SkeletonCard className="h-64" />
            </div>
        );
    }

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* ── Header ── */}
            <motion.div variants={itemVariants}>
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Reports</h1>
                <p className="text-[var(--text-secondary)] mt-1">Generate and export live data reports from Firestore</p>
            </motion.div>

            {/* ── Stats ── */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard label="Reports Generated" value={generatedReports.length.toString()} icon={<FileBarChart size={20} />} />
                <StatsCard label="Transactions" value={transactions.length.toString()} icon={<Clock size={20} />} color="text-blue-600 dark:text-blue-400" bgColor="bg-blue-50 dark:bg-blue-500/10" borderColor="border-blue-100 dark:border-blue-500/20" />
                <StatsCard label="Total Revenue" value={formatCurrency(stats?.platformRevenue || 0)} icon={<DollarSign size={20} />} color="text-green-600 dark:text-green-400" bgColor="bg-green-50 dark:bg-green-500/10" borderColor="border-green-100 dark:border-green-500/20" />
                <StatsCard label="Total Users" value={stats?.totalUsers.toString() || '0'} icon={<Users size={20} />} color="text-violet-600 dark:text-violet-400" bgColor="bg-violet-50 dark:bg-violet-500/10" borderColor="border-violet-100 dark:border-violet-500/20" />
            </motion.div>

            {/* ── Report Generator ── */}
            <motion.div variants={itemVariants} className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-6">
                <h2 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2"><BarChart3 size={18} /> Report Generator</h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Report Type</label>
                        <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40" aria-label="Report Type">
                            {REPORT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">From</label>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40" aria-label="Date From" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">To</label>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40" aria-label="Date To" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Format</label>
                        <select value={exportFormat} onChange={e => setExportFormat(e.target.value as 'csv' | 'json')} className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40" aria-label="Export Format">
                            <option value="csv">CSV</option>
                            <option value="json">JSON</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <Button variant="primary" className="w-full" onClick={handleGenerate} disabled={generating}>
                            {generating ? <><RefreshCcw size={14} className="mr-1.5 animate-spin" /> Generating...</> : <><Play size={14} className="mr-1.5" /> Generate Report</>}
                        </Button>
                    </div>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-3">
                    Reports are generated from live Firestore data ({transactions.length} transactions, {auditLogs.length} audit entries loaded)
                </p>
            </motion.div>

            {/* ── Generated Reports (this session) ── */}
            <motion.div variants={itemVariants}>
                <h2 className="font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2"><FileBarChart size={18} /> Generated Reports</h2>
                {generatedReports.length === 0 ? (
                    <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-12 text-center">
                        <FileText size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No reports yet</h3>
                        <p className="text-sm text-[var(--text-muted)]">
                            Use the generator above to create live-data reports. Files download immediately.
                        </p>
                    </div>
                ) : (
                    <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--border-default)] bg-[var(--bg-base)]">
                                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Report</th>
                                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Generated</th>
                                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Records</th>
                                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Format</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-default)]">
                                    {generatedReports.map((report) => (
                                        <tr key={report.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                                            <td className="px-5 py-4">
                                                <p className="font-medium text-[var(--text-primary)] text-sm">{report.name}</p>
                                                <p className="text-xs text-[var(--text-muted)]">{report.type}</p>
                                            </td>
                                            <td className="px-5 py-4 text-xs text-[var(--text-muted)]">
                                                {formatDate(report.generatedAt)}
                                            </td>
                                            <td className="px-5 py-4 text-sm font-medium text-[var(--text-primary)] tabular-nums">
                                                {report.recordCount}
                                            </td>
                                            <td className="px-5 py-4">
                                                <Badge variant="info">{report.format}</Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* ── Quick Export Buttons ── */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
                <Button
                    variant="ghost"
                    onClick={() => {
                        const data = formatAuditLogForExport(auditLogs);
                        downloadFile(JSON.stringify(data, null, 2), `audit-logs-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
                        showSuccess('Audit logs exported');
                    }}
                >
                    <Download size={14} className="mr-1.5" /> Export Audit Logs (JSON)
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => {
                        const headers = ['Payment ID', 'Attendee', 'Event', 'Amount', 'Status', 'Date'];
                        const rows = transactions.map(txn => [
                            txn.razorpayPaymentId || txn.id,
                            txn.userName || '',
                            txn.eventTitle || '',
                            String(txn.amount / 100),
                            txn.status,
                            txn.createdAt?.toDate?.()?.toISOString() || '',
                        ]);
                        downloadFile(generateCSV(headers, rows), `transactions-quick-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
                        showSuccess('Transactions exported');
                    }}
                >
                    <FileSpreadsheet size={14} className="mr-1.5" /> Export Transactions (CSV)
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => {
                        const summary = {
                            exportedAt: new Date().toISOString(),
                            totalUsers: stats?.totalUsers || 0,
                            totalEvents: stats?.totalEvents || 0,
                            activeOrganizers: stats?.activeOrganizers || 0,
                            platformRevenue: stats?.platformRevenue || 0,
                            pendingApprovals: stats?.pendingApprovals || 0,
                            bookingsToday: stats?.bookingsToday || 0,
                        };
                        downloadFile(JSON.stringify(summary, null, 2), `platform-stats-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
                        showSuccess('Platform stats exported');
                    }}
                >
                    <Table size={14} className="mr-1.5" /> Export Stats (JSON)
                </Button>
            </motion.div>
        </motion.div>
    );
}
