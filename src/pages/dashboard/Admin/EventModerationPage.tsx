import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Flag,
    AlertTriangle,
    Eye,
    CheckCircle2,
    Trash2,
    UserX,
    Edit,
    ExternalLink,
    BarChart3,
    TrendingUp,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import StatsCard from '@/components/common/StatsCard';
import SearchInput from '@/components/common/SearchInput';
import EmptyState from '@/components/common/EmptyState';
import DataTable, { type Column } from '@/components/common/DataTable';
import { Tabs, TabPanel } from '@/components/common/Tabs';
import { Skeleton, SkeletonCard, SkeletonTable } from '@/components/common/Skeleton';

// =============================================================================
// TYPES & MOCK DATA
// =============================================================================

interface FlaggedEvent {
    id: string;
    title: string;
    organizer: string;
    category: string;
    publishedAt: string;
    reason: string;
    reporter: string;
    priority: 'high' | 'medium' | 'low';
    image: string;
    [key: string]: unknown;
}

interface AllEvent {
    id: string;
    title: string;
    organizer: string;
    category: string;
    date: string;
    status: string;
    attendees: number;
    featured: boolean;
    [key: string]: unknown;
}

const MOCK_FLAGGED: FlaggedEvent[] = [
    { id: 'fe-1', title: 'Suspicious Crypto Meetup', organizer: 'Unknown Org', category: 'Technology', publishedAt: '2026-01-27', reason: 'Potential scam — promises guaranteed returns', reporter: 'user-report', priority: 'high', image: '' },
    { id: 'fe-2', title: 'Duplicate Music Festival', organizer: 'CopyCat Events', category: 'Music', publishedAt: '2026-01-25', reason: 'Auto-flagged: Duplicate content detected', reporter: 'system', priority: 'medium', image: '' },
    { id: 'fe-3', title: 'Unauthorized Brand Event', organizer: 'Rando LLC', category: 'Business', publishedAt: '2026-01-23', reason: 'Trademark violation reported', reporter: 'user-report', priority: 'high', image: '' },
    { id: 'fe-4', title: 'Low-Quality Listing', organizer: 'Test User', category: 'Sports', publishedAt: '2026-01-21', reason: 'Auto-flagged: Incomplete listing with placeholder text', reporter: 'system', priority: 'low', image: '' },
];

const MOCK_ALL_EVENTS: AllEvent[] = [
    { id: 'e-1', title: 'Tech Summit 2026', organizer: 'EventPro Inc.', category: 'Technology', date: 'Mar 15, 2026', status: 'published', attendees: 450, featured: true },
    { id: 'e-2', title: 'Jazz Night Live', organizer: 'LiveShows Co.', category: 'Music', date: 'Feb 20, 2026', status: 'published', attendees: 200, featured: false },
    { id: 'e-3', title: 'Startup Pitch Day', organizer: 'Venture Hub', category: 'Business', date: 'Apr 5, 2026', status: 'draft', attendees: 0, featured: false },
    { id: 'e-4', title: 'Annual Art Fair', organizer: 'ArtSpace', category: 'Art', date: 'May 10, 2026', status: 'published', attendees: 320, featured: true },
    { id: 'e-5', title: 'Fitness Bootcamp', organizer: 'FitLife', category: 'Sports', date: 'Feb 28, 2026', status: 'cancelled', attendees: 0, featured: false },
];

const PRIORITY_BADGE: Record<string, 'error' | 'warning' | 'info'> = { high: 'error', medium: 'warning', low: 'info' };

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 22 } } };

// =============================================================================
// COMPONENT
// =============================================================================
export default function EventModerationPage() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('flagged');
    const [search, setSearch] = useState('');
    const [reviewEvent, setReviewEvent] = useState<FlaggedEvent | null>(null);
    const [reviewOpen, setReviewOpen] = useState(false);

    useEffect(() => { const t = setTimeout(() => setLoading(false), 600); return () => clearTimeout(t); }, []);

    const tabs = [
        { id: 'flagged', label: 'Flagged Events', badge: MOCK_FLAGGED.length.toString(), icon: <Flag size={15} /> },
        { id: 'all', label: 'All Events', badge: MOCK_ALL_EVENTS.length.toString(), icon: <BarChart3 size={15} /> },
    ];

    const allEventsColumns: Column<AllEvent>[] = [
        { key: 'title', header: 'Event', render: (row) => <span className="font-medium text-gray-900 dark:text-white text-sm">{row.title}</span> },
        { key: 'organizer', header: 'Organizer', width: '140px', render: (row) => <span className="text-sm text-gray-500 dark:text-neutral-400">{row.organizer}</span> },
        { key: 'category', header: 'Category', width: '110px', render: (row) => <Badge variant="default">{row.category}</Badge> },
        { key: 'date', header: 'Date', width: '120px', render: (row) => <span className="text-xs text-gray-400">{row.date}</span> },
        {
            key: 'status', header: 'Status', width: '110px', align: 'center', render: (row) => {
                const v = row.status === 'published' ? 'success' : row.status === 'draft' ? 'warning' : 'error';
                return <Badge variant={v}>{row.status}</Badge>;
            }
        },
        { key: 'attendees', header: 'Attendees', width: '90px', align: 'center', sortable: true },
        { key: 'featured', header: 'Featured', width: '90px', align: 'center', render: (row) => row.featured ? <CheckCircle2 size={16} className="text-amber-500 mx-auto" /> : <span className="text-gray-300">—</span> },
    ];

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-56" rounded="lg" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} className="h-28" />)}</div>
                <SkeletonTable rows={4} cols={5} />
            </div>
        );
    }

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* ── Header ── */}
            <motion.div variants={itemVariants}>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Event Moderation</h1>
                <p className="text-gray-500 dark:text-neutral-400 mt-1">Review flagged events and manage platform content</p>
            </motion.div>

            {/* ── Stats ── */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard label="Flagged Events" value={MOCK_FLAGGED.length.toString()} icon={<Flag size={20} />} color="text-red-600 dark:text-red-400" bgColor="bg-red-50 dark:bg-red-500/10" borderColor="border-red-100 dark:border-red-500/20" />
                <StatsCard label="High Priority" value={MOCK_FLAGGED.filter(e => e.priority === 'high').length.toString()} icon={<AlertTriangle size={20} />} color="text-amber-600 dark:text-amber-400" bgColor="bg-amber-50 dark:bg-amber-500/10" borderColor="border-amber-100 dark:border-amber-500/20" />
                <StatsCard label="Total Events" value={MOCK_ALL_EVENTS.length.toString()} icon={<BarChart3 size={20} />} />
                <StatsCard label="Featured" value={MOCK_ALL_EVENTS.filter(e => e.featured).length.toString()} icon={<TrendingUp size={20} />} color="text-green-600 dark:text-green-400" bgColor="bg-green-50 dark:bg-green-500/10" borderColor="border-green-100 dark:border-green-500/20" />
            </motion.div>

            {/* ── Tabs ── */}
            <motion.div variants={itemVariants}>
                <Tabs items={tabs} activeTab={activeTab} onChange={setActiveTab} variant="underline" />
            </motion.div>

            {/* ═══ Flagged Events ═══ */}
            <TabPanel id="flagged" activeTab={activeTab}>
                {MOCK_FLAGGED.length === 0 ? (
                    <EmptyState variant="no-data" title="No Flagged Events" description="All events are in compliance." />
                ) : (
                    <div className="space-y-4">
                        {MOCK_FLAGGED.map(event => (
                            <motion.div key={event.id} variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6 hover:shadow-lg transition-shadow">
                                <div className="flex flex-col md:flex-row gap-4">
                                    {/* Placeholder image */}
                                    <div className="w-full md:w-32 h-24 rounded-xl bg-gray-100 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0">
                                        <Flag size={24} className="text-gray-300 dark:text-neutral-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <h3 className="font-bold text-gray-900 dark:text-white">{event.title}</h3>
                                            <Badge variant={PRIORITY_BADGE[event.priority]}>{event.priority} priority</Badge>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-neutral-400">{event.organizer} · {event.category}</p>
                                        <div className="mt-2 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
                                            <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-1.5"><AlertTriangle size={14} />{event.reason}</p>
                                            <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                                                {event.reporter === 'system' ? 'Auto-flagged by system' : 'Reported by user'} · {formatDate(event.publishedAt)}
                                            </p>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <Button variant="ghost" size="sm" onClick={() => { setReviewEvent(event); setReviewOpen(true); }}><Eye size={13} className="mr-1" /> Review</Button>
                                            <Button variant="ghost" size="sm"><ExternalLink size={13} className="mr-1" /> Preview</Button>
                                        </div>
                                    </div>
                                    <div className="flex flex-row md:flex-col gap-2 flex-shrink-0">
                                        <Button variant="ghost" size="sm" className="!text-green-600 hover:!bg-green-50 dark:hover:!bg-green-500/10"><CheckCircle2 size={14} /> Approve</Button>
                                        <Button variant="ghost" size="sm" className="!text-red-600 hover:!bg-red-50 dark:hover:!bg-red-500/10"><Trash2 size={14} /> Remove</Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </TabPanel>

            {/* ═══ All Events ═══ */}
            <TabPanel id="all" activeTab={activeTab}>
                <motion.div variants={itemVariants} className="space-y-4">
                    <SearchInput placeholder="Search events..." value={search} onChange={setSearch} />
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
                        <DataTable<AllEvent>
                            columns={allEventsColumns}
                            data={MOCK_ALL_EVENTS.filter(e => !search || e.title.toLowerCase().includes(search.toLowerCase()))}
                            keyExtractor={(row) => row.id}
                            pageSize={10}
                            emptyMessage="No events found"
                        />
                    </div>
                </motion.div>
            </TabPanel>

            {/* ── Review Modal ── */}
            <Modal isOpen={reviewOpen} onClose={() => setReviewOpen(false)} title="Review Flagged Event" size="lg">
                {reviewEvent && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{reviewEvent.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">{reviewEvent.organizer} · {reviewEvent.category}</p>
                        </div>

                        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
                            <p className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2"><AlertTriangle size={16} /> Flagging Reason</p>
                            <p className="text-sm text-red-600 dark:text-red-300 mt-1">{reviewEvent.reason}</p>
                            <div className="flex gap-2 mt-2">
                                <Badge variant={PRIORITY_BADGE[reviewEvent.priority]}>{reviewEvent.priority}</Badge>
                                <span className="text-xs text-red-400">{reviewEvent.reporter === 'system' ? 'System auto-flag' : 'User report'}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Admin Notes</label>
                            <textarea rows={3} placeholder="Add internal notes about moderation decision..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>

                        <div className="flex flex-wrap gap-3 pt-2">
                            <Button variant="primary" className="flex-1 !bg-green-600 hover:!bg-green-700" onClick={() => setReviewOpen(false)}><CheckCircle2 size={14} className="mr-1.5" /> Approve Event</Button>
                            <Button variant="ghost" className="flex-1 !text-red-600 hover:!bg-red-50 dark:hover:!bg-red-500/10" onClick={() => setReviewOpen(false)}><Trash2 size={14} className="mr-1.5" /> Remove Event</Button>
                            <Button variant="ghost" className="flex-1 !text-amber-600 hover:!bg-amber-50 dark:hover:!bg-amber-500/10" onClick={() => setReviewOpen(false)}><UserX size={14} className="mr-1.5" /> Suspend Organizer</Button>
                            <Button variant="ghost" className="flex-1" onClick={() => setReviewOpen(false)}><Edit size={14} className="mr-1.5" /> Request Changes</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </motion.div>
    );
}
