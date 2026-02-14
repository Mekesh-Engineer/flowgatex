import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users, Star, ArrowLeft, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EVENT_CATEGORIES } from '@/lib/constants';

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

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
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans transition-colors duration-300">
            {/* ─── Category Hero Banner ─── */}
            <section className="relative h-72 md:h-96 overflow-hidden">
                <img
                    src={meta.banner}
                    alt={meta.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1600';
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-black/50 to-transparent" />
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, var(--text-muted) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
                </div>
                <div className="relative z-10 h-full flex flex-col justify-end max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <Link
                            to="/events"
                            className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white mb-4 transition-colors w-fit group"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> All Events
                        </Link>
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.1] mb-3">
                            {meta.title}
                        </h1>
                        <p className="text-white/80 text-base md:text-lg max-w-2xl leading-relaxed font-light">
                            {meta.description}
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ─── Category Chips ─── */}
            <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-2">
                        {EVENT_CATEGORIES.map((cat) => (
                            <Link
                                key={cat.id}
                                to={`/category/${cat.id}`}
                                className={cn(
                                    'px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition-all duration-300',
                                    slug === cat.id
                                        ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-focus)] text-white border-[var(--color-primary)] shadow-lg shadow-[var(--shadow-primary)]'
                                        : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
                                )}
                            >
                                {cat.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                {loading ? (
                    <div className="space-y-8">
                        <div className="h-8 w-48 bg-[var(--bg-card)] rounded-lg animate-pulse" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-72 bg-[var(--bg-card)] rounded-2xl animate-pulse border border-[var(--border-primary)]" />
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* ─── Popular / Featured Events ─── */}
                        {featured.length > 0 && (
                            <motion.section
                                initial="hidden"
                                animate="visible"
                                variants={staggerContainer}
                                className="mb-16"
                            >
                                <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-8">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                                        <Star size={14} className="text-amber-500" />
                                        <span className="text-xs font-bold uppercase tracking-widest text-amber-500">Featured</span>
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                                        Popular in{' '}
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]">
                                            {meta.title}
                                        </span>
                                    </h2>
                                </motion.div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {featured.map((event) => (
                                        <motion.div key={event.id} variants={fadeInUp} whileHover={{ y: -8 }}>
                                            <Link to={`/events/${event.id}`}>
                                                <div className="group relative rounded-2xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[var(--color-primary)] transition-all duration-300 shadow-lg hover:shadow-xl">
                                                    <div className="h-52 relative overflow-hidden">
                                                        <img
                                                            src={event.image}
                                                            alt={event.title}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src =
                                                                    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800';
                                                            }}
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent" />
                                                        <div className="absolute top-3 left-3 flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                                            <Sparkles size={12} /> Featured
                                                        </div>
                                                    </div>
                                                    <div className="p-5">
                                                        <h3 className="font-bold text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors text-lg">
                                                            {event.title}
                                                        </h3>
                                                        <div className="flex items-center gap-4 mt-2 text-sm text-[var(--text-muted)]">
                                                            <span className="flex items-center gap-1"><Calendar size={13} /> {event.date}</span>
                                                            <span className="flex items-center gap-1"><MapPin size={13} /> {event.location}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border-primary)]">
                                                            <span className="text-xl font-bold text-[var(--text-primary)]">${event.price}</span>
                                                            <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                                                                <Users size={13} /> {event.attendees}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.section>
                        )}

                        {/* ─── All Events ─── */}
                        <motion.section initial="hidden" animate="visible" variants={staggerContainer}>
                            <motion.div variants={fadeInUp} className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                                    All{' '}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]">
                                        Events
                                    </span>
                                </h2>
                                <span className="text-sm text-[var(--text-muted)] font-medium">
                                    {regular.length} events
                                </span>
                            </motion.div>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {paginatedEvents.map((event) => (
                                    <motion.div
                                        key={event.id}
                                        variants={fadeInUp}
                                        whileHover={{ y: -5 }}
                                    >
                                        <Link to={`/events/${event.id}`}>
                                            <div className="group rounded-2xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[var(--color-primary)] transition-all duration-300 shadow-lg hover:shadow-xl">
                                                <div className="h-48 relative overflow-hidden">
                                                    <img
                                                        src={event.image}
                                                        alt={event.title}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src =
                                                                'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800';
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent" />
                                                    <div className="absolute bottom-3 left-4">
                                                        <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-primary-faint)] text-[var(--color-primary)] text-xs font-bold capitalize tracking-wide border border-[var(--color-primary)]/10">
                                                            {event.date}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="p-5">
                                                    <h3 className="font-bold text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-1">
                                                        {event.title}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mt-2">
                                                        <MapPin size={12} />
                                                        <span className="line-clamp-1">{event.location}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border-primary)]">
                                                        <span className="text-lg font-bold text-[var(--text-primary)]">
                                                            ${event.price}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 text-xs font-medium">
                                                            <Star size={13} className="fill-amber-400 text-amber-400" />
                                                            <span className="text-[var(--text-secondary)]">{event.rating.toFixed(1)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>

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
                        </motion.section>
                    </>
                )}
            </main>
        </div>
    );
}
