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
  orderBy,
  limit,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getDb, getStorageInstance } from '@/lib/firebase';
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

  /** Get published events, newest first. */
  getEvents: async (count = 50): Promise<(CreateEventData & { id: string })[]> => {
    const db = getDb();
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc'),
      limit(count),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CreateEventData & { id: string });
  },

  /** Get all events (any status) belonging to a specific organizer. */
  getEventsByOrganizer: async (organizerId: string): Promise<(CreateEventData & { id: string })[]> => {
    const db = getDb();
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('organizerId', '==', organizerId),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CreateEventData & { id: string });
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
    const storage = getStorageInstance();
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  },

  // ── Utilities ───────────────────────────────────────────────────

  /** Parse a JSON file into CreateEventData (basic validation). */
  parseEventJson: async (file: File): Promise<CreateEventData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          if (!json.title || !json.startDate) {
            throw new Error('Missing required event fields (title, startDate)');
          }
          resolve(json as CreateEventData);
        } catch {
          reject(new Error('Invalid JSON file format'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsText(file);
    });
  },
};