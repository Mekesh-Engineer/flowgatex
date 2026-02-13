import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, Variants } from 'framer-motion';

// --- Shared UI ---
export const GlowingBorder: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className = ''
}) => (
    <div className={`relative group ${className}`}>
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00A3DB] to-[#A3D639] rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500" />
        <div className="relative">{children}</div>
    </div>
);

export const AnimatedCounter: React.FC<{
    end: number;
    suffix?: string;
    duration?: number
}> = ({ end, suffix = '', duration = 2000 }) => {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true });

    useEffect(() => {
        if (!inView) return;

        let startTime: number;
        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }, [inView, end, duration]);

    return <span ref={ref}>{count}{suffix}</span>;
};

export const FloatingElement: React.FC<{
    children: React.ReactNode;
    delay?: number;
    duration?: number;
    className?: string;
}> = ({ children, delay = 0, duration = 3, className = '' }) => (
    <motion.div
        className={className}
        animate={{
            y: [0, -10, 0],
            rotate: [-1, 1, -1],
        }}
        transition={{
            duration,
            repeat: Infinity,
            delay,
            ease: "easeInOut"
        }}
    >
        {children}
    </motion.div>
);

export const PulsingDot: React.FC<{ color?: string; size?: string }> = ({
    color = 'bg-[#00A3DB]',
    size = 'size-2'
}) => (
    <span className="relative flex">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
        <span className={`relative inline-flex rounded-full ${size} ${color}`} />
    </span>
);

// --- Animation Variants ---
export const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export const fadeInLeft: Variants = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6 } }
};

export const fadeInRight: Variants = {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6 } }
};

export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};