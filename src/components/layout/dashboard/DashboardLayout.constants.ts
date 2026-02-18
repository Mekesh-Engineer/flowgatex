import { UserRole } from '@/lib/constants';
import type { SidebarConfig } from './DashboardLayout.types';

export const SIDEBAR_CONFIG: Record<string, SidebarConfig> = {
  [UserRole.USER]: {
    showIoT: false,
    showStats: true,
    showQuickSettings: true,
    showSystemHealth: false,
  },
  [UserRole.ORGANIZER]: {
    showIoT: true,
    showStats: true,
    showQuickSettings: true,
    showSystemHealth: false,
  },
  [UserRole.ORG_ADMIN]: {
    showIoT: true,
    showStats: true,
    showQuickSettings: true,
    showSystemHealth: false,
  },
  [UserRole.ADMIN]: {
    showIoT: true,
    showStats: true,
    showQuickSettings: true,
    showSystemHealth: true,
  },
  [UserRole.SUPER_ADMIN]: {
    showIoT: true,
    showStats: true,
    showQuickSettings: true,
    showSystemHealth: true,
  },
};
