import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Tag,
    Plus,
    Copy,
    Sparkles,
    Megaphone,
    Mail,
    Send,
    Download,
    Image,
    Search,
    Pause,
    Play,
    Trash2,
    Edit,
    Clock,
    RefreshCw,
    Shuffle,
    Palette,
    Type,
    QrCode,
    ChevronDown,
    ChevronUp,
    ArrowLeft,
    Check,
    Loader2,
    Hash,
    Smile,
    Globe,
} from 'lucide-react';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import { Tabs, TabPanel } from '@/components/common/Tabs';
import DataTable, { type Column } from '@/components/common/DataTable';
import Modal from '@/components/common/Modal';
import { Skeleton, SkeletonCard } from '@/components/common/Skeleton';
import { showSuccess, showError, showWarning } from '@/components/common/Toast';

import { useAuthStore } from '@/store/zustand/stores';
import { eventService } from '@/features/events/services/eventService';
import {
    getOrganizerPromoCodes,
    createMarketingPromoCode,
    updateMarketingPromoCode,
    togglePromoStatus,
    deleteMarketingPromoCode,
    generateRandomCode,
    isPromoCodeUnique,
    generateSocialPost,
    getOrganizerCampaigns,
    createEmailCampaign,
    sendTestEmail,
    generateFlyer,
} from '@/features/events/services/marketingService';
import type { CreateEventData } from '@/features/events/types/event.types';
import type {
    MarketingPromoCode,
    CreatePromoCodeData,
    PromoStatus,
    SocialPlatform,
    SocialTone,
    SocialLanguage,
    SocialGenResult,
    GenerationHistoryItem,
    EmailCampaign,
    CreateCampaignData,
    RecipientType,
    EmailTemplate,
    FlyerTemplate,
    FlyerOutputFormat,
} from '@/features/events/types/marketing.types';
import {
    PLATFORM_CHAR_LIMITS,
    PLATFORM_LABELS,
    TONE_OPTIONS,
    LANGUAGE_OPTIONS,
    EMAIL_TEMPLATE_VARIABLES,
    FLYER_TEMPLATES,
    FLYER_FORMAT_OPTIONS,
    FLYER_FONT_OPTIONS,
} from '@/features/events/types/marketing.types';
import { formatCurrency, formatDate } from '@/lib/utils';

// =============================================================================
// ANIMATION CONFIG
// =============================================================================

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 22 } },
};

// =============================================================================
// HELPERS
// =============================================================================

function daysUntil(dateVal: unknown): number {
    let d: Date;
    if (dateVal && typeof dateVal === 'object' && 'toDate' in (dateVal as any)) {
        d = (dateVal as any).toDate();
    } else if (typeof dateVal === 'string') {
        d = new Date(dateVal);
    } else {
        return 999;
    }
    return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}

function toDateString(dateVal: unknown): string {
    if (!dateVal) return '\u2014';
    if (typeof dateVal === 'object' && 'toDate' in (dateVal as any)) {
        return formatDate((dateVal as any).toDate());
    }
    if (typeof dateVal === 'string') return formatDate(dateVal);
    return '\u2014';
}

type OrgEvent = CreateEventData & { id: string };

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function MarketingToolsPage() {
    const { user } = useAuthStore();
    const organizerId = user?.uid ?? '';

    // -- Global state --
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'promos' | 'social' | 'email' | 'flyer'>('promos');
    const [events, setEvents] = useState<OrgEvent[]>([]);

    // -- Promo state --
    const [promoCodes, setPromoCodes] = useState<MarketingPromoCode[]>([]);
    const [promoSearch, setPromoSearch] = useState('');
    const [promoStatusFilter, setPromoStatusFilter] = useState<'all' | PromoStatus>('all');
    const [promoEventFilter, setPromoEventFilter] = useState<string>('all');
    const [promoModalOpen, setPromoModalOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState<MarketingPromoCode | null>(null);
    const [expandedPromo, setExpandedPromo] = useState<string | null>(null);
    const [promoSaving, setPromoSaving] = useState(false);

    // -- Social AI state --
    const [socialEventId, setSocialEventId] = useState('');
    const [socialPlatform, setSocialPlatform] = useState<SocialPlatform>('instagram');
    const [socialTone, setSocialTone] = useState<SocialTone>('exciting');
    const [socialHashtags, setSocialHashtags] = useState(true);
    const [socialEmojis, setSocialEmojis] = useState(true);
    const [socialCustomMsg, setSocialCustomMsg] = useState('');
    const [socialLanguage, setSocialLanguage] = useState<SocialLanguage>('en');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPost, setGeneratedPost] = useState<SocialGenResult | null>(null);
    const [editablePost, setEditablePost] = useState('');
    const [isEditingPost, setIsEditingPost] = useState(false);
    const [generationHistory, setGenerationHistory] = useState<GenerationHistoryItem[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    // -- Email state --
    const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
    const [campaignEventFilter, setCampaignEventFilter] = useState<string>('all');
    const [campaignWizardOpen, setCampaignWizardOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);
    const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
    const [campaignSaving, setCampaignSaving] = useState(false);

    // campaign wizard fields
    const [cwEventId, setCwEventId] = useState('');
    const [cwRecipientType, setCwRecipientType] = useState<RecipientType>('all');
    const [cwTierFilter, setCwTierFilter] = useState('');
    const [cwTemplate, setCwTemplate] = useState<EmailTemplate>('reminder');
    const [cwSubject, setCwSubject] = useState('');
    const [cwBody, setCwBody] = useState('');
    const [cwScheduleType, setCwScheduleType] = useState<'now' | 'later'>('now');
    const [cwScheduledAt, setCwScheduledAt] = useState('');
    const [cwTestEmail, setCwTestEmail] = useState('');

    // -- Flyer state --
    const [flyerEventId, setFlyerEventId] = useState('');
    const [flyerTemplate, setFlyerTemplate] = useState<FlyerTemplate>('modern_minimalist');
    const [flyerPrimaryColor, setFlyerPrimaryColor] = useState('#6366f1');
    const [flyerSecondaryColor, setFlyerSecondaryColor] = useState('#f59e0b');
    const [flyerFont, setFlyerFont] = useState<string>('Poppins');
    const [flyerFormat, setFlyerFormat] = useState<FlyerOutputFormat>('instagram_post');
    const [flyerShowQr, setFlyerShowQr] = useState(true);
    const [flyerGenerating, setFlyerGenerating] = useState(false);
    const [flyerResult, setFlyerResult] = useState<{ downloadUrl: string; dimensions: string } | null>(null);

    // -- Fetch data on mount --
    useEffect(() => {
        if (!organizerId) return;
        const load = async () => {
            try {
                const [evts, codes, camps] = await Promise.all([
                    eventService.getEventsByOrganizer(organizerId),
                    getOrganizerPromoCodes(organizerId),
                    getOrganizerCampaigns(organizerId),
                ]);
                setEvents(evts);
                setPromoCodes(codes);
                setCampaigns(camps);
                if (evts.length > 0) {
                    setSocialEventId(evts[0].id);
                    setFlyerEventId(evts[0].id);
                }
            } catch (err) {
                console.error('Marketing load error:', err);
                showError('Failed to load marketing data');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [organizerId]);

    // -- TAB DEFINITIONS --
    const tabs = [
        { id: 'promos', label: 'Promo Codes', icon: <Tag size={15} /> },
        { id: 'social', label: 'Social Media AI', icon: <Sparkles size={15} /> },
        { id: 'email', label: 'Email Campaigns', icon: <Mail size={15} /> },
        { id: 'flyer', label: 'Flyer Generator', icon: <Image size={15} /> },
    ];

    // =====================================================================
    // PROMO CODES LOGIC
    // =====================================================================

    const filteredPromos = useMemo(() => {
        return promoCodes.filter((p) => {
            if (promoSearch && !p.code.toLowerCase().includes(promoSearch.toLowerCase())) return false;
            if (promoStatusFilter !== 'all' && p.status !== promoStatusFilter) return false;
            if (promoEventFilter !== 'all' && p.eventId !== promoEventFilter) return false;
            return true;
        });
    }, [promoCodes, promoSearch, promoStatusFilter, promoEventFilter]);

    const handleCreatePromo = () => {
        setEditingPromo(null);
        setPromoModalOpen(true);
    };
    const handleEditPromo = (promo: MarketingPromoCode) => {
        setEditingPromo(promo);
        setPromoModalOpen(true);
    };

    const handleTogglePromo = async (promo: MarketingPromoCode) => {
        const newStatus: 'active' | 'paused' = promo.status === 'active' ? 'paused' : 'active';
        try {
            await togglePromoStatus(promo.id, newStatus);
            setPromoCodes((prev) =>
                prev.map((p) => (p.id === promo.id ? { ...p, status: newStatus } : p)),
            );
            showSuccess(`Promo code ${newStatus === 'paused' ? 'paused' : 'activated'}`);
        } catch {
            showError('Failed to update promo code');
        }
    };

    const handleDeletePromo = async (promo: MarketingPromoCode) => {
        if (promo.usedCount > 0) {
            showWarning('Cannot delete a promo code that has been used');
            return;
        }
        try {
            await deleteMarketingPromoCode(promo.id);
            setPromoCodes((prev) => prev.filter((p) => p.id !== promo.id));
            showSuccess('Promo code deleted');
        } catch {
            showError('Failed to delete promo code');
        }
    };

    const handleSavePromo = async (data: CreatePromoCodeData) => {
        setPromoSaving(true);
        try {
            if (editingPromo) {
                await updateMarketingPromoCode(editingPromo.id, data as unknown as Partial<MarketingPromoCode>);
                setPromoCodes((prev) =>
                    prev.map((p) => (p.id === editingPromo.id ? { ...p, ...data } : p)),
                );
                showSuccess('Promo code updated');
            } else {
                const id = await createMarketingPromoCode(data);
                setPromoCodes((prev) => [{ ...data, id, usedCount: 0 } as MarketingPromoCode, ...prev]);
                showSuccess('Promo code created');
            }
            setPromoModalOpen(false);
        } catch (err: any) {
            showError(err?.message ?? 'Failed to save promo code');
        } finally {
            setPromoSaving(false);
        }
    };

    // =====================================================================
    // SOCIAL AI LOGIC
    // =====================================================================

    const handleGenerate = async () => {
        if (!socialEventId) {
            showWarning('Please select an event first');
            return;
        }
        setIsGenerating(true);
        setIsEditingPost(false);
        try {
            const result = await generateSocialPost({
                eventId: socialEventId,
                platform: socialPlatform,
                tone: socialTone,
                includeHashtags: socialHashtags,
                includeEmojis: socialEmojis,
                customMessage: socialCustomMsg || undefined,
                language: socialLanguage,
            });
            setGeneratedPost(result);
            setEditablePost(result.generatedText);
            setGenerationHistory((prev) => [
                {
                    id: Date.now().toString(),
                    text: result.generatedText,
                    platform: socialPlatform,
                    tone: socialTone,
                    generatedAt: new Date(),
                },
                ...prev.slice(0, 4),
            ]);
        } catch {
            showError('Failed to generate post. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyPost = () => {
        const text = isEditingPost ? editablePost : generatedPost?.generatedText ?? '';
        navigator.clipboard.writeText(text);
        showSuccess('Copied to clipboard!');
    };

    const handleRestoreHistory = (item: GenerationHistoryItem) => {
        setGeneratedPost({ generatedText: item.text, characterCount: item.text.length });
        setEditablePost(item.text);
        setSocialPlatform(item.platform);
        setSocialTone(item.tone);
        setShowHistory(false);
    };

    // =====================================================================
    // EMAIL CAMPAIGN LOGIC
    // =====================================================================

    const filteredCampaigns = useMemo(() => {
        if (campaignEventFilter === 'all') return campaigns;
        return campaigns.filter((c) => c.eventId === campaignEventFilter);
    }, [campaigns, campaignEventFilter]);

    const resetCampaignWizard = () => {
        setWizardStep(1);
        setCwEventId('');
        setCwRecipientType('all');
        setCwTierFilter('');
        setCwTemplate('reminder');
        setCwSubject('');
        setCwBody('');
        setCwScheduleType('now');
        setCwScheduledAt('');
        setCwTestEmail('');
    };

    const handleOpenCampaignWizard = () => {
        resetCampaignWizard();
        setCampaignWizardOpen(true);
    };

    const handleSendCampaign = async () => {
        if (!cwEventId || !cwSubject) {
            showWarning('Please fill all required fields');
            return;
        }
        setCampaignSaving(true);
        try {
            const data: CreateCampaignData = {
                name: cwSubject,
                eventId: cwEventId,
                recipientType: cwRecipientType,
                tierFilter: cwRecipientType === 'specific_tier' ? cwTierFilter : undefined,
                subject: cwSubject,
                templateId: cwTemplate,
                htmlBody: cwBody,
                scheduledAt: cwScheduleType === 'later' ? cwScheduledAt : null,
            };
            await createEmailCampaign(data, organizerId);
            const updated = await getOrganizerCampaigns(organizerId);
            setCampaigns(updated);
            setCampaignWizardOpen(false);
            showSuccess(cwScheduleType === 'now' ? 'Campaign sent!' : 'Campaign scheduled!');
        } catch {
            showError('Failed to create campaign');
        } finally {
            setCampaignSaving(false);
        }
    };

    const handleSendTestEmail = async () => {
        if (!cwTestEmail) {
            showWarning('Enter a test email address');
            return;
        }
        try {
            await sendTestEmail('preview', cwTestEmail);
            showSuccess('Test email sent!');
        } catch {
            showError('Failed to send test email');
        }
    };

    // =====================================================================
    // FLYER GENERATOR LOGIC
    // =====================================================================

    const handleGenerateFlyer = async () => {
        if (!flyerEventId) {
            showWarning('Please select an event');
            return;
        }
        setFlyerGenerating(true);
        setFlyerResult(null);
        try {
            const result = await generateFlyer({
                eventId: flyerEventId,
                templateId: flyerTemplate,
                primaryColor: flyerPrimaryColor,
                secondaryColor: flyerSecondaryColor,
                fontFamily: flyerFont,
                format: flyerFormat,
                showQrCode: flyerShowQr,
            });
            setFlyerResult(result);
            showSuccess('Flyer generated!');
        } catch {
            showError('Flyer generation failed. Please try again.');
        } finally {
            setFlyerGenerating(false);
        }
    };

    // =====================================================================
    // PROMO TABLE COLUMNS
    // =====================================================================

    const promoColumns: Column<MarketingPromoCode>[] = useMemo(
        () => [
            {
                key: 'code',
                header: 'Code',
                render: (row) => (
                    <button
                        onClick={() => { navigator.clipboard.writeText(row.code); showSuccess('Code copied!'); }}
                        className="font-mono font-bold text-sm text-gray-900 dark:text-white hover:text-primary-600 transition-colors cursor-pointer"
                        title="Click to copy"
                    >
                        {row.code}
                    </button>
                ),
            },
            {
                key: 'discountValue',
                header: 'Discount',
                width: '120px',
                sortable: true,
                render: (row) => (
                    <span className="text-sm font-medium">
                        {row.discountType === 'percentage' ? `${row.discountValue}% off` : `${formatCurrency(row.discountValue)} flat`}
                    </span>
                ),
            },
            {
                key: 'usedCount',
                header: 'Uses',
                width: '140px',
                sortable: true,
                render: (row) => (
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary-500 rounded-full transition-all"
                                style={{ width: `${Math.min((row.usedCount / (row.maxUses || 1)) * 100, 100)}%` }}
                            />
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">{row.usedCount} / {row.maxUses}</span>
                    </div>
                ),
            },
            {
                key: 'tierId',
                header: 'Applied To',
                width: '120px',
                render: (row) => (
                    <span className="text-xs text-gray-500 dark:text-neutral-400">
                        {row.tierId ? row.tierId : 'All Tiers'}
                    </span>
                ),
            },
            {
                key: 'validUntil',
                header: 'Valid Until',
                width: '150px',
                sortable: true,
                render: (row) => {
                    const days = daysUntil(row.validUntil);
                    return (
                        <div>
                            <span className="text-xs text-gray-500">{toDateString(row.validUntil)}</span>
                            {days >= 0 && days < 3 && (
                                <span className="block text-xs text-amber-600 dark:text-amber-400 font-medium">
                                    Expires in {days}d
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                key: 'status',
                header: 'Status',
                width: '100px',
                sortable: true,
                align: 'center',
                render: (row) => {
                    const variant = row.status === 'active' ? 'success' : row.status === 'paused' ? 'warning' : 'default';
                    return <Badge variant={variant}>{row.status}</Badge>;
                },
            },
            {
                key: 'id',
                header: 'Actions',
                width: '130px',
                align: 'center',
                render: (row) => (
                    <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleEditPromo(row)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors" title="Edit">
                            <Edit size={14} />
                        </button>
                        <button onClick={() => handleTogglePromo(row)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors" title={row.status === 'active' ? 'Pause' : 'Activate'}>
                            {row.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                        {row.usedCount === 0 && (
                            <button onClick={() => handleDeletePromo(row)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-500 hover:text-red-600 transition-colors" title="Delete">
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                ),
            },
        ],
        [],
    );

    // =====================================================================
    // EMAIL TABLE COLUMNS
    // =====================================================================

    const campaignColumns: Column<EmailCampaign>[] = useMemo(
        () => [
            {
                key: 'name',
                header: 'Campaign',
                render: (row) => (
                    <div>
                        <span className="font-medium text-gray-900 dark:text-white text-sm">{row.name}</span>
                        {row.templateId && (
                            <Badge variant="info" size="sm" className="ml-2">{row.templateId}</Badge>
                        )}
                    </div>
                ),
            },
            {
                key: 'eventName',
                header: 'Event',
                width: '150px',
                render: (row) => {
                    const evt = events.find((e) => e.id === row.eventId);
                    return <span className="text-xs text-gray-500 dark:text-neutral-400">{evt?.title ?? row.eventName ?? '\u2014'}</span>;
                },
            },
            { key: 'recipientCount', header: 'Recipients', width: '100px', align: 'center' },
            {
                key: 'sentAt',
                header: 'Sent Date',
                width: '140px',
                render: (row) => (
                    <span className="text-xs text-gray-400">
                        {row.status === 'scheduled' && row.scheduledAt
                            ? `Scheduled: ${toDateString(row.scheduledAt)}`
                            : row.sentAt
                                ? toDateString(row.sentAt)
                                : '\u2014'}
                    </span>
                ),
            },
            {
                key: 'stats',
                header: 'Open %',
                width: '90px',
                align: 'center',
                render: (row) => {
                    if (!row.stats || row.stats.delivered === 0) return <span className="text-xs text-gray-400">{'\u2014'}</span>;
                    const rate = Math.round((row.stats.opened / row.stats.delivered) * 100);
                    const color = rate > 40 ? 'text-green-600' : rate > 20 ? 'text-amber-600' : 'text-red-500';
                    return <span className={`text-sm font-medium ${color}`}>{rate}%</span>;
                },
            },
            {
                key: 'id',
                header: 'Click %',
                width: '90px',
                align: 'center',
                render: (row) => {
                    if (!row.stats || row.stats.delivered === 0) return <span className="text-xs text-gray-400">{'\u2014'}</span>;
                    const rate = Math.round((row.stats.clicked / row.stats.delivered) * 100);
                    return <span className="text-sm">{rate}%</span>;
                },
            },
            {
                key: 'status',
                header: 'Status',
                width: '110px',
                align: 'center',
                render: (row) => {
                    const v = row.status === 'sent' ? 'success' : row.status === 'scheduled' ? 'info' : 'warning';
                    return <Badge variant={v}>{row.status}</Badge>;
                },
            },
        ],
        [events],
    );

    // =====================================================================
    // LOADING STATE
    // =====================================================================

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" rounded="lg" />
                <Skeleton className="h-10 w-full max-w-lg" rounded="lg" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <SkeletonCard key={i} className="h-28" />
                    ))}
                </div>
                <SkeletonCard className="h-80" />
            </div>
        );
    }

    // =====================================================================
    // RENDER
    // =====================================================================

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* Header */}
            <motion.div variants={itemVariants}>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <Megaphone className="text-primary-500" size={28} />
                    Marketing Tools
                </h1>
                <p className="text-gray-500 dark:text-neutral-400 mt-1">
                    Manage promo codes, generate AI social posts, send email campaigns, and create flyers.
                </p>
            </motion.div>

            {/* Tabs */}
            <motion.div variants={itemVariants}>
                <Tabs items={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as any)} variant="underline" />
            </motion.div>

            {/* ================================================================
          TAB A - PROMO CODES
         ================================================================ */}
            <TabPanel id="promos" activeTab={activeTab}>
                <motion.div variants={itemVariants} className="space-y-4">
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                        <div className="flex flex-wrap gap-2 items-center">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search codes..."
                                    value={promoSearch}
                                    onChange={(e) => setPromoSearch(e.target.value)}
                                    className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 w-48"
                                />
                            </div>
                            <select
                                value={promoStatusFilter}
                                onChange={(e) => setPromoStatusFilter(e.target.value as any)}
                                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="expired">Expired</option>
                                <option value="paused">Paused</option>
                            </select>
                            <select
                                value={promoEventFilter}
                                onChange={(e) => setPromoEventFilter(e.target.value)}
                                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="all">All Events</option>
                                {events.map((ev) => (
                                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                                ))}
                            </select>
                        </div>
                        <Button variant="primary" onClick={handleCreatePromo}>
                            <Plus size={14} className="mr-1.5" /> Create Promo Code
                        </Button>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
                        <DataTable<MarketingPromoCode>
                            columns={promoColumns}
                            data={filteredPromos}
                            keyExtractor={(row) => row.id}
                            emptyMessage="No promo codes yet. Create one to get started!"
                            onRowClick={(row) => setExpandedPromo(expandedPromo === row.id ? null : row.id)}
                        />

                        {/* Expanded performance row */}
                        <AnimatePresence>
                            {expandedPromo && (() => {
                                const p = promoCodes.find((c) => c.id === expandedPromo);
                                if (!p) return null;
                                const revenueImpact = p.usedCount * p.discountValue * (p.discountType === 'percentage' ? 5 : 1);
                                return (
                                    <motion.div
                                        key={expandedPromo}
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-gray-100 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800/50 px-6 py-4"
                                    >
                                        <div className="flex flex-wrap gap-6 text-sm">
                                            <div>
                                                <span className="text-gray-400">Uses:</span>{' '}
                                                <span className="font-medium text-gray-900 dark:text-white">{p.usedCount} / {p.maxUses}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Revenue Impact:</span>{' '}
                                                <span className="font-medium text-red-500">{'\u2212'}{formatCurrency(revenueImpact)} discount</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Bookings via code:</span>{' '}
                                                <span className="font-medium text-gray-900 dark:text-white">{p.usedCount}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Avg order:</span>{' '}
                                                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(p.minOrderValue ?? 0)}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })()}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </TabPanel>

            {/* ================================================================
          TAB B - SOCIAL MEDIA AI
         ================================================================ */}
            <TabPanel id="social" activeTab={activeTab}>
                <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Input Form (40%) */}
                    <div className="lg:col-span-2 bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6 space-y-5">
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="text-amber-500" size={20} />
                            <h3 className="font-bold text-gray-900 dark:text-white">AI Post Generator</h3>
                        </div>

                        {/* Event Selector */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Event</label>
                            {events.length === 0 ? (
                                <p className="text-sm text-amber-600 dark:text-amber-400">Create an event first to generate posts.</p>
                            ) : (
                                <select
                                    value={socialEventId}
                                    onChange={(e) => setSocialEventId(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    {events.map((ev) => (
                                        <option key={ev.id} value={ev.id}>{ev.title}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Platform */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Platform</label>
                            <div className="flex flex-wrap gap-2">
                                {(Object.keys(PLATFORM_LABELS) as SocialPlatform[]).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setSocialPlatform(p)}
                                        className={`px-4 py-2 rounded-xl border text-sm transition-colors ${socialPlatform === p
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 font-medium'
                                                : 'border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 hover:border-primary-300'
                                            }`}
                                    >
                                        {PLATFORM_LABELS[p]}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Limit: {PLATFORM_CHAR_LIMITS[socialPlatform].toLocaleString()} chars</p>
                        </div>

                        {/* Tone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Tone</label>
                            <select
                                value={socialTone}
                                onChange={(e) => setSocialTone(e.target.value as SocialTone)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                {TONE_OPTIONS.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Toggles */}
                        <div className="flex gap-6">
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-neutral-300 cursor-pointer">
                                <input type="checkbox" checked={socialHashtags} onChange={(e) => setSocialHashtags(e.target.checked)} className="rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
                                <Hash size={14} /> Hashtags
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-neutral-300 cursor-pointer">
                                <input type="checkbox" checked={socialEmojis} onChange={(e) => setSocialEmojis(e.target.checked)} className="rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
                                <Smile size={14} /> Emojis
                            </label>
                        </div>

                        {/* Language */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">
                                <Globe size={14} className="inline mr-1" /> Language
                            </label>
                            <select
                                value={socialLanguage}
                                onChange={(e) => setSocialLanguage(e.target.value as SocialLanguage)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                {LANGUAGE_OPTIONS.map((l) => (
                                    <option key={l.value} value={l.value}>{l.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Custom Message */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Custom Note (optional)</label>
                            <textarea
                                value={socialCustomMsg}
                                onChange={(e) => setSocialCustomMsg(e.target.value.slice(0, 200))}
                                rows={2}
                                placeholder="e.g., Mention free lunch on Day 1"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <p className="text-xs text-gray-400 text-right">{socialCustomMsg.length}/200</p>
                        </div>

                        <Button variant="primary" onClick={handleGenerate} isLoading={isGenerating} className="w-full">
                            <Sparkles size={14} className="mr-1.5" /> Generate Post
                        </Button>
                    </div>

                    {/* Generated Content Preview (60%) */}
                    <div className="lg:col-span-3 bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 dark:text-white">Generated Preview</h3>
                            {generatedPost && (
                                <Badge variant="info">{PLATFORM_LABELS[socialPlatform]}</Badge>
                            )}
                        </div>

                        {/* Preview content */}
                        {isGenerating ? (
                            <div className="min-h-[200px] flex items-center justify-center">
                                <div className="flex items-center gap-3 text-gray-500">
                                    <Loader2 size={20} className="animate-spin" />
                                    <span className="text-sm">Generating your post...</span>
                                </div>
                            </div>
                        ) : generatedPost ? (
                            <>
                                <div className="bg-gray-50 dark:bg-neutral-700/40 rounded-xl p-4 min-h-[160px]">
                                    {isEditingPost ? (
                                        <textarea
                                            value={editablePost}
                                            onChange={(e) => setEditablePost(e.target.value)}
                                            className="w-full min-h-[140px] bg-transparent text-sm text-gray-700 dark:text-neutral-300 resize-none focus:outline-none"
                                        />
                                    ) : (
                                        <p className="text-sm text-gray-700 dark:text-neutral-300 whitespace-pre-wrap">
                                            {generatedPost.generatedText}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">
                                        {(isEditingPost ? editablePost.length : generatedPost.characterCount)} / {PLATFORM_CHAR_LIMITS[socialPlatform].toLocaleString()} chars
                                    </span>
                                    {isEditingPost && (
                                        <Button variant="primary" size="sm" onClick={() => setIsEditingPost(false)}>
                                            <Check size={12} className="mr-1" /> Save Edits
                                        </Button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button variant="ghost" size="sm" onClick={handleCopyPost}>
                                        <Copy size={14} className="mr-1" /> Copy
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={handleGenerate} isLoading={isGenerating}>
                                        <RefreshCw size={14} className="mr-1" /> Regenerate
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => setIsEditingPost(!isEditingPost)}>
                                        <Edit size={14} className="mr-1" /> {isEditingPost ? 'Cancel Edit' : 'Edit'}
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => showInfoMsg('Coming soon!')}>
                                        <Download size={14} className="mr-1" /> Download Image
                                    </Button>
                                    <Button variant="ghost" size="sm" disabled title="Coming Soon">
                                        <Clock size={14} className="mr-1" /> Schedule Post
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="min-h-[200px] flex flex-col items-center justify-center text-gray-400 gap-2">
                                <Sparkles size={32} className="opacity-30" />
                                <p className="text-sm">Select an event and click Generate to create a post</p>
                            </div>
                        )}

                        {/* Generation History */}
                        {generationHistory.length > 0 && (
                            <div className="border-t border-gray-100 dark:border-neutral-700 pt-4">
                                <button
                                    onClick={() => setShowHistory(!showHistory)}
                                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-neutral-300 transition-colors"
                                >
                                    {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    Recent History ({generationHistory.length})
                                </button>
                                <AnimatePresence>
                                    {showHistory && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="mt-3 space-y-2 overflow-hidden"
                                        >
                                            {generationHistory.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="bg-gray-50 dark:bg-neutral-700/30 rounded-lg p-3 flex items-start justify-between gap-3"
                                                >
                                                    <p className="text-xs text-gray-600 dark:text-neutral-400 line-clamp-2 flex-1">{item.text}</p>
                                                    <Button variant="ghost" size="sm" onClick={() => handleRestoreHistory(item)}>
                                                        Use this
                                                    </Button>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </motion.div>
            </TabPanel>

            {/* ================================================================
          TAB C - EMAIL CAMPAIGNS
         ================================================================ */}
            <TabPanel id="email" activeTab={activeTab}>
                <motion.div variants={itemVariants} className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                        <select
                            value={campaignEventFilter}
                            onChange={(e) => setCampaignEventFilter(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="all">All Events</option>
                            {events.map((ev) => (
                                <option key={ev.id} value={ev.id}>{ev.title}</option>
                            ))}
                        </select>
                        <Button variant="primary" onClick={handleOpenCampaignWizard}>
                            <Plus size={14} className="mr-1.5" /> Create Campaign
                        </Button>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
                        <DataTable<EmailCampaign>
                            columns={campaignColumns}
                            data={filteredCampaigns}
                            keyExtractor={(row) => row.id}
                            emptyMessage="No campaigns yet. Create your first email campaign!"
                            onRowClick={(row) => setSelectedCampaign(row)}
                        />
                    </div>
                </motion.div>
            </TabPanel>

            {/* ================================================================
          TAB D - FLYER / BANNER GENERATOR
         ================================================================ */}
            <TabPanel id="flyer" activeTab={activeTab}>
                <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Generator Form */}
                    <div className="lg:col-span-2 bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6 space-y-5">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Palette size={18} className="text-primary-500" /> Flyer Generator
                        </h3>

                        {/* Event */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Event</label>
                            {events.length === 0 ? (
                                <p className="text-sm text-amber-600">Create an event first.</p>
                            ) : (
                                <select
                                    value={flyerEventId}
                                    onChange={(e) => setFlyerEventId(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    {events.map((ev) => (
                                        <option key={ev.id} value={ev.id}>{ev.title}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Template */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Template</label>
                            <div className="grid grid-cols-2 gap-2">
                                {FLYER_TEMPLATES.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setFlyerTemplate(t.id)}
                                        className={`p-3 rounded-xl border text-left transition-all ${flyerTemplate === t.id
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 ring-1 ring-primary-500'
                                                : 'border-gray-200 dark:border-neutral-700 hover:border-primary-300'
                                            }`}
                                    >
                                        <p className="text-xs font-medium text-gray-900 dark:text-white">{t.name}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{t.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Colors */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Primary Color</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={flyerPrimaryColor}
                                        onChange={(e) => setFlyerPrimaryColor(e.target.value)}
                                        className="w-10 h-10 rounded-lg border border-gray-200 dark:border-neutral-700 cursor-pointer"
                                    />
                                    <span className="text-xs font-mono text-gray-500">{flyerPrimaryColor}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Secondary Color</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={flyerSecondaryColor}
                                        onChange={(e) => setFlyerSecondaryColor(e.target.value)}
                                        className="w-10 h-10 rounded-lg border border-gray-200 dark:border-neutral-700 cursor-pointer"
                                    />
                                    <span className="text-xs font-mono text-gray-500">{flyerSecondaryColor}</span>
                                </div>
                            </div>
                        </div>

                        {/* Font */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">
                                <Type size={14} className="inline mr-1" /> Font Family
                            </label>
                            <select
                                value={flyerFont}
                                onChange={(e) => setFlyerFont(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                {FLYER_FONT_OPTIONS.map((f) => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                            </select>
                        </div>

                        {/* Output Format */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Output Format</label>
                            <div className="space-y-2">
                                {FLYER_FORMAT_OPTIONS.map((opt) => (
                                    <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="flyerFormat"
                                            value={opt.value}
                                            checked={flyerFormat === opt.value}
                                            onChange={() => setFlyerFormat(opt.value)}
                                            className="text-primary-500 focus:ring-primary-500"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-neutral-300">{opt.label}</span>
                                        <span className="text-xs text-gray-400">({opt.dimensions})</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* QR Code Toggle */}
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-neutral-300 cursor-pointer">
                            <input type="checkbox" checked={flyerShowQr} onChange={(e) => setFlyerShowQr(e.target.checked)} className="rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
                            <QrCode size={14} /> Include Booking QR Code
                        </label>

                        <Button variant="primary" className="w-full" onClick={handleGenerateFlyer} isLoading={flyerGenerating}>
                            <Download size={14} className="mr-1.5" /> Generate & Download
                        </Button>
                    </div>

                    {/* Live Preview */}
                    <div className="lg:col-span-3 bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Live Preview</h3>
                        {flyerGenerating ? (
                            <div className="min-h-[400px] flex items-center justify-center">
                                <div className="flex flex-col items-center gap-3 text-gray-500">
                                    <Loader2 size={24} className="animate-spin" />
                                    <span className="text-sm">Generating flyer...</span>
                                </div>
                            </div>
                        ) : flyerResult ? (
                            <div className="space-y-4">
                                <div className="bg-gray-100 dark:bg-neutral-700/40 rounded-xl p-4 flex items-center justify-center min-h-[350px]">
                                    <img src={flyerResult.downloadUrl} alt="Generated Flyer" className="max-w-full max-h-[500px] rounded-lg shadow-lg" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">Dimensions: {flyerResult.dimensions}</span>
                                    <a
                                        href={flyerResult.downloadUrl}
                                        download
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
                                    >
                                        <Download size={14} /> Download
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="min-h-[400px] rounded-xl border-2 border-dashed border-gray-200 dark:border-neutral-700 flex flex-col items-center justify-center text-gray-400 gap-3">
                                {/* Template preview placeholder */}
                                <div
                                    className="w-48 h-64 rounded-lg flex flex-col items-center justify-center gap-2 transition-all"
                                    style={{
                                        background: `linear-gradient(135deg, ${flyerPrimaryColor}22, ${flyerSecondaryColor}22)`,
                                        border: `2px solid ${flyerPrimaryColor}44`,
                                        fontFamily: flyerFont,
                                    }}
                                >
                                    <div className="w-8 h-8 rounded-full" style={{ backgroundColor: flyerPrimaryColor }} />
                                    <div className="w-24 h-2 rounded" style={{ backgroundColor: flyerPrimaryColor + '55' }} />
                                    <div className="w-20 h-2 rounded" style={{ backgroundColor: flyerSecondaryColor + '55' }} />
                                    <div className="w-16 h-2 rounded" style={{ backgroundColor: flyerPrimaryColor + '33' }} />
                                    {flyerShowQr && (
                                        <div className="w-10 h-10 border-2 rounded mt-2" style={{ borderColor: flyerPrimaryColor + '44' }}>
                                            <QrCode size={16} className="m-auto mt-1.5" style={{ color: flyerPrimaryColor + '66' }} />
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm mt-2">Configure options and generate your flyer</p>
                                <p className="text-xs">Format: {FLYER_FORMAT_OPTIONS.find((f) => f.value === flyerFormat)?.label} ({FLYER_FORMAT_OPTIONS.find((f) => f.value === flyerFormat)?.dimensions})</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </TabPanel>

            {/* ================================================================
          MODALS
         ================================================================ */}

            {/* Create / Edit Promo Code Modal */}
            <PromoCodeModal
                isOpen={promoModalOpen}
                onClose={() => { setPromoModalOpen(false); setEditingPromo(null); }}
                onSave={handleSavePromo}
                editing={editingPromo}
                events={events}
                organizerId={organizerId}
                isSaving={promoSaving}
            />

            {/* Campaign Wizard Modal */}
            <Modal
                isOpen={campaignWizardOpen}
                onClose={() => setCampaignWizardOpen(false)}
                title={`Create Campaign \u2014 Step ${wizardStep} of 5`}
                size="lg"
            >
                <CampaignWizardContent
                    step={wizardStep}
                    setStep={setWizardStep}
                    events={events}
                    cwEventId={cwEventId}
                    setCwEventId={setCwEventId}
                    cwRecipientType={cwRecipientType}
                    setCwRecipientType={setCwRecipientType}
                    cwTierFilter={cwTierFilter}
                    setCwTierFilter={setCwTierFilter}
                    cwTemplate={cwTemplate}
                    setCwTemplate={setCwTemplate}
                    cwSubject={cwSubject}
                    setCwSubject={setCwSubject}
                    cwBody={cwBody}
                    setCwBody={setCwBody}
                    cwScheduleType={cwScheduleType}
                    setCwScheduleType={setCwScheduleType}
                    cwScheduledAt={cwScheduledAt}
                    setCwScheduledAt={setCwScheduledAt}
                    cwTestEmail={cwTestEmail}
                    setCwTestEmail={setCwTestEmail}
                    onSendTest={handleSendTestEmail}
                    onSend={handleSendCampaign}
                    isSaving={campaignSaving}
                />
            </Modal>

            {/* Campaign Detail Modal */}
            <Modal
                isOpen={!!selectedCampaign}
                onClose={() => setSelectedCampaign(null)}
                title={selectedCampaign?.name ?? 'Campaign Details'}
                size="lg"
            >
                {selectedCampaign && (
                    <CampaignDetailContent campaign={selectedCampaign} />
                )}
            </Modal>
        </motion.div>
    );
}

// =============================================================================
// PROMO CODE MODAL SUB-COMPONENT
// =============================================================================

interface PromoCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreatePromoCodeData) => void;
    editing: MarketingPromoCode | null;
    events: OrgEvent[];
    organizerId: string;
    isSaving: boolean;
}

function PromoCodeModal({ isOpen, onClose, onSave, editing, events, organizerId, isSaving }: PromoCodeModalProps) {
    const [code, setCode] = useState('');
    const [discountType, setDiscountType] = useState<'percentage' | 'flat'>('flat');
    const [discountValue, setDiscountValue] = useState<number>(0);
    const [eventId, setEventId] = useState('');
    const [tierId, setTierId] = useState<string | null>(null);
    const [maxUses, setMaxUses] = useState(100);
    const [unlimited, setUnlimited] = useState(false);
    const [minOrderValue, setMinOrderValue] = useState<number>(0);
    const [validFrom, setValidFrom] = useState('');
    const [validUntil, setValidUntil] = useState('');
    const [codeError, setCodeError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (editing) {
                setCode(editing.code);
                setDiscountType(editing.discountType);
                setDiscountValue(editing.discountValue);
                setEventId(editing.eventId);
                setTierId(editing.tierId);
                setMaxUses(editing.maxUses);
                setMinOrderValue(editing.minOrderValue ?? 0);
                setValidFrom(toInputDate(editing.validFrom));
                setValidUntil(toInputDate(editing.validUntil));
            } else {
                setCode('');
                setDiscountType('flat');
                setDiscountValue(0);
                setEventId(events[0]?.id ?? '');
                setTierId(null);
                setMaxUses(100);
                setUnlimited(false);
                setMinOrderValue(0);
                setValidFrom(new Date().toISOString().slice(0, 16));
                setValidUntil('');
                setCodeError('');
            }
        }
    }, [isOpen, editing, events]);

    function toInputDate(val: unknown): string {
        if (!val) return '';
        if (typeof val === 'object' && 'toDate' in (val as any)) {
            return (val as any).toDate().toISOString().slice(0, 16);
        }
        if (typeof val === 'string') return new Date(val).toISOString().slice(0, 16);
        return '';
    }

    const handleAutoGenerate = async () => {
        let tryCode = generateRandomCode();
        let attempts = 0;
        while (attempts < 5) {
            const unique = await isPromoCodeUnique(tryCode);
            if (unique) break;
            tryCode = generateRandomCode();
            attempts++;
        }
        setCode(tryCode);
        setCodeError('');
    };

    const handleCodeChange = async (val: string) => {
        const sanitized = val.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20);
        setCode(sanitized);
        if (sanitized.length >= 4 && (!editing || sanitized !== editing.code)) {
            const unique = await isPromoCodeUnique(sanitized);
            setCodeError(unique ? '' : 'Code already taken');
        } else {
            setCodeError(sanitized.length > 0 && sanitized.length < 4 ? 'Min 4 characters' : '');
        }
    };

    const validate = (): boolean => {
        if (code.length < 4 || code.length > 20) return false;
        if (codeError) return false;
        if (discountValue <= 0) return false;
        if (discountType === 'percentage' && discountValue > 100) return false;
        if (!validFrom || !validUntil) return false;
        if (new Date(validUntil) <= new Date(validFrom)) return false;
        if (!unlimited && maxUses < 1) return false;
        return true;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        onSave({
            code,
            discountType,
            discountValue,
            eventId,
            tierId,
            maxUses: unlimited ? 999_999 : maxUses,
            minOrderValue: minOrderValue > 0 ? minOrderValue : undefined,
            validFrom: new Date(validFrom).toISOString(),
            validUntil: new Date(validUntil).toISOString(),
            status: 'active',
            createdBy: organizerId,
        });
    };

    const selectedEvent = events.find((e) => e.id === eventId);
    const tiers = selectedEvent?.ticketTiers ?? [];

    const previewText = code
        ? `${code}: ${discountType === 'percentage' ? `${discountValue}% off` : `${formatCurrency(discountValue)} off`}${minOrderValue > 0 ? ` orders above ${formatCurrency(minOrderValue)}` : ''}\nValid: ${validFrom ? formatDate(validFrom) : '...'} \u2013 ${validUntil ? formatDate(validUntil) : '...'} | ${unlimited ? '\u221e' : maxUses} uses`
        : '';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Edit Promo Code' : 'Create Promo Code'} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Code */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Code</label>
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => handleCodeChange(e.target.value)}
                                placeholder="EARLYBIRD"
                                disabled={!!editing && (editing.usedCount ?? 0) > 0}
                                className={`w-full px-4 py-2.5 rounded-xl border font-mono uppercase ${codeError ? 'border-red-500' : 'border-gray-200 dark:border-neutral-700'
                                    } bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500`}
                            />
                            {codeError && <p className="text-xs text-red-500 mt-1">{codeError}</p>}
                        </div>
                        <Button type="button" variant="ghost" onClick={handleAutoGenerate} disabled={!!editing}>
                            <Shuffle size={14} className="mr-1" /> Auto
                        </Button>
                    </div>
                </div>

                {/* Discount type + value */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Discount Type</label>
                        <div className="flex gap-3">
                            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                                <input type="radio" name="dt" value="percentage" checked={discountType === 'percentage'} onChange={() => setDiscountType('percentage')} disabled={!!editing && (editing.usedCount ?? 0) > 0} className="text-primary-500" />
                                Percentage
                            </label>
                            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                                <input type="radio" name="dt" value="flat" checked={discountType === 'flat'} onChange={() => setDiscountType('flat')} disabled={!!editing && (editing.usedCount ?? 0) > 0} className="text-primary-500" />
                                Flat Amount
                            </label>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">
                            Value {discountType === 'percentage' ? '(%)' : '(\u20b9)'}
                        </label>
                        <input
                            type="number"
                            value={discountValue || ''}
                            onChange={(e) => setDiscountValue(Number(e.target.value))}
                            min={1}
                            max={discountType === 'percentage' ? 100 : undefined}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>

                {/* Event + Tier */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Event</label>
                        <select
                            value={eventId}
                            onChange={(e) => { setEventId(e.target.value); setTierId(null); }}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            {events.map((ev) => (
                                <option key={ev.id} value={ev.id}>{ev.title}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Applies To</label>
                        <select
                            value={tierId ?? ''}
                            onChange={(e) => setTierId(e.target.value || null)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">All Tiers</option>
                            {tiers.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Max Uses + Min Order */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Max Uses</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                value={unlimited ? '' : maxUses}
                                onChange={(e) => setMaxUses(Number(e.target.value))}
                                disabled={unlimited}
                                min={1}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                            />
                            <label className="flex items-center gap-1.5 text-xs text-gray-500 whitespace-nowrap cursor-pointer">
                                <input type="checkbox" checked={unlimited} onChange={(e) => setUnlimited(e.target.checked)} className="rounded text-primary-500" />
                                Unlimited
                            </label>
                        </div>
                        {editing && (editing.usedCount ?? 0) > 0 && !unlimited && maxUses < (editing.usedCount ?? 0) && (
                            <p className="text-xs text-red-500 mt-1">Cannot be less than current uses ({editing.usedCount})</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Min Order (\u20b9)</label>
                        <input
                            type="number"
                            value={minOrderValue || ''}
                            onChange={(e) => setMinOrderValue(Number(e.target.value))}
                            placeholder="Optional"
                            min={0}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Valid From</label>
                        <input
                            type="datetime-local"
                            value={validFrom}
                            onChange={(e) => setValidFrom(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Valid Until</label>
                        <input
                            type="datetime-local"
                            value={validUntil}
                            onChange={(e) => setValidUntil(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>

                {/* Live Preview */}
                {previewText && (
                    <div className="bg-gray-50 dark:bg-neutral-700/40 rounded-xl p-3 text-sm text-gray-700 dark:text-neutral-300 whitespace-pre-line font-mono">
                        {previewText}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="primary" className="flex-1" isLoading={isSaving} disabled={!validate()}>
                        {editing ? 'Update Promo Code' : 'Save Promo Code'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

// =============================================================================
// CAMPAIGN WIZARD CONTENT SUB-COMPONENT
// =============================================================================

interface CampaignWizardProps {
    step: number;
    setStep: (s: number) => void;
    events: OrgEvent[];
    cwEventId: string;
    setCwEventId: (v: string) => void;
    cwRecipientType: RecipientType;
    setCwRecipientType: (v: RecipientType) => void;
    cwTierFilter: string;
    setCwTierFilter: (v: string) => void;
    cwTemplate: EmailTemplate;
    setCwTemplate: (v: EmailTemplate) => void;
    cwSubject: string;
    setCwSubject: (v: string) => void;
    cwBody: string;
    setCwBody: (v: string) => void;
    cwScheduleType: 'now' | 'later';
    setCwScheduleType: (v: 'now' | 'later') => void;
    cwScheduledAt: string;
    setCwScheduledAt: (v: string) => void;
    cwTestEmail: string;
    setCwTestEmail: (v: string) => void;
    onSendTest: () => void;
    onSend: () => void;
    isSaving: boolean;
}

const RECIPIENT_OPTIONS: { value: RecipientType; label: string }[] = [
    { value: 'all', label: 'All Attendees of this Event' },
    { value: 'confirmed', label: 'Confirmed Bookings Only' },
    { value: 'checked_in', label: 'Checked-In Attendees' },
    { value: 'not_checked_in', label: 'Not Yet Checked In' },
    { value: 'specific_tier', label: 'Specific Ticket Tier' },
    { value: 'custom', label: 'Custom Segment' },
];

const TEMPLATE_OPTIONS: { value: EmailTemplate; label: string; emoji: string }[] = [
    { value: 'reminder', label: 'Reminder', emoji: '\u23f0' },
    { value: 'thank_you', label: 'Thank You', emoji: '\ud83d\ude4f' },
    { value: 'update', label: 'Update', emoji: '\ud83d\udce2' },
    { value: 'custom', label: 'Custom HTML', emoji: '\ud83d\udee0\ufe0f' },
];

function CampaignWizardContent(props: CampaignWizardProps) {
    const {
        step, setStep, events,
        cwEventId, setCwEventId,
        cwRecipientType, setCwRecipientType, cwTierFilter, setCwTierFilter,
        cwTemplate, setCwTemplate,
        cwSubject, setCwSubject, cwBody, setCwBody,
        cwScheduleType, setCwScheduleType, cwScheduledAt, setCwScheduledAt,
        cwTestEmail, setCwTestEmail,
        onSendTest, onSend, isSaving,
    } = props;

    const selectedEvent = events.find((e) => e.id === cwEventId);
    const inputCls = "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500";

    const steps = ['Event', 'Recipients', 'Template', 'Content', 'Send'];

    return (
        <div className="space-y-5">
            {/* Progress bar */}
            <div className="flex items-center gap-1 mb-2">
                {steps.map((s, i) => (
                    <div key={s} className="flex items-center gap-1 flex-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i + 1 < step ? 'bg-green-500 text-white' : i + 1 === step ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-neutral-700 text-gray-500'
                            }`}>
                            {i + 1 < step ? <Check size={12} /> : i + 1}
                        </div>
                        <span className={`text-xs hidden sm:inline ${i + 1 === step ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>{s}</span>
                        {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${i + 1 < step ? 'bg-green-500' : 'bg-gray-200 dark:bg-neutral-700'}`} />}
                    </div>
                ))}
            </div>

            {/* Step 1: Select Event */}
            {step === 1 && (
                <div className="space-y-3">
                    <h3 className="font-medium text-gray-900 dark:text-white">Select Event</h3>
                    <select value={cwEventId} onChange={(e) => setCwEventId(e.target.value)} className={inputCls}>
                        <option value="">Choose an event...</option>
                        {events.map((ev) => (
                            <option key={ev.id} value={ev.id}>
                                {ev.title} \u2014 {formatDate(ev.startDate)}
                            </option>
                        ))}
                    </select>
                    {selectedEvent && (
                        <div className="bg-gray-50 dark:bg-neutral-700/40 rounded-xl p-3 text-sm text-gray-600 dark:text-neutral-300">
                            <p className="font-medium">{selectedEvent.title}</p>
                            <p className="text-xs text-gray-400">{formatDate(selectedEvent.startDate)} \u00b7 {selectedEvent.venue?.name ?? 'Online'}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Choose Recipients */}
            {step === 2 && (
                <div className="space-y-3">
                    <h3 className="font-medium text-gray-900 dark:text-white">Choose Recipients</h3>
                    <div className="space-y-2">
                        {RECIPIENT_OPTIONS.map((opt) => (
                            <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${cwRecipientType === opt.value
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                                    : 'border-gray-200 dark:border-neutral-700 hover:border-primary-300'
                                }`}>
                                <input
                                    type="radio"
                                    name="recipientType"
                                    value={opt.value}
                                    checked={cwRecipientType === opt.value}
                                    onChange={() => setCwRecipientType(opt.value)}
                                    className="text-primary-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-neutral-300">{opt.label}</span>
                            </label>
                        ))}
                    </div>
                    {cwRecipientType === 'specific_tier' && selectedEvent && (
                        <select value={cwTierFilter} onChange={(e) => setCwTierFilter(e.target.value)} className={inputCls}>
                            <option value="">Select tier...</option>
                            {(selectedEvent.ticketTiers ?? []).map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    )}
                </div>
            )}

            {/* Step 3: Choose Template */}
            {step === 3 && (
                <div className="space-y-3">
                    <h3 className="font-medium text-gray-900 dark:text-white">Choose Template</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {TEMPLATE_OPTIONS.map((t) => (
                            <button
                                key={t.value}
                                onClick={() => setCwTemplate(t.value)}
                                className={`p-4 rounded-xl border text-center transition-all ${cwTemplate === t.value
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 ring-1 ring-primary-500'
                                        : 'border-gray-200 dark:border-neutral-700 hover:border-primary-300'
                                    }`}
                            >
                                <div className="text-2xl mb-1">{t.emoji}</div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{t.label}</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 4: Customize Content */}
            {step === 4 && (
                <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 dark:text-white">Customize Content</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Subject Line</label>
                        <input
                            type="text"
                            value={cwSubject}
                            onChange={(e) => setCwSubject(e.target.value)}
                            placeholder="Your ticket for {{event.title}} \u2014 See you tomorrow!"
                            className={inputCls}
                        />
                        <p className="text-xs text-gray-400 mt-1 text-right">{cwSubject.length} chars</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Email Body</label>
                        <textarea
                            value={cwBody}
                            onChange={(e) => setCwBody(e.target.value)}
                            rows={8}
                            placeholder={`Dear {{attendee.firstName}},\n\nYour ticket for {{event.title}} is confirmed.\n\ud83d\udcc5 {{event.date}} | \ud83d\udccd {{event.venue}}\n\nSee you there!\n{{organizer.name}}`}
                            className={`${inputCls} resize-none`}
                        />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Available Variables:</p>
                        <div className="flex flex-wrap gap-1">
                            {EMAIL_TEMPLATE_VARIABLES.map((v) => (
                                <button
                                    key={v}
                                    type="button"
                                    onClick={() => { setCwBody(cwBody + v); showSuccess('Variable inserted'); }}
                                    className="px-2 py-0.5 rounded bg-gray-100 dark:bg-neutral-700 text-xs font-mono text-gray-600 dark:text-neutral-400 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2 items-center">
                        <input
                            type="email"
                            value={cwTestEmail}
                            onChange={(e) => setCwTestEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <Button type="button" variant="ghost" size="sm" onClick={onSendTest}>
                            <Send size={12} className="mr-1" /> Send Test
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 5: Schedule & Send */}
            {step === 5 && (
                <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 dark:text-white">Schedule & Send</h3>
                    <div className="space-y-3">
                        <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${cwScheduleType === 'now' ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-gray-200 dark:border-neutral-700'
                            }`}>
                            <input type="radio" name="schedule" value="now" checked={cwScheduleType === 'now'} onChange={() => setCwScheduleType('now')} className="text-primary-500" />
                            <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">Send Now</span>
                        </label>
                        <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${cwScheduleType === 'later' ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-gray-200 dark:border-neutral-700'
                            }`}>
                            <input type="radio" name="schedule" value="later" checked={cwScheduleType === 'later'} onChange={() => setCwScheduleType('later')} className="text-primary-500" />
                            <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">Schedule for later</span>
                        </label>
                        {cwScheduleType === 'later' && (
                            <input
                                type="datetime-local"
                                value={cwScheduledAt}
                                onChange={(e) => setCwScheduledAt(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        )}
                    </div>

                    {/* Summary */}
                    <div className="bg-gray-50 dark:bg-neutral-700/40 rounded-xl p-4 text-sm space-y-1">
                        <p><span className="text-gray-400">Subject:</span> <span className="text-gray-900 dark:text-white">{cwSubject || '\u2014'}</span></p>
                        <p><span className="text-gray-400">Recipients:</span> <span className="text-gray-900 dark:text-white">{cwRecipientType}</span></p>
                        <p><span className="text-gray-400">Template:</span> <span className="text-gray-900 dark:text-white">{cwTemplate}</span></p>
                        <p><span className="text-gray-400">Schedule:</span> <span className="text-gray-900 dark:text-white">{cwScheduleType === 'now' ? 'Immediately' : cwScheduledAt || '\u2014'}</span></p>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-neutral-700">
                {step > 1 && (
                    <Button variant="ghost" onClick={() => setStep(step - 1)}>
                        <ArrowLeft size={14} className="mr-1" /> Back
                    </Button>
                )}
                <div className="flex-1" />
                {step < 5 ? (
                    <Button
                        variant="primary"
                        onClick={() => setStep(step + 1)}
                        disabled={step === 1 && !cwEventId}
                    >
                        Next
                    </Button>
                ) : (
                    <Button variant="primary" onClick={onSend} isLoading={isSaving}>
                        <Send size={14} className="mr-1.5" />
                        {cwScheduleType === 'now' ? 'Send Campaign' : 'Schedule Campaign'}
                    </Button>
                )}
            </div>
        </div>
    );
}

// =============================================================================
// CAMPAIGN DETAIL SUB-COMPONENT
// =============================================================================

function CampaignDetailContent({ campaign }: { campaign: EmailCampaign }) {
    const stats = campaign.stats;
    const deliveryRate = stats.delivered > 0 ? ((stats.delivered / campaign.recipientCount) * 100).toFixed(1) : '0';
    const openRate = stats.delivered > 0 ? ((stats.opened / stats.delivered) * 100).toFixed(1) : '0';
    const clickRate = stats.delivered > 0 ? ((stats.clicked / stats.delivered) * 100).toFixed(1) : '0';

    const handleResendToNonOpeners = async () => {
        try {
            const { resendToNonOpeners } = await import('@/features/events/services/marketingService');
            await resendToNonOpeners(campaign.id);
            showSuccess('Resent to non-openers!');
        } catch {
            showError('Failed to resend');
        }
    };

    return (
        <div className="space-y-5">
            <div className="text-sm text-gray-500 dark:text-neutral-400">
                <p>Sent: {toDateString(campaign.sentAt)} \u00b7 Recipients: {campaign.recipientCount}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-green-50 dark:bg-green-500/10 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.delivered}</p>
                    <p className="text-xs text-green-700 dark:text-green-300">Delivered ({deliveryRate}%)</p>
                </div>
                <div className="bg-red-50 dark:bg-red-500/10 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.bounced}</p>
                    <p className="text-xs text-red-700 dark:text-red-300">Bounced</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.opened}</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">Opened ({openRate}%)</p>
                </div>
                <div className="bg-violet-50 dark:bg-violet-500/10 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{stats.clicked}</p>
                    <p className="text-xs text-violet-700 dark:text-violet-300">Clicked ({clickRate}%)</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{campaign.recipientCount - stats.delivered}</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">Not Opened</p>
                </div>
                <div className="bg-gray-50 dark:bg-neutral-700/40 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.unsubscribed}</p>
                    <p className="text-xs text-gray-500">Unsubscribed</p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
                <Button variant="ghost" onClick={handleResendToNonOpeners}>
                    <Send size={14} className="mr-1.5" /> Resend to Non-Openers
                </Button>
                <Button variant="ghost">
                    <Download size={14} className="mr-1.5" /> Export Report
                </Button>
            </div>
        </div>
    );
}

// Utility for "Coming Soon" info toast used in social media tab
function showInfoMsg(msg: string) {
    showWarning(msg);
}
