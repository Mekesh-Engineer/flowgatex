# 🛡️ FlowGateX — Admin Role Documentation

> **Complete reference for Admin dashboard modules:** platform governance, user management, event moderation, organizer oversight, attendee management, transaction monitoring, and real-time Firebase + Razorpay integration.

---

## 📌 Table of Contents

1. [Overview & Architecture](#1-overview--architecture)
2. [Admin Roles & RBAC](#2-admin-roles--rbac)
3. [Global Architecture & Firebase Integration](#3-global-architecture--firebase-integration)
4. [Dashboard Pages — Full Specification](#4-dashboard-pages--full-specification)
   - [4.1 Admin Dashboard](#41-admin-dashboard-admin)
   - [4.2 User Management](#42-user-management-adminusers)
   - [4.3 Organizer Approvals & Oversight](#43-organizer-approvals--oversight-adminorganizers)
   - [4.4 Event Moderation](#44-event-moderation-adminevents)
   - [4.5 Attendee Management](#45-attendee-management-adminattendees)
   - [4.6 Transaction Monitoring](#46-transaction-monitoring-admintransactions)
   - [4.7 Reports & Analytics](#47-reports--analytics-adminreports)
   - [4.8 Promo Codes](#48-promo-codes-adminpromo-codes)
   - [4.9 Platform Settings](#49-platform-settings-adminsettings)
   - [4.10 Audit Logs](#410-audit-logs-adminaudit-logs)
5. [UI/UX Component Library](#5-uiux-component-library)
6. [Firebase Integration — Services & Listeners](#6-firebase-integration--services--listeners)
7. [Razorpay Integration](#7-razorpay-integration)
8. [Cross-Role Real-Time Synchronization](#8-cross-role-real-time-synchronization)
9. [Firestore Schema](#9-firestore-schema)
10. [Firestore Security Rules](#10-firestore-security-rules)
11. [Cloud Functions Reference](#11-cloud-functions-reference)
12. [Error Handling & Validation](#12-error-handling--validation)
13. [Folder Structure](#13-folder-structure)
14. [Known Issues & Roadmap](#14-known-issues--roadmap)

---

## 1. Overview & Architecture

The **Admin Dashboard** is the central governance layer of FlowGateX, providing platform-wide oversight across all users, events, organizers, attendees, and financial transactions. It is built for real-time responsiveness using Firestore listeners, secured via Firebase Authentication custom claims, and integrated with Razorpay for live payment data.

### Core Design Principles

**Real-Time First** — All data is served via Firestore `onSnapshot` listeners. No page renders static or mocked data. Every action (approve, reject, ban, refund) propagates instantly across all role dashboards (Attendee, Organizer, SuperAdmin).

**Role-Gated Rendering** — Every page and action uses `useRBAC()` to enforce permissions at the component level. Users without the required permission see either a gracefully degraded view or an access-denied state.

**Audit Everything** — Every Admin action writes an entry to the `audit_logs` collection. This is non-negotiable and is handled by a shared `logAdminAction()` utility to ensure consistency.

**No Dummy Data** — All `MOCK_*` constants, static arrays, and hardcoded stats are replaced by live Firestore queries and Razorpay API responses. Skeleton loaders replace placeholder content during fetch.

### Access Control Layers

```
Route Level     →  <RoleRoute allowedRoles={['admin', 'super_admin']}>
Layout Level    →  AdminLayout checks claims on every render
Component Level →  useRBAC() gates individual actions (approve, delete, etc.)
Firestore Level →  Security rules enforce role claims server-side
API Level       →  Cloud Functions verify caller claims before execution
```

---

## 2. Admin Roles & RBAC

### Role Hierarchy

| Role            | Level | Scope                                                 |
| --------------- | ----- | ----------------------------------------------------- |
| **Admin**       | 3     | Platform governance, user/event/organizer management  |
| **Super Admin** | 4     | Unconditional access — bypasses all permission checks |

### Full Admin Permission Registry

| Permission               | Admin | Super Admin | Description                                  |
| ------------------------ | ----- | ----------- | -------------------------------------------- |
| `user:read`              | ✅    | ✅          | View all user profiles                       |
| `user:manage`            | ✅    | ✅          | Edit user accounts                           |
| `user:assign_role`       | ⚠️ CF | ✅          | Change roles (via Cloud Function)            |
| `user:suspend`           | ✅    | ✅          | Suspend/ban accounts                         |
| `user:delete`            | ❌    | ✅          | Hard-delete user accounts                    |
| `user:verify`            | ✅    | ✅          | Verify organizer applications                |
| `attendee:read`          | ✅    | ✅          | View all attendee records and check-in logs  |
| `attendee:manage`        | ✅    | ✅          | Edit bookings, cancel tickets manually       |
| `event:read`             | ✅    | ✅          | View all events including unpublished drafts |
| `event:approve`          | ✅    | ✅          | Approve/reject event submissions             |
| `event:delete`           | ✅    | ✅          | Remove events from the platform              |
| `event:update`           | ✅    | ✅          | Edit event details                           |
| `finance:view`           | ✅    | ✅          | View platform-wide financial data            |
| `finance:manage`         | ✅    | ✅          | Issue refunds, manage payouts                |
| `finance:razorpay`       | ✅    | ✅          | Fetch live Razorpay transaction data         |
| `analytics:view`         | ✅    | ✅          | Access platform analytics                    |
| `analytics:export`       | ✅    | ✅          | Export analytics data as CSV/PDF             |
| `platform:settings`      | ✅    | ✅          | Modify platform configuration                |
| `platform:feature_flags` | ❌    | ✅          | Toggle feature flags (Super Admin only)      |
| `platform:security`      | ✅    | ✅          | Configure security policies                  |
| `platform:maintenance`   | ❌    | ✅          | Enable/disable maintenance mode              |
| `notification:send`      | ✅    | ✅          | Send platform-wide notifications             |
| `audit:read`             | ✅    | ✅          | View audit logs scoped to Admin actions      |
| `support:manage`         | ✅    | ✅          | Respond to and manage support tickets        |

> ⚠️ CF = Must be executed via Firebase Cloud Function; direct Firestore write not permitted.

### `useRBAC` Hook — Usage

```tsx
// src/hooks/useRBAC.ts
const { hasPermission, role, isAdmin, isSuperAdmin } = useRBAC();

// Component-level gating
{
  hasPermission('event:approve') && <Button onClick={handleApprove}>Approve Event</Button>;
}

// Page-level redirect
if (!hasPermission('finance:view')) {
  return <Navigate to="/unauthorized" />;
}
```

---

## 3. Global Architecture & Firebase Integration

### AdminLayout Wrapper

`src/layouts/AdminLayout.tsx` is the persistent shell for all `/admin/*` routes. It subscribes to global real-time data on mount and makes it available via `useAdminStore()`.

**Real-time subscriptions maintained by AdminLayout:**

```typescript
// Mount on layout load, unsubscribe on unmount
const unsubscribers = [
  subscribeToAdminStats(setStats), // Live KPI counts
  subscribeToSecurityAlerts(setAlerts), // New critical alerts
  subscribeToPendingApprovals(setPendingCount), // Badge count in nav
  subscribeToActiveMaintenanceMode(setMaintenance), // Maintenance toggle state
];
```

### Service Layer

| Service File                          | Responsibility                                       |
| ------------------------------------- | ---------------------------------------------------- |
| `src/services/adminService.ts`        | KPI aggregations, stats, global platform data        |
| `src/services/approvalsService.ts`    | Organizer application CRUD and workflow              |
| `src/services/userService.ts`         | User CRUD, role management, suspension logic         |
| `src/services/eventService.ts`        | Event moderation, status transitions, flags          |
| `src/services/transactionService.ts`  | Firestore transaction reads + Razorpay sync          |
| `src/services/razorpayService.ts`     | Razorpay API calls (via Cloud Function proxy)        |
| `src/services/attendeeService.ts`     | Attendee records, booking management, check-in data  |
| `src/services/auditService.ts`        | Audit log writes and reads                           |
| `src/services/settingsService.ts`     | Platform and feature flag settings                   |
| `src/services/reportService.ts`       | Report generation triggers and download URL fetching |
| `src/services/notificationService.ts` | FCM push notifications and in-app alerts             |

---

## 4. Dashboard Pages — Full Specification

---

### 4.1 Admin Dashboard (`/admin`)

**File:** `src/pages/dashboard/Admin/AdminDashboard.tsx`

**Purpose:** Real-time command center for platform health, key metrics, and critical actions.

#### Layout

Full-width two-column layout: main content area (75%) + right-side activity feed (25%). Sticky header with global search and alert bell.

#### A. Platform Status Bar (top strip)

A horizontal strip of colored status pills showing live connectivity:

| Service            | Indicator Logic                                             |
| ------------------ | ----------------------------------------------------------- |
| Firebase Firestore | Ping `system_health/firestore` doc, check latency           |
| Razorpay Gateway   | Cloud Function health check to Razorpay `/ping`             |
| Email Service      | Check `system_health/email.status`                          |
| Pending Approvals  | `organizer_access_requests` where `status == pending` count |

Auto-refreshes every 60 seconds via `setInterval`. Status: `green` (operational) / `yellow` (degraded) / `red` (down).

#### B. KPI Metric Cards

Six cards in a responsive 3-column grid (collapses to 2 on tablet, 1 on mobile). Each card shows a metric, trend delta vs. the previous 7 days, and a sparkline chart.

| Card                  | Firestore Source                                             | Calculation                              |
| --------------------- | ------------------------------------------------------------ | ---------------------------------------- |
| **Total Users**       | `users` collection count                                     | Snapshot count + delta via `daily_stats` |
| **Active Events**     | `events` where `status == 'published'` count                 | onSnapshot                               |
| **Platform Revenue**  | `transactions` where `status == 'paid'` sum of `platformFee` | Aggregated via Cloud Function            |
| **Active Organizers** | `organizer_profiles` where `status == 'active'` count        | onSnapshot                               |
| **Pending Approvals** | `organizer_access_requests` where `status == 'pending'`      | onSnapshot with red badge if > 0         |
| **Bookings Today**    | `bookings` where `createdAt >= today` count                  | Daily Firestore query                    |

```typescript
// adminService.ts — subscribes to all stats in one listener
export function subscribeToAdminStats(callback: (stats: AdminStats) => void) {
  const unsubFns: Unsubscribe[] = [];

  // Aggregate query for real-time KPIs
  unsubFns.push(
    onSnapshot(query(collection(db, 'daily_stats'), orderBy('date', 'desc'), limit(8)), snap => {
      const stats = buildStatsFromDocs(snap.docs);
      callback(stats);
    })
  );
  return () => unsubFns.forEach(u => u());
}
```

#### C. Revenue Trend Chart

Full-width Chart.js `LineChart` displaying platform revenue over a selectable period (7d / 30d / 90d / Custom). Data sourced from `daily_stats/{YYYY-MM-DD}.platformRevenue`.

- Toggle: **Total Revenue** vs. **Platform Fee** vs. **Organizer Payouts**
- Cyan gradient fill, responsive container
- Tooltips show breakdown: gross amount, platform fee, refunds

#### D. Recent Activity Feed

Live-updating list of the last 20 `audit_logs` entries (Admin-scope), subscribed via `onSnapshot`. Each entry is color-coded by action type:

| Action Type | Color  | Examples                        |
| ----------- | ------ | ------------------------------- |
| `create`    | Green  | Event approved, user created    |
| `delete`    | Red    | Event removed, account deleted  |
| `update`    | Blue   | Role changed, settings updated  |
| `auth`      | Purple | Admin login, session started    |
| `finance`   | Amber  | Refund issued, payout triggered |

#### E. Quick Actions Panel

Prominent action buttons for high-frequency tasks:

- **Review Pending Events** → navigates to `/admin/events?filter=pending_review`
- **Review Organizer Applications** → navigates to `/admin/organizers?filter=pending`
- **Issue Refund** → opens `RefundModal`
- **Send Announcement** → opens `AnnouncementComposerModal`
- **Export Platform Report** → triggers report generation Cloud Function

#### F. Implementation Notes

- Replace ALL hardcoded `stats` array entries with Firestore listeners
- `AdminDashboard` must not re-render on every listener update — use Zustand selectors to subscribe only to required slices
- Implement `<StatCardSkeleton />` for loading state while first data loads
- Chart data must handle empty `daily_stats` gracefully with a zero-fill strategy

---

### 4.2 User Management (`/admin/users`)

**File:** `src/pages/dashboard/Admin/UserManagementPage.tsx`

**Purpose:** Full lifecycle management of all platform users with real-time sync.

#### Data Source Migration

```typescript
// ❌ REMOVE — one-time fetch
const users = await getAllUsers(filters);

// ✅ REPLACE WITH — real-time listener with server-side pagination
export function subscribeToUsers(
  filters: UserFilters,
  lastDoc: DocumentSnapshot | null,
  callback: (users: User[], hasMore: boolean) => void
): Unsubscribe {
  let q = query(
    collection(db, 'users'),
    orderBy(filters.sortField ?? 'createdAt', filters.sortDir ?? 'desc'),
    limit(PAGE_SIZE)
  );

  if (filters.role) q = query(q, where('role', '==', filters.role));
  if (filters.status) q = query(q, where('accountStatus', '==', filters.status));
  if (lastDoc) q = query(q, startAfter(lastDoc));

  return onSnapshot(q, snap => {
    const users = snap.docs.map(docToUser);
    callback(users, snap.docs.length === PAGE_SIZE);
  });
}
```

#### Layout

Three-panel layout: collapsible filter sidebar (240px) + data table (flex-grow) + slide-in detail drawer (480px).

#### A. Filter Panel

- **Search:** Full-text search by name, email, or UID using Algolia index (or Firestore `>=` / `<=` prefix queries for MVP)
- **Role Filter:** All / Attendee / Organizer / Admin / Super Admin
- **Status Filter:** Active / Suspended / Deleted
- **Date Range:** Registration date range picker (react-datepicker)
- **Sort:** Newest / Oldest / Name A–Z / Most Bookings
- All filters are debounced (300ms) and update the Firestore query in real-time

#### B. Users Data Table

| Column        | Source                               | Interaction                               |
| ------------- | ------------------------------------ | ----------------------------------------- |
| Avatar + Name | `users/{uid}.displayName + photoURL` | Click → opens Detail Drawer               |
| Email         | `users/{uid}.email`                  | Hidden by default; 👁 toggle to reveal    |
| Role          | `users/{uid}.role`                   | Color-coded pill                          |
| Status        | `users/{uid}.accountStatus`          | Color-coded dot indicator                 |
| Verified      | `users/{uid}.emailVerified`          | ✅ / ❌ icon                              |
| Joined        | `users/{uid}.createdAt`              | Relative ("3 months ago"), absolute hover |
| Last Active   | `users/{uid}.lastLoginAt`            | Relative timestamp                        |
| Bookings      | `users/{uid}.bookingCount`           | Linked to booking list                    |
| Actions       | —                                    | ⋮ context menu                            |

#### C. Row Context Menu Actions

| Action            | Permission Required | Behavior                                    |
| ----------------- | ------------------- | ------------------------------------------- |
| View Profile      | `user:read`         | Opens User Detail Drawer                    |
| Edit Profile      | `user:manage`       | Inline edit form in drawer                  |
| Change Role       | `user:assign_role`  | Calls `setUserRole` Cloud Function          |
| Suspend Account   | `user:suspend`      | Opens `SuspendModal` with reason field      |
| Unsuspend Account | `user:suspend`      | Calls `unsuspendUser()` service             |
| View Bookings     | `user:read`         | Navigates to bookings filtered by this user |
| Export User Data  | `user:manage`       | Generates GDPR-compliant user data export   |
| Delete Account    | Super Admin only    | Soft-delete with 30-day recovery            |

#### D. Role Update Flow (Cloud Function Required)

```typescript
// ⚠️ Role changes MUST go through Cloud Function — direct Firestore writes are rejected by security rules
async function handleRoleUpdate(uid: string, newRole: Role, reason: string) {
  const setUserRole = httpsCallable(functions, 'setUserRole');
  try {
    await setUserRole({ targetUid: uid, newRole, reason });
    toast.success(`Role updated to ${newRole}`);
  } catch (error) {
    toast.error('Role update failed. Only Super Admins can assign admin roles.');
  }
}
```

#### E. User Detail Drawer

Slides in from the right (480px wide). Contains:

- **Profile Card:** Avatar, name, email, UID, phone, join date
- **Account Status:** Active / Suspended / Deleted with timestamp
- **Role History Timeline:** Who assigned each role and when (from `audit_logs`)
- **Activity Summary:** Total bookings, total spent, events attended
- **Security Info:** 2FA status, last login IP, active sessions count
- **Linked Organizer Profile:** (if applicable) link to organizer profile
- **Recent Audit Entries:** Last 10 actions taken on this user
- **Action Buttons:** Edit, Suspend, Change Role, Export, (Super Admin: Delete)

#### F. Bulk Actions

Appears when 1+ rows are selected:

- Suspend Selected
- Assign Role to Selected (calls Cloud Function for each)
- Export Selected (CSV with name, email, role, status, join date)
- Send Notification to Selected

---

### 4.3 Organizer Approvals & Oversight (`/admin/organizers`)

**File:** `src/pages/dashboard/Admin/OrganizerApprovalsPage.tsx`

**Purpose:** Review organizer applications AND provide ongoing oversight of approved organizers, their events, and revenue.

#### Tabs

The page has two primary tabs:

**Tab 1: Applications Queue** — Pending approval requests
**Tab 2: Active Organizers** — Live overview of approved organizers

#### Tab 1: Applications Queue

**Data Source:**

```typescript
// approvalsService.ts
export function subscribeToPendingApplications(
  callback: (apps: OrganizerApplication[]) => void
): Unsubscribe {
  return onSnapshot(
    query(
      collection(db, 'organizer_access_requests'),
      where('status', '==', 'pending'),
      orderBy('submittedAt', 'asc') // FIFO review order
    ),
    snap => callback(snap.docs.map(docToApplication))
  );
}
```

**Application Card Layout:**

Each application renders as a card with:

- Applicant name, email, avatar, join date
- Organization name and description
- Application submission date and time
- Submitted documents list (links to Firebase Storage signed URLs):
  - Government ID / KYC document
  - Business registration certificate (if applicable)
  - Organizer experience summary
- Event history (past events if re-applying)
- Status badge: Pending / Under Review / Approved / Rejected

**Review Actions:**

| Action           | Behavior                                                                      |
| ---------------- | ----------------------------------------------------------------------------- |
| **Approve**      | Calls `approveOrganizerApplication()` Cloud Function                          |
| **Reject**       | Opens modal with required reason field; calls `rejectOrganizerApplication()`  |
| **Request Info** | Sends email requesting additional documents; sets status to `info_requested`  |
| **Preview Docs** | Opens in-app secure document viewer (PDF/image viewer via signed Storage URL) |

**Approval Cloud Function Flow:**

```
approveOrganizerApplication(requestId) →
  1. Verify caller is admin or super_admin
  2. Fetch organizer_access_requests/{requestId}
  3. Create organizer_profiles/{uid} document
  4. Call setUserRole({ targetUid, newRole: 'organizer' })
  5. Update request status → 'approved'
  6. Send approval email via Cloud Function
  7. Write audit_log entry
  8. Real-time update propagates to applicant's dashboard instantly
```

#### Tab 2: Active Organizers Oversight

A searchable data table of all approved organizers with live stats:

| Column          | Source                                                        |
| --------------- | ------------------------------------------------------------- |
| Organizer Name  | `organizer_profiles/{uid}.organizationName`                   |
| Owner           | `users/{uid}.displayName`                                     |
| Events (Total)  | Aggregated from `events` collection                           |
| Events (Active) | `events` where `organizerId == uid AND status == 'published'` |
| Total Revenue   | Sum of `transactions.organizerAmount` for this organizer      |
| Pending Payout  | `payouts` where `organizerId == uid AND status == 'pending'`  |
| Status          | `organizer_profiles/{uid}.status`                             |
| Actions         | View Profile, View Events, Suspend, Revoke                    |

---

### 4.4 Event Moderation (`/admin/events`)

**File:** `src/pages/dashboard/Admin/EventModerationPage.tsx`

**Purpose:** Review, approve, moderate, and manage all platform events.

#### Data Source

```typescript
// ❌ REMOVE — MOCK_FLAGGED, MOCK_ALL_EVENTS

// ✅ REPLACE WITH
export function subscribeToModerationQueue(callback: (events: EventRecord[]) => void): Unsubscribe {
  // Pending review events
  const q = query(
    collection(db, 'events'),
    where('status', 'in', ['pending_review', 'flagged']),
    orderBy('submittedAt', 'asc')
  );
  return onSnapshot(q, snap => callback(snap.docs.map(docToEvent)));
}

export function subscribeToAllEvents(
  filters: EventFilters,
  callback: (events: EventRecord[]) => void
): Unsubscribe {
  let q = query(collection(db, 'events'), orderBy('createdAt', 'desc'), limit(50));
  if (filters.status) q = query(q, where('status', '==', filters.status));
  if (filters.organizerId) q = query(q, where('organizerId', '==', filters.organizerId));
  return onSnapshot(q, snap => callback(snap.docs.map(docToEvent)));
}
```

#### Layout

Two-tab layout: **Moderation Queue** (pending + flagged events) + **All Events** (full catalog with filters).

#### A. Moderation Queue Tab

Each event in the queue shows:

- Event title, category, date/time, venue
- Organizer name and organization (linked to organizer profile)
- Submission timestamp and days in queue
- Event description preview
- Ticket pricing tiers
- Uploaded banner image (preview thumbnail)
- Flag reason (if flagged by attendees)
- Review buttons: **Approve**, **Reject**, **Request Changes**

**Moderation Actions:**

```typescript
// eventService.ts

export async function approveEvent(eventId: string, adminNote?: string): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, 'events', eventId), {
    status: 'published',
    approvedAt: serverTimestamp(),
    approvedBy: getCurrentUserId(),
    adminNote: adminNote ?? null,
  });
  batch.set(doc(collection(db, 'audit_logs')), buildAuditEntry('event:approve', eventId));
  await batch.commit();
  // Cloud Function handles: email notification to organizer + push notification
}

export async function rejectEvent(eventId: string, reason: string): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, 'events', eventId), {
    status: 'rejected',
    rejectedAt: serverTimestamp(),
    rejectedBy: getCurrentUserId(),
    rejectionReason: reason,
  });
  batch.set(
    doc(collection(db, 'audit_logs')),
    buildAuditEntry('event:reject', eventId, { reason })
  );
  await batch.commit();
  // Cloud Function: send rejection email with reason to organizer
}

export async function dismissFlag(eventId: string): Promise<void> {
  await updateDoc(doc(db, 'events', eventId), {
    'flags.count': 0,
    'flags.reasons': [],
    'flags.dismissedAt': serverTimestamp(),
    'flags.dismissedBy': getCurrentUserId(),
    status: 'published',
  });
}
```

#### B. All Events Tab

**Filter Bar:**

- Status: All / Draft / Pending Review / Published / Completed / Cancelled / Rejected / Flagged
- Category: dropdown from platform event categories
- Date Range: from/to date picker
- Organizer: searchable dropdown
- Sort: Date ↑↓ / Title A–Z / Bookings ↓ / Revenue ↓

**Events Table:**

| Column    | Content                                     | Sortable |
| --------- | ------------------------------------------- | -------- |
| Title     | Event name + category pill                  | ✅       |
| Organizer | Name + org, linked to organizer profile     | ✅       |
| Date      | Event start date + time                     | ✅       |
| Status    | Color-coded pill                            | ✅       |
| Bookings  | Confirmed bookings / total capacity         | ✅       |
| Revenue   | Gross revenue from this event               | ✅       |
| Flags     | Flag count badge (red if >0)                | ✅       |
| Actions   | Approve, Reject, Edit, Delete, View Details | —        |

#### C. Event Detail Modal

Full-screen overlay with:

- All event fields (title, description, venue, dates, pricing)
- Ticket tier breakdown (available, sold, reserved)
- Booking list (last 20 attendees)
- Transaction summary
- Flag report list (who flagged, reason, timestamp)
- Moderation history (status change timeline)

#### D. Cross-Role Sync

When an event status changes in Admin:

- **Organizer Dashboard** — event status updates in real-time via `onSnapshot`
- **Attendee Dashboard** — for rejected events with existing bookings, a Cloud Function auto-issues refunds and sends notifications
- **SuperAdmin Dashboard** — KPI counts update via `daily_stats` listener

---

### 4.5 Attendee Management (`/admin/attendees`)

**File:** `src/pages/dashboard/Admin/AttendeeManagementPage.tsx`

**Purpose:** View and manage all attendee records, bookings, check-ins, and tickets across all events.

#### Data Source

```typescript
// attendeeService.ts
export function subscribeToAttendees(
  filters: AttendeeFilters,
  callback: (attendees: AttendeeRecord[]) => void
): Unsubscribe {
  let q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
  if (filters.eventId) q = query(q, where('eventId', '==', filters.eventId));
  if (filters.userId) q = query(q, where('userId', '==', filters.userId));
  if (filters.status) q = query(q, where('status', '==', filters.status));

  return onSnapshot(q, snap => callback(snap.docs.map(docToBooking)));
}
```

#### Layout

Full-width data table with expandable row detail. Top filter bar.

#### A. Filter Bar

- **Event Filter:** Searchable dropdown of all events
- **Status Filter:** Confirmed / Checked In / Cancelled / Refunded / Pending
- **Date Filter:** Booking date range
- **Search:** Attendee name or email
- **Ticket Type:** Filter by ticket tier

#### B. Attendee Table

| Column       | Source                       | Notes                           |
| ------------ | ---------------------------- | ------------------------------- |
| Attendee     | `bookings.userName` + avatar | Linked to user profile          |
| Event        | `bookings.eventTitle`        | Linked to event detail          |
| Tickets      | `bookings.ticketCount`       | Count per tier                  |
| Total Paid   | `bookings.totalAmount`       | Platform fee + organizer amount |
| Status       | `bookings.status`            | Color-coded pill                |
| Check-in     | `bookings.checkedInAt`       | ✅ checked / — not checked      |
| Booking Date | `bookings.createdAt`         | Formatted timestamp             |
| Actions      | —                            | View, Cancel, Refund            |

#### C. Attendee Actions

| Action              | Behavior                                                                         |
| ------------------- | -------------------------------------------------------------------------------- |
| **View Details**    | Expands row or opens drawer with full booking + ticket + transaction info        |
| **Cancel Booking**  | Admin-forced cancellation; triggers refund eligibility check; sends notification |
| **Issue Refund**    | Opens `AdminRefundModal` — full or partial refund via Razorpay API               |
| **Download Ticket** | Generates a PDF ticket copy for support requests                                 |
| **Check In**        | Manual override check-in for attendee (logged in audit trail)                    |

#### D. Check-In Statistics Panel

For each event, a collapsible stats panel shows:

- Total registered vs. total checked in (progress bar)
- Check-ins over time (sparkline chart, data from `checkins` sub-collection)
- Gate-by-gate breakdown (from IoT scanner data)
- Real-time occupancy percentage

---

### 4.6 Transaction Monitoring (`/admin/transactions`)

**File:** `src/pages/dashboard/Admin/TransactionMonitoringPage.tsx`

**Purpose:** Live monitoring of all platform transactions, Razorpay payment data, refunds, and organizer payouts.

#### Architecture

```
Razorpay Webhook → Cloud Function → Firestore `transactions` collection
                                           ↓
                                    onSnapshot listener
                                           ↓
                               TransactionMonitoringPage
```

All transaction data is synchronized from Razorpay to Firestore via webhooks. The Admin page reads exclusively from Firestore — Razorpay API is only called directly for reconciliation, refund initiation, and payout management.

#### A. Revenue Summary Cards

| Card                          | Calculation                                                     |
| ----------------------------- | --------------------------------------------------------------- |
| **Gross Revenue (Period)**    | Sum of `transactions.amount` where `status == 'paid'`           |
| **Platform Fee Collected**    | Sum of `transactions.platformFee` where `status == 'paid'`      |
| **Total Refunds**             | Sum of `transactions.refundAmount` where `status == 'refunded'` |
| **Net Revenue**               | Gross Revenue − Refunds                                         |
| **Pending Organizer Payouts** | Sum of `payouts.amount` where `status == 'pending'`             |
| **Failed Transactions**       | Count of `transactions` where `status == 'failed'`              |

All cards use `onSnapshot` on pre-aggregated `financial_summary/{period}` documents (updated by Cloud Function on every transaction write) to avoid repeated full-collection scans.

#### B. Transaction Table

```typescript
// transactionService.ts
export function subscribeToTransactions(
  filters: TransactionFilters,
  callback: (txns: Transaction[]) => void
): Unsubscribe {
  let q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
  if (filters.status) q = query(q, where('status', '==', filters.status));
  if (filters.gateway) q = query(q, where('gateway', '==', filters.gateway));
  if (filters.dateFrom)
    q = query(q, where('createdAt', '>=', Timestamp.fromDate(filters.dateFrom)));
  return onSnapshot(q, snap => callback(snap.docs.map(docToTransaction)));
}
```

| Column           | Content                                       |
| ---------------- | --------------------------------------------- |
| Transaction ID   | Truncated Razorpay ID + copy icon             |
| Razorpay Order   | `razorpay_order_id` (copy icon)               |
| Attendee         | Name + email                                  |
| Event            | Event title + organizer                       |
| Gross Amount     | Total paid by attendee (₹)                    |
| Platform Fee     | `transactions.platformFee` (₹)                |
| Organizer Amount | Gross − Platform Fee (₹)                      |
| Gateway          | Razorpay / Mock pill                          |
| Status           | Paid / Refunded / Failed / Pending color pill |
| Date             | Absolute timestamp                            |
| Actions          | View Details, Issue Refund, Download Receipt  |

#### C. Transaction Detail Modal

Opens on row click or "View Details" action:

- Full payment breakdown: gross, platform fee, taxes, organizer amount
- Razorpay payment ID, order ID, signature verification status
- Payment method: UPI / Card / Net Banking / Wallet
- Webhook event history (timeline of events received from Razorpay)
- Booking details: event, ticket tier, quantity, attendee
- Refund history (if any partial refunds issued)

#### D. Refund Management

```typescript
// razorpayService.ts — all calls via Cloud Function proxy
export async function initiateRefund(params: RefundParams): Promise<RefundResult> {
  const issueRefund = httpsCallable(functions, 'issueRefund');
  const result = await issueRefund({
    transactionId: params.transactionId,
    amount: params.amount, // In paise
    reason: params.reason,
    notifyAttendee: params.notify,
  });
  return result.data as RefundResult;
}
```

**Admin Refund Modal Fields:**

- Booking summary (read-only)
- Original payment details (read-only)
- Refund type: Full / Partial
- Refund amount input (for partial; pre-filled with full amount)
- Reason (required): dropdown (Event Cancelled / Admin Override / Technical Issue / Customer Request / Other)
- Notify Attendee: toggle (default ON)
- Confirm button — calls `issueRefund` Cloud Function

#### E. Organizer Payouts Sub-page (`/admin/transactions/payouts`)

```typescript
// Payout data from Firestore, synced from Razorpay Route/Linked Account
export function subscribeToPendingPayouts(callback: (payouts: Payout[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'payouts'), where('status', 'in', ['pending', 'processing'])),
    snap => callback(snap.docs.map(docToPayout))
  );
}
```

**Payout Table Columns:** Organizer, Organization, Net Amount, Events Covered, Requested Date, Status, Actions (Approve / Block / View Details).

**Payout Approval Flow:**

```
Admin clicks Approve →
  Cloud Function: triggerOrganizerPayout(payoutId) →
    Calls Razorpay Linked Account Transfer API →
    Updates payout.status = 'processing' →
    Webhook confirms transfer →
    Updates payout.status = 'completed' →
    Organizer Dashboard updates in real-time
```

#### F. Razorpay Reconciliation

A reconciliation panel compares:

- Firestore `transactions` collection totals
- Razorpay settlement report data (fetched via Cloud Function daily)

Highlights discrepancies: successful Razorpay payment with no matching Firestore record, or vice versa. These require manual investigation and are highlighted in amber.

---

### 4.7 Reports & Analytics (`/admin/reports`)

**File:** `src/pages/dashboard/Admin/ReportsPage.tsx`

**Purpose:** Generate and export live data reports from Firestore as CSV or JSON.

#### Current Implementation

Reports are generated client-side from live Firestore data. The page subscribes to three real-time data sources:

```typescript
// ReportsPage.tsx — live data sources
useEffect(() => {
  const unsubStats = subscribeToAdminStats(setStats); // Platform KPIs
  const unsubTxn = subscribeToTransactions({}, setTransactions); // All transactions
  const unsubAudit = subscribeToAuditLogs({}, setAuditLogs); // All audit entries
  return () => {
    unsubStats();
    unsubTxn();
    unsubAudit();
  };
}, []);
```

#### A. Report Generator Panel

Users select a report type, optional date range, and export format (CSV or JSON), then click **Generate Report**. The file downloads immediately.

| Report Type        | Data Source                      | Output Format |
| ------------------ | -------------------------------- | ------------- |
| Revenue Report     | `transactions` collection        | CSV + JSON    |
| Transaction Report | `transactions` collection        | CSV + JSON    |
| User Growth Report | `subscribeToAdminStats` snapshot | CSV + JSON    |
| Audit Log Report   | `audit_logs` collection          | CSV + JSON    |

**Generation Flow:**

```
Admin selects report type + date range + format →
  Client filters live Firestore data →
  Generates CSV or JSON in-browser →
  Triggers browser download →
  Report logged in session history table
```

#### B. Generated Reports Table

Session-based log (stored in component state) showing reports generated during the current session:

| Column      | Content             |
| ----------- | ------------------- |
| Report Name | Type + date label   |
| Generated   | Timestamp           |
| Records     | Number of data rows |
| Format      | CSV / JSON badge    |

#### C. Quick Export Buttons

One-click export buttons at the bottom of the page:

- **Export Audit Logs (JSON)** — Full audit log dump
- **Export Transactions (CSV)** — All transaction records
- **Export Stats (JSON)** — Current platform KPI snapshot

#### D. Live Data Indicators

The generator panel shows a subtitle confirming how many records are loaded from Firestore (e.g., "142 transactions, 35 audit entries loaded"), confirming all data is live — no mock data.

---

### 4.8 Promo Codes (`/admin/promo-codes`)

**File:** `src/pages/dashboard/Admin/PromoCodesPage.tsx`

**Purpose:** Create, manage, and monitor platform-wide promotional codes.

#### Data Source

```typescript
export function subscribeToPromoCodes(callback: (codes: PromoCode[]) => void): Unsubscribe {
  return onSnapshot(query(collection(db, 'promo_codes'), orderBy('createdAt', 'desc')), snap =>
    callback(snap.docs.map(docToPromoCode))
  );
}
```

#### Promo Code Properties

| Property        | Type      | Validation                              |
| --------------- | --------- | --------------------------------------- |
| `code`          | string    | Unique, alphanumeric, 4–16 chars, UPPER |
| `type`          | enum      | `percentage` \| `flat`                  |
| `value`         | number    | >0; if percentage: ≤100                 |
| `minOrderValue` | number    | ≥0                                      |
| `maxUses`       | number    | >0 or null (unlimited)                  |
| `usedCount`     | number    | Read-only, auto-incremented             |
| `expiresAt`     | timestamp | Must be in the future                   |
| `eventScope`    | string[]  | Empty = all events                      |
| `isActive`      | boolean   | Toggle to enable/disable                |

#### Promo Code Table

Shows all codes with live `usedCount` updating via `onSnapshot`. Actions: Edit, Deactivate, Delete, View Usage History.

**Usage History Modal:** Shows each redemption — user, event, booking amount, discount applied, date.

---

### 4.9 Platform Settings (`/admin/settings`)

**File:** `src/pages/dashboard/Admin/PlatformSettingsPage.tsx`

**Purpose:** Persistent platform configuration stored in Firestore, synchronized across all sessions in real-time.

#### Data Persistence

```typescript
// ❌ REMOVE — local state only (useState)

// ✅ REPLACE WITH — Firestore persistence
// Firestore path: SettingInfo/platform

export function subscribeToPlatformSettings(
  callback: (settings: PlatformSettings) => void
): Unsubscribe {
  return onSnapshot(doc(db, 'SettingInfo', 'platform'), snap => {
    if (snap.exists()) callback(snap.data() as PlatformSettings);
  });
}

export async function updatePlatformSettings(updates: Partial<PlatformSettings>): Promise<void> {
  await updateDoc(doc(db, 'SettingInfo', 'platform'), {
    ...updates,
    updatedAt: serverTimestamp(),
    updatedBy: getCurrentUserId(),
  });
  // Audit log written automatically by Firestore trigger Cloud Function
}
```

#### Settings Categories

**General Settings** — App name, support email, default timezone, ToS/Privacy Policy URLs, cookie banner toggle

**Feature Flags** — Admin can view flags but only Super Admin can toggle them (enforced by Firestore security rules and UI disabling)

**Security Policies** — Password requirements, 2FA enforcement per role, session timeout per role, max login attempts, account lockout duration

**Payment Settings** — Service fee per ticket (₹12 default), payment gateway display (keys are masked; updates go through Cloud Function, never directly to Firestore)

**Maintenance Mode** — Admin can view status; only Super Admin can toggle (UI shows current state with estimated end time if set)

**Notification Settings** — Configure email notification triggers (event approved, new organizer application, refund issued, etc.)

#### Change Confirmation

All settings changes require an inline confirmation step ("Are you sure you want to change the service fee from ₹12 to ₹15? This affects all future bookings.") before the Firestore write is committed.

---

### 4.10 Audit Logs (`/admin/audit-logs`)

**File:** `src/pages/dashboard/Admin/AuditLogsPage.tsx`

**Purpose:** Chronological, filterable record of all Admin-scope actions.

> Note: Admins see their own actions and platform-wide moderation events. Super Admins see all entries including system-level changes.

#### Data Source

```typescript
export function subscribeToAuditLogs(
  filters: AuditLogFilters,
  callback: (logs: AuditLogEntry[]) => void
): Unsubscribe {
  let q = query(
    collection(db, 'audit_logs'),
    where('performedByRole', 'in', ['admin', 'super_admin']),
    orderBy('timestamp', 'desc'),
    limit(100)
  );
  if (filters.actionType) q = query(q, where('action', '==', filters.actionType));
  if (filters.dateFrom)
    q = query(q, where('timestamp', '>=', Timestamp.fromDate(filters.dateFrom)));
  return onSnapshot(q, snap => callback(snap.docs.map(docToAuditEntry)));
}
```

#### Layout

Full-width log stream with filter controls at the top.

#### Filter Controls

- **Date Range:** From / To date picker
- **Actor:** Search by admin name or UID
- **Action Type:** Multi-select (create, update, delete, approve, reject, suspend, refund, etc.)
- **Resource Type:** Multi-select (user, event, organizer, booking, transaction, settings)
- **Severity:** Info / Warning / Critical

#### Log Entry Display

```
[2026-02-15 14:32:11 IST]  [WARNING]  🔴 Admin: admin@flowgatex.com
  Action:    event:reject
  Resource:  events/evt_abc123 — "Mumbai Jazz Night"
  Details:   Status changed: published → rejected
  Reason:    "Content violates community guidelines — inappropriate imagery"
  IP:        103.21.58.42
  Session:   sess_xyz789
  [▼ Expand to see full document diff]
```

#### Export

- Export as CSV or JSON
- Respects active filters (exports only filtered results)
- Warns if export exceeds 10,000 entries (suggests narrowing filters)
- Download link delivered as signed Firebase Storage URL

---

## 5. UI/UX Component Library

All Admin pages use a shared component library in `src/components/admin/`. This ensures visual and behavioral consistency.

### 5.1 AdminPageHeader

Standardized page header with title, subtitle, breadcrumb, and primary action button.

```tsx
<AdminPageHeader
  title="Event Moderation"
  subtitle="Review and approve event submissions"
  breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Events' }]}
  primaryAction={{ label: 'Export Events', icon: DownloadIcon, onClick: handleExport }}
  badge={{ count: pendingCount, label: 'Pending Review', color: 'amber' }}
/>
```

### 5.2 StatCard

KPI metric card with sparkline, delta indicator, and loading skeleton.

```tsx
<StatCard
  title="Total Revenue"
  value={formatCurrency(stats.totalRevenue)}
  delta={stats.revenueDelta}
  deltaLabel="vs. last 7 days"
  icon={<CurrencyRupeeIcon />}
  color="green"
  loading={statsLoading}
  sparklineData={sparklineData}
/>
```

### 5.3 DataTable

Reusable, sortable, paginated table with column configuration, row selection, and bulk actions.

```tsx
<DataTable<User>
  columns={userColumns}
  data={users}
  loading={loading}
  onSort={handleSort}
  onRowSelect={setSelectedRows}
  bulkActions={bulkActionConfig}
  emptyState={<EmptyUsersState />}
  pagination={{ page, pageSize: PAGE_SIZE, total, onPageChange }}
/>
```

### 5.4 FilterSidebar

Collapsible sidebar with filter inputs that emit a filter change callback.

### 5.5 DetailDrawer

Slide-in right drawer for entity detail views (user, event, organizer, transaction).

```tsx
<DetailDrawer
  isOpen={drawerOpen}
  onClose={() => setDrawerOpen(false)}
  title="User Profile"
  width={480}
>
  <UserDetailContent user={selectedUser} />
</DetailDrawer>
```

### 5.6 ConfirmModal

Reusable modal for destructive or significant actions.

```tsx
<ConfirmModal
  isOpen={confirmOpen}
  title="Reject Event"
  description="This will notify the organizer with your rejection reason."
  confirmLabel="Reject Event"
  confirmVariant="danger"
  requireInputMatch={false}
  onConfirm={handleReject}
  onCancel={() => setConfirmOpen(false)}
>
  <Textarea label="Rejection Reason" required onChange={setReason} />
</ConfirmModal>
```

### 5.7 StatusBadge

Color-coded pill for entity statuses (event status, user status, transaction status, payout status).

### 5.8 SkeletonLoader

Full-page and per-component skeleton loaders for all loading states. Never show spinners alone — use skeletons that match the expected layout.

### 5.9 EmptyState

Standardized empty state components with contextual illustrations and CTAs.

### 5.10 ToastNotification

Centralized toast system using a Zustand store. All Admin actions trigger a toast on success/error.

---

## 6. Firebase Integration — Services & Listeners

### Real-Time Listener Pattern (Standard)

All listeners must follow this pattern to prevent memory leaks:

```typescript
// In component:
useEffect(() => {
  const unsubscribe = subscribeToUsers(filters, users => {
    setUsers(users);
    setLoading(false);
  });
  return () => unsubscribe(); // Cleanup on unmount
}, [filters]);
```

### Firestore Composite Indexes Required

Add these indexes in `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "users",
      "fields": [{ "fieldPath": "role" }, { "fieldPath": "createdAt", "order": "DESCENDING" }]
    },
    {
      "collectionGroup": "users",
      "fields": [
        { "fieldPath": "accountStatus" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "events",
      "fields": [{ "fieldPath": "status" }, { "fieldPath": "submittedAt", "order": "ASCENDING" }]
    },
    {
      "collectionGroup": "events",
      "fields": [
        { "fieldPath": "organizerId" },
        { "fieldPath": "status" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "transactions",
      "fields": [{ "fieldPath": "status" }, { "fieldPath": "createdAt", "order": "DESCENDING" }]
    },
    {
      "collectionGroup": "transactions",
      "fields": [
        { "fieldPath": "gateway" },
        { "fieldPath": "status" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "organizer_access_requests",
      "fields": [{ "fieldPath": "status" }, { "fieldPath": "submittedAt", "order": "ASCENDING" }]
    },
    {
      "collectionGroup": "audit_logs",
      "fields": [
        { "fieldPath": "performedByRole" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "bookings",
      "fields": [
        { "fieldPath": "eventId" },
        { "fieldPath": "status" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 7. Razorpay Integration

### Architecture

```
Client Browser
     │
     │  ← All Razorpay API calls are PROXIED through Cloud Functions
     │     The client NEVER holds Razorpay secret keys
     ▼
Cloud Functions (Node.js)
     │  ← Uses RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET from Secret Manager
     ▼
Razorpay API (https://api.razorpay.com/v1)
     │
     ▼
Razorpay Webhook → Cloud Function endpoint → Firestore sync
```

### Razorpay Webhook Events Handled

| Webhook Event          | Cloud Function Action                                       |
| ---------------------- | ----------------------------------------------------------- |
| `payment.captured`     | Create/update `transactions` doc with `status: 'paid'`      |
| `payment.failed`       | Update `transactions` doc with `status: 'failed'`           |
| `refund.created`       | Update `transactions.refundStatus = 'initiated'`            |
| `refund.processed`     | Update status, write refund amount, notify attendee via FCM |
| `settlement.processed` | Update `payouts` doc, notify organizer                      |
| `order.paid`           | Confirm booking, issue tickets, notify attendee             |

### Webhook Signature Verification

```typescript
// Cloud Function: razorpayWebhook
export const razorpayWebhook = functions.https.onRequest(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;

  const isValid = validateWebhookSignature(JSON.stringify(req.body), signature, secret);

  if (!isValid) {
    console.error('Invalid Razorpay webhook signature');
    res.status(400).send('Invalid signature');
    return;
  }

  await processWebhookEvent(req.body);
  res.status(200).send('OK');
});
```

### Transaction Data Structure Synced from Razorpay

```typescript
interface Transaction {
  id: string; // Firestore doc ID = razorpay_payment_id
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
  bookingId: string;
  userId: string;
  eventId: string;
  amount: number; // In paise (÷100 for ₹)
  platformFee: number; // Typically ₹12 × ticketCount
  organizerAmount: number; // amount - platformFee
  currency: 'INR';
  status: 'paid' | 'refunded' | 'failed' | 'pending' | 'partially_refunded';
  gateway: 'razorpay' | 'mock';
  paymentMethod: 'upi' | 'card' | 'netbanking' | 'wallet';
  refundId?: string;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: Timestamp;
  webhookEvents: WebhookEvent[]; // Timeline of received webhook events
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 8. Cross-Role Real-Time Synchronization

When an Admin takes an action, changes propagate in real-time to all other role dashboards. This is achieved through Firestore `onSnapshot` listeners maintained by each dashboard.

### Synchronization Matrix

| Admin Action       | Attendee Dashboard Impact                  | Organizer Dashboard Impact                  | SuperAdmin Dashboard Impact      |
| ------------------ | ------------------------------------------ | ------------------------------------------- | -------------------------------- |
| Approve event      | Event becomes visible in browse/search     | Event status updates to "Published"         | Active events KPI increments     |
| Reject event       | Event removed from browse                  | Event status updates to "Rejected" + reason | KPI decrements                   |
| Approve organizer  | No direct impact                           | Full dashboard access granted               | Active organizers KPI increments |
| Suspend user       | User immediately logged out, can't log in  | (If organizer) events flagged for review    | Audit log entry appears in feed  |
| Issue refund       | Booking status → "Refunded", email sent    | Payout reduced accordingly                  | Financial KPI updates            |
| Approve payout     | No direct impact                           | Payout status → "Completed"                 | Pending payouts KPI decrements   |
| Cancel booking     | Booking status updates, email notification | Ticket inventory restored in real-time      | Transaction record updated       |
| Update service fee | Checkout shows updated fee                 | Revenue projections updated                 | Settings doc timestamp updated   |
| Delete event       | Active bookings auto-refunded + notified   | Event removed from organizer dashboard      | Events KPI decrements            |

### Implementation Pattern

Each dashboard subscribes to relevant collections using `onSnapshot`. The Admin's Firestore write is the single source of truth — no inter-service messaging is needed.

```typescript
// Example: Organizer dashboard reflects event status change instantly
// In OrganizerEventsList component:
useEffect(() => {
  return onSnapshot(
    query(collection(db, 'events'), where('organizerId', '==', currentUser.uid)),
    snap => setEvents(snap.docs.map(docToEvent))
  );
}, [currentUser.uid]);
// When Admin approves an event → Firestore write → this listener fires → UI updates
```

---

## 9. Firestore Schema

### `users/{uid}`

```json
{
  "uid": "string",
  "email": "string",
  "displayName": "string",
  "photoURL": "string | null",
  "role": "attendee | organizer | admin | super_admin",
  "accountStatus": "active | suspended | deleted",
  "suspensionReason": "string | null",
  "suspendedAt": "timestamp | null",
  "suspendedBy": "uid_string | null",
  "emailVerified": "boolean",
  "twoFactorEnabled": "boolean",
  "lastLoginAt": "timestamp",
  "lastLoginIp": "string",
  "bookingCount": "number",
  "totalSpent": "number",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### `events/{eventId}`

```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "organizerId": "string",
  "organizerName": "string",
  "category": "string",
  "status": "draft | pending_review | published | rejected | cancelled | completed",
  "rejectionReason": "string | null",
  "approvedAt": "timestamp | null",
  "approvedBy": "uid_string | null",
  "flags": {
    "count": "number",
    "reasons": ["string"],
    "dismissedAt": "timestamp | null"
  },
  "ticketTiers": [
    {
      "name": "string",
      "price": "number",
      "capacity": "number",
      "available": "number"
    }
  ],
  "startDate": "timestamp",
  "endDate": "timestamp",
  "venue": { "name": "string", "address": "string", "city": "string" },
  "bannerUrl": "string",
  "submittedAt": "timestamp",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### `organizer_access_requests/{requestId}`

```json
{
  "id": "string",
  "userId": "string",
  "userEmail": "string",
  "userName": "string",
  "organizationName": "string",
  "description": "string",
  "status": "pending | under_review | approved | rejected | info_requested",
  "submittedAt": "timestamp",
  "reviewedAt": "timestamp | null",
  "reviewedBy": "uid_string | null",
  "reviewNote": "string | null",
  "documents": [
    {
      "type": "kyc | business_registration | other",
      "storagePath": "string",
      "fileName": "string",
      "uploadedAt": "timestamp"
    }
  ]
}
```

### `transactions/{transactionId}`

_(See Section 7 — Razorpay Integration for full schema)_

### `payouts/{payoutId}`

```json
{
  "id": "string",
  "organizerId": "string",
  "organizerName": "string",
  "amount": "number",
  "currency": "INR",
  "eventIds": ["string"],
  "status": "pending | processing | completed | blocked | failed",
  "razorpayTransferId": "string | null",
  "requestedAt": "timestamp",
  "processedAt": "timestamp | null",
  "processedBy": "uid_string | null",
  "blockReason": "string | null"
}
```

### `audit_logs/{logId}`

```json
{
  "id": "auto-generated",
  "action": "string",
  "resource": "string",
  "resourceType": "user | event | organizer | booking | transaction | settings",
  "performedBy": "uid_string",
  "performedByRole": "admin | super_admin",
  "bypassedViaRole": "null | super_admin",
  "details": {
    "previousValue": "object | null",
    "newValue": "object | null",
    "reason": "string | null"
  },
  "severity": "info | warning | critical",
  "ipAddress": "string",
  "sessionId": "string",
  "timestamp": "timestamp"
}
```

### `financial_summary/{period}`

Pre-aggregated document updated by Cloud Function on every transaction write. Periods: `today`, `7d`, `30d`, `90d`, `all_time`.

```json
{
  "period": "today | 7d | 30d | 90d | all_time",
  "grossRevenue": "number",
  "platformFee": "number",
  "organizerAmount": "number",
  "totalRefunds": "number",
  "netRevenue": "number",
  "transactionCount": "number",
  "failedCount": "number",
  "updatedAt": "timestamp"
}
```

### `daily_stats/{YYYY-MM-DD}`

```json
{
  "date": "YYYY-MM-DD",
  "newUsers": "number",
  "activeUsers": "number",
  "newEvents": "number",
  "publishedEvents": "number",
  "newBookings": "number",
  "platformRevenue": "number",
  "refundsIssued": "number",
  "organizerApprovals": "number"
}
```

---

## 10. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserRole() {
      return request.auth.token.role;
    }

    function isAdmin() {
      return isAuthenticated() && getUserRole() in ['admin', 'super_admin'];
    }

    function isSuperAdmin() {
      return isAuthenticated() && getUserRole() == 'super_admin';
    }

    function isOwner(uid) {
      return isAuthenticated() && request.auth.uid == uid;
    }

    // ─────────────────────────────────────────────────
    // Users collection
    // ─────────────────────────────────────────────────
    match /users/{uid} {
      // Users can read their own profile; admins can read all
      allow read: if isOwner(uid) || isAdmin();

      // Users can update own non-sensitive fields
      allow update: if isOwner(uid) &&
        !request.resource.data.diff(resource.data).affectedKeys()
          .hasAny(['role', 'accountStatus', 'twoFactorEnforced']);

      // Admins can update all user fields EXCEPT role (must use Cloud Function)
      allow update: if isAdmin() &&
        !request.resource.data.diff(resource.data).affectedKeys()
          .hasAny(['role']);

      // Role updates require Super Admin via Cloud Function (handled server-side)
      // No direct write allowed for role field

      allow create: if isAuthenticated() && isOwner(uid);
      allow delete: if isSuperAdmin();
    }

    // ─────────────────────────────────────────────────
    // Events collection
    // ─────────────────────────────────────────────────
    match /events/{eventId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() &&
        request.auth.token.role in ['organizer', 'admin', 'super_admin'];
      allow update: if isAdmin() ||
        (isAuthenticated() && request.auth.uid == resource.data.organizerId &&
         resource.data.status in ['draft', 'rejected']);
      allow delete: if isAdmin();
    }

    // ─────────────────────────────────────────────────
    // Organizer access requests
    // ─────────────────────────────────────────────────
    match /organizer_access_requests/{requestId} {
      allow read: if isAdmin() ||
        (isAuthenticated() && request.auth.uid == resource.data.userId);
      allow create: if isAuthenticated();
      allow update: if isAdmin();
      allow delete: if isSuperAdmin();
    }

    // ─────────────────────────────────────────────────
    // Transactions — read by owner and admins
    // ─────────────────────────────────────────────────
    match /transactions/{txnId} {
      allow read: if isAdmin() ||
        (isAuthenticated() && request.auth.uid == resource.data.userId);
      // Transactions are written only by Cloud Functions (webhook handler)
      allow write: if false;
    }

    // ─────────────────────────────────────────────────
    // Payouts
    // ─────────────────────────────────────────────────
    match /payouts/{payoutId} {
      allow read: if isAdmin() ||
        (isAuthenticated() && request.auth.uid == resource.data.organizerId);
      allow update: if isAdmin(); // Approve / block payouts
      allow write: if false; // Created only by Cloud Functions
    }

    // ─────────────────────────────────────────────────
    // Platform settings — Super Admin only for write
    // ─────────────────────────────────────────────────
    match /SettingInfo/{doc} {
      allow read: if isAdmin();
      allow write: if isSuperAdmin();
    }

    // ─────────────────────────────────────────────────
    // Audit logs — append-only; admins can read
    // ─────────────────────────────────────────────────
    match /audit_logs/{logId} {
      allow read: if isAdmin();
      allow create: if isAdmin();  // Append-only via service functions
      allow update, delete: if false;  // Immutable — never update or delete
    }

    // ─────────────────────────────────────────────────
    // Feature flags — Super Admin only
    // ─────────────────────────────────────────────────
    match /feature_flags/{doc} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin();
    }

    // ─────────────────────────────────────────────────
    // Promo codes
    // ─────────────────────────────────────────────────
    match /promo_codes/{codeId} {
      allow read: if isAuthenticated();  // Needed for redemption validation
      allow write: if isAdmin();
    }

    // ─────────────────────────────────────────────────
    // Bookings
    // ─────────────────────────────────────────────────
    match /bookings/{bookingId} {
      allow read: if isAdmin() ||
        (isAuthenticated() && request.auth.uid == resource.data.userId) ||
        (isAuthenticated() && request.auth.uid == resource.data.organizerId);
      allow update: if isAdmin();
      allow create: if isAuthenticated();
      allow delete: if isSuperAdmin();
    }

    // ─────────────────────────────────────────────────
    // Report logs
    // ─────────────────────────────────────────────────
    match /report_logs/{reportId} {
      allow read: if isAdmin() &&
        (isSuperAdmin() || request.auth.uid == resource.data.generatedBy);
      allow write: if false; // Created only by Cloud Functions
    }

    // ─────────────────────────────────────────────────
    // Financial summary (pre-aggregated — read-only)
    // ─────────────────────────────────────────────────
    match /financial_summary/{period} {
      allow read: if isAdmin();
      allow write: if false; // Written only by Cloud Functions
    }

    // ─────────────────────────────────────────────────
    // Daily stats
    // ─────────────────────────────────────────────────
    match /daily_stats/{date} {
      allow read: if isAdmin();
      allow write: if false; // Written only by Cloud Functions
    }
  }
}
```

---

## 11. Cloud Functions Reference

### `setUserRole` — Role Assignment

```
Trigger:    HTTPS Callable
Auth:       Admin (for organizer role) | Super Admin (for admin/super_admin role)
Input:      { targetUid: string, newRole: Role, reason: string }
Steps:
  1. Verify caller claim from Firebase Auth token
  2. Enforce: only Super Admin can assign 'admin' or 'super_admin' roles
  3. Validate targetUid exists in Firestore
  4. Update users/{targetUid}.role in Firestore
  5. Set custom claim via Admin SDK: auth.setCustomUserClaims(uid, { role: newRole })
  6. Write audit_log entry
  7. Send notification email to targetUid
Output:     { success: true, updatedRole: newRole }
```

### `approveOrganizerApplication` — Organizer Approval

```
Trigger:    HTTPS Callable
Auth:       Admin or Super Admin
Input:      { requestId: string, note?: string }
Steps:
  1. Fetch organizer_access_requests/{requestId}
  2. Create organizer_profiles/{userId}
  3. Call setUserRole internally (userId, 'organizer')
  4. Update request: status = 'approved', reviewedAt, reviewedBy
  5. Send approval email via SendGrid
  6. Send push notification to applicant via FCM
  7. Write audit_log
Output:     { success: true, organizerProfileId: string }
```

### `issueRefund` — Razorpay Refund

```
Trigger:    HTTPS Callable
Auth:       Admin or Super Admin
Input:      { transactionId: string, amount: number, reason: string, notifyAttendee: boolean }
Steps:
  1. Verify caller permission: finance:manage
  2. Fetch transaction from Firestore
  3. Validate refund amount ≤ transaction.amount
  4. Call Razorpay Refunds API: POST /v1/payments/{id}/refund
  5. On success: update transactions/{id}.status + refundAmount
  6. Update bookings/{bookingId}.status = 'refunded'
  7. Restore event inventory: ticketTier.available += quantity
  8. If notifyAttendee: send email + FCM push
  9. Write audit_log with bypassFlag if Super Admin
Output:     { refundId: string, refundedAmount: number }
```

### `generateReport` — Report Generation

```
Trigger:    HTTPS Callable
Auth:       Admin or Super Admin
Input:      { type: ReportType, dateRange: { from, to }, format: 'pdf' | 'csv', filters?: object }
Steps:
  1. Verify caller has analytics:export permission
  2. Aggregate Firestore data based on type and dateRange
  3. Generate PDF (using PDFKit) or CSV
  4. Upload to Firebase Storage: /reports/{uid}/{timestamp}.{format}
  5. Create report_logs document with status, file path, metadata
  6. Generate signed URL (valid 1 hour)
  7. Write audit_log
Output:     { reportId: string, downloadUrl: string, expiresAt: ISO timestamp }
```

### `updateFinancialSummary` — Aggregation Trigger

```
Trigger:    Firestore onWrite: transactions/{txnId}
Auth:       System (not callable by client)
Steps:
  1. On every transaction create/update
  2. Recalculate financial_summary/today
  3. Update daily_stats/{today}
  4. Cloud Scheduler recalculates 7d/30d/90d/all_time summaries nightly
```

---

## 12. Error Handling & Validation

### Client-Side Validation

All Admin forms use React Hook Form + Zod for schema-based validation:

```typescript
// Example: Event rejection form schema
const rejectEventSchema = z.object({
  reason: z
    .string()
    .min(20, 'Rejection reason must be at least 20 characters')
    .max(500, 'Rejection reason must not exceed 500 characters'),
  notifyOrganizer: z.boolean().default(true),
});
```

### Error Handling in Service Functions

```typescript
// Standard error handling pattern across all service functions
export async function approveEvent(eventId: string): Promise<ServiceResult> {
  try {
    await updateDoc(doc(db, 'events', eventId), { status: 'published', ... });
    await logAdminAction('event:approve', eventId);
    return { success: true };
  } catch (error) {
    if (error instanceof FirestoreError) {
      if (error.code === 'permission-denied') {
        return { success: false, error: 'You do not have permission to approve events.' };
      }
    }
    console.error('approveEvent failed:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}
```

### Optimistic Updates

For non-critical operations (status badge updates, filter changes), use optimistic updates to improve perceived performance:

```typescript
// Optimistically update UI, then revert on error
const handleApprove = async (eventId: string) => {
  // Optimistic update
  setEvents(prev => prev.map(e => (e.id === eventId ? { ...e, status: 'published' } : e)));
  const result = await approveEvent(eventId);
  if (!result.success) {
    // Revert on failure
    setEvents(prev => prev.map(e => (e.id === eventId ? { ...e, status: 'pending_review' } : e)));
    toast.error(result.error);
  }
};
```

### Global Error Boundary

All Admin pages are wrapped in an `AdminErrorBoundary` that catches uncaught React errors, logs them to `error_logs` collection in Firestore, and displays a recovery UI.

---

## 13. Folder Structure

```
src/
├── pages/
│   └── dashboard/
│       └── Admin/
│           ├── AdminDashboard.tsx
│           ├── UserManagementPage.tsx
│           ├── OrganizerApprovalsPage.tsx
│           ├── EventModerationPage.tsx
│           ├── AttendeeManagementPage.tsx
│           ├── TransactionMonitoringPage.tsx
│           ├── ReportsPage.tsx
│           ├── PromoCodesPage.tsx
│           ├── PlatformSettingsPage.tsx
│           └── AuditLogsPage.tsx
│
├── components/
│   └── admin/
│       ├── AdminPageHeader.tsx
│       ├── StatCard.tsx
│       ├── DataTable.tsx
│       ├── FilterSidebar.tsx
│       ├── DetailDrawer.tsx
│       ├── ConfirmModal.tsx
│       ├── StatusBadge.tsx
│       ├── SkeletonLoader.tsx
│       ├── EmptyState.tsx
│       ├── TransactionDetailModal.tsx
│       ├── RefundModal.tsx
│       ├── UserDetailContent.tsx
│       ├── EventDetailModal.tsx
│       ├── OrganizerApplicationCard.tsx
│       ├── ReportGenerator.tsx
│       └── AuditLogEntry.tsx
│
├── services/
│   ├── adminService.ts
│   ├── approvalsService.ts
│   ├── userService.ts
│   ├── eventService.ts
│   ├── transactionService.ts
│   ├── razorpayService.ts
│   ├── attendeeService.ts
│   ├── auditService.ts
│   ├── settingsService.ts
│   ├── reportService.ts
│   └── notificationService.ts
│
├── hooks/
│   ├── useRBAC.ts
│   ├── useAdminStats.ts
│   ├── useFirestoreQuery.ts      # Generic onSnapshot hook
│   └── usePagination.ts
│
├── store/
│   └── useAdminStore.ts          # Zustand store for admin global state
│
├── layouts/
│   └── AdminLayout.tsx
│
└── types/
    └── admin.types.ts            # All Admin TypeScript interfaces
```

---

## 14. Known Issues & Roadmap

### Current Issues

| Issue                      | Details                                                                        | Priority |
| -------------------------- | ------------------------------------------------------------------------------ | -------- |
| Super Admin page overlap   | `/superadmin` currently reuses `AdminDashboard` — dedicated pages needed       | High     |
| Bulk operations incomplete | No bulk approve/reject for organizer applications                              | High     |
| Audit log gap              | Some edge-case Admin actions not yet writing to `audit_logs`                   | High     |
| Role downgrade sessions    | Downgrading a role doesn't immediately revoke active JWT tokens                | Medium   |
| Export formats limited     | Report exports currently JSON only; CSV/PDF pipeline not yet deployed          | Medium   |
| No full-text search        | User search is prefix-only; Algolia integration pending                        | Medium   |
| Financial reconciliation   | Manual reconciliation only; automated daily diff not yet scheduled             | Medium   |
| Razorpay test/live toggle  | Currently requires Cloud Function redeployment; should be runtime-configurable | Low      |

### Roadmap

| Feature                            | Target Version | Description                                               |
| ---------------------------------- | -------------- | --------------------------------------------------------- |
| Algolia Search Integration         | v1.2           | Full-text user and event search across all fields         |
| Automated Reconciliation           | v1.2           | Daily Cloud Scheduler diff of Razorpay vs Firestore data  |
| Bulk Organizer Approve/Reject      | v1.2           | Select and action multiple applications at once           |
| Token Revocation on Role Downgrade | v1.3           | Invalidate all active sessions when role is changed       |
| PDF/CSV Report Exports             | v1.3           | Full report generation pipeline with Cloud Functions      |
| Admin Mobile App                   | v2.0           | React Native admin interface for on-the-go moderation     |
| AI-Assisted Content Moderation     | v2.0           | ML classifier to flag potentially policy-violating events |
| Dedicated Super Admin Dashboard    | v1.3           | Separate pages and layout for Super Admin role            |

---

> **FlowGateX Admin Dashboard** — All data is live, all actions are logged, and all changes propagate instantly across every role dashboard. Zero dummy data, full Firestore integration, and complete Razorpay transaction visibility.

---

_© 2026 FlowGateX. All rights reserved. Last updated: February 2026 (v1.1)_
