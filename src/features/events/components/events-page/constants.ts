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
  { label: 'Under ₹500', min: 0, max: 500 },
  { label: '₹500 – ₹1500', min: 500, max: 1500 },
  { label: '₹1500 – ₹5000', min: 1500, max: 5000 },
  { label: '₹5000+', min: 5000, max: 100000 },
] as const;


export const CATEGORIES = ['Music', 'Tech', 'Business', 'Sports', 'Arts', 'Workshop', 'Other'] as const;

export const EVENT_TYPES = ['all', 'online', 'offline'] as const;

export const DATE_PRESETS = [
  { value: '', label: 'Any Date' },
  { value: 'today', label: 'Today' },
  { value: 'this-week', label: 'This Week' },
  { value: 'this-month', label: 'This Month' },
] as const;
