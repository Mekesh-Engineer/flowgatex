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
import { db } from '@/lib/firebase';
import type { Booking, CreateBookingData } from '../types/booking.types';
import { BookingStatus } from '@/lib/constants';
import { generateId } from '@/lib/utils';

const COLLECTION = 'bookings';

// Get user bookings
export const getUserBookings = async (userId: string): Promise<Booking[]> => {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    orderBy('bookingDate', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Booking);
};

// Get booking by ID
export const getBookingById = async (id: string): Promise<Booking | null> => {
  const docRef = doc(db, COLLECTION, id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Booking;
  }
  return null;
};

// Create booking
export const createBooking = async (
  userId: string,
  data: CreateBookingData,
  eventTitle: string,
  eventDate: string
): Promise<string> => {
  const totalAmount = data.tickets.reduce((sum, t) => sum + t.price * t.quantity, 0);
  
  // Generate QR codes for each ticket
  const ticketsWithQR = data.tickets.map((ticket) => ({
    ...ticket,
    qrCodes: Array.from({ length: ticket.quantity }, () => generateId(16)),
  }));

  const docRef = await addDoc(collection(db, COLLECTION), {
    userId,
    eventId: data.eventId,
    eventTitle,
    eventDate,
    tickets: ticketsWithQR,
    attendees: data.attendees,
    totalAmount,
    discount: 0,
    finalAmount: totalAmount,
    status: BookingStatus.PENDING,
    bookingDate: serverTimestamp(),
  });

  return docRef.id;
};

// Update booking status
export const updateBookingStatus = async (
  id: string,
  status: BookingStatus,
  paymentId?: string
): Promise<void> => {
  const docRef = doc(db, COLLECTION, id);
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
