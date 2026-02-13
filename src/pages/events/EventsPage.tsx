import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search, ChevronLeft, ChevronRight,
  Grid3X3, List, Map, Filter,
} from 'lucide-react';

import type { ViewMode, FilterState } from '@/features/events/components/events-page/types';
import { ITEMS_PER_PAGE, DEFAULT_FILTER_STATE } from '@/features/events/components/events-page/constants';
import { MOCK_EVENTS } from '@/features/events/components/events-page/mockData';
import {
  EventCardInner,
  SearchAutocomplete,
  FilterChipsBar,
  MapView,
  SidebarFilters,
  MobileFilterDrawer,
} from '@/features/events/components/events-page';

// =============================================================================
// MAIN COMPONENT — Orchestrator
// =============================================================================

const EventsPage: React.FC = () => {
  // ── State ──
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [savedEvents, setSavedEvents] = useState<Set<string>>(new Set(['3']));
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({ ...DEFAULT_FILTER_STATE });

  // ── Derived / Filtered Data ──
  const filteredEvents = useMemo(() => {
    let results = [...MOCK_EVENTS];

    // Text search
    if (appliedSearch) {
      const q = appliedSearch.toLowerCase();
      results = results.filter((e) =>
        e.title.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q)) ||
        e.location.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (filters.categories.length > 0) {
      results = results.filter((e) => filters.categories.includes(e.category));
    }

    // Price filter
    results = results.filter((e) => e.price >= filters.priceRange[0] && e.price <= filters.priceRange[1]);

    // Event type
    if (filters.eventType === 'online') results = results.filter((e) => e.online);
    if (filters.eventType === 'offline') results = results.filter((e) => !e.online);

    // Sort
    switch (filters.sortBy) {
      case 'price-asc': results.sort((a, b) => a.price - b.price); break;
      case 'price-desc': results.sort((a, b) => b.price - a.price); break;
      case 'rating': results.sort((a, b) => b.rating - a.rating); break;
      case 'popular': results.sort((a, b) => b.attendees - a.attendees); break;
      default: break;
    }

    return results;
  }, [appliedSearch, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / ITEMS_PER_PAGE));
  const paginatedEvents = filteredEvents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // ── Handlers ──
  const handleSearch = useCallback(() => {
    setAppliedSearch(searchQuery);
    setCurrentPage(1);
  }, [searchQuery]);

  const toggleSave = useCallback((id: string) => {
    setSavedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }, []);

  const toggleCategory = useCallback((cat: string) => {
    setFilters((f) => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter((c) => c !== cat)
        : [...f.categories, cat]
    }));
    setCurrentPage(1);
  }, []);

  const handleClearAll = useCallback(() => {
    setFilters({ ...DEFAULT_FILTER_STATE });
    setAppliedSearch('');
    setSearchQuery('');
    setCurrentPage(1);
  }, []);

  // ── Keyboard nav (G/L/M to switch views) ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'g') setViewMode('grid');
      if (e.key === 'l') setViewMode('list');
      if (e.key === 'm') setViewMode('map');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Render ──
  return (
    <div className="bg-[var(--bg-base)] font-sans text-[var(--text-primary)] min-h-screen flex flex-col transition-colors duration-300">
      {/* ═══ HERO SEARCH SECTION ═══ */}
      <section className="relative bg-gradient-to-br from-[var(--bg-surface)] via-[var(--bg-base)] to-[var(--bg-surface)] border-b border-[var(--border-primary)] pt-10 pb-8 px-4 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, var(--color-primary) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />

        <div className="max-w-[1440px] mx-auto w-full relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Title + View Toggle */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
                  Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]">Events</span>
                </h1>
                <p className="text-[var(--text-muted)] text-sm mt-1.5">
                  Find concerts, festivals, workshops, and more in your city.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[var(--text-muted)]">View:</span>
                {([
                  { mode: 'grid' as ViewMode, icon: <Grid3X3 size={16} />, label: 'Grid view (G)' },
                  { mode: 'list' as ViewMode, icon: <List size={16} />, label: 'List view (L)' },
                  { mode: 'map' as ViewMode, icon: <Map size={16} />, label: 'Map view (M)' },
                ]).map(({ mode, icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    aria-label={label}
                    aria-pressed={viewMode === mode}
                    className={`p-2 rounded-lg border transition-all ${viewMode === mode
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm'
                      : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
                      }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Search bar */}
            <SearchAutocomplete value={searchQuery} onChange={setSearchQuery} onSearch={handleSearch} />

            {/* Filter chips */}
            <FilterChipsBar
              filters={filters}
              onToggleCategory={toggleCategory}
              onSetDate={(d) => { setFilters((f) => ({ ...f, dateRange: d })); setCurrentPage(1); }}
              onClearAll={handleClearAll}
            />
          </motion.div>
        </div>
      </section>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-grow w-full flex flex-col" role="main">
        <div className="flex-grow px-4 lg:px-8 py-8 w-full max-w-[1440px] mx-auto flex gap-8">
          <SidebarFilters filters={filters} setFilters={setFilters} />

          <div className="flex-1 min-w-0">
            {/* Mobile filter trigger + result count */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3 lg:hidden">
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  aria-label="Open filters"
                  className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[var(--color-primary)] px-3 py-2 rounded-lg transition-colors"
                >
                  <Filter size={16} /> Filters
                </button>
              </div>
              <p className="text-sm text-[var(--text-muted)]">
                {filteredEvents.length === 0 ? (
                  'No events found'
                ) : (
                  <>
                    Showing <span className="text-[var(--text-primary)] font-bold">{filteredEvents.length}</span> event{filteredEvents.length !== 1 ? 's' : ''}
                    {appliedSearch && <> for &quot;<span className="text-[var(--color-primary)] font-medium">{appliedSearch}</span>&quot;</>}
                  </>
                )}
              </p>
            </div>

            {/* ── MAP VIEW ── */}
            {viewMode === 'map' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                <MapView events={filteredEvents} />
                <p className="text-center text-xs text-[var(--text-muted)] mt-3">
                  Showing {filteredEvents.filter((e) => e.coordinates.lat !== 0 || e.coordinates.lng !== 0).length} of {filteredEvents.length} event pins
                </p>
              </motion.div>
            )}

            {/* ── GRID / LIST VIEW ── */}
            {viewMode !== 'map' && (
              <>
                {filteredEvents.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                  >
                    <Search size={48} className="text-[var(--border-primary)] mb-4" />
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">No events found</h3>
                    <p className="text-sm text-[var(--text-muted)] mb-6 max-w-sm">
                      Try adjusting your filters or search query to find what you&apos;re looking for.
                    </p>
                    <button
                      onClick={handleClearAll}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-cyan-500 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all"
                    >
                      Clear All Filters
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    layout
                    className={
                      viewMode === 'grid'
                        ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                        : 'flex flex-col gap-5'
                    }
                  >
                    {paginatedEvents.map((event, i) => (
                      <EventCardInner
                        key={event.id}
                        event={event}
                        index={i}
                        viewMode={viewMode}
                        isExpanded={expandedCard === event.id}
                        onToggleExpand={() => setExpandedCard((prev) => (prev === event.id ? null : event.id))}
                        isSaved={savedEvents.has(event.id)}
                        onToggleSave={() => toggleSave(event.id)}
                      />
                    ))}
                  </motion.div>
                )}

                {/* Pagination */}
                {filteredEvents.length > ITEMS_PER_PAGE && (
                  <nav className="mt-10 flex justify-center" aria-label="Pagination">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        aria-label="Previous page"
                        className="size-10 flex items-center justify-center rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={18} />
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          aria-label={`Page ${p}`}
                          aria-current={currentPage === p ? 'page' : undefined}
                          className={`size-10 flex items-center justify-center rounded-lg text-sm font-semibold transition-all ${currentPage === p
                            ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--shadow-primary)]'
                            : 'border border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                          {p}
                        </button>
                      ))}

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        aria-label="Next page"
                        className="size-10 flex items-center justify-center rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* ═══ MOBILE FILTER DRAWER ═══ */}
      <MobileFilterDrawer
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        filters={filters}
        setFilters={setFilters}
        resultCount={filteredEvents.length}
      />
    </div>
  );
};

export default EventsPage;
