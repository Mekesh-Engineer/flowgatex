import { Smartphone, BarChart3, ShieldCheck, Globe2, Users2, Zap, Search, Ticket, QrCode, PartyPopper } from 'lucide-react';

export const FEATURES_GRID = [
  {
    title: "Smart Access Control",
    description: "Lightning-fast entry with IoT-enabled QR scanners and NFC support. Eliminate queues and fraud with real-time validation.",
    icon: Smartphone,
    color: "var(--color-primary)",
    gradient: "from-[var(--color-primary)] to-[#60a5fa]"
  },
  {
    title: "Real-Time Analytics",
    description: "Track attendance, revenue, and engagement live. visual dashboards give you the insights needed to optimize on the fly.",
    icon: BarChart3,
    color: "var(--color-secondary)",
    gradient: "from-[var(--color-secondary)] to-[#bef264]"
  },
  {
    title: "Bank-Grade Security",
    description: "Encrypted payments and data protection. We ensure every transaction and ticket is secure against counterfeiting.",
    icon: ShieldCheck,
    color: "var(--color-warning)",
    gradient: "from-[var(--color-warning)] to-[#fbbf24]"
  },
  {
    title: "Global Scalability",
    description: "Host events anywhere. Our platform supports multi-currency payments, timezones, and localized ticketing formats.",
    icon: Globe2,
    color: "#8b5cf6",
    gradient: "from-[#8b5cf6] to-[#a78bfa]"
  },
  {
    title: "Community Building",
    description: "Turn attendees into fans. Integrated social features allow users to follow organizers, share events, and build networks.",
    icon: Users2,
    color: "#ec4899",
    gradient: "from-[#ec4899] to-[#f472b6]"
  },
  {
    title: "Instant Deployments",
    description: "Launch your event page in minutes. Our intuitive tools let you customize branding and ticketing tiers without coding.",
    icon: Zap,
    color: "#06b6d4",
    gradient: "from-[#06b6d4] to-[#67e8f9]"
  }
];

export const TRIP_STEPS = [
  {
    title: "Discover",
    description: "Browse thousands of events or search by category, location, and date to find your vibe.",
    icon: Search,
    bg: "bg-[#00A3DB]/10",
    border: "border-[#00A3DB]/20",
    color: "text-[#00A3DB]"
  },
  {
    title: "Book Securely",
    description: "Select your tickets and pay instantly with our encrypted, fraud-proof payment gateway.",
    icon: Ticket,
    bg: "bg-[#A3D639]/10",
    border: "border-[#A3D639]/20",
    color: "text-[#A3D639]"
  },
  {
    title: "Get Tickets",
    description: "Receive your unique QR code instantly via email and in your personal dashboard.",
    icon: QrCode,
    bg: "bg-[#f59e0b]/10",
    border: "border-[#f59e0b]/20",
    color: "text-[#f59e0b]"
  },
  {
    title: "Enjoy Event",
    description: "Scan your QR code at the venue for seamless entry and enjoy the experience!",
    icon: PartyPopper,
    bg: "bg-[#8b5cf6]/10",
    border: "border-[#8b5cf6]/20",
    color: "text-[#8b5cf6]"
  }
];

export interface ReviewData {
  id: number;
  title: string;
  description: string;
  rating: number;
  reviewerName: string;
  reviewerContext: string;
  imageSrc: string;
  avatar: string;
}

export const REVIEWS: ReviewData[] = [
  {
    id: 1,
    title: 'Seamless entry with QR codes!',
    description: 'The IoT-powered access control made entering the venue a breeze. No more waiting in long queues. Highly recommended for all event organizers looking to modernize!',
    rating: 5,
    reviewerName: 'Sarah Chen',
    reviewerContext: 'Tech Summit 2025',
    imageSrc: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 2,
    title: 'Best event management platform',
    description: 'As an organizer, FlowGateX gave me real-time insights into crowd flow and ticket sales. The analytics dashboard is incredibly powerful and easy to use.',
    rating: 5,
    reviewerName: 'Michael Rodriguez',
    reviewerContext: 'Summer Music Fest',
    imageSrc: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 3,
    title: 'Revolutionary crowd monitoring',
    description: 'The heatmaps and capacity alerts helped us manage safety protocols effectively. FlowGateX is a game-changer for large-scale arena events.',
    rating: 4,
    reviewerName: 'Emily Watson',
    reviewerContext: 'Arena Plus Manager',
    imageSrc: 'https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 4,
    title: 'Smooth payment integration',
    description: 'Setting up Razorpay and Stripe was incredibly easy. Our attendees loved the multiple payment options available at checkout. Zero transaction failures.',
    rating: 5,
    reviewerName: 'David Kim',
    reviewerContext: 'Global FinTech Conf',
    imageSrc: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
  },
];