import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import {
    Music, Cpu, Briefcase, Dumbbell, Palette,
    UtensilsCrossed, GraduationCap, Heart, Calendar, Sparkles, ArrowRight,
} from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const CATEGORIES = [
    { label: 'Music & Festivals', icon: Music, path: '/events?cat=music', color: 'text-pink-500' },
    { label: 'Technology', icon: Cpu, path: '/events?cat=tech', color: 'text-blue-500' },
    { label: 'Business', icon: Briefcase, path: '/events?cat=business', color: 'text-indigo-500' },
    { label: 'Sports & Fitness', icon: Dumbbell, path: '/events?cat=sports', color: 'text-emerald-500' },
    { label: 'Arts & Culture', icon: Palette, path: '/events?cat=arts', color: 'text-purple-500' },
    { label: 'Food & Drink', icon: UtensilsCrossed, path: '/events?cat=food', color: 'text-amber-500' },
    { label: 'Education', icon: GraduationCap, path: '/events?cat=education', color: 'text-teal-500' },
    { label: 'Health & Wellness', icon: Heart, path: '/events?cat=health', color: 'text-rose-500' },
];

export function MegaMenu({ isOpen, onClose }: Props) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 top-full bg-[var(--bg-card)] border-t border-[var(--border-primary)] shadow-2xl z-50"
                    onMouseLeave={onClose}
                >
                    <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-4 gap-8">
                        {/* Categories */}
                        <div className="col-span-2">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4">
                                Browse Categories
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {CATEGORIES.map((cat) => (
                                    <Link
                                        key={cat.label}
                                        to={cat.path}
                                        onClick={onClose}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-surface)] transition group"
                                    >
                                        <div className={`p-2 rounded-lg bg-[var(--bg-surface)] group-hover:bg-[var(--bg-hover)] transition ${cat.color}`}>
                                            <cat.icon size={18} />
                                        </div>
                                        <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition">
                                            {cat.label}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4">
                                Quick Access
                            </h3>
                            <div className="space-y-1">
                                {[
                                    { label: "Today's Events", icon: Calendar, path: '/events?date=today' },
                                    { label: 'Trending Now', icon: Sparkles, path: '/events?sort=popular' },
                                    { label: 'Free Events', icon: Heart, path: '/events?price=free' },
                                ].map((item) => (
                                    <Link
                                        key={item.label}
                                        to={item.path}
                                        onClick={onClose}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--bg-surface)] transition text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] group"
                                    >
                                        <item.icon size={16} />
                                        <span className="flex-1">{item.label}</span>
                                        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition" />
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Promo card */}
                        <div className="bg-gradient-to-br from-[#00A3DB]/10 to-[#A3D639]/10 rounded-2xl p-5 border border-[var(--border-primary)]">
                            <Sparkles size={24} className="text-[var(--color-primary)] mb-3" />
                            <h4 className="font-bold text-[var(--text-primary)] mb-1">Create Your Event</h4>
                            <p className="text-xs text-[var(--text-muted)] mb-3 leading-relaxed">
                                Start hosting amazing events with our powerful tools.
                            </p>
                            <Link
                                to={ROUTES.CREATE_EVENT}
                                onClick={onClose}
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] hover:underline"
                            >
                                Get Started <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default MegaMenu;
