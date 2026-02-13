import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Mail,
    Send,
    Image,
    Tag,
    Link2,
    Plus,
    Download,
    Copy,
    Share2,
    Sparkles,
    Megaphone,
    Gift,
    Edit,
    Clock,
    Users,
} from 'lucide-react';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import { Tabs, TabPanel } from '@/components/common/Tabs';
import StatsCard from '@/components/common/StatsCard';
import DataTable, { type Column } from '@/components/common/DataTable';
import Modal from '@/components/common/Modal';
import { Skeleton, SkeletonCard } from '@/components/common/Skeleton';

// =============================================================================
// TYPES & MOCK DATA
// =============================================================================

interface Campaign {
    id: string;
    name: string;
    audience: string;
    sentDate: string;
    recipients: number;
    openRate: number;
    clickRate: number;
    status: 'sent' | 'scheduled' | 'draft';
    [key: string]: unknown;
}

interface DiscountCode {
    id: string;
    code: string;
    type: 'percentage' | 'flat';
    value: number;
    uses: number;
    maxUses: number;
    expires: string;
    active: boolean;
    [key: string]: unknown;
}

interface Referral {
    id: string;
    referrer: string;
    clicks: number;
    conversions: number;
    earned: number;
    [key: string]: unknown;
}

const MOCK_CAMPAIGNS: Campaign[] = [
    { id: 'c-1', name: 'Early Bird Reminder', audience: 'Tech Summit Subscribers', sentDate: 'Jan 20, 2026', recipients: 2450, openRate: 32.5, clickRate: 8.2, status: 'sent' },
    { id: 'c-2', name: 'VIP Launch Announce', audience: 'Past Attendees', sentDate: 'Jan 25, 2026', recipients: 1800, openRate: 45.1, clickRate: 12.4, status: 'sent' },
    { id: 'c-3', name: 'Last Chance - 20% Off', audience: 'All Subscribers', sentDate: 'Feb 5, 2026', recipients: 5200, openRate: 0, clickRate: 0, status: 'scheduled' },
    { id: 'c-4', name: 'New Event Preview', audience: 'VIP Members', sentDate: '—', recipients: 0, openRate: 0, clickRate: 0, status: 'draft' },
];

const MOCK_DISCOUNTS: DiscountCode[] = [
    { id: 'd-1', code: 'EARLY20', type: 'percentage', value: 20, uses: 145, maxUses: 200, expires: 'Mar 1, 2026', active: true },
    { id: 'd-2', code: 'VIP50OFF', type: 'flat', value: 50, uses: 32, maxUses: 50, expires: 'Feb 15, 2026', active: true },
    { id: 'd-3', code: 'WELCOME10', type: 'percentage', value: 10, uses: 500, maxUses: 500, expires: 'Jan 31, 2026', active: false },
];

const MOCK_REFERRALS: Referral[] = [
    { id: 'r-1', referrer: 'Alex Johnson', clicks: 234, conversions: 18, earned: 90 },
    { id: 'r-2', referrer: 'Sarah Chen', clicks: 178, conversions: 12, earned: 60 },
    { id: 'r-3', referrer: 'Mike Wilson', clicks: 89, conversions: 6, earned: 30 },
];

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 22 } } };

// =============================================================================
// COMPONENT
// =============================================================================

export default function MarketingToolsPage() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('campaigns');
    const [createCampaignOpen, setCreateCampaignOpen] = useState(false);
    const [createDiscountOpen, setCreateDiscountOpen] = useState(false);

    useEffect(() => { const t = setTimeout(() => setLoading(false), 600); return () => clearTimeout(t); }, []);

    const tabs = [
        { id: 'campaigns', label: 'Email Campaigns', icon: <Mail size={15} /> },
        { id: 'social', label: 'Social Media', icon: <Share2 size={15} /> },
        { id: 'materials', label: 'Promo Materials', icon: <Image size={15} /> },
        { id: 'discounts', label: 'Discount Codes', icon: <Tag size={15} /> },
        { id: 'referrals', label: 'Referrals', icon: <Gift size={15} /> },
    ];

    const campaignColumns: Column<Campaign>[] = [
        { key: 'name', header: 'Campaign', render: (row) => <span className="font-medium text-gray-900 dark:text-white text-sm">{row.name}</span> },
        { key: 'audience', header: 'Audience', width: '160px', render: (row) => <span className="text-xs text-gray-500 dark:text-neutral-400">{row.audience}</span> },
        { key: 'sentDate', header: 'Date', width: '120px', render: (row) => <span className="text-xs text-gray-400">{row.sentDate}</span> },
        { key: 'recipients', header: 'Sent', width: '80px', align: 'center', render: (row) => row.recipients > 0 ? row.recipients.toLocaleString() : '—' },
        { key: 'openRate', header: 'Opens', width: '80px', align: 'center', render: (row) => row.openRate > 0 ? `${row.openRate}%` : '—' },
        { key: 'clickRate', header: 'Clicks', width: '80px', align: 'center', render: (row) => row.clickRate > 0 ? `${row.clickRate}%` : '—' },
        {
            key: 'status', header: 'Status', width: '110px', align: 'center', render: (row) => {
                const v = row.status === 'sent' ? 'success' : row.status === 'scheduled' ? 'info' : 'warning';
                return <Badge variant={v}>{row.status}</Badge>;
            }
        },
    ];

    const discountColumns: Column<DiscountCode>[] = [
        { key: 'code', header: 'Code', render: (row) => <span className="font-mono font-bold text-sm text-gray-900 dark:text-white">{row.code}</span> },
        { key: 'type', header: 'Discount', width: '120px', render: (row) => <span>{row.type === 'percentage' ? `${row.value}%` : `$${row.value}`} off</span> },
        { key: 'uses', header: 'Uses', width: '100px', align: 'center', render: (row) => <span>{row.uses}/{row.maxUses}</span> },
        { key: 'expires', header: 'Expires', width: '130px', render: (row) => <span className="text-xs text-gray-400">{row.expires}</span> },
        { key: 'active', header: 'Status', width: '90px', align: 'center', render: (row) => <Badge variant={row.active ? 'success' : 'default'}>{row.active ? 'Active' : 'Expired'}</Badge> },
    ];

    const referralColumns: Column<Referral>[] = [
        { key: 'referrer', header: 'Referrer', render: (row) => <span className="font-medium text-gray-900 dark:text-white text-sm">{row.referrer}</span> },
        { key: 'clicks', header: 'Clicks', width: '80px', align: 'center' },
        { key: 'conversions', header: 'Conversions', width: '100px', align: 'center' },
        { key: 'earned', header: 'Earned', width: '100px', align: 'right', render: (row) => <span className="font-semibold text-green-600 dark:text-green-400">${row.earned}</span> },
    ];

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" rounded="lg" />
                <Skeleton className="h-10 w-full max-w-md" rounded="lg" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} className="h-28" />)}</div>
                <SkeletonCard className="h-64" />
            </div>
        );
    }

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* ── Header ── */}
            <motion.div variants={itemVariants}>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Marketing Tools</h1>
                <p className="text-gray-500 dark:text-neutral-400 mt-1">Promote your events and grow your audience</p>
            </motion.div>

            {/* ── Stats ── */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard label="Emails Sent" value="9,450" icon={<Send size={20} />} trend="+22% this month" trendUp />
                <StatsCard label="Avg Open Rate" value="38.8%" icon={<Mail size={20} />} color="text-green-600 dark:text-green-400" bgColor="bg-green-50 dark:bg-green-500/10" borderColor="border-green-100 dark:border-green-500/20" />
                <StatsCard label="Discount Revenue" value="$4,250" icon={<Tag size={20} />} color="text-violet-600 dark:text-violet-400" bgColor="bg-violet-50 dark:bg-violet-500/10" borderColor="border-violet-100 dark:border-violet-500/20" />
                <StatsCard label="Referral Sign-ups" value="36" icon={<Users size={20} />} color="text-amber-600 dark:text-amber-400" bgColor="bg-amber-50 dark:bg-amber-500/10" borderColor="border-amber-100 dark:border-amber-500/20" />
            </motion.div>

            {/* ── Tabs ── */}
            <motion.div variants={itemVariants}>
                <Tabs items={tabs} activeTab={activeTab} onChange={setActiveTab} variant="underline" />
            </motion.div>

            {/* ═══════ Email Campaigns ═══════ */}
            <TabPanel id="campaigns" activeTab={activeTab}>
                <motion.div variants={itemVariants} className="space-y-4">
                    <div className="flex justify-end">
                        <Button variant="primary" onClick={() => setCreateCampaignOpen(true)}><Plus size={14} className="mr-1.5" /> Create Campaign</Button>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
                        <DataTable<Campaign>
                            columns={campaignColumns}
                            data={MOCK_CAMPAIGNS}
                            keyExtractor={(row) => row.id}
                            showPagination={false}
                            emptyMessage="No campaigns yet"
                        />
                    </div>
                </motion.div>
            </TabPanel>

            {/* ═══════ Social Media ═══════ */}
            <TabPanel id="social" activeTab={activeTab}>
                <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Sparkles className="text-amber-500" size={20} />
                        <h3 className="font-bold text-gray-900 dark:text-white">AI-Assisted Post Generator</h3>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Event</label>
                        <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option>Tech Summit 2026</option>
                            <option>Jazz Night Live</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Platform</label>
                        <div className="flex gap-2">
                            {['Twitter/X', 'Instagram', 'LinkedIn', 'Facebook'].map(p => (
                                <button key={p} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 text-sm text-gray-700 dark:text-neutral-300 hover:border-primary-500 hover:text-primary-600 transition-colors">{p}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Generated Post Preview</label>
                        <div className="bg-gray-50 dark:bg-neutral-700/40 rounded-xl p-4 text-sm text-gray-700 dark:text-neutral-300 min-h-[100px]">
                            <p>🚀 Join us at <strong>Tech Summit 2026</strong>! Connect with 800+ innovators, attend 30+ sessions, and shape the future of technology. Early bird tickets available now!</p>
                            <p className="mt-2">#TechSummit2026 #Innovation #Technology</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="primary"><Share2 size={14} className="mr-1.5" /> Share</Button>
                        <Button variant="ghost"><Copy size={14} className="mr-1.5" /> Copy Text</Button>
                        <Button variant="ghost"><Sparkles size={14} className="mr-1.5" /> Regenerate</Button>
                    </div>
                </motion.div>
            </TabPanel>

            {/* ═══════ Promo Materials ═══════ */}
            <TabPanel id="materials" activeTab={activeTab}>
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { title: 'Event Flyer', desc: 'A4 poster for printing', icon: <Image size={24} /> },
                        { title: 'Social Banner', desc: '1200×628 for social media', icon: <Share2 size={24} /> },
                        { title: 'Story Template', desc: '1080×1920 for stories', icon: <Megaphone size={24} /> },
                        { title: 'Email Header', desc: '600×200 for email campaigns', icon: <Mail size={24} /> },
                        { title: 'Ticket Design', desc: 'Printable ticket template', icon: <Tag size={24} /> },
                        { title: 'Email Signature', desc: 'Personal branding banner', icon: <Edit size={24} /> },
                    ].map(item => (
                        <div key={item.title} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6 text-center hover:shadow-lg transition-all group cursor-pointer">
                            <div className="w-14 h-14 mx-auto rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
                            <h3 className="font-bold text-gray-900 dark:text-white">{item.title}</h3>
                            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">{item.desc}</p>
                            <Button variant="ghost" size="sm" className="mt-4"><Download size={14} className="mr-1" /> Generate & Download</Button>
                        </div>
                    ))}
                </motion.div>
            </TabPanel>

            {/* ═══════ Discount Codes ═══════ */}
            <TabPanel id="discounts" activeTab={activeTab}>
                <motion.div variants={itemVariants} className="space-y-4">
                    <div className="flex justify-end">
                        <Button variant="primary" onClick={() => setCreateDiscountOpen(true)}><Plus size={14} className="mr-1.5" /> Create Code</Button>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
                        <DataTable<DiscountCode>
                            columns={discountColumns}
                            data={MOCK_DISCOUNTS}
                            keyExtractor={(row) => row.id}
                            showPagination={false}
                            emptyMessage="No discount codes yet"
                        />
                    </div>
                </motion.div>
            </TabPanel>

            {/* ═══════ Referrals ═══════ */}
            <TabPanel id="referrals" activeTab={activeTab}>
                <motion.div variants={itemVariants} className="space-y-6">
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Link2 size={16} /> Your Referral Link</h3>
                        <div className="flex gap-2">
                            <input type="text" readOnly value="https://flowgatex.com/ref/org-12345" className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-700 text-gray-600 dark:text-neutral-300 text-sm" />
                            <Button variant="ghost"><Copy size={14} className="mr-1" /> Copy</Button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Earn $5 for each ticket sold through your referral link.</p>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
                        <DataTable<Referral>
                            columns={referralColumns}
                            data={MOCK_REFERRALS}
                            keyExtractor={(row) => row.id}
                            showPagination={false}
                            emptyMessage="No referrals yet"
                        />
                    </div>
                </motion.div>
            </TabPanel>

            {/* ── Create Campaign Modal ── */}
            <Modal isOpen={createCampaignOpen} onClose={() => setCreateCampaignOpen(false)} title="Create Email Campaign" size="lg">
                <form onSubmit={(e) => { e.preventDefault(); setCreateCampaignOpen(false); }} className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Campaign Name</label><input type="text" placeholder="e.g. Early Bird Reminder" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Subject Line</label><input type="text" placeholder="Don't miss out on..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Email Body</label><textarea rows={5} placeholder="Write your email content..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Target Audience</label>
                        <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option>All Subscribers</option>
                            <option>Past Attendees</option>
                            <option>Tech Summit Subscribers</option>
                            <option>VIP Members</option>
                        </select>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="submit" variant="primary" className="flex-1"><Send size={14} className="mr-1.5" /> Send Now</Button>
                        <Button type="button" variant="ghost" className="flex-1"><Clock size={14} className="mr-1.5" /> Schedule</Button>
                    </div>
                </form>
            </Modal>

            {/* ── Create Discount Modal ── */}
            <Modal isOpen={createDiscountOpen} onClose={() => setCreateDiscountOpen(false)} title="Create Discount Code" size="md">
                <form onSubmit={(e) => { e.preventDefault(); setCreateDiscountOpen(false); }} className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Code</label><input type="text" placeholder="e.g. SUMMER20" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Type</label><select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"><option value="percentage">Percentage</option><option value="flat">Flat Amount</option></select></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Value</label><input type="number" placeholder="20" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Max Uses</label><input type="number" placeholder="100" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Expires</label><input type="date" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="submit" variant="primary" className="flex-1">Create Code</Button>
                        <Button type="button" variant="ghost" onClick={() => setCreateDiscountOpen(false)}>Cancel</Button>
                    </div>
                </form>
            </Modal>
        </motion.div>
    );
}
