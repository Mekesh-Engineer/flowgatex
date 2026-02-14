import { Link } from 'react-router-dom';
import {
    Menu, Search, ShoppingCart, Calendar, Command,
    Sun, Moon, Monitor,
} from 'lucide-react';
import type { Theme, Breadcrumb } from './DashboardLayout.types';
import type { AuthUser } from '@/features/auth/types/auth.types';
import NotificationDropdown from './NotificationDropdown';

interface Props {
    toggleSidebar: () => void;
    sidebarOpen: boolean;
    breadcrumbs: Breadcrumb[];
    searchInputRef: React.RefObject<HTMLInputElement>;
    searchFocused: boolean;
    setSearchFocused: (v: boolean) => void;
    isAttendee: boolean;
    isOrganizer: boolean;
    isAdmin: boolean;
    setCartModalOpen: (v: boolean) => void;
    setCalendarModalOpen: (v: boolean) => void;
    user: AuthUser | null;
    getRoleBadgeClass: () => string;
    getRoleDisplayName: () => string;
    accountRef: React.RefObject<HTMLDivElement>;
    toggleAccountDropdown: () => void;
    accountDropdownOpen: boolean;
    setAccountDropdownOpen: (v: boolean) => void;
    theme: Theme;
    setTheme: (t: Theme) => void;
}

export default function DashboardHeader({
    toggleSidebar,
    breadcrumbs,
    searchInputRef,
    searchFocused,
    setSearchFocused,
    isAttendee,
    setCartModalOpen,
    setCalendarModalOpen,
    user,
    getRoleBadgeClass,
    getRoleDisplayName,
    accountRef,
    toggleAccountDropdown,
    accountDropdownOpen,
    setAccountDropdownOpen,
    theme,
    setTheme,
}: Props) {
    const themeIcon = theme === 'dark' ? <Sun size={16} /> : theme === 'light' ? <Moon size={16} /> : <Monitor size={16} />;

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center border-b border-[var(--border-primary)] bg-[var(--bg-card)]/80 backdrop-blur-xl px-4 lg:px-6 transition-all">
            <div className="flex w-full items-center justify-between">
                {/* Left: logo + hamburger + breadcrumb */}
                <div className="flex items-center gap-3">
                    {/* FlowGateX branding */}
                    <Link to="/" className="flex items-center gap-2 group" aria-label="FlowGateX Home">
                        <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-[#00A3DB] via-[#0091c4] to-[#A3D639] flex items-center justify-center shadow-md shadow-[#00A3DB]/20 group-hover:shadow-[#00A3DB]/40 transition-all duration-300 group-hover:scale-105">
                            <span
                                className="material-symbols-outlined text-[16px] text-white font-semibold"
                                style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" }}
                            >
                                stream
                            </span>
                        </div>
                        <span className="hidden sm:inline text-base font-bold bg-gradient-to-r from-[#00A3DB] to-[#A3D639] bg-clip-text text-transparent">
                            FlowGateX
                        </span>
                    </Link>

                    {/* Sidebar toggle */}
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                        aria-label="Toggle sidebar"
                    >
                        <Menu size={18} />
                    </button>

                    {/* Breadcrumb trail (desktop) */}
                    <nav className="hidden md:flex items-center gap-1 text-sm" aria-label="Breadcrumb">
                        {breadcrumbs.map((crumb, i) => (
                            <span key={crumb.href} className="flex items-center gap-1">
                                {i > 0 && <span className="text-[var(--text-muted)] mx-1">/</span>}
                                {crumb.isLast ? (
                                    <span className="font-semibold text-[var(--text-primary)]">{crumb.label}</span>
                                ) : (
                                    <Link to={crumb.href} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition">
                                        {crumb.label}
                                    </Link>
                                )}
                            </span>
                        ))}
                    </nav>
                </div>

                {/* Center: search */}
                <div className="hidden sm:flex flex-1 max-w-md mx-4">
                    <div className={`relative w-full transition-all ${searchFocused ? 'ring-2 ring-[var(--color-primary)]/30 rounded-xl' : ''}`}>
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search..."
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setSearchFocused(false)}
                            className="w-full pl-9 pr-14 py-2 text-sm rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition"
                        />
                        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border-primary)] rounded">
                            <Command size={10} />K
                        </kbd>
                    </div>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2">
                    {/* Theme toggle */}
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'auto' : 'dark')}
                        className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                        aria-label="Toggle theme"
                    >
                        {themeIcon}
                    </button>

                    {/* Calendar */}
                    <button
                        onClick={() => setCalendarModalOpen(true)}
                        className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                        aria-label="Calendar"
                    >
                        <Calendar size={16} />
                    </button>

                    {/* Cart (attendee only) */}
                    {isAttendee && (
                        <button
                            onClick={() => setCartModalOpen(true)}
                            className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                            aria-label="Cart"
                        >
                            <ShoppingCart size={16} />
                        </button>
                    )}

                    {/* Notifications */}
                    <NotificationDropdown />

                    {/* User avatar + dropdown */}
                    <div ref={accountRef} className="relative">
                        <button
                            onClick={toggleAccountDropdown}
                            className="flex items-center gap-2 p-1 rounded-xl hover:bg-[var(--bg-surface)] transition focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                            aria-expanded={accountDropdownOpen}
                            aria-label="Account menu"
                        >
                            <img
                                src={user?.photoURL || 'https://images.unsplash.com/photo-1659482633369-9fe69af50bfb?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=3&w=320&h=320&q=80'}
                                alt={user?.displayName || 'Avatar'}
                                className="w-8 h-8 rounded-full border-2 border-[var(--border-primary)] object-cover"
                            />
                            <div className="hidden lg:block text-left">
                                <span className="text-xs font-semibold text-[var(--text-primary)] block leading-tight">
                                    {user?.displayName || 'Guest'}
                                </span>
                                <span className={`text-[10px] font-medium dash-role-badge ${getRoleBadgeClass()}`}>
                                    {getRoleDisplayName()}
                                </span>
                            </div>
                        </button>

                        {accountDropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl shadow-xl z-50 py-2">
                                <div className="px-3 py-2 border-b border-[var(--border-primary)]">
                                    <p className="text-sm font-semibold text-[var(--text-primary)]">{user?.displayName || 'Guest'}</p>
                                    <p className="text-xs text-[var(--text-muted)]">{user?.email || 'No email'}</p>
                                </div>
                                <Link
                                    to="/profile"
                                    onClick={() => setAccountDropdownOpen(false)}
                                    className="block px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] transition"
                                >
                                    Profile
                                </Link>
                                <Link
                                    to="/settings"
                                    onClick={() => setAccountDropdownOpen(false)}
                                    className="block px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] transition"
                                >
                                    Settings
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
