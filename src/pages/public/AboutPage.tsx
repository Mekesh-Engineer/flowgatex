import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Globe, ShieldCheck, Users, Sparkles,
  Share2, MapPin, Rocket, Target, Zap, Award,
  Clock, Check, Mail, Phone, MessageCircle,
  Lightbulb, Code, Cpu
} from 'lucide-react';
import {
  PageWrapper, Section, Container, SectionHeader,
  BlurOrbs, DotGrid, GlowCard, FloatingElement,
  PrimaryButton, SecondaryButton, GradientDivider,
  fadeInUp as fadeInUpVariant, // Aliasing to avoid conflict if we define locally
} from '@/components/common/PageShared';
import { GridCanvas, ParticleCanvas } from '@/features/home/components/canvas/CanvasEffects';
// Switched to named import for better safety
import GoogleMap from '@/components/common/GoogleMap';

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

// Fallback if not exported from PageShared
const fadeInUp = fadeInUpVariant || {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const expandCard = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { height: 'auto', opacity: 1, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

// =============================================================================
// DATA
// =============================================================================

const PILLARS = [
  { icon: <Sparkles size={28} />, title: 'Smart Integration', description: 'Seamlessly blending physical hardware with digital platforms for real-time event monitoring.', features: ['IoT Sensors', 'Live Tracking', 'Instant Alerts'], gradient: 'from-[var(--color-primary)] to-blue-600' },
  { icon: <ShieldCheck size={28} />, title: 'Secure Access', description: 'Advanced security protocols ensuring data integrity and safe access control for all venues.', features: ['NFC Access', 'Encrypted Data', 'Role Mgmt'], gradient: 'from-[var(--color-secondary)] to-emerald-600' },
  { icon: <Users size={28} />, title: 'Community First', description: 'Built by students, for the world. Empowering local communities to organize world-class events.', features: ['User Feedback', 'Open API', 'Collab Tools'], gradient: 'from-cyan-400 to-[var(--color-primary)]' },
];

const TEAM = [
  { name: 'Mekesh Kumar M', role: 'Team Leader', id: '23EER052', dept: 'Dept: EEE', college: 'Kongu Engineering College', img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=1000&auto=format&fit=crop', bio: 'Driving the vision of FlowGateX. Expert in full-stack development and project architecture.', funFact: 'Can debug code in his sleep.', linkedin: '#', twitter: '#', gradient: 'from-[var(--color-primary)] to-blue-600', color: 'text-[var(--color-primary)]' },
  { name: 'Harish G', role: 'Core Member', id: '23EER026', dept: 'Dept: EEE', college: 'Kongu Engineering College', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1000&auto=format&fit=crop', bio: 'Specializing in IoT hardware integration and sensor data analytics.', funFact: 'Built his first robot at age 12.', linkedin: '#', twitter: '#', gradient: 'from-[var(--color-secondary)] to-emerald-600', color: 'text-[var(--color-secondary)]' },
  { name: 'Padmesh S', role: 'Core Member', id: '23EEL130', dept: 'Dept: EEE', college: 'Kongu Engineering College', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop', bio: 'Focusing on UI/UX design and frontend interactivity to ensure a smooth user journey.', funFact: 'Pixel perfectionist.', linkedin: '#', twitter: '#', gradient: 'from-violet-500 to-[var(--color-primary)]', color: 'text-[var(--color-primary)]' },
];

const TIMELINE = [
  { year: 'Aug 2025', title: 'Inception', description: 'Conceived project idea. Built HTML/JS prototype. Showcased at KEC Tech Fest.', icon: <Lightbulb size={18} />, color: 'from-yellow-400 to-orange-500' },
  { year: 'Sep 2025', title: 'Validation', description: 'Attended ISTE Exodia Hackathon. Gained critical insights for system improvements.', icon: <Target size={18} />, color: 'from-blue-400 to-cyan-500' },
  { year: 'Nov 2025', title: 'Prototyping', description: 'Started building the core App + Hardware prototype integration.', icon: <Code size={18} />, color: 'from-purple-500 to-pink-500' },
  { year: 'Jan 2026', title: 'Recognition', description: 'Selected for Tamizhan Skill Event. Presented functional Next.js + Hardware prototype.', icon: <Award size={18} />, color: 'from-green-500 to-emerald-500' },
  { year: 'Feb 2026', title: 'Evolution', description: 'Refining the fully functional software suite and hardware ecosystem.', icon: <Rocket size={18} />, color: 'from-[var(--color-primary)] to-indigo-600' },
];

const GLOBAL_CITIES = [
  { name: 'New York', lat: 40.7128, lng: -74.006 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
  { name: 'Berlin', lat: 52.52, lng: 13.405 },
  { name: 'Mumbai', lat: 19.076, lng: 72.8777 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
  { name: 'Erode', lat: 11.341, lng: 77.7172 },
];

// =============================================================================
// COMPONENT
// =============================================================================
export default function AboutPage() {
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [activeTimeline, setActiveTimeline] = useState(4); // Default to latest
  const [linkCopied, setLinkCopied] = useState(false);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      await navigator.share({ title: 'About FlowGateX', url: window.location.href });
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      } catch { /* noop */ }
    }
  }, []);

  // Keyboard Navigation for Timeline
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') setActiveTimeline(p => Math.min(p + 1, TIMELINE.length - 1));
      if (e.key === 'ArrowLeft') setActiveTimeline(p => Math.max(p - 1, 0));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <PageWrapper>
      {/* ══════════ 1. HERO ══════════ */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-[var(--bg-primary)] transition-colors duration-300">
        <GridCanvas className="opacity-40" />
        <ParticleCanvas particleCount={50} className="pointer-events-none" />
        <BlurOrbs variant="hero" />
        <DotGrid />

        <FloatingElement className="absolute top-24 left-10 z-10 hidden lg:block" delay={0}>
          <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-lg hover:scale-110 transition-transform"><Cpu className="text-[var(--color-primary)]" size={24} /></div>
        </FloatingElement>
        <FloatingElement className="absolute bottom-32 right-24 z-10 hidden lg:block" delay={1}>
          <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-lg hover:scale-110 transition-transform"><Code className="text-emerald-500" size={24} /></div>
        </FloatingElement>

        <Container>
          <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs font-bold uppercase tracking-[0.2em]">
              <Sparkles size={14} /> Innovating Since 2025
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }} className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-[var(--text-primary)] mb-8 tracking-tight leading-[0.95]">
              Redefining <br />
              <span className="bg-gradient-to-r from-[var(--color-primary)] via-blue-500 to-[var(--color-secondary)] bg-clip-text text-transparent italic pr-2">Event Tech</span>
              <br />Experiences
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-[var(--text-secondary)] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Bridging the gap between software sophistication and hardware reliability. A project by the students of Kongu Engineering College.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <PrimaryButton onClick={() => document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' })} className="px-8 py-4 text-lg">
                Explore Our Journey <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </PrimaryButton>
              <SecondaryButton onClick={handleShare} className="px-6 py-4 text-lg">
                {linkCopied ? <><Check size={18} className="mr-2" /> Copied</> : <><Share2 size={18} className="mr-2" /> Share Page</>}
              </SecondaryButton>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* ══════════ 2. MISSION ══════════ */}
      <Section id="mission" bg="secondary" className="py-20 md:py-24">
        <Container size="md">
          <SectionHeader badge="Our Purpose" badgeIcon={<Target size={12} />} title="Our" gradientText="Mission" />
          <div className="space-y-8 text-lg md:text-xl text-[var(--text-secondary)] font-light leading-relaxed text-center max-w-4xl mx-auto">
            <motion.p variants={fadeInUp}>
              At FlowGateX, we believe event management shouldn't be a fragmented mess of disparate tools.
              <span className="text-[var(--text-primary)] font-semibold"> We are unifying the experience.</span>
            </motion.p>
            <motion.p variants={fadeInUp}>
              Born from academic curiosity and fueled by real-world challenges, our mission is to deliver a
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] font-semibold"> robust, scalable ecosystem</span>
              that empowers organizers with actionable insights and attendees with seamless interactions.
            </motion.p>
          </div>
        </Container>
      </Section>

      {/* ══════════ 3. CORE PILLARS ══════════ */}
      <Section bg="primary" className="py-20 md:py-24 relative">
        <GradientDivider className="absolute top-0 left-0 w-full" />
        <Container>
          <SectionHeader badge="Technology" badgeIcon={<Zap size={12} />} badgeColor="var(--color-secondary)" title="Core" gradientText="Pillars" description="The foundation of our integrated platform." />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PILLARS.map((pillar, idx) => (
              <GlowCard key={pillar.title} className="p-8 md:p-10 h-full">
                <motion.div variants={fadeUp} custom={idx + 3} className="h-full flex flex-col">
                  <div className={`size-16 rounded-2xl bg-gradient-to-br ${pillar.gradient} flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform shadow-lg`}>{pillar.icon}</div>
                  <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-4">{pillar.title}</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed mb-6 flex-grow">{pillar.description}</p>
                  <div className="flex flex-wrap gap-2 mt-auto">
                    {pillar.features.map(f => (
                      <span key={f} className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)] bg-[var(--color-primary)]/10 rounded-full border border-[var(--color-primary)]/20">{f}</span>
                    ))}
                  </div>
                </motion.div>
              </GlowCard>
            ))}
          </div>
        </Container>
      </Section>

      {/* ══════════ 4. TEAM MEMBERS ══════════ */}
      <Section bg="secondary" className="py-20 md:py-24">
        <Container>
          <SectionHeader badge="The Squad" badgeIcon={<Users size={12} />} title="Meet the" gradientText="Creators" description="The minds from Kongu Engineering College behind FlowGateX." />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
            {TEAM.map((member, idx) => {
              const isExpanded = expandedMember === member.name;
              return (
                <GlowCard key={member.name} className="overflow-hidden group">
                  <motion.div variants={fadeUp} custom={idx}>
                    <div className="relative overflow-hidden aspect-[4/5]">
                      <img src={member.img} alt={member.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 transform group-hover:scale-105" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent opacity-90" />
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h4 className="text-2xl font-bold text-[var(--text-primary)]">{member.name}</h4>
                        <p className={`${member.color} text-sm font-bold uppercase tracking-widest mt-1`}>{member.role}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">{member.id} | {member.dept}</p>
                        <p className="text-xs text-[var(--text-muted)]">{member.college}</p>
                      </div>
                    </div>
                    <div className="p-6 pt-2 space-y-4">
                      <div className="flex items-center gap-3">
                        <button onClick={() => setExpandedMember(isExpanded ? null : member.name)} className="flex-1 py-2 text-xs font-bold uppercase tracking-wider border border-[var(--border-primary)] rounded-lg hover:bg-[var(--color-primary)] hover:text-white hover:border-transparent transition-all">
                          {isExpanded ? 'Show Less' : 'View Profile'}
                        </button>
                      </div>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div variants={expandCard} initial="collapsed" animate="expanded" exit="collapsed" className="overflow-hidden">
                            <div className="pt-4 border-t border-[var(--border-primary)] space-y-3">
                              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{member.bio}</p>
                              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/10">
                                <Sparkles size={14} className="text-[var(--color-primary)] mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-[var(--text-secondary)]"><span className="font-bold text-[var(--text-primary)]">Fun fact:</span> {member.funFact}</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </GlowCard>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* ══════════ 5. TIMELINE (CURSIVE FLOW) ══════════ */}
      <Section id="story" bg="primary" className="py-20 md:py-24 overflow-hidden">
        <Container size="md">
          <SectionHeader badge="Our Journey" badgeIcon={<Clock size={12} />} title="The FlowGateX" gradientText="Story" />

          <div className="relative mt-16">
            {/* Cursive Line SVG Background */}
            <div className="hidden md:block absolute top-[2.25rem] left-0 right-0 h-24 pointer-events-none -z-10">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 100">
                <path d="M0,50 C250,50 250,50 500,50 C750,50 750,50 1000,50" fill="none" stroke="var(--border-primary)" strokeWidth="2" strokeDasharray="8 8" className="opacity-30" />
                <motion.path
                  d="M0,50 C250,50 250,50 500,50 C750,50 750,50 1000,50"
                  fill="none"
                  stroke="url(#gradient-line)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: (activeTimeline) / (TIMELINE.length - 1) }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                />
                <defs>
                  <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--color-primary)" />
                    <stop offset="100%" stopColor="var(--color-secondary)" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="flex flex-col md:flex-row md:justify-between gap-8 md:gap-0" role="tablist">
              {TIMELINE.map((item, idx) => {
                const isActive = activeTimeline === idx;
                return (
                  <div key={item.year} className="relative flex md:flex-col items-center md:text-center md:w-1/5 group">
                    {/* Mobile Vertical Line */}
                    <div className="md:hidden absolute left-[1.5rem] top-12 bottom-[-2rem] w-0.5 bg-[var(--border-primary)] -z-10">
                      {isActive && <motion.div initial={{ height: 0 }} animate={{ height: '100%' }} className="w-full bg-gradient-to-b from-[var(--color-primary)] to-transparent" />}
                    </div>

                    <button
                      onClick={() => setActiveTimeline(idx)}
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`panel-${idx}`}
                      id={`tab-${idx}`}
                      className={`relative z-10 size-12 md:size-16 rounded-full flex items-center justify-center transition-all duration-500 outline-none ${isActive ? 'scale-110 shadow-[0_0_30px_-5px_var(--color-primary)]' : 'hover:scale-105'
                        }`} >
                      <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${item.color} transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                      <div className={`absolute inset-0 rounded-full bg-[var(--bg-card)] border-2 border-[var(--border-primary)] transition-opacity duration-500 ${isActive ? 'opacity-0' : 'opacity-100'}`} />
                      <span className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-white' : 'text-[var(--text-muted)] group-hover:text-[var(--color-primary)]'}`}>
                        {isActive ? item.icon : <div className="scale-75 md:scale-90">{item.icon}</div>}
                      </span>
                    </button>
                    <span className={`ml-4 md:ml-0 md:mt-4 text-sm font-bold transition-all duration-300 ${isActive ? 'text-[var(--color-primary)]' : 'text-[var(--text-muted)]'}`}>{item.year}</span>
                  </div>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTimeline}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35 }}
                className="mt-12 mx-auto max-w-3xl min-h-[200px]"
              >
                <div
                  role="tabpanel"
                  id={`panel-${activeTimeline}`}
                  aria-labelledby={`tab-${activeTimeline}`}
                  className="relative p-1 rounded-2xl bg-gradient-to-r from-[var(--border-primary)] via-[var(--color-primary)]/20 to-[var(--border-primary)]"
                >
                  <div className="relative bg-[var(--bg-card)]/90 backdrop-blur-xl rounded-xl p-8 text-center border border-[var(--border-primary)] shadow-2xl">
                    <div className="absolute top-4 right-4 text-[var(--text-primary)] opacity-5 pointer-events-none transform rotate-12 scale-150">{TIMELINE[activeTimeline].icon}</div>
                    <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">{TIMELINE[activeTimeline].title}</h3>
                    <p className="text-[var(--text-secondary)] text-lg leading-relaxed">{TIMELINE[activeTimeline].description}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <p className="text-center text-xs text-[var(--text-muted)] mt-6 hidden md:block opacity-60">Use ← → arrow keys to navigate timeline</p>
          </div>
        </Container>
      </Section>

      {/* ══════════ 6. GLOBAL REACH — Google Maps ══════════ */}
      <Section bg="secondary" className="py-20 md:py-24">
        <Container size="md">
          <SectionHeader badge="Global Reach" badgeIcon={<Globe size={12} />} title="Events in" gradientText="500+ Cities" description="FlowGateX is powering events across the globe. Explore our reach." />

          {/* Google Map */}
          <motion.div variants={fadeInUp} className="rounded-2xl overflow-hidden border border-[var(--border-primary)] shadow-2xl">
            <GoogleMap
              center={{ lat: 20, lng: 30 }}
              zoom={2}
              height={450}
              markers={GLOBAL_CITIES.map(city => ({
                position: { lat: city.lat, lng: city.lng },
                title: city.name,
              }))}
              className="w-full"
            />
          </motion.div>

          {/* City chips below the map */}
          <motion.div variants={fadeInUp} className="mt-8 flex flex-wrap justify-center gap-3">
            {GLOBAL_CITIES.map((city) => (
              <span key={city.name} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--bg-card)] border border-[var(--border-primary)] text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all cursor-default">
                <MapPin size={12} className="text-[var(--color-primary)]" />
                {city.name}
              </span>
            ))}
          </motion.div>
        </Container>
      </Section>

      {/* ══════════ 7. CONTACT ══════════ */}
      <Section bg="primary" className="py-20 md:py-24">
        <Container>
          <SectionHeader badge="Get in Touch" badgeIcon={<MessageCircle size={12} />} title="Contact" gradientText="& Support" description="Have questions? Our team is here to help you every step of the way." />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Mail size={28} />, title: 'Email Us', description: 'For general inquiries and support requests.', action: 'hello@flowgatex.com', gradient: 'from-[var(--color-primary)] to-blue-600' },
              { icon: <Phone size={28} />, title: 'Call Us', description: 'Mon-Fri, 9AM-6PM IST. We love talking!', action: '+91 98765 43210', gradient: 'from-[var(--color-secondary)] to-emerald-600' },
              { icon: <MapPin size={28} />, title: 'Visit Us', description: 'Kongu Engineering College, Perundurai', action: 'Erode, Tamil Nadu, India', gradient: 'from-violet-500 to-purple-500' },
            ].map((item) => (
              <GlowCard key={item.title} className="p-8 text-center group">
                <div className={`inline-flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br ${item.gradient} text-white mb-6 group-hover:scale-110 transition-transform shadow-lg`}>{item.icon}</div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">{item.description}</p>
                <p className="text-sm font-bold text-[var(--color-primary)] group-hover:underline cursor-pointer">{item.action}</p>
              </GlowCard>
            ))}
          </div>
        </Container>
      </Section>

      {/* ══════════ 8. CTA ══════════ */}
      <section className="py-20 md:py-24 relative overflow-hidden bg-[var(--bg-primary)]">
        <GridCanvas className="opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/10 via-transparent to-[var(--color-secondary)]/10" />
        <Container size="md">
          <div className="text-center relative z-10">
            <motion.div animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }} className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] mb-8 shadow-2xl shadow-[var(--color-primary)]/30">
              <Zap size={40} className="text-white" />
            </motion.div>
            <h2 className="text-5xl md:text-7xl font-black text-[var(--text-primary)] mb-6 tracking-tight">Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]">Revolution</span></h2>
            <p className="text-xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto">The future of event technology starts here. Build it with FlowGateX.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PrimaryButton onClick={() => window.location.href = '/events'} className="px-10 py-5 text-lg">
                Discover Events <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </PrimaryButton>
              <SecondaryButton onClick={() => window.location.href = '/register'} className="px-10 py-5 text-lg">
                Become a Host
              </SecondaryButton>
            </div>
          </div>
        </Container>
      </section>
    </PageWrapper>
  );
}