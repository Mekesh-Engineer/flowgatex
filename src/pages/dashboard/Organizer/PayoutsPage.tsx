import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    DollarSign,
    ArrowUpRight,
    Clock,
    Download,
    Plus,
    Building2,
    CreditCard,
    FileText,
    AlertCircle,
    Wallet,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import StatsCard from '@/components/common/StatsCard';
import DataTable, { type Column } from '@/components/common/DataTable';
import Modal from '@/components/common/Modal';
import { Skeleton, SkeletonCard } from '@/components/common/Skeleton';

// =============================================================================
// TYPES & MOCK DATA
// =============================================================================

interface Payout {
    id: string;
    date: string;
    amount: number;
    method: string;
    status: 'paid' | 'processing' | 'failed';
    invoice: string;
    [key: string]: unknown;
}

interface EventRevenue {
    event: string;
    grossRevenue: number;
    platformFee: number;
    netEarnings: number;
    ticketsSold: number;
    [key: string]: unknown;
}

const MOCK_PAYOUTS: Payout[] = Array.from({ length: 12 }, (_, i) => ({
    id: `PO-${1000 + i}`,
    date: `Jan ${28 - i * 2}, 2026`,
    amount: [2400, 1850, 3200, 980, 4500, 1200, 2750, 560, 3800, 1600, 2100, 750][i],
    method: ['Bank Transfer', 'PayPal', 'Bank Transfer', 'UPI'][i % 4],
    status: i === 3 ? 'processing' : i === 7 ? 'failed' : 'paid',
    invoice: `INV-${2026}${String(i + 1).padStart(3, '0')}`,
}));

const MOCK_EVENT_REVENUE: EventRevenue[] = [
    { event: 'Tech Summit 2026', grossRevenue: 63150, platformFee: 3157.5, netEarnings: 59992.5, ticketsSold: 842 },
    { event: 'Jazz Night Live', grossRevenue: 12500, platformFee: 625, netEarnings: 11875, ticketsSold: 250 },
    { event: 'AI Conference', grossRevenue: 45000, platformFee: 2250, netEarnings: 42750, ticketsSold: 600 },
    { event: 'Design Workshop', grossRevenue: 8400, platformFee: 420, netEarnings: 7980, ticketsSold: 120 },
    { event: 'Startup Pitch Day', grossRevenue: 15000, platformFee: 750, netEarnings: 14250, ticketsSold: 200 },
];

const AVAILABLE_BALANCE = 8245.5;
const PENDING_BALANCE = 3200;
const MIN_PAYOUT = 50;

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 22 } } };

// =============================================================================
// COMPONENT
// =============================================================================

export default function PayoutsPage() {
    const [loading, setLoading] = useState(true);
    const [addMethodOpen, setAddMethodOpen] = useState(false);
    const [requestPayoutOpen, setRequestPayoutOpen] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState('');

    useEffect(() => { const t = setTimeout(() => setLoading(false), 600); return () => clearTimeout(t); }, []);

    const payoutColumns: Column<Payout>[] = [
        { key: 'date', header: 'Date', width: '120px', render: (row) => <span className="text-gray-500 dark:text-neutral-400 text-xs">{row.date}</span> },
        { key: 'id', header: 'ID', width: '100px', render: (row) => <span className="font-mono text-xs text-gray-600 dark:text-neutral-300">{row.id}</span> },
        { key: 'amount', header: 'Amount', width: '120px', align: 'right', render: (row) => <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(row.amount)}</span> },
        { key: 'method', header: 'Method', width: '130px' },
        {
            key: 'status', header: 'Status', width: '110px', align: 'center',
            render: (row) => {
                const v = row.status === 'paid' ? 'success' : row.status === 'processing' ? 'warning' : 'error';
                return <Badge variant={v}>{row.status}</Badge>;
            },
        },
        { key: 'invoice', header: 'Invoice', width: '80px', align: 'center', render: () => <button className="text-primary-600 dark:text-primary-400 hover:underline text-xs flex items-center gap-1"><FileText size={12} /> PDF</button> },
    ];

    const revenueColumns: Column<EventRevenue>[] = [
        { key: 'event', header: 'Event', render: (row) => <span className="font-medium text-gray-900 dark:text-white text-sm">{row.event}</span> },
        { key: 'ticketsSold', header: 'Tickets', width: '80px', align: 'center' },
        { key: 'grossRevenue', header: 'Gross', width: '120px', align: 'right', render: (row) => <span className="text-gray-700 dark:text-neutral-300">{formatCurrency(row.grossRevenue)}</span> },
        { key: 'platformFee', header: 'Fees (5%)', width: '110px', align: 'right', render: (row) => <span className="text-red-500 text-sm">-{formatCurrency(row.platformFee)}</span> },
        { key: 'netEarnings', header: 'Net', width: '120px', align: 'right', render: (row) => <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(row.netEarnings)}</span> },
    ];

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" rounded="lg" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} className="h-36" />)}</div>
                <SkeletonCard className="h-64" />
            </div>
        );
    }

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* ── Header ── */}
            <motion.div variants={itemVariants}>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Payouts</h1>
                <p className="text-gray-500 dark:text-neutral-400 mt-1">Track your earnings and manage payouts</p>
            </motion.div>

            {/* ── Balance Cards ── */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Available Balance */}
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white relative overflow-hidden">
                    <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <Wallet size={18} />
                            <span className="text-sm text-white/80">Available Balance</span>
                        </div>
                        <p className="text-3xl font-bold mb-5">{formatCurrency(AVAILABLE_BALANCE)}</p>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="bg-white/20 hover:bg-white/30 text-white border-0"
                            onClick={() => setRequestPayoutOpen(true)}
                        >
                            <ArrowUpRight size={14} className="mr-1.5" /> Withdraw
                        </Button>
                    </div>
                </div>

                {/* Pending Balance */}
                <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6 relative overflow-hidden">
                    <div className="absolute -top-6 -right-6 w-28 h-28 bg-amber-500/5 dark:bg-amber-500/10 rounded-full" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <Clock size={18} className="text-amber-500" />
                            <span className="text-sm text-gray-500 dark:text-neutral-400">Pending Balance</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{formatCurrency(PENDING_BALANCE)}</p>
                        <p className="text-xs text-gray-400 dark:text-neutral-500">Released after event completion (~7 days)</p>
                    </div>
                </div>
            </motion.div>

            {/* ── Quick Stats ── */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard label="Total Earned" value={formatCurrency(MOCK_EVENT_REVENUE.reduce((s, e) => s + e.netEarnings, 0))} icon={<DollarSign size={20} />} trend="+18% this month" trendUp color="text-green-600 dark:text-green-400" bgColor="bg-green-50 dark:bg-green-500/10" borderColor="border-green-100 dark:border-green-500/20" />
                <StatsCard label="Total Payouts" value={formatCurrency(MOCK_PAYOUTS.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0))} icon={<ArrowUpRight size={20} />} />
                <StatsCard label="Platform Fees" value={formatCurrency(MOCK_EVENT_REVENUE.reduce((s, e) => s + e.platformFee, 0))} icon={<Building2 size={20} />} color="text-red-600 dark:text-red-400" bgColor="bg-red-50 dark:bg-red-500/10" borderColor="border-red-100 dark:border-red-500/20" />
                <StatsCard label="Payout Methods" value={2} icon={<CreditCard size={20} />} color="text-violet-600 dark:text-violet-400" bgColor="bg-violet-50 dark:bg-violet-500/10" borderColor="border-violet-100 dark:border-violet-500/20" />
            </motion.div>

            {/* ── Revenue Breakdown ── */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                <h2 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2"><FileText size={16} /> Revenue Breakdown</h2>
                <DataTable<EventRevenue>
                    columns={revenueColumns}
                    data={MOCK_EVENT_REVENUE}
                    keyExtractor={(row) => row.event}
                    showPagination={false}
                />
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-neutral-700 text-sm font-bold">
                    <span className="text-gray-900 dark:text-white">Total Net Earnings</span>
                    <span className="text-green-600 dark:text-green-400">{formatCurrency(MOCK_EVENT_REVENUE.reduce((s, e) => s + e.netEarnings, 0))}</span>
                </div>
            </motion.div>

            {/* ── Payout History ── */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><ArrowUpRight size={16} /> Payout History</h2>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm"><Download size={14} className="mr-1.5" /> Export</Button>
                        <Button variant="ghost" size="sm" onClick={() => setAddMethodOpen(true)}><Plus size={14} className="mr-1.5" /> Add Method</Button>
                    </div>
                </div>
                <DataTable<Payout>
                    columns={payoutColumns}
                    data={MOCK_PAYOUTS}
                    keyExtractor={(row) => row.id}
                    pageSize={8}
                    emptyMessage="No payouts yet"
                    striped
                />
            </motion.div>

            {/* ── Add Payout Method Modal ── */}
            <Modal isOpen={addMethodOpen} onClose={() => setAddMethodOpen(false)} title="Add Payout Method" size="md">
                <form onSubmit={(e) => { e.preventDefault(); setAddMethodOpen(false); }} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Method Type</label>
                        <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option>Bank Account</option>
                            <option>PayPal</option>
                            <option>UPI</option>
                        </select>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Account Holder Name</label><input type="text" placeholder="John Doe" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Account Number</label><input type="text" placeholder="XXXX XXXX XXXX" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Routing / IFSC</label><input type="text" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Bank Name</label><input type="text" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="submit" variant="primary" className="flex-1">Save Method</Button>
                        <Button type="button" variant="ghost" onClick={() => setAddMethodOpen(false)}>Cancel</Button>
                    </div>
                </form>
            </Modal>

            {/* ── Request Payout Modal ── */}
            <Modal isOpen={requestPayoutOpen} onClose={() => setRequestPayoutOpen(false)} title="Request Payout" size="md">
                <div className="space-y-4">
                    <div className="bg-green-50 dark:bg-green-500/10 rounded-xl p-4 text-center">
                        <p className="text-sm text-green-600 dark:text-green-400 mb-1">Available Balance</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrency(AVAILABLE_BALANCE)}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                            <input type="number" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} placeholder="0.00" max={AVAILABLE_BALANCE} min={MIN_PAYOUT} className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Minimum payout: {formatCurrency(MIN_PAYOUT)}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Payout Method</label>
                        <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option>Bank Account (****4242)</option>
                            <option>PayPal (alex@example.com)</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400"><AlertCircle size={12} /> Processing takes 2-5 business days.</div>
                    <div className="flex gap-3 pt-2">
                        <Button variant="primary" className="flex-1" onClick={() => setRequestPayoutOpen(false)}>Request Payout</Button>
                        <Button variant="ghost" onClick={() => setRequestPayoutOpen(false)}>Cancel</Button>
                    </div>
                </div>
            </Modal>
        </motion.div>
    );
}
