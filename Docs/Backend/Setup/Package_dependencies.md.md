# FlowGateX — Package Dependencies Reference

> Complete inventory of all npm packages used in FlowGateX, organized by category with version, purpose, and usage context.

---

## Table of Contents

1. [Root Project Dependencies](#root-project-dependencies)
2. [Root Dev Dependencies](#root-dev-dependencies)
3. [Cloud Functions Dependencies](#cloud-functions-dependencies)
4. [Dependency Graph](#dependency-graph)
5. [Update & Maintenance](#update--maintenance)

---

## Root Project Dependencies

### UI Framework & Rendering

| Package            | Version | Purpose                                              |
| ------------------ | ------- | ---------------------------------------------------- |
| `react`            | ^19.2.4 | Core UI library (React 19 with concurrent features)  |
| `react-dom`        | ^19.2.4 | DOM renderer for React                               |
| `react-router-dom` | ^7.13.0 | Client-side routing with data loaders, nested routes |

### Component Libraries

| Package               | Version  | Purpose                                                        |
| --------------------- | -------- | -------------------------------------------------------------- |
| `@mui/material`       | ^7.3.8   | Material UI component library (buttons, dialogs, tables, etc.) |
| `@mui/icons-material` | ^7.3.8   | Material Design icons as React components                      |
| `@emotion/react`      | ^11.14.0 | CSS-in-JS runtime (MUI peer dependency)                        |
| `@emotion/styled`     | ^11.14.1 | Styled component API for Emotion                               |
| `lucide-react`        | ^0.564.0 | Modern icon library (used alongside MUI icons)                 |

### State Management

| Package                 | Version  | Purpose                                                                    |
| ----------------------- | -------- | -------------------------------------------------------------------------- |
| `zustand`               | ^5.0.11  | Lightweight state manager — 5 stores: auth, theme, sidebar, cart, settings |
| `@tanstack/react-query` | ^5.90.21 | Server state management, data fetching, caching, mutations                 |

### Animation & Motion

| Package           | Version  | Purpose                                                     |
| ----------------- | -------- | ----------------------------------------------------------- |
| `framer-motion`   | ^11.18.2 | Declarative animations, page transitions, layout animations |
| `canvas-confetti` | ^1.9.4   | Confetti effect on booking success page                     |

### Forms & Validation

| Package               | Version  | Purpose                                                                  |
| --------------------- | -------- | ------------------------------------------------------------------------ |
| `react-hook-form`     | ^7.71.1  | Performant form management with uncontrolled inputs                      |
| `@hookform/resolvers` | ^5.2.2   | Schema validation resolvers (bridges react-hook-form ↔ Zod)              |
| `zod`                 | ^3.25.76 | TypeScript-first schema validation (login, registration, event creation) |

### Firebase (Backend-as-a-Service)

| Package    | Version | Purpose                                                            |
| ---------- | ------- | ------------------------------------------------------------------ |
| `firebase` | ^12.9.0 | Firebase JS SDK — Auth, Firestore, Storage, Realtime DB, App Check |

### Payment Processing

| Package    | Version | Purpose                                       |
| ---------- | ------- | --------------------------------------------- |
| `razorpay` | ^2.9.6  | Razorpay payment gateway SDK (client + types) |

### Data & Networking

| Package   | Version  | Purpose                                                         |
| --------- | -------- | --------------------------------------------------------------- |
| `axios`   | ^1.13.5  | HTTP client with interceptors (token injection, error handling) |
| `fuse.js` | ^7.1.0   | Fuzzy search for event discovery (client-side)                  |
| `dayjs`   | ^1.11.19 | Lightweight date formatting and manipulation                    |

### Charting & Visualization

| Package           | Version | Purpose                                          |
| ----------------- | ------- | ------------------------------------------------ |
| `chart.js`        | ^4.5.1  | Canvas-based charting library                    |
| `react-chartjs-2` | ^5.3.1  | React wrapper for Chart.js (dashboard analytics) |

### QR & Document Generation

| Package        | Version | Purpose                                                    |
| -------------- | ------- | ---------------------------------------------------------- |
| `qrcode.react` | ^4.2.0  | QR code generator as React component (ticket rendering)    |
| `html5-qrcode` | ^2.3.8  | Camera-based QR code scanner (organizer ticket validation) |
| `jspdf`        | ^4.1.0  | PDF generation for ticket downloads                        |
| `html2canvas`  | ^1.4.1  | Screenshot DOM elements to canvas (for PDF rendering)      |

### Maps

| Package                  | Version | Purpose                                               |
| ------------------------ | ------- | ----------------------------------------------------- |
| `@react-google-maps/api` | ^2.20.8 | Google Maps integration for venue display & selection |

### Calendar

| Package | Version | Purpose                                                    |
| ------- | ------- | ---------------------------------------------------------- |
| `ics`   | ^3.8.1  | Generate .ics calendar files for "Add to Calendar" feature |

### Utilities

| Package          | Version   | Purpose                                                                    |
| ---------------- | --------- | -------------------------------------------------------------------------- |
| `clsx`           | ^2.1.1    | Conditional className builder                                              |
| `tailwind-merge` | ^3.4.1    | Merge Tailwind classes without conflicts (used with `clsx` in `cn()` util) |
| `sweetalert2`    | ^11.26.18 | Beautiful popup dialogs (confirmations, alerts)                            |

---

## Root Dev Dependencies

### Build Toolchain

| Package                | Version | Purpose                                                       |
| ---------------------- | ------- | ------------------------------------------------------------- |
| `vite`                 | ^7.3.1  | Next-gen build tool (dev server, HMR, bundling)               |
| `@vitejs/plugin-react` | ^5.1.4  | React Fast Refresh + JSX transform for Vite                   |
| `vite-tsconfig-paths`  | ^6.1.1  | Resolve TypeScript path aliases in Vite                       |
| `vite-plugin-pwa`      | ^1.2.0  | PWA support (service worker, manifest generation via Workbox) |
| `lightningcss`         | ^1.31.1 | CSS minification and transformation (Vite 7 requirement)      |

### TypeScript

| Package                  | Version  | Purpose                          |
| ------------------------ | -------- | -------------------------------- |
| `typescript`             | ~5.9.3   | TypeScript compiler              |
| `@types/react`           | ^19.2.14 | React type definitions           |
| `@types/react-dom`       | ^19.2.3  | ReactDOM type definitions        |
| `@types/node`            | ^25.2.3  | Node.js type definitions         |
| `@types/canvas-confetti` | ^1.9.0   | Canvas-confetti type definitions |

### CSS Processing

| Package        | Version  | Purpose                                              |
| -------------- | -------- | ---------------------------------------------------- |
| `tailwindcss`  | ^3.4.17  | Utility-first CSS framework (v3, downgraded from v4) |
| `postcss`      | ^8.5.6   | CSS transformer pipeline                             |
| `autoprefixer` | ^10.4.24 | Auto-add vendor prefixes                             |

### Linting & Formatting

| Package                       | Version | Purpose                              |
| ----------------------------- | ------- | ------------------------------------ |
| `eslint`                      | ^9.27.0 | JavaScript/TypeScript linter         |
| `@eslint/js`                  | ^9.19.0 | ESLint core JS config                |
| `typescript-eslint`           | ^8.55.0 | TypeScript ESLint parser + rules     |
| `eslint-plugin-react-hooks`   | ^7.0.1  | Enforce Rules of Hooks               |
| `eslint-plugin-react-refresh` | ^0.5.0  | Validate React Fast Refresh patterns |
| `prettier`                    | ^3.8.1  | Opinionated code formatter           |

### Testing

| Package                       | Version  | Purpose                                       |
| ----------------------------- | -------- | --------------------------------------------- |
| `vitest`                      | ^4.0.18  | Vite-native test runner (Jest-compatible API) |
| `jsdom`                       | ^28.1.0  | DOM environment for testing                   |
| `@testing-library/react`      | ^16.3.2  | React component testing utilities             |
| `@testing-library/jest-dom`   | ^6.9.1   | Custom DOM matchers for assertions            |
| `@testing-library/user-event` | ^14.6.1  | Simulate user interactions in tests           |
| `msw`                         | ^2.12.10 | Mock Service Worker for API mocking           |

### Git Hooks

| Package       | Version | Purpose                                           |
| ------------- | ------- | ------------------------------------------------- |
| `husky`       | ^9.1.7  | Git hook manager (runs lint-staged on pre-commit) |
| `lint-staged` | ^16.2.7 | Run linters on staged files only                  |

---

## Cloud Functions Dependencies

Located in `functions/package.json` — deployed independently to Firebase Cloud Functions.

### Runtime Dependencies

| Package              | Version | Purpose                                                           |
| -------------------- | ------- | ----------------------------------------------------------------- |
| `firebase-admin`     | ^13.6.1 | Firebase Admin SDK (server-side Firestore, Auth)                  |
| `firebase-functions` | ^7.0.5  | Cloud Functions framework (HTTP triggers, Firestore triggers)     |
| `razorpay`           | ^2.9.6  | Razorpay server-side SDK (order creation, signature verification) |
| `cors`               | ^2.8.5  | CORS middleware for HTTP functions                                |
| `dotenv`             | ^16.5.0 | Load `.env` files in local development                            |

### Dev Dependencies

| Package       | Version | Purpose                           |
| ------------- | ------- | --------------------------------- |
| `typescript`  | ~5.7.3  | TypeScript compiler for functions |
| `@types/cors` | ^2.8.19 | CORS type definitions             |

---

## Dependency Graph

```
FlowGateX Root
├── react 19 ──────────────> react-dom, react-router-dom
├── firebase 12 ───────────> Auth, Firestore, Storage, RTDB, App Check
├── @mui/material 7 ──────> @emotion/react, @emotion/styled
├── zustand 5 ─────────────> (standalone, no dependencies)
├── @tanstack/react-query 5 > (standalone)
├── react-hook-form 7 ────> @hookform/resolvers → zod
├── vite 7 ────────────────> @vitejs/plugin-react, vite-tsconfig-paths
│                            vite-plugin-pwa, lightningcss
├── tailwindcss 3 ─────────> postcss, autoprefixer
├── chart.js 4 ────────────> react-chartjs-2
├── eslint 9 ──────────────> typescript-eslint, react-hooks, react-refresh
├── vitest 4 ──────────────> jsdom, @testing-library/*
└── husky 9 ───────────────> lint-staged

FlowGateX Functions
├── firebase-admin 13 ─────> (server-side Firestore/Auth)
├── firebase-functions 7 ──> (Cloud Functions runtime)
├── razorpay 2 ────────────> (payment processing)
└── cors 2 ────────────────> (HTTP middleware)
```

---

## Update & Maintenance

### Check for Outdated Packages

```bash
# Root project
npm outdated

# Cloud Functions
cd functions && npm outdated
```

### Update Strategy

| Type           | Command                    | Risk |
| -------------- | -------------------------- | ---- |
| Patch updates  | `npm update`               | Low  |
| Minor updates  | `npm update`               | Low  |
| Major updates  | `npm install <pkg>@latest` | High |
| Security fixes | `npm audit fix`            | Low  |
| Full audit     | `npm audit`                | —    |

### Known Compatibility Notes

- **TailwindCSS**: Pinned to v3.4.x — v4 uses a different configuration model (`@import "tailwindcss"` syntax) that is incompatible with the current `tailwind.config.js` setup
- **Vite 7**: Requires `lightningcss` as an explicit dependency for CSS processing
- **React 19**: Uses the new JSX transform — no `import React` needed in components
- **TypeScript 5.9**: Functions use `~5.7.3` (slightly older) for Cloud Functions compatibility
- **Firebase 12**: Uses modular SDK (tree-shakable imports like `import { getFirestore } from 'firebase/firestore'`)
