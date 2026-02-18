import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Ticket,
    Search,
    Calendar,
    Clock,
    XCircle,
    ChevronRight,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useTickets } from '@/features/booking/hooks/useTickets';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Button from '@/components/common/Button';


type Tab = 'upcoming' | 'past' | 'cancelled';

const TABS: { key: Tab; label: string; icon: typeof Calendar }[] = [
    { key: 'upcoming', label: 'Upcoming', icon: Calendar },
    { key: 'past', label: 'Past', icon: Clock },
    { key: 'cancelled', label: 'Cancelled', icon: XCircle },
];

function MyTicketsPage() {
    const { upcoming, past, cancelled, isLoading } = useTickets();
    const [activeTab, setActiveTab] = useState<Tab>('upcoming');
    const [search, setSearch] = useState('');

    const currentTickets = useMemo(() => {
        const pool =
            activeTab === 'upcoming' ? upcoming : activeTab === 'past' ? past : cancelled;
        if (!search.trim()) return pool;
        const q = search.toLowerCase();
        return pool.filter(
            (t) =>
                t.eventTitle.toLowerCase().includes(q) ||
                t.tierName.toLowerCase().includes(q) ||
                t.id.toLowerCase().includes(q)
        );
    }, [activeTab, upcoming, past, cancelled, search]);

    // Group tickets by event
    const grouped = useMemo(() => {
        const map: Record<string, typeof currentTickets> = {};
        currentTickets.forEach((t) => {
            if (!map[t.eventId]) map[t.eventId] = [];
            map[t.eventId].push(t);
        });
        return Object.entries(map);
    }, [currentTickets]);

    if (isLoading) {
        return <LoadingSpinner fullScreen message="Loading your tickets..." />;
    }

    return (
        <div className="min-h-screen bg-[var(--bg-base)] transition-colors duration-300">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
                            My Tickets
                        </h1>
                        <p className="text-[var(--text-muted)] mt-1">
                            {upcoming.length} upcoming · {past.length} past · {cancelled.length} cancelled
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-[var(--border-primary)] pb-px">
                    {TABS.map(({ key, label, icon: Icon }) => {
                        const count =
                            key === 'upcoming'
                                ? upcoming.length
                                : key === 'past'
                                    ? past.length
                                    : cancelled.length;
                        return (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all border-b-2 -mb-px ${activeTab === key
                                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                    }`}
                            >
                                <Icon size={16} />
                                {label}
                                <span
                                    className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === key
                                        ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                                        : 'bg-[var(--bg-card)] text-[var(--text-muted)]'
                                        }`}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search tickets by event name, tier, or ID..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] focus:border-[var(--color-primary)] outline-none transition-all text-sm"
                    />
                </div>

                {/* Ticket Groups */}
                {grouped.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-primary)] mb-4">
                            <Ticket size={48} className="text-[var(--text-muted)]" />
                        </div>
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">
                            No {activeTab} tickets
                        </h3>
                        <p className="text-[var(--text-muted)] mb-6 max-w-sm">
                            {activeTab === 'upcoming'
                                ? "You don't have any upcoming event tickets. Browse events to book tickets!"
                                : activeTab === 'past'
                                    ? 'No past tickets found.'
                                    : 'No cancelled tickets found.'}
                        </p>
                        {activeTab === 'upcoming' && (
                            <Link to="/events">
                                <Button variant="primary" className="gap-2">
                                    Browse Events <ChevronRight size={16} />
                                </Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-8">
                        <AnimatePresence>
                            {grouped.map(([eventId, tickets]) => (
                                <motion.div
                                    key={eventId}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-primary)] overflow-hidden shadow-sm"
                                >
                                    {/* Event header */}
                                    <div className="px-6 py-4 border-b border-[var(--border-primary)] bg-[var(--bg-surface)]">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-bold text-[var(--text-primary)] text-lg">
                                                    {tickets[0].eventTitle}
                                                </h3>
                                                <p className="text-sm text-[var(--text-muted)] flex items-center gap-2 mt-1">
                                                    <Calendar size={14} />
                                                    {new Date(tickets[0].eventDate).toLocaleDateString('en-IN', {
                                                        weekday: 'short',
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                    <span>•</span>
                                                    <span>{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</span>
                                                </p>
                                            </div>
                                            <Link
                                                to={`/events/${eventId}`}
                                                className="text-sm font-medium text-[var(--color-primary)] hover:underline flex items-center gap-1"
                                            >
                                                Event Details <ChevronRight size={14} />
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Ticket list */}
                                    <div className="divide-y divide-[var(--border-primary)]">
                                        {tickets.map((ticket) => (
                                            <Link
                                                key={ticket.id}
                                                to={`/tickets/${ticket.id}`}
                                                className="flex items-center gap-4 px-6 py-4 hover:bg-[var(--bg-hover)] transition-colors"
                                            >
                                                {/* Mini QR */}
                                                <div className="shrink-0 bg-white p-1.5 rounded-lg">
                                                    <QRCodeSVG
                                                        value={ticket.qrData || ticket.id}
                                                        size={48}
                                                    />
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-[var(--text-primary)] text-sm">
                                                        {ticket.tierName}
                                                    </p>
                                                    <p className="text-xs text-[var(--text-muted)] font-mono truncate">
                                                        ID: {ticket.id}
                                                    </p>
                                                </div>

                                                {/* Status badge */}
                                                <div className="shrink-0">
                                                    <span
                                                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${ticket.status === 'valid'
                                                            ? 'bg-green-500/10 text-green-500'
                                                            : ticket.status === 'used'
                                                                ? 'bg-blue-500/10 text-blue-500'
                                                                : 'bg-red-500/10 text-red-500'
                                                            }`}
                                                    >
                                                        {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                                                    </span>
                                                </div>

                                                <ChevronRight size={16} className="text-[var(--text-muted)] shrink-0" />
                                            </Link>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MyTicketsPage;
