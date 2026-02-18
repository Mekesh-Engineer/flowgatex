import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { getDb } from '@/services/firebase';

const USERS_COLLECTION = 'users';

export const userService = {
  /**
   * Get user favorites (array of event IDs)
   */
  getUserFavorites: async (userId: string): Promise<string[]> => {
    const db = getDb();
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    if (userDoc.exists()) {
      return userDoc.data().favorites || [];
    }
    return [];
  },

  /**
   * Toggle favorite status for an event
   */
  toggleFavorite: async (userId: string, eventId: string): Promise<boolean> => {
    const db = getDb();
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);

    // If user doc doesn't exist (e.g. auth user not synchronized), create it? 
    // Usually auth syncs it. For now assume it exists.
    if (!userDoc.exists()) return false;

    const favorites = userDoc.data().favorites || [];
    const isFavorite = favorites.includes(eventId);

    if (isFavorite) {
      await updateDoc(userRef, {
        favorites: arrayRemove(eventId)
      });
      return false;
    } else {
      await updateDoc(userRef, {
        favorites: arrayUnion(eventId)
      });
      return true;
    }
  },
  
  /**
   * Get user notifications (Mock for now)
   */
  getNotifications: async (_userId: string) => {
      // Logic to fetch from 'notifications' subcollection could go here
      // For now we mock a welcome notification
      return [
          { 
            id: '1', 
            type: 'system',
            title: 'Welcome to FlowGateX', 
            message: 'Start exploring events and manage your bookings here.', 
            read: false, 
            createdAt: new Date().toISOString() 
          }
      ];
  }
};
