import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// =============================================================================
// TABS COMPONENT
// =============================================================================

export interface TabItem {
    id: string;
    label: string;
    icon?: ReactNode;
    badge?: string | number;
    disabled?: boolean;
}

interface TabsProps {
    items: TabItem[];
    activeTab: string;
    onChange: (id: string) => void;
    variant?: 'underline' | 'pills' | 'boxed';
    size?: 'sm' | 'md';
    className?: string;
    fullWidth?: boolean;
}

export function Tabs({
    items,
    activeTab,
    onChange,
    variant = 'underline',
    size = 'md',
    className,
    fullWidth = false,
}: TabsProps) {
    const baseStyles = {
        underline:
            'border-b border-gray-200 dark:border-neutral-700',
        pills: 'bg-gray-100 dark:bg-neutral-800 rounded-xl p-1',
        boxed: 'bg-gray-100 dark:bg-neutral-800 rounded-lg p-1 border border-gray-200 dark:border-neutral-700',
    };

    const itemStyles = {
        underline: (active: boolean) =>
            cn(
                'relative pb-3 px-1 border-b-2 transition-all duration-200 font-medium',
                active
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200 hover:border-gray-300'
            ),
        pills: (active: boolean) =>
            cn(
                'px-4 rounded-lg transition-all duration-200 font-medium',
                active
                    ? 'bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200'
            ),
        boxed: (active: boolean) =>
            cn(
                'px-4 rounded-md transition-all duration-200 font-medium',
                active
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200'
            ),
    };

    const sizeStyles = {
        sm: 'text-xs py-2 gap-1.5',
        md: 'text-sm py-2.5 gap-2',
    };

    return (
        <nav
            className={cn('flex overflow-x-auto no-scrollbar', baseStyles[variant], className)}
            role="tablist"
            aria-label="Tabs"
        >
            {items.map((item) => (
                <button
                    key={item.id}
                    role="tab"
                    aria-selected={activeTab === item.id}
                    aria-disabled={item.disabled}
                    onClick={() => !item.disabled && onChange(item.id)}
                    className={cn(
                        'inline-flex items-center whitespace-nowrap shrink-0',
                        sizeStyles[size],
                        itemStyles[variant](activeTab === item.id),
                        fullWidth && 'flex-1 justify-center',
                        item.disabled && 'opacity-40 cursor-not-allowed'
                    )}
                >
                    {item.icon && <span className="shrink-0">{item.icon}</span>}
                    {item.label}
                    {item.badge !== undefined && (
                        <span
                            className={cn(
                                'ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full',
                                activeTab === item.id
                                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                                    : 'bg-gray-200 text-gray-600 dark:bg-neutral-700 dark:text-neutral-400'
                            )}
                        >
                            {item.badge}
                        </span>
                    )}
                </button>
            ))}
        </nav>
    );
}

// =============================================================================
// TAB PANEL WRAPPER
// =============================================================================

interface TabPanelProps {
    id: string;
    activeTab: string;
    children: ReactNode;
    className?: string;
}

export function TabPanel({ id, activeTab, children, className }: TabPanelProps) {
    if (id !== activeTab) return null;

    return (
        <motion.div
            key={id}
            role="tabpanel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export default Tabs;
