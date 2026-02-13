import { useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Music, Trophy, Cpu, ArrowRight, Sparkles, Calendar, Globe, Mic2, Search, Filter, MapPin, ChevronDown } from 'lucide-react';
import useAuth from '@/features/auth/hooks/useAuth';
import { GridCanvas, ParticleCanvas } from '../canvas/CanvasEffects';
import { FloatingElement, PulsingDot, GlowingBorder, fadeInUp } from '../ui/SharedComponents';

export const HeroSection = () => {
    const { isAuthenticated } = useAuth();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const heroRef = useRef<HTMLElement>(null);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!heroRef.current) return;
        const rect = heroRef.current.getBoundingClientRect();
        setMousePosition({
            x: (e.clientX - rect.left) / rect.width,
            y: (e.clientY - rect.top) / rect.height,
        });
    }, []);

    return (
        <section
            ref={heroRef}
            onMouseMove={handleMouseMove}
            className="relative min-h-screen flex flex-col justify-center pt-28 pb-12 px-4 overflow-hidden bg-[var(--bg-primary)] transition-colors duration-300"
        >
            <GridCanvas className="opacity-50" />
            <ParticleCanvas particleCount={60} />

            <div className="absolute inset-0 z-0">
                <video
                    autoPlay muted loop playsInline
                    poster="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070"
                    className="w-full h-full object-cover opacity-30 mix-blend-overlay dark:opacity-20 dark:mix-blend-screen transition-all duration-700"
                    aria-hidden="true"
                >
                    <source src="src/assets/video/Hero_homepage.mp4" type="video/mp4" />
                </video>

                <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)]/95 via-[var(--bg-primary)]/80 to-[var(--bg-primary)]" />

                <motion.div
                    className="absolute w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle, hsla(var(--hue-primary), 100%, 50%, 0.15) 0%, transparent 70%)',
                        left: `${mousePosition.x * 100 - 30}%`,
                        top: `${mousePosition.y * 100 - 30}%`,
                    }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 4, repeat: Infinity }}
                />
                <motion.div
                    className="absolute w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle, hsla(var(--hue-secondary), 75%, 50%, 0.1) 0%, transparent 70%)',
                        right: `${(1 - mousePosition.x) * 100 - 20}%`,
                        bottom: `${(1 - mousePosition.y) * 100 - 20}%`,
                    }}
                    animate={{ scale: [1.1, 1, 1.1] }}
                    transition={{ duration: 5, repeat: Infinity }}
                />
            </div>

            <FloatingElement className="absolute top-20 left-10 z-10 hidden lg:block" delay={0}>
                <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-lg">
                    <Music className="text-[var(--color-primary)]" size={24} />
                </div>
            </FloatingElement>
            <FloatingElement className="absolute top-40 right-20 z-10 hidden lg:block" delay={0.5}>
                <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-lg">
                    <Trophy className="text-[var(--color-secondary)]" size={24} />
                </div>
            </FloatingElement>
            <FloatingElement className="absolute bottom-40 left-20 z-10 hidden lg:block" delay={1}>
                <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-lg">
                    <Cpu className="text-[var(--color-warning)]" size={24} />
                </div>
            </FloatingElement>

            <div className="relative z-10 w-full max-w-6xl mx-auto text-center flex flex-col items-center gap-8">
                <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="space-y-6 max-w-4xl">
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="inline-flex items-center gap-3 py-2 px-5 rounded-full bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-lg">
                        <PulsingDot color="bg-[var(--color-primary)]" />
                        <span className="text-xs font-bold tracking-widest text-[var(--text-secondary)] uppercase">Live Events Happening Now</span>
                        <span className="text-xs font-bold text-[var(--color-primary)]">2,450+</span>
                    </motion.div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-[var(--text-primary)] leading-[1.05] tracking-tight">
                        Discover{' '}
                        <span className="relative inline-block">
                            <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-primary)]">Amazing</span>
                            <motion.span className="absolute -inset-1 bg-gradient-to-r from-[var(--color-primary)]/20 to-[var(--color-secondary)]/20 blur-lg rounded-lg" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
                        </span>
                        {' '}Events
                    </h1>

                    <p className="text-[var(--text-secondary)] text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
                        Find and book tickets for the best events happening near you. From underground concerts to tech workshops, <span className="text-[var(--color-primary)] font-medium"> we have it all</span>.
                    </p>

                    <motion.div className="flex flex-col sm:flex-row gap-4 justify-center pt-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                        <Link to={isAuthenticated ? "/dashboard" : "/events"} className="group relative px-10 py-4 rounded-xl text-base font-bold text-white overflow-hidden shadow-2xl shadow-[var(--shadow-primary)] transition-all transform hover:-translate-y-1">
                            <span className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-focus)] group-hover:from-[var(--color-primary-focus)] group-hover:to-[var(--color-primary)] transition-all duration-300" />
                            <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-primary)] bg-[length:200%_100%] animate-shimmer" />
                            </span>
                            <span className="relative flex items-center gap-2">{isAuthenticated ? "Go to Dashboard" : "Explore Events"} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></span>
                        </Link>
                        <Link to="/auth/register" className="group px-10 py-4 rounded-xl text-base font-bold text-[var(--text-primary)] border-2 border-[var(--border-primary)] hover:border-[var(--color-primary)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] transition-all flex items-center justify-center gap-2">
                            <Sparkles size={18} className="text-[var(--color-secondary)]" /> Become an Organizer
                        </Link>
                    </motion.div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="w-full max-w-4xl mt-8">
                    <GlowingBorder>
                        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-3 shadow-2xl">
                            <form className="flex flex-col md:flex-row gap-2">
                                <div className="flex-1 relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors"><Search size={20} /></div>
                                    <input className="w-full bg-transparent border-none text-[var(--text-primary)] placeholder-[var(--text-muted)] pl-12 pr-4 py-3.5 focus:ring-0 text-base rounded-xl hover:bg-[var(--bg-hover)] transition-colors h-full outline-none" placeholder="Search events, artists, venues..." type="text" aria-label="Search events" />
                                </div>
                                <div className="hidden md:block w-px bg-[var(--border-primary)] my-2" />
                                <div className="flex-1 relative group md:max-w-[200px]">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors"><Filter size={20} /></div>
                                    <select className="w-full bg-transparent border-none text-[var(--text-primary)] text-base pl-12 pr-10 py-3.5 focus:ring-0 rounded-xl hover:bg-[var(--bg-hover)] transition-colors h-full appearance-none cursor-pointer outline-none" aria-label="Select category">
                                        <option className="bg-[var(--bg-card)]">All Categories</option>
                                        <option className="bg-[var(--bg-card)]">Music</option>
                                        <option className="bg-[var(--bg-card)]">Technology</option>
                                        <option className="bg-[var(--bg-card)]">Arts</option>
                                        <option className="bg-[var(--bg-card)]">Sports</option>
                                        <option className="bg-[var(--bg-card)]">Gaming</option>
                                    </select>
                                </div>
                                <div className="hidden md:block w-px bg-[var(--border-primary)] my-2" />
                                <div className="flex-1 relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors"><MapPin size={20} /></div>
                                    <input className="w-full bg-transparent border-none text-[var(--text-primary)] placeholder-[var(--text-muted)] pl-12 pr-4 py-3.5 focus:ring-0 text-base rounded-xl hover:bg-[var(--bg-hover)] transition-colors h-full outline-none" placeholder="City or Zip" type="text" aria-label="Location" />
                                </div>
                                <button className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-focus)] hover:from-[var(--color-primary-focus)] hover:to-[var(--color-primary)] text-white font-bold py-3.5 px-8 rounded-xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2" type="button" aria-label="Search">
                                    <span className="hidden sm:inline">Search</span>
                                    <ArrowRight size={20} />
                                </button>
                            </form>
                        </div>
                    </GlowingBorder>
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex flex-wrap justify-center gap-4 mt-4">
                    {[
                        { label: 'Events Today', value: '340+', icon: Calendar },
                        { label: 'Cities', value: '120+', icon: Globe },
                        { label: 'Artists', value: '5K+', icon: Mic2 },
                    ].map((stat, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-card)] border border-[var(--border-primary)] text-sm">
                            <stat.icon size={14} className="text-[var(--color-primary)]" />
                            <span className="text-[var(--text-muted)]">{stat.label}:</span>
                            <span className="text-[var(--text-primary)] font-bold">{stat.value}</span>
                        </div>
                    ))}
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
                    <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="flex flex-col items-center gap-2 text-[var(--text-muted)]">
                        <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
                        <ChevronDown size={20} />
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};