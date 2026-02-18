// =============================================================================
// MARKETING TYPES — Promo Codes, Social AI, Email Campaigns, Flyer Generator
// =============================================================================

import type { Timestamp } from 'firebase/firestore';

// ── Promo Codes ──────────────────────────────────────────────────────────────

export type PromoDiscountType = 'percentage' | 'flat';
export type PromoStatus = 'active' | 'expired' | 'paused';

export interface MarketingPromoCode {
  id: string;
  code: string;
  discountType: PromoDiscountType;
  discountValue: number;
  eventId: string;
  eventName?: string;
  tierId: string | null; // null = all tiers
  maxUses: number;
  usedCount: number;
  minOrderValue?: number;
  validFrom: Timestamp | string;
  validUntil: Timestamp | string;
  status: PromoStatus;
  createdBy: string;
  createdAt?: Timestamp | string;
  // Index signature for DataTable compatibility
  [key: string]: unknown;
}

export interface CreatePromoCodeData {
  code: string;
  discountType: PromoDiscountType;
  discountValue: number;
  eventId: string;
  tierId: string | null;
  maxUses: number;
  minOrderValue?: number;
  validFrom: string; // ISO string
  validUntil: string; // ISO string
  status: PromoStatus;
  createdBy: string;
}

export interface PromoPerformance {
  code: string;
  uses: number;
  maxUses: number;
  revenueImpact: number;
  bookingsCount: number;
  avgOrderValue: number;
  conversionLift: number;
}

// ── Social Media AI Generator ────────────────────────────────────────────────

export type SocialPlatform = 'twitter' | 'instagram' | 'linkedin' | 'facebook';
export type SocialTone = 'professional' | 'casual' | 'exciting' | 'informative' | 'urgent';
export type SocialLanguage = 'en' | 'hi' | 'es' | 'fr' | 'de' | 'ja' | 'ko' | 'pt' | 'zh' | 'ar';

export const PLATFORM_CHAR_LIMITS: Record<SocialPlatform, number> = {
  twitter: 280,
  instagram: 2200,
  linkedin: 3000,
  facebook: 63206,
};

export const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  twitter: 'Twitter / X',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
};

export const TONE_OPTIONS: { value: SocialTone; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'exciting', label: 'Exciting' },
  { value: 'informative', label: 'Informative' },
  { value: 'urgent', label: 'Urgent' },
];

export const LANGUAGE_OPTIONS: { value: SocialLanguage; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ar', label: 'Arabic' },
];

export interface SocialGenParams {
  eventId: string;
  platform: SocialPlatform;
  tone: SocialTone;
  includeHashtags: boolean;
  includeEmojis: boolean;
  customMessage?: string;
  language: SocialLanguage;
}

export interface SocialGenResult {
  generatedText: string;
  characterCount: number;
  hashtags?: string[];
}

export interface GenerationHistoryItem {
  id: string;
  text: string;
  platform: SocialPlatform;
  tone: SocialTone;
  generatedAt: Date;
}

// ── Email Campaigns ──────────────────────────────────────────────────────────

export type CampaignStatus = 'sent' | 'scheduled' | 'draft';
export type RecipientType =
  | 'all'
  | 'confirmed'
  | 'checked_in'
  | 'not_checked_in'
  | 'specific_tier'
  | 'custom';

export type EmailTemplate = 'reminder' | 'thank_you' | 'update' | 'custom';

export interface EmailCampaign {
  id: string;
  name: string;
  eventId: string;
  eventName?: string;
  organizerUid: string;
  recipientType: RecipientType;
  recipientCount: number;
  subject: string;
  templateId: EmailTemplate;
  htmlBody: string;
  status: CampaignStatus;
  scheduledAt?: Timestamp | string | null;
  sentAt?: Timestamp | string | null;
  stats: CampaignStats;
  createdAt?: Timestamp | string;
  [key: string]: unknown;
}

export interface CampaignStats {
  delivered: number;
  bounced: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
}

export interface CreateCampaignData {
  name: string;
  eventId: string;
  recipientType: RecipientType;
  tierFilter?: string;
  subject: string;
  templateId: EmailTemplate;
  htmlBody: string;
  scheduledAt?: string | null;
}

export interface CampaignDetailView extends EmailCampaign {
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

// Email template variable tokens
export const EMAIL_TEMPLATE_VARIABLES = [
  '{{attendee.firstName}}',
  '{{attendee.fullName}}',
  '{{attendee.email}}',
  '{{event.title}}',
  '{{event.date}}',
  '{{event.venue}}',
  '{{event.ticketLink}}',
  '{{ticket.id}}',
  '{{ticket.tier}}',
  '{{ticket.qrCodeUrl}}',
  '{{organizer.name}}',
  '{{organizer.email}}',
] as const;

// ── Flyer / Banner Generator ─────────────────────────────────────────────────

export type FlyerTemplate =
  | 'modern_minimalist'
  | 'bold_colorful'
  | 'corporate_professional'
  | 'music_festival'
  | 'tech_conference'
  | 'food_drink';

export type FlyerOutputFormat = 'instagram_post' | 'instagram_story' | 'print_a4' | 'twitter_banner';

export const FLYER_TEMPLATES: { id: FlyerTemplate; name: string; description: string }[] = [
  { id: 'modern_minimalist', name: 'Modern Minimalist', description: 'White background, large type' },
  { id: 'bold_colorful', name: 'Bold & Colorful', description: 'Gradient background, vibrant' },
  { id: 'corporate_professional', name: 'Corporate Professional', description: 'Dark navy, structured' },
  { id: 'music_festival', name: 'Music Festival Vibes', description: 'Neon on dark, playful' },
  { id: 'tech_conference', name: 'Tech Conference', description: 'Geometric, blue/grey' },
  { id: 'food_drink', name: 'Food & Drink Event', description: 'Warm tones, organic shapes' },
];

export const FLYER_FORMAT_OPTIONS: { value: FlyerOutputFormat; label: string; dimensions: string }[] = [
  { value: 'instagram_post', label: 'Instagram Post', dimensions: '1080×1080' },
  { value: 'instagram_story', label: 'Instagram Story', dimensions: '1080×1920' },
  { value: 'print_a4', label: 'Print A4', dimensions: '2480×3508' },
  { value: 'twitter_banner', label: 'Twitter Banner', dimensions: '1500×500' },
];

export const FLYER_FONT_OPTIONS = [
  'Poppins',
  'Montserrat',
  'Roboto',
  'Inter',
  'Playfair Display',
  'Space Grotesk',
] as const;

export interface GenerateFlyerParams {
  eventId: string;
  templateId: FlyerTemplate;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  format: FlyerOutputFormat;
  showQrCode: boolean;
}

export interface GenerateFlyerResult {
  downloadUrl: string;
  dimensions: string;
}
