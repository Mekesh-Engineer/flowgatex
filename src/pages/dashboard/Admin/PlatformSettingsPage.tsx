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
} from 'lucide-react';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import { Tabs, TabPanel } from '@/components/common/Tabs';
import Toggle from '@/components/common/Toggle';
import { Skeleton, SkeletonCard } from '@/components/common/Skeleton';

// =============================================================================
// HELPERS
// =============================================================================
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 22 } } };

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-gray-100 dark:border-neutral-700 last:border-0">
            <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
            </div>
            <div className="flex-shrink-0">{children}</div>
        </div>
    );
}

function TextInput({ defaultValue, placeholder, type = 'text', masked }: { defaultValue?: string; placeholder?: string; type?: string; masked?: boolean }) {
    const [show, setShow] = useState(!masked);
    return (
        <div className="relative">
            <input
                type={masked && !show ? 'password' : type}
                defaultValue={defaultValue}
                placeholder={placeholder}
                className="w-full sm:w-64 px-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {masked && (
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors">
                    {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
            )}
        </div>
    );
}

function SelectInput({ options, defaultValue }: { options: string[]; defaultValue?: string }) {
    return (
        <select defaultValue={defaultValue} className="w-full sm:w-64 px-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
    );
}

// =============================================================================
// COMPONENT
// =============================================================================
export default function PlatformSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('general');

    // Feature flag states
    const [features, setFeatures] = useState({
        registration: true,
        eventCreation: true,
        iot: true,
        chatbot: false,
        socialLogin: true,
        analytics: true,
        referral: false,
    });

    // Security settings
    const [security, setSecurity] = useState({ enforce2FA: false, });

    useEffect(() => { const t = setTimeout(() => setLoading(false), 600); return () => clearTimeout(t); }, []);

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
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Platform Settings</h1>
                    <p className="text-gray-500 dark:text-neutral-400 mt-1">Configure platform-wide settings and preferences</p>
                </div>
                <Button variant="primary"><Save size={14} className="mr-1.5" /> Save All Changes</Button>
            </motion.div>

            {/* ── Tabs ── */}
            <motion.div variants={itemVariants}>
                <Tabs items={tabs} activeTab={activeTab} onChange={setActiveTab} variant="underline" />
            </motion.div>

            {/* ═══ General Settings ═══ */}
            <TabPanel id="general" activeTab={activeTab}>
                <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                    <SettingRow label="Platform Name" description="The display name of the platform"><TextInput defaultValue="FlowGateX" /></SettingRow>
                    <SettingRow label="Logo" description="Upload platform logo (SVG or PNG)">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-gray-300 dark:border-neutral-600 text-sm text-gray-500 dark:text-neutral-400 hover:border-primary-500 transition-colors"><Upload size={14} /> Upload Logo</button>
                    </SettingRow>
                    <SettingRow label="Favicon" description="Browser tab icon (ICO or PNG)">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-gray-300 dark:border-neutral-600 text-sm text-gray-500 dark:text-neutral-400 hover:border-primary-500 transition-colors"><Upload size={14} /> Upload Favicon</button>
                    </SettingRow>
                    <SettingRow label="Contact Email"><TextInput defaultValue="contact@flowgatex.com" type="email" /></SettingRow>
                    <SettingRow label="Support Email"><TextInput defaultValue="support@flowgatex.com" type="email" /></SettingRow>
                    <SettingRow label="Default Timezone"><SelectInput options={['UTC', 'US/Eastern', 'US/Pacific', 'Europe/London', 'Asia/Kolkata', 'Asia/Tokyo']} defaultValue="UTC" /></SettingRow>
                    <SettingRow label="Default Currency"><SelectInput options={['USD', 'EUR', 'GBP', 'INR', 'JPY']} defaultValue="USD" /></SettingRow>
                </motion.div>
            </TabPanel>

            {/* ═══ Payment Settings ═══ */}
            <TabPanel id="payment" activeTab={activeTab}>
                <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                    <SettingRow label="Razorpay" description="Payment gateway integration">
                        <div className="flex items-center gap-2">
                            <Badge variant="success">Active</Badge>
                            <Toggle checked={true} onChange={() => { }} />
                        </div>
                    </SettingRow>
                    <SettingRow label="Razorpay Key ID" description="Public API key"><TextInput defaultValue="rzp_live_•••••••••••" masked /></SettingRow>
                    <SettingRow label="Razorpay Key Secret" description="Secret API key"><TextInput defaultValue="•••••••••••••••••••" masked /></SettingRow>
                    <SettingRow label="Cashfree" description="Alternate payment gateway">
                        <div className="flex items-center gap-2">
                            <Badge variant="default">Inactive</Badge>
                            <Toggle checked={false} onChange={() => { }} />
                        </div>
                    </SettingRow>
                    <SettingRow label="Platform Fee" description="Percentage charged on each transaction"><TextInput defaultValue="5" type="number" /></SettingRow>
                    <SettingRow label="Tax Settings (GST/VAT)" description="Tax percentage applied"><TextInput defaultValue="18" type="number" /></SettingRow>
                    <SettingRow label="Payout Schedule" description="Days after event for payout (T+N)"><SelectInput options={['T+1', 'T+3', 'T+5', 'T+7', 'T+14']} defaultValue="T+7" /></SettingRow>
                </motion.div>
            </TabPanel>

            {/* ═══ Email Settings ═══ */}
            <TabPanel id="email" activeTab={activeTab}>
                <motion.div variants={itemVariants} className="space-y-6">
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4">SMTP Configuration</h3>
                        <SettingRow label="SMTP Host"><TextInput defaultValue="smtp.sendgrid.net" /></SettingRow>
                        <SettingRow label="SMTP Port"><TextInput defaultValue="587" type="number" /></SettingRow>
                        <SettingRow label="SMTP Username"><TextInput defaultValue="apikey" /></SettingRow>
                        <SettingRow label="SMTP Password"><TextInput defaultValue="SG.•••••••••••" masked /></SettingRow>
                        <SettingRow label="From Email"><TextInput defaultValue="noreply@flowgatex.com" type="email" /></SettingRow>
                        <div className="pt-4">
                            <Button variant="ghost"><Send size={14} className="mr-1.5" /> Send Test Email</Button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Email Templates</h3>
                        <div className="space-y-3">
                            {['Booking Confirmation', 'Ticket Delivery', 'Password Reset', 'Event Reminder', 'Marketing Email'].map(t => (
                                <div key={t} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-neutral-700 last:border-0">
                                    <span className="text-sm text-gray-700 dark:text-neutral-300">{t}</span>
                                    <Button variant="ghost" size="sm">Edit Template</Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </TabPanel>

            {/* ═══ Feature Flags ═══ */}
            <TabPanel id="features" activeTab={activeTab}>
                <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                    <SettingRow label="User Registration" description="Allow new users to register">
                        <Toggle checked={features.registration} onChange={(v) => setFeatures(prev => ({ ...prev, registration: v }))} />
                    </SettingRow>
                    <SettingRow label="Event Creation" description="Open to all organizers or approval required">
                        <SelectInput options={['Open', 'Approval Required']} defaultValue="Open" />
                    </SettingRow>
                    <SettingRow label="IoT Integration" description="Enable IoT device management features">
                        <Toggle checked={features.iot} onChange={(v) => setFeatures(prev => ({ ...prev, iot: v }))} />
                    </SettingRow>
                    <SettingRow label="AI Chatbot" description="Enable AI support assistant">
                        <Toggle checked={features.chatbot} onChange={(v) => setFeatures(prev => ({ ...prev, chatbot: v }))} />
                    </SettingRow>
                    <SettingRow label="Social Login" description="Google, Facebook, GitHub sign-in">
                        <Toggle checked={features.socialLogin} onChange={(v) => setFeatures(prev => ({ ...prev, socialLogin: v }))} />
                    </SettingRow>
                    <SettingRow label="Analytics Dashboard" description="Show analytics to organizers">
                        <Toggle checked={features.analytics} onChange={(v) => setFeatures(prev => ({ ...prev, analytics: v }))} />
                    </SettingRow>
                    <SettingRow label="Referral Program" description="Enable referral tracking and rewards">
                        <Toggle checked={features.referral} onChange={(v) => setFeatures(prev => ({ ...prev, referral: v }))} />
                    </SettingRow>
                </motion.div>
            </TabPanel>

            {/* ═══ SEO & Meta ═══ */}
            <TabPanel id="seo" activeTab={activeTab}>
                <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                    <SettingRow label="Default Meta Title"><TextInput defaultValue="FlowGateX — Smart Event Management" /></SettingRow>
                    <SettingRow label="Default Meta Description"><TextInput defaultValue="Discover and manage events with AI-powered tools, IoT check-in, and real-time analytics." /></SettingRow>
                    <SettingRow label="Social Share Image" description="1200×630 recommended">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-gray-300 dark:border-neutral-600 text-sm text-gray-500 dark:text-neutral-400 hover:border-primary-500 transition-colors"><Upload size={14} /> Upload</button>
                    </SettingRow>
                    <SettingRow label="Google Analytics ID"><TextInput defaultValue="G-XXXXXXXXXX" /></SettingRow>
                    <SettingRow label="Facebook Pixel ID"><TextInput defaultValue="" placeholder="Enter Pixel ID" /></SettingRow>
                </motion.div>
            </TabPanel>

            {/* ═══ Security ═══ */}
            <TabPanel id="security" activeTab={activeTab}>
                <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                    <SettingRow label="Enforce 2FA for Admins" description="Require two-factor authentication for all admin accounts">
                        <Toggle checked={security.enforce2FA} onChange={(v) => setSecurity(prev => ({ ...prev, enforce2FA: v }))} />
                    </SettingRow>
                    <SettingRow label="Session Timeout" description="Auto-logout after inactivity"><SelectInput options={['15 minutes', '30 minutes', '1 hour', '2 hours', '4 hours']} defaultValue="1 hour" /></SettingRow>
                    <SettingRow label="Minimum Password Length"><TextInput defaultValue="8" type="number" /></SettingRow>
                    <SettingRow label="Password Complexity" description="Require uppercase, lowercase, number, and special character">
                        <Toggle checked={true} onChange={() => { }} />
                    </SettingRow>
                    <SettingRow label="Rate Limiting" description="Max requests per minute per IP"><TextInput defaultValue="100" type="number" /></SettingRow>
                    <SettingRow label="CORS Allowed Origins" description="Comma-separated list of allowed domains"><TextInput defaultValue="https://flowgatex.com, https://admin.flowgatex.com" /></SettingRow>
                </motion.div>
            </TabPanel>
        </motion.div>
    );
}
