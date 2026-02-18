# AttendeeManagementPage.tsx — Specification

> **Route:** `/organizer/events/:id/attendees`  
> **Role Access:** Organizer (own events), Admin, Super Admin  
> **Purpose:** Full lifecycle management of attendees for a specific event — check-ins, communications, refunds, and exports.

---

## 1. Overview

The Attendee Management Page is a dedicated, event-scoped management interface that gives the Organizer granular control over every registered attendee. It surfaces real-time check-in status, supports bulk operations, allows direct communication, and integrates with both Firebase for data persistence and Razorpay for refund processing.

---

## 2. Page Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ EVENT HEADER (sticky)                                                  │
│ [Cover Thumbnail]  Event Title           [Status Badge]              │
│ 📅 Date  |  📍 Venue  |  🎟️ X / Y Sold                              │
│ [ Edit Event ]  [ Scan Tickets ]  [ View Public ]  [ ⋮ ]            │
├──────────────────────────────────────────────────────────────────────┤
│ TAB BAR: Overview | Edit | Tickets | Attendees (active) | Analytics  │
│          | IoT | Marketing | Communication                           │
├────────────────────────────────────────┬─────────────────────────────┤
│ STATS CARDS ROW                        │ QUICK ACTIONS PANEL         │
│ [Registered] [Checked In] [Pending]    │ [Download CSV] [Kiosk Mode] │
│ [No-Shows] [Cancellations]             │ [Email All] [Print Badges]  │
├────────────────────────────────────────┴─────────────────────────────┤
│ FILTER & SEARCH BAR                                                   │
│ [🔍 Search name/email/ID] [Status ▼] [Tier ▼] [Payment ▼] [Date ▼] │
├──────────────────────────────────────────────────────────────────────┤
│ BULK ACTION BAR (visible on row selection)                           │
│ ☑ 12 selected  [ Check In ]  [ Email Selected ]  [ Export ]         │
├──────────────────────────────────────────────────────────────────────┤
│ ATTENDEE DATA TABLE                                                   │
│ [Name] [Email] [Phone] [Tier] [Qty] [Payment] [Booked] [Status] [⋮]│
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Functionalities

### 3.1 Attendee Stats Cards

Five summary cards displayed at the top of the page, each updating in real time via Firestore `onSnapshot`:

| Card              | Data Source                                            | Display Format             |
|-------------------|--------------------------------------------------------|----------------------------|
| Total Registered  | `bookings` where `eventId == id && status == confirmed`| Count (integer)            |
| Total Checked In  | `tickets` where `eventId == id && status == used`      | Count + % of registered    |
| Pending Check-In  | `tickets` where `status == valid`                      | Count                      |
| No-Shows          | Registered − Checked In (calculated post event end)    | Count (shown after event)  |
| Cancellations     | `bookings` where `status == cancelled OR refunded`     | Count                      |

---

### 3.2 Search & Filter Panel

#### Search Bar
- Full-text instant search across: attendee `name`, `email`, `ticketId`
- Debounced at 300ms to avoid excessive Firestore reads
- Clears on `×` icon click

#### Status Filter (dropdown multi-select)
- All Statuses
- Checked In (tickets.status == `used`)
- Pending (tickets.status == `valid`)
- Cancelled / Refunded

#### Ticket Tier Filter (dropdown)
- Dynamically populated from `events/{eventId}/tiers` sub-collection
- One option per tier name

#### Payment Status Filter
- All
- Paid (bookings.status == `confirmed`)
- Refunded (bookings.status == `refunded`)
- Failed (bookings.status == `failed`)

#### Booking Date Range
- Native date range picker
- Filters `bookings.createdAt` between selected dates

#### Sort Options (dropdown)
- Name A–Z / Z–A
- Booking Date (Newest / Oldest)
- Check-In Time (most recent first)

---

### 3.3 Attendee Data Table

#### Columns

| Column          | Content                                          | Sortable | Notes                                   |
|-----------------|--------------------------------------------------|----------|-----------------------------------------|
| ☑ Checkbox      | Row selection for bulk actions                   | No       | Select all toggle in header             |
| Name            | Full name — clickable → opens Attendee Detail Modal | Yes   | Avatar initials if no photo             |
| Email           | Masked: `j***@example.com` — 👁 to reveal       | No       | Reveal requires `attendee:read` perm    |
| Phone           | Masked: `+91 ****3210` — 👁 to reveal           | No       | Same permission check                   |
| Ticket Tier     | Tier name as colored pill (color per tier)       | Yes      |                                         |
| Quantity        | Number of tickets in booking                     | Yes      |                                         |
| Payment Amount  | ₹ amount + status badge (Paid / Refunded)        | Yes      |                                         |
| Booking Date    | Relative ("2 days ago") + absolute on hover      | Yes      |                                         |
| Check-In Status | ✅ Checked In + timestamp / ⏳ Pending           | Yes      | Timestamp format: `Mar 15, 3:42 PM`     |
| Actions         | Context menu ⋮                                   | No       |                                         |

#### Row Context Menu (⋮)
- **View Booking Details** → opens Attendee Detail Modal
- **Resend Ticket Email** → calls `resendTicketEmail` Cloud Function
- **Regenerate QR Code** → calls `regenerateTicketQR` (invalidates old QR)
- **Manually Check In** → calls `checkInTicket` with `manualOverride: true`
- **Initiate Refund** → opens Refund Modal
- **Send Individual Email** → opens single-recipient Email Composer
- **Download Ticket PDF** → generates signed Storage URL for PDF download

---

### 3.4 Attendee Detail Modal

Triggered by clicking attendee name. Slides in from the right (drawer pattern).

**Sections:**

**Profile Header**
- Avatar (initials fallback)
- Full name, email, phone (unmasked here)
- User's join date on FlowGateX (from `users/{uid}`)

**Booking Details**
- Booking ID (copyable)
- Transaction ID (copyable) + gateway badge (Razorpay)
- Booking date and time
- Total amount paid
- Discount applied (promo code if used)
- Service fee deducted

**Tickets Section**
- Table of all tickets in this booking:

  | Ticket ID | Tier       | QR Code | Status      | Download |
  |-----------|------------|---------|-------------|----------|
  | TK-001    | VIP Pass   | [img]   | Valid ✅    | PDF icon |
  | TK-002    | VIP Pass   | [img]   | Used ✅     | PDF icon |

- QR Code renders inline as 100×100px image

**Check-In History**
- If checked in: Gate ID + Device ID + Timestamp + checked in by (UID → name)
- If pending: "Not yet checked in" placeholder
- If manual override was used: badge indicating "Manual Override"

**Communication History**
- List of all emails sent to this attendee for this event
- Columns: Subject, Sent Date, Opened (yes/no), Template used

**Action Buttons (bottom of modal)**
- Resend Ticket Email
- Regenerate QR Code
- Initiate Refund
- Send Direct Email
- Close (×)

---

### 3.5 Refund Modal

Triggered from context menu or Attendee Detail Modal.

**Step 1: Eligibility Check**
- Automatically calls `checkRefundEligibility` Cloud Function on open
- Displays eligibility result:
  - ✅ Eligible: refund policy allows, within window, tickets not used
  - ❌ Ineligible: shows specific reason (e.g., "Ticket already checked in", "Outside refund window")

**Step 2: Reason Input** (if eligible)
- Dropdown: Customer Request / Event Cancelled / Duplicate Booking / Other
- Free-text notes (required if "Other")

**Step 3: Confirmation**
- Shows refund amount
- Warning: "This will cancel the booking and invalidate all tickets"
- Confirm button → calls `initiateRefund` Cloud Function

---

### 3.6 Bulk Actions Bar

Appears above the table when ≥1 row is selected.

```
☑ 12 rows selected  |  [ ✅ Check In All ]  [ 📧 Email Selected ]  [ ⬇ Export CSV ]  [ ✕ Clear ]
```

- **Check In All Selected:** Batch Firestore write — updates each `tickets/{ticketId}.status = 'used'` via `batchCheckIn` Cloud Function
- **Email Selected:** Opens Email Composer pre-scoped to selected attendees
- **Export CSV:** Generates CSV of selected rows only (name, email, tier, status)

---

### 3.7 Quick Actions Panel (top-right)

| Button                  | Action                                                              |
|-------------------------|---------------------------------------------------------------------|
| Download All Attendees  | Calls `exportAttendees` Cloud Function → returns signed CSV URL     |
| Check-In Kiosk Mode     | Navigates to `/organizer/scan?event={id}` in full-screen mode       |
| Email All Attendees     | Opens bulk Email Composer scoped to all event attendees             |
| Print Badge Labels      | Calls `generateBadgeSheet` → PDF with name + QR per badge (A4 grid)|

---

## 4. UI Requirements

### Component Library
- **Table:** Custom `AttendeeTable` component (not a 3rd-party table) for full control
- **Modal/Drawer:** Slide-in from right using Framer Motion (`x: 400 → 0`)
- **Stat Cards:** Reusable `StatCard` with Firestore listener prop
- **Badges:** Pill badges: green (Checked In), amber (Pending), red (Cancelled)
- **Search:** Controlled input with `useDebounce` hook (300ms)
- **Checkboxes:** Controlled indeterminate state for select-all

### Theming
- Teal/green accent for Organizer role
- Table rows: hover state with light green tint (`#f0fdf4`)
- Check-In column: green background for `used` status rows

### Responsive Behavior
- **Desktop (>1024px):** Full table with all columns
- **Tablet (768–1024px):** Hide Phone and Booking Date columns; horizontal scroll
- **Mobile (<768px):** Card-based layout per attendee (stacked); table collapses to cards

### Accessibility
- All `<th>` elements have `scope="col"`
- Modal traps focus within drawer
- Keyboard navigable context menus (`↑` `↓` `Enter`)

---

## 5. Firebase Services

### Firestore Collections & Queries

#### Primary Attendee Query
```typescript
// Composite query requiring Firestore index
const q = query(
  collection(db, 'bookings'),
  where('eventId', '==', eventId),
  where('organizerUid', '==', currentUser.uid),
  orderBy('createdAt', 'desc')
);
const unsubscribe = onSnapshot(q, (snapshot) => {
  const bookings = snapshot.docs.map(d => d.data());
  setBookings(bookings);
});
```

#### Ticket-level Query (for check-in status)
```typescript
const ticketQuery = query(
  collection(db, 'tickets'),
  where('eventId', '==', eventId)
);
```

#### Real-Time Check-In Counter
```typescript
// Subscribes to live check-in count
onSnapshot(doc(db, 'events', eventId), (doc) => {
  setStats(doc.data().stats);
});
```

### Firestore Security Rules (relevant)
```
match /bookings/{bookingId} {
  allow read: if resource.data.organizerUid == request.auth.uid
               || hasRole('admin');
  allow update: if resource.data.organizerUid == request.auth.uid
                 && request.resource.data.status in ['cancelled', 'refunded'];
}
match /tickets/{ticketId} {
  allow read: if get(/databases/$(database)/documents/events/$(resource.data.eventId))
                .data.ownerUid == request.auth.uid;
  allow update: if hasRole('organizer') || hasRole('admin');
}
```

### Firebase Storage
- Ticket PDFs: `/tickets/{eventId}/{ticketId}.pdf`
- Badge sheets: `/exports/{organizerUid}/{eventId}/badges.pdf`
- Attendee CSVs: `/exports/{organizerUid}/{eventId}/attendees.csv`
- All export files get signed URLs expiring in 1 hour

### Firebase Cloud Functions Called

| Function              | Trigger     | Input                                | Output                          |
|-----------------------|-------------|--------------------------------------|---------------------------------|
| `checkInTicket`       | HTTPS       | `{ ticketId, deviceId?, gateId? }`   | `{ checkedIn, attendeeDetails }` |
| `batchCheckIn`        | HTTPS       | `{ ticketIds: string[] }`            | `{ results: CheckInResult[] }`  |
| `resendTicketEmail`   | HTTPS       | `{ ticketId }`                       | `{ sent: boolean }`             |
| `regenerateTicketQR`  | HTTPS       | `{ ticketId }`                       | `{ newQrCode: string }`         |
| `initiateRefund`      | HTTPS       | `{ bookingId, reason }`              | `{ refunded, refundId }`        |
| `exportAttendees`     | HTTPS       | `{ eventId, format: 'csv' }`         | `{ downloadUrl, expiresAt }`    |
| `generateBadgeSheet`  | HTTPS       | `{ eventId }`                        | `{ downloadUrl }`               |
| `checkRefundEligibility` | HTTPS  | `{ bookingId }`                      | `{ eligible, reason }`          |

### Firebase Cloud Messaging (FCM)
- Organizer receives push notification when a bulk check-in is complete
- Notification payload: `{ title: "Bulk Check-In Complete", body: "12 attendees checked in" }`

---

## 6. Razorpay Integration

### Refund Flow

```typescript
// Initiated via initiateRefund Cloud Function
// Cloud Function internally calls:
const refund = await razorpay.payments.refund(paymentId, {
  amount: amountInPaise,  // e.g., 50000 for ₹500
  notes: {
    reason: refundReason,
    bookingId: bookingId,
    eventId: eventId
  }
});
```

**Refund States tracked in Firestore:**
- `initiated` → Razorpay refund API called
- `processing` → Razorpay acknowledged (refund ID stored)
- `completed` → Razorpay webhook `refund.processed` received
- `failed` → Razorpay webhook `refund.failed` received

**Webhook Handler:** `razorpayWebhook` Cloud Function
- Listens for `refund.processed` and `refund.failed` events
- Updates `bookings/{bookingId}.status` and `transactions/{transactionId}.status`
- Sends email to attendee on success

### Refund Eligibility Rules (pre-Razorpay check)
```typescript
const isEligible = (
  booking.status === 'confirmed' &&
  ticket.status !== 'used' &&
  isWithinRefundWindow(event.refundPolicy, event.startDate) &&
  !isPastEventEnd(event.endDate)
);
```

---

## 7. Interconnections

| Connected Page / Component        | How Connected                                                    |
|-----------------------------------|------------------------------------------------------------------|
| **ScannerPage**                   | "Kiosk Mode" button navigates to `/organizer/scan?event={id}`   |
| **CommunicationTab**              | "Email All Attendees" opens email composer in Communication tab  |
| **EventAnalyticsPage**            | Check-in stats feed into analytics charts (no-show rate, etc.)  |
| **IoTDevicesPage**                | Check-in events log `deviceId` for scanner device analytics      |
| **PayoutsPage**                   | Refunds reduce `organizer.availableBalance` tracked in Payouts   |
| **OrganizerDashboard**            | Activity feed shows new bookings from Attendee collection        |
| **ManageEventPage (header)**      | Sticky header shows live tickets sold count from same data        |

---

## 8. Dynamic Data Exchange

### Real-Time Firestore Listeners (active on page mount)
```typescript
useEffect(() => {
  // 1. Bookings listener
  const bookingUnsub = onSnapshot(bookingQuery, handleBookingUpdate);
  // 2. Event stats (for stat cards)
  const eventUnsub = onSnapshot(doc(db, 'events', eventId), handleEventUpdate);

  return () => {
    bookingUnsub();
    eventUnsub();
  };
}, [eventId]);
```

### State Management (Zustand slice)
```typescript
// useOrganizerStore slice
attendees: Attendee[];
selectedAttendee: Attendee | null;
attendeeFilters: AttendeeFilters;
checkInQueue: string[]; // ticketIds pending batch check-in

fetchAttendees: (eventId: string) => Promise<void>;
checkInAttendee: (ticketId: string) => Promise<void>;
batchCheckIn: (ticketIds: string[]) => Promise<void>;
setAttendeeFilters: (filters: Partial<AttendeeFilters>) => void;
```

### Local State (component-level)
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
const [modalAttendee, setModalAttendee] = useState<Attendee | null>(null);
const [refundTarget, setRefundTarget] = useState<Booking | null>(null);
const [isKioskMode, setIsKioskMode] = useState(false);
```

---

## 9. API Services Summary

| Service               | Provider    | Purpose                              | Auth Method             |
|-----------------------|-------------|--------------------------------------|-------------------------|
| Firestore onSnapshot  | Firebase    | Real-time attendee & stats data      | Firebase Auth token     |
| Cloud Functions       | Firebase    | Check-ins, refunds, exports, emails  | Firebase callable auth  |
| Razorpay Refunds API  | Razorpay    | Process ticket refunds               | Server-side (CF only)   |
| Razorpay Webhooks     | Razorpay    | Receive refund status updates        | HMAC signature verify   |
| Firebase Storage      | Firebase    | Serve PDF tickets, CSV exports        | Signed URLs (1hr TTL)   |
| FCM                   | Firebase    | Push notifications (bulk ops done)   | Server key (CF only)    |
| SendGrid / Nodemailer | Email       | Transactional emails (resend ticket) | API key (CF only)       |

---

## 10. Error States & Edge Cases

| Scenario                        | Handling                                                        |
|---------------------------------|-----------------------------------------------------------------|
| Event has 0 attendees           | Empty state illustration + "No attendees yet" message           |
| Refund ineligible               | Modal shows specific reason; "Contact Admin" link shown         |
| QR regeneration while online    | Old QR immediately invalidated; attendee emailed new QR         |
| Bulk check-in partial failure   | Failed ticket IDs listed in error toast; retry button shown     |
| CSV export timeout (>1000 rows) | Background job triggered; email sent to organizer with link     |
| Network offline                 | Stale data shown with "⚠️ Real-time updates paused" banner      |
