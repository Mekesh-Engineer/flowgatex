import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { TRIP_STEPS } from '../../data/mockData';
import { fadeInUp } from '../ui/SharedComponents';

export const HowItWorksSection = () => {
    return (
        <section className="relative mx-auto max-w-7xl px-6 py-24 md:px-12 overflow-visible">
            <div className="absolute top-0 right-0 -z-20 h-96 w-96 rounded-full bg-[var(--color-primary)]/10 opacity-50 blur-[100px]" />
            <div className="absolute bottom-0 left-0 -z-20 h-96 w-96 rounded-full bg-[var(--color-secondary)]/10 opacity-50 blur-[100px]" />

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="flex justify-center mb-24">
                <div className="text-center max-w-3xl relative">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border-primary)] bg-[var(--bg-card)] mb-6 shadow-sm">
                        <CheckCircle className="text-[var(--color-primary)]" size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">How It Works</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-6 drop-shadow-sm">
                        Plan Your Perfect <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]">Event Experience</span>
                    </h2>
                    <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                        From discovery to entry, FlowGateX makes attending events seamless, secure, and enjoyable through our simple process.
                    </p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 relative">

                {TRIP_STEPS.map((step, index) => (
                    <div key={index} className="relative">
                        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.15 }} className="group relative flex flex-col items-center text-center h-full">
                            <div className="relative z-10 flex h-full w-full flex-col items-center rounded-3xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-8 shadow-xl transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl hover:border-[var(--color-primary)]/30">

                                <div className={`absolute -top-5 ${step.bg} ${step.border} border-2 text-[var(--text-primary)] font-mono text-base font-bold w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.1)] z-20 group-hover:scale-110 transition-all duration-300`}>
                                    0{index + 1}
                                </div>

                                <div className={`mt-4 mb-6 flex h-20 w-20 items-center justify-center rounded-2xl ${step.bg} shadow-inner transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 ring-1 ring-inset ring-white/10`}>
                                    <step.icon className={`${step.color} drop-shadow-md`} size={32} />
                                </div>

                                <h3 className="mb-3 text-xl font-bold text-[var(--text-primary)]">{step.title}</h3>
                                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{step.description}</p>
                            </div>
                        </motion.div>

                        {/* CURVED ARROW LOGIC */}
                        {index !== TRIP_STEPS.length - 1 && (
                            <div className="hidden lg:block absolute top-1/2 -right-[50px] w-[100px] h-[60px] z-0 -translate-y-1/2 pointer-events-none">
                                <svg className="w-full h-full drop-shadow-[0_0_8px_rgba(0,163,219,0.5)] dark:drop-shadow-[0_0_10px_rgba(0,163,219,0.8)]" viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                                    <path d="M10 20 C 30 5, 70 5, 90 20" stroke="url(#arrow-gradient)" strokeWidth="3" strokeDasharray="6 6" strokeLinecap="round" className="opacity-70">
                                        <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1.5s" repeatCount="indefinite" />
                                    </path>
                                    <path d="M85 15 L 90 20 L 85 25" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                    <defs>
                                        <linearGradient id="arrow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="var(--text-muted)" stopOpacity="0.3" />
                                            <stop offset="50%" stopColor="var(--color-primary)" stopOpacity="1" />
                                            <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="1" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                        )}

                        {/* Mobile/Tablet Connector (Vertical) */}
                        {index !== TRIP_STEPS.length - 1 && (
                            <div className="lg:hidden absolute left-1/2 bottom-[-32px] w-0.5 h-8 bg-gradient-to-b from-[var(--border-primary)] to-transparent -translate-x-1/2" />
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
};