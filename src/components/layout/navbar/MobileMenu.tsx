import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogIn, Sparkles } from 'lucide-react';


interface Props {
    isOpen: boolean;
    onClose: () => void;
    isAuthenticated: boolean;
    currentPath: string;
    onNavigate: (path: string) => void;
    onLogout: () => void;
}

// Navigation links — duplicated here to avoid circular import from ./index
const MOBILE_NAV_LINKS = [
    { label: 'Home', path: '/' },
    { label: 'Events', path: '/events' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
] as const;

export function MobileMenu({ isOpen, onClose, isAuthenticated, currentPath, onNavigate, onLogout }: Props) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90]"
                    />

                    {/* Slide-in panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed right-0 top-0 bottom-0 w-[280px] max-w-[80vw] bg-[var(--bg-base)] border-l border-[var(--border-primary)] shadow-2xl z-[91] flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-primary)]">
                            <span className="text-lg font-bold bg-gradient-to-r from-[#00A3DB] to-[#A3D639] bg-clip-text text-transparent">
                                FlowGateX
                            </span>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-muted)] transition"
                                aria-label="Close menu"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Navigation Links */}
                        <nav className="flex-1 overflow-y-auto px-4 py-4">
                            <div className="space-y-1">
                                {MOBILE_NAV_LINKS.map((link) => (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        onClick={onClose}
                                        className={`block px-4 py-3 rounded-xl text-sm font-medium transition ${currentPath === link.path
                                            ? 'text-[#00A3DB] bg-[#00A3DB]/10'
                                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
                                            }`}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </nav>

                        {/* Footer actions */}
                        <div className="px-4 py-4 border-t border-[var(--border-primary)] space-y-2">
                            {isAuthenticated ? (
                                <>
                                    <button
                                        onClick={() => { onNavigate('/dashboard'); onClose(); }}
                                        className="w-full py-2.5 rounded-xl bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--bg-hover)] transition"
                                    >
                                        Dashboard
                                    </button>
                                    <button
                                        onClick={() => { onLogout(); onClose(); }}
                                        className="w-full py-2.5 rounded-xl border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                                    >
                                        Log Out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => { onNavigate('/login'); onClose(); }}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] text-sm font-medium transition"
                                    >
                                        <LogIn size={16} /> Sign In
                                    </button>
                                    <button
                                        onClick={() => { onNavigate('/register'); onClose(); }}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#00A3DB] to-[#007AA3] text-white text-sm font-semibold shadow-lg transition"
                                    >
                                        <Sparkles size={16} /> Get Started
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default MobileMenu;
