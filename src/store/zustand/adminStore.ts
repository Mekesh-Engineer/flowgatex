// =============================================================================
// ADMIN STORE — Zustand store for Admin global state
// =============================================================================

import { create } from 'zustand';
import type {
  AdminStats,
  AdminStatDelta,
  PlatformHealthStatus,
  AuditLogEntry,
  AdminStoreState,
} from '@/types/admin.types';

const initialStats: AdminStats = {
  totalUsers: 0,
  totalEvents: 0,
  platformRevenue: 0,
  activeOrganizers: 0,
  pendingApprovals: 0,
  bookingsToday: 0,
  loading: true,
};

export const useAdminStore = create<AdminStoreState>()((set) => ({
  stats: initialStats,
  statsDelta: null,
  platformHealth: null,
  pendingApprovals: 0,
  pendingPayouts: 0,
  recentActivity: [],
  isInitialized: false,

  setStats: (stats: AdminStats) => set({ stats }),
  setStatsDelta: (delta: AdminStatDelta) => set({ statsDelta: delta }),
  setPlatformHealth: (health: PlatformHealthStatus) => set({ platformHealth: health }),
  setPendingApprovals: (count: number) => set({ pendingApprovals: count }),
  setPendingPayouts: (count: number) => set({ pendingPayouts: count }),
  setRecentActivity: (activity: AuditLogEntry[]) => set({ recentActivity: activity }),
  setInitialized: (value: boolean) => set({ isInitialized: value }),
}));
