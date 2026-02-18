# IoTDevicesPage.tsx — Specification

> **Route:** `/organizer/devices`  
> **Role Access:** Organizer (own devices), Admin, Super Admin  
> **Purpose:** Monitor, manage, and control all IoT devices (scanner gates, crowd monitors, environmental sensors, display boards) assigned to the organizer's events.

---

## 1. Overview

The IoT Devices Page is the operational control center for all hardware devices registered under the organizer's account. It provides real-time device health monitoring, live sensor readings, remote command dispatch, alert management, and diagnostic log access. The page communicates with physical ESP32 devices via MQTT through Firebase Cloud Functions, with Firestore as the real-time state mirror.

---

## 2. Page Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                           │
│ "IoT Devices"                    [ + Add Device ]  [ 🔄 Refresh ]   │
├──────────────────────────────────────────────────────────────────────┤
│ FLEET OVERVIEW STATS BAR                                              │
│ [Total Devices] [Online] [Offline] [Active Alerts] [Avg Battery]    │
│ [Total Scans Today]                                                  │
├──────────────────────────────────────────────────────────────────────┤
│ FILTER BAR                                                           │
│ [Search device name] [Type ▼] [Status ▼] [Event ▼]                 │
├──────────────────────────────────────────────────────────────────────┤
│ DEVICE CARDS GRID (3 columns desktop)                                │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                 │
│ │ Device Card  │ │ Device Card  │ │ Device Card  │                 │
│ └──────────────┘ └──────────────┘ └──────────────┘                 │
├──────────────────────────────────────────────────────────────────────┤
│ ACTIVE ALERTS PANEL (bottom, collapsible)                           │
│ 🚨 CRITICAL: Gas 1,250ppm — Gate 2  |  ⚠️ WARNING: Temp 32°C       │
└──────────────────────────────────────────────────────────────────────┘

[When card clicked → DEVICE DETAIL PANEL slides in from right]
```

---

## 3. Functionalities

### 3.1 Fleet Overview Stats Bar

Real-time counts derived from `devices` collection listener.

| Metric              | Query / Derivation                                    | Visual           |
|---------------------|-------------------------------------------------------|------------------|
| Total Devices       | `COUNT(devices where ownerUid == uid)`                | Number           |
| Online Devices      | `COUNT(devices where status == 'online')`             | Green badge + %  |
| Offline Devices     | `COUNT(devices where status == 'offline')`            | Red badge, pulse if >5min |
| Active Alerts       | `COUNT(security_alerts where orgId == org && resolved == false)` | Red badge, 🔴 if >0 |
| Avg Battery Level   | `AVG(devices.hardware.batteryLevel)`                  | Progress bar     |
| Total Scans Today   | `SUM(devices.stats.scansToday)` (scanner type only)   | Number           |

---

### 3.2 Device Cards Grid

**Layout:** 3 columns (desktop), 2 (tablet), 1 (mobile)  
**Sort Default:** Online devices first, then offline, then maintenance

Each card:

```
┌───────────────────────────────────────────┐
│ [Device Type Icon]  Device Name      [⋮] │
│ Type: Scanner Gate | Event: TechConf 2026 │
│                                           │
│ Status: 🟢 Online   Battery: ████░ 85%   │
│ Firmware: v2.3.1   | Last Ping: 2m ago   │
│                                           │
│ [ View Live Data ]   [ Send Command ]     │
└───────────────────────────────────────────┘
```

**Device Type Icons:**
- Scanner Gate: `🔲` (QR grid)
- Crowd Monitor: `👁️` (eye)
- Environmental Sensor: `🌡️` (thermometer)
- Display Board: `📺` (display)

**Status Indicators:**
| Status       | Dot Color | Condition                        | Behavior               |
|--------------|-----------|----------------------------------|------------------------|
| Online       | 🟢 Green  | `lastPingAt > now - 60s`         | Solid                  |
| Warning      | 🟡 Amber  | Battery <20% OR wifi RSSI < -75  | Slow pulse             |
| Offline      | 🔴 Red    | `lastPingAt < now - 5min`        | Fast pulse             |
| Maintenance  | 🔧 Grey   | `status == 'maintenance'`        | Static wrench icon     |
| Error        | ❗ Red    | `status == 'error'`              | Shake animation        |

**Card Context Menu (⋮):**
- View Live Data → opens Device Detail Panel
- Send Command → opens Command Modal
- Edit Device Name → inline edit
- Assign to Event → dropdown to link to an event
- Decommission Device → soft delete (requires confirmation)

---

### 3.3 Device Detail Panel (Slide-in Drawer)

Width: 480px from right on desktop, full-screen on mobile.

#### Section A: Device Info

| Field              | Value                       | Editable  |
|--------------------|-----------------------------|-----------|
| Device ID          | `SCAN-001` (copyable)       | No        |
| Device Name        | "Main Gate Scanner"         | Yes (inline)|
| Device Type        | Scanner Gate                | No        |
| Assigned Event     | TechConf 2026 (link)        | Yes (dropdown)|
| Venue Location     | Grand Ballroom, Gate 1      | Yes        |
| Registered         | Mar 1, 2026                 | No        |
| Last Seen          | 2 minutes ago               | No (live)  |
| Firmware Version   | v2.3.1                      | No        |
| WiFi RSSI          | −45 dBm (bar indicator)     | No (live)  |

#### Section B: Live Sensor Readings (auto-refresh every 5s)

**For Environmental Sensors (DHT22 + MQ-2):**

```
Temperature: [Gauge 0–50°C]
  Current: 28.5°C  ← green zone (<30°C)
  Warning: 30°C | Critical: 35°C

Humidity: [Gauge 0–100%]
  Current: 65%

Gas Level: [Progress bar 0–10,000 ppm]
  Current: 320 ppm ← safe
  Warning: 500 ppm (amber) | Critical: 1000 ppm (red)
```

SensorGauge component: circular dial with animated needle + color zones.

**For Crowd Monitors (ESP32-CAM #2 + YOLOv8-Nano):**

```
Current Occupancy: 245 / 500 (49%)
[████████████░░░░░░░░░░░░] 49%

Crowd Density Heatmap (10×10 grid):
[Green cells: 0-3 people/zone]
[Yellow: 4-6] [Red: 7-9] [Purple: 10+]

Peak Today: 320 (at 3:15 PM)
Entry Count: 380 | Exit Count: 135
```

**For Scanner Gates:**
```
Scans Today: 245
Valid: 238 (97.1%) | Invalid: 7 (2.9%)
  - Expired: 3 | Tampered: 1 | Wrong Event: 2 | Duplicate: 1
Gate Status: [Open] [Closed] [Auto] ← radio toggle
Last Scan: 2 minutes ago (John Doe — VIP)
```

**For Display Boards:**
```
Connected: Yes (HDMI: active)
Current Content: Event Schedule
IR Controller: Online
```

#### Section C: Command Panel

Buttons dispatching commands to physical device.

| Command             | Device Types            | Confirmation Required | Effect                              |
|---------------------|-------------------------|-----------------------|-------------------------------------|
| Reboot Device       | All                     | Yes                   | ESP32 restarts (~15s downtime)      |
| Open Gate           | Scanner Gate            | Yes + duration select | Relay HIGH → motor open → auto-close|
| Close Gate          | Scanner Gate            | No                    | Relay LOW → motor close immediate   |
| Calibrate Sensor    | Environmental Sensor    | No                    | Re-calibrates DHT22 + MQ-2 baseline |
| Request Snapshot    | Crowd Monitor           | No                    | ESP32-CAM captures + uploads photo  |
| Enter Maintenance   | All                     | Yes                   | Pauses normal operation             |
| Exit Maintenance    | All                     | No                    | Resumes normal operation            |

**Command Flow UI:**
```
Click "Open Gate" →
  Confirmation Modal: "Open gate for how long?"
  [ 5 seconds ] [ 10 seconds ] [ 30 seconds ] [ Manual ]
  Confirm →
    Button shows spinner "Sending..."
    Cloud Function called →
    MQTT dispatched →
    Waiting for ack (30s timeout) →
    ✅ "Command acknowledged" toast  OR  ⚠️ "Command timed out" toast
```

#### Section D: Alert Threshold Configuration

Sliders and number inputs for each threshold.

```
Temperature Warning:  [━━━●━━━━━━━━] 30°C  (range: 20–50°C)
Temperature Critical: [━━━━━━●━━━━━] 35°C  (range: 25–50°C)
Gas Warning (ppm):    [500]   (input, range: 100–5000)
Gas Critical (ppm):   [1000]  (input, range: 500–10000)
Crowd Warning (%):    [━━━━━━━━●━━━] 85%   (range: 50–100%)
Crowd Critical (%):   [━━━━━━━━━●━━] 95%   (range: 70–100%)

[ Save Thresholds ]  ← calls updateDeviceThresholds Cloud Function
```

**Validation:** Critical threshold must always be > Warning threshold.

#### Section E: Diagnostic Logs

Last 50 log entries from `devices/{deviceId}/logs` sub-collection.

| Timestamp        | Level   | Message                                  |
|------------------|---------|------------------------------------------|
| 10:32:15 AM      | INFO    | Device booted successfully               |
| 10:35:22 AM      | INFO    | WiFi connected: SSID FlowGateX-Venue     |
| 10:41:05 AM      | WARNING | Battery level low: 18%                   |
| 10:52:11 AM      | ERROR   | MQTT connection timeout, retrying...     |

- Filter by level: All / Info / Warning / Error
- Expandable rows: shows full JSON log payload
- Export button: downloads as `.json` file

---

### 3.4 Add New Device Modal

Triggered by "+ Add Device" button.

**Step 1: Device Configuration**
```
Device Type:  [ Scanner Gate ▼ ]
Device Name:  [Main Gate Scanner       ]
Venue:        [Grand Ballroom, Gate 1  ]
Event (optional): [TechConf 2026 ▼    ]
```

**Step 2: Credentials (shown after submit)**
```
✅ Device registered successfully!

Device ID:  SCAN-001  [📋 Copy]
API Key:    eyJhbGciOiJIUz...  [📋 Copy]  ← shown once

⚠️ Save this API key — it cannot be recovered.
Flash this to your ESP32 using the setup guide below.

[ Download Setup Guide PDF ]  [ View Setup Instructions ]
```

**Step 3: Waiting for First Ping**
```
⏳ Waiting for device to connect...
   Power on your ESP32 device to complete setup.
   [Status dot: pulsing amber]
   
   On first successful ping:
   [Status dot: green]  ✅ "Device is online!"
```

---

### 3.5 Alerts Panel (Bottom Section)

Collapsible panel showing all unresolved alerts across all devices.

```
🚨 CRITICAL | Gas 1,250 ppm at Gate 2 — ENV-SENSOR-07
   Event: TechConf 2026 | Triggered: 5 min ago
   [ Acknowledge ]  [ View Device ]  [ Resolve ]

⚠️ WARNING | Temperature 32°C at Hall A — ENV-SENSOR-03
   Event: MusicFest | Triggered: 12 min ago | Ack: John Doe
   [ View Device ]  [ Mark Resolved ]

ℹ️ INFO | Device SCAN-002 battery at 15%
   [ Dismiss ]
```

**Alert Lifecycle:**
```
New → [Organizer clicks Acknowledge] → Acknowledged (stores uid + timestamp)
Acknowledged → [Organizer clicks Resolve] → Resolve Modal → Resolved (requires notes)
```

Resolve Modal fields:
- Action taken (dropdown: Evacuated / Ventilated Area / Replaced Battery / Other)
- Notes (free text, required)
- Submit → `resolveAlert` Cloud Function

**Auto-Actions for CRITICAL alerts:**
- Gas CRITICAL: Auto-pauses scanner gate (CLOSE_GATE command dispatched)
- Crowd CRITICAL (>95%): Auto-closes gate + sends push to organizer
- Temperature CRITICAL (>35°C): Sends push notification (no auto gate action)

---

### 3.6 Snapshot Gallery (Crowd Monitor Only)

When "Request Snapshot" is dispatched, ESP32-CAM uploads photo to Firebase Storage.

Organizer sees:
- Thumbnail grid of last 10 snapshots for crowd monitor devices
- Each thumbnail shows: timestamp + occupancy count at time of capture
- Click → full-size view in lightbox modal
- Delete button per snapshot

---

## 4. UI Requirements

### Real-Time Updates
- Device cards update without page refresh (Firestore `onSnapshot` on `devices` collection)
- Status dot color changes animate with CSS transition (300ms)
- Battery level bar uses CSS animation when value changes

### SensorGauge Component
```tsx
<SensorGauge
  value={28.5}
  min={0}
  max={50}
  unit="°C"
  thresholds={[
    { value: 30, color: '#10b981', label: 'Normal' },
    { value: 35, color: '#f59e0b', label: 'Warning' },
    { value: 50, color: '#ef4444', label: 'Critical' }
  ]}
  size="lg"   // 'sm' | 'md' | 'lg'
/>
```
Renders as SVG arc gauge with animated needle.

### DensityHeatmap Component
```tsx
<DensityHeatmap
  grid={densityMap}   // number[][] (10×10)
  colorScale={['#10b981', '#fbbf24', '#ef4444', '#7c3aed']}
  thresholds={[3, 6, 9]}
  cellSize={24}
/>
```

### Responsive Layout
- **Desktop:** 3-column card grid + slide-in detail panel (480px)
- **Tablet:** 2-column grid + full-screen detail panel
- **Mobile:** 1-column; device cards are compact; detail panel is full-screen

### Accessibility
- Command buttons include `aria-label` with device name
- Alert panel has `role="alert"` with `aria-live="assertive"` for critical alerts
- Status dots have `title` tooltip with text description

---

## 5. Firebase Services

### Firestore Listeners

```typescript
// 1. All devices for this organizer
const deviceQuery = query(
  collection(db, 'devices'),
  where('ownerUid', '==', currentUser.uid)
);
onSnapshot(deviceQuery, (snap) => {
  setDevices(snap.docs.map(d => d.data()));
});

// 2. Latest readings for selected device
const readingQuery = query(
  collection(db, 'devices', deviceId, 'readings'),
  orderBy('timestamp', 'desc'),
  limit(1)
);
onSnapshot(readingQuery, (snap) => {
  setLatestReading(snap.docs[0]?.data());
});

// 3. Active alerts
const alertQuery = query(
  collection(db, 'security_alerts'),
  where('organizerUid', '==', currentUser.uid),
  where('resolved', '==', false),
  orderBy('triggeredAt', 'desc')
);
onSnapshot(alertQuery, (snap) => {
  setActiveAlerts(snap.docs.map(d => d.data()));
});

// 4. Diagnostic logs for selected device
const logQuery = query(
  collection(db, 'devices', deviceId, 'logs'),
  orderBy('timestamp', 'desc'),
  limit(50)
);
```

### MQTT Architecture

```
ESP32 Device
  → publishes to MQTT topic: devices/{deviceId}/readings
  → publishes to MQTT topic: devices/{deviceId}/heartbeat
  → publishes to MQTT topic: devices/{deviceId}/commandAck
  
Cloud Function (MQTT subscriber)
  → receives readings → writes to Firestore (devices/{id}/readings)
  → receives heartbeat → updates devices/{id}.lastPingAt, .status
  → receives commandAck → updates devices/{id}/pendingCommand.status

Cloud Function (MQTT publisher)
  → publishes to devices/{deviceId}/commands on sendDeviceCommand call
```

### Cloud Functions Called

| Function                  | Input                                       | Output                            |
|---------------------------|---------------------------------------------|-----------------------------------|
| `registerDevice`          | `{ name, type, venue, eventId? }`           | `{ deviceId, apiKey, instructions }` |
| `sendDeviceCommand`       | `{ deviceId, command, params? }`            | `{ acknowledged, ackedAt }`       |
| `updateDeviceThresholds`  | `{ deviceId, thresholds: object }`          | `{ success: true }`               |
| `acknowledgeAlert`        | `{ alertId }`                               | `{ acknowledged, by, at }`        |
| `resolveAlert`            | `{ alertId, actionTaken, notes }`           | `{ resolved: true }`              |
| `decommissionDevice`      | `{ deviceId }`                              | `{ decommissioned: true }`        |
| `exportDeviceLogs`        | `{ deviceId }`                              | `{ downloadUrl }`                 |

### Firebase Storage
- Snapshots: `/snapshots/{deviceId}/{timestamp}.jpg`
- Setup guide PDFs: `/docs/device-setup/{deviceType}.pdf`
- Log exports: `/exports/{uid}/device-{deviceId}-logs.json`

### Firebase Cloud Messaging
- CRITICAL alerts → immediate push notification to organizer FCM token
- Offline device alert → sent after 5-minute offline threshold crossed (scheduled Cloud Function)

---

## 6. State Management

```typescript
// useOrganizerStore IoT slice
devices: IoTDevice[];
selectedDevice: IoTDevice | null;
deviceReadings: Record<string, SensorReading>;  // deviceId → latest reading
activeAlerts: DeviceAlert[];
commandStatus: Record<string, 'pending' | 'acknowledged' | 'timeout' | 'error'>;
deviceLogs: Record<string, LogEntry[]>;

fetchDevices: () => void;
selectDevice: (device: IoTDevice | null) => void;
sendDeviceCommand: (deviceId: string, command: DeviceCommand, params?: object) => Promise<void>;
updateDeviceThresholds: (deviceId: string, thresholds: AlertThresholds) => Promise<void>;
acknowledgeAlert: (alertId: string) => Promise<void>;
resolveAlert: (alertId: string, notes: ResolveNotes) => Promise<void>;
registerDevice: (data: RegisterDeviceData) => Promise<DeviceCredentials>;
```

---

## 7. Interconnections

| Connected Page / Component       | How Connected                                                              |
|----------------------------------|----------------------------------------------------------------------------|
| **ScannerPage**                  | Scanner sends `deviceId` with each check-in; gate auto-opens via MQTT     |
| **AttendeeManagementPage**       | Check-in records include `deviceId` for scanner attribution                |
| **EventAnalyticsPage**           | Crowd occupancy from IoT feeds into live event stats                       |
| **OrganizerDashboard**           | IoT alerts appear in Activity Feed; device count in Quick Actions           |
| **ManageEventPage (IoT tab)**    | Event-scoped view of same devices; uses shared `DeviceStatusCard` component|
| **Security Alerts collection**   | `security_alerts` documents created by Cloud Functions on threshold breach |

---

## 8. API Services Summary

| Service              | Provider    | Purpose                                      |
|----------------------|-------------|----------------------------------------------|
| Firestore            | Firebase    | Real-time device state & sensor readings     |
| MQTT (Cloud Funcs)   | Firebase    | Device command dispatch & telemetry receipt  |
| Cloud Functions      | Firebase    | registerDevice, sendCommand, alerts          |
| Firebase Storage     | Firebase    | Snapshots, log exports, setup guides         |
| FCM                  | Firebase    | Push alerts to organizer                     |

---

## 9. Error States & Edge Cases

| Scenario                       | Handling                                                              |
|--------------------------------|-----------------------------------------------------------------------|
| Device command timeout (30s)   | "⚠️ Command timed out — device may be offline" toast; status: timeout |
| Device offline during event    | Red card border + flashing indicator + push notification              |
| No devices registered          | Empty state: illustration + "Add your first IoT device" CTA           |
| Multiple simultaneous commands | Commands queue in `pendingCommand` sub-doc; only one active at a time |
| API key shown only once        | Cannot be recovered — "Decommission and re-register" instruction shown|
| Snapshot upload fails          | Error toast + retry button in snapshot gallery                        |
| Critical alert auto-action     | Action logged in `security_alerts` document with `autoAction: true` flag|
