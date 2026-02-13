import { cn } from '@/lib/utils';

// =============================================================================
// SKELETON LOADER COMPONENTS
// =============================================================================

interface SkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
    rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

/** Base skeleton block with shimmer animation */
export function Skeleton({ className, width, height, rounded = 'lg' }: SkeletonProps) {
    const roundedMap = {
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        '2xl': 'rounded-2xl',
        full: 'rounded-full',
    };

    return (
        <div
            className={cn(
                'animate-pulse bg-gray-200 dark:bg-neutral-700/50',
                roundedMap[rounded],
                className
            )}
            style={{ width, height }}
            role="status"
            aria-label="Loading..."
        />
    );
}

/** Skeleton text line */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
    return (
        <div className={cn('space-y-3', className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={cn('h-4', i === lines - 1 ? 'w-3/4' : 'w-full')}
                    rounded="md"
                />
            ))}
        </div>
    );
}

/** Skeleton avatar circle */
export function SkeletonAvatar({ size = 40, className }: { size?: number; className?: string }) {
    return <Skeleton className={className} width={size} height={size} rounded="full" />;
}

/** Skeleton card */
export function SkeletonCard({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6 space-y-4',
                className
            )}
        >
            <div className="flex items-center gap-4">
                <SkeletonAvatar size={48} />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" rounded="md" />
                    <Skeleton className="h-3 w-1/3" rounded="md" />
                </div>
            </div>
            <SkeletonText lines={3} />
        </div>
    );
}

/** Skeleton table rows */
export function SkeletonTable({ rows = 5, cols = 4, className }: { rows?: number; cols?: number; className?: string }) {
    return (
        <div className={cn('space-y-3', className)}>
            {/* Header */}
            <div className="flex gap-4 px-4 py-3">
                {Array.from({ length: cols }).map((_, i) => (
                    <Skeleton key={i} className="h-4 flex-1" rounded="md" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, row) => (
                <div key={row} className="flex gap-4 px-4 py-4 border-t border-gray-100 dark:border-neutral-700">
                    {Array.from({ length: cols }).map((_, col) => (
                        <Skeleton key={col} className="h-4 flex-1" rounded="md" />
                    ))}
                </div>
            ))}
        </div>
    );
}

export default Skeleton;
