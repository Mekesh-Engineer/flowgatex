# FlowGateX — Netlify Deployment Setup

> Step-by-step guide for deploying FlowGateX to Netlify, including build configuration, environment variables, custom headers, and alternative deployment targets.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Netlify Project Setup](#netlify-project-setup)
3. [Build Configuration](#build-configuration)
4. [Environment Variables](#environment-variables)
5. [SPA Routing & Redirects](#spa-routing--redirects)
6. [Security Headers](#security-headers)
7. [Caching Strategy](#caching-strategy)
8. [Context-Specific Builds](#context-specific-builds)
9. [Alternative Deployments (Vercel / Docker)](#alternative-deployments)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Requirement      | Version | Purpose                          |
| ---------------- | ------- | -------------------------------- |
| Node.js          | ≥ 20.x  | Build runtime                    |
| npm              | ≥ 10.x  | Package manager                  |
| Netlify CLI      | Latest  | Local dev & deploy commands      |
| Git              | Latest  | Version control (Netlify tracks) |
| Firebase Project | Active  | Backend services                 |

### Install Netlify CLI

```bash
npm install -g netlify-cli
netlify login
```

---

## Netlify Project Setup

### 1. Link Repository

```bash
# In the project root
netlify init

# Or link to an existing Netlify site
netlify link
```

### 2. Connect Git Repository

- Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
- Select your Git provider (GitHub / GitLab / Bitbucket)
- Choose the `flowgatex` repository
- Netlify auto-detects the `netlify.toml` configuration

---

## Build Configuration

The project uses `netlify.toml` at the repository root:

```toml
[build]
  command = "npm run build"    # Runs: tsc -b && vite build
  publish = "dist"             # Output directory
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "20"
  NPM_VERSION = "10"
  VITE_ENV = "production"
  VITE_MOCK_MODE = "false"
```

### Build Pipeline

```
Netlify triggers build →
  npm install (auto) →
    tsc -b (TypeScript compilation, type checking) →
      vite build (bundle, tree-shake, minify) →
        Output to dist/ →
          Netlify deploys dist/ to CDN
```

### Expected Build Output

| Metric        | Value                          |
| ------------- | ------------------------------ |
| Total modules | ~3,624                         |
| CSS bundle    | ~260 KB                        |
| JS chunks     | Code-split (lazy-loaded pages) |
| Build time    | ~30–60 seconds                 |

---

## Environment Variables

### Public Firebase Config (safe to include in `netlify.toml`)

These are client-side Firebase configuration values — they are **not secrets**:

| Variable                            | Description           |
| ----------------------------------- | --------------------- |
| `VITE_FIREBASE_API_KEY`             | Firebase API key      |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Auth domain           |
| `VITE_FIREBASE_DATABASE_URL`        | Realtime Database URL |
| `VITE_FIREBASE_PROJECT_ID`          | Project ID            |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Storage bucket        |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID         |
| `VITE_FIREBASE_APP_ID`              | App ID                |
| `VITE_FIREBASE_MEASUREMENT_ID`      | Analytics measurement |
| `VITE_APP_NAME`                     | Application name      |
| `VITE_ENABLE_PWA`                   | Enable PWA features   |

### Secret Variables (set in Netlify Dashboard ONLY)

Go to **Site settings → Environment variables** and add:

| Variable                   | Description                       |
| -------------------------- | --------------------------------- |
| `RAZORPAY_KEY_SECRET`      | Razorpay secret key (server-side) |
| `VITE_RAZORPAY_KEY_ID`     | Razorpay publishable key          |
| `CASHFREE_SECRET_KEY`      | Cashfree secret (if using)        |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps JS API key            |

> **Warning:** Never commit secret keys to `netlify.toml` or any version-controlled file.

---

## SPA Routing & Redirects

FlowGateX is a Single Page Application — all routes must resolve to `index.html`:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

This catches all client-side routes (`/events/:id`, `/dashboard`, `/admin`, etc.) and lets React Router handle them.

---

## Security Headers

The `netlify.toml` configures comprehensive security headers for all responses:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
    Content-Security-Policy = "default-src 'self'; ..."
```

### CSP Breakdown

| Directive     | Allowed Sources                                     |
| ------------- | --------------------------------------------------- |
| `script-src`  | self, inline, eval, Google APIs, Firebase, Razorpay |
| `style-src`   | self, inline, Google Fonts, Unpkg                   |
| `font-src`    | self, Google Fonts (gstatic)                        |
| `img-src`     | self, data:, https:, blob:                          |
| `connect-src` | self, Firebase services, Google APIs, Razorpay      |
| `frame-src`   | self, Firebase Auth, Google Accounts, Razorpay      |

---

## Caching Strategy

### Static Assets (1 year, immutable)

```toml
[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

Vite generates content-hashed filenames (e.g., `index-abc123.js`), making immutable caching safe — a new hash is generated on every change.

---

## Context-Specific Builds

Netlify supports different configurations per deploy context:

| Context            | `VITE_ENV`    | Debug | Analytics | Mock Mode |
| ------------------ | ------------- | ----- | --------- | --------- |
| **Production**     | `production`  | Off   | On        | Off       |
| **Deploy Preview** | `staging`     | On    | Off       | Off       |
| **Branch Deploy**  | `development` | On    | Off       | Off       |

```toml
[context.production]
  environment = { VITE_ENABLE_ANALYTICS = "true", VITE_ENABLE_DEBUG = "false" }

[context.deploy-preview]
  environment = { VITE_ENV = "staging", VITE_ENABLE_DEBUG = "true" }

[context.branch-deploy]
  environment = { VITE_ENV = "development", VITE_ENABLE_DEBUG = "true" }
```

---

## Alternative Deployments

### Vercel

FlowGateX includes `vercel.json` for Vercel deployment:

```bash
npm i -g vercel
vercel
```

Key config in `vercel.json`:

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- SPA rewrites: `"source": "/(.*)"` → `/index.html`

### Docker

```bash
# Build image
npm run docker:build
# or: docker build -t flowgatex:latest .

# Run container
npm run docker:run
# or: docker run -d -p 80:80 --name flowgatex flowgatex:latest

# Stop
npm run docker:stop
```

The Dockerfile uses a multi-stage build:

1. **Build stage**: Node 20 Alpine → `npm ci` → `npm run build`
2. **Production stage**: Nginx Alpine → copies `dist/` → serves via `nginx.conf`

---

## Troubleshooting

### Build Fails with "Cannot find module"

```bash
# Clear Netlify build cache
netlify build --clear
```

### TypeScript Errors During Build

The build runs `tsc -b` before `vite build`. Fix type errors locally first:

```bash
npm run type-check
```

### Environment Variable Not Available in App

- Ensure the variable is prefixed with `VITE_` (required for Vite to expose it to client code)
- Check that the variable is set in the correct deploy context
- Redeploy after adding new variables

### Large Bundle Size

```bash
# Analyze bundle
npm run analyze
```

FlowGateX uses code splitting — each page is lazy-loaded. If bundle size is unexpectedly large, check for accidental barrel imports.

### Local Development with Netlify

```bash
# Start local dev with Netlify environment
netlify dev

# Or use Vite directly
npm run dev
```

---

## Deploy Checklist

- [ ] All environment variables set in Netlify Dashboard
- [ ] Firebase security rules deployed (`firebase deploy --only firestore:rules,storage`)
- [ ] Cloud Functions deployed (`cd functions && npm run deploy`)
- [ ] Build passes locally (`npm run build`)
- [ ] Type check passes (`npm run type-check`)
- [ ] Tests pass (`npm test`)
- [ ] CSP headers allow all required external domains
- [ ] SPA redirect rule active (`/* → /index.html`)
- [ ] PWA manifest and service worker configured
- [ ] Custom domain (if applicable) with HTTPS
