# 📊 FlowGateX — Organizer Dashboard Specification

> **Level 1 — Event Creation & Venue Operations Authority.**  
> The Organizer is the primary content creator in FlowGateX's 4-tier RBAC hierarchy. Organizers design, publish, and manage events; monitor IoT-powered venue operations; engage attendees through marketing campaigns; track real-time analytics; and manage financial payouts. This document provides complete specifications for every feature, page, component, and service required to build the Organizer Dashboard.

---

## 📌 Table of Contents

1. [Role Overview](#1-role-overview)
2. [Permission Model](#2-permission-model)
3. [Required Pages & UI Descriptions](#3-required-pages--ui-descriptions)
4. [Event Creation Workflow](#4-event-creation-workflow)
5. [IoT Device Integration](#5-iot-device-integration)
6. [Marketing & Promotion Tools](#6-marketing--promotion-tools)
7. [Financial Management](#7-financial-management)
8. [UI Components](#8-ui-components)
9. [Backend Services & Cloud Functions](#9-backend-services--cloud-functions)
10. [Firestore Schema](#10-firestore-schema)
11. [Real-Time Data Flows](#11-real-time-data-flows)
12. [State Management](#12-state-management)
13. [Navigation & Routing](#13-navigation--routing)
14. [Mobile Optimization](#14-mobile-optimization)

---

## 1. Role Overview

| Property             | Value                                                          |
| -------------------- | -------------------------------------------------------------- |
| **Role Name**        | Organizer                                                      |
| **Level**            | 1                                                              |
| **Role Key**         | `organizer`                                                    |
| **Permission Scope** | Own events, assigned venues, linked IoT devices                |
| **Assignable By**    | Admin or Super Admin                                           |
| **Revocable By**     | Admin or Super Admin                                           |
| **Can Assign**       | None (cannot assign roles)                                     |
| **2FA Recommended**  | Optional but encouraged                                        |
| **Session Timeout**  | Default: 4 hours idle (configurable by Admin)                  |
| **Scope**            | Own events only (cannot view or modify other Organizers' data) |

### Responsibilities

The Organizer is responsible for the **complete event lifecycle** from creation to post-event analytics:

- **Event Creation & Management:** Design events using an 8-step wizard, configure ticket tiers with dynamic pricing, set venue capacity and layout
- **Attendee Engagement:** Manage bookings, process refunds, communicate via bulk emails, track check-in status in real-time
- **IoT Operations:** Assign and configure gate scanners, crowd monitors, environmental sensors; monitor real-time device health and sensor readings
- **Marketing Campaigns:** Create promo codes, generate AI-assisted social media content, design event flyers, track campaign performance
- **Financial Oversight:** Monitor revenue streams, request payouts, view transaction history, track service fees (₹12/ticket)
- **Analytics & Insights:** Track ticket sales trends, attendee demographics, conversion funnels, gate throughput, crowd density heatmaps
- **Live Event Operations:** Scan tickets via web-based mobile scanner, monitor live occupancy, respond to IoT alerts, control gates remotely

### What Organizers Cannot Do

- View or edit events created by other Organizers
- Access platform-level settings or feature flags
- Assign roles to users (including Organizer role)
- Modify payment gateway configurations
- Deploy firmware to IoT devices (can send commands to own devices only)
- Access other organizations' data or financial records
- Approve or reject their own events (if Admin approval is required)
- Override refund eligibility checks (Admin intervention required)

---

## 2. Permission Model

Organizers have **resource-scoped permissions** — they can only act on resources they own (events, bookings, devices).

```
Layer 1: Account status check         →  user.status === 'active'? → PASS
Layer 2: Super Admin override         →  role === 'superadmin'?    → NO, continue
Layer 3: Platform feature flag check  →  is feature enabled?       → PASS / DENY
Layer 4: Org-level restrictions       →  any org-scoped overrides? → applied if present
Layer 5: Role permission + ownership  →  has permission AND owns resource? → ALLOW / DENY
```

### Explicit Permission Registry

#### 🗓 Event Permissions

| Permission         | Description                                              |
| ------------------ | -------------------------------------------------------- |
| `event:create`     | Create new events under own organization                 |
| `event:read`       | Read own events (including drafts)                       |
| `event:update`     | Edit own event details, schedule, venue, tiers           |
| `event:delete`     | Soft-delete own events (cannot delete with active sales) |
| `event:publish`    | Publish own events to make them publicly visible         |
| `event:unpublish`  | Remove own events from public listing                    |
| `event:duplicate`  | Clone an existing event as a template                    |
| `event:bulkImport` | Import events via JSON                                   |

#### 🎫 Booking & Ticket Permissions

| Permission          | Description                                       |
| ------------------- | ------------------------------------------------- |
| `booking:read`      | View bookings for own events                      |
| `booking:update`    | Update booking status (cancelled, refunded, etc.) |
| `booking:cancel`    | Cancel bookings for own events                    |
| `booking:refund`    | Initiate refunds (subject to eligibility checks)  |
| `booking:checkIn`   | Mark attendees as checked in via scanner          |
| `ticket:read`       | View individual tickets                           |
| `ticket:resend`     | Resend ticket QR codes to attendees via email     |
| `ticket:regenerate` | Regenerate QR codes (invalidates old codes)       |

#### 💰 Finance Permissions

| Permission                 | Description                              |
| -------------------------- | ---------------------------------------- |
| `finance:viewOwn`          | View revenue data for own events         |
| `finance:exportOwn`        | Export own financial records as CSV/JSON |
| `finance:requestPayout`    | Request payout of available balance      |
| `finance:viewPayoutStatus` | Track status of payout requests          |

#### 📊 Analytics Permissions

| Permission          | Description                              |
| ------------------- | ---------------------------------------- |
| `analytics:view`    | View analytics dashboards for own events |
| `analytics:export`  | Export analytics data as CSV/JSON        |
| `analytics:compare` | Compare performance across own events    |

#### 🔩 IoT Permissions

| Permission            | Description                                                           |
| --------------------- | --------------------------------------------------------------------- |
| `iot:read`            | View devices assigned to own events                                   |
| `iot:manage`          | Add, edit, decommission devices for own events                        |
| `iot:command`         | Send remote commands to own devices (reboot, calibrate, gate control) |
| `iot:configureAlerts` | Set sensor alert thresholds for own venues                            |
| `iot:viewReadings`    | View real-time sensor data from own devices                           |
| `iot:viewLogs`        | View diagnostic logs for own devices                                  |

#### 📢 Marketing Permissions

| Permission            | Description                                  |
| --------------------- | -------------------------------------------- |
| `marketing:promo`     | Create and manage promo codes for own events |
| `marketing:email`     | Send bulk emails to attendees                |
| `marketing:social`    | Access AI social media content generator     |
| `marketing:analytics` | View marketing campaign performance metrics  |

#### 👥 Attendee Management Permissions

| Permission             | Description                                |
| ---------------------- | ------------------------------------------ |
| `attendee:read`        | View attendee lists for own events         |
| `attendee:export`      | Export attendee data as CSV                |
| `attendee:communicate` | Send messages to individual/bulk attendees |
| `attendee:checkIn`     | Manually check in attendees                |

---

## 3. Required Pages & UI Descriptions

### 3.1 Organizer Dashboard (Command Center) — `/organizer`

**Purpose:** High-level performance overview and quick access to all organizer functions.

**Layout:** Full-width dashboard with sidebar navigation (similar to Admin but with green/teal accent theme).

---

**A. Header Bar**

- Welcome message: "Welcome back, [Organizer Name]!"
- Quick action buttons: **Create Event** (primary CTA, green), **Scan Tickets**, **View Payouts**
- Notification bell with badge (booking notifications, IoT alerts, low ticket warnings)
- Profile dropdown (settings, help, sign out)

---

**B. Key Metrics Cards (top row of 4)**

| Metric          | Display                                          | Trend Indicator    |
| --------------- | ------------------------------------------------ | ------------------ |
| Total Events    | Count with breakdown: Active / Draft / Completed | ↑↓ vs. last period |
| Total Revenue   | ₹ aggregate with mini sparkline chart            | ↑↓ % change        |
| Total Attendees | Sum across all events + "Checked In" sub-count   | ↑↓ vs. last period |
| Conversion Rate | (Tickets sold / Event views) × 100               | ↑↓ % change        |

Clicking each metric card navigates to the detailed view (e.g., Total Revenue → Payouts page).

---

**C. Revenue Overview Chart (full-width section)**

- **Chart Type:** Line chart (Chart.js) with gradient fill beneath the line
- **Data:** Daily revenue aggregated across all organizer's events
- **Period Toggle:** 7d / 30d / 90d / All Time
- **Breakdown Toggle:** Gross Revenue / Net Revenue (after service fees)
- **Hover:** Shows exact ₹ amount + ticket count for that day
- **Export Button:** Download chart as PNG or data as CSV

---

**D. Calendar Widget (left column)**

- **Component:** FullCalendar React component
- **Display:** Month view by default, toggles to Week / Day view
- **Event Indicators:**
  - Green dot: Published event with ticket sales
  - Amber dot: Draft event
  - Red dot: Event today (organizer should be on-site)
  - Purple dot: Event with low ticket sales (<20% sold)
- **Click Behavior:** Click date → shows events on that date in a popover with quick actions
- **Add Event Button:** "+" icon in calendar header to create new event with pre-filled date

---

**E. Activity Feed (right column)**

Real-time stream of latest 15 actions across all organizer's events:

- **New Booking:** "🎟️ New booking: 2 tickets for TechConf 2026 by John Doe (₹500)" — _2 minutes ago_
- **Payment Received:** "💰 Payment received: ₹1,200 from Jane Smith" — _8 minutes ago_
- **Low Ticket Alert:** "⚠️ Low ticket alert: Only 5 VIP tickets remaining for MusicFest" — _15 minutes ago_
- **Check-In:** "✅ Attendee checked in: Alice Johnson at Main Gate" — _1 hour ago_
- **IoT Alert:** "🚨 Temperature warning: 36°C at Venue A — Gate 2 Sensor" — _2 hours ago_
- **Refund Processed:** "↩️ Refund issued: ₹300 to Bob Williams" — _3 hours ago_

Each entry is clickable and navigates to the relevant detail page (booking, event, device, etc.).

Feed auto-updates via Firestore real-time listener — no page refresh needed.

---

**F. Upcoming Events Timeline (bottom section)**

- Horizontal timeline showing next 5 upcoming events (chronological order)
- Each event card:
  - Cover image thumbnail
  - Event name + date
  - Ticket sales progress bar: "X / Y sold (Z%)"
  - Status badge: Published / Draft
  - Quick actions: **View**, **Edit**, **Scan Tickets**

---

**G. Quick Actions Panel (sticky sidebar or floating action buttons)**

- **Create Event** (primary button)
- **Scan Tickets** (opens mobile scanner page)
- **View Analytics** (navigates to Analytics Overview)
- **Manage Devices** (IoT dashboard)
- **Marketing Tools** (promo codes, email campaigns)
- **Request Payout** (financial page)

---

### 3.2 My Events Management — `/organizer/events`

**Purpose:** Central inventory management for all events created by the organizer.

**Layout:** Grid/List view toggle + filters sidebar + event cards/table.

---

**A. Filter & Search Panel (left sidebar, collapsible)**

**Search Bar:**

- Full-text search across event title, description, venue name
- Instant results (debounced, 300ms delay)

**Status Filter (multi-select checkboxes):**

- All Events
- Published (green badge)
- Draft (grey badge)
- Ended (blue badge)
- Cancelled (red badge)

**Category Filter (dropdown multi-select):**

- All 12 categories selectable

**Date Range Filter:**

- "Upcoming" (startDate > today)
- "This Week"
- "This Month"
- "Past Events" (endDate < today)
- Custom date range picker

**Sort Options (dropdown):**

- Newest First (default)
- Oldest First
- Alphabetical (A-Z)
- By Ticket Sales (high to low)
- By Revenue (high to low)
- By Event Date (soonest first)

**View Toggle:**

- Grid View (default): 3 columns of event cards
- List View: Data table format
- Calendar View: Events plotted on calendar

---

**B. Event Cards (Grid View)**

Each card displays:

```
┌─────────────────────────────────┐
│ [Cover Image - 16:9 aspect]     │
├─────────────────────────────────┤
│ [Status Badge]   [Category Icon]│
│                                  │
│ Event Title (truncated 2 lines) │
│ 📅 Date | 📍 Venue               │
│                                  │
│ ╔═══════════════════════════╗   │
│ ║ Tickets: 45/100 (45%)     ║   │ ← Progress bar
│ ╚═══════════════════════════╝   │
│                                  │
│ Revenue: ₹12,500               │
│                                  │
│ [ Edit ]  [ View ]  [ ⋮ Menu ] │
└─────────────────────────────────┘
```

**Context Menu (⋮):**

- View Event Page (public view)
- Edit Event
- Manage Attendees
- View Analytics
- Scan Tickets
- Duplicate Event (clone as template)
- Download Attendee List
- Unpublish (if published)
- Archive Event (soft delete)
- Delete Event (requires confirmation if no sales; blocked if sales exist)

**Hover Effects:**

- Card elevates with shadow on hover
- Quick actions buttons fade in on hover

---

**C. Event List View (Table Format)**

| Column            | Content                                       | Sortable |
| ----------------- | --------------------------------------------- | -------- |
| Event             | Thumbnail + name                              | Yes      |
| Status            | Pill badge (Published/Draft/Ended/Cancelled)  | Yes      |
| Category          | Category name + icon                          | Yes      |
| Date              | Start date (relative: "In 5 days" + absolute) | Yes      |
| Venue             | Venue name + city                             | Yes      |
| Tickets Sold      | X / Y with progress bar                       | Yes      |
| Revenue           | ₹ amount                                      | Yes      |
| Attendee Check-In | X checked in / Y registered (%)               | Yes      |
| Actions           | Quick action icons (Edit, View, Analytics, ⋮) | No       |

**Bulk Actions (appears when rows are selected):**

- Publish Selected
- Unpublish Selected
- Archive Selected
- Export Selected (CSV with event + sales data)

---

**D. Quick View Modal (triggered from "View" button)**

Slide-in right panel showing event snapshot:

- Cover image
- Title, date, venue
- Description (first 200 chars with "Read More" expand)
- Ticket tiers table: Name / Price / Sold / Available / Revenue per tier
- Total revenue + net revenue (after fees)
- Sell-through rate (% of capacity sold)
- Quick actions: Edit / Manage Attendees / View Full Analytics
- Close button (X top-right)

---

### 3.3 Create Event (8-Step Wizard) — `/organizer/events/create`

**Purpose:** Guided event creation flow with live preview and validation.

**Layout:** Two-panel layout — form on left (60%), live preview on right (40%).

---

#### **Step 1: Basic Information**

**File:** `BasicInfoStep.tsx`

**Fields:**

| Field             | Type             | Validation                                       |
| ----------------- | ---------------- | ------------------------------------------------ |
| Event Title       | Text input       | Required, 10-100 characters                      |
| Short Description | Textarea         | Required, 50-200 characters (for listings)       |
| Full Description  | Rich text editor | Required, 200-5000 characters (Markdown support) |
| Category          | Dropdown         | Required, one of 12 categories                   |
| Event Format      | Radio group      | Single Day / Multi-Day / Recurring               |
| Tags              | Tag input        | Optional, max 10 tags (for search SEO)           |
| Event Language    | Dropdown         | Default: English, supports 10+ languages         |
| Age Restriction   | Dropdown         | All Ages / 13+ / 18+ / 21+                       |

**Rich Text Editor Features:**

- Bold, Italic, Underline, Strikethrough
- Headings (H1-H6)
- Bullet lists, numbered lists
- Links, blockquotes, code blocks
- Image embedding via URL
- Preview toggle (Markdown rendered)

**Live Preview Updates:**

- Title renders in preview header
- Description renders in preview body
- Category badge appears
- Tags render as pills

---

#### **Step 2: Date & Time**

**File:** `DateTimeStep.tsx`

**Fields:**

| Field               | Type                | Validation                              |
| ------------------- | ------------------- | --------------------------------------- |
| Start Date          | Date picker         | Required, cannot be in the past         |
| Start Time          | Time picker         | Required                                |
| End Date            | Date picker         | Required, must be ≥ start date          |
| End Time            | Time picker         | Required                                |
| Timezone            | Searchable dropdown | Required, default to user's detected TZ |
| Recurring Event?    | Toggle              | If ON, shows recurrence fields          |
| Recurrence Pattern  | Dropdown            | Daily / Weekly / Monthly                |
| Recurrence End Date | Date picker         | Required if recurring                   |

**Recurrence Logic:**

- If "Recurring" is ON: event creates multiple instances in Firestore
- Each instance has a `parentEventId` reference to the template
- Editing the template propagates changes to future instances only

**Smart Defaults:**

- End time auto-sets to start time + 2 hours
- If start date changes, end date auto-adjusts to same date

**Live Preview Updates:**

- Date displays prominently: "📅 March 15, 2026 | 6:00 PM - 10:00 PM IST"
- Countdown timer: "In 45 days"

---

#### **Step 3: Venue & Location**

**File:** `VenueStep.tsx`

**Fields:**

| Field               | Type                 | Validation                            |
| ------------------- | -------------------- | ------------------------------------- |
| Venue Type          | Radio group          | Physical / Virtual / Hybrid           |
| Venue Name          | Text input           | Required                              |
| Address Line 1      | Text input           | Required for physical                 |
| Address Line 2      | Text input           | Optional                              |
| City                | Text input           | Required                              |
| State/Province      | Text input           | Required                              |
| Postal Code         | Text input           | Optional                              |
| Country             | Dropdown             | Required, defaults to India           |
| Google Maps Search  | Autocomplete input   | Uses Google Places API                |
| Latitude/Longitude  | Auto-filled from map | Read-only (from map click)            |
| Venue Capacity      | Number input         | Required, min 1, max 100,000          |
| Virtual Meeting URL | URL input            | Required if Virtual/Hybrid            |
| Access Instructions | Textarea             | Optional (e.g., gate number, parking) |

**Google Maps Integration:**

- Embedded interactive map (Google Maps JavaScript API)
- Click on map → auto-fills address + lat/lng
- Venue marker placed on map (draggable to adjust)
- "Use My Location" button for mobile users
- Zoom controls, street view toggle

**Capacity Planning:**

- Warning if capacity < ticket quantity defined in Step 4
- Suggestion: "Consider creating VIP and General tiers to optimize sales."

**Live Preview Updates:**

- Venue name displays: "📍 Grand Ballroom, Mumbai"
- Map thumbnail renders with marker
- Capacity shows: "Capacity: 500 attendees"

---

#### **Step 4: Ticket Tiers**

**File:** `TicketTiersStep.tsx`

**Purpose:** Define multiple ticket tiers with pricing, quantity, and sale windows.

**Layout:** List of tier cards + "Add Tier" button.

---

**Tier Card Fields:**

| Field              | Type             | Validation                            |
| ------------------ | ---------------- | ------------------------------------- |
| Tier Name          | Text input       | Required (e.g., "Early Bird", "VIP")  |
| Tier Description   | Textarea         | Optional (benefits included)          |
| Price              | Number input     | Required, min ₹0 (free tier allowed)  |
| Quantity Available | Number input     | Required, min 1                       |
| Sale Start Date    | Date-time picker | Optional (default: now)               |
| Sale End Date      | Date-time picker | Optional (default: event start)       |
| Min Purchase       | Number input     | Default: 1                            |
| Max Purchase       | Number input     | Default: 10 per transaction           |
| Visibility         | Dropdown         | Public / Hidden / Invite-Only         |
| Gate Access Level  | Dropdown         | General / VIP / Backstage (IoT gates) |

**Dynamic Pricing Features:**

- **Early Bird Toggle:** If enabled, price increases after a date
  - Early Bird Price: ₹500
  - Regular Price: ₹700
  - Transition Date: March 1, 2026
- **Bulk Discount Toggle:** If enabled, discount for large quantities
  - Example: Buy 5+ tickets → 10% off
- **Promo Code Compatibility:** "Allow promo codes on this tier?" toggle

**Tier Ordering:**

- Drag-and-drop to reorder tiers (affects display order on event page)

**Inventory Warnings:**

- Warning if total tier quantities exceed venue capacity
- Real-time "available tickets" counter as users book

**Live Preview Updates:**

- Ticket pricing table renders in preview
- Shows: Tier name / Price / Availability / "Select" button

---

#### **Step 5: Media & Visuals**

**File:** `MediaStep.tsx`

**Fields:**

| Field          | Type                 | Validation                              |
| -------------- | -------------------- | --------------------------------------- |
| Cover Image    | Image uploader       | Required, 16:9 ratio, max 5MB           |
| Gallery Images | Multi-image uploader | Optional, up to 10 images, max 5MB each |
| Video URL      | URL input            | Optional, YouTube/Vimeo embed           |
| Event Banner   | Image uploader       | Optional, 1200×400px for social share   |

**Image Uploader Features:**

- Drag-and-drop or click to upload
- Instant preview with crop/rotate editor
- Auto-resize to optimal dimensions (1920×1080 for cover)
- Compression to reduce file size (maintains quality)
- Upload progress bar
- Firebase Storage backend

**Gallery Management:**

- Reorder images via drag-and-drop
- Set featured image (displays in listings)
- Delete individual images
- Captions input per image

**Video Embedding:**

- Auto-detects YouTube/Vimeo URLs
- Extracts video ID and generates embed code
- Preview player in live preview panel

**Live Preview Updates:**

- Cover image displays as hero section
- Gallery renders as thumbnail carousel
- Video embeds as iframe

---

#### **Step 6: Event Details & Agenda**

**File:** `DetailsStep.tsx`

**Sub-Sections:**

**A. Agenda / Schedule Builder**

Add multiple sessions/timeslots:

| Session Field       | Type                  | Validation                      |
| ------------------- | --------------------- | ------------------------------- |
| Session Title       | Text input            | Required                        |
| Session Description | Textarea              | Optional                        |
| Start Time          | Time picker           | Required                        |
| End Time            | Time picker           | Required                        |
| Speaker             | Dropdown (or add new) | Optional                        |
| Session Type        | Dropdown              | Talk / Workshop / Panel / Break |

Sessions display in timeline view in preview.

**B. Speakers**

Add speaker profiles:

| Speaker Field | Type           | Validation                 |
| ------------- | -------------- | -------------------------- |
| Speaker Name  | Text input     | Required                   |
| Title/Role    | Text input     | Optional                   |
| Bio           | Textarea       | Optional                   |
| Profile Photo | Image uploader | Optional, max 1MB          |
| Social Links  | URL inputs     | LinkedIn, Twitter, Website |

Speakers render as profile cards in preview.

**C. FAQs**

Add Q&A pairs:

| FAQ Field | Type       | Validation |
| --------- | ---------- | ---------- |
| Question  | Text input | Required   |
| Answer    | Textarea   | Required   |

FAQs render as expandable accordion in preview.

---

#### **Step 7: Organizer Information**

**File:** `OrganizerStep.tsx`

**Fields:**

| Field              | Type        | Auto-Fill from Profile | Editable |
| ------------------ | ----------- | ---------------------- | -------- |
| Organizer Name     | Text input  | Yes                    | Yes      |
| Organization Name  | Text input  | Yes (if in org)        | Yes      |
| Bio                | Textarea    | Yes                    | Yes      |
| Email              | Email input | Yes                    | Yes      |
| Phone              | Phone input | Yes                    | Yes      |
| Website            | URL input   | Yes                    | Yes      |
| Social Media Links | URL inputs  | Yes                    | Yes      |

**Privacy Toggle:**

- "Show my email/phone publicly on event page?" checkboxes

**Live Preview Updates:**

- Organizer card renders at bottom of preview with avatar, name, bio, contact links

---

#### **Step 8: Settings & Publishing**

**File:** `SettingsStep.tsx`

**Fields:**

| Setting                 | Type         | Description                                     |
| ----------------------- | ------------ | ----------------------------------------------- |
| Event Visibility        | Radio group  | Public / Private / Unlisted                     |
| Require Admin Approval? | Toggle       | If ON, event goes to "Pending Review" status    |
| Allow Waitlist?         | Toggle       | If ON, sold-out tickets can join waitlist       |
| Refund Policy           | Dropdown     | No Refunds / 7 Days / 14 Days / Until Event Day |
| Cancellation Policy     | Textarea     | Custom policy text (displayed to attendees)     |
| Check-In Restrictions   | Toggle       | Require attendee ID at gate?                    |
| IoT Device Assignment   | Multi-select | Assign gates/monitors to this event             |

**Publishing Options:**

- **Save as Draft:** Saves event but keeps it private (can edit later)
- **Publish Now:** Makes event live immediately
- **Schedule Publish:** Set date/time for auto-publish

---

#### **Step 9: Review & Submit**

**File:** `ReviewStep.tsx`

**Layout:** Split-screen — left panel has collapsible sections per step, right panel has full event preview.

**Review Sections:**

- Basic Info (title, description, category, tags) — **Edit** button
- Date & Time (start, end, timezone, recurrence) — **Edit**
- Venue (name, address, capacity, map) — **Edit**
- Ticket Tiers (table with all tiers) — **Edit**
- Media (cover, gallery, video thumbnails) — **Edit**
- Agenda (timeline view of sessions) — **Edit**
- Speakers (profile cards) — **Edit**
- FAQs (list) — **Edit**
- Organizer (contact card) — **Edit**
- Settings (visibility, refund policy, IoT devices) — **Edit**

**Validation Summary:**

- Green checkmark next to completed sections
- Red warning icon next to sections with errors
- "Required Fields Missing" alert banner if any step is incomplete

**Action Buttons:**

- **Back** — returns to Step 8
- **Save as Draft** — saves with status `draft`
- **Submit for Approval** (if Admin approval required) — status `pending_review`
- **Publish Event** — status `published` (goes live immediately)

**On Submit:**

- Loading spinner with message: "Creating your event..."
- Firebase transaction writes event document to Firestore
- File uploads complete (cover image, gallery, banner)
- Ticket tiers created as sub-collection: `events/{eventId}/tiers/{tierId}`
- Success modal: "✅ Event created successfully!" with buttons to "View Event" or "Create Another Event"

---

### 3.4 Manage Event — `/organizer/events/:id/manage`

**Purpose:** Comprehensive management view for a single event with tabbed sections.

**Layout:** Event header bar + tabbed navigation + content area.

---

**A. Event Header Bar (sticky top)**

```
┌──────────────────────────────────────────────────────────────────┐
│ [Cover Thumbnail] Event Title                       [Status Badge] │
│ 📅 Date | 📍 Venue | 🎟️ Tickets: X/Y sold                        │
│                                                                    │
│ [ Edit Event ]  [ View Public Page ]  [ Scan Tickets ]  [ ⋮ ]    │
└──────────────────────────────────────────────────────────────────┘
```

**Context Menu (⋮):**

- Duplicate Event
- Download Attendee List
- Export Analytics
- Unpublish Event
- Archive Event

---

**B. Tabbed Navigation**

| Tab           | Route                                 | Purpose                           |
| ------------- | ------------------------------------- | --------------------------------- |
| Overview      | `/organizer/events/:id/manage`        | Quick stats + recent activity     |
| Edit Details  | `/organizer/events/:id/edit`          | Modify event fields (8-step form) |
| Ticket Tiers  | `/organizer/events/:id/tiers`         | Manage ticket inventory           |
| Attendees     | `/organizer/events/:id/attendees`     | View and manage attendees         |
| Analytics     | `/organizer/events/:id/analytics`     | Performance charts                |
| IoT Devices   | `/organizer/events/:id/iot`           | Device assignment and monitoring  |
| Marketing     | `/organizer/events/:id/marketing`     | Promo codes and campaigns         |
| Communication | `/organizer/events/:id/communication` | Email attendees                   |

---

**C. Overview Tab Content**

**Stats Cards (row of 4):**

- Tickets Sold: X / Y (progress bar + %)
- Revenue: ₹ amount (gross + net after fees)
- Check-In Rate: X checked in / Y registered (%)
- Conversion Rate: (Sold / Views) × 100

**Recent Bookings Table (last 10):**
| Attendee | Tickets | Amount | Date | Status | Actions |
| ----------- | ------- | ------ | ---------- | ---------- | ------- |
| John Doe | 2 | ₹500 | 2 mins ago | Confirmed | View |
| Jane Smith | 1 | ₹250 | 5 mins ago | Confirmed | View |

**Quick Actions Panel:**

- Send Bulk Email
- Create Promo Code
- Download QR Codes
- Export Attendee List

---

**D. Ticket Tiers Tab**

Table of ticket tiers with inline editing:

| Tier Name  | Price | Available | Sold | Sale Window     | Actions       |
| ---------- | ----- | --------- | ---- | --------------- | ------------- |
| Early Bird | ₹500  | 20        | 30   | Now - Mar 1     | Edit / Pause  |
| General    | ₹700  | 150       | 50   | Now - Event Day | Edit / Pause  |
| VIP        | ₹1500 | 0         | 50   | Sold Out        | Add Inventory |

**Tier Actions:**

- Edit: Opens modal to change price, quantity, sale window
- Pause: Temporarily disable sales for this tier
- Add Inventory: Increase quantity available
- Delete: Remove tier (only if 0 sales)

**Add Tier Button:** Opens modal to create a new tier for this event.

---

**E. Communication Tab**

**Email Composer:**

- Subject line input
- Rich text editor for message body
- Template selector: Reminder / Thank You / Update / Custom
- Recipient selector:
  - All Attendees
  - Confirmed Only
  - Checked-In Only
  - Not Checked-In
  - Specific Ticket Tier
- Preview button (renders email template)
- Send button (queues emails via Cloud Function)

**Email History Table:**

- Campaign name
- Recipients count
- Sent date
- Open rate (% of emails opened)
- Click rate (% of links clicked)
- View Details button

---

### 3.5 Event Analytics — `/organizer/events/:id/analytics`

**Purpose:** Deep-dive analytics for a single event with interactive charts and exportable reports.

**Layout:** Stats bar + chart grid (2×2) + data tables.

---

**A. Summary Stats Bar (top)**

| Metric            | Display                                |
| ----------------- | -------------------------------------- |
| Total Revenue     | ₹ amount (gross) with ↑↓ trend         |
| Net Revenue       | After ₹12/ticket service fee           |
| Tickets Sold      | X / Y (progress bar + %)               |
| Event Views       | Count with unique visitors             |
| Conversion Rate   | (Tickets Sold / Views) × 100           |
| Avg. Ticket Price | Total Revenue / Tickets Sold           |
| Check-In Rate     | (Checked In / Registered) × 100        |
| No-Show Rate      | (Registered - Checked In) / Registered |

Period selector: 7d / 30d / 90d / All Time.

---

**B. Charts Grid**

**Chart 1: Revenue Over Time (line chart)**

- X-axis: Date
- Y-axis: ₹ Revenue
- Dual lines: Gross Revenue + Net Revenue
- Hover tooltip: Date + exact amount + ticket count
- Period toggle: Daily / Weekly / Monthly aggregation
- Export: PNG or CSV

**Chart 2: Ticket Sales by Tier (bar chart)**

- X-axis: Tier name
- Y-axis: Quantity sold
- Color-coded bars per tier
- Hover tooltip: Tier name + sold + available + revenue
- Shows capacity line (horizontal dashed line at venue capacity)

**Chart 3: Sales Funnel (funnel chart)**

- Stage 1: Event Views (100%)
- Stage 2: Add to Cart (X%)
- Stage 3: Checkout Initiated (Y%)
- Stage 4: Payment Completed (Z%)
- Identifies drop-off points

**Chart 4: Attendance Over Time (line + bar combo chart)**

- X-axis: Date (if multi-day event) or Time (if single-day)
- Y-axis: Attendee count
- Line: Registered attendees (cumulative)
- Bars: Checked-in attendees per hour/day
- Shows peak attendance times

---

**C. Booking Sources Table**

| Source          | Views | Bookings | Conversion Rate | Revenue |
| --------------- | ----- | -------- | --------------- | ------- |
| Direct          | 1,200 | 45       | 3.75%           | ₹15,000 |
| Social Media    | 800   | 30       | 3.75%           | ₹10,000 |
| Search (Google) | 500   | 20       | 4.00%           | ₹7,000  |
| Referral        | 300   | 10       | 3.33%           | ₹3,500  |
| Email Campaign  | 200   | 15       | 7.50%           | ₹5,000  |

**Source Tracking:** Uses UTM parameters in event URLs.

---

**D. Demographics Panel (if data available)**

- **Age Distribution:** Horizontal bar chart
  - 18-24 (25%)
  - 25-34 (40%)
  - 35-44 (20%)
  - 45-54 (10%)
  - 55+ (5%)

- **Gender Split:** Donut chart
  - Male (55%)
  - Female (42%)
  - Other (3%)

- **Location Map:** Shows attendee cities as heatmap (top 10 cities)

---

**E. Export Options**

- Export Full Analytics Report (PDF)
- Export Booking Data (CSV)
- Export Revenue Data (CSV)
- Export Attendee Data (CSV with GDPR compliance)

---

### 3.6 Attendee Management — `/organizer/events/:id/attendees`

**Purpose:** View, search, filter, and manage all attendees for a specific event.

**Layout:** Stats cards + attendee table with action buttons.

---

**A. Attendee Stats Cards (top row)**

| Metric                | Display                                   |
| --------------------- | ----------------------------------------- |
| Total Registered      | Count                                     |
| Total Checked In      | Count with %                              |
| Pending Check-In      | Count                                     |
| No-Shows              | Registered - Checked In (after event end) |
| Cancellations/Refunds | Count                                     |

---

**B. Filter & Search Panel**

**Search:** Name, email, ticket ID (instant search, debounced)

**Filters:**

- Check-In Status: All / Checked In / Pending
- Ticket Tier: All / Tier 1 / Tier 2 / etc.
- Payment Status: All / Paid / Refunded / Failed
- Booking Date: Date range picker

**Sort:**

- Name (A-Z)
- Booking Date (Newest / Oldest)
- Check-In Time (if checked in)

---

**C. Attendee Table**

| Column          | Content                                           |
| --------------- | ------------------------------------------------- |
| Name            | Full name (clickable → Attendee Detail Modal)     |
| Email           | Masked by default (👁 reveal)                     |
| Phone           | Masked by default (👁 reveal)                     |
| Ticket Tier     | Tier name pill                                    |
| Quantity        | # of tickets booked                               |
| Payment         | ₹ amount + status badge (Paid / Refunded)         |
| Booking Date    | Relative + absolute timestamp                     |
| Check-In Status | Green ✅ Checked In (timestamp) / Grey ⏳ Pending |
| Actions         | ⋮ context menu                                    |

**Context Menu (⋮):**

- View Booking Details
- Resend Ticket Email
- Regenerate QR Code
- Manually Check In (if not yet checked in)
- Initiate Refund (opens refund modal)
- Send Individual Email
- Download Ticket PDF

---

**D. Attendee Detail Modal**

Triggered when clicking attendee name:

- Profile section: name, email, phone, avatar
- Booking details: booking ID, transaction ID, date, amount
- Tickets: list of ticket IDs with QR codes (downloadable)
- Check-in history:
  - If checked in: timestamp, gate ID, device ID
  - If pending: "Not yet checked in"
- Communication history: emails sent to this attendee
- Action buttons: Resend Ticket / Refund / Send Email

---

**E. Bulk Actions (select multiple rows)**

- Check In Selected (marks all as checked in with current timestamp)
- Send Bulk Email to Selected
- Export Selected as CSV
- Download QR Codes for Selected

---

**F. Quick Actions Panel (top-right)**

- **Download All Attendees (CSV)** — exports full list
- **Check-In Kiosk Mode** — enters full-screen scanner mode optimized for tablet at venue entrance
- **Email All Attendees** — opens bulk email composer
- **Print Badge Labels** — generates printable badge sheet (name + QR code)

---

### 3.7 IoT Devices Dashboard — `/organizer/devices`

**Purpose:** Monitor and control all IoT devices assigned to the organizer's events.

**Layout:** Device fleet overview + device cards + detail panel.

---

**A. Fleet Overview Stats (top bar)**

| Metric             | Display                                   |
| ------------------ | ----------------------------------------- |
| Total Devices      | Count                                     |
| Online Devices     | Count + % (green badge)                   |
| Offline Devices    | Count + % (red badge, flashing if >5 min) |
| Active Alerts      | Count (red badge if >0)                   |
| Avg. Battery Level | % with progress bar                       |
| Total Scans Today  | Count across all scanner devices          |

---

**B. Device Cards Grid**

Each device displays as a card:

```
┌─────────────────────────────────────┐
│ [Device Icon]  Device Name           │
│ Type: Scanner Gate | Event: TechConf│
│                                      │
│ Status: 🟢 Online | Battery: 85%    │
│ Firmware: v2.3.1  | Last Ping: 2m   │
│                                      │
│ [ View Live Data ]  [ Send Command ]│
└─────────────────────────────────────┘
```

**Device Types:**

- **Scanner Gate:** QR scanner + DC motor gate (ESP32-CAM #1)
- **Crowd Monitor:** AI person detection (ESP32-CAM #2 + gimbal)
- **Environmental Sensor:** DHT22 + MQ-2 (temperature, humidity, gas)
- **Display Board:** DVD player + ESP32 IR controller

**Status Indicators:**

- 🟢 Online (green dot): Last ping <1 minute ago
- 🟡 Warning (amber dot): Battery <20% or connectivity issues
- 🔴 Offline (red dot): Last ping >5 minutes ago
- 🔧 Maintenance (wrench icon): Device in maintenance mode

---

**C. Device Detail Panel (slide-in from right)**

Triggered when clicking "View Live Data":

**Device Info Section:**

- Device ID (copyable)
- Device name (editable inline)
- Device type
- Assigned event
- Venue location
- Registration date
- Last seen timestamp

**Live Sensor Readings (auto-refresh every 5 seconds):**

For Environmental Sensors:

- **Temperature:** Gauge (0-50°C) with color zones (green <30°C, amber 30-35°C, red >35°C)
- **Humidity:** Gauge (0-100%)
- **Gas Level:** Bar chart (0-10,000 ppm) with threshold lines
  - Green: <500 ppm
  - Amber: 500-1000 ppm
  - Red: >1000 ppm

For Crowd Monitors:

- **Current Occupancy:** Counter with capacity bar (e.g., "245 / 500 (49%)")
- **Crowd Density Heatmap:** Mini grid showing zone-by-zone density (green/yellow/red/purple cells)
- **Peak Occupancy Today:** Max count reached
- **Entry/Exit Counts:** Total entries vs. exits

For Scanner Gates:

- **Scans Today:** Counter
- **Valid Scans:** Count + %
- **Invalid Scans:** Count + % (tampered, expired, duplicate)
- **Gate Status:** Open / Closed / Auto with manual override buttons

**Command Panel:**

Buttons to send remote commands to the device:

| Command           | Description                             | Available For        |
| ----------------- | --------------------------------------- | -------------------- |
| Reboot Device     | Restarts ESP32                          | All device types     |
| Open Gate         | Opens gate for 5 seconds                | Scanner Gate only    |
| Close Gate        | Closes gate immediately                 | Scanner Gate only    |
| Calibrate Sensor  | Re-calibrates DHT22/MQ-2                | Environmental Sensor |
| Request Snapshot  | ESP32-CAM #2 captures and uploads photo | Crowd Monitor        |
| Enter Maintenance | Pauses normal operation                 | All device types     |
| Exit Maintenance  | Resumes normal operation                | All device types     |

Each command shows a confirmation dialog → sends via Cloud Function → MQTT publish → device acknowledges → UI updates.

**Alert Configuration:**

Editable threshold sliders:

- Temperature Warning: °C slider (default: 30°C)
- Temperature Critical: °C slider (default: 35°C)
- Gas Warning: ppm input (default: 500 ppm)
- Gas Critical: ppm input (default: 1000 ppm)
- Crowd Warning: % slider (default: 85% of capacity)
- Crowd Critical: % slider (default: 95% of capacity)

Save button → triggers `updateDeviceThresholds` Cloud Function.

**Diagnostic Logs (last 50 entries):**

- Timestamp | Level (Info/Warning/Error) | Message
- Expandable rows show full log payload
- Filter by level
- Export logs as JSON

---

**D. Alerts Panel (bottom section or separate tab)**

Live feed of alerts triggered by devices:

```
🚨 CRITICAL: Gas level 1,250 ppm at Gate 2 — MQ-2 Sensor #003
   Device: ENV-SENSOR-07 | Event: TechConf 2026
   Triggered: 5 minutes ago | Status: New
   [ ACKNOWLEDGE ]  [ VIEW DEVICE ]  [ RESOLVE ]

⚠️  WARNING: Temperature 32°C at Venue Hall A — DHT22 Sensor #001
   Device: ENV-SENSOR-03 | Event: MusicFest
   Triggered: 12 minutes ago | Status: Acknowledged by John Doe
   [ VIEW DEVICE ]  [ MARK RESOLVED ]
```

Alert lifecycle:

- **New** → Organizer acknowledges → **Acknowledged** → Organizer resolves → **Resolved**

Resolution requires notes input (free text describing action taken).

---

### 3.8 Marketing Tools — `/organizer/marketing`

**Purpose:** Comprehensive suite for promoting events and driving ticket sales.

**Layout:** Tabbed sections for different marketing channels.

---

**A. Tab: Promo Codes**

**Promo Code Table:**

| Code      | Discount | Uses     | Applied To | Valid Until | Status  | Actions        |
| --------- | -------- | -------- | ---------- | ----------- | ------- | -------------- |
| EARLYBIRD | 20% off  | 45 / 100 | All Tiers  | Mar 1, 2026 | Active  | Edit / Disable |
| VIP50     | ₹50 flat | 10 / 50  | VIP Only   | Event Day   | Active  | Edit / Disable |
| EXPIRED10 | 10% off  | 5 / 100  | All Tiers  | Feb 1, 2026 | Expired | Delete         |

**Create Promo Code Button → Modal:**

Fields:

- Promo Code: text input (auto-generate button)
- Discount Type: Percentage / Flat Amount
- Discount Value: number input
- Applies To: All Tiers / Specific Tier (dropdown)
- Max Uses: number input (or "Unlimited" toggle)
- Min Order Value: ₹ input (optional)
- Valid From: date-time picker (default: now)
- Valid Until: date-time picker (default: event start)
- Save button → creates in Firestore `promo_codes` collection

---

**B. Tab: Social Media AI Generator**

**Purpose:** AI-powered social media content creation.

**Layout:** Left panel: input form, Right panel: generated content preview.

**Input Form:**

- Event Selector: dropdown (pre-fills event details)
- Platform: Radio group (Twitter / Instagram / LinkedIn / Facebook)
- Tone: Dropdown (Professional / Casual / Exciting / Informative)
- Include Hashtags: Toggle (ON by default)
- Include Emojis: Toggle (ON by default)
- Custom Message (optional): Textarea (AI will incorporate this)

**Generate Button:**

Triggers Cloud Function that calls OpenAI GPT-4 API with prompt:

```
Generate a {tone} social media post for {platform} promoting this event:
Event: {title}
Description: {description}
Date: {date}
Venue: {venue}
Tickets: {ticket_link}

Include relevant hashtags and emojis. Keep it under {character_limit}.
```

**Generated Content Preview:**

Shows AI-generated post text with character count.

Example output:

```
🎉 Get ready for TechConf 2026! 🚀

Join 500+ tech enthusiasts for 2 days of cutting-edge talks,
hands-on workshops, and networking with industry leaders.

📅 March 15-16, 2026
📍 Grand Ballroom, Mumbai
🎟️ Early Bird tickets available now!

Book yours: flowgatex.com/events/techconf-2026

#TechConf2026 #TechEvent #Innovation #Mumbai #Networking
```

**Actions:**

- **Copy to Clipboard** — copies post text
- **Regenerate** — generates new version
- **Edit** — opens text editor to customize
- **Schedule Post** — (future feature: integrates with social media APIs)

---

**C. Tab: Email Campaigns**

**Email Campaign Dashboard:**

Table of past campaigns:

| Campaign Name  | Recipients | Sent Date | Open Rate | Click Rate | Actions      |
| -------------- | ---------- | --------- | --------- | ---------- | ------------ |
| Event Reminder | 250        | Mar 1     | 45%       | 12%        | View Details |
| Last Chance    | 180        | Mar 10    | 52%       | 18%        | View Details |

**Create Campaign Button → Multi-step wizard:**

Step 1: Select Event
Step 2: Choose Recipients (All / Tier-specific / Custom segment)
Step 3: Choose Template (or create custom HTML)
Step 4: Customize Content (subject, body, CTA button)
Step 5: Preview & Send

---

**D. Tab: Flyer & Banner Generator**

**Purpose:** Generate downloadable promotional graphics.

**Flyer Templates:**

- Modern Minimalist
- Bold & Colorful
- Corporate Professional
- Music Festival Vibes
- Tech Conference
- Food & Drink Event

**Generator Form:**

- Select Event: dropdown (auto-fills event details)
- Choose Template: thumbnail grid
- Customize: color scheme picker, font selector
- Preview: live preview with event title, date, venue
- Download: generates PNG (1080×1920 for Instagram) or PDF (A4 for print)

---

### 3.9 Payouts & Finance — `/organizer/payouts`

**Purpose:** Track revenue and request financial withdrawals.

**Layout:** Balance cards + revenue chart + payout table.

---

**A. Balance Overview Cards (top row)**

```
┌─────────────────────────────────┐
│ AVAILABLE BALANCE               │
│ ₹25,000                         │
│ Ready to withdraw               │
│ [ REQUEST PAYOUT ]              │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ PENDING BALANCE                 │
│ ₹15,000                         │
│ Held until event completion     │
│ Release date: Mar 20, 2026      │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ TOTAL EARNED (LIFETIME)         │
│ ₹1,25,000                       │
│ Across 12 events                │
└─────────────────────────────────┘
```

---

**B. Revenue Breakdown Section**

**Period Selector:** This Month / Last 3 Months / This Year / All Time

**Table:**

| Event Name      | Gross Revenue | Service Fee (₹12/ticket) | Net Revenue | Payout Status |
| --------------- | ------------- | ------------------------ | ----------- | ------------- |
| TechConf 2026   | ₹50,000       | ₹1,200 (100 tickets)     | ₹48,800     | Paid          |
| MusicFest       | ₹30,000       | ₹720 (60 tickets)        | ₹29,280     | Pending       |
| Workshop Series | ₹20,000       | ₹480 (40 tickets)        | ₹19,520     | Available     |

**Revenue Calculation:**

```
Net Revenue = Gross Revenue - (Ticket Count × ₹12)
```

Service fee is deducted per ticket sold, not as a percentage of revenue.

---

**C. Payout History Table**

| Payout ID | Amount  | Request Date | Status     | Paid Date   | Bank Account    | Actions      |
| --------- | ------- | ------------ | ---------- | ----------- | --------------- | ------------ |
| PO-001    | ₹48,800 | Mar 1, 2026  | Completed  | Mar 3, 2026 | HDFC \*\*\*1234 | View Receipt |
| PO-002    | ₹29,280 | Mar 10, 2026 | Processing | —           | HDFC \*\*\*1234 | Track        |
| PO-003    | ₹15,000 | Mar 12, 2026 | Pending    | —           | HDFC \*\*\*1234 | Cancel       |

**Payout Status:**

- **Pending:** Request submitted, awaiting admin approval
- **Processing:** Approved, payment initiated
- **Completed:** Funds transferred successfully
- **Failed:** Transfer failed (contact support)
- **Cancelled:** Request cancelled by organizer

---

**D. Request Payout Modal**

Triggered by "Request Payout" button:

**Step 1: Amount Selection**

- Display available balance
- Input amount to withdraw (max = available balance, min = ₹500)
- Warning: "Payouts are processed within 3-5 business days."

**Step 2: Bank Account Selection**

- Radio list of connected bank accounts (HDFC ***1234, ICICI ***5678)
- "Add New Bank Account" button → bank account form:
  - Account Holder Name
  - Bank Name
  - Account Number
  - IFSC Code
  - Account Type (Savings / Current)

**Step 3: Review & Confirm**

- Summary: Amount, Bank Account, Expected Transfer Date
- Terms checkbox: "I agree that payouts are subject to FlowGateX service terms."
- Submit button → triggers `requestPayout` Cloud Function

---

**E. Tax & Compliance Section (bottom)**

- Download TDS Certificate (if applicable)
- Download GST Invoice
- View Annual Earnings Statement
- Export Revenue Data for Tax Filing (CSV)

---

### 3.10 Mobile QR Scanner — `/organizer/scan`

**Purpose:** Fast, mobile-optimized QR ticket scanning for event entry.

**Optimized for:** Tablets and smartphones at venue gates.

**Layout:** Full-screen camera view with minimal UI.

---

**A. Scanner Interface**

```
┌────────────────────────────────────────┐
│ 📷 Camera viewfinder (live video)      │
│                                        │
│    ┌──────────────────────┐           │
│    │                      │           │
│    │   [QR focus box]     │           │
│    │                      │           │
│    └──────────────────────┘           │
│                                        │
│  "Position QR code within the frame"  │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ Event: TechConf 2026                   │
│ Scans Today: 245 / 500                 │
│ [ Flashlight 🔦 ]  [ Switch Camera ]   │
└────────────────────────────────────────┘
```

---

**B. Scan Validation Flow**

```
QR code detected →
  Camera freezes frame →
    Base64 decode →
      Extract ticket data →
        Verify SHA-256 signature →
          Query Firestore: tickets/{ticketId} →
            Check: status, expiry, event match, gate access →
              VALID → Green overlay + ✅ + Success beep
              INVALID → Red overlay + ❌ + Error beep + Reason
              DUPLICATE → Yellow overlay + ⚠️ + "Already used at Gate 2, 2:34 PM"
```

---

**C. Validation Result Screens**

**✅ VALID TICKET (green background, 2-second display):**

```
┌────────────────────────────────────────┐
│            ✅ VALID TICKET              │
│                                        │
│ Attendee: John Doe                     │
│ Ticket: General Admission              │
│ Booking ID: BK-12345                   │
│                                        │
│ [ Auto-scanning in 2 seconds... ]      │
└────────────────────────────────────────┘
```

If IoT gate is connected: gate opens automatically.

---

**❌ INVALID TICKET (red background, stays until dismissed):**

```
┌────────────────────────────────────────┐
│           ❌ INVALID TICKET             │
│                                        │
│ Reason: Ticket has expired             │
│ Ticket ID: TK-67890                    │
│                                        │
│ [ Scan Next Ticket ]                   │
└────────────────────────────────────────┘
```

**Invalid Reasons:**

- Ticket has expired
- QR code is tampered (signature mismatch)
- Ticket is for a different event
- Ticket tier not authorized for this gate
- Ticket has been refunded/cancelled

---

**⚠️ DUPLICATE SCAN (yellow background):**

```
┌────────────────────────────────────────┐
│         ⚠️ ALREADY CHECKED IN           │
│                                        │
│ Attendee: Jane Smith                   │
│ First Check-In:                        │
│   Gate 2 | 2:34 PM | Device: SCAN-001 │
│                                        │
│ [ Override & Allow ]  [ Reject ]       │
└────────────────────────────────────────┘
```

**Override Button:** Requires reason input → logs as manual override → allows entry.

---

**D. Scan History Drawer (slide-up from bottom)**

Swipe up to view last 20 scans:

| Time    | Attendee    | Ticket Tier | Status       |
| ------- | ----------- | ----------- | ------------ |
| 3:45 PM | John Doe    | General     | Valid ✅     |
| 3:44 PM | Jane Smith  | VIP         | Valid ✅     |
| 3:43 PM | Bob Johnson | General     | Invalid ❌   |
| 3:42 PM | Alice Lee   | General     | Duplicate ⚠️ |

Tap entry → shows full validation details.

---

**E. Settings Gear Icon (top-right corner)**

Opens scanner settings modal:

- **Sound:** ON / OFF (beep on scan)
- **Vibration:** ON / OFF (haptic feedback)
- **Auto-scan delay:** 1s / 2s / 3s (time before resuming camera after valid scan)
- **Gate Device:** Select connected IoT gate (auto-opens gate on valid scan)
- **Offline Mode:** ON / OFF (caches tickets locally for offline validation)

---

**F. Offline Mode**

When enabled:

- Downloads ticket list for this event to local storage (IndexedDB)
- Includes ticket IDs, user details, status
- Scanner validates against local cache
- Queues check-in updates to sync when online
- Shows "📴 OFFLINE MODE" banner at top
- Syncs automatically when connection restored

---

## 4. Event Creation Workflow

### Complete End-to-End Flow

```
Organizer logs in → Dashboard →
  Clicks "Create Event" →
    Step 1: Basic Info (title, description, category, tags) →
    Step 2: Date & Time (start, end, timezone, recurrence) →
    Step 3: Venue (address, Google Maps, capacity) →
    Step 4: Ticket Tiers (name, price, quantity, sale window, gate access) →
    Step 5: Media (cover image, gallery, video) →
    Step 6: Details (agenda, speakers, FAQs) →
    Step 7: Organizer Info (name, bio, contact, social) →
    Step 8: Settings (visibility, refund policy, approval, IoT devices) →
    Step 9: Review (collapsible sections, validation summary) →
      Clicks "Publish Event" →
        eventService.createEvent(data) → Firebase transaction:
          1. Write to events/{eventId}
          2. Write ticket tiers to events/{eventId}/tiers/{tierId}
          3. Upload cover image to Storage /events/{eventId}/cover.jpg
          4. Upload gallery images to /events/{eventId}/gallery/
          5. If IoT devices assigned: update devices/{deviceId}.assignedEvent
          6. Write audit log entry
        Success:
          Shows success modal →
            "View Event" button → navigates to public event page
            "Manage Event" button → navigates to /organizer/events/{eventId}/manage
            "Create Another" button → resets form
```

### Event Data Model (Firestore Document)

```typescript
interface Event {
  id: string; // Auto-generated
  title: string;
  slug: string; // URL-friendly (e.g., "techconf-2026-mumbai")
  description: string;
  shortDescription: string;
  category: EventCategory; // One of 12 categories
  format: 'single' | 'multi_day' | 'recurring';

  // Dates
  startDate: Timestamp;
  endDate: Timestamp;
  timezone: string;
  recurrence?: {
    pattern: 'daily' | 'weekly' | 'monthly';
    endDate: Timestamp;
    parentEventId?: string; // For recurring instances
  };

  // Venue
  venue: {
    type: 'physical' | 'virtual' | 'hybrid';
    name: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode?: string;
      country: string;
    };
    coordinates: {
      lat: number;
      lng: number;
    };
    capacity: number;
    virtualUrl?: string;
    accessInstructions?: string;
  };

  // Media
  media: {
    coverImage: string; // Storage URL
    gallery: string[]; // Array of Storage URLs
    videoUrl?: string; // YouTube/Vimeo embed
    banner?: string; // Social share image
  };

  // Organizer
  organizer: {
    uid: string;
    name: string;
    bio?: string;
    email?: string;
    phone?: string;
    website?: string;
    socialLinks?: {
      twitter?: string;
      linkedin?: string;
      facebook?: string;
      instagram?: string;
    };
    showContact: boolean; // Privacy toggle
  };

  // Metadata
  tags: string[]; // For search SEO
  language: string; // ISO code
  ageRestriction: 'all' | '13+' | '18+' | '21+';

  // Settings
  status: 'draft' | 'pending_review' | 'published' | 'cancelled' | 'ended';
  visibility: 'public' | 'private' | 'unlisted';
  requiresApproval: boolean;
  allowWaitlist: boolean;
  refundPolicy: 'none' | '7_days' | '14_days' | 'until_event';
  cancellationPolicy?: string;
  checkInRestrictions?: boolean;

  // Tickets (stored in sub-collection, summary here)
  ticketSummary: {
    totalCapacity: number;
    totalSold: number;
    totalRevenue: number;
    tiers: number; // Count of ticket tiers
  };

  // IoT
  assignedDevices: string[]; // Array of device IDs

  // Analytics
  stats: {
    views: number;
    uniqueViews: number;
    bookings: number;
    checkIns: number;
    conversionRate: number; // (bookings / views) × 100
  };

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;
}
```

### Event Sub-Collections

**events/{eventId}/tiers/{tierId}**

```typescript
interface TicketTier {
  id: string;
  name: string;
  description?: string;
  price: number; // In rupees
  currency: 'INR';
  quantity: number; // Total available
  available: number; // Remaining
  sold: number; // Sold count

  // Sale window
  saleStart: Timestamp;
  saleEnd: Timestamp;

  // Purchase limits
  minPurchase: number;
  maxPurchase: number;

  // Visibility
  visibility: 'public' | 'hidden' | 'invite_only';

  // Dynamic pricing
  earlyBird?: {
    enabled: boolean;
    price: number;
    endDate: Timestamp;
  };
  bulkDiscount?: {
    enabled: boolean;
    minQuantity: number;
    discountPercent: number;
  };

  // IoT gate access
  gateAccessLevel: 'general' | 'vip' | 'backstage';

  // Promo code compatibility
  allowPromoCodes: boolean;

  // Ordering (for display)
  order: number;

  // Revenue tracking
  revenue: number; // price × sold
}
```

---

## 5. IoT Device Integration

### Device Registration Flow

```
Organizer navigates to /organizer/devices →
  Clicks "Add New Device" →
    Modal opens with form:
      - Device Type: Dropdown (Scanner / Crowd Monitor / Env Sensor / Display)
      - Device Name: Text input
      - Venue/Location: Text input
      - Event Assignment: Dropdown (optional, can assign later)
    Submits form →
      iotService.registerDevice(data) →
        Creates document in devices/{deviceId}:
          {
            id: auto-generated,
            name: "Main Gate Scanner",
            type: "scanner",
            ownerUid: organizerUid,
            assignedEvent: eventId,
            status: "offline", // Until device connects
            createdAt: now
          }
        Generates device API key (stored in device.apiKey, encrypted)
        Returns device credentials to Organizer
    Organizer receives:
      - Device ID
      - API Key (shown once, copied to clipboard)
      - Setup instructions (how to flash ESP32 with credentials)
    Device powers on →
      ESP32 connects to WiFi →
        Authenticates with API key via WebSocket handshake →
          Cloud Function validates API key →
            Updates device.status = "online" →
              Dashboard UI updates in real-time (green dot)
```

### Real-Time Sensor Data Flow

```
ESP32-CAM reads sensor (DHT22, MQ-2) →
  Publishes to MQTT topic: devices/{deviceId}/readings →
    MQTT broker (Mosquitto on Cloud Functions) receives message →
      Cloud Function (onDeviceReading) processes:
        1. Parse sensor data (temperature, humidity, gas level)
        2. Check against alert thresholds (from device.alertThresholds)
        3. If threshold exceeded:
           a. Create security_alerts/{alertId} document
           b. Send push notification to organizer (FCM)
           c. If critical: trigger auto-actions (gate lock, evacuation message)
        4. Write to devices/{deviceId}/readings sub-collection (timestamped)
        5. Update devices/{deviceId}.latestReading (for dashboard display)
      Firestore onSnapshot listener in dashboard UI →
        Real-time chart/gauge updates (no polling, instant)
```

### ESP32-CAM #2 Crowd Monitoring Flow

```
ESP32-CAM #2 captures frame (10 fps) →
  YOLOv8-Nano inference on ESP32 (person detection) →
    Outputs bounding boxes (x, y, w, h) per detected person →
      Tracking algorithm assigns IDs to persons across frames (DeepSORT) →
        Virtual line crossing detection:
          - Person crosses line entering → entry_count++
          - Person crosses line exiting → exit_count++
        Real-time occupancy = previous_count + entries - exits →
          Publishes to MQTT: devices/{deviceId}/crowd →
            {
              deviceId,
              timestamp,
              occupancy: 245,
              capacity: 500,
              densityMap: [[0,2,5,...], [1,3,4,...], ...], // 10×10 grid
              peakToday: 320,
              entryCount: 380,
              exitCount: 135
            }
          Cloud Function processes:
            - Updates events/{eventId}.stats.currentOccupancy
            - Checks overcapacity thresholds (85%, 95%)
            - If >95%: creates alert + sends notification + auto-pauses gate
          Dashboard subscribes to events/{eventId}.stats.currentOccupancy →
            Live occupancy counter updates every 10 seconds
```

### Gate Control Command Flow

```
Organizer clicks "Open Gate" button in Device Detail Panel →
  Confirmation modal: "Open Gate 1 for how long?" (5s / 10s / 30s / Manual)
    Organizer selects "10 seconds" →
      iotService.sendDeviceCommand(deviceId, 'OPEN_GATE', { gateId: 1, duration: 10 }) →
        Cloud Function (sendDeviceCommand):
          1. Validates organizer owns this device
          2. Writes to devices/{deviceId}/pendingCommand:
             {
               command: 'OPEN_GATE',
               params: { gateId: 1, duration: 10 },
               issuedBy: organizerUid,
               issuedAt: now,
               status: 'pending'
             }
          3. Publishes MQTT message to devices/{deviceId}/commands:
             { command: 'OPEN_GATE', gateId: 1, duration: 10 }
        ESP32 receives MQTT message →
          GPIO pin sends HIGH signal to Relay 1 →
            Relay energizes → DC Motor opens gate (90° rotation) →
              Green LED ring activates + success beep →
                Wait 10 seconds (internal timer) →
                  GPIO sends LOW signal → Relay de-energizes → Motor closes gate →
                    ESP32 publishes acknowledgement: devices/{deviceId}/commandAck:
                      { commandId, status: 'completed', timestamp: now }
        Cloud Function receives ack →
          Updates devices/{deviceId}/pendingCommand.status = 'completed' →
            Dashboard UI shows "✅ Command completed" toast notification
```

---

## 6. Marketing & Promotion Tools

### Promo Code Lifecycle

```
Organizer creates promo code →
  promoService.createPromoCode({
    code: "EARLYBIRD",
    discountType: "percentage",
    discountValue: 20,
    appliesTo: { eventId },
    maxUses: 100,
    minOrderValue: 500,
    validFrom: now,
    validUntil: eventStartDate
  }) →
    Firestore write to promo_codes/{code}:
      {
        code: "EARLYBIRD",
        discountType: "percentage",
        discountValue: 20,
        eventId,
        maxUses: 100,
        usedCount: 0,
        minOrderValue: 500,
        validFrom: Timestamp,
        validUntil: Timestamp,
        status: "active",
        createdBy: organizerUid
      }
    Code is now live and usable by attendees

Attendee applies promo code during checkout →
  checkoutService.applyPromoCode(bookingData, "EARLYBIRD") →
    Cloud Function (validatePromoCode):
      1. Query promo_codes where code == "EARLYBIRD"
      2. Validate:
         - status == "active"
         - now between validFrom and validUntil
         - usedCount < maxUses
         - orderTotal >= minOrderValue
         - eventId matches or code applies to all events
      3. If valid:
         a. Calculate discount:
            - If percentage: discount = (orderTotal × discountValue) / 100
            - If flat: discount = discountValue
         b. Apply discount to order total
         c. Increment promo_codes/{code}.usedCount (Firestore transaction)
         d. Write to bookings/{bookingId}.promoCode = "EARLYBIRD"
         e. Return discounted total
      4. If invalid: return error with reason

Organizer views promo code performance →
  Dashboard shows:
    - Uses: 45 / 100
    - Revenue impact: ₹9,000 discount given
    - Conversion lift: +15% vs. non-promo bookings
```

### AI Social Media Content Generator

````
Organizer navigates to /organizer/marketing → Social Media AI tab →
  Selects event: "TechConf 2026" →
    Selects platform: Instagram →
      Selects tone: "Exciting" →
        Clicks "Generate" →
          marketingService.generateSocialPost({
            eventId,
            platform: "instagram",
            tone: "exciting"
          }) →
            Cloud Function (generateSocialPost):
              1. Fetch event data from Firestore
              2. Construct prompt:
                 ```
                 Generate an exciting Instagram post promoting this event:
                 Event: TechConf 2026
                 Date: March 15-16, 2026
                 Venue: Grand Ballroom, Mumbai
                 Description: 2 days of cutting-edge tech talks and workshops

                 Requirements:
                 - Tone: Exciting and engaging
                 - Include emojis
                 - Include 5-8 relevant hashtags
                 - Keep under 2,200 characters
                 - Include call-to-action with booking link
                 ```
              3. Call OpenAI GPT-4 API with prompt
              4. Parse response
              5. Return generated text
            Response:
              ```
              🚀 The future of tech is HERE! 🔥

              TechConf 2026 is your gateway to innovation! Join 500+ tech
              enthusiasts, visionary speakers, and industry leaders for
              2 days of mind-blowing talks, hands-on workshops, and
              game-changing networking. 💡✨

              📅 March 15-16, 2026
              📍 Grand Ballroom, Mumbai
              🎟️ Early Bird tickets selling FAST!

              Don't miss out — grab your spot now! 👇
              🔗 flowgatex.com/events/techconf-2026

              #TechConf2026 #TechInnovation #MumbaiEvents #TechCommunity
              #Networking #FutureOfTech #TechWorkshops #IndiaEvents
              ```
          UI displays generated text in preview panel →
            Organizer can:
              - Copy to clipboard
              - Edit inline
              - Regenerate (new version)
              - Download as image (post text overlaid on event cover image)
````

---

## 7. Financial Management

### Revenue Tracking Model

```typescript
interface RevenueBreakdown {
  // Per-event revenue
  event: {
    id: string;
    name: string;
    grossRevenue: number; // Sum of all ticket prices paid
    ticketsSold: number;
    serviceFee: number; // 12 × ticketsSold
    netRevenue: number; // grossRevenue - serviceFee
    refunds: number; // Total refunded amount
  };

  // Platform-level aggregation
  organizer: {
    uid: string;
    totalGrossRevenue: number; // Across all events
    totalServiceFee: number;
    totalNetRevenue: number;
    totalRefunds: number;
    availableBalance: number; // Can be withdrawn
    pendingBalance: number; // Held until event ends
  };

  // Per-transaction tracking
  transaction: {
    id: string;
    bookingId: string;
    eventId: string;
    userId: string;
    amount: number; // Total paid by attendee
    serviceFee: number; // 12 × ticket_count
    netAmount: number; // amount - serviceFee
    status: 'paid' | 'refunded' | 'failed';
    gateway: 'razorpay' | 'cashfree' | 'mock';
    gatewayTransactionId: string;
    timestamp: Timestamp;
  };
}
```

### Payout Request Flow

```
Organizer has ₹25,000 available balance →
  Navigates to /organizer/payouts →
    Clicks "Request Payout" →
      Modal opens:
        - Shows available balance: ₹25,000
        - Input amount: text input (default: full balance)
        - Select bank account: radio list
        - If no bank account: "Add Bank Account" button →
            Bank account form modal:
              - Account Holder Name
              - Bank Name (dropdown: HDFC, ICICI, SBI, etc.)
              - Account Number (masked input)
              - Confirm Account Number (must match)
              - IFSC Code (auto-validates format)
              - Account Type: Savings / Current
            Submit →
              payoutService.addBankAccount(data) →
                Writes to users/{uid}/bankAccounts/{id} (encrypted)
        - Terms checkbox
        - "Submit Request" button →
          payoutService.requestPayout({
            amount: 25000,
            bankAccountId: "BA-001"
          }) →
            Cloud Function (requestPayout):
              1. Validate organizer has sufficient available balance
              2. Check minimum payout: ₹500
              3. Create payout_requests/{id}:
                 {
                   id: auto-generated,
                   organizerUid,
                   amount: 25000,
                   bankAccountId: "BA-001",
                   status: "pending",
                   requestedAt: now,
                   events: [eventId1, eventId2, ...], // Events covered
                   expectedTransferDate: now + 3 days
                 }
              4. Deduct from organizer.availableBalance (Firestore transaction)
              5. Add to organizer.pendingPayouts
              6. Send email notification to organizer (confirmation)
              7. Create audit log entry
            Admin reviews payout request (if auto-approve disabled) →
              Admin approves →
                Cloud Function (processPayout):
                  1. Call bank transfer API (e.g., Razorpay Payouts API):
                     - Account Number
                     - IFSC
                     - Amount
                     - Purpose: "Event payout"
                  2. On success:
                     - Update payout_requests/{id}.status = "completed"
                     - Update payout_requests/{id}.paidAt = now
                     - Send confirmation email with transaction ID
                  3. On failure:
                     - Update status = "failed"
                     - Restore amount to availableBalance
                     - Send failure notification with retry instructions
```

### Service Fee Calculation

```
Ticket Price: ₹500
Tickets Purchased: 3
Subtotal: ₹1,500

Service Fee: 3 tickets × ₹12 = ₹36

Total Paid by Attendee: ₹1,500 (service fee borne by organizer)
Organizer Receives: ₹1,500 - ₹36 = ₹1,464

Note: FlowGateX charges organizers, not attendees. The service fee is
₹12 per ticket sold, regardless of ticket price. This keeps pricing
transparent for attendees and incentivizes organizers to sell more tickets.
```

---

## 8. UI Components

### 8.1 OrganizerGuard (Route Wrapper)

```tsx
// Renders children only if authenticated user has role >= 'organizer'
// Roles allowed: organizer, admin, superadmin
// Redirects to /unauthorized if check fails
// Verifies role from Firestore on mount

<OrganizerGuard>
  <OrganizerLayout>
    <Outlet />
  </OrganizerLayout>
</OrganizerGuard>
```

---

### 8.2 OrganizerLayout

- **Left Sidebar:** collapsible, teal/green accent theme, 240px wide
  - FlowGateX logo
  - "Organizer" role badge (shield icon, green)
  - Navigation links (see Section 13)
  - Pending actions badges (amber dots on nav items)
  - Bottom: profile dropdown
- **Top Bar:** breadcrumb, global search, notification bell, quick action buttons
- **Main Content:** scrollable, padding 24px, max-width 1440px centered

---

### 8.3 EventCard

Reusable card for displaying events in grid/list views.

```tsx
<EventCard
  event={event}
  view="grid" | "list"
  onEdit={(id) => navigate(`/organizer/events/${id}/edit`)}
  onView={(id) => window.open(`/events/${event.slug}`, '_blank')}
  onQuickView={(id) => setQuickViewEvent(id)}
/>
```

Props:

- `event`: Event Firestore document
- `view`: Grid or list layout mode
- `onEdit`, `onView`, `onQuickView`: Callbacks

Visual states:

- Draft: Grey overlay, "Draft" badge
- Published: Full color, "Published" badge
- Low sales: Amber border if <20% sold
- Sold out: Green checkmark badge

---

### 8.4 TicketTierForm

Reusable form for creating/editing ticket tiers.

```tsx
<TicketTierForm
  tier={existingTier}
  mode="create" | "edit"
  onSave={(tierData) => saveTier(tierData)}
  onCancel={() => closeSidePanel()}
/>
```

Includes validation for:

- Price > 0 (or free tier toggle)
- Quantity > 0
- Sale end date > sale start date
- Total tiers quantity ≤ venue capacity

---

### 8.5 RevenueChart

Interactive line chart showing revenue trends.

```tsx
<RevenueChart
  data={revenueData}
  period="7d" | "30d" | "90d"
  onPeriodChange={(period) => fetchRevenueData(period)}
  showNet={true} // Show net revenue line
/>
```

Built with Chart.js, supports:

- Gradient fill beneath line
- Hover tooltips with exact values
- Export as PNG or CSV
- Zoom/pan on desktop

---

### 8.6 AttendeeTable

Data table for attendee management.

```tsx
<AttendeeTable
  attendees={attendeeList}
  eventId={eventId}
  onCheckIn={ticketId => checkInAttendee(ticketId)}
  onRefund={bookingId => openRefundModal(bookingId)}
  onResendTicket={ticketId => resendTicketEmail(ticketId)}
/>
```

Features:

- Sortable columns
- Inline search and filters
- Bulk selection checkboxes
- Expandable rows (show booking details)
- Export to CSV button

---

### 8.7 DeviceStatusCard

Displays real-time IoT device status.

```tsx
<DeviceStatusCard
  device={device}
  onViewLiveData={() => openDevicePanel(device.id)}
  onSendCommand={() => openCommandModal(device.id)}
/>
```

Shows:

- Status indicator dot (green/amber/red)
- Battery level progress bar
- Last ping timestamp
- Quick action buttons

Real-time updates via Firestore listener.

---

### 8.8 SensorGauge

Circular gauge for displaying sensor readings.

```tsx
<SensorGauge
  value={temperature}
  min={0}
  max={50}
  unit="°C"
  thresholds={[
    { value: 30, color: 'green', label: 'Normal' },
    { value: 35, color: 'amber', label: 'Warning' },
    { value: 40, color: 'red', label: 'Critical' },
  ]}
  size="lg"
/>
```

Visual treatment:

- Color zones based on thresholds
- Animated needle sweep
- Current value displayed in center
- Threshold markers on gauge ring

---

### 8.9 QRScannerCamera

Mobile-optimized camera component for QR scanning.

```tsx
<QRScannerCamera
  onScan={ticketData => validateTicket(ticketData)}
  onError={error => showError(error.message)}
  eventId={eventId}
/>
```

Uses `html5-qrcode` library:

- Auto-focuses on QR codes
- Freeze-frame on detection
- Flashlight toggle for low light
- Front/rear camera switch
- Permission handling

---

### 8.10 PromoCodeForm

Form for creating promotional codes.

```tsx
<PromoCodeForm
  mode="create" | "edit"
  eventId={eventId}
  initialValues={existingPromo}
  onSubmit={(promoData) => savePromoCode(promoData)}
  onCancel={() => closeModal()}
/>
```

Includes:

- Auto-generate code button (random 8-char alphanumeric)
- Discount type radio (percentage / flat)
- Date-time pickers for validity window
- Max uses input with "unlimited" toggle
- Live preview showing discount calculation

---

### 8.11 PayoutRequestModal

Multi-step modal for requesting financial payouts.

```tsx
<PayoutRequestModal
  availableBalance={balance}
  bankAccounts={accounts}
  onSubmit={requestData => requestPayout(requestData)}
  onClose={() => setModalOpen(false)}
/>
```

Steps:

1. Amount input (with balance validation)
2. Bank account selection (or add new)
3. Review and confirm

Shows expected transfer date based on business days.

---

### 8.12 EventWizardStepper

Progress stepper for 8-step event creation wizard.

```tsx
<EventWizardStepper
  currentStep={currentStep}
  completedSteps={completedSteps}
  onStepClick={step => navigateToStep(step)}
/>
```

Visual treatment:

- Green checkmark for completed steps
- Current step highlighted
- Disabled steps greyed out
- Clickable to jump to completed steps
- Shows step numbers and titles

---

## 9. Backend Services & Cloud Functions

### 9.1 `createEvent` Cloud Function

**Trigger:** HTTPS callable  
**Auth:** Organizer or above

```
Input:  { eventData: CreateEventData }
Process:
  1. Verify caller has event:create permission
  2. Validate all required fields (title, dates, venue, at least 1 ticket tier)
  3. Generate slug from title (URL-friendly, unique)
  4. Upload cover image to Storage: /events/{eventId}/cover.jpg
  5. Upload gallery images: /events/{eventId}/gallery/{index}.jpg
  6. Firestore batch write:
     a. Create events/{eventId} with status='draft'
     b. Create events/{eventId}/tiers/{tierId} for each ticket tier
     c. If IoT devices assigned: update devices/{deviceId}.assignedEvent
  7. Write audit log: { action: 'event:create', eventId, callerUid }
  8. If status='published': trigger event indexing for search
Output: { eventId, slug, status }
```

---

### 9.2 `updateEvent` Cloud Function

**Trigger:** HTTPS callable  
**Auth:** Organizer (must own event) or Admin

```
Input:  { eventId: string, updates: Partial<Event> }
Process:
  1. Verify caller owns event or is Admin
  2. Fetch existing event
  3. Validate updates (e.g., cannot reduce ticket quantity below sold count)
  4. Check if event is published with active bookings:
     - If yes: restrict editable fields (cannot change dates, venue capacity)
  5. Update events/{eventId} with new data
  6. If ticket tiers updated: batch update events/{eventId}/tiers/{tierId}
  7. Write audit log with field-level diff
  8. If critical fields changed: send email to all booked attendees
Output: { success: true, updatedFields: [...] }
```

---

### 9.3 `publishEvent` Cloud Function

**Trigger:** HTTPS callable  
**Auth:** Organizer (own event) or Admin

```
Input:  { eventId: string }
Process:
  1. Verify caller owns event or is Admin
  2. Fetch event
  3. Validate publishability:
     - Has cover image
     - Has at least 1 ticket tier with quantity > 0
     - Start date is in the future
     - All required fields complete
  4. Update events/{eventId}.status = 'published'
  5. Update events/{eventId}.publishedAt = now
  6. Trigger search indexing (Algolia/Typesense)
  7. If requiresApproval==true: set status='pending_review' instead, notify admins
  8. Write audit log
Output: { status: 'published' | 'pending_review' }
```

---

### 9.4 `deleteEvent` Cloud Function

**Trigger:** HTTPS callable  
**Auth:** Organizer (own event) or Admin

```
Input:  { eventId: string, force: boolean }
Process:
  1. Verify caller owns event or is Admin
  2. Fetch event
  3. Check for active bookings:
     - If bookings exist and force==false: return error "Cannot delete event with bookings"
     - If force==true (Admin only): cascade delete all bookings, tickets, refund attendees
  4. Soft delete (default):
     - Update events/{eventId}.status = 'archived'
     - Update events/{eventId}.deletedAt = now
     - Event hidden from public but data retained (30-day recovery window)
  5. Hard delete (if force==true):
     - Batch delete events/{eventId} and all sub-collections
     - Delete Storage files: /events/{eventId}/*
     - Restore inventory if tickets were allocated
  6. Write audit log with deletion reason
Output: { deleted: true, method: 'soft' | 'hard' }
```

---

### 9.5 `bookTickets` Cloud Function

**Trigger:** HTTPS callable  
**Auth:** Any authenticated user

```
Input:  {
  eventId: string,
  tiers: [{ tierId: string, quantity: number }],
  promoCode?: string,
  attendeeDetails: AttendeeInfo[]
}
Process:
  1. Verify user is authenticated
  2. Firestore transaction (atomic):
     a. Fetch event and all requested ticket tiers
     b. Check availability: sum(tier.available) >= sum(requested quantity)
     c. If promo code provided: validate and calculate discount
     d. Calculate total amount = sum(tier.price × quantity) - discount
     e. Calculate service fee = ₹12 × total_ticket_count
     f. Decrement tier.available for each tier (inventory control)
     g. Create bookings/{bookingId}:
        {
          eventId,
          userId,
          tiers: [...],
          totalAmount,
          serviceFee,
          discount,
          promoCode,
          status: 'pending',
          createdAt: now
        }
     h. Create tickets/{ticketId} for each individual ticket:
        {
          bookingId,
          eventId,
          userId,
          tierId,
          status: 'valid',
          qrCode: null, // Generated after payment
          attendeeDetails,
          gateAccessLevel
        }
  3. Initiate payment:
     - Call Razorpay createOrder API
     - Return order ID and amount to client
  4. Client completes payment → payment webhook triggers confirmBooking
Output: { bookingId, orderId, amount, tickets: [...] }
```

---

### 9.6 `confirmBooking` Cloud Function

**Trigger:** Razorpay payment webhook  
**Auth:** Webhook signature verification

```
Input:  { razorpayOrderId, razorpayPaymentId, razorpaySignature }
Process:
  1. Verify webhook signature (HMAC SHA256)
  2. Fetch booking by razorpay_order_id
  3. Update bookings/{bookingId}.status = 'confirmed'
  4. Create transactions/{transactionId}:
     {
       bookingId,
       eventId,
       userId,
       amount,
       serviceFee,
       gatewayTransactionId: razorpayPaymentId,
       gateway: 'razorpay',
       status: 'paid',
       timestamp: now
     }
  5. Generate QR codes for all tickets:
     a. For each ticket:
        - Construct payload: { ticketId, userId, eventId, transactionId, bookingId, timestamp, gateAccessLevel }
        - Compute SHA-256 hash of payload
        - Base64 encode { payload, signature: hash }
        - Store in tickets/{ticketId}.qrCode
  6. Send confirmation email to user with tickets attached (PDF)
  7. Send notification to organizer (new booking)
  8. Update event.ticketSummary.totalSold += quantity
  9. Update organizer.pendingBalance += netAmount
  10. Write audit log
Output: { confirmed: true, tickets: [...] }
```

---

### 9.7 `initiateRefund` Cloud Function (Organizer-scoped)

**Trigger:** HTTPS callable  
**Auth:** Organizer (own event) or Admin

```
Input:  { bookingId: string, reason: string }
Process:
  1. Verify caller owns event or is Admin
  2. Fetch booking, transaction, event
  3. Run eligibility checks:
     - booking.status == 'confirmed'
     - event.refundPolicy allows refunds
     - Within refund window (e.g., 7 days before event)
     - Tickets not yet checked in (tickets.status == 'valid', not 'used')
  4. If eligible:
     a. Call Razorpay refund API:
        - payment_id: transaction.gatewayPaymentId
        - amount: transaction.amount
     b. On success:
        - Update transaction.status = 'refunded'
        - Update booking.status = 'refunded'
        - Update all tickets: status = 'cancelled'
        - Restore inventory: tier.available += quantity
        - Deduct from organizer.pendingBalance or availableBalance
     c. Send refund confirmation email to user
     d. Write audit log with reason
  5. If ineligible:
     - Return { eligible: false, reason: '...' }
     - Organizer sees message: "Contact admin for override"
Output: { refunded: boolean, refundId?: string, reason?: string }
```

---

### 9.8 `checkInTicket` Cloud Function

**Trigger:** HTTPS callable  
**Auth:** Organizer (own event) or Admin

```
Input:  { ticketId: string, deviceId?: string, gateId?: string }
Process:
  1. Verify caller owns event or is Admin
  2. Fetch ticket document
  3. Validate:
     - ticket.status == 'valid' (not already checked in)
     - ticket.eventId matches caller's event
     - Ticket not expired
  4. Check for duplicate scan:
     - If ticket.checkedInAt exists: return { duplicate: true, firstCheckIn: timestamp }
  5. Update tickets/{ticketId}:
     {
       status: 'used',
       checkedInAt: now,
       checkedInBy: callerUid,
       deviceId,
       gateId
     }
  6. Increment event.stats.checkIns
  7. If IoT gate connected: send MQTT command to open gate
  8. Write audit log
  9. If this is the last ticket in booking: send "Thank you for attending" email
Output: { checkedIn: true, attendeeDetails: {...} }
```

---

### 9.9 `requestPayout` Cloud Function

**Trigger:** HTTPS callable  
**Auth:** Organizer

```
Input:  { amount: number, bankAccountId: string }
Process:
  1. Verify caller is organizer
  2. Fetch organizer.availableBalance
  3. Validate:
     - amount <= availableBalance
     - amount >= minimum (₹500)
     - bankAccount exists and verified
  4. Firestore transaction:
     a. Deduct from organizer.availableBalance
     b. Create payout_requests/{id}:
        {
          organizerUid,
          amount,
          bankAccountId,
          status: 'pending',
          requestedAt: now,
          expectedTransferDate: now + 3 business days
        }
  5. Send email confirmation to organizer
  6. Notify admin (if manual approval required)
  7. Write audit log
Output: { payoutRequestId, status: 'pending', expectedDate }
```

---

### 9.10 `registerDevice` Cloud Function

**Trigger:** HTTPS callable  
**Auth:** Organizer or Admin

```
Input:  {
  deviceName: string,
  deviceType: 'scanner' | 'crowd_monitor' | 'env_sensor' | 'display',
  venue: string,
  eventId?: string
}
Process:
  1. Verify caller has iot:manage permission
  2. Generate unique device ID
  3. Generate device API key (JWT with deviceId + organizerUid)
  4. Create devices/{deviceId}:
     {
       id: deviceId,
       name: deviceName,
       type: deviceType,
       ownerUid: callerUid,
       venue,
       assignedEvent: eventId,
       status: 'offline',
       apiKey: encryptedApiKey,
       alertThresholds: defaultThresholds,
       createdAt: now
     }
  5. Write audit log
  6. Return device credentials (API key shown once)
Output: { deviceId, apiKey, setupInstructions }
```

---

### 9.11 `sendDeviceCommand` Cloud Function (Organizer-scoped)

**Trigger:** HTTPS callable  
**Auth:** Organizer (own device) or Admin

```
Input:  { deviceId: string, command: DeviceCommand, params?: object }
Process:
  1. Verify caller owns device or is Admin
  2. Validate command is allowed:
     - Organizers can send: REBOOT, OPEN_GATE, CLOSE_GATE, CALIBRATE_SENSOR,
       ENTER_MAINTENANCE, EXIT_MAINTENANCE, REQUEST_SNAPSHOT
     - Cannot send: OTA_UPDATE, ROLLBACK (Admin/Super Admin only)
  3. Write to devices/{deviceId}/pendingCommand:
     {
       command,
       params,
       issuedBy: callerUid,
       issuedAt: now,
       status: 'pending'
     }
  4. Publish MQTT message to devices/{deviceId}/commands:
     { command, params }
  5. Wait for acknowledgement (30s timeout):
     - Subscribe to devices/{deviceId}/commandAck
     - On ack received: update pendingCommand.status = 'completed'
     - On timeout: update status = 'timeout'
  6. Write audit log
Output: { acknowledged: boolean, ackedAt?: timestamp }
```

---

### 9.12 `generateAnalyticsReport` Cloud Function

**Trigger:** HTTPS callable  
**Auth:** Organizer (own event) or Admin

```
Input:  { eventId: string, format: 'pdf' | 'csv' }
Process:
  1. Verify caller owns event or is Admin
  2. Query Firestore:
     - Fetch event document
     - Fetch all bookings for this event
     - Fetch all transactions
     - Aggregate revenue, tickets sold, check-in rate
  3. Generate report file:
     - If PDF: use Puppeteer to render HTML template → PDF
     - If CSV: generate rows with booking data
  4. Upload to Storage: /exports/{uid}/{eventId}_report.{format}
  5. Generate signed download URL (expires 1 hour)
  6. Write audit log
Output: { downloadUrl, expiresAt, format }
```

---

## 10. Firestore Schema

### `events/{eventId}` — Event Document (Organizer View)

See Section 4 for complete Event schema.

Additional Organizer-specific fields tracked:

```json
{
  "ownerUid": "organizer_uid",
  "collaborators": ["uid1", "uid2"], // Future: co-organizers
  "stats": {
    "views": 1250,
    "uniqueViews": 980,
    "cartAdds": 320,
    "checkoutStarts": 180,
    "bookings": 150,
    "checkIns": 120,
    "conversionRate": 12.0, // (bookings / views) × 100
    "avgTicketPrice": 650,
    "totalRevenue": 97500,
    "netRevenue": 95700 // After service fees
  }
}
```

---

### `bookings/{bookingId}` — Booking Document

```json
{
  "id": "auto-generated",
  "eventId": "event_id",
  "userId": "attendee_uid",
  "organizerUid": "organizer_uid",
  "tiers": [
    {
      "tierId": "tier_id",
      "tierName": "General Admission",
      "quantity": 2,
      "price": 500,
      "subtotal": 1000
    }
  ],
  "totalAmount": 1000,
  "discount": 100,
  "promoCode": "EARLYBIRD",
  "serviceFee": 24, // 2 tickets × ₹12
  "status": "pending | confirmed | cancelled | refunded",
  "paymentDetails": {
    "gateway": "razorpay",
    "orderId": "order_xyz",
    "paymentId": "pay_abc",
    "method": "card | upi | netbanking"
  },
  "attendeeDetails": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+919876543210",
      "ticketId": "ticket_id_1"
    }
  ],
  "createdAt": "timestamp",
  "confirmedAt": "timestamp",
  "refundedAt": "timestamp",
  "refundReason": "string"
}
```

---

### `tickets/{ticketId}` — Ticket Document

```json
{
  "id": "auto-generated",
  "bookingId": "booking_id",
  "eventId": "event_id",
  "userId": "attendee_uid",
  "tierId": "tier_id",
  "tierName": "VIP Pass",
  "price": 1500,
  "status": "valid | used | cancelled | expired",
  "qrCode": "base64_encoded_payload_with_signature",
  "gateAccessLevel": "vip",
  "attendeeDetails": {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+919876543210"
  },
  "checkedInAt": "timestamp",
  "checkedInBy": "organizer_uid",
  "deviceId": "device_id",
  "gateId": "gate_1",
  "generatedAt": "timestamp",
  "expiresAt": "timestamp",
  "regeneratedCount": 0
}
```

---

### `devices/{deviceId}` — IoT Device Document

```json
{
  "id": "auto-generated",
  "name": "Main Gate Scanner",
  "type": "scanner | crowd_monitor | env_sensor | display",
  "ownerUid": "organizer_uid",
  "venue": "Grand Ballroom",
  "assignedEvent": "event_id",
  "status": "online | offline | maintenance | error",
  "apiKey": "encrypted_jwt_token",

  // Hardware info
  "firmware": {
    "version": "v2.3.1",
    "lastUpdated": "timestamp"
  },
  "hardware": {
    "model": "ESP32-CAM",
    "batteryLevel": 85,
    "wifiRSSI": -45
  },

  // Alert thresholds
  "alertThresholds": {
    "temperatureWarning": 30,
    "temperatureCritical": 35,
    "gasWarning": 500,
    "gasCritical": 1000,
    "crowdWarning": 85,
    "crowdCritical": 95
  },

  // Latest readings (updated in real-time)
  "latestReading": {
    "temperature": 28.5,
    "humidity": 65,
    "gasLevel": 320,
    "occupancy": 245,
    "timestamp": "timestamp"
  },

  // Stats
  "stats": {
    "scansToday": 120,
    "validScans": 115,
    "invalidScans": 5,
    "lastScanAt": "timestamp"
  },

  // Connection
  "lastPingAt": "timestamp",
  "connectedAt": "timestamp",
  "createdAt": "timestamp"
}
```

---

### `payout_requests/{id}` — Payout Request Document

```json
{
  "id": "auto-generated",
  "organizerUid": "organizer_uid",
  "amount": 25000,
  "bankAccountId": "bank_account_id",
  "status": "pending | processing | completed | failed | cancelled",
  "events": ["event_id_1", "event_id_2"],
  "requestedAt": "timestamp",
  "approvedAt": "timestamp",
  "approvedBy": "admin_uid",
  "paidAt": "timestamp",
  "failureReason": "string",
  "transferDetails": {
    "bankTransactionId": "transfer_xyz",
    "bankName": "HDFC Bank",
    "accountNumber": "****1234"
  },
  "expectedTransferDate": "timestamp"
}
```

---

## 11. Real-Time Data Flows

### Dashboard Activity Feed

```
Firestore Composite Query:
  bookings where organizerUid == currentUser.uid
  orderBy('createdAt', 'desc')
  limit(15)

React Component:
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'bookings'),
        where('organizerUid', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(15)
      ),
      (snapshot) => {
        const activities = snapshot.docs.map(doc => ({
          type: 'booking',
          data: doc.data(),
          timestamp: doc.data().createdAt
        }));
        setActivityFeed(activities);
      }
    );
    return () => unsubscribe();
  }, [user.uid]);

Every new booking triggers onSnapshot callback →
  Activity feed updates in real-time →
    New item appears at top with animation
```

---

### IoT Device Status Updates

```
ESP32 sends heartbeat every 30 seconds →
  Publishes to MQTT: devices/{deviceId}/heartbeat →
    Cloud Function updates Firestore:
      devices/{deviceId}.lastPingAt = now
      devices/{deviceId}.status = 'online'
      devices/{deviceId}.hardware.batteryLevel = X

Dashboard subscribes:
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'devices', deviceId),
      (doc) => {
        setDevice(doc.data());
        updateStatusIndicator(doc.data().status);
      }
    );
    return () => unsubscribe();
  }, [deviceId]);

If lastPingAt > 5 minutes ago:
  Client-side logic sets status to 'offline' (visual indicator only)
  Cloud scheduled function (runs every minute):
    Updates devices where lastPingAt < now - 5 minutes
    Sets status = 'offline'
    Sends push notification to organizer
```

---

### Live Ticket Sales Counter

```
Component: EventCard shows "Tickets: 45 / 100 (45%)"

Firestore listener on event document:
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'events', eventId),
      (doc) => {
        const event = doc.data();
        setTicketsSold(event.ticketSummary.totalSold);
        setCapacity(event.ticketSummary.totalCapacity);
      }
    );
    return () => unsubscribe();
  }, [eventId]);

When new booking confirmed →
  confirmBooking Cloud Function:
    Updates event.ticketSummary.totalSold += quantity

Firestore propagates update →
  onSnapshot callback fires in all connected clients →
    EventCard re-renders with new sold count
    Progress bar animates to new percentage
```

---

### Crowd Occupancy Heatmap

```
ESP32-CAM #2 sends crowd data every 10 seconds →
  MQTT publish to venues/{venueId}/crowd:
    {
      deviceId,
      occupancy: 245,
      densityMap: [[0,2,5,...], [1,3,4,...], ...]
    }
  Cloud Function receives:
    Updates events/{eventId}.stats.currentOccupancy = 245
    Writes to devices/{deviceId}/readings sub-collection (for history)

Dashboard heatmap component:
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'events', eventId),
      (doc) => {
        const occupancy = doc.data().stats.currentOccupancy;
        setOccupancy(occupancy);
      }
    );

    // Also subscribe to latest reading for full density map
    const deviceUnsubscribe = onSnapshot(
      query(
        collection(db, 'devices', deviceId, 'readings'),
        orderBy('timestamp', 'desc'),
        limit(1)
      ),
      (snapshot) => {
        const reading = snapshot.docs[0].data();
        updateHeatmap(reading.densityMap);
      }
    );

    return () => {
      unsubscribe();
      deviceUnsubscribe();
    };
  }, [eventId, deviceId]);

Heatmap renders as 10×10 grid of colored cells (CSS grid):
  - Green: 0-3 people per zone
  - Yellow: 4-6 people
  - Red: 7-9 people
  - Purple: 10+ people (overcrowded)
```

---

## 12. State Management

### Zustand Store: `useOrganizerStore`

```ts
interface OrganizerStore {
  // Events
  myEvents: Event[];
  selectedEvent: Event | null;
  eventFilters: EventFilters;

  // Dashboard
  dashboardStats: {
    totalEvents: number;
    totalRevenue: number;
    totalAttendees: number;
    conversionRate: number;
  };
  activityFeed: Activity[];

  // Attendees
  attendees: Attendee[];
  selectedAttendee: Attendee | null;

  // IoT
  devices: IoTDevice[];
  selectedDevice: IoTDevice | null;
  deviceReadings: SensorReading[];
  activeAlerts: DeviceAlert[];

  // Finance
  availableBalance: number;
  pendingBalance: number;
  payoutRequests: PayoutRequest[];

  // Marketing
  promoCodes: PromoCode[];
  emailCampaigns: EmailCampaign[];

  // Actions
  fetchMyEvents: () => Promise<void>;
  fetchEventById: (eventId: string) => Promise<void>;
  createEvent: (data: CreateEventData) => Promise<string>;
  updateEvent: (eventId: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  publishEvent: (eventId: string) => Promise<void>;

  fetchAttendees: (eventId: string) => Promise<void>;
  checkInAttendee: (ticketId: string) => Promise<void>;

  fetchDevices: () => Promise<void>;
  sendDeviceCommand: (deviceId: string, command: DeviceCommand) => Promise<void>;
  updateDeviceThresholds: (deviceId: string, thresholds: AlertThresholds) => Promise<void>;

  fetchBalance: () => Promise<void>;
  requestPayout: (amount: number, bankAccountId: string) => Promise<void>;

  createPromoCode: (data: PromoCodeData) => Promise<void>;

  setEventFilters: (filters: Partial<EventFilters>) => void;
  setSelectedEvent: (event: Event | null) => void;
  setSelectedDevice: (device: IoTDevice | null) => void;
}
```

---

### Real-Time Subscriptions

Organizer module maintains these Firestore listeners:

| Listener                | Query                                             | Updates                   |
| ----------------------- | ------------------------------------------------- | ------------------------- |
| My Events               | `events` where `ownerUid == currentUser.uid`      | Event list + stats        |
| Activity Feed           | `bookings` where `organizerUid == uid` (last 15)  | Dashboard activity feed   |
| Devices                 | `devices` where `ownerUid == uid`                 | IoT device status         |
| Active Alerts           | `security_alerts` where `orgId == currentOrg`     | Real-time alert feed      |
| Balance                 | `users/{uid}` (financial fields)                  | Available/pending balance |
| Current Event Occupancy | `events/{selectedEventId}.stats.currentOccupancy` | Live crowd counter        |

---

## 13. Navigation & Routing

### Sidebar Navigation Structure

```
📊 Organizer
├── 🏠  Dashboard                   /organizer
├── 📅  My Events                    /organizer/events
│   ├── ➕ Create Event              /organizer/events/create
│   └── 📊 Event Detail              /organizer/events/:id/manage
│       ├── Overview                /organizer/events/:id/manage
│       ├── Edit                    /organizer/events/:id/edit
│       ├── Tickets                 /organizer/events/:id/tiers
│       ├── Attendees               /organizer/events/:id/attendees
│       ├── Analytics               /organizer/events/:id/analytics
│       ├── IoT Devices             /organizer/events/:id/iot
│       ├── Marketing               /organizer/events/:id/marketing
│       └── Communication           /organizer/events/:id/communication
├── 📡  IoT Devices                 /organizer/devices
├── 💰  Payouts                     /organizer/payouts
├── 📢  Marketing                   /organizer/marketing
│   ├── Promo Codes                /organizer/marketing/promos
│   ├── Email Campaigns            /organizer/marketing/email
│   └── Social Media AI            /organizer/marketing/social
├── 📸  Scan Tickets                /organizer/scan
└── ⚙️   Settings                    /organizer/settings
```

---

### Route Guards

```tsx
<Route
  path="/organizer/*"
  element={
    <RequireAuth>
      <RequireRole roles={['organizer', 'admin', 'superadmin']}>
        <OrganizerLayout>
          <Outlet />
        </OrganizerLayout>
      </RequireRole>
    </RequireAuth>
  }
>
  <Route index element={<OrganizerDashboard />} />
  <Route path="events" element={<MyEventsPage />} />
  <Route path="events/create" element={<CreateEventPage />} />
  <Route path="events/:id/manage" element={<ManageEventPage />}>
    <Route index element={<EventOverviewTab />} />
    <Route path="edit" element={<EditEventTab />} />
    <Route path="tiers" element={<TicketTiersTab />} />
    <Route path="attendees" element={<AttendeesTab />} />
    <Route path="analytics" element={<AnalyticsTab />} />
    <Route path="iot" element={<IoTDevicesTab />} />
    <Route path="marketing" element={<MarketingTab />} />
    <Route path="communication" element={<CommunicationTab />} />
  </Route>
  <Route path="devices" element={<IoTDevicesPage />} />
  <Route path="payouts" element={<PayoutsPage />} />
  <Route path="marketing" element={<MarketingToolsPage />} />
  <Route path="scan" element={<ScannerPage />} />
  <Route path="settings" element={<OrganizerSettingsPage />} />
</Route>
```

---

## 14. Mobile Optimization

### Scanner Page Optimizations

**Purpose:** `/organizer/scan` must work flawlessly on mobile devices (phones/tablets) at venue gates.

**Key Optimizations:**

1. **Full-Screen Mode:**
   - Hides browser chrome (uses `standalone` PWA mode)
   - Prevents accidental navigation away
   - Status bar overlay for critical info only

2. **Camera Performance:**
   - Uses `facingMode: 'environment'` (rear camera by default)
   - Lower resolution (640×480) for faster processing
   - 30 FPS capture but 10 FPS QR detection (reduces CPU)

3. **Haptic Feedback:**
   - Valid scan: Short vibration (100ms)
   - Invalid scan: Double vibration (100ms × 2)
   - Uses `navigator.vibrate()` API

4. **Offline Capability:**
   - Downloads ticket manifest to IndexedDB on page load
   - Validates tickets against local cache
   - Queues check-ins for sync when online
   - Shows "📴 Offline Mode" banner

5. **Auto-Brightness:**
   - Increases screen brightness to max for QR display
   - Restores original brightness on page exit

6. **Prevent Sleep:**
   - Uses WakeLock API to keep screen on
   - Critical for continuous scanning sessions

7. **Touch-Optimized UI:**
   - Large tap targets (min 44×44px)
   - Swipe gestures (swipe up for history, down to dismiss result)
   - No hover states (pure touch interactions)

---

### Event Creation on Mobile

**Responsive 8-Step Wizard:**

1. **Collapsed Sidebar:** Hamburger menu instead of fixed sidebar
2. **Stacked Layout:** Form and preview stack vertically (preview below form on mobile)
3. **Touch Inputs:**
   - Date/time pickers use native mobile controls
   - File uploads use native camera/gallery picker
   - Map uses full-screen mode for address selection
4. **Progress Indicator:** Sticky top bar showing "Step 3 of 8"
5. **Swipe Navigation:** Swipe left/right to navigate steps
6. **Auto-Save:** Form saves to localStorage every 30 seconds (prevent data loss)

---

### Dashboard Responsive Layout

**Breakpoints:**

- **Desktop:** >1024px — 3-column grid, sidebar visible
- **Tablet:** 768-1024px — 2-column grid, collapsible sidebar
- **Mobile:** <768px — 1-column stack, hamburger menu

**Component Adaptations:**

- **Charts:** Touch-scrollable on mobile, tooltips on tap instead of hover
- **Tables:** Horizontal scroll with sticky first column
- **Cards:** Full-width on mobile, maintain aspect ratio
- **Modals:** Full-screen on mobile instead of centered overlay

---

> **The Organizer Dashboard is the creative hub of FlowGateX — where events come to life, attendees are engaged, venues are monitored in real-time, and revenue is tracked with precision. Every feature is designed for speed, reliability, and an exceptional user experience.**

---

_© 2026 FlowGateX. All rights reserved._
