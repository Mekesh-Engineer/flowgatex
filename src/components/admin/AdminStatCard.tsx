// =============================================================================
// ADMIN STAT CARD — KPI metric card with sparkline, delta, and skeleton
// =============================================================================

import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminStatCardProps {
    title: string;
    value: string | number;
    delta?: number;
    deltaLabel?: string;
    icon: ReactNode;
    color?: 'green' | 'blue' | 'amber' | 'red' | 'purple' | 'cyan';
    loading?: boolean;
    sparklineData?: number[];
    onClick?: () => void;
}

const colorMap = {
    green: {
        icon: 'from-emerald-500 to-emerald-600',
        glow: 'shadow-emerald-500/20',
        sparkline: '#34d399',
    },
    blue: {
        icon: 'from-blue-500 to-blue-600',
        glow: 'shadow-blue-500/20',
        sparkline: '#60a5fa',
    },
    amber: {
        icon: 'from-amber-500 to-amber-600',
        glow: 'shadow-amber-500/20',
        sparkline: '#fbbf24',
    },
    red: {
        icon: 'from-red-500 to-red-600',
        glow: 'shadow-red-500/20',
        sparkline: '#f87171',
    },
    purple: {
        icon: 'from-purple-500 to-purple-600',
        glow: 'shadow-purple-500/20',
        sparkline: '#a78bfa',
    },
    cyan: {
        icon: 'from-cyan-500 to-cyan-600',
        glow: 'shadow-cyan-500/20',
        sparkline: '#22d3ee',
    },
};

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const h = 32;
    const w = 80;
    const step = w / (data.length - 1);

    const points = data
        .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
        .join(' ');

    return (
        <svg width={w} height={h} className="overflow-visible opacity-60">
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function StatCardSkeleton() {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-[var(--border-default)]
                    bg-[var(--bg-surface)] p-5 animate-pulse">
            <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                    <div className="h-3 w-24 bg-[var(--border-default)] rounded" />
                    <div className="h-7 w-32 bg-[var(--border-default)] rounded" />
                    <div className="h-3 w-20 bg-[var(--border-default)] rounded" />
                </div>
                <div className="w-11 h-11 rounded-xl bg-[var(--border-default)]" />
            </div>
        </div>
    );
}

export function AdminStatCard({
    title,
    value,
    delta,
    deltaLabel,
    icon,
    color = 'blue',
    loading = false,
    sparklineData,
    onClick,
}: AdminStatCardProps) {
    if (loading) return <StatCardSkeleton />;

    const c = colorMap[color];
    const isDeltaPositive = delta !== undefined && delta > 0;
    const isDeltaNegative = delta !== undefined && delta < 0;
    const isDeltaZero = delta !== undefined && delta === 0;

    return (
        <div
            onClick={onClick}
            className={cn(
                'group relative overflow-hidden rounded-2xl border border-[var(--border-default)]',
                'bg-[var(--bg-surface)] p-5 transition-all duration-300',
                'hover:border-[var(--color-primary)]/30 hover:shadow-lg',
                onClick && 'cursor-pointer'
            )}
        >
            {/* Subtle gradient glow */}
            <div
                className={cn(
                    'absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-10',
                    'group-hover:opacity-20 transition-opacity duration-500',
                    `bg-gradient-to-br ${c.icon}`
                )}
            />

            <div className="relative flex items-start justify-between">
                <div className="space-y-2 flex-1 min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        {title}
                    </p>
                    <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
                        {value}
                    </p>

                    {/* Delta indicator */}
                    {delta !== undefined && (
                        <div className="flex items-center gap-1.5">
                            {isDeltaPositive && (
                                <span className="flex items-center gap-0.5 text-emerald-400 text-xs font-semibold">
                                    <TrendingUp size={12} /> +{delta}%
                                </span>
                            )}
                            {isDeltaNegative && (
                                <span className="flex items-center gap-0.5 text-red-400 text-xs font-semibold">
                                    <TrendingDown size={12} /> {delta}%
                                </span>
                            )}
                            {isDeltaZero && (
                                <span className="flex items-center gap-0.5 text-[var(--text-muted)] text-xs font-semibold">
                                    <Minus size={12} /> No change
                                </span>
                            )}
                            {deltaLabel && (
                                <span className="text-xs text-[var(--text-muted)]">{deltaLabel}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Icon */}
                <div
                    className={cn(
                        'shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center',
                        'text-white shadow-lg',
                        c.icon,
                        c.glow
                    )}
                >
                    {icon}
                </div>
            </div>

            {/* Sparkline */}
            {sparklineData && sparklineData.length > 1 && (
                <div className="mt-3 flex justify-end">
                    <MiniSparkline data={sparklineData} color={c.sparkline} />
                </div>
            )}
        </div>
    );
}
