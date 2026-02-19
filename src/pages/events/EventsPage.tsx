import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search, ChevronLeft, ChevronRight,
  Grid3X3, List, Map, Filter, Loader2, Sparkles, Music, Trophy
} from 'lucide-react';

import type { ViewMode, FilterState } from '@/features/events/components/events-page/types';
import { ITEMS_PER_PAGE, DEFAULT_FILTER_STATE } from '@/features/events/components/events-page/constants';
import {
  EventCardInner,
  SearchAutocomplete,
  FilterChipsBar,
  MapView,
  SidebarFilters,
  MobileFilterDrawer,
} from '@/features/events/components/events-page';

import { useEvents } from '@/features/events/hooks/useEvents';
import { toEventItems } from '@/features/events/utils/eventMapper';
import { GridCanvas, ParticleCanvas } from '@/features/home/components/canvas/CanvasEffects';
import { FloatingElement } from '@/features/home/components/ui/SharedComponents';

// =============================================================================
// MAIN COMPONENT — Orchestrator
// =============================================================================

const EventsPage: React.FC = () => {
  // ── Firebase data ──
  const { data: rawEvents, isLoading, error } = useEvents(200);
  const allEvents = useMemo(() => toEventItems(rawEvents ?? []), [rawEvents]);

  // ── State ──
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [savedEvents, setSavedEvents] = useState<Set<string>>(new Set());
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({ ...DEFAULT_FILTER_STATE });

  // ── Derived / Filtered Data ──
  const filteredEvents = useMemo(() => {
    let results = [...allEvents];

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

    // Date range filter
    if (filters.dateRange) {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      results = results.filter((e) => {
        const eventDate = new Date(e.date);
        if (isNaN(eventDate.getTime())) return true; // keep events with unparseable dates

        switch (filters.dateRange) {
          case 'today': {
            const endOfToday = new Date(startOfToday);
            endOfToday.setDate(endOfToday.getDate() + 1);
            return eventDate >= startOfToday && eventDate < endOfToday;
          }
          case 'this-week': {
            const dayOfWeek = now.getDay();
            const startOfWeek = new Date(startOfToday);
            startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 7);
            return eventDate >= startOfWeek && eventDate < endOfWeek;
          }
          case 'this-month': {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            return eventDate >= startOfMonth && eventDate < endOfMonth;
          }
          default:
            return true;
        }
      });
    }

    // Sort
    switch (filters.sortBy) {
      case 'price-asc': results.sort((a, b) => a.price - b.price); break;
      case 'price-desc': results.sort((a, b) => b.price - a.price); break;
      case 'rating': results.sort((a, b) => b.rating - a.rating); break;
      case 'popular': results.sort((a, b) => b.attendees - a.attendees); break;
      default: break;
    }

    return results;
  }, [allEvents, appliedSearch, filters]);

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
      <section className="relative bg-gradient-to-br from-[var(--bg-surface)] via-[var(--bg-base)] to-[var(--bg-surface)] border-b border-[var(--border-primary)] pt-8 pb-6 md:pt-14 md:pb-12 px-4 lg:px-8 overflow-hidden">
        {/* Animated Backgrounds */}
        <GridCanvas className="opacity-30 pointer-events-none" />
        <ParticleCanvas particleCount={40} className="pointer-events-none" />

        {/* Floating Decor — desktop only */}
        <FloatingElement className="absolute top-10 left-10 hidden xl:block opacity-50 pointer-events-none" delay={0}>
          <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-sm rotate-12">
            <Music className="text-[var(--color-primary)]" size={20} />
          </div>
        </FloatingElement>
        <FloatingElement className="absolute top-20 right-20 hidden xl:block opacity-50 pointer-events-none" delay={0.5}>
          <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-sm -rotate-6">
            <Trophy className="text-[var(--color-secondary)]" size={20} />
          </div>
        </FloatingElement>

        <div className="max-w-[1440px] mx-auto w-full relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Title + View Toggle */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="relative">
                <div className="absolute -left-6 top-1 text-[var(--color-primary)] opacity-50"><Sparkles size={20} /></div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-[var(--text-primary)] tracking-tight leading-none">
                  Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-primary)] animate-shimmer bg-[length:200%_100%]">Events</span>
                </h1>
                <p className="text-[var(--text-muted)] text-lg mt-2 font-medium max-w-xl">
                  Find concerts, festivals, workshops, and more happening in your city.
                </p>
              </div>

              <div className="flex items-center gap-3 text-sm bg-[var(--bg-card)] p-1.5 rounded-xl border border-[var(--border-primary)] shadow-sm">
                <span className="text-[var(--text-muted)] pl-2 font-bold text-xs uppercase tracking-wide">View:</span>
                {([
                  { mode: 'grid' as ViewMode, icon: <Grid3X3 size={16} />, label: 'Grid' },
                  { mode: 'list' as ViewMode, icon: <List size={16} />, label: 'List' },
                  { mode: 'map' as ViewMode, icon: <Map size={16} />, label: 'Map' },
                ]).map(({ mode, icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    aria-label={`${label} view`}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all font-bold ${viewMode === mode
                      ? 'bg-[var(--bg-surface)] text-[var(--color-primary)] shadow-sm border border-[var(--border-primary)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                      }`}
                  >
                    {icon} <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search bar */}
            <div className="relative z-20">
              <SearchAutocomplete value={searchQuery} onChange={setSearchQuery} onSearch={handleSearch} events={allEvents} />
            </div>

            {/* Filter chips — hidden on mobile since we use the drawer */}
            <div className="hidden md:block">
              <FilterChipsBar
                filters={filters}
                onToggleCategory={toggleCategory}
                onSetDate={(d) => { setFilters((f) => ({ ...f, dateRange: d })); setCurrentPage(1); }}
                onClearAll={handleClearAll}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-grow w-full flex flex-col" role="main">
        <div className="flex-grow px-3 sm:px-4 lg:px-8 py-4 md:py-8 w-full max-w-[1440px] mx-auto flex gap-8">
          <SidebarFilters filters={filters} setFilters={setFilters} />

          <div className="flex-1 min-w-0">
            {/* Mobile filter trigger + result count */}
            <div className="flex items-center justify-between mb-4 md:mb-5">
              <div className="flex items-center gap-3 lg:hidden">
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  aria-label="Open filters"
                  className="relative flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[var(--color-primary)] px-4 py-2.5 rounded-xl transition-colors shadow-sm"
                >
                  <Filter size={16} className="text-[var(--color-primary)]" />
                  <span>Filters</span>
                  {(filters.categories.length > 0 || filters.dateRange !== '' || filters.eventType !== 'all' || filters.priceRange[0] !== DEFAULT_FILTER_STATE.priceRange[0] || filters.priceRange[1] !== DEFAULT_FILTER_STATE.priceRange[1]) && (
                    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center size-5 rounded-full bg-[var(--color-primary)] text-white text-[10px] font-bold shadow-md">
                      {filters.categories.length + (filters.dateRange ? 1 : 0) + (filters.eventType !== 'all' ? 1 : 0) + ((filters.priceRange[0] !== DEFAULT_FILTER_STATE.priceRange[0] || filters.priceRange[1] !== DEFAULT_FILTER_STATE.priceRange[1]) ? 1 : 0)}
                    </span>
                  )}
                </button>
              </div>
              <p className="text-sm text-[var(--text-muted)]">
                {isLoading ? (
                  'Loading events...'
                ) : filteredEvents.length === 0 ? (
                  'No events found'
                ) : (
                  <>
                    Showing <span className="text-[var(--text-primary)] font-bold">{filteredEvents.length}</span> event{filteredEvents.length !== 1 ? 's' : ''}
                    {appliedSearch && <> for &quot;<span className="text-[var(--color-primary)] font-medium">{appliedSearch}</span>&quot;</>}
                  </>
                )}
              </p>
            </div>

            {/* ── LOADING STATE ── */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 size={40} className="animate-spin text-[var(--color-primary)] mb-4" />
                <p className="text-sm text-[var(--text-muted)]">Fetching events from FlowGateX...</p>
              </div>
            )}

            {/* ── ERROR STATE ── */}
            {error && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                  <Search size={28} className="text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Failed to load events</h3>
                <p className="text-sm text-[var(--text-muted)] mb-6 max-w-sm">
                  {error instanceof Error ? error.message : 'Something went wrong. Please try again later.'}
                </p>
              </motion.div>
            )}

            {/* ── MAP VIEW ── */}
            {!isLoading && !error && viewMode === 'map' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                <MapView events={filteredEvents} />
                <p className="text-center text-xs text-[var(--text-muted)] mt-3">
                  Showing {filteredEvents.filter((e) => e.coordinates.lat !== 0 || e.coordinates.lng !== 0).length} of {filteredEvents.length} event pins
                </p>
              </motion.div>
            )}

            {/* ── GRID / LIST VIEW ── */}
            {!isLoading && !error && viewMode !== 'map' && (
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
                        ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6'
                        : 'flex flex-col gap-4 sm:gap-5'
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
