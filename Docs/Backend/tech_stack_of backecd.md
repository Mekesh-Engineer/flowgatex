# FlowGateX — Backend Technology Stack

> Comprehensive reference of all technologies, frameworks, and services powering the FlowGateX platform.

---

## Table of Contents

1. [Stack Overview](#stack-overview)
2. [Frontend Stack](#frontend-stack)
3. [Backend Stack (Firebase)](#backend-stack-firebase)
4. [Build & Dev Toolchain](#build--dev-toolchain)
5. [Testing Stack](#testing-stack)
6. [Deployment & Infrastructure](#deployment--infrastructure)
7. [IoT Stack](#iot-stack)
8. [Version Matrix](#version-matrix)

---

## Stack Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
│  React 19 · TypeScript 5.9 · Vite 7 · TailwindCSS 3 · MUI 7  │
│  Zustand 5 · React Query 5 · React Router 7 · Framer Motion   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS / WebSocket
┌──────────────────────────────▼──────────────────────────────────┐
│                       FIREBASE PLATFORM                         │
│  Authentication · Firestore · Storage · Realtime DB             │
│  Cloud Functions · App Check · Analytics · Hosting              │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                     EXTERNAL SERVICES                           │
│  Razorpay · Cashfree · Google Maps · Netlify CDN · Vercel      │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                     IoT SUBSYSTEM                               │
│  ESP32-CAM · Sensors · MQTT · Servo/Relay Gate Control          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend Stack

### Core Framework

| Technology     | Version | Role                                                                     |
| -------------- | ------- | ------------------------------------------------------------------------ |
| **React**      | 19.2.x  | UI rendering with concurrent features, Suspense, automatic batching      |
| **TypeScript** | 5.9.x   | Static type system across all source files                               |
| **Vite**       | 7.3.x   | Build tool — dev server with sub-second HMR, optimized production builds |

### Styling

| Technology                 | Version    | Role                                                                   |
| -------------------------- | ---------- | ---------------------------------------------------------------------- |
| **TailwindCSS**            | 3.4.x      | Utility-first CSS — custom design tokens (colors, shadows, animations) |
| **MUI (Material UI)**      | 7.3.x      | Pre-built components — DataGrid, Dialogs, Tabs, Autocomplete           |
| **Emotion**                | 11.x       | CSS-in-JS engine (MUI runtime dependency)                              |
| **CSS Custom Properties**  | —          | Theme variables with dark mode switching via `variables.css`           |
| **PostCSS + Autoprefixer** | 8.x / 10.x | CSS post-processing pipeline                                           |

### State Management

| Technology               | Version | Role                                                                    |
| ------------------------ | ------- | ----------------------------------------------------------------------- |
| **Zustand**              | 5.0.x   | Client-side state (5 stores with `persist` middleware for localStorage) |
| **TanStack React Query** | 5.x     | Server state — data fetching, caching, refetching, mutations            |

### Routing

| Technology       | Version | Role                                                                     |
| ---------------- | ------- | ------------------------------------------------------------------------ |
| **React Router** | 7.13.x  | Declarative routing — `ProtectedRoute`, `RoleRoute` guards, lazy loading |

### Animation

| Technology          | Version | Role                                                  |
| ------------------- | ------- | ----------------------------------------------------- |
| **Framer Motion**   | 11.18.x | Page transitions, layout animations, gesture handling |
| **Canvas Confetti** | 1.9.x   | Booking success celebration effect                    |

### Forms & Validation

| Technology          | Version | Role                                                              |
| ------------------- | ------- | ----------------------------------------------------------------- |
| **React Hook Form** | 7.71.x  | Performant forms with uncontrolled inputs                         |
| **Zod**             | 3.25.x  | Schema validation — login, registration, event creation, checkout |

### Data Visualization

| Technology          | Version | Role                                         |
| ------------------- | ------- | -------------------------------------------- |
| **Chart.js**        | 4.5.x   | Canvas-based charts for analytics dashboards |
| **React Chartjs 2** | 5.3.x   | React bindings for Chart.js                  |

### QR & Document

| Technology       | Version | Role                                            |
| ---------------- | ------- | ----------------------------------------------- |
| **qrcode.react** | 4.2.x   | Generate QR codes as React components (tickets) |
| **html5-qrcode** | 2.3.x   | Camera-based QR scanner (organizer check-in)    |
| **jsPDF**        | 4.1.x   | Generate downloadable PDF tickets               |
| **html2canvas**  | 1.4.x   | Render DOM elements to canvas for PDF capture   |

### Maps & Location

| Technology                 | Version | Role                                             |
| -------------------------- | ------- | ------------------------------------------------ |
| **@react-google-maps/api** | 2.20.x  | Google Maps for venue display and event creation |

### Utilities

| Technology                | Version   | Role                                                |
| ------------------------- | --------- | --------------------------------------------------- |
| **Axios**                 | 1.13.x    | HTTP client with auth token interceptors            |
| **Day.js**                | 1.11.x    | Date formatting, parsing, relative time             |
| **Fuse.js**               | 7.1.x     | Client-side fuzzy search engine                     |
| **clsx + tailwind-merge** | 2.x / 3.x | Conditional className composition without conflicts |
| **SweetAlert2**           | 11.x      | User-friendly alert dialogs                         |
| **ics**                   | 3.8.x     | Calendar file generation (.ics)                     |

---

## Backend Stack (Firebase)

FlowGateX uses Firebase as a serverless backend — no custom server is required.

### Firebase Services

| Service                     | SDK Version | Role                                                           |
| --------------------------- | ----------- | -------------------------------------------------------------- |
| **Firebase Authentication** | 12.9.x      | Email/password, Google OAuth, Facebook OAuth                   |
| **Cloud Firestore**         | 12.9.x      | Primary NoSQL database — 8+ collections, real-time listeners   |
| **Firebase Storage**        | 12.9.x      | File uploads — event images, user avatars                      |
| **Realtime Database**       | 12.9.x      | IoT sensor data, live device status                            |
| **Cloud Functions**         | 7.0.x       | Server-side logic — payment processing, signature verification |
| **Firebase App Check**      | 12.9.x      | Request attestation (blocks unauthorized API calls)            |
| **Firebase Analytics**      | 12.9.x      | Page views, user properties, custom events                     |

### Cloud Functions Runtime

| Technology             | Version | Role                                              |
| ---------------------- | ------- | ------------------------------------------------- |
| **Node.js**            | ≥ 20    | Functions runtime                                 |
| **firebase-admin**     | 13.6.x  | Admin SDK — server-side Firestore/Auth operations |
| **firebase-functions** | 7.0.x   | Cloud Functions framework                         |
| **Razorpay Node SDK**  | 2.9.x   | Server-side order creation, payment verification  |
| **CORS**               | 2.8.x   | Cross-origin request handling                     |
| **dotenv**             | 16.5.x  | Environment variable loading (local dev)          |

### Payment Gateways

| Gateway           | Type      | Role                                                  |
| ----------------- | --------- | ----------------------------------------------------- |
| **Razorpay**      | Primary   | Client-side checkout modal + server-side verification |
| **Cashfree**      | Secondary | Alternative processor with server-side integration    |
| **Mock Provider** | Dev       | Simulated payments for development/testing            |

---

## Build & Dev Toolchain

| Tool             | Version | Role                                                |
| ---------------- | ------- | --------------------------------------------------- |
| **Vite**         | 7.3.x   | Dev server (HMR), production bundler (Rollup-based) |
| **TypeScript**   | 5.9.x   | Type checking (`tsc -b` runs before every build)    |
| **PostCSS**      | 8.5.x   | CSS transformation pipeline                         |
| **TailwindCSS**  | 3.4.x   | Utility class generation from `tailwind.config.js`  |
| **Autoprefixer** | 10.4.x  | Vendor prefix injection                             |
| **LightningCSS** | 1.31.x  | CSS minification (Vite 7 requirement)               |
| **ESLint**       | 9.27.x  | Code linting (flat config format)                   |
| **Prettier**     | 3.8.x   | Code formatting                                     |
| **Husky**        | 9.1.x   | Git pre-commit hooks                                |
| **lint-staged**  | 16.2.x  | Run lint/format on staged files only                |

### Vite Plugins

| Plugin                 | Purpose                                                        |
| ---------------------- | -------------------------------------------------------------- |
| `@vitejs/plugin-react` | React Fast Refresh, JSX transform                              |
| `vite-tsconfig-paths`  | Resolve TypeScript `paths` aliases                             |
| `vite-plugin-pwa`      | PWA support — Workbox service worker, manifest.json generation |

---

## Testing Stack

| Tool                      | Version | Role                                                       |
| ------------------------- | ------- | ---------------------------------------------------------- |
| **Vitest**                | 4.0.x   | Test runner (Jest-compatible API, native Vite integration) |
| **jsdom**                 | 28.1.x  | Browser DOM simulation for unit tests                      |
| **React Testing Library** | 16.3.x  | Component rendering and querying                           |
| **jest-dom**              | 6.9.x   | Custom DOM assertion matchers                              |
| **user-event**            | 14.6.x  | Realistic user interaction simulation                      |
| **MSW**                   | 2.12.x  | API mocking via Service Worker pattern                     |

---

## Deployment & Infrastructure

### Primary: Netlify

| Feature           | Configuration                             |
| ----------------- | ----------------------------------------- |
| Build command     | `npm run build`                           |
| Publish directory | `dist/`                                   |
| Node version      | 20                                        |
| SPA routing       | `/* → /index.html (200)`                  |
| Security headers  | CSP, X-Frame-Options, HSTS                |
| Caching           | Immutable for hashed assets (1 year)      |
| Deploy contexts   | Production, deploy-preview, branch-deploy |

### Alternative: Vercel

| Feature       | Configuration         |
| ------------- | --------------------- |
| Framework     | Vite (auto-detected)  |
| Build command | `npm run build`       |
| Output        | `dist/`               |
| Rewrites      | `/(.*) → /index.html` |

### Alternative: Docker

| Component        | Technology                     |
| ---------------- | ------------------------------ |
| Build stage      | Node 20 Alpine                 |
| Production stage | Nginx Alpine                   |
| Web server       | nginx with custom `nginx.conf` |

### PWA Support

| Feature         | Implementation                  |
| --------------- | ------------------------------- |
| Service Worker  | Workbox (via `vite-plugin-pwa`) |
| Manifest        | `public/manifest.json`          |
| Offline support | Cache-first for static assets   |
| Install prompt  | Native browser install banner   |

---

## IoT Stack

| Component           | Technology                   | Role                                              |
| ------------------- | ---------------------------- | ------------------------------------------------- |
| **Microcontroller** | ESP32-CAM                    | Camera + WiFi for QR scanning                     |
| **Communication**   | MQTT / Firebase RTDB         | Real-time device ↔ cloud data sync                |
| **Gate Control**    | Servo motor + relay          | Physical barrier actuation                        |
| **Sensors**         | DHT22, MQ-series, HCSR04, IR | Temperature, gas, proximity, crowd density        |
| **Power**           | 5V USB / battery             | Device power supply                               |
| **Dashboard**       | React components             | Real-time sensor visualization, device management |

---

## Version Matrix

| Category  | Technology   | Version                         | Notes                                       |
| --------- | ------------ | ------------------------------- | ------------------------------------------- |
| Runtime   | Node.js      | ≥ 20                            | Required for both dev and Cloud Functions   |
| Language  | TypeScript   | 5.9.x (root), 5.7.x (functions) | Strict mode enabled                         |
| Framework | React        | 19.2.x                          | New JSX transform, no `import React` needed |
| Build     | Vite         | 7.3.x                           | Requires `lightningcss`                     |
| CSS       | TailwindCSS  | 3.4.x                           | v3 config format (not v4 `@import` syntax)  |
| UI        | MUI          | 7.3.x                           | Material Design 3 components                |
| State     | Zustand      | 5.0.x                           | API unchanged from v4                       |
| Router    | React Router | 7.13.x                          | v7 data router API                          |
| Backend   | Firebase     | 12.9.x                          | Modular tree-shakable SDK                   |
| Test      | Vitest       | 4.0.x                           | Drop-in Jest replacement                    |
| Deploy    | Netlify      | —                               | Primary target                              |
