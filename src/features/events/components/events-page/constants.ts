import type { FilterState } from './types';

export const ITEMS_PER_PAGE = 12;

export const DEFAULT_FILTER_STATE: FilterState = {
  categories: [],
  priceRange: [0, 1000],
  eventType: 'all',
  sortBy: 'date',
  dateRange: '',
};

export const SORT_OPTIONS = [
  { value: 'date', label: 'Date (Newest)' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Most Popular' },
] as const;

export const PRICE_RANGES = [
  { label: 'Free', min: 0, max: 0 },
  { label: 'Under $50', min: 0, max: 50 },
  { label: '$50 – $150', min: 50, max: 150 },
  { label: '$150 – $500', min: 150, max: 500 },
  { label: '$500+', min: 500, max: 10000 },
] as const;

export const CATEGORIES = [
  'Music & Festivals',
  'Technology',
  'Business',
  'Sports & Fitness',
  'Arts & Culture',
  'Food & Drink',
  'Education',
  'Health & Wellness',
  'Networking',
  'Entertainment',
] as const;
