import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import { TrendingUp, ArrowRight, Heart, Calendar, MapPin, Eye, Ticket } from 'lucide-react';
import { TRENDING_EVENTS } from '../../data/mockData';
import { fadeInUp, staggerContainer } from '../ui/SharedComponents';

const TrendingCard = ({ event, variants }: { event: typeof TRENDING_EVENTS[0], variants: Variants }) => {
    const [isLiked, setIsLiked] = useState(false);

    return (
        <motion.div variants={variants} whileHover={{ y: -8 }} className="group relative flex flex-col h-full rounded-2xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[var(--color-primary)] transition-all duration-300 shadow-lg hover:shadow-[var(--shadow-lg)]">
            <div className="relative h-48 overflow-hidden shrink-0">
                <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent" />
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ef4444] text-white text-xs font-bold shadow-md z-10">
                    <TrendingUp size={12} /> {event.trending}
                </div>
                <button onClick={(e) => { e.preventDefault(); setIsLiked(!isLiked); }} className="absolute top-3 right-3 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-[#ef4444] transition-all transform hover:scale-110 active:scale-95 z-10 group/like" aria-label="Like event">
                    <Heart size={18} className={`transition-colors duration-300 ${isLiked ? 'fill-current text-[#ef4444]' : 'text-white'}`} />
                </button>
            </div>

            <div className="p-5 flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-primary-faint)] text-[var(--color-primary)] text-xs font-bold capitalize tracking-wide border border-[var(--color-primary)]/10">{event.category}</span>
                    <span className="text-[var(--text-muted)] text-xs flex items-center gap-1 font-medium">
                        <Heart size={12} className={isLiked ? "text-[#ef4444] fill-[#ef4444]" : "text-[#ef4444]"} />
                        {(isLiked ? event.likes + 1 : event.likes).toLocaleString()}
                    </span>
                </div>

                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 group-hover:text-[var(--color-primary)] transition-colors line-clamp-1" title={event.title}>{event.title}</h3>

                <div className="space-y-2 mb-6">
                    <p className="text-sm text-[var(--text-muted)] flex items-center gap-2"><Calendar size={14} className="text-[var(--color-primary)] shrink-0" /><span className="truncate">{event.date}</span></p>
                    <p className="text-sm text-[var(--text-muted)] flex items-center gap-2"><MapPin size={14} className="text-[var(--color-secondary)] shrink-0" /><span className="truncate">{event.venue}</span></p>
                </div>

                <div className="mt-auto pt-4 border-t border-[var(--border-primary)] flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Starting from</span>
                        <span className="text-xl font-bold text-[var(--text-primary)]">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(event.price)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Link to={`/events/${event.id}`} className="relative overflow-hidden flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyan-500 via-cyan-600 to-indigo-600 hover:from-cyan-600 hover:via-indigo-600 hover:to-indigo-700 shadow-md hover:shadow-lg hover:shadow-cyan-500/30 transform hover:-translate-y-0.5 hover:scale-[1.02] transition-all duration-300 ease-out">
                            <Eye size={16} className="relative z-20" /><span className="relative z-20">Details</span>
                            <div className="absolute inset-0 opacity-0 hover:opacity-100 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-all duration-700 ease-in-out" />
                        </Link>
                        <Link to={`/booking/${event.id}`} className="relative overflow-hidden flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 hover:from-lime-600 hover:via-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg hover:shadow-lime-500/30 transform hover:-translate-y-0.5 hover:scale-[1.02] transition-all duration-300 ease-out">
                            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />
                            <span className="relative z-20 flex items-center gap-2">Book <Ticket size={16} /></span>
                        </Link>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export const TrendingSection = () => {
    return (
        <section className="py-24 bg-[var(--bg-primary)] relative overflow-hidden transition-colors duration-300">
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, var(--text-muted) 1px, transparent 0)`, backgroundSize: '40px 40px' }} />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ef4444]/10 border border-[#ef4444]/20 mb-4">
                            <TrendingUp className="text-[#ef4444]" size={14} />
                            <span className="text-xs font-bold uppercase tracking-widest text-[#ef4444]">Trending Now</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">Hot Events <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]">This Week</span></h2>
                        <p className="text-[var(--text-secondary)] text-lg max-w-xl">Don't miss out on the most popular events everyone's talking about.</p>
                    </div>
                    <Link to="/events?sort=trending" className="group flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[var(--color-primary)] text-[var(--text-primary)] font-medium transition-all hover:shadow-md">
                        View All Trending <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </motion.div>

                <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {TRENDING_EVENTS.map((event) => <TrendingCard key={event.id} event={event} variants={fadeInUp} />)}
                </motion.div>
            </div>
        </section>
    );
};