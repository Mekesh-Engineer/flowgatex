import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb } from '@/services/firebase';
import { logger } from '@/lib/logger';
import type { IoTDevice, ScanResult, DeviceConfig } from '../types/iot.types';

const COLLECTION = 'devices';

// Get all devices for an event
export const getDevicesByEvent = async (eventId: string): Promise<IoTDevice[]> => {
  const q = query(collection(getDb(), COLLECTION), where('eventId', '==', eventId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as IoTDevice);
};

// Get device by ID
export const getDeviceById = async (id: string): Promise<IoTDevice | null> => {
  const docRef = doc(getDb(), COLLECTION, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as IoTDevice) : null;
};

// Update device config (uses dot-notation to merge without overwriting existing config keys)
export const updateDeviceConfig = async (id: string, config: Partial<DeviceConfig>): Promise<void> => {
  const docRef = doc(getDb(), COLLECTION, id);
  const updates: Record<string, unknown> = { updatedAt: serverTimestamp() };
  for (const [key, value] of Object.entries(config)) {
    updates[`config.${key}`] = value;
  }
  await updateDoc(docRef, updates);
};

// Subscribe to device status updates
export const subscribeToDevices = (
  eventId: string,
  callback: (devices: IoTDevice[]) => void
): (() => void) => {
  const q = query(collection(getDb(), COLLECTION), where('eventId', '==', eventId));
  
  return onSnapshot(
    q,
    (snapshot) => {
      const devices = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as IoTDevice);
      callback(devices);
    },
    (error) => {
      logger.error('IoT device listener error:', error);
    }
  );
};

// Validate QR code against Firestore tickets collection
export const validateQRCode = async (qrCode: string, eventId: string): Promise<ScanResult> => {
  try {
    if (!qrCode || qrCode.length < 8) {
      return { success: false, error: 'Invalid QR code format', timestamp: new Date().toISOString() };
    }

    // Look up the ticket by its QR data in the tickets collection
    const ticketsQuery = query(
      collection(getDb(), 'tickets'),
      where('qrData', '==', qrCode),
      where('eventId', '==', eventId)
    );
    const snapshot = await getDocs(ticketsQuery);

    if (snapshot.empty) {
      return { success: false, error: 'Ticket not found for this event', timestamp: new Date().toISOString() };
    }

    const ticketDoc = snapshot.docs[0];
    const ticket = ticketDoc.data();

    if (ticket.status === 'used') {
      return { success: false, error: 'Ticket already used', timestamp: new Date().toISOString() };
    }

    if (ticket.status === 'cancelled') {
      return { success: false, error: 'Ticket has been cancelled', timestamp: new Date().toISOString() };
    }

    // Mark the ticket as used
    await updateDoc(ticketDoc.ref, { status: 'used', usedAt: serverTimestamp() });

    return {
      success: true,
      ticketId: ticketDoc.id,
      attendeeName: ticket.attendeeName || ticket.holderName || undefined,
      tierName: ticket.tierName || undefined,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('QR validation error:', error);
    return { success: false, error: 'Validation failed', timestamp: new Date().toISOString() };
  }
};
