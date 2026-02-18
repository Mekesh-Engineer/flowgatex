// =============================================================================
// useSettingsSync — Real-time Firestore listener for SettingInfo
// =============================================================================
// Subscribes to `SettingInfo/platform` (and optionally org settings) on mount.
// Pushes updates into the Zustand settingsStore in real-time.
//
// Mount this ONCE in your App component (or a top-level provider).
// =============================================================================

import { useEffect, useRef } from 'react';
import { useSettingsStore } from '@/store/zustand/settingsStore';
import { useAuthStore } from '@/store/zustand/stores';
import {
  subscribePlatformSettings,
  subscribeOrganizationSettings,
} from '@/services/settingsService';
import { firebaseEnabled } from '@/services/firebase';
import { logger } from '@/lib/logger';
import type { AuthUser } from '@/features/auth/types/auth.types';

/**
 * Hook that syncs Firestore SettingInfo into Zustand in real-time.
 * Call once at app root level.
 */
export function useSettingsSync() {
  const setPlatformSettings = useSettingsStore((s) => s.setPlatformSettings);
  const setPlatformLoaded = useSettingsStore((s) => s.setPlatformLoaded);
  const setPlatformError = useSettingsStore((s) => s.setPlatformError);
  const setOrganizationSettings = useSettingsStore((s) => s.setOrganizationSettings);
  const setActiveOrgId = useSettingsStore((s) => s.setActiveOrgId);

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Track unsubscribe functions
  const unsubPlatformRef = useRef<(() => void) | null>(null);
  const unsubOrgRef = useRef<(() => void) | null>(null);
  const currentOrgIdRef = useRef<string | null>(null);

  // Subscribe to platform settings (always)
  useEffect(() => {
    if (!firebaseEnabled) {
      setPlatformLoaded(true);
      return;
    }

    try {
      unsubPlatformRef.current = subscribePlatformSettings((settings) => {
        setPlatformSettings(settings);
        logger.log('⚙️ Platform settings synced from Firestore');
      });
    } catch (error) {
      logger.error('Failed to subscribe to platform settings:', error);
      setPlatformError('Failed to load platform settings');
    }

    return () => {
      unsubPlatformRef.current?.();
      unsubPlatformRef.current = null;
    };
  }, [setPlatformSettings, setPlatformLoaded, setPlatformError]);

  // Subscribe to organization settings (when user has an org)
  useEffect(() => {
   
    // For now, we'll use a placeholder — enhanced when user doc has `organizationId`.
    const orgId = (user as AuthUser | null)?.organizationId;

    // Clean up previous org subscription if org changed
    if (currentOrgIdRef.current && currentOrgIdRef.current !== orgId) {
      unsubOrgRef.current?.();
      unsubOrgRef.current = null;
    }

    if (!firebaseEnabled || !isAuthenticated || !orgId) {
      setActiveOrgId(null);
      return;
    }

    currentOrgIdRef.current = orgId;
    setActiveOrgId(orgId);

    try {
      unsubOrgRef.current = subscribeOrganizationSettings(orgId, (settings) => {
        setOrganizationSettings(orgId, settings);
        logger.log(`⚙️ Org settings synced for ${orgId}`);
      });
    } catch (error) {
      logger.error(`Failed to subscribe to org settings for ${orgId}:`, error);
    }

    return () => {
      unsubOrgRef.current?.();
      unsubOrgRef.current = null;
    };
  }, [user, isAuthenticated, setOrganizationSettings, setActiveOrgId]);
}

export default useSettingsSync;
