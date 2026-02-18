# FlowGateX — Backend Architecture

> Technical architecture reference covering system design, data flow, Firebase services, Cloud Functions, and infrastructure decisions.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Architecture Diagram](#system-architecture-diagram)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture (Serverless)](#backend-architecture-serverless)
5. [Firebase Services](#firebase-services)
6. [Data Flow Patterns](#data-flow-patterns)
7. [State Management](#state-management)
8. [Security Architecture](#security-architecture)
9. [Deployment Architecture](#deployment-architecture)
10. [Performance Optimizations](#performance-optimizations)

---

## Architecture Overview

FlowGateX follows a **Serverless-First Hybrid Architecture**:

- **Frontend:** React 19 SPA served as a PWA via Netlify/Vercel
- **Backend:** Firebase (Firestore, Auth, Storage, Functions, Realtime DB)
- **Pattern:** The frontend communicates directly with Firestore for ~90% of operations. Sensitive operations (payments, analytics aggregation) are routed through Firebase Cloud Functions.

**Key Design Decisions:**

| Decision                          | Rationale                                                     |
| --------------------------------- | ------------------------------------------------------------- |
| Serverless backend                | Zero server management, auto-scaling, pay-per-use             |
| Direct Firestore access           | Lower latency, real-time subscriptions, offline support       |
| Cloud Functions for sensitive ops | Payment verification, admin actions require server-side trust |
| Zustand over Redux                | Simpler API, smaller bundle, built-in persistence             |
| React Router v7                   | Latest routing with lazy loading support                      |
| TailwindCSS v3 + MUI              | Utility-first CSS for custom components + MUI for complex UI  |

---

## System Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                         │
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  React 19   │  │   Zustand    │  │  React Query │    │
│  │  SPA / PWA  │  │  State Mgmt  │  │  Data Cache  │    │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                │                  │             │
│         └────────────────┼──────────────────┘             │
│                          │                                │
└──────────────────────────┼────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              │   Firebase SDK (v12)    │
              │   Direct Client Access  │
              └────────────┼────────────┘
                           │
┌──────────────────────────┼────────────────────────────────┐
│                    FIREBASE LAYER                          │
│                                                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │   Auth   │  │Firestore │  │ Storage  │  │ Realtime │ │
│  │          │  │ (NoSQL)  │  │ (Files)  │  │    DB    │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
│                                                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │  Cloud   │  │   App    │  │Analytics │                │
│  │Functions │  │  Check   │  │          │                │
│  └──────────┘  └──────────┘  └──────────┘                │
│                                                            │
└────────────────────────────────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              │   IoT Device Layer      │
              │  ESP32-CAM + Sensors    │
              │  (MQTT / WebSocket)     │
              └─────────────────────────┘
```

---

## Frontend Architecture

### Technology Stack

| Layer            | Technology                 | Version         |
| ---------------- | -------------------------- | --------------- |
| **Runtime**      | React                      | 19.2.x          |
| **Build Tool**   | Vite                       | 7.3.x           |
| **Language**     | TypeScript                 | 5.9.x           |
| **Routing**      | React Router DOM           | 7.13.x          |
| **State**        | Zustand                    | 5.0.x           |
| **Server State** | TanStack React Query       | 5.90.x          |
| **Forms**        | React Hook Form + Zod      | 7.71.x / 3.25.x |
| **UI Framework** | MUI (Material UI)          | 7.3.x           |
| **CSS**          | TailwindCSS                | 3.4.x           |
| **Animations**   | Framer Motion              | 11.18.x         |
| **Charts**       | Chart.js + react-chartjs-2 | 4.5.x           |
| **Icons**        | Lucide React               | 0.564.x         |
| **HTTP**         | Axios                      | 1.13.x          |
| **Search**       | Fuse.js                    | 7.1.x           |
| **PWA**          | Vite Plugin PWA (Workbox)  | 1.2.x           |

### Module Structure

```
src/
├── components/          # Shared UI components (27 common + 4 forms)
│   ├── common/          # Avatar, Badge, Button, Card, DataTable...
│   ├── forms/           # DatePicker, FileUpload, Input, Select
│   └── layout/          # Navbar, Footer, DashboardLayout, Sidebar
│
├── features/            # Feature modules (domain-driven)
│   ├── analytics/       # Dashboard analytics charts & hooks
│   ├── auth/            # Login, register, auth service
│   ├── booking/         # Cart, checkout, tickets, refunds
│   ├── events/          # Event CRUD, creation wizard, filters
│   ├── home/            # Landing page sections
│   ├── iot/             # IoT device management
│   ├── payment/         # Razorpay, Cashfree, mock payments
│   └── user/            # User profile service
│
├── hooks/               # Global custom hooks (8 hooks)
├── lib/                 # Core utilities (RBAC engine, constants, env)
├── pages/               # Route-level page components (36 pages)
├── routes/              # Route config, guards, path constants
├── services/            # Firebase/API service layer
├── store/zustand/       # Zustand state stores (5 stores)
├── styles/              # CSS (global, base, components, layouts)
├── types/               # Global TypeScript types
└── utils/               # Utility functions
```

### Code Splitting Strategy

All page components are **lazy-loaded** via `React.lazy()`:

```typescript
const HomePage = lazy(() => import('@/pages/public/HomePage'));
const EventsPage = lazy(() => import('@/pages/events/EventsPage'));
// ... 34 more lazy-loaded pages
```

Pages are wrapped in `<Suspense fallback={<LoadingScreen />}>` for graceful loading states.

---

## Backend Architecture (Serverless)

### Firebase Cloud Functions

**Directory:** `functions/`

**Runtime:** Node.js with TypeScript

**Key Functions:**

| Function                | Trigger         | Purpose                                       |
| ----------------------- | --------------- | --------------------------------------------- |
| Razorpay webhook        | HTTP            | Payment verification and booking confirmation |
| Razorpay order creation | HTTP (callable) | Create payment orders server-side             |

**Function Structure:**

```
functions/
├── src/
│   ├── index.ts          # Function exports and initialization
│   └── razorpay/         # Payment gateway handlers
├── lib/                  # Compiled JavaScript output
├── package.json          # Function dependencies
└── tsconfig.json         # TypeScript configuration
```

### Direct Firestore Access Pattern

The frontend uses the Firebase SDK to read/write Firestore directly with security rules:

```
Client → Firebase SDK → Firestore Security Rules → Firestore
```

**Advantages:**

- Sub-50ms latency for reads
- Real-time subscriptions via `onSnapshot`
- Offline support with persistent local cache
- No API server to manage

**When Cloud Functions are used instead:**

- Payment processing (requires server-side secrets)
- Admin-level data operations (batch updates)
- Webhook receivers (external service callbacks)
- Complex aggregation queries

---

## Firebase Services

### 1. Firebase Authentication

**Provider:** Email/password, Google OAuth, Facebook OAuth

**Initialization:** `src/services/firebase.ts`

**Features:**

- Token-based authentication (JWT)
- Auto-refresh tokens
- Persistent sessions across tabs
- Token injection into Axios requests via interceptor

### 2. Cloud Firestore

**Type:** NoSQL document database

**Collections:**

| Collection     | Purpose                 | Documents                          |
| -------------- | ----------------------- | ---------------------------------- |
| `users`        | User profiles and roles | `{uid}`                            |
| `events`       | Event data              | `{eventId}`                        |
| `bookings`     | Booking records         | `{bookingId}`                      |
| `tickets`      | Individual tickets      | `{ticketId}`                       |
| `transactions` | Payment records         | `{txnId}`                          |
| `devices`      | IoT device registry     | `{deviceId}`                       |
| `SettingInfo`  | Platform/org settings   | `platform`, `organization_{orgId}` |
| `cart`         | User cart data          | `{uid}`                            |
| `promos`       | Promo codes             | `{code}`                           |

**Optimization:**

- Persistent local cache enabled for offline support
- Multi-tab manager for cache sharing across browser tabs
- Indexes defined in `firestore.indexes.json`
- Security rules in `firestore.rules`

### 3. Firebase Storage

**Buckets:**

| Path                | Purpose                     |
| ------------------- | --------------------------- |
| `users/{uid}/`      | Profile images              |
| `events/{eventId}/` | Event cover images, gallery |
| `public/`           | Shared assets               |

### 4. Firebase Realtime Database

**Reserved for:** Live counters (concurrent viewers, real-time capacity)

### 5. Firebase App Check

**Provider:** ReCAPTCHA v3

**Purpose:** Protect Firebase resources from abuse by verifying requests come from legitimate app instances.

### 6. Firebase Analytics

**Condition:** Enabled only when `isSupported()` returns true (not in all environments).

---

## Data Flow Patterns

### Read Pattern (Real-Time)

```
Component mounts →
  useEffect subscribes via onSnapshot →
    Firestore pushes initial data →
      State updated via Zustand/setState →
        Component re-renders

Firestore data changes →
  onSnapshot callback fires →
    State updated →
      Component re-renders automatically
```

### Write Pattern (Transactional)

```
User action →
  Service function called →
    Input validation (Zod) →
      Firestore transaction (runTransaction) →
        Read current data →
          Validate business rules →
            Write updated data →
              Return result →
                Update local state
```

### Payment Pattern

```
Checkout →
  Cloud Function: createRazorpayOrder() →
    Razorpay SDK opens →
      User pays →
        Razorpay webhook → Cloud Function →
          Verify signature →
            Create booking (Firestore transaction) →
              Generate tickets →
                Decrement inventory →
                  Return confirmation
```

---

## State Management

### Zustand Stores

| Store              | Persisted | Storage Key       | Data                            |
| ------------------ | --------- | ----------------- | ------------------------------- |
| `useAuthStore`     | ✅        | `flowgatex-auth`  | User profile, auth status       |
| `useThemeStore`    | ✅        | `flowgatex-theme` | Dark mode preference            |
| `useCartStore`     | ✅        | `flowgatex-cart`  | Cart items, promo, totals       |
| `useSettingsStore` | ❌        | —                 | Platform settings, org settings |
| `useSidebarStore`  | ❌        | —                 | Sidebar collapse state          |

### TanStack React Query

**Configuration:** `src/lib/queryClient.ts`

| Setting          | Value      |
| ---------------- | ---------- |
| Stale time       | 5 minutes  |
| GC time          | 30 minutes |
| Retry count      | 1          |
| Refetch on focus | Disabled   |

---

## Security Architecture

### Authentication Flow

```
User submits credentials →
  Firebase Auth verifies →
    JWT token issued →
      Token stored in Firebase SDK →
        Axios interceptor attaches token to API requests →
          Cloud Functions validate token server-side
```

### Firestore Security Rules

**File:** `firestore.rules`

**Principles:**

- Users can only read/write their own documents
- Event reads are public; writes require organizer role
- Booking writes use server-side validation for inventory
- Admin operations require admin role claim

### RBAC Enforcement

**Client-side:** Route guards + permission hooks prevent UI access

**Server-side:** Firestore security rules + Cloud Function auth checks

---

## Deployment Architecture

### Frontend Deployment

| Platform    | Configuration File          | Purpose                  |
| ----------- | --------------------------- | ------------------------ |
| **Netlify** | `netlify.toml`              | Primary hosting          |
| **Vercel**  | `vercel.json`               | Alternative hosting      |
| **Docker**  | `Dockerfile` + `nginx.conf` | Containerized deployment |

### Build Pipeline

```
Source (TypeScript + React) →
  TypeScript compilation (tsc -b) →
    Vite build (code splitting, tree shaking, minification) →
      Output: dist/ (static files) →
        Deploy to Netlify/Vercel/Docker
```

### Docker Configuration

```dockerfile
# Multi-stage build
Stage 1: Node.js — install deps, build app
Stage 2: Nginx — serve static files
```

---

## Performance Optimizations

| Optimization            | Implementation                                              |
| ----------------------- | ----------------------------------------------------------- |
| **Code splitting**      | React.lazy() for all 36 pages                               |
| **Tree shaking**        | Vite + ES modules                                           |
| **CSS optimization**    | TailwindCSS purges unused styles                            |
| **Image optimization**  | Lazy loading, WebP format support                           |
| **Firebase caching**    | Persistent local cache with multi-tab sync                  |
| **React Query caching** | 5-minute stale time reduces re-fetches                      |
| **PWA caching**         | Workbox service worker with CacheFirst/StaleWhileRevalidate |
| **Bundle chunking**     | Manual chunks for vendor libs (React, MUI, Firebase)        |
| **Debounced writes**    | Cart sync debounced at 500ms                                |
| **Prefetching**         | React Query prefetch on hover                               |
