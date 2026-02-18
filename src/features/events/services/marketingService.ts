// =============================================================================
// MARKETING SERVICE — Firebase + Cloud Functions for Marketing Tools
// =============================================================================

import {
  collection,
  doc,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getDb, getFunctionsInstance } from '@/services/firebase';
import { logger } from '@/lib/logger';
import type {
  MarketingPromoCode,
  CreatePromoCodeData,
  SocialGenParams,
  SocialGenResult,
  EmailCampaign,
  CreateCampaignData,
  GenerateFlyerParams,
  GenerateFlyerResult,
} from '@/features/events/types/marketing.types';

const PROMO_COLLECTION = 'promo_codes';
const CAMPAIGNS_COLLECTION = 'email_campaigns';

// =============================================================================
// PROMO CODE MANAGEMENT
// =============================================================================

/**
 * Fetch all promo codes created by this organizer,
 * optionally filtered by eventId.
 */
export async function getOrganizerPromoCodes(
  organizerId: string,
  eventId?: string,
): Promise<MarketingPromoCode[]> {
  const db = getDb();
  const constraints = [where('createdBy', '==', organizerId)];
  if (eventId) constraints.push(where('eventId', '==', eventId));

  const q = query(collection(db, PROMO_COLLECTION), ...constraints);
  const snapshot = await getDocs(q);

  const codes = snapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as MarketingPromoCode,
  );

  // Sort in memory to avoid composite-index issues
  return codes.sort((a, b) => {
    const tA = typeof a.createdAt === 'object' && a.createdAt?.seconds ? a.createdAt.seconds : 0;
    const tB = typeof b.createdAt === 'object' && b.createdAt?.seconds ? b.createdAt.seconds : 0;
    return tB - tA;
  });
}

/**
 * Check if a promo code string is already taken.
 */
export async function isPromoCodeUnique(code: string): Promise<boolean> {
  const q = query(collection(getDb(), PROMO_COLLECTION), where('code', '==', code));
  const snap = await getDocs(q);
  return snap.empty;
}

/**
 * Create a new promo code.
 */
export async function createMarketingPromoCode(
  data: CreatePromoCodeData,
): Promise<string> {
  const isUnique = await isPromoCodeUnique(data.code);
  if (!isUnique) throw new Error('Promo code already exists.');

  const docRef = await addDoc(collection(getDb(), PROMO_COLLECTION), {
    ...data,
    usedCount: 0,
    validFrom: Timestamp.fromDate(new Date(data.validFrom)),
    validUntil: Timestamp.fromDate(new Date(data.validUntil)),
    createdAt: serverTimestamp(),
  });
  logger.log(`🏷️ Marketing promo code created: ${data.code}`);
  return docRef.id;
}

/**
 * Update an existing promo code (partial).
 */
export async function updateMarketingPromoCode(
  id: string,
  updates: Partial<MarketingPromoCode>,
): Promise<void> {
  const docRef = doc(getDb(), PROMO_COLLECTION, id);
  // Convert date strings to Timestamps if provided
  const payload: Record<string, unknown> = { ...updates };
  if (typeof updates.validFrom === 'string') {
    payload.validFrom = Timestamp.fromDate(new Date(updates.validFrom as string));
  }
  if (typeof updates.validUntil === 'string') {
    payload.validUntil = Timestamp.fromDate(new Date(updates.validUntil as string));
  }
  await updateDoc(docRef, payload);
  logger.log(`🏷️ Promo code updated: ${id}`);
}

/**
 * Toggle promo code status (active ↔ paused).
 */
export async function togglePromoStatus(
  id: string,
  status: 'active' | 'paused',
): Promise<void> {
  await updateDoc(doc(getDb(), PROMO_COLLECTION, id), { status });
}

/**
 * Delete a promo code (only if usedCount === 0).
 */
export async function deleteMarketingPromoCode(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), PROMO_COLLECTION, id));
  logger.log(`🏷️ Promo code deleted: ${id}`);
}

/**
 * Auto-generate a unique 8-char alphanumeric code.
 */
export function generateRandomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// =============================================================================
// SOCIAL MEDIA AI GENERATOR (Cloud Function)
// =============================================================================

/**
 * Call Cloud Function to generate AI social media post.
 */
export async function generateSocialPost(
  params: SocialGenParams,
): Promise<SocialGenResult> {
  const functions = getFunctionsInstance();
  const fn = httpsCallable<SocialGenParams, SocialGenResult>(
    functions,
    'generateSocialPost',
  );
  const result = await fn(params);
  logger.log(`🤖 Social post generated for event: ${params.eventId}`);
  return result.data;
}

// =============================================================================
// EMAIL CAMPAIGNS
// =============================================================================

/**
 * Fetch all email campaigns for this organizer.
 */
export async function getOrganizerCampaigns(
  organizerId: string,
  eventId?: string,
): Promise<EmailCampaign[]> {
  const db = getDb();
  const constraints = [where('organizerUid', '==', organizerId)];
  if (eventId) constraints.push(where('eventId', '==', eventId));

  const q = query(collection(db, CAMPAIGNS_COLLECTION), ...constraints);
  const snapshot = await getDocs(q);

  const campaigns = snapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as EmailCampaign,
  );

  return campaigns.sort((a, b) => {
    const tA = typeof a.createdAt === 'object' && (a.createdAt as any)?.seconds ? (a.createdAt as any).seconds : 0;
    const tB = typeof b.createdAt === 'object' && (b.createdAt as any)?.seconds ? (b.createdAt as any).seconds : 0;
    return tB - tA;
  });
}

/**
 * Create and optionally send an email campaign via Cloud Function.
 */
export async function createEmailCampaign(
  data: CreateCampaignData,
  organizerUid: string,
): Promise<string> {
  const functions = getFunctionsInstance();
  const fn = httpsCallable<
    CreateCampaignData & { organizerUid: string },
    { campaignId: string; status: string }
  >(functions, 'createEmailCampaign');

  const result = await fn({ ...data, organizerUid });
  logger.log(`📧 Email campaign created: ${result.data.campaignId}`);
  return result.data.campaignId;
}

/**
 * Send a test email for a campaign.
 */
export async function sendTestEmail(
  campaignId: string,
  testEmail: string,
): Promise<boolean> {
  const functions = getFunctionsInstance();
  const fn = httpsCallable<
    { campaignId: string; testEmail: string },
    { sent: boolean }
  >(functions, 'sendTestEmail');

  const result = await fn({ campaignId, testEmail });
  return result.data.sent;
}

/**
 * Resend campaign to non-openers.
 */
export async function resendToNonOpeners(campaignId: string): Promise<void> {
  const functions = getFunctionsInstance();
  const fn = httpsCallable<{ campaignId: string }, { success: boolean }>(
    functions,
    'resendToNonOpeners',
  );
  await fn({ campaignId });
  logger.log(`📧 Resent to non-openers: ${campaignId}`);
}

// =============================================================================
// FLYER / BANNER GENERATOR (Cloud Function)
// =============================================================================

/**
 * Generate a flyer/banner via Cloud Function (server-side rendering).
 */
export async function generateFlyer(
  params: GenerateFlyerParams,
): Promise<GenerateFlyerResult> {
  const functions = getFunctionsInstance();
  const fn = httpsCallable<GenerateFlyerParams, GenerateFlyerResult>(
    functions,
    'generateFlyer',
  );
  const result = await fn(params);
  logger.log(`🎨 Flyer generated for event: ${params.eventId}`);
  return result.data;
}
