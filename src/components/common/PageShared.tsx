import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

// =============================================================================
// ANIMATION VARIANTS — Unified across all pages
// =============================================================================

export const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

export const fadeInDown = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

export const fadeInLeft = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

export const fadeInRight = {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

export const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

export const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export const staggerFast = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

// =============================================================================
// REUSABLE LAYOUT COMPONENTS
// =============================================================================

/** Full-page wrapper with consistent background & transition */
export const PageWrapper: React.FC<{
    children: React.ReactNode;
    className?: string;
}> = ({ children, className = '' }) => (
    <div className={`min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans transition-colors duration-300 ${className}`}>
        {children}
    </div>
);

/** Standard page section with viewport-triggered entrance animation */
export const Section: React.FC<{
    children: React.ReactNode;
    className?: string;
    id?: string;
    bg?: 'primary' | 'secondary' | 'tertiary';
}> = ({ children, className = '', id, bg = 'primary' }) => {
    const ref = useRef<HTMLElement>(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });

    const bgMap = {
        primary: 'bg-[var(--bg-primary)]',
        secondary: 'bg-[var(--bg-secondary)]',
        tertiary: 'bg-[var(--bg-tertiary)]',
    };

    return (
        <motion.section
            ref={ref}
            id={id}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className={`py-20 md:py-24 ${bgMap[bg]} relative overflow-hidden transition-colors duration-300 ${className}`}
        >
            {children}
        </motion.section>
    );
};

/** Standard content container */
export const Container: React.FC<{
    children: React.ReactNode;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}> = ({ children, className = '', size = 'lg' }) => {
    const sizeMap = {
        sm: 'max-w-3xl',
        md: 'max-w-5xl',
        lg: 'max-w-7xl',
        xl: 'max-w-[1440px]',
    };

    return (
        <div className={`${sizeMap[size]} mx-auto px-4 sm:px-6 lg:px-8 relative z-10 ${className}`}>
            {children}
        </div>
    );
};

// =============================================================================
// SECTION HEADER — Badge + Title (gradient word) + Description
// =============================================================================

export const SectionHeader: React.FC<{
    badge?: string;
    badgeIcon?: React.ReactNode;
    badgeColor?: string;
    title: string;
    gradientText: string;
    description?: string;
    align?: 'center' | 'left';
    className?: string;
}> = ({
    badge,
    badgeIcon,
    badgeColor = 'var(--color-primary)',
    title,
    gradientText,
    description,
    align = 'center',
    className = '',
}) => (
        <motion.div
            variants={fadeInUp}
            className={`${align === 'center' ? 'text-center max-w-3xl mx-auto' : ''} mb-12 md:mb-16 ${className}`}
        >
            {badge && (
                <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 md:mb-6"
                    style={{
                        backgroundColor: `color-mix(in srgb, ${badgeColor} 10%, transparent)`,
                        borderColor: `color-mix(in srgb, ${badgeColor} 20%, transparent)`,
                        borderWidth: 1,
                    }}
                >
                    {badgeIcon && <span style={{ color: badgeColor }}>{badgeIcon}</span>}
                    <span
                        className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: badgeColor }}
                    >
                        {badge}
                    </span>
                </div>
            )}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] tracking-tight mb-4 md:mb-6">
                {title}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]">
                    {gradientText}
                </span>
            </h2>
            {description && (
                <p className="text-base md:text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
                    {description}
                </p>
            )}
        </motion.div>
    );

// =============================================================================
// DECORATIVE BACKGROUND ELEMENTS
// =============================================================================

/** Blur orb background decoration */
export const BlurOrbs: React.FC<{ variant?: 'default' | 'subtle' | 'hero' }> = ({ variant = 'default' }) => {
    const opacityMap = { default: 'opacity-5', subtle: 'opacity-[0.03]', hero: 'opacity-10' };

    return (
        <>
            <div className={`absolute top-0 right-0 -z-0 h-[500px] w-[500px] rounded-full bg-[var(--color-primary)] ${opacityMap[variant]} blur-[100px] pointer-events-none`} />
            <div className={`absolute bottom-0 left-0 -z-0 h-[500px] w-[500px] rounded-full bg-[var(--color-secondary)] ${opacityMap[variant]} blur-[100px] pointer-events-none`} />
        </>
    );
};

/** Dot grid background pattern */
export const DotGrid: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`absolute inset-0 opacity-5 pointer-events-none ${className}`}>
        <div
            className="absolute inset-0"
            style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, var(--text-muted) 1px, transparent 0)',
                backgroundSize: '40px 40px',
            }}
        />
    </div>
);

// =============================================================================
// INTERACTIVE COMPONENTS
// =============================================================================

/** Primary CTA button matching homepage style */
export const PrimaryButton: React.FC<{
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    type?: 'button' | 'submit';
    disabled?: boolean;
    icon?: React.ReactNode;
}> = ({ children, onClick, className = '', type = 'button', disabled = false, icon }) => (
    <motion.button
        type={type}
        onClick={onClick}
        disabled={disabled}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        className={`group relative px-8 py-3.5 rounded-xl text-base font-bold text-white overflow-hidden shadow-lg shadow-[var(--shadow-primary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
        <span className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-focus)] group-hover:from-[var(--color-primary-focus)] group-hover:to-[var(--color-primary)] transition-all duration-300" />
        <span className="relative flex items-center justify-center gap-2">
            {children}
            {icon}
        </span>
    </motion.button>
);

/** Secondary / outline button */
export const SecondaryButton: React.FC<{
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    icon?: React.ReactNode;
}> = ({ children, onClick, className = '', icon }) => (
    <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`group px-8 py-3.5 rounded-xl text-base font-bold text-[var(--text-primary)] border-2 border-[var(--border-primary)] hover:border-[var(--color-primary)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] transition-all flex items-center justify-center gap-2 ${className}`}
    >
        {icon && <span className="text-[var(--color-secondary)]">{icon}</span>}
        {children}
    </motion.button>
);

/** Glowing card wrapper */
export const GlowCard: React.FC<{
    children: React.ReactNode;
    className?: string;
    hoverLift?: boolean;
}> = ({ children, className = '', hoverLift = true }) => (
    <motion.div
        variants={fadeInUp}
        whileHover={hoverLift ? { y: -8 } : undefined}
        className={`group relative rounded-2xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[var(--color-primary)] transition-all duration-300 shadow-lg hover:shadow-xl ${className}`}
    >
        {children}
    </motion.div>
);

/** Floating animation wrapper */
export const FloatingElement: React.FC<{
    children: React.ReactNode;
    delay?: number;
    duration?: number;
    className?: string;
}> = ({ children, delay = 0, duration = 3, className = '' }) => (
    <motion.div
        className={className}
        animate={{ y: [0, -10, 0], rotate: [-1, 1, -1] }}
        transition={{ duration, repeat: Infinity, delay, ease: 'easeInOut' }}
    >
        {children}
    </motion.div>
);

/** Animated counter (counts from 0 to end when in view) */
export const AnimatedCounter: React.FC<{
    end: number;
    suffix?: string;
    duration?: number;
}> = ({ end, suffix = '', duration = 2000 }) => {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true });
    const [count, setCount] = React.useState(0);

    React.useEffect(() => {
        if (!inView) return;
        let startTime: number;
        const animate = (ts: number) => {
            if (!startTime) startTime = ts;
            const p = Math.min((ts - startTime) / duration, 1);
            setCount(Math.floor(p * end));
            if (p < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [inView, end, duration]);

    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

/** Pulsing dot indicator */
export const PulsingDot: React.FC<{ color?: string }> = ({ color = 'bg-[#00A3DB]' }) => (
    <span className="relative flex">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
        <span className={`relative inline-flex rounded-full size-2 ${color}`} />
    </span>
);

/** Gradient divider line */
export const GradientDivider: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`h-px bg-gradient-to-r from-transparent via-[var(--border-primary)] to-transparent ${className}`} />
);

/** Page hero banner with gradient overlay */
export const HeroBanner: React.FC<{
    title: string;
    gradientText?: string;
    description?: string;
    badge?: string;
    badgeIcon?: React.ReactNode;
    backgroundImage?: string;
    children?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
}> = ({ title, gradientText, description, badge, badgeIcon, backgroundImage, children, size = 'md' }) => {
    const heightMap = { sm: 'py-16 md:py-20', md: 'py-20 md:py-28', lg: 'py-28 md:py-36' };

    return (
        <section className={`relative ${heightMap[size]} overflow-hidden bg-gradient-to-br from-[var(--bg-surface)] via-[var(--bg-primary)] to-[var(--bg-surface)] transition-colors duration-300`}>
            {backgroundImage && (
                <>
                    <img
                        src={backgroundImage}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover opacity-20"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/80 to-transparent" />
                </>
            )}
            <BlurOrbs variant="hero" />
            <DotGrid />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                    className="text-center"
                >
                    {badge && (
                        <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 mb-6">
                            {badgeIcon}
                            <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]">{badge}</span>
                        </motion.div>
                    )}
                    <motion.h1
                        variants={fadeInUp}
                        className="text-4xl md:text-5xl lg:text-6xl font-black text-[var(--text-primary)] tracking-tight leading-[1.1] mb-6"
                    >
                        {title}{' '}
                        {gradientText && (
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-primary)]">
                                {gradientText}
                            </span>
                        )}
                    </motion.h1>
                    {description && (
                        <motion.p
                            variants={fadeInUp}
                            className="text-[var(--text-secondary)] text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed mb-8"
                        >
                            {description}
                        </motion.p>
                    )}
                    {children && <motion.div variants={fadeInUp}>{children}</motion.div>}
                </motion.div>
            </div>
        </section>
    );
};
