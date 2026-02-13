import { cn } from '@/lib/utils';

// =============================================================================
// PROGRESS BAR COMPONENT
// =============================================================================

interface ProgressBarProps {
    value: number;
    max?: number;
    label?: string;
    showValue?: boolean;
    size?: 'sm' | 'md' | 'lg';
    color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
    className?: string;
    animated?: boolean;
}

const COLOR_MAP = {
    primary: 'bg-primary-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
};

const TRACK_MAP = {
    primary: 'bg-primary-100 dark:bg-primary-900/30',
    success: 'bg-emerald-100 dark:bg-emerald-900/30',
    warning: 'bg-amber-100 dark:bg-amber-900/30',
    danger: 'bg-red-100 dark:bg-red-900/30',
    info: 'bg-blue-100 dark:bg-blue-900/30',
};

const SIZE_MAP = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
};

export default function ProgressBar({
    value,
    max = 100,
    label,
    showValue = false,
    size = 'md',
    color = 'primary',
    className,
    animated = false,
}: ProgressBarProps) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <div className={cn('w-full', className)}>
            {(label || showValue) && (
                <div className="flex items-center justify-between mb-1.5">
                    {label && (
                        <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">
                            {label}
                        </span>
                    )}
                    {showValue && (
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {Math.round(percentage)}%
                        </span>
                    )}
                </div>
            )}
            <div
                className={cn('w-full rounded-full overflow-hidden', SIZE_MAP[size], TRACK_MAP[color])}
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={max}
                aria-label={label}
            >
                <div
                    className={cn(
                        'h-full rounded-full transition-all duration-500 ease-out',
                        COLOR_MAP[color],
                        animated && 'animate-pulse'
                    )}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
