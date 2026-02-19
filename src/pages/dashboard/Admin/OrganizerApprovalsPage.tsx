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
    AlertCircle,
    Loader2
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
import {
    OrganizerApplication,
    subscribeToOrganizerRequests,
    approveOrganizerRequest,
    rejectOrganizerRequest
} from '@/services/adminService';
import { showError, showSuccess } from '@/components/common/Toast';

// =============================================================================
// COMPONENT
// =============================================================================
export default function OrganizerApprovalsPage() {
    const [loading, setLoading] = useState(true);
    const [applications, setApplications] = useState<OrganizerApplication[]>([]);
    const [activeTab, setActiveTab] = useState('pending');
    const [reviewApp, setReviewApp] = useState<OrganizerApplication | null>(null);
    const [reviewOpen, setReviewOpen] = useState(false);
    const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
    const [rejectReason, setRejectReason] = useState('');
    const [processing, setProcessing] = useState(false);

    // Filtered lists
    const pendingApps = applications.filter(app => app.status === 'pending');
    const approvedApps = applications.filter(app => app.status === 'approved');
    const rejectedApps = applications.filter(app => app.status === 'rejected');

    useEffect(() => {
        const unsubscribe = subscribeToOrganizerRequests((data) => {
            setApplications(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const toggleCheck = (i: number) => {
        const next = new Set(checkedItems);
        next.has(i) ? next.delete(i) : next.add(i);
        setCheckedItems(next);
    };

    const openReview = (app: OrganizerApplication) => {
        setReviewApp(app);
        setCheckedItems(new Set());
        setRejectReason('');
        setReviewOpen(true);
    };

    const handleApprove = async () => {
        if (!reviewApp) return;
        setProcessing(true);
        try {
            // Updated call: Requires both requestId and userId
            await approveOrganizerRequest(reviewApp.id, reviewApp.userId);
            showSuccess(`Organization ${reviewApp.organization} approved successfully`);
            setReviewOpen(false);
        } catch (error) {
            console.error(error);
            showError("Failed to approve application");
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!reviewApp) return;
        if (!rejectReason.trim()) {
            showError("Please provide a rejection reason");
            return;
        }
        setProcessing(true);
        try {
            await rejectOrganizerRequest(reviewApp.id, rejectReason);
            showSuccess(`Application rejected`);
            setReviewOpen(false);
        } catch (error) {
            console.error(error);
            showError("Failed to reject application");
        } finally {
            setProcessing(false);
        }
    };

    const tabs = [
        { id: 'pending', label: 'Pending', badge: pendingApps.length.toString(), icon: <Clock size={15} /> },
        { id: 'approved', label: 'Approved', badge: approvedApps.length.toString(), icon: <UserCheck size={15} /> },
        { id: 'rejected', label: 'Rejected', badge: rejectedApps.length.toString(), icon: <XCircle size={15} /> },
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
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Organizer Approvals</h1>
                <p className="text-[var(--text-secondary)] mt-1">Review and approve organizer applications</p>
            </motion.div>

            {/* ── Stats ── */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatsCard label="Pending Review" value={pendingApps.length.toString()} icon={<Clock size={20} />} color="text-amber-600" bgColor="bg-amber-50 dark:bg-amber-900/10" borderColor="border-amber-100 dark:border-amber-900/20" />
                <StatsCard label="Approved" value={approvedApps.length.toString()} icon={<UserCheck size={20} />} color="text-green-600" bgColor="bg-green-50 dark:bg-green-900/10" borderColor="border-green-100 dark:border-green-900/20" />
                <StatsCard label="Response Rate" value={applications.length > 0 ? `${Math.round(((approvedApps.length + rejectedApps.length) / applications.length) * 100)}%` : '0%'} icon={<BarChart3 size={20} />} />
            </motion.div>

            {/* ── Tabs ── */}
            <motion.div variants={itemVariants}>
                <Tabs items={tabs} activeTab={activeTab} onChange={setActiveTab} variant="underline" />
            </motion.div>

            {/* ═══ Pending Queue ═══ */}
            <TabPanel id="pending" activeTab={activeTab}>
                {pendingApps.length === 0 ? (
                    <EmptyState variant="no-data" title="No Pending Applications" description="All organizer applications have been reviewed." />
                ) : (
                    <div className="space-y-4">
                        {pendingApps.map(app => (
                            <motion.div key={app.id} variants={itemVariants} className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-6 hover:shadow-lg transition-shadow">
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                    <Avatar name={app.name} size="lg" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-[var(--text-primary)]">{app.name}</h3>
                                            <Badge variant="warning">Pending</Badge>
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
                                            <span className="flex items-center gap-1"><Building2 size={12} />{app.organization}</span>
                                            <span className="flex items-center gap-1"><Mail size={12} />{app.email}</span>
                                            <span className="flex items-center gap-1"><MapPin size={12} />{app.location}</span>
                                            <span className="flex items-center gap-1"><CalendarDays size={12} />Submitted {app.submittedAt?.toDate ? formatDate(app.submittedAt.toDate().toISOString()) : 'Recently'}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {app.documents?.map((doc, idx) => (
                                                <a key={idx} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-base)] text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                                                    <FileText size={12} />{doc.name}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                    <Button variant="primary" onClick={() => openReview(app)}>Review Application</Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </TabPanel>

            {/* ═══ Approved Organizers ═══ */}
            <TabPanel id="approved" activeTab={activeTab}>
                <div className="space-y-4">
                    {approvedApps.length === 0 ? (
                        <EmptyState variant="no-data" title="No Approved Organizers" description="No organizers have been approved yet." />
                    ) : (
                        approvedApps.map(org => (
                            <motion.div key={org.id} variants={itemVariants} className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-6">
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                    <Avatar name={org.name} size="lg" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-[var(--text-primary)]">{org.name}</h3>
                                            <Badge variant="success">Approved</Badge>
                                        </div>
                                        <p className="text-sm text-[var(--text-muted)]">{org.organization} · {org.location}</p>
                                    </div>
                                    <Button variant="ghost"><Eye size={14} className="mr-1.5" /> View Profile</Button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </TabPanel>

            {/* ═══ Rejected Applications ═══ */}
            <TabPanel id="rejected" activeTab={activeTab}>
                <div className="space-y-4">
                    {rejectedApps.length === 0 ? (
                        <EmptyState variant="no-data" title="No Rejected Applications" description="No applications have been rejected." />
                    ) : (
                        rejectedApps.map(app => (
                            <motion.div key={app.id} variants={itemVariants} className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-6 opacity-75">
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                    <Avatar name={app.name} size="lg" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-[var(--text-primary)]">{app.name}</h3>
                                            <Badge variant="error">Rejected</Badge>
                                        </div>
                                        <div className="flex items-start gap-2 mt-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/10 p-2 rounded-lg">
                                            <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                            <p>{(app as any).rejectionReason || "No reason provided"}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </TabPanel>

            {/* ── Review Modal ── */}
            <Modal isOpen={reviewOpen} onClose={() => setReviewOpen(false)} title="Review Application" size="lg">
                {reviewApp && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Avatar name={reviewApp.name} size="lg" />
                            <div>
                                <h3 className="font-bold text-[var(--text-primary)]">{reviewApp.name}</h3>
                                <p className="text-sm text-[var(--text-secondary)]">{reviewApp.organization}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="p-3 rounded-xl bg-[var(--bg-base)]"><span className="text-xs text-[var(--text-muted)] flex items-center gap-1 mb-1"><Mail size={12} />Email</span><span className="text-[var(--text-primary)]">{reviewApp.email}</span></div>
                            <div className="p-3 rounded-xl bg-[var(--bg-base)]"><span className="text-xs text-[var(--text-muted)] flex items-center gap-1 mb-1"><Phone size={12} />Phone</span><span className="text-[var(--text-primary)]">{reviewApp.phone}</span></div>
                            <div className="p-3 rounded-xl bg-[var(--bg-base)]"><span className="text-xs text-[var(--text-muted)] flex items-center gap-1 mb-1"><Globe size={12} />Website</span><a href={reviewApp.website} target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] underline">{reviewApp.website}</a></div>
                            <div className="p-3 rounded-xl bg-[var(--bg-base)]"><span className="text-xs text-[var(--text-muted)] flex items-center gap-1 mb-1"><MapPin size={12} />Location</span><span className="text-[var(--text-primary)]">{reviewApp.location}</span></div>
                        </div>

                        {/* Documents */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Uploaded Documents</label>
                            <div className="flex flex-wrap gap-2">
                                {reviewApp.documents?.map((doc, idx) => (
                                    <a key={idx} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 text-sm hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"><FileText size={14} />{doc.name}</a>
                                ))}
                            </div>
                        </div>

                        {/* Verification checklist */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Verification Checklist</label>
                            <div className="space-y-2">
                                {CHECKLIST.map((item, i) => (
                                    <label key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-surface-hover)] cursor-pointer transition-colors">
                                        <input type="checkbox" checked={checkedItems.has(i)} onChange={() => toggleCheck(i)} className="w-4 h-4 rounded border-[var(--border-default)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
                                        <span className={cn('text-sm', checkedItems.has(i) ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]')}>{item}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Admin notes (Placeholder for now) */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Internal Notes</label>
                            <textarea rows={2} placeholder="Admin notes (not visible to applicant)..." className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40" />
                        </div>

                        {/* Reject reason - Only shown if trying to reject (could be improved UI but keeping simple) */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Rejection Reason</label>
                            <textarea rows={2} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection (required if rejecting)..." className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40" />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <Button variant="primary"
                                className="flex-1 !bg-green-600 hover:!bg-green-700"
                                onClick={handleApprove}
                                disabled={processing}
                            >
                                {processing ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 size={14} className="mr-1.5" />}
                                Approve
                            </Button>

                            <Button variant="ghost"
                                className="flex-1 !text-red-600 hover:!bg-red-50 dark:hover:!bg-red-900/10"
                                onClick={handleReject}
                                disabled={processing}
                            >
                                {processing ? <Loader2 className="animate-spin mr-2" /> : <XCircle size={14} className="mr-1.5" />}
                                Reject
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </motion.div>
    );
}
