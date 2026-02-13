import { X } from 'lucide-react';
import type { FilterState } from './types';
import { CATEGORIES } from './constants';

interface Props {
    filters: FilterState;
    onToggleCategory: (cat: string) => void;
    onSetDate: (d: string) => void;
    onClearAll: () => void;
}

export default function FilterChipsBar({ filters, onToggleCategory, onSetDate, onClearAll }: Props) {
    const hasActiveFilters =
        filters.categories.length > 0 ||
        filters.dateRange !== '' ||
        filters.eventType !== 'all' ||
        filters.priceRange[0] > 0 ||
        filters.priceRange[1] < 1000;

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Quick category chips */}
            {CATEGORIES.slice(0, 6).map((cat) => {
                const active = filters.categories.includes(cat);
                return (
                    <button
                        key={cat}
                        onClick={() => onToggleCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${active
                                ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm'
                                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
                            }`}
                    >
                        {cat}
                    </button>
                );
            })}

            {/* Date chip */}
            {['Today', 'This Week', 'This Month'].map((label) => (
                <button
                    key={label}
                    onClick={() => onSetDate(filters.dateRange === label ? '' : label)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${filters.dateRange === label
                            ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                            : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--color-primary)]'
                        }`}
                >
                    {label}
                </button>
            ))}

            {/* Active filter tags */}
            {filters.categories.map((cat) => (
                <span
                    key={`active-${cat}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-medium"
                >
                    {cat}
                    <button onClick={() => onToggleCategory(cat)} aria-label={`Remove ${cat}`}>
                        <X size={12} />
                    </button>
                </span>
            ))}

            {hasActiveFilters && (
                <button
                    onClick={onClearAll}
                    className="text-xs text-[var(--text-muted)] hover:text-red-500 font-medium transition-colors"
                >
                    Clear All
                </button>
            )}
        </div>
    );
}
