# 📸 FlowGateX — QR Scanner Page Redesign Specification (Organizer Role)

> **Desktop-First Ticket Validation Interface**  
> A complete redesign of the QR Scanner page optimized for desktop operator stations and event management dashboards, with full mobile support for on-ground gate staff. This specification maintains all existing functionality while dramatically improving usability, visual hierarchy, and operator efficiency across all devices.

---

## 📌 Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Layout Architecture](#2-layout-architecture)
3. [Component Specifications](#3-component-specifications)
4. [Interaction Flows](#4-interaction-flows)
5. [State Management](#5-state-management)
6. [Responsive Breakpoints](#6-responsive-breakpoints)
7. [Accessibility Features](#7-accessibility-features)
8. [Performance Optimizations](#8-performance-optimizations)
9. [Implementation Details](#9-implementation-details)

---

## 1. Design Philosophy

### Core Principles

**1. Desktop-First, Mobile-Supported**

- Primary use case: Desktop/laptop operator stations and check-in kiosks
- Full three-panel layout maximizes screen real estate for monitoring, scanning, and validation simultaneously
- Mobile delivers a condensed but fully functional experience for on-ground gate staff
- All critical functions reachable via keyboard shortcut on desktop, within one tap on mobile

**2. Zero-Friction Validation**

- Scan → Validate → Confirm in <2 seconds
- Minimal cognitive load during high-pressure check-ins
- Clear, immediate feedback at every step

**3. Operational Resilience**

- Works offline with local ticket cache
- Multiple input methods (camera, manual entry, image upload)
- Fallback workflows for every failure scenario

**4. Visual Clarity Under Stress**

- High-contrast color coding (valid=green, invalid=red, duplicate=amber)
- Large click/tap targets (minimum 44×44px)
- No ambiguous states — every status is visually distinct

---

## 2. Layout Architecture

### Primary Layout — Desktop (>1024px)

The desktop layout is the full-featured interface, built as a three-panel system that allows operators to monitor stats, scan tickets, and review validation results simultaneously without switching views.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HEADER BAR                                                                  │
│ Event: TechConf 2026 | Today: 120/500 scanned | Battery: 85% | [Settings]  │
└─────────────────────────────────────────────────────────────────────────────┘
┌──────────────────────┬──────────────────────────────┬────────────────────────┐
│                      │                              │                        │
│  LEFT PANEL (30%)    │   CENTER PANEL (40%)         │  RIGHT PANEL (30%)     │
│                      │                              │                        │
│  📊 Stats Cards      │   📷 QR Camera Viewport      │  ✅ Validation Result  │
│  • Total Scans       │   [Live camera feed]         │  [Attendee details]    │
│  • Valid Today       │   [Scanner crosshair]        │  [Status indicator]    │
│  • Invalid Today     │   [Status badge]             │  [Action buttons]      │
│  • Duplicates        │                              │                        │
│                      │   🎛️ Scanner Controls        │  📋 Recent Activity    │
│  🕘 Recent Scans     │   [Start/Stop]               │  [Last 10 scans]       │
│  [Scrollable list]   │   [Camera selector]          │  [Timeline view]       │
│  [Search filter]     │   [Flashlight toggle]        │                        │
│  [Clear history]     │   [Upload QR image]          │  🖥️ System Log         │
│                      │   [Manual entry button]      │  [Technical feed]      │
│  ⚙️ Settings Card    │                              │  [Expandable]          │
│  • Continuous scan   │   ⌨️ Manual Entry Modal      │                        │
│  • Sound/vibration   │   [Ticket ID input]          │                        │
│  • Auto-save         │   [Submit button]            │                        │
│                      │                              │                        │
│  💾 Export Data      │                              │                        │
│  [CSV] [PDF] [JSON]  │                              │                        │
│                      │                              │                        │
└──────────────────────┴──────────────────────────────┴────────────────────────┘
```

---

### Tablet Layout (768–1024px)

Two-panel split-screen that preserves the core desktop scanning experience while adapting for smaller viewports:

- **Left 60%:** Camera viewport + controls
- **Right 40%:** Validation result + recent activity

Header bar remains visible in a compact form. Stats cards and system log are hidden to reduce clutter.

---

### Secondary Layout — Mobile (<768px)

The mobile layout is a condensed, single-focus view optimized for gate staff operating with one hand in live environments. All desktop functionality is accessible, surfaced through drawers, modals, and a sticky bottom control bar.

```
┌─────────────────────────────────────────┐
│ 📊 Compact Stats Bar                    │
│ 120/500 | ✅ 115 | ❌ 5                │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│                                         │
│        📷 QR CAMERA VIEWPORT            │
│        [Full-screen camera]             │
│        [Scanner crosshair overlay]      │
│        [Status badge centered]          │
│                                         │
│                                         │
│                                         │
│                                         │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ 🎛️ Bottom Control Bar (sticky)          │
│ [🔦] [📷] [⌨️] [⚙️] [📋]               │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ ✅ Validation Overlay (slide-up)        │
│ [Appears on successful scan]            │
│ [Auto-dismisses after 2 seconds]        │
│ [Manual dismiss with swipe down]        │
└─────────────────────────────────────────┘
```

---

## 3. Component Specifications

### 3.1 Header Bar (Desktop & Tablet)

**Purpose:** Persistent contextual awareness and quick settings access for operators.

**Layout:** Horizontal bar, fixed to top, height 60px.

**Elements:**

| Element            | Position     | Display                                     |
| ------------------ | ------------ | ------------------------------------------- |
| Event Name         | Left         | "TechConf 2026" (clickable → event detail)  |
| Today's Scan Stats | Center-Left  | "120 / 500 scanned (24%)"                   |
| Device Battery     | Center-Right | Icon + percentage (if mobile/laptop device) |
| Connection Status  | Center-Right | 🟢 Online / 🔴 Offline indicator            |
| Settings Icon      | Right        | Gear icon → opens settings modal            |
| Back to Dashboard  | Far Right    | "← Dashboard" link                          |

**Visual Treatment:**

- Background: `#1a1a2e` (dark navy)
- Text: `#ffffff` (white)
- Accent: `#16c784` (green for active status)
- Border bottom: 1px solid `rgba(255, 255, 255, 0.1)`

> **Mobile:** Header bar is hidden. Stats are replaced by the compact stats bar above the camera viewport.

---

### 3.2 Stats Cards Panel (Left Panel — Desktop Only)

**Purpose:** Real-time operational metrics visible at all times without leaving the scanning view.

**Layout:** Vertical stack of 4 compact cards. Persistent and always visible on desktop.

---

#### Card 1: Total Scans Today

```
┌──────────────────────────┐
│ 📊 TOTAL SCANS           │
│                          │
│      120                 │
│    Today                 │
│                          │
│ ↑ 15% vs. yesterday      │
└──────────────────────────┘
```

**Data Source:** Real-time counter, increments on each scan (valid or invalid).

---

#### Card 2: Valid Scans

```
┌──────────────────────────┐
│ ✅ VALID                 │
│                          │
│      115                 │
│    95.8%                 │
│                          │
│ 🟢 All verified          │
└──────────────────────────┘
```

**Visual:** Green accent border, green percentage text.

---

#### Card 3: Invalid Scans

```
┌──────────────────────────┐
│ ❌ INVALID               │
│                          │
│       5                  │
│    4.2%                  │
│                          │
│ 🔴 Review required       │
└──────────────────────────┘
```

**Visual:** Red accent border, red percentage text.

---

#### Card 4: Duplicate Attempts

```
┌──────────────────────────┐
│ ⚠️ DUPLICATES            │
│                          │
│       3                  │
│    2.5%                  │
│                          │
│ 🟡 Already checked in    │
└──────────────────────────┘
```

**Visual:** Amber accent border, amber percentage text.

> **Mobile:** These four metrics are collapsed into a single compact stats bar (text only) at the top of the screen.

---

### 3.3 Recent Scans Feed (Left Panel — Desktop Only)

**Purpose:** Scrollable audit trail of all scan attempts available without leaving the main view.

**Layout:** Vertical list, max-height 400px, scrollable.

**Header:**

```
┌──────────────────────────┐
│ 🕘 RECENT SCANS          │
│ [Search bar]             │
│ [Clear History] button   │
└──────────────────────────┘
```

**List Items:**

Each scan entry displays as a compact card:

```
┌────────────────────────────────────┐
│ ✅ John Doe • General Admission    │
│ 2 minutes ago • Ticket #TK-12345   │
│ Gate: Main Entrance                │
└────────────────────────────────────┘
```

**Visual Treatment by Status:**

- **Valid:** Green left border (4px), white background
- **Invalid:** Red left border, light red background tint
- **Duplicate:** Amber left border, light amber background tint

**Interaction:**

- Click entry → opens detailed scan result modal
- Hover → shows quick preview tooltip with full ticket data

**Search Feature:**

- Real-time filter by name, ticket ID, email
- Debounced 300ms
- Case-insensitive

**Clear History Button:**

- Confirmation modal: "Clear all scan history? This cannot be undone."
- Only clears UI state, not persistent logs in Firestore

> **Mobile:** Recent scans accessible via the 📋 icon in the bottom control bar, which opens a bottom drawer with the full feed.

---

### 3.4 Settings Card (Left Panel — Desktop Only)

**Purpose:** Scanner behavior configuration, always accessible in the left panel without interrupting the scan flow.

**Layout:** Collapsible card, expanded by default.

---

#### 1. Continuous Scan Mode

```
Continuous Scan          [Toggle: ON/OFF]
Auto-scan next ticket after validation
```

**Behavior:**

- OFF: Camera pauses after each scan; requires "Start Scan" to resume
- ON: Camera continues scanning immediately after displaying result (2-second delay)

---

#### 2. Audio Feedback

```
Sound                    [Toggle: ON/OFF]
Play beep on scan
```

**Sound Effects:**

- Valid scan: Success chime (tone 1)
- Invalid scan: Error buzz (tone 2)
- Duplicate scan: Warning beep (tone 3)

---

#### 3. Haptic Feedback

```
Vibration                [Toggle: ON/OFF]
Vibrate on scan result
```

**Vibration Patterns:**

- Valid: Short single pulse (100ms)
- Invalid: Double pulse (100ms × 2)
- Duplicate: Triple pulse (100ms × 3)

---

#### 4. Auto-Save Scans

```
Auto-Save                [Toggle: ON/OFF]
Save scans to local storage
```

**Purpose:** Offline resilience. If enabled, all scans are stored in IndexedDB and synced to Firestore when online.

---

#### 5. Show System Log

```
Technical Log            [Toggle: ON/OFF]
Display debug messages
```

**Purpose:** Shows/hides the System Log panel in the right panel on desktop.

> **Mobile:** Settings accessible via the ⚙️ icon in the bottom control bar, which opens a full-screen modal.

---

### 3.5 Export Data Panel (Left Panel — Desktop Only)

**Purpose:** Download scan history for reporting directly from the main view.

**Layout:** Horizontal button row.

```
┌──────────────────────────┐
│ 💾 EXPORT DATA           │
│                          │
│ [CSV] [PDF] [JSON]       │
└──────────────────────────┘
```

**Export Formats:**

| Button | Format | Contents                                             |
| ------ | ------ | ---------------------------------------------------- |
| CSV    | .csv   | Name, Email, Ticket ID, Tier, Status, Timestamp      |
| PDF    | .pdf   | Formatted report with event header, stats, scan list |
| JSON   | .json  | Raw data dump for API integration                    |

**File Naming Convention:**
`{eventName}_scans_{date}.{extension}`
Example: `TechConf_2026_scans_2026-03-15.csv`

**Trigger:** Cloud Function `exportScanData`.

> **Mobile:** Export accessible within the Settings modal.

---

### 3.6 QR Camera Viewport (Center Panel)

**Purpose:** Primary scanning interface. The focal point of the desktop layout, centered and prominently sized.

**Layout:** Square aspect ratio (1:1) on desktop, full-width on mobile.

**Dimensions:**

- Desktop: 600×600px (center panel)
- Tablet: Full left-panel width (60%)
- Mobile: 100vw × ~70vh (fills screen above bottom control bar)

---

#### Visual Elements:

**A. Camera Feed**

- Live video stream from device camera
- 15 FPS for QR detection
- Auto-focus enabled (if supported)
- Exposure auto-adjusts for optimal contrast

**B. Scanner Crosshair Overlay**

```
      ┌─────────────────┐
      │                 │
      │                 │
      │   ╔═════════╗   │
      │   ║         ║   │
      │   ║  SCAN   ║   │  ← Neon green animated box
      │   ║  AREA   ║   │
      │   ╚═════════╝   │
      │                 │
      │                 │
      └─────────────────┘
```

**Animation:** Pulsing glow effect (1-second loop).

**Color:** `#16c784` (green) when ready, `#f59e0b` (amber) when scanning.

---

**C. Status Badge (Centered at Bottom of Viewport)**

Dynamic badge showing scanner state:

| State        | Badge Text           | Color | Icon |
| ------------ | -------------------- | ----- | ---- |
| Idle         | Ready to Scan        | Blue  | 📷   |
| Scanning     | Scanning...          | Amber | 🔄   |
| Valid        | ✅ Valid Ticket      | Green | ✅   |
| Invalid      | ❌ Invalid Ticket    | Red   | ❌   |
| Duplicate    | ⚠️ Already Used      | Amber | ⚠️   |
| Processing   | Processing...        | Blue  | ⏳   |
| Camera Error | Camera Access Denied | Red   | 🚫   |

**Visual Treatment:**

- Pill-shaped badge
- Semi-transparent background: `rgba(0, 0, 0, 0.7)`
- White text, bold
- Icon + text
- Smooth fade-in/out transitions (300ms)

---

**D. Scan Success Animation**

When a valid QR code is detected:

1. Crosshair box flashes green (3 pulses, 100ms each)
2. Success checkmark (✅) animates from center (scale 0 → 1, 300ms ease-out)
3. Confetti burst animation (optional, can be disabled in settings)
4. Haptic feedback + sound (if enabled)
5. Auto-resume scanning after 2 seconds (if continuous mode ON)

---

**E. Camera Error State**

If camera access is denied or fails:

```
┌─────────────────────────────────┐
│                                 │
│          🚫 Camera Error        │
│                                 │
│   Unable to access camera.      │
│                                 │
│   Please check permissions:     │
│   Settings → Privacy → Camera   │
│                                 │
│   [Retry Access]                │
│   [Use Manual Entry]            │
│                                 │
└─────────────────────────────────┘
```

**Retry Access Button:** Triggers `navigator.mediaDevices.getUserMedia()` again.

**Use Manual Entry Button:** Opens manual ticket ID input modal.

---

### 3.7 Scanner Controls (Center Panel — Below Viewport)

**Purpose:** Camera and input method controls, displayed inline below the viewport on desktop.

**Desktop Layout:** Horizontal grid of buttons.

```
┌────────────────────────────────────────────────────┐
│ [🎬 Start Scan] [⏹️ Stop Scan]                     │
│                                                    │
│ [📷 Camera: Rear ▾] [🔦 Flashlight] [📤 Upload QR]│
│                                                    │
│ [⌨️ Manual Entry]                                  │
└────────────────────────────────────────────────────┘
```

**Mobile Layout:** Controls are condensed into the sticky bottom control bar — `[🔦] [📷] [⌨️] [⚙️] [📋]`. Start Scan is replaced by a large primary CTA button above the bar.

---

#### Button Specifications:

| Button              | Function                               | Desktop Visibility           |
| ------------------- | -------------------------------------- | ---------------------------- |
| **Start Scan**      | Activates camera + begins QR detection | Primary CTA, always visible  |
| **Stop Scan**       | Pauses camera feed                     | Only when scanning is active |
| **Camera Selector** | Dropdown: lists all available cameras  | Always visible               |
| **Flashlight**      | Toggle device flashlight               | Always visible               |
| **Upload QR Image** | Opens file picker to upload QR image   | Always visible               |
| **Manual Entry**    | Opens manual ticket ID input modal     | Always visible               |

---

#### Button Visual Treatment:

**Start Scan (Primary)**

- Background: `#16c784` (green)
- Text: White, bold
- Height: 40px desktop, 48px mobile
- Icon: Camera icon

**Stop Scan (Danger)**

- Background: `#ef4444` (red)
- Text: White, bold
- Replaces Start Scan when active
- Animated pulse border

**Secondary Buttons (Camera, Upload, Manual)**

- Background: `#2d2d44` (dark slate)
- Border: 1px solid `rgba(255, 255, 255, 0.2)`
- Text: White
- Hover: border becomes `#16c784`

**Flashlight Toggle**

- OFF: Grey icon
- ON: Yellow icon with glow effect

---

### 3.8 Manual Entry Modal

**Purpose:** Fallback input method when QR scanning fails.

**Trigger:** "Manual Entry" button or keyboard shortcut `M` (desktop).

**Layout:** Centered modal overlay, 400px wide on desktop, full-screen on mobile.

```
┌──────────────────────────────────────┐
│ ⌨️ Manual Ticket Entry               │
├──────────────────────────────────────┤
│                                      │
│ Ticket ID                            │
│ ┌──────────────────────────────────┐ │
│ │ #TK-                             │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Example: TK-123456 or #829310        │
│                                      │
│ [Cancel]              [Check In ✅]  │
│                                      │
└──────────────────────────────────────┘
```

**Input Field:**

- Auto-focus on open
- Placeholder: `#TK-`
- Auto-formats input (removes spaces, converts to uppercase)
- Validates format: alphanumeric + dashes
- Enter key → submits

**Check In Button:**

- Disabled until valid format entered
- Triggers same validation flow as QR scan
- Shows loading spinner while processing

**Keyboard Shortcuts (Desktop):**

- `Enter` → Submit
- `Escape` → Close modal

---

### 3.9 Validation Result Card (Right Panel — Desktop & Tablet)

**Purpose:** Detailed information about the most recently scanned ticket, always visible alongside the camera on desktop without any panel switching.

**Layout:** Full-height card in the right panel, scrollable content.

---

#### Idle State (No Scan Yet):

```
┌────────────────────────────────┐
│                                │
│         🎫                     │
│                                │
│     Awaiting Scan...           │
│                                │
│  Position QR code in camera    │
│  or use manual entry           │
│                                │
└────────────────────────────────┘
```

---

#### Valid Scan State:

```
┌────────────────────────────────────┐
│ ✅ VALID TICKET                    │
├────────────────────────────────────┤
│                                    │
│ 👤 John Doe                        │
│ 📧 john.doe@email.com              │
│ 📞 +91 98765 43210                 │
│                                    │
│ 🎟️ Ticket Details                  │
│ • Tier: VIP Pass                   │
│ • Price: ₹1,500                    │
│ • Ticket ID: TK-123456             │
│ • Booking ID: BK-789012            │
│ • Gate Access: VIP Lounge          │
│                                    │
│ 📅 Event Information               │
│ • Event: TechConf 2026             │
│ • Date: March 15, 2026             │
│ • Time: 6:00 PM - 10:00 PM         │
│ • Venue: Grand Ballroom            │
│                                    │
│ ✅ Check-In Status                 │
│ • Status: Confirmed                │
│ • Checked In: Just Now             │
│ • Gate: Main Entrance              │
│ • Device: Scanner-001              │
│                                    │
│ [📋 Copy Details] [🔗 View Booking]│
│                                    │
└────────────────────────────────────┘
```

**Visual Treatment:**

- Green header bar: `#16c784`
- White background
- Sections separated by subtle dividers
- Monospace font for IDs

---

#### Invalid Ticket State:

```
┌────────────────────────────────────┐
│ ❌ INVALID TICKET                  │
├────────────────────────────────────┤
│                                    │
│ 🚫 Reason: Ticket Expired          │
│                                    │
│ 🎟️ Ticket Information              │
│ • Ticket ID: TK-999999             │
│ • Event: TechConf 2026             │
│ • Original Date: March 10, 2026    │
│                                    │
│ ⚠️ This ticket is not valid for    │
│    entry. Please contact the       │
│    organizer for assistance.       │
│                                    │
│ [📞 Contact Organizer]             │
│ [↻ Scan Next Ticket]               │
│                                    │
└────────────────────────────────────┘
```

**Invalid Reasons (Displayed Clearly):**

- Ticket has expired
- QR code is tampered (signature mismatch)
- Ticket is for a different event
- Ticket tier not authorized for this gate
- Ticket has been refunded/cancelled
- Ticket does not exist in system

---

#### Duplicate Scan State:

```
┌────────────────────────────────────┐
│ ⚠️ ALREADY CHECKED IN              │
├────────────────────────────────────┤
│                                    │
│ 👤 Jane Smith                      │
│                                    │
│ 🕐 First Check-In Details          │
│ • Time: 5:45 PM (15 mins ago)      │
│ • Gate: Main Entrance              │
│ • Device: Scanner-002              │
│ • Staff: John (Organizer)          │
│                                    │
│ ⚠️ This ticket has already been    │
│    used for entry.                 │
│                                    │
│ 🔐 Override Options                │
│ [🔓 Allow Re-Entry] (Requires note)│
│ [❌ Reject Entry]                  │
│                                    │
└────────────────────────────────────┘
```

**Override Flow:**

- "Allow Re-Entry" → opens reason modal
- Reason input (required): dropdown + free text
  - Lost ticket, rescanned
  - Re-entry (bathroom, parking)
  - Device error, duplicate scan
  - Other (specify)
- Logs override action to audit trail
- Marks ticket with `overrideCount` field

> **Mobile:** The Validation Result Card surfaces as a slide-up overlay that appears automatically after each scan and auto-dismisses after 2 seconds (valid scans) or requires manual dismiss (invalid/duplicate).

---

### 3.10 Recent Activity Feed (Right Panel — Below Validation Card, Desktop Only)

**Purpose:** Live timeline of the last 10 scans, visible at a glance without leaving the main view.

**Layout:** Vertical timeline list, compact.

```
┌────────────────────────────────────┐
│ 📋 RECENT ACTIVITY                 │
├────────────────────────────────────┤
│                                    │
│ 🟢 2m ago                          │
│ John Doe • General • TK-12345      │
│                                    │
│ 🟢 5m ago                          │
│ Jane Smith • VIP • TK-67890        │
│                                    │
│ 🔴 8m ago                          │
│ Invalid • TK-99999 (Expired)       │
│                                    │
│ 🟡 12m ago                         │
│ Bob Johnson • General • TK-11111   │
│ (Duplicate - Allowed)              │
│                                    │
│ [View Full History →]              │
│                                    │
└────────────────────────────────────┘
```

**Color Coding:**

- 🟢 Green dot: Valid scan
- 🔴 Red dot: Invalid scan
- 🟡 Amber dot: Duplicate / override

**Click Entry:** Loads detailed result in the validation card above.

**View Full History:** Opens full history modal with search.

> **Mobile:** Accessible via the 📋 icon in the bottom control bar, opens as a bottom drawer.

---

### 3.11 System Log Panel (Right Panel — Desktop Only, Collapsible)

**Purpose:** Technical debug output for advanced operators and developers.

**Layout:** Terminal-style console, monospace font.

**Visibility:** Toggle via Settings card (OFF by default).

```
┌────────────────────────────────────┐
│ 🖥️ SYSTEM LOG          [Collapse] │
├────────────────────────────────────┤
│ [15:42:03] Scanner initialized     │
│ [15:42:04] Camera: Rear (ID: 0)    │
│ [15:42:05] QR Library loaded       │
│ [15:42:10] Scan started            │
│ [15:42:12] QR detected             │
│ [15:42:12] Decoding...             │
│ [15:42:13] Base64 decoded          │
│ [15:42:13] SHA-256 verified ✓      │
│ [15:42:14] Firestore query...      │
│ [15:42:15] Ticket valid ✓          │
│ [15:42:15] Check-in logged         │
│ [15:42:16] Gate command sent       │
│                                    │
│ [Clear Log]                        │
└────────────────────────────────────┘
```

**Log Levels (Color-Coded):**

- INFO: White text
- SUCCESS: Green text
- WARNING: Amber text
- ERROR: Red text

**Auto-Scroll:** Keeps latest entry visible.

> **Mobile:** System log is not available on mobile.

---

## 4. Interaction Flows

### 4.1 Standard Scan Flow (Continuous Mode ON)

```
User presses "Start Scan" (or Space key on desktop) →
  Camera activates →
    Status badge: "Ready to Scan" (blue) →
      QR code enters frame →
        Status badge: "Scanning..." (amber, animated) →
          QR detected →
            Camera freezes frame →
              Status badge: "Processing..." (blue) →
                Base64 decode + SHA-256 verify →
                  Firestore ticket query →
                    VALID:
                      Status badge: "✅ Valid Ticket" (green) →
                        Validation card populates (right panel, desktop)
                        OR slide-up overlay (mobile) →
                          Success sound/vibration (if enabled) →
                            Gate open command sent (if IoT connected) →
                              Firestore update: ticket.status = 'used' →
                                Log to recent activity feed →
                                  Auto-resume scanning after 2 seconds

                    INVALID:
                      Status badge: "❌ Invalid Ticket" (red) →
                        Validation card / overlay shows error details →
                          Error sound/vibration →
                            Log to recent activity feed →
                              Auto-resume scanning after 3 seconds

                    DUPLICATE:
                      Status badge: "⚠️ Already Used" (amber) →
                        Validation card / overlay shows override options →
                          Warning sound/vibration →
                            Organizer decides: Allow Override or Reject →
                              Log decision to audit trail →
                                Auto-resume scanning after override resolved
```

---

### 4.2 Manual Entry Flow

```
User clicks "Manual Entry" button (or presses M on desktop) →
  Modal opens (centered on desktop, full-screen on mobile) →
    Input field auto-focused →
      User types ticket ID →
        Real-time format validation →
          Valid format detected →
            "Check In" button enabled →
              User presses Enter or clicks button →
                Same validation pipeline as QR scan →
                  Result displayed in validation card (desktop)
                  or slide-up overlay (mobile) →
                    Modal closes automatically after 2 seconds (if valid)
```

---

### 4.3 Image Upload Flow

```
User clicks "Upload QR Image" →
  File picker opens →
    User selects image file (PNG, JPG, WebP) →
      Image loads into memory →
        QR library decodes image →
          QR found:
            Same validation pipeline as camera scan
          QR not found:
            Error message: "No QR code detected in image.
            Please try again or use manual entry."
```

---

### 4.4 Duplicate Override Flow

```
Duplicate scan detected →
  Validation card (desktop) / overlay (mobile) shows "Already Checked In" →
    Organizer clicks "Allow Re-Entry" →
      Reason modal opens:
        "Why are you allowing re-entry?"
        [Dropdown: Lost ticket / Re-entry / Device error / Other]
        [Free text input: Additional notes]
      Organizer submits reason →
        Cloud Function (overrideCheckIn):
          Validates organizer permission
          Increments ticket.overrideCount
          Logs to audit_logs with reason
          Returns success
        Validation card updates: "✅ Override Approved"
        Success feedback
        Auto-resume scanning
```

---

### 4.5 Offline Mode Flow

```
Network connection lost →
  Header status indicator changes: 🟢 Online → 🔴 Offline (desktop)
  OR compact stats bar indicator changes (mobile) →
    Banner appears: "📴 Offline Mode Active"
    Scanner continues functioning:
      QR scans validate against local IndexedDB cache
      Check-ins queue in local storage
      Validation card shows "⏳ Queued for Sync" badge

Network connection restored →
  Status indicator: 🔴 Offline → 🟢 Online →
    Auto-sync begins:
      Queued check-ins upload to Firestore
      Local cache refreshes with latest ticket data
      Success notification: "✅ Synced X check-ins"
```

---

## 5. State Management

### Scanner State Machine

```typescript
type ScannerState =
  | 'idle' // No camera active
  | 'initializing' // Camera starting
  | 'ready' // Camera active, awaiting QR
  | 'scanning' // QR detected, decoding
  | 'processing' // Validating ticket
  | 'success' // Valid ticket
  | 'error' // Invalid ticket
  | 'duplicate' // Already used
  | 'paused' // Camera paused (continuous mode OFF)
  | 'camera_error'; // Camera access denied or failed

interface ScannerStore {
  // State
  currentState: ScannerState;
  selectedCamera: MediaDeviceInfo | null;
  availableCameras: MediaDeviceInfo[];
  flashlightEnabled: boolean;
  continuousScan: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  autoSave: boolean;

  // Data
  currentScan: TicketScanResult | null;
  recentScans: TicketScanResult[];
  scansToday: number;
  validScans: number;
  invalidScans: number;
  duplicateScans: number;

  // Network
  isOnline: boolean;
  queuedScans: TicketScanResult[];

  // Actions
  startScanning: () => Promise<void>;
  stopScanning: () => void;
  switchCamera: (deviceId: string) => Promise<void>;
  toggleFlashlight: () => Promise<void>;
  processQRCode: (qrData: string) => Promise<void>;
  manualEntry: (ticketId: string) => Promise<void>;
  uploadImage: (file: File) => Promise<void>;
  overrideCheckIn: (ticketId: string, reason: string) => Promise<void>;
  clearHistory: () => void;
  exportData: (format: 'csv' | 'pdf' | 'json') => Promise<void>;
}
```

---

### Validation Result States

```typescript
interface TicketScanResult {
  id: string;
  timestamp: Date;
  scanMethod: 'camera' | 'manual' | 'upload';

  // Ticket data
  ticketId: string;
  userId: string;
  eventId: string;
  bookingId: string;

  // Validation
  status: 'valid' | 'invalid' | 'duplicate';
  validationDetails: {
    signatureValid: boolean;
    ticketExists: boolean;
    statusCheck: 'valid' | 'used' | 'cancelled' | 'expired';
    gateAccessMatch: boolean;
    eventMatch: boolean;
  };

  // Attendee details (if valid)
  attendee?: {
    name: string;
    email: string;
    phone: string;
  };

  // Ticket tier
  tier?: {
    name: string;
    price: number;
    gateAccessLevel: string;
  };

  // Check-in details
  checkIn?: {
    firstCheckInAt: Date;
    gate: string;
    device: string;
    staffUid: string;
    overrideCount: number;
  };

  // Error details (if invalid)
  error?: {
    code: string;
    message: string;
    suggestedAction: string;
  };
}
```

---

## 6. Responsive Breakpoints

### Breakpoint Definitions

```css
/* Desktop / Tablet Landscape — Primary Layout */
@media (min-width: 1024px) {
  /* Three-column: stats left 30%, camera center 40%, validation right 30% */
}

/* Large Desktop */
@media (min-width: 1440px) {
  /* Same three-column layout, wider columns, more whitespace */
}

/* Tablet Portrait */
@media (min-width: 768px) and (max-width: 1023px) {
  /* Two-column: camera 60% left, validation 40% right */
}

/* Mobile Landscape / Small Tablet */
@media (min-width: 481px) and (max-width: 767px) {
  /* Split-screen: camera left, validation right */
}

/* Mobile Portrait — Secondary Layout */
@media (max-width: 480px) {
  /* Full-screen camera, bottom controls, slide-up validation */
}
```

---

### Layout Adaptations by Breakpoint

| Element           | Desktop >1024px    | Tablet 768–1023px | Mobile <768px           |
| ----------------- | ------------------ | ----------------- | ----------------------- |
| Header Bar        | Visible (full)     | Visible (compact) | Hidden                  |
| Stats Cards       | Visible (left)     | Hidden            | Compact bar (top)       |
| Camera Viewport   | 40% width (center) | 60% width         | Full-screen             |
| Scanner Controls  | Below camera       | Below camera      | Bottom bar (sticky)     |
| Validation Result | Right panel (30%)  | Right panel (40%) | Slide-up overlay        |
| Recent Scans Feed | Visible (left)     | Hidden            | Bottom drawer (📋 icon) |
| System Log        | Optional (right)   | Hidden            | Not available           |
| Settings Card     | Visible (left)     | Hidden            | Full-screen modal       |
| Export Data       | Visible (left)     | Hidden            | Inside settings modal   |

---

## 7. Accessibility Features

### Keyboard Navigation (Desktop-First)

| Key         | Action                      |
| ----------- | --------------------------- |
| `Space`     | Start/Stop scanning         |
| `M`         | Open manual entry modal     |
| `F`         | Toggle flashlight           |
| `C`         | Switch camera               |
| `U`         | Open image upload picker    |
| `S`         | Open settings modal         |
| `Escape`    | Close active modal          |
| `Enter`     | Submit manual entry         |
| `Tab`       | Navigate focusable elements |
| `Shift+Tab` | Navigate backwards          |

Keyboard shortcuts are displayed as tooltips on hover for all relevant desktop buttons.

---

### Screen Reader Support

**ARIA Labels:**

- All buttons have `aria-label` attributes
- Status badge has `aria-live="polite"` for real-time updates
- Validation card has `role="status"` for announcements
- Camera viewport has `aria-label="QR Code Scanner Camera"` + `aria-describedby` pointing to instructions

**Announcements:**

- Valid scan: "Valid ticket. John Doe. General Admission."
- Invalid scan: "Invalid ticket. Reason: Ticket expired."
- Duplicate scan: "Warning. Ticket already used. Override options available."

---

### High Contrast Mode

```css
@media (prefers-contrast: high) {
  /* Increase all border widths from 1px → 2px */
  /* Remove semi-transparent backgrounds */
  /* Ensure 7:1 contrast ratio minimum */
}
```

---

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  /* Disable all animations */
  /* Replace with instant state changes */
  /* No confetti, no pulse effects */
}
```

---

## 8. Performance Optimizations

### Camera Performance

**1. Resolution Optimization**

- QR scanning: 640×480 (sufficient for QR detection, reduces CPU load)
- Display preview: 1280×720 (smooth on all devices)
- No 4K capture (unnecessary overhead)

**2. Frame Rate Throttling**

- Camera capture: 30 FPS (smooth preview)
- QR detection: 10 FPS (adequate detection speed, 66% CPU savings)

**3. Worker Thread Processing**

- QR decoding runs in Web Worker (prevents UI blocking — critical for desktop multi-panel rendering)
- Cryptographic verification (SHA-256) in Worker

---

### Firestore Query Optimization

**1. Ticket Cache**

- Download full ticket manifest to IndexedDB on page load
- Validate against local cache first (instant validation)
- Only query Firestore if ticket is not in cache or cache is stale

**2. Connection Pooling**

- Maintain persistent Firestore connection (no repeated auth)
- Batch updates when possible (queue multiple check-ins)

**3. Optimistic UI Updates**

- Update UI immediately on scan (assume success)
- Revert if Firestore write fails (with retry prompt)

---

### Image Processing

**1. Image Upload Optimization**

- Resize uploaded images to max 1280px width before QR decode
- Convert to JPEG at 80% quality (reduces memory usage)
- Abort decode if image >5MB uncompressed

**2. Canvas Rendering**

- Reuse a single canvas element for all QR frames
- Clear and redraw instead of creating new canvas elements

---

## 9. Implementation Details

### Technology Stack

**Core Libraries:**

- `html5-qrcode` v2.3.8 — QR code decoding
- `qrcode-generator` v1.4.4 — QR display (for validation preview)
- `jsQR` — Fallback decoder (faster on some devices)
- `crypto-js` — SHA-256 verification
- `idb-keyval` — IndexedDB wrapper for offline cache
- `zustand` — State management

**UI Framework:**

- React 18
- Tailwind CSS for styling
- Framer Motion for animations
- Radix UI for accessible primitives (modals, dropdowns)

---

### File Structure

```
src/pages/organizer/scanner/
├── ScannerPage.tsx                 // Main page component
├── components/
│   ├── HeaderBar.tsx               // Desktop/tablet header
│   ├── StatsPanel.tsx              // Left panel stats (desktop)
│   ├── CompactStatsBar.tsx         // Mobile compact stats bar
│   ├── RecentScansFeed.tsx         // Left panel history (desktop)
│   ├── SettingsCard.tsx            // Left panel settings (desktop)
│   ├── ExportDataPanel.tsx         // Left panel export (desktop)
│   ├── CameraViewport.tsx          // Center camera UI
│   ├── ScannerControls.tsx         // Camera control buttons
│   ├── BottomControlBar.tsx        // Mobile sticky control bar
│   ├── ManualEntryModal.tsx        // Manual ticket input
│   ├── ValidationCard.tsx          // Right panel (desktop/tablet)
│   ├── ScanResultOverlay.tsx       // Mobile slide-up result
│   ├── RecentActivityFeed.tsx      // Right panel timeline (desktop)
│   ├── RecentActivityDrawer.tsx    // Mobile bottom drawer
│   ├── SystemLog.tsx               // Right panel debug (desktop)
│   └── OverrideModal.tsx           // Duplicate override
├── hooks/
│   ├── useCamera.ts                // Camera access hook
│   ├── useQRScanner.ts             // QR detection logic
│   ├── useTicketValidation.ts      // Validation pipeline
│   ├── useOfflineCache.ts          // IndexedDB cache
│   └── useScannerStore.ts          // Zustand store
├── services/
│   ├── qrService.ts                // QR decode + verify
│   ├── ticketService.ts            // Firestore ticket ops
│   ├── audioService.ts             // Sound effects
│   └── exportService.ts            // Data export
└── utils/
    ├── validators.ts               // Ticket ID validation
    ├── formatters.ts               // Date/time formatting
    └── constants.ts                // Color codes, thresholds
```

---

### Cloud Functions (Backend)

**1. `validateTicket`**

```typescript
// HTTPS callable
Input:  { ticketId: string, eventId: string, deviceId: string }
Process:
  1. Query tickets/{ticketId}
  2. Verify SHA-256 signature
  3. Check status, expiry, event match
  4. If valid: update status='used', log check-in
  5. Return validation result
Output: { valid: boolean, ticket: TicketData, error?: string }
```

**2. `overrideCheckIn`**

```typescript
// HTTPS callable (Organizer only)
Input:  { ticketId: string, reason: string }
Process:
  1. Verify caller owns event
  2. Increment ticket.overrideCount
  3. Log to audit_logs with reason
  4. Return success
Output: { success: boolean }
```

**3. `exportScanData`**

```typescript
// HTTPS callable (Organizer only)
Input:  { eventId: string, format: 'csv'|'pdf'|'json' }
Process:
  1. Query all check-ins for event
  2. Generate file in requested format
  3. Upload to Storage
  4. Return download URL (expires 1 hour)
Output: { downloadUrl: string, expiresAt: timestamp }
```

---

### Security Considerations

**1. QR Code Integrity**

- Every QR code includes SHA-256 signature
- Signature computed from: ticketId + userId + eventId + secret
- Secret stored in Firebase config (never exposed to client)
- Any modification invalidates signature → immediate rejection

**2. Offline Cache Security**

- Ticket manifest encrypted in IndexedDB (AES-256)
- Encryption key derived from device ID + user session
- Cache auto-expires after 24 hours
- Full re-sync required after expiry

**3. Rate Limiting**

- Max 10 scan attempts per minute (prevents brute force)
- Exponential backoff on repeated invalid scans
- Auto-lock after 5 invalid attempts in 1 minute (requires organizer password)

---

### Error Handling

**Camera Errors:**

- `NotAllowedError` → Permission denied modal with instructions
- `NotFoundError` → No camera detected → Force manual entry mode
- `NotReadableError` → Camera in use by another app → Retry prompt
- `OverconstrainedError` → Requested camera not available → Fallback to default

**Network Errors:**

- `FirebaseError: unavailable` → Switch to offline mode
- `FirebaseError: permission-denied` → Session expired → Re-auth prompt
- `TimeoutError` → Show retry button with countdown

**QR Decode Errors:**

- `InvalidQRData` → "Unable to read QR code. Please hold steady."
- `SignatureInvalid` → "QR code is tampered. Entry denied."
- `QRNotFound` → "No QR code detected. Try better lighting."

---

### Testing Checklist

**Functional Tests:**

- [ ] Valid QR scan triggers check-in
- [ ] Invalid QR shows error details
- [ ] Duplicate QR shows override options
- [ ] Manual entry validates format
- [ ] Image upload decodes QR
- [ ] Offline mode queues scans
- [ ] Online sync uploads queue
- [ ] Export generates correct files
- [ ] Continuous scan auto-resumes
- [ ] Sound/vibration triggers correctly
- [ ] Keyboard shortcuts function correctly (desktop)
- [ ] Bottom control bar accessible (mobile)

**Cross-Browser Tests:**

- [ ] Chrome (desktop + mobile)
- [ ] Safari (desktop + mobile)
- [ ] Firefox (desktop + mobile)
- [ ] Edge (desktop)
- [ ] Samsung Internet (mobile)

**Device Tests:**

- [ ] Desktop (1920×1080) — Primary
- [ ] Desktop (2560×1440) — Primary
- [ ] iPad Pro (Safari) — Tablet
- [ ] Android tablet (Chrome) — Tablet
- [ ] iPhone 12+ (Safari) — Mobile
- [ ] Samsung Galaxy S21+ (Chrome) — Mobile

**Accessibility Tests:**

- [ ] Keyboard navigation works (desktop)
- [ ] Keyboard shortcut tooltips visible on hover (desktop)
- [ ] Screen reader announces scans
- [ ] High contrast mode readable
- [ ] Reduced motion disables animations
- [ ] Focus indicators visible

---

> **This QR Scanner interface is architected desktop-first — delivering a full command-and-control experience for operators managing high-volume check-ins from a workstation, while remaining fully functional on mobile for gate staff in the field. Every panel has a purpose, every interaction is optimized for speed, and every failure scenario has a clear path forward.**

---

_© 2026 FlowGateX. All rights reserved._
