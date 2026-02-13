# FlowGateX Deployment Guide

Complete guide for deploying FlowGateX on various platforms with optimization strategies.

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Vercel Deployment](#vercel-deployment-recommended)
3. [Netlify Deployment](#netlify-deployment)
4. [Firebase Hosting](#firebase-hosting)
5. [Docker Deployment](#docker-deployment)
6. [AWS Deployment](#aws-deployment)
7. [Environment Configuration](#environment-configuration)
8. [Performance Optimization](#performance-optimization)
9. [Security Hardening](#security-hardening)
10. [Monitoring & Analytics](#monitoring--analytics)
11. [CI/CD Pipeline](#cicd-pipeline)
12. [Troubleshooting](#troubleshooting)

---

## ✅ Pre-Deployment Checklist

### Code Quality

- [ ] All TypeScript errors resolved
- [ ] ESLint warnings fixed
- [ ] Code formatted with Prettier
- [ ] No console.log statements in production code
- [ ] All tests passing

```bash
# Run quality checks
npm run lint
npm run type-check
npm run format
npm run test
```

### Security

- [ ] Environment variables secured
- [ ] API keys not committed to repository
- [ ] Firebase Security Rules configured
- [ ] CORS policies set
- [ ] CSP headers configured
- [ ] Rate limiting implemented

### Performance

- [ ] Images optimized (WebP format)
- [ ] Code splitting implemented
- [ ] Lazy loading configured
- [ ] Bundle size analyzed
- [ ] Lighthouse score > 90

```bash
# Check bundle size
npm run build
npm run analyze
```

### SEO & Accessibility

- [ ] Meta tags configured
- [ ] robots.txt created
- [ ] sitemap.xml generated
- [ ] ARIA labels added
- [ ] Alt text for images

---

## 🚀 Vercel Deployment (Recommended)

### Why Vercel?

✅ Zero-config deployment for Vite  
✅ Automatic HTTPS  
✅ Global CDN (300+ edge locations)  
✅ Automatic preview deployments  
✅ Built-in analytics  
✅ Serverless functions support  

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Project Configuration

Create `vercel.json` in project root:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "regions": ["bom1", "sin1", "hnd1"],
  "env": {
    "VITE_FIREBASE_API_KEY": "@firebase-api-key",
    "VITE_FIREBASE_PROJECT_ID": "@firebase-project-id",
    "VITE_RAZORPAY_KEY_ID": "@razorpay-key-id"
  },
  "build": {
    "env": {
      "NODE_ENV": "production"
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://www.googletagmanager.com https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.firebaseio.com https://firestore.googleapis.com https://api.razorpay.com"
        }
      ]
    },
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "redirects": [
    {
      "source": "/home",
      "destination": "/",
      "permanent": true
    }
  ]
}
```

### Step 4: Configure Environment Variables

**Option A: Via Vercel CLI**

```bash
vercel env add VITE_FIREBASE_API_KEY
# Paste your API key when prompted
# Select environments: Production, Preview, Development

vercel env add VITE_FIREBASE_AUTH_DOMAIN
vercel env add VITE_FIREBASE_PROJECT_ID
vercel env add VITE_FIREBASE_STORAGE_BUCKET
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
vercel env add VITE_FIREBASE_APP_ID

vercel env add VITE_RAZORPAY_KEY_ID
vercel env add RAZORPAY_KEY_SECRET
```

**Option B: Via Vercel Dashboard**

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to Settings → Environment Variables
4. Add each variable with appropriate scope

### Step 5: Deploy

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

### Step 6: Custom Domain (Optional)

```bash
# Add custom domain
vercel domains add flowgatex.com

# Add www subdomain
vercel domains add www.flowgatex.com
```

### Step 7: GitHub Integration

1. Go to Vercel Dashboard → Import Project
2. Select GitHub repository
3. Configure build settings (auto-detected)
4. Deploy

**Automatic Deployments:**
- Push to `main` → Production deployment
- Pull requests → Preview deployments
- Each commit gets unique URL

### Vercel Configuration for Vite

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'firebase-storage',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
    }),
  ],
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-vendor': ['@mui/material', '@emotion/react', '@emotion/styled'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'state-vendor': ['@reduxjs/toolkit', 'react-redux', 'zustand', '@tanstack/react-query'],
          'chart-vendor': ['recharts'],
          'form-vendor': ['react-hook-form', 'zod'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false, // Disable in production
  },
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
});
```

---

## 🌐 Netlify Deployment

### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Step 2: Create `netlify.toml`

```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "20"
  NPM_VERSION = "10"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[dev]
  command = "npm run dev"
  port = 3000
  publish = "dist"
```

### Step 3: Deploy

```bash
# Login
netlify login

# Initialize project
netlify init

# Deploy to production
netlify deploy --prod
```

### Step 4: Environment Variables

```bash
netlify env:set VITE_FIREBASE_API_KEY "your_api_key"
netlify env:set VITE_FIREBASE_PROJECT_ID "your_project_id"
# ... add all other variables
```

---

## 🔥 Firebase Hosting

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Login and Initialize

```bash
firebase login
firebase init hosting
```

### Step 3: Configure `firebase.json`

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

### Step 4: Deploy

```bash
# Build the project
npm run build

# Deploy
firebase deploy --only hosting

# Deploy with custom message
firebase deploy --only hosting -m "Version 1.2.0 - Bug fixes"
```

### Step 5: Custom Domain

```bash
firebase hosting:channel:create live
firebase hosting:channel:deploy live
```

---

## 🐳 Docker Deployment

### Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (if needed)
    location /api {
        proxy_pass http://backend:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "80:80"
      - "443:443"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    restart: unless-stopped
    networks:
      - flowgatex-network

networks:
  flowgatex-network:
    driver: bridge
```

### Build and Run

```bash
# Build image
docker build -t flowgatex:latest .

# Run container
docker run -d -p 80:80 --name flowgatex flowgatex:latest

# Using docker-compose
docker-compose up -d

# View logs
docker logs -f flowgatex

# Stop container
docker stop flowgatex
```

---

## ☁️ AWS Deployment

### Option 1: AWS Amplify

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure Amplify
amplify configure

# Initialize project
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish
```

### Option 2: AWS S3 + CloudFront

**Step 1: Build Project**

```bash
npm run build
```

**Step 2: Create S3 Bucket**

```bash
aws s3 mb s3://flowgatex-app
```

**Step 3: Upload Files**

```bash
aws s3 sync dist/ s3://flowgatex-app --delete
```

**Step 4: Configure Bucket for Static Website**

```bash
aws s3 website s3://flowgatex-app \
  --index-document index.html \
  --error-document index.html
```

**Step 5: Create CloudFront Distribution**

```json
{
  "Origins": [{
    "Id": "S3-flowgatex-app",
    "DomainName": "flowgatex-app.s3.amazonaws.com",
    "S3OriginConfig": {
      "OriginAccessIdentity": ""
    }
  }],
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-flowgatex-app",
    "ViewerProtocolPolicy": "redirect-to-https",
    "Compress": true
  },
  "CustomErrorResponses": [{
    "ErrorCode": 404,
    "ResponseCode": 200,
    "ResponsePagePath": "/index.html"
  }]
}
```

### Option 3: AWS EC2

```bash
# Connect to EC2
ssh -i your-key.pem ec2-user@your-ec2-ip

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Clone repository
git clone https://github.com/yourusername/flowgatex.git
cd flowgatex

# Install dependencies
npm install

# Build
npm run build

# Install PM2
sudo npm install -g pm2

# Serve with PM2
pm2 serve dist 3000 --spa --name flowgatex

# Save PM2 configuration
pm2 save
pm2 startup
```

---

## ⚙️ Environment Configuration

### Development Environment

Create `.env.local`:

```env
# Firebase
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=flowgatex-dev.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=flowgatex-dev
VITE_FIREBASE_STORAGE_BUCKET=flowgatex-dev.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# Razorpay (Test Keys)
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=secret_test_xxxxx

# Maps (Leaflet + OpenStreetMap)
# No API key required

# App Config
VITE_APP_URL=http://localhost:3000
VITE_API_BASE_URL=http://localhost:3000/api
VITE_ENV=development

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_CHATBOT=true
VITE_ENABLE_DEBUG=true
```

### Production Environment

Create `.env.production`:

```env
# Firebase (Production)
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=flowgatex.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=flowgatex-prod
VITE_FIREBASE_STORAGE_BUCKET=flowgatex-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=987654321
VITE_FIREBASE_APP_ID=1:987654321:web:zyxwvu

# Razorpay (Live Keys)
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=secret_live_xxxxx

# Maps (Leaflet + OpenStreetMap)
# No API key required

# App Config
VITE_APP_URL=https://flowgatex.com
VITE_API_BASE_URL=https://api.flowgatex.com
VITE_ENV=production

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_CHATBOT=true
VITE_ENABLE_DEBUG=false
```

### Environment Validation

```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  VITE_FIREBASE_API_KEY: z.string().min(1),
  VITE_FIREBASE_PROJECT_ID: z.string().min(1),
  VITE_RAZORPAY_KEY_ID: z.string().min(1),
  VITE_APP_URL: z.string().url(),
  // ... all other env variables
});

export function validateEnv() {
  try {
    envSchema.parse(import.meta.env);
    console.log('✅ Environment variables validated');
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    process.exit(1);
  }
}
```

---

## ⚡ Performance Optimization

### 1. Code Splitting

```typescript
// Lazy load routes
const EventsPage = lazy(() => import('@/pages/events/EventsPage'));
const CheckoutPage = lazy(() => import('@/pages/booking/CheckoutPage'));
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'));

// Preload critical routes
const preloadDashboard = () => import('@/pages/dashboard/Dashboard');

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/events" element={<EventsPage />} />
        <Route 
          path="/dashboard" 
          element={<Dashboard />}
          loader={preloadDashboard}
        />
      </Routes>
    </Suspense>
  );
}
```

### 2. Image Optimization

```typescript
// Use next-gen formats
<picture>
  <source srcSet="event.webp" type="image/webp" />
  <source srcSet="event.jpg" type="image/jpeg" />
  <img src="event.jpg" alt="Event" loading="lazy" />
</picture>

// Implement responsive images
<img
  src="event-small.jpg"
  srcSet="event-small.jpg 480w, event-medium.jpg 800w, event-large.jpg 1200w"
  sizes="(max-width: 600px) 480px, (max-width: 900px) 800px, 1200px"
  alt="Event"
/>
```

### 3. Cache Strategy

```typescript
// Service Worker caching
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'image',
  new workbox.strategies.CacheFirst({
    cacheName: 'images',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);
```

### 4. Bundle Analysis

```bash
# Install bundle analyzer
npm install -D rollup-plugin-visualizer

# Add to vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});

# Build and analyze
npm run build
```

---

## 🛡️ Security Hardening

### 1. Content Security Policy

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    headers: {
      'Content-Security-Policy': `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://unpkg.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com;
        font-src 'self' https://fonts.gstatic.com;
        img-src 'self' data: https:;
        connect-src 'self' https://*.firebaseio.com https://firestore.googleapis.com;
      `.replace(/\s+/g, ' ').trim(),
    },
  },
});
```

### 2. Environment Variables Security

```typescript
// Never expose secrets in client code
// ❌ Bad
const secret = import.meta.env.RAZORPAY_KEY_SECRET;

// ✅ Good - Keep secrets server-side only
// Use serverless functions for sensitive operations
```

### 3. Firebase Security Rules

```javascript
// Firestore rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isOrganizer() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'organizer';
    }
    
    // Users
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }
    
    // Events
    match /events/{eventId} {
      allow read: if true;
      allow create: if isAuthenticated() && isOrganizer();
      allow update, delete: if isAuthenticated() && 
        resource.data.organizerId == request.auth.uid;
    }
    
    // Bookings
    match /bookings/{bookingId} {
      allow read: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated();
      allow update: if false; // Only through cloud functions
    }
  }
}
```

### 4. Rate Limiting

```typescript
// middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Limit login attempts
  message: 'Too many login attempts, please try again later.',
});
```

---

## 📊 Monitoring & Analytics

### 1. Vercel Analytics

```typescript
// Add to main.tsx
import { Analytics } from '@vercel/analytics/react';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>
);
```

### 2. Firebase Analytics

```typescript
// lib/analytics.ts
import { logEvent, getAnalytics } from 'firebase/analytics';

const analytics = getAnalytics(app);

export const trackEvent = (eventName: string, params?: any) => {
  logEvent(analytics, eventName, params);
};

// Usage
trackEvent('event_viewed', {
  event_id: 'event_123',
  event_title: 'Summer Festival',
});
```

### 3. Error Tracking (Sentry)

```bash
npm install @sentry/react @sentry/vite-plugin
```

```typescript
// main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_ENV,
  tracesSampleRate: 1.0,
});

// Error boundary
<Sentry.ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</Sentry.ErrorBoundary>
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  quality-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run tests
        run: npm run test

  build-and-deploy:
    needs: quality-checks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_RAZORPAY_KEY_ID: ${{ secrets.VITE_RAZORPAY_KEY_ID }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
      
      - name: Notify deployment
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
          -H 'Content-Type: application/json' \
          -d '{"text":"✅ FlowGateX deployed successfully!"}'
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Build Fails

```bash
# Clear cache
rm -rf node_modules dist .vite
npm install
npm run build
```

#### 2. Environment Variables Not Loading

```typescript
// Verify variables are prefixed with VITE_
console.log(import.meta.env.VITE_FIREBASE_API_KEY); // Works
console.log(import.meta.env.FIREBASE_API_KEY); // Undefined
```

#### 3. Routing Issues (404 on Refresh)

Ensure rewrites are configured in `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### 4. Firebase Connection Issues

```typescript
// Check Firebase initialization
import { getApp } from 'firebase/app';

try {
  const app = getApp();
  console.log('✅ Firebase initialized:', app.name);
} catch (error) {
  console.error('❌ Firebase error:', error);
}
```

### Performance Issues

```bash
# Analyze bundle
npm run build
npm run analyze

# Check for large dependencies
npx vite-bundle-visualizer
```

---

## 📚 Additional Resources

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Vite Deployment Guide**: [vitejs.dev/guide/static-deploy](https://vitejs.dev/guide/static-deploy)
- **Firebase Hosting**: [firebase.google.com/docs/hosting](https://firebase.google.com/docs/hosting)

---

<div align="center">

**FlowGateX Deployment Guide v1.0**

Happy Deploying! 🚀

</div>
