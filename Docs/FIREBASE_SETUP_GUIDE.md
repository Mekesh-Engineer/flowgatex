# Firebase Setup and Configuration Guide

## Overview

FlowGateX is now fully configured to use **Firebase** for:

- 🔐 **Authentication** (Email/Password, Google, Facebook)
- 📊 **Firestore Database** (NoSQL cloud database)
- ⚡ **Realtime Database** (Real-time data synchronization)
- 📁 **Storage** (File and media storage)
- 📈 **Analytics** (User behavior tracking)

## Firebase Project Details

**Project Name:** FlowGateX V1  
**Project ID:** `flowgatex-v1`  
**Region:** Asia Southeast (asia-southeast1)  
**Console:** https://console.firebase.google.com/project/flowgatex-v1

## Configuration Status

✅ **Environment Variables Configured**  
✅ **Firebase SDK Initialized**  
✅ **All Services Enabled**  
✅ **TypeScript Support Added**  
✅ **Mock Mode Disabled**

## Files Updated

### 1. Environment Configuration

#### `.env.local` (Active Configuration)

```env
VITE_FIREBASE_API_KEY=AIzaSyCl7kglbqlZgcg7gGmA6yD8Z_z4WT_JC74
VITE_FIREBASE_AUTH_DOMAIN=flowgatex-v1.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://flowgatex-v1-default-rtdb.asia-southeast1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=flowgatex-v1
VITE_FIREBASE_STORAGE_BUCKET=flowgatex-v1.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=676957762665
VITE_FIREBASE_APP_ID=1:676957762665:web:f34fd82bcd630550e3def8
VITE_FIREBASE_MEASUREMENT_ID=G-H630VYKM07
VITE_MOCK_MODE=false
```

#### `.env.example` (Template for Team)

Updated with same credentials for easy setup

### 2. Firebase SDK Configuration

#### `src/lib/firebase.ts` - Enhanced Features:

- ✅ Added Realtime Database support
- ✅ Added helper functions for type-safe access
- ✅ Improved error handling and logging
- ✅ Persistent cache for Firestore
- ✅ Multi-tab support
- ✅ Analytics integration

**New Exports:**

```typescript
import {
  auth, // Firebase Authentication
  db, // Firestore Database
  realtimeDb, // Realtime Database (NEW)
  storage, // Firebase Storage
  getDb, // Type-safe Firestore getter
  getRealtimeDb, // Type-safe Realtime DB getter (NEW)
  getStorageInstance, // Type-safe Storage getter (NEW)
} from '@/lib/firebase';
```

### 3. Connection Test Utility

#### `src/lib/firebaseTestConnection.ts` - New File

Comprehensive testing utility for all Firebase services.

**Available Functions:**

```typescript
import {
  testFirebaseConnection, // Test all services
  checkFirebaseStatus, // Quick status check
  testAuthentication, // Test Auth only
  testFirestore, // Test Firestore only
  testRealtimeDatabase, // Test Realtime DB only
  testStorage, // Test Storage only
} from '@/lib/firebaseTestConnection';
```

## Testing Firebase Connection

### Method 1: Quick Status Check

Add to your app's entry point (e.g., `src/main.tsx` or any component):

```typescript
import { checkFirebaseStatus } from '@/lib/firebaseTestConnection';

// On app startup
checkFirebaseStatus();
```

**Output:**

```
🔥 Firebase Status Check
========================
Enabled: ✅ Yes
Auth: ✅ Ready
Firestore: ✅ Ready
Realtime DB: ✅ Ready
Storage: ✅ Ready
```

### Method 2: Full Connection Test

Test all services with read/write operations:

```typescript
import { testFirebaseConnection } from '@/lib/firebaseTestConnection';

// Run comprehensive test
await testFirebaseConnection();
```

**This will:**

1. ✅ Test Authentication (check auth state)
2. ✅ Test Firestore (write, read, delete document)
3. ✅ Test Realtime Database (write, read, listen, delete)
4. ✅ Test Storage (upload, get URL, delete file)

**Sample Output:**

```
🔥 ========================================
🔥 Firebase Connection Test Starting...
🔥 ========================================

🔐 Testing Firebase Authentication...
   ✅ Auth service is ready

📊 Testing Firestore Database...
   ✅ All Firestore operations successful

⚡ Testing Realtime Database...
   ✅ All Realtime DB operations successful

📁 Testing Firebase Storage...
   ✅ All Storage operations successful

🔥 ========================================
🔥 Firebase Connection Test Complete
🔥 ========================================

✅ Successful: 4
❌ Failed: 0
⏭️  Skipped: 0

🎉 All tests passed! Firebase is properly configured.
```

### Method 3: Browser Console Test

1. Open your app in the browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Type:

```javascript
// Quick status
checkFirebaseStatus();

// Full test
await testFirebaseConnection();
```

## Usage Examples

### 1. Authentication

#### Sign Up with Email/Password

```typescript
import { getAuthInstance } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const auth = getAuthInstance();
const userCredential = await createUserWithEmailAndPassword(
  auth,
  'user@example.com',
  'password123'
);
console.log('User created:', userCredential.user.uid);
```

#### Sign In with Email/Password

```typescript
import { getAuthInstance } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const auth = getAuthInstance();
const userCredential = await signInWithEmailAndPassword(auth, 'user@example.com', 'password123');
console.log('User signed in:', userCredential.user.email);
```

#### Google Sign-In

```typescript
import { getAuthInstance, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';

const auth = getAuthInstance();
if (googleProvider) {
  const result = await signInWithPopup(auth, googleProvider);
  console.log('Google user:', result.user.displayName);
}
```

### 2. Firestore Database

#### Add Document

```typescript
import { getDb } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const db = getDb();
const docRef = await addDoc(collection(db, 'events'), {
  title: 'Summer Music Festival',
  location: 'Central Park',
  date: new Date('2026-07-15'),
  capacity: 1000,
  createdAt: serverTimestamp(),
});
console.log('Event created with ID:', docRef.id);
```

#### Read Documents

```typescript
import { getDb } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const db = getDb();
const q = query(collection(db, 'events'), where('capacity', '>', 500));
const querySnapshot = await getDocs(q);
querySnapshot.forEach(doc => {
  console.log(doc.id, '=>', doc.data());
});
```

#### Real-time Listener

```typescript
import { getDb } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const db = getDb();
const unsubscribe = onSnapshot(collection(db, 'events'), snapshot => {
  snapshot.docChanges().forEach(change => {
    if (change.type === 'added') {
      console.log('New event:', change.doc.data());
    }
    if (change.type === 'modified') {
      console.log('Modified event:', change.doc.data());
    }
    if (change.type === 'removed') {
      console.log('Removed event:', change.doc.data());
    }
  });
});

// Later: unsubscribe()
```

### 3. Realtime Database

#### Write Data

```typescript
import { getRealtimeDb } from '@/lib/firebase';
import { ref, set } from 'firebase/database';

const rtdb = getRealtimeDb();
await set(ref(rtdb, 'iot/sensors/temperature'), {
  value: 22.5,
  unit: 'celsius',
  timestamp: Date.now(),
  location: 'Main Hall',
});
console.log('Temperature data saved');
```

#### Read Data Once

```typescript
import { getRealtimeDb } from '@/lib/firebase';
import { ref, get } from 'firebase/database';

const rtdb = getRealtimeDb();
const snapshot = await get(ref(rtdb, 'iot/sensors/temperature'));
if (snapshot.exists()) {
  console.log('Temperature:', snapshot.val());
} else {
  console.log('No data available');
}
```

#### Real-time Listener

```typescript
import { getRealtimeDb } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

const rtdb = getRealtimeDb();
const tempRef = ref(rtdb, 'iot/sensors/temperature');
const unsubscribe = onValue(tempRef, snapshot => {
  const data = snapshot.val();
  console.log('Temperature updated:', data.value, data.unit);
});

// Later: unsubscribe()
```

#### Push Data (Auto-generated Keys)

```typescript
import { getRealtimeDb } from '@/lib/firebase';
import { ref, push } from 'firebase/database';

const rtdb = getRealtimeDb();
const newEntryRef = push(ref(rtdb, 'iot/events'));
await set(newEntryRef, {
  type: 'door_open',
  timestamp: Date.now(),
  deviceId: 'door-sensor-01',
});
console.log('Event logged with key:', newEntryRef.key);
```

### 4. Storage

#### Upload File

```typescript
import { getStorageInstance } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const storage = getStorageInstance();
const file = event.target.files[0]; // From file input
const storageRef = ref(storage, `event-images/${Date.now()}_${file.name}`);

await uploadBytes(storageRef, file);
const downloadURL = await getDownloadURL(storageRef);
console.log('File uploaded:', downloadURL);
```

#### Upload String/Data

```typescript
import { getStorageInstance } from '@/lib/firebase';
import { ref, uploadString } from 'firebase/storage';

const storage = getStorageInstance();
const imageData = 'data:image/png;base64,iVBORw0KGgo...'; // Base64 image
const storageRef = ref(storage, 'qr-codes/event-123.png');

await uploadString(storageRef, imageData, 'data_url');
console.log('QR code saved');
```

#### List Files

```typescript
import { getStorageInstance } from '@/lib/firebase';
import { ref, listAll } from 'firebase/storage';

const storage = getStorageInstance();
const listRef = ref(storage, 'event-images/');
const result = await listAll(listRef);

result.items.forEach(itemRef => {
  console.log('File:', itemRef.name);
});
```

## Security Rules Setup

### Required: Configure Firebase Security Rules

#### 1. Firestore Rules

Go to: https://console.firebase.google.com/project/flowgatex-v1/firestore/rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Connection test collection (temporary, for testing)
    match /connection_tests/{testId} {
      allow read, write: if true; // Open for testing
    }

    // Events collection
    match /events/{eventId} {
      allow read: if true; // Public read
      allow create, update: if request.auth != null; // Authenticated write
      allow delete: if request.auth != null &&
        (request.auth.uid == resource.data.organizerId ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }

    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && request.auth.uid == userId;
    }

    // Bookings collection
    match /bookings/{bookingId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
  }
}
```

#### 2. Realtime Database Rules

Go to: https://console.firebase.google.com/project/flowgatex-v1/database/flowgatex-v1-default-rtdb/rules

```json
{
  "rules": {
    "connection_tests": {
      ".read": true,
      ".write": true
    },
    "iot": {
      "sensors": {
        ".read": true,
        ".write": "auth != null"
      },
      "events": {
        ".read": true,
        ".write": "auth != null",
        "$eventId": {
          ".validate": "newData.hasChildren(['type', 'timestamp', 'deviceId'])"
        }
      }
    },
    "users": {
      "$userId": {
        ".read": "auth != null && auth.uid == $userId",
        ".write": "auth != null && auth.uid == $userId"
      }
    }
  }
}
```

#### 3. Storage Rules

Go to: https://console.firebase.google.com/project/flowgatex-v1/storage/rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Connection test files (temporary)
    match /connection_tests/{allPaths=**} {
      allow read, write: if true;
    }

    // Event images
    match /event-images/{imageId} {
      allow read: if true;
      allow write: if request.auth != null &&
        request.resource.size < 5 * 1024 * 1024 && // 5MB max
        request.resource.contentType.matches('image/.*');
    }

    // QR codes
    match /qr-codes/{qrCodeId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // User uploads
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Troubleshooting

### Issue: Firebase not initializing

**Symptoms:** Console shows "Firebase is DISABLED" or services are null

**Solutions:**

1. Check `.env.local` has all Firebase credentials
2. Verify `VITE_MOCK_MODE=false`
3. Restart dev server: `npm run dev`
4. Check browser console for errors

### Issue: Permission denied errors

**Symptoms:** "Missing or insufficient permissions" errors

**Solutions:**

1. Configure Security Rules (see above)
2. Ensure user is authenticated for protected operations
3. Check Firebase Console → Rules for error logs

### Issue: Network errors

**Symptoms:** "Failed to fetch" or timeout errors

**Solutions:**

1. Check internet connection
2. Verify Firebase project is active (not deleted)
3. Check if firewall/proxy is blocking Firebase domains
4. Try accessing Firebase Console to verify project status

### Issue: CORS errors

**Symptoms:** Cross-origin request blocked

**Solutions:**

1. Ensure `authDomain` matches exactly in config
2. Add your domain to authorized domains in Firebase Console
3. For localhost, usually no action needed

## Running the Test

### Option 1: Add to main.tsx (Recommended for Development)

```typescript
// src/main.tsx
import { testFirebaseConnection } from '@/lib/firebaseTestConnection';

// After app starts, test Firebase
if (import.meta.env.DEV) {
  testFirebaseConnection();
}
```

### Option 2: Create a Test Page

Create `src/pages/FirebaseTestPage.tsx`:

```typescript
import { testFirebaseConnection } from '@/lib/firebaseTestConnection';
import { useState } from 'react';

export default function FirebaseTestPage() {
  const [testing, setTesting] = useState(false);

  const runTest = async () => {
    setTesting(true);
    await testFirebaseConnection();
    setTesting(false);
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Firebase Connection Test</h1>
      <button onClick={runTest} disabled={testing}>
        {testing ? 'Testing...' : 'Run Firebase Test'}
      </button>
      <p>Open browser console to see results</p>
    </div>
  );
}
```

### Option 3: Browser Console (Quick Test)

1. Run: `npm run dev`
2. Open browser to `http://localhost:5173`
3. Press F12 (Developer Tools)
4. In Console, type:

```javascript
// Import and run
import('@/lib/firebaseTestConnection').then(m => m.testFirebaseConnection());
```

## Next Steps

1. ✅ **Test Connection**: Run `testFirebaseConnection()` to verify setup
2. ✅ **Configure Security Rules**: Set up Firestore, Realtime DB, and Storage rules
3. ✅ **Enable Authentication Methods**:
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable Email/Password, Google, Facebook
4. ✅ **Set Up Indexes**: Create Firestore composite indexes as needed
5. ✅ **Configure Analytics**: Review Analytics settings in Firebase Console

## Resources

- **Firebase Console**: https://console.firebase.google.com/project/flowgatex-v1
- **Documentation**: https://firebase.google.com/docs
- **Auth Guide**: https://firebase.google.com/docs/auth/web/start
- **Firestore Guide**: https://firebase.google.com/docs/firestore/quickstart
- **Realtime DB Guide**: https://firebase.google.com/docs/database/web/start
- **Storage Guide**: https://firebase.google.com/docs/storage/web/start

## Support

For Firebase-related issues:

1. Check browser console for error messages
2. Run connection test to identify specific service failures
3. Review Firebase Console for quota/billing issues
4. Check Security Rules configuration

---

**Status**: ✅ Firebase Fully Configured and Ready  
**Last Updated**: February 11, 2026  
**Configuration Version**: v1.0
