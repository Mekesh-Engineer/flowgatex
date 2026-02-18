import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Wallet,
    CreditCard,
    Plus,
    ArrowUpRight,
    ArrowDownLeft,
    Download,
    Star,
    Eye,
    EyeOff,
    Shield,
    FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import EmptyState from '@/components/common/EmptyState';
import { Skeleton, SkeletonCard } from '@/components/common/Skeleton';
import DataTable, { type Column } from '@/components/common/DataTable';
import StatsCard from '@/components/common/StatsCard';
import { useTransactions } from '@/features/booking/hooks/useTransactions';
import type { Transaction } from '@/features/booking/types/transaction.types';
import type { TransactionFilter } from '@/features/booking/types/transaction.types';
import { PaymentStatus } from '@/lib/constants';

// =============================================================================
// TYPES & LOCAL DATA
// =============================================================================

interface PaymentMethod {
    id: string;
    brand: string;
    last4: string;
    expiry: string;
    isDefault: boolean;
    type: 'visa' | 'mastercard' | 'amex' | 'paypal';
}

const DEFAULT_CARDS: PaymentMethod[] = [
    { id: 'pm-1', brand: 'Visa', last4: '4242', expiry: '12/27', isDefault: true, type: 'visa' },
    { id: 'pm-2', brand: 'Mastercard', last4: '8888', expiry: '06/28', isDefault: false, type: 'mastercard' },
    { id: 'pm-3', brand: 'PayPal', last4: '3456', expiry: '—', isDefault: false, type: 'paypal' },
];

const brandColors: Record<string, string> = {
    visa: 'bg-blue-500',
    mastercard: 'bg-orange-500',
    amex: 'bg-indigo-500',
    paypal: 'bg-sky-500',
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 22 } },
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function WalletPage() {
    const [showBalance, setShowBalance] = useState(true);
    const [addCardOpen, setAddCardOpen] = useState(false);
    const [cards, setCards] = useState(DEFAULT_CARDS);
    const [filter, setFilter] = useState<TransactionFilter>('all');

    const {
        transactions,
        isLoading: loading,
        totalSpent,
        totalRefunds,
        balance,
    } = useTransactions(filter);

    /** Format Firestore timestamp or date string */
    const formatDate = (raw: any): string => {
        if (!raw) return '—';
        const d = raw?.toDate ? raw.toDate() : new Date(raw);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatCurrency = (v: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

    const isCredit = (row: Transaction) => row.paymentStatus === PaymentStatus.REFUNDED;

    const columns: Column<Transaction>[] = [
        {
            key: 'createdAt' as any,
            header: 'Date',
            width: '120px',
            render: (row) => <span className="text-gray-500 dark:text-neutral-400 text-xs">{formatDate(row.createdAt)}</span>,
        },
        {
            key: 'eventTitle' as any,
            header: 'Description',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        isCredit(row)
                            ? 'bg-green-50 dark:bg-green-500/10 text-green-600'
                            : 'bg-red-50 dark:bg-red-500/10 text-red-500'
                    )}>
                        {isCredit(row) ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                    </div>
                    <div className="min-w-0">
                        <span className="font-medium text-gray-900 dark:text-white text-sm block truncate">{row.eventTitle}</span>
                        {row.promoCode && (
                            <span className="text-[10px] text-primary-600 dark:text-primary-400">Promo: {row.promoCode}</span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'paymentMethod' as any,
            header: 'Method',
            width: '100px',
            render: (row) => (
                <span className="text-xs text-gray-500 dark:text-neutral-400 capitalize">{row.paymentMethod}</span>
            ),
        },
        {
            key: 'amountPaid' as any,
            header: 'Amount',
            width: '110px',
            align: 'right',
            render: (row) => (
                <span className={cn(
                    'font-semibold text-sm',
                    isCredit(row) ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'
                )}>
                    {isCredit(row) ? '+' : '-'}{formatCurrency(row.amountPaid)}
                </span>
            ),
        },
        {
            key: 'paymentStatus' as any,
            header: 'Status',
            width: '100px',
            align: 'center',
            render: (row) => {
                const variant =
                    row.paymentStatus === PaymentStatus.SUCCESS ? 'success'
                        : row.paymentStatus === PaymentStatus.PENDING ? 'warning'
                            : row.paymentStatus === PaymentStatus.REFUNDED ? 'info'
                                : 'error';
                return <Badge variant={variant}>{row.paymentStatus}</Badge>;
            },
        },
    ];

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" rounded="lg" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} className="h-32" />)}
                </div>
                <SkeletonCard className="h-64" />
            </div>
        );
    }

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* ── Header ── */}
            <motion.div variants={itemVariants}>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Wallet</h1>
                <p className="text-gray-500 dark:text-neutral-400 mt-1">Manage your balance, cards, and transactions</p>
            </motion.div>

            {/* ── Balance & Stats ── */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Balance Card */}
                <div className="md:col-span-1 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-6 text-white relative overflow-hidden">
                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
                    <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/10 rounded-full" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Wallet size={20} />
                                <span className="text-sm text-white/80">Available Balance</span>
                            </div>
                            <button
                                onClick={() => setShowBalance(!showBalance)}
                                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                aria-label={showBalance ? 'Hide balance' : 'Show balance'}
                            >
                                {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>
                        </div>
                        <p className="text-3xl font-bold mb-6">
                            {showBalance ? formatCurrency(balance) : '••••••'}
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="bg-white/20 hover:bg-white/30 text-white border-0"
                        >
                            <Plus size={14} className="mr-1.5" /> Add Money
                        </Button>
                    </div>
                </div>

                <StatsCard
                    label="Total Spent"
                    value={formatCurrency(totalSpent)}
                    icon={<ArrowUpRight size={20} />}
                    color="text-red-600 dark:text-red-400"
                    bgColor="bg-red-50 dark:bg-red-500/10"
                    borderColor="border-red-100 dark:border-red-500/20"
                    trend="This month"
                />
                <StatsCard
                    label="Total Refunds"
                    value={formatCurrency(totalRefunds)}
                    icon={<ArrowDownLeft size={20} />}
                    color="text-green-600 dark:text-green-400"
                    bgColor="bg-green-50 dark:bg-green-500/10"
                    borderColor="border-green-100 dark:border-green-500/20"
                    trend="All time"
                />
            </motion.div>

            {/* ── Payment Methods ── */}
            <motion.section variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <CreditCard size={18} /> Payment Methods
                    </h2>
                    <Button variant="ghost" size="sm" onClick={() => setAddCardOpen(true)}>
                        <Plus size={14} className="mr-1.5" /> Add Card
                    </Button>
                </div>

                {cards.length === 0 ? (
                    <EmptyState
                        title="No payment methods"
                        description="Add a card or PayPal to start booking events."
                        compact
                        action={<Button variant="primary" size="sm" onClick={() => setAddCardOpen(true)}>Add Payment Method</Button>}
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cards.map((card) => (
                            <div
                                key={card.id}
                                className={cn(
                                    'relative rounded-xl border p-4 transition-all hover:shadow-md',
                                    card.isDefault
                                        ? 'border-primary-300 dark:border-primary-500 bg-primary-50/50 dark:bg-primary-500/5'
                                        : 'border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-700/40'
                                )}
                            >
                                {card.isDefault && (
                                    <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                                        <Star size={10} fill="currentColor" /> Default
                                    </span>
                                )}
                                <div className={cn('w-10 h-7 rounded-md flex items-center justify-center text-white text-[10px] font-bold mb-3', brandColors[card.type] || 'bg-gray-500')}>
                                    {card.brand.slice(0, 4).toUpperCase()}
                                </div>
                                <p className="font-mono text-sm text-gray-700 dark:text-neutral-200 tracking-wider">
                                    •••• •••• •••• {card.last4}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-neutral-500 mt-1">
                                    {card.expiry !== '—' ? `Expires ${card.expiry}` : card.brand}
                                </p>
                                <div className="flex gap-2 mt-3">
                                    {!card.isDefault && (
                                        <button
                                            onClick={() => setCards(prev => prev.map(c => ({ ...c, isDefault: c.id === card.id })))}
                                            className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
                                        >
                                            Set Default
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setCards(prev => prev.filter(c => c.id !== card.id))}
                                        className="text-xs font-medium text-red-500 hover:underline ml-auto"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.section>

            {/* ── Transaction History ── */}
            <motion.section variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileText size={18} /> Transaction History
                    </h2>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-neutral-700 p-0.5">
                            {(['all', 'active', 'refunded', 'failed'] as TransactionFilter[]).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={cn(
                                        'px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-colors',
                                        filter === f
                                            ? 'bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300'
                                            : 'text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300'
                                    )}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        <Button variant="ghost" size="sm">
                            <Download size={14} className="mr-1.5" /> Export CSV
                        </Button>
                    </div>
                </div>

                <DataTable<Transaction>
                    columns={columns}
                    data={transactions}
                    keyExtractor={(row) => row.id}
                    pageSize={8}
                    emptyMessage="No transactions yet"
                    striped
                />
            </motion.section>

            {/* ── Add Payment Method Modal ── */}
            <Modal isOpen={addCardOpen} onClose={() => setAddCardOpen(false)} title="Add Payment Method" size="md">
                <form
                    onSubmit={(e) => { e.preventDefault(); setAddCardOpen(false); }}
                    className="space-y-4"
                >
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Card Number</label>
                        <input
                            type="text"
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Expiry</label>
                            <input
                                type="text"
                                placeholder="MM/YY"
                                maxLength={5}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">CVV</label>
                            <input
                                type="password"
                                placeholder="•••"
                                maxLength={4}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Name on Card</label>
                        <input
                            type="text"
                            placeholder="John Doe"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-neutral-400">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300 dark:border-neutral-600 text-primary-600 focus:ring-primary-500" />
                        Save for future purchases
                    </label>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-neutral-500">
                        <Shield size={12} /> Your card details are encrypted and secure
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="submit" variant="primary" className="flex-1">Add Card</Button>
                        <Button type="button" variant="ghost" onClick={() => setAddCardOpen(false)}>Cancel</Button>
                    </div>
                </form>
            </Modal>
        </motion.div>
    );
}
