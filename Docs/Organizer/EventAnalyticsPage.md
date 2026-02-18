# EventAnalyticsPage.tsx — Specification

> **Route:** `/organizer/events/:id/analytics`  
> **Role Access:** Organizer (own events), Admin, Super Admin  
> **Purpose:** Deep-dive performance analytics for a single event — revenue, ticket sales, conversion funnels, attendance, and demographic insights.

---

## 1. Overview

The Event Analytics Page gives Organizers a comprehensive, data-rich view of how a specific event is performing across every measurable dimension. Charts are interactive (Chart.js), data is derived from aggregated Firestore documents, and all reports are exportable. The page operates in both real-time mode (for live/upcoming events) and historical mode (for ended events).

---

## 2. Page Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ EVENT HEADER (sticky)                                                 │
│ [Cover Thumbnail]  Event Title           [Status Badge]             │
│ 📅 Date  |  📍 Venue  |  🎟️ X / Y Sold                             │
├──────────────────────────────────────────────────────────────────────┤
│ TAB BAR: Overview | Edit | Tickets | Attendees | Analytics (active)  │
│          | IoT | Marketing | Communication                          │
├──────────────────────────────────────────────────────────────────────┤
│ PERIOD SELECTOR:  [ 7d ]  [ 30d ]  [ 90d ]  [ All Time ]  [Export ▼]│
├──────────────────────────────────────────────────────────────────────┤
│ SUMMARY STATS BAR (8 metric cards)                                   │
│ [Revenue] [Net Rev] [Tickets] [Views] [Conv%] [AvgPrice] [CheckIn%] │
│ [No-Show%]                                                           │
├─────────────────────────────┬────────────────────────────────────────┤
│ CHART 1: Revenue Over Time  │ CHART 2: Tickets by Tier               │
│ (Line, full-width half)     │ (Bar chart)                            │
├─────────────────────────────┼────────────────────────────────────────┤
│ CHART 3: Sales Funnel       │ CHART 4: Attendance Over Time          │
│ (Funnel/bar chart)          │ (Line + bar combo)                     │
├──────────────────────────────────────────────────────────────────────┤
│ BOOKING SOURCES TABLE                                                │
├──────────────────────────────────────────────────────────────────────┤
│ DEMOGRAPHICS PANEL                                                   │
│ [Age Distribution] [Gender Split] [Location Heatmap]                │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Functionalities

### 3.1 Summary Stats Bar

Eight metric cards in a scrollable horizontal row. Each updates based on the selected time period.

| Metric          | Calculation                                              | Data Source                          | Trend Indicator |
|-----------------|----------------------------------------------------------|--------------------------------------|-----------------|
| Total Revenue   | `SUM(transactions.amount)` for this event               | `transactions` collection            | ↑↓ % vs prev   |
| Net Revenue     | `Total Revenue − (ticketCount × 12)`                   | Derived from transactions            | ↑↓ % vs prev   |
| Tickets Sold    | `event.ticketSummary.totalSold` / `totalCapacity`       | `events/{id}` document               | ↑↓ vs prev      |
| Event Views     | `event.stats.views` (unique visitors)                   | `events/{id}.stats`                  | ↑↓ vs prev      |
| Conversion Rate | `(bookings / views) × 100`                              | `event.stats`                        | ↑↓ % vs prev   |
| Avg Ticket Price| `totalRevenue / ticketsSold`                            | Derived                              | ↑↓ vs prev      |
| Check-In Rate   | `(checkedIn / registered) × 100`                        | `event.stats.checkIns`               | ↑↓ % vs prev   |
| No-Show Rate    | `(registered − checkedIn) / registered × 100`           | Derived post-event                   | ↑↓ % vs prev   |

Period selector (7d / 30d / 90d / All Time) filters `transactions.timestamp` and `bookings.createdAt`.

---

### 3.2 Chart 1 — Revenue Over Time (Line Chart)

**Library:** Chart.js `LineChart`  
**Configuration:**
```typescript
{
  type: 'line',
  data: {
    labels: dateLabels,          // e.g., ['Mar 1', 'Mar 2', ...]
    datasets: [
      {
        label: 'Gross Revenue (₹)',
        data: grossRevenueByDay,
        fill: true,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',  // green gradient
        borderColor: '#10b981',
        tension: 0.4
      },
      {
        label: 'Net Revenue (₹)',
        data: netRevenueByDay,
        fill: false,
        borderColor: '#6366f1',  // indigo
        tension: 0.4
      }
    ]
  },
  options: {
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) => `₹${ctx.raw.toLocaleString('en-IN')} | ${ticketsByDay[ctx.dataIndex]} tickets`
        }
      }
    },
    scales: {
      x: { type: 'time', time: { unit: aggregationUnit } },
      y: { ticks: { callback: (val) => `₹${val.toLocaleString('en-IN')}` } }
    }
  }
}
```

**Period Aggregation Toggle:** Daily / Weekly / Monthly (changes `time.unit`)  
**Export Button:** Renders chart as PNG via `chart.toBase64Image()` or downloads raw data as CSV.

**Data Query:**
```typescript
// Aggregate daily revenue from transactions
const q = query(
  collection(db, 'transactions'),
  where('eventId', '==', eventId),
  where('status', '==', 'paid'),
  where('timestamp', '>=', periodStart),
  orderBy('timestamp', 'asc')
);
```

---

### 3.3 Chart 2 — Ticket Sales by Tier (Bar Chart)

**Library:** Chart.js `BarChart`

```typescript
{
  type: 'bar',
  data: {
    labels: tierNames,           // e.g., ['Early Bird', 'General', 'VIP']
    datasets: [
      {
        label: 'Tickets Sold',
        data: tierSoldCounts,
        backgroundColor: tierColors,  // unique color per tier
      }
    ]
  },
  options: {
    plugins: {
      annotation: {
        annotations: {
          capacityLine: {
            type: 'line',
            yMin: venueCapacity,
            yMax: venueCapacity,
            borderColor: 'rgba(239,68,68,0.5)',
            borderDash: [6, 6],
            label: { content: 'Venue Capacity', enabled: true }
          }
        }
      }
    }
  }
}
```

**Hover Tooltip:** Tier name | Sold: X | Available: Y | Revenue: ₹Z  
**Data Source:** `events/{id}/tiers` sub-collection, real-time `onSnapshot`

---

### 3.4 Chart 3 — Sales Funnel

**Library:** Custom CSS funnel (or Chart.js bar chart styled as funnel)

```typescript
const funnelStages = [
  { stage: 'Event Views',          count: event.stats.views,          pct: 100 },
  { stage: 'Cart / Tier Selected', count: event.stats.cartAdds,       pct: cartPct },
  { stage: 'Checkout Initiated',   count: event.stats.checkoutStarts, pct: checkoutPct },
  { stage: 'Payment Completed',    count: event.stats.bookings,       pct: conversionPct }
];
```

**Visual:** Each stage is a progressively narrower horizontal bar with percentage annotation.  
**Drop-off Indicator:** Red arrow between stages showing "−X% drop-off"  
**Purpose:** Identifies where potential buyers abandon the purchase flow.

**Data Source:** `events/{id}.stats` fields (`cartAdds`, `checkoutStarts`, `bookings`, `views`)  
Note: `cartAdds` and `checkoutStarts` are written by client-side analytics events (Firebase Analytics custom events).

---

### 3.5 Chart 4 — Attendance Over Time (Combo Chart)

**Library:** Chart.js mixed type chart

```typescript
{
  type: 'bar',
  data: {
    datasets: [
      {
        type: 'line',
        label: 'Cumulative Registrations',
        data: cumulativeRegistrations,
        borderColor: '#6366f1',
        yAxisID: 'y1'
      },
      {
        type: 'bar',
        label: 'Check-Ins per Hour',
        data: checkInsPerHour,
        backgroundColor: 'rgba(16,185,129,0.6)',
        yAxisID: 'y'
      }
    ]
  }
}
```

**X-axis:** Time of day (for single-day events) or date (for multi-day events)  
**Dual Y-axis:** Left = check-in count per period, Right = cumulative registrations  
**Peak Annotation:** Vertical line marking the hour with most check-ins labeled "Peak: 3:00 PM (87 scans)"

---

### 3.6 Booking Sources Table

Tracks UTM parameters attached to event page URLs.

| Source          | Views  | Bookings | Conversion Rate | Revenue  |
|-----------------|--------|----------|-----------------|----------|
| Direct          | 1,200  | 45       | 3.75%           | ₹15,000  |
| Social Media    | 800    | 30       | 3.75%           | ₹10,000  |
| Search (Google) | 500    | 20       | 4.00%           | ₹7,000   |
| Referral        | 300    | 10       | 3.33%           | ₹3,500   |
| Email Campaign  | 200    | 15       | 7.50%           | ₹5,000   |

**Data Source:**  
- Views tracked via UTM `utm_source` parameter in Firebase Analytics events
- Bookings/revenue joined from `bookings` collection (field: `referralSource` written at checkout)

---

### 3.7 Demographics Panel

Displayed only if attendee demographic data is available.

**Age Distribution** — Horizontal Bar Chart
```typescript
const ageGroups = ['18–24', '25–34', '35–44', '45–54', '55+'];
// Data sourced from users/{uid}.dateOfBirth (if provided during registration)
// Optional field — chart hidden if <30% of attendees have data
```

**Gender Split** — Donut Chart  
- Data from `users/{uid}.gender` (optional profile field)
- Labels: Male / Female / Non-binary / Prefer not to say

**Location Heatmap** — Top 10 cities  
- Data from `bookings` collection, `attendeeDetails[].city`
- Displayed as ranked list with bar widths proportional to count
- Full map: Google Maps heatmap layer (if Maps API enabled)

**Privacy Note:** Demographics displayed only in aggregate. No individual-level data shown here.

---

### 3.8 Export Options Panel

Dropdown button in top-right "Export ▼":

| Export Option                    | Format | Cloud Function Called              |
|----------------------------------|--------|------------------------------------|
| Full Analytics Report            | PDF    | `generateAnalyticsReport`          |
| Revenue Data                     | CSV    | `exportRevenueData`                |
| Booking Data                     | CSV    | `exportBookingData`                |
| Attendee Data (GDPR compliant)   | CSV    | `exportAttendeeData`               |
| Chart Images (all 4 charts)      | ZIP/PNG| Client-side `chart.toBase64Image()`|

GDPR-compliant export: excludes raw email/phone unless organizer has consent flag; includes anonymized identifiers.

---

## 4. UI Requirements

### Chart Containers
- Each chart is in a `ChartCard` component with: title, subtitle, action menu (export/fullscreen)
- Fullscreen mode: chart expands to viewport overlay for detailed inspection
- Charts are responsive via `maintainAspectRatio: false` + container `height` CSS

### Loading States
- Skeleton shimmer placeholder for each chart card while data fetches
- Stat cards show `---` with pulse animation during initial load

### Empty States
- If event has 0 bookings: illustration + "No data yet. Share your event to start selling tickets."
- If event just published (<1h): "Analytics data will appear as tickets are sold."

### Period Selector
- Sticky below header, changes `periodStart` in Zustand store
- All charts and stat cards re-query/re-render on period change
- "All Time" uses `event.createdAt` as start date

### Color Palette (charts)
```
Green (primary):   #10b981  — Revenue, valid data
Indigo (secondary):#6366f1  — Net revenue, registrations
Amber (warning):   #f59e0b  — Conversion, averages
Red (alert):       #ef4444  — No-shows, drop-offs
Purple (accent):   #8b5cf6  — Demographic data
```

### Theming
- All charts inherit the Organizer teal/green accent
- Dark mode compatible (Chart.js theme override via `color` and `borderColor` CSS vars)

---

## 5. Firebase Services

### Firestore Queries

```typescript
// Revenue aggregation
const revenueQuery = query(
  collection(db, 'transactions'),
  where('eventId', '==', eventId),
  where('status', '==', 'paid'),
  where('timestamp', '>=', Timestamp.fromDate(periodStart))
);

// Tier breakdown
const tiersSnapshot = await getDocs(
  collection(db, 'events', eventId, 'tiers')
);

// Check-in timeline (for chart 4)
const checkInQuery = query(
  collection(db, 'tickets'),
  where('eventId', '==', eventId),
  where('status', '==', 'used'),
  orderBy('checkedInAt', 'asc')
);
```

### Real-Time Listeners
- `events/{id}` onSnapshot → updates stat cards live (views, bookings, checkIns)
- `events/{id}/tiers` onSnapshot → updates Chart 2 live during active sales

### Firestore Indexes Required
```
Collection: transactions
Fields: eventId ASC, status ASC, timestamp ASC
```

### Cloud Functions Called

| Function                  | Input                              | Output                        |
|---------------------------|------------------------------------|-------------------------------|
| `generateAnalyticsReport` | `{ eventId, format: 'pdf'|'csv' }` | `{ downloadUrl, expiresAt }`  |
| `exportRevenueData`       | `{ eventId, period }`              | `{ downloadUrl }`             |
| `exportBookingData`       | `{ eventId, period }`              | `{ downloadUrl }`             |
| `exportAttendeeData`      | `{ eventId, gdprMode: true }`      | `{ downloadUrl }`             |

### Firebase Analytics (Custom Events)
```javascript
// Written by public-facing event page (not Organizer dashboard)
logEvent(analytics, 'event_view',        { event_id, source: utm_source });
logEvent(analytics, 'add_to_cart',       { event_id, tier_id });
logEvent(analytics, 'begin_checkout',    { event_id, total_amount });
logEvent(analytics, 'purchase',          { event_id, transaction_id, value });
```
These funnel into `event.stats` fields via a Cloud Function trigger on `bookings` document creation.

---

## 6. State Management

### Zustand Store Slice
```typescript
// analytics slice in useOrganizerStore
analyticsData: {
  revenueByDay: RevenueDataPoint[];
  tierBreakdown: TierAnalytics[];
  funnelData: FunnelStage[];
  checkInTimeline: CheckInDataPoint[];
  bookingSources: BookingSource[];
  demographics: DemographicData | null;
};
selectedPeriod: '7d' | '30d' | '90d' | 'all';
analyticsLoading: boolean;
analyticsError: string | null;

fetchAnalytics: (eventId: string, period: string) => Promise<void>;
setAnalyticsPeriod: (period: string) => void;
exportAnalytics: (eventId: string, format: string) => Promise<string>;
```

### Data Computation (client-side)
```typescript
// Revenue aggregation done client-side after Firestore fetch
const revenueByDay = useMemo(() => {
  return groupBy(transactions, (t) => formatDate(t.timestamp))
    .map(([date, txns]) => ({
      date,
      gross: sum(txns.map(t => t.amount)),
      net: sum(txns.map(t => t.amount - t.serviceFee))
    }));
}, [transactions, selectedPeriod]);
```

---

## 7. Interconnections

| Connected Page / Component   | How Connected                                                        |
|------------------------------|----------------------------------------------------------------------|
| **AttendeeManagementPage**   | No-show rate, check-in stats shared from same Firestore listener     |
| **PayoutsPage**              | Net revenue figure shown here is the basis for payout amount         |
| **MarketingToolsPage**       | UTM source data links campaign performance to booking source chart   |
| **OrganizerDashboard**       | Dashboard summary cards link to this page for full detail            |
| **ManageEventPage (header)** | Shared event header component — same sticky bar                      |
| **Export Cloud Functions**   | PDF/CSV exports initiated from this page                             |

---

## 8. API Services Summary

| Service              | Provider       | Purpose                              |
|----------------------|----------------|--------------------------------------|
| Firestore            | Firebase       | Real-time event & transaction data   |
| Cloud Functions      | Firebase       | Report generation & exports          |
| Firebase Analytics   | Firebase       | Funnel tracking (event views, carts) |
| Firebase Storage     | Firebase       | Serve export files via signed URLs   |
| Chart.js             | npm (client)   | All interactive chart rendering      |
| Google Maps JS API   | Google         | Location heatmap in demographics     |

---

## 9. Error States & Edge Cases

| Scenario                        | Handling                                                          |
|---------------------------------|-------------------------------------------------------------------|
| Event has no transactions       | Empty state per chart with explanation message                    |
| Demographic data insufficient   | Hide demographics panel, show note "Add more attendee profile data"|
| Period with zero revenue        | Chart renders flat line at ₹0 (no blank chart)                   |
| Export for large event (>5000)  | Background job, email organizer when ready                        |
| Funnel data missing (cartAdds)  | Funnel chart shows stages with available data, greys out missing  |
| Real-time update during export  | Export uses server-side snapshot (not affected by live changes)   |
