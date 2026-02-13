import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    User,
    Camera,
    Globe,
    Bell,
    Lock,
    Shield,
    Eye,
    EyeOff,
    Smartphone,
    Monitor,
    LogOut,
    Trash2,
    Download,
    Link2,
    AlertTriangle,
    Check,
    Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import { Tabs, TabPanel } from '@/components/common/Tabs';
import Toggle from '@/components/common/Toggle';
import Modal from '@/components/common/Modal';
import { Skeleton, SkeletonCard } from '@/components/common/Skeleton';

// =============================================================================
// TYPES
// =============================================================================

interface ProfileData {
    firstName: string;
    lastName: string;
    email: string;
    emailVerified: boolean;
    phone: string;
    phoneVerified: boolean;
    dob: string;
    gender: string;
    bio: string;
    avatar: string;
}

interface Session {
    id: string;
    device: string;
    browser: string;
    location: string;
    lastActive: string;
    current: boolean;
}

interface ConnectedApp {
    id: string;
    name: string;
    icon: string;
    connectedAt: string;
    permissions: string[];
}

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_PROFILE: ProfileData = {
    firstName: 'Alex',
    lastName: 'Johnson',
    email: 'alex.johnson@example.com',
    emailVerified: true,
    phone: '+1 (555) 123-4567',
    phoneVerified: false,
    dob: '1992-05-15',
    gender: 'Male',
    bio: 'Event enthusiast and tech professional. Love attending music festivals and tech conferences.',
    avatar: '',
};

const MOCK_SESSIONS: Session[] = [
    { id: 's-1', device: 'Desktop', browser: 'Chrome 120', location: 'San Francisco, CA', lastActive: 'Active now', current: true },
    { id: 's-2', device: 'Mobile', browser: 'Safari iOS', location: 'San Francisco, CA', lastActive: '2 hours ago', current: false },
    { id: 's-3', device: 'Tablet', browser: 'Firefox 119', location: 'New York, NY', lastActive: '3 days ago', current: false },
];

const MOCK_CONNECTED_APPS: ConnectedApp[] = [
    { id: 'ca-1', name: 'Google', icon: '🔵', connectedAt: 'Jan 5, 2026', permissions: ['Email', 'Profile'] },
    { id: 'ca-2', name: 'Apple', icon: '🍎', connectedAt: 'Dec 20, 2025', permissions: ['Email'] },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 22 } },
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('personal');
    const [profile, setProfile] = useState(MOCK_PROFILE);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    /* Preferences */
    const [language, setLanguage] = useState('en');
    const [timezone, setTimezone] = useState('America/Los_Angeles');
    const [currency, setCurrency] = useState('USD');
    const [notifications, setNotifications] = useState({
        eventReminders: true,
        promotionalEmails: false,
        bookingConfirmations: true,
        newsletter: false,
        pushNotifications: true,
        smsAlerts: false,
    });

    /* Security */
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [twoFaEnabled, setTwoFaEnabled] = useState(false);

    /* Privacy */
    const [profileVisible, setProfileVisible] = useState(true);
    const [showEmailToOrgs, setShowEmailToOrgs] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setLoading(false), 600);
        return () => clearTimeout(t);
    }, []);

    const tabs = [
        { id: 'personal', label: 'Personal', icon: <User size={15} /> },
        { id: 'preferences', label: 'Preferences', icon: <Bell size={15} /> },
        { id: 'security', label: 'Security', icon: <Lock size={15} /> },
        { id: 'privacy', label: 'Privacy', icon: <Shield size={15} /> },
    ];

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" rounded="lg" />
                <Skeleton className="h-10 w-full max-w-md" rounded="lg" />
                <SkeletonCard className="h-96" />
            </div>
        );
    }

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* ── Header ── */}
            <motion.div variants={itemVariants}>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
                <p className="text-gray-500 dark:text-neutral-400 mt-1">Manage your account preferences and security</p>
            </motion.div>

            {/* ── Tabs ── */}
            <motion.div variants={itemVariants}>
                <Tabs items={tabs} activeTab={activeTab} onChange={setActiveTab} variant="underline" />
            </motion.div>

            {/* ══════════════════════════════════════════════════════════ */}
            {/* TAB 1: Personal Information */}
            {/* ══════════════════════════════════════════════════════════ */}
            <TabPanel id="personal" activeTab={activeTab}>
                <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6 space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-3xl font-bold text-primary-600 dark:text-primary-400 overflow-hidden">
                                {profile.avatar
                                    ? <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    : `${profile.firstName[0]}${profile.lastName[0]}`
                                }
                            </div>
                            <button
                                className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors"
                                aria-label="Upload photo"
                            >
                                <Camera size={14} />
                            </button>
                        </div>
                        <div>
                            <p className="font-bold text-lg text-gray-900 dark:text-white">{profile.firstName} {profile.lastName}</p>
                            <p className="text-sm text-gray-500 dark:text-neutral-400">{profile.email}</p>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="First Name" value={profile.firstName} onChange={(v) => setProfile({ ...profile, firstName: v })} />
                        <Field label="Last Name" value={profile.lastName} onChange={(v) => setProfile({ ...profile, lastName: v })} />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Email</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="email"
                                    value={profile.email}
                                    disabled
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-700 text-gray-500 dark:text-neutral-400 text-sm cursor-not-allowed"
                                />
                                {profile.emailVerified && (
                                    <Badge variant="success"><Check size={10} className="mr-1" /> Verified</Badge>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Phone</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="tel"
                                    value={profile.phone}
                                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                {!profile.phoneVerified && (
                                    <Button variant="ghost" size="sm">Verify</Button>
                                )}
                            </div>
                        </div>
                        <Field label="Date of Birth" value={profile.dob} onChange={(v) => setProfile({ ...profile, dob: v })} type="date" />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Gender</label>
                            <select
                                value={profile.gender}
                                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option>Male</option>
                                <option>Female</option>
                                <option>Non-binary</option>
                                <option>Prefer not to say</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Bio</label>
                        <textarea
                            rows={3}
                            value={profile.bio}
                            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button variant="primary"><Save size={15} className="mr-1.5" /> Save Changes</Button>
                    </div>
                </motion.div>
            </TabPanel>

            {/* ══════════════════════════════════════════════════════════ */}
            {/* TAB 2: Preferences */}
            {/* ══════════════════════════════════════════════════════════ */}
            <TabPanel id="preferences" activeTab={activeTab}>
                <motion.div variants={itemVariants} className="space-y-6">
                    {/* Regional */}
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2"><Globe size={16} /> Regional Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Language</label>
                                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    <option value="en">English</option>
                                    <option value="es">Español</option>
                                    <option value="fr">Français</option>
                                    <option value="de">Deutsch</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Timezone</label>
                                <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                                    <option value="America/New_York">Eastern Time (ET)</option>
                                    <option value="Europe/London">GMT</option>
                                    <option value="Asia/Kolkata">IST</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Currency</label>
                                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="INR">INR (₹)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2"><Bell size={16} /> Notifications</h3>
                        <div className="space-y-4">
                            <Toggle label="Event Reminders" description="Get notified before your booked events" checked={notifications.eventReminders} onChange={(v) => setNotifications({ ...notifications, eventReminders: v })} />
                            <Toggle label="Booking Confirmations" description="Receive confirmation when a booking is made" checked={notifications.bookingConfirmations} onChange={(v) => setNotifications({ ...notifications, bookingConfirmations: v })} />
                            <Toggle label="Push Notifications" description="Browser and mobile push notifications" checked={notifications.pushNotifications} onChange={(v) => setNotifications({ ...notifications, pushNotifications: v })} />
                            <Toggle label="Promotional Emails" description="Marketing and promotional content" checked={notifications.promotionalEmails} onChange={(v) => setNotifications({ ...notifications, promotionalEmails: v })} />
                            <Toggle label="Newsletter" description="Weekly digest of trending events" checked={notifications.newsletter} onChange={(v) => setNotifications({ ...notifications, newsletter: v })} />
                            <Toggle label="SMS Alerts" description="Receive text message notifications" checked={notifications.smsAlerts} onChange={(v) => setNotifications({ ...notifications, smsAlerts: v })} />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button variant="primary"><Save size={15} className="mr-1.5" /> Save Preferences</Button>
                    </div>
                </motion.div>
            </TabPanel>

            {/* ══════════════════════════════════════════════════════════ */}
            {/* TAB 3: Security */}
            {/* ══════════════════════════════════════════════════════════ */}
            <TabPanel id="security" activeTab={activeTab}>
                <motion.div variants={itemVariants} className="space-y-6">
                    {/* Change Password */}
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2"><Lock size={16} /> Change Password</h3>
                        <div className="max-w-md space-y-4">
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Current Password</label>
                                <input
                                    type={showCurrentPw ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                <button onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600" aria-label="Toggle password visibility">
                                    {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">New Password</label>
                                <input
                                    type={showNewPw ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                <button onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600" aria-label="Toggle password visibility">
                                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Confirm New Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <Button variant="primary"><Lock size={14} className="mr-1.5" /> Update Password</Button>
                        </div>
                    </div>

                    {/* Two-Factor Auth */}
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2"><Shield size={16} /> Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-500 dark:text-neutral-400 mb-4">Add an extra layer of security to your account.</p>
                        <Toggle
                            label={twoFaEnabled ? 'Two-Factor Auth is Enabled' : 'Enable Two-Factor Auth'}
                            description={twoFaEnabled ? 'Your account has an extra layer of security' : 'Use an authenticator app for additional security'}
                            checked={twoFaEnabled}
                            onChange={setTwoFaEnabled}
                        />
                    </div>

                    {/* Active Sessions */}
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Monitor size={16} /> Active Sessions</h3>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                                <LogOut size={14} className="mr-1.5" /> Sign Out Others
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {MOCK_SESSIONS.map((session) => (
                                <div key={session.id} className={cn(
                                    'flex items-center justify-between p-3 rounded-xl border',
                                    session.current ? 'border-primary-200 dark:border-primary-500/30 bg-primary-50/50 dark:bg-primary-500/5' : 'border-gray-100 dark:border-neutral-700'
                                )}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-neutral-700 flex items-center justify-center text-gray-500 dark:text-neutral-400">
                                            {session.device === 'Mobile' ? <Smartphone size={18} /> : session.device === 'Tablet' ? <Smartphone size={18} /> : <Monitor size={18} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {session.device} • {session.browser}
                                                {session.current && <Badge variant="success" className="ml-2">This device</Badge>}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-neutral-400">{session.location} • {session.lastActive}</p>
                                        </div>
                                    </div>
                                    {!session.current && (
                                        <button className="text-xs text-red-500 hover:underline font-medium" aria-label="Revoke session">
                                            Revoke
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-red-50 dark:bg-red-500/5 rounded-2xl border border-red-200 dark:border-red-500/20 p-6">
                        <h3 className="font-bold text-red-700 dark:text-red-400 mb-1 flex items-center gap-2"><AlertTriangle size={16} /> Danger Zone</h3>
                        <p className="text-sm text-red-600/80 dark:text-red-400/70 mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setDeleteModalOpen(true)}
                        >
                            <Trash2 size={14} className="mr-1.5" /> Delete Account
                        </Button>
                    </div>
                </motion.div>
            </TabPanel>

            {/* ══════════════════════════════════════════════════════════ */}
            {/* TAB 4: Privacy */}
            {/* ══════════════════════════════════════════════════════════ */}
            <TabPanel id="privacy" activeTab={activeTab}>
                <motion.div variants={itemVariants} className="space-y-6">
                    {/* Visibility */}
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6 space-y-4">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Eye size={16} /> Profile Visibility</h3>
                        <Toggle label="Public Profile" description="Allow other users to see your profile and activity" checked={profileVisible} onChange={setProfileVisible} />
                        <Toggle label="Show Email to Organizers" description="Let event organizers see your email address" checked={showEmailToOrgs} onChange={setShowEmailToOrgs} />
                    </div>

                    {/* Data Download */}
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2"><Download size={16} /> Your Data</h3>
                        <p className="text-sm text-gray-500 dark:text-neutral-400 mb-4">Download a copy of your personal data in compliance with GDPR.</p>
                        <Button variant="ghost"><Download size={14} className="mr-1.5" /> Download My Data</Button>
                    </div>

                    {/* Connected Apps */}
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2"><Link2 size={16} /> Connected Apps</h3>
                        {MOCK_CONNECTED_APPS.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-neutral-400">No connected apps.</p>
                        ) : (
                            <div className="space-y-3">
                                {MOCK_CONNECTED_APPS.map((app) => (
                                    <div key={app.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-neutral-700">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{app.icon}</span>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{app.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-neutral-400">
                                                    Connected {app.connectedAt} • Permissions: {app.permissions.join(', ')}
                                                </p>
                                            </div>
                                        </div>
                                        <button className="text-xs text-red-500 hover:underline font-medium">Revoke</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </TabPanel>

            {/* ── Delete Account Modal ── */}
            <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Account" size="md">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 rounded-xl">
                        <AlertTriangle className="text-red-500 flex-shrink-0" size={24} />
                        <p className="text-sm text-red-700 dark:text-red-400">This will permanently delete your account, bookings, favorites, and all associated data. This action cannot be undone.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">
                            Type <span className="font-mono font-bold">DELETE</span> to confirm
                        </label>
                        <input
                            type="text"
                            placeholder="DELETE"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button variant="danger" className="flex-1"><Trash2 size={14} className="mr-1.5" /> Delete Account</Button>
                        <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
                    </div>
                </div>
            </Modal>
        </motion.div>
    );
}

// =============================================================================
// HELPER
// =============================================================================

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
        </div>
    );
}
