// =============================================================================
// STATUS BADGE — Color-coded pill for entity statuses
// =============================================================================

import { cn } from '@/lib/utils';

interface StatusBadgeProps {
    status: string;
    className?: string;
    size?: 'sm' | 'md';
    dot?: boolean;
}

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
    // Green statuses
    active: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    published: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    approved: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    paid: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    confirmed: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    checked_in: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    completed: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    operational: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    ready: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },

    // Amber/Yellow statuses
    pending: { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },
    pending_review: { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },
    under_review: { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },
    processing: { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },
    info_requested: { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },
    generating: { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },
    degraded: { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },

    // Red statuses
    suspended: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
    rejected: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
    failed: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
    cancelled: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
    deleted: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
    blocked: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
    down: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
    expired: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },

    // Blue / Special
    refunded: { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },
    partially_refunded: { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },
    draft: { bg: 'bg-slate-500/15', text: 'text-slate-400', dot: 'bg-slate-400' },
    flagged: { bg: 'bg-orange-500/15', text: 'text-orange-400', dot: 'bg-orange-400' },
};

function formatStatusLabel(status: string): string {
    return status
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusBadge({ status, className, size = 'md', dot = true }: StatusBadgeProps) {
    const config = statusConfig[status] || statusConfig.draft;
    const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 font-semibold rounded-full',
                config.bg,
                config.text,
                sizeClass,
                className
            )}
        >
            {dot && (
                <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
            )}
            {formatStatusLabel(status)}
        </span>
    );
}
