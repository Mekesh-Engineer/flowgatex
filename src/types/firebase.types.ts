import type { User as FirebaseUser } from 'firebase/auth';
import type { Timestamp, FieldValue } from 'firebase/firestore';

// Firebase Auth types
export interface FirebaseAuthUser extends FirebaseUser {
  customClaims?: {
    role?: string;
    organizerId?: string;
  };
}

// Firestore document types
export interface FirestoreDocument {
  id: string;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

// Storage types
export interface UploadResult {
  url: string;
  path: string;
  name: string;
  size: number;
  type: string;
}
