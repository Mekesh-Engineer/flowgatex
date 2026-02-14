import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search, Compass, Sparkles, ArrowRight } from 'lucide-react';
import {
  PageWrapper,
  BlurOrbs,
  DotGrid,
  FloatingElement,
  fadeInUp,
  staggerContainer,
} from '@/components/common/PageShared';

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const glitchText = {
  hidden: { opacity: 0, scale: 0.5, rotateX: -90 },
  visible: {
    opacity: 1,
    scale: 1,
    rotateX: 0,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const floatUp = {
  hidden: { opacity: 0, y: 60 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: 'easeOut' },
  }),
};

// =============================================================================
// QUICK NAVIGATION LINKS
// =============================================================================

const QUICK_LINKS = [
  { label: 'Browse Events', path: '/events', icon: <Search size={18} />, description: 'Discover amazing events' },
  { label: 'Categories', path: '/category/music', icon: <Compass size={18} />, description: 'Explore by category' },
  { label: 'About Us', path: '/about', icon: <Sparkles size={18} />, description: 'Learn about FlowGateX' },
];

// =============================================================================
// COMPONENT
// =============================================================================

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <PageWrapper className="flex items-center justify-center relative overflow-hidden">
      <BlurOrbs variant="hero" />
      <DotGrid />

      {/* Floating decorative elements */}
      <FloatingElement className="absolute top-[15%] left-[10%] hidden lg:block" delay={0}>
        <div className="size-16 rounded-2xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center backdrop-blur-sm">
          <Compass size={24} className="text-[var(--color-primary)]" />
        </div>
      </FloatingElement>
      <FloatingElement className="absolute bottom-[20%] right-[8%] hidden lg:block" delay={1.5}>
        <div className="size-14 rounded-2xl bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/20 flex items-center justify-center backdrop-blur-sm">
          <Search size={20} className="text-[var(--color-secondary)]" />
        </div>
      </FloatingElement>
      <FloatingElement className="absolute top-[30%] right-[15%] hidden lg:block" delay={0.8}>
        <div className="size-10 rounded-full bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-secondary)]/20 border border-[var(--border-primary)] backdrop-blur-sm" />
      </FloatingElement>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center py-20">
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-8">
          {/* 404 Number */}
          <motion.div variants={glitchText} className="relative">
            <span className="text-[8rem] sm:text-[10rem] md:text-[14rem] font-black leading-none tracking-tighter select-none">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-primary)] animate-shimmer bg-[length:200%_100%]">
                404
              </span>
            </span>
            {/* Glow reflection */}
            <div className="absolute inset-0 blur-[80px] opacity-20 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] -z-10" />
          </motion.div>

          {/* Title */}
          <motion.div variants={fadeInUp} className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
              Page Not{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]">
                Found
              </span>
            </h1>
            <p className="text-[var(--text-secondary)] text-lg max-w-lg mx-auto leading-relaxed">
              Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
              Let&apos;s get you back on track.
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/"
                className="group relative px-8 py-3.5 rounded-xl text-base font-bold text-white overflow-hidden shadow-lg shadow-[var(--shadow-primary)] transition-all inline-flex items-center"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-focus)] group-hover:from-[var(--color-primary-focus)] group-hover:to-[var(--color-primary)] transition-all duration-300" />
                <span className="relative flex items-center gap-2">
                  <Home size={18} />
                  Go Home
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(-1)}
              className="group px-8 py-3.5 rounded-xl text-base font-bold text-[var(--text-primary)] border-2 border-[var(--border-primary)] hover:border-[var(--color-primary)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] transition-all flex items-center gap-2"
            >
              <ArrowLeft size={18} className="text-[var(--color-secondary)] group-hover:-translate-x-1 transition-transform" />
              Go Back
            </motion.button>
          </motion.div>

          {/* Quick Links Section */}
          <motion.div variants={fadeInUp} className="pt-8">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-6">
              Or try one of these
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {QUICK_LINKS.map((link, i) => (
                <motion.div key={link.path} custom={i} variants={floatUp}>
                  <Link
                    to={link.path}
                    className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[var(--color-primary)] transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="size-12 rounded-xl bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-secondary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <span className="text-[var(--color-primary)]">{link.icon}</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                        {link.label}
                      </span>
                      <span className="block text-xs text-[var(--text-muted)] mt-0.5">
                        {link.description}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Shimmer keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 3s linear infinite;
        }
      `}</style>
    </PageWrapper>
  );
}

export default NotFoundPage;
