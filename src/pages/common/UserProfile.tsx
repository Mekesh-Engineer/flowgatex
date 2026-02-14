import { useState, ChangeEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, Shield, Camera, Save, CheckCircle2, Bell, Lock, Globe,
  Moon, Sun, Monitor, Smartphone, Key, Laptop, Download, Eye, EyeOff,
  CreditCard, Settings, Code, TrendingUp, FileText,
  DollarSign, Zap, AlertCircle, Trash2, Check,
  Calendar, Languages,
  Facebook, Chrome, Briefcase,
  Twitter, Linkedin, Instagram, UploadCloud, Layout, Palette, Loader2
} from 'lucide-react';

import { useAuthStore } from '@/store/zustand/stores';
import { useSettingsStore } from '@/store/zustand/settingsStore';
import { useRBAC } from '@/hooks/useRBAC';
import { UserRole } from '@/lib/constants';
import { 
  changePassword, 
  deleteUserAccount,
  uploadFile
} from '@/features/auth/services/authService';
import { savePlatformSettings } from '@/lib/settingsService';
import {
  getUserDocument,
  saveFullUserProfile,
} from '@/lib/userService';
import { logger } from '@/lib/logger';
import Input from '@/components/forms/Input';
import Select from '@/components/forms/Select';
import Button from '@/components/common/Button';
import { cn } from '@/lib/utils';
import Swal from 'sweetalert2';
import type {
  FirestoreUser,
  FirestoreActiveSession,
} from '@/types/rbac.types';

// =============================================================================
// TYPES
// =============================================================================

type UserTabType = 'personal' | 'preferences' | 'security' | 'privacy';
type AdminTabType = 'general' | 'payment' | 'email' | 'features' | 'seo' | 'security-admin';

interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
  eventReminders: boolean;
  eventUpdates: boolean;
  promotionalEmails: boolean;
  bookingConfirmations: boolean;
  newsletter: boolean;
}

interface SmartPreferences {
  favoriteCategories: boolean;
  personalizedRecommendations: boolean;
  autoAddCalendar: boolean;
  autoFollowOrganizers: boolean;
}

interface PrivacySettings {
  profileVisibility: 'public' | 'private';
  showEmailToOrganizers: boolean;
  showPhoneToOrganizers: boolean;
  showAttendedEvents: boolean;
}

interface ConnectedApp {
  id: string;
  name: string;
  icon: React.ReactNode;
  connectedAt: string;
  permissions: string[];
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const getRoleBadgeColor = (role: UserRole) => {
  switch (role) {
    case UserRole.ADMIN:
    case UserRole.SUPER_ADMIN:
      return 'bg-gradient-to-r from-red-500 to-pink-600 text-white';
    case UserRole.ORG_ADMIN:
      return 'bg-gradient-to-r from-amber-500 to-orange-600 text-white';
    case UserRole.ORGANIZER:
      return 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white';
    default:
      return 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white';
  }
};

const timezones = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
];

const currencies = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'AED', label: 'AED - UAE Dirham' },
  { value: 'SGD', label: 'SGD - Singapore Dollar' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
];

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'ar', label: 'العربية' },
  { value: 'hi', label: 'हिन्दी' },
  { value: 'ja', label: '日本語' },
  { value: 'zh', label: '中文' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export default function UserProfile() {
  const { user } = useAuthStore();
  const platformSettings = useSettingsStore((s) => s.platform);
  const platformLoaded = useSettingsStore((s) => s.platformLoaded);
  const { can } = useRBAC();
  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;
  const isOrganizer = user?.role === UserRole.ORGANIZER || user?.role === UserRole.ORG_ADMIN;

  const [activeUserTab, setActiveUserTab] = useState<UserTabType>('personal');
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTabType>('general');
  const [isLoading, setIsLoading] = useState(false);
  const [firestoreLoading, setFirestoreLoading] = useState(true);
  const [_firestoreUser, setFirestoreUser] = useState<FirestoreUser | null>(null);
  const [showAdminSettings, setShowAdminSettings] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Personal
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    displayName: user?.displayName || '',
    email: user?.email || '',
    phone: user?.phoneNumber || '',
    dob: user?.dob || '',
    gender: user?.gender || '',
    bio: '',
    location: '',
    
    // Organizer Specific
    organizationName: '',
    organizerBio: '',
    websiteUrl: '',
    socials: {
      instagram: '',
      linkedin: '',
      twitter: '',
      facebook: ''
    },
    businessRegNumber: '',
    taxId: '',

    verificationStatus: 'pending', // pending, verified, rejected
    verificationDocumentUrl: '',
    branding: {
    brandColor: '#4F46E5',
    logoUrl: '',
    bannerUrl: ''
    },

    // Preferences
    theme: (localStorage.getItem('theme') || 'system') as 'light' | 'dark' | 'system',
    language: 'en',
    timezone: 'Asia/Kolkata',
    currency: 'USD',
    notifications: {
      email: true,
      push: false,
      sms: false,
      inApp: true,
      eventReminders: true,
      eventUpdates: true,
      promotionalEmails: false,
      bookingConfirmations: true,
      newsletter: false,
    } as NotificationSettings,
    smartPreferences: {
      favoriteCategories: true,
      personalizedRecommendations: true,
      autoAddCalendar: false,
      autoFollowOrganizers: true
    } as SmartPreferences,
    
    // Privacy
    privacy: {
      profileVisibility: 'public' as 'public' | 'private',
      showEmailToOrganizers: true,
      showPhoneToOrganizers: false,
      showAttendedEvents: true
    } as PrivacySettings,
    
    // Security
    twoFactor: false,
  });

  // Admin Settings State — initialized from Firestore SettingInfo/platform via Zustand store
  const [adminSettings, setAdminSettings] = useState({
    // General
    platformName: platformSettings.platformName || 'FlowGateX',
    contactEmail: platformSettings.contactEmail || 'contact@flowgatex.com',
    supportEmail: platformSettings.supportEmail || 'support@flowgatex.com',
    defaultTimezone: platformSettings.defaultTimezone || 'UTC',
    defaultCurrency: platformSettings.defaultCurrency || 'USD',
    maintenanceMode: platformSettings.maintenanceMode || false,
    announcementBanner: platformSettings.announcementBanner || '',
    
    // Payment
    razorpayEnabled: platformSettings.paymentConfig?.gateways?.razorpay ?? true,
    cashfreeEnabled: platformSettings.paymentConfig?.gateways?.cashfree ?? false,
    stripeEnabled: platformSettings.paymentConfig?.gateways?.stripe ?? false,
    platformFeePercentage: platformSettings.paymentConfig?.platformFee ?? 2.5,
    taxPercentage: platformSettings.paymentConfig?.taxPercentage ?? 18,
    payoutScheduleDays: platformSettings.paymentConfig?.payoutScheduleDays ?? 7,
    webhookSecret: platformSettings.paymentConfig?.webhookSecret || 'whsec_...',
    
    // Email
    smtpHost: platformSettings.emailConfig?.smtpHost || '',
    smtpPort: platformSettings.emailConfig?.smtpPort ?? 587,
    smtpUser: platformSettings.emailConfig?.smtpUser || '',
    smtpPassword: platformSettings.emailConfig?.smtpPassword || '',
    smtpFrom: platformSettings.emailConfig?.smtpFrom || '',
    
    // Feature Flags
    features: {
      userRegistration: platformSettings.featureFlags?.userRegistration ?? true,
      eventCreation: platformSettings.featureFlags?.eventCreation ?? true,
      iotIntegration: platformSettings.featureFlags?.iotIntegration ?? false,
      aiChatbot: platformSettings.featureFlags?.aiChatbot ?? true,
      socialLogin: platformSettings.featureFlags?.socialLogin ?? true,
      analytics: platformSettings.featureFlags?.analytics ?? true,
      referralProgram: platformSettings.featureFlags?.referralProgram ?? false,
    },
    
    // SEO
    metaTitle: platformSettings.seoConfig?.metaTitle || 'FlowGateX - Event Management Platform',
    metaDescription: platformSettings.seoConfig?.metaDescription || 'Create, manage, and discover amazing events',
    socialShareImage: platformSettings.seoConfig?.socialShareImage || '',
    googleAnalyticsId: platformSettings.seoConfig?.googleAnalyticsId || '',
    facebookPixelId: platformSettings.seoConfig?.facebookPixelId || '',
    
    // Security
    enforce2FA: platformSettings.securityPolicies?.enforce2FA ?? false,
    sessionTimeout: platformSettings.securityPolicies?.sessionTimeout ?? 30,
    minPasswordLength: platformSettings.securityPolicies?.passwordMinLength ?? 8,
    requireSpecialChar: platformSettings.securityPolicies?.requireSpecialChar ?? true,
    maxLoginAttempts: platformSettings.securityPolicies?.maxLoginAttempts ?? 5,
    corsAllowedOrigins: platformSettings.securityPolicies?.corsAllowedOrigins || '*',
  });

  // Sync admin settings when platform settings load/change from Firestore
  useEffect(() => {
    if (platformLoaded && isAdmin) {
      setAdminSettings(prev => ({
        ...prev,
        platformName: platformSettings.platformName || prev.platformName,
        contactEmail: platformSettings.contactEmail || prev.contactEmail,
        supportEmail: platformSettings.supportEmail || prev.supportEmail,
        defaultTimezone: platformSettings.defaultTimezone || prev.defaultTimezone,
        defaultCurrency: platformSettings.defaultCurrency || prev.defaultCurrency,
        maintenanceMode: platformSettings.maintenanceMode ?? prev.maintenanceMode,
        announcementBanner: platformSettings.announcementBanner || prev.announcementBanner,
        razorpayEnabled: platformSettings.paymentConfig?.gateways?.razorpay ?? prev.razorpayEnabled,
        cashfreeEnabled: platformSettings.paymentConfig?.gateways?.cashfree ?? prev.cashfreeEnabled,
        stripeEnabled: platformSettings.paymentConfig?.gateways?.stripe ?? prev.stripeEnabled,
        platformFeePercentage: platformSettings.paymentConfig?.platformFee ?? prev.platformFeePercentage,
        taxPercentage: platformSettings.paymentConfig?.taxPercentage ?? prev.taxPercentage,
        payoutScheduleDays: platformSettings.paymentConfig?.payoutScheduleDays ?? prev.payoutScheduleDays,
        webhookSecret: platformSettings.paymentConfig?.webhookSecret || prev.webhookSecret,
        smtpHost: platformSettings.emailConfig?.smtpHost || prev.smtpHost,
        smtpPort: platformSettings.emailConfig?.smtpPort ?? prev.smtpPort,
        smtpUser: platformSettings.emailConfig?.smtpUser || prev.smtpUser,
        smtpPassword: platformSettings.emailConfig?.smtpPassword || prev.smtpPassword,
        smtpFrom: platformSettings.emailConfig?.smtpFrom || prev.smtpFrom,
        features: {
          userRegistration: platformSettings.featureFlags?.userRegistration ?? prev.features.userRegistration,
          eventCreation: platformSettings.featureFlags?.eventCreation ?? prev.features.eventCreation,
          iotIntegration: platformSettings.featureFlags?.iotIntegration ?? prev.features.iotIntegration,
          aiChatbot: platformSettings.featureFlags?.aiChatbot ?? prev.features.aiChatbot,
          socialLogin: platformSettings.featureFlags?.socialLogin ?? prev.features.socialLogin,
          analytics: platformSettings.featureFlags?.analytics ?? prev.features.analytics,
          referralProgram: platformSettings.featureFlags?.referralProgram ?? prev.features.referralProgram,
        },
        metaTitle: platformSettings.seoConfig?.metaTitle || prev.metaTitle,
        metaDescription: platformSettings.seoConfig?.metaDescription || prev.metaDescription,
        socialShareImage: platformSettings.seoConfig?.socialShareImage || prev.socialShareImage,
        googleAnalyticsId: platformSettings.seoConfig?.googleAnalyticsId || prev.googleAnalyticsId,
        facebookPixelId: platformSettings.seoConfig?.facebookPixelId || prev.facebookPixelId,
        enforce2FA: platformSettings.securityPolicies?.enforce2FA ?? prev.enforce2FA,
        sessionTimeout: platformSettings.securityPolicies?.sessionTimeout ?? prev.sessionTimeout,
        minPasswordLength: platformSettings.securityPolicies?.passwordMinLength ?? prev.minPasswordLength,
        requireSpecialChar: platformSettings.securityPolicies?.requireSpecialChar ?? prev.requireSpecialChar,
        maxLoginAttempts: platformSettings.securityPolicies?.maxLoginAttempts ?? prev.maxLoginAttempts,
        corsAllowedOrigins: platformSettings.securityPolicies?.corsAllowedOrigins || prev.corsAllowedOrigins,
      }));
    }
  }, [platformSettings, platformLoaded, isAdmin]);

  // Active Sessions — loaded from Firestore `users/{uid}.security.activeSessions`
  const [activeSessions, setActiveSessions] = useState<FirestoreActiveSession[]>([]);

  // Connected Apps (static for now — can be made dynamic)
  // Connected Apps (Google only as per requirements)
  const [connectedApps, setConnectedApps] = useState<ConnectedApp[]>([
    {
      id: '1',
      name: 'Google',
      icon: <Chrome size={24} className="text-blue-600" />,
      connectedAt: 'Jan 15, 2026',
      permissions: ['Email', 'Profile'],
    },
  ]);

  // ── Load user data from Firestore on mount & Real-time Sync ────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;

    setFirestoreLoading(true);

    // Helper to map Firestore data to Form State
    const populateFormWithFirestoreData = (fsUser: FirestoreUser) => {
      // Populate form from Firestore nested structure (with fallbacks to legacy flat fields)
      const profile = fsUser.profile || {} as Record<string, unknown>;
      const prefs = fsUser.preferences;
      const privacy = fsUser.privacy;
      const orgInfo = fsUser.organizerInfo;
      const security = fsUser.security;

      setFormData(prev => ({
        ...prev,
        // Personal — prefer structured profile, fallback to legacy flat fields
        firstName: profile.fullName?.split(' ')[0] || fsUser.firstName || user.firstName || '',
        lastName: profile.fullName?.split(' ').slice(1).join(' ') || fsUser.lastName || user.lastName || '',
        displayName: fsUser.displayName || user.displayName || '',
        email: profile.email || fsUser.email || user.email || '',
        phone: profile.phone || fsUser.phoneNumber || user.phoneNumber || '',
        dob: profile.dateOfBirth || fsUser.dob || user.dob || '',
        gender: profile.gender || fsUser.gender || user.gender || '',
        bio: profile.bio || '',
        location: profile.location || '',

        // Organizer
        organizationName: orgInfo?.organizationName || '',
        organizerBio: '',
        websiteUrl: orgInfo?.website || '',
        socials: {
          instagram: orgInfo?.socialLinks?.instagram || '',
          linkedin: orgInfo?.socialLinks?.linkedin || '',
          twitter: orgInfo?.socialLinks?.twitter || '',
          facebook: orgInfo?.socialLinks?.facebook || '',
        },


        verificationDocumentUrl: orgInfo?.verificationDocumentUrl || '',
        branding: {
          brandColor: orgInfo?.branding?.brandColor || '#4F46E5',
          logoUrl: orgInfo?.branding?.logoUrl || '',
          bannerUrl: orgInfo?.branding?.bannerUrl || '',
        },

        // Preferences
        theme: (localStorage.getItem('theme') || 'system') as 'light' | 'dark' | 'system',
        language: prefs?.language || 'en',
        timezone: prefs?.timezone || 'UTC',
        currency: prefs?.currency || 'USD',
        notifications: {
          email: prefs?.notifications?.emailNotifications ?? true,
          push: prefs?.notifications?.pushNotifications ?? false,
          sms: prefs?.notifications?.smsNotifications ?? false,
          inApp: prefs?.notifications?.inApp ?? true,
          eventReminders: prefs?.notifications?.eventReminders ?? true,
          eventUpdates: prefs?.notifications?.eventUpdates ?? true,
          promotionalEmails: prefs?.notifications?.promotionalEmails ?? false,
          bookingConfirmations: prefs?.notifications?.bookingConfirmations ?? true,
          newsletter: prefs?.notifications?.newsletter ?? false,
        },
        smartPreferences: {
          favoriteCategories: prefs?.smartPreferences?.favoriteCategories ?? true,
          personalizedRecommendations: prefs?.smartPreferences?.personalizedRecommendations ?? true,
          autoAddCalendar: prefs?.smartPreferences?.autoAddCalendar ?? false,
          autoFollowOrganizers: prefs?.smartPreferences?.autoFollowOrganizers ?? true,
        },

        // Privacy
        privacy: {
          profileVisibility: privacy?.profileVisibility || 'public',
          showEmailToOrganizers: privacy?.showEmail ?? true,
          showPhoneToOrganizers: privacy?.showPhone ?? false,
          showAttendedEvents: privacy?.showAttendedEvents ?? true,
        },

        // Security
        twoFactor: security?.twoFactorEnabled || false,
      }));

      // Load active sessions from Firestore
      if (security?.activeSessions && security.activeSessions.length > 0) {
        setActiveSessions(security.activeSessions);
      }
    };

    // Initial fetch
    getUserDocument(user.uid)
      .then((fsUser) => {
        if (fsUser) {
          setFirestoreUser(fsUser);
          populateFormWithFirestoreData(fsUser);
          logger.log('✅ User profile loaded from Firestore');
        } else {
          // Fallback — no Firestore doc yet, use Zustand auth data
          setFormData(prev => ({
            ...prev,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            displayName: user.displayName || '',
            email: user.email || '',
            phone: user.phoneNumber || '',
            dob: user.dob || '',
            gender: user.gender || '',
          }));
          logger.warn('No Firestore user document found — using auth state');
        }
      })
      .catch((error) => {
        logger.error('Failed to load initial Firestore user:', error);
      })
      .finally(() => {
        setFirestoreLoading(false);
      });

    // Real-time subscription
    let unsubscribe: (() => void) | undefined;
    
    // Dynamically import subscribe to avoid circular deps if any
    import('../../lib/userService').then(({ subscribeUserDocument }) => {
      // subscribeUserDocument returns the unsubscribe function directly (synchronously)
      // but since we are importing it async, we need to handle it inside the promise
      unsubscribe = subscribeUserDocument(user.uid, (fsUser) => {
          if (fsUser) {
            setFirestoreUser(fsUser);
            // Updating form data on every remote change ensures real-time sync UI
            populateFormWithFirestoreData(fsUser); 
          }
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('socials.')) {
        const socialKey = name.split('.')[1];
        setFormData(prev => ({ ...prev, socials: { ...prev.socials, [socialKey]: value } }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAdminInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAdminSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleToggle = (category: 'notifications' | 'privacy' | 'features' | 'smartPreferences', key: string) => {
    if (category === 'features') {
      setAdminSettings(prev => ({
        ...prev,
        features: {
          ...prev.features,
          [key]: !prev.features[key as keyof typeof prev.features]
        }
      }));
    } else if (category === 'notifications') {
      setFormData(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [key]: !prev.notifications[key as keyof NotificationSettings]
        }
      }));
    } else if (category === 'privacy') {
      setFormData(prev => ({
        ...prev,
        privacy: {
          ...prev.privacy,
          [key]: !prev.privacy[key as keyof PrivacySettings]
        }
      }));
    } else if (category === 'smartPreferences') {
        setFormData(prev => ({
            ...prev,
            smartPreferences: {
                ...prev.smartPreferences,
                [key]: !prev.smartPreferences[key as keyof SmartPreferences]
            }
        }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Permission check — user must have user:update permission
    if (!can('user:update')) {
      Swal.fire({
        title: 'Unauthorized',
        text: 'You do not have permission to update your profile.',
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    // Validation: Prompt user if essential fields are empty
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      Swal.fire({
        title: 'Missing Information',
        text: 'Please fill in First Name, Last Name, and Email to save your profile.',
        icon: 'warning',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      // Apply theme changes immediately
      if (formData.theme) {
        localStorage.setItem('theme', formData.theme);
        const root = document.documentElement;
        root.classList.remove('light', 'dark');

        if (formData.theme === 'dark') {
          root.classList.add('dark');
        } else if (formData.theme === 'light') {
          root.classList.add('light');
        } else {
          if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            root.classList.add('dark');
          }
        }
      }

      // Build the full name for the profile.fullName field
      const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(' ') || formData.displayName;

      // Save to Firestore using structured userService
      await saveFullUserProfile(user!.uid, {
        // Profile — writes to users/{uid}.profile + legacy flat fields
        profile: {
          fullName,
          email: formData.email,
          phone: formData.phone || undefined,
          dateOfBirth: formData.dob || undefined,
          gender: formData.gender || undefined,
          bio: formData.bio || undefined,
          location: formData.location || undefined,
        },
        // Organizer info — only if user is organizer/org_admin
        ...(isOrganizer && {
          organizerInfo: {
            organizationName: formData.organizationName || undefined,
            website: formData.websiteUrl || undefined,
            socialLinks: {
              instagram: formData.socials.instagram || undefined,
              linkedin: formData.socials.linkedin || undefined,
              twitter: formData.socials.twitter || undefined,
              facebook: formData.socials.facebook || undefined,
            },
            verificationStatus: formData.verificationStatus as 'pending' | 'verified' | 'rejected',
            verificationDocumentUrl: formData.verificationDocumentUrl || undefined,
            branding: {
              brandColor: formData.branding.brandColor,
              logoUrl: formData.branding.logoUrl,
              bannerUrl: formData.branding.bannerUrl,
            },
          },
        }),
        // Preferences — writes to users/{uid}.preferences
        preferences: {
          language: formData.language,
          timezone: formData.timezone,
          currency: formData.currency,
          notifications: {
            emailNotifications: formData.notifications.email,
            eventReminders: formData.notifications.eventReminders,
            promotionalEmails: formData.notifications.promotionalEmails,
            pushNotifications: formData.notifications.push,
            smsNotifications: formData.notifications.sms,
            bookingConfirmations: formData.notifications.bookingConfirmations,
            eventUpdates: formData.notifications.eventUpdates,
            newsletter: formData.notifications.newsletter,
            inApp: formData.notifications.inApp,
          },
          smartPreferences: {
            favoriteCategories: formData.smartPreferences.favoriteCategories,
            personalizedRecommendations: formData.smartPreferences.personalizedRecommendations,
            autoAddCalendar: formData.smartPreferences.autoAddCalendar,
            autoFollowOrganizers: formData.smartPreferences.autoFollowOrganizers,
          },
        },
        // Privacy — writes to users/{uid}.privacy
        privacy: {
          profileVisibility: formData.privacy.profileVisibility,
          showEmail: formData.privacy.showEmailToOrganizers,
          showPhone: formData.privacy.showPhoneToOrganizers,
          showAttendedEvents: formData.privacy.showAttendedEvents,
        },
        // Security
        security: {
          twoFactorEnabled: formData.twoFactor,
          activeSessions: activeSessions,
        },
      });

      // No need to reload manually — real-time subscription handles it
      // await loadFirestoreUser();

      setIsLoading(false);
      Swal.fire({
        title: 'Success',
        text: 'Profile updated successfully!',
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (error: unknown) {
      logger.error('Failed to update profile:', error);
      setIsLoading(false);
      const errMsg = error instanceof Error ? error.message : (error as { message?: string })?.message || 'Failed to update profile. Please try again.';
      Swal.fire({
        title: 'Error',
        text: errMsg,
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
      });
    }
  };

  const handleAdminSave = async () => {
    // Permission check — only admin/super_admin can save platform settings
    if (!can('platform:settings')) {
      Swal.fire({
        title: 'Unauthorized',
        text: 'You do not have permission to modify platform settings.',
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      // Map flat admin state back to structured PlatformSettings for SettingInfo/platform
      await savePlatformSettings({
        platformName: adminSettings.platformName,
        contactEmail: adminSettings.contactEmail,
        supportEmail: adminSettings.supportEmail,
        defaultTimezone: adminSettings.defaultTimezone,
        defaultCurrency: adminSettings.defaultCurrency,
        maintenanceMode: adminSettings.maintenanceMode,
        announcementBanner: adminSettings.announcementBanner,
        featureFlags: {
          userRegistration: adminSettings.features.userRegistration,
          eventCreation: adminSettings.features.eventCreation,
          iotIntegration: adminSettings.features.iotIntegration,
          aiChatbot: adminSettings.features.aiChatbot,
          socialLogin: adminSettings.features.socialLogin,
          analytics: adminSettings.features.analytics,
          referralProgram: adminSettings.features.referralProgram,
        },
        paymentConfig: {
          platformFee: adminSettings.platformFeePercentage,
          taxPercentage: adminSettings.taxPercentage,
          payoutScheduleDays: adminSettings.payoutScheduleDays,
          gateways: {
            razorpay: adminSettings.razorpayEnabled,
            stripe: adminSettings.stripeEnabled,
            cashfree: adminSettings.cashfreeEnabled,
          },
          webhookSecret: adminSettings.webhookSecret,
        },
        emailConfig: {
          smtpHost: adminSettings.smtpHost,
          smtpPort: adminSettings.smtpPort,
          smtpUser: adminSettings.smtpUser,
          smtpPassword: adminSettings.smtpPassword,
          smtpFrom: adminSettings.smtpFrom,
        },
        seoConfig: {
          metaTitle: adminSettings.metaTitle,
          metaDescription: adminSettings.metaDescription,
          socialShareImage: adminSettings.socialShareImage,
          googleAnalyticsId: adminSettings.googleAnalyticsId,
          facebookPixelId: adminSettings.facebookPixelId,
        },
        securityPolicies: {
          enforce2FA: adminSettings.enforce2FA,
          sessionTimeout: adminSettings.sessionTimeout,
          passwordMinLength: adminSettings.minPasswordLength,
          requireSpecialChar: adminSettings.requireSpecialChar,
          maxLoginAttempts: adminSettings.maxLoginAttempts,
          corsAllowedOrigins: adminSettings.corsAllowedOrigins,
        },
      });
      
      setIsLoading(false);
      Swal.fire({
        title: 'Success',
        text: 'Platform settings updated successfully!',
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (error) {
      logger.error('Failed to update platform settings:', error);
      setIsLoading(false);
      Swal.fire({
        title: 'Error',
        text: 'Failed to update platform settings.',
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Permission check
    if (!can('user:update')) {
      Swal.fire({
        title: 'Unauthorized',
        text: 'You do not have permission to update your profile picture.',
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    try {
      // Upload to Firebase Storage
      const photoURL = await uploadFile(file, `avatars/${user!.uid}`);

      // Update both structured profile.avatarUrl and legacy photoURL in Firestore
      await saveFullUserProfile(user!.uid, {
        profile: { avatarUrl: photoURL },
      });

      // No need to reload manually — real-time subscription handles it
      // await loadFirestoreUser();

      Swal.fire({
        title: 'Success',
        text: 'Profile picture updated!',
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (error) {
      logger.error('Failed to upload image:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to upload image.',
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
    }
  };



  const handleVerificationUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!can('org:update')) {
       Swal.fire({ title: 'Unauthorized', text: 'You do not have permission to upload verification documents.', icon: 'error' });
       return;
    }

    try {
        const url = await uploadFile(file, `verification/${user!.uid}/${file.name}`);
        setFormData(prev => ({ ...prev, verificationDocumentUrl: url, verificationStatus: 'pending' }));
        Swal.fire({ title: 'Uploaded', text: 'Document uploaded successfully. Don\'t forget to save changes.', icon: 'success', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
    } catch (error) {
        logger.error('Verification upload failed', error);
        Swal.fire({ title: 'Error', text: 'Upload failed', icon: 'error' });
    }
  };

  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
        const url = await uploadFile(file, `branding/${user!.uid}/logo-${Date.now()}`);
        setFormData(prev => ({ ...prev, branding: { ...prev.branding, logoUrl: url } }));
        Swal.fire({ title: 'Uploaded', text: 'Logo uploaded. Save changes to apply.', icon: 'success', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
    } catch (error) {
        logger.error('Logo upload failed', error);
         Swal.fire({ title: 'Error', text: 'Upload failed', icon: 'error' });
    }
  };

  const handleBannerUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
        const url = await uploadFile(file, `branding/${user!.uid}/banner-${Date.now()}`);
        setFormData(prev => ({ ...prev, branding: { ...prev.branding, bannerUrl: url } }));
        Swal.fire({ title: 'Uploaded', text: 'Banner uploaded. Save changes to apply.', icon: 'success', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
    } catch (error) {
        logger.error('Banner upload failed', error);
         Swal.fire({ title: 'Error', text: 'Upload failed', icon: 'error' });
    }
  };

  const handleRevokeApp = async (appId: string) => {
    // In a real app, we would call an API to revoke the token.
    // Here we just remove from state.
    setConnectedApps(prev => prev.filter(app => app.id !== appId));
    Swal.fire({ title: 'Revoked', text: 'Access revoked successfully.', icon: 'success', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-[var(--text-muted)]">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  // Show loading spinner while fetching Firestore data
  if (firestoreLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)] mx-auto" />
          <p className="text-[var(--text-muted)]">Loading your profile from database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">

      {/* Page Header with Toggle */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] bg-clip-text text-transparent tracking-tight">
            {showAdminSettings ? 'Platform Settings' : 'Account Settings'}
          </h1>
          <p className="text-[var(--text-muted)] text-base mt-2">
            {showAdminSettings 
              ? 'Configure platform-wide settings and features' 
              : 'Manage your personal information, preferences, and security settings'}
          </p>
        </div>

        {can('platform:settings') && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAdminSettings(!showAdminSettings)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <Settings size={18} />
            {showAdminSettings ? 'User Settings' : 'Platform Settings'}
          </motion.button>
        )}
      </motion.div>

      {/* Navigation Tabs */}
      <div className="border-b border-[var(--border-primary)] overflow-x-auto no-scrollbar">
        <nav className="flex space-x-1 min-w-max" aria-label="Tabs">
          {!showAdminSettings ? (
            // User Tabs
            [
              { id: 'personal', label: 'Personal Info', icon: User },
              { id: 'preferences', label: 'Preferences', icon: Globe },
              { id: 'security', label: 'Security', icon: Lock },
              { id: 'privacy', label: 'Privacy', icon: Shield },
            ].map((tab, index) => (
              <motion.button
                key={tab.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setActiveUserTab(tab.id as UserTabType)}
                className={cn(
                  "group inline-flex items-center gap-2 py-4 px-6 border-b-2 font-semibold text-sm whitespace-nowrap transition-all duration-300 rounded-t-lg",
                  activeUserTab === tab.id
                    ? "border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5"
                    : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                )}
              >
                <tab.icon className={cn(
                  "h-5 w-5 transition-transform group-hover:scale-110",
                  activeUserTab === tab.id ? "text-[var(--color-primary)]" : "text-[var(--text-muted)]"
                )} />
                {tab.label}
              </motion.button>
            ))
          ) : (
            // Admin Tabs
            [
              { id: 'general', label: 'General', icon: Settings },
              { id: 'payment', label: 'Payment', icon: CreditCard },
              { id: 'email', label: 'Email', icon: Mail },
              { id: 'features', label: 'Features', icon: Zap },
              { id: 'seo', label: 'SEO & Meta', icon: TrendingUp },
              { id: 'security-admin', label: 'Security', icon: Shield },
            ].map((tab, index) => (
              <motion.button
                key={tab.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setActiveAdminTab(tab.id as AdminTabType)}
                className={cn(
                  "group inline-flex items-center gap-2 py-4 px-6 border-b-2 font-semibold text-sm whitespace-nowrap transition-all duration-300 rounded-t-lg",
                  activeAdminTab === tab.id
                    ? "border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5"
                    : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                )}
              >
                <tab.icon className={cn(
                  "h-5 w-5 transition-transform group-hover:scale-110",
                  activeAdminTab === tab.id ? "text-[var(--color-primary)]" : "text-[var(--text-muted)]"
                )} />
                {tab.label}
              </motion.button>
            ))
          )}
        </nav>
      </div>

      {/* Content Area */}
      {!showAdminSettings ? (
        // USER SETTINGS
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar - Profile Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-6"
          >
            {/* Profile Card */}
            <div className="bg-[var(--bg-card)] rounded-2xl p-6 shadow-lg border border-[var(--border-primary)] text-center relative overflow-hidden">
              {/* Gradient Background */}
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] opacity-10"></div>

              {/* Profile Picture */}
              <div className="relative mt-4 mb-6 inline-block group">
                <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] mx-auto shadow-xl">
                  <img
                    className="w-full h-full rounded-full object-cover border-4 border-[var(--bg-card)]"
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=00A3DB&color=fff&size=256`}
                    alt={user.displayName || 'Profile'}
                  />
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full m-1 cursor-pointer">
                  <Camera className="text-white h-8 w-8" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageUpload}
                  />
                </label>
                <button
                  type="button"
                  className="absolute bottom-1 right-1 p-3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                  onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                >
                  <Camera size={18} />
                </button>
              </div>

              {/* User Info */}
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                {user.displayName || 'User'}
              </h2>
              <p className="text-sm text-[var(--text-muted)] mb-4">{user.email}</p>

              {/* Badges */}
              <div className="flex justify-center gap-2 mb-6 flex-wrap">
                <span className={cn(
                  "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold capitalize shadow-md",
                  getRoleBadgeColor(user.role)
                )}>
                  <Shield size={12} />
                  {user.role}
                </span>
                {user.emailVerified && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md">
                    <CheckCircle2 size={12} />
                    Verified
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="border-t border-[var(--border-primary)] pt-6">
                <div className="grid grid-cols-3 divide-x divide-[var(--border-primary)]">
                  <div className="text-center">
                    <span className="block text-xl font-bold text-[var(--text-primary)]">12</span>
                    <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Events</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xl font-bold text-[var(--text-primary)]">5</span>
                    <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Tickets</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xl font-bold text-[var(--text-primary)]">4.8</span>
                    <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Rating</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Upgrade Card */}
            {!isAdmin && !isOrganizer && (
                <motion.div
                whileHover={{ y: -5 }}
                className="bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden"
                >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                    <div className="mb-3 inline-block p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Briefcase size={24} />
                    </div>
                    <h3 className="font-bold text-xl mb-2">Become an Organizer</h3>
                    <p className="text-white/90 text-sm mb-4">
                    Create events, sell tickets, and build your community.
                    </p>
                    <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 border-none font-bold shadow-lg">
                    Upgrade Account →
                    </Button>
                </div>
                </motion.div>
            )}
          </motion.div>

          {/* Right Content Area */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-8"
          >
            <form onSubmit={handleSave} className="bg-[var(--bg-card)] rounded-2xl shadow-lg border border-[var(--border-primary)] overflow-hidden">

              <AnimatePresence mode="wait">
                {/* PERSONAL INFO TAB */}
                {activeUserTab === 'personal' && (
                  <motion.div
                    key="personal"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="p-6 md:p-8 space-y-8"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-xl">
                        <User size={24} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Personal Information</h2>
                        <p className="text-sm text-[var(--text-muted)]">Update your personal details and profile</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        label="First Name"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="Enter your first name"
                        className="bg-[var(--bg-surface)] border-[var(--border-primary)]"
                      />

                      <Input
                        label="Last Name"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Enter your last name"
                        className="bg-[var(--bg-surface)] border-[var(--border-primary)]"
                      />

                      <Input
                        label="Display Name"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleInputChange}
                        placeholder="How should we call you?"
                        className="bg-[var(--bg-surface)] border-[var(--border-primary)]"
                      />

                      {/* Email (Read-only) */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-[var(--text-primary)]">
                          Email Address
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            disabled
                            value={formData.email}
                            className="w-full bg-[var(--bg-surface)]/50 border border-[var(--border-primary)] rounded-xl px-4 py-3 text-[var(--text-muted)] cursor-not-allowed"
                          />
                          {user.emailVerified && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-lg text-xs font-bold">
                              <CheckCircle2 size={12} /> Verified
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-[var(--text-primary)]">
                          Phone Number
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              className="w-full bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                              placeholder="+1 (555) 000-0000"
                            />
                            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                          </div>
                          <Button type="button" variant="secondary" className="whitespace-nowrap">
                            Verify
                          </Button>
                        </div>
                      </div>

                      <Input
                        label="Date of Birth"
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleInputChange}
                        className="bg-[var(--bg-surface)] border-[var(--border-primary)]"
                      />

                      <Select
                        label="Gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        options={[
                          { value: '', label: 'Select gender' },
                          { value: 'male', label: 'Male' },
                          { value: 'female', label: 'Female' },
                          { value: 'non-binary', label: 'Non-binary' },
                          { value: 'prefer-not-to-say', label: 'Prefer not to say' }
                        ]}
                        className="bg-[var(--bg-surface)] border-[var(--border-primary)]"
                      />

                      <Input
                        label="Location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="City, Country"
                        className="bg-[var(--bg-surface)] border-[var(--border-primary)]"
                      />

                      {/* Bio */}
                      <div className="md:col-span-2 space-y-2">
                        <label className="block text-sm font-semibold text-[var(--text-primary)]">
                          Bio
                        </label>
                        <textarea
                          name="bio"
                          rows={4}
                          value={formData.bio}
                          onChange={handleInputChange}
                          maxLength={300}
                          className="w-full bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all resize-none"
                          placeholder="Tell us a little bit about yourself..."
                        />
                        <div className="text-right text-xs text-[var(--text-muted)]">
                          {formData.bio.length}/300 characters
                        </div>
                      </div>
                    </div>

                    {/* Organizer Specific Section */}
                    {isOrganizer && (
                        <div className="pt-8 border-t border-[var(--border-primary)]">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-xl">
                                    <Briefcase size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">Professional Information</h2>
                                    <p className="text-sm text-[var(--text-muted)]">Manage your organizer profile and verification</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Organization Name"
                                    name="organizationName"
                                    value={formData.organizationName}
                                    onChange={handleInputChange}
                                    placeholder="Your organization name"
                                    className="bg-[var(--bg-surface)] border-[var(--border-primary)]"
                                />
                                <Input
                                    label="Website URL"
                                    name="websiteUrl"
                                    value={formData.websiteUrl}
                                    onChange={handleInputChange}
                                    placeholder="https://example.com"
                                    className="bg-[var(--bg-surface)] border-[var(--border-primary)]"
                                />
                                <Input
                                    label="Business Registration No."
                                    name="businessRegNumber"
                                    value={formData.businessRegNumber}
                                    onChange={handleInputChange}
                                    placeholder="Optional"
                                    className="bg-[var(--bg-surface)] border-[var(--border-primary)]"
                                />
                                <Input
                                    label="Tax ID / GST"
                                    name="taxId"
                                    value={formData.taxId}
                                    onChange={handleInputChange}
                                    placeholder="Optional"
                                    className="bg-[var(--bg-surface)] border-[var(--border-primary)]"
                                />
                                
                                <div className="md:col-span-2 space-y-2">
                                    <label className="block text-sm font-semibold text-[var(--text-primary)]">
                                        Organizer Bio (Extended)
                                    </label>
                                    <textarea
                                        name="organizerBio"
                                        rows={4}
                                        value={formData.organizerBio}
                                        onChange={handleInputChange}
                                        className="w-full bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all resize-none"
                                        placeholder="Tell attendees about your organization..."
                                    />
                                </div>

                                {/* Social Links */}
                                <div className="md:col-span-2">
                                    <h3 className="text-md font-semibold text-[var(--text-primary)] mb-3">Social Media Links</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="relative">
                                            <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-600" size={18} />
                                            <input
                                                name="socials.instagram"
                                                value={formData.socials.instagram}
                                                onChange={handleInputChange}
                                                placeholder="Instagram URL"
                                                className="w-full pl-10 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-700" size={18} />
                                            <input
                                                name="socials.linkedin"
                                                value={formData.socials.linkedin}
                                                onChange={handleInputChange}
                                                placeholder="LinkedIn URL"
                                                className="w-full pl-10 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-500" size={18} />
                                            <input
                                                name="socials.twitter"
                                                value={formData.socials.twitter}
                                                onChange={handleInputChange}
                                                placeholder="Twitter URL"
                                                className="w-full pl-10 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600" size={18} />
                                            <input
                                                name="socials.facebook"
                                                value={formData.socials.facebook}
                                                onChange={handleInputChange}
                                                placeholder="Facebook URL"
                                                className="w-full pl-10 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Verification Section */}
                                <div className="md:col-span-2 bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-primary)] flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold text-[var(--text-primary)]">Organizer Verification</h4>
                                        <p className="text-sm text-[var(--text-muted)]">Upload documents to get the verified badge.</p>
                                        <div className="mt-2">
                                            <span className={cn(
                                                "text-xs px-2 py-1 rounded font-bold uppercase",
                                                formData.verificationStatus === 'verified' ? 'bg-green-100 text-green-700' : 
                                                formData.verificationStatus === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                            )}>
                                                {formData.verificationStatus}
                                            </span>
                                        </div>
                                    </div>
                                    <Button variant="secondary" size="sm" type="button" onClick={() => document.getElementById('verification-upload')?.click()}>
                                        <UploadCloud className="mr-2 h-4 w-4" /> 
                                        {formData.verificationDocumentUrl ? 'Replace Doc' : 'Upload Docs'}
                                    </Button>
                                    <input 
                                        id="verification-upload" 
                                        type="file" 
                                        className="hidden" 
                                        onChange={handleVerificationUpload} 
                                        accept=".pdf,.jpg,.jpeg,.png"
                                    />
                                </div>
                                {formData.verificationDocumentUrl && (
                                    <div className="md:col-span-2 flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded border border-green-200">
                                        <CheckCircle2 size={16} />
                                        <span>Document uploaded ready for submission.</span>
                                        <a href={formData.verificationDocumentUrl} target="_blank" rel="noreferrer" className="underline ml-auto">View</a>
                                    </div>
                                )}

                                {/* Event Branding */}
                                <div className="md:col-span-2 pt-4">
                                    <h3 className="text-md font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-4">
                                        <Palette size={18} /> Event Branding
                                    </h3>
                                    <div className="flex gap-4 items-center">
                                        <div>
                                            <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">Brand Color</label>
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="color" 
                                                    value={formData.branding.brandColor} 
                                                    className="h-10 w-10 rounded cursor-pointer border-none"
                                                    onChange={(e) => setFormData(prev => ({...prev, branding: {...prev.branding, brandColor: e.target.value}}))}
                                                />
                                                <span className="text-sm font-mono text-[var(--text-primary)]">{formData.branding.brandColor}</span>
                                            </div>
                                        </div>
                                        {/* Placeholders for logo upload */}
                                        <label className="flex-1 border-2 border-dashed border-[var(--border-primary)] rounded-xl h-24 flex flex-col items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-surface)] cursor-pointer transition-colors">
                                            {formData.branding.logoUrl ? (
                                                <img src={formData.branding.logoUrl} alt="Logo" className="h-full w-full object-contain p-2" />
                                            ) : (
                                                <>
                                                    <UploadCloud size={20} />
                                                    <span className="text-xs mt-1">Upload Default Logo</span>
                                                </>
                                            )}
                                            <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                                        </label>
                                        <label className="flex-1 border-2 border-dashed border-[var(--border-primary)] rounded-xl h-24 flex flex-col items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-surface)] cursor-pointer transition-colors overflow-hidden relative">
                                            {formData.branding.bannerUrl ? (
                                                <img src={formData.branding.bannerUrl} alt="Banner" className="h-full w-full object-cover" />
                                            ) : (
                                                <>
                                                    <UploadCloud size={20} />
                                                    <span className="text-xs mt-1">Upload Default Banner</span>
                                                </>
                                            )}
                                            <input type="file" className="hidden" onChange={handleBannerUpload} accept="image/*" />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                  </motion.div>
                )}

                {/* PREFERENCES TAB */}
                {activeUserTab === 'preferences' && (
                  <motion.div
                    key="preferences"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="p-6 md:p-8 space-y-8"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-xl">
                        <Globe size={24} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Preferences</h2>
                        <p className="text-sm text-[var(--text-muted)]">Customize your experience</p>
                      </div>
                    </div>

                    {/* Appearance */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-primary)] pb-3">
                        <Monitor size={20} className="text-[var(--color-primary)]" />
                        Appearance
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {['light', 'dark', 'system'].map((theme) => (
                          <motion.div
                            key={theme}
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setFormData(p => ({ ...p, theme: theme as 'light' | 'dark' | 'system' }))}
                            className={cn(
                              "cursor-pointer rounded-xl border-2 p-6 flex flex-col items-center gap-3 transition-all",
                              formData.theme === theme
                                ? "border-[var(--color-primary)] bg-gradient-to-br from-[var(--color-primary)]/10 to-transparent shadow-lg"
                                : "border-[var(--border-primary)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--bg-surface)]"
                            )}
                          >
                            {theme === 'light' && <Sun className="h-8 w-8 text-orange-500" />}
                            {theme === 'dark' && <Moon className="h-8 w-8 text-blue-500" />}
                            {theme === 'system' && <Monitor className="h-8 w-8 text-gray-500" />}
                            <span className="font-semibold capitalize text-[var(--text-primary)]">{theme} Theme</span>
                            {formData.theme === theme && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-2 right-2 w-6 h-6 bg-[var(--color-primary)] rounded-full flex items-center justify-center"
                              >
                                <Check size={14} className="text-white" />
                              </motion.div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Localization */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-primary)] pb-3">
                        <Languages size={20} className="text-[var(--color-primary)]" />
                        Localization
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Select
                          label="Language"
                          name="language"
                          value={formData.language}
                          onChange={handleInputChange}
                          options={languages}
                          className="bg-[var(--bg-surface)] border-[var(--border-primary)]"
                        />
                        <Select
                          label="Timezone"
                          name="timezone"
                          value={formData.timezone}
                          onChange={handleInputChange}
                          options={timezones}
                          className="bg-[var(--bg-surface)] border-[var(--border-primary)]"
                        />
                        <Select
                          label="Currency"
                          name="currency"
                          value={formData.currency}
                          onChange={handleInputChange}
                          options={currencies}
                          className="bg-[var(--bg-surface)] border-[var(--border-primary)]"
                        />
                      </div>
                    </div>

                    {/* Notifications */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-primary)] pb-3">
                        <Bell size={20} className="text-[var(--color-primary)]" />
                        Notifications
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        {[
                          { key: 'email', icon: Mail, label: 'Email Notifications', desc: 'Receive updates about your account' },
                          { key: 'push', icon: Bell, label: 'Push Notifications', desc: 'Real-time alerts on your device' },
                          { key: 'sms', icon: Smartphone, label: 'SMS Notifications', desc: 'Booking confirmations via SMS' },
                          { key: 'inApp', icon: Layout, label: 'In-App Notifications', desc: 'Notifications inside the platform' },
                          { key: 'eventReminders', icon: Calendar, label: 'Event Reminders', desc: 'Get reminded before events start' },
                          { key: 'bookingConfirmations', icon: CheckCircle2, label: 'Booking Confirmations', desc: 'Receipts and tickets' },
                          { key: 'eventUpdates', icon: Zap, label: 'Event Updates', desc: 'Changes to events you are attending' },
                          { key: 'promotionalEmails', icon: TrendingUp, label: 'Promotions', desc: 'Special offers and deals' },
                          { key: 'newsletter', icon: FileText, label: 'Newsletter', desc: 'Platform news and updates' },
                        ].map((notif) => (
                          <motion.div
                            key={notif.key}
                            className="flex items-center justify-between p-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-primary)]"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-[var(--bg-card)] rounded-lg text-[var(--color-primary)]">
                                <notif.icon size={18} />
                              </div>
                              <div>
                                <p className="font-semibold text-sm text-[var(--text-primary)]">{notif.label}</p>
                                <p className="text-xs text-[var(--text-muted)]">{notif.desc}</p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={formData.notifications[notif.key as keyof NotificationSettings]} 
                                onChange={() => handleToggle('notifications', notif.key)} 
                              />
                              <div className="w-9 h-5 bg-[var(--bg-card)] peer-focus:outline-none rounded-full peer border border-[var(--border-primary)] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--color-primary)] peer-checked:border-transparent"></div>
                            </label>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Smart Preferences */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-primary)] pb-3">
                            <Zap size={20} className="text-[var(--color-primary)]" />
                            Smart Preferences
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { key: 'favoriteCategories', label: 'Use Favorite Categories', desc: 'Tailor feed based on likes' },
                                { key: 'personalizedRecommendations', label: 'Personalized Recommendations', desc: 'AI-driven event suggestions' },
                                { key: 'autoAddCalendar', label: 'Auto-add to Calendar', desc: 'Sync bookings automatically' },
                                { key: 'autoFollowOrganizers', label: 'Auto-follow Organizers', desc: 'Follow organizers after booking' }
                            ].map(pref => (
                                <div key={pref.key} className="flex items-center justify-between p-4 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-primary)]">
                                    <div>
                                        <p className="font-semibold text-sm">{pref.label}</p>
                                        <p className="text-xs text-[var(--text-muted)]">{pref.desc}</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={formData.smartPreferences[pref.key as keyof SmartPreferences]} 
                                            onChange={() => handleToggle('smartPreferences', pref.key)} 
                                        />
                                        <div className="w-9 h-5 bg-[var(--bg-card)] peer-focus:outline-none rounded-full peer border border-[var(--border-primary)] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--color-primary)] peer-checked:border-transparent"></div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                  </motion.div>
                )}

                {/* SECURITY TAB */}
                {activeUserTab === 'security' && (
                  <motion.div
                    key="security"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="p-6 md:p-8 space-y-8"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-gradient-to-br from-red-500 to-orange-600 text-white rounded-xl">
                        <Lock size={24} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Security</h2>
                        <p className="text-sm text-[var(--text-muted)]">Manage your account security settings</p>
                      </div>
                    </div>

                    {/* Change Password */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-primary)] pb-3">
                        <Key size={20} className="text-[var(--color-primary)]" />
                        Change Password
                      </h3>
                      <div className="space-y-4">
                        <Input
                          type="password"
                          label="Current Password"
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          placeholder="••••••••"
                          className="bg-[var(--bg-surface)] border-[var(--border-primary)]"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            type="password"
                            label="New Password"
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                            placeholder="••••••••"
                            className="bg-[var(--bg-surface)] border-[var(--border-primary)]"
                          />
                          <Input
                            type="password"
                            label="Confirm New Password"
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            placeholder="••••••••"
                            className="bg-[var(--bg-surface)] border-[var(--border-primary)]"
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="primary"
                            isLoading={passwordLoading}
                            disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
                            onClick={async () => {
                              const minLen = platformSettings.securityPolicies?.passwordMinLength ?? 8;
                              if (passwordData.newPassword.length < minLen) {
                                Swal.fire({ title: 'Error', text: `New password must be at least ${minLen} characters.`, icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true });
                                return;
                              }
                              if (platformSettings.securityPolicies?.requireSpecialChar) {
                                const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(passwordData.newPassword);
                                if (!hasSpecial) {
                                  Swal.fire({ title: 'Error', text: 'Password must contain at least one special character.', icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true });
                                  return;
                                }
                              }
                              setPasswordLoading(true);
                              try {
                                await changePassword(passwordData.currentPassword, passwordData.newPassword);
                                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                Swal.fire({ title: 'Success', text: 'Password changed successfully!', icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true });
                              } catch (error: unknown) {
                                logger.error('Password change failed:', error);
                                Swal.fire({ title: 'Error', text: (error instanceof Error ? error.message : undefined) || 'Failed to change password.', icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 4000, timerProgressBar: true });
                              } finally {
                                setPasswordLoading(false);
                              }
                            }}
                          >
                            <Lock className="mr-2 h-4 w-4" />
                            Update Password
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Two-Factor Authentication */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-primary)] pb-3">
                        <Shield size={20} className="text-[var(--color-primary)]" />
                        Two-Factor Authentication
                      </h3>
                      {platformSettings.securityPolicies?.enforce2FA && !formData.twoFactor && (
                        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-300 dark:border-amber-700 rounded-xl">
                          <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
                          <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                            Two-factor authentication is required by platform security policy. Please enable 2FA to continue using your account.
                          </p>
                        </div>
                      )}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 border border-blue-200 dark:border-blue-900/30 rounded-xl"
                      >
                        <div className="flex gap-4">
                          <div className="p-3 bg-white dark:bg-[var(--bg-card)] rounded-xl shadow-md">
                            <Shield className="text-blue-600 h-6 w-6" />
                          </div>
                          <div>
                            <p className="font-bold text-[var(--text-primary)] mb-1">Secure your account</p>
                            <p className="text-sm text-[var(--text-muted)] max-w-md">
                              Two-factor authentication adds an extra layer of security to prevent unauthorized access.
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          className="whitespace-nowrap"
                          disabled={platformSettings.securityPolicies?.enforce2FA && formData.twoFactor}
                          onClick={() => setFormData(prev => ({ ...prev, twoFactor: !prev.twoFactor }))}
                        >
                          {formData.twoFactor ? 'Disable 2FA' : 'Enable 2FA'}
                        </Button>
                      </motion.div>
                    </div>

                    {/* Active Sessions */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-primary)] pb-3">
                        <Laptop size={20} className="text-[var(--color-primary)]" />
                        Active Sessions
                      </h3>
                      <div className="space-y-3">
                        {activeSessions.map((session) => (
                          <motion.div
                            key={session.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-between p-4 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-primary)]"
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-[var(--bg-card)] rounded-xl">
                                <Laptop size={20} className="text-[var(--text-primary)]" />
                              </div>
                              <div>
                                <p className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                                  {session.device}
                                  {session.current && (
                                    <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-bold">
                                      Current
                                    </span>
                                  )}
                                </p>
                                <p className="text-sm text-[var(--text-muted)]">
                                  {session.location} • {session.ipAddress} • {session.lastActive}
                                </p>
                              </div>
                            </div>
                            {!session.current && (
                              <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                                Sign Out
                              </Button>
                            )}
                          </motion.div>
                        ))}
                        <Button variant="ghost" className="w-full border border-[var(--border-primary)] hover:bg-[var(--bg-surface)]">
                          Sign out from all other devices
                        </Button>
                      </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 flex items-center gap-2 border-b border-red-200 dark:border-red-900/30 pb-3">
                        <AlertCircle size={20} />
                        Danger Zone
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-4">
                        {can('user:update') && (
                        <motion.div whileHover={{ scale: 1.01 }} className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between">
                            <div>
                                <p className="font-bold text-red-700 dark:text-red-300">Deactivate Account</p>
                                <p className="text-xs text-red-600 dark:text-red-400">Temporarily disable your account.</p>
                            </div>
                            <Button
                                size="sm"
                                className="bg-red-100 text-red-700 hover:bg-red-200 border-none"
                                onClick={async () => {
                                  const result = await Swal.fire({
                                    title: 'Deactivate Account?',
                                    text: 'Your account will be temporarily disabled. You can reactivate it by signing in again.',
                                    icon: 'warning',
                                    showCancelButton: true,
                                    confirmButtonText: 'Deactivate',
                                    confirmButtonColor: '#dc2626',
                                  });
                                  if (!result.isConfirmed || !user) return;
                                  try {
                                    const { updateAccountStatus } = await import('../../lib/userService');
                                    await updateAccountStatus(user.uid, 'suspended');
                                    Swal.fire({ title: 'Account Deactivated', text: 'Your account has been deactivated.', icon: 'info', timer: 3000, showConfirmButton: false });
                                    window.location.href = '/';
                                  } catch (error: unknown) {
                                    logger.error('Account deactivation failed:', error);
                                    Swal.fire({ title: 'Error', text: (error instanceof Error ? error.message : 'Failed to deactivate account.'), icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 4000, timerProgressBar: true });
                                  }
                                }}
                            >Deactivate</Button>
                        </motion.div>
                        )}

                        {can('user:delete') && (
                        <motion.div
                            whileHover={{ scale: 1.01 }}
                            className="p-6 bg-red-50 dark:bg-red-900/10 border-2 border-red-200 dark:border-red-800 rounded-xl"
                        >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <p className="font-bold text-red-700 dark:text-red-300 mb-1 text-lg">Delete Account</p>
                                <p className="text-sm text-red-600 dark:text-red-400 max-w-md">
                                Permanently delete your account and all associated data. This action cannot be undone.
                                </p>
                            </div>
                            <Button
                                type="button"
                                className="bg-red-600 hover:bg-red-700 text-white border-none whitespace-nowrap shadow-lg"
                                isLoading={deleteLoading}
                                disabled={deleteLoading}
                                onClick={async () => {
                                const { value: password } = await Swal.fire({
                                    title: 'Delete Account',
                                    text: 'This is irreversible. Enter your password to confirm.',
                                    input: 'password',
                                    inputPlaceholder: 'Enter your password',
                                    showCancelButton: true,
                                    confirmButtonText: 'Delete My Account',
                                    confirmButtonColor: '#dc2626',
                                    inputValidator: (value) => !value ? 'Password is required' : null,
                                });
                                if (!password) return;
                                setDeleteLoading(true);
                                try {
                                    await deleteUserAccount(password);
                                    Swal.fire({ title: 'Account Deleted', text: 'Your account has been permanently deleted.', icon: 'info', timer: 3000, showConfirmButton: false });
                                    window.location.href = '/';
                                } catch (error: unknown) {
                                    logger.error('Account deletion failed:', error);
                                    Swal.fire({ title: 'Error', text: (error instanceof Error ? error.message : undefined) || 'Failed to delete account.', icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 4000, timerProgressBar: true });
                                } finally {
                                    setDeleteLoading(false);
                                }
                                }}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Account
                            </Button>
                            </div>
                        </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* PRIVACY TAB */}
                {activeUserTab === 'privacy' && (
                  <motion.div
                    key="privacy"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="p-6 md:p-8 space-y-8"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-gradient-to-br from-green-500 to-teal-600 text-white rounded-xl">
                        <Shield size={24} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Privacy</h2>
                        <p className="text-sm text-[var(--text-muted)]">Control your privacy and data settings</p>
                      </div>
                    </div>

                    {/* Profile Visibility */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-primary)] pb-3">
                        <Eye size={20} className="text-[var(--color-primary)]" />
                        Profile Visibility
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {['public', 'private'].map((visibility) => (
                          <motion.div
                            key={visibility}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setFormData(p => ({ ...p, privacy: { ...p.privacy, profileVisibility: visibility as 'public' | 'private' } }))}
                            className={cn(
                              "cursor-pointer rounded-xl border-2 p-6 flex flex-col items-center gap-3 transition-all relative",
                              formData.privacy.profileVisibility === visibility
                                ? "border-[var(--color-primary)] bg-gradient-to-br from-[var(--color-primary)]/10 to-transparent shadow-lg"
                                : "border-[var(--border-primary)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--bg-surface)]"
                            )}
                          >
                            {visibility === 'public' ? <Eye className="h-8 w-8 text-green-500" /> : <EyeOff className="h-8 w-8 text-orange-500" />}
                            <span className="font-semibold capitalize text-[var(--text-primary)]">{visibility}</span>
                            <p className="text-xs text-[var(--text-muted)] text-center">
                              {visibility === 'public' ? 'Anyone can view your profile' : 'Only you can see your profile'}
                            </p>
                            {formData.privacy.profileVisibility === visibility && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-2 right-2 w-6 h-6 bg-[var(--color-primary)] rounded-full flex items-center justify-center"
                              >
                                <Check size={14} className="text-white" />
                              </motion.div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Privacy Toggles */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-primary)] pb-3">
                        <Lock size={20} className="text-[var(--color-primary)]" />
                        Privacy Settings
                      </h3>
                      
                      <div className="space-y-3">
                        {[
                            { key: 'showEmailToOrganizers', label: 'Show Email to Organizers', desc: 'Allow event organizers to see your email', icon: Mail },
                            { key: 'showPhoneToOrganizers', label: 'Show Phone to Organizers', desc: 'Allow event organizers to see your number', icon: Phone },
                            { key: 'showAttendedEvents', label: 'Show Attended Events Publicly', desc: 'Let others see events you went to', icon: Calendar }
                        ].map((setting) => (
                            <motion.div
                                key={setting.key}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center justify-between p-4 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-primary)]"
                            >
                                <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <setting.icon size={20} className="text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="font-semibold text-[var(--text-primary)]">{setting.label}</p>
                                    <p className="text-sm text-[var(--text-muted)]">{setting.desc}</p>
                                </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={formData.privacy[setting.key as keyof PrivacySettings] === true} 
                                    onChange={() => handleToggle('privacy', setting.key)} 
                                />
                                <div className="w-11 h-6 bg-[var(--bg-card)] peer-focus:outline-none rounded-full peer border-2 border-[var(--border-primary)] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[var(--color-primary)] peer-checked:to-[var(--color-secondary)] peer-checked:border-transparent shadow-inner"></div>
                                </label>
                            </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Data Download (GDPR) */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-primary)] pb-3">
                        <Download size={20} className="text-[var(--color-primary)]" />
                        Your Data
                      </h3>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 border border-blue-200 dark:border-blue-900/30 rounded-xl"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                            <p className="font-bold text-[var(--text-primary)] mb-1 text-lg">Download Your Data</p>
                            <p className="text-sm text-[var(--text-muted)] max-w-md">
                              Export all your personal data in accordance with GDPR regulations.
                            </p>
                          </div>
                          <Button variant="primary" className="whitespace-nowrap">
                            <Download className="mr-2 h-4 w-4" />
                            Request Data
                          </Button>
                        </div>
                      </motion.div>
                    </div>

                    {/* Connected Apps */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-primary)] pb-3">
                        <Code size={20} className="text-[var(--color-primary)]" />
                        Connected Apps
                      </h3>
                      <div className="space-y-3">
                        {connectedApps.map((app) => (
                          <motion.div
                            key={app.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-between p-4 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-primary)]"
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-[var(--bg-card)] rounded-xl shadow-sm">
                                {app.icon}
                              </div>
                              <div>
                                <p className="font-semibold text-[var(--text-primary)]">{app.name}</p>
                                <p className="text-sm text-[var(--text-muted)]">
                                  Connected {app.connectedAt} • {app.permissions.join(', ')}
                                </p>
                              </div>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => handleRevokeApp(app.id)}
                            >
                                Revoke
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer Actions */}
              <div className="px-6 py-4 bg-[var(--bg-surface)] border-t border-[var(--border-primary)] flex items-center justify-end gap-3">
                <Button type="button" variant="ghost" disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isLoading} disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>

            </form>
          </motion.div>
        </div>
      ) : (
        // ADMIN SETTINGS
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-card)] rounded-2xl shadow-lg border border-[var(--border-primary)] overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {/* GENERAL TAB */}
            {activeAdminTab === 'general' && (
              <motion.div
                key="general"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="p-6 md:p-8 space-y-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl">
                    <Settings size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">General Settings</h2>
                    <p className="text-sm text-[var(--text-muted)]">Configure core platform information</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Platform Name"
                    name="platformName"
                    value={adminSettings.platformName}
                    onChange={handleAdminInputChange}
                    className="bg-[var(--bg-surface)] border-[var(--border-primary)]"
                  />
                  <Input
                    label="Contact Email"
                    name="contactEmail"
                    value={adminSettings.contactEmail}
                    onChange={handleAdminInputChange}
                    className="bg-[var(--bg-surface)] border-[var(--border-primary)]"
                  />
                  <Input
                    label="Support Email"
                    name="supportEmail"
                    value={adminSettings.supportEmail}
                    onChange={handleAdminInputChange}
                    className="bg-[var(--bg-surface)] border-[var(--border-primary)]"
                  />
                  <Select
                    label="Default Currency"
                    name="defaultCurrency"
                    value={adminSettings.defaultCurrency}
                    onChange={handleAdminInputChange}
                    options={currencies}
                    className="bg-[var(--bg-surface)] border-[var(--border-primary)]"
                  />
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                            checked={adminSettings.maintenanceMode}
                            onChange={() => setAdminSettings(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                        />
                        <span className="text-[var(--text-primary)] font-medium">Enable Maintenance Mode</span>
                    </label>
                    <p className="text-xs text-[var(--text-muted)] mt-1 ml-6">This will disable user access to the platform.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* PAYMENT TAB */}
            {activeAdminTab === 'payment' && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="p-6 md:p-8 space-y-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">Payment Gateways</h2>
                    <p className="text-sm text-[var(--text-muted)]">Manage payment providers and fees</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Razorpay Toggle */}
                  <div className="flex items-center justify-between p-4 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-primary)]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                        <DollarSign size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">Razorpay</p>
                        <p className="text-sm text-[var(--text-muted)]">Enable Razorpay payments</p>
                      </div>
                    </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={adminSettings.razorpayEnabled} 
                        onChange={() => setAdminSettings(prev => ({ ...prev, razorpayEnabled: !prev.razorpayEnabled }))} 
                      />
                      <div className="w-11 h-6 bg-[var(--bg-card)] peer-focus:outline-none rounded-full peer border-2 border-[var(--border-primary)] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[var(--color-primary)] peer-checked:to-[var(--color-secondary)] peer-checked:border-transparent shadow-inner"></div>
                    </label>
                  </div>

                  {/* Cashfree Toggle */}
                  <div className="flex items-center justify-between p-4 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-primary)]">
                      <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                        <DollarSign size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">Cashfree</p>
                        <p className="text-sm text-[var(--text-muted)]">Enable Cashfree payments</p>
                      </div>
                    </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={adminSettings.cashfreeEnabled} 
                        onChange={() => setAdminSettings(prev => ({ ...prev, cashfreeEnabled: !prev.cashfreeEnabled }))} 
                      />
                      <div className="w-11 h-6 bg-[var(--bg-card)] peer-focus:outline-none rounded-full peer border-2 border-[var(--border-primary)] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[var(--color-primary)] peer-checked:to-[var(--color-secondary)] peer-checked:border-transparent shadow-inner"></div>
                    </label>
                  </div>

                  <Input
                    label="Platform Fee (%)"
                    type="number"
                    name="platformFeePercentage"
    
                    value={adminSettings.platformFeePercentage}
                    onChange={handleAdminInputChange}
                    className="bg-[var(--bg-surface)] border-[var(--border-primary)]"
                  />
                   <Input
                    label="Tax Percentage (%)"
                    type="number"
                     name="taxPercentage"
                    value={adminSettings.taxPercentage}
                    onChange={handleAdminInputChange}
                    className="bg-[var(--bg-surface)] border-[var(--border-primary)]"
                  />
                  <Input
                    label="Webhook Secret"
                    type="password"
                    name="webhookSecret"
                    value={adminSettings.webhookSecret}
                    onChange={handleAdminInputChange}
                    className="bg-[var(--bg-surface)] border-[var(--border-primary)]"
                  />
                </div>
              </motion.div>
            )}

            {/* EMAIL TAB */}
             {activeAdminTab === 'email' && (
              <motion.div
                key="email"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="p-6 md:p-8 space-y-8"
              >
                 <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 text-white rounded-xl">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">Email Settings (SMTP)</h2>
                    <p className="text-sm text-[var(--text-muted)]">Configure email server settings</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <Input
                    label="SMTP Host"
                    name="smtpHost"
                    value={adminSettings.smtpHost}
                    onChange={handleAdminInputChange}
                    className="bg-[var(--bg-surface)] border-[var(--border-primary)]"
                  />
                   <Input
                    label="SMTP Port"
                    type="number"
                    name="smtpPort"
                    value={adminSettings.smtpPort}
                    onChange={handleAdminInputChange}
                    className="bg-[var(--bg-surface)] border-[var(--border-primary)]"
                  />
                   <Input
                    label="SMTP User"
                    name="smtpUser"
                    value={adminSettings.smtpUser}
                    onChange={handleAdminInputChange}
                    className="bg-[var(--bg-surface)] border-[var(--border-primary)]"
                  />
                   <Input
                    label="SMTP Password"
                    type="password"
                    name="smtpPassword"
                    value={adminSettings.smtpPassword}
                    onChange={handleAdminInputChange}
                    className="bg-[var(--bg-surface)] border-[var(--border-primary)]"
                  />
                </div>
              </motion.div>
             )}

            {/* FEATURES TAB */}
             {activeAdminTab === 'features' && (
              <motion.div
                key="features"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="p-6 md:p-8 space-y-8"
              >
                  <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-xl">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">Feature Flags</h2>
                    <p className="text-sm text-[var(--text-muted)]">Enable or disable platform features</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'userRegistration', label: 'User Registration', desc: 'Allow new users to sign up' },
                    { key: 'eventCreation', label: 'Event Creation', desc: 'Allow organizers to create events' },
                    { key: 'iotIntegration', label: 'IoT Integration', desc: 'Enable IoT device connections' },
                    { key: 'aiChatbot', label: 'AI Chatbot', desc: 'Enable AI assistance' },
                    { key: 'socialLogin', label: 'Social Login', desc: 'Allow login via Google/Facebook' },
                    { key: 'analytics', label: 'Advanced Analytics', desc: 'Show detailed analytics dashboards' },
                    { key: 'referralProgram', label: 'Referral Program', desc: 'Enable user referrals' },
                  ].map((feature) => (
                    <motion.div
                      key={feature.key}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center justify-between p-4 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-primary)]"
                    >
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{feature.label}</p>
                        <p className="text-sm text-[var(--text-muted)]">{feature.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={adminSettings.features[feature.key as keyof typeof adminSettings.features]} 
                          onChange={() => handleToggle('features', feature.key)} 
                        />
                        <div className="w-11 h-6 bg-[var(--bg-card)] peer-focus:outline-none rounded-full peer border-2 border-[var(--border-primary)] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[var(--color-primary)] peer-checked:to-[var(--color-secondary)] peer-checked:border-transparent shadow-inner"></div>
                      </label>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
             )}

            {/* SEO TAB */}
             {activeAdminTab === 'seo' && (
              <motion.div
                key="seo"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="p-6 md:p-8 space-y-8"
              >
                 <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-xl">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">SEO & Analytics</h2>
                    <p className="text-sm text-[var(--text-muted)]">Manage meta tags and tracking codes</p>
                  </div>
                </div>

                <div className="space-y-6">
                   <Input
                    label="Meta Title"
                    name="metaTitle"
                    value={adminSettings.metaTitle}
                    onChange={handleAdminInputChange}
                    className="bg-[var(--bg-surface)] border-[var(--border-primary)]"
                  />
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[var(--text-primary)]">Meta Description</label>
                    <textarea
                      name="metaDescription"
                      rows={3}
                      value={adminSettings.metaDescription}
                      onChange={handleAdminInputChange}
                      className="w-full bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all resize-none"
                    />
                  </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Google Analytics ID"
                      name="googleAnalyticsId"
                      value={adminSettings.googleAnalyticsId}
                      onChange={handleAdminInputChange}
                      placeholder="UA-XXXXXXXXX-X"
                      className="bg-[var(--bg-surface)] border-[var(--border-primary)]"
                    />
                     <Input
                      label="Facebook Pixel ID"
                      name="facebookPixelId"
                      value={adminSettings.facebookPixelId}
                      onChange={handleAdminInputChange}
                      className="bg-[var(--bg-surface)] border-[var(--border-primary)]"
                    />
                   </div>
                </div>
              </motion.div>
             )}
             
            {/* SECURITY ADMIN TAB */}
             {activeAdminTab === 'security-admin' && (
              <motion.div
                key="security-admin"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="p-6 md:p-8 space-y-8"
              >
                  <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-xl">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">Security Policies</h2>
                    <p className="text-sm text-[var(--text-muted)]">Enforce security rules for all users</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                   <div className="flex items-center justify-between p-4 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-primary)]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                        <Lock size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">Enforce 2FA</p>
                        <p className="text-sm text-[var(--text-muted)]">Require Two-Factor Authentication for all admins</p>
                      </div>
                    </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={adminSettings.enforce2FA} 
                        onChange={() => setAdminSettings(prev => ({ ...prev, enforce2FA: !prev.enforce2FA }))} 
                      />
                      <div className="w-11 h-6 bg-[var(--bg-card)] peer-focus:outline-none rounded-full peer border-2 border-[var(--border-primary)] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[var(--color-primary)] peer-checked:to-[var(--color-secondary)] peer-checked:border-transparent shadow-inner"></div>
                    </label>
                  </div>

                   <Input
                    label="Session Timeout (minutes)"
                    type="number"
                    name="sessionTimeout"
                    value={adminSettings.sessionTimeout}
                    onChange={handleAdminInputChange}
                    className="bg-[var(--bg-surface)] border-[var(--border-primary)]"
                  />
                  
                  <div className="flex items-center justify-between p-4 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-primary)]">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                        <AlertCircle size={20} className="text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">Require Special Characters</p>
                        <p className="text-sm text-[var(--text-muted)]">Enforce strong passwords with special chars</p>
                      </div>
                    </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={adminSettings.requireSpecialChar} 
                        onChange={() => setAdminSettings(prev => ({ ...prev, requireSpecialChar: !prev.requireSpecialChar }))} 
                      />
                      <div className="w-11 h-6 bg-[var(--bg-card)] peer-focus:outline-none rounded-full peer border-2 border-[var(--border-primary)] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[var(--color-primary)] peer-checked:to-[var(--color-secondary)] peer-checked:border-transparent shadow-inner"></div>
                    </label>
                  </div>
                </div>
              </motion.div>
             )}
          </AnimatePresence>

          {/* Admin Footer Actions */}
          <div className="px-6 py-4 bg-[var(--bg-surface)] border-t border-[var(--border-primary)] flex items-center justify-end gap-3">
             <Button type="button" variant="ghost" disabled={isLoading} onClick={() => setShowAdminSettings(false)}>
              Back to Profile
            </Button>
            <Button type="button" variant="primary" isLoading={isLoading} disabled={isLoading} onClick={handleAdminSave}>
              <Save className="mr-2 h-4 w-4" />
              Save Platform Settings
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}