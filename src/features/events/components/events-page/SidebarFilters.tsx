import { type Dispatch, type SetStateAction } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import type { FilterState } from './types';
import { CATEGORIES, SORT_OPTIONS, PRICE_RANGES, DEFAULT_FILTER_STATE } from './constants';

interface Props {
    filters: FilterState;
    setFilters: Dispatch<SetStateAction<FilterState>>;
}

export default function SidebarFilters({ filters, setFilters }: Props) {
    const update = (patch: Partial<FilterState>) =>
        setFilters((prev) => ({ ...prev, ...patch }));

    const toggleCategory = (cat: string) => {
        const next = filters.categories.includes(cat)
            ? filters.categories.filter((c) => c !== cat)
            : [...filters.categories, cat];
        update({ categories: next });
    };

    const resetAll = () => setFilters({ ...DEFAULT_FILTER_STATE });

    const hasActive =
        filters.categories.length > 0 ||
        (filters.priceRange[0] !== DEFAULT_FILTER_STATE.priceRange[0] ||
            filters.priceRange[1] !== DEFAULT_FILTER_STATE.priceRange[1]) ||
        filters.eventType !== 'all' ||
        filters.dateRange !== DEFAULT_FILTER_STATE.dateRange ||
        filters.sortBy !== DEFAULT_FILTER_STATE.sortBy;

    const isPriceRangeSelected = (min: number, max: number) =>
        filters.priceRange[0] === min && filters.priceRange[1] === max;

    return (
        <aside className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal size={18} className="text-[var(--color-primary)]" />
                    <h3 className="font-bold text-[var(--text-primary)]">Filters</h3>
                </div>
                {hasActive && (
                    <button
                        onClick={resetAll}
                        className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1"
                    >
                        <X size={12} /> Reset
                    </button>
                )}
            </div>

            {/* Categories */}
            <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Categories</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {CATEGORIES.map((cat) => (
                        <label
                            key={cat}
                            className="flex items-center gap-2.5 text-sm cursor-pointer group"
                        >
                            <input
                                type="checkbox"
                                checked={filters.categories.includes(cat)}
                                onChange={() => toggleCategory(cat)}
                                className="h-4 w-4 rounded border-[var(--border-primary)] text-[var(--color-primary)] accent-[var(--color-primary)] cursor-pointer"
                            />
                            <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                                {cat}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Event Type */}
            <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Event Type</h4>
                <div className="space-y-2">
                    {(['all', 'online', 'offline'] as const).map((type) => (
                        <label
                            key={type}
                            className="flex items-center gap-2.5 text-sm cursor-pointer group"
                        >
                            <input
                                type="radio"
                                name="eventType"
                                checked={filters.eventType === type}
                                onChange={() => update({ eventType: type })}
                                className="h-4 w-4 border-[var(--border-primary)] text-[var(--color-primary)] accent-[var(--color-primary)] cursor-pointer"
                            />
                            <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors capitalize">
                                {type === 'all' ? 'All Types' : type}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Price Range */}
            <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Price Range</h4>
                <div className="space-y-2">
                    {PRICE_RANGES.map((opt) => (
                        <label
                            key={opt.label}
                            className="flex items-center gap-2.5 text-sm cursor-pointer group"
                        >
                            <input
                                type="radio"
                                name="priceRange"
                                checked={isPriceRangeSelected(opt.min, opt.max)}
                                onChange={() => update({ priceRange: [opt.min, opt.max] })}
                                className="h-4 w-4 border-[var(--border-primary)] text-[var(--color-primary)] accent-[var(--color-primary)] cursor-pointer"
                            />
                            <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                                {opt.label}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Sort By */}
            <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Sort By</h4>
                <select
                    value={filters.sortBy}
                    onChange={(e) => update({ sortBy: e.target.value as FilterState['sortBy'] })}
                    className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm px-3 py-2.5 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition"
                >
                    {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Date Range */}
            <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Date</h4>
                <div className="space-y-2">
                    {(['', 'today', 'this-week', 'this-month'] as const).map((d) => (
                        <label
                            key={d || 'all'}
                            className="flex items-center gap-2.5 text-sm cursor-pointer group"
                        >
                            <input
                                type="radio"
                                name="dateRange"
                                checked={filters.dateRange === d}
                                onChange={() => update({ dateRange: d })}
                                className="h-4 w-4 border-[var(--border-primary)] text-[var(--color-primary)] accent-[var(--color-primary)] cursor-pointer"
                            />
                            <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors capitalize">
                                {d === '' ? 'Any Date' : d.replace('-', ' ')}
                            </span>
                        </label>
                    ))}
                </div>
            </div>
        </aside>
    );
}
