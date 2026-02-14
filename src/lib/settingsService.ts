// =============================================================================
// SETTINGS SERVICE — Firestore SettingInfo Collection CRUD
// =============================================================================
// Handles all reads/writes to the `SettingInfo` collection in Firestore.
// - Platform settings: `SettingInfo/platform`
// - Organization settings: `SettingInfo/organization_{orgId}`
// =============================================================================

import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, firebaseEnabled } from '@/lib/firebase';
import { logger } from '@/lib/logger';
import type {
  PlatformSettings,
  OrganizationSettings,
} from '@/types/rbac.types';
import {
  DEFAULT_PLATFORM_SETTINGS,
  DEFAULT_ORGANIZATION_SETTINGS,
} from '@/types/rbac.types';

// =============================================================================
// GUARDS
// =============================================================================

const requireFirestore = () => {
  if (!firebaseEnabled || !db) {
    throw {
      code: 'firebase/not-configured',
      message: 'Firestore is not configured.',
    };
  }
};

// =============================================================================
// PLATFORM SETTINGS
// =============================================================================

/**
 * Fetch platform settings from `SettingInfo/platform`.
 * Returns defaults if the document does not exist.
 */
export async function getPlatformSettings(): Promise<PlatformSettings> {
  requireFirestore();

  try {
    const snap = await getDoc(doc(db!, 'SettingInfo', 'platform'));

    if (snap.exists()) {
      const data = snap.data() as Partial<PlatformSettings>;
      // Deep-merge with defaults so new keys are always present
      return deepMerge(DEFAULT_PLATFORM_SETTINGS, data) as PlatformSettings;
    }

    logger.warn('SettingInfo/platform not found — using defaults.');
    return { ...DEFAULT_PLATFORM_SETTINGS };
  } catch (error) {
    logger.error('Failed to fetch platform settings:', error);
    return { ...DEFAULT_PLATFORM_SETTINGS };
  }
}

/**
 * Subscribe to real-time updates on `SettingInfo/platform`.
 * Returns an unsubscribe function.
 */
export function subscribePlatformSettings(
  callback: (settings: PlatformSettings) => void,
): () => void {
  requireFirestore();

  return onSnapshot(
    doc(db!, 'SettingInfo', 'platform'),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Partial<PlatformSettings>;
        callback(deepMerge(DEFAULT_PLATFORM_SETTINGS, data) as PlatformSettings);
      } else {
        callback({ ...DEFAULT_PLATFORM_SETTINGS });
      }
    },
    (error) => {
      logger.error('Platform settings listener error:', error);
      callback({ ...DEFAULT_PLATFORM_SETTINGS });
    },
  );
}

/**
 * Save platform settings to `SettingInfo/platform`.
 * Requires admin or super_admin role (validated by Firestore rules).
 */
export async function savePlatformSettings(
  settings: Partial<PlatformSettings>,
): Promise<void> {
  requireFirestore();

  const settingsRef = doc(db!, 'SettingInfo', 'platform');
  await setDoc(
    settingsRef,
    {
      ...settings,
      updatedAt: serverTimestamp(),
      updatedBy: auth?.currentUser?.uid ?? 'unknown',
    },
    { merge: true },
  );

  logger.log('⚙️ Platform settings saved to SettingInfo/platform');
}

// =============================================================================
// ORGANIZATION SETTINGS
// =============================================================================

/**
 * Fetch organization settings from `SettingInfo/organization_{orgId}`.
 * Returns defaults if not found.
 */
export async function getOrganizationSettings(
  orgId: string,
): Promise<OrganizationSettings> {
  requireFirestore();

  try {
    const snap = await getDoc(doc(db!, 'SettingInfo', `organization_${orgId}`));

    if (snap.exists()) {
      const data = snap.data() as Partial<OrganizationSettings>;
      return deepMerge(
        { ...DEFAULT_ORGANIZATION_SETTINGS, organizationId: orgId, organizationName: '' },
        data,
      ) as OrganizationSettings;
    }

    return {
      ...DEFAULT_ORGANIZATION_SETTINGS,
      organizationId: orgId,
      organizationName: '',
    } as OrganizationSettings;
  } catch (error) {
    logger.error(`Failed to fetch org settings for ${orgId}:`, error);
    return {
      ...DEFAULT_ORGANIZATION_SETTINGS,
      organizationId: orgId,
      organizationName: '',
    } as OrganizationSettings;
  }
}

/**
 * Subscribe to real-time updates on organization settings.
 */
export function subscribeOrganizationSettings(
  orgId: string,
  callback: (settings: OrganizationSettings) => void,
): () => void {
  requireFirestore();

  return onSnapshot(
    doc(db!, 'SettingInfo', `organization_${orgId}`),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Partial<OrganizationSettings>;
        callback(
          deepMerge(
            { ...DEFAULT_ORGANIZATION_SETTINGS, organizationId: orgId, organizationName: '' },
            data,
          ) as OrganizationSettings,
        );
      } else {
        callback({
          ...DEFAULT_ORGANIZATION_SETTINGS,
          organizationId: orgId,
          organizationName: '',
        } as OrganizationSettings);
      }
    },
    (error) => {
      logger.error(`Org settings listener error for ${orgId}:`, error);
      callback({
        ...DEFAULT_ORGANIZATION_SETTINGS,
        organizationId: orgId,
        organizationName: '',
      } as OrganizationSettings);
    },
  );
}

/**
 * Save organization settings to `SettingInfo/organization_{orgId}`.
 * Requires org_admin, admin, or super_admin role.
 */
export async function saveOrganizationSettings(
  orgId: string,
  settings: Partial<OrganizationSettings>,
): Promise<void> {
  requireFirestore();

  const settingsRef = doc(db!, 'SettingInfo', `organization_${orgId}`);
  await setDoc(
    settingsRef,
    {
      ...settings,
      organizationId: orgId,
      updatedAt: serverTimestamp(),
      updatedBy: auth?.currentUser?.uid ?? 'unknown',
    },
    { merge: true },
  );

  logger.log(`⚙️ Org settings saved for ${orgId}`);
}

// =============================================================================
// UTILITY
// =============================================================================

/**
 * Deep merge two objects. `source` overrides `target` for overlapping keys.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const output = { ...target };

  for (const key of Object.keys(source) as Array<keyof T>) {
    const sourceVal = source[key];
    const targetVal = target[key];

    if (
      sourceVal &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      targetVal &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      (output as Record<string, unknown>)[key as string] = deepMerge(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        targetVal as Record<string, any>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sourceVal as Record<string, any>,
      );
    } else if (sourceVal !== undefined) {
      (output as Record<string, unknown>)[key as string] = sourceVal;
    }
  }

  return output;
}
