import { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { Cpu, ArrowRight } from 'lucide-react';
import { FEATURES_GRID } from '../../data/mockData';
import { GridCanvas } from '../canvas/CanvasEffects';
import { fadeInUp, staggerContainer } from '../ui/SharedComponents';

export const FeaturesGridSection = () => {
    return (
        <section className="py-24 bg-[var(--bg-secondary)] relative overflow-hidden transition-colors duration-300">
            <GridCanvas className="opacity-20 text-[var(--text-muted)]" />

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--color-primary)]/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-16 max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/20 mb-6 backdrop-blur-sm">
                        <Cpu className="text-[var(--color-secondary)]" size={14} />
                        <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-secondary)]">Powered by Innovation</span>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] mb-6 tracking-tight">
                        Next-Gen <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]">Event Technology</span>
                    </h2>

                    <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                        Experience the future of event management. We combine IoT hardware with cloud software to deliver seamless experiences for organizers and attendees alike.
                    </p>
                </motion.div>

                <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {FEATURES_GRID.map((feature, idx) => (
                        <motion.div key={idx} variants={fadeInUp} className="group relative h-full">
                            <div className="relative h-full p-6 md:p-8 rounded-[2rem] bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[var(--border-hover)] transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1">

                                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                                <div className="flex justify-between items-start mb-6">
                                    {/* eslint-disable-next-line */}
                                    <div className="relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300 bg-[image:linear-gradient(135deg,var(--feature-color),transparent)]" style={{ '--feature-color': feature.color } as CSSProperties}>
                                        <div className="absolute inset-0 rounded-2xl opacity-80 bg-[var(--feature-color)]" />
                                        <feature.icon size={26} className="relative z-20" />
                                    </div>

                                    <span className="text-[var(--text-muted)]/20 text-4xl font-black select-none group-hover:text-[var(--text-muted)]/40 transition-colors">0{idx + 1}</span>
                                </div>

                                <div className="relative z-10">
                                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3 group-hover:text-[var(--color-primary)] transition-colors">{feature.title}</h3>
                                    <p className="text-[var(--text-secondary)] leading-relaxed text-sm">{feature.description}</p>
                                </div>

                                <div className="mt-6 pt-6 border-t border-[var(--border-primary)]/50 flex items-center text-[var(--color-primary)] opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                    <span className="text-sm font-bold mr-2">Learn more</span>
                                    <ArrowRight size={16} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};