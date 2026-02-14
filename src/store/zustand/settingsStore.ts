// =============================================================================
// SETTINGS STORE — Zustand store for SettingInfo (Platform & Org settings)
// =============================================================================
// Real-time synced from Firestore `SettingInfo/platform` and
// `SettingInfo/organization_{orgId}`.
// =============================================================================

import { create } from 'zustand';
import type {
  PlatformSettings,
  OrganizationSettings,
} from '@/types/rbac.types';
import { DEFAULT_PLATFORM_SETTINGS } from '@/types/rbac.types';

interface SettingsState {
  // Platform settings
  platform: PlatformSettings;
  platformLoaded: boolean;
  platformError: string | null;

  // Organization settings (keyed by orgId)
  organizations: Record<string, OrganizationSettings>;
  activeOrgId: string | null;

  // Actions
  setPlatformSettings: (settings: PlatformSettings) => void;
  setPlatformLoaded: (loaded: boolean) => void;
  setPlatformError: (error: string | null) => void;

  setOrganizationSettings: (orgId: string, settings: OrganizationSettings) => void;
  setActiveOrgId: (orgId: string | null) => void;

  // Computed getters
  getActiveOrgSettings: () => OrganizationSettings | null;
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  platform: { ...DEFAULT_PLATFORM_SETTINGS },
  platformLoaded: false,
  platformError: null,

  organizations: {},
  activeOrgId: null,

  setPlatformSettings: (settings) =>
    set({ platform: settings, platformLoaded: true, platformError: null }),

  setPlatformLoaded: (loaded) => set({ platformLoaded: loaded }),

  setPlatformError: (error) => set({ platformError: error, platformLoaded: true }),

  setOrganizationSettings: (orgId, settings) =>
    set((state) => ({
      organizations: { ...state.organizations, [orgId]: settings },
    })),

  setActiveOrgId: (orgId) => set({ activeOrgId: orgId }),

  getActiveOrgSettings: () => {
    const { activeOrgId, organizations } = get();
    if (!activeOrgId) return null;
    return organizations[activeOrgId] ?? null;
  },
}));
