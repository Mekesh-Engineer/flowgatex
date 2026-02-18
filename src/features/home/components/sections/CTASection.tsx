import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Rocket, Headphones } from 'lucide-react';
import { GridCanvas } from '../canvas/CanvasEffects';

export const CTASection = () => {
    return (
        <section className="py-24 relative overflow-hidden bg-[var(--bg-primary)]">
            <div className="absolute inset-0">
                <GridCanvas className="opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-br from-[#00A3DB]/10 via-transparent to-[#A3D639]/10" />
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 text-center">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
                    <motion.div animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }} className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00A3DB] to-[#A3D639] mb-8 shadow-2xl shadow-[#00A3DB]/30">
                        <Zap size={40} className="text-white" />
                    </motion.div>

                    <h2 className="text-4xl md:text-6xl font-black text-[var(--text-primary)] mb-6">
                        Ready to Host Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00A3DB] to-[#A3D639]">Event?</span>
                    </h2>
                    <p className="text-xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto">
                        Join thousands of organizers who use FlowGateX to manage, promote, and sell out their events. Start your journey today.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link to="/events/create" className="group relative px-12 py-5 rounded-xl text-lg font-bold text-white overflow-hidden shadow-2xl shadow-[#00A3DB]/30 transition-all transform hover:-translate-y-1">
                            <span className="absolute inset-0 bg-gradient-to-r from-[#00A3DB] to-[#A3D639]" />
                            <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"><span className="absolute inset-0 bg-gradient-to-r from-[#A3D639] to-[#00A3DB]" /></span>
                            <span className="relative flex items-center justify-center gap-2"><Rocket size={20} /> Create an Event Now</span>
                        </Link>
                        <Link to="/contact" className="px-12 py-5 rounded-xl text-lg font-bold text-[var(--text-primary)] border-2 border-[var(--border-primary)] hover:border-[#00A3DB] bg-[var(--bg-card)] transition-all flex items-center justify-center gap-2">
                            <Headphones size={20} className="text-[#00A3DB]" /> Contact Sales
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};