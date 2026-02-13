import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, ArrowRight } from 'lucide-react';
import { VideoModal } from './VideoModal';
import { PulsingDot, AnimatedCounter, fadeInLeft, fadeInRight } from '../ui/SharedComponents';

export const CaseStudySection = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="w-full bg-[var(--bg-primary)] py-24 relative overflow-hidden transition-colors duration-300">

            <VideoModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                // Using a sample video URL (replace with actual asset)
                videoSrc="src/assets/video/watch_story_homepage.mp4"
            />

            <div className="absolute inset-0 bg-[var(--bg-secondary)] skew-y-2 transform origin-top-left scale-110 -z-10" />

            <div className="px-4 md:px-10 lg:px-40 flex justify-center relative z-10">
                <div className="max-w-[1200px] w-full grid lg:grid-cols-2 gap-16 items-center">

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInLeft} className="flex flex-col gap-6">
                        <div className="flex items-center gap-3">
                            <PulsingDot color="bg-[var(--color-primary)]" />
                            <span className="text-[var(--color-primary)] font-bold uppercase tracking-widest text-sm">Creators in Motion</span>
                        </div>

                        <h2 className="text-4xl lg:text-5xl font-bold text-[var(--text-primary)] leading-tight">
                            Empowering the voices that{' '}
                            <span className="relative inline-block text-[var(--color-primary)]">
                                move the world.
                                <svg className="absolute w-full h-3 -bottom-1 left-0 text-[var(--color-secondary)] opacity-80" viewBox="0 0 100 10" preserveAspectRatio="none">
                                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" />
                                </svg>
                            </span>
                        </h2>

                        <p className="text-[var(--text-secondary)] text-lg leading-relaxed">
                            See how Global Sound Collective scaled their festivals from 5,000 to 50,000 attendees using FlowGateX's enterprise tools.
                        </p>

                        <div className="flex gap-8 pt-4 border-l-4 border-[var(--color-primary)] pl-6 my-4">
                            <div className="flex flex-col">
                                <span className="text-4xl font-bold text-[var(--text-primary)]"><AnimatedCounter end={400} suffix="%" /></span>
                                <span className="text-[var(--text-muted)] text-sm font-medium">Revenue Growth</span>
                            </div>
                            <div className="w-px h-16 bg-[var(--border-primary)]" />
                            <div className="flex flex-col">
                                <span className="text-4xl font-bold text-[var(--text-primary)]"><AnimatedCounter end={30} suffix="s" /></span>
                                <span className="text-[var(--text-muted)] text-sm font-medium">Avg. Check-in</span>
                            </div>
                            <div className="w-px h-16 bg-[var(--border-primary)]" />
                            <div className="flex flex-col">
                                <span className="text-4xl font-bold text-[var(--text-primary)]"><AnimatedCounter end={99} suffix="%" /></span>
                                <span className="text-[var(--text-muted)] text-sm font-medium">Satisfaction</span>
                            </div>
                        </div>

                        <Link to="/case-studies" className="mt-6 w-fit group relative px-8 py-4 rounded-tl-2xl rounded-br-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex items-center gap-3">
                            <span className="relative z-10">Read the full case study</span>
                            <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        </Link>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInRight} className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-black/20 border border-[var(--border-primary)] group cursor-pointer aspect-video" onClick={() => setIsModalOpen(true)}>
                        <img alt="Video Thumbnail" className="w-full h-full object-cover opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700" src="https://images.unsplash.com/photo-1459749411177-287ce3288789?q=80&w=2069" />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300" />

                        <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="relative">
                                <div className="absolute inset-0 rounded-full bg-[var(--color-primary)]/40 animate-ping" style={{ animationDuration: '2s' }} />
                                <div className="relative size-24 rounded-full bg-black/30 backdrop-blur-sm border border-white/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                                    <div className="size-16 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[#007AA3] text-white flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/30 pl-1">
                                        <Play size={28} fill="currentColor" />
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        <div className="absolute bottom-6 left-6 z-10">
                            <p className="text-white font-bold text-xl drop-shadow-md">Global Sound Collective</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <p className="text-gray-200 text-sm font-medium">Scaling Enterprise Events</p>
                            </div>
                        </div>

                        <div className="absolute bottom-6 right-6 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-bold uppercase tracking-wider z-10">
                            3:45 • Watch Story
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};