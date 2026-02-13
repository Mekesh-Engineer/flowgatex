import { useState, useRef, useEffect } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: Props) {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery('');
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            navigate(`/events?q=${encodeURIComponent(query.trim())}`);
            onClose();
        }
    };

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
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="fixed top-[15%] left-1/2 -translate-x-1/2 w-[90%] max-w-xl bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl shadow-2xl z-[201] overflow-hidden"
                    >
                        <form onSubmit={handleSearch}>
                            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-primary)]">
                                <Search size={20} className="text-[var(--text-muted)]" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search events, categories, locations..."
                                    className="flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-muted)] transition"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </form>

                        {/* Quick links */}
                        <div className="px-4 py-3">
                            <p className="text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">
                                Quick links
                            </p>
                            {['Music Events', 'Tech Conferences', 'Today\'s Events', 'Free Events'].map((term) => (
                                <button
                                    key={term}
                                    onClick={() => {
                                        navigate(`/events?q=${encodeURIComponent(term)}`);
                                        onClose();
                                    }}
                                    className="flex items-center justify-between w-full px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] rounded-lg transition group"
                                >
                                    <span>{term}</span>
                                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition" />
                                </button>
                            ))}
                        </div>

                        {/* Footer hint */}
                        <div className="px-4 py-2.5 border-t border-[var(--border-primary)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                            <span>Press <kbd className="px-1.5 py-0.5 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded">Enter</kbd> to search</span>
                            <span>Press <kbd className="px-1.5 py-0.5 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded">Esc</kbd> to close</span>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default SearchModal;
