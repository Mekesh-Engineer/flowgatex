import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Event, EventFilters, CreateEventData } from '../types/event.types';
import { EventStatus } from '@/lib/constants';

const COLLECTION = 'events';

// Get all events with filters
export const getEvents = async (
  filters: EventFilters = {},
  pageLimit: number = 20,
  lastDoc?: DocumentSnapshot
) => {
  let q = query(collection(db, COLLECTION));

  // Apply filters
  if (filters.category) {
    q = query(q, where('category', '==', filters.category));
  }
  if (filters.city) {
    q = query(q, where('venue.city', '==', filters.city));
  }
  if (filters.status) {
    q = query(q, where('status', '==', filters.status));
  } else {
    // Default to published events
    q = query(q, where('status', '==', EventStatus.PUBLISHED));
  }

  // Order and pagination
  q = query(q, orderBy('dates.start', 'asc'), limit(pageLimit));

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const events = snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as Event
  );
  const lastVisible = snapshot.docs[snapshot.docs.length - 1];

  return { events, lastDoc: lastVisible };
};

// Get event by ID
export const getEventById = async (id: string): Promise<Event | null> => {
  const docRef = doc(db, COLLECTION, id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Event;
  }
  return null;
};

// Get featured events
export const getFeaturedEvents = async (count: number = 6): Promise<Event[]> => {
  const q = query(
    collection(db, COLLECTION),
    where('featured', '==', true),
    where('status', '==', EventStatus.PUBLISHED),
    orderBy('dates.start', 'asc'),
    limit(count)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Event);
};

// Get events by organizer
export const getEventsByOrganizer = async (organizerId: string): Promise<Event[]> => {
  const q = query(
    collection(db, COLLECTION),
    where('organizerId', '==', organizerId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Event);
};

// Create event
export const createEvent = async (
  data: CreateEventData & { organizerId: string; organizerName: string }
): Promise<string> => {
  const ticketTiers = data.ticketTiers.map((tier, index) => ({
    ...tier,
    id: `tier-${index + 1}`,
    sold: 0,
    available: tier.quantity,
  }));

  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    ticketTiers,
    status: EventStatus.DRAFT,
    featured: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
};

// Update event
export const updateEvent = async (id: string, data: Partial<Event>): Promise<void> => {
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// Delete event
export const deleteEvent = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION, id);
  await deleteDoc(docRef);
};

// Publish event
export const publishEvent = async (id: string): Promise<void> => {
  await updateEvent(id, { status: EventStatus.PUBLISHED });
};
