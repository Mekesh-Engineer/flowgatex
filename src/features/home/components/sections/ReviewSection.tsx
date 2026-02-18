import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ArrowRight, Quote, CheckCircle, Camera } from 'lucide-react';
import { REVIEWS, ReviewData } from '../../data/mockData';
import { fadeInUp, staggerContainer } from '../ui/SharedComponents';

const ReviewCard = ({ data }: { data: ReviewData }) => {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="group relative w-full min-w-[360px] max-w-[400px] flex-shrink-0 pt-3 pl-3 md:min-w-[400px]"
        >
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)] border border-[var(--border-primary)] transform translate-x-2 translate-y-2 transition-transform duration-300 ease-out group-hover:translate-x-4 group-hover:translate-y-4 group-hover:rotate-1 opacity-50" />

            <div className="relative h-full flex flex-col justify-between rounded-[2rem] bg-[var(--bg-card)] p-6 shadow-xl shadow-black/5 border border-[var(--border-primary)] transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-primary)] opacity-80" />

                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                        <Quote className="text-5xl text-[var(--color-primary)]/20 transform -translate-x-1 -translate-y-1 fill-current" size={40} />
                        <div className="flex gap-1 bg-[var(--bg-secondary)]/50 px-3 py-1.5 rounded-full border border-[var(--border-primary)]">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    size={14}
                                    className={i < data.rating ? "text-[#f59e0b] fill-[#f59e0b]" : "text-[var(--text-muted)]"}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="mb-6 flex-grow">
                        <h3 className="mb-2 text-lg font-bold leading-tight text-[var(--text-primary)] line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
                            &ldquo;{data.title}&rdquo;
                        </h3>
                        <p className="text-sm leading-relaxed text-[var(--text-secondary)] line-clamp-3">
                            {data.description}
                        </p>
                    </div>

                    <div className="mt-auto space-y-5">
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/50">
                            <div className="relative w-10 h-10 rounded-full p-[2px] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] shadow-sm">
                                <div className="relative w-full h-full rounded-full overflow-hidden bg-[var(--bg-card)]">
                                    <img
                                        src={data.avatar}
                                        alt={data.reviewerName}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-sm text-[var(--text-primary)] truncate">{data.reviewerName}</p>
                                    <CheckCircle className="text-[var(--color-success)]" size={14} />
                                </div>
                                <p className="text-xs text-[var(--text-muted)] truncate">{data.reviewerContext}</p>
                            </div>
                        </div>

                        <div className="relative h-36 w-full overflow-hidden rounded-2xl group-hover:shadow-md transition-all border border-[var(--border-primary)]/50">
                            <img
                                src={data.imageSrc}
                                alt={`Experience at ${data.reviewerContext}`}
                                className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                                <span className="text-[10px] font-medium text-white/90 bg-white/10 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">
                                    Verified Visit
                                </span>
                                <Camera className="text-white/80" size={16} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export const ReviewSection = () => {
    return (
        <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 overflow-hidden">
            <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-[var(--color-primary)] opacity-5 blur-[100px]" />
            <div className="absolute bottom-0 left-0 -z-10 h-[500px] w-[500px] rounded-full bg-[var(--color-secondary)] opacity-5 blur-[100px]" />

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border-primary)] mb-4 w-fit shadow-sm">
                        <Star className="text-[var(--color-warning)] fill-[var(--color-warning)]" size={14} />
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Testimonials</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4 leading-tight">
                        Trusted by the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]">Best</span>
                    </h2>
                    <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                        Discover why thousands of event organizers and attendees trust FlowGateX for their most important moments.
                    </p>
                </div>

                <Link to="/reviews" className="group flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all backdrop-blur-sm shadow-sm hover:shadow-md">
                    <span>See All Reviews</span>
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
                </Link>
            </motion.div>

            <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="no-scrollbar flex gap-8 overflow-x-auto pb-12 pt-4 -mx-6 px-6 snap-x snap-mandatory scroll-smooth">
                {REVIEWS.map((review) => (
                    <div key={review.id} className="snap-center">
                        <ReviewCard data={review} />
                    </div>
                ))}
            </motion.div>
        </section>
    );
};