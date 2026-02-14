// --- Enums & Unions ---
export type EventFormat = 'single' | 'multi';
export type EventType = 'in-person' | 'virtual' | 'hybrid';
export type EventCategory = 'music' | 'tech' | 'business' | 'sports' | 'arts' | 'workshop' | 'other';
export type AgeRestriction = 'all' | '18+' | '21+';
export type TicketVisibility = 'public' | 'hidden';
export type DiscountType = 'percentage' | 'fixed';

/** Used by the EventFilters.tsx UI component for filter state. */
export interface EventFilters {
  search?: string;
  category?: string;
  city?: string;
  startDate?: string;
}

// --- Sub-Interfaces ---

export interface EventSocialLinks {
  website?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
}

export interface EventOrganizerInfo {
  name: string;
  logo?: string; // URL
  about?: string;
  email: string;
  socials: EventSocialLinks;
}

export interface EventSession {
  id: string;
  title: string;
  time: string; // e.g., "10:00 AM - 11:00 AM"
  date?: string; // ISO Date String (e.g., "2024-10-14")
  speaker: string;
  description?: string;
}

export interface PromoCode {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  usageLimit?: number; // Infinite if undefined
  validFrom?: string; // ISO Date
  validTo?: string; // ISO Date
  applicableTiers: string[]; // Array of TicketTier IDs
}

export interface TicketTier {
  id: string; // generated UUID
  name: string;
  price: number;
  quantity: number;
  sold: number;
  description?: string;
  benefits: string[];
  minPerOrder: number;
  maxPerOrder: number;
  salesStart?: string;
  salesEnd?: string;
  visibility: TicketVisibility;
}

// --- Main Interface ---

export interface CreateEventData {
  // Step 1: Basic Information
  title: string;
  subtitle: string;
  category: EventCategory;
  type: EventType;
  language: string[]; // e.g. ["English", "Hindi"]
  ageRestriction: AgeRestriction;

  // Step 2: Date & Time
  format: EventFormat;
  startDate: string; // ISO
  endDate: string;   // ISO
  timezone: string;
  registrationDeadline: string; // ISO
  isRecurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly';

  // Step 3: Venue / Location
  locationType: 'physical' | 'online' | 'tba';
  venue?: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode?: string;
    country?: string;
    mapCoordinates?: { lat: number; lng: number };
    capacity?: number;
    hasParking: boolean;
  };
  onlineDetails?: {
    platform: 'zoom' | 'meet' | 'teams' | 'custom';
    link: string;
  };

  // Step 4: Tickets & Pricing
  ticketTiers: TicketTier[];
  promoCodes: PromoCode[];

  // Step 5: Event Details
  description: string; // HTML/Markdown
  highlights: string[];
  agenda: EventSession[];

  // Step 6: Media
  coverImage: string; // URL
  gallery: string[];  // URLs
  videoUrl?: string;

  // Step 7: Organizer Info
  organizer: EventOrganizerInfo;

  // Step 8: Additional Settings
  refundPolicy: 'full' | 'partial' | 'none';
  hasTerms: boolean;
  termsUrl?: string; 
  tags: string[];
  isPrivate: boolean;
  isFeatured: boolean;
  
  // System fields (added on publish)
  status?: 'draft' | 'published' | 'cancelled';
  createdAt?: any;
  updatedAt?: any;
  organizerId?: string;
  stats?: {
    ticketsSold: number;
    revenue: number;
    capacity: number;
  };
}

// --- Initial State ---

export const INITIAL_EVENT_DATA: CreateEventData = {
  title: '',
  subtitle: '',
  category: 'music',
  type: 'in-person',
  language: ['English'],
  ageRestriction: 'all',
  
  format: 'single',
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 86400000).toISOString(), // +1 day
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  registrationDeadline: new Date().toISOString(),
  isRecurring: false,

  locationType: 'physical',
  venue: {
    name: '',
    address: '',
    city: '',
    state: '',
    hasParking: false
  },
  
  ticketTiers: [],
  promoCodes: [],

  description: '',
  highlights: [],
  agenda: [],

  coverImage: '',
  gallery: [],

  organizer: {
    name: '',
    email: '',
    socials: {}
  },

  refundPolicy: 'none',
  hasTerms: false,
  tags: [],
  isPrivate: false,
  isFeatured: false,
};