import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, Bell, Search, ChevronDown, LogIn,
  Sparkles, Command,
} from 'lucide-react';
import useAuth from '@/features/auth/hooks/useAuth';
import { UserRole } from '@/lib/constants';
import { logout } from '@/features/auth/services/authService';

import { SearchModal } from './navbar/SearchModal';
import { NotificationsDropdown, type Notification } from './navbar/NotificationsDropdown';
import { ThemeToggle } from './navbar/ThemeToggle';
import { MegaMenu } from './navbar/MegaMenu';
import { MobileMenu } from './navbar/MobileMenu';

const NAVIGATION_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Events', path: '/events' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
] as const;

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', title: 'Booking Confirmed', message: 'Your ticket for Summer Jazz Festival has been confirmed.', time: '5 min ago', read: false, type: 'success' },
  { id: '2', title: 'Event Reminder', message: 'Tech Summit 2026 starts tomorrow at 9:00 AM.', time: '1 hour ago', read: false, type: 'info' },
  { id: '3', title: 'Price Drop Alert', message: 'Early-bird pricing ends tonight for Art Expo.', time: '3 hours ago', read: true, type: 'warning' },
  { id: '4', title: 'New Event Near You', message: 'Food & Wine Festival added in your city this weekend.', time: 'Yesterday', read: true, type: 'info' },
];

// =============================================================================
// MAIN NAVBAR COMPONENT
// =============================================================================

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Auth
  const { user, isAuthenticated } = useAuth();

  // State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'auto';
    }
    return 'auto';
  });
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  // Refs
  const navRef = useRef<HTMLElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  // Computed values
  const unreadCount = notifications.filter(n => !n.read).length;

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  // Handle scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
        setIsMegaMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMegaMenuOpen(false);
  }, [location.pathname]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleThemeToggle = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [theme]);

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

  const handleMarkAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/');
    setAccountDropdownOpen(false);
  }, [navigate]);

  const toggleAccountDropdown = useCallback(() => {
    setAccountDropdownOpen((prev) => !prev);
    setIsNotificationsOpen(false);
  }, []);

  const getRoleDisplayName = useCallback(() => {
    switch (user?.role) {
      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        return 'Admin';
      case UserRole.ORGANIZER:
        return 'Organizer';
      default:
        return 'Attendee';
    }
  }, [user]);

  const getRoleBadgeClass = useCallback(() => {
    switch (user?.role) {
      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        return 'is-admin';
      case UserRole.ORGANIZER:
        return 'is-organizer';
      default:
        return 'is-user';
    }
  }, [user]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <>
      <motion.nav
        ref={navRef}
        className={`fixed z-[100] transition-all duration-300 ${isScrolled
          ? 'top-4 left-4 right-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-lg'
          : 'top-0 left-0 right-0 bg-[var(--bg-primary)] border-b border-[var(--border-primary)]'
          }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className={`mx-auto px-4 sm:px-6 ${isScrolled ? 'max-w-7xl' : 'max-w-7xl lg:px-8'}`}>
          <div className={`flex items-center justify-between ${isScrolled ? 'h-16' : 'h-16 lg:h-20'}`}>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group" aria-label="FlowGateX Home">
              <div className="relative">
                <motion.div
                  className="absolute -inset-1 bg-gradient-to-r from-[#00A3DB] to-[#A3D639] rounded-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300"
                  style={{ filter: 'blur(8px)' }}
                />
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#00A3DB] via-[#0091c4] to-[#A3D639] flex items-center justify-center shadow-lg shadow-[#00A3DB]/25 group-hover:shadow-[#00A3DB]/40 transition-all duration-300 group-hover:scale-105">
                  <span
                    className="material-symbols-outlined text-[20px] text-white font-semibold"
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" }}
                  >
                    stream
                  </span>
                </div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-[#00A3DB] to-[#A3D639] bg-clip-text text-transparent">
                FlowGateX
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {NAVIGATION_LINKS.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-xl group ${location.pathname === link.path
                    ? 'text-[#00A3DB] bg-[#00A3DB]/10'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                    }`}
                >
                  {link.label}
                  {location.pathname === link.path && (
                    <motion.span
                      layoutId="navbar-indicator"
                      className="absolute bottom-1 left-4 right-4 h-0.5 bg-gradient-to-r from-[#00A3DB] to-[#A3D639] rounded-full"
                    />
                  )}
                </Link>
              ))}

              {/* Mega Menu Trigger */}
              <div ref={megaMenuRef} className="relative">
                <button
                  onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
                  onMouseEnter={() => setIsMegaMenuOpen(true)}
                  className={`flex items-center gap-1 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-xl ${isMegaMenuOpen
                    ? 'text-[#00A3DB] bg-[#00A3DB]/10'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                    }`}
                  aria-expanded={isMegaMenuOpen}
                  aria-haspopup="true"
                >
                  Explore
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${isMegaMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-2">
              {/* Search Button */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-primary)] rounded-xl transition-all duration-200"
                aria-label="Search"
              >
                <Search size={16} />
                <span className="text-sm">Search</span>
                <kbd className="hidden xl:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-[var(--bg-card)] border border-[var(--border-primary)] rounded">
                  <Command size={10} />K
                </kbd>
              </button>

              {/* Theme Toggle */}
              <ThemeToggle isDark={theme === 'dark'} onToggle={handleThemeToggle} />

              {isAuthenticated ? (
                <>
                  {/* Notifications */}
                  <div ref={notificationsRef} className="relative">
                    <button
                      onClick={() => {
                        setIsNotificationsOpen(!isNotificationsOpen);
                        setAccountDropdownOpen(false);
                      }}
                      className="relative p-2.5 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-primary)] transition-all duration-200"
                      aria-label="Notifications"
                      aria-expanded={isNotificationsOpen}
                    >
                      <Bell size={18} className="text-[var(--text-secondary)]" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs font-bold text-white bg-[#ef4444] rounded-full">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                    <AnimatePresence>
                      {isNotificationsOpen && (
                        <NotificationsDropdown
                          notifications={notifications}
                          onClose={() => setIsNotificationsOpen(false)}
                          onMarkAllRead={handleMarkAllNotificationsRead}
                        />
                      )}
                    </AnimatePresence>
                  </div>

                  {/* User Profile + Account Dropdown */}
                  <li className="dash-header-item-right">
                    <div className="flex items-center">
                      <div className="dash-user-info desktop-only">
                        <span className="dash-user-name">
                          {user?.displayName || 'Guest User'}
                        </span>
                        <span className={`dash-role-badge ${getRoleBadgeClass()}`}>
                          {getRoleDisplayName()}
                        </span>
                      </div>

                      <div ref={accountRef} className="inline-flex relative text-start">
                        <button
                          id="hs-dnad"
                          type="button"
                          onClick={toggleAccountDropdown}
                          className="dash-account-trigger"
                          aria-haspopup="menu"
                          aria-expanded={accountDropdownOpen}
                          aria-label="User menu"
                        >
                          <img
                            className="shrink-0 size-8 rounded-full border-2 border-[var(--border-primary)]"
                            src={user?.photoURL || 'https://images.unsplash.com/photo-1659482633369-9fe69af50bfb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=3&w=320&h=320&q=80'}
                            alt={user?.displayName || 'User Avatar'}
                          />
                        </button>

                        <div
                          className={`dash-dropdown-panel is-right is-wide ${accountDropdownOpen ? 'is-open' : ''}`}
                          role="menu"
                          aria-orientation="vertical"
                          aria-labelledby="hs-dnad"
                        >
                          <div className="dash-account-info">
                            <span className="dash-account-name">
                              {user?.displayName || 'Guest User'}
                            </span>
                            <p className="dash-account-email">
                              {user?.email || 'No email'}
                            </p>
                            <span className={`dash-role-badge mt-1.5 ${getRoleBadgeClass()}`}>
                              {getRoleDisplayName()}
                            </span>
                          </div>

                          <div className="dash-theme-row">
                            <div className="flex flex-wrap justify-between items-center gap-2">
                              <span className="dash-theme-label">Theme</span>
                              <div className="dash-theme-group">
                                <button type="button" onClick={() => setTheme('light')} className={`dash-theme-btn ${theme === 'light' ? 'is-active' : ''}`}>
                                  <svg className="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 3v1" /><path d="M12 20v1" /><path d="M3 12h1" /><path d="M20 12h1" /><path d="m18.364 5.636-.707.707" /><path d="m6.343 17.657-.707.707" /><path d="m5.636 5.636.707.707" /><path d="m17.657 17.657.707.707" /></svg>
                                  <span className="sr-only">Default (Light)</span>
                                </button>
                                <button type="button" onClick={() => setTheme('dark')} className={`dash-theme-btn ${theme === 'dark' ? 'is-active-dark' : ''}`}>
                                  <svg className="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
                                  <span className="sr-only">Dark</span>
                                </button>
                                <button type="button" onClick={() => setTheme('auto')} className={`dash-theme-btn ${theme === 'auto' ? 'is-active' : ''}`}>
                                  <svg className="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2" /><line x1="8" x2="16" y1="21" y2="21" /><line x1="12" x2="12" y1="17" y2="21" /></svg>
                                  <span className="sr-only">Auto (System)</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="dash-dropdown-divider">
                            <Link className="dash-account-menu-item" to="/profile" onClick={() => setAccountDropdownOpen(false)}>
                              <svg className="shrink-0 mt-0.5 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                              Profile
                            </Link>
                            <Link className="dash-account-menu-item" to="/settings" onClick={() => setAccountDropdownOpen(false)}>
                              <svg className="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
                              Settings
                            </Link>
                            <button className="dash-account-menu-item w-full text-left" onClick={handleLogout}>
                              <svg className="shrink-0 mt-0.5 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /></svg>
                              Log out
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-2 px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium rounded-xl hover:bg-[var(--bg-hover)]"
                  >
                    <LogIn size={18} />
                    <span>Sign In</span>
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#00A3DB] to-[#007AA3] hover:from-[#007AA3] hover:to-[#00A3DB] text-white rounded-xl font-semibold shadow-lg shadow-[#00A3DB]/20 hover:shadow-[#00A3DB]/30 transition-all duration-300"
                  >
                    <Sparkles size={16} />
                    <span>Get Started</span>
                  </button>
                </>
              )}
            </div>

            {/* Mobile Actions */}
            <div className="flex lg:hidden items-center gap-2">
              <ThemeToggle isDark={theme === 'dark'} onToggle={handleThemeToggle} />
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)]"
                aria-label="Search"
              >
                <Search size={18} />
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2.5 text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl transition-colors"
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mega Menu */}
        <MegaMenu isOpen={isMegaMenuOpen} onClose={() => setIsMegaMenuOpen(false)} />
      </motion.nav>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isAuthenticated={isAuthenticated}
        currentPath={location.pathname}
        onNavigate={navigate}
        onLogout={handleLogout}
      />

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Spacer for fixed navbar */}
      <div className="h-16 lg:h-20" />
    </>
  );
}

export default Navbar;
