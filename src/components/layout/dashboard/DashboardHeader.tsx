import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu, Search, ShoppingCart, Calendar, Command,
    Sun, Moon, Monitor, Clock,
    Tag, ArrowRight, X
} from 'lucide-react';
import type { Theme, Breadcrumb } from './DashboardLayout.types';
import type { AuthUser } from '@/features/auth/types/auth.types';
import { useCart } from '@/features/booking/hooks/useCart';
import NotificationDropdown from './NotificationDropdown';

interface Props {
    toggleSidebar: () => void;
    sidebarOpen: boolean;
    breadcrumbs: Breadcrumb[];
    searchInputRef: React.RefObject<HTMLInputElement | null>;
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
    accountRef: React.RefObject<HTMLDivElement | null>;
    toggleAccountDropdown: () => void;
    accountDropdownOpen: boolean;
    setAccountDropdownOpen: (v: boolean) => void;
    theme: Theme;
    setTheme: (t: Theme) => void;
}

// Mock search results - In production, this would come from an API
const mockSearchResults = [
    {
        id: '1',
        type: 'event',
        title: 'Summer Music Festival 2026',
        category: 'Music',
        date: 'Jun 15, 2026',
        location: 'Central Park, NY',
        image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=100&h=100&fit=crop'
    },
    {
        id: '2',
        type: 'event',
        title: 'Tech Innovation Summit',
        category: 'Technology',
        date: 'Jul 20, 2026',
        location: 'Silicon Valley, CA',
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=100&h=100&fit=crop'
    },
    {
        id: '3',
        type: 'event',
        title: 'Art & Design Expo',
        category: 'Art',
        date: 'Aug 5, 2026',
        location: 'Brooklyn, NY',
        image: 'https://images.unsplash.com/photo-1482443462550-d2c99314ab6a?w=100&h=100&fit=crop'
    },
];

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
    const { totalItems } = useCart();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<typeof mockSearchResults>([]);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);

    // Theme icon with smooth transitions
    const themeIcon = theme === 'dark' ? <Sun size={16} /> : theme === 'light' ? <Moon size={16} /> : <Monitor size={16} />;

    // Simulate real-time search
    useEffect(() => {
        if (searchQuery.trim().length > 0) {
            // Simulate API delay
            const timer: number = window.setTimeout(() => {
                const filtered = mockSearchResults.filter(result =>
                    result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    result.category.toLowerCase().includes(searchQuery.toLowerCase())
                );
                setSearchResults(filtered);
                setShowSearchDropdown(true);
            }, 200);
            return () => window.clearTimeout(timer);
        }
        // Clear results when search is empty — use timeout to avoid synchronous setState
        const clearTimer: number = window.setTimeout(() => {
            setSearchResults([]);
            setShowSearchDropdown(false);
        }, 0);
        return () => window.clearTimeout(clearTimer);
    }, [searchQuery]);

    const handleSearchFocus = () => {
        setSearchFocused(true);
        if (searchQuery.trim().length > 0) {
            setShowSearchDropdown(true);
        }
    };

    const handleSearchBlur = () => {
        // Delay to allow click on results
        setTimeout(() => {
            setSearchFocused(false);
            setShowSearchDropdown(false);
        }, 200);
    };

    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setShowSearchDropdown(false);
    };

    const cycleTheme = () => {
        const nextTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'auto' : 'dark';
        setTheme(nextTheme);
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center border-b border-[var(--border-primary)] bg-[var(--bg-card)]/95 backdrop-blur-xl px-4 lg:px-6 transition-all">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)]/5 via-transparent to-[var(--color-secondary)]/5 pointer-events-none" />

            <div className="flex w-full items-center justify-between relative z-10">
                {/* Left: logo + hamburger + breadcrumb */}
                <div className="flex items-center gap-3">
                    {/* FlowGateX branding with enhanced animation */}
                    <Link to="/" className="flex items-center gap-2 group" aria-label="FlowGateX Home">
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                            className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 via-[#0091c4] to-secondary-500 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-all duration-300"
                        >
                            <span
                                className="material-symbols-outlined material-symbols-filled text-[16px] text-white font-semibold"
                            >
                                stream
                            </span>

                            {/* Floating particle effect */}
                            <motion.div
                                className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-secondary-500"
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.5, 1, 0.5],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />
                        </motion.div>
                        <span className="hidden sm:inline text-base font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                            FlowGateX
                        </span>
                    </Link>

                    {/* Sidebar toggle with enhanced hover */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleSidebar}
                        className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] hover:border hover:border-[var(--border-primary)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                        aria-label="Toggle sidebar"
                    >
                        <Menu size={18} />
                    </motion.button>

                    {/* Breadcrumb trail with animations */}
                    <nav className="hidden md:flex items-center gap-1 text-sm" aria-label="Breadcrumb">
                        {breadcrumbs.map((crumb, i) => (
                            <motion.span
                                key={crumb.href}
                                className="flex items-center gap-1"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                {i > 0 && <span className="text-[var(--text-muted)] mx-1">/</span>}
                                {crumb.isLast ? (
                                    <span className="font-semibold text-[var(--text-primary)] px-2 py-1 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-primary)]">
                                        {crumb.label}
                                    </span>
                                ) : (
                                    <Link
                                        to={crumb.href}
                                        className="text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] px-2 py-1 rounded-lg transition-all duration-200"
                                    >
                                        {crumb.label}
                                    </Link>
                                )}
                            </motion.span>
                        ))}
                    </nav>
                </div>

                {/* Center: Enhanced search with real-time results */}
                <div className="hidden sm:flex flex-1 max-w-md mx-4 relative">
                    <motion.div
                        className={`relative w-full transition-all duration-300 ${searchFocused ? 'scale-105' : ''}`}
                        animate={searchFocused ? {
                            boxShadow: '0 0 0 3px rgba(0, 163, 219, 0.1)'
                        } : {}}
                    >
                        <div className={`relative w-full rounded-xl border transition-all duration-300 ${searchFocused
                            ? 'border-[var(--color-primary)] bg-[var(--bg-card)] shadow-lg shadow-[var(--color-primary)]/10'
                            : 'border-[var(--border-primary)] bg-[var(--bg-surface)]'
                            }`}>
                            <Search
                                size={16}
                                className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${searchFocused ? 'text-[var(--color-primary)]' : 'text-[var(--text-muted)]'
                                    }`}
                            />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search events, categories..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={handleSearchFocus}
                                onBlur={handleSearchBlur}
                                className="w-full pl-9 pr-20 py-2.5 text-sm rounded-xl bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition"
                            />

                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                {searchQuery && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        onClick={clearSearch}
                                        className="p-1 rounded-md hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                        aria-label="Clear search"
                                    >
                                        <X size={14} />
                                    </motion.button>
                                )}
                                <kbd className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded">
                                    <Command size={10} />K
                                </kbd>
                            </div>
                        </div>

                        {/* Search Results Dropdown */}
                        <AnimatePresence>
                            {showSearchDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl shadow-2xl overflow-hidden z-50"
                                >
                                    {searchResults.length > 0 ? (
                                        <div className="max-h-96 overflow-y-auto">
                                            <div className="px-3 py-2 border-b border-[var(--border-primary)] bg-[var(--bg-surface)]">
                                                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                                                    Search Results ({searchResults.length})
                                                </p>
                                            </div>
                                            {searchResults.map((result, index) => (
                                                <motion.div
                                                    key={result.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                >
                                                    <Link
                                                        to={`/events/${result.id}`}
                                                        className="flex items-center gap-3 px-3 py-3 hover:bg-[var(--bg-surface)] transition-colors duration-150 group"
                                                    >
                                                        <img
                                                            src={result.image}
                                                            alt={result.title}
                                                            className="w-12 h-12 rounded-lg object-cover border border-[var(--border-primary)] group-hover:scale-105 transition-transform duration-200"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                                                                {result.title}
                                                            </p>
                                                            <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-muted)]">
                                                                <span className="flex items-center gap-1">
                                                                    <Tag size={12} />
                                                                    {result.category}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Clock size={12} />
                                                                    {result.date}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <ArrowRight size={16} className="text-[var(--text-muted)] group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all" />
                                                    </Link>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="px-4 py-8 text-center">
                                            <div className="w-12 h-12 rounded-full bg-[var(--bg-surface)] mx-auto mb-3 flex items-center justify-center">
                                                <Search size={20} className="text-[var(--text-muted)]" />
                                            </div>
                                            <p className="text-sm font-medium text-[var(--text-primary)] mb-1">No results found</p>
                                            <p className="text-xs text-[var(--text-muted)]">Try adjusting your search</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* Right: Enhanced action buttons */}
                <div className="flex items-center gap-2">
                    {/* Theme toggle with rotation animation */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9, rotate: 180 }}
                        onClick={cycleTheme}
                        className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] hover:border hover:border-[var(--border-primary)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 relative group"
                        aria-label="Toggle theme"
                    >
                        {themeIcon}
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                            {theme === 'dark' ? 'Light' : theme === 'light' ? 'Auto' : 'Dark'}
                        </span>
                    </motion.button>

                    {/* Calendar with pulse effect */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setCalendarModalOpen(true)}
                        className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] hover:border hover:border-[var(--border-primary)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 relative group"
                        aria-label="Calendar"
                    >
                        <Calendar size={16} />
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                            Calendar
                        </span>
                    </motion.button>

                    {/* Cart with badge animation (attendee only) */}
                    {isAttendee && (
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setCartModalOpen(true)}
                            className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] hover:border hover:border-[var(--border-primary)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 relative group"
                            aria-label="Cart"
                        >
                            <ShoppingCart size={16} />
                            {/* Cart badge */}
                            {totalItems > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--color-secondary)] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg"
                                >
                                    {totalItems}
                                </motion.span>
                            )}
                            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                                Cart
                            </span>
                        </motion.button>
                    )}

                    {/* Notifications */}
                    <NotificationDropdown />

                    {/* User avatar + dropdown with enhanced animation */}
                    <div ref={accountRef} className="relative">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={toggleAccountDropdown}
                            className="flex items-center gap-2 p-1 pr-3 rounded-xl hover:bg-[var(--bg-surface)] hover:border hover:border-[var(--border-primary)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                            aria-expanded={accountDropdownOpen}
                            aria-label="Account menu"
                        >
                            <div className="relative">
                                <img
                                    src={user?.photoURL || 'https://images.unsplash.com/photo-1659482633369-9fe69af50bfb?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=3&w=320&h=320&q=80'}
                                    alt={user?.displayName || 'Avatar'}
                                    className="w-8 h-8 rounded-full border-2 border-[var(--border-primary)] object-cover"
                                />
                                {/* Online indicator */}
                                <motion.span
                                    animate={{
                                        scale: [1, 1.2, 1],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[var(--color-success)] border-2 border-[var(--bg-card)] rounded-full"
                                />
                            </div>
                            <div className="hidden lg:block text-left">
                                <span className="text-xs font-semibold text-[var(--text-primary)] block leading-tight">
                                    {user?.displayName || 'Guest'}
                                </span>
                                <span className={`text-[10px] font-medium dash-role-badge ${getRoleBadgeClass()}`}>
                                    {getRoleDisplayName()}
                                </span>
                            </div>
                        </motion.button>

                        {/* Enhanced dropdown with animations */}
                        <AnimatePresence>
                            {accountDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute right-0 top-full mt-2 w-64 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl shadow-2xl z-50 overflow-hidden"
                                >
                                    {/* User info header with gradient */}
                                    <div className="px-4 py-3 border-b border-[var(--border-primary)] bg-linear-to-br from-[var(--color-primary)]/10 to-transparent">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={user?.photoURL || 'https://images.unsplash.com/photo-1659482633369-9fe69af50bfb?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=3&w=320&h=320&q=80'}
                                                alt={user?.displayName || 'Avatar'}
                                                className="w-12 h-12 rounded-full border-2 border-[var(--border-primary)] object-cover"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                                                    {user?.displayName || 'Guest'}
                                                </p>
                                                <p className="text-xs text-[var(--text-muted)] truncate">
                                                    {user?.email || 'No email'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Menu items */}
                                    <div className="py-2">
                                        <Link
                                            to="/profile"
                                            onClick={() => setAccountDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-all duration-150 group"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-[var(--bg-surface)] flex items-center justify-center group-hover:bg-[var(--color-primary)]/10 transition-colors">
                                                <span className="material-symbols-outlined text-[16px]">person</span>
                                            </div>
                                            <span className="flex-1">Profile</span>
                                            <ArrowRight size={14} className="text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                        <Link
                                            to="/profile"
                                            onClick={() => setAccountDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-all duration-150 group"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-[var(--bg-surface)] flex items-center justify-center group-hover:bg-[var(--color-primary)]/10 transition-colors">
                                                <span className="material-symbols-outlined text-[16px]">settings</span>
                                            </div>
                                            <span className="flex-1">Settings</span>
                                            <ArrowRight size={14} className="text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </header>
    );
}