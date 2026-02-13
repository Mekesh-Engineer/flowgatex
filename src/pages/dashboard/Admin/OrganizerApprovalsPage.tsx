import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    UserCheck,
    Clock,
    FileText,
    Eye,
    MessageSquare,
    CheckCircle2,
    XCircle,
    CalendarDays,
    Building2,
    Globe,
    Mail,
    Phone,
    MapPin,
    BarChart3,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import Avatar from '@/components/common/Avatar';
import StatsCard from '@/components/common/StatsCard';
import EmptyState from '@/components/common/EmptyState';
import { Tabs, TabPanel } from '@/components/common/Tabs';
import { Skeleton, SkeletonCard } from '@/components/common/Skeleton';

// =============================================================================
// TYPES & MOCK DATA
// =============================================================================

interface OrganizerApplication {
    id: string;
    name: string;
    email: string;
    organization: string;
    website: string;
    phone: string;
    location: string;
    submittedAt: string;
    documents: { name: string; type: string }[];
    status: 'pending' | 'approved' | 'rejected';
    eventsHosted?: number;
    totalRevenue?: number;
}

const MOCK_APPLICATIONS: OrganizerApplication[] = [
    { id: 'oa-1', name: 'Sarah Chen', email: 'sarah@eventpro.com', organization: 'EventPro Inc.', website: 'https://eventpro.com', phone: '+1 555-0201', location: 'New York, USA', submittedAt: '2026-01-25', documents: [{ name: 'KYC Document', type: 'pdf' }, { name: 'Tax Certificate', type: 'pdf' }, { name: 'Business License', type: 'pdf' }], status: 'pending' },
    { id: 'oa-2', name: 'James Park', email: 'james@liveshows.co', organization: 'LiveShows Co.', website: 'https://liveshows.co', phone: '+1 555-0202', location: 'Los Angeles, USA', submittedAt: '2026-01-22', documents: [{ name: 'KYC Document', type: 'pdf' }, { name: 'Tax Certificate', type: 'pdf' }], status: 'pending' },
    { id: 'oa-3', name: 'Maria Garcia', email: 'maria@fest.io', organization: 'FestivalHub', website: 'https://fest.io', phone: '+1 555-0203', location: 'Miami, USA', submittedAt: '2026-01-18', documents: [{ name: 'KYC Document', type: 'pdf' }, { name: 'Business License', type: 'pdf' }], status: 'pending' },
];

const MOCK_APPROVED: OrganizerApplication[] = [
    { id: 'oa-4', name: 'Alex Thompson', email: 'alex@concerts.live', organization: 'Concerts Live Ltd.', website: 'https://concerts.live', phone: '+1 555-0204', location: 'Chicago, USA', submittedAt: '2025-12-10', documents: [], status: 'approved', eventsHosted: 24, totalRevenue: 156000 },
    { id: 'oa-5', name: 'Priya Sharma', email: 'priya@gatherings.in', organization: 'Gatherings India', website: 'https://gatherings.in', phone: '+91 98765-43210', location: 'Mumbai, India', submittedAt: '2025-11-05', documents: [], status: 'approved', eventsHosted: 18, totalRevenue: 89500 },
];

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 22 } } };

const CHECKLIST = [
    'KYC documents verified',
    'Tax certificate validated',
    'Business license confirmed',
    'Website reviewed',
    'No prior violations',
];

// =============================================================================
// COMPONENT
// =============================================================================
export default function OrganizerApprovalsPage() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [reviewApp, setReviewApp] = useState<OrganizerApplication | null>(null);
    const [reviewOpen, setReviewOpen] = useState(false);
    const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => { const t = setTimeout(() => setLoading(false), 600); return () => clearTimeout(t); }, []);

    const toggleCheck = (i: number) => {
        const next = new Set(checkedItems);
        next.has(i) ? next.delete(i) : next.add(i);
        setCheckedItems(next);
    };

    const openReview = (app: OrganizerApplication) => { setReviewApp(app); setCheckedItems(new Set()); setRejectReason(''); setReviewOpen(true); };

    const tabs = [
        { id: 'pending', label: 'Pending', badge: MOCK_APPLICATIONS.length.toString(), icon: <Clock size={15} /> },
        { id: 'approved', label: 'Approved', badge: MOCK_APPROVED.length.toString(), icon: <UserCheck size={15} /> },
    ];

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-56" rounded="lg" />
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} className="h-28" />)}</div>
                <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} className="h-44" />)}</div>
            </div>
        );
    }

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* ── Header ── */}
            <motion.div variants={itemVariants}>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Organizer Approvals</h1>
                <p className="text-gray-500 dark:text-neutral-400 mt-1">Review and approve organizer applications</p>
            </motion.div>

            {/* ── Stats ── */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatsCard label="Pending Review" value={MOCK_APPLICATIONS.length.toString()} icon={<Clock size={20} />} color="text-amber-600 dark:text-amber-400" bgColor="bg-amber-50 dark:bg-amber-500/10" borderColor="border-amber-100 dark:border-amber-500/20" />
                <StatsCard label="Approved" value={MOCK_APPROVED.length.toString()} icon={<UserCheck size={20} />} color="text-green-600 dark:text-green-400" bgColor="bg-green-50 dark:bg-green-500/10" borderColor="border-green-100 dark:border-green-500/20" />
                <StatsCard label="Avg Review Time" value="2.3 days" icon={<BarChart3 size={20} />} />
            </motion.div>

            {/* ── Tabs ── */}
            <motion.div variants={itemVariants}>
                <Tabs items={tabs} activeTab={activeTab} onChange={setActiveTab} variant="underline" />
            </motion.div>

            {/* ═══ Pending Queue ═══ */}
            <TabPanel id="pending" activeTab={activeTab}>
                {MOCK_APPLICATIONS.length === 0 ? (
                    <EmptyState variant="no-data" title="No Pending Applications" description="All organizer applications have been reviewed." />
                ) : (
                    <div className="space-y-4">
                        {MOCK_APPLICATIONS.map(app => (
                            <motion.div key={app.id} variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6 hover:shadow-lg transition-shadow">
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                    <Avatar name={app.name} size="lg" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-gray-900 dark:text-white">{app.name}</h3>
                                            <Badge variant="warning">Pending</Badge>
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-neutral-400">
                                            <span className="flex items-center gap-1"><Building2 size={12} />{app.organization}</span>
                                            <span className="flex items-center gap-1"><Mail size={12} />{app.email}</span>
                                            <span className="flex items-center gap-1"><MapPin size={12} />{app.location}</span>
                                            <span className="flex items-center gap-1"><CalendarDays size={12} />Submitted {formatDate(app.submittedAt)}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {app.documents.map(doc => (
                                                <button key={doc.name} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-neutral-700/40 text-xs text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors">
                                                    <FileText size={12} />{doc.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <Button variant="primary" onClick={() => openReview(app)}>Quick Review</Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </TabPanel>

            {/* ═══ Approved Organizers ═══ */}
            <TabPanel id="approved" activeTab={activeTab}>
                <div className="space-y-4">
                    {MOCK_APPROVED.map(org => (
                        <motion.div key={org.id} variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <Avatar name={org.name} size="lg" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-gray-900 dark:text-white">{org.name}</h3>
                                        <Badge variant="success">Approved</Badge>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-neutral-400">{org.organization} · {org.location}</p>
                                    <div className="flex gap-4 mt-2 text-sm">
                                        <span className="text-gray-600 dark:text-neutral-300"><strong>{org.eventsHosted}</strong> events</span>
                                        <span className="text-gray-600 dark:text-neutral-300"><strong>${org.totalRevenue?.toLocaleString()}</strong> revenue</span>
                                    </div>
                                </div>
                                <Button variant="ghost"><Eye size={14} className="mr-1.5" /> View Profile</Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </TabPanel>

            {/* ── Review Modal ── */}
            <Modal isOpen={reviewOpen} onClose={() => setReviewOpen(false)} title="Review Application" size="lg">
                {reviewApp && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Avatar name={reviewApp.name} size="lg" />
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">{reviewApp.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-neutral-400">{reviewApp.organization}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="p-3 rounded-xl bg-gray-50 dark:bg-neutral-700/40"><span className="text-xs text-gray-400 flex items-center gap-1 mb-1"><Mail size={12} />Email</span><span className="text-gray-900 dark:text-white">{reviewApp.email}</span></div>
                            <div className="p-3 rounded-xl bg-gray-50 dark:bg-neutral-700/40"><span className="text-xs text-gray-400 flex items-center gap-1 mb-1"><Phone size={12} />Phone</span><span className="text-gray-900 dark:text-white">{reviewApp.phone}</span></div>
                            <div className="p-3 rounded-xl bg-gray-50 dark:bg-neutral-700/40"><span className="text-xs text-gray-400 flex items-center gap-1 mb-1"><Globe size={12} />Website</span><a href={reviewApp.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 underline">{reviewApp.website}</a></div>
                            <div className="p-3 rounded-xl bg-gray-50 dark:bg-neutral-700/40"><span className="text-xs text-gray-400 flex items-center gap-1 mb-1"><MapPin size={12} />Location</span><span className="text-gray-900 dark:text-white">{reviewApp.location}</span></div>
                        </div>

                        {/* Documents */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Uploaded Documents</label>
                            <div className="flex flex-wrap gap-2">
                                {reviewApp.documents.map(doc => (
                                    <button key={doc.name} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"><FileText size={14} />{doc.name}</button>
                                ))}
                            </div>
                        </div>

                        {/* Verification checklist */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Verification Checklist</label>
                            <div className="space-y-2">
                                {CHECKLIST.map((item, i) => (
                                    <label key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700/40 cursor-pointer transition-colors">
                                        <input type="checkbox" checked={checkedItems.has(i)} onChange={() => toggleCheck(i)} className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                        <span className={cn('text-sm', checkedItems.has(i) ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-neutral-400')}>{item}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Admin notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Internal Notes</label>
                            <textarea rows={2} placeholder="Admin notes (not visible to applicant)..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>

                        {/* Reject reason */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Rejection Reason <span className="text-gray-400">(required if rejecting)</span></label>
                            <textarea rows={2} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <Button variant="primary" className="flex-1 !bg-green-600 hover:!bg-green-700" onClick={() => setReviewOpen(false)}>
                                <CheckCircle2 size={14} className="mr-1.5" /> Approve
                            </Button>
                            <Button variant="ghost" className="flex-1 !text-red-600 hover:!bg-red-50 dark:hover:!bg-red-500/10" onClick={() => setReviewOpen(false)}>
                                <XCircle size={14} className="mr-1.5" /> Reject
                            </Button>
                            <Button variant="ghost" className="flex-1 !text-amber-600 hover:!bg-amber-50 dark:hover:!bg-amber-500/10" onClick={() => setReviewOpen(false)}>
                                <MessageSquare size={14} className="mr-1.5" /> Request Info
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </motion.div>
    );
}
