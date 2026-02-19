import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Flag,
    AlertTriangle,
    Eye,
    CheckCircle2,
    Trash2,
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
import { eventService } from '@/features/events/services/eventService';
import type { CreateEventData } from '@/features/events/types/event.types'; // Ensure this path is correct
import { logger } from '@/lib/logger';

// =============================================================================
// TYPES
// =============================================================================

// Extend CreateEventData with id and potential moderation fields
interface AdminEvent extends Omit<CreateEventData, 'status'> {
    id: string;
    flagReason?: string;
    flaggedBy?: 'system' | 'user';
    flagPriority?: 'high' | 'medium' | 'low';
    status: 'published' | 'draft' | 'cancelled' | 'pending_review' | 'flagged';
    attendees?: number; // Maybe available from aggregation
}

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
    const [reviewEvent, setReviewEvent] = useState<AdminEvent | null>(null);
    const [reviewOpen, setReviewOpen] = useState(false);

    // Real-time data
    const [allEvents, setAllEvents] = useState<AdminEvent[]>([]);

    useEffect(() => {
        // Subscribe to all events
        const unsubscribe = eventService.subscribeToAllEvents((events) => {
            // Cast to AdminEvent for now, assuming data structure is compatible or we add necessary optionals to interface
            setAllEvents(events as unknown as AdminEvent[]);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Derived state
    const flaggedEvents = allEvents.filter(e => e.status === 'flagged' || e.status === 'pending_review');
    const filteredAllEvents = allEvents.filter(e => !search || e.title.toLowerCase().includes(search.toLowerCase()));

    const tabs = [
        { id: 'flagged', label: 'Flagged / Pending', badge: flaggedEvents.length.toString(), icon: <Flag size={15} /> },
        { id: 'all', label: 'All Events', badge: allEvents.length.toString(), icon: <BarChart3 size={15} /> },
    ];

    const allEventsColumns: Column<AdminEvent>[] = [
        { key: 'title', header: 'Event', render: (row) => <span className="font-medium text-[var(--text-primary)] text-sm">{row.title}</span> },
        { key: 'organizerId', header: 'Organizer', width: '140px', render: (row) => <span className="text-sm text-[var(--text-muted)]">{row.organizer?.name || 'Unknown'}</span> },
        { key: 'category', header: 'Category', width: '110px', render: (row) => <Badge variant="default">{row.category}</Badge> },
        { key: 'startDate', header: 'Date', width: '120px', render: (row) => <span className="text-xs text-[var(--text-muted)]">{row.startDate ? formatDate(row.startDate) : 'TBD'}</span> },
        {
            key: 'status', header: 'Status', width: '110px', align: 'center', render: (row) => {
                const v = row.status === 'published' ? 'success' : row.status === 'draft' ? 'warning' : 'error';
                return <Badge variant={v}>{row.status}</Badge>;
            }
        },
        // { key: 'attendees', header: 'Attendees', width: '90px', align: 'center', sortable: true }, // Not yet in event object
        { key: 'isFeatured', header: 'Featured', width: '90px', align: 'center', render: (row) => row.isFeatured ? <CheckCircle2 size={16} className="text-amber-500 mx-auto" /> : <span className="text-[var(--text-muted)] opacity-30">—</span> },
    ];

    const handleApprove = async (eventId: string) => {
        try {
            await eventService.updateEvent(eventId, { status: 'published' } as Partial<CreateEventData>);
            setReviewOpen(false);
        } catch (error) {
            logger.error("Failed to approve event", error);
        }
    };

    const handleReject = async (eventId: string) => {
        try {
            await eventService.updateEvent(eventId, { status: 'draft' } as Partial<CreateEventData>);
            setReviewOpen(false);
        } catch (error) {
            logger.error("Failed to reject event", error);
        }
    };

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
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Event Moderation</h1>
                <p className="text-[var(--text-secondary)] mt-1">Review flagged events and manage platform content</p>
            </motion.div>

            {/* ── Stats ── */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard label="Flagged/Pending" value={flaggedEvents.length.toString()} icon={<Flag size={20} />} color="text-red-600" bgColor="bg-red-50 dark:bg-red-900/10" borderColor="border-red-100 dark:border-red-900/20" />
                <StatsCard label="High Priority" value={flaggedEvents.filter(e => e.flagPriority === 'high').length.toString()} icon={<AlertTriangle size={20} />} color="text-amber-600" bgColor="bg-amber-50 dark:bg-amber-900/10" borderColor="border-amber-100 dark:border-amber-900/20" />
                <StatsCard label="Total Events" value={allEvents.length.toString()} icon={<BarChart3 size={20} />} />
                <StatsCard label="Featured" value={allEvents.filter(e => e.isFeatured).length.toString()} icon={<TrendingUp size={20} />} color="text-green-600" bgColor="bg-green-50 dark:bg-green-900/10" borderColor="border-green-100 dark:border-green-900/20" />
            </motion.div>

            {/* ── Tabs ── */}
            <motion.div variants={itemVariants}>
                <Tabs items={tabs} activeTab={activeTab} onChange={setActiveTab} variant="underline" />
            </motion.div>

            {/* ═══ Flagged Events ═══ */}
            <TabPanel id="flagged" activeTab={activeTab}>
                {flaggedEvents.length === 0 ? (
                    <EmptyState variant="no-data" title="No Flagged Events" description="All events are in compliance." />
                ) : (
                    <div className="space-y-4">
                        {flaggedEvents.map(event => (
                            <motion.div key={event.id} variants={itemVariants} className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-6 hover:shadow-lg transition-shadow">
                                <div className="flex flex-col md:flex-row gap-4">
                                    {/* Placeholder image */}
                                    <div className="w-full md:w-32 h-24 rounded-xl bg-[var(--bg-base)] flex items-center justify-center flex-shrink-0">
                                        <Flag size={24} className="text-[var(--text-muted)]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <h3 className="font-bold text-[var(--text-primary)]">{event.title}</h3>
                                            <Badge variant={PRIORITY_BADGE[event.flagPriority || 'medium']}>{event.flagPriority || 'medium'} priority</Badge>
                                        </div>
                                        <p className="text-sm text-[var(--text-muted)]">{event.organizer?.name} · {event.category}</p>
                                        <div className="mt-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                                            <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-1.5"><AlertTriangle size={14} />{event.flagReason || 'Pending Review'}</p>
                                            <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                                                {event.flaggedBy === 'system' ? 'Auto-flagged by system' : 'Requires Moderation'} · {event.createdAt ? formatDate(event.createdAt) : ''}
                                            </p>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <Button variant="ghost" size="sm" onClick={() => { setReviewEvent(event); setReviewOpen(true); }}><Eye size={13} className="mr-1" /> Review</Button>
                                            {/* <Button variant="ghost" size="sm"><ExternalLink size={13} className="mr-1" /> Preview</Button> */}
                                        </div>
                                    </div>
                                    <div className="flex flex-row md:flex-col gap-2 flex-shrink-0">
                                        <Button variant="ghost" size="sm" className="!text-green-600 hover:!bg-green-50 dark:hover:!bg-green-900/10" onClick={() => handleApprove(event.id)}><CheckCircle2 size={14} /> Approve</Button>
                                        <Button variant="ghost" size="sm" className="!text-red-600 hover:!bg-red-50 dark:hover:!bg-red-900/10" onClick={() => handleReject(event.id)}><Trash2 size={14} /> Reject</Button>
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
                    <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] overflow-hidden">
                        <DataTable<AdminEvent>
                            columns={allEventsColumns}
                            data={filteredAllEvents}
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
                            <h3 className="font-bold text-lg text-[var(--text-primary)]">{reviewEvent.title}</h3>
                            <p className="text-sm text-[var(--text-secondary)] mt-1">{reviewEvent.organizer?.name} · {reviewEvent.category}</p>
                        </div>

                        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                            <p className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2"><AlertTriangle size={16} /> Flagging Reason</p>
                            <p className="text-sm text-red-600 dark:text-red-300 mt-1">{reviewEvent.flagReason || 'Pending Review'}</p>
                            <div className="flex gap-2 mt-2">
                                <Badge variant={PRIORITY_BADGE[reviewEvent.flagPriority || 'medium']}>{reviewEvent.flagPriority || 'medium'}</Badge>
                                <span className="text-xs text-red-400">{reviewEvent.flaggedBy === 'system' ? 'System auto-flag' : 'System'}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Admin Notes</label>
                            <textarea rows={3} placeholder="Add internal notes about moderation decision..." className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40" />
                        </div>

                        <div className="flex flex-wrap gap-3 pt-2">
                            <Button variant="primary" className="flex-1 !bg-green-600 hover:!bg-green-700" onClick={() => handleApprove(reviewEvent.id)}><CheckCircle2 size={14} className="mr-1.5" /> Approve Event</Button>
                            <Button variant="ghost" className="flex-1 !text-red-600 hover:!bg-red-50 dark:hover:!bg-red-900/10" onClick={() => handleReject(reviewEvent.id)}><Trash2 size={14} className="mr-1.5" /> Reject Event</Button>
                            {/* <Button variant="ghost" className="flex-1 !text-amber-600 hover:!bg-amber-50 dark:hover:!bg-amber-500/10" onClick={() => setReviewOpen(false)}><UserX size={14} className="mr-1.5" /> Suspend Organizer</Button> */}
                            {/* <Button variant="ghost" className="flex-1" onClick={() => setReviewOpen(false)}><Edit size={14} className="mr-1.5" /> Request Changes</Button> */}
                        </div>
                    </div>
                )}
            </Modal>
        </motion.div>
    );
}
