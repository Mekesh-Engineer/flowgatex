import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
    Eye,
    MessageSquare,
    Camera,
    Keyboard,
    UserCheck,
    UserX,
} from 'lucide-react';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import StatsCard from '@/components/common/StatsCard';
import DataTable, { type Column } from '@/components/common/DataTable';
import Modal from '@/components/common/Modal';
import Avatar from '@/components/common/Avatar';
import { Skeleton, SkeletonCard } from '@/components/common/Skeleton';

// =============================================================================
// TYPES & MOCK DATA
// =============================================================================

interface AttendeeItem {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar: string;
    ticketTier: string;
    quantity: number;
    amountPaid: number;
    bookingDate: string;
    checkedIn: boolean;
    checkInTime?: string;
    [key: string]: unknown;
}

const MOCK_ATTENDEES: AttendeeItem[] = Array.from({ length: 25 }, (_, i) => ({
    id: `att-${i + 1}`,
    name: [
        'Emma Wilson', 'James Chen', 'Sofia Garcia', 'Liam Patel', 'Olivia Kim',
        'Noah Smith', 'Ava Johnson', 'William Brown', 'Isabella Davis', 'Mason Lee',
        'Sophia Martinez', 'Ethan Taylor', 'Mia Anderson', 'Alexander Thomas', 'Charlotte White',
        'Daniel Harris', 'Amelia Robinson', 'Jack Clark', 'Harper Lewis', 'Lucas Walker',
        'Evelyn Hall', 'Henry Allen', 'Abigail Young', 'Sebastian King', 'Emily Wright',
    ][i],
    email: `user${i + 1}@example.com`,
    phone: `+1 (555) ${100 + i}-${1000 + i}`,
    avatar: '',
    ticketTier: ['General', 'VIP', 'Early Bird', 'Platinum'][i % 4],
    quantity: 1 + (i % 3),
    amountPaid: [75, 150, 50, 200][i % 4],
    bookingDate: `Jan ${10 + (i % 18)}, 2026`,
    checkedIn: i < 12,
    checkInTime: i < 12 ? `${8 + (i % 4)}:${15 + i} AM` : undefined,
}));

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 22 } } };

// =============================================================================
// COMPONENT
// =============================================================================

export default function AttendeeManagementPage() {
    const { id: _eventId } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [tierFilter, setTierFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'checked' | 'pending'>('all');
    const [selectedAttendee, setSelectedAttendee] = useState<AttendeeItem | null>(null);
    const [scannerOpen, setScannerOpen] = useState(false);
    const [manualEntry, setManualEntry] = useState('');

    useEffect(() => { const t = setTimeout(() => setLoading(false), 600); return () => clearTimeout(t); }, []);

    const filtered = useMemo(() => {
        let list = [...MOCK_ATTENDEES];
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(a => a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q));
        }
        if (tierFilter !== 'all') list = list.filter(a => a.ticketTier === tierFilter);
        if (statusFilter === 'checked') list = list.filter(a => a.checkedIn);
        else if (statusFilter === 'pending') list = list.filter(a => !a.checkedIn);
        return list;
    }, [search, tierFilter, statusFilter]);

    const checkedInCount = MOCK_ATTENDEES.filter(a => a.checkedIn).length;
    const pendingCount = MOCK_ATTENDEES.length - checkedInCount;
    const checkedPct = Math.round((checkedInCount / MOCK_ATTENDEES.length) * 100);

    const columns: Column<AttendeeItem>[] = [
        {
            key: 'name',
            header: 'Attendee',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <Avatar name={row.name} size="sm" />
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{row.name}</p>
                        <p className="text-xs text-gray-400">{row.email}</p>
                    </div>
                </div>
            ),
        },
        { key: 'ticketTier', header: 'Tier', width: '100px', render: (row) => <Badge variant="default">{row.ticketTier}</Badge> },
        { key: 'quantity', header: 'Qty', width: '60px', align: 'center' },
        { key: 'amountPaid', header: 'Paid', width: '90px', align: 'right', render: (row) => <span className="font-semibold">${row.amountPaid}</span> },
        { key: 'bookingDate', header: 'Booked', width: '120px', render: (row) => <span className="text-gray-500 dark:text-neutral-400 text-xs">{row.bookingDate}</span> },
        {
            key: 'checkedIn',
            header: 'Status',
            width: '120px',
            align: 'center',
            render: (row) => row.checkedIn
                ? <Badge variant="success"><CheckCircle2 size={12} className="mr-1" /> Checked In</Badge>
                : <Badge variant="warning"><Clock size={12} className="mr-1" /> Pending</Badge>,
        },
        {
            key: 'actions',
            header: '',
            width: '50px',
            align: 'center',
            render: (row) => (
                <button onClick={() => setSelectedAttendee(row)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700" aria-label="View attendee details">
                    <Eye size={14} className="text-gray-400" />
                </button>
            ),
        },
    ];

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" rounded="lg" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} className="h-28" />)}</div>
                <SkeletonCard className="h-64" />
            </div>
        );
    }

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* ── Header ── */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link to="/organizer/events" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"><ArrowLeft size={20} className="text-gray-500" /></Link>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Attendee Management</h1>
                        <p className="text-sm text-gray-500 dark:text-neutral-400">Tech Summit 2026</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm"><Download size={14} className="mr-1.5" /> Export</Button>
                    <Button variant="ghost" size="sm"><Mail size={14} className="mr-1.5" /> Bulk Email</Button>
                    <Button variant="primary" size="sm" onClick={() => setScannerOpen(true)}><QrCode size={14} className="mr-1.5" /> Check-in Scanner</Button>
                </div>
            </motion.div>

            {/* ── Stats ── */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard label="Total Attendees" value={MOCK_ATTENDEES.length} icon={<Users size={20} />} />
                <StatsCard label="Checked In" value={`${checkedInCount} (${checkedPct}%)`} icon={<UserCheck size={20} />} color="text-green-600 dark:text-green-400" bgColor="bg-green-50 dark:bg-green-500/10" borderColor="border-green-100 dark:border-green-500/20" />
                <StatsCard label="Pending" value={pendingCount} icon={<Clock size={20} />} color="text-amber-600 dark:text-amber-400" bgColor="bg-amber-50 dark:bg-amber-500/10" borderColor="border-amber-100 dark:border-amber-500/20" />
                <StatsCard label="No-Show" value={0} icon={<UserX size={20} />} color="text-red-600 dark:text-red-400" bgColor="bg-red-50 dark:bg-red-500/10" borderColor="border-red-100 dark:border-red-500/20" />
            </motion.div>

            {/* ── Filters ── */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white placeholder:text-gray-400" />
                </div>
                <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500" aria-label="Filter by tier">
                    <option value="all">All Tiers</option>
                    <option value="General">General</option>
                    <option value="VIP">VIP</option>
                    <option value="Early Bird">Early Bird</option>
                    <option value="Platinum">Platinum</option>
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | 'checked' | 'pending')} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500" aria-label="Filter by check-in status">
                    <option value="all">All Status</option>
                    <option value="checked">Checked In</option>
                    <option value="pending">Pending</option>
                </select>
            </motion.div>

            {/* ── Attendees Table ── */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
                <DataTable<AttendeeItem>
                    columns={columns}
                    data={filtered}
                    keyExtractor={(row) => row.id}
                    pageSize={10}
                    emptyMessage="No attendees match your filters"
                    onRowClick={(row) => setSelectedAttendee(row)}
                    striped
                />
            </motion.div>

            {/* ── Attendee Details Modal ── */}
            <Modal isOpen={!!selectedAttendee} onClose={() => setSelectedAttendee(null)} title="Attendee Details" size="lg">
                {selectedAttendee && (
                    <div className="space-y-5">
                        <div className="flex items-center gap-4">
                            <Avatar name={selectedAttendee.name} size="lg" />
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{selectedAttendee.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-neutral-400">{selectedAttendee.email}</p>
                                <p className="text-sm text-gray-500 dark:text-neutral-400">{selectedAttendee.phone}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-neutral-700/40 rounded-xl p-4 text-sm">
                            <div><p className="text-gray-400 text-xs mb-1">Ticket Tier</p><Badge variant="default">{selectedAttendee.ticketTier}</Badge></div>
                            <div><p className="text-gray-400 text-xs mb-1">Quantity</p><p className="font-medium text-gray-900 dark:text-white">{selectedAttendee.quantity}</p></div>
                            <div><p className="text-gray-400 text-xs mb-1">Amount Paid</p><p className="font-bold text-gray-900 dark:text-white">${selectedAttendee.amountPaid}</p></div>
                            <div><p className="text-gray-400 text-xs mb-1">Booking Date</p><p className="font-medium text-gray-900 dark:text-white">{selectedAttendee.bookingDate}</p></div>
                        </div>

                        <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 dark:border-neutral-700">
                            {selectedAttendee.checkedIn ? (
                                <>
                                    <CheckCircle2 className="text-green-500" size={24} />
                                    <div>
                                        <p className="font-medium text-green-600 dark:text-green-400">Checked In</p>
                                        <p className="text-xs text-gray-400">at {selectedAttendee.checkInTime}</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Clock className="text-amber-500" size={24} />
                                    <div className="flex-1">
                                        <p className="font-medium text-amber-600 dark:text-amber-400">Not Checked In</p>
                                    </div>
                                    <Button variant="primary" size="sm"><CheckCircle2 size={14} className="mr-1" /> Mark as Checked In</Button>
                                </>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <Button variant="ghost" className="flex-1"><Send size={14} className="mr-1.5" /> Resend Ticket</Button>
                            <Button variant="ghost" className="flex-1"><MessageSquare size={14} className="mr-1.5" /> Send Message</Button>
                            <Button variant="ghost" className="flex-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"><XCircle size={14} className="mr-1.5" /> Cancel Booking</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ── Check-in Scanner Modal ── */}
            <Modal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} title="Check-in Scanner" size="md">
                <div className="space-y-6">
                    {/* Camera scanner area */}
                    <div className="bg-gray-900 rounded-xl h-56 flex items-center justify-center relative overflow-hidden">
                        <Camera className="text-gray-600" size={48} />
                        <p className="absolute bottom-3 text-xs text-gray-400">Camera scanner placeholder</p>
                        <div className="absolute inset-[20%] border-2 border-primary-400 rounded-lg opacity-50" />
                    </div>

                    <div className="text-center text-sm text-gray-400">or</div>

                    {/* Manual entry */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5 flex items-center gap-1.5"><Keyboard size={14} /> Manual Ticket ID</label>
                        <div className="flex gap-2">
                            <input type="text" value={manualEntry} onChange={(e) => setManualEntry(e.target.value)} placeholder="Enter ticket ID..." className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                            <Button variant="primary">Check In</Button>
                        </div>
                    </div>

                    {/* Recent check-ins */}
                    <div>
                        <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-2">Recent Check-ins</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {MOCK_ATTENDEES.filter(a => a.checkedIn).slice(0, 5).map(a => (
                                <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg bg-green-50 dark:bg-green-500/5 border border-green-100 dark:border-green-500/20">
                                    <CheckCircle2 size={14} className="text-green-500" />
                                    <span className="text-sm text-gray-700 dark:text-neutral-300 flex-1">{a.name}</span>
                                    <span className="text-xs text-gray-400">{a.checkInTime}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Modal>
        </motion.div>
    );
}
