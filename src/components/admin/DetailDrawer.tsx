// =============================================================================
// DETAIL DRAWER — Slide-in right drawer for entity detail views
// =============================================================================

import { ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DetailDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    width?: number;
    children: ReactNode;
    footer?: ReactNode;
}

export function DetailDrawer({
    isOpen,
    onClose,
    title,
    subtitle,
    width = 480,
    children,
    footer,
}: DetailDrawerProps) {
    const drawerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300',
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                ref={drawerRef}
                className={cn(
                    'fixed top-0 right-0 z-50 h-full flex flex-col',
                    'bg-[var(--bg-surface)] border-l border-[var(--border-default)]',
                    'shadow-2xl shadow-black/30',
                    'transition-transform duration-300 ease-out',
                    'w-[var(--drawer-width)] max-w-[100vw]',
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                )}
                style={{ width }}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-5 border-b border-[var(--border-default)]">
                    <div className="min-w-0">
                        <h2 className="text-lg font-bold text-[var(--text-primary)] truncate">{title}</h2>
                        {subtitle && (
                            <p className="mt-0.5 text-sm text-[var(--text-muted)] truncate">{subtitle}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-3 p-1.5 rounded-lg text-[var(--text-muted)]
                       hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]
                       transition-colors shrink-0"
                        aria-label="Close drawer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5">{children}</div>

                {/* Footer */}
                {footer && (
                    <div className="p-5 border-t border-[var(--border-default)] bg-[var(--bg-base)]">
                        {footer}
                    </div>
                )}
            </div>
        </>
    );
}
