# ScannerPage.tsx — Specification

> **Route:** `/organizer/scan`  
> **Query Params:** `?event={eventId}` (optional pre-select), `?gate={gateId}` (optional gate pre-select)  
> **Role Access:** Organizer (own events), Admin, Super Admin  
> **Purpose:** Mobile-optimized, full-screen QR ticket scanner for real-time event gate check-ins, including offline validation and IoT gate integration.

---

## 1. Overview

The Scanner Page is designed to run on tablets and smartphones at physical event venue gates. It is the operational interface used during live events to scan attendee QR codes and manage entry. It supports offline caching for network-unreliable venues, haptic feedback, IoT gate auto-control, duplicate detection, and manual override workflows. Security is enforced via SHA-256 signature verification of QR payloads.

---

## 2. Page Layout (Full-Screen Mobile-First)

```
┌────────────────────────────────────────────┐
│ STATUS BAR                                 │
│ [←] TechConf 2026 · Gate 1  [⚙️] [🔦] [📷↔]│
├────────────────────────────────────────────┤
│                                            │
│     CAMERA VIEWFINDER (live video)         │
│                                            │
│         ╔══════════════════╗               │
│         ║                  ║               │
│         ║   QR FOCUS BOX   ║               │
│         ║   (animated)     ║               │
│         ╚══════════════════╝               │
│                                            │
│  "Position QR code within the frame"       │
│                                            │
├────────────────────────────────────────────┤
│ STATUS BAR (bottom)                        │
│ Scans Today: 245 / 500  |  [OFFLINE 📴]    │
└────────────────────────────────────────────┘

[RESULT OVERLAY — covers screen on scan — auto-clears]
[SCAN HISTORY DRAWER — swipe up from bottom]
```

---

## 3. Functionalities

### 3.1 Event & Gate Selection

On page load (without `?event` query param):

```
SELECT EVENT & GATE
───────────────────
Event:    [TechConf 2026 ▼         ]
Gate:     [Main Gate — Gate 1 ▼   ]

[ Start Scanning ]
```

With `?event` param: event is pre-selected, shows gate selector only.  
Event dropdown shows only organizer's events with `status == 'published'` and `startDate` within 24h past or future.  
Gate dropdown populates from `events/{id}.assignedDevices` filtered to `type == 'scanner'`.

---

### 3.2 Camera Interface

**Library:** `html5-qrcode` (`Html5QrcodeScanner`)

**Configuration:**
```typescript
const scanner = new Html5Qrcode("qr-reader");
await scanner.start(
  { facingMode: "environment" },   // rear camera default
  {
    fps: 10,           // QR decode attempts per second
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.777778,  // 16:9
    disableFlip: false
  },
  onScanSuccess,
  onScanError
);
```

**UI Elements on camera view:**
- Animated QR focus box: corner brackets with green color, scanning animation (line sweeping top-to-bottom)
- Instruction text: "Position QR code within the frame"
- **Flashlight button (🔦):** toggles `ImageCapture.setPhotoSettings({ torch: true/false })`
- **Camera flip (📷↔):** switches between front (`user`) and rear (`environment`) cameras
- **Settings gear (⚙️):** opens Settings Modal

---

### 3.3 QR Validation Flow

```
QR code detected →
  Camera freezes frame →
  Haptic feedback: short vibrate (100ms) →
  Decode base64 QR payload:
    {
      ticketId: "TK-001",
      userId: "user_uid",
      eventId: "event_id",
      transactionId: "TXN-001",
      bookingId: "BK-001",
      timestamp: ISO_string,
      gateAccessLevel: "vip",
      signature: "sha256_hash"
    }
  Verify SHA-256 signature:
    HMAC-SHA256(payload_without_signature, HMAC_SECRET) == signature?
    If NO → INVALID (tampered)
  If offline:
    Check IndexedDB ticket cache
  If online:
    Query Firestore: tickets/{ticketId}
  Validate:
    ✓ ticket.status == 'valid'
    ✓ ticket.eventId == selectedEventId
    ✓ ticket.gateAccessLevel matches current gate level
    ✓ ticket not expired (timestamp check)
    ✓ No prior checkedInAt (duplicate check)
  
  RESULT → show result overlay
```

**HMAC Verification (client-side, key stored in environment/secure config):**
```typescript
const expectedSig = await computeHMAC(payloadJson, process.env.QR_HMAC_KEY);
const isValid = expectedSig === payload.signature;
```

---

### 3.4 Result Overlays

All overlays cover the full screen and display for 2 seconds (valid) or until dismissed (invalid/duplicate).

**VALID TICKET (green, 2-second auto-dismiss):**
```
┌────────────────────────────────────────┐
│  ████████████████████████████████████  │
│  ██        ✅ VALID TICKET          ██  │
│  ████████████████████████████████████  │
│                                        │
│  Attendee:  John Doe                   │
│  Ticket:    VIP Pass                   │
│  Booking:   BK-12345                   │
│                                        │
│  Auto-scanning in 2s...                │
│  [ Scan Now ]                          │
└────────────────────────────────────────┘
```

On valid: plays success beep (`/sounds/success.mp3`), vibrates 1× (100ms), calls `checkInTicket` Cloud Function, triggers IoT gate open if device configured.

**INVALID TICKET (red, requires tap to dismiss):**
```
┌────────────────────────────────────────┐
│  ████████████████████████████████████  │
│  ██      ❌ INVALID TICKET           ██  │
│  ████████████████████████████████████  │
│                                        │
│  Reason: Ticket has expired            │
│  Ticket ID: TK-67890                   │
│                                        │
│  [ Scan Next Ticket ]                  │
└────────────────────────────────────────┘
```

Invalid reasons displayed:
- "Ticket has expired"
- "QR code has been tampered"
- "Ticket is for a different event"
- "Ticket tier not authorized for this gate"
- "Ticket has been refunded or cancelled"
- "Invalid QR code format"

On invalid: plays error beep, vibrates 2× (100ms + 100ms pause + 100ms).

**DUPLICATE SCAN (yellow, requires action):**
```
┌────────────────────────────────────────┐
│  ████████████████████████████████████  │
│  ██     ⚠️ ALREADY CHECKED IN        ██  │
│  ████████████████████████████████████  │
│                                        │
│  Attendee:   Jane Smith                │
│  First Entry:                          │
│    Gate 2 | 2:34 PM | Device: SCAN-001 │
│                                        │
│  [ ✅ Override & Allow ] [ ❌ Reject ] │
└────────────────────────────────────────┘
```

**Override Flow:**
```
Click "Override & Allow" →
  Prompt: "Reason for override?" (quick options)
  [Guest Lost Ticket] [Device Error] [Manual Entry] [Other: ____]
  Confirm →
    checkInTicket(ticketId, { manualOverride: true, overrideReason })
    Logs: { overrideBy: uid, reason, timestamp }
    Green overlay flashes briefly → resume scanning
```

---

### 3.5 Scan History Drawer

Swipe up from bottom of screen or tap "History" button.

**Content (last 20 scans):**

| Time     | Attendee     | Ticket Tier | Result        |
|----------|--------------|-------------|---------------|
| 3:45 PM  | John Doe     | General     | ✅ Valid      |
| 3:44 PM  | Jane Smith   | VIP         | ✅ Valid      |
| 3:43 PM  | Bob Johnson  | General     | ❌ Invalid   |
| 3:42 PM  | Alice Lee    | General     | ⚠️ Duplicate |

Tap row → shows full scan result details (same overlay data).

**Stored in:** Component local state + IndexedDB for offline access.

**Live Counter (bottom of camera view):**
```
Scans Today: 245 / 500 capacity (49%)
```
Counter updates after each valid scan via real-time Firestore `event.stats.checkIns` listener.

---

### 3.6 Settings Modal (⚙️)

**Sound:**
- Toggle: `[🔊 ON]` / `[🔇 OFF]`
- Plays test beep on toggle ON

**Vibration:**
- Toggle: ON / OFF

**Auto-scan delay:**
- After a valid scan, how long before camera resumes
- Options: `[1s] [2s] [3s]` radio group

**Gate Device:**
- Dropdown: lists organizer's scanner devices assigned to this event
- When selected: valid scans auto-send MQTT `OPEN_GATE` command to this device
- Option: "No device (manual gates)"

**Offline Mode:**
- Toggle: ON / OFF
- When turned ON: downloads ticket manifest to IndexedDB (progress bar shown)
- Download count: "Downloaded 250 tickets for offline use"

**All settings persisted in `localStorage` keyed to `{organizerUid}_{eventId}_scanner_settings`.**

---

### 3.7 Offline Mode

When enabled (either manually or auto-detected on network loss):

**Manifest Download:**
```typescript
// Downloads valid tickets for this event
const ticketManifest = await downloadTicketManifest(eventId);
// ticketManifest: Record<ticketId, { attendeeName, tierId, gateAccessLevel, qrSignature }>
await storeInIndexedDB('ticket_manifest', eventId, ticketManifest);
```

**Offline Validation:**
```typescript
const localTicket = await getFromIndexedDB('ticket_manifest', eventId, ticketId);
if (!localTicket) return { valid: false, reason: 'Ticket not found (offline)' };
// Check against local manifest status
```

**Offline Queue:**
```typescript
// Check-ins made offline are queued
const checkInQueue = await getFromIndexedDB('checkin_queue', eventId);
// Queued item: { ticketId, timestamp, deviceId, gateId, organizerUid }
```

**Online Sync:**
```typescript
// When network restored
useEffect(() => {
  window.addEventListener('online', async () => {
    const queue = await getFromIndexedDB('checkin_queue', eventId);
    for (const checkIn of queue) {
      await batchCheckIn([checkIn]);
    }
    await clearIndexedDB('checkin_queue', eventId);
    setIsOffline(false);
  });
}, []);
```

**UI Indicators:**
- 📴 "OFFLINE MODE" amber banner at top of scanner
- Check-in counter shows `📴 245 (+ 12 queued)` when offline queue has items

---

### 3.8 IoT Gate Integration

When a Gate Device is selected in Settings:

```
Valid Scan → checkInTicket() → 
  Cloud Function: sends MQTT to devices/{deviceId}/commands:
    { command: 'OPEN_GATE', gateId: 1, duration: 5 }
  ESP32 receives → Relay opens gate → Green LED ring → 5s → auto-close
  Cloud Function updates: devices/{deviceId}/stats.scansToday++
```

**Gate Status Indicator (in status bar):**
```
Gate: [🟢 OPEN] ← shows for 5s then → [🔘 CLOSED]
```

**Gate Control Override (long-press on status indicator):**
```
MANUAL GATE CONTROL
[ Open Gate (5s) ] [ Open Gate (30s) ] [ Lock Gate ] [ Auto Mode ]
```

Long-press detected via `onLongPress` custom hook (500ms threshold).

---

## 4. UI Requirements

### Full-Screen Optimization
- **PWA Standalone Mode:** `manifest.json` → `display: "standalone"` removes browser chrome
- **Status bar overlay:** Uses `<meta name="theme-color">` to color status bar green
- **No scroll:** Page height is fixed to viewport; no scroll possible

### WakeLock API
```typescript
// Prevents screen sleep during scanning sessions
let wakeLock: WakeLockSentinel | null = null;
useEffect(() => {
  navigator.wakeLock?.request('screen').then(lock => { wakeLock = lock; });
  return () => wakeLock?.release();
}, []);
```

### Auto-Brightness
```typescript
// Increase to max brightness on mount
document.documentElement.style.setProperty('--screen-brightness', '1.0');
// Restore on unmount
return () => document.documentElement.style.setProperty('--screen-brightness', '');
```

### Touch Targets
- All buttons: minimum 44×44px
- Settings modal: bottom sheet on mobile
- Swipe gestures: `react-swipeable` for history drawer

### Performance
- Camera feed: 640×480 at 30fps (lower for older devices)
- QR decode: every 10th frame (100ms) via `fps: 10` config — balances CPU usage
- Result overlay: GPU-accelerated via `will-change: opacity, transform`

### Camera Permission Handling
```typescript
// On mount
const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
// If denied:
showPermissionPrompt(); // Full-screen guide to enable camera in browser settings
```

---

## 5. Firebase Services

### Firestore Queries

```typescript
// Real-time check-in counter
onSnapshot(doc(db, 'events', eventId), (doc) => {
  const { checkIns, totalSold } = doc.data().stats;
  setScanCount({ checkIns, totalCapacity: totalSold });
});

// Check-in validation (online mode)
const ticketDoc = await getDoc(doc(db, 'tickets', ticketId));
```

### Cloud Functions Called

| Function              | Input                                           | Output                         |
|-----------------------|-------------------------------------------------|--------------------------------|
| `checkInTicket`       | `{ ticketId, deviceId?, gateId?, manualOverride?, overrideReason? }` | `{ checkedIn, attendeeDetails }` |
| `batchCheckIn`        | `{ checkIns: CheckInRecord[] }`                | `{ results: CheckInResult[] }` |
| `downloadTicketManifest` | `{ eventId }`                               | `{ tickets: TicketManifest }`  |

### Firebase Storage
- Scanner sounds: `/sounds/success.mp3`, `/sounds/error.mp3` (served statically via CDN)

### IndexedDB Schema
```javascript
// Database: 'FlowGateX_Scanner'
// Object Stores:
'ticket_manifest'  // keyPath: ticketId, value: ticket data
'checkin_queue'    // keyPath: auto-increment, value: check-in record
'settings'         // keyPath: settingsKey
```

---

## 6. State Management

```typescript
// Component-local state (not Zustand — scanner is ephemeral, self-contained)
const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
const [selectedGate, setSelectedGate] = useState<string | null>(null);
const [scanResult, setScanResult] = useState<ScanResult | null>(null);
const [scanHistory, setScanHistory] = useState<ScanEntry[]>([]);
const [isOffline, setIsOffline] = useState(!navigator.onLine);
const [offlineQueueCount, setOfflineQueueCount] = useState(0);
const [gateStatus, setGateStatus] = useState<'open' | 'closed' | 'auto'>('auto');
const [settings, setSettings] = useState<ScannerSettings>(loadSettings());
const [showHistory, setShowHistory] = useState(false);
const [scanCount, setScanCount] = useState({ checkIns: 0, totalCapacity: 0 });

// Computed
const isValidating = scanResult?.status === 'pending';
```

---

## 7. Interconnections

| Connected Page / Component           | How Connected                                                          |
|--------------------------------------|------------------------------------------------------------------------|
| **IoTDevicesPage**                   | Gate device selection maps to same `devices` collection; gate commands shared |
| **AttendeeManagementPage**           | Check-ins written here appear in attendee check-in status & history    |
| **MyEventsPage**                     | "Scan Tickets" card action navigates here with `?event` param          |
| **OrganizerDashboard**               | "Scan Tickets" header button links here                                |
| **EventAnalyticsPage**               | Real-time `checkIns` stat updated here reflects in analytics           |
| **ManageEventPage**                  | "Scan Tickets" button in event header links here with event pre-set    |
| **CheckInTicket Cloud Function**     | Core validation logic; shared with manual check-in in AttendeeManagement|

---

## 8. QR Code Security Model

```
QR Payload Structure (stored in ticket.qrCode):
  base64(JSON.stringify({
    ticketId,
    userId,
    eventId,
    transactionId,
    bookingId,
    timestamp,
    gateAccessLevel,
    signature: HMAC-SHA256(payload_without_signature, HMAC_SECRET)
  }))

Generation (at booking confirmation in Cloud Function):
  const payload = { ticketId, userId, eventId, transactionId, bookingId, timestamp, gateAccessLevel };
  const signature = computeHMAC(JSON.stringify(payload), process.env.QR_HMAC_KEY);
  const qrCode = btoa(JSON.stringify({ ...payload, signature }));

Verification (at scan time):
  1. Base64 decode
  2. Parse JSON
  3. Extract signature from payload
  4. Recompute HMAC of remaining payload
  5. Compare with extracted signature (constant-time comparison to prevent timing attacks)
  6. If mismatch → TAMPERED
```

**QR Regeneration:** When `regenerateTicketQR` is called:
- New QR generated with incremented `regeneratedCount` in payload
- Old QR automatically fails (signature invalidated)
- New QR emailed to attendee

---

## 9. API Services Summary

| Service              | Provider     | Purpose                                    |
|----------------------|--------------|--------------------------------------------|
| Firestore            | Firebase     | Real-time check-in counter + ticket query  |
| Cloud Functions      | Firebase     | checkInTicket, batchCheckIn, manifest      |
| html5-qrcode         | npm (client) | Camera access + QR decoding                |
| IndexedDB            | Browser API  | Offline ticket cache + check-in queue      |
| WakeLock API         | Browser API  | Prevent screen sleep                       |
| Vibration API        | Browser API  | Haptic feedback on scan result             |
| MediaDevices API     | Browser API  | Camera access + flashlight control         |
| MQTT (via CF)        | Firebase CF  | IoT gate open/close commands               |

---

## 10. Error States & Edge Cases

| Scenario                              | Handling                                                             |
|---------------------------------------|----------------------------------------------------------------------|
| Camera permission denied              | Full-screen guide with browser-specific steps to grant permission    |
| No rear camera (some tablets)         | Defaults to front camera; flashlight disabled                        |
| QR code partially obscured            | Continues attempting decode (no error shown during attempt)          |
| Network lost mid-session              | Auto-detects → shows offline banner → queues check-ins               |
| Offline manifest outdated             | Timestamp check: if manifest >1hr old, prompt to refresh             |
| Gate device offline (MQTT timeout)    | "Gate command timed out — open manually" toast; check-in still logged|
| 100+ pending offline check-ins        | Warning: "Sync when possible" banner; all queued safely              |
| Invalid QR with partial damage        | Scanner continues attempts; never auto-marks invalid without decode   |
| Duplicate scan within 30 seconds      | "Already scanned 30 seconds ago" — suggests device calibration issue |
| Event not started yet                 | Scanner shows "Event starts in X hours" — can still scan if gate open|
