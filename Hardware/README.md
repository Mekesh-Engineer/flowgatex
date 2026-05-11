# FlowGateX Gate System — ESP32 Firmware

> Complete firmware for the FlowGateX dual-gate access control system.  
> Board: **ESP32 DevKit V1 (38-pin)** · Framework: **Arduino (ESP-IDF via arduino-esp32 v2.x)**

---

## 📁 Project Structure

```
Hardware/
├── gateway.md                          # Original specification document
├── README.md                           # This file
└── flowgatex_gate/
    ├── flowgatex_gate.ino              # Main Arduino firmware (~700 lines)
    ├── config.h                        # Configuration header (pins, WiFi, Firebase)
    └── data/                           # SPIFFS files (uploaded separately)
        ├── index.html                  # Dashboard SPA
        ├── style.css                   # Dashboard CSS (dark theme)
        ├── app.js                      # Dashboard JS (WebSocket + polling)
        └── favicon.ico                 # FlowGateX icon (add manually)
```

---

## 🔧 Hardware Wiring

### Motor Driver (L298N)

| Pin | GPIO | Function           |
| --- | ---- | ------------------ |
| ENA | 5    | Gate 1 motor PWM   |
| IN1 | 18   | Gate 1 direction A |
| IN2 | 19   | Gate 1 direction B |
| ENB | 4    | Gate 2 motor PWM   |
| IN3 | 16   | Gate 2 direction A |
| IN4 | 17   | Gate 2 direction B |

### Sensors

| Sensor            | GPIO | Notes                   |
| ----------------- | ---- | ----------------------- |
| IR Beam 1 (Entry) | 34   | Input-only, ADC         |
| IR Beam 2 (Exit)  | 35   | Input-only, ADC, 5cm    |
| MQ Gas Sensor     | 36   | ADC1 channel 0          |
| DHT11 Temp/Humid  | 13   | Moved from 21 (I2C fix) |
| Metal Detector    | 39   | Input-only, ADC         |

### I2C LCD (16×2)

| Pin  | GPIO | Notes                            |
| ---- | ---- | -------------------------------- |
| SDA  | 25   | Remapped from default 21         |
| SCL  | 26   | Remapped from default 22         |
| Addr | 0x27 | Some modules use 0x3F — I2C scan |

### Buzzer

| Pin    | GPIO | Notes         |
| ------ | ---- | ------------- |
| Buzzer | 27   | Active buzzer |

---

## 📦 Required Libraries

Install via **Arduino Library Manager**:

| Library            | Version | Author             |
| ------------------ | ------- | ------------------ |
| WebSockets         | 2.4.x   | Markus Sattler     |
| ArduinoJson        | 6.21.x  | Benoit Blanchon    |
| DHT sensor library | 1.4.x   | Adafruit           |
| LiquidCrystal_I2C  | -       | Frank de Brabander |
| Firebase ESP32     | 4.x     | Mobizt             |

> **Note:** `WebServer.h` is built into the ESP32 Arduino core — no manual install needed.

---

## 🚀 Flash & Upload Workflow

### Step 1 — Install Arduino IDE 2.x

- Board Manager → search "esp32" → install **"esp32 by Espressif Systems" v2.x**

### Step 2 — Install Libraries

- Library Manager → install all libraries listed above

### Step 3 — Board Configuration

```
Tools → Board:            "ESP32 Dev Module"
Tools → Partition Scheme:  "Default 4MB with spiffs (1.2MB APP / 1.5MB SPIFFS)"
Tools → Upload Speed:      921600
Tools → CPU Frequency:     240MHz
Tools → Flash Size:        4MB
```

### Step 4 — Configure Credentials

Edit `config.h` and fill in:

```cpp
#define STA_SSID      "YourVenueWiFi"
#define STA_PASS      "your_wifi_password"
#define FIREBASE_HOST "your-project.firebaseio.com"
#define FIREBASE_AUTH "your-firebase-database-secret"
```

### Step 5 — Upload SPIFFS (Dashboard Files)

1. Place the `data/` folder contents inside the sketch folder
2. Install the **ESP32 Sketch Data Upload** plugin if not already installed
3. Tools → **"ESP32 Sketch Data Upload"**
4. This uploads `index.html`, `app.js`, `style.css` to SPIFFS

### Step 6 — Upload Firmware

1. Click **Verify** to compile
2. Click **Upload** to flash

### Step 7 — Monitor

```
Tools → Serial Monitor → 115200 baud
```

You should see the full boot sequence:

```
=== FlowGateX Gate System Booting ===
Firmware: 2.3.0 | Chip: abc123
[GPIO] Initialization complete.
[MOTOR] Test cycle complete.
[SPIFFS] Mounted OK.
[WiFi] AP started: FlowGateX_4B2A @ 192.168.4.1
[WiFi] STA connected: VenueWiFi @ 192.168.1.105
[mDNS] flowgatex.local registered.
[HTTP] WebServer started on port 80.
[WS] WebSocket server started on port 81.
[Firebase] Initialized.
=== Boot complete ===
```

### Step 8 — Verify

1. Connect phone to **"FlowGateX_4B2A"** WiFi (password: `flowgatex2026`)
2. Open **http://192.168.4.1** → Dashboard loads ✅
3. Open FlowGateX app → IoT Devices → Gate System → Device Connect tab
4. Gateway.tsx discovers device at `192.168.4.1` ✅

---

## 🌐 API Endpoints

| Method | Endpoint     | Consumer                 | Description                               |
| ------ | ------------ | ------------------------ | ----------------------------------------- |
| GET    | `/ping`      | Gateway.tsx              | Identity handshake, connection validation |
| GET    | `/sensors`   | Dashboard, Ai_heatmap    | Live sensor JSON snapshot                 |
| GET    | `/heatmap`   | Ai_heatmap.tsx           | Inference grid + bounding boxes           |
| POST   | `/gates`     | Dashboard, FlowGateX app | Gate open/close commands                  |
| POST   | `/qr`        | ScannerPage.tsx          | Live QR validation → GRANT/DENY (direct)  |
| POST   | `/config`    | Ai_heatmap controls      | Sensitivity + threshold updates           |
| GET    | `/logs`      | Dashboard, Gateway logs  | Last 100 access log entries               |
| GET    | `/system`    | Dashboard footer         | Uptime, heap, WiFi info                   |
| GET    | `/dashboard` | Gateway.tsx iframe       | Main SPIFFS-hosted SPA                    |
| WS     | `ws://:81`   | All browser clients      | Real-time bidirectional push              |

---

## 📡 WebSocket Protocol (Port 81)

### Server → Client (every 1s)

```json
{
  "timestamp": "2026-02-20T10:52:01Z",
  "sensors": {
    "dht11_temp": 28.4,
    "dht11_humidity": 65.2,
    "mq_gas_ppm": 120,
    "metal_detected": false,
    "ir1_status": "clear",
    "ir2_status": "clear",
    "mq_raw_adc": 1840
  },
  "gates": {
    "gate1": "closed",
    "gate2": "closed",
    "gate1_uptime_ms": 0,
    "gate2_uptime_ms": 0
  },
  "alerts": {
    "gas_alert": false,
    "metal_alert": false,
    "temp_alert": false,
    "ir_timeout": false
  },
  "system": {
    "status": "online",
    "ap_clients": 2,
    "uptime_s": 8115,
    "free_heap": 198432,
    "sta_rssi": -54
  }
}
```

### Client → Server (commands)

```json
{ "action": "open_gate", "gate": 1 }
{ "action": "close_gate", "gate": 2 }
{ "action": "ping" }
{ "action": "unlock" }
```

---

## 🔒 Gate State Machine

```
CLOSED → (openGate) → OPENING → (ramp complete) → OPEN
OPEN → (auto-timer / closeGate) → CLOSING → CLOSED
Any state → (gas/metal alert) → LOCKED (manual unlock via /config or WS)
```

---

## 🛡 Offline Mode

When WiFi STA fails (no internet), the ESP32 continues local operations:

| Feature                      | Status             |
| ---------------------------- | ------------------ |
| AP hotspot (FlowGateX_4B2A)  | ✅                 |
| Dashboard serves from SPIFFS | ✅                 |
| WebSocket pushes sensor data | ✅                 |
| QR validation (EEPROM cache) | ✅                 |
| Gate control via /gates      | ✅                 |
| Sensor monitoring + alerts   | ✅                 |
| Firebase RTDB sync           | ❌ Paused (queued) |
| FlowGateX app cloud features | ❌ Unavailable     |

---

## 📝 Notes

- **ScannerPage Integration:** The ESP32's `/qr` endpoint accepts direct HTTP POST from `scannerService.sendGateCommand()`. The `IoTDevice` Firestore document must have the `ipAddress` field set (e.g. `192.168.4.1`) for direct hardware communication.
- **Favicon:** Add a `favicon.ico` to the `data/` folder for browser tab icon.
- **DHT Pin Conflict:** DHT11 was moved from GPIO 21 to GPIO 13 to avoid I2C SDA conflict with LCD.
- **I2C Address:** If LCD doesn't display, run an I2C scanner sketch — address might be `0x3F` instead of `0x27`.
- **Firebase Secret:** The legacy database secret is used (not service account). Find it in Firebase Console → Project Settings → Service Accounts → Database Secrets.

---

_Last updated: Feb 2026 · FlowGateX IoT Module · Firmware v2.3.0_
