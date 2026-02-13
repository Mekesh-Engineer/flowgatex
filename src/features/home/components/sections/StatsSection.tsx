import { Calendar, Users, Ticket, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { WaveCanvas } from '../canvas/CanvasEffects';
import { AnimatedCounter } from '../ui/SharedComponents';

export const StatsSection = () => {
    return (
        <section className="py-16 bg-[var(--bg-secondary)] border-y border-[var(--border-primary)] relative overflow-hidden transition-colors duration-300">
            <WaveCanvas className="opacity-30" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { label: "Total Events", value: 50, suffix: "k+", icon: Calendar, style: { color: 'var(--color-primary)', bg: 'hsla(var(--hue-primary), 100%, 43%, 0.1)', borderColor: 'hsla(var(--hue-primary), 100%, 43%, 0.3)' } },
                        { label: "Active Users", value: 10, suffix: "k+", icon: Users, style: { color: 'var(--color-secondary)', bg: 'hsla(var(--hue-secondary), 75%, 45%, 0.1)', borderColor: 'hsla(var(--hue-secondary), 75%, 45%, 0.3)' } },
                        { label: "Tickets Sold", value: 2, suffix: "M+", icon: Ticket, style: { color: 'var(--color-warning)', bg: 'var(--status-warning-light)', borderColor: 'var(--color-warning)' } },
                        { label: "Cities Covered", value: 120, suffix: "+", icon: Globe, style: { color: 'var(--color-success)', bg: 'var(--status-success-light)', borderColor: 'var(--color-success)' } },
                    ].map((stat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            whileHover={{ scale: 1.05, y: -5 }}
                            className="text-center group p-6 rounded-2xl bg-[var(--bg-card)]/50 border border-[var(--border-primary)] hover:border-transparent transition-all duration-300 relative"
                            style={{ boxShadow: `0 0 0 0 transparent` }}
                        >
                            <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-current opacity-30 transition-colors duration-300 pointer-events-none" style={{ color: stat.style.color }} />
                            <div className="inline-flex items-center justify-center p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300" style={{ color: stat.style.color, backgroundColor: stat.style.bg }}>
                                <stat.icon size={28} />
                            </div>
                            <h3 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-2"><AnimatedCounter end={stat.value} suffix={stat.suffix} /></h3>
                            <p className="text-[var(--text-muted)] text-sm font-medium uppercase tracking-wider">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};