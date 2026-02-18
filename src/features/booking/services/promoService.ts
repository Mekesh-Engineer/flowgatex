
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  increment,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb } from '@/services/firebase';
import { PromoCode } from '../types/promo.types';
import { logger } from '@/lib/logger';

const PROMO_COLLECTION = 'promo_codes';

// --- Management Functions (Admin/Organizer) ---


export async function getAllPromoCodes(creatorId?: string): Promise<PromoCode[]> {
  let q;
  if (creatorId) {
    q = query(
      collection(getDb(), PROMO_COLLECTION),
      where('createdBy', '==', creatorId)
      // orderBy('createdAt', 'desc') // Removed to avoid index requirements
    );
  } else {
    q = query(collection(getDb(), PROMO_COLLECTION));
  }

  const snapshot = await getDocs(q);
  const codes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromoCode));
  
  // Sort in memory to avoid missing index errors
  return codes.sort((a, b) => {
    const timeA = a.createdAt?.seconds || 0;
    const timeB = b.createdAt?.seconds || 0;
    return timeB - timeA;
  });
}

/**
 * Create a new promo code.
 */
export async function createPromoCode(data: Omit<PromoCode, 'id' | 'usedCount' | 'createdAt'>): Promise<string> {
  // Check for duplicate code
  const q = query(collection(getDb(), PROMO_COLLECTION), where('code', '==', data.code));
  const snap = await getDocs(q);
  if (!snap.empty) {
    throw new Error('Promo code already exists.');
  }

  const docRef = await addDoc(collection(getDb(), PROMO_COLLECTION), {
    ...data,
    usedCount: 0,
    createdAt: serverTimestamp(),
  });
  logger.log(`🎟️ Promo code created: ${data.code}`);
  return docRef.id;
}

/**
 * Toggle active status of a promo code.
 */
export async function togglePromoCodeStatus(id: string, isActive: boolean): Promise<void> {
  const docRef = doc(getDb(), PROMO_COLLECTION, id);
  await updateDoc(docRef, { isActive });
}

/**
 * Delete a promo code.
 */
export async function deletePromoCode(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), PROMO_COLLECTION, id));
  logger.log(`🎟️ Promo code deleted: ${id}`);
}

// --- Validation Logic ---

export async function validatePromoCode(
  code: string,
  eventId: string,
  orderTotal: number,
  userId?: string,
  tierName?: string,
): Promise<{ isValid: boolean; discountAmount: number; message?: string; promo?: PromoCode }> {
  try {
    const q = query(
      collection(getDb(), PROMO_COLLECTION),
      where('code', '==', code),
      where('isActive', '==', true)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { isValid: false, discountAmount: 0, message: 'Invalid promo code' };
    }

    const promoDoc = querySnapshot.docs[0];
    const promo = { id: promoDoc.id, ...promoDoc.data() } as PromoCode;

    const now = new Date();

    // Check validFrom
    if (promo.validFrom) {
      const validFromDate = promo.validFrom instanceof Timestamp ? promo.validFrom.toDate() : new Date(promo.validFrom);
      if (now < validFromDate) {
        return { isValid: false, discountAmount: 0, message: 'Promo code is not yet active' };
      }
    }

    // Check expiry
    const expiryDate = promo.expiryDate instanceof Timestamp ? promo.expiryDate.toDate() : new Date(promo.expiryDate);
    if (now > expiryDate) {
      return { isValid: false, discountAmount: 0, message: 'Promo code has expired' };
    }

    // Check usage limit
    if (promo.usageLimit !== undefined && promo.usedCount >= promo.usageLimit) {
      return { isValid: false, discountAmount: 0, message: 'Promo code usage limit exceeded' };
    }

    // Check per-user usage limit
    if (userId && promo.usesPerUser !== undefined && promo.usesPerUser > 0) {
      const userUsageQuery = query(
        collection(getDb(), 'promo_usage'),
        where('promoCode', '==', code),
        where('userId', '==', userId)
      );
      const userUsageSnap = await getDocs(userUsageQuery);
      if (userUsageSnap.size >= promo.usesPerUser) {
        return {
          isValid: false,
          discountAmount: 0,
          message: `You've already used this code ${promo.usesPerUser} time(s)`,
        };
      }
    }

    // Check specific events
    if (promo.scope === 'event' && promo.applicableEvents && promo.applicableEvents.length > 0 && !promo.applicableEvents.includes(eventId)) {
      return { isValid: false, discountAmount: 0, message: 'Promo code not valid for this event' };
    }

    // Check applicable tiers
    if (
      tierName &&
      promo.applicableTiers &&
      promo.applicableTiers.length > 0 &&
      !promo.applicableTiers.includes(tierName)
    ) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `Promo code not valid for ${tierName} tier`,
      };
    }

    // Check min order value
    if (promo.minOrderValue && orderTotal < promo.minOrderValue) {
      return { isValid: false, discountAmount: 0, message: `Minimum order value of ${promo.minOrderValue} required` };
    }

    // Calculate discount
    let discount = 0;
    if (promo.discountType === 'percentage') {
      discount = (orderTotal * promo.value) / 100;
      if (promo.maxDiscount) {
        discount = Math.min(discount, promo.maxDiscount);
      }
    } else if (promo.discountType === 'free_ticket') {
      // free_ticket: discount equals the value of one ticket (promo.value = price of 1 ticket)
      // The caller should pass the per-ticket price as orderTotal for this to work,
      // or we treat promo.value as a flat discount equal to ticket price
      discount = promo.value;
    } else {
      // flat discount
      discount = promo.value;
    }

    // Ensure discount doesn't exceed total
    discount = Math.min(discount, orderTotal);

    return { isValid: true, discountAmount: discount, message: 'Promo code applied!', promo };
  } catch (error) {
    console.error('Error validating promo code:', error);
    return { isValid: false, discountAmount: 0, message: 'Error validating code' };
  }
}

/**
 * Atomically increment the usedCount for a promo code after successful payment.
 * Also records per-user usage in a separate collection for per-user limits.
 */
export async function incrementPromoUsage(code: string, userId?: string): Promise<void> {
  const q = query(
    collection(getDb(), PROMO_COLLECTION),
    where('code', '==', code)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return;

  const promoDocRef = doc(getDb(), PROMO_COLLECTION, snapshot.docs[0].id);
  await updateDoc(promoDocRef, { usedCount: increment(1) });

  // Record per-user usage
  if (userId) {
    await addDoc(collection(getDb(), 'promo_usage'), {
      promoCode: code,
      userId,
      usedAt: serverTimestamp(),
    });
  }

  logger.log(`🎟️ Promo usage incremented for: ${code}`);
}
