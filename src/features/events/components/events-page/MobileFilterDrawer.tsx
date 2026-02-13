import { type Dispatch, type SetStateAction, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FilterState } from './types';
import SidebarFilters from './SidebarFilters';

interface Props {
    open: boolean;
    onClose: () => void;
    filters: FilterState;
    setFilters: Dispatch<SetStateAction<FilterState>>;
    resultCount?: number;
}

export default function MobileFilterDrawer({ open, onClose, filters, setFilters, resultCount }: Props) {
    // Lock body scroll when open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed right-0 top-0 h-full w-[320px] max-w-[85vw] z-50 bg-[var(--bg-base)] border-l border-[var(--border-primary)] shadow-2xl flex flex-col"
                    >
                        {/* Drawer header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-primary)]">
                            <h2 className="font-bold text-lg text-[var(--text-primary)]">Filters</h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-muted)] transition-colors"
                                aria-label="Close filters"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Scrollable content */}
                        <div className="flex-1 overflow-y-auto px-5 py-4">
                            <SidebarFilters filters={filters} setFilters={setFilters} />
                        </div>

                        {/* Apply button */}
                        <div className="px-5 py-4 border-t border-[var(--border-primary)]">
                            <button
                                onClick={onClose}
                                className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:opacity-90 transition-opacity"
                            >
                                Apply Filters{resultCount !== undefined ? ` (${resultCount})` : ''}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
