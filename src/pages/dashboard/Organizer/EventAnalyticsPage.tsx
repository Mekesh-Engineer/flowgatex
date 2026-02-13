import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Download,
    Ticket,
    DollarSign,
    TrendingUp,
    Users,
    BarChart3,
    PieChart,
    Globe,
    Share2,
    Heart,
    Eye as EyeIcon,
    ArrowUpRight,
    Calendar,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import Button from '@/components/common/Button';
import StatsCard from '@/components/common/StatsCard';
import ProgressBar from '@/components/common/ProgressBar';
import { Skeleton, SkeletonCard } from '@/components/common/Skeleton';

// =============================================================================
// MOCK DATA
// =============================================================================

const EVENT_INFO = {
    title: 'Tech Summit 2026',
    image: 'https://images.unsplash.com/photo-1540575467063-178a509371f7?auto=format&fit=crop&q=80&w=200',
    date: 'Apr 15, 2026',
};

const OVERVIEW = {
    ticketsSold: 842,
    ticketsTotal: 1000,
    totalRevenue: 63150,
    conversionRate: 14.8,
    avgTicketPrice: 75,
};

const DAILY_SALES = Array.from({ length: 14 }, (_, i) => ({
    day: `Mar ${15 + i}`,
    tickets: Math.floor(Math.random() * 60) + 10,
    revenue: Math.floor(Math.random() * 4500) + 500,
}));

const TICKET_TIERS = [
    { name: 'Early Bird', sold: 200, total: 200, revenue: 10000, color: 'bg-green-500' },
    { name: 'General', sold: 450, total: 500, revenue: 33750, color: 'bg-primary-500' },
    { name: 'VIP', sold: 142, total: 200, revenue: 14200, color: 'bg-violet-500' },
    { name: 'Platinum', sold: 50, total: 100, revenue: 5200, color: 'bg-amber-500' },
];

const TRAFFIC_SOURCES = [
    { source: 'Direct', visitors: 2340, pct: 38, color: 'bg-primary-500' },
    { source: 'Social Media', visitors: 1870, pct: 30, color: 'bg-pink-500' },
    { source: 'Search', visitors: 1240, pct: 20, color: 'bg-amber-500' },
    { source: 'Referral', visitors: 745, pct: 12, color: 'bg-green-500' },
];

const FUNNEL_STEPS = [
    { label: 'Page Views', value: 6195, pct: 100, color: 'bg-gray-400 dark:bg-neutral-500' },
    { label: 'Clicked "Buy"', value: 2478, pct: 40, color: 'bg-primary-400' },
    { label: 'Checkout Started', value: 1239, pct: 20, color: 'bg-primary-500' },
    { label: 'Purchased', value: 842, pct: 13.6, color: 'bg-green-500' },
];

const DEMOGRAPHICS = {
    age: [
        { group: '18-24', pct: 22 },
        { group: '25-34', pct: 38 },
        { group: '35-44', pct: 24 },
        { group: '45-54', pct: 11 },
        { group: '55+', pct: 5 },
    ],
    gender: [
        { label: 'Male', pct: 55, color: 'bg-primary-500' },
        { label: 'Female', pct: 40, color: 'bg-pink-500' },
        { label: 'Other', pct: 5, color: 'bg-amber-500' },
    ],
};

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 22 } } };

// =============================================================================
// COMPONENT
// =============================================================================

export default function EventAnalyticsPage() {
    const { id: _eventId } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
    const [salesView, setSalesView] = useState<'tickets' | 'revenue'>('tickets');

    useEffect(() => { const t = setTimeout(() => setLoading(false), 600); return () => clearTimeout(t); }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4"><Skeleton className="h-16 w-16" rounded="xl" /><div className="space-y-2"><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-32" /></div></div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} className="h-28" />)}</div>
                <SkeletonCard className="h-72" />
            </div>
        );
    }

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* ── Header ── */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/organizer/events" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"><ArrowLeft size={20} className="text-gray-500" /></Link>
                    <img src={EVENT_INFO.image} alt="" className="w-14 h-14 rounded-xl object-cover" />
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{EVENT_INFO.title}</h1>
                        <p className="text-sm text-gray-500 dark:text-neutral-400 flex items-center gap-1"><Calendar size={13} /> {EVENT_INFO.date}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-gray-100 dark:bg-neutral-700 rounded-xl p-1">
                        {(['7d', '30d', '90d', 'all'] as const).map(p => (
                            <button key={p} onClick={() => setPeriod(p)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', period === p ? 'bg-white dark:bg-neutral-600 shadow-sm text-primary-600' : 'text-gray-500')}>{p === 'all' ? 'All' : p}</button>
                        ))}
                    </div>
                    <Button variant="ghost" size="sm"><Download size={14} className="mr-1.5" /> Export</Button>
                </div>
            </motion.div>

            {/* ── Overview Cards ── */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard label="Tickets Sold" value={`${OVERVIEW.ticketsSold}/${OVERVIEW.ticketsTotal}`} icon={<Ticket size={20} />} trend="+12% vs last week" trendUp />
                <StatsCard label="Total Revenue" value={formatCurrency(OVERVIEW.totalRevenue)} icon={<DollarSign size={20} />} trend="+8.5%" trendUp color="text-green-600 dark:text-green-400" bgColor="bg-green-50 dark:bg-green-500/10" borderColor="border-green-100 dark:border-green-500/20" />
                <StatsCard label="Conversion Rate" value={`${OVERVIEW.conversionRate}%`} icon={<TrendingUp size={20} />} trend="+2.1%" trendUp color="text-amber-600 dark:text-amber-400" bgColor="bg-amber-50 dark:bg-amber-500/10" borderColor="border-amber-100 dark:border-amber-500/20" />
                <StatsCard label="Avg. Ticket Price" value={formatCurrency(OVERVIEW.avgTicketPrice)} icon={<BarChart3 size={20} />} color="text-violet-600 dark:text-violet-400" bgColor="bg-violet-50 dark:bg-violet-500/10" borderColor="border-violet-100 dark:border-violet-500/20" />
            </motion.div>

            {/* ── Sales Over Time ── */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-bold text-gray-900 dark:text-white">Sales Over Time</h2>
                    <div className="flex bg-gray-100 dark:bg-neutral-700 rounded-lg p-0.5">
                        <button onClick={() => setSalesView('tickets')} className={cn('px-3 py-1 rounded-md text-xs font-medium transition-colors', salesView === 'tickets' ? 'bg-white dark:bg-neutral-600 shadow-sm text-primary-600' : 'text-gray-500')}>Tickets</button>
                        <button onClick={() => setSalesView('revenue')} className={cn('px-3 py-1 rounded-md text-xs font-medium transition-colors', salesView === 'revenue' ? 'bg-white dark:bg-neutral-600 shadow-sm text-primary-600' : 'text-gray-500')}>Revenue</button>
                    </div>
                </div>
                {/* Simple bar chart */}
                <div className="flex items-end gap-1.5 h-48">
                    {DAILY_SALES.map((d, i) => {
                        const maxVal = salesView === 'tickets' ? 70 : 5000;
                        const val = salesView === 'tickets' ? d.tickets : d.revenue;
                        const pct = Math.min((val / maxVal) * 100, 100);
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1 group" title={`${d.day}: ${salesView === 'tickets' ? d.tickets + ' tickets' : formatCurrency(d.revenue)}`}>
                                <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">{salesView === 'tickets' ? d.tickets : `$${d.revenue}`}</span>
                                <div className="w-full bg-primary-100 dark:bg-primary-500/20 rounded-t-md overflow-hidden" style={{ height: '100%' }}>
                                    <div className="w-full bg-primary-500 rounded-t-md transition-all duration-500 hover:bg-primary-600" style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }} />
                                </div>
                                <span className="text-[9px] text-gray-400 truncate w-full text-center">{d.day.split(' ')[1]}</span>
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ── Ticket Tier Breakdown ── */}
                <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                    <h2 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2"><PieChart size={16} /> Ticket Tiers</h2>
                    <div className="space-y-4">
                        {TICKET_TIERS.map((tier) => (
                            <div key={tier.name}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-gray-900 dark:text-white">{tier.name}</span>
                                    <span className="text-gray-500 dark:text-neutral-400">{tier.sold}/{tier.total} • {formatCurrency(tier.revenue)}</span>
                                </div>
                                <div className="w-full h-2.5 bg-gray-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                                    <div className={cn('h-full rounded-full transition-all duration-700', tier.color)} style={{ width: `${(tier.sold / tier.total) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-5 pt-4 border-t border-gray-100 dark:border-neutral-700 flex justify-between text-sm font-bold text-gray-900 dark:text-white">
                        <span>Total</span>
                        <span>{formatCurrency(TICKET_TIERS.reduce((s, t) => s + t.revenue, 0))}</span>
                    </div>
                </motion.div>

                {/* ── Traffic Sources ── */}
                <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                    <h2 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2"><Globe size={16} /> Traffic Sources</h2>
                    <div className="space-y-3">
                        {TRAFFIC_SOURCES.map((src) => (
                            <div key={src.source} className="flex items-center gap-3">
                                <div className={cn('w-3 h-3 rounded-full', src.color)} />
                                <span className="flex-1 text-sm text-gray-700 dark:text-neutral-300">{src.source}</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{src.visitors.toLocaleString()}</span>
                                <span className="text-xs text-gray-400 w-10 text-right">{src.pct}%</span>
                            </div>
                        ))}
                    </div>
                    {/* Simple horizontal stacked bar */}
                    <div className="flex h-4 rounded-full overflow-hidden mt-5">
                        {TRAFFIC_SOURCES.map(src => (
                            <div key={src.source} className={cn('h-full transition-all', src.color)} style={{ width: `${src.pct}%` }} title={`${src.source}: ${src.pct}%`} />
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* ── Sales Funnel ── */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                <h2 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2"><TrendingUp size={16} /> Sales Funnel</h2>
                <div className="space-y-3">
                    {FUNNEL_STEPS.map((step, i) => (
                        <div key={step.label} className="flex items-center gap-4">
                            <span className="w-36 text-sm text-gray-700 dark:text-neutral-300">{step.label}</span>
                            <div className="flex-1 h-8 bg-gray-100 dark:bg-neutral-700 rounded-lg overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${step.pct}%` }}
                                    transition={{ delay: i * 0.15, duration: 0.6 }}
                                    className={cn('h-full rounded-lg flex items-center justify-end pr-3', step.color)}
                                >
                                    <span className="text-xs font-bold text-white">{step.value.toLocaleString()}</span>
                                </motion.div>
                            </div>
                            <span className="text-xs text-gray-400 w-12 text-right">{step.pct}%</span>
                            {i > 0 && (
                                <span className="text-xs text-amber-600 dark:text-amber-400 w-12 text-right">
                                    {((FUNNEL_STEPS[i].value / FUNNEL_STEPS[i - 1].value) * 100).toFixed(1)}%
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* ── Demographics ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                    <h2 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2"><Users size={16} /> Age Distribution</h2>
                    <div className="space-y-3">
                        {DEMOGRAPHICS.age.map((a) => (
                            <div key={a.group} className="flex items-center gap-3">
                                <span className="w-14 text-sm text-gray-500 dark:text-neutral-400">{a.group}</span>
                                <div className="flex-1">
                                    <ProgressBar value={a.pct} max={40} size="md" label={`${a.pct}%`} showValue={false} />
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white w-10 text-right">{a.pct}%</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                    <h2 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2"><PieChart size={16} /> Gender Split</h2>
                    <div className="flex items-center gap-6">
                        {/* Simple donut representation */}
                        <div className="relative w-32 h-32 flex-shrink-0">
                            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                {DEMOGRAPHICS.gender.reduce<{ elements: JSX.Element[]; offset: number }>((acc, g) => {
                                    const el = (
                                        <circle
                                            key={g.label}
                                            cx="18" cy="18" r="15.915"
                                            fill="none"
                                            stroke={g.label === 'Male' ? '#0ea5e9' : g.label === 'Female' ? '#ec4899' : '#f59e0b'}
                                            strokeWidth="3.5"
                                            strokeDasharray={`${g.pct} ${100 - g.pct}`}
                                            strokeDashoffset={`-${acc.offset}`}
                                            strokeLinecap="round"
                                        />
                                    );
                                    return { elements: [...acc.elements, el], offset: acc.offset + g.pct };
                                }, { elements: [], offset: 0 }).elements}
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xl font-bold text-gray-900 dark:text-white">{OVERVIEW.ticketsSold}</span>
                            </div>
                        </div>
                        <div className="space-y-3 flex-1">
                            {DEMOGRAPHICS.gender.map(g => (
                                <div key={g.label} className="flex items-center gap-3 justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={cn('w-3 h-3 rounded-full', g.color)} />
                                        <span className="text-sm text-gray-700 dark:text-neutral-300">{g.label}</span>
                                    </div>
                                    <span className="font-semibold text-gray-900 dark:text-white">{g.pct}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* ── Engagement ── */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-5 text-center">
                    <EyeIcon className="mx-auto text-gray-400 mb-2" size={22} />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">6,195</p>
                    <p className="text-xs text-gray-500 dark:text-neutral-400">Page Views</p>
                </div>
                <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-5 text-center">
                    <Heart className="mx-auto text-pink-400 mb-2" size={22} />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">348</p>
                    <p className="text-xs text-gray-500 dark:text-neutral-400">Favorites</p>
                </div>
                <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-5 text-center">
                    <Share2 className="mx-auto text-primary-400 mb-2" size={22} />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">127</p>
                    <p className="text-xs text-gray-500 dark:text-neutral-400">Shares</p>
                </div>
                <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-5 text-center">
                    <ArrowUpRight className="mx-auto text-green-500 mb-2" size={22} />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">14.8%</p>
                    <p className="text-xs text-gray-500 dark:text-neutral-400">Conversion</p>
                </div>
            </motion.div>
        </motion.div>
    );
}
