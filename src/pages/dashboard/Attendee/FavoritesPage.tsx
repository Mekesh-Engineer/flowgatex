import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart,
    Calendar,
    MapPin,
    Star,
    Grid3X3,
    List,
    Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { SkeletonCard } from '@/components/common/Skeleton';
import Pagination from '@/components/common/Pagination';

// =============================================================================
// TYPES & MOCK DATA
// =============================================================================

interface FavoriteEvent {
    id: string;
    title: string;
    date: string;
    location: string;
    category: string;
    image: string;
    price: number;
    rating: number;
    attendees: number;
    savedAt: string;
}

const MOCK_FAVORITES: FavoriteEvent[] = Array.from({ length: 12 }, (_, i) => ({
    id: `fav-${i + 1}`,
    title: [
        'Summer Music Festival',
        'Tech Conference 2026',
        'Art in the Park',
        'Startup Weekend',
        'Jazz Night Live',
        'Photography Workshop',
        'Wine & Cheese Evening',
        'Marathon 2026',
        'Design Thinking Summit',
        'Food Truck Rally',
        'Open Mic Night',
        'Blockchain Conference',
    ][i],
    date: `Apr ${3 + i * 2}, 2026`,
    location: ['Central Park, NY', 'Moscone Center, SF', 'Navy Pier, Chicago', 'Wynwood, Miami'][i % 4],
    category: ['Music', 'Technology', 'Arts', 'Business', 'Music', 'Photography', 'Food', 'Sports', 'Design', 'Food', 'Music', 'Technology'][i],
    image: `https://images.unsplash.com/photo-${1492684223066 + i * 444}-81342ee5ff30?auto=format&fit=crop&q=80&w=800`,
    price: 15 + i * 10,
    rating: 3.8 + (i % 4) * 0.3,
    attendees: 50 + i * 30,
    savedAt: `Jan ${15 + i}, 2026`,
}));

const ITEMS_PER_PAGE = 6;

const container = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 22 } },
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function FavoritesPage() {
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState<FavoriteEvent[]>(MOCK_FAVORITES);
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [sort, setSort] = useState<'newest' | 'date' | 'price'>('newest');
    const [page, setPage] = useState(1);
    const [removingId, setRemovingId] = useState<string | null>(null);

    useEffect(() => {
        const t = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(t);
    }, []);

    const sorted = useMemo(() => {
        const list = [...favorites];
        if (sort === 'date') list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        else if (sort === 'price') list.sort((a, b) => a.price - b.price);
        return list;
    }, [favorites, sort]);

    const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
    const paginated = sorted.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const handleRemove = (id: string) => {
        setRemovingId(id);
        setTimeout(() => {
            setFavorites((prev) => prev.filter((f) => f.id !== id));
            setRemovingId(null);
        }, 300);
    };

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Favorites</h1>
                    <p className="text-gray-500 dark:text-neutral-400 mt-1">
                        {favorites.length} saved event{favorites.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Sort */}
                    <select
                        value={sort}
                        onChange={(e) => { setSort(e.target.value as 'newest' | 'date' | 'price'); setPage(1); }}
                        className="px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        aria-label="Sort favorites"
                    >
                        <option value="newest">Recently Saved</option>
                        <option value="date">Event Date</option>
                        <option value="price">Price</option>
                    </select>
                    {/* View Toggle */}
                    <div className="flex bg-gray-100 dark:bg-neutral-700 rounded-xl p-1">
                        <button
                            onClick={() => setView('grid')}
                            className={cn(
                                'p-2 rounded-lg transition-colors',
                                view === 'grid' ? 'bg-white dark:bg-neutral-600 shadow-sm text-primary-600' : 'text-gray-500'
                            )}
                            aria-label="Grid view"
                        >
                            <Grid3X3 size={16} />
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={cn(
                                'p-2 rounded-lg transition-colors',
                                view === 'list' ? 'bg-white dark:bg-neutral-600 shadow-sm text-primary-600' : 'text-gray-500'
                            )}
                            aria-label="List view"
                        >
                            <List size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className={cn(
                    view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'
                )}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <SkeletonCard key={i} className={view === 'grid' ? 'h-72' : 'h-32'} />
                    ))}
                </div>
            ) : favorites.length === 0 ? (
                <EmptyState
                    title="No saved events"
                    description="Events you save will appear here. Browse events and tap the heart icon to save them."
                    icon={<Heart className="text-pink-400" size={48} />}
                    action={
                        <Button variant="primary" onClick={() => (window.location.href = '/events')}>
                            Browse Events
                        </Button>
                    }
                />
            ) : (
                <>
                    {/* ── Grid View ── */}
                    {view === 'grid' && (
                        <motion.div
                            variants={container}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
                        >
                            <AnimatePresence>
                                {paginated.map((event) => (
                                    <motion.div
                                        key={event.id}
                                        variants={item}
                                        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                                        layout
                                    >
                                        <div className={cn(
                                            'bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group',
                                            removingId === event.id && 'opacity-40 scale-95'
                                        )}>
                                            <div className="h-44 relative overflow-hidden">
                                                <img
                                                    src={event.image}
                                                    alt={event.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800'; }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                                <button
                                                    onClick={() => handleRemove(event.id)}
                                                    className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-neutral-800/90 rounded-full hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors group/heart"
                                                    aria-label={`Remove ${event.title} from favorites`}
                                                >
                                                    <Heart size={16} fill="currentColor" className="text-red-500 group-hover/heart:scale-110 transition-transform" />
                                                </button>
                                                <span className="absolute bottom-3 left-3 px-2 py-0.5 bg-white/90 dark:bg-neutral-800/90 rounded-lg text-xs font-medium text-gray-700 dark:text-neutral-300">
                                                    {event.category}
                                                </span>
                                            </div>
                                            <Link to={`/events/${event.id}`} className="block p-4">
                                                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-1">
                                                    {event.title}
                                                </h3>
                                                <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 dark:text-neutral-400">
                                                    <span className="flex items-center gap-1"><Calendar size={13} /> {event.date}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-neutral-500 mt-1">
                                                    <MapPin size={12} /> {event.location}
                                                </div>
                                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-neutral-700">
                                                    <span className="font-bold text-gray-900 dark:text-white">${event.price}</span>
                                                    <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                                        <Star size={12} fill="currentColor" /> {event.rating.toFixed(1)}
                                                    </span>
                                                </div>
                                            </Link>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {/* ── List View ── */}
                    {view === 'list' && (
                        <motion.div variants={container} initial="hidden" animate="visible" className="space-y-3">
                            <AnimatePresence>
                                {paginated.map((event) => (
                                    <motion.div
                                        key={event.id}
                                        variants={item}
                                        exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
                                        layout
                                    >
                                        <div className={cn(
                                            'bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-all overflow-hidden flex',
                                            removingId === event.id && 'opacity-40'
                                        )}>
                                            <div className="w-36 h-28 flex-shrink-0 overflow-hidden">
                                                <img
                                                    src={event.image}
                                                    alt={event.title}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=400'; }}
                                                />
                                            </div>
                                            <div className="flex-1 p-4 flex items-center justify-between gap-4">
                                                <Link to={`/events/${event.id}`} className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 transition-colors line-clamp-1">
                                                        {event.title}
                                                    </h3>
                                                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-neutral-400">
                                                        <span className="flex items-center gap-1"><Calendar size={13} /> {event.date}</span>
                                                        <span className="flex items-center gap-1"><MapPin size={13} /> {event.location}</span>
                                                    </div>
                                                </Link>
                                                <div className="flex items-center gap-4 flex-shrink-0">
                                                    <span className="font-bold text-gray-900 dark:text-white">${event.price}</span>
                                                    <button
                                                        onClick={() => handleRemove(event.id)}
                                                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors"
                                                        aria-label={`Remove ${event.title} from favorites`}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} className="mt-6" />
                </>
            )}
        </div>
    );
}
