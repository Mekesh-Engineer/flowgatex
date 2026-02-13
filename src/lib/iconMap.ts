// =============================================================================
// ICON MAP — Maps string icon names from NAV_ITEMS to lucide-react components
// =============================================================================

import {
  LayoutDashboard, Ticket, Calendar, User, HelpCircle,
  BarChart3, Users, Settings, TrendingUp, Cpu, Server,
  Home, Info, Mail,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Ticket,
  Calendar,
  User,
  HelpCircle,
  BarChart3,
  Users,
  Settings,
  TrendingUp,
  Cpu,
  Server,
  Home,
  Info,
  Mail,
};

/**
 * Look up a lucide-react icon component by its string name.
 * Falls back to `LayoutDashboard` if the name isn't mapped.
 */
export function getIcon(name: string | undefined): LucideIcon {
  if (!name) return LayoutDashboard;
  return ICON_MAP[name] ?? LayoutDashboard;
}
