# MyEventsPage.tsx — Specification

> **Route:** `/organizer/events`  
> **Role Access:** Organizer (own events only), Admin, Super Admin  
> **Purpose:** Central inventory management page for all events created by the organizer — browse, filter, search, create, duplicate, and manage all event records in one unified view.

---

## 1. Overview

My Events is the primary inventory hub where Organizers manage their entire event portfolio. It supports three view modes (grid, list, calendar), rich filtering, bulk operations, a quick-view slide panel, and direct deep-links to management sub-pages for each event. All data is scoped to `ownerUid == currentUser.uid`.

---

## 2. Page Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                           │
│ "My Events"  (X events total)          [ + Create Event ]           │
├──────────────────────────────────────────────────────────────────────┤
│ TOOLBAR                                                              │
│ [🔍 Search events...] [Status ▼] [Category ▼] [Date ▼] [Sort ▼]   │
│                         View: [ ▦ Grid ] [ ≡ List ] [ 📅 Calendar ] │
├────────────────────────────────────────────────────────────────────┬─┤
│ EVENT CONTENT AREA                                                  │ │
│ (Grid / List / Calendar based on selected view)                    │Q│
│                                                                     │u│
│                                                                     │i│
│                                                                     │c│
│                                                                     │k│
│ PAGINATION / Infinite scroll                                        │ │
└────────────────────────────────────────────────────────────────────┴─┘
```

---

## 3. Functionalities

### 3.1 Filter & Search Panel

#### Search Bar
- Searches across: `event.title`, `event.shortDescription`, `event.venue.name`, `event.venue.city`
- Debounced at 300ms
- Searches Firestore using array-contains or client-side filter (for small sets)
- Instant clear button (×) appears on input

#### Status Filter (multi-select chips)
```
[ All ] [ Published ] [ Draft ] [ Pending Review ] [ Ended ] [ Cancelled ] [ Archived ]
```
Each chip shows count: "Published (4)"

#### Category Filter (dropdown multi-select)
- 12 categories available: Conference / Festival / Workshop / Concert / Sports / Food & Drink / Art / Comedy / Networking / Wellness / Education / Other
- Multiple selections allowed

#### Date Range Filter (dropdown)
- Upcoming (startDate > today)
- This Week
- This Month
- Past Events (endDate < today)
- Custom date range picker (calendar pop-up)

#### Sort Options (dropdown)
| Option                    | Firestore `orderBy`                |
|---------------------------|------------------------------------|
| Newest First (default)    | `createdAt DESC`                   |
| Oldest First              | `createdAt ASC`                    |
| Alphabetical A–Z          | `title ASC`                        |
| By Ticket Sales (High)    | `ticketSummary.totalSold DESC`     |
| By Revenue (High)         | `ticketSummary.totalRevenue DESC`  |
| By Event Date (Soonest)   | `startDate ASC`                    |

#### Active Filter Summary
When filters are applied, shows a banner:
```
Showing: "Published" events in "Conference" · "Upcoming"
[ Clear All Filters ]
```

---

### 3.2 View A — Grid View (default)

3 columns desktop / 2 tablet / 1 mobile.

**Event Card Structure:**
```
┌─────────────────────────────────┐
│ [Cover Image — 16:9 aspect]     │
│ [Status Badge]  [Category Icon] │
│                                  │
│ Event Title (2-line truncate)    │
│ 📅 Mar 15, 2026 | 📍 Grand Bal  │
│                                  │
│ [████████████░░░░] 45/100 (45%) │  ← sales progress bar
│                                  │
│ Revenue: ₹12,500                 │
│                                  │
│ [ Edit ]  [ View ]  [ ⋮ More ]  │
└─────────────────────────────────┘
```

**Status Badge Colors:**
- Published: `bg-green-100 text-green-800`
- Draft: `bg-gray-100 text-gray-600`
- Pending Review: `bg-yellow-100 text-yellow-800`
- Ended: `bg-blue-100 text-blue-700`
- Cancelled: `bg-red-100 text-red-700`
- Archived: `bg-gray-200 text-gray-500`

**Hover Effects:**
- Card elevates: `box-shadow: 0 8px 24px rgba(0,0,0,0.12)`
- Quick action buttons fade in
- Cover image subtly scales (transform: scale(1.02))
- Amber left border if ticket sales <20%

**Card Context Menu (⋮):**
- View Event Page (opens public event page in new tab)
- Edit Event → `/organizer/events/:id/edit`
- Manage Attendees → `/organizer/events/:id/attendees`
- View Analytics → `/organizer/events/:id/analytics`
- Scan Tickets → `/organizer/scan?event=:id`
- Duplicate Event (clone)
- Download Attendee List (CSV)
- Unpublish (if published)
- Archive Event (soft delete — requires confirmation)
- Delete Event (blocked if active sales; confirmation modal)

---

### 3.3 View B — List View (Data Table)

Compact tabular format, full width.

| Column            | Content                                                  | Sortable |
|-------------------|----------------------------------------------------------|----------|
| ☑ Checkbox        | Row selection                                            | No       |
| Event             | 40×40 thumbnail + event title (clickable)               | Yes      |
| Status            | Pill badge                                               | Yes      |
| Category          | Icon + name                                              | Yes      |
| Date              | "Mar 15, 2026" + relative: "In 5 days"                  | Yes      |
| Venue             | Venue name + city                                        | Yes      |
| Tickets Sold      | `X / Y` with mini progress bar                           | Yes      |
| Revenue           | ₹ amount (gross)                                         | Yes      |
| Check-In Rate     | `X% checked in` (if event has started)                  | Yes      |
| Actions           | [ Edit ] [ View ] [ ⋮ ]                                  | No       |

**Expandable Row:** Click row to show quick summary without navigating:
- Full description snippet
- Tier breakdown: Tier Name / Price / Sold / Available
- Last 3 bookings

**Bulk Actions Bar** (appears when ≥1 row selected):
```
☑ 3 selected  |  [ Publish ]  [ Unpublish ]  [ Archive ]  [ Export CSV ]  [ ✕ Clear ]
```

Bulk operations call Cloud Functions with array of `eventId` values.

---

### 3.4 View C — Calendar View

**Component:** FullCalendar React component (`@fullcalendar/react`)  
**Default view:** Month

**Event Dot Indicators:**
- 🟢 Green: Published, active sales
- 🟡 Amber: Draft or low sales (<20%)
- 🔴 Red: Event happening today (organizer on-site)
- 🟣 Purple: Sold out

**Click Behavior:**
- Click event dot → popover with:
  - Event title, time, venue
  - Ticket progress: "45/100 sold"
  - Quick actions: View / Edit / Scan Tickets
- Click empty date → opens "Create Event" wizard with that date pre-filled

**Month/Week/Day Toggle:** Tabs in calendar header.  
**"+ Add Event" button:** In calendar header → same as Create Event CTA.

---

### 3.5 Quick View Panel

Triggered by event thumbnail click in grid/list (not the full card Edit/View buttons).

Slide-in panel from right (360px wide), doesn't navigate away from page.

**Contents:**
```
[Cover Image — full width banner]

[Status Badge]

Event Title
📅 Mar 15, 2026 · 6:00 PM – 10:00 PM IST
📍 Grand Ballroom, Mumbai
📂 Category: Conference

Description (first 200 chars)
[ Read More ↗ ] → opens public event page

━━━━━━━━ Ticket Tiers ━━━━━━━━
Tier         Price   Sold  Available  Revenue
Early Bird   ₹500    30    20         ₹15,000
General      ₹700    50    100        ₹35,000
VIP          ₹1500   10    0          ₹15,000

Total Revenue:  ₹65,000  (Gross)
Net Revenue:    ₹63,080  (after ₹12×(30+50+10) = ₹1,080 fees)
Sell-through:   45% of 200 capacity

━━━━━━━━ Quick Actions ━━━━━━━━
[ Edit Event ]  [ Manage Attendees ]  [ View Analytics ]
```

---

### 3.6 Create Event CTA

- Primary green button "**+ Create Event**" in page header
- Navigates to `/organizer/events/create` (8-step wizard)
- Also accessible from empty state, calendar view header

---

### 3.7 Duplicate Event

Triggered from card context menu.

**Flow:**
```
Click "Duplicate Event" →
  Confirmation modal:
    "Create a copy of [Event Name]?"
    [Cancel]  [Duplicate]
  On confirm:
    duplicateEvent(eventId) Cloud Function:
      1. Fetches source event document
      2. Clears: status → 'draft', publishedAt, stats, ticketSummary.totalSold
      3. Copies: all fields (title, description, venue, tiers, media, etc.)
      4. Appends " (Copy)" to title
      5. Sets dates to null (organizer must update)
      6. Creates new document in events collection
      7. Duplicates tiers sub-collection (sets sold=0, available=quantity)
    Success toast: "Event duplicated! Update the dates before publishing."
    Navigates to: /organizer/events/:newId/edit (Step 2: Date & Time)
```

---

### 3.8 Delete Event

**Conditions:**
- If 0 bookings: shows confirmation modal with "Delete Permanently" button
- If >0 bookings: shows blocked state:
  ```
  ⚠️ Cannot Delete — This event has 45 confirmed bookings.
  
  You can Archive this event instead (hides it, data retained).
  Or contact Admin to force-delete with refund processing.
  
  [ Archive Instead ]  [ Cancel ]
  ```

---

## 4. UI Requirements

### Pagination / Infinite Scroll
- Default: 20 events per page
- "Load More" button at bottom (not auto-scroll) for list/grid views
- Calendar view loads all events in current month

### Empty States
```
No events yet:
[Illustration of empty stage]
"You haven't created any events yet."
[ + Create Your First Event ]

No results for filters:
[Search illustration]
"No events match your filters."
[ Clear Filters ]
```

### Skeleton Loading
- Grid cards: 6 skeleton placeholders (grey shimmer)
- List rows: 10 skeleton rows

### Responsive
- **Desktop:** 3-column grid / full-width table
- **Tablet:** 2-column grid / scrollable table (sticky left columns)
- **Mobile:** 1-column grid cards; list view shows only: thumbnail, title, status, quick actions

### Performance
- Firestore query uses `startAfter` cursor for pagination (not `offset`)
- Cover images lazy-loaded via `loading="lazy"` + Intersection Observer
- Memoized event cards (`React.memo`) to prevent re-renders on unrelated state changes

---

## 5. Firebase Services

### Firestore Primary Query

```typescript
const eventsQuery = query(
  collection(db, 'events'),
  where('ownerUid', '==', currentUser.uid),
  where('status', 'in', selectedStatuses),   // multi-select filter
  orderBy(sortField, sortDirection),
  limit(20)
);

const unsubscribe = onSnapshot(eventsQuery, (snap) => {
  const events = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  setEvents(events);
  setLastDoc(snap.docs[snap.docs.length - 1]); // for pagination cursor
});
```

**Composite Indexes Required:**
```
Collection: events
Fields: ownerUid ASC, status ASC, createdAt DESC
Fields: ownerUid ASC, startDate ASC
Fields: ownerUid ASC, ticketSummary.totalSold DESC
```

### Real-Time Listener
- One `onSnapshot` listener on events collection
- Ticket sales progress bars update live as bookings come in
- New event appears in grid immediately after creation (no manual refresh)

### Cloud Functions Called

| Function            | Input                              | Output                           |
|---------------------|------------------------------------|----------------------------------|
| `duplicateEvent`    | `{ eventId }`                      | `{ newEventId }`                 |
| `publishEvent`      | `{ eventId }`                      | `{ status: 'published' }`        |
| `unpublishEvent`    | `{ eventId }`                      | `{ status: 'draft' }`            |
| `archiveEvent`      | `{ eventId }`                      | `{ status: 'archived' }`         |
| `deleteEvent`       | `{ eventId }`                      | `{ deleted: boolean }`           |
| `bulkPublish`       | `{ eventIds: string[] }`           | `{ results: BulkOpResult[] }`    |
| `bulkArchive`       | `{ eventIds: string[] }`           | `{ results: BulkOpResult[] }`    |
| `exportEvents`      | `{ eventIds: string[], format }`   | `{ downloadUrl }`                |

### Firebase Storage
- Event cover images: `/events/{eventId}/cover.jpg`
- Fetched via `getDownloadURL` for display in cards

---

## 6. State Management

```typescript
// useOrganizerStore events slice
myEvents: Event[];
eventFilters: {
  status: string[];
  category: string[];
  dateRange: 'upcoming' | 'this_week' | 'this_month' | 'past' | 'custom';
  customDateStart?: Date;
  customDateEnd?: Date;
  searchQuery: string;
  sortBy: string;
  sortDir: 'asc' | 'desc';
};
eventsViewMode: 'grid' | 'list' | 'calendar';
selectedEventIds: Set<string>;
lastDoc: DocumentSnapshot | null; // Firestore pagination cursor
eventsLoading: boolean;
quickViewEventId: string | null;

setEventsViewMode: (mode: ViewMode) => void;
setEventFilters: (filters: Partial<EventFilters>) => void;
loadMoreEvents: () => Promise<void>;
selectEvent: (id: string) => void;
selectAllEvents: () => void;
clearSelection: () => void;
setQuickViewEvent: (id: string | null) => void;
duplicateEvent: (id: string) => Promise<string>;
bulkPublish: (ids: string[]) => Promise<void>;
bulkArchive: (ids: string[]) => Promise<void>;
```

---

## 7. Interconnections

| Connected Page / Component       | How Connected                                                        |
|----------------------------------|----------------------------------------------------------------------|
| **CreateEventPage**              | Primary CTA navigates to create wizard                               |
| **ManageEventPage**              | "Edit" / "Manage Attendees" / "Analytics" links go to manage sub-pages|
| **ScannerPage**                  | "Scan Tickets" links from card to `/organizer/scan?event=:id`        |
| **OrganizerDashboard**           | "Upcoming Events Timeline" section shows first 5 from this collection|
| **EventAnalyticsPage**           | "View Analytics" card link                                           |
| **PayoutsPage**                  | Revenue figures shown here roll up to organizer's total balance      |

---

## 8. API Services Summary

| Service          | Provider    | Purpose                                  |
|------------------|-------------|------------------------------------------|
| Firestore        | Firebase    | Real-time event inventory                |
| Cloud Functions  | Firebase    | Duplicate, bulk ops, publish, archive    |
| Firebase Storage | Firebase    | Cover image serving                      |
| FullCalendar     | npm (client)| Calendar view component                  |

---

## 9. Error States & Edge Cases

| Scenario                          | Handling                                                          |
|-----------------------------------|-------------------------------------------------------------------|
| 0 events, no filters applied      | Full-page empty state with Create Event CTA                       |
| Delete with active bookings       | Blocked with "Archive Instead" fallback option                    |
| Bulk publish includes draft errors| Per-event result shown in toast; successful ones proceed          |
| Filter produces 0 results         | Empty state with "Clear Filters" CTA (not full-page empty)        |
| Image CDN unavailable             | Fallback to event category icon in cover area                     |
| Duplicate of a recurring event    | Only duplicates parent template, not instances                    |
