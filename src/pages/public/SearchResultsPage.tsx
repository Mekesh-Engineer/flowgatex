import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Grid3X3, List, MapPin, Calendar, Clock, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import Pagination from '@/components/common/Pagination';
import SearchInput from '@/components/common/SearchInput';
import { Skeleton } from '@/components/common/Skeleton';

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
        <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
            {/* ─── Search Hero ─── */}
            <section className="relative bg-gradient-to-br from-[var(--bg-surface)] via-[var(--bg-base)] to-[var(--bg-surface)] border-b border-[var(--border-primary)] pt-10 pb-8 px-4 lg:px-8">
                <div className="max-w-5xl mx-auto space-y-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                            Search{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]">
                                Results
                            </span>
                        </h1>
                        {query && (
                            <p className="text-[var(--text-muted)] text-sm mt-2">
                                Showing results for "<span className="text-[var(--color-primary)] font-medium">{query}</span>"
                            </p>
                        )}
                    </motion.div>

                    <div className="flex gap-3">
                        <SearchInput
                            value={searchValue}
                            onChange={setSearchValue}
                            onSearch={handleSearch}
                            placeholder="Search events, venues, categories..."
                            size="lg"
                            className="flex-1"
                        />
                        <Button onClick={() => handleSearch(searchValue)} className="shrink-0">
                            Search
                        </Button>
                    </div>

                    {/* Suggested searches */}
                    {!query && (
                        <div className="flex flex-wrap gap-2">
                            <span className="text-xs text-[var(--text-muted)] self-center mr-1">
                                <Sparkles size={14} className="inline mr-1" />
                                Try:
                            </span>
                            {SUGGESTED_SEARCHES.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => {
                                        setSearchValue(s);
                                        handleSearch(s);
                                    }}
                                    className="px-3 py-1.5 text-xs rounded-full border border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ─── Results ─── */}
            <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
                {/* Toolbar */}
                <div className="flex items-center justify-between mb-6">
                    <p className="text-sm text-[var(--text-muted)]">
                        <span className="font-bold text-[var(--text-primary)]">{filteredResults.length}</span> events found
                    </p>
                    <div className="flex items-center gap-2">
                        {(['grid', 'list'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                aria-pressed={viewMode === mode}
                                className={cn(
                                    'p-2 rounded-lg border transition-all',
                                    viewMode === mode
                                        ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                                        : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--color-primary)]'
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
                            <Skeleton key={i} className={viewMode === 'grid' ? 'h-80' : 'h-32'} rounded="2xl" />
                        ))}
                    </div>
                ) : filteredResults.length === 0 ? (
                    <EmptyState
                        variant="search"
                        title="No events found"
                        description={`We couldn't find any events matching "${query}". Try different keywords.`}
                        action={
                            <Button onClick={() => { setSearchValue(''); handleSearch(''); }}>
                                Clear Search
                            </Button>
                        }
                    />
                ) : (
                    <>
                        <motion.div
                            layout
                            className={
                                viewMode === 'grid'
                                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                                    : 'flex flex-col gap-4'
                            }
                        >
                            {paginatedResults.map((event, i) => (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <Link to={`/events/${event.id}`}>
                                        {viewMode === 'grid' ? (
                                            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group">
                                                <div className="h-48 bg-gray-100 dark:bg-neutral-700 relative overflow-hidden">
                                                    <img
                                                        src={event.image}
                                                        alt={event.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800'; }}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                    <span className="absolute top-3 right-3 px-2.5 py-1 bg-white/90 dark:bg-neutral-900/90 text-xs font-bold rounded-lg">
                                                        {event.category}
                                                    </span>
                                                    <div className="absolute bottom-3 left-4 text-white">
                                                        <p className="text-xs opacity-90">{event.date}</p>
                                                        <p className="text-sm font-bold">{event.time}</p>
                                                    </div>
                                                </div>
                                                <div className="p-5">
                                                    <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-1">
                                                        {event.title}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-neutral-400 mt-2">
                                                        <MapPin size={14} />
                                                        <span className="line-clamp-1">{event.location}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-neutral-700">
                                                        <span className="font-bold text-gray-900 dark:text-white">
                                                            ${event.price}
                                                        </span>
                                                        <span className="text-xs text-gray-500 dark:text-neutral-400">
                                                            {event.attendees} attending
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-4 flex gap-4 hover:shadow-md transition-all group">
                                                <img
                                                    src={event.image}
                                                    alt={event.title}
                                                    className="w-24 h-24 rounded-xl object-cover shrink-0"
                                                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=200'; }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between">
                                                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-1">
                                                            {event.title}
                                                        </h3>
                                                        <span className="text-sm font-bold text-gray-900 dark:text-white shrink-0 ml-4">
                                                            ${event.price}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 dark:text-neutral-400">
                                                        <span className="flex items-center gap-1"><Calendar size={13} /> {event.date}</span>
                                                        <span className="flex items-center gap-1"><Clock size={13} /> {event.time}</span>
                                                        <span className="flex items-center gap-1"><MapPin size={13} /> {event.location}</span>
                                                    </div>
                                                    <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full">
                                                        {event.category}
                                                    </span>
                                                </div>
                                                <ChevronRight size={20} className="text-gray-300 dark:text-neutral-600 self-center shrink-0" />
                                            </div>
                                        )}
                                    </Link>
                                </motion.div>
                            ))}
                        </motion.div>

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            className="mt-10"
                        />
                    </>
                )}
            </main>
        </div>
    );
}
