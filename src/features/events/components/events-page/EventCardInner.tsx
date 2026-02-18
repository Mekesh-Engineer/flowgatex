import { motion } from 'framer-motion';
import { MapPin, Calendar, Star, Heart, Users, ChevronDown, ChevronUp, Ticket } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { ViewMode, EventItem } from './types';
import { useCart } from '@/features/booking/hooks/useCart';

interface Props {
    event: EventItem;
    index: number;
    viewMode: ViewMode;
    isExpanded: boolean;
    onToggleExpand: () => void;
    isSaved: boolean;
    onToggleSave: () => void;
}

export default function EventCardInner({
    event, index, viewMode, isExpanded, onToggleExpand, isSaved, onToggleSave,
}: Props) {
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const handleBook = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Redirect to details page to fetch proper tiers
        navigate(`/events/${event.id}`);
    };

    if (viewMode === 'list') {
        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-primary)] overflow-hidden hover:shadow-lg transition-all group"
            >
                <Link to={`/events/${event.id}`} className="w-48 shrink-0 relative overflow-hidden">
                    <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    {event.featured && (
                        <span className="absolute top-2 left-2 bg-gradient-to-r from-[#00A3DB] to-cyan-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">Featured</span>
                    )}
                </Link>
                <div className="flex-1 py-4 pr-4 flex flex-col justify-between">
                    <div>
                        <div className="flex items-start justify-between">
                            <Link to={`/events/${event.id}`}>
                                <h3 className="text-lg font-bold text-[var(--text-primary)] hover:text-[#00A3DB] transition-colors line-clamp-1">{event.title}</h3>
                            </Link>
                            <button onClick={onToggleSave} aria-label={isSaved ? 'Unsave' : 'Save'} className="shrink-0 ml-2">
                                <Heart size={18} className={isSaved ? 'fill-red-500 text-red-500' : 'text-[var(--text-muted)] hover:text-red-500'} />
                            </button>
                        </div>
                        <p className="text-sm text-[var(--text-muted)] line-clamp-2 mt-1">{event.description}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-[var(--text-muted)]">
                            <span className="flex items-center gap-1"><Calendar size={12} />{event.date}</span>
                            <span className="flex items-center gap-1"><MapPin size={12} />{event.city}</span>
                            <span className="flex items-center gap-1"><Users size={12} />{event.attendees} going</span>
                            <span className="flex items-center gap-1"><Star size={12} className="text-amber-400" />{event.rating}</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-primary)]">
                        <div className="flex items-center gap-2">
                            {event.originalPrice && <span className="text-xs text-[var(--text-muted)] line-through">${event.originalPrice}</span>}
                            <span className="text-lg font-bold text-[var(--text-primary)]">${event.price}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link to={`/events/${event.id}`} className="px-3 py-1.5 rounded-lg border border-[var(--border-primary)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-colors">
                                View Details
                            </Link>
                            <button onClick={handleBook} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-xs font-bold shadow-sm hover:opacity-90 transition-opacity">
                                <Ticket size={12} /> Book
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    // Grid view
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-primary)] overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col"
        >
            <Link to={`/events/${event.id}`} className="relative h-48 overflow-hidden">
                <img src={event.image} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                {event.featured && (
                    <span className="absolute top-3 left-3 bg-gradient-to-r from-[#00A3DB] to-cyan-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1"><Star size={10} fill="currentColor" /> Featured</span>
                )}
                <span className="absolute top-3 right-3 bg-white/90 dark:bg-neutral-900/90 backdrop-blur text-xs font-bold px-2.5 py-1 rounded-lg text-[var(--text-primary)]">{event.category}</span>
                <div className="absolute bottom-3 left-3 text-white text-xs">
                    <p className="font-medium opacity-90">{event.date}</p>
                    <p className="font-bold text-sm">{event.time}</p>
                </div>
            </Link>

            <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                    <Link to={`/events/${event.id}`}>
                        <h3 className="text-lg font-bold text-[var(--text-primary)] hover:text-[#00A3DB] transition-colors line-clamp-1">{event.title}</h3>
                    </Link>
                    <button onClick={onToggleSave} aria-label={isSaved ? 'Unsave' : 'Save'} className="shrink-0 ml-2 mt-0.5">
                        <Heart size={18} className={isSaved ? 'fill-red-500 text-red-500' : 'text-[var(--text-muted)] hover:text-red-500 transition-colors'} />
                    </button>
                </div>

                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mb-3">
                    <span className="flex items-center gap-1"><MapPin size={12} />{event.city}</span>
                    <span className="flex items-center gap-1"><Star size={12} className="text-amber-400" />{event.rating}</span>
                    <span className="flex items-center gap-1"><Users size={12} />{event.attendees}</span>
                </div>

                {/* Expandable description */}
                {isExpanded && (
                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-sm text-[var(--text-muted)] mb-3 leading-relaxed">
                        {event.description}
                    </motion.p>
                )}
                <button onClick={onToggleExpand} className="text-xs text-[#00A3DB] font-medium flex items-center gap-0.5 mb-3 hover:underline">
                    {isExpanded ? <><ChevronUp size={12} /> Less</> : <><ChevronDown size={12} /> More</>}
                </button>

                <div className="mt-auto pt-4 border-t border-[var(--border-primary)] flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">Starting from</span>
                        <div className="flex items-center gap-2">
                            {event.originalPrice && (
                                <span className="text-xs text-[var(--text-muted)] line-through">${event.originalPrice}</span>
                            )}
                            <span className="text-lg font-bold text-[var(--text-primary)]">${event.price}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Link to={`/events/${event.id}`} className="flex items-center justify-center py-2.5 rounded-xl border border-[var(--border-primary)] text-[var(--text-primary)] text-sm font-semibold hover:bg-[var(--bg-surface)] hover:border-[var(--color-primary)] transition-all">
                            View Details
                        </Link>
                        <button onClick={handleBook} className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white text-sm font-bold shadow-lg hover:shadow-xl hover:translate-y-[-1px] transition-all">
                            <Ticket size={16} />
                            Book
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
