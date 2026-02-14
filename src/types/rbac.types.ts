// =============================================================================
// RBAC TYPES — Role-Based Access Control Type Definitions
// =============================================================================
// Central type definitions for the permission-driven architecture.
// All roles, permissions, and settings types are defined here.
// =============================================================================

import type { Timestamp, FieldValue } from 'firebase/firestore';

// =============================================================================
// ROLE DEFINITIONS
// =============================================================================

/**
 * All possible user roles in the system.
 * Values MUST match what's stored in Firestore `users/{uid}.role`.
 */
export type AppRole = 'user' | 'organizer' | 'org_admin' | 'admin' | 'superadmin';

/**
 * Role hierarchy — higher index = more authority.
 * Used for permission inheritance and comparison.
 */
export const ROLE_HIERARCHY: Record<AppRole, number> = {
  user: 0,
  organizer: 1,
  org_admin: 2,
  admin: 3,
  superadmin: 4,
};

// =============================================================================
// PERMISSION DEFINITIONS
// =============================================================================

/**
 * All granular permissions in the system.
 * Format: `resource:action`
 */
export type Permission =
  // Event permissions
  | 'event:create'
  | 'event:read'
  | 'event:update'
  | 'event:delete'
  | 'event:publish'
  | 'event:approve'
  // Booking permissions
  | 'booking:create'
  | 'booking:read'
  | 'booking:update'
  | 'booking:cancel'
  | 'booking:refund'
  // User permissions
  | 'user:read'
  | 'user:update'
  | 'user:delete'
  | 'user:manage'
  | 'user:assign_role'
  | 'user:suspend'
  | 'user:verify'
  // Organization permissions
  | 'org:create'
  | 'org:read'
  | 'org:update'
  | 'org:delete'
  | 'org:manage_members'
  | 'org:manage_settings'
  // Finance permissions
  | 'finance:view'
  | 'finance:manage'
  | 'finance:payout'
  | 'finance:refund'
  // Analytics permissions
  | 'analytics:view'
  | 'analytics:export'
  // IoT permissions
  | 'iot:view'
  | 'iot:manage'
  | 'iot:configure'
  // Platform permissions
  | 'platform:settings'
  | 'platform:feature_flags'
  | 'platform:security'
  | 'platform:maintenance'
  // Notification permissions
  | 'notification:send'
  | 'notification:manage'
  // Support permissions
  | 'support:view'
  | 'support:manage';

/**
 * Default permissions for each role.
 * These are the baseline — org-level overrides may restrict further.
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  user: [
    'event:read',
    'booking:create',
    'booking:read',
    'booking:cancel',
    'user:read',
    'user:update',
    'support:view',
  ],
  organizer: [
    'event:create',
    'event:read',
    'event:update',
    'event:delete',
    'event:publish',
    'booking:read',
    'booking:update',
    'booking:cancel',
    'booking:refund',
    'user:read',
    'user:update',
    'finance:view',
    'finance:payout',
    'analytics:view',
    'iot:view',
    'iot:manage',
    'support:view',
  ],
  org_admin: [
    'event:create',
    'event:read',
    'event:update',
    'event:delete',
    'event:publish',
    'event:approve',
    'booking:read',
    'booking:update',
    'booking:cancel',
    'booking:refund',
    'user:read',
    'user:update',
    'user:manage',
    'org:read',
    'org:update',
    'org:manage_members',
    'org:manage_settings',
    'finance:view',
    'finance:manage',
    'finance:payout',
    'finance:refund',
    'analytics:view',
    'analytics:export',
    'iot:view',
    'iot:manage',
    'iot:configure',
    'notification:send',
    'support:view',
    'support:manage',
  ],
  admin: [
    'event:create',
    'event:read',
    'event:update',
    'event:delete',
    'event:publish',
    'event:approve',
    'booking:read',
    'booking:update',
    'booking:cancel',
    'booking:refund',
    'user:read',
    'user:update',
    'user:delete',
    'user:manage',
    'user:assign_role',
    'user:suspend',
    'user:verify',
    'org:create',
    'org:read',
    'org:update',
    'org:delete',
    'org:manage_members',
    'org:manage_settings',
    'finance:view',
    'finance:manage',
    'finance:payout',
    'finance:refund',
    'analytics:view',
    'analytics:export',
    'iot:view',
    'iot:manage',
    'iot:configure',
    'platform:settings',
    'platform:feature_flags',
    'notification:send',
    'notification:manage',
    'support:view',
    'support:manage',
  ],
  superadmin: [
    'event:create',
    'event:read',
    'event:update',
    'event:delete',
    'event:publish',
    'event:approve',
    'booking:create',
    'booking:read',
    'booking:update',
    'booking:cancel',
    'booking:refund',
    'user:read',
    'user:update',
    'user:delete',
    'user:manage',
    'user:assign_role',
    'user:suspend',
    'user:verify',
    'org:create',
    'org:read',
    'org:update',
    'org:delete',
    'org:manage_members',
    'org:manage_settings',
    'finance:view',
    'finance:manage',
    'finance:payout',
    'finance:refund',
    'analytics:view',
    'analytics:export',
    'iot:view',
    'iot:manage',
    'iot:configure',
    'platform:settings',
    'platform:feature_flags',
    'platform:security',
    'platform:maintenance',
    'notification:send',
    'notification:manage',
    'support:view',
    'support:manage',
  ],
};

// =============================================================================
// FIRESTORE DOCUMENT TYPES — users/{uid}
// =============================================================================

export interface FirestoreUserProfile {
  fullName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
}

export interface FirestoreOrganizerInfo {
  organizationName?: string;
  website?: string;
  socialLinks?: {
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  verificationDocumentUrl?: string;
  branding?: {
    brandColor?: string;
    logoUrl?: string;
    bannerUrl?: string;
  };
}

export interface FirestoreUserPreferences {
  language: string;
  timezone: string;
  currency: string;
    notifications: {
    emailNotifications?: boolean;
    eventReminders: boolean; // ... existing fields
    promotionalEmails: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    bookingConfirmations?: boolean;
    eventUpdates?: boolean;
    newsletter?: boolean;
    inApp?: boolean;
  };
  smartPreferences?: {
    favoriteCategories?: boolean;
    personalizedRecommendations?: boolean;
    autoAddCalendar?: boolean;
    autoFollowOrganizers?: boolean;
  };
}

export interface FirestoreUserSecurity {
  twoFactorEnabled: boolean;
  activeSessions: FirestoreActiveSession[];
}

export interface FirestoreActiveSession {
  id: string;
  device: string;
  location: string;
  ipAddress: string;
  lastActive: string;
  current: boolean;
}

export interface FirestoreUserPrivacy {
  profileVisibility: 'public' | 'private';
  showEmail: boolean;
  showPhone: boolean;
  showAttendedEvents?: boolean;
}

export type AccountStatus = 'active' | 'suspended' | 'deleted';

/**
 * Complete Firestore user document shape — `users/{uid}`
 */
export interface FirestoreUser {
  uid: string;
  role: AppRole;
  organizationId?: string;

  profile: FirestoreUserProfile;
  organizerInfo?: FirestoreOrganizerInfo;
  preferences: FirestoreUserPreferences;
  security: FirestoreUserSecurity;
  privacy: FirestoreUserPrivacy;

  accountStatus: AccountStatus;

  // Legacy fields kept for backward compatibility with existing auth flow
  email?: string;
  displayName?: string;
  firstName?: string | null;
  lastName?: string | null;
  photoURL?: string | null;
  phoneNumber?: string | null;
  emailVerified?: boolean;
  dob?: string | null;
  gender?: string | null;
  consents?: {
    terms?: boolean;
    marketing?: boolean;
    whatsapp?: boolean;
    liveLocation?: boolean;
  };
  isDeleted?: boolean;

  createdAt: Timestamp | FieldValue | string;
  updatedAt: Timestamp | FieldValue | string;
}

// =============================================================================
// FIRESTORE DOCUMENT TYPES — SettingInfo/platform
// =============================================================================

export interface FeatureFlags {
  userRegistration: boolean;
  eventCreation: boolean;
  iotIntegration: boolean;
  aiChatbot: boolean;
  socialLogin: boolean;
  analytics: boolean;
  referralProgram: boolean;
}

export interface PaymentGateways {
  razorpay: boolean;
  stripe: boolean;
  cashfree: boolean;
}

export interface PaymentConfig {
  platformFee: number;
  taxPercentage: number;
  payoutScheduleDays: number;
  gateways: PaymentGateways;
  webhookSecret?: string;
}

export interface SecurityPolicies {
  enforce2FA: boolean;
  sessionTimeout: number;
  passwordMinLength: number;
  requireSpecialChar: boolean;
  maxLoginAttempts: number;
  corsAllowedOrigins: string;
}

export interface SeoConfig {
  metaTitle: string;
  metaDescription: string;
  socialShareImage: string;
  googleAnalyticsId: string;
  facebookPixelId: string;
}

export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpFrom: string;
}

/**
 * Platform-level settings — `SettingInfo/platform`
 */
export interface PlatformSettings {
  platformName: string;
  logoUrl: string;
  contactEmail: string;
  supportEmail: string;
  defaultTimezone: string;
  defaultCurrency: string;
  defaultLanguage: string;
  maintenanceMode: boolean;
  announcementBanner: string;

  featureFlags: FeatureFlags;
  paymentConfig: PaymentConfig;
  securityPolicies: SecurityPolicies;
  seoConfig: SeoConfig;
  emailConfig: EmailConfig;

  updatedAt?: Timestamp | FieldValue | string;
  updatedBy?: string;
}

// =============================================================================
// FIRESTORE DOCUMENT TYPES — SettingInfo/organization_{orgId}
// =============================================================================

export interface OrgRolePermissions {
  canCreateEvent: boolean;
  canEditEvent: boolean;
  canDeleteEvent: boolean;
  canViewFinance: boolean;
  canManageAttendees: boolean;
  canManageIoT: boolean;
  canSendNotifications: boolean;
}

/**
 * Organization-level settings — `SettingInfo/organization_{orgId}`
 */
export interface OrganizationSettings {
  organizationId: string;
  organizationName: string;
  eventApprovalRequired: boolean;
  revenueSplit: number;
  enforce2FA: boolean;
  maxEvents: number;
  maxOrganizers: number;

  rolePermissions: {
    organizer: OrgRolePermissions;
  };

  updatedAt?: Timestamp | FieldValue | string;
  updatedBy?: string;
}

// =============================================================================
// DEFAULTS
// =============================================================================

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  platformName: 'FlowGateX',
  logoUrl: '',
  contactEmail: 'contact@flowgatex.com',
  supportEmail: 'support@flowgatex.com',
  defaultTimezone: 'UTC',
  defaultCurrency: 'USD',
  defaultLanguage: 'en',
  maintenanceMode: false,
  announcementBanner: '',

  featureFlags: {
    userRegistration: true,
    eventCreation: true,
    iotIntegration: false,
    aiChatbot: true,
    socialLogin: true,
    analytics: true,
    referralProgram: false,
  },
  paymentConfig: {
    platformFee: 2.5,
    taxPercentage: 18,
    payoutScheduleDays: 7,
    gateways: {
      razorpay: true,
      stripe: false,
      cashfree: false,
    },
    webhookSecret: '',
  },
  securityPolicies: {
    enforce2FA: false,
    sessionTimeout: 30,
    passwordMinLength: 8,
    requireSpecialChar: true,
    maxLoginAttempts: 5,
    corsAllowedOrigins: '*',
  },
  seoConfig: {
    metaTitle: 'FlowGateX - Event Management Platform',
    metaDescription: 'Create, manage, and discover amazing events',
    socialShareImage: '',
    googleAnalyticsId: '',
    facebookPixelId: '',
  },
  emailConfig: {
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smtpFrom: '',
  },
};

export const DEFAULT_ORG_ROLE_PERMISSIONS: OrgRolePermissions = {
  canCreateEvent: true,
  canEditEvent: true,
  canDeleteEvent: false,
  canViewFinance: false,
  canManageAttendees: true,
  canManageIoT: false,
  canSendNotifications: false,
};

export const DEFAULT_ORGANIZATION_SETTINGS: Omit<OrganizationSettings, 'organizationId' | 'organizationName'> = {
  eventApprovalRequired: false,
  revenueSplit: 80,
  enforce2FA: false,
  maxEvents: 50,
  maxOrganizers: 10,
  rolePermissions: {
    organizer: DEFAULT_ORG_ROLE_PERMISSIONS,
  },
};
