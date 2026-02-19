import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  CalendarDays,
  MapPin,
  CheckCircle2,
  Mail,
  Flame,
  Info,
  BadgeCheck,
  Users,
  Star,
  Tag as TagIcon,
  Wifi,
  Car,
  Accessibility,
  Utensils,
  Lock,
  Link as LinkIcon,
  ArrowLeft,
  ArrowRight,
  ImageIcon,
  Share,
  Globe,
  Clock,
  Mic2,
  Music,
  Calendar,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Ticket
} from 'lucide-react';
import { formatCurrency, formatDate, copyToClipboard } from '@/lib/utils';
import type { EventSession } from '@/features/events/types/event.types';
import GoogleMap from '@/components/common/GoogleMap';
import { FloatingElement, PulsingDot, GlowingBorder, fadeInUp, staggerContainer, AnimatedCounter } from '@/features/home/components/ui/SharedComponents';
import { useEvents } from '@/features/events/hooks/useEvents';
import { useEventDetails } from '@/features/events/hooks/useEventDetails';
import { ParticleCanvas } from '@/features/home/components/canvas/CanvasEffects';
import { useCart } from '@/features/booking/hooks/useCart';
import { validatePromoCode } from '@/features/booking/services/promoService';
import { showSuccess, showError } from '@/components/common/Toast';
import { createEvent as createICSEvent } from 'ics';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDate(value: unknown): Date {
  if (!value) return new Date();
  if (typeof value === 'object' && value !== null && 'seconds' in value) {
    return new Date((value as { seconds: number }).seconds * 1000);
  }
  const d = new Date(value as string | number);
  return isNaN(d.getTime()) ? new Date() : d;
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export default function EventDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Data Fetching
  const { data: event, isLoading } = useEventDetails(id || '');
  const { data: allEvents } = useEvents();
  const { addToCart } = useCart();

  // Local State
  const [isSaved, setIsSaved] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('day-1');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const bookingWidgetRef = useRef<HTMLDivElement>(null);
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);

  // ── Derived Data ──
  const startDate = event ? parseDate(event.startDate) : new Date();
  const coverImage = event?.coverImage || '/placeholder-event.jpg';
  const organizerName = event?.organizer?.name || 'FlowEvents';
  const tiers = event?.ticketTiers || [];

  // Filter Related Events
  const relatedEvents = useMemo(() => {
    if (!allEvents || !event) return [];
    return allEvents
      .filter(e => e.id !== event.id && e.status === 'published')
      .slice(0, 4);
  }, [allEvents, event]);

  // Group Agenda by Date
  const agendaGroups = useMemo(() => {
    if (!event || !event.agenda || event.agenda.length === 0) return null;

    // Check if we have dates
    const hasDates = event.agenda.some(s => !!s.date);

    if (!hasDates) {
      return { 'Schedule': event.agenda };
    }

    const groups: Record<string, EventSession[]> = {};
    event.agenda.forEach(session => {
      const d = session.date ? new Date(session.date).toDateString() : 'Unscheduled';
      if (!groups[d]) groups[d] = [];
      groups[d].push(session);
    });
    return groups;
  }, [event]);

  const agendaTabs = useMemo(() => {
    if (!agendaGroups) return [];
    return Object.keys(agendaGroups).map((dateKey, index) => {
      let label = dateKey;
      if (dateKey !== 'Schedule' && dateKey !== 'Unscheduled') {
        const dateObj = new Date(dateKey);
        if (!isNaN(dateObj.getTime())) {
          label = `Day ${index + 1}`;
        }
      }
      return {
        id: `day-${index + 1}`,
        label: label,
        originalKey: dateKey,
        fullLabel: dateKey !== 'Schedule' && dateKey !== 'Unscheduled' ? new Date(dateKey).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : label
      };
    });
  }, [agendaGroups]);

  // Set initial active tab
  useEffect(() => {
    if (agendaTabs.length > 0 && !agendaTabs.find(t => t.id === activeTab)) {
      setActiveTab(agendaTabs[0].id);
    }
  }, [agendaTabs, activeTab]);

  // Auto-select first available tier
  useEffect(() => {
    if (!selectedTierId && tiers.length > 0) {
      const firstAvailable = tiers.find(t => (t.quantity - (t.sold || 0)) > 0);
      if (firstAvailable) setSelectedTierId(firstAvailable.id);
    }
  }, [tiers, selectedTierId]);

  const activeTier = tiers.find(t => t.id === selectedTierId) || tiers[0];
  const totalPrice = activeTier ? activeTier.price * quantity : 0;
  const serviceFee = quantity * 5; // Service fee per ticket
  const finalTotal = totalPrice + serviceFee - promoDiscount;

  // Intersection Observer for floating CTA
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowFloatingCTA(!entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (bookingWidgetRef.current) observer.observe(bookingWidgetRef.current);
    return () => observer.disconnect();
  }, [event]);

  // Handlers
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: event?.title, url });
    } else {
      await copyToClipboard(url);
      showSuccess('Link copied to clipboard!');
    }
  };

  const handleBook = () => {
    if (!selectedTierId || !event) return;

    const tierToBook = tiers.find(t => t.id === selectedTierId);
    if (!tierToBook) return;

    addToCart(
      event.id,
      event.title,
      startDate.toISOString(),
      coverImage,
      event.venue?.name || 'TBA',
      tierToBook.id,
      tierToBook.name,
      tierToBook.price,
      quantity
    );
    showSuccess(`${event.title} — ${tierToBook.name} x${quantity} added to cart!`);
    navigate('/cart');
  };

  // Promo Code Handler
  const handleApplyPromo = async () => {
    if (!promoCode.trim() || !event) return;
    setPromoLoading(true);
    try {
      const result = await validatePromoCode(promoCode.trim(), event.id, totalPrice);
      if (result.isValid) {
        setPromoDiscount(result.discountAmount);
        setPromoApplied(true);
        showSuccess(result.message || 'Promo code applied!');
      } else {
        setPromoDiscount(0);
        setPromoApplied(false);
        showError(result.message || 'Invalid promo code');
      }
    } catch {
      showError('Failed to validate promo code');
    } finally {
      setPromoLoading(false);
    }
  };

  // Add to Calendar (.ics download)
  const handleAddToCalendar = () => {
    if (!event) return;
    const start = startDate;
    const end = event.endDate ? parseDate(event.endDate) : new Date(start.getTime() + 3 * 60 * 60 * 1000);
    createICSEvent({
      title: event.title,
      start: [start.getFullYear(), start.getMonth() + 1, start.getDate(), start.getHours(), start.getMinutes()],
      end: [end.getFullYear(), end.getMonth() + 1, end.getDate(), end.getHours(), end.getMinutes()],
      location: event.venue?.address || event.venue?.name || 'Online',
      description: `Event: ${event.title}\nOrganizer: ${organizerName}`,
    }, (error: any, value: string) => {
      if (error || !value) return;
      const blob = new Blob([value], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${event.title.replace(/\s+/g, '_')}.ics`;
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  // Combine venue amenities with defaults if missing
  const amenities = [
    { icon: Wifi, label: 'Free WiFi', active: true },
    { icon: Car, label: 'Parking', active: event?.venue?.hasParking ?? false },
    { icon: Accessibility, label: 'Accessible', active: true },
    { icon: Utensils, label: 'Food Court', active: true }
  ];

  // ── Loading Skeleton ──
  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-[var(--bg-base)] animate-pulse p-4 lg:p-20 flex flex-col items-center">
        <div className="max-w-7xl w-full flex flex-col gap-8">
          <div className="h-[32rem] bg-[var(--bg-card)] rounded-3xl w-full border border-[var(--border-primary)]" />
          <div className="h-24 bg-[var(--bg-card)] rounded-2xl w-2/3 border border-[var(--border-primary)]" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 h-96 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-primary)]" />
            <div className="lg:col-span-4 h-96 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-primary)]" />
          </div>
        </div>
      </div>
    );
  }

  // ── Not Found ──
  if (!event) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-[var(--color-primary)]/10 p-8 rounded-full mb-6">
            <Info size={64} className="text-[var(--color-primary)]" />
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)] mb-4">Event Not Found</h1>
          <button
            onClick={() => navigate('/events')}
            className="px-8 py-4 bg-[var(--color-primary)] text-white rounded-xl font-bold transition-all flex items-center gap-2 hover:bg-[var(--color-primary-focus)]"
          >
            <ArrowLeft size={20} /> Browse Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-base)] min-h-screen flex flex-col font-sans text-[var(--text-primary)] transition-colors duration-300 relative overflow-x-hidden">

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <ParticleCanvas particleCount={30} />
      </div>

      <main className="relative z-10 grow w-full flex justify-center px-4 md:px-8 lg:px-12 py-8 lg:py-16">
        <div className="max-w-7xl w-full flex flex-col gap-12 lg:gap-16">

          {/* ── Breadcrumb Navigation ── */}
          <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] font-medium">
            <Link to="/" className="hover:text-[var(--color-primary)] transition-colors">Home</Link>
            <ChevronRight size={14} />
            <Link to="/events" className="hover:text-[var(--color-primary)] transition-colors">Events</Link>
            <ChevronRight size={14} />
            <span className="capitalize">{event.category}</span>
            <ChevronRight size={14} />
            <span className="text-[var(--text-primary)] font-bold truncate max-w-xs">{event.title}</span>
          </nav>

          {/* ── Hero Section (Solid Style) ── */}
          <section className="relative w-full rounded-[2.5rem] overflow-hidden group shadow-xl border border-[var(--border-primary)] bg-[var(--bg-card)] isolate">
            <div className="relative h-96 md:h-[32rem] w-full">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-[1.5s] group-hover:scale-105"
                style={{ backgroundImage: `url(${coverImage})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-[var(--bg-card)]/60 to-transparent z-10" />

              <div className="absolute bottom-0 inset-x-0 p-6 md:p-12 z-20 flex flex-col gap-6">

                {/* Badges */}
                <motion.div
                  initial="hidden" animate="visible" variants={staggerContainer}
                  className="flex flex-wrap gap-3"
                >
                  <motion.div variants={fadeInUp}>
                    <span className="bg-[var(--color-primary)] text-white text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-2">
                      <TagIcon size={14} /> {event.category}
                    </span>
                  </motion.div>
                  <motion.div variants={fadeInUp}>
                    <span className="bg-[#ef4444] text-white text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm animate-pulse">
                      <Flame size={14} fill="currentColor" /> Filling Fast
                    </span>
                  </motion.div>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-4xl md:text-6xl lg:text-7xl font-black text-[var(--text-primary)] leading-[0.95] tracking-tight drop-shadow-sm"
                >
                  {event.title}
                </motion.h1>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="flex flex-wrap items-center gap-4 text-sm md:text-base font-medium"
                >
                  <div className="flex items-center gap-2 text-[var(--text-secondary)] px-4 py-2 bg-[var(--bg-surface)] rounded-full border border-[var(--border-primary)]">
                    <BadgeCheck className="text-blue-500" size={18} fill="currentColor" stroke="white" />
                    <span className="text-[var(--text-primary)] font-bold">{organizerName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--text-secondary)] px-4 py-2 bg-[var(--bg-surface)] rounded-full border border-[var(--border-primary)]">
                    <Users size={18} className="text-[var(--color-primary)]" />
                    <span className="text-[var(--text-primary)] font-bold"><AnimatedCounter end={2500} suffix="+" /> Attendees</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-surface)] rounded-full border border-[var(--border-primary)]">
                    <Star size={18} fill="#eab308" className="text-yellow-500" />
                    <span className="text-[var(--text-primary)] font-bold">4.8</span>
                    <span className="text-[var(--text-muted)] font-normal text-xs">(342 Reviews)</span>
                  </div>
                </motion.div>
              </div>

              {/* Top Right Actions */}
              <div className="absolute top-6 right-6 z-30 flex gap-3">
                <button
                  onClick={handleAddToCalendar}
                  className="size-12 rounded-full bg-[var(--bg-card)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-all shadow-md"
                  title="Add to Calendar"
                >
                  <Calendar size={20} />
                </button>
                <button
                  onClick={handleShare}
                  className="size-12 rounded-full bg-[var(--bg-card)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-all shadow-md"
                >
                  <Share size={20} />
                </button>
                <button
                  onClick={() => setIsSaved(!isSaved)}
                  className={`size-12 rounded-full bg-[var(--bg-card)] border border-[var(--border-primary)] flex items-center justify-center transition-all shadow-md ${isSaved ? 'text-red-500' : 'text-[var(--text-primary)] hover:text-red-500'}`}
                >
                  <Heart size={20} fill={isSaved ? "currentColor" : "none"} />
                </button>
              </div>
            </div>

            {/* Decorative Elements (Solid) */}
            <div className="absolute top-12 right-12 hidden lg:block pointer-events-none">
              <FloatingElement delay={0}>
                <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] shadow-lg rotate-12">
                  <Music className="text-[var(--color-primary)]" size={28} />
                </div>
              </FloatingElement>
            </div>
          </section>

          {/* ── Main Layout Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">

            {/* Left Column (Main Content) */}
            <div className="lg:col-span-8 flex flex-col gap-12">

              {/* Quick Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: CalendarDays, label: 'Date & Time', value: formatDate(startDate), sub: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
                  { icon: MapPin, label: 'Location', value: event.venue?.name || 'TBA', sub: event.venue?.city || 'Online' },
                  { icon: TagIcon, label: 'Category', value: event.category, sub: event.type }
                ].map((item, idx) => (
                  <GlowingBorder key={idx} className="h-full">
                    <div className="group relative flex flex-col justify-between h-full gap-4 rounded-2xl p-6 bg-[var(--bg-card)] border border-[var(--border-primary)] hover:shadow-lg transition-all duration-300">
                      <div className="size-12 rounded-xl bg-[var(--bg-surface)] flex items-center justify-center text-[var(--color-primary)] border border-[var(--border-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors duration-300">
                        <item.icon size={24} />
                      </div>
                      <div>
                        <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mb-1">{item.label}</p>
                        <p className="text-[var(--text-primary)] text-lg font-bold capitalize truncate">{item.value}</p>
                        <p className="text-[var(--text-secondary)] text-sm capitalize truncate mt-1">{item.sub}</p>
                      </div>
                    </div>
                  </GlowingBorder>
                ))}
              </div>

              {/* About */}
              <motion.div
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
                className="space-y-6"
              >
                <div className="flex items-center gap-3">
                  <PulsingDot color="bg-[var(--color-primary)]" size="size-3" />
                  <h3 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">About Event</h3>
                </div>
                <div className="rounded-4xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-8 shadow-sm">
                  <div
                    className="prose dark:prose-invert prose-lg max-w-none text-[var(--text-secondary)] leading-relaxed prose-headings:font-bold prose-headings:text-[var(--text-primary)] prose-strong:text-[var(--text-primary)]"
                    dangerouslySetInnerHTML={{ __html: event.description || '<p>No description available.</p>' }}
                  />

                  <button className="mt-8 text-[var(--color-primary)] font-bold text-sm hover:underline flex items-center gap-2 group uppercase tracking-widest">
                    Read More <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>

                  {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-3 pt-8 mt-4 border-t border-[var(--border-primary)]/50">
                      {event.tags.map(tag => (
                        <span key={tag} className="px-5 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] text-xs font-bold text-[var(--text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all cursor-pointer hover:shadow-md">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Highlights & Amenities */}
              <motion.div
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
                className="space-y-6"
              >
                <h3 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Highlights & Amenities</h3>

                {/* Highlights List */}
                {event.highlights && event.highlights.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {event.highlights.map((highlight, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] hover:border-[var(--color-primary)]/50 transition-colors">
                        <CheckCircle2 size={22} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
                        <span className="text-[var(--text-primary)] font-medium text-lg leading-snug">{highlight}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Amenities Icons */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {amenities.map((amenity, idx) => (
                    <div key={idx} className={`flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border transition-all duration-300 ${amenity.active ? 'border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-[var(--color-primary)] hover:shadow-md' : 'border-dashed border-[var(--border-primary)] bg-[var(--bg-base)] opacity-50 grayscale'}`}>
                      <amenity.icon size={28} className={amenity.active ? "text-[var(--color-primary)]" : "text-[var(--text-muted)]"} />
                      <span className="text-sm font-bold text-[var(--text-primary)]">{amenity.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Schedule (Dynamic) */}
              {event.agenda && event.agenda.length > 0 && (
                <motion.div
                  initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <h3 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Event Schedule</h3>
                    {agendaTabs.length > 1 && (
                      <div className="flex bg-[var(--bg-surface)] rounded-2xl p-1.5 border border-[var(--border-primary)] shadow-sm">
                        {agendaTabs.map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === tab.id
                              ? 'bg-[var(--bg-card)] text-[var(--color-primary)] shadow-sm border border-[var(--border-primary)]'
                              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                              }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    {agendaGroups && agendaTabs.find(t => t.id === activeTab) && agendaGroups[agendaTabs.find(t => t.id === activeTab)!.originalKey]?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col md:flex-row gap-6 p-6 rounded-4xl bg-[var(--bg-card)] border border-[var(--border-primary)] hover:shadow-lg transition-all duration-300"
                      >
                        <div className="shrink-0 w-full md:w-32 flex flex-col items-center justify-center p-4 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-primary)]">
                          <Clock size={24} className="mb-2 text-[var(--color-primary)]" />
                          <span className="font-black text-xl text-[var(--text-primary)]">{item.time ? item.time.split(' ')[0] : 'TBD'}</span>
                          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">{item.time ? (item.time.split(' ')[1] || 'AM') : ''}</span>
                        </div>

                        <div className="grow flex flex-col justify-center">
                          <h4 className="text-xl font-bold text-[var(--text-primary)] mb-2">{item.title}</h4>
                          <p className="text-[var(--text-secondary)] leading-relaxed">{item.description}</p>

                          {item.speaker && (
                            <div className="mt-4 flex items-center gap-3">
                              <div className="size-8 rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-[var(--text-secondary)] border border-[var(--border-primary)]">
                                <Mic2 size={14} />
                              </div>
                              <span className="text-sm font-bold text-[var(--text-primary)]">By {item.speaker}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )) || (
                        <div className="text-center py-12 text-[var(--text-muted)] italic bg-[var(--bg-card)] rounded-4xl border border-[var(--border-primary)]">
                          No schedule details available for this day.
                        </div>
                      )}
                  </div>
                </motion.div>
              )}

              {/* Venue Map */}
              <motion.div
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
                className="space-y-6"
              >
                <h3 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Venue Location</h3>
                <div className="rounded-[2.5rem] overflow-hidden border border-[var(--border-primary)] bg-[var(--bg-card)] h-112.5 relative shadow-lg group">
                  {event.venue?.mapCoordinates && typeof event.venue.mapCoordinates.lat === 'number' && typeof event.venue.mapCoordinates.lng === 'number' ? (
                    <GoogleMap
                      center={event.venue.mapCoordinates}
                      zoom={15}
                      markers={[{ position: event.venue.mapCoordinates, title: event.venue.name }]}
                      height="100%"
                      className="h-full w-full grayscale group-hover:grayscale-0 transition-all duration-700"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-[var(--bg-surface)] relative">
                      <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/San_Francisco_OpenStreetMap.png')] bg-cover bg-center grayscale invert" />
                      <div className="z-10 bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-primary)] text-center shadow-lg">
                        <MapPin size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
                        <p className="text-[var(--text-primary)] font-bold">Map unavailable</p>
                        <p className="text-[var(--text-secondary)] text-sm">Coordinates missing for this venue.</p>
                      </div>
                    </div>
                  )}

                  {/* Floating Map Card (Solid) */}
                  <div className="absolute bottom-6 left-6 z-10 w-[calc(100%-3rem)] md:w-auto">
                    <FloatingElement duration={4}>
                      <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-primary)] max-w-sm shadow-xl">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="p-3 bg-[var(--bg-surface)] rounded-xl text-[var(--color-primary)] border border-[var(--border-primary)]">
                            <MapPin size={24} />
                          </div>
                          <div>
                            <h4 className="text-[var(--text-primary)] font-bold text-lg leading-tight">{event.venue?.name || 'Venue TBA'}</h4>
                            <p className="text-[var(--text-secondary)] text-sm mt-1">{event.venue?.address || 'Address TBA'}</p>
                          </div>
                        </div>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${event.venue?.mapCoordinates ? `${event.venue.mapCoordinates.lat},${event.venue.mapCoordinates.lng}` : encodeURIComponent(event.venue?.address || '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-3 bg-[var(--text-primary)] text-[var(--bg-base)] hover:bg-[var(--color-primary)] hover:text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                        >
                          Get Directions <ArrowRight size={16} />
                        </a>
                      </div>
                    </FloatingElement>
                  </div>
                </div>
              </motion.div>

              {/* Organizer */}
              <motion.div
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
                className="space-y-6"
              >
                <h3 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Organizer</h3>
                <div className="flex flex-col md:flex-row items-center justify-between p-8 rounded-[2.5rem] border border-[var(--border-primary)] bg-[var(--bg-card)] gap-8 hover:shadow-lg transition-all duration-300 group">

                  <div className="flex items-center gap-6 w-full md:w-auto relative z-10">
                    {event.organizer?.logo ? (
                      <img src={event.organizer.logo} alt={organizerName} className="size-20 rounded-full object-cover border-4 border-[var(--bg-surface)] ring-2 ring-[var(--border-primary)]" />
                    ) : (
                      <div className="size-20 rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-[var(--color-primary)] font-black text-3xl border-4 border-[var(--bg-card)] ring-2 ring-[var(--border-primary)] shadow-sm">
                        {organizerName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-[var(--text-primary)] font-black text-2xl">{organizerName}</h4>
                        <BadgeCheck className="text-blue-500" size={20} fill="currentColor" stroke="white" />
                      </div>
                      <p className="text-[var(--text-secondary)] text-base font-medium mt-1">Professional Event Organizer</p>

                      <div className="flex gap-4 mt-4">
                        <button className="size-10 rounded-full bg-[var(--bg-surface)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all"><Globe size={18} /></button>
                        <button className="size-10 rounded-full bg-[var(--bg-surface)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all"><Mail size={18} /></button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 w-full md:w-auto justify-center md:justify-end border-t md:border-t-0 md:border-l border-[var(--border-primary)] pt-6 md:pt-0 md:pl-8">
                    <div className="text-center group-hover:scale-105 transition-transform duration-300">
                      <p className="text-[var(--text-primary)] font-black text-2xl">45</p>
                      <p className="text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-widest mt-1">Events</p>
                    </div>
                    <div className="text-center group-hover:scale-105 transition-transform duration-300 delay-75">
                      <p className="text-[var(--text-primary)] font-black text-2xl">12k</p>
                      <p className="text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-widest mt-1">Followers</p>
                    </div>
                    <button className="px-6 py-3 bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-xl font-bold transition-all hover:bg-[var(--text-primary)] hover:text-[var(--bg-base)] shadow-sm">
                      Follow
                    </button>
                  </div>
                </div>
              </motion.div>

            </div>

            {/* Right Column (Sticky Sidebar) */}
            <div className="lg:col-span-4 relative order-first lg:order-last">
              <div className="sticky top-24 space-y-6">

                {/* Booking Widget (Solid) */}
                <motion.div
                  ref={bookingWidgetRef}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  className="rounded-[2.5rem] border border-[var(--border-primary)] bg-[var(--bg-card)] p-8 shadow-xl relative overflow-hidden"
                >
                  {/* Header Line */}
                  <div className="absolute top-0 inset-x-0 h-2 bg-linear-to-r from-[var(--color-primary)] to-[var(--color-secondary)]" />

                  <h3 className="text-2xl font-black text-[var(--text-primary)] mb-8 mt-2">Select Tickets</h3>

                  {/* Ticket Tiers */}
                  <div className="space-y-4 mb-8">
                    {tiers.length === 0 && (
                      <div className="text-center py-8 px-4 bg-[var(--bg-surface)] rounded-2xl border border-dashed border-[var(--border-primary)]">
                        <p className="text-[var(--text-muted)] font-medium">No tickets released yet.</p>
                      </div>
                    )}

                    {tiers.map((tier) => {
                      const available = (tier.quantity || 0) - (tier.sold || 0);
                      const isSoldOut = available <= 0;
                      const isSelected = selectedTierId === tier.id;

                      return (
                        <div
                          key={tier.id}
                          onClick={() => !isSoldOut && setSelectedTierId(tier.id)}
                          className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 relative overflow-hidden ${isSelected
                            ? 'border-[var(--color-primary)] bg-[var(--bg-surface)] shadow-md'
                            : 'border-[var(--border-primary)] bg-[var(--bg-base)] hover:border-[var(--border-accent)]'
                            } ${isSoldOut ? 'opacity-60 cursor-not-allowed grayscale' : ''}`}
                        >
                          {/* Status Badge */}
                          {isSoldOut ? (
                            <div className="absolute top-0 right-0 bg-[var(--text-muted)] text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">SOLD OUT</div>
                          ) : tier.name.toLowerCase().includes('vip') && (
                            <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-2xl shadow-sm z-10">BEST VALUE</div>
                          )}

                          <div className="flex justify-between items-start mb-3 relative z-10">
                            <div>
                              <h4 className={`font-black text-lg transition-colors ${isSelected ? 'text-[var(--color-primary)]' : 'text-[var(--text-primary)]'}`}>{tier.name}</h4>
                              <p className="text-[var(--text-secondary)] text-xs mt-1 font-bold tracking-wide uppercase">{tier.description || 'General Admission'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[var(--text-primary)] font-black text-2xl tracking-tight">{formatCurrency(tier.price)}</p>
                              <p className="text-[var(--text-muted)] text-[10px] uppercase font-bold">+ fees</p>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border-subtle)]">
                              <span className="text-green-600 text-xs flex items-center gap-1.5 font-bold bg-green-100 dark:bg-green-900/30 px-3 py-1.5 rounded-lg">
                                <CheckCircle2 size={12} strokeWidth={3} /> Available
                              </span>
                              <div className="flex items-center bg-[var(--bg-card)] rounded-xl border border-[var(--border-primary)] shadow-sm p-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setQuantity(Math.max(1, quantity - 1)); }}
                                  className="size-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--color-primary)] transition-colors"
                                >-</button>
                                <span className="text-[var(--text-primary)] font-bold text-lg w-10 text-center">{quantity}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setQuantity(Math.min(10, quantity + 1)); }}
                                  className="size-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--color-primary)] transition-colors"
                                >+</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Promo Code */}
                  <div className="flex gap-2 mb-8 bg-[var(--bg-base)] p-1 rounded-2xl border border-[var(--border-primary)]">
                    <input
                      className="grow bg-transparent border-none px-4 py-3 text-sm text-[var(--text-primary)] focus:ring-0 outline-none placeholder-[var(--text-muted)] font-medium"
                      placeholder="Have a promo code?"
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      disabled={promoApplied}
                    />
                    {promoApplied ? (
                      <button
                        onClick={() => { setPromoCode(''); setPromoDiscount(0); setPromoApplied(false); }}
                        className="px-6 py-2 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-red-500 transition-all shadow-sm"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        onClick={handleApplyPromo}
                        disabled={promoLoading || !promoCode.trim()}
                        className="px-6 py-2 bg-[var(--bg-card)] border border-[var(--border-primary)] text-[var(--text-primary)] text-sm font-bold rounded-xl hover:bg-[var(--text-primary)] hover:text-[var(--bg-base)] transition-all shadow-sm disabled:opacity-50"
                      >
                        {promoLoading ? '...' : 'Apply'}
                      </button>
                    )}
                  </div>
                  {promoApplied && promoDiscount > 0 && (
                    <div className="text-green-600 text-sm font-bold mb-4 bg-green-500/10 px-4 py-2 rounded-xl border border-green-500/20">
                      Discount applied: -{formatCurrency(promoDiscount)}
                    </div>
                  )}

                  {/* Summary */}
                  {selectedTierId && (
                    <div className="border-t border-[var(--border-primary)] pt-6 space-y-4 mb-8">
                      <div className="flex justify-between text-sm font-bold text-[var(--text-secondary)]">
                        <span>Subtotal</span>
                        <span>{formatCurrency(totalPrice)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-[var(--text-secondary)]">
                        <span>Service Fee</span>
                        <span>{formatCurrency(serviceFee)}</span>
                      </div>
                      {promoDiscount > 0 && (
                        <div className="flex justify-between text-sm font-bold text-green-500">
                          <span>Discount</span>
                          <span>-{formatCurrency(promoDiscount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[var(--text-primary)] font-black text-3xl pt-4 border-t-2 border-dashed border-[var(--border-subtle)] mt-2 items-end">
                        <span className="text-base font-bold text-[var(--text-muted)]">Total</span>
                        <span>{formatCurrency(finalTotal)}</span>
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <button
                    onClick={handleBook}
                    disabled={!selectedTierId}
                    className="w-full bg-[var(--color-primary)] text-white font-black text-xl py-5 rounded-2xl shadow-lg hover:shadow-[var(--shadow-glow)] transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      Book Tickets <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>

                  <div className="mt-6 text-center">
                    <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                      <Lock size={12} /> Secure Payment Processing
                    </p>
                  </div>
                </motion.div>

                {/* Share Card (Solid) */}
                <div className="rounded-4xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6 flex items-center justify-between shadow-md">
                  <span className="text-[var(--text-primary)] font-bold text-base">Share event</span>
                  <div className="flex gap-3">
                    <button
                      onClick={() => copyToClipboard(window.location.href)}
                      className="size-12 rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:bg-[var(--color-primary)] transition-all border border-[var(--border-primary)] hover:-translate-y-1 shadow-sm"
                    >
                      <LinkIcon size={20} />
                    </button>
                    <button
                      className="size-12 rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:bg-blue-500 transition-all border border-[var(--border-primary)] hover:-translate-y-1 shadow-sm"
                    >
                      <Mail size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ── Similar Events (Dynamic) ── */}
          <div className="py-20 border-t border-[var(--border-primary)]">

            {/* FAQs Section */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
              className="mb-20"
            >
              <div className="flex items-center gap-3 mb-8">
                <HelpCircle size={28} className="text-[var(--color-primary)]" />
                <h3 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Frequently Asked Questions</h3>
              </div>
              <div className="space-y-4">
                {[
                  { q: 'What is the cancellation and refund policy?', a: 'Cancellations made 48 hours before the event are eligible for a full refund (minus processing fees). Cancellations within 48 hours receive a 50% refund. No refunds are issued after the event starts.' },
                  { q: 'How do I receive my tickets?', a: 'After successful payment, your tickets with unique QR codes will be available in the "My Tickets" section. You can also download them as PDF. Show the QR code at the venue entrance for check-in.' },
                  { q: 'Can I transfer my ticket to someone else?', a: 'Yes, you can transfer tickets by sharing the QR code or updating attendee details in your booking. The ticket remains valid regardless of who presents it at the gate.' },
                  { q: 'What are the entry requirements?', a: 'You need a valid ticket (QR code) and a government-issued ID for verification. VIP ticket holders may need to show their VIP pass at designated entrances.' },
                  { q: 'Is there a limit on the number of tickets I can purchase?', a: 'You can purchase up to 10 tickets per transaction per tier. For group bookings larger than 10, please contact the event organizer directly.' },
                ].map((faq, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                      className="w-full flex items-center justify-between p-6 text-left"
                    >
                      <span className="font-bold text-[var(--text-primary)] text-lg pr-4">{faq.q}</span>
                      <ChevronDown
                        size={20}
                        className={`text-[var(--text-muted)] shrink-0 transition-transform duration-300 ${faqOpen === idx ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <AnimatePresence>
                      {faqOpen === idx && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <p className="px-6 pb-6 text-[var(--text-secondary)] leading-relaxed">{faq.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-3">
                <PulsingDot color="bg-[var(--color-secondary)]" size="size-3" />
                <h3 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">You Might Also Like</h3>
              </div>
              <div className="flex gap-3">
                <button className="size-12 flex items-center justify-center rounded-2xl border border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-base)] transition-colors">
                  <ArrowLeft size={24} />
                </button>
                <button className="size-12 flex items-center justify-center rounded-2xl border border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-base)] transition-colors">
                  <ArrowRight size={24} />
                </button>
              </div>
            </div>

            {relatedEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {relatedEvents.map((evt) => {
                  const evtDate = parseDate(evt.startDate);
                  return (
                    <GlowingBorder key={evt.id} className="h-full">
                      <div
                        onClick={() => navigate(`/events/${evt.id}`)}
                        className="group rounded-4xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border-primary)] hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col"
                      >
                        <div className="aspect-4/3 bg-[var(--bg-surface)] relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
                          <div className="absolute top-4 right-4 bg-[var(--bg-card)] px-4 py-2 rounded-xl text-xs font-black text-[var(--color-primary)] shadow-lg z-20 border border-[var(--border-primary)]">
                            {evtDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          {evt.coverImage ? (
                            <img src={evt.coverImage} alt={evt.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[var(--bg-surface)] text-[var(--text-muted)]">
                              <ImageIcon size={48} />
                            </div>
                          )}
                        </div>
                        <div className="p-6 flex flex-col grow">
                          <h4 className="text-[var(--text-primary)] font-bold truncate text-lg group-hover:text-[var(--color-primary)] transition-colors">{evt.title}</h4>
                          <p className="text-[var(--text-secondary)] text-sm mt-2 flex items-center gap-1.5 truncate">
                            <MapPin size={14} /> {evt.venue?.city || 'Online'}
                          </p>
                          <div className="mt-auto pt-6 flex items-center justify-between border-t border-[var(--border-primary)]">
                            <span className="text-[var(--color-primary)] font-black text-xl">
                              {evt.ticketTiers && evt.ticketTiers.length > 0
                                ? formatCurrency(Math.min(...evt.ticketTiers.map(t => t.price)))
                                : 'Free'}
                            </span>
                            <span className="text-[10px] font-bold text-[var(--text-secondary)] bg-[var(--bg-surface)] px-3 py-1.5 rounded-full uppercase tracking-wide border border-[var(--border-primary)] group-hover:border-[var(--color-primary)] transition-colors">
                              {evt.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </GlowingBorder>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-[var(--bg-card)] rounded-4xl border border-[var(--border-primary)]">
                <p className="text-[var(--text-secondary)]">No similar events found at the moment.</p>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Floating Sticky Book Now CTA */}
      <AnimatePresence>
        {showFloatingCTA && selectedTierId && (
          <motion.button
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={handleBook}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-8 py-4 bg-[var(--color-primary)] text-white font-black text-lg rounded-2xl shadow-2xl hover:shadow-[var(--shadow-glow)] transition-all hover:scale-105 active:scale-95 animate-pulse"
          >
            <Ticket size={22} />
            Book Now — {formatCurrency(finalTotal)}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}