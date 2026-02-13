export type ViewMode = 'grid' | 'list' | 'map';

export interface FilterState {
  categories: string[];
  priceRange: [number, number];
  eventType: 'all' | 'online' | 'offline';
  sortBy: 'date' | 'price-asc' | 'price-desc' | 'rating' | 'popular';
  dateRange: string;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  date: string;
  time: string;
  location: string;
  venue: string;
  city: string;
  coordinates: { lat: number; lng: number };
  image: string;
  images: string[];
  price: number;
  originalPrice?: number;
  currency: string;
  online: boolean;
  attendees: number;
  capacity: number;
  rating: number;
  reviews: number;
  organizer: string;
  organizerAvatar: string;
  featured: boolean;
  status: string;
}
