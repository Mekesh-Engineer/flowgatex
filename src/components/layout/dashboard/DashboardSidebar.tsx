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
  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const showAdminFooter = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;

  // Build CSS class list for the sidebar container
  const sidebarClasses = [
    'dash-sidebar',
    sidebarOpen && 'is-mobile-open',
    desktopSidebarOpen && 'is-desktop-open',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {/* ── Mobile overlay ─────────────────────────────────────────────── */}
      <div
        className={`dash-sidebar-overlay ${sidebarOpen ? 'is-visible' : ''}`}
        onClick={closeSidebar}
      />

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside className={sidebarClasses}>
        <div className="dash-sidebar-inner">

          {/* ── Top section ──────────────────────────────────────────── */}
          <div className="dash-sidebar-top">
            <div className="dash-sidebar-toolbar">
              

              {/* Close button (mobile only, via CSS) */}
              <button
                type="button"
                onClick={closeSidebar}
                className="dash-sidebar-close"
                aria-label="Close sidebar"
              >
                <X size={16} />
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
              <EventSwitcher isCollapsed={isCollapsed} />
            )}
          </div>

          {/* ── Scrollable body ──────────────────────────────────────── */}
          <div className="dash-sidebar-body">

            {/* Navigation section */}
            <div className="dash-nav-section">
              <span className="dash-nav-section-label">Navigation</span>
              <ul className="dash-nav-list">
                {sidebarNavItems.map((item) => {
                  const Icon = getIcon(item.icon);
                  const active = isActive(item.path);
                  return (
                    <li key={item.path}>
                      <SidebarTooltip label={item.label} isCollapsed={isCollapsed}>
                        <Link
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={`dash-nav-link ${active ? 'is-active' : ''}`}
                        >
                          <Icon size={18} />
                          {!isCollapsed && (
                            <span className="dash-nav-link-label">{item.label}</span>
                          )}
                          {active && !isCollapsed && (
                            <ChevronRight size={14} style={{ opacity: 0.5 }} />
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
              <div className="dash-nav-section">
                <StatsWidget isCollapsed={isCollapsed} />
              </div>
            )}

            {/* IoT Status Widget — organizer/admin */}
            {sidebarConfig.showIoT && (
              <div className="dash-nav-section">
                <IoTStatusWidget isCollapsed={isCollapsed} />
              </div>
            )}

            {/* System Health Widget — admin only */}
            {sidebarConfig.showSystemHealth && (
              <div className="dash-nav-section">
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
          <div className="dash-sidebar-footer">
            <ul className="dash-sidebar-footer-list">
              <li>
                <Link
                  to="/support"
                  onClick={() => setSidebarOpen(false)}
                  className="dash-sidebar-footer-link"
                >
                  <HelpCircle size={16} />
                  {!isCollapsed && <span>Support</span>}
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  className="dash-sidebar-footer-link"
                  style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%' }}
                >
                  <LogOut size={16} />
                  {!isCollapsed && <span>Sign Out</span>}
                </button>
              </li>
            </ul>

            {/* System info — admin/superadmin only */}
            {showAdminFooter && (
              <SystemInfoFooter isCollapsed={isCollapsed} />
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
