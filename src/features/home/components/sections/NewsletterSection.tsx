import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, CheckCircle, ArrowRight } from 'lucide-react';
import { ParticleCanvas } from '../canvas/CanvasEffects';

export const NewsletterSection = () => {
    const [email, setEmail] = useState('');
    const [isSubscribed, setIsSubscribed] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            setIsSubscribed(true);
            setTimeout(() => setIsSubscribed(false), 3000);
            setEmail('');
        }
    };

    return (
        <section className="py-20 bg-[var(--bg-secondary)] relative overflow-hidden">
            <ParticleCanvas particleCount={30} className="opacity-30" />

            <div className="max-w-4xl mx-auto px-4 relative z-10">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00A3DB]/10 border border-[#00A3DB]/20 mb-6">
                        <Bell className="text-[#00A3DB]" size={14} />
                        <span className="text-xs font-bold uppercase tracking-widest text-[#00A3DB]">Stay Updated</span>
                    </div>

                    <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">Never Miss an Event</h2>
                    <p className="text-[var(--text-secondary)] text-lg mb-8 max-w-xl mx-auto">
                        Subscribe to our newsletter and get personalized event recommendations delivered to your inbox.
                    </p>

                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                        <div className="flex-1 relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                className="w-full px-6 py-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[#00A3DB] focus:ring-2 focus:ring-[#00A3DB]/20 outline-none transition-all"
                                aria-label="Email address"
                            />
                        </div>
                        <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#00A3DB] to-[#007AA3] text-white font-bold shadow-lg shadow-[#00A3DB]/25 hover:shadow-xl transition-all flex items-center justify-center gap-2">
                            {isSubscribed ? <><CheckCircle size={18} /> Subscribed!</> : <><ArrowRight size={18} /> Subscribe</>}
                        </motion.button>
                    </form>

                    <p className="text-xs text-[var(--text-muted)] mt-4">
                        No spam, unsubscribe anytime. Read our <Link to="/privacy" className="text-[#00A3DB] hover:underline">Privacy Policy</Link>
                    </p>
                </motion.div>
            </div>
        </section>
    );
};