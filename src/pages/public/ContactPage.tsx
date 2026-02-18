import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Mail, Phone, MapPin, Send, HelpCircle, Wrench, FileText,
  ChevronDown, User, Building2, Shield, Calendar,
  MessageCircle, Mic, MicOff, Check, AlertCircle, Loader2,
  Sparkles, Award, Clock, Headphones, Video, ExternalLink,
  Copy, CheckCircle, Zap, Settings, Users, Music
} from 'lucide-react';
import { GridCanvas, ParticleCanvas } from '@/features/home/components/canvas/CanvasEffects';
import { FloatingElement } from '@/features/home/components/ui/SharedComponents';

// =============================================================================
// TYPES
// =============================================================================

type ContactRole = 'attendee' | 'organizer' | 'admin';
type InquiryType = 'general' | 'technical' | 'media' | 'partnership' | 'billing';
type FormStatus = 'idle' | 'validating' | 'submitting' | 'success' | 'error';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'select' | 'textarea';
  placeholder: string;
  required: boolean;
  options?: { value: string; label: string }[];
  roleVisible?: ContactRole[];
  ariaLabel: string;
}

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

interface ChannelOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  href: string;
  description: string;
}

interface SupportOption {
  id: InquiryType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  estimatedResponse: string;
}

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const accordionContent = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { height: 'auto', opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
};

const successPulse = {
  initial: { scale: 0 },
  animate: { scale: [0, 1.2, 1], transition: { duration: 0.5, times: [0, 0.6, 1] } },
};

// =============================================================================
// DATA
// =============================================================================

const ROLES: { id: ContactRole; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'attendee', label: 'Attendee', icon: <User size={18} />, description: 'Event queries & ticketing' },
  { id: 'organizer', label: 'Organizer', icon: <Building2 size={18} />, description: 'Partnerships & logistics' },
  { id: 'admin', label: 'Admin', icon: <Shield size={18} />, description: 'Technical & system issues' },
];

const INQUIRY_TYPES: SupportOption[] = [
  { id: 'general', title: 'General Inquiry', description: 'Questions about events, features, or company', icon: <HelpCircle size={22} />, color: 'from-blue-500 to-cyan-500', estimatedResponse: '< 24 hours' },
  { id: 'technical', title: 'Technical Support', description: 'Platform issues, bugs, or account problems', icon: <Wrench size={22} />, color: 'from-orange-500 to-amber-500', estimatedResponse: '< 4 hours' },
  { id: 'media', title: 'Media & Press', description: 'Brand assets, interviews, press releases', icon: <FileText size={22} />, color: 'from-purple-500 to-pink-500', estimatedResponse: '< 48 hours' },
  { id: 'partnership', title: 'Partnership', description: 'Sponsorships, collaborations, integrations', icon: <Users size={22} />, color: 'from-emerald-500 to-teal-500', estimatedResponse: '< 72 hours' },
  { id: 'billing', title: 'Billing & Payments', description: 'Invoices, refunds, subscription queries', icon: <Settings size={22} />, color: 'from-rose-500 to-red-500', estimatedResponse: '< 12 hours' },
];

const CHANNELS: ChannelOption[] = [
  { id: 'whatsapp', name: 'WhatsApp', icon: <MessageCircle size={20} />, color: 'bg-green-500 hover:bg-green-600', href: 'https://wa.me/15550000000', description: 'Chat instantly' },
  { id: 'telegram', name: 'Telegram', icon: <Send size={20} />, color: 'bg-sky-500 hover:bg-sky-600', href: 'https://t.me/flowgatex', description: 'Join our channel' },
  { id: 'schedule', name: 'Schedule Call', icon: <Calendar size={20} />, color: 'bg-violet-500 hover:bg-violet-600', href: '#schedule', description: 'Book a meeting' },
  { id: 'video', name: 'Video Chat', icon: <Video size={20} />, color: 'bg-rose-500 hover:bg-rose-600', href: '#video', description: 'Face-to-face' },
];

const FAQ_DATA: FAQItem[] = [
  { question: 'How do I create my first event?', answer: 'Navigate to the Organizer Dashboard, click "Create Event", and follow the step-by-step wizard. You can set up ticketing, venue details, and promotional materials in under 10 minutes.', category: 'Getting Started' },
  { question: 'What payment methods are supported?', answer: 'We support Visa, Mastercard, American Express, PayPal, Apple Pay, Google Pay, and cryptocurrency (BTC, ETH). Bank transfers are available for enterprise accounts.', category: 'Payments' },
  { question: 'How do refunds work?', answer: 'Refund policies are set by event organizers. Standard events allow full refunds up to 48 hours before the event. Check each event\'s specific policy on its details page.', category: 'Payments' },
  { question: 'Can I transfer my ticket to someone else?', answer: 'Yes! Go to your Ticket Wallet, select the ticket, and click "Transfer". Enter the recipient\'s email, and they\'ll receive the ticket instantly with a new QR code.', category: 'Tickets' },
  { question: 'Is my data secure on FlowGateX?', answer: 'Absolutely. We use bank-level AES-256 encryption, SOC 2 Type II compliance, and blockchain verification for all tickets. Your data never leaves our secure infrastructure.', category: 'Security' },
  { question: 'How do I become a verified organizer?', answer: 'Apply through the Organizer Portal with your business documentation. Verification takes 2-3 business days and unlocks premium features, lower fees, and priority support.', category: 'Organizers' },
];

const SUBJECT_SUGGESTIONS: Record<InquiryType, string[]> = {
  general: ['Question about upcoming events', 'Feature request', 'Account inquiry', 'Feedback on the platform'],
  technical: ['Login issues', 'Payment error', 'Ticket not showing', 'App crash report', 'API integration help'],
  media: ['Press interview request', 'Brand assets download', 'Partnership announcement', 'Event coverage'],
  partnership: ['Sponsorship inquiry', 'White-label solution', 'API partnership', 'Affiliate program'],
  billing: ['Refund request', 'Invoice inquiry', 'Subscription change', 'Payment method update'],
};

// Form fields with role-based visibility
const FORM_FIELDS: FormField[] = [
  { id: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe', required: true, ariaLabel: 'Enter your full name' },
  { id: 'email', label: 'Email Address', type: 'email', placeholder: 'john@example.com', required: true, ariaLabel: 'Enter your email address' },
  { id: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+1 (555) 000-0000', required: false, ariaLabel: 'Enter your phone number (optional)' },
  { id: 'company', label: 'Company / Organization', type: 'text', placeholder: 'Acme Events Inc.', required: true, roleVisible: ['organizer', 'admin'], ariaLabel: 'Enter your company name' },
  {
    id: 'budget', label: 'Estimated Budget', type: 'select', placeholder: 'Select range', required: false, roleVisible: ['organizer'], options: [
      { value: '', label: 'Select budget range' },
      { value: '<5k', label: 'Under $5,000' },
      { value: '5k-25k', label: '$5,000 - $25,000' },
      { value: '25k-100k', label: '$25,000 - $100,000' },
      { value: '>100k', label: 'Over $100,000' },
    ], ariaLabel: 'Select your estimated budget range'
  },
  {
    id: 'priority', label: 'Priority Level', type: 'select', placeholder: 'Select priority', required: true, roleVisible: ['admin'], options: [
      { value: '', label: 'Select priority' },
      { value: 'low', label: 'Low - General question' },
      { value: 'medium', label: 'Medium - Needs attention' },
      { value: 'high', label: 'High - Urgent issue' },
      { value: 'critical', label: 'Critical - System down' },
    ], ariaLabel: 'Select issue priority level'
  },
  { id: 'eventId', label: 'Event ID (if applicable)', type: 'text', placeholder: 'EVT-XXXXX', required: false, ariaLabel: 'Enter event ID if your inquiry is about a specific event' },
  { id: 'subject', label: 'Subject', type: 'text', placeholder: 'How can we help?', required: true, ariaLabel: 'Enter the subject of your message' },
  { id: 'message', label: 'Message', type: 'textarea', placeholder: 'Describe your inquiry in detail...', required: true, ariaLabel: 'Enter your message' },
];

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/** Simulated auth hook - in production, this would connect to your auth system */
const useAuth = () => {
  // Mock user data - replace with actual auth context
  const [user] = useState<{ name?: string; email?: string; role?: ContactRole } | null>(null);
  return { user, isLoggedIn: !!user };
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/** Animated section wrapper */
const AnimatedSection: React.FC<{
  children: React.ReactNode;
  className?: string;
  id?: string;
}> = ({ children, className = '', id }) => {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
      role="region"
    >
      {children}
    </motion.section>
  );
};

/** Tooltip component */
const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} onFocus={() => setShow(true)} onBlur={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg shadow-xl text-xs font-medium text-[var(--text-primary)] whitespace-nowrap pointer-events-none"
          >
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[var(--bg-card)]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/** Live support indicator */
const LiveSupportIndicator: React.FC = () => {
  const [isOnline] = useState(true); // In production, check actual support status

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-full text-xs font-medium">
      <span className={`size-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
      <span className="text-[var(--text-secondary)]">
        {isOnline ? 'Support Online' : 'Support Offline'}
      </span>
      {isOnline && <span className="text-[var(--text-muted)]">• Avg. 2 min response</span>}
    </div>
  );
};

/** FAQ Accordion Item */
const FAQAccordionItem: React.FC<{
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}> = ({ item, isOpen, onToggle, index }) => (
  <motion.div
    variants={fadeUp}
    custom={index}
    className="border border-[var(--border-primary)] rounded-xl overflow-hidden transition-colors hover:border-[var(--color-primary)]/30"
  >
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-inset"
      aria-expanded={isOpen}
      aria-controls={`faq-answer-${index}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded">
          {item.category}
        </span>
        <h4 className="text-[var(--text-primary)] font-semibold text-sm md:text-base">{item.question}</h4>
      </div>
      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
        <ChevronDown size={18} className="text-[var(--text-muted)]" />
      </motion.div>
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id={`faq-answer-${index}`}
          variants={accordionContent}
          initial="collapsed"
          animate="expanded"
          exit="collapsed"
          className="overflow-hidden"
        >
          <p className="px-5 pb-5 text-[var(--text-secondary)] text-sm leading-relaxed">{item.answer}</p>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

/** Form field validation */
const validateField = (id: string, value: string): string | null => {
  if (!value.trim()) return 'This field is required';
  if (id === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email';
  if (id === 'phone' && value && !/^\+?[\d\s\-()]{7,}$/.test(value)) return 'Please enter a valid phone number';
  return null;
};

/** Form input component with validation */
const FormInput: React.FC<{
  field: FormField;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  disabled?: boolean;
}> = ({ field, value, onChange, error, disabled }) => {
  const [touched, setTouched] = useState(false);
  const showError = touched && error;

  const baseClasses = `w-full bg-[var(--bg-base)] border rounded-xl px-4 py-3.5 text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg-card)] ${showError
    ? 'border-red-500 focus-visible:ring-red-500/50'
    : 'border-[var(--border-primary)] focus:border-[var(--color-primary)] focus-visible:ring-[var(--color-primary)]/50'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={field.id} className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)]">
        {field.label}
        {field.required && <span className="text-red-500">*</span>}
      </label>

      {field.type === 'textarea' ? (
        <textarea
          id={field.id}
          rows={5}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={field.placeholder}
          disabled={disabled}
          aria-label={field.ariaLabel}
          aria-invalid={!!showError}
          aria-describedby={showError ? `${field.id}-error` : undefined}
          className={`${baseClasses} resize-none`}
        />
      ) : field.type === 'select' ? (
        <select
          id={field.id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          disabled={disabled}
          aria-label={field.ariaLabel}
          aria-invalid={!!showError}
          className={baseClasses}
        >
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input
          id={field.id}
          type={field.type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={field.placeholder}
          disabled={disabled}
          aria-label={field.ariaLabel}
          aria-invalid={!!showError}
          aria-describedby={showError ? `${field.id}-error` : undefined}
          className={baseClasses}
        />
      )}

      <AnimatePresence>
        {showError && (
          <motion.p
            id={`${field.id}-error`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-1 text-xs text-red-500 font-medium"
            role="alert"
          >
            <AlertCircle size={12} /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ContactPage() {
  // Auth
  const { user, isLoggedIn } = useAuth();

  // State
  const [selectedRole, setSelectedRole] = useState<ContactRole>('attendee');
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryType>('general');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [formStatus, setFormStatus] = useState<FormStatus>('idle');
  const [formErrors, setFormErrors] = useState<Record<string, string | null>>({});
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  // Pre-fill form with user data if logged in
  useEffect(() => {
    if (isLoggedIn && user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
      }));
      if (user.role) setSelectedRole(user.role);
    }
  }, [isLoggedIn, user]);

  // Filtered fields based on role
  const visibleFields = useMemo(() => {
    return FORM_FIELDS.filter((f) => !f.roleVisible || f.roleVisible.includes(selectedRole));
  }, [selectedRole]);

  // Subject suggestions based on inquiry type
  const suggestions = useMemo(() => SUBJECT_SUGGESTIONS[selectedInquiry] || [], [selectedInquiry]);

  // Handlers
  const handleFieldChange = useCallback((id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
    // Clear error when user types
    if (formErrors[id]) {
      setFormErrors((prev) => ({ ...prev, [id]: null }));
    }
  }, [formErrors]);

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string | null> = {};
    let valid = true;

    visibleFields.forEach((field) => {
      if (field.required) {
        const error = validateField(field.id, formData[field.id] || '');
        if (error) {
          errors[field.id] = error;
          valid = false;
        }
      }
    });

    setFormErrors(errors);
    return valid;
  }, [visibleFields, formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('validating');

    if (!validateForm()) {
      setFormStatus('idle');
      return;
    }

    setFormStatus('submitting');

    // Simulated API call
    await new Promise((resolve) => setTimeout(resolve, 1800));

    // Simulate success (in production, handle actual API response)
    setFormStatus('success');
    setShowBadge(true);

    // Reset after 4 seconds
    setTimeout(() => {
      setFormStatus('idle');
      setFormData({});
      setShowBadge(false);
    }, 4000);
  }, [validateForm]);

  // Voice-to-text simulation
  const toggleVoice = useCallback(() => {
    if (!isVoiceActive) {
      setIsVoiceActive(true);
      // Simulated voice input after 2 seconds
      setTimeout(() => {
        setFormData((prev) => ({
          ...prev,
          message: (prev.message || '') + ' [Voice input: Hi, I need help with my ticket purchase...]',
        }));
        setIsVoiceActive(false);
      }, 2500);
    } else {
      setIsVoiceActive(false);
    }
  }, [isVoiceActive]);

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText('hello@flowgatex.io');
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      // Fallback - do nothing
    }
  }, []);

  // Keyboard navigation for FAQ
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape') setOpenFAQ(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-[var(--color-primary)] selection:text-white transition-colors duration-300"
      role="main"
      aria-label="Contact FlowGateX"
    >
      {/* ═══════════════════════════════════════════════════════════════════════
          1. HERO SECTION
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28 px-4 sm:px-6 lg:px-8 text-center overflow-hidden bg-gradient-to-br from-[var(--bg-surface)] via-[var(--bg-primary)] to-[var(--bg-surface)]">
        {/* Background effects */}
        <GridCanvas className="opacity-30 pointer-events-none" />
        <ParticleCanvas particleCount={40} className="pointer-events-none" />

        <FloatingElement className="absolute top-10 left-10 hidden lg:block opacity-50 pointer-events-none" delay={0}>
          <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-sm rotate-12">
            <Music className="text-[var(--color-primary)]" size={20} />
          </div>
        </FloatingElement>
        <FloatingElement className="absolute top-20 right-20 hidden lg:block opacity-50 pointer-events-none" delay={0.5}>
          <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-sm -rotate-6">
            <Sparkles className="text-[var(--color-secondary)]" size={20} />
          </div>
        </FloatingElement>

        <motion.div initial="hidden" animate="visible" className="relative z-10 max-w-4xl mx-auto">
          <motion.div variants={fadeUp} custom={0} className="mb-6">
            <LiveSupportIndicator />
          </motion.div>

          <motion.span
            variants={fadeUp}
            custom={1}
            className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs font-bold uppercase tracking-widest"
          >
            <Sparkles size={14} /> Connect With Us
          </motion.span>

          <motion.h1
            variants={fadeUp}
            custom={2}
            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-[var(--text-primary)] mb-6"
          >
            Get in{' '}
            <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] bg-clip-text text-transparent">
              Touch
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={3} className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            Multi-channel support designed for the modern event ecosystem. Choose how you want to connect with our team.
          </motion.p>

          {/* Quick contact channels */}
          <motion.div variants={fadeUp} custom={4} className="flex flex-wrap justify-center gap-3 mt-10">
            {CHANNELS.map((ch) => (
              <Tooltip key={ch.id} text={ch.description}>
                <a
                  href={ch.href}
                  className={`${ch.color} text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all hover:scale-105 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white`}
                  aria-label={`Contact via ${ch.name}: ${ch.description}`}
                >
                  {ch.icon} {ch.name}
                </a>
              </Tooltip>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          2. MAIN CONTACT GRID — Left: Info, Right: Form
          ═══════════════════════════════════════════════════════════════════════ */}
      <AnimatedSection className="py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-[var(--bg-primary)] relative overflow-hidden transition-colors duration-300" id="contact-form">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative z-10">

          {/* Left Column — Contact Info & Support Options */}
          <motion.div variants={fadeUp} custom={0} className="lg:col-span-5 space-y-8">
            {/* Contact Info Card */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Direct Contact</h2>
              <p className="text-[var(--text-secondary)] text-sm mb-8">Reach us through official channels or visit HQ.</p>

              <div className="space-y-6">
                {/* Email */}
                <div className="flex items-start gap-4 group">
                  <div className="size-12 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-cyan-500 flex items-center justify-center text-white shadow-md">
                    <Mail size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-0.5">Email</p>
                    <div className="flex items-center gap-2">
                      <a href="mailto:hello@flowgatex.io" className="text-[var(--text-primary)] font-semibold hover:text-[var(--color-primary)] transition-colors">
                        hello@flowgatex.io
                      </a>
                      <button
                        onClick={copyEmail}
                        aria-label="Copy email address"
                        className="text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors"
                      >
                        {copiedEmail ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4 group">
                  <div className="size-12 rounded-xl bg-gradient-to-br from-[var(--color-secondary)] to-emerald-500 flex items-center justify-center text-white shadow-md">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-0.5">Phone</p>
                    <a href="tel:+15550004283" className="text-[var(--text-primary)] font-semibold hover:text-[var(--color-primary)] transition-colors">
                      +1 (555) 000-GATE
                    </a>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-4 group">
                  <div className="size-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white shadow-md">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-0.5">Headquarters</p>
                    <p className="text-[var(--text-primary)] font-semibold">101 Future Way, Neo-Tech City</p>
                    <a href="https://www.openstreetmap.org/search?query=101%20Future%20Way%2C%20Neo-Tech%20City" target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--color-primary)] font-medium flex items-center gap-1 mt-1 hover:underline">
                      Get Directions <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Inquiry Type Selector */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <Headphones size={18} /> Select Inquiry Type
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {INQUIRY_TYPES.map((type) => (
                  <Tooltip key={type.id} text={type.estimatedResponse}>
                    <button
                      onClick={() => setSelectedInquiry(type.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${selectedInquiry === type.id
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                        : 'border-[var(--border-primary)] hover:border-[var(--color-primary)]/50'
                        }`}
                      aria-pressed={selectedInquiry === type.id}
                      aria-label={`${type.title}: ${type.description}`}
                    >
                      <div className={`size-10 rounded-lg bg-gradient-to-br ${type.color} flex items-center justify-center text-white`}>
                        {type.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{type.title}</p>
                        <p className="text-[11px] text-[var(--text-muted)] truncate">{type.description}</p>
                      </div>
                      {selectedInquiry === type.id && <Check size={16} className="text-[var(--color-primary)]" />}
                    </button>
                  </Tooltip>
                ))}
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-4 flex items-center gap-1">
                <Clock size={10} /> Hover for estimated response time
              </p>
            </div>
          </motion.div>

          {/* Right Column — Dynamic Form */}
          <motion.div variants={fadeUp} custom={1} className="lg:col-span-7">
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-8 shadow-sm relative overflow-hidden">
              {/* Success overlay */}
              <AnimatePresence>
                {formStatus === 'success' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 bg-[var(--bg-card)] flex flex-col items-center justify-center p-8"
                  >
                    <motion.div variants={successPulse} initial="initial" animate="animate">
                      <div className="size-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white shadow-xl mb-6">
                        <Check size={40} strokeWidth={3} />
                      </div>
                    </motion.div>
                    <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Message Sent!</h3>
                    <p className="text-[var(--text-secondary)] text-center mb-4">
                      We've received your inquiry and will respond within{' '}
                      <span className="font-semibold text-[var(--color-primary)]">
                        {INQUIRY_TYPES.find((t) => t.id === selectedInquiry)?.estimatedResponse}
                      </span>.
                    </p>
                    {showBadge && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-600"
                      >
                        <Award size={16} />
                        <span className="text-sm font-bold">First Inquiry Badge Earned!</span>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)]">Send a Message</h2>
                  <p className="text-sm text-[var(--text-secondary)]">Fields adapt based on your role</p>
                </div>
              </div>

              {/* Role selector tabs */}
              <div className="flex flex-wrap gap-2 mb-8 p-1 bg-[var(--bg-surface)] rounded-xl" role="tablist" aria-label="Select your role">
                {ROLES.map((role) => (
                  <button
                    key={role.id}
                    role="tab"
                    aria-selected={selectedRole === role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${selectedRole === role.id
                      ? 'bg-[var(--bg-card)] text-[var(--color-primary)] shadow-md'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                  >
                    {role.icon} {role.label}
                  </button>
                ))}
              </div>

              {/* Form */}
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {visibleFields.filter((f) => f.id !== 'message' && f.id !== 'subject').map((field) => (
                    <div key={field.id} className={field.id === 'eventId' ? 'md:col-span-2' : ''}>
                      <FormInput
                        field={field}
                        value={formData[field.id] || ''}
                        onChange={(val) => handleFieldChange(field.id, val)}
                        error={formErrors[field.id]}
                        disabled={formStatus === 'submitting'}
                      />
                    </div>
                  ))}
                </div>

                {/* Subject with AI suggestions */}
                <div className="space-y-2">
                  <FormInput
                    field={visibleFields.find((f) => f.id === 'subject')!}
                    value={formData.subject || ''}
                    onChange={(val) => handleFieldChange('subject', val)}
                    error={formErrors.subject}
                    disabled={formStatus === 'submitting'}
                  />
                  {suggestions.length > 0 && !formData.subject && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                        <Zap size={10} className="text-[var(--color-primary)]" /> AI Suggestions:
                      </span>
                      {suggestions.slice(0, 3).map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleFieldChange('subject', s)}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Message with voice input */}
                <div className="relative">
                  <FormInput
                    field={visibleFields.find((f) => f.id === 'message')!}
                    value={formData.message || ''}
                    onChange={(val) => handleFieldChange('message', val)}
                    error={formErrors.message}
                    disabled={formStatus === 'submitting'}
                  />
                  <Tooltip text={isVoiceActive ? 'Stop recording' : 'Voice-to-text input'}>
                    <button
                      type="button"
                      onClick={toggleVoice}
                      className={`absolute right-3 bottom-3 size-10 rounded-lg flex items-center justify-center transition-all ${isVoiceActive
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10'
                        }`}
                      aria-label={isVoiceActive ? 'Stop voice recording' : 'Start voice recording'}
                      aria-pressed={isVoiceActive}
                    >
                      {isVoiceActive ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                  </Tooltip>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={formStatus === 'submitting' || formStatus === 'success'}
                  className="w-full relative overflow-hidden bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-focus)] hover:from-[var(--color-primary-focus)] hover:to-[var(--color-primary)] text-white py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-[var(--shadow-primary)] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)] hover:-translate-y-0.5"
                >
                  {formStatus === 'submitting' ? (
                    <>
                      <Loader2 size={20} className="animate-spin" /> Sending...
                    </>
                  ) : (
                    <>
                      <Send size={20} /> Send Message
                    </>
                  )}
                </button>

                <p className="text-xs text-center text-[var(--text-muted)]">
                  By submitting, you agree to our{' '}
                  <a href="/privacy" className="text-[var(--color-primary)] hover:underline">Privacy Policy</a>.
                  Your data is encrypted and secure.
                </p>
              </form>
            </div>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ═══════════════════════════════════════════════════════════════════════
          3. FAQ ACCORDION
          ═══════════════════════════════════════════════════════════════════════ */}
      <AnimatedSection className="py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-[var(--bg-secondary)] border-t border-[var(--border-primary)] relative overflow-hidden transition-colors duration-300" id="faq">
        <div className="absolute top-0 right-0 -z-0 h-[400px] w-[400px] rounded-full bg-[var(--color-primary)] opacity-[0.03] blur-[100px] pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)] bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 mb-4">
              <HelpCircle size={12} /> FAQ
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] tracking-tight mb-4">Frequently Asked{' '}<span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]">Questions</span></h2>
            <p className="text-base md:text-lg text-[var(--text-secondary)] leading-relaxed">Quick answers to common queries. Can&apos;t find what you need? Use the form above.</p>
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="space-y-3">
            {FAQ_DATA.map((item, idx) => (
              <FAQAccordionItem
                key={idx}
                item={item}
                index={idx}
                isOpen={openFAQ === idx}
                onToggle={() => setOpenFAQ(openFAQ === idx ? null : idx)}
              />
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ═══════════════════════════════════════════════════════════════════════
          4. FLOATING ACTION BUTTON (FAB) — Quick Support
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <Tooltip text="Quick chat support">
          <button
            onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
            className="size-14 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-cyan-500 text-white shadow-2xl shadow-[var(--color-primary)]/40 flex items-center justify-center hover:scale-110 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)]"
            aria-label="Open contact form"
          >
            <MessageCircle size={24} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
