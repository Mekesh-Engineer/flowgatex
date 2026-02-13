import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users, Star, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import Pagination from '@/components/common/Pagination';
import { Skeleton } from '@/components/common/Skeleton';
import { EVENT_CATEGORIES } from '@/lib/constants';

// =============================================================================
// MOCK DATA
// =============================================================================

interface CategoryEvent {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    image: string;
    price: number;
    rating: number;
    attendees: number;
    featured?: boolean;
}

const CATEGORY_META: Record<string, { title: string; description: string; banner: string }> = {
    music: {
        title: 'Music & Festivals',
        description: 'Discover live performances, concerts, and music festivals happening near you.',
        banner: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&q=80&w=1600',
    },
    sports: {
        title: 'Sports & Fitness',
        description: 'From marathons to local matches — find sports and fitness events.',
        banner: 'https://images.unsplash.com/photo-1461896836934-bd45ba3c7e09?auto=format&fit=crop&q=80&w=1600',
    },
    conference: {
        title: 'Conferences',
        description: 'Join industry leaders and professionals at top conferences.',
        banner: 'https://images.unsplash.com/photo-1540575467063-178a509371f7?auto=format&fit=crop&q=80&w=1600',
    },
    tech: {
        title: 'Technology',
        description: 'Hackathons, meetups, and tech talks for developers and innovators.',
        banner: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1600',
    },
    arts: {
        title: 'Arts & Culture',
        description: 'Gallery openings, theater, and cultural experiences.',
        banner: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=1600',
    },
    food: {
        title: 'Food & Drink',
        description: 'Food festivals, wine tastings, and culinary events.',
        banner: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=1600',
    },
};

const generateEvents = (slug: string): CategoryEvent[] =>
    Array.from({ length: 18 }, (_, i) => ({
        id: `${slug}-${i + 1}`,
        title: `${CATEGORY_META[slug]?.title || slug} Event ${i + 1}`,
        date: `Mar ${5 + i}, 2026`,
        time: `${10 + (i % 10)}:00`,
        location: ['Central Park, NY', 'Convention Center, SF', 'Exhibition Hall, LA', 'Navy Pier, Chicago'][i % 4],
        image: `https://images.unsplash.com/photo-${1492684223066 + i * 222}-81342ee5ff30?auto=format&fit=crop&q=80&w=800`,
        price: 20 + i * 12,
        rating: 3.5 + (i % 3) * 0.5,
        attendees: 80 + i * 25,
        featured: i < 3,
    }));

const ITEMS_PER_PAGE = 9;

// =============================================================================
// COMPONENT
// =============================================================================

export default function CategoryPage() {
    const { slug } = useParams<{ slug: string }>();
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const meta = CATEGORY_META[slug || ''] || {
        title: slug?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Category',
        description: 'Browse events in this category.',
        banner: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1600',
    };

    const events = useMemo(() => generateEvents(slug || ''), [slug]);
    const featured = events.filter((e) => e.featured);
    const regular = events.filter((e) => !e.featured);
    const totalPages = Math.ceil(regular.length / ITEMS_PER_PAGE);
    const paginatedEvents = regular.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    useEffect(() => {
        setLoading(true);
        setCurrentPage(1);
        const timer = setTimeout(() => setLoading(false), 600);
        return () => clearTimeout(timer);
    }, [slug]);

    return (
        <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
            {/* ─── Category Hero Banner ─── */}
            <section className="relative h-64 md:h-80 overflow-hidden">
                <img
                    src={meta.banner}
                    alt={meta.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1600';
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="relative z-10 h-full flex flex-col justify-end max-w-7xl mx-auto px-4 lg:px-8 pb-8">
                    <Link
                        to="/events"
                        className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white mb-4 transition-colors w-fit"
                    >
                        <ArrowLeft size={16} /> All Events
                    </Link>
                    <h1 className="text-3xl md:text-5xl font-bold text-white">{meta.title}</h1>
                    <p className="text-white/80 text-sm md:text-base mt-2 max-w-2xl">{meta.description}</p>
                </div>
            </section>

            {/* ─── Category Chips ─── */}
            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 overflow-x-auto no-scrollbar">
                <div className="flex gap-2">
                    {EVENT_CATEGORIES.map((cat) => (
                        <Link
                            key={cat.id}
                            to={`/category/${cat.id}`}
                            className={cn(
                                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-all',
                                slug === cat.id
                                    ? 'bg-primary-500 text-white border-primary-500'
                                    : 'bg-white dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 border-gray-200 dark:border-neutral-700 hover:border-primary-500 hover:text-primary-600'
                            )}
                        >
                            {cat.label}
                        </Link>
                    ))}
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 lg:px-8 pb-16">
                {loading ? (
                    <div className="space-y-8">
                        <Skeleton className="h-8 w-48" rounded="lg" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-72" rounded="2xl" />
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* ─── Popular / Featured Events ─── */}
                        {featured.length > 0 && (
                            <section className="mb-12">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <Star className="text-amber-500" size={20} />
                                    Popular in {meta.title}
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {featured.map((event) => (
                                        <Link key={event.id} to={`/events/${event.id}`}>
                                            <motion.div
                                                whileHover={{ y: -4 }}
                                                className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group"
                                            >
                                                <div className="h-48 relative overflow-hidden">
                                                    <img
                                                        src={event.image}
                                                        alt={event.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src =
                                                                'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800';
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-amber-500 text-white px-2 py-0.5 rounded-lg text-xs font-bold">
                                                        <Star size={12} fill="currentColor" /> Featured
                                                    </div>
                                                </div>
                                                <div className="p-5">
                                                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                                                        {event.title}
                                                    </h3>
                                                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 dark:text-neutral-400">
                                                        <span className="flex items-center gap-1"><Calendar size={13} /> {event.date}</span>
                                                        <span className="flex items-center gap-1"><MapPin size={13} /> {event.location}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-neutral-700">
                                                        <span className="font-bold text-gray-900 dark:text-white">${event.price}</span>
                                                        <span className="flex items-center gap-1 text-xs text-gray-500">
                                                            <Users size={12} /> {event.attendees}
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* ─── All Events ─── */}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    All {meta.title} Events
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-neutral-400">
                                    {regular.length} events
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {paginatedEvents.map((event, i) => (
                                    <motion.div
                                        key={event.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                    >
                                        <Link to={`/events/${event.id}`}>
                                            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group">
                                                <div className="h-44 relative overflow-hidden">
                                                    <img
                                                        src={event.image}
                                                        alt={event.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src =
                                                                'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800';
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                                    <div className="absolute bottom-3 left-4 text-white">
                                                        <p className="text-xs opacity-90">{event.date}</p>
                                                    </div>
                                                </div>
                                                <div className="p-4">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-1">
                                                        {event.title}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-neutral-400 mt-1.5">
                                                        <MapPin size={12} />
                                                        <span className="line-clamp-1">{event.location}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-neutral-700">
                                                        <span className="font-bold text-sm text-gray-900 dark:text-white">
                                                            ${event.price}
                                                        </span>
                                                        <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                                            <Star size={12} fill="currentColor" /> {event.rating.toFixed(1)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>

                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                className="mt-10"
                            />
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}
