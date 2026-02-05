# FlowGateX Deployment Checklist

## Pre-Deployment Checklist

### 1. Code Quality ✓

- [x] All TypeScript type definitions updated
- [x] Enhanced API client with error handling
- [x] Environment validation implemented
- [ ] Run linting: `npm run lint`
- [ ] Run type checking: `npm run type-check`
- [ ] Check formatting: `npm run format:check`

### 2. Environment Configuration

- [ ] Copy `.env.example` to `.env.local`
- [ ] Set Firebase configuration variables
- [ ] Set Razorpay/payment gateway keys
- [ ] Set Google Maps API key (if used)
- [ ] Configure feature flags
- [ ] Set Sentry DSN (optional)

#### Required Environment Variables:

```bash
# Firebase (REQUIRED)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Payments (REQUIRED for booking)
VITE_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Application
VITE_APP_URL=https://flowgatex.com
VITE_API_BASE_URL=https://api.flowgatex.com
VITE_ENV=production
```

### 3. Security Configuration ✓

- [x] Vercel.json security headers configured
- [x] CSP headers implemented
- [x] Firebase security rules created
- [x] Storage security rules created
- [ ] Deploy Firestore rules: `firebase deploy --only firestore:rules`
- [ ] Deploy Storage rules: `firebase deploy --only storage:rules`

### 4. Build & Test

- [ ] Build the application: `npm run build`
- [ ] Preview the build: `npm run preview`
- [ ] Test production build locally
- [ ] Check bundle size: `npm run analyze` (if package installed)

### 5. Performance Optimization ✓

- [x] Code splitting configured
- [x] PWA service worker setup
- [x] Static asset caching enabled
- [x] Image optimization strategy documented
- [ ] Verify Lighthouse score > 90

---

## Deployment Options

### Option 1: Vercel (Recommended) ✓

#### Initial Setup:

1. Install Vercel CLI:

   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:

   ```bash
   vercel login
   ```

3. Link project (first time):

   ```bash
   vercel link
   ```

4. Add environment variables:

   ```bash
   vercel env add VITE_FIREBASE_API_KEY
   vercel env add VITE_FIREBASE_PROJECT_ID
   # ... add all required variables
   ```

5. Deploy:
   ```bash
   vercel --prod
   ```

#### GitHub Integration (Automatic Deployments):

- [ ] Connect GitHub repository to Vercel
- [ ] Configure environment variables in Vercel dashboard
- [ ] Set up GitHub secrets for CI/CD:
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`
  - All Firebase variables
  - Payment gateway keys

**CI/CD configured**: `.github/workflows/deploy.yml` ✓

---

### Option 2: Netlify ✓

#### Setup:

1. Install Netlify CLI:

   ```bash
   npm install -g netlify-cli
   ```

2. Login:

   ```bash
   netlify login
   ```

3. Initialize:

   ```bash
   netlify init
   ```

4. Deploy:
   ```bash
   netlify deploy --prod
   ```

**Configuration file**: `netlify.toml` ✓

---

### Option 3: Firebase Hosting ✓

#### Setup:

1. Install Firebase CLI:

   ```bash
   npm install -g firebase-tools
   ```

2. Login:

   ```bash
   firebase login
   ```

3. Initialize hosting:

   ```bash
   firebase init hosting
   ```

4. Deploy:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

**Configuration file**: `firebase.json` ✓

---

### Option 4: Docker Deployment ✓

#### Development:

```bash
# Build image
npm run docker:build

# Run container
npm run docker:run

# Stop container
npm run docker:stop
```

#### Production with Docker Compose:

```bash
# Start all services
npm run docker:compose

# Stop all services
npm run docker:compose:down

# Full stack (with PostgreSQL & Redis)
docker-compose -f docker-compose.full.yml up -d
```

**Files created**:

- `Dockerfile` ✓
- `docker-compose.yml` ✓
- `docker-compose.full.yml` ✓
- `nginx.conf` ✓

---

## Post-Deployment Verification

### 1. Functionality Tests

- [ ] Homepage loads correctly
- [ ] User authentication works (login/register)
- [ ] Events page displays events
- [ ] Event details page loads
- [ ] Booking flow works
- [ ] Payment integration functional
- [ ] User dashboard accessible
- [ ] Organizer dashboard functional (if applicable)

### 2. Security Checks

- [ ] HTTPS enabled
- [ ] Security headers present (check browser DevTools)
- [ ] CSP not blocking required resources
- [ ] Firebase rules protecting sensitive data
- [ ] No exposed API keys in client code

### 3. Performance Tests

- [ ] Lighthouse score
  - Performance: > 90
  - Accessibility: > 90
  - Best Practices: > 90
  - SEO: > 90
- [ ] Time to First Byte (TTFB) < 600ms
- [ ] First Contentful Paint (FCP) < 1.8s
- [ ] Largest Contentful Paint (LCP) < 2.5s

### 4. SEO Verification

- [ ] Sitemap accessible at `/sitemap.xml`
- [ ] Robots.txt configured at `/robots.txt`
- [ ] Meta tags present on all pages
- [ ] Open Graph tags for social sharing
- [ ] Structured data implemented (if applicable)

### 5. Monitoring Setup

- [ ] Vercel Analytics enabled (if using Vercel)
- [ ] Google Analytics configured (optional)
- [ ] Sentry error tracking active (optional)
- [ ] Firebase Analytics working

---

## Rollback Plan

### If deployment fails:

#### Vercel:

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

#### Netlify:

```bash
# View deployment history
netlify deploy:list

# Restore specific deployment
netlify deploy:restore [deploy-id]
```

#### Docker:

```bash
# Stop current container
docker stop flowgatex

# Run previous image version
docker run -d -p 80:80 --name flowgatex flowgatex:previous-tag
```

---

## Maintenance Tasks

### Regular (Weekly):

- [ ] Check error logs
- [ ] Monitor performance metrics
- [ ] Review user feedback

### Monthly:

- [ ] Update dependencies: `npm update`
- [ ] Security audit: `npm audit`
- [ ] Review analytics data
- [ ] Optimize database queries

### Quarterly:

- [ ] Major dependency updates
- [ ] Performance optimization review
- [ ] Security review
- [ ] Backup verification

---

## Quick Reference Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run preview                # Preview production build

# Quality
npm run lint                   # Run ESLint
npm run type-check             # TypeScript check
npm run format                 # Format code
npm run format:check           # Check formatting

# Deployment
vercel --prod                  # Deploy to Vercel
netlify deploy --prod          # Deploy to Netlify
firebase deploy --only hosting # Deploy to Firebase

# Docker
npm run docker:build           # Build Docker image
npm run docker:run             # Run container
npm run docker:compose         # Start with compose
```

---

## Support & Documentation

- **API Documentation**: `Docs/API_DOCUMENTATION.md`
- **Deployment Guide**: `Docs/DEPLOYMENT_GUIDE.md`
- **Update Summary**: `CODEBASE_UPDATE_SUMMARY.md`
- **Vercel Docs**: https://vercel.com/docs
- **Firebase Docs**: https://firebase.google.com/docs

---

**Checklist Version**: 1.0.0  
**Last Updated**: February 4, 2026  
**Status**: Ready for Deployment ✓
