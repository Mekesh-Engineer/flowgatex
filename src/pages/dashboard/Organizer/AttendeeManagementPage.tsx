import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Users,
    CheckCircle2,
    Clock,
    Download,
    Search,
    Mail,
    QrCode,
    Send,
    XCircle,
    MoreVertical,
    FileText,
    Printer,
    RefreshCw,
    AlertCircle,
    X,
    Calendar,
    UserX,
    Ticket as TicketIcon,
    Copy
} from 'lucide-react';

import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import StatsCard from '@/components/common/StatsCard';
import DataTable, { type Column } from '@/components/common/DataTable';
import Modal from '@/components/common/Modal';
import Avatar from '@/components/common/Avatar';
import { Skeleton, SkeletonCard } from '@/components/common/Skeleton';

// Services
import { eventService } from '@/features/events/services/eventService';
import { getEventBookings, updateBookingStatus } from '@/features/booking/services/bookingService';
import { getEventTickets } from '@/features/booking/services/ticketService';

// Types
import type { Ticket } from '@/features/booking/types/ticket.types';
import type { CreateEventData } from '@/features/events/types/event.types';
import { BookingStatus } from '@/lib/constants';

// =============================================================================
// TYPES
// =============================================================================

type PaymentStatus = 'paid' | 'refunded' | 'failed' | 'pending';
type CheckInStatus = 'checked-in' | 'pending' | 'cancelled' | 'partial';

interface AttendeeItem {
    id: string; // Booking ID
    bookingId: string;
    transactionId: string;
    name: string;
    email: string;
    phone: string;
    avatar: string;
    ticketTier: string; // Primary tier or mixed
    quantity: number;
    amountPaid: number;
    paymentStatus: PaymentStatus;
    bookingDate: string; // ISO string or formatted
    bookingTimestamp: number; // for sorting
    status: CheckInStatus;
    checkInTime?: string;
    tickets: Ticket[];
    notes?: string;
    [key: string]: unknown;
}

// Animation Variants
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 22 } } };
const drawerVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: 'spring', damping: 25, stiffness: 200 } },
    exit: { x: '100%', opacity: 0, transition: { duration: 0.2 } }
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function AttendeeManagementPage() {
    const { id: eventId } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState<(CreateEventData & { id: string }) | null>(null);
    const [attendees, setAttendees] = useState<AttendeeItem[]>([]);

    // Filters & Search
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'checked-in' | 'pending' | 'cancelled'>('all');
    const [tierFilter, setTierFilter] = useState('all');
    const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'refunded'>('all');

    // Selection & Data
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [displayedAttendees, setDisplayedAttendees] = useState<AttendeeItem[]>([]);

    // Modals & Drawers
    const [selectedAttendee, setSelectedAttendee] = useState<AttendeeItem | null>(null);
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [refundAmount, setRefundAmount] = useState<number>(0);
    const [refundReason, setRefundReason] = useState('');

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            if (!eventId) return;
            try {
                setLoading(true);

                // Parallel fetching
                const [eventData, bookingsData, ticketsData] = await Promise.all([
                    eventService.getEventById(eventId),
                    getEventBookings(eventId),
                    getEventTickets(eventId)
                ]);

                if (eventData) setEvent(eventData);

                // Process Bookings & Tickets into View Model
                const processedAttendees: AttendeeItem[] = bookingsData.map(booking => {
                    const bookingTickets = ticketsData.filter(t => t.bookingId === booking.id);

                    // Determine primary attendee name (from first ticket or booking user data if available)
                    // Note: Booking interface might need adjustment if attendees[] is populated
                    const primaryName = booking.attendees && booking.attendees.length > 0
                        ? booking.attendees[0].name
                        : (bookingTickets[0]?.attendeeName || 'Unknown User');

                    const primaryEmail = booking.attendees && booking.attendees.length > 0
                        ? booking.attendees[0].email
                        : (bookingTickets[0]?.attendeeEmail || 'No Email');

                    // Calculate status
                    const totalTickets = bookingTickets.length;
                    const usedTickets = bookingTickets.filter(t => t.status === 'used').length;
                    const cancelledTickets = bookingTickets.filter(t => t.status === 'cancelled').length;

                    let status: CheckInStatus = 'pending';
                    if (booking.status === BookingStatus.CANCELLED) status = 'cancelled';
                    else if (usedTickets === totalTickets && totalTickets > 0) status = 'checked-in';
                    else if (usedTickets > 0) status = 'partial';
                    else if (cancelledTickets === totalTickets && totalTickets > 0) status = 'cancelled';

                    // Map Payment Status
                    let paymentStatus: PaymentStatus = 'pending';
                    if (booking.status === BookingStatus.CONFIRMED) paymentStatus = 'paid';
                    if (booking.status === BookingStatus.REFUNDED) paymentStatus = 'refunded';

                    // Tiers
                    const tiers = Array.from(new Set(bookingTickets.map(t => t.tierName))).join(', ');

                    return {
                        id: booking.id,
                        bookingId: booking.id,
                        transactionId: booking.paymentId || booking.razorpayOrderId || 'N/A',
                        name: primaryName,
                        email: primaryEmail,
                        phone: booking.attendees?.[0]?.phone || '',
                        avatar: '',
                        ticketTier: tiers || 'Standard',
                        quantity: bookingTickets.length || booking.tickets.reduce((acc, t) => acc + t.quantity, 0),
                        amountPaid: booking.finalAmount,
                        paymentStatus,
                        bookingDate: booking.bookingDate?.toDate ? booking.bookingDate.toDate().toLocaleDateString() : new Date().toLocaleDateString(),
                        bookingTimestamp: booking.bookingDate?.toMillis ? booking.bookingDate.toMillis() : Date.now(),
                        status,
                        checkInTime: usedTickets > 0 ? 'Partial/Checked In' : undefined,
                        tickets: bookingTickets,
                    };
                });

                setAttendees(processedAttendees);

            } catch (error) {
                console.error("Failed to fetch attendee data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [eventId]);

    // Filtering Logic
    useEffect(() => {
        let result = [...attendees];

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(a =>
                a.name.toLowerCase().includes(q) ||
                a.email.toLowerCase().includes(q) ||
                a.bookingId.toLowerCase().includes(q)
            );
        }

        if (statusFilter !== 'all') {
            if (statusFilter === 'checked-in') result = result.filter(a => a.status === 'checked-in' || a.status === 'partial');
            else result = result.filter(a => a.status === statusFilter);
        }

        if (tierFilter !== 'all') {
            result = result.filter(a => a.ticketTier.includes(tierFilter));
        }

        if (paymentFilter !== 'all') {
            result = result.filter(a => a.paymentStatus === paymentFilter);
        }

        setDisplayedAttendees(result);
    }, [search, statusFilter, tierFilter, paymentFilter, attendees]);

    // Derived Stats
    const stats = useMemo(() => {
        return {
            totalRegistered: attendees.filter(a => a.paymentStatus === 'paid').length,
            checkedIn: attendees.filter(a => a.status === 'checked-in' || a.status === 'partial').length,
            pending: attendees.filter(a => a.status === 'pending').length,
            cancelled: attendees.filter(a => a.status === 'cancelled').length,
            // Calculate via ticket logic ideally
            noShow: 0
        };
    }, [attendees]);

    // Handlers
    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === displayedAttendees.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(displayedAttendees.map(a => a.id)));
        }
    };

    const handleBulkCheckIn = async () => {
        // Implementation: Call API to check in all tickets associated with selected bookings
        console.log('Bulk check-in for:', Array.from(selectedIds));
        alert(`Simulating check-in for ${selectedIds.size} attendees`);
        setSelectedIds(new Set());
    };

    const handleRefund = async () => {
        if (!selectedAttendee) return;
        try {
            await updateBookingStatus(selectedAttendee.bookingId, BookingStatus.REFUNDED); // Requires backend support for full refund logic
            // Update local state
            setAttendees(prev => prev.map(a =>
                a.id === selectedAttendee.id ? { ...a, paymentStatus: 'refunded', status: 'cancelled' } : a
            ));
            setIsRefundModalOpen(false);
            setRefundReason('');
            setSelectedAttendee(null);
        } catch (err) {
            console.error(err);
        }
    };

    // Table Columns
    const columns: Column<AttendeeItem>[] = [
        {
            key: 'id',
            header: (
                <div className="flex items-center justify-center">
                    <input
                        type="checkbox"
                        className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                        checked={selectedIds.size === displayedAttendees.length && displayedAttendees.length > 0}
                        onChange={toggleSelectAll}
                    />
                </div>
            ) as any,
            width: '40px',
            align: 'center',
            render: (row) => (
                <input
                    type="checkbox"
                    className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                    checked={selectedIds.has(row.id)}
                    onChange={() => toggleSelection(row.id)}
                />
            )
        },
        {
            key: 'name',
            header: 'Attendee',
            render: (row) => (
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedAttendee(row)}>
                    <Avatar name={row.name} size="sm" />
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm hover:text-primary-600 dark:hover:text-primary-400 transition-colors">{row.name}</p>
                        <p className="text-xs text-gray-400">{row.email}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'ticketTier',
            header: 'Tier',
            render: (row) => <Badge variant="default" className="bg-gray-100 text-gray-700 dark:bg-neutral-700 dark:text-neutral-300">{row.ticketTier}</Badge>
        },
        {
            key: 'quantity',
            header: 'Qty',
            width: '60px',
            align: 'center'
        },
        {
            key: 'amountPaid',
            header: 'Payment',
            render: (row) => (
                <div className="flex flex-col items-end">
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(row.amountPaid)}
                    </span>
                    <span className={`text-[10px] uppercase font-bold ${row.paymentStatus === 'paid' ? 'text-green-600' :
                        row.paymentStatus === 'refunded' ? 'text-red-500' : 'text-amber-500'
                        }`}>
                        {row.paymentStatus}
                    </span>
                </div>
            ),
            align: 'right'
        },
        {
            key: 'status',
            header: 'Status',
            render: (row) => {
                if (row.status === 'checked-in')
                    return <Badge variant="success" className="gap-1.5"><CheckCircle2 size={12} /> Checked In</Badge>;
                if (row.status === 'partial')
                    return <Badge variant="info" className="gap-1.5"><CheckCircle2 size={12} /> Partial</Badge>;
                if (row.status === 'cancelled')
                    return <Badge variant="error" className="gap-1.5"><XCircle size={12} /> Cancelled</Badge>;
                return <Badge variant="warning" className="gap-1.5"><Clock size={12} /> Pending</Badge>;
            }
        },
        {
            key: 'actions',
            header: '',
            width: '50px',
            align: 'center',
            render: (_row) => (
                <div className="relative group">
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-400">
                        <MoreVertical size={16} />
                    </button>
                    {/* Simplified context menu - in real app use a Dropdown component */}
                </div>
            ),
        },
    ];

    if (loading) {
        return (
            <div className="space-y-6 pt-4">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-64" rounded="lg" />
                    <Skeleton className="h-10 w-32" rounded="lg" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">{Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} className="h-24" />)}</div>
                <SkeletonCard className="h-96" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-20 relative">

            {/* ── 1. Event Command Header ── */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-gray-200 dark:border-neutral-700 mb-6 -mx-4 px-4 sm:-mx-8 sm:px-8 pt-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <Link to="/organizer/events" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                            <ArrowLeft size={20} className="text-gray-500" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{event?.title || 'Loading Event...'}</h1>
                                <Badge variant="success">Published</Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-neutral-400 mt-1">
                                <span className="flex items-center gap-1">
                                    <Calendar size={12} />
                                    {event?.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBA'}
                                </span>
                                <span className="flex items-center gap-1">
                                    <TicketIcon size={12} />
                                    {stats.totalRegistered} Sold
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => window.open(`/organizer/scan?event=${eventId}`)}>
                            <QrCode size={14} className="mr-1.5" /> Scan Tickets
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => setIsEmailModalOpen(true)}>
                            <Mail size={14} className="mr-1.5" /> Email All
                        </Button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {[
                        { label: 'Overview', path: `/organizer/events/${eventId}/manage` },
                        { label: 'Edit', path: `/organizer/events/${eventId}/manage` },
                        { label: 'Tickets', path: `/organizer/events/${eventId}/manage?tab=tickets` },
                        { label: 'Attendees', path: `/organizer/events/${eventId}/attendees` },
                        { label: 'Analytics', path: `/organizer/events/${eventId}/analytics` },
                        { label: 'IoT', path: `/organizer/devices?event=${eventId}` },
                        { label: 'Marketing', path: `/organizer/marketing?event=${eventId}` }
                    ].map((tab) => (
                        <Link
                            key={tab.label}
                            to={tab.path}
                            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab.label === 'Attendees'
                                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                                }`}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </div>
            </div>

            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">

                {/* ── 2. Stats Dashboard ── */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <StatsCard label="Total Registered" value={stats.totalRegistered} icon={<Users size={18} />} />
                    <StatsCard label="Checked In" value={`${stats.checkedIn} (${Math.round((stats.checkedIn / (stats.totalRegistered || 1)) * 100)}%)`} icon={<CheckCircle2 size={18} />} color="text-green-600" bgColor="bg-green-50 dark:bg-green-900/20" borderColor="border-green-100 dark:border-green-800/30" />
                    <StatsCard label="Pending Check-In" value={stats.pending} icon={<Clock size={18} />} color="text-amber-600" bgColor="bg-amber-50 dark:bg-amber-900/20" borderColor="border-amber-100 dark:border-amber-800/30" />
                    <StatsCard label="No-Shows" value={stats.noShow} icon={<UserX size={18} />} color="text-gray-600" bgColor="bg-gray-50 dark:bg-gray-800/20" borderColor="border-gray-100 dark:border-gray-700" />
                    <StatsCard label="Cancellations" value={stats.cancelled} icon={<XCircle size={18} />} color="text-red-600" bgColor="bg-red-50 dark:bg-red-900/20" borderColor="border-red-100 dark:border-red-800/30" />
                </motion.div>

                {/* ── 3. Filter & Search Panel ── */}
                <motion.div variants={itemVariants} className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-white dark:bg-neutral-800 p-4 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-sm">
                    <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full xl:w-auto">
                        <div className="relative flex-1 min-w-[240px]">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search name, email, booking ID..."
                                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900/50 text-sm text-gray-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="all">All Status</option>
                                <option value="checked-in">Checked In</option>
                                <option value="pending">Pending</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            <select
                                value={tierFilter}
                                onChange={(e) => setTierFilter(e.target.value)}
                                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900/50 text-sm text-gray-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="all">All Tiers</option>
                                {event?.ticketTiers?.map(t => (
                                    <option key={t.id} value={t.name}>{t.name}</option>
                                ))}
                            </select>
                            <select
                                value={paymentFilter}
                                onChange={(e) => setPaymentFilter(e.target.value as any)}
                                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900/50 text-sm text-gray-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="all">All Payments</option>
                                <option value="paid">Paid</option>
                                <option value="refunded">Refunded</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2 self-end xl:self-auto">
                        <Button variant="ghost" size="sm"><Download size={14} className="mr-1.5" /> Export CSV</Button>
                        <Button variant="ghost" size="sm"><Printer size={14} className="mr-1.5" /> Badges</Button>
                    </div>
                </motion.div>

                {/* ── 4. Bulk Actions Bar ── */}
                <AnimatePresence>
                    {selectedIds.size > 0 && (
                        <motion.div
                            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                            animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
                            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                            className="bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/30 rounded-xl px-4 py-3 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded-md">
                                    {selectedIds.size} selected
                                </div>
                                <span className="text-sm text-primary-900 dark:text-primary-100 hidden sm:inline">attendees selected</span>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="secondary" className="bg-white hover:bg-gray-50 text-gray-700 dark:bg-neutral-800 dark:text-neutral-200" onClick={handleBulkCheckIn}>
                                    <CheckCircle2 size={14} className="mr-1.5 text-green-600" />
                                    Check In
                                </Button>
                                <Button size="sm" variant="secondary" className="bg-white hover:bg-gray-50 text-gray-700 dark:bg-neutral-800 dark:text-neutral-200" onClick={() => setIsEmailModalOpen(true)}>
                                    <Mail size={14} className="mr-1.5 text-blue-600" />
                                    Email
                                </Button>
                                <Button size="sm" variant="ghost" className="text-gray-500 hover:text-gray-700 dark:text-neutral-400" onClick={() => setSelectedIds(new Set())}>
                                    <X size={14} />
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── 5. Attendee Data Table ── */}
                <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 overflow-hidden shadow-sm">
                    <DataTable<AttendeeItem>
                        columns={columns}
                        data={displayedAttendees}
                        keyExtractor={(row) => row.id}
                        pageSize={10}
                        emptyMessage="No attendees match your filters"
                        onRowClick={(row) => setSelectedAttendee(row)}
                        striped
                    />
                </motion.div>
            </motion.div>

            {/* ── 6. Drawer: Attendee Details ── */}
            <AnimatePresence>
                {selectedAttendee && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedAttendee(null)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            variants={drawerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white dark:bg-neutral-900 shadow-2xl border-l border-gray-200 dark:border-neutral-700 flex flex-col"
                        >
                            {/* Drawer Header */}
                            <div className="p-6 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-start bg-gray-50/50 dark:bg-neutral-900">
                                <div className="flex items-center gap-4">
                                    <Avatar name={selectedAttendee.name} size="lg" className="ring-4 ring-white dark:ring-neutral-800 shadow-lg" />
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedAttendee.name}</h2>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <span>{selectedAttendee.email}</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedAttendee(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-neutral-800 rounded-full transition-colors">
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            {/* Drawer Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-8">

                                <div className={`p-4 rounded-xl border ${selectedAttendee.status === 'checked-in'
                                    ? 'bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-800'
                                    : 'bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800'
                                    }`}>
                                    <div className="flex items-start gap-3">
                                        {selectedAttendee.status === 'checked-in' ? <CheckCircle2 className="text-green-600 mt-0.5" /> : <Clock className="text-amber-600 mt-0.5" />}
                                        <div>
                                            <h4 className={`font-semibold ${selectedAttendee.status === 'checked-in' ? 'text-green-900 dark:text-green-300' : 'text-amber-900 dark:text-amber-300'}`}>
                                                {selectedAttendee.status === 'checked-in' ? 'Checked In' : 'Pending Check-in'}
                                            </h4>
                                            <p className={`text-sm mt-1 ${selectedAttendee.status === 'checked-in' ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>
                                                {selectedAttendee.status === 'checked-in'
                                                    ? `Scanned at ${selectedAttendee.checkInTime || 'Gate'}`
                                                    : 'Attendee has not arrived yet.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Booking Details */}
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                                        <FileText size={14} /> Booking Information
                                    </h3>
                                    <div className="bg-gray-50 dark:bg-neutral-800/50 rounded-xl p-4 space-y-3 text-sm">
                                        <div className="flex justify-between py-1 border-b border-gray-200 dark:border-neutral-700 last:border-0">
                                            <span className="text-gray-500">Booking ID</span>
                                            <div className="flex items-center gap-2 font-mono text-gray-900 dark:text-white">
                                                {selectedAttendee.bookingId} <Copy size={12} className="cursor-pointer text-gray-400 hover:text-gray-600" />
                                            </div>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-gray-200 dark:border-neutral-700 last:border-0">
                                            <span className="text-gray-500">Transaction ID</span>
                                            <span className="font-mono text-gray-900 dark:text-white">{selectedAttendee.transactionId}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-gray-200 dark:border-neutral-700 last:border-0">
                                            <span className="text-gray-500">Date</span>
                                            <span className="text-gray-900 dark:text-white">{selectedAttendee.bookingDate}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-gray-200 dark:border-neutral-700 last:border-0">
                                            <span className="text-gray-500">Payment Status</span>
                                            <Badge variant={selectedAttendee.paymentStatus === 'paid' ? 'success' : 'error'}>{selectedAttendee.paymentStatus.toUpperCase()}</Badge>
                                        </div>
                                        <div className="flex justify-between py-1 pt-2">
                                            <span className="font-semibold text-gray-700 dark:text-neutral-200">Total Paid</span>
                                            <span className="font-bold text-lg text-gray-900 dark:text-white">
                                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(selectedAttendee.amountPaid)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Tickets */}
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                                        <TicketIcon size={14} /> Tickets ({selectedAttendee.tickets.length})
                                    </h3>
                                    <div className="space-y-3">
                                        {selectedAttendee.tickets.map(ticket => (
                                            <div key={ticket.id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-200 dark:border-neutral-700 hover:border-primary-200 dark:hover:border-primary-800 transition-colors bg-white dark:bg-neutral-800">
                                                <div className="w-12 h-12 bg-gray-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                                                    <QrCode size={24} className="text-gray-800 dark:text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-gray-900 dark:text-white text-sm">{ticket.tierName} Pass</p>
                                                    <p className="text-xs text-gray-500 font-mono">{ticket.id}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {ticket.status === 'used'
                                                        ? <Badge variant="success">Used</Badge>
                                                        : <Badge variant="default">Valid</Badge>
                                                    }
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-primary-600"><Download size={14} /></Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>

                            {/* Drawer Footer Actions */}
                            <div className="p-4 border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col gap-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <Button variant="secondary" className="w-full justify-center">
                                        <Send size={14} className="mr-2" /> Resend Ticket
                                    </Button>
                                    <Button variant="secondary" className="w-full justify-center">
                                        <RefreshCw size={14} className="mr-2" /> Regenerate QR
                                    </Button>
                                </div>
                                {selectedAttendee.status === 'pending' && (
                                    <Button variant="primary" className="w-full justify-center bg-green-600 hover:bg-green-700 border-green-600">
                                        <CheckCircle2 size={16} className="mr-2" /> Manual Check-In
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    className="w-full justify-center text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    onClick={() => {
                                        setRefundAmount(selectedAttendee.amountPaid);
                                        setIsRefundModalOpen(true);
                                    }}
                                >
                                    <XCircle size={16} className="mr-2" /> Cancel & Refund Booking
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── 7. Refund Modal ── */}
            <Modal isOpen={isRefundModalOpen} onClose={() => setIsRefundModalOpen(false)} title="Process Refund" size="md">
                <div className="space-y-6">
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800/30 flex gap-3 text-sm text-amber-900 dark:text-amber-200">
                        <AlertCircle size={20} className="shrink-0 text-amber-600" />
                        <div>
                            <p className="font-bold mb-1">Warning: Irreversible Action</p>
                            <p>This will invalidate all tickets associated with this booking and refund <strong>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(refundAmount)}</strong> to the original payment method.</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300">Refund Reason</label>
                        <select
                            className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                        >
                            <option value="">Select a reason...</option>
                            <option value="customer_request">Customer Request</option>
                            <option value="duplicate">Duplicate Booking</option>
                            <option value="event_cancelled">Event Cancelled</option>
                            <option value="fraudulent">Fraudulent Transaction</option>
                            <option value="other">Other</option>
                        </select>
                        <textarea
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none h-24"
                            placeholder="Additional notes for the refund..."
                        />
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                        <Button variant="ghost" onClick={() => setIsRefundModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" className="bg-red-600 hover:bg-red-700 border-red-600 text-white" onClick={handleRefund}>
                            Confirm Refund
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* ── 8. Email Composer Modal ── */}
            <Modal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} title="Send Email to Attendees" size="lg">
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-neutral-300">To</label>
                        <div className="mt-1 p-2 bg-gray-100 dark:bg-neutral-800 rounded-lg text-sm text-gray-500">
                            {selectedIds.size > 0 ? `${selectedIds.size} selected attendees` : 'All Registered Attendees'}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-neutral-300">Subject</label>
                        <input type="text" className="w-full mt-1 p-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm" placeholder="e.g., Important Event Update" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-neutral-300">Message</label>
                        <textarea className="w-full mt-1 p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm h-40" placeholder="Type your message here..." />
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsEmailModalOpen(false)}>Cancel</Button>
                        <Button variant="primary">Send Email</Button>
                    </div>
                </div>
            </Modal>

        </div>
    );
}
