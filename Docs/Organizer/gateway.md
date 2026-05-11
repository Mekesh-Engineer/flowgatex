# Gateway.tsx — ESP32 Device Connection & Hosting Dashboard

> **Component File:** `src/components/iot/Gateway.tsx`
> **Parent:** `IoTDevicesPage.tsx` → Device Detail Panel → Tab: "Device Connect"
> **Tab Icon:** 📡
> **Access Role:** Organizer, Admin, Super Admin
> **Theme:** Light, card-based, Material UI-inspired with subtle gradients

---

## 1. Overview

`Gateway.tsx` is the second dynamic tab page embedded inside the `IoTDevicesPage.tsx` Device Detail Panel. Its sole responsibility is to **discover, connect to, and host** the ESP32's local web server dashboard directly inside the FlowGateX organizer interface.

When the organizer opens the IoT Devices page and selects a Gate System device, this tab provides the bridge between the FlowGateX cloud app and the physical ESP32 device running on the same local network. Once connected, the ESP32's self-hosted AsyncWebServer dashboard is rendered inline — giving the organizer full device control without leaving the app.

This component is the **prerequisite** for `Ai_heatmap.tsx` (Page 1). The ESP32 URL discovered here is passed up to the parent via `onConnected` callback and used to power the heatmap polling endpoint.

---

## 2. Component Interface

```typescript
// Gateway.tsx props
interface GatewayProps {
  device: IoTDevice; // Selected gate system device from Firestore
  onConnected: (esp32Url: string) => void; // Callback → passes URL to parent IoTDevicesPage
  onDisconnected?: () => void; // Optional: clears hostUrl in parent state
}

// Internal state shape
interface GatewayState {
  connectionStatus: 'idle' | 'scanning' | 'connecting' | 'connected' | 'error' | 'disconnected';
  discoveredDevices: ESP32Device[]; // Found on local network
  selectedDevice: ESP32Device | null; // Chosen for connection
  manualUrl: string; // Fallback manual IP input
  autoReconnect: boolean; // Heartbeat toggle
  connectionLog: LogEntry[]; // Scrolling activity log
  hostUrl: string | null; // Active ESP32 base URL
  pingMs: number | null; // Last measured round-trip latency
  iframeVisible: boolean; // Inline ESP32 dashboard toggle
  qrScannerActive: boolean; // Camera-based QR scanner state
}

// Discovered ESP32 device shape
interface ESP32Device {
  id: string; // e.g. "ESP32-001"
  ip: string; // e.g. "192.168.4.1"
  firmwareVersion: string; // e.g. "v2.3.1"
  deviceType: string; // e.g. "Gate System"
  pingMs: number; // Round-trip latency
  status: 'reachable' | 'unreachable' | 'slow';
  lastKnownAt: Date;
}

// Connection log entry
interface LogEntry {
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  detail?: string; // Optional — expandable JSON or IP detail
}
```

---

## 3. Full Visual Layout

```
┌────────────────────────────────────────────────────────────────────┐
│ HEADER                                                             │
│ 📡  ESP32 Device Connection                    🔵 SCANNING...      │
│ Gate System: FlowGateX-001  ·  Last IP: 192.168.4.1               │
├────────────────────────────────────────────────────────────────────┤
│ SECTION A — SCAN OR ENTER MANUALLY                                 │
│                                                                    │
│  ┌──────────────────────────┐   ┌──────────────────────────────┐  │
│  │  [ 📷 QR SCANNER BOX  ] │OR │ http://192.168. ___ . ___    │  │
│  │   Camera feed active     │   │                   [ Connect ▶]│  │
│  │  "Point at device QR"    │   └──────────────────────────────┘  │
│  └──────────────────────────┘                                      │
│  [ Cancel QR Scan ]          [ Use Last Known IP ]                 │
├────────────────────────────────────────────────────────────────────┤
│ SECTION B — DISCOVERED DEVICES ON NETWORK                          │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 🟢  FlowGateX-001            192.168.4.1              3ms   │  │
│  │      Gate System  ·  FW: v2.3.1  ·  ESP32-001               │  │
│  │                                        [ ⭐ Connect ]        │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ 🟡  FlowGateX-002            192.168.4.2             12ms   │  │
│  │      Gate System  ·  FW: v2.1.0  ·  ESP32-002               │  │
│  │                                        [ Connect ]           │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ 🔴  FlowGateX-003            192.168.4.3          timeout   │  │
│  │      Gate System  ·  Last seen 4h ago                        │  │
│  │                                        [ Retry ]             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  [ 🔄 Re-scan Network ]                    2 of 3 reachable        │
├────────────────────────────────────────────────────────────────────┤
│ SECTION C — CONTROLS                                               │
│                                                                    │
│  Auto-Reconnect     [ ●━━━━━━ ON  ]    [ 🔌 Test Connection ]     │
│  Heartbeat every:   [ 10s ▼ ]                                      │
│                                                                    │
│  [ 🗑️ Clear Cache ]    [ ⛔ Disconnect ]    [ ↺ Reset State ]     │
├────────────────────────────────────────────────────────────────────┤
│ SECTION D — CONNECTION LOG                                         │
│                                                                    │
│  10:52:01  ✅  Connected to FlowGateX-001 (192.168.4.1, 3ms)     │
│  10:51:58  🔄  Attempting connection to 192.168.4.1...            │
│  10:51:55  📡  mDNS probe → flowgatex.local resolved              │
│  10:51:52  📡  Sweeping 192.168.4.x range (254 hosts)             │
│  10:51:50  🔍  Firebase lookup → lastKnownIp: 192.168.4.1         │
│  10:51:48  🔌  Device Connect tab opened, initializing scan       │
│                                                    [ Clear Log ]  │
├────────────────────────────────────────────────────────────────────┤
│ SECTION E — INLINE ESP32 DASHBOARD (after connected)              │
│                                                                    │
│  🌐  http://192.168.4.1/dashboard     [ Open in New Tab ↗ ]      │
│                                        [ Toggle Inline View ]     │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                                              │  │
│  │          < iframe src="http://192.168.4.1/dashboard" >      │  │
│  │                                                              │  │
│  │      [ESP32 AsyncWebServer page renders here]                │  │
│  │       Gate controls, sensor readings, LCD mirror             │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────┤
│ FOOTER                                                             │
│ 🌐 Hosting URL: http://192.168.4.1/dashboard                      │
│ 📶 Network: FlowGateX_4B2A  ·  My IP: 192.168.4.100  ·  Ping: 3ms│
└────────────────────────────────────────────────────────────────────┘
```

---

## 4. Connection Discovery — Three Parallel Methods

When the organizer navigates to this tab, three discovery strategies fire simultaneously using `Promise.allSettled`. Whichever resolves first with a reachable device populates the discovered list immediately. The others continue running and append additional results as they resolve.

### Method 1 — mDNS / Bonjour Probe

The ESP32 registers the hostname `flowgatex.local` using the Arduino `ESPmDNS` library at boot. The component fires a `GET http://flowgatex.local/ping` request first, since this is the fastest path when on the same network as the ESP32's AP hotspot.

```
ESP32 boot → ESPmDNS.begin("flowgatex") → registers flowgatex.local
Gateway.tsx → fetch("http://flowgatex.local/ping", { signal: AbortSignal.timeout(800) })
ESP32 responds → { "id": "ESP32-001", "fw": "v2.3.1", "status": "online" }
Result appended to discoveredDevices[]
```

If the organizer is connected to a router (not the ESP32 AP directly), mDNS may not resolve across subnets. In that case, method 2 takes over.

### Method 2 — Common IP Range Sweep

A parallel sweep of the most likely IP addresses runs as a batch of `fetch` HEAD requests, each with a strict 800ms timeout. The sweep targets the following address families in order:

```
Priority 1:  192.168.4.1       ← ESP32 SoftAP default
Priority 2:  devices/{id}.lastKnownIp from Firestore  (method 3 feeds this)
Priority 3:  192.168.1.1–20    ← Router DHCP typical range
Priority 4:  192.168.0.1–20    ← Alternative subnet
Priority 5:  10.0.0.1–10       ← Corporate/hotel networks
```

For each reachable IP, a follow-up `GET /ping` retrieves device identity JSON. Devices that time out are still listed as cards but shown with a red dot and "Retry" button.

### Method 3 — Firebase Firestore Lookup

Before any network sweep, the component reads `devices/{deviceId}.lastKnownIp` from Firestore. If a value exists from a previous session, it is tried first (ahead of the sweep queue) and highlighted in the discovered list as "Last Known." This makes reconnection to a previously paired device nearly instant.

On successful connection, the current IP is written back to Firestore so the next session benefits from this cache:

```typescript
await updateDoc(doc(db, 'devices', device.id), {
  lastKnownIp: confirmedIp,
  lastConnectedAt: serverTimestamp(),
});
```

---

## 5. QR Code Scanner Flow

The organizer can activate the camera-based QR scanner as an alternative to network scanning. This is the fastest method when the organizer has physical access to the ESP32 device.

### How the ESP32 generates the QR

The ESP32's AsyncWebServer serves a `/qr` endpoint that returns an HTML page with an embedded QR code (generated server-side using the `QRCode` Arduino library or a SPIFFS-stored pre-generated image). The QR encodes:

```
http://192.168.4.1?deviceId=ESP32-001&fw=v2.3.1&type=gate&venue=GrandBallroom-Gate1
```

### React component QR parsing

```typescript
// Gateway.tsx — QR scanner activation
const startQrScanner = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' },
  });
  videoRef.current.srcObject = stream;

  // jsQR library decodes frames from canvas snapshot every 250ms
  const scanInterval = setInterval(() => {
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, canvas.width, canvas.height);

    if (code?.data.startsWith('http://')) {
      clearInterval(scanInterval);
      stream.getTracks().forEach(t => t.stop());
      const url = new URL(code.data);
      setManualUrl(url.origin); // Populate input field
      initiateConnection(url.origin); // Auto-connect immediately
      appendLog('success', `QR decoded → ${url.origin}`);
    }
  }, 250);
};
```

On successful QR decode, the scanner closes automatically, the URL populates the manual input field, and connection is initiated without any additional organizer action.

---

## 6. Connection Establishment — Full Sequence

```
STEP 1 — Organizer clicks "Connect" on a device card (or QR auto-triggers)
│
├── UI: Card shows spinner, button label → "Connecting..."
├── LOG: "🔄 Attempting connection to 192.168.4.1..."
│
STEP 2 — Ping validation
│   fetch GET http://192.168.4.1/ping
│   ├── Success (< 800ms): proceed to Step 3
│   └── Failure / timeout:
│       ├── LOG: "⚠️ Ping timeout — device may be on different subnet"
│       ├── Show toast: "Cannot reach device. Try manual IP or QR scan."
│       └── Card reverts, status → 'error'
│
STEP 3 — Identity verification
│   ESP32 responds:
│   {
│     "id": "ESP32-001",
│     "deviceId": "SCAN-001",        ← must match selectedDevice.id from Firestore
│     "status": "online",
│     "fw": "v2.3.1",
│     "type": "gate",
│     "sensors": ["DHT11","MQ","IR1","IR2","metal"],
│     "gates": { "gate1": "closed", "gate2": "closed" }
│   }
│   ├── deviceId matches → proceed
│   └── deviceId mismatch → warn organizer "This device doesn't match the selected device ID"
│
STEP 4 — State updates
│   ├── setHostUrl("http://192.168.4.1")
│   ├── setConnectionStatus('connected')
│   ├── Update Firestore: devices/{id}.lastKnownIp + lastConnectedAt
│   ├── Call props.onConnected("http://192.168.4.1")  ← parent receives URL for heatmap
│   ├── LOG: "✅ Connected to FlowGateX-001 (192.168.4.1, 3ms)"
│   └── Toast: "Device connected — Live Heatmap tab is now active"
│
STEP 5 — Dashboard rendering
    ├── Footer URL activates: http://192.168.4.1/dashboard (clickable link)
    ├── "Open in New Tab" button activates
    └── If iframeVisible=true: <iframe> renders ESP32-hosted SPA inline
```

---

## 7. ESP32-Hosted Dashboard (Inline iframe)

Once connected, the component can render the ESP32's own HTML dashboard inside an `<iframe>`. This page is flashed into the ESP32's SPIFFS (SPI Flash File System) and served entirely from the device — no cloud, no internet.

### What the ESP32 dashboard contains

The SPIFFS-stored `index.html` is a compact single-page app (~40KB gzipped) with:

```
http://192.168.4.1/dashboard
├── Live Sensor Panel
│   ├── DHT11 temperature + humidity (1s refresh via SSE)
│   ├── MQ gas PPM with color-coded alert bar
│   ├── IR1 + IR2 beam status (clear / blocked)
│   └── Metal detector status
│
├── Gate Control Panel
│   ├── Gate 1: [ Open ] [ Close ] with motor PWM ramp animation
│   ├── Gate 2: [ Open ] [ Close ]
│   └── Emergency Lock All
│
├── LCD Mirror
│   └── Shows exactly what the physical LCD is displaying
│
├── Access Log (last 20 entries)
│   └── Timestamp | UserID | Gate | Result (GRANT/DENY)
│
└── System Info
    └── Uptime | WiFi SSID | IP | Firmware | Connected clients
```

### iframe integration in Gateway.tsx

```tsx
{
  hostUrl && iframeVisible && (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-blue-200 shadow-lg"
      style={{ height: '520px' }}
    >
      {/* Loading overlay while iframe loads */}
      {iframeLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <Spinner size="lg" />
          <p className="ml-3 text-gray-600">Loading device dashboard...</p>
        </div>
      )}

      <iframe
        src={`${hostUrl}/dashboard`}
        className="w-full h-full border-0"
        title="ESP32 Live Dashboard"
        sandbox="allow-scripts allow-same-origin allow-forms"
        onLoad={() => setIframeLoading(false)}
        onError={() => {
          setIframeLoading(false);
          appendLog('error', 'iframe failed to load — device may have rebooted');
        }}
      />
    </div>
  );
}
```

The `sandbox` attribute restricts the iframe to scripts + same-origin only, preventing any unintended navigation or top-frame access from the ESP32-served page.

---

## 8. Auto-Reconnect Heartbeat

When enabled, a `setInterval` runs every N seconds (configurable: 5s / 10s / 30s) sending a lightweight `HEAD http://{hostUrl}/ping` request.

```typescript
useEffect(() => {
  if (!autoReconnect || !hostUrl) return;

  const heartbeat = setInterval(async () => {
    try {
      const start = performance.now();
      const res = await fetch(`${hostUrl}/ping`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(2000),
      });
      const ms = Math.round(performance.now() - start);
      setPingMs(ms);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Latency warning thresholds
      if (ms > 500) appendLog('warning', `High latency: ${ms}ms`);
    } catch {
      setFailCount(prev => {
        if (prev + 1 >= 2) {
          // Two consecutive failures → trigger full rescan
          appendLog('error', 'Heartbeat failed twice — re-scanning network');
          setConnectionStatus('scanning');
          runDiscovery(); // Re-runs all three scan methods
          return 0;
        }
        appendLog('warning', `Heartbeat miss (${prev + 1}/2)`);
        return prev + 1;
      });
    }
  }, heartbeatInterval * 1000);

  return () => clearInterval(heartbeat);
}, [autoReconnect, hostUrl, heartbeatInterval]);
```

---

## 9. Controls Panel — Full Detail

### Auto-Reconnect Toggle

- Default: ON
- When ON: heartbeat runs at selected interval, auto-recovery on failure
- When OFF: manual reconnect only; ping stops; hostUrl retained in state

### Heartbeat Interval Dropdown

- Options: 5s / 10s / 30s / 60s
- Default: 10s
- Stored in `localStorage` per device ID so preference persists across sessions

### Test Connection Button

- Fires immediate `GET /ping` regardless of heartbeat timing
- Shows spinner during request, then displays result inline:
  - ✅ `"Device reachable — 4ms"` (green badge)
  - ⚠️ `"High latency — 620ms. Check WiFi signal."` (amber badge)
  - ❌ `"No response — device offline or IP changed"` (red badge)

### Clear Cache Button

- Removes `lastKnownIp` from Firestore (`devices/{id}.lastKnownIp = deleteField()`)
- Clears `localStorage` entry for this device
- Resets `discoveredDevices` list and forces fresh scan
- Does NOT disconnect active connection

### Disconnect Button

- Stops heartbeat interval
- Clears `hostUrl` from local state
- Calls `props.onDisconnected()` → parent clears `selectedDevice.hostUrl`
- Heatmap tab becomes inactive (shows "Connect device first" state)
- Logs: `"🔌 Disconnected from FlowGateX-001"`

### Reset State Button

- Full reset: disconnect + clear cache + clear connection log + reset discoveredDevices
- Confirmation dialog required: `"Reset all connection state for this device?"`

---

## 10. Connection Log — Detail

The log panel shows a reverse-chronological list of every network action taken during the session. Each entry has:

| Field       | Description                                                           |
| ----------- | --------------------------------------------------------------------- |
| `timestamp` | `HH:MM:SS` formatted from `new Date()`                                |
| `type`      | `info` (grey) / `success` (green) / `warning` (amber) / `error` (red) |
| `message`   | Human-readable description                                            |
| `detail`    | Optional — expandable row showing raw response JSON or error stack    |

Log entries are capped at 200 entries (oldest pruned). The log scrolls to the latest entry on append. A "Clear Log" button wipes all entries.

**Log is also written to Firestore** `devices/{id}/logs` with `source: 'gateway'` tag, making it accessible under the Overview tab's Diagnostic Logs section with level mapping: `info→INFO`, `success→INFO`, `warning→WARNING`, `error→ERROR`.

---

## 11. Error States & Edge Cases

| Scenario                          | What Gateway.tsx Does                                                                                                |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Different subnet**              | Scan finds nothing. Shows "No devices found" with manual IP hint and subnet tips (check if on same WiFi as ESP32 AP) |
| **deviceId mismatch on connect**  | Warns organizer: "Device ID on network doesn't match selected device. Are you sure?" with Continue / Cancel          |
| **ESP32 reboots mid-session**     | Heartbeat detects failure → triggers rescan → reconnects to same IP → logs "Device rebooted, reconnected"            |
| **IP address changed**            | Rescan finds device at new IP → updates Firestore lastKnownIp → reconnects transparently                             |
| **iframe blocked by CORS**        | Shows "Dashboard cannot be embedded — open in new tab" with fallback button                                          |
| **QR scanner permission denied**  | Gracefully falls back to manual input with message "Camera permission required for QR scan"                          |
| **Multiple same-network ESP32s**  | Lists all discovered devices with identity confirmation before connecting — no auto-connect if ambiguous             |
| **Organizer not on same network** | Shows guidance: "You must be connected to the same WiFi network as the ESP32. Current network: [SSID]"               |

---

## 12. Footer Information

The footer displays live network context to help organizers confirm they're on the correct network:

```
🌐  Hosting URL:   http://192.168.4.1/dashboard        [ Copy Link ]
📶  Network SSID:  FlowGateX_4B2A
💻  My IP:         192.168.4.100
📡  Device IP:     192.168.4.1
⚡  Ping:          3ms
🔗  Status:        ✅ Connected · Auto-reconnect ON · Heartbeat: 10s
```

SSID is obtained from the browser's Network Information API (`navigator.connection`) where available, with fallback to `"(network info unavailable)"` on unsupported browsers.

---

## 13. State Persistence Across Tab Switches

Because `Gateway.tsx` unmounts when the organizer switches to a different tab (Overview, Live Heatmap), the heartbeat interval and connection state must be lifted to the parent `IoTDevicesPage.tsx` and passed back as props. This prevents reconnection being triggered every time the organizer switches back to the Device Connect tab.

```typescript
// IoTDevicesPage.tsx manages this at the panel level
const [esp32HostUrl, setEsp32HostUrl] = useState<string | null>(null);
const [autoReconnectActive, setAutoReconnectActive] = useState(true);

// Heartbeat runs at parent level so it survives tab switches
useEffect(() => {
  if (!esp32HostUrl || !autoReconnectActive) return;
  const hb = setInterval(() => pingDevice(esp32HostUrl), 10000);
  return () => clearInterval(hb);
}, [esp32HostUrl, autoReconnectActive]);
```

---

## 14. Firestore Document Updates Made by Gateway.tsx

| Field path                     | Write trigger         | Value                                              |
| ------------------------------ | --------------------- | -------------------------------------------------- |
| `devices/{id}.lastKnownIp`     | On successful connect | `"192.168.4.1"`                                    |
| `devices/{id}.lastConnectedAt` | On successful connect | `serverTimestamp()`                                |
| `devices/{id}.lastKnownIp`     | On Clear Cache        | `deleteField()`                                    |
| `devices/{id}/logs/{auto-id}`  | On every log entry    | `{ timestamp, level, message, source: 'gateway' }` |

---

## 15. Integration with Ai_heatmap.tsx (Page 1)

`Gateway.tsx` is the upstream provider for `Ai_heatmap.tsx`. The connection flow is:

```
Gateway.tsx connects → calls props.onConnected("http://192.168.4.1")
  → IoTDevicesPage.tsx: setEsp32HostUrl("http://192.168.4.1")
  → Ai_heatmap.tsx receives: esp32Url="http://192.168.4.1" as prop
  → Heatmap polling activates: GET http://192.168.4.1/heatmap every 3s
  → HeatmapDashboard tab becomes available (previously shows "Connect first" state)
```

If the organizer disconnects via `Gateway.tsx`, the heatmap page immediately goes dark with an overlay: `"Device disconnected — go to Device Connect tab to reconnect"` and a shortcut button that switches the active tab back.

---

## 16. File Structure Reference

```
src/
├── components/
│   └── iot/
│       ├── Gateway.tsx                  ← this component
│       ├── Ai_heatmap.tsx               ← Page 1 (receives hostUrl from here)
│       ├── subcomponents/
│       │   ├── ConnectionStatus.tsx     ← Reusable status badge (Scanning/Connected/Error)
│       │   ├── DeviceScanner.tsx        ← Network scan logic + discovered device cards
│       │   ├── QrScanner.tsx            ← Camera + jsQR decoder
│       │   ├── ConnectionLog.tsx        ← Scrolling timestamped log panel
│       │   ├── HeartbeatMonitor.tsx     ← Auto-reconnect interval logic
│       │   └── EmbeddedDashboard.tsx    ← iframe wrapper with loading + error states
│       └── index.ts
└── pages/
    └── organizer/
        └── IoTDevicesPage.tsx           ← Parent: manages esp32HostUrl state
```

---

## 17. ESP32 Arduino Endpoints Required

The following endpoints must be implemented in the ESP32 Arduino sketch for Gateway.tsx to function:

```cpp
// Minimum required endpoints (AsyncWebServer)

// 1. Ping — identity handshake
server.on("/ping", HTTP_GET, [](AsyncWebServerRequest* req) {
  req->send(200, "application/json",
    "{\"id\":\"ESP32-001\",\"deviceId\":\"SCAN-001\","
    "\"status\":\"online\",\"fw\":\"v2.3.1\",\"type\":\"gate\"}");
});

// 2. Dashboard — SPIFFS-hosted SPA
server.serveStatic("/dashboard", SPIFFS, "/index.html");
server.serveStatic("/", SPIFFS, "/");

// 3. Config — sensitivity + threshold updates from Ai_heatmap controls
server.on("/config", HTTP_POST, [](AsyncWebServerRequest* req) { }, NULL,
  [](AsyncWebServerRequest* req, uint8_t* data, size_t len, size_t index, size_t total) {
    // Parse JSON body { sensitivity: "high" } and update Roboflow threshold
    req->send(200, "application/json", "{\"ok\":true}");
  }
);

// 4. QR endpoint (serves QR code page)
server.on("/qr", HTTP_GET, [](AsyncWebServerRequest* req) {
  req->send(SPIFFS, "/qr.html", "text/html");
});
```

---

_Last updated: Feb 2026 · FlowGateX IoT Module · Gateway.md v1.0_
