import { EventCategory, EventStatus } from '@/lib/constants';

export interface Venue {
  name: string;
  address: string;
  city: string;
  state: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  capacity: number;
}

export interface TicketTier {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  quantity: number;
  sold: number;
  available: number;
  benefits?: string[];
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  organizerId: string;
  organizerName: string;
  venue: Venue;
  dates: {
    start: string;
    end: string;
    registrationDeadline: string;
  };
  ticketTiers: TicketTier[];
  images: string[];
  status: EventStatus;
  featured: boolean;
  tags: string[];
  features?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EventFilters {
  category?: EventCategory;
  search?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
  status?: EventStatus;
}

export interface CreateEventData {
  title: string;
  description: string;
  category: EventCategory;
  venue: Venue;
  dates: {
    start: string;
    end: string;
    registrationDeadline: string;
  };
  ticketTiers: Omit<TicketTier, 'id' | 'sold' | 'available'>[];
  images: string[];
  tags: string[];
  features?: string[];
}
