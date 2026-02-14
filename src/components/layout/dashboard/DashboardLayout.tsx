// =============================================================================
// DASHBOARD LAYOUT — Orchestrator
// =============================================================================
// Composes DashboardHeader, DashboardSidebar, BreadcrumbNav, and modals.
// All Preline-style classes preserved in extracted components.
// =============================================================================

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/zustand/stores';
import { NAV_ITEMS, UserRole } from '@/lib/constants';

import DashboardHeader from './DashboardHeader';
import DashboardSidebar from './DashboardSidebar';
import { MobileBreadcrumb } from './BreadcrumbNav';
import CalendarModal from './CalendarModal';
import CartModal from './CartModal';
import { SIDEBAR_CONFIG } from './DashboardLayout.constants';
import type { Theme, Breadcrumb, DashboardLayoutProps } from './DashboardLayout.types';

// =============================================================================
// COMPONENT
// =============================================================================

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // ── Auth & role-aware nav ──────────────────────────────────────────────
  const { user } = useAuthStore();
  const location = useLocation();

  const sidebarNavItems = useMemo(() => {
    switch (user?.role) {
      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        return NAV_ITEMS.admin;
      case UserRole.ORG_ADMIN:
      case UserRole.ORGANIZER:
        return NAV_ITEMS.organizer;
      default:
        return NAV_ITEMS.user;
    }
  }, [user?.role]);

  // ── Derived role helpers ────────────────────────────────────────────────
  const userRole = user?.role ?? UserRole.USER;
  const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
  const isOrganizer = userRole === UserRole.ORGANIZER || userRole === UserRole.ORG_ADMIN;
  const isAttendee = !isAdmin && !isOrganizer;
  const sidebarConfig = SIDEBAR_CONFIG[userRole] ?? SIDEBAR_CONFIG[UserRole.USER];

  const getRoleDisplayName = useCallback(() => {
    switch (userRole) {
      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        return 'Admin';
      case UserRole.ORGANIZER:
        return 'Organizer';
      default:
        return 'Attendee';
    }
  }, [userRole]);

  const getRoleBadgeClass = useCallback(() => {
    switch (userRole) {
      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        return 'is-admin';
      case UserRole.ORGANIZER:
        return 'is-organizer';
      default:
        return 'is-user';
    }
  }, [userRole]);

  // ── State ──────────────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(false);
  const [isCollapsed] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'auto';
    return (localStorage.getItem('theme') as Theme) || 'auto';
  });

  // ── Refs ────────────────────────────────────────────────────────────────
  const searchInputRef = useRef<HTMLInputElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  // ── Close dropdowns on outside click ───────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (accountRef.current && !accountRef.current.contains(target)) {
        setAccountDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Theme management ───────────────────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.add('light');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      }
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== 'auto') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      if (e.matches) root.classList.add('dark');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  // ── Close all dropdowns ────────────────────────────────────────────────
  const closeAllDropdowns = useCallback(() => {
    setAccountDropdownOpen(false);
  }, []);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeAllDropdowns();
        setSidebarOpen(false);
        setCalendarModalOpen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeAllDropdowns]);

  // ── Sidebar helpers ────────────────────────────────────────────────────
  const toggleSidebar = useCallback(() => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      setDesktopSidebarOpen((v) => !v);
    } else {
      setSidebarOpen((v) => !v);
    }
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    setDesktopSidebarOpen(false);
  }, []);

  const toggleAccountDropdown = useCallback(() => {
    setAccountDropdownOpen((v) => !v);
  }, []);

  // ── Breadcrumbs ────────────────────────────────────────────────────────
  const breadcrumbs = useMemo((): Breadcrumb[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    if (pathSegments.length === 0) return [];

    const crumbs: Breadcrumb[] = [];
    let currentPath = '';

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      const label = segment
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      const allNavItems = [...NAV_ITEMS.user, ...NAV_ITEMS.organizer, ...NAV_ITEMS.admin];
      const navItem = allNavItems.find(item => item.path === currentPath);

      crumbs.push({ label: navItem?.label || label, href: currentPath, isLast });
    });

    return crumbs;
  }, [location.pathname]);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-[var(--bg-base)] overflow-hidden">
      {/* Sidebar */}
      <DashboardSidebar
        sidebarOpen={sidebarOpen}
        desktopSidebarOpen={desktopSidebarOpen}
        closeSidebar={closeSidebar}
        isCollapsed={isCollapsed}
        userRole={userRole}
        user={user}
        isOrganizer={isOrganizer}
        isAdmin={isAdmin}
        sidebarConfig={sidebarConfig}
        sidebarNavItems={sidebarNavItems}
        theme={theme}
        setTheme={setTheme}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <DashboardHeader
          toggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
          breadcrumbs={breadcrumbs}
          searchInputRef={searchInputRef}
          searchFocused={searchFocused}
          setSearchFocused={setSearchFocused}
          isAttendee={isAttendee}
          isOrganizer={isOrganizer}
          isAdmin={isAdmin}
          setCartModalOpen={setCartModalOpen}
          setCalendarModalOpen={setCalendarModalOpen}
          user={user}
          getRoleBadgeClass={getRoleBadgeClass}
          getRoleDisplayName={getRoleDisplayName}
          accountRef={accountRef}
          toggleAccountDropdown={toggleAccountDropdown}
          accountDropdownOpen={accountDropdownOpen}
          setAccountDropdownOpen={setAccountDropdownOpen}
          theme={theme}
          setTheme={setTheme}
        />

        <div className="md:hidden">
          <MobileBreadcrumb breadcrumbs={breadcrumbs} />
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-[var(--border-primary)] scrollbar-track-transparent">
          <div className="max-w-[1600px] mx-auto w-full">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>

      <CalendarModal isOpen={calendarModalOpen} onClose={() => setCalendarModalOpen(false)} />
      <CartModal isOpen={cartModalOpen} onClose={() => setCartModalOpen(false)} />
    </div>
  );
}

