import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  Ticket, Search, Heart, Headphones, PlusCircle,
  LayoutDashboard, BarChart3, CreditCard, FileText,
  BookOpen, Code2, Puzzle, Info, Briefcase, Mail,
  Newspaper, Facebook, Instagram,
  Twitter, Youtube, Linkedin, ArrowUp, Phone,
  Clock, Globe,
  ExternalLink
} from 'lucide-react';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface FooterLink {
  label: string;
  href: string;
  icon?: React.ElementType;
  isExternal?: boolean;
  scrollTo?: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  icon: React.ElementType;
  href: string;
  label: string;
  hoverColor: string;
}

// =============================================================================
// DATA
// =============================================================================

const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: 'For Attendees',
    links: [
      { label: 'Browse Events', href: '/events', icon: Search },
      { label: 'My Tickets', href: '/tickets', icon: Ticket },
      { label: 'Saved Events', href: '/favorites', icon: Heart },
      { label: 'Get Help', href: '/support', icon: Headphones },
    ],
  },
  {
    title: 'For Organizers',
    links: [
      { label: 'Create Event', href: '/events/create', icon: PlusCircle },
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Analytics', href: '/analytics', icon: BarChart3 },
      { label: 'Pricing', href: '/pricing', icon: CreditCard },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Blog', href: '/blog', icon: FileText },
      { label: 'Guides', href: '/guides', icon: BookOpen },
      { label: 'API Docs', href: '/docs/api', icon: Code2, isExternal: true },
      { label: 'Integrations', href: '/integrations', icon: Puzzle },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about', icon: Info },
      { label: 'Careers', href: '/careers', icon: Briefcase },
      { label: 'Contact', href: '/contact', icon: Mail },
      { label: 'Press Kit', href: '/press', icon: Newspaper },
    ],
  },
];

const SOCIAL_LINKS: SocialLink[] = [
  { icon: Facebook, href: 'https://facebook.com', label: 'Facebook', hoverColor: 'hover:bg-[#1877F2] hover:border-[#1877F2]' },
  { icon: Instagram, href: 'https://instagram.com', label: 'Instagram', hoverColor: 'hover:bg-gradient-to-br hover:from-[#833AB4] hover:via-[#FD1D1D] hover:to-[#F77737] hover:border-transparent' },
  { icon: Twitter, href: 'https://twitter.com', label: 'Twitter', hoverColor: 'hover:bg-[#1DA1F2] hover:border-[#1DA1F2]' },
  { icon: Youtube, href: 'https://youtube.com', label: 'YouTube', hoverColor: 'hover:bg-[#FF0000] hover:border-[#FF0000]' },
  { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn', hoverColor: 'hover:bg-[#0A66C2] hover:border-[#0A66C2]' },
];

const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Cookie Settings', href: '/cookies' },
  { label: 'Accessibility', href: '/accessibility' },
];

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const }
  }
};

const linkHoverVariants = {
  hover: {
    x: 4,
    transition: { duration: 0.2 }
  }
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

const ScrollToTopButton: React.FC = () => {
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <motion.button
      onClick={scrollToTop}
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-8 right-8 z-40 p-3 rounded-xl bg-gradient-to-r from-[#00A3DB] to-[#007AA3] text-white shadow-lg shadow-[#00A3DB]/30 hover:shadow-xl transition-all"
      aria-label="Scroll to top"
    >
      <ArrowUp size={20} />
    </motion.button>
  );
};

interface FooterLinkItemProps {
  link: FooterLink;
  onNavigate?: () => void;
}

const FooterLinkItem: React.FC<FooterLinkItemProps> = ({ link, onNavigate }) => {
  const handleClick = (e: React.MouseEvent) => {
    if (link.scrollTo) {
      e.preventDefault();
      const element = document.getElementById(link.scrollTo);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    onNavigate?.();
  };

  const content = (
    <motion.span
      variants={linkHoverVariants}
      whileHover="hover"
      className="group flex items-center gap-2.5 text-sm text-[var(--text-secondary)] hover:text-[#00A3DB] transition-colors cursor-pointer"
    >
      {link.icon && (
        <link.icon
          size={16}
          className="text-[var(--text-muted)] group-hover:text-[#00A3DB] transition-colors flex-shrink-0"
        />
      )}
      <span>{link.label}</span>
      {link.isExternal && (
        <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </motion.span>
  );

  if (link.isExternal) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
      >
        {content}
      </a>
    );
  }

  return (
    <Link to={link.href} onClick={handleClick}>
      {content}
    </Link>
  );
};

// =============================================================================
// MAIN FOOTER COMPONENT
// =============================================================================

export function Footer() {
  const currentYear = new Date().getFullYear();
  const footerRef = useRef<HTMLElement>(null);
  const isInView = useInView(footerRef, { once: true, margin: "-100px" });

  return (
    <>
      <motion.footer
        ref={footerRef}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={containerVariants}
        className="relative bg-[var(--bg-secondary)] pt-20 pb-8 border-t border-[var(--border-primary)] mt-auto overflow-hidden"
        role="contentinfo"
        aria-label="Site footer"
      >
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#00A3DB]/5 blur-[150px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#A3D639]/5 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none" />

        {/* Subtle Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, var(--text-muted) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* Main Footer Content */}
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-6 lg:gap-8 mb-16">

            {/* Brand Column */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <Link to="/" className="mb-6 inline-block group">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#00A3DB] to-[#A3D639] rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-300" />
                    <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-[#00A3DB] via-[#0091c4] to-[#A3D639] flex items-center justify-center shadow-lg shadow-[#00A3DB]/25 group-hover:scale-105 transition-transform">
                      <span
                        className="material-symbols-outlined text-[24px] text-white font-semibold"
                        style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" }}
                      >
                        stream
                      </span>
                    </div>
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-[#00A3DB] to-[#A3D639] bg-clip-text text-transparent">
                    FlowGateX
                  </span>
                </div>
              </Link>

              <p className="text-sm text-[var(--text-muted)] mb-6 max-w-xs leading-relaxed">
                Next-generation event management platform with IoT-powered access control and real-time analytics. Experience the future of events.
              </p>

              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                <a
                  href="mailto:hello@flowgatex.com"
                  className="flex items-center gap-3 text-sm text-[var(--text-secondary)] hover:text-[#00A3DB] transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-[var(--bg-hover)] group-hover:bg-[#00A3DB]/10 transition-colors">
                    <Mail size={16} className="text-[#00A3DB]" />
                  </div>
                  mekesh.engineer@gmail.com
                </a>
                <a
                  href="tel:+9182208170"
                  className="flex items-center gap-3 text-sm text-[var(--text-secondary)] hover:text-[#00A3DB] transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-[var(--bg-hover)] group-hover:bg-[#00A3DB]/10 transition-colors">
                    <Phone size={16} className="text-[#A3D639]" />
                  </div>
                  +91 8220810170
                </a>
                <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                  <div className="p-2 rounded-lg bg-[var(--bg-hover)]">
                    <Clock size={16} className="text-[#f59e0b]" />
                  </div>
                  24/7 Support Available
                </div>
              </div>

              {/* Social Icons */}
              <div className="flex gap-2">
                {SOCIAL_LINKS.map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-10 h-10 rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-secondary)] ${social.hoverColor} hover:text-white transition-all duration-300`}
                    aria-label={social.label}
                  >
                    <social.icon size={18} />
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Navigation Columns */}
            {FOOTER_SECTIONS.map((section) => (
              <motion.div
                key={section.title}
                variants={itemVariants}
                className="lg:col-span-1"
              >
                <h4 className="font-bold text-[var(--text-primary)] mb-5 relative inline-block">
                  {section.title}
                  <span className="absolute -bottom-1.5 left-0 w-8 h-0.5 bg-gradient-to-r from-[#00A3DB] to-transparent rounded-full" />
                </h4>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <FooterLinkItem link={link} />
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>



          {/* Bottom Bar */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col lg:flex-row justify-between items-center gap-6"
          >
            {/* Copyright */}
            <p className="text-xs text-[var(--text-muted)] text-center lg:text-left flex items-center gap-1 flex-wrap justify-center">
              © {currentYear} FlowGateX. All rights reserved. Made with
              <Heart size={12} className="text-[#ef4444] animate-pulse mx-1" fill="currentColor" />
              for event lovers.
            </p>

            {/* Legal Links */}
            <nav
              className="flex flex-wrap justify-center gap-4 lg:gap-6"
              aria-label="Legal navigation"
            >
              {LEGAL_LINKS.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-xs font-medium text-[var(--text-secondary)] hover:text-[#00A3DB] transition-colors hover:underline underline-offset-4"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Language/Region Selector */}
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <Globe size={14} />
              <select
                className="bg-transparent border-none text-xs text-[var(--text-secondary)] cursor-pointer focus:outline-none"
                defaultValue="en"
                aria-label="Select language"
              >
                <option value="en">English (US)</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </motion.div>
        </div>
      </motion.footer>

      {/* Scroll to Top Button */}
      <ScrollToTopButton />
    </>
  );
}

export default Footer;