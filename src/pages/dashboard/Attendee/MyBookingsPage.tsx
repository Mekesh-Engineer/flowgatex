import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Calendar,
    MapPin,
    Search,
    QrCode,
    Download,
    MoreVertical,
    Ticket,
    Clock,
    FileText,
    CalendarPlus,
    RotateCcw,
    ExternalLink,
    CreditCard,
    User,
    ChevronRight,
} from 'lucide-react';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import { Tabs } from '@/components/common/Tabs';
import EmptyState from '@/components/common/EmptyState';
import { SkeletonCard } from '@/components/common/Skeleton';
import Modal from '@/components/common/Modal';
import Pagination from '@/components/common/Pagination';
import { BookingStatus } from '@/lib/constants';

// =============================================================================
// TYPES
// =============================================================================

interface BookingItem {
    id: string;
    eventId: string;
    eventTitle: string;
    eventImage: string;
    date: string;
    time: string;
    venue: string;
    ticketCount: number;
    totalPaid: number;
    status: string;
    bookingDate: string;
    qrCode: string;
    attendeeName: string;
    attendeeEmail: string;
    paymentMethod: string;
    transactionId: string;
}

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_BOOKINGS: BookingItem[] = Array.from({ length: 14 }, (_, i) => ({
    id: `BK-${String(10000 + i).slice(1)}`,
    eventId: `evt-${i + 1}`,
    eventTitle: [
        'Tech Summit 2026',
        'Jazz Night Live',
        'AI & ML Conference',
        'Summer Music Festival',
        'Design Thinking Workshop',
        'Startup Pitch Day',
        'Food & Wine Expo',
        'Marathon 2026',
        'Photography Masterclass',
        'Blockchain Summit',
        'Open Mic Night',
        'Art Gallery Opening',
        'Yoga Retreat',
        'Game Dev Meetup',
    ][i],
    eventImage: `https://images.unsplash.com/photo-${1492684223066 + i * 333}-81342ee5ff30?auto=format&fit=crop&q=80&w=400`,
    date: i < 6 ? `Apr ${5 + i * 3}, 2026` : `Feb ${1 + i}, 2026`,
    time: `${10 + (i % 8)}:00`,
    venue: ['Convention Center, SF', 'Blue Note, NY', 'Moscone Hall, SF', 'Central Park, NY'][i % 4],
    ticketCount: 1 + (i % 3),
    totalPaid: 49 + i * 25,
    status: i < 6
        ? BookingStatus.CONFIRMED
        : i < 10
            ? BookingStatus.CONFIRMED
            : i < 12
                ? BookingStatus.CANCELLED
                : BookingStatus.REFUNDED,
    bookingDate: `Jan ${10 + i}, 2026`,
    qrCode: `QR-${10000 + i}`,
    attendeeName: 'Alex Johnson',
    attendeeEmail: 'alex@example.com',
    paymentMethod: i % 2 === 0 ? 'Credit Card' : 'PayPal',
    transactionId: `TXN-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
}));

const statusBadgeVariant = (status: string) => {
    switch (status) {
        case BookingStatus.CONFIRMED: return 'success';
        case BookingStatus.PENDING: return 'warning';
        case BookingStatus.CANCELLED: return 'error';
        case BookingStatus.REFUNDED: return 'info';
        default: return 'default';
    }
};

const ITEMS_PER_PAGE = 5;

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

export default function MyBookingsPage() {
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
    const [qrBooking, setQrBooking] = useState<BookingItem | null>(null);
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);

    useEffect(() => {
        const t = setTimeout(() => setLoading(false), 600);
        return () => clearTimeout(t);
    }, []);

    const filtered = useMemo(() => {
        let list = MOCK_BOOKINGS;
        if (tab === 'upcoming') list = list.filter((b) => b.status === BookingStatus.CONFIRMED && new Date(b.date) > new Date());
        else if (tab === 'past') list = list.filter((b) => b.status === BookingStatus.CONFIRMED && new Date(b.date) <= new Date());
        else if (tab === 'cancelled') list = list.filter((b) => [BookingStatus.CANCELLED, BookingStatus.REFUNDED].includes(b.status as BookingStatus));

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (b) => b.eventTitle.toLowerCase().includes(q) || b.id.toLowerCase().includes(q) || b.venue.toLowerCase().includes(q)
            );
        }
        return list;
    }, [tab, search]);

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const tabs = [
        { id: 'all', label: 'All', badge: String(MOCK_BOOKINGS.length) },
        { id: 'upcoming', label: 'Upcoming' },
        { id: 'past', label: 'Past' },
        { id: 'cancelled', label: 'Cancelled' },
    ];

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">My Bookings</h1>
                <p className="text-gray-500 dark:text-neutral-400 mt-1">Manage and track all your event bookings</p>
            </div>

            {/* ── Tabs & Search ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <Tabs items={tabs} activeTab={tab} onChange={(id) => { setTab(id); setPage(1); }} variant="pills" size="sm" />
                <div className="relative w-full sm:w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search bookings..."
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white placeholder:text-gray-400"
                    />
                </div>
            </div>

            {/* ── Loading ── */}
            {loading ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <SkeletonCard key={i} className="h-40" />
                    ))}
                </div>
            ) : paginated.length === 0 ? (
                <EmptyState
                    variant={search ? 'search' : 'default'}
                    title={search ? 'No bookings found' : 'No bookings yet'}
                    description={search ? 'Try a different search term.' : "You haven't booked any events yet. Explore events to get started!"}
                    action={
                        !search ? (
                            <Button variant="primary" onClick={() => (window.location.href = '/events')}>
                                Explore Events
                            </Button>
                        ) : undefined
                    }
                />
            ) : (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
                    {paginated.map((booking) => (
                        <motion.div key={booking.id} variants={itemVariants}>
                            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-all overflow-hidden">
                                <div className="flex flex-col md:flex-row">
                                    {/* Image */}
                                    <div className="md:w-44 h-36 md:h-auto flex-shrink-0 overflow-hidden">
                                        <img
                                            src={booking.eventImage}
                                            alt={booking.eventTitle}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src =
                                                    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=400';
                                            }}
                                        />
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 p-4 md:p-5 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">{booking.eventTitle}</h3>
                                                    <p className="text-xs text-gray-400 dark:text-neutral-500 mt-0.5">Booking {booking.id}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={statusBadgeVariant(booking.status) as 'success' | 'warning' | 'error' | 'info' | 'default'}>
                                                        {booking.status}
                                                    </Badge>
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setActionMenuId(actionMenuId === booking.id ? null : booking.id)}
                                                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                                                            aria-label="More actions"
                                                        >
                                                            <MoreVertical size={16} className="text-gray-400" />
                                                        </button>
                                                        {actionMenuId === booking.id && (
                                                            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-xl z-30 py-1">
                                                                <button onClick={() => { setSelectedBooking(booking); setActionMenuId(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700">
                                                                    <FileText size={14} /> View Details
                                                                </button>
                                                                <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700">
                                                                    <Download size={14} /> Download Invoice
                                                                </button>
                                                                <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700">
                                                                    <CalendarPlus size={14} /> Add to Calendar
                                                                </button>
                                                                {booking.status === BookingStatus.CONFIRMED && (
                                                                    <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                                                                        <RotateCcw size={14} /> Request Refund
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 text-sm text-gray-500 dark:text-neutral-400">
                                                <span className="flex items-center gap-1.5"><Calendar size={14} /> {booking.date}</span>
                                                <span className="flex items-center gap-1.5"><Clock size={14} /> {booking.time}</span>
                                                <span className="flex items-center gap-1.5"><MapPin size={14} /> {booking.venue}</span>
                                                <span className="flex items-center gap-1.5"><Ticket size={14} /> {booking.ticketCount} ticket{booking.ticketCount > 1 ? 's' : ''}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-neutral-700">
                                            <p className="font-bold text-gray-900 dark:text-white">
                                                ${booking.totalPaid.toFixed(2)}
                                            </p>
                                            <div className="flex gap-2">
                                                {booking.status === BookingStatus.CONFIRMED && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setQrBooking(booking)}
                                                    >
                                                        <QrCode size={15} className="mr-1.5" /> View Ticket
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedBooking(booking)}
                                                >
                                                    Details <ChevronRight size={14} className="ml-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} className="mt-6" />

            {/* ── Booking Details Modal ── */}
            <Modal isOpen={!!selectedBooking} onClose={() => setSelectedBooking(null)} title="Booking Details" size="lg">
                {selectedBooking && (
                    <div className="space-y-6 text-sm">
                        <div className="flex items-center gap-4">
                            <img src={selectedBooking.eventImage} alt="" className="w-20 h-20 rounded-xl object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=400'; }} />
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{selectedBooking.eventTitle}</h3>
                                <p className="text-gray-500 dark:text-neutral-400">{selectedBooking.date} at {selectedBooking.time}</p>
                                <Badge variant={statusBadgeVariant(selectedBooking.status) as 'success' | 'warning' | 'error' | 'info' | 'default'} className="mt-1">
                                    {selectedBooking.status}
                                </Badge>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-neutral-700/40 rounded-xl p-4">
                            <div><p className="text-gray-400 text-xs mb-1">Booking ID</p><p className="font-medium text-gray-900 dark:text-white">{selectedBooking.id}</p></div>
                            <div><p className="text-gray-400 text-xs mb-1">Booking Date</p><p className="font-medium text-gray-900 dark:text-white">{selectedBooking.bookingDate}</p></div>
                            <div><p className="text-gray-400 text-xs mb-1">Tickets</p><p className="font-medium text-gray-900 dark:text-white">{selectedBooking.ticketCount}</p></div>
                            <div><p className="text-gray-400 text-xs mb-1">Total Paid</p><p className="font-bold text-gray-900 dark:text-white">${selectedBooking.totalPaid.toFixed(2)}</p></div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><User size={15} /> Attendee</h4>
                            <p className="text-gray-600 dark:text-neutral-300">{selectedBooking.attendeeName}</p>
                            <p className="text-gray-400 dark:text-neutral-500">{selectedBooking.attendeeEmail}</p>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><CreditCard size={15} /> Payment</h4>
                            <div className="flex justify-between text-gray-600 dark:text-neutral-300">
                                <span>Method: {selectedBooking.paymentMethod}</span>
                                <span>TXN: {selectedBooking.transactionId}</span>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><MapPin size={15} /> Venue</h4>
                            <p className="text-gray-600 dark:text-neutral-300">{selectedBooking.venue}</p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button variant="primary" className="flex-1" onClick={() => { setQrBooking(selectedBooking); setSelectedBooking(null); }}>
                                <QrCode size={16} className="mr-2" /> View Ticket
                            </Button>
                            <Button variant="ghost" className="flex-1">
                                <Download size={16} className="mr-2" /> Download Invoice
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ── QR Ticket Modal ── */}
            <Modal isOpen={!!qrBooking} onClose={() => setQrBooking(null)} title="Your Ticket" size="md">
                {qrBooking && (
                    <div className="flex flex-col items-center text-center space-y-5 py-4">
                        <div className="w-52 h-52 bg-white rounded-2xl border-2 border-dashed border-gray-200 dark:border-neutral-600 flex items-center justify-center">
                            <QrCode size={120} className="text-gray-800 dark:text-neutral-200" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider">Ticket Number</p>
                            <p className="font-mono font-bold text-lg text-gray-900 dark:text-white">{qrBooking.qrCode}</p>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">{qrBooking.eventTitle}</h3>
                            <p className="text-sm text-gray-500 dark:text-neutral-400">{qrBooking.date} • {qrBooking.time}</p>
                            <p className="text-sm text-gray-500 dark:text-neutral-400">{qrBooking.venue}</p>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-neutral-300">Attendee: {qrBooking.attendeeName}</p>
                        <div className="flex gap-3 w-full">
                            <Button variant="primary" className="flex-1">
                                <Download size={16} className="mr-2" /> Download PDF
                            </Button>
                            <Button variant="ghost" className="flex-1">
                                <ExternalLink size={16} className="mr-2" /> Add to Wallet
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
