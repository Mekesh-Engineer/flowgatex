import {
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { getDb } from '@/services/firebase';
import { logger } from '@/lib/logger';

const COLLECTION = 'cart';

export interface CartItemData {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventImage?: string;
  venue?: string;
  tierId: string;
  tierName: string;
  price: number;
  quantity: number;
}

export interface CartDocument {
  items: CartItemData[];
  promoCode?: string;
  discountAmount?: number;
  taxAmount?: number;
  totalFinal?: number;
  updatedAt: ReturnType<typeof serverTimestamp> | string;
}

/**
 * Write the full cart state to Firestore `cart/{uid}`.
 */
export async function writeCart(
  uid: string, 
  items: CartItemData[], 
  promoCode?: string,
  discountAmount?: number,
  taxAmount?: number,
  totalFinal?: number
): Promise<void> {
  const cartRef = doc(getDb(), COLLECTION, uid);
  await setDoc(cartRef, { 
    items, 
    promoCode: promoCode ?? null,
    discountAmount: discountAmount ?? 0,
    taxAmount: taxAmount ?? 0,
    totalFinal: totalFinal ?? 0,
    updatedAt: serverTimestamp() 
  });
  logger.log('🛒 Cart written to Firestore');
}

/**
 * Subscribe to real-time cart updates from Firestore `cart/{uid}`.
 * Returns an unsubscribe function.
 */
export function subscribeToCart(
  uid: string,
  onNext: (data: CartDocument) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const cartRef = doc(getDb(), COLLECTION, uid);

  return onSnapshot(
    cartRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as CartDocument;
        onNext(data);
      } else {
        // Document doesn't exist yet — treat as empty cart
        onNext({ items: [], updatedAt: '' });
      }
    },
    (error) => {
      logger.error('🛒 Cart snapshot error:', error);
      onError?.(error);
    }
  );
}
