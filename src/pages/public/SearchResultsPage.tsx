import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Grid3X3, List, MapPin, Calendar, Clock, ChevronRight, ChevronLeft, Sparkles, Search, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import SearchInput from '@/components/common/SearchInput';
import { GridCanvas, ParticleCanvas } from '@/features/home/components/canvas/CanvasEffects';
import { FloatingElement } from '@/features/home/components/ui/SharedComponents';

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

// =============================================================================
// MOCK DATA
// =============================================================================

interface SearchResult {
    id: string;
    title: string;
    category: string;
    date: string;
    time: string;
    location: string;
    image: string;
    price: number;
    attendees: number;
}

const MOCK_RESULTS: SearchResult[] = Array.from({ length: 24 }, (_, i) => ({
    id: `event-${i + 1}`,
    title: [
        'Summer Music Festival', 'Tech Innovation Summit', 'Art Gallery Opening', 'Food & Wine Expo',
        'Startup Pitch Night', 'Yoga in the Park', 'Photography Workshop', 'Comedy Night Live',
        'Business Networking Brunch', 'Film Screening Series', 'Hackathon 2026', 'Jazz Evening',
    ][i % 12],
    category: ['Music', 'Technology', 'Arts', 'Food', 'Business', 'Health', 'Education', 'Entertainment'][i % 8],
    date: `Mar ${10 + i}, 2026`,
    time: `${9 + (i % 12)}:00`,
    location: ['Central Park, NY', 'Moscone Center, SF', 'Convention Center, LA', 'Navy Pier, Chicago'][i % 4],
    image: `https://images.unsplash.com/photo-${1492684223066 + i * 111}-81342ee5ff30?auto=format&fit=crop&q=80&w=800`,
    price: 25 + i * 15,
    attendees: 50 + i * 30,
}));

const SUGGESTED_SEARCHES = ['Concerts near me', 'Free workshops', 'Tech conferences', 'Food festivals', 'Networking events'];

const ITEMS_PER_PAGE = 9;

// =============================================================================
// COMPONENT
// =============================================================================

export default function SearchResultsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [searchValue, setSearchValue] = useState(query);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        setSearchValue(query);
        setCurrentPage(1);
    }, [query]);

    const handleSearch = (value: string) => {
        setSearchParams(value ? { q: value } : {});
    };

    const filteredResults = useMemo(() => {
        if (!query) return MOCK_RESULTS;
        const q = query.toLowerCase();
        return MOCK_RESULTS.filter(
            (r) =>
                r.title.toLowerCase().includes(q) ||
                r.category.toLowerCase().includes(q) ||
                r.location.toLowerCase().includes(q)
        );
    }, [query]);

    const totalPages = Math.ceil(filteredResults.length / ITEMS_PER_PAGE);
    const paginatedResults = filteredResults.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans transition-colors duration-300">
            {/* ─── Search Hero ─── */}
            <section className="relative bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] pt-12 pb-10 overflow-hidden transition-colors duration-300">
                {/* Background decorations */}
                <GridCanvas className="opacity-30 pointer-events-none" />
                <ParticleCanvas particleCount={30} className="pointer-events-none" />

                <FloatingElement className="absolute top-10 left-10 hidden lg:block opacity-50 pointer-events-none" delay={0}>
                    <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-sm rotate-12">
                        <Music className="text-[var(--color-primary)]" size={20} />
                    </div>
                </FloatingElement>

                <FloatingElement className="absolute bottom-10 right-10 hidden lg:block opacity-50 pointer-events-none" delay={1.2}>
                    <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-sm -rotate-6">
                        <Sparkles className="text-[var(--color-secondary)]" size={20} />
                    </div>
                </FloatingElement>

                <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-primary)] rounded-full blur-[120px] opacity-5 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-[var(--color-secondary)] rounded-full blur-[100px] opacity-5 pointer-events-none" />
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, var(--text-muted) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
                </div>

                <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1]">
                            Search{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]">
                                Results
                            </span>
                        </h1>
                        {query && (
                            <p className="text-[var(--text-muted)] text-sm mt-3 font-light">
                                Showing results for "<span className="text-[var(--color-primary)] font-medium">{query}</span>"
                            </p>
                        )}
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="flex gap-3">
                        <SearchInput
                            value={searchValue}
                            onChange={setSearchValue}
                            onSearch={handleSearch}
                            placeholder="Search events, venues, categories..."
                            size="lg"
                            className="flex-1"
                        />
                        <button
                            onClick={() => handleSearch(searchValue)}
                            className="relative shrink-0 px-6 py-3 rounded-xl font-semibold text-white bg-[var(--color-primary)] overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-[var(--shadow-primary)] group"
                        >
                            <span className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-focus)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <span className="relative flex items-center gap-2"><Search size={16} /> Search</span>
                        </button>
                    </motion.div>

                    {/* Suggested searches */}
                    {!query && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex flex-wrap gap-2">
                            <span className="text-xs text-[var(--text-muted)] self-center mr-1">
                                <Sparkles size={14} className="inline mr-1 text-[var(--color-secondary)]" />
                                Try:
                            </span>
                            {SUGGESTED_SEARCHES.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => {
                                        setSearchValue(s);
                                        handleSearch(s);
                                    }}
                                    className="px-3.5 py-1.5 text-xs font-medium rounded-full border border-[var(--border-primary)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-faint)] transition-all duration-300"
                                >
                                    {s}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </div>
            </section>

            {/* ─── Results ─── */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
                {/* Toolbar */}
                <div className="flex items-center justify-between mb-8">
                    <p className="text-sm text-[var(--text-muted)]">
                        <span className="font-bold text-[var(--text-primary)]">{filteredResults.length}</span> events found
                    </p>
                    <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                        {(['grid', 'list'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                aria-pressed={viewMode === mode}
                                className={cn(
                                    'p-2 rounded-md transition-all duration-300',
                                    viewMode === mode
                                        ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--shadow-primary)]'
                                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                )}
                            >
                                {mode === 'grid' ? <Grid3X3 size={16} /> : <List size={16} />}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className={cn('bg-[var(--bg-card)] rounded-2xl animate-pulse border border-[var(--border-primary)]', viewMode === 'grid' ? 'h-80' : 'h-32')} />
                        ))}
                    </div>
                ) : filteredResults.length === 0 ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] mb-6">
                            <Search size={32} className="text-[var(--text-muted)]" />
                        </div>
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">No events found</h2>
                        <p className="text-[var(--text-muted)] mb-6 max-w-md mx-auto">
                            We couldn't find any events matching "{query}". Try different keywords.
                        </p>
                        <button
                            onClick={() => { setSearchValue(''); handleSearch(''); }}
                            className="relative px-6 py-3 rounded-xl text-white font-semibold bg-[var(--color-primary)] overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-[var(--shadow-primary)] group"
                        >
                            <span className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-focus)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <span className="relative">Clear Search</span>
                        </button>
                    </motion.div>
                ) : (
                    <>
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={staggerContainer}
                            layout
                            className={
                                viewMode === 'grid'
                                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                                    : 'flex flex-col gap-4'
                            }
                        >
                            {paginatedResults.map((event) => (
                                <motion.div
                                    key={event.id}
                                    variants={fadeInUp}
                                    whileHover={{ y: viewMode === 'grid' ? -6 : -2 }}
                                >
                                    <Link to={`/events/${event.id}`}>
                                        {viewMode === 'grid' ? (
                                            <div className="group rounded-2xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[var(--color-primary)] shadow-lg hover:shadow-xl transition-all duration-300">
                                                <div className="h-48 relative overflow-hidden">
                                                    <img
                                                        src={event.image}
                                                        alt={event.title}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800'; }}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent" />
                                                    <span className="absolute top-3 right-3 px-2.5 py-1 bg-[var(--bg-card)]/90 backdrop-blur-sm text-xs font-bold rounded-full text-[var(--text-primary)] border border-[var(--border-primary)]">
                                                        {event.category}
                                                    </span>
                                                    <div className="absolute bottom-3 left-4">
                                                        <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-primary-faint)] text-[var(--color-primary)] text-xs font-bold border border-[var(--color-primary)]/10">
                                                            {event.date} &middot; {event.time}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="p-5">
                                                    <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-1">
                                                        {event.title}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] mt-2">
                                                        <MapPin size={14} />
                                                        <span className="line-clamp-1">{event.location}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border-primary)]">
                                                        <span className="font-bold text-lg text-[var(--text-primary)]">
                                                            ${event.price}
                                                        </span>
                                                        <span className="text-xs text-[var(--text-muted)] font-medium">
                                                            {event.attendees} attending
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-primary)] hover:border-[var(--color-primary)] p-4 flex gap-4 hover:shadow-lg transition-all duration-300 group">
                                                <img
                                                    src={event.image}
                                                    alt={event.title}
                                                    className="w-24 h-24 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform duration-500"
                                                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=200'; }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between">
                                                        <h3 className="font-bold text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-1">
                                                            {event.title}
                                                        </h3>
                                                        <span className="text-sm font-bold text-[var(--text-primary)] shrink-0 ml-4">
                                                            ${event.price}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-2 text-sm text-[var(--text-muted)]">
                                                        <span className="flex items-center gap-1"><Calendar size={13} /> {event.date}</span>
                                                        <span className="flex items-center gap-1"><Clock size={13} /> {event.time}</span>
                                                        <span className="flex items-center gap-1"><MapPin size={13} /> {event.location}</span>
                                                    </div>
                                                    <span className="inline-block mt-2 px-2.5 py-0.5 text-xs font-semibold bg-[var(--color-primary-faint)] text-[var(--color-primary)] rounded-full border border-[var(--color-primary)]/10">
                                                        {event.category}
                                                    </span>
                                                </div>
                                                <ChevronRight size={20} className="text-[var(--text-muted)] self-center shrink-0 group-hover:text-[var(--color-primary)] transition-colors" />
                                            </div>
                                        )}
                                    </Link>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <nav className="mt-12 flex justify-center" aria-label="Pagination">
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        aria-label="Previous page"
                                        className="size-10 flex items-center justify-center rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
                                                : 'border border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        aria-label="Next page"
                                        className="size-10 flex items-center justify-center rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </nav>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
