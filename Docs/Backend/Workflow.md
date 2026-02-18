# FlowGateX — Application Workflow

> End-to-end workflow documentation covering all user journeys from registration through event management, booking, payment, and IoT gate validation.

---

## Table of Contents

1. [User Registration & Authentication](#user-registration--authentication)
2. [Event Discovery & Browsing](#event-discovery--browsing)
3. [Event Creation (Organizer)](#event-creation-organizer)
4. [Ticket Booking & Payment](#ticket-booking--payment)
5. [QR Ticket Validation (IoT)](#qr-ticket-validation-iot)
6. [Refund & Cancellation](#refund--cancellation)
7. [Dashboard Workflows](#dashboard-workflows)
8. [Admin Workflows](#admin-workflows)
9. [Settings & Configuration](#settings--configuration)
10. [Real-Time Data Flows](#real-time-data-flows)

---

## User Registration & Authentication

### Registration Flow

```
User visits /register →
  RoleSelector: Choose role (Attendee / Organizer) →
    Fill registration form:
      - Full name, email, password
      - Phone number (optional)
      - If Organizer: organization name, description, website
    Zod validation (password: 8+ chars, uppercase, number, special) →
      Firebase Auth: createUserWithEmailAndPassword() →
        Create Firestore document: users/{uid} →
          Role: 'user' (attendee) or 'organizer' (pending approval) →
            Redirect to role-specific dashboard
```

### Login Flow

```
User visits /login →
  Choose auth method:
    ┌─────────────────┐    ┌────────────────┐    ┌──────────────────┐
    │  Email/Password │    │  Google OAuth  │    │  Facebook OAuth  │
    └────────┬────────┘    └───────┬────────┘    └────────┬─────────┘
             │                     │                       │
             ▼                     ▼                       ▼
    signInWithEmail()     signInWithPopup()       signInWithPopup()
             │                     │                       │
             └─────────────────────┼───────────────────────┘
                                   │
                                   ▼
    onAuthStateChanged listener fires →
      Fetch user from Firestore users/{uid} →
        Check account status (active/suspended/deleted) →
          If suspended: show AccountSuspendedPage →
          If active:
            Load user role →
              Update Zustand auth store →
                Redirect to ROLE_DASHBOARDS[role]:
                  user       → /dashboard
                  organizer  → /organizer
                  org_admin  → /organizer
                  admin      → /admin
                  superadmin → /superadmin
```

### Password Reset Flow

```
User clicks "Forgot Password" →
  /forgot-password page →
    Enter email →
      Firebase Auth: sendPasswordResetEmail() →
        Email sent with reset link →
          User clicks link → /reset-password →
            Enter new password →
              Firebase Auth: confirmPasswordReset() →
                Redirect to /login
```

### Session Persistence

```
App loads →
  Firebase Auth checks for existing session →
    If valid token exists:
      Auto-login (no re-authentication needed) →
        onAuthStateChanged fires →
          Load user data → Update auth store
    If no token:
      Show public pages → Login required for protected routes
```

---

## Event Discovery & Browsing

### Search & Filter Flow

```
User visits /events →
  EventsPage loads →
    Initial data fetch: eventService.getEvents() →
      Display event grid (3 cols desktop / 2 tablet / 1 mobile) →
        User can:
          ┌──────────────────────────────────────────────┐
          │  Search (Fuse.js fuzzy search)               │
          │  Filter by: Category, Date, Price, Location  │
          │  Sort by: Date, Price, Popularity            │
          │  Toggle: Map view / Grid view                │
          └──────────────────────────────────────────────┘
```

### Event Detail Flow

```
User clicks "View Details" on event card →
  Navigate to /events/:id →
    EventDetailsPage loads →
      useEventDetails(eventId) hook fetches event data →
        Display:
          - Hero section (cover image, title, date)
          - Tab navigation (Overview, Venue, Speakers, Tickets)
          - Ticket selection with quantity picker
          - Add to Cart / Book Now buttons
          - Social sharing, calendar download
          - Google Maps embed (venue tab)
```

---

## Event Creation (Organizer)

### Multi-Step Wizard

```
Organizer navigates to /organizer/events/create →
  CreateEventPage renders 8-step wizard:

  Step 1: BasicInfoStep
    ├── Title (required, max 100 chars)
    ├── Description (rich text)
    ├── Category (1 of 12 categories)
    ├── Format (single/multi-day/recurring)
    └── Tags (comma-separated)
         │
  Step 2: DateStep
    ├── Start date & time
    ├── End date & time
    ├── Timezone selection
    └── Recurrence pattern (if recurring)
         │
  Step 3: VenueStep
    ├── Venue name
    ├── Address (auto-complete via Google Maps)
    ├── Map pin placement
    ├── Capacity (max attendees)
    └── Parking/transport info
         │
  Step 4: TicketsStep
    ├── Add ticket tiers (name, price, quantity)
    ├── Sale window (start/end dates)
    ├── Per-tier limits
    └── Gate access level
         │
  Step 5: MediaStep
    ├── Cover image upload (Firebase Storage)
    ├── Gallery images (up to 10)
    └── Video URL (YouTube/Vimeo)
         │
  Step 6: DetailsStep
    ├── Agenda/schedule builder
    ├── Speaker profiles
    └── FAQ items
         │
  Step 7: OrganizerStep
    ├── Organizer name
    ├── Contact email & phone
    ├── Website URL
    └── Social media links
         │
  Step 8: SettingsStep
    ├── Visibility (public/private)
    ├── Require admin approval?
    └── Refund policy
         │
  ReviewStep: Preview all data →
    Submit: eventService.createEvent(data) →
      Event saved to Firestore (status: 'draft') →
        Redirect to /organizer/events
```

### Event Publishing

```
Organizer clicks "Publish" on draft event →
  eventService.publishEvent(eventId) →
    If platform requires approval:
      Event status → 'pending_review' →
        Admin reviews in Event Moderation page →
          Approve → 'published' (visible to public)
          Reject → 'rejected' with reason
    Else:
      Event status → 'published' →
        Visible on Events page immediately
```

---

## Ticket Booking & Payment

### Complete Booking Flow

```
┌─────────────────────────────────────────────────────────────┐
│ STAGE 1: Select Tickets                                      │
│                                                               │
│  EventDetailsPage → TicketSelection component                │
│  User picks tier + quantity → clicks "Add to Cart"           │
│  cartStore.addItem(cartItem)                                 │
│  useCartSync → debounced write to Firestore cart/{uid}       │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│ STAGE 2: Cart Review                                         │
│                                                               │
│  CartPage displays all items                                 │
│  User can: adjust qty, remove items, apply promo code        │
│  promoService.validatePromoCode(code, eventId) →             │
│    If valid: discount applied to cart totals                  │
│    If invalid: error shown                                    │
│  Click "Proceed to Checkout"                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│ STAGE 3: Checkout                                            │
│                                                               │
│  CheckoutPage shows:                                         │
│    - Order summary with breakdown                            │
│    - Attendee details form (name, email per ticket)          │
│    - Payment method selector                                 │
│                                                               │
│  Price calculation:                                          │
│    subtotal = Σ(price × quantity)                            │
│    discount = promo code value                               │
│    serviceFee = ₹12 × totalTickets                           │
│    tax = (subtotal - discount + serviceFee) × 0.18           │
│    total = subtotal - discount + serviceFee + tax            │
│                                                               │
│  Click "Pay ₹X,XXX"                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│ STAGE 4: Payment                                             │
│                                                               │
│  Razorpay checkout modal opens →                             │
│    User pays via card / UPI / netbanking / wallet →          │
│      Razorpay returns payment response →                     │
│        Verify payment signature →                            │
│          Cloud Function validates server-side                │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│ STAGE 5: Booking Confirmation                                │
│                                                               │
│  Firestore transaction (atomic):                             │
│    1. Create booking document (bookings/{id})                │
│    2. Create transaction record (transactions/{id})          │
│    3. Generate tickets with QR codes (tickets/{id})          │
│    4. Decrement ticket inventory (events/{id}.tickets)       │
│    5. Increment event booking counter                        │
│    6. Clear user cart                                         │
│                                                               │
│  BookingSuccessPage renders:                                 │
│    - Confetti animation (canvas-confetti)                    │
│    - Booking ID and status                                   │
│    - QR code tickets (downloadable)                          │
│    - Add to calendar button                                  │
│    - Share booking link                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## QR Ticket Validation (IoT)

### Web Scanner Flow

```
Organizer opens /organizer/scan →
  ScannerPage activates camera →
    html5-qrcode library scans for QR codes →
      QR detected → decode Base64 payload →
        Extract: ticketId, userId, eventId, bookingId, timestamp, gateAccessLevel →
          Verify SHA-256 signature →
            Query Firestore: tickets/{ticketId} →
              │
              ├── Status: 'valid' →
              │     Mark as 'used' (checkedInAt = now) →
              │       ✅ GREEN indicator + success sound
              │
              ├── Status: 'used' →
              │     ⚠️ YELLOW indicator + "Already checked in at {time}"
              │
              ├── Status: 'cancelled' →
              │     ❌ RED indicator + "Ticket cancelled"
              │
              └── Not found →
                    ❌ RED indicator + "Invalid ticket"
```

### IoT Gate Scanner Flow (ESP32-CAM)

```
ESP32-CAM Module #1 powered on →
  Connect to WiFi → Establish MQTT connection →
    Camera loop: scan for QR codes →
      QR detected → decode locally →
        Send validation request to Firebase →
          Response received:
            ├── VALID → Green LED + success buzzer + open gate motor (relay) →
            │           Gate auto-closes after 5 seconds
            ├── INVALID → Red LED + error buzzer → gate stays closed
            └── ALREADY USED → Yellow LED + double beep
```

---

## Refund & Cancellation

### User-Initiated Refund

```
User navigates to /dashboard/bookings →
  MyBookingsPage shows booking history →
    User clicks "Request Refund" on a booking →
      refundService.checkEligibility(bookingId) →
        Check:
          ✓ Event hasn't started yet
          ✓ Within refund window (per event policy)
          ✓ Booking status is 'confirmed'
          ✓ Not already refunded
        │
        ├── Eligible:
        │     RefundDialog opens →
        │       User confirms →
        │         refundService.processRefund(bookingId) →
        │           Firestore transaction:
        │             1. Booking status → 'refunded'
        │             2. Transaction status → 'refunded'
        │             3. All tickets → status: 'cancelled'
        │             4. Restore inventory (atomic increment)
        │             5. Initiate gateway refund (Razorpay API)
        │           Success notification shown
        │
        └── Not eligible:
              Show reason to user (past window, event started)
```

---

## Dashboard Workflows

### Attendee Dashboard (`/dashboard`)

```
User logs in → redirected to /dashboard →
  UserDashboard loads:
    ├── Welcome banner with user name
    ├── Quick stats (upcoming events, total bookings)
    ├── Upcoming events list
    ├── Recent bookings
    └── Quick action buttons:
          ├── Browse Events → /events
          ├── My Tickets → /my-tickets
          ├── My Bookings → /dashboard/bookings
          ├── Favorites → /dashboard/favorites
          ├── Wallet → /dashboard/wallet
          └── Settings → /dashboard/settings
```

### Organizer Dashboard (`/organizer`)

```
Organizer logs in → redirected to /organizer →
  OrganizerDashboard loads:
    ├── Revenue overview (total, this month, trend)
    ├── Event stats (active, draft, completed)
    ├── Attendee count (total, this week)
    ├── Recent bookings feed
    ├── Upcoming events timeline
    └── Quick actions:
          ├── Create Event → /organizer/events/create
          ├── Scan Tickets → /organizer/scan
          ├── View Analytics → /organizer/events/:id/analytics
          ├── IoT Devices → /organizer/devices
          └── Marketing → /organizer/marketing
```

---

## Admin Workflows

### Organizer Approval

```
New organizer registers →
  User document created with role: 'organizer', approvalStatus: 'pending' →
    Admin visits /admin/organizers →
      Pending applications listed →
        Admin reviews application details →
          ├── Approve:
          │     organizerInfo.approvalStatus → 'approved'
          │     organizerInfo.verified → true
          │     User can now create events
          │
          └── Reject:
                organizerInfo.approvalStatus → 'rejected'
                Rejection reason stored
                User remains as 'user' role
```

### Platform Settings Update

```
Admin visits /admin/settings →
  PlatformSettingsPage loads settings from Firestore →
    Admin modifies settings:
      - Toggle feature flags
      - Update security policies
      - Enable/disable maintenance mode
    Submit:
      settingsService.updatePlatformSettings(data) →
        Firestore SettingInfo/platform updated →
          All clients receive update via onSnapshot →
            useSettingsSync hook updates settingsStore →
              RBAC engine uses new settings immediately
```

---

## Settings & Configuration

### User Settings Flow

```
User navigates to /dashboard/settings →
  SettingsPage loads user preferences →
    Sections:
      ├── Profile: Name, bio, avatar, location
      ├── Notifications: Email, push, SMS toggles
      ├── Privacy: Profile visibility, show email
      ├── Security: Change password, 2FA toggle
      └── Preferences: Language, timezone, currency
    Save:
      userService.updateUser(uid, { preferences: {...} }) →
        Firestore users/{uid} updated →
          Local state updated
```

### Theme Toggle Flow

```
User clicks theme toggle (sun/moon icon in navbar) →
  themeStore.toggleTheme() →
    isDarkMode flips (persisted to localStorage: flowgatex-theme) →
      'dark' class added/removed from <html> →
        CSS variables in variables.css switch (dark mode overrides) →
          All styled components respond via CSS custom properties
```

---

## Real-Time Data Flows

### Cart Synchronization

```
User updates cart on Device A →
  Zustand store updates →
    useCartSync detects change →
      Debounce 500ms →
        Write to Firestore cart/{uid} →
          User opens Device B →
            useCartSync subscribes via onSnapshot →
              Firestore pushes cart data →
                Zustand store updated on Device B →
                  UI reflects latest cart
```

### Settings Synchronization

```
Admin updates platform settings →
  Firestore SettingInfo/platform updated →
    All connected clients receive onSnapshot callback →
      useSettingsSync hook fires →
        settingsStore updated →
          RBAC hooks re-evaluate permissions →
            UI elements show/hide based on new permissions
```

### IoT Device Monitoring

```
ESP32 sensor reads data every 5 seconds →
  Publish to Firestore devices/{id}/readings →
    Dashboard subscribes via onSnapshot →
      Real-time gauge/chart updates →
        If threshold exceeded:
          Alert notification sent →
            Admin/Organizer dashboard shows warning
```
