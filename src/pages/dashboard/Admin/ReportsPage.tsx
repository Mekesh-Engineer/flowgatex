import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FileBarChart,
    Clock,
    Play,
    FileText,
    Table,
    FileSpreadsheet,
    Trash2,
    RefreshCcw,
    Users,
    DollarSign,
    BarChart3,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import StatsCard from '@/components/common/StatsCard';
import DataTable, { type Column } from '@/components/common/DataTable';
import { Skeleton, SkeletonCard, SkeletonTable } from '@/components/common/Skeleton';

// =============================================================================
// TYPES & MOCK DATA
// =============================================================================

interface SavedReport {
    id: string;
    name: string;
    type: string;
    generatedAt: string;
    size: string;
    formats: string[];
    [key: string]: unknown;
}

interface ScheduledReport {
    id: string;
    name: string;
    type: string;
    schedule: string;
    nextRun: string;
    recipient: string;
    [key: string]: unknown;
}

const REPORT_TYPES = ['Revenue Report', 'User Growth Report', 'Event Performance Report', 'Transaction Report', 'Refunds Report'];

const MOCK_SAVED: SavedReport[] = [
    { id: 'sr-1', name: 'Revenue Report — Jan 2026', type: 'Revenue Report', generatedAt: '2026-01-28', size: '2.4 MB', formats: ['PDF', 'CSV', 'Excel'] },
    { id: 'sr-2', name: 'User Growth — Q4 2025', type: 'User Growth Report', generatedAt: '2026-01-02', size: '1.1 MB', formats: ['PDF', 'CSV'] },
    { id: 'sr-3', name: 'Transactions — Dec 2025', type: 'Transaction Report', generatedAt: '2025-12-31', size: '4.7 MB', formats: ['PDF', 'CSV', 'Excel'] },
    { id: 'sr-4', name: 'Event Performance — 2025', type: 'Event Performance Report', generatedAt: '2025-12-30', size: '3.2 MB', formats: ['PDF', 'Excel'] },
];

const MOCK_SCHEDULED: ScheduledReport[] = [
    { id: 'sch-1', name: 'Monthly Revenue', type: 'Revenue Report', schedule: 'Monthly', nextRun: 'Feb 1, 2026', recipient: 'admin@flowgatex.com' },
    { id: 'sch-2', name: 'Weekly User Growth', type: 'User Growth Report', schedule: 'Weekly', nextRun: 'Feb 3, 2026', recipient: 'admin@flowgatex.com' },
];

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 22 } } };

// =============================================================================
// COMPONENT
// =============================================================================
export default function ReportsPage() {
    const [loading, setLoading] = useState(true);
    const [reportType, setReportType] = useState(REPORT_TYPES[0]);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [generating, setGenerating] = useState(false);

    useEffect(() => { const t = setTimeout(() => setLoading(false), 600); return () => clearTimeout(t); }, []);

    const handleGenerate = () => {
        setGenerating(true);
        setTimeout(() => setGenerating(false), 2000);
    };

    const savedColumns: Column<SavedReport>[] = [
        {
            key: 'name', header: 'Report', render: (row) => (
                <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{row.name}</p>
                    <p className="text-xs text-gray-400">{row.type}</p>
                </div>
            )
        },
        { key: 'generatedAt', header: 'Generated', width: '130px', sortable: true, render: (row) => <span className="text-xs text-gray-500 dark:text-neutral-400">{formatDate(row.generatedAt)}</span> },
        { key: 'size', header: 'Size', width: '80px', align: 'center' },
        {
            key: 'formats', header: 'Download', width: '200px', render: (row) => (
                <div className="flex gap-1.5">
                    {row.formats.map(fmt => (
                        <button key={fmt} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-neutral-700/40 text-xs text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors">
                            {fmt === 'PDF' && <FileText size={12} />}
                            {fmt === 'CSV' && <Table size={12} />}
                            {fmt === 'Excel' && <FileSpreadsheet size={12} />}
                            {fmt}
                        </button>
                    ))}
                </div>
            )
        },
        { key: 'id', header: '', width: '40px', render: () => <button className="p-1 text-gray-400 hover:text-red-500 transition-colors" aria-label="Delete report"><Trash2 size={14} /></button> },
    ];

    const scheduledColumns: Column<ScheduledReport>[] = [
        {
            key: 'name', header: 'Report', render: (row) => (
                <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{row.name}</p>
                    <p className="text-xs text-gray-400">{row.type}</p>
                </div>
            )
        },
        { key: 'schedule', header: 'Frequency', width: '110px', render: (row) => <Badge variant="info">{row.schedule}</Badge> },
        { key: 'nextRun', header: 'Next Run', width: '130px', render: (row) => <span className="text-xs text-gray-500 dark:text-neutral-400">{row.nextRun}</span> },
        { key: 'recipient', header: 'Recipient', width: '200px', render: (row) => <span className="text-xs text-gray-500 dark:text-neutral-400">{row.recipient}</span> },
        { key: 'id', header: '', width: '40px', render: () => <button className="p-1 text-gray-400 hover:text-red-500 transition-colors" aria-label="Remove schedule"><Trash2 size={14} /></button> },
    ];

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-56" rounded="lg" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} className="h-28" />)}</div>
                <SkeletonCard className="h-64" />
                <SkeletonTable rows={4} cols={4} />
            </div>
        );
    }

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* ── Header ── */}
            <motion.div variants={itemVariants}>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Reports</h1>
                <p className="text-gray-500 dark:text-neutral-400 mt-1">Generate, download, and schedule custom reports</p>
            </motion.div>

            {/* ── Stats ── */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard label="Total Reports" value={MOCK_SAVED.length.toString()} icon={<FileBarChart size={20} />} />
                <StatsCard label="Scheduled" value={MOCK_SCHEDULED.length.toString()} icon={<Clock size={20} />} color="text-blue-600 dark:text-blue-400" bgColor="bg-blue-50 dark:bg-blue-500/10" borderColor="border-blue-100 dark:border-blue-500/20" />
                <StatsCard label="Total Revenue" value="$89,450" icon={<DollarSign size={20} />} color="text-green-600 dark:text-green-400" bgColor="bg-green-50 dark:bg-green-500/10" borderColor="border-green-100 dark:border-green-500/20" trend="+12.5%" trendUp />
                <StatsCard label="Total Users" value="3,240" icon={<Users size={20} />} color="text-violet-600 dark:text-violet-400" bgColor="bg-violet-50 dark:bg-violet-500/10" borderColor="border-violet-100 dark:border-violet-500/20" trend="+8.3%" trendUp />
            </motion.div>

            {/* ── Report Generator ── */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><BarChart3 size={18} /> Report Generator</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Report Type</label>
                        <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                            {REPORT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">From</label>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">To</label>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div className="flex items-end">
                        <Button variant="primary" className="w-full" onClick={handleGenerate} disabled={generating}>
                            {generating ? <><RefreshCcw size={14} className="mr-1.5 animate-spin" /> Generating...</> : <><Play size={14} className="mr-1.5" /> Generate Report</>}
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* ── Saved Reports ── */}
            <motion.div variants={itemVariants}>
                <h2 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><FileBarChart size={18} /> Saved Reports</h2>
                <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
                    <DataTable<SavedReport>
                        columns={savedColumns}
                        data={MOCK_SAVED}
                        keyExtractor={(row) => row.id}
                        showPagination={false}
                        emptyMessage="No saved reports yet"
                    />
                </div>
            </motion.div>

            {/* ── Scheduled Reports ── */}
            <motion.div variants={itemVariants}>
                <h2 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Clock size={18} /> Scheduled Reports</h2>
                <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
                    <DataTable<ScheduledReport>
                        columns={scheduledColumns}
                        data={MOCK_SCHEDULED}
                        keyExtractor={(row) => row.id}
                        showPagination={false}
                        emptyMessage="No scheduled reports"
                    />
                </div>
            </motion.div>
        </motion.div>
    );
}
