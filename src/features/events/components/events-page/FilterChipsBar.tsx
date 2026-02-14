import { X } from 'lucide-react';
import type { FilterState } from './types';
import { EVENT_CATEGORIES } from '@/lib/constants';

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
            {/* Quick category chips */}
            {EVENT_CATEGORIES.slice(0, 5).map((cat) => {
                const active = filters.categories.includes(cat.id);
                return (
                    <button
                        key={cat.id}
                        onClick={() => onToggleCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${active
                                ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm'
                                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
                            }`}
                    >
                        {cat.label}
                    </button>
                );
            })}

            {/* Date chip */}
            {([
              { value: 'today', label: 'Today' },
              { value: 'this-week', label: 'This Week' },
              { value: 'this-month', label: 'This Month' },
            ]).map(({ value, label }) => (
                <button
                    key={value}
                    onClick={() => onSetDate(filters.dateRange === value ? '' : value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${filters.dateRange === value
                            ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                            : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--color-primary)]'
                        }`}
                >
                    {label}
                </button>
            ))}

            {/* Active filter tags */}
            {/* Active filter tags */}
            {filters.categories.map((catId) => {
                const label = EVENT_CATEGORIES.find((c) => c.id === catId)?.label || catId;
                return (
                    <span
                        key={`active-${catId}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-medium"
                    >
                        {label}
                        <button onClick={() => onToggleCategory(catId)} aria-label={`Remove ${label}`}>
                            <X size={12} />
                        </button>
                    </span>
                );
            })}

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
