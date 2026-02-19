import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Settings,
    CreditCard,
    Mail,
    Flag,
    Globe,
    Shield,
    Save,
    Upload,
    Eye,
    EyeOff,
    Send,
    Loader2
} from 'lucide-react';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import { Tabs, TabPanel } from '@/components/common/Tabs';
import Toggle from '@/components/common/Toggle';
import { Skeleton, SkeletonCard } from '@/components/common/Skeleton';
import { subscribePlatformSettings, savePlatformSettings } from '@/services/settingsService';
import { PlatformSettings, DEFAULT_PLATFORM_SETTINGS } from '@/types/rbac.types';
import { showError, showSuccess } from '@/components/common/Toast';

// =============================================================================
// HELPERS
// =============================================================================
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 22 } } };

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-[var(--border-default)] last:border-0">
            <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
                {description && <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>}
            </div>
            <div className="flex-shrink-0">{children}</div>
        </div>
    );
}

function TextInput({
    value,
    onChange,
    placeholder,
    type = 'text',
    masked
}: {
    value: string | number;
    onChange: (val: string) => void;
    placeholder?: string;
    type?: string;
    masked?: boolean
}) {
    const [show, setShow] = useState(!masked);
    return (
        <div className="relative">
            <input
                type={masked && !show ? 'password' : type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full sm:w-64 px-4 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
            />
            {masked && (
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                    {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
            )}
        </div>
    );
}

function SelectInput({
    options,
    value,
    onChange,
    ariaLabel
}: {
    options: string[];
    value: string;
    onChange: (val: string) => void;
    ariaLabel?: string;
}) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full sm:w-64 px-4 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
            aria-label={ariaLabel || "Select option"}
        >
            {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
    );
}

// =============================================================================
// COMPONENT
// =============================================================================
export default function PlatformSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);

    useEffect(() => {
        const unsubscribe = subscribePlatformSettings((data) => {
            setSettings(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSave = async () => {
        setProcessing(true);
        try {
            await savePlatformSettings(settings);
            showSuccess("Platform settings saved successfully");
        } catch (error) {
            console.error(error);
            showError("Failed to save settings");
        } finally {
            setProcessing(false);
        }
    };

    // Helper to update specific nested fields
    const updateSetting = (key: keyof PlatformSettings, value: PlatformSettings[keyof PlatformSettings]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const updateNestedSetting = (parent: keyof PlatformSettings, key: string, value: unknown) => {
        setSettings(prev => ({
            ...prev,
            [parent]: {
                ...(prev[parent] as unknown as Record<string, unknown>),
                [key]: value
            }
        }));
    };

    const tabs = [
        { id: 'general', label: 'General', icon: <Settings size={15} /> },
        { id: 'payment', label: 'Payment', icon: <CreditCard size={15} /> },
        { id: 'email', label: 'Email', icon: <Mail size={15} /> },
        { id: 'features', label: 'Feature Flags', icon: <Flag size={15} /> },
        { id: 'seo', label: 'SEO & Meta', icon: <Globe size={15} /> },
        { id: 'security', label: 'Security', icon: <Shield size={15} /> },
    ];

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-56" rounded="lg" />
                <Skeleton className="h-10 w-full max-w-md" rounded="lg" />
                <SkeletonCard className="h-96" />
            </div>
        );
    }

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* ── Header ── */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Platform Settings</h1>
                    <p className="text-[var(--text-secondary)] mt-1">Configure platform-wide settings and preferences</p>
                </div>
                <Button variant="primary" onClick={handleSave} disabled={processing}>
                    {processing ? <Loader2 className="animate-spin mr-2" /> : <Save size={14} className="mr-1.5" />}
                    Save All Changes
                </Button>
            </motion.div>

            {/* ── Tabs ── */}
            <motion.div variants={itemVariants}>
                <Tabs items={tabs} activeTab={activeTab} onChange={setActiveTab} variant="underline" />
            </motion.div>

            {/* ═══ General Settings ═══ */}
            <TabPanel id="general" activeTab={activeTab}>
                <motion.div variants={itemVariants} className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-6">
                    <SettingRow label="Platform Name" description="The display name of the platform">
                        <TextInput value={settings.platformName} onChange={(v) => updateSetting('platformName', v)} />
                    </SettingRow>
                    <SettingRow label="Logo" description="Upload platform logo (SVG or PNG)">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-[var(--border-default)] text-sm text-[var(--text-muted)] hover:border-[var(--color-primary)] transition-colors"><Upload size={14} /> Upload Logo</button>
                    </SettingRow>
                    <SettingRow label="Favicon" description="Browser tab icon (ICO or PNG)">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-[var(--border-default)] text-sm text-[var(--text-muted)] hover:border-[var(--color-primary)] transition-colors"><Upload size={14} /> Upload Favicon</button>
                    </SettingRow>
                    <SettingRow label="Contact Email">
                        <TextInput value={settings.contactEmail} onChange={(v) => updateSetting('contactEmail', v)} type="email" />
                    </SettingRow>
                    <SettingRow label="Support Email">
                        <TextInput value={settings.supportEmail} onChange={(v) => updateSetting('supportEmail', v)} type="email" />
                    </SettingRow>
                    <SettingRow label="Default Timezone">
                        <SelectInput options={['UTC', 'US/Eastern', 'US/Pacific', 'Europe/London', 'Asia/Kolkata', 'Asia/Tokyo']} value={settings.defaultTimezone} onChange={(v) => updateSetting('defaultTimezone', v)} />
                    </SettingRow>
                    <SettingRow label="Default Currency">
                        <SelectInput options={['USD', 'EUR', 'GBP', 'INR', 'JPY']} value={settings.defaultCurrency} onChange={(v) => updateSetting('defaultCurrency', v)} />
                    </SettingRow>
                </motion.div>
            </TabPanel>

            {/* ═══ Payment Settings ═══ */}
            <TabPanel id="payment" activeTab={activeTab}>
                <motion.div variants={itemVariants} className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-6">
                    <SettingRow label="Razorpay" description="Payment gateway integration">
                        <div className="flex items-center gap-2">
                            <Badge variant={settings.paymentConfig.gateways.razorpay ? "success" : "default"}>{settings.paymentConfig.gateways.razorpay ? "Active" : "Inactive"}</Badge>
                            <Toggle checked={settings.paymentConfig.gateways.razorpay} onChange={(v) => updateNestedSetting('paymentConfig', 'gateways', { ...settings.paymentConfig.gateways, razorpay: v })} />
                        </div>
                    </SettingRow>
                    <SettingRow label="Razorpay Key ID" description="Public API key">
                        <TextInput value="rzp_live_••••••" onChange={() => { }} masked placeholder="Key ID stored securely" />
                    </SettingRow>
                    <SettingRow label="Razorpay Key Secret" description="Secret API key">
                        <TextInput value="••••••••••••" onChange={() => { }} masked placeholder="Key Secret stored securely" />
                    </SettingRow>
                    <SettingRow label="Platform Fee" description="Percentage charged on each transaction">
                        <TextInput value={settings.paymentConfig.platformFee} onChange={(v) => updateNestedSetting('paymentConfig', 'platformFee', parseFloat(v))} type="number" />
                    </SettingRow>
                    <SettingRow label="Tax Settings (GST/VAT)" description="Tax percentage applied">
                        <TextInput value={settings.paymentConfig.taxPercentage} onChange={(v) => updateNestedSetting('paymentConfig', 'taxPercentage', parseFloat(v))} type="number" />
                    </SettingRow>
                    <SettingRow label="Payout Schedule" description="Days after event for payout (T+N)">
                        <TextInput value={settings.paymentConfig.payoutScheduleDays} onChange={(v) => updateNestedSetting('paymentConfig', 'payoutScheduleDays', parseInt(v))} type="number" />
                    </SettingRow>
                </motion.div>
            </TabPanel>

            {/* ═══ Email Settings ═══ */}
            <TabPanel id="email" activeTab={activeTab}>
                <motion.div variants={itemVariants} className="space-y-6">
                    <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-6">
                        <h3 className="font-bold text-[var(--text-primary)] mb-4">SMTP Configuration</h3>
                        <SettingRow label="SMTP Host">
                            <TextInput value={settings.emailConfig.smtpHost} onChange={(v) => updateNestedSetting('emailConfig', 'smtpHost', v)} />
                        </SettingRow>
                        <SettingRow label="SMTP Port">
                            <TextInput value={settings.emailConfig.smtpPort} onChange={(v) => updateNestedSetting('emailConfig', 'smtpPort', parseInt(v))} type="number" />
                        </SettingRow>
                        <SettingRow label="SMTP Username">
                            <TextInput value={settings.emailConfig.smtpUser} onChange={(v) => updateNestedSetting('emailConfig', 'smtpUser', v)} />
                        </SettingRow>
                        <SettingRow label="SMTP Password">
                            <TextInput value={settings.emailConfig.smtpPassword} onChange={(v) => updateNestedSetting('emailConfig', 'smtpPassword', v)} masked />
                        </SettingRow>
                        <SettingRow label="From Email">
                            <TextInput value={settings.emailConfig.smtpFrom} onChange={(v) => updateNestedSetting('emailConfig', 'smtpFrom', v)} type="email" />
                        </SettingRow>
                        <div className="pt-4">
                            <Button variant="ghost"><Send size={14} className="mr-1.5" /> Send Test Email</Button>
                        </div>
                    </div>
                </motion.div>
            </TabPanel>

            {/* ═══ Feature Flags ═══ */}
            <TabPanel id="features" activeTab={activeTab}>
                <motion.div variants={itemVariants} className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-6">
                    <SettingRow label="User Registration" description="Allow new users to register">
                        <Toggle checked={settings.featureFlags.userRegistration} onChange={(v) => updateNestedSetting('featureFlags', 'userRegistration', v)} />
                    </SettingRow>
                    <SettingRow label="Event Creation" description="Allow users to create events">
                        <Toggle checked={settings.featureFlags.eventCreation} onChange={(v) => updateNestedSetting('featureFlags', 'eventCreation', v)} />
                    </SettingRow>
                    <SettingRow label="IoT Integration" description="Enable IoT features">
                        <Toggle checked={settings.featureFlags.iotIntegration} onChange={(v) => updateNestedSetting('featureFlags', 'iotIntegration', v)} />
                    </SettingRow>
                    <SettingRow label="AI Chatbot" description="Enable AI support bot">
                        <Toggle checked={settings.featureFlags.aiChatbot} onChange={(v) => updateNestedSetting('featureFlags', 'aiChatbot', v)} />
                    </SettingRow>
                    <SettingRow label="Social Login" description="Enable Google/Facebook login">
                        <Toggle checked={settings.featureFlags.socialLogin} onChange={(v) => updateNestedSetting('featureFlags', 'socialLogin', v)} />
                    </SettingRow>
                    <SettingRow label="Analytics" description="Enable platform analytics">
                        <Toggle checked={settings.featureFlags.analytics} onChange={(v) => updateNestedSetting('featureFlags', 'analytics', v)} />
                    </SettingRow>
                </motion.div>
            </TabPanel>

            {/* ═══ SEO Settings ═══ */}
            <TabPanel id="seo" activeTab={activeTab}>
                <motion.div variants={itemVariants} className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-6">
                    <SettingRow label="Meta Title" description="Default page title">
                        <TextInput value={settings.seoConfig.metaTitle} onChange={(v) => updateNestedSetting('seoConfig', 'metaTitle', v)} />
                    </SettingRow>
                    <SettingRow label="Meta Description" description="Default meta description">
                        <TextInput value={settings.seoConfig.metaDescription} onChange={(v) => updateNestedSetting('seoConfig', 'metaDescription', v)} />
                    </SettingRow>
                    <SettingRow label="Google Analytics ID" description="Tracking ID (G-XXXXXXXX)">
                        <TextInput value={settings.seoConfig.googleAnalyticsId} onChange={(v) => updateNestedSetting('seoConfig', 'googleAnalyticsId', v)} />
                    </SettingRow>
                    <SettingRow label="Facebook Pixel ID" description="Tracking ID">
                        <TextInput value={settings.seoConfig.facebookPixelId} onChange={(v) => updateNestedSetting('seoConfig', 'facebookPixelId', v)} />
                    </SettingRow>
                </motion.div>
            </TabPanel>

            {/* ═══ Security Settings ═══ */}
            <TabPanel id="security" activeTab={activeTab}>
                <motion.div variants={itemVariants} className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-6">
                    <SettingRow label="Enforce 2FA" description="Require 2FA for all admin accounts">
                        <Toggle checked={settings.securityPolicies.enforce2FA} onChange={(v) => updateNestedSetting('securityPolicies', 'enforce2FA', v)} />
                    </SettingRow>
                    <SettingRow label="Session Timeout (mins)" description="Auto-logout after inactivity">
                        <TextInput value={settings.securityPolicies.sessionTimeout} onChange={(v) => updateNestedSetting('securityPolicies', 'sessionTimeout', parseInt(v))} type="number" />
                    </SettingRow>
                    <SettingRow label="Password Minimum Length" description="Characters required">
                        <TextInput value={settings.securityPolicies.passwordMinLength} onChange={(v) => updateNestedSetting('securityPolicies', 'passwordMinLength', parseInt(v))} type="number" />
                    </SettingRow>
                    <SettingRow label="Require Special Char" description="Password complexity">
                        <Toggle checked={settings.securityPolicies.requireSpecialChar} onChange={(v) => updateNestedSetting('securityPolicies', 'requireSpecialChar', v)} />
                    </SettingRow>
                </motion.div>
            </TabPanel>

        </motion.div>
    );
}
