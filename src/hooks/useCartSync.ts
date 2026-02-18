import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore, useCartStore } from '@/store/zustand/stores';
import { logger } from '@/lib/logger';
import { firebaseEnabled, db } from '@/services/firebase';
import { subscribeToCart, writeCart } from '@/features/booking/services/cartService';
import type { CartItem } from '@/store/zustand/stores';

/**
 * Syncs the Zustand cart store ↔ Firestore `cart/{uid}` document in real time.
 *
 * - Subscribes to `onSnapshot` so remote changes are reflected instantly.
 * - Debounce-writes local changes back to Firestore.
 * - Skips write-back when the change originated from a snapshot (prevents loops).
 * - In mock mode or when unauthenticated: no-op.
 */
export function useCartSync() {
  const { user, isAuthenticated } = useAuthStore();
  const items = useCartStore((s) => s.items);

  // Tracks whether the latest local change came from a Firestore snapshot,
  // so we can skip writing it back and avoid infinite loops.
  const fromSnapshotRef = useRef(false);
  // Guard to ensure we don't write back before the first snapshot resolves.
  const initializedRef = useRef(false);

  // ── Real-time listener ────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user?.uid || !firebaseEnabled || !db) {
      initializedRef.current = false;
      return;
    }

    const unsubscribe = subscribeToCart(
      user.uid,
      (data) => {
        fromSnapshotRef.current = true;

        // Replace local store with the authoritative remote state
        const store = useCartStore.getState();
        const currentItems = store.items;

        store.clearCart();
        data.items.forEach((item) => {
          // Preserve addedAt timestamp; if remote doesn't have it, use current time
          const enriched: CartItem = {
            ...item,
            addedAt: (item as any).addedAt || Date.now(),
          };

          // Detect price changes from remote vs local
          const localItem = currentItems.find(
            (li) => li.eventId === item.eventId && li.tierId === item.tierId
          );
          if (localItem && localItem.price !== item.price) {
            enriched.originalPrice = localItem.price;
            logger.warn(
              `🛒 Price changed for ${item.eventTitle} ${item.tierName}: ${localItem.price} → ${item.price}`
            );
          }

          store.addItem(enriched);
        });
        
        // Update promo and totals
        if (data.promoCode || data.discountAmount) {
          store.setPromoCode(data.promoCode, data.discountAmount || 0);
        }

        initializedRef.current = true;
        logger.log('🛒 Cart updated from Firestore snapshot');
      },
      (error) => {
        logger.error('Cart real-time sync error:', error);
      }
    );

    return () => {
      unsubscribe();
      initializedRef.current = false;
    };
  }, [isAuthenticated, user?.uid]);

  // ── Debounced write-back ──────────────────────────────────────────────
  const writeBack = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const { items, promoCode, discountAmount, taxAmount, totalFinal } = useCartStore.getState();
      await writeCart(user.uid, items, promoCode, discountAmount, taxAmount, totalFinal);
    } catch (error) {
      logger.error('Cart write-back failed:', error);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!isAuthenticated || !user?.uid || !firebaseEnabled || !db || !initializedRef.current) {
      return;
    }

    // If the update came from a snapshot, don't write it back
    if (fromSnapshotRef.current) {
      fromSnapshotRef.current = false;
      return;
    }

    const timer = setTimeout(writeBack, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, isAuthenticated, user?.uid, writeBack]);
}

export default useCartSync;
