/**
 * eventMapper.ts
 * Converts CreateEventData (Firebase/Firestore shape) → EventItem (UI display shape).
 * This is the single source of truth for bridging the data layer to the UI layer.
 *
 * IMPORTANT: Firestore documents may have missing or partial fields (e.g. from
 * bulk JSON imports). Every field access must be defensive.
 */

import type { CreateEventData } from '../types/event.types';
import type { EventItem } from '../components/events-page/types';

/**
 * Safely parse a date value from Firestore.
 * Handles: ISO strings, Firestore Timestamps (with .seconds), Date objects, and undefined.
 */
function parseFirestoreDate(value: unknown): Date {
  if (!value) return new Date();
  // Firestore Timestamp object
  if (typeof value === 'object' && value !== null && 'seconds' in value) {
    return new Date((value as { seconds: number }).seconds * 1000);
  }
  // ISO string or Date
  const d = new Date(value as string | number);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Map a single Firestore event document to the EventItem shape consumed by
 * EventCardInner, SearchAutocomplete, MapView, and other UI components.
 */
export function toEventItem(event: CreateEventData & { id: string }): EventItem {
  const startDate = parseFirestoreDate(event.startDate);
  // Normalize tiers: compute 'available' field if missing
  const rawTiers = Array.isArray(event.ticketTiers) ? event.ticketTiers : [];
  const tiers = rawTiers.map(t => ({
    ...t,
    sold: t.sold ?? 0,
    available: t.available ?? Math.max(0, (t.quantity ?? 0) - (t.sold ?? 0)),
  }));
  // Write back normalized tiers so downstream consumers (EventDetails) get the computed field
  event.ticketTiers = tiers;
  const gallery = Array.isArray(event.gallery) ? event.gallery : [];

  const lowestPrice =
    tiers.length > 0
      ? Math.min(...tiers.map((t) => t.price ?? 0))
      : 0;
  const totalCapacity = tiers.reduce((s, t) => s + (t.quantity ?? 0), 0);
  const totalSold = tiers.reduce((s, t) => s + (t.sold ?? 0), 0);

  return {
    id: event.id,
    title: event.title || 'Untitled Event',
    description: event.description || '',
    category: event.category || 'other',
    tags: Array.isArray(event.tags) ? event.tags : [],
    date: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    location: event.venue
      ? `${event.venue.name || 'Venue'}, ${event.venue.city || ''}`
      : event.locationType === 'online'
        ? 'Online'
        : 'TBA',
    venue: event.venue?.name || (event.locationType === 'online' ? 'Virtual' : 'TBA'),
    city: event.venue?.city || (event.locationType === 'online' ? 'Online' : 'TBA'),
    coordinates: event.venue?.mapCoordinates || { lat: 0, lng: 0 },
    image: event.coverImage || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800',
    images: event.coverImage ? [event.coverImage, ...gallery] : gallery,
    price: lowestPrice,
    currency: 'INR',
    online: event.locationType === 'online',
    attendees: totalSold,
    capacity: totalCapacity || (event.venue?.capacity ?? 0),
    rating: 4.5, // No rating system yet — default
    reviews: 0,
    organizer: event.organizer?.name || 'Unknown Organizer',
    organizerAvatar: event.organizer?.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.organizer?.name || 'O')}&background=00A3DB&color=fff`,
    featured: event.isFeatured ?? false,
    status: event.status || 'published',
  };
}

/**
 * Map an array of Firestore events to EventItem[].
 */
export function toEventItems(events: (CreateEventData & { id: string })[]): EventItem[] {
  if (!Array.isArray(events)) return [];
  return events.map(toEventItem);
}
