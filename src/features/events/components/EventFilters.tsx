/**
 * EventFilters.tsx — Full-featured filter bar for events.
 *
 * This component replaces the old simple filter bar with one that
 * matches the events-page `FilterState` type, ensuring compatibility
 * with `SidebarFilters`, `MobileFilterDrawer`, and `EventsPage`.
 *
 * It can be used standalone OR alongside the sidebar system.
 * All filtering is applied client-side on data already fetched from Firebase.
 */

import { type Dispatch, type SetStateAction, useMemo } from 'react';
import {
  Search, X, Calendar,
  SlidersHorizontal, ArrowUpDown, Wifi, WifiOff, Globe,
} from 'lucide-react';
import { EVENT_CATEGORIES } from '@/lib/constants';
import type { FilterState } from './events-page/types';
import {
  SORT_OPTIONS,
  PRICE_RANGES,
  DEFAULT_FILTER_STATE,
} from './events-page/constants';
import type { EventItem } from './events-page/types';

// ─── Props ───────────────────────────────────────────────────────────
interface EventFiltersProps {
  /** Current filter state (shared with sidebar / mobile drawer). */
  filters: FilterState;
  /** Setter for the shared filter state. */
  setFilters: Dispatch<SetStateAction<FilterState>>;
  /** Live search query string (controlled by parent). */
  searchQuery?: string;
  /** Callback when the search query changes. */
  onSearchChange?: (value: string) => void;
  /** Callback when the user submits the search. */
  onSearchSubmit?: () => void;
  /** Full event list — used to calculate category counts. */
  allEvents?: EventItem[];
  /** Whether the event data is still loading. */
  isLoading?: boolean;
}

// ─── Date presets (normalised — lowercase with hyphens) ──────────────
const DATE_PRESETS = [
  { value: '', label: 'Any Date' },
  { value: 'today', label: 'Today' },
  { value: 'this-week', label: 'This Week' },
  { value: 'this-month', label: 'This Month' },
] as const;

// ─── Component ───────────────────────────────────────────────────────
export default function EventFilters({
  filters,
  setFilters,
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
  allEvents = [],
  isLoading = false,
}: EventFiltersProps) {
  // Helper to patch a single filter key
  const update = (patch: Partial<FilterState>) =>
    setFilters((prev) => ({ ...prev, ...patch }));

  // Toggle a category on/off
  const toggleCategory = (catId: string) => {
    const next = filters.categories.includes(catId)
      ? filters.categories.filter((c) => c !== catId)
      : [...filters.categories, catId];
    update({ categories: next });
  };

  // Reset everything
  const resetAll = () => {
    setFilters({ ...DEFAULT_FILTER_STATE });
    onSearchChange?.('');
  };

  // Check if any filter is active
  const hasActive =
    filters.categories.length > 0 ||
    filters.priceRange[0] !== DEFAULT_FILTER_STATE.priceRange[0] ||
    filters.priceRange[1] !== DEFAULT_FILTER_STATE.priceRange[1] ||
    filters.eventType !== 'all' ||
    filters.dateRange !== '' ||
    filters.sortBy !== DEFAULT_FILTER_STATE.sortBy ||
    searchQuery.trim().length > 0;

  // Category counts from the full event list
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ev of allEvents) {
      const cat = ev.category?.toLowerCase() ?? 'other';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [allEvents]);

  // ─── Keyboard submit for search ──
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSearchSubmit?.();
  };

  return (
    <div className="w-full bg-[var(--bg-card)] rounded-2xl border border-[var(--border-primary)] shadow-sm mb-6 animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden">
      {/* ── Row 1: Search + Sort + Reset ── */}
      <div className="p-4 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            type="text"
            placeholder="Search events, venues, cities..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            disabled={isLoading}
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all disabled:opacity-50"
          />
        </div>

        {/* Sort dropdown */}
        <div className="relative min-w-[170px]">
          <ArrowUpDown
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
          />
          <select
            value={filters.sortBy}
            onChange={(e) => update({ sortBy: e.target.value as FilterState['sortBy'] })}
            className="w-full h-11 pl-10 pr-8 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] text-[var(--text-primary)] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all text-sm"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 1L5 5L9 1" />
            </svg>
          </div>
        </div>

        {/* Event type toggle */}
        <div className="flex items-center bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl p-1 gap-0.5 min-w-fit">
          {([
            { value: 'all' as const, icon: <Globe size={14} />, label: 'All' },
            { value: 'online' as const, icon: <Wifi size={14} />, label: 'Online' },
            { value: 'offline' as const, icon: <WifiOff size={14} />, label: 'Offline' },
          ]).map(({ value, icon, label }) => (
            <button
              key={value}
              onClick={() => update({ eventType: value })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filters.eventType === value
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Reset */}
        {hasActive && (
          <button
            onClick={resetAll}
            className="h-11 px-4 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all flex items-center gap-2 font-semibold text-sm whitespace-nowrap"
          >
            <X size={16} /> Clear All
          </button>
        )}
      </div>

      {/* ── Row 2: Category chips + Date presets + Price ranges ── */}
      <div className="px-4 pb-4 flex flex-wrap items-center gap-2 border-t border-[var(--border-primary)] pt-3">
        {/* Category chips (from constants) */}
        {EVENT_CATEGORIES.map((cat) => {
          const active = filters.categories.includes(cat.id);
          const count = categoryCounts[cat.id] || 0;
          return (
            <button
              key={cat.id}
              onClick={() => toggleCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                active
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
              }`}
            >
              {cat.label}
              {count > 0 && (
                <span className={`ml-1.5 text-[10px] ${active ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>
                  ({count})
                </span>
              )}
            </button>
          );
        })}

        {/* Divider */}
        <div className="w-px h-6 bg-[var(--border-primary)] mx-1 hidden sm:block" />

        {/* Date presets */}
        {DATE_PRESETS.filter(d => d.value !== '').map((preset) => (
          <button
            key={preset.value}
            onClick={() =>
              update({ dateRange: filters.dateRange === preset.value ? '' : preset.value })
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 ${
              filters.dateRange === preset.value
                ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--color-primary)]'
            }`}
          >
            <Calendar size={12} /> {preset.label}
          </button>
        ))}

        {/* Divider */}
        <div className="w-px h-6 bg-[var(--border-primary)] mx-1 hidden sm:block" />

        {/* Price quick-picks */}
        {PRICE_RANGES.slice(0, 3).map((pr) => {
          const active =
            filters.priceRange[0] === pr.min && filters.priceRange[1] === pr.max;
          return (
            <button
              key={pr.label}
              onClick={() =>
                update({
                  priceRange: active
                    ? DEFAULT_FILTER_STATE.priceRange
                    : [pr.min, pr.max],
                })
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                active
                  ? 'bg-[var(--color-secondary)] text-white border-[var(--color-secondary)]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--color-secondary)]'
              }`}
            >
              {pr.label}
            </button>
          );
        })}
      </div>

      {/* ── Active filter summary tags ── */}
      {hasActive && (
        <div className="px-4 pb-3 flex flex-wrap items-center gap-1.5">
          <SlidersHorizontal size={14} className="text-[var(--text-muted)] mr-1" />
          {filters.categories.map((catId) => {
            const label = EVENT_CATEGORIES.find((c) => c.id === catId)?.label || catId;
            return (
              <span
                key={`tag-${catId}`}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[11px] font-semibold"
              >
                {label}
                <button onClick={() => toggleCategory(catId)} aria-label={`Remove ${label}`}>
                  <X size={10} />
                </button>
              </span>
            );
          })}
          {filters.dateRange && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-semibold">
              {DATE_PRESETS.find((d) => d.value === filters.dateRange)?.label || filters.dateRange}
              <button onClick={() => update({ dateRange: '' })} aria-label="Clear date filter">
                <X size={10} />
              </button>
            </span>
          )}
          {(filters.priceRange[0] !== DEFAULT_FILTER_STATE.priceRange[0] ||
            filters.priceRange[1] !== DEFAULT_FILTER_STATE.priceRange[1]) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[11px] font-semibold">
              {PRICE_RANGES.find(
                (p) => p.min === filters.priceRange[0] && p.max === filters.priceRange[1]
              )?.label || `₹${filters.priceRange[0]}–₹${filters.priceRange[1]}`}
              <button
                onClick={() => update({ priceRange: DEFAULT_FILTER_STATE.priceRange })}
                aria-label="Clear price filter"
              >
                <X size={10} />
              </button>
            </span>
          )}
          {filters.eventType !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-500 text-[11px] font-semibold capitalize">
              {filters.eventType}
              <button onClick={() => update({ eventType: 'all' })} aria-label="Clear event type filter">
                <X size={10} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
