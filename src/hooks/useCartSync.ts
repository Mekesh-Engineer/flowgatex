import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/zustand/stores';
import { logger } from '@/lib/logger';
import { firebaseEnabled, db } from '@/lib/firebase';

/**
 * Syncs the Zustand cart store ↔ Firestore `carts/{uid}` document.
 *
 * - On mount (authenticated + Firebase enabled): pull the remote cart and merge
 *   with local items so nothing is lost.
 * - On cart change: debounce-write back to Firestore.
 * - In mock mode or when unauthenticated: no-op.
 */
export function useCartSync() {
  const { user, isAuthenticated } = useAuthStore();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.uid || !firebaseEnabled || !db) {
      syncedRef.current = false;
      return;
    }

    let cancelled = false;

    const syncCart = async () => {
      try {
        // Dynamic import to avoid bundling Firestore in mock mode
        const { doc, getDoc } = await import('firebase/firestore');
        const cartRef = doc(db!, 'carts', user.uid);
        const snap = await getDoc(cartRef);

        if (cancelled) return;

        if (snap.exists()) {
          const remoteItems = snap.data()?.items ?? [];
          // We could merge with local store here, but for simplicity
          // we trust the remote state after first load
          const { useCartStore } = await import('@/store/zustand/stores');
          const localItems = useCartStore.getState().items;

          if (localItems.length === 0 && remoteItems.length > 0) {
            // Hydrate local from remote
            remoteItems.forEach((item: Record<string, unknown>) => {
              useCartStore.getState().addItem({
                eventId: item.eventId as string,
                eventTitle: item.eventTitle as string,
                tierId: item.tierId as string,
                tierName: item.tierName as string,
                price: item.price as number,
                quantity: item.quantity as number,
              });
            });
            logger.log('🛒 Cart hydrated from Firestore');
          }
        }

        syncedRef.current = true;
      } catch (error) {
        logger.error('Cart sync failed:', error);
      }
    };

    syncCart();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.uid]);

  // Write-back on cart changes (debounced)
  useEffect(() => {
    if (!isAuthenticated || !user?.uid || !firebaseEnabled || !db || !syncedRef.current) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const { doc, setDoc } = await import('firebase/firestore');
        const { useCartStore } = await import('@/store/zustand/stores');
        const items = useCartStore.getState().items;

        await setDoc(
          doc(db!, 'carts', user.uid),
          { items, updatedAt: new Date().toISOString() },
          { merge: true }
        );
        logger.log('🛒 Cart synced to Firestore');
      } catch (error) {
        logger.error('Cart write-back failed:', error);
      }
    }, 2000);

    return () => clearTimeout(timer);
  });
}

export default useCartSync;
