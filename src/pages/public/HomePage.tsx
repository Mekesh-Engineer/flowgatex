import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, Variants, useInView } from 'framer-motion';
import { 
  Search, MapPin, Calendar, ArrowRight, Music, 
  Trophy, Cpu, Palette, Users, Globe, Ticket, 
  Play, Star, CheckCircle, Smartphone, ShieldCheck, 
  Filter, Zap, Sparkles, ChevronDown, ArrowUpRight,
  Clock, Heart, Share2, Bell, TrendingUp, Award,
  Shield, Layers, Activity, Headphones,
  Gamepad2, Mic2, PartyPopper, Rocket,
  MousePointer, Eye, Fingerprint
} from 'lucide-react';

// --- Internal Imports ---
import EventCard from '@/features/events/components/EventCard';
import '@/styles/utilities/scrollbar.css';
import '@/styles/utilities/animations.css';

// =============================================================================
// CANVAS ANIMATION COMPONENTS
// =============================================================================

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  hue: number;
}

const ParticleCanvas: React.FC<{ className?: string; particleCount?: number }> = ({ 
  className = '', 
  particleCount = 50 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.2,
      hue: Math.random() > 0.5 ? 195 : 85, // KEC Blue or Green
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      particlesRef.current.forEach((particle, i) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.offsetWidth;
        if (particle.x > canvas.offsetWidth) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.offsetHeight;
        if (particle.y > canvas.offsetHeight) particle.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particle.hue}, 100%, 50%, ${particle.opacity})`;
        ctx.fill();

        // Draw connections
        particlesRef.current.slice(i + 1).forEach(other => {
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `hsla(195, 100%, 50%, ${0.1 * (1 - distance / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particleCount]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

const GridCanvas: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const offsetRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      
      const gridSize = 60;
      offsetRef.current += 0.2;
      
      if (offsetRef.current >= gridSize) {
        offsetRef.current = 0;
      }

      ctx.strokeStyle = 'hsla(195, 100%, 50%, 0.05)';
      ctx.lineWidth = 1;

      // Vertical lines
      for (let x = -gridSize + offsetRef.current; x < canvas.offsetWidth + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.offsetHeight);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = -gridSize + offsetRef.current; y < canvas.offsetHeight + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.offsetWidth, y);
        ctx.stroke();
      }

      // Glowing intersections
      for (let x = -gridSize + offsetRef.current; x < canvas.offsetWidth + gridSize; x += gridSize) {
        for (let y = -gridSize + offsetRef.current; y < canvas.offsetHeight + gridSize; y += gridSize) {
          const pulseOpacity = 0.3 + Math.sin(Date.now() / 1000 + x + y) * 0.2;
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(195, 100%, 50%, ${pulseOpacity})`;
          ctx.fill();
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

const WaveCanvas: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      time += 0.02;

      const waves = [
        { amplitude: 30, frequency: 0.02, speed: 1, opacity: 0.1, hue: 195 },
        { amplitude: 20, frequency: 0.03, speed: 1.5, opacity: 0.08, hue: 85 },
        { amplitude: 15, frequency: 0.025, speed: 0.8, opacity: 0.06, hue: 195 },
      ];

      waves.forEach(wave => {
        ctx.beginPath();
        ctx.moveTo(0, canvas.offsetHeight / 2);

        for (let x = 0; x <= canvas.offsetWidth; x += 5) {
          const y = canvas.offsetHeight / 2 + 
            Math.sin(x * wave.frequency + time * wave.speed) * wave.amplitude +
            Math.sin(x * wave.frequency * 0.5 + time * wave.speed * 0.7) * wave.amplitude * 0.5;
          ctx.lineTo(x, y);
        }

        ctx.strokeStyle = `hsla(${wave.hue}, 100%, 50%, ${wave.opacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

// =============================================================================
// REUSABLE UI COMPONENTS
// =============================================================================

const GlowingBorder: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`relative group ${className}`}>
    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00A3DB] to-[#A3D639] rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500" />
    <div className="relative">{children}</div>
  </div>
);

const AnimatedCounter: React.FC<{ 
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

const FloatingElement: React.FC<{ 
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

const PulsingDot: React.FC<{ color?: string; size?: string }> = ({ 
  color = 'bg-[#00A3DB]', 
  size = 'size-2' 
}) => (
  <span className="relative flex">
    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
    <span className={`relative inline-flex rounded-full ${size} ${color}`} />
  </span>
);

// =============================================================================
// MOCK DATA
// =============================================================================

const FEATURED_EVENTS_MOCK = [
  {
    id: '1',
    title: "Neon Nights Festival",
    category: "music",
    dates: { start: new Date('2024-08-24T20:00:00').toISOString() },
    venue: { name: "Cyber Arena", city: "Downtown" },
    ticketTiers: [{ price: 45, available: 120 }],
    images: ["https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=2070"],
    featured: true,
    status: 'published'
  },
  {
    id: '2',
    title: "Global Tech Summit",
    category: "technology",
    dates: { start: new Date('2024-09-12T09:00:00').toISOString() },
    venue: { name: "Silicon Valley Center", city: "San Francisco" },
    ticketTiers: [{ price: 199, available: 50 }],
    images: ["https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070"],
    featured: true,
    status: 'published'
  },
  {
    id: '3',
    title: "Abstract Art Expo",
    category: "arts",
    dates: { start: new Date('2024-10-05T10:00:00').toISOString() },
    venue: { name: "Modern Gallery", city: "New York" },
    ticketTiers: [{ price: 25, available: 200 }],
    images: ["https://images.unsplash.com/photo-1545989253-02cc26577f88?q=80&w=2070"],
    featured: false,
    status: 'published'
  }
];

const CATEGORIES = [
  { id: 'music', name: 'Music', count: '1,240', icon: Music, image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070' },
  { id: 'sports', name: 'Sports', count: '850', icon: Trophy, image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2070' },
  { id: 'tech', name: 'Technology', count: '420', icon: Cpu, image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070' },
  { id: 'arts', name: 'Arts', count: '630', icon: Palette, image: 'https://images.unsplash.com/photo-1560439514-e960a3ef5019?q=80&w=2070' },
];

const REVIEWS = [
  {
    id: 1,
    title: 'Seamless entry with QR codes!',
    description: 'The IoT-powered access control made entering the venue a breeze. No more waiting in long queues. Highly recommended!',
    rating: 5,
    reviewerName: 'Sarah Chen',
    reviewerContext: 'Tech Summit 2025',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 2,
    title: 'Best platform for organizers',
    description: 'FlowGateX gave me real-time insights into crowd flow. The analytics dashboard is incredibly powerful.',
    rating: 5,
    reviewerName: 'Michael Rodriguez',
    reviewerContext: 'Summer Music Fest',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 3,
    title: 'Smooth payment integration',
    description: 'Checkout was fast and secure. I loved the multiple payment options available. Zero failures.',
    rating: 5,
    reviewerName: 'David Kim',
    reviewerContext: 'FinTech Conf',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
  },
];

const TRIP_STEPS = [
  {
    icon: Search,
    title: 'Discover',
    description: 'Browse thousands of events by category or location.',
    color: 'text-[#00A3DB]',
    bg: 'bg-[#00A3DB]/10',
    border: 'border-[#00A3DB]/30'
  },
  {
    icon: Ticket,
    title: 'Book',
    description: 'Secure your spot with fast, secure checkout.',
    color: 'text-[#A3D639]',
    bg: 'bg-[#A3D639]/10',
    border: 'border-[#A3D639]/30'
  },
  {
    icon: ShieldCheck,
    title: 'Verify',
    description: 'Receive a unique QR code for contactless entry.',
    color: 'text-[#10b981]',
    bg: 'bg-[#10b981]/10',
    border: 'border-[#10b981]/30'
  },
  {
    icon: Smartphone,
    title: 'Experience',
    description: 'Skip lines with IoT-powered access points.',
    color: 'text-[#f59e0b]',
    bg: 'bg-[#f59e0b]/10',
    border: 'border-[#f59e0b]/30'
  }
];

const TRENDING_EVENTS = [
  {
    id: 't1',
    title: 'Electronic Dreams Tour',
    category: 'music',
    image: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?q=80&w=2070',
    date: 'Mar 15, 2026',
    venue: 'Neon Stadium',
    price: 75,
    trending: '+45%',
    likes: 2340
  },
  {
    id: 't2',
    title: 'AI & Robotics Expo',
    category: 'technology',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=2070',
    date: 'Mar 22, 2026',
    venue: 'Tech Pavilion',
    price: 150,
    trending: '+32%',
    likes: 1890
  },
  {
    id: 't3',
    title: 'Urban Street Art Festival',
    category: 'arts',
    image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?q=80&w=2070',
    date: 'Apr 5, 2026',
    venue: 'Downtown District',
    price: 35,
    trending: '+28%',
    likes: 1560
  },
  {
    id: 't4',
    title: 'Gaming Championship Finals',
    category: 'gaming',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070',
    date: 'Apr 12, 2026',
    venue: 'E-Sports Arena',
    price: 60,
    trending: '+67%',
    likes: 4210
  }
];

const PARTNERS = [
  { name: 'TechCorp', logo: '🏢' },
  { name: 'EventPro', logo: '🎪' },
  { name: 'SecureGate', logo: '🔐' },
  { name: 'CloudStream', logo: '☁️' },
  { name: 'DataFlow', logo: '📊' },
  { name: 'InnovateLab', logo: '💡' },
];

const FEATURES_GRID = [
  {
    icon: Fingerprint,
    title: 'Biometric Access',
    description: 'Advanced fingerprint and facial recognition for seamless entry',
    color: 'from-[#00A3DB] to-[#007AA3]'
  },
  {
    icon: Activity,
    title: 'Live Analytics',
    description: 'Real-time crowd monitoring and flow optimization',
    color: 'from-[#A3D639] to-[#7FA82B]'
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    description: 'End-to-end encrypted transactions with fraud protection',
    color: 'from-[#10b981] to-[#059669]'
  },
  {
    icon: Layers,
    title: 'Multi-Tier Tickets',
    description: 'Flexible pricing tiers from VIP to general admission',
    color: 'from-[#f59e0b] to-[#d97706]'
  },
  {
    icon: Eye,
    title: 'AR Navigation',
    description: 'Augmented reality guides for venue exploration',
    color: 'from-[#8b5cf6] to-[#6d28d9]'
  },
  {
    icon: MousePointer,
    title: 'One-Click Entry',
    description: 'Instant QR scanning with sub-second validation',
    color: 'from-[#ec4899] to-[#be185d]'
  }
];

const UPCOMING_HIGHLIGHTS = [
  {
    id: 'u1',
    title: 'World Music Festival 2026',
    description: 'The biggest music festival featuring 100+ artists across 5 stages',
    image: 'https://images.unsplash.com/photo-1459749411177-287ce3288789?q=80&w=2070',
    date: 'June 15-18, 2026',
    location: 'Central Park, NYC',
    attendees: '50,000+',
    category: 'Festival',
    featured: true
  },
  {
    id: 'u2',
    title: 'Tech Innovation Summit',
    description: 'Connect with industry leaders and discover breakthrough technologies',
    image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=2070',
    date: 'July 8-10, 2026',
    location: 'Convention Center, SF',
    attendees: '15,000+',
    category: 'Conference',
    featured: true
  }
];

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } }
};

const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// =============================================================================
// SECTION COMPONENTS
// =============================================================================

const HeroSection = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setMousePosition({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }, []);

  return (
    <section 
      ref={heroRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex flex-col justify-center pt-28 pb-12 px-4 overflow-hidden bg-[var(--bg-primary)]"
    >
      {/* Animated Grid Background */}
      <GridCanvas className="opacity-50" />
      
      {/* Particle System */}
      <ParticleCanvas particleCount={60} />

      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <img 
          alt="Event background" 
          className="w-full h-full object-cover opacity-30 mix-blend-overlay"
          src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)]/95 via-[var(--bg-primary)]/80 to-[var(--bg-primary)]" />
        
        {/* Dynamic Gradient Orbs */}
        <motion.div 
          className="absolute w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle, hsla(195, 100%, 50%, 0.15) 0%, transparent 70%)',
            left: `${mousePosition.x * 100 - 30}%`,
            top: `${mousePosition.y * 100 - 30}%`,
          }}
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div 
          className="absolute w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle, hsla(85, 75%, 50%, 0.1) 0%, transparent 70%)',
            right: `${(1 - mousePosition.x) * 100 - 20}%`,
            bottom: `${(1 - mousePosition.y) * 100 - 20}%`,
          }}
          animate={{
            scale: [1.1, 1, 1.1],
          }}
          transition={{ duration: 5, repeat: Infinity }}
        />
      </div>

      {/* Floating Decorative Elements */}
      <FloatingElement className="absolute top-20 left-10 z-10 hidden lg:block" delay={0}>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-lg">
          <Music className="text-[#00A3DB]" size={24} />
        </div>
      </FloatingElement>
      <FloatingElement className="absolute top-40 right-20 z-10 hidden lg:block" delay={0.5}>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-lg">
          <Trophy className="text-[#A3D639]" size={24} />
        </div>
      </FloatingElement>
      <FloatingElement className="absolute bottom-40 left-20 z-10 hidden lg:block" delay={1}>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-lg">
          <Cpu className="text-[#f59e0b]" size={24} />
        </div>
      </FloatingElement>

      <div className="relative z-10 w-full max-w-6xl mx-auto text-center flex flex-col items-center gap-8">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="space-y-6 max-w-4xl"
        >
          {/* Live Badge */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-3 py-2 px-5 rounded-full bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-lg"
          >
            <PulsingDot />
            <span className="text-xs font-bold tracking-widest text-[var(--text-secondary)] uppercase">
              Live Events Happening Now
            </span>
            <span className="text-xs font-bold text-[#00A3DB]">2,450+</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-[var(--text-primary)] leading-[1.05] tracking-tight">
            Discover{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-[#00A3DB] via-[#33B8E5] to-[#A3D639]">
                Amazing
              </span>
              <motion.span 
                className="absolute -inset-1 bg-gradient-to-r from-[#00A3DB]/20 to-[#A3D639]/20 blur-lg rounded-lg"
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </span>
            {' '}Events
          </h1>

          <p className="text-[var(--text-secondary)] text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Find and book tickets for the best events happening near you. From underground concerts to tech workshops, 
            <span className="text-[#00A3DB] font-medium"> we have it all</span>.
          </p>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center pt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Link 
              to="/events" 
              className="group relative px-10 py-4 rounded-xl text-base font-bold text-white overflow-hidden shadow-2xl shadow-[#00A3DB]/25 transition-all transform hover:-translate-y-1"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#00A3DB] to-[#007AA3] group-hover:from-[#007AA3] group-hover:to-[#00A3DB] transition-all duration-300" />
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="absolute inset-0 bg-gradient-to-r from-[#00A3DB] via-[#A3D639] to-[#00A3DB] bg-[length:200%_100%] animate-shimmer" />
              </span>
              <span className="relative flex items-center gap-2">
                Explore Events
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link 
              to="/auth/register" 
              className="group px-10 py-4 rounded-xl text-base font-bold text-[var(--text-primary)] border-2 border-[var(--border-primary)] hover:border-[#00A3DB] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] transition-all flex items-center justify-center gap-2"
            >
              <Sparkles size={18} className="text-[#A3D639]" />
              Become an Organizer
            </Link>
          </motion.div>
        </motion.div>

        {/* Enhanced Search Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-4xl mt-8"
        >
          <GlowingBorder>
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-3 shadow-2xl">
              <form className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[#00A3DB] transition-colors">
                    <Search size={20} />
                  </div>
                  <input
                    className="w-full bg-transparent border-none text-[var(--text-primary)] placeholder-[var(--text-muted)] pl-12 pr-4 py-3.5 focus:ring-0 text-base rounded-xl hover:bg-[var(--bg-hover)] transition-colors h-full outline-none"
                    placeholder="Search events, artists, venues..."
                    type="text"
                    aria-label="Search events"
                  />
                </div>
                <div className="hidden md:block w-px bg-[var(--border-primary)] my-2" />
                <div className="flex-1 relative group md:max-w-[200px]">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[#00A3DB] transition-colors">
                    <Filter size={20} />
                  </div>
                  <select 
                    className="w-full bg-transparent border-none text-[var(--text-primary)] text-base pl-12 pr-10 py-3.5 focus:ring-0 rounded-xl hover:bg-[var(--bg-hover)] transition-colors h-full appearance-none cursor-pointer outline-none"
                    aria-label="Select category"
                  >
                    <option className="bg-[var(--bg-card)]">All Categories</option>
                    <option className="bg-[var(--bg-card)]">Music</option>
                    <option className="bg-[var(--bg-card)]">Technology</option>
                    <option className="bg-[var(--bg-card)]">Arts</option>
                    <option className="bg-[var(--bg-card)]">Sports</option>
                    <option className="bg-[var(--bg-card)]">Gaming</option>
                  </select>
                </div>
                <div className="hidden md:block w-px bg-[var(--border-primary)] my-2" />
                <div className="flex-1 relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[#00A3DB] transition-colors">
                    <MapPin size={20} />
                  </div>
                  <input
                    className="w-full bg-transparent border-none text-[var(--text-primary)] placeholder-[var(--text-muted)] pl-12 pr-4 py-3.5 focus:ring-0 text-base rounded-xl hover:bg-[var(--bg-hover)] transition-colors h-full outline-none"
                    placeholder="City or Zip"
                    type="text"
                    aria-label="Location"
                  />
                </div>
                <button
                  className="bg-gradient-to-r from-[#00A3DB] to-[#007AA3] hover:from-[#007AA3] hover:to-[#00A3DB] text-white font-bold py-3.5 px-8 rounded-xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                  type="button"
                  aria-label="Search"
                >
                  <span className="hidden sm:inline">Search</span>
                  <ArrowRight size={20} />
                </button>
              </form>
            </div>
          </GlowingBorder>
        </motion.div>

        {/* Quick Stats Pills */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap justify-center gap-4 mt-4"
        >
          {[
            { label: 'Events Today', value: '340+', icon: Calendar },
            { label: 'Cities', value: '120+', icon: Globe },
            { label: 'Artists', value: '5K+', icon: Mic2 },
          ].map((stat, idx) => (
            <div 
              key={idx}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-card)] border border-[var(--border-primary)] text-sm"
            >
              <stat.icon size={14} className="text-[#00A3DB]" />
              <span className="text-[var(--text-muted)]">{stat.label}:</span>
              <span className="text-[var(--text-primary)] font-bold">{stat.value}</span>
            </div>
          ))}
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-[var(--text-muted)]"
          >
            <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
            <ChevronDown size={20} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const StatsSection = () => {
  return (
    <section className="py-16 bg-[var(--bg-secondary)] border-y border-[var(--border-primary)] relative overflow-hidden">
      {/* Subtle Wave Background */}
      <WaveCanvas className="opacity-30" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Total Events", value: 50, suffix: "k+", icon: Calendar, color: "text-[#00A3DB]", bg: "bg-[#00A3DB]/10" },
            { label: "Active Users", value: 10, suffix: "k+", icon: Users, color: "text-[#A3D639]", bg: "bg-[#A3D639]/10" },
            { label: "Tickets Sold", value: 2, suffix: "M+", icon: Ticket, color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10" },
            { label: "Cities Covered", value: 120, suffix: "+", icon: Globe, color: "text-[#10b981]", bg: "bg-[#10b981]/10" },
          ].map((stat, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="text-center group p-6 rounded-2xl bg-[var(--bg-card)]/50 border border-[var(--border-primary)] hover:border-[#00A3DB]/30 transition-all duration-300"
            >
              <div className={`inline-flex items-center justify-center p-4 rounded-2xl ${stat.bg} ${stat.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon size={28} />
              </div>
              <h3 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-2">
                <AnimatedCounter end={stat.value} suffix={stat.suffix} />
              </h3>
              <p className="text-[var(--text-muted)] text-sm font-medium uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TrendingSection = () => {
  return (
    <section className="py-24 bg-[var(--bg-primary)] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, var(--text-muted) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ef4444]/10 border border-[#ef4444]/20 mb-4">
              <TrendingUp className="text-[#ef4444]" size={14} />
              <span className="text-xs font-bold uppercase tracking-widest text-[#ef4444]">Trending Now</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
              Hot Events <span className="text-[#00A3DB]">This Week</span>
            </h2>
            <p className="text-[var(--text-secondary)] text-lg max-w-xl">
              Don't miss out on the most popular events everyone's talking about.
            </p>
          </div>
          <Link 
            to="/events?sort=trending" 
            className="group flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[#00A3DB] text-[var(--text-primary)] font-medium transition-all"
          >
            View All Trending
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Trending Cards Grid */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {TRENDING_EVENTS.map((event) => (
            <motion.div
              key={event.id}
              variants={fadeInUp}
              whileHover={{ y: -8 }}
              className="group relative rounded-2xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[#00A3DB]/50 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={event.image} 
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent" />
                
                {/* Trending Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ef4444] text-white text-xs font-bold">
                  <TrendingUp size={12} />
                  {event.trending}
                </div>

                {/* Like Button */}
                <button 
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-[#ef4444] hover:scale-110 transition-all"
                  aria-label="Like event"
                >
                  <Heart size={16} />
                </button>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#00A3DB]/10 text-[#00A3DB] text-xs font-medium capitalize">
                    {event.category}
                  </span>
                  <span className="text-[var(--text-muted)] text-xs flex items-center gap-1">
                    <Heart size={12} className="text-[#ef4444]" />
                    {event.likes.toLocaleString()}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 group-hover:text-[#00A3DB] transition-colors line-clamp-1">
                  {event.title}
                </h3>

                <div className="space-y-1.5 mb-4">
                  <p className="text-sm text-[var(--text-muted)] flex items-center gap-2">
                    <Calendar size={14} className="text-[#00A3DB]" />
                    {event.date}
                  </p>
                  <p className="text-sm text-[var(--text-muted)] flex items-center gap-2">
                    <MapPin size={14} className="text-[#A3D639]" />
                    {event.venue}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[var(--border-primary)]">
                  <span className="text-xl font-bold text-[var(--text-primary)]">
                    ${event.price}
                  </span>
                  <Link 
                    to={`/events/${event.id}`}
                    className="flex items-center gap-1 text-[#00A3DB] font-medium text-sm hover:gap-2 transition-all"
                  >
                    Get Tickets <ArrowUpRight size={14} />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const CategoriesSection = () => {
  return (
    <section className="py-24 bg-[var(--bg-secondary)] relative" id="categories">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#00A3DB]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#A3D639]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#A3D639]/10 border border-[#A3D639]/20 mb-4">
              <Layers className="text-[#A3D639]" size={14} />
              <span className="text-xs font-bold uppercase tracking-widest text-[#A3D639]">Browse Categories</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">Explore Categories</h2>
            <p className="text-[var(--text-secondary)] text-lg max-w-xl">
              Dive into a world of entertainment. Find events that match your specific interests and passion.
            </p>
          </div>
          <Link 
            to="/events" 
            className="hidden sm:flex items-center text-[#00A3DB] font-bold hover:text-[#007AA3] transition-colors bg-[var(--bg-card)] px-6 py-3 rounded-full border border-[var(--border-primary)] hover:border-[#00A3DB] gap-2"
          >
            View All Categories <ArrowRight size={18} />
          </Link>
        </motion.div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6"
        >
          {CATEGORIES.map((cat) => (
            <motion.div key={cat.id} variants={fadeInUp}>
              <Link 
                to={`/events?category=${cat.id}`} 
                className="group relative overflow-hidden rounded-3xl h-72 flex flex-col justify-between p-8 bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[#00A3DB] transition-all hover:-translate-y-2 shadow-xl hover:shadow-2xl"
              >
                <div className="absolute inset-0 z-0">
                  <img 
                    src={cat.image} 
                    alt={cat.name} 
                    className="w-full h-full object-cover opacity-30 group-hover:opacity-50 group-hover:scale-110 transition-all duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-[var(--bg-card)]/80 to-transparent" />
                </div>
                
                <div className="relative z-10 w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center border border-[var(--border-primary)] text-[var(--text-primary)] group-hover:bg-[#00A3DB] group-hover:border-[#00A3DB] group-hover:text-white transition-all duration-300">
                  <cat.icon size={28} />
                </div>

                <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{cat.name}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold bg-[#00A3DB]/10 text-[#00A3DB] px-3 py-1 rounded-full">
                      {cat.count}
                    </span>
                    <span className="text-[var(--text-secondary)] text-sm">Events</span>
                  </div>
                </div>

                {/* Hover Arrow */}
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                  <ArrowUpRight className="text-[#00A3DB]" size={24} />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Extra Category Cards */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6"
        >
          {[
            { id: 'gaming', name: 'Gaming', icon: Gamepad2, count: '380' },
            { id: 'comedy', name: 'Comedy', icon: PartyPopper, count: '290' },
            { id: 'workshops', name: 'Workshops', icon: Award, count: '520' },
            { id: 'networking', name: 'Networking', icon: Users, count: '410' },
          ].map((cat) => (
            <motion.div key={cat.id} variants={fadeInUp}>
              <Link
                to={`/events?category=${cat.id}`}
                className="group flex items-center gap-4 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[#00A3DB] transition-all hover:shadow-lg"
              >
                <div className="p-3 rounded-xl bg-[#00A3DB]/10 text-[#00A3DB] group-hover:bg-[#00A3DB] group-hover:text-white transition-all">
                  <cat.icon size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-[var(--text-primary)]">{cat.name}</h4>
                  <p className="text-xs text-[var(--text-muted)]">{cat.count} events</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const FeaturedEventsSection = () => {
  return (
    <section className="py-24 bg-[var(--bg-primary)]" id="events">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00A3DB]/10 border border-[#00A3DB]/20 mb-4">
            <Star className="text-[#00A3DB]" size={14} />
            <span className="text-xs font-bold uppercase tracking-widest text-[#00A3DB]">Don't Miss Out</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-6">Featured Events</h2>
          <div className="w-24 h-1.5 bg-gradient-to-r from-[#00A3DB] to-[#A3D639] mx-auto rounded-full" />
        </motion.div>
        
        {/* Event Cards Grid */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {FEATURED_EVENTS_MOCK.map((event) => (
            <motion.div key={event.id} variants={fadeInUp}>
              {/* @ts-expect-error - Mock data structured correctly */}
              <EventCard event={event} />
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <Link 
            to="/events" 
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl text-sm font-bold text-[var(--text-primary)] border-2 border-[var(--border-primary)] hover:border-[#00A3DB] hover:bg-[var(--bg-hover)] transition-all duration-300 tracking-wide uppercase"
          >
            Load More Events
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

const FeaturesGridSection = () => {
  return (
    <section className="py-24 bg-[var(--bg-secondary)] relative overflow-hidden">
      {/* Background */}
      <GridCanvas className="opacity-20" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#A3D639]/10 border border-[#A3D639]/20 mb-4">
            <Cpu className="text-[#A3D639]" size={14} />
            <span className="text-xs font-bold uppercase tracking-widest text-[#A3D639]">Powered by Innovation</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-6">
            Next-Gen <span className="text-[#00A3DB]">Event Technology</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Experience the future of event management with our cutting-edge features designed for the modern world.
          </p>
        </motion.div>

        <motion.div 
         variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {FEATURES_GRID.map((feature, idx) => (
            <motion.div
              key={idx}
              variants={fadeInUp}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group relative p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-transparent transition-all duration-300 overflow-hidden"
            >
              {/* Gradient Border on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              
              {/* Icon */}
              <div className={`relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                <feature.icon size={24} />
              </div>

              {/* Content */}
              <h3 className="relative z-10 text-xl font-bold text-[var(--text-primary)] mb-3 group-hover:text-[#00A3DB] transition-colors">
                {feature.title}
              </h3>
              <p className="relative z-10 text-[var(--text-secondary)] leading-relaxed">
                {feature.description}
              </p>

              {/* Corner Decoration */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br from-[var(--border-primary)] to-transparent opacity-20 group-hover:opacity-40 transition-opacity" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const CollectionsSection = () => {
  return (
    <div className="w-full py-24 bg-[var(--bg-primary)] relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00A3DB]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#A3D639]/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="px-4 md:px-10 lg:px-40 flex justify-center relative z-10">
        <div className="max-w-[1200px] w-full flex flex-col">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00A3DB]/10 border border-[#00A3DB]/20 mb-4">
                <Sparkles className="text-[#00A3DB]" size={14} />
                <span className="text-xs font-bold uppercase tracking-widest text-[#00A3DB]">Curated Collections</span>
              </div>
              <h3 className="text-3xl md:text-5xl font-bold text-[var(--text-primary)]">Explore Dimensions</h3>
            </div>
            <Link to="/events" className="group flex items-center gap-2 text-[var(--text-primary)] font-bold hover:text-[#00A3DB] transition-colors">
              View all categories
              <ArrowRight className="transition-transform group-hover:translate-x-1" size={20} />
            </Link>
          </motion.div>
          
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-4 h-auto md:h-[600px]"
          >
            {/* Main Feature */}
            <motion.div variants={fadeInLeft} className="md:col-span-2 md:row-span-2">
              <Link to="/events?cat=music" className="group relative rounded-3xl overflow-hidden border border-[var(--border-primary)] hover:border-[#00A3DB] transition-all block h-full min-h-[300px]">
                <img 
                  alt="Music" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-50 group-hover:opacity-70"
                  src="https://images.unsplash.com/photo-1514525253440-b393452e3726?q=80&w=2070" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 p-8">
                  <div className="w-16 h-16 rounded-2xl bg-[#00A3DB]/20 flex items-center justify-center mb-4 group-hover:bg-[#00A3DB] transition-colors">
                    <Music className="text-[#00A3DB] group-hover:text-white" size={32} />
                  </div>
                  <h4 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Music & Festivals</h4>
                  <p className="text-[var(--text-secondary)] text-sm max-w-xs opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    From underground gigs to massive stadium tours.
                  </p>
                </div>
              </Link>
            </motion.div>

            {/* Sub Feature 1 */}
            <motion.div variants={fadeInRight} className="md:col-span-2 md:row-span-1">
              <Link to="/events?cat=sports" className="group relative rounded-3xl overflow-hidden border border-[var(--border-primary)] hover:border-[#A3D639] transition-all block h-full min-h-[200px]">
                <img 
                  alt="Sports" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-50 group-hover:opacity-70"
                  src="https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=2069" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#A3D639]/20 flex items-center justify-center group-hover:bg-[#A3D639] transition-colors">
                      <Trophy className="text-[#A3D639] group-hover:text-white" size={24} />
                    </div>
                    <h4 className="text-xl font-bold text-[var(--text-primary)]">Sports & E-Sports</h4>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Sub Feature 2 */}
            <motion.div variants={fadeInUp} className="md:col-span-1 md:row-span-1">
              <Link to="/events?cat=arts" className="group relative rounded-3xl overflow-hidden border border-[var(--border-primary)] hover:border-[#f59e0b] transition-all block h-full min-h-[150px] bg-[var(--bg-card)]">
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#f59e0b]/5 to-transparent">
                  <Palette className="text-6xl text-[var(--text-disabled)] group-hover:text-[#f59e0b] transition-colors" size={60} />
                </div>
                <div className="absolute bottom-0 left-0 p-6 w-full">
                  <div className="flex justify-between items-end w-full">
                    <h4 className="text-lg font-bold text-[var(--text-primary)]">Arts & Theater</h4>
                    <ArrowUpRight className="text-[#f59e0b] opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Sub Feature 3 */}
            <motion.div variants={fadeInUp} className="md:col-span-1 md:row-span-1">
              <Link to="/events?cat=workshops" className="group relative rounded-3xl overflow-hidden border border-[var(--border-primary)] hover:border-[#8b5cf6] transition-all block h-full min-h-[150px] bg-[var(--bg-card)]">
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#8b5cf6]/5 to-transparent">
                  <Cpu className="text-6xl text-[var(--text-disabled)] group-hover:text-[#8b5cf6] transition-colors" size={60} />
                </div>
                <div className="absolute bottom-0 left-0 p-6 w-full">
                  <div className="flex justify-between items-end w-full">
                    <h4 className="text-lg font-bold text-[var(--text-primary)]">Workshops</h4>
                    <ArrowUpRight className="text-[#8b5cf6] opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
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

const UpcomingHighlightsSection = () => {
  return (
    <section className="py-24 bg-[var(--bg-secondary)] relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00A3DB]/5 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#10b981]/10 border border-[#10b981]/20 mb-4">
            <Rocket className="text-[#10b981]" size={14} />
            <span className="text-xs font-bold uppercase tracking-widest text-[#10b981]">Coming Soon</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-6">
            Upcoming <span className="text-[#00A3DB]">Highlights</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Mark your calendars for these extraordinary events that are set to redefine entertainment.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {UPCOMING_HIGHLIGHTS.map((event, idx) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
              whileHover={{ y: -5 }}
              className="group relative rounded-3xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[#00A3DB] transition-all duration-300 shadow-xl hover:shadow-2xl"
            >
              {/* Image Section */}
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={event.image} 
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-[var(--bg-card)]/50 to-transparent" />
                
                {/* Featured Badge */}
                {event.featured && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#00A3DB] to-[#A3D639] text-white text-xs font-bold">
                    <Star size={12} fill="currentColor" />
                    Featured Event
                  </div>
                )}

                {/* Category Badge */}
                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-black/70 text-white text-xs font-medium">
                  {event.category}
                </div>

                {/* Attendees Count */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 text-white text-sm">
                  <Users size={14} />
                  {event.attendees} Expected
                </div>
              </div>

              {/* Content Section */}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3 group-hover:text-[#00A3DB] transition-colors">
                  {event.title}
                </h3>
                <p className="text-[var(--text-secondary)] mb-6 line-clamp-2">
                  {event.description}
                </p>

                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <Calendar size={16} className="text-[#00A3DB]" />
                    {event.date}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <MapPin size={16} className="text-[#A3D639]" />
                    {event.location}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-[var(--border-primary)]">
                  <div className="flex items-center gap-3">
                    <button 
                      className="p-2 rounded-full bg-[var(--bg-hover)] hover:bg-[#ef4444]/10 text-[var(--text-muted)] hover:text-[#ef4444] transition-all"
                      aria-label="Save event"
                    >
                      <Heart size={18} />
                    </button>
                    <button 
                      className="p-2 rounded-full bg-[var(--bg-hover)] hover:bg-[#00A3DB]/10 text-[var(--text-muted)] hover:text-[#00A3DB] transition-all"
                      aria-label="Share event"
                    >
                      <Share2 size={18} />
                    </button>
                    <button 
                      className="p-2 rounded-full bg-[var(--bg-hover)] hover:bg-[#f59e0b]/10 text-[var(--text-muted)] hover:text-[#f59e0b] transition-all"
                      aria-label="Set reminder"
                    >
                      <Bell size={18} />
                    </button>
                  </div>
                  <Link 
                    to={`/events/${event.id}`}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00A3DB] to-[#007AA3] text-white font-medium hover:shadow-lg hover:shadow-[#00A3DB]/25 transition-all"
                  >
                    Learn More <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const HowItWorksSection = () => {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-24 md:px-12 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -z-20 h-96 w-96 rounded-full bg-[#00A3DB]/10 opacity-50 blur-[100px]" />
      <div className="absolute bottom-0 left-0 -z-20 h-96 w-96 rounded-full bg-[#A3D639]/10 opacity-50 blur-[100px]" />

      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
        className="flex justify-center mb-20"
      >
        <div className="text-center max-w-3xl relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border-primary)] bg-[var(--bg-card)] mb-6 shadow-sm">
            <CheckCircle className="text-[#00A3DB]" size={16} />
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">How It Works</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-6 drop-shadow-sm">
            Plan Your Perfect{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00A3DB] to-[#A3D639]">
              Event Experience
            </span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
            From discovery to entry, FlowGateX makes attending events seamless, secure, and enjoyable through our 4-step process.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 relative">
        {/* Connecting Line */}
        <div className="hidden lg:block absolute top-20 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-[#00A3DB]/20 via-[#A3D639]/20 to-[#f59e0b]/20" />

        {TRIP_STEPS.map((step, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.15 }}
            className="group relative flex flex-col items-center text-center"
          >
            <div className="relative z-10 flex h-full w-full flex-col items-center rounded-3xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-8 shadow-xl transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl hover:border-[#00A3DB]/30">
              {/* Step Number */}
              <div className={`absolute -top-4 ${step.bg} ${step.border} border-2 text-[var(--text-primary)] font-mono text-sm font-bold w-10 h-10 rounded-full flex items-center justify-center shadow-lg z-20 group-hover:scale-110 transition-all duration-300`}>
                0{index + 1}
              </div>

              {/* Icon */}
              <div className={`mb-6 flex h-20 w-20 items-center justify-center rounded-2xl ${step.bg} shadow-lg transition-all duration-500 group-hover:rotate-6 group-hover:scale-110`}>
                <step.icon className={`${step.color} text-3xl`} size={32} />
              </div>

              <h3 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                {step.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const CaseStudySection = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="w-full bg-[var(--bg-primary)] py-24 relative overflow-hidden">
      {/* Skewed Background */}
      <div className="absolute inset-0 bg-[var(--bg-secondary)] skew-y-2 transform origin-top-left scale-110 -z-10" />

      <div className="px-4 md:px-10 lg:px-40 flex justify-center relative z-10">
        <div className="max-w-[1200px] w-full grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInLeft}
            className="flex flex-col gap-6"
          >
            <div className="flex items-center gap-3">
              <PulsingDot color="bg-[#00A3DB]" />
              <span className="text-[#00A3DB] font-bold uppercase tracking-widest text-sm">Creators in Motion</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-[var(--text-primary)] leading-tight">
              Empowering the voices that{' '}
              <span className="text-[#00A3DB] underline decoration-[#A3D639] underline-offset-8 decoration-4">
                move the world.
              </span>
            </h2>
            <p className="text-[var(--text-secondary)] text-lg leading-relaxed">
              See how Global Sound Collective scaled their festivals from 5,000 to 50,000 attendees using FlowGateX's enterprise tools.
            </p>

            {/* Stats */}
            <div className="flex gap-8 pt-4">
              <div className="flex flex-col">
                <span className="text-4xl font-bold text-[var(--text-primary)]">
                  <AnimatedCounter end={400} suffix="%" />
                </span>
                <span className="text-[var(--text-muted)] text-sm">Revenue Growth</span>
              </div>
              <div className="w-px h-16 bg-[var(--border-primary)]" />
              <div className="flex flex-col">
                <span className="text-4xl font-bold text-[var(--text-primary)]">
                  <AnimatedCounter end={30} suffix="s" />
                </span>
                <span className="text-[var(--text-muted)] text-sm">Avg. Check-in</span>
              </div>
              <div className="w-px h-16 bg-[var(--border-primary)]" />
              <div className="flex flex-col">
                <span className="text-4xl font-bold text-[var(--text-primary)]">
                  <AnimatedCounter end={99} suffix="%" />
                </span>
                <span className="text-[var(--text-muted)] text-sm">Satisfaction</span>
              </div>
            </div>

            <Link 
              to="/case-studies" 
              className="mt-4 text-left text-[#00A3DB] hover:text-[#007AA3] font-bold flex items-center gap-2 transition-colors w-fit group"
            >
              Read the full case study 
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInRight}
            className="relative rounded-3xl overflow-hidden shadow-2xl border border-[var(--border-primary)] group cursor-pointer aspect-video"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            <img 
              alt="Video Thumbnail"
              className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
              src="https://images.unsplash.com/photo-1459749411177-287ce3288789?q=80&w=2069" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent group-hover:from-black/40 group-hover:via-black/20 transition-colors" />
            
            {/* Play Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                {/* Pulse Ring */}
                <div className="absolute inset-0 rounded-full bg-[#00A3DB]/30 animate-ping" style={{ animationDuration: '2s' }} />
                
                <div className="relative size-24 rounded-full bg-black/40 border border-white/30 flex items-center justify-center">
                  <div className="size-16 rounded-full bg-gradient-to-r from-[#00A3DB] to-[#007AA3] text-white flex items-center justify-center shadow-lg shadow-[#00A3DB]/30 pl-1">
                    <Play size={28} fill="currentColor" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Video Info */}
            <div className="absolute bottom-6 left-6">
              <p className="text-white font-bold text-lg">Global Sound Collective</p>
              <p className="text-gray-300 text-sm">Scaling Enterprise Events • 3:45</p>
            </div>

            {/* Duration Badge */}
            <div className="absolute bottom-6 right-6 px-3 py-1.5 rounded-lg bg-black/70 text-white text-sm font-medium">
              Watch Story
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const PartnersSection = () => {
  return (
    <section className="py-16 bg-[var(--bg-primary)] border-y border-[var(--border-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <p className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-widest">
            Trusted by Industry Leaders
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center items-center gap-12 md:gap-16"
        >
          {PARTNERS.map((partner, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.1 }}
              className="flex items-center gap-3 text-[var(--text-disabled)] hover:text-[var(--text-primary)] transition-colors cursor-pointer group"
            >
              <span className="text-4xl opacity-50 group-hover:opacity-100 transition-opacity">{partner.logo}</span>
              <span className="text-lg font-semibold">{partner.name}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const TestimonialsSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section className="relative mx-auto max-w-7xl px-6 py-24 md:px-12 overflow-hidden">
      <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-[#00A3DB]/5 blur-[100px]" />
      <div className="absolute bottom-0 left-0 -z-10 h-[500px] w-[500px] rounded-full bg-[#A3D639]/5 blur-[100px]" />

      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
        className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20 mb-4 w-fit">
            <Star className="text-[#f59e0b]" fill="currentColor" size={14} />
            <span className="text-xs font-bold uppercase tracking-wider text-[#f59e0b]">Testimonials</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4 leading-tight">
            Trusted by the{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00A3DB] to-[#A3D639]">Best</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
            Discover why thousands of event organizers and attendees trust FlowGateX for their most important moments.
          </p>
        </div>
        
        <Link 
          to="/about" 
          className="px-6 py-3 flex items-center gap-2 group whitespace-nowrap border border-[var(--border-primary)] rounded-full text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:border-[#00A3DB] transition-all"
        >
          <span>See All Reviews</span>
          <ArrowRight className="text-lg group-hover:translate-x-1 transition-transform" size={18} />
        </Link>
      </motion.div>

      <div 
        ref={scrollRef}
        className="flex gap-8 overflow-x-auto pb-12 pt-4 -mx-6 px-6 snap-x snap-mandatory scrollbar-hide" 
      >
        {REVIEWS.map((review) => (
          <motion.div 
            key={review.id} 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -8 }}
            className="snap-center shrink-0 w-full sm:w-[400px]"
          >
            <div className="h-full rounded-2xl p-8 bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[#00A3DB] transition-all duration-300 shadow-lg hover:shadow-xl flex flex-col">
              {/* Stars */}
              <div className="flex gap-1 mb-4 text-[#f59e0b]">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={18} 
                    fill={i < review.rating ? "currentColor" : "none"} 
                    className={i >= review.rating ? "text-gray-300" : ""} 
                  />
                ))}
              </div>

              {/* Quote */}
              <h4 className="text-xl font-bold text-[var(--text-primary)] mb-3">{review.title}</h4>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-6 flex-grow">
                "{review.description}"
              </p>

              {/* Reviewer */}
              <div className="flex items-center gap-4 mt-auto pt-6 border-t border-[var(--border-primary)]">
                <img 
                  src={review.avatar} 
                  alt={review.reviewerName} 
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-[#00A3DB]/20" 
                />
                <div>
                  <p className="font-bold text-[var(--text-primary)]">{review.reviewerName}</p>
                  <p className="text-sm text-[#00A3DB]">{review.reviewerContext}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const NewsletterSection = () => {
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
      {/* Background Pattern */}
      <ParticleCanvas particleCount={30} className="opacity-30" />

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00A3DB]/10 border border-[#00A3DB]/20 mb-6">
            <Bell className="text-[#00A3DB]" size={14} />
            <span className="text-xs font-bold uppercase tracking-widest text-[#00A3DB]">Stay Updated</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">
            Never Miss an Event
          </h2>
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
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#00A3DB] to-[#007AA3] text-white font-bold shadow-lg shadow-[#00A3DB]/25 hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              {isSubscribed ? (
                <>
                  <CheckCircle size={18} />
                  Subscribed!
                </>
              ) : (
                <>
                  Subscribe
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>

          <p className="text-xs text-[var(--text-muted)] mt-4">
            No spam, unsubscribe anytime. Read our{' '}
            <Link to="/privacy" className="text-[#00A3DB] hover:underline">Privacy Policy</Link>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden bg-[var(--bg-primary)]">
      {/* Dynamic Background */}
      <div className="absolute inset-0">
        <GridCanvas className="opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#00A3DB]/10 via-transparent to-[#A3D639]/10" />
      </div>

      <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          {/* Animated Icon */}
          <motion.div
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00A3DB] to-[#A3D639] mb-8 shadow-2xl shadow-[#00A3DB]/30"
          >
            <Zap size={40} className="text-white" />
          </motion.div>

          <h2 className="text-4xl md:text-6xl font-black text-[var(--text-primary)] mb-6">
            Ready to Host Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00A3DB] to-[#A3D639]">
              Event?
            </span>
          </h2>
          <p className="text-xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto">
            Join thousands of organizers who use FlowGateX to manage, promote, and sell out their events. Start your journey today.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              to="/events/create" 
              className="group relative px-12 py-5 rounded-xl text-lg font-bold text-white overflow-hidden shadow-2xl shadow-[#00A3DB]/30 transition-all transform hover:-translate-y-1"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#00A3DB] to-[#A3D639]" />
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="absolute inset-0 bg-gradient-to-r from-[#A3D639] to-[#00A3DB]" />
              </span>
              <span className="relative flex items-center justify-center gap-2">
                <Rocket size={20} />
                Create an Event Now
              </span>
            </Link>
            <Link 
              to="/contact" 
              className="px-12 py-5 rounded-xl text-lg font-bold text-[var(--text-primary)] border-2 border-[var(--border-primary)] hover:border-[#00A3DB] bg-[var(--bg-card)] transition-all flex items-center justify-center gap-2"
            >
              <Headphones size={20} className="text-[#00A3DB]" />
              Contact Sales
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-12 pt-8 border-t border-[var(--border-primary)]">
            {[
              { icon: Shield, label: '256-bit SSL' },
              { icon: Award, label: 'Award Winning' },
              { icon: Clock, label: '24/7 Support' },
              { icon: CheckCircle, label: '99.9% Uptime' },
            ].map((badge, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[var(--text-muted)] text-sm">
                <badge.icon size={16} className="text-[#A3D639]" />
                {badge.label}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function HomePage() {
  return (
    <div className="bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans min-h-screen selection:bg-[#00A3DB] selection:text-white">
      {/* Add custom styles for animations */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 3s linear infinite;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      {/* Page Sections */}
      <HeroSection />
      <StatsSection />
      <TrendingSection />
      <CategoriesSection />
      <FeaturedEventsSection />
      <FeaturesGridSection />
      <CollectionsSection />
      <UpcomingHighlightsSection />
      <HowItWorksSection />
      <CaseStudySection />
      <PartnersSection />
      <TestimonialsSection />
      <NewsletterSection />
      <CTASection />
    </div>
  );
}