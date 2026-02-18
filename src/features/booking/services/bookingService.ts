import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb } from '@/services/firebase';
import type { Booking, CreateBookingData } from '../types/booking.types';
import { BookingStatus } from '@/lib/constants';
// QR utils removed
import type { BookingTicket } from '../types/booking.types';

const COLLECTION = 'bookings';

// Get user bookings
export const getUserBookings = async (userId: string): Promise<Booking[]> => {
  const q = query(
    collection(getDb(), COLLECTION),
    where('userId', '==', userId),
    orderBy('bookingDate', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Booking);
};

// Get booking by ID
export const getBookingById = async (id: string): Promise<Booking | null> => {
  const docRef = doc(getDb(), COLLECTION, id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Booking;
  }
  return null;
};

// Create booking (initial pending state)
export const createBooking = async (
  userId: string,
  data: CreateBookingData,
  eventTitle: string,
  eventDate: string,
  discount: number = 0,
  eventImage?: string,
  venue?: string,
  serviceFee: number = 0,
  taxAmount: number = 0
): Promise<string> => {
  const totalAmount = data.tickets.reduce((sum, t) => sum + t.price * t.quantity, 0);
  const finalAmount = Math.max(0, totalAmount + serviceFee + taxAmount - discount);
  
  // Create booking without QR codes initially
  const ticketsData = data.tickets.map(t => ({
    ...t,
    qrCodes: [] // Will be populated after payment
  }));

  const docRef = await addDoc(collection(getDb(), COLLECTION), {
    userId,
    eventId: data.eventId,
    eventTitle,
    eventDate,
    eventImage,
    venue,
    tickets: ticketsData,
    attendees: data.attendees,
    totalAmount,
    discount,
    serviceFee,
    taxAmount,
    finalAmount,
    status: BookingStatus.PENDING,
    bookingDate: serverTimestamp(),
  });

  return docRef.id;
};

// Update booking tickets (e.g. with QR codes after payment)
export const updateBookingTickets = async (
  bookingId: string,
  tickets: BookingTicket[]
): Promise<void> => {
  const docRef = doc(getDb(), COLLECTION, bookingId);
  await updateDoc(docRef, { tickets });
};

// Update booking status
export const updateBookingStatus = async (
  id: string,
  status: BookingStatus,
  paymentId?: string
): Promise<void> => {
  const docRef = doc(getDb(), COLLECTION, id);
  await updateDoc(docRef, {
    status,
    ...(paymentId && { paymentId }),
    updatedAt: serverTimestamp(),
  });
};

// Cancel booking
export const cancelBooking = async (id: string): Promise<void> => {
  await updateBookingStatus(id, BookingStatus.CANCELLED);
};

// Get bookings for a specific event
export const getEventBookings = async (eventId: string): Promise<Booking[]> => {
  const q = query(
    collection(getDb(), COLLECTION),
    where('eventId', '==', eventId),
    orderBy('bookingDate', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Booking);
};
