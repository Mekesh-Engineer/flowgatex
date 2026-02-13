import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

// =============================================================================
// STATS CARD COMPONENT
// =============================================================================

interface StatsCardProps {
    label: string;
    value: string | number;
    icon: ReactNode;
    trend?: string;
    trendUp?: boolean;
    color?: string;
    bgColor?: string;
    borderColor?: string;
    className?: string;
}

export default function StatsCard({
    label,
    value,
    icon,
    trend,
    trendUp,
    color = 'text-primary-600 dark:text-primary-400',
    bgColor = 'bg-primary-50 dark:bg-primary-500/10',
    borderColor = 'border-primary-100 dark:border-primary-500/20',
    className,
}: StatsCardProps) {
    return (
        <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300 }}>
            <div
                className={cn(
                    'bg-white dark:bg-neutral-800 border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-5',
                    borderColor,
                    className
                )}
            >
                <div className="flex justify-between items-start mb-4">
                    <div className={cn('p-2.5 rounded-xl shadow-inner', bgColor, color)}>
                        {icon}
                    </div>
                    {trend && (
                        <div
                            className={cn(
                                'px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border',
                                trendUp
                                    ? 'text-emerald-700 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20'
                                    : 'text-rose-700 bg-rose-50 border-rose-100 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20'
                            )}
                        >
                            {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {trend}
                        </div>
                    )}
                </div>
                <p className="text-gray-500 dark:text-neutral-400 text-sm font-medium tracking-wide">
                    {label}
                </p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mt-1 tracking-tight">
                    {value}
                </p>
            </div>
        </motion.div>
    );
}
