// =============================================================================
// TRANSACTION MONITORING PAGE — Live payment data, refunds, payouts
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
    CreditCard, Search, Eye, Download, Copy,
    TrendingUp, TrendingDown, AlertTriangle, ChevronDown,
    DollarSign, Banknote, ArrowUpRight,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { DetailDrawer } from '@/components/admin/DetailDrawer';
import {
    subscribeToTransactions,
    subscribeToFinancialSummary,
} from '@/services/transactionService';
import type { AdminTransaction, TransactionFilters, FinancialSummary } from '@/types/admin.types';

// =============================================================================
// FILTER BAR
// =============================================================================

function TransactionFilterBar({
    filters,
    onFilterChange,
}: {
    filters: TransactionFilters;
    onFilterChange: (f: TransactionFilters) => void;
}) {
    return (
        <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="relative flex-1 min-w-[240px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                    type="text"
                    placeholder="Search by Payment ID, email, or event..."
                    value={filters.search || ''}
                    onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-[var(--bg-surface)]
                     border border-[var(--border-default)] rounded-xl
                     text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                     focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 transition-all"
                />
            </div>

            <div className="relative">
                <select
                    title="Filter by status"
                    value={filters.status || ''}
                    onChange={(e) => onFilterChange({ ...filters, status: e.target.value || undefined })}
                    className="appearance-none pl-3 pr-8 py-2.5 text-sm bg-[var(--bg-surface)]
                     border border-[var(--border-default)] rounded-xl text-[var(--text-primary)]
                     focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
                >
                    <option value="">All Statuses</option>
                    <option value="paid">Paid</option>
                    <option value="refunded">Refunded</option>
                    <option value="failed">Failed</option>
                    <option value="pending">Pending</option>
                    <option value="partially_refunded">Partially Refunded</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            </div>

            <div className="relative">
                <select
                    title="Filter by gateway"
                    value={filters.gateway || ''}
                    onChange={(e) => onFilterChange({ ...filters, gateway: e.target.value || undefined })}
                    className="appearance-none pl-3 pr-8 py-2.5 text-sm bg-[var(--bg-surface)]
                     border border-[var(--border-default)] rounded-xl text-[var(--text-primary)]
                     focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
                >
                    <option value="">All Gateways</option>
                    <option value="razorpay">Razorpay</option>
                    <option value="mock">Mock</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            </div>

            {(filters.search || filters.status || filters.gateway) && (
                <button
                    onClick={() => onFilterChange({})}
                    className="px-3 py-2.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                    Clear filters
                </button>
            )}
        </div>
    );
}

// =============================================================================
// COPY TO CLIPBOARD BUTTON
// =============================================================================

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <button
            onClick={handleCopy}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors"
            title="Copy to clipboard"
        >
            {copied ? (
                <span className="text-emerald-400 text-[10px] font-medium">Copied!</span>
            ) : (
                <Copy size={12} />
            )}
        </button>
    );
}

// =============================================================================
// TRANSACTION TABLE
// =============================================================================

function TransactionTable({
    transactions,
    loading,
    onViewDetail,
}: {
    transactions: AdminTransaction[];
    loading: boolean;
    onViewDetail: (t: AdminTransaction) => void;
}) {
    if (loading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse h-16 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)]" />
                ))}
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-12 text-center">
                <CreditCard size={48} className="mx-auto text-[var(--text-muted)] opacity-30 mb-4" />
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No transactions found</h3>
                <p className="text-sm text-[var(--text-muted)]">Payments will appear here when bookings are processed</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-[var(--border-default)] bg-[var(--bg-base)]">
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Transaction ID</th>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Attendee</th>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Event</th>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Amount</th>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Fee</th>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Gateway</th>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Status</th>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Date</th>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-default)]">
                        {transactions.map((txn) => (
                            <tr key={txn.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer" onClick={() => onViewDetail(txn)}>
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-mono text-xs text-[var(--text-primary)]">
                                            {txn.razorpayPaymentId ? txn.razorpayPaymentId.slice(0, 14) + '...' : txn.id.slice(0, 10) + '...'}
                                        </span>
                                        <CopyButton text={txn.razorpayPaymentId || txn.id} />
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    <p className="text-sm text-[var(--text-primary)]">{txn.userName || '—'}</p>
                                    <p className="text-xs text-[var(--text-muted)]">{txn.userEmail || '—'}</p>
                                </td>
                                <td className="px-5 py-4 text-sm text-[var(--text-primary)] max-w-[180px] truncate">{txn.eventTitle || '—'}</td>
                                <td className="px-5 py-4 text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                                    {formatCurrency(txn.amount / 100)}
                                </td>
                                <td className="px-5 py-4 text-xs text-[var(--text-muted)] tabular-nums">
                                    {formatCurrency(txn.platformFee / 100)}
                                </td>
                                <td className="px-5 py-4">
                                    <StatusBadge status={txn.gateway} size="sm" dot={false} />
                                </td>
                                <td className="px-5 py-4">
                                    <StatusBadge status={txn.status} size="sm" />
                                </td>
                                <td className="px-5 py-4 text-xs text-[var(--text-muted)]">
                                    {txn.createdAt?.toDate ? formatDate(txn.createdAt.toDate()) : '—'}
                                </td>
                                <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={() => onViewDetail(txn)}
                                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors"
                                        title="View Details"
                                    >
                                        <Eye size={15} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function TransactionMonitoringPage() {
    const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<TransactionFilters>({});
    const [summary, setSummary] = useState<FinancialSummary | null>(null);
    const [selectedTxn, setSelectedTxn] = useState<AdminTransaction | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => {
        const unsub = subscribeToTransactions(filters, (data) => {
            setTransactions(data);
            setLoading(false);
        });
        return () => unsub();
    }, [filters]);

    useEffect(() => {
        const unsub = subscribeToFinancialSummary('30d', setSummary);
        return () => unsub();
    }, []);

    const handleViewDetail = useCallback((txn: AdminTransaction) => {
        setSelectedTxn(txn);
        setDrawerOpen(true);
    }, []);

    return (
        <div className="min-h-screen">
            <AdminPageHeader
                title="Transaction Monitoring"
                subtitle="Live payment data, refunds & settlement tracking"
                breadcrumbs={[
                    { label: 'Admin', href: '/admin' },
                    { label: 'Transactions' },
                ]}
                primaryAction={{
                    label: 'Export Report',
                    icon: <Download size={16} />,
                    onClick: () => { },
                }}
            />

            {/* Revenue Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                <AdminStatCard
                    title="Gross Revenue"
                    value={summary ? formatCurrency(summary.grossRevenue / 100) : '—'}
                    icon={<TrendingUp size={20} />}
                    color="green"
                    loading={!summary}
                />
                <AdminStatCard
                    title="Platform Fee"
                    value={summary ? formatCurrency(summary.platformFee / 100) : '—'}
                    icon={<DollarSign size={20} />}
                    color="blue"
                    loading={!summary}
                />
                <AdminStatCard
                    title="Total Refunds"
                    value={summary ? formatCurrency(summary.totalRefunds / 100) : '—'}
                    icon={<TrendingDown size={20} />}
                    color="red"
                    loading={!summary}
                />
                <AdminStatCard
                    title="Net Revenue"
                    value={summary ? formatCurrency(summary.netRevenue / 100) : '—'}
                    icon={<Banknote size={20} />}
                    color="cyan"
                    loading={!summary}
                />
                <AdminStatCard
                    title="Transactions"
                    value={summary ? summary.transactionCount.toLocaleString() : '—'}
                    icon={<ArrowUpRight size={20} />}
                    color="purple"
                    loading={!summary}
                />
                <AdminStatCard
                    title="Failed"
                    value={summary ? summary.failedCount.toLocaleString() : '—'}
                    icon={<AlertTriangle size={20} />}
                    color={summary && summary.failedCount > 0 ? 'red' : 'amber'}
                    loading={!summary}
                />
            </div>

            {/* Filters */}
            <TransactionFilterBar filters={filters} onFilterChange={setFilters} />

            {/* Table */}
            <TransactionTable
                transactions={transactions}
                loading={loading}
                onViewDetail={handleViewDetail}
            />

            {/* Detail Drawer */}
            <DetailDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                title="Transaction Details"
                subtitle={selectedTxn?.razorpayPaymentId || selectedTxn?.id || ''}
            >
                {selectedTxn && (
                    <div className="space-y-5">
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Payment</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs text-[var(--text-muted)]">Razorpay Payment ID</p>
                                    <p className="text-sm font-mono text-[var(--text-primary)] break-all">{selectedTxn.razorpayPaymentId || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--text-muted)]">Razorpay Order ID</p>
                                    <p className="text-sm font-mono text-[var(--text-primary)] break-all">{selectedTxn.razorpayOrderId || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--text-muted)]">Status</p>
                                    <StatusBadge status={selectedTxn.status} />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--text-muted)]">Gateway</p>
                                    <StatusBadge status={selectedTxn.gateway} dot={false} />
                                </div>
                            </div>
                        </div>

                        <hr className="border-[var(--border-default)]" />

                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Financial Breakdown</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-[var(--text-muted)]">Gross Amount</span>
                                    <span className="text-sm font-medium text-[var(--text-primary)]">{formatCurrency(selectedTxn.amount / 100)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-[var(--text-muted)]">Platform Fee</span>
                                    <span className="text-sm font-medium text-amber-400">{formatCurrency(selectedTxn.platformFee / 100)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-[var(--text-muted)]">Organizer Amount</span>
                                    <span className="text-sm font-medium text-emerald-400">{formatCurrency(selectedTxn.organizerAmount / 100)}</span>
                                </div>
                                {selectedTxn.refundAmount && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-[var(--text-muted)]">Refund</span>
                                        <span className="text-sm font-medium text-red-400">-{formatCurrency(selectedTxn.refundAmount / 100)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <hr className="border-[var(--border-default)]" />

                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Booking</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs text-[var(--text-muted)]">Attendee</p>
                                    <p className="text-sm text-[var(--text-primary)]">{selectedTxn.userName || '—'}</p>
                                    <p className="text-xs text-[var(--text-muted)]">{selectedTxn.userEmail || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--text-muted)]">Event</p>
                                    <p className="text-sm text-[var(--text-primary)]">{selectedTxn.eventTitle || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--text-muted)]">Payment Method</p>
                                    <p className="text-sm text-[var(--text-primary)] capitalize">{selectedTxn.paymentMethod || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--text-muted)]">Date</p>
                                    <p className="text-sm text-[var(--text-primary)]">
                                        {selectedTxn.createdAt?.toDate ? formatDate(selectedTxn.createdAt.toDate()) : '—'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Refund info */}
                        {selectedTxn.refundReason && (
                            <>
                                <hr className="border-[var(--border-default)]" />
                                <div className="space-y-2">
                                    <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Refund Details</h3>
                                    <p className="text-sm text-[var(--text-muted)]">{selectedTxn.refundReason}</p>
                                    {selectedTxn.refundedAt && (
                                        <p className="text-xs text-[var(--text-muted)]">
                                            Refunded at: {selectedTxn.refundedAt.toDate ? formatDate(selectedTxn.refundedAt.toDate()) : '—'}
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </DetailDrawer>
        </div>
    );
}
