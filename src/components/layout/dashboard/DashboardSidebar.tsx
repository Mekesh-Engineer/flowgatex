// =============================================================================
// DASHBOARD SIDEBAR — Role-based navigation with CSS-class styling
// =============================================================================
// Uses sidebar.css classes (dash-sidebar, dash-nav-link, etc.)
// Integrates role-conditional sub-components from ./sidebar/
// =============================================================================

import { Link, useLocation } from 'react-router-dom';
import { X, ChevronRight, LogOut, HelpCircle } from 'lucide-react';
import { UserRole } from '@/lib/constants';
import { getIcon } from '@/lib/iconMap';
import type { Theme, SidebarConfig } from './DashboardLayout.types';
import type { AuthUser } from '@/features/auth/types/auth.types';
import {
  RoleHeader,
  EventSwitcher,
  StatsWidget,
  IoTStatusWidget,
  SystemHealthWidget,
  QuickSettingsWidget,
  SystemInfoFooter,
  SidebarTooltip,
} from './sidebar';

// ── Types ────────────────────────────────────────────────────────────────────
interface NavItem {
  path: string;
  label: string;
  icon?: string;
}

interface Props {
  sidebarOpen: boolean;
  desktopSidebarOpen: boolean;
  closeSidebar: () => void;
  isCollapsed: boolean;
  userRole: string;
  user: AuthUser | null;
  isOrganizer: boolean;
  isAdmin: boolean;
  sidebarConfig: SidebarConfig;
  sidebarNavItems: NavItem[];
  theme: Theme;
  setTheme: (t: Theme) => void;
  setSidebarOpen: (v: boolean) => void;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function DashboardSidebar({
  sidebarOpen,
  desktopSidebarOpen,
  closeSidebar,
  isCollapsed,
  userRole,
  user,
  isOrganizer,
  isAdmin,
  sidebarConfig,
  sidebarNavItems,
  theme,
  setTheme,
  setSidebarOpen,
}: Props) {
  const location = useLocation();
  // Determine active state by finding the most specific matching path
  const isActive = (path: string) => {
    // Collect all valid paths from the current sidebar items
    const allPaths = sidebarNavItems.map(i => i.path);
    
    // Find all paths that match the current URL start
    const matches = allPaths.filter(p => 
      location.pathname === p || location.pathname.startsWith(p + '/')
    );
    
    // Sort by length descending (longest path is the most specific match)
    matches.sort((a, b) => b.length - a.length);
    
    // The active item is the one that matches the specific "best match"
    // If no matches (shouldn't happen for valid routes), fall back to exact match
    const bestMatch = matches[0];
    
    return path === bestMatch;
  };

  const showAdminFooter = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;

    // Build CSS class list for the sidebar container
    const sidebarClasses = [
        'dash-sidebar', // Keep for legacy compatibility if needed
        'fixed inset-y-0 left-0 z-50 w-64 bg-[var(--bg-card)] border-r border-[var(--border-primary)] transform transition-all duration-300 ease-in-out lg:static lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        desktopSidebarOpen ? 'lg:ml-0' : 'lg:-ml-64',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <>
            {/* ── Mobile overlay ─────────────────────────────────────────────── */}
            <div
                className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={closeSidebar}
            />

            {/* ── Sidebar ────────────────────────────────────────────────────── */}
            <aside className={sidebarClasses}>
                <div className="flex flex-col h-full bg-[var(--bg-card)]">

                    {/* ── Top section ──────────────────────────────────────────── */}
                    <div className="p-4 border-b border-[var(--border-primary)]">
                        <div className="flex items-center justify-between mb-4 lg:hidden">
                            <span className="text-sm font-bold text-[var(--text-muted)] px-2">Menu</span>
                            {/* Close button (mobile only) */}
                            <button
                                type="button"
                                onClick={closeSidebar}
                                className="p-1 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-colors"
                                aria-label="Close sidebar"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Role Header */}
                        <RoleHeader
                            role={userRole as UserRole}
                            user={user}
                            isCollapsed={isCollapsed}
                        />

                        {/* Event Switcher — organizer & admin only */}
                        {(isOrganizer || isAdmin) && (
                            <div className="mt-4">
                                <EventSwitcher isCollapsed={isCollapsed} />
                            </div>
                        )}
                    </div>

                    {/* ── Scrollable body ──────────────────────────────────────── */}
                    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-[var(--border-primary)] scrollbar-track-transparent">

                        {/* Navigation section */}
                        <div>
                            <span className="px-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Navigation</span>
                            <ul className="mt-2 space-y-1">
                                {sidebarNavItems.map((item) => {
                                    const Icon = getIcon(item.icon);
                                    const active = isActive(item.path);
                                    return (
                                        <li key={item.path}>
                                            <SidebarTooltip label={item.label} isCollapsed={isCollapsed}>
                                                <Link
                                                    to={item.path}
                                                    onClick={() => setSidebarOpen(false)}
                                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative group ${active
                                                            ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                                                            : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]'
                                                        }`}
                                                >
                                                    <Icon size={18} className={active ? 'text-[var(--color-primary)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'} />
                                                    {!isCollapsed && (
                                                        <span className="flex-1">{item.label}</span>
                                                    )}
                                                    {active && !isCollapsed && (
                                                        <ChevronRight size={14} className="opacity-50" />
                                                    )}
                                                </Link>
                                            </SidebarTooltip>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        {/* ── Role-conditional widgets ───────────────────────────── */}

                        {/* Stats Widget */}
                        {sidebarConfig.showStats && (
                            <div>
                                <StatsWidget isCollapsed={isCollapsed} />
                            </div>
                        )}

                        {/* IoT Status Widget — organizer/admin */}
                        {sidebarConfig.showIoT && (
                            <div>
                                <IoTStatusWidget isCollapsed={isCollapsed} />
                            </div>
                        )}

                        {/* System Health Widget — admin only */}
                        {sidebarConfig.showSystemHealth && (
                            <div>
                                <SystemHealthWidget isCollapsed={isCollapsed} />
                            </div>
                        )}

                        {/* Theme / Quick Settings */}
                        {sidebarConfig.showQuickSettings && (
                            <QuickSettingsWidget
                                theme={theme}
                                setTheme={setTheme}
                                isCollapsed={isCollapsed}
                            />
                        )}
                    </div>

                    {/* ── Footer ──────────────────────────────────────────────── */}
                    <div className="p-4 border-t border-[var(--border-primary)] bg-[var(--bg-surface)]/50">
                        <ul className="space-y-1">
                            {userRole !== UserRole.USER && (
                                <li>
                                    <Link
                                        to="/support"
                                        onClick={() => setSidebarOpen(false)}
                                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-colors"
                                    >
                                        <HelpCircle size={16} />
                                        {!isCollapsed && <span>Support</span>}
                                    </Link>
                                </li>
                            )}
                            <li>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-red-500 transition-colors"
                                >
                                    <LogOut size={16} />
                                    {!isCollapsed && <span>Sign Out</span>}
                                </button>
                            </li>
                        </ul>

                        {/* System info — admin/superadmin only */}
                        {showAdminFooter && (
                            <div className="mt-4 pt-4 border-t border-[var(--border-primary)]">
                                <SystemInfoFooter isCollapsed={isCollapsed} />
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}
