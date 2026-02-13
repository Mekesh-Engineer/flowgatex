# 🔥 Firebase Quick Start

## ✅ Configuration Complete!

Your Firebase setup is complete and ready to use. Here's how to test and start using it.

## 🚀 Quick Test (30 seconds)

### Step 1: Start Development Server

```bash
npm run dev
```

### Step 2: Test Firebase Connection

Open browser console (F12) and run:

```javascript
// Quick status check
import('@/lib/firebaseTestConnection').then(m => m.checkFirebaseStatus());

// Full connection test (recommended)
import('@/lib/firebaseTestConnection').then(m => m.testFirebaseConnection());
```

**Expected Output:**

```
🔥 Firebase Status Check
========================
Enabled: ✅ Yes
Auth: ✅ Ready
Firestore: ✅ Ready
Realtime DB: ✅ Ready
Storage: ✅ Ready
```

## 📋 What's Configured

✅ **Firebase Authentication**  
✅ **Firestore Database** (with persistent cache)  
✅ **Realtime Database**  
✅ **Firebase Storage**  
✅ **Analytics** (when enabled)

## 🔑 Environment Variables

All Firebase credentials are configured in `.env.local`:

- `VITE_FIREBASE_API_KEY` ✅
- `VITE_FIREBASE_AUTH_DOMAIN` ✅
- `VITE_FIREBASE_DATABASE_URL` ✅ (Realtime DB)
- `VITE_FIREBASE_PROJECT_ID` ✅
- `VITE_FIREBASE_STORAGE_BUCKET` ✅
- `VITE_FIREBASE_MESSAGING_SENDER_ID` ✅
- `VITE_FIREBASE_APP_ID` ✅
- `VITE_FIREBASE_MEASUREMENT_ID` ✅
- `VITE_MOCK_MODE=false` ✅

## 🎯 Using Firebase Services

### Authentication

```typescript
import { getAuthInstance } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const auth = getAuthInstance();
await signInWithEmailAndPassword(auth, email, password);
```

### Firestore

```typescript
import { getDb } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

const db = getDb();
await addDoc(collection(db, 'events'), { title: 'New Event' });
```

### Realtime Database

```typescript
import { getRealtimeDb } from '@/lib/firebase';
import { ref, set } from 'firebase/database';

const rtdb = getRealtimeDb();
await set(ref(rtdb, 'iot/temperature'), { value: 22.5 });
```

### Storage

```typescript
import { getStorageInstance } from '@/lib/firebase';
import { ref, uploadBytes } from 'firebase/storage';

const storage = getStorageInstance();
const fileRef = ref(storage, 'images/photo.jpg');
await uploadBytes(fileRef, file);
```

## ⚠️ Important: Set Security Rules

Before deploying to production, configure Firebase Security Rules:

### 1. Firestore Rules

👉 https://console.firebase.google.com/project/flowgatex-v1/firestore/rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /connection_tests/{testId} {
      allow read, write: if true; // Testing only
    }
    match /events/{eventId} {
      allow read: if true;
      allow create, update: if request.auth != null;
    }
  }
}
```

### 2. Realtime Database Rules

👉 https://console.firebase.google.com/project/flowgatex-v1/database/flowgatex-v1-default-rtdb/rules

```json
{
  "rules": {
    "connection_tests": {
      ".read": true,
      ".write": true
    },
    "iot": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

### 3. Storage Rules

👉 https://console.firebase.google.com/project/flowgatex-v1/storage/rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /connection_tests/{allPaths=**} {
      allow read, write: if true;
    }
    match /event-images/{imageId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 🔐 Enable Authentication Methods

Go to Firebase Console → Authentication → Sign-in method:
👉 https://console.firebase.google.com/project/flowgatex-v1/authentication/providers

Enable:

- ✅ Email/Password
- ✅ Google
- ✅ Facebook (optional)

## 📚 Documentation

- **Full Setup Guide**: [FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md)
- **Firebase Console**: https://console.firebase.google.com/project/flowgatex-v1
- **Official Docs**: https://firebase.google.com/docs

## 🐛 Troubleshooting

### "Missing or insufficient permissions"

→ Configure Security Rules (see above)

### "Firebase not initialized"

→ Check `VITE_MOCK_MODE=false` in `.env.local`  
→ Restart dev server: `npm run dev`

### Network errors

→ Check internet connection  
→ Verify Firebase project is active  
→ Check browser console for specific errors

## ✨ Next Steps

1. ✅ Test connection (see above)
2. ✅ Configure Security Rules
3. ✅ Enable authentication methods
4. ✅ Start building features!

## 🎉 You're Ready!

Firebase is fully configured and ready for:

- User authentication
- Data storage (Firestore & Realtime DB)
- File uploads (Storage)
- Real-time synchronization
- Analytics tracking

Happy coding! 🚀

---

**Project**: FlowGateX V1  
**Firebase Project ID**: flowgatex-v1  
**Setup Date**: February 11, 2026
