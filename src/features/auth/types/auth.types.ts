import { UserRole } from '@/lib/constants';
import type { AccountStatus } from '@/types/rbac.types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  phoneNumber?: string;
  dob?: string;
  gender?: string;
  location?: string;
  terms?: boolean;
  consents?: {
    terms?: boolean;
    marketing?: boolean;
    whatsapp?: boolean;
    liveLocation?: boolean;
  };
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  firstName?: string | null;
  lastName?: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  role: UserRole;
  emailVerified: boolean;
  dob?: string | null;
  gender?: string | null;

  // RBAC fields — synced from Firestore
  organizationId?: string;
  accountStatus?: AccountStatus;

  consents?: {
    terms?: boolean;
    marketing?: boolean;
    whatsapp?: boolean;
    liveLocation?: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
  bio?: string | null;
  organizationName?: string | null;
  organizerBio?: string | null;
  websiteUrl?: string | null;
  
  // Organizer Specific
  socials?: {
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  businessRegNumber?: string | null;
  taxId?: string | null;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  branding?: {
    brandColor?: string;
    logoUrl?: string;
    bannerUrl?: string;
  };

  preferences?: {
    language?: string;
    timezone?: string;
    currency?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
      inApp?: boolean;
      eventReminders?: boolean;
      eventUpdates?: boolean;
      promotionalEmails?: boolean;
      bookingConfirmations?: boolean;
      newsletter?: boolean;
    };
    smartPreferences?: {
      favoriteCategories?: boolean;
      personalizedRecommendations?: boolean;
      autoAddCalendar?: boolean;
      autoFollowOrganizers?: boolean;
    };
  };
  privacy?: {
    profileVisibility?: 'public' | 'private';
    showEmailToOrganizers?: boolean;
    showPhoneToOrganizers?: boolean;
    showAttendedEvents?: boolean;
  };

  // Security fields — synced from Firestore
  security?: {
    twoFactorEnabled?: boolean;
    activeSessions?: Array<{
      id: string;
      device: string;
      location: string;
      ipAddress: string;
      lastActive: string;
      current: boolean;
    }>;
  };
}

export type UpdatableUserFields = Partial<AuthUser>;

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  oobCode: string;
  newPassword: string;
}
