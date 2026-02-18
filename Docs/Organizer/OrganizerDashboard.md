# OrganizerDashboard.tsx — Specification

> **Route:** `/organizer`  
> **Role Access:** Organizer, Admin, Super Admin  
> **Purpose:** High-level command center and landing page for the Organizer role — aggregates key metrics, surfaces activity, shows upcoming events, and provides rapid access to all organizer functions.

---

## 1. Overview

The Organizer Dashboard is the first screen seen after login for an Organizer. It provides a bird's-eye view of all event performance, real-time activity, financial snapshots, and IoT alerts. It acts as a hub linking to all other Organizer sub-pages. All data is scoped strictly to the current organizer's events and devices.

---

## 2. Page Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ HEADER BAR                                                            │
│ "Welcome back, [Name]!"  [ Create Event ][ Scan Tickets ][ Payouts ] │
│                           [🔔 Bell: 3]  [👤 Profile ▼]              │
├──────────────────────────────────────────────────────────────────────┤
│ KEY METRICS ROW (4 cards)                                            │
│ [Total Events] [Total Revenue] [Total Attendees] [Conversion Rate]  │
├──────────────────────────────────────────────────────────────────────┤
│ REVENUE OVERVIEW CHART (full width)                                  │
│ Line chart with period toggle and net/gross toggle                   │
├────────────────────────────┬─────────────────────────────────────────┤
│ CALENDAR WIDGET            │ ACTIVITY FEED                           │
│ (FullCalendar, month view) │ (Real-time Firestore stream, last 15)  │
├────────────────────────────┴─────────────────────────────────────────┤
│ UPCOMING EVENTS TIMELINE (horizontal scroll)                         │
│ [Event 1] [Event 2] [Event 3] [Event 4] [Event 5]                   │
└──────────────────────────────────────────────────────────────────────┘

[QUICK ACTIONS PANEL — sticky sidebar or FAB group]
```

---

## 3. Functionalities

### 3.1 Header Bar

**Welcome Message:**  
`"Welcome back, {user.displayName}!"` — personalized greeting; time-of-day prefix: "Good morning / afternoon / evening."

**Quick Action Buttons (header):**

| Button           | Action                                        | Style        |
|------------------|-----------------------------------------------|--------------|
| Create Event     | Navigates to `/organizer/events/create`       | Primary green|
| Scan Tickets     | Navigates to `/organizer/scan`                | Outline      |
| View Payouts     | Navigates to `/organizer/payouts`             | Outline      |

**Notification Bell:**
- Badge count shows unread notifications
- Dropdown on click shows last 10 notifications:
  - New booking: "🎟️ 2 tickets booked for TechConf — John Doe"
  - Low ticket alert: "⚠️ Only 5 VIP tickets remaining"
  - IoT alert: "🚨 Gas warning at Gate 2"
  - Payment received: "💰 ₹1,200 received"
  - Payout status: "✅ Payout of ₹25,000 completed"
- "Mark All Read" button
- "View All Notifications" → `/organizer/notifications`

**Profile Dropdown:**
- Profile picture + name + email
- My Profile → `/organizer/settings/profile`
- Account Settings → `/organizer/settings`
- Help & Support → (opens intercom/helpdesk)
- Sign Out → calls `firebase.auth().signOut()`

---

### 3.2 Key Metrics Cards (Top Row)

Four cards in a horizontal row. Each card has:
- Metric label
- Large value
- Trend indicator (↑↓ % vs. previous period)
- Sub-detail text
- Click → navigates to detailed page

| Card              | Value Display                               | Sub-Detail                         | Links To                    |
|-------------------|---------------------------------------------|------------------------------------|-----------------------------|
| Total Events      | Count (e.g., "12")                          | "4 Active · 5 Draft · 3 Ended"     | `/organizer/events`         |
| Total Revenue     | "₹1,25,000" + mini sparkline chart         | "This Month: ₹35,000"             | `/organizer/payouts`        |
| Total Attendees   | "1,450" (sum across all events)             | "920 Checked In (63%)"             | `/organizer/events`         |
| Conversion Rate   | "12.4%"                                    | "(Tickets Sold / Event Views)"     | `/organizer/events/:id/analytics` |

**Trend Calculation:**
```typescript
// Compare current 30 days vs prior 30 days
const trendPct = ((current - previous) / previous) * 100;
// Display: ↑ 18% or ↓ 5%
// Color: green if ↑ revenue/attendees/conversion, red if ↓
```

**Sparkline Chart (Revenue card):**
- 7-day mini line chart, Chart.js (60px height)
- No axes/labels — purely visual indicator
- Green line with fill beneath

---

### 3.3 Revenue Overview Chart

**Full-width section below metrics.**

**Chart Type:** Chart.js `LineChart` with gradient fill.

```typescript
{
  type: 'line',
  data: {
    labels: dateLabels,
    datasets: [
      {
        label: 'Gross Revenue (₹)',
        data: grossRevenueByDay,
        fill: true,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderColor: '#10b981',
        tension: 0.4
      },
      {
        label: 'Net Revenue (₹)',
        data: netRevenueByDay,
        fill: false,
        borderColor: '#6366f1',
        tension: 0.4,
        borderDash: [5, 5]
      }
    ]
  }
}
```

**Controls:**
- Period Toggle: `[ 7d ]  [ 30d ]  [ 90d ]  [ All Time ]`
- Breakdown Toggle: `[ Gross Revenue ]  [ Net Revenue ]` (shows/hides second dataset)
- Export button (top-right of chart card): PNG or CSV

**Hover Tooltip:**
```
📅 Mar 15, 2026
Gross: ₹8,500  |  Tickets: 17
Net:   ₹8,296
```

**Data Source:**
```typescript
const revenueQuery = query(
  collection(db, 'transactions'),
  where('organizerUid', '==', currentUser.uid),
  where('status', '==', 'paid'),
  where('timestamp', '>=', Timestamp.fromDate(periodStart)),
  orderBy('timestamp', 'asc')
);
```

---

### 3.4 Calendar Widget

**Library:** `@fullcalendar/react` + `@fullcalendar/daygrid` + `@fullcalendar/timegrid`

**Default View:** Month  
**Toggle:** Month / Week / Day tabs in calendar header

**Event Rendering:**
```typescript
// Events passed to FullCalendar as EventInput[]
const calendarEvents = myEvents.map(event => ({
  id: event.id,
  title: event.title,
  start: event.startDate.toDate(),
  end: event.endDate.toDate(),
  color: getEventColor(event),   // see color logic below
  extendedProps: { event }
}));

function getEventColor(event: Event): string {
  if (isToday(event.startDate)) return '#ef4444';        // red: today
  if (event.status === 'draft') return '#9ca3af';         // grey: draft
  if (sellThrough(event) < 0.2) return '#7c3aed';         // purple: low sales
  if (event.status === 'published') return '#10b981';     // green: published
  return '#9ca3af';
}
```

**Click Handlers:**
```typescript
// Click event → popover
eventClick: (info) => {
  setCalendarPopover({
    event: info.event.extendedProps.event,
    position: { x: info.jsEvent.pageX, y: info.jsEvent.pageY }
  });
}

// Click empty date → prefill create wizard
dateClick: (info) => {
  navigate(`/organizer/events/create?date=${info.dateStr}`);
}
```

**Popover (on event click):**
```
[Event Title]
📅 Mar 15, 2026 · 6:00 PM
📍 Grand Ballroom
🎟️ 45 / 100 sold

[ View ]  [ Edit ]  [ Scan Tickets ]
```

---

### 3.5 Activity Feed

**Right column, real-time stream of last 15 actions.**

**Firestore Listener:**
```typescript
// Merges streams from bookings + security_alerts
const bookingListener = onSnapshot(
  query(
    collection(db, 'bookings'),
    where('organizerUid', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(10)
  ),
  (snap) => updateFeed('booking', snap.docs)
);

const alertListener = onSnapshot(
  query(
    collection(db, 'security_alerts'),
    where('organizerUid', '==', uid),
    where('resolved', '==', false),
    orderBy('triggeredAt', 'desc'),
    limit(5)
  ),
  (snap) => updateFeed('alert', snap.docs)
);
```

**Feed Item Types:**

| Icon | Type                 | Message Template                                                           |
|------|----------------------|----------------------------------------------------------------------------|
| 🎟️  | New Booking          | "New booking: {qty} tickets for {eventTitle} by {name} (₹{amount})"       |
| 💰   | Payment Received     | "Payment received: ₹{amount} from {name}"                                  |
| ⚠️  | Low Ticket Alert     | "Low ticket alert: Only {qty} {tierName} tickets remaining for {event}"    |
| ✅   | Check-In             | "Attendee checked in: {name} at {gateId}"                                  |
| 🚨   | IoT Alert            | "{severity}: {reading} at {deviceName} — {eventTitle}"                     |
| ↩️   | Refund Processed     | "Refund issued: ₹{amount} to {name}"                                       |
| 📅   | Event Published      | "Your event '{title}' is now live!"                                         |
| ✉️   | Email Campaign Sent  | "Email campaign '{name}' sent to {count} attendees"                        |

**Feed Item Display:**
```
🎟️ New booking: 2 tickets for TechConf 2026 by John Doe (₹500)
   TechConf 2026  ·  2 minutes ago
   [→ View Booking]
```

Each item is clickable and navigates to the relevant detail page.

**Live Updates:** New items slide in from top with animation (`framer-motion: y: -20 → 0, opacity: 0 → 1`).

---

### 3.6 Upcoming Events Timeline (Horizontal)

**Bottom section, horizontal scroll on overflow.**  
Shows next 5 upcoming events sorted by `startDate ASC`.

**Event Card (compact horizontal):**
```
┌────────────────────────────────────────────────┐
│ [40×40 thumbnail]  TechConf 2026               │
│                    📅 Mar 15, 2026             │
│                    [Published] badge           │
│ ████████████░░░░░░ 45/100 (45%) sold           │
│ [ View ]  [ Edit ]  [ Scan Tickets ]           │
└────────────────────────────────────────────────┘
```

**Query:**
```typescript
const upcomingQuery = query(
  collection(db, 'events'),
  where('ownerUid', '==', uid),
  where('startDate', '>', Timestamp.now()),
  where('status', '!=', 'archived'),
  orderBy('startDate', 'asc'),
  limit(5)
);
```

**Empty State:** "No upcoming events. [+ Create Event]"

---

### 3.7 Quick Actions Panel

**Position:** Sticky right sidebar (desktop) or floating action button group (mobile)

| Action             | Icon  | Route / Function                        |
|--------------------|-------|-----------------------------------------|
| Create Event       | ➕    | `/organizer/events/create`              |
| Scan Tickets       | 📷    | `/organizer/scan`                       |
| View Analytics     | 📊    | `/organizer/events` → analytics         |
| Manage Devices     | 📡    | `/organizer/devices`                    |
| Marketing Tools    | 📢    | `/organizer/marketing`                  |
| Request Payout     | 💰    | opens payout modal or `/organizer/payouts`|

**Mobile:** Fixed bottom bar with 4 most-used actions (Create / Scan / Analytics / Payout).

---

## 4. UI Requirements

### Theming
- Accent color: Teal/green (`#10b981`, `#059669`)
- Role badge in sidebar: "Organizer" with shield icon, green background
- Card shadows: `0 1px 3px rgba(0,0,0,0.08)` default, `0 4px 12px rgba(0,0,0,0.12)` hover

### Responsive Layout
- **Desktop (>1280px):** 4-column metric row; 2-column lower (60% chart, 40% calendar; 50/50 calendar/feed)
- **Tablet (768–1280px):** 2-column metrics, full-width chart, stacked calendar + feed
- **Mobile (<768px):** 1-column stack; chart replaced with stat cards; calendar hidden; feed above timeline

### Animation
- Metric card counters: count-up animation on initial load (duration: 800ms)
- Activity feed: slide-in animation for new items
- Chart: line draws from left (1000ms duration on mount)

### Skeleton Loading
- All 4 metric cards show shimmer placeholders on load
- Chart area: grey shimmer at chart height while data fetches
- Activity feed: 8 skeleton rows

---

## 5. Firebase Services

### Firestore Queries & Listeners

```typescript
// 1. Aggregate stats (all events)
const eventsQuery = query(
  collection(db, 'events'),
  where('ownerUid', '==', uid)
);
// Aggregate client-side: count, revenue sum, etc.

// 2. Revenue for chart
const revenueQuery = query(
  collection(db, 'transactions'),
  where('organizerUid', '==', uid),
  where('status', '==', 'paid'),
  where('timestamp', '>=', periodStart)
);

// 3. Activity feed (bookings)
const feedQuery = query(
  collection(db, 'bookings'),
  where('organizerUid', '==', uid),
  orderBy('createdAt', 'desc'),
  limit(10)
);

// 4. Upcoming events
const upcomingQuery = query(
  collection(db, 'events'),
  where('ownerUid', '==', uid),
  where('startDate', '>', now),
  where('status', '!=', 'archived'),
  orderBy('startDate', 'asc'),
  limit(5)
);

// 5. Active IoT alerts
const alertQuery = query(
  collection(db, 'security_alerts'),
  where('organizerUid', '==', uid),
  where('resolved', '==', false)
);

// 6. Organizer profile (for balance)
const profileDoc = doc(db, 'users', uid);
```

### Real-Time Listeners Active on Dashboard
All 6 queries above run as `onSnapshot` listeners — unsubscribed on component unmount.

### Cloud Functions
None called directly on dashboard load. Actions triggered from header buttons call their respective page's functions.

### FCM Integration
- Dashboard registers FCM token on mount (if not already registered)
- Foreground notifications displayed as toast (overlay)
- Background notifications route user back to relevant sub-page on click

---

## 6. State Management

```typescript
// useOrganizerStore dashboard slice
dashboardStats: {
  totalEvents: number;
  activeEvents: number;
  draftEvents: number;
  endedEvents: number;
  totalRevenue: number;          // Gross lifetime
  monthRevenue: number;          // This month gross
  totalAttendees: number;
  checkedInAttendees: number;
  conversionRate: number;
  revenueTrend: number;          // % vs prior period
  attendeesTrend: number;
  conversionTrend: number;
};
revenueChartData: RevenueDataPoint[];
revenueChartPeriod: '7d' | '30d' | '90d' | 'all';
activityFeed: FeedItem[];
upcomingEvents: Event[];
notifications: Notification[];
unreadNotificationCount: number;
availableBalance: number;

fetchDashboardStats: () => void;
fetchRevenueChart: (period: string) => Promise<void>;
setRevenueChartPeriod: (period: string) => void;
markNotificationsRead: () => Promise<void>;
```

---

## 7. Interconnections

| Connected Page / Component         | How Connected                                                         |
|------------------------------------|-----------------------------------------------------------------------|
| **MyEventsPage**                   | "Total Events" card + "Upcoming Events" timeline link there           |
| **PayoutsPage**                    | "Total Revenue" card + "Request Payout" quick action                  |
| **AttendeeManagementPage**         | "Total Attendees" card links to events page (then per-event)          |
| **IoTDevicesPage**                 | IoT alerts in activity feed; "Manage Devices" quick action            |
| **ScannerPage**                    | "Scan Tickets" header button + quick action                           |
| **MarketingToolsPage**             | "Marketing Tools" quick action                                        |
| **EventAnalyticsPage**             | "Conversion Rate" card + "View Analytics" quick action                |
| **CreateEventPage**                | "Create Event" header + quick action + calendar empty date click      |
| **Notification System**            | Bell badge pulls from same activity feed data + FCM                   |

---

## 8. API Services Summary

| Service              | Provider      | Purpose                                   |
|----------------------|---------------|-------------------------------------------|
| Firestore onSnapshot | Firebase      | All real-time data streams (6 listeners)  |
| FCM                  | Firebase      | Push notifications + token registration   |
| Chart.js             | npm (client)  | Revenue overview line chart               |
| FullCalendar         | npm (client)  | Calendar widget                           |
| Framer Motion        | npm (client)  | Animations (feed items, counters)         |

---

## 9. Error States & Edge Cases

| Scenario                       | Handling                                                               |
|--------------------------------|------------------------------------------------------------------------|
| New organizer (0 events)       | "Welcome!" onboarding state with step-by-step guide to create first event |
| All events ended / no upcoming | Upcoming timeline shows "No upcoming events" + create CTA              |
| Revenue data gap (no txns)     | Chart renders flat line at ₹0 for that period                          |
| IoT alerts: many unresolved    | Alert count badge shown on "Manage Devices" quick action               |
| Slow network on initial load   | Skeleton loaders for all sections; partial render as data arrives      |
| Period toggle with sparse data | Chart renders correctly with whatever data exists (no blank error)     |
| FCM permission denied          | Dashboard works normally; no push notification shown; silent fail      |
