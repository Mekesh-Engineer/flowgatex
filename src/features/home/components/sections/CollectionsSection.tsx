import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Music, Trophy, Palette, Cpu, ArrowUpRight } from 'lucide-react';
import { fadeInUp, staggerContainer, fadeInLeft, fadeInRight } from '../ui/SharedComponents';

export const CollectionsSection = () => {
    return (
        <div className="w-full py-24 bg-[var(--bg-primary)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--color-primary)]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--color-secondary)]/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center relative z-10">
                <div className="max-w-[1200px] w-full flex flex-col">

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 mb-4">
                                <Sparkles className="text-[var(--color-primary)]" size={14} />
                                <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]">Curated Collections</span>
                            </div>
                            <h3 className="text-3xl md:text-5xl font-bold text-[var(--text-primary)]">
                                Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]">Dimensions</span>
                            </h3>
                        </div>
                        <Link to="/events" className="group flex items-center gap-2 text-[var(--text-primary)] font-bold hover:text-[var(--color-primary)] transition-colors">
                            View all collections
                            <ArrowRight className="transition-transform group-hover:translate-x-1" size={20} />
                        </Link>
                    </motion.div>

                    <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-4 h-auto md:h-[600px]">

                        <motion.div variants={fadeInLeft} className="md:col-span-2 md:row-span-2">
                            <Link to="/events?cat=music" className="group relative rounded-[2rem] overflow-hidden border border-[var(--border-primary)] hover:border-[var(--color-primary)] transition-all block h-full min-h-[300px]">
                                <img alt="Concert Crowd" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-80" src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent opacity-90" />

                                <div className="absolute bottom-0 left-0 p-8 w-full">
                                    <div className="w-16 h-16 rounded-2xl bg-[#00A3DB]/20 backdrop-blur-md flex items-center justify-center mb-4 group-hover:bg-[#00A3DB] transition-colors duration-300">
                                        <Music className="text-[#00A3DB] group-hover:text-white" size={32} />
                                    </div>
                                    <h4 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Music & Nightlife</h4>
                                    <p className="text-[var(--text-secondary)] text-sm max-w-sm opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">Experience the beat. From underground raves to sold-out stadium tours and intimate jazz nights.</p>
                                </div>
                            </Link>
                        </motion.div>

                        <motion.div variants={fadeInRight} className="md:col-span-2 md:row-span-1">
                            <Link to="/events?cat=sports" className="group relative rounded-[2rem] overflow-hidden border border-[var(--border-primary)] hover:border-[#A3D639] transition-all block h-full min-h-[200px]">
                                <img alt="Stadium Atmosphere" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-80" src="https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=2070&auto=format&fit=crop" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent opacity-90" />

                                <div className="absolute bottom-0 left-0 p-6 flex items-end justify-between w-full">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-[#A3D639]/20 backdrop-blur-md flex items-center justify-center group-hover:bg-[#A3D639] transition-colors duration-300">
                                            <Trophy className="text-[#A3D639] group-hover:text-white" size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-[var(--text-primary)]">Sports League</h4>
                                            <p className="text-xs text-[var(--text-secondary)]">Live Matches & E-Sports</p>
                                        </div>
                                    </div>
                                    <ArrowUpRight className="text-[#A3D639] opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300" size={24} />
                                </div>
                            </Link>
                        </motion.div>

                        <motion.div variants={fadeInUp} className="md:col-span-1 md:row-span-1">
                            <Link to="/events?cat=arts" className="group relative rounded-[2rem] overflow-hidden border border-[var(--border-primary)] hover:border-[#f59e0b] transition-all block h-full min-h-[150px] bg-[var(--bg-card)]">
                                <img alt="Art Gallery" className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity duration-500" src="https://images.unsplash.com/photo-1547891654-e66ed7ebb968?q=80&w=2070&auto=format&fit=crop" />

                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Palette className="text-5xl text-[var(--text-muted)]/20 group-hover:text-[#f59e0b] group-hover:scale-110 transition-all duration-300" />
                                </div>

                                <div className="absolute bottom-0 left-0 p-5 w-full">
                                    <div className="flex justify-between items-end w-full">
                                        <div>
                                            <h4 className="text-lg font-bold text-[var(--text-primary)]">Creative Arts</h4>
                                            <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Exhibitions</p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>

                        <motion.div variants={fadeInUp} className="md:col-span-1 md:row-span-1">
                            <Link to="/events?cat=technology" className="group relative rounded-[2rem] overflow-hidden border border-[var(--border-primary)] hover:border-[#8b5cf6] transition-all block h-full min-h-[150px] bg-[var(--bg-card)]">
                                <img alt="Tech Conference" className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity duration-500" src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop" />

                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Cpu className="text-5xl text-[var(--text-muted)]/20 group-hover:text-[#8b5cf6] group-hover:scale-110 transition-all duration-300" />
                                </div>

                                <div className="absolute bottom-0 left-0 p-5 w-full">
                                    <div className="flex justify-between items-end w-full">
                                        <div>
                                            <h4 className="text-lg font-bold text-[var(--text-primary)]">Tech & Future</h4>
                                            <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Workshops</p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>

                    </motion.div>
                </div>
            </div>
        </div>
    );
};