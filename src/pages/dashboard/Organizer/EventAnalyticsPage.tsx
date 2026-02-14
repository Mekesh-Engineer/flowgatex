import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
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
    ArrowDownRight,
    Calendar
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { useEventById } from '@/features/events/hooks/useEvents';
import LoadingScreen from '@/components/common/LoadingScreen';

// ─── Animation Variants ──────────────────────────────────────────────────────

const containerVariants = { 
    hidden: { opacity: 0 }, 
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } } 
};

const itemVariants = { 
    hidden: { opacity: 0, y: 20 }, 
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } 
};

// ─── Helper Components ───────────────────────────────────────────────────────

const MetricCard = ({ label, value, icon: Icon, trend, colorClass }: any) => (
    <motion.div 
        variants={itemVariants}
        whileHover={{ y: -5, boxShadow: 'var(--shadow-glow)' }}
        className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 transition-all duration-300 relative overflow-hidden group"
    >
        {/* Decorative background blob */}
        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-5 blur-2xl transition-opacity group-hover:opacity-10 ${colorClass.replace('text-', 'bg-')}`} />

        <div className="flex justify-between items-start mb-4 relative z-10">
            <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 backdrop-blur-sm`}>
                <Icon size={22} className={colorClass.replace('bg-', 'text-')} />
            </div>
            {trend && (
                <span className={`text-xs font-bold px-2 py-1 rounded-full border flex items-center gap-1 ${trend > 0 ? 'text-[var(--color-success)] bg-[var(--color-success)]/10 border-[var(--color-success)]/20' : 'text-[var(--color-error)] bg-[var(--color-error)]/10 border-[var(--color-error)]/20'}`}>
                    {trend > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {Math.abs(trend)}%
                </span>
            )}
        </div>
        
        <div className="relative z-10">
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-1 tracking-tight">{value}</h3>
            <p className="text-xs text-[var(--text-muted)] font-medium">{label}</p>
        </div>
    </motion.div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

export default function EventAnalyticsPage() {
    const { id } = useParams<{ id: string }>();
    const { data: event, isLoading, error } = useEventById(id || '');
    
    const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
    const [salesView, setSalesView] = useState<'tickets' | 'revenue'>('revenue');

    // ─── Derived Real-Time Data ───
    
    const overview = useMemo(() => {
        if (!event) return null;

        const ticketsSold = event.ticketTiers?.reduce((acc, t) => acc + (t.sold || 0), 0) || event.stats?.ticketsSold || 0;
        const totalCapacity = event.ticketTiers?.reduce((acc, t) => acc + (t.quantity || 0), 0) || event.stats?.capacity || 100;
        const revenue = event.ticketTiers?.reduce((acc, t) => acc + (t.sold * t.price), 0) || event.stats?.revenue || 0;
        
        // Calculate average ticket price
        const avgPrice = ticketsSold > 0 ? revenue / ticketsSold : 0;
        
        // Calculate conversion rate (Mocked based on sales for now)
        const conversionRate = ticketsSold > 0 ? ((ticketsSold / (ticketsSold * 8)) * 100).toFixed(1) : 0;

        return {
            ticketsSold,
            totalCapacity,
            revenue,
            avgPrice,
            conversionRate
        };
    }, [event]);

    // Mock Sales Chart Data (Simulated based on real totals)
    const chartData = useMemo(() => {
        if (!overview) return [];
        const days = 14;
        const data = [];
        let remainingRevenue = overview.revenue;
        let remainingTickets = overview.ticketsSold;

        for (let i = 0; i < days; i++) {
            // Distribute randomly
            const isLast = i === days - 1;
            const dailyRev = isLast ? remainingRevenue : Math.floor(remainingRevenue * (Math.random() * 0.3));
            const dailyTix = isLast ? remainingTickets : Math.floor(remainingTickets * (Math.random() * 0.3));
            
            remainingRevenue -= dailyRev;
            remainingTickets -= dailyTix;

            data.unshift({
                day: dayjs().subtract(i, 'day').format('MMM DD'),
                revenue: Math.max(0, dailyRev),
                tickets: Math.max(0, dailyTix)
            });
        }
        return data;
    }, [overview]);

    if (isLoading) return <LoadingScreen />;
    if (error || !event) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="bg-[var(--bg-surface)] p-6 rounded-full mb-4">
                <BarChart3 size={48} className="text-[var(--text-muted)]" />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Event Not Found</h2>
            <p className="text-[var(--text-secondary)] mt-2">We couldn't load analytics for this event.</p>
            <Link to="/organizer/events" className="mt-6 text-[var(--color-primary)] font-bold hover:underline">Return to Events</Link>
        </div>
    );

    return (
        <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="visible" 
            className="space-y-8 pb-12 font-sans text-[var(--text-primary)]"
        >
            {/* ── Header ── */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Link 
                        to="/organizer/events" 
                        className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] hover:bg-[var(--bg-hover)] transition-all group"
                    >
                        <ArrowLeft size={20} className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]" />
                    </Link>
                    <div className="flex items-center gap-4">
                         <div 
                            className="w-14 h-14 rounded-xl bg-[var(--bg-surface)] bg-cover bg-center border border-[var(--border-primary)] shadow-sm" 
                            style={{ backgroundImage: `url(${event.coverImage || '/placeholder-event.jpg'})` }}
                        />
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{event.title}</h1>
                            <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1.5 mt-0.5">
                                <Calendar size={14} /> 
                                {formatDate(event.startDate)}
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex bg-[var(--bg-surface)] p-1 rounded-xl border border-[var(--border-primary)]">
                        {(['7d', '30d', '90d', 'all'] as const).map(p => (
                            <button 
                                key={p} 
                                onClick={() => setPeriod(p)} 
                                className={cn(
                                    'px-4 py-2 rounded-lg text-xs font-bold transition-all', 
                                    period === p ? 'bg-[var(--bg-card)] text-[var(--color-primary)] shadow-sm border border-[var(--border-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                                )}
                            >
                                {p === 'all' ? 'All Time' : p.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <button className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-[var(--color-primary)]/20 hover:bg-[var(--color-primary-focus)] transition-all">
                        <Download size={16} /> 
                        <span className="hidden sm:inline">Export Report</span>
                    </button>
                </div>
            </motion.div>

            {/* ── Overview Cards ── */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                    label="Tickets Sold" 
                    value={`${overview?.ticketsSold} / ${overview?.totalCapacity}`} 
                    icon={Ticket} 
                    trend={12} 
                    colorClass="text-[var(--color-primary)]" 
                />
                <MetricCard 
                    label="Total Revenue" 
                    value={formatCurrency(overview?.revenue || 0)} 
                    icon={DollarSign} 
                    trend={8.5} 
                    colorClass="text-[var(--color-success)]" 
                />
                <MetricCard 
                    label="Conversion Rate" 
                    value={`${overview?.conversionRate}%`} 
                    icon={TrendingUp} 
                    trend={2.1} 
                    colorClass="text-[var(--color-warning)]" 
                />
                <MetricCard 
                    label="Avg. Ticket Price" 
                    value={formatCurrency(overview?.avgPrice || 0)} 
                    icon={BarChart3} 
                    colorClass="text-[var(--color-secondary)]" 
                />
            </motion.div>

            {/* ── Content Grid: Charts & Tables ── */}
            <div className="grid grid-cols-12 gap-8">
                
                {/* ── Sales Over Time Chart ── */}
                <motion.div 
                    variants={itemVariants} 
                    className="col-span-12 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">Sales Performance</h2>
                            <p className="text-sm text-[var(--text-muted)]">Daily revenue and ticket sales trends</p>
                        </div>
                        <div className="flex bg-[var(--bg-surface)] rounded-lg p-1 border border-[var(--border-primary)]">
                            <button 
                                onClick={() => setSalesView('tickets')} 
                                className={cn('px-3 py-1.5 rounded-md text-xs font-bold transition-all', salesView === 'tickets' ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]')}
                            >
                                Tickets
                            </button>
                            <button 
                                onClick={() => setSalesView('revenue')} 
                                className={cn('px-3 py-1.5 rounded-md text-xs font-bold transition-all', salesView === 'revenue' ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]')}
                            >
                                Revenue
                            </button>
                        </div>
                    </div>
                    
                    {/* Chart Visualization */}
                    <div className="relative h-64 w-full flex items-end justify-between gap-2 px-2">
                        {chartData.map((d, i) => {
                            const val = salesView === 'tickets' ? d.tickets : d.revenue;
                            const maxVal = Math.max(...chartData.map(cd => salesView === 'tickets' ? cd.tickets : cd.revenue)) || 1;
                            const heightPct = (val / maxVal) * 100;
                            
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end relative">
                                    {/* Tooltip */}
                                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--bg-surface)] border border-[var(--border-primary)] px-2 py-1 rounded-lg text-xs font-bold shadow-lg whitespace-nowrap z-10 pointer-events-none">
                                        {salesView === 'tickets' ? `${d.tickets} tickets` : formatCurrency(d.revenue)}
                                    </div>
                                    
                                    <div className="w-full relative rounded-t-lg overflow-hidden bg-[var(--bg-surface)] h-full max-h-[85%]">
                                        <motion.div 
                                            initial={{ height: 0 }}
                                            animate={{ height: `${heightPct}%` }}
                                            transition={{ duration: 0.8, delay: i * 0.05 }}
                                            className={cn(
                                                "w-full absolute bottom-0 transition-colors duration-300 rounded-t-lg opacity-80 group-hover:opacity-100", 
                                                salesView === 'tickets' ? "bg-[var(--color-primary)]" : "bg-[var(--color-success)]"
                                            )} 
                                        />
                                    </div>
                                    <span className="text-[10px] text-[var(--text-muted)] font-medium truncate w-full text-center">{d.day}</span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* ── Ticket Tiers Breakdown ── */}
                <motion.div 
                    variants={itemVariants} 
                    className="col-span-12 lg:col-span-6 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-sm"
                >
                    <h2 className="text-lg font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                        <Ticket size={20} className="text-[var(--color-primary)]" />
                        Ticket Tiers Breakdown
                    </h2>
                    
                    <div className="space-y-6">
                        {event.ticketTiers && event.ticketTiers.length > 0 ? (
                            event.ticketTiers.map((tier) => {
                                const sold = tier.sold || 0;
                                const total = tier.quantity || 100;
                                const pct = (sold / total) * 100;
                                const revenue = sold * tier.price;
                                
                                return (
                                    <div key={tier.name} className="group">
                                        <div className="flex justify-between items-end mb-2">
                                            <div>
                                                <span className="font-bold text-sm text-[var(--text-primary)] block">{tier.name}</span>
                                                <span className="text-xs text-[var(--text-muted)]">{formatCurrency(revenue)} revenue</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-bold text-[var(--text-primary)]">{sold}</span>
                                                <span className="text-xs text-[var(--text-muted)]"> / {total} sold</span>
                                            </div>
                                        </div>
                                        <div className="w-full h-2.5 bg-[var(--bg-surface)] rounded-full overflow-hidden border border-[var(--border-primary)]">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 1, delay: 0.2 }}
                                                className="h-full rounded-full bg-[var(--color-primary)] group-hover:bg-[var(--color-primary-focus)] transition-colors"
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-8 text-[var(--text-muted)] italic">
                                No ticket tier data available.
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* ── Mocked Demographics & Sources (Since backend doesn't support yet) ── */}
                <motion.div 
                    variants={itemVariants} 
                    className="col-span-12 lg:col-span-6 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-sm"
                >
                    <h2 className="text-lg font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                        <Globe size={20} className="text-[var(--color-secondary)]" />
                        Traffic Sources
                    </h2>
                    
                    <div className="space-y-4">
                        {[
                            { source: 'Direct', val: 38, color: 'bg-[var(--color-primary)]' },
                            { source: 'Social Media', val: 30, color: 'bg-[var(--color-secondary)]' },
                            { source: 'Search', val: 20, color: 'bg-[var(--color-warning)]' },
                            { source: 'Referral', val: 12, color: 'bg-[var(--color-success)]' }
                        ].map((src) => (
                            <div key={src.source} className="flex items-center gap-4">
                                <div className={`w-3 h-3 rounded-full ${src.color} shadow-sm`} />
                                <span className="flex-1 text-sm font-medium text-[var(--text-secondary)]">{src.source}</span>
                                <div className="flex-1">
                                    <div className="w-full h-2 bg-[var(--bg-surface)] rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${src.val}%` }}
                                            className={`h-full rounded-full ${src.color}`} 
                                        />
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-[var(--text-primary)] w-12 text-right">{src.val}%</span>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-[var(--border-primary)] grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[var(--bg-surface)] rounded-lg text-[var(--text-muted)]"><Users size={18} /></div>
                            <div>
                                <p className="text-xs text-[var(--text-muted)]">Top Age Group</p>
                                <p className="font-bold text-[var(--text-primary)]">25 - 34</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[var(--bg-surface)] rounded-lg text-[var(--text-muted)]"><PieChart size={18} /></div>
                            <div>
                                <p className="text-xs text-[var(--text-muted)]">Gender Split</p>
                                <p className="font-bold text-[var(--text-primary)]">55% Male</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
                
                {/* ── Bottom Stats ── */}
                <motion.div variants={itemVariants} className="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                    {[
                        { icon: EyeIcon, val: '6,195', label: 'Page Views', color: 'text-[var(--text-secondary)]' },
                        { icon: Heart, val: '348', label: 'Favorites', color: 'text-[var(--color-secondary)]' },
                        { icon: Share2, val: '127', label: 'Shares', color: 'text-[var(--color-primary)]' },
                        { icon: ArrowUpRight, val: `${overview?.conversionRate}%`, label: 'Conversion', color: 'text-[var(--color-success)]' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 text-center shadow-sm hover:border-[var(--color-primary)]/30 transition-colors">
                            <stat.icon className={`mx-auto mb-2 ${stat.color}`} size={24} />
                            <p className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{stat.val}</p>
                            <p className="text-xs text-[var(--text-muted)] font-medium uppercase">{stat.label}</p>
                        </div>
                    ))}
                </motion.div>

            </div>
        </motion.div>
    );
}
