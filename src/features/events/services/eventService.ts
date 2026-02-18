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
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getDb, getStorageInstance } from '@/services/firebase';
import type { CreateEventData } from '../types/event.types';

const EVENTS_COLLECTION = 'events';

export const eventService = {
  // ── Create / Publish ────────────────────────────────────────────

  /** Publish a new event to Firestore. */
  publishEvent: async (eventData: CreateEventData, userId: string): Promise<string> => {
    const db = getDb();
    const minPrice =
      eventData.ticketTiers.length > 0
        ? Math.min(...eventData.ticketTiers.map((t) => t.price))
        : 0;

    const payload = {
      ...eventData,
      organizerId: userId,
      price: minPrice,
      status: 'published' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, EVENTS_COLLECTION), payload);
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
   * Parse a JSON file that contains either a single event object or an array
   * of event objects. Returns an array regardless.
   */
  parseEventJsonFile: async (file: File): Promise<CreateEventData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          const events: CreateEventData[] = Array.isArray(json) ? json : [json];

          if (events.length === 0) {
            throw new Error('JSON file contains no events');
          }

          // Basic validation on every event
          for (let i = 0; i < events.length; i++) {
            if (!events[i].title || !events[i].startDate) {
              throw new Error(
                `Event #${i + 1} is missing required fields (title, startDate)`
              );
            }
          }

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