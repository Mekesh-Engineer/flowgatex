import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import type { Breadcrumb } from './DashboardLayout.types';

interface Props {
    breadcrumbs: Breadcrumb[];
}

/**
 * Desktop breadcrumb – used inside DashboardHeader
 */
export function DesktopBreadcrumb({ breadcrumbs }: Props) {
    if (breadcrumbs.length === 0) return null;

    return (
        <nav className="hidden md:flex items-center gap-1 text-sm" aria-label="Breadcrumb">
            <Link to="/" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition">
                <Home size={14} />
            </Link>
            {breadcrumbs.map((crumb) => (
                <span key={crumb.href} className="flex items-center gap-1">
                    <ChevronRight size={12} className="text-[var(--text-muted)]" />
                    {crumb.isLast ? (
                        <span className="font-semibold text-[var(--text-primary)]">{crumb.label}</span>
                    ) : (
                        <Link
                            to={crumb.href}
                            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                        >
                            {crumb.label}
                        </Link>
                    )}
                </span>
            ))}
        </nav>
    );
}

/**
 * Mobile-only breadcrumb bar – rendered below the header on small screens
 */
export function MobileBreadcrumb({ breadcrumbs }: Props) {
    if (breadcrumbs.length === 0) return null;

    const current = breadcrumbs[breadcrumbs.length - 1];
    const parent = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2] : null;

    return (
        <div className="md:hidden px-4 py-2 bg-[var(--bg-surface)] border-b border-[var(--border-primary)] flex items-center gap-2 text-sm">
            {parent && (
                <>
                    <Link to={parent.href} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition truncate max-w-[120px]">
                        {parent.label}
                    </Link>
                    <ChevronRight size={12} className="text-[var(--text-muted)] shrink-0" />
                </>
            )}
            <span className="font-semibold text-[var(--text-primary)] truncate">{current.label}</span>
        </div>
    );
}
