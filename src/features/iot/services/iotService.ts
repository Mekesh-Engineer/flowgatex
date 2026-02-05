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
import { db } from '@/lib/firebase';
import type { IoTDevice, ScanResult, DeviceConfig } from '../types/iot.types';

const COLLECTION = 'devices';

// Get all devices for an event
export const getDevicesByEvent = async (eventId: string): Promise<IoTDevice[]> => {
  const q = query(collection(db, COLLECTION), where('eventId', '==', eventId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as IoTDevice);
};

// Get device by ID
export const getDeviceById = async (id: string): Promise<IoTDevice | null> => {
  const docRef = doc(db, COLLECTION, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as IoTDevice) : null;
};

// Update device config
export const updateDeviceConfig = async (id: string, config: Partial<DeviceConfig>): Promise<void> => {
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, { config, updatedAt: serverTimestamp() });
};

// Subscribe to device status updates
export const subscribeToDevices = (
  eventId: string,
  callback: (devices: IoTDevice[]) => void
): (() => void) => {
  const q = query(collection(db, COLLECTION), where('eventId', '==', eventId));
  
  return onSnapshot(q, (snapshot) => {
    const devices = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as IoTDevice);
    callback(devices);
  });
};

// Validate QR code
export const validateQRCode = async (qrCode: string, eventId: string): Promise<ScanResult> => {
  // This would typically call your backend
  try {
    // Mock implementation
    const isValid = qrCode.length === 16;
    
    return {
      success: isValid,
      ticketId: isValid ? qrCode : undefined,
      attendeeName: isValid ? 'John Doe' : undefined,
      tierName: isValid ? 'General' : undefined,
      error: isValid ? undefined : 'Invalid QR code',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: 'Validation failed',
      timestamp: new Date().toISOString(),
    };
  }
};
