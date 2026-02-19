import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getDb, getStorageInstance } from '@/services/firebase';
import type { CreateEventData } from '../types/event.types';

const EVENTS_COLLECTION = 'events';

const cleanUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) return undefined;
  if (Array.isArray(obj)) {
    return obj.map(v => cleanUndefined(v)).filter(v => v !== undefined);
  } else if (typeof obj === 'object') {
    // Preserve Firestore Timestamps and Dates
    if (obj.constructor && (obj.constructor.name === 'Timestamp' || obj instanceof Date)) {
      return obj;
    }
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const cleaned = cleanUndefined(value);
      if (cleaned !== undefined) {
        acc[key] = cleaned;
      }
      return acc;
    }, {} as any);
  }
  return obj;
};

export const eventService = {
  // ── Create / Publish ────────────────────────────────────────────

  /** Publish a new event to Firestore. */
  publishEvent: async (eventData: CreateEventData, userId: string): Promise<string> => {
    const db = getDb();
    const tiers = Array.isArray(eventData.ticketTiers) ? eventData.ticketTiers : [];
    const minPrice =
      tiers.length > 0
        ? Math.min(...tiers.map((t) => t.price))
        : 0;

    // Strip the JSON-level "id" so it doesn't clash with the Firestore doc id
    const { id: _stripId, ...rest } = eventData as CreateEventData & { id?: string };

    const payload = {
      ...rest,
      ticketTiers: tiers,
      organizerId: userId,
      price: minPrice,
      status: 'published' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    // Firestore throws on 'undefined' values, so we recursively remove them
    const cleanPayload = cleanUndefined(payload);

    const docRef = await addDoc(collection(db, EVENTS_COLLECTION), cleanPayload);
    return docRef.id;
  },

  /** Save an event as a draft (not yet published). */
  saveDraft: async (eventData: CreateEventData, userId: string): Promise<string> => {
    const db = getDb();
    const payload = {
      ...eventData,
      organizerId: userId,
      status: 'draft' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, EVENTS_COLLECTION), payload);
    return docRef.id;
  },

  // ── Read ────────────────────────────────────────────────────────

  /** Get a single event by its Firestore document ID. */
  getEventById: async (id: string): Promise<(CreateEventData & { id: string }) | null> => {
    const db = getDb();
    const snap = await getDoc(doc(db, EVENTS_COLLECTION, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as CreateEventData & { id: string };
  },

  /**
   * Get published events, newest first.
   * NOTE: We avoid `orderBy` with `where` to prevent the need for a composite
   * Firestore index. Sorting is done client-side instead.
   */
  getEvents: async (count = 50): Promise<(CreateEventData & { id: string })[]> => {
    const db = getDb();
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('status', '==', 'published'),
      limit(count),
    );
    const snap = await getDocs(q);
    const events = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CreateEventData & { id: string });
    // Client-side sort by createdAt, newest first
    return events.sort((a, b) => {
      const ta = a.createdAt?.seconds ?? 0;
      const tb = b.createdAt?.seconds ?? 0;
      return tb - ta;
    });
  },

  /**
   * Get all events (any status) belonging to a specific organizer.
   * Sorted client-side to avoid composite index requirement.
   */
  getEventsByOrganizer: async (organizerId: string): Promise<(CreateEventData & { id: string })[]> => {
    const db = getDb();
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('organizerId', '==', organizerId),
    );
    const snap = await getDocs(q);
    const events = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CreateEventData & { id: string });
    return events.sort((a, b) => {
      const ta = a.createdAt?.seconds ?? 0;
      const tb = b.createdAt?.seconds ?? 0;
      return tb - ta;
    });
  },

  // ── Update ──────────────────────────────────────────────────────

  /** Partially update an existing event document. */
  updateEvent: async (id: string, data: Partial<CreateEventData>): Promise<void> => {
    const db = getDb();
    await updateDoc(doc(db, EVENTS_COLLECTION, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  // ── Delete ──────────────────────────────────────────────────────

  /** Permanently delete an event document. */
  deleteEvent: async (id: string): Promise<void> => {
    const db = getDb();
    await deleteDoc(doc(db, EVENTS_COLLECTION, id));
  },

  // ── Subscriptions ────────────────────────────────────────────────

  /**
   * Subscribe to all events for admin view.
   */
  subscribeToAllEvents: (callback: (events: (CreateEventData & { id: string })[]) => void): () => void => {
    const db = getDb();
    // Use simple query to avoid index issues initially
    const q = query(collection(db, EVENTS_COLLECTION), orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as CreateEventData & { id: string });
      callback(events);
    }, (error) => {
        console.error("Error subscribing to all events:", error);
    });
  },

  // ── Storage ─────────────────────────────────────────────────────

  /** Upload a file to Firebase Storage and return the download URL. */
  uploadImage: async (file: File, path: string): Promise<string> => {
    try {
        const storage = getStorageInstance();
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
    } catch (error: any) {
        if (error.message?.includes('Storage is not initialized') || error.code === 'storage/not-configured') {
            console.warn('Firebase Storage not configured. Using placeholder image.');
            return 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80';
        }
        throw error;
    }
  },

  // ── Utilities ───────────────────────────────────────────────────

  /**
   * Normalize a raw JSON event object so its field values conform to
   * the CreateEventData interface (e.g. map legacy enum values).
   */
  normalizeEvent: (raw: Record<string, any>): CreateEventData => {
    // Map legacy / descriptive format values → 'single' | 'multi'
    const MULTI_DAY_FORMATS = ['conference', 'festival', 'expo', 'exhibition'];
    const rawFormat = (raw.format ?? 'single').toString().toLowerCase();
    const format: 'single' | 'multi' = MULTI_DAY_FORMATS.includes(rawFormat)
      ? 'multi'
      : 'single';

    // Map legacy refund-policy values → 'full' | 'partial' | 'none'
    const REFUND_MAP: Record<string, 'full' | 'partial' | 'none'> = {
      full: 'full',
      flexible: 'full',
      partial: 'partial',
      moderate: 'partial',
      strict: 'none',
      none: 'none',
    };
    const rawRefund = (raw.refundPolicy ?? 'none').toString().toLowerCase();
    const refundPolicy = REFUND_MAP[rawRefund] ?? 'none';

    // Default required fields if missing to avoid Firestore "undefined" errors
    const normalized: any = {
      ...raw,
      format,
      refundPolicy,
      ticketTiers: Array.isArray(raw.ticketTiers) ? raw.ticketTiers : [],
      promoCodes: Array.isArray(raw.promoCodes) ? raw.promoCodes : [],
      highlights: Array.isArray(raw.highlights) ? raw.highlights : [],
      agenda: Array.isArray(raw.agenda) ? raw.agenda : [],
      gallery: Array.isArray(raw.gallery) ? raw.gallery : [],
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      language: Array.isArray(raw.language) ? raw.language : ['English'],
      // Ensure required enums have defaults
      locationType: raw.locationType ?? 'physical',
      category: raw.category ?? 'other',
      type: raw.type ?? 'in-person',
      ageRestriction: raw.ageRestriction ?? 'all',
      isRecurring: raw.isRecurring ?? false,
      isPrivate: raw.isPrivate ?? false,
      isFeatured: raw.isFeatured ?? false,
      hasTerms: raw.hasTerms ?? false,
      // Ensure nested objects are initialized if missing
      venue: raw.venue ?? { name: '', address: '', city: '', state: '', hasParking: false },
      organizer: raw.organizer ?? { name: '', email: '', socials: {} },
    };

    return normalized as CreateEventData;
  },

  /**
   * Parse a JSON file that contains either a single event object or an array
   * of event objects. Returns an array regardless.
   */
  parseEventJsonFile: async (file: File): Promise<CreateEventData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          const rawEvents: Record<string, any>[] = Array.isArray(json) ? json : [json];

          if (rawEvents.length === 0) {
            throw new Error('JSON file contains no events');
          }

          // Basic validation on every event
          for (let i = 0; i < rawEvents.length; i++) {
            if (!rawEvents[i].title || !rawEvents[i].startDate) {
              throw new Error(
                `Event #${i + 1} is missing required fields (title, startDate)`
              );
            }
          }

          // Normalize each event to match CreateEventData
          const events = rawEvents.map((ev) => eventService.normalizeEvent(ev));

          resolve(events);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          reject(new Error(`Invalid JSON file: ${msg}`));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsText(file);
    });
  },

  /** Publish an array of events to Firestore. Returns an array of created doc IDs. */
  publishBulkEvents: async (
    events: CreateEventData[],
    userId: string
  ): Promise<string[]> => {
    const ids: string[] = [];
    for (const ev of events) {
      const id = await eventService.publishEvent(ev, userId);
      ids.push(id);
    }
    return ids;
  },
};