// =============================================================================
// ADMIN PAGE HEADER — Standardized header with title, breadcrumbs, & actions
// =============================================================================

import { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Breadcrumb {
    label: string;
    href?: string;
}

interface PrimaryAction {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    variant?: 'primary' | 'outline';
    disabled?: boolean;
}

interface BadgeInfo {
    count: number;
    label: string;
    color: 'amber' | 'red' | 'green' | 'blue';
}

interface AdminPageHeaderProps {
    title: string;
    subtitle?: string;
    breadcrumbs?: Breadcrumb[];
    primaryAction?: PrimaryAction;
    secondaryActions?: PrimaryAction[];
    badge?: BadgeInfo;
    children?: ReactNode;
}

const badgeColors = {
    amber: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
    red: 'bg-red-500/15 text-red-400 ring-red-500/30',
    green: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
    blue: 'bg-blue-500/15 text-blue-400 ring-blue-500/30',
};

export function AdminPageHeader({
    title,
    subtitle,
    breadcrumbs,
    primaryAction,
    secondaryActions,
    badge,
    children,
}: AdminPageHeaderProps) {
    return (
        <div className="mb-8">
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-1 text-sm text-[var(--text-muted)] mb-3">
                    {breadcrumbs.map((crumb, i) => (
                        <span key={i} className="flex items-center gap-1">
                            {i > 0 && <ChevronRight size={14} className="opacity-50" />}
                            {crumb.href ? (
                                <a
                                    href={crumb.href}
                                    className="hover:text-[var(--color-primary)] transition-colors"
                                >
                                    {crumb.label}
                                </a>
                            ) : (
                                <span className="text-[var(--text-primary)]">{crumb.label}</span>
                            )}
                        </span>
                    ))}
                </nav>
            )}

            {/* Title Bar */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p>
                        )}
                    </div>
                    {badge && badge.count > 0 && (
                        <span
                            className={cn(
                                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ring-1',
                                badgeColors[badge.color]
                            )}
                        >
                            <span className="font-bold">{badge.count}</span>
                            {badge.label}
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    {secondaryActions?.map((action, i) => (
                        <button
                            key={i}
                            onClick={action.onClick}
                            disabled={action.disabled}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
                         text-[var(--text-secondary)] bg-[var(--bg-surface)]
                         border border-[var(--border-default)] rounded-xl
                         hover:bg-[var(--bg-surface-hover)] hover:border-[var(--color-primary)]/30
                         transition-all duration-200 disabled:opacity-50"
                        >
                            {action.icon}
                            {action.label}
                        </button>
                    ))}
                    {primaryAction && (
                        <button
                            onClick={primaryAction.onClick}
                            disabled={primaryAction.disabled}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold
                         text-white bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)]
                         rounded-xl shadow-lg shadow-[var(--color-primary)]/20
                         hover:shadow-xl hover:shadow-[var(--color-primary)]/30
                         hover:-translate-y-0.5 transition-all duration-200
                         disabled:opacity-50 disabled:hover:translate-y-0"
                        >
                            {primaryAction.icon}
                            {primaryAction.label}
                        </button>
                    )}
                </div>
            </div>

            {children}
        </div>
    );
}
