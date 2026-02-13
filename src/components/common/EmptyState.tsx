import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Search, Inbox, AlertCircle, FileX } from 'lucide-react';
import { motion } from 'framer-motion';

// =============================================================================
// EMPTY STATE COMPONENT
// =============================================================================

type EmptyVariant = 'default' | 'search' | 'error' | 'no-data';

interface EmptyStateProps {
    variant?: EmptyVariant;
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
    compact?: boolean;
}

const VARIANT_ICONS: Record<EmptyVariant, ReactNode> = {
    default: <Inbox size={48} strokeWidth={1.5} />,
    search: <Search size={48} strokeWidth={1.5} />,
    error: <AlertCircle size={48} strokeWidth={1.5} />,
    'no-data': <FileX size={48} strokeWidth={1.5} />,
};

const VARIANT_COLORS: Record<EmptyVariant, string> = {
    default: 'text-gray-300 dark:text-neutral-600',
    search: 'text-primary-300 dark:text-primary-700',
    error: 'text-red-300 dark:text-red-700',
    'no-data': 'text-amber-300 dark:text-amber-700',
};

export default function EmptyState({
    variant = 'default',
    icon,
    title,
    description,
    action,
    className,
    compact = false,
}: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={cn(
                'flex flex-col items-center justify-center text-center',
                compact ? 'py-10 px-6' : 'py-20 px-8',
                className
            )}
        >
            <div className={cn('mb-4', VARIANT_COLORS[variant])}>
                {icon ?? VARIANT_ICONS[variant]}
            </div>
            <h3
                className={cn(
                    'font-bold text-gray-900 dark:text-white',
                    compact ? 'text-base mb-1' : 'text-lg mb-2'
                )}
            >
                {title}
            </h3>
            {description && (
                <p
                    className={cn(
                        'text-gray-500 dark:text-neutral-400 max-w-sm',
                        compact ? 'text-xs mb-4' : 'text-sm mb-6'
                    )}
                >
                    {description}
                </p>
            )}
            {action && <div>{action}</div>}
        </motion.div>
    );
}
