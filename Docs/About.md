# 🚀 FlowGateX — Enterprise-Grade Smart Event & Venue Management Platform with IoT-Powered Crowd Control

> **Where Innovation Meets Access Control.**  
> FlowGateX is a next-generation, IoT-integrated event management platform that redefines how events are discovered, booked, secured, and experienced — all powered by real-time intelligence, hardware-level precision, and intelligent crowd management.

---

## 📌 Overview

**FlowGateX** is a full-stack, production-ready Progressive Web Application (PWA) engineered for the modern event ecosystem. It bridges the gap between digital ticketing and physical access control by combining a powerful cloud-native web platform with an advanced IoT hardware infrastructure — featuring dual ESP32-CAM modules, automated gate control systems, comprehensive sensor networks, and AI-powered crowd monitoring.

From intimate workshops to large-scale conferences, FlowGateX delivers a seamless end-to-end experience:

- **Attendees** discover, book, and enter events with cryptographically secured QR tickets validated through intelligent IoT gates.
- **Organizers** create events, manage attendees, monitor IoT gate devices with real-time sensor data, track crowd density, and analyze revenue — all from a unified dashboard.
- **Admins** govern the entire platform with granular role-based access control, feature flags, real-time analytics, and comprehensive venue safety monitoring.
- **Security Personnel** receive instant alerts from metal detectors, gas sensors, and crowd density monitoring systems for proactive threat management.

**Version:** 2.0.0 &nbsp;|&nbsp; **Status:** Production Ready &nbsp;|&nbsp; **Architecture:** Hybrid Cloud + Advanced IoT Ecosystem

---

## 🎯 Purpose & Vision

Traditional event management platforms stop at the digital ticket. FlowGateX goes significantly further — extending its reach deep into the **physical venue** through a comprehensive IoT-powered smart infrastructure, creating a truly unified, safe, and intelligent event experience.

### The Problem

- Event entry is slow, fraud-prone, and disconnected from digital systems
- Manual gate operations create bottlenecks and poor attendee experiences
- Venue security lacks real-time threat detection and environmental monitoring
- Organizers have zero visibility into crowd density, safety hazards, or gate throughput
- No integration between ticketing systems, physical access control, and crowd management
- Security personnel rely on manual monitoring, leading to delayed incident response

### The FlowGateX Solution

A **single unified platform** that handles the **entire event lifecycle** — from discovery to post-event analytics — with hardware-validated, tamper-proof entry, automated gate control, real-time sensor monitoring, AI-powered crowd management, and comprehensive safety intelligence. FlowGateX transforms venues into smart, secure, and efficient spaces where technology works invisibly to create exceptional experiences.

---

## ⚡ Core Platform Features

### 1. Smart Event Discovery & Booking

| Feature                   | Description                                                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Intelligent Search**    | Fuzzy search powered by Fuse.js with instant results across 12 event categories                                                                                           |
| **Rich Event Pages**      | Immersive event details with cover images, galleries, video URLs, agenda breakdowns, speaker profiles, and venue capacity information                                     |
| **8-Step Event Creation** | Comprehensive wizard covering basic info, scheduling, venue (with Google Maps), ticket tiers, media, organizer details, publishing settings, and IoT device configuration |
| **Multi-Tier Ticketing**  | Multiple ticket tiers per event with individual pricing, quantity limits, sale windows, visibility controls, and gate access permissions                                  |
| **Promo Code Engine**     | Percentage or flat discounts with expiry dates, usage limits, minimum order values, and event-scoped targeting                                                            |
| **Recurring Events**      | Support for single-day, multi-day, and recurring event formats with timezone awareness                                                                                    |
| **12 Event Categories**   | Music, Sports, Conference, Workshop, Networking, Arts, Food, Tech, Health, Education, Business, Entertainment                                                             |
| **Bulk Import**           | JSON-based bulk event creation for large-scale deployments                                                                                                                |
| **Capacity Management**   | Real-time venue capacity tracking with automated waitlist when approaching limits                                                                                         |

### 2. Secure Booking & Payment Pipeline

| Feature                       | Description                                                                                                                                                                                               |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Atomic Inventory Control**  | Firestore transactions prevent overselling — ticket availability is checked and decremented in a single atomic operation                                                                                  |
| **Dual Payment Gateways**     | Razorpay (primary, client-side checkout) and Cashfree (secondary, server-side) with automatic fallback to mock payments for development                                                                   |
| **Cryptographic QR Tickets**  | Each ticket is embedded with a SHA-256 signed QR code containing `ticketId`, `userId`, `eventId`, `transactionId`, `bookingId`, `timestamp`, and `gateAccessLevel` — Base64-encoded and tamper-verifiable |
| **Real-Time Cart Sync**       | Zustand + Firestore bidirectional cart synchronization — cart state persists across devices and sessions                                                                                                  |
| **Automated Refund Workflow** | Eligibility-checked refunds that cascade: booking status → transaction status → ticket invalidation → inventory restoration                                                                               |
| **Transaction Ledger**        | Complete financial audit trail with service fees (₹12/ticket), tax breakdowns, discount details, and filterable transaction history                                                                       |
| **Dynamic Pricing**           | Support for time-based pricing tiers and demand-based surge pricing                                                                                                                                       |

### 3. Enterprise Role-Based Access Control (RBAC)

FlowGateX implements a **4-tier hierarchical permission system** with 40+ granular permissions across 12 resource domains.

| Role            | Level | Access Scope                                                                                                                            |
| --------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Attendee**    | 0     | Browse events, manage personal bookings, profile management                                                                             |
| **Organizer**   | 1     | Create/manage events, view analytics, manage IoT devices, process refunds, monitor crowd                                                |
| **Admin**       | 2     | Platform governance, user management, role assignment, feature flags, platform settings, IoT configuration, safety alerts, data exports |
| **Super Admin** | 3     | Full system bypass — unconditional access to every resource and action                                                                  |

**Permission Format:** `resource:action` (e.g., `event:create`, `iot:manage`, `finance:payout`, `crowd:monitor`, `security:alert`)

**5-Layer Resolution Engine:**

1. Account status check (suspended/deleted → deny)
2. Super Admin override (→ allow all)
3. Platform feature flag evaluation
4. Organization-level permission restrictions
5. Role-based default permission check

**Security Policies:** Configurable 2FA enforcement, password strength requirements (8+ chars, mixed case, numbers, special characters), session timeouts, max login attempts, IP whitelisting, and CORS origin control.

### 4. Real-Time Analytics Dashboard

| Metric                  | Visualization                                                                 |
| ----------------------- | ----------------------------------------------------------------------------- |
| **Total Revenue**       | Aggregate with trend indicator (↑↓ vs. last period)                           |
| **Total Bookings**      | Count with period comparison                                                  |
| **Active Events**       | Live event counter with capacity utilization                                  |
| **Revenue Trends**      | Interactive line chart with 7d/30d/90d period selector and cyan gradient fill |
| **Attendance Patterns** | Bar chart comparing Registered vs. Attended vs. Current Occupancy per date    |
| **Per-Event Analytics** | Dedicated analytics page per event for organizers with crowd heatmaps         |
| **Gate Performance**    | Entry throughput metrics per gate with bottleneck identification              |
| **Safety Metrics**      | Real-time sensor data visualization (temperature, gas levels, crowd density)  |
| **Device Health**       | IoT device status dashboard with uptime, battery, and connectivity metrics    |

### 5. Progressive Web App (PWA)

- **Offline Capability:** Service worker with Workbox caching strategies for resilient operation
- **Installable:** Add-to-Home-Screen with custom manifest and native-like experience
- **Responsive:** Full mobile-first design with adaptive layouts across all screen sizes
- **Fast:** Vite-powered build with code splitting via React.lazy and Suspense
- **Push Notifications:** Real-time alerts for booking confirmations, gate status, and safety warnings

---

## 🔧 IoT Hardware Integration — The FlowGateX Smart Venue System

> **This is what sets FlowGateX apart.**  
> The platform extends beyond software into a comprehensive IoT ecosystem featuring automated gate control, multi-sensor safety monitoring, dual ESP32-CAM systems for QR validation and AI-powered crowd analytics, and real-time environmental surveillance.

### Hardware Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          FlowGateX Cloud Platform                             │
│                         (Firebase Firestore + Functions)                      │
│                                                                               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌───────────────┐    │
│  │ Events  │  │ Tickets │  │ Devices │  │  Sensors │  │  Crowd Data   │    │
│  │   DB    │  │   DB    │  │   DB    │  │    DB    │  │  Analytics    │    │
│  └────┬────┘  └────┬────┘  └────┬────┘  └─────┬────┘  └───────┬───────┘    │
│       │            │            │              │               │             │
│       │            │            │              │               │             │
└───────┼────────────┼────────────┼──────────────┼───────────────┼─────────────┘
        │            │            │              │               │
        ════════════════════════════════════════════════════════════
                      Real-Time Bidirectional Sync
                      (WebSocket + MQTT Protocol)
        ════════════════════════════════════════════════════════════
        │            │            │              │               │
┌───────┴────────────┴────────────┴──────────────┴───────────────┴─────────────┐
│                      VENUE IoT INFRASTRUCTURE                                 │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │              AUTOMATED GATE CONTROL SYSTEM (Gate 1 & 2)              │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │   │
│  │  │  DC Motor Gate 1 │  │  DC Motor Gate 2 │  │   DVD Player     │   │   │
│  │  │  (Entry Gate)    │  │  (Exit Gate)     │  │   (Visual Info   │   │   │
│  │  │  + Relay Module  │  │  + Relay Module  │  │    Display)      │   │   │
│  │  │  (5V/12V 2CH)    │  │  (5V/12V 2CH)    │  │  + ESP32 Control │   │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    ESP32-CAM MODULE #1 (QR SCANNER)                  │   │
│  │  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────────┐   │   │
│  │  │  OV2640 Camera  │  │  QR Decoder  │  │  Ticket Validator    │   │   │
│  │  │  (2MP, 1600x1200│  │  Library     │  │  (SHA-256 Verify)    │   │   │
│  │  │   Wide Angle)   │  │  (ZXing)     │  │  + Firebase Sync     │   │   │
│  │  └─────────────────┘  └──────────────┘  └──────────────────────┘   │   │
│  │  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────────┐   │   │
│  │  │  LED Indicators │  │  Buzzer      │  │  WiFi Module         │   │   │
│  │  │  (RGB: Valid/   │  │  (Success/   │  │  (2.4GHz 802.11b/g/n)│   │   │
│  │  │   Invalid/Error)│  │   Error)     │  │  + MQTT Client       │   │   │
│  │  └─────────────────┘  └──────────────┘  └──────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │         ESP32-CAM MODULE #2 (CROWD MONITORING & ANALYTICS)           │   │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │   │
│  │  │  OV2640 Camera  │  │  2-Axis Gimbal   │  │  AI Person       │   │   │
│  │  │  (Wide FoV)     │  │  Robotic Holder  │  │  Detection       │   │   │
│  │  │  + Night Vision │  │  (Pan: 180°)     │  │  (YOLOv8-Tiny)   │   │   │
│  │  │  IR LEDs        │  │  (Tilt: 90°)     │  │  + Crowd Counter │   │   │
│  │  └─────────────────┘  └──────────────────┘  └──────────────────┘   │   │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │   │
│  │  │  Servo Motors   │  │  Heatmap         │  │  Density Alert   │   │   │
│  │  │  (SG90 2x)      │  │  Generator       │  │  System (Over-   │   │   │
│  │  │  PWM Control    │  │  (Zone Tracking) │  │  capacity Warn)  │   │   │
│  │  └─────────────────┘  └──────────────────┘  └──────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                   COMPREHENSIVE SENSOR NETWORK                        │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │   │
│  │  │  DHT22 Sensor    │  │  Metal Detector  │  │  MQ-2 Gas Sensor │   │   │
│  │  │  (Temperature +  │  │  Module (Pulse   │  │  (LPG, Smoke,    │   │   │
│  │  │   Humidity)      │  │  Induction Coil) │  │   CO Detection)  │   │   │
│  │  │  Range: -40~80°C │  │  Detection: 3-5cm│  │  Range: 300-10K  │   │   │
│  │  │  Humidity: 0-100%│  │  + Audio Alert   │  │  ppm, Analog Out │   │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘   │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │   │
│  │  │  Relay Module    │  │  Status LED      │  │  Alarm Buzzer    │   │   │
│  │  │  (4-Channel 5V)  │  │  Array (5x RGB)  │  │  (Active Piezo   │   │   │
│  │  │  Gate Control +  │  │  Sensor Status   │  │  90dB @ 10cm)    │   │   │
│  │  │  Alert Systems   │  │  Visual Feedback │  │  Multi-tone Alert│   │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        POWER & CONNECTIVITY                           │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │   │
│  │  │  LiPo Battery    │  │  Solar Charging  │  │  WiFi Mesh       │   │   │
│  │  │  (3.7V 5000mAh)  │  │  Circuit (6V 1W) │  │  Network (ESP-   │   │   │
│  │  │  + Voltage Reg.  │  │  + Charge Ctrl   │  │  NOW Protocol)   │   │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Detailed Hardware Component Specifications

#### 1. Automated Gate Control System

**Purpose:** Intelligent, touchless entry/exit control with motorized gates that respond to validated QR scans.

**Components:**

**A. Dual DC Motor Gate System**

- **Motor Specifications:**
  - Type: 12V DC Gear Motor with encoder feedback
  - Torque: 10 kg-cm (sufficient for lightweight barrier gates)
  - Speed: Variable (0-60 RPM) via PWM control
  - Rotation: 90° for gate open/close cycle
  - Response Time: <2 seconds from trigger to fully open
- **Gate 1 (Entry Gate):**
  - **Function:** Validates incoming attendees with QR scan
  - **Operation Mode:** Opens on valid QR scan → Remains open for 5 seconds → Auto-closes
  - **Safety Features:** IR proximity sensor to prevent closing on obstructed passage
  - **Indicator:** Green LED ring + success tone when open
- **Gate 2 (Exit Gate):**
  - **Function:** One-way exit control (optional exit QR validation for events requiring checkout)
  - **Operation Mode:** Opens on button press or exit QR scan → Auto-closes after passage
  - **Safety Features:** Pressure-sensitive safety mat prevents premature closing
  - **Indicator:** Blue LED ring + exit confirmation tone

**B. Relay Control Module**

- **Model:** 2-Channel 5V/12V Relay Module (isolated optocoupler design)
- **Channel 1:** Gate 1 motor control (Forward/Reverse for open/close)
- **Channel 2:** Gate 2 motor control
- **Switching Capacity:** 10A @ 250VAC / 10A @ 30VDC
- **Trigger:** Low-level (0V) trigger from ESP32 GPIO
- **Protection:** Flyback diodes for motor inductance protection
- **Status LEDs:** On-board LEDs indicate relay state (energized/de-energized)

**C. DVD Player Information Display**

- **Model:** Portable 9" LCD DVD Player (repurposed for venue info display)
- **Function:** Displays event information, welcome messages, sponsor ads, and gate instructions
- **Control:** ESP32-controlled via IR blaster module for remote playlist control
- **Content Source:** Looped video files stored on SD card or USB drive
- **Power:** 12V DC input (shared with gate motor power supply)
- **Mounting:** Gate-adjacent mounting bracket at eye level
- **Update Mechanism:** Content updated via WiFi from cloud (ESP32 downloads new videos)

**D. Control Logic Flow:**

```
Valid QR Scan Detected (ESP32-CAM #1)
         ↓
ESP32 validates ticket in Firestore
         ↓
   Ticket Valid?
    ┌───┴───┐
  YES       NO
    │        │
    ↓        ↓
Send GPIO   Buzzer Error
HIGH signal  + Red LED
to Relay 1   + Reject Message
    ↓
Relay 1 Energizes
    ↓
Gate 1 Motor Opens (90° rotation)
    ↓
Green LED + Success Tone
    ↓
Wait 5 seconds (timer)
    ↓
Check IR Proximity Sensor
    ↓
    Clear?
    ┌───┴───┐
  YES       NO
    │        │
    ↓        ↓
GPIO LOW   Wait + Recheck
Relay Off  (loop until clear)
    ↓
Gate 1 Motor Closes
    ↓
Update ticket status in Firestore (status: 'used')
    ↓
Log entry in audit trail
```

---

#### 2. ESP32-CAM Module #1 — QR Scanner & Entry Validator

**Purpose:** High-speed QR ticket scanning with cryptographic validation and gate trigger control.

**Hardware Specifications:**

- **Microcontroller:** ESP32-S (Dual-core Xtensa LX6, 240MHz)
- **Camera:** OV2640 2MP CMOS sensor
  - Resolution: 1600x1200 (UXGA) for QR scanning
  - Frame Rate: 15 fps (optimized for QR detection)
  - Field of View: 66° (wide enough for handheld ticket capture)
  - Auto white balance and exposure
- **Memory:** 4MB PSRAM for image buffering
- **WiFi:** 802.11 b/g/n (2.4GHz), WPA2-PSK encryption
- **Power:** 5V input via micro-USB or external power supply (250mA typical, 500mA peak)

**Peripheral Modules:**

**A. LED Indicator System (RGB LED Strip - WS2812B)**

- **Count:** 16 LEDs in circular ring around camera lens
- **Color Coding:**
  - **Green:** Valid ticket detected → Gate opening
  - **Red:** Invalid ticket (tampered QR, expired, already used, or unauthorized tier)
  - **Blue:** Scanning in progress / Device ready
  - **Yellow:** System warning (connectivity issue, Firestore sync pending)
  - **White Pulse:** Device initializing / Camera warming up
- **Control:** ESP32 GPIO via NeoPixel library
- **Power:** Separate 5V rail (LED current: 60mA per LED @ full brightness)

**B. Buzzer Alert System (Active Piezo Buzzer)**

- **Model:** HCM1612A Active Buzzer (12mm diameter)
- **Sound Pressure Level:** 85dB @ 10cm distance
- **Frequency:** 2.7kHz (clear, attention-grabbing tone)
- **Tone Patterns:**
  - **Success:** Double beep (200ms ON, 100ms OFF, 200ms ON)
  - **Error:** Long continuous tone (500ms) + red LED flash
  - **Warning:** Triple short beeps (100ms each with 50ms gaps)
  - **System Ready:** Single short chirp
- **Control:** ESP32 GPIO with PWM for tone variation
- **Power:** 3.3V logic-level trigger, 30mA current draw

**C. Mounting & Positioning**

- **Housing:** Weatherproof IP65 enclosure with acrylic lens cover
- **Mounting Height:** 1.2 meters from ground (optimal for handheld phone QR display)
- **Angle:** 10° downward tilt for ergonomic scanning
- **Distance:** Effective QR read range: 10-40 cm from camera
- **Lighting:** 4x IR LEDs for low-light/night operation (850nm wavelength)

**Software Stack:**

- **Firmware:** Arduino framework on ESP32
- **QR Decoding:** ESP32-QRcode library (optimized fork of quirc)
- **Cryptography:** SHA-256 hashing via mbedTLS (hardware-accelerated)
- **Firebase SDK:** Custom lightweight ESP32 Firebase client
- **OTA Updates:** Remote firmware deployment via Firebase Storage

**Validation Pipeline:**

```
1. Camera captures QR code (15 fps continuous scan)
2. Image preprocessing (grayscale conversion, contrast enhancement)
3. QR decoder extracts Base64 payload
4. Base64 decode → JSON parse
5. Extract: ticketId, userId, eventId, transactionId, bookingId, timestamp, signature
6. Recompute SHA-256 hash from payload fields
7. Compare computed hash with embedded signature
8. If MATCH:
   → Query Firestore: `tickets/{ticketId}`
   → Check: status=='valid', expiryDate > now, gateAccessLevel matches device tier
   → If PASS: Trigger Gate 1 relay + Green LED + Success buzzer + Update status to 'used'
   → If FAIL: Reject + Red LED + Error buzzer + Log attempt
9. If MISMATCH (tampered QR):
   → Immediate reject + Red LED + Extended error buzzer + Security alert to admin
10. Display result on LCD screen + Send event to analytics dashboard
```

**Offline Mode:**

- **Sync Cadence:** Every 30 seconds (or on WiFi reconnection)
- **Local Cache:** Last 1000 validated tickets stored in ESP32 flash memory
- **Conflict Resolution:** Cloud timestamp is source of truth; local scans queue for sync

---

#### 3. ESP32-CAM Module #2 — AI-Powered Crowd Monitoring System

**Purpose:** Real-time crowd counting, density analysis, and occupancy management using computer vision and intelligent gimbal positioning.

**Hardware Specifications:**

**A. ESP32-CAM Core**

- **Microcontroller:** ESP32-S (Dual-core Xtensa LX6, 240MHz)
- **Camera:** OV2640 2MP CMOS sensor (same as Module #1, but with different firmware)
  - Resolution: 800x600 (SVGA) for person detection (optimized for speed)
  - Frame Rate: 10 fps (adequate for crowd counting)
  - Field of View: 66° (captures wide venue area)
  - Low-light enhancement with 4x IR LED array (940nm for invisible illumination)
- **Memory:** 4MB PSRAM for frame buffering + AI inference
- **WiFi:** 802.11 b/g/n with MQTT protocol for real-time data streaming

**B. 2-Axis Gimbal Robotic Holder**

- **Pan Servo (Horizontal Rotation):**
  - Model: MG996R Metal Gear Servo
  - Rotation: 180° (covers entire venue from corner mounting)
  - Torque: 11 kg-cm @ 6V (sufficient for camera + housing load)
  - Speed: 0.17 sec/60° (smooth tracking without motion blur)
  - Control: PWM signal from ESP32 (50Hz, 1-2ms pulse width)
- **Tilt Servo (Vertical Angle):**
  - Model: SG90 Micro Servo
  - Rotation: 90° (covers ground level to ceiling)
  - Torque: 2.5 kg-cm @ 5V (lightweight camera load)
  - Speed: 0.12 sec/60°
  - Control: PWM signal from ESP32
- **Gimbal Frame:**
  - Material: 3D-printed ABS plastic (lightweight, 200g total)
  - Bearings: Ball bearings in pan/tilt axes for smooth motion
  - Cable Management: Slip ring connector for continuous pan rotation
  - Mounting: Wall/ceiling bracket with adjustable angle

**C. Autonomous Scanning Modes**

- **Mode 1: Sweep Scan** — Continuous 180° pan with 30° tilt steps (covers entire venue systematically)
- **Mode 2: Zone Focus** — AI detects high-density zones and prioritizes gimbal to point at crowd hotspots
- **Mode 3: Static Monitoring** — Fixed position for specific entry/exit point surveillance
- **Mode 4: Alert Response** — Rapid gimbal repositioning to coordinates of sensor alerts (e.g., metal detector trigger location)

**D. Person Detection & Counting Algorithm**

- **AI Model:** YOLOv8-Nano (optimized for ESP32 edge inference)
  - Model Size: 6MB (fits in ESP32 flash)
  - Inference Time: ~300ms per frame on ESP32 (acceptable for 3 fps AI processing)
  - Detection Classes: 'person' only (COCO dataset pre-trained, fine-tuned for crowd scenarios)
  - Confidence Threshold: 0.6 (balances false positives vs. missed detections)
- **Counting Logic:**
  - **Bounding Box Detection:** YOLO outputs bbox coordinates for each person
  - **Tracking:** Assigns unique IDs to persons across frames (DeepSORT lite tracking)
  - **Entry/Exit Counting:** Virtual line at venue entrance; crossing direction determines +1 (entry) or -1 (exit)
  - **Occupancy Calculation:** Real-time count = Previous count + Entries - Exits
  - **Validation:** Periodic full-frame count to correct cumulative errors
- **Crowd Density Heatmap:**
  - Venue divided into 10x10 grid zones
  - Each zone assigned density score (0-10) based on person count per m²
  - Color coding: Green (low) → Yellow (medium) → Red (high) → Purple (critical)
  - Updated every 10 seconds
  - Dashboard displays real-time heatmap for organizers

**E. Overcapacity Alert System**

- **Thresholds:**
  - **Warning (85% capacity):** Yellow alert to organizers + Slow gate throughput
  - **Critical (95% capacity):** Red alert + Audio announcement + Gate 1 auto-pauses
  - **Full (100% capacity):** Gates locked + "Event Full" display on DVD player + Waitlist mode activated
- **Alert Delivery:**
  - Push notification to organizer mobile app
  - SMS to designated security personnel
  - Email to event administrator
  - Flashing red LED on venue display boards

**F. Night Vision & Lighting**

- **IR LED Array:** 4x high-power 940nm IR LEDs (invisible to human eye)
- **Illumination Range:** 5 meters effective range for person detection
- **Auto Activation:** Light sensor triggers IR LEDs when ambient light <50 lux
- **Power:** 200mA @ 12V (separate IR LED driver circuit)

**Software Architecture:**

```
┌─────────────────────────────────────────────┐
│       ESP32-CAM #2 Firmware Stack           │
├─────────────────────────────────────────────┤
│  ┌───────────────────────────────────────┐  │
│  │   YOLOv8-Nano Inference Engine        │  │
│  │   (TensorFlow Lite Micro)             │  │
│  └───────────────┬───────────────────────┘  │
│                  │ detected persons          │
│  ┌───────────────▼───────────────────────┐  │
│  │   Person Tracking & Counting Module   │  │
│  │   (DeepSORT + Virtual Line Logic)     │  │
│  └───────────────┬───────────────────────┘  │
│                  │ occupancy data            │
│  ┌───────────────▼───────────────────────┐  │
│  │   Heatmap Generator & Alert Engine    │  │
│  │   (Density calculation + Thresholds)  │  │
│  └───────────────┬───────────────────────┘  │
│                  │ analytics + alerts        │
│  ┌───────────────▼───────────────────────┐  │
│  │   MQTT Publisher (Real-Time Stream)   │  │
│  │   Topic: venues/{venueId}/crowd       │  │
│  └───────────────┬───────────────────────┘  │
│                  │                           │
│  ┌───────────────▼───────────────────────┐  │
│  │   Gimbal Control System (PWM Servos)  │  │
│  │   (Zone focus algorithm)              │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
         │
         ▼
   Cloud Dashboard
   (Real-time crowd visualization)
```

**Gimbal Auto-Focus Algorithm:**

```python
# Pseudocode for Zone Focus Mode
while True:
    frame = capture_image()
    persons = yolo_detect(frame)
    zones = divide_into_grid(persons)

    # Find highest density zone
    max_density_zone = max(zones, key=lambda z: z.person_count)

    if max_density_zone.person_count > THRESHOLD:
        # Calculate gimbal angles to center on zone
        pan_angle, tilt_angle = calculate_angles(max_density_zone.center)

        # Move gimbal smoothly
        move_servo(PAN_SERVO, pan_angle)
        move_servo(TILT_SERVO, tilt_angle)

        # Focus on this zone for 30 seconds
        time.sleep(30)
    else:
        # Resume sweep scan
        continue_sweep_pattern()
```

---

#### 4. Comprehensive Sensor Network — Environmental & Security Monitoring

**Purpose:** Multi-layered safety and environmental monitoring to detect hazards, ensure compliance, and enable proactive incident response.

**A. DHT22 Temperature & Humidity Sensor**

**Technical Specifications:**

- **Model:** DHT22 (AM2302) Digital Temperature & Humidity Sensor
- **Temperature Range:** -40°C to +80°C (±0.5°C accuracy)
- **Humidity Range:** 0-100% RH (±2% accuracy)
- **Sampling Rate:** 0.5 Hz (one reading every 2 seconds)
- **Interface:** Single-wire digital signal (proprietary protocol)
- **Power:** 3.3-5V DC, 2.5mA peak current

**Functionality:**

- **Comfort Monitoring:** Alerts when temperature exceeds 28°C or humidity >70% (uncomfortable conditions)
- **Safety Alerts:** Fire detection (rapid temperature rise >5°C/min) triggers alarm + gate auto-open for emergency evacuation
- **HVAC Integration:** Sensor data can control venue air conditioning via relay-triggered thermostats
- **Data Logging:** Readings logged every 5 minutes to Firestore for compliance audits

**Mounting:**

- **Location:** Ceiling-mounted near venue center (represents average conditions)
- **Height:** 2.5 meters above ground
- **Enclosure:** Ventilated ABS housing (allows airflow while protecting sensor)

**Alert Thresholds:**
| Condition | Threshold | Action |
|-----------|-----------|--------|
| High Temp | >30°C | Yellow warning to organizers |
| Critical Temp | >35°C | Red alert + HVAC boost |
| Fire Suspected | +5°C in <1 min | Emergency alert + Gate auto-open |
| High Humidity | >75% RH | HVAC dehumidifier activation |
| Low Humidity | <20% RH | Static risk warning |

---

**B. Metal Detector Module — Security Screening**

**Technical Specifications:**

- **Model:** Inductive Proximity Sensor (Custom pulse-induction metal detector circuit)
- **Detection Range:** 3-5 cm depth (detects concealed weapons, phones, belts)
- **Coil:** 20cm diameter search coil (handheld wand configuration)
- **Sensitivity:** Adjustable 0-10 (calibrated to ignore small metal objects like keys)
- **Interface:** Digital HIGH signal on ESP32 GPIO when metal detected
- **Power:** 12V DC, 500mA peak during pulse emission

**Operational Modes:**

- **Mode 1: Gate Integration** — Metal detector positioned at entry gate; auto-triggers secondary screening alert
- **Mode 2: Random Screening** — Security personnel use handheld wand for spot checks
- **Mode 3: Exit Verification** — Optional exit screening to prevent theft of venue property

**Detection Logic:**

```
Metal detected by inductive coil sensor
         ↓
ESP32 GPIO interrupt triggered
         ↓
Check event security settings:
  - Is metal detection enabled for this event?
  - Is this ticket tier subject to screening?
         ↓
  If YES:
    → Sound prolonged buzzer (3 sec continuous tone)
    → Flash red LED strip
    → Display message: "Please step aside for secondary screening"
    → Send alert to security personnel mobile app (includes camera snapshot)
    → Log incident: timestamp, gate ID, ticket ID (if scanned), detector location
    → Optional: Auto-pause Gate 1 until security clears attendee
         ↓
  If NO (VIP tier / staff / disabled screening):
    → Suppress alert
    → Log detection (for audit purposes only, no action taken)
```

**Calibration:**

- **Setup Mode:** Admin can adjust sensitivity via web dashboard
- **Test Procedure:** Walk through with known metal object; adjust until reliably detected
- **False Positive Reduction:** Ignore signals <50ms duration (noise filtering)

---

**C. MQ-2 Gas Sensor — Smoke & Hazardous Gas Detection**

**Technical Specifications:**

- **Model:** MQ-2 Semiconductor Gas Sensor
- **Detectable Gases:**
  - LPG (Liquified Petroleum Gas)
  - Propane
  - Methane
  - Carbon Monoxide (CO)
  - Smoke (combustion byproducts)
- **Detection Range:** 300 - 10,000 ppm
- **Output:** Analog voltage (0-5V proportional to gas concentration)
- **Response Time:** <10 seconds from exposure to alarm
- **Preheat Time:** 24-48 hours for optimal accuracy (sensor coating stabilization)
- **Power:** 5V DC, 150mA continuous (heating element)

**Safety Applications:**

- **Fire Detection:** Smoke from early-stage fires triggers immediate evacuation alarm
- **Gas Leak Detection:** LPG/propane leaks in venue kitchen or equipment areas
- **Carbon Monoxide Monitoring:** CO poisoning prevention (relevant for indoor events with generators)

**Alert Levels:**
| Gas Concentration (ppm) | Alert Level | Action |
|------------------------|-------------|--------|
| 300-500 | Low | Yellow warning (investigate source) |
| 500-1000 | Medium | Orange alert + Increased ventilation |
| 1000-2000 | High | Red alert + Evacuation warning |
| >2000 | Critical | Emergency evacuation + Fire department notification + Gate auto-open |

**Installation:**

- **Location:** Ceiling-mounted near kitchen/equipment areas (smoke rises)
- **Height:** 0.5 meters from ceiling
- **Ventilation:** Sensor positioned in natural airflow path
- **Backup Power:** Battery backup ensures operation during power failure

**ESP32 Integration:**

```c++
// MQ-2 Reading & Alert Logic (Arduino C++)
int gasLevel = analogRead(MQ2_PIN);  // Read analog voltage
int ppm = map(gasLevel, 0, 1023, 300, 10000);  // Convert to ppm

if (ppm > 2000) {
  // CRITICAL: Emergency evacuation
  activateBuzzer(CONTINUOUS);
  setLEDs(RED, FLASH);
  sendFirebaseAlert("EMERGENCY", "Critical gas level detected");
  openAllGates();  // Auto-open for evacuation
  callFireDepartment();  // Via Twilio SMS API
} else if (ppm > 1000) {
  // HIGH: Evacuation warning
  activateBuzzer(RAPID_PULSE);
  setLEDs(RED, SOLID);
  sendFirebaseAlert("HIGH", "Evacuate venue immediately");
  displayEvacuationMessage();
} else if (ppm > 500) {
  // MEDIUM: Investigate & ventilate
  activateBuzzer(SLOW_PULSE);
  setLEDs(ORANGE, SOLID);
  sendFirebaseAlert("MEDIUM", "Gas detected - increase ventilation");
} else if (ppm > 300) {
  // LOW: Monitor
  setLEDs(YELLOW, SOLID);
  sendFirebaseAlert("LOW", "Gas trace detected - monitor");
}
```

---

**D. 4-Channel Relay Module — Automated Alert & Control System**

**Technical Specifications:**

- **Model:** 4-Channel 5V Relay Module (with optocoupler isolation)
- **Switching Capacity:** 10A @ 250VAC / 10A @ 30VDC per channel
- **Trigger:** Low-level trigger (GPIO LOW = relay ON)
- **Isolation:** Optocoupler between logic and high-voltage circuits (prevents ESP32 damage)
- **Indicator:** On-board LEDs show relay state per channel

**Channel Assignments:**
| Channel | Control Target | Function |
|---------|----------------|----------|
| CH1 | Gate 1 DC Motor | Entry gate open/close control |
| CH2 | Gate 2 DC Motor | Exit gate open/close control |
| CH3 | Emergency Siren | High-decibel alarm for evacuations |
| CH4 | HVAC Fan / Emergency Lighting | Climate control or backup lighting activation |

**Safety Interlocks:**

- **Emergency Override:** In fire/gas alert, CH1 and CH2 automatically energize (gates forced open)
- **Manual Override:** Physical button bypasses ESP32 control for emergency gate operation
- **Failsafe Design:** Relay default state is "de-energized" (gates default to CLOSED unless actively opened)

---

**E. LED Status Indicator Array**

**Specifications:**

- **Count:** 5x RGB LEDs (WS2812B individually addressable)
- **Positions:**
  - LED 1: System Power Status (Green = OK, Red = Power issue)
  - LED 2: WiFi Connectivity (Blue = connected, Red = disconnected)
  - LED 3: QR Scanner Status (Green = ready, Yellow = scanning, Red = error)
  - LED 4: Sensor Network Status (Green = all sensors OK, Red = sensor failure)
  - LED 5: Crowd Status (Green = <70% capacity, Yellow = 70-90%, Red = >90%)
- **Brightness:** Auto-dimming based on ambient light sensor (don't blind attendees at night)

---

**F. High-Decibel Alarm Buzzer**

**Specifications:**

- **Model:** Active Piezo Buzzer (HPA17A series)
- **Sound Pressure Level:** 90dB @ 10cm distance
- **Frequency:** Dual-tone (alternating 2.7kHz and 3.2kHz for urgency)
- **Power:** 12V DC, 50mA
- **Tone Patterns:**
  - **Emergency Evacuation:** Continuous high-low alternating siren (10 sec ON / 2 sec OFF cycle)
  - **Security Alert (Metal Detector):** Rapid triple-beep (100ms x3 with 50ms gaps), repeats every 2 seconds
  - **Gas Alert:** Continuous solid tone (no breaks)
  - **Overcapacity Warning:** Gentle pulsing tone (500ms ON / 500ms OFF)

---

#### 5. Power Management & Connectivity Infrastructure

**A. Power Supply Architecture**

**Main Power (Grid-Connected):**

- **Input:** 230VAC mains power (standard venue electrical supply)
- **Transformer:** Step-down to 12VDC @ 5A (60W capacity)
- **Distribution:**
  - 12V → DC motors (gates)
  - 12V → 5V buck converter → ESP32-CAM modules
  - 12V → Relay modules
  - 12V → DVD player
- **Protection:** 5A fuse, reverse polarity protection diode

**Backup Power (Battery System):**

- **Battery:** 3.7V 5000mAh LiPo battery (18650 cells in 3S1P configuration = 11.1V)
- **Charging:** Solar panel (6V 1W polycrystalline) + TP4056 charge controller
- **UPS Mode:** Auto-switchover on mains failure (ensures gates remain operational)
- **Runtime:** 4-6 hours on battery power (ESP32 + sensors only; gates disabled to conserve power)

**Solar Charging (For Semi-Outdoor Deployments):**

- **Panel:** 6V 1W solar panel (110mm x 60mm)
- **Charge Controller:** TP4056 Li-Ion charger with overcharge/over-discharge protection
- **Charging Time:** 8-10 hours of sunlight for full charge
- **Use Case:** Extends battery life in outdoor venues or reduces grid dependency

---

**B. WiFi & Cloud Connectivity**

**Network Stack:**

- **Protocol:** WiFi 802.11 b/g/n (2.4GHz band, WPA2-PSK encryption)
- **Fallback:** ESP-NOW mesh network (devices communicate peer-to-peer if cloud unavailable)
- **MQTT Broker:** Mosquitto broker hosted on Firebase Cloud Functions
- **Topics:**
  - `venues/{venueId}/gates/{gateId}/status` — Gate operational status
  - `venues/{venueId}/sensors/{sensorType}` — Sensor telemetry
  - `venues/{venueId}/crowd/occupancy` — Real-time crowd count
  - `devices/{deviceId}/commands` — Remote control commands (reboot, config update)

**Data Synchronization:**

- **Upstream (Device → Cloud):**
  - Sensor readings every 30 seconds (temperature, humidity, gas level)
  - Crowd counts every 10 seconds
  - Gate state changes immediately (opened/closed)
  - QR scan events immediately
- **Downstream (Cloud → Device):**
  - Configuration updates (alert thresholds, scanning modes)
  - Remote commands (reboot, firmware update, gate override)
  - Event-specific settings (allowed ticket tiers per gate)

**Offline Resilience:**

- **Local Queue:** ESP32 buffers up to 500 events in flash memory during connectivity loss
- **Auto-Sync:** On reconnection, queued events are uploaded to Firestore in batch
- **Degraded Mode:** QR validation continues using last-synced ticket cache (warns organizer of "offline mode")

---

**C. Remote Device Management**

**OTA (Over-The-Air) Firmware Updates:**

- **Mechanism:** ESP32 downloads firmware binary from Firebase Storage
- **Verification:** SHA-256 checksum validation before flashing
- **Rollback:** Previous firmware version preserved; auto-rollback if new version fails boot
- **Scheduling:** Updates scheduled during venue off-hours (2-4 AM) to avoid disruption

**Remote Diagnostics:**

- **Heartbeat:** Device sends status ping every 60 seconds (WiFi RSSI, battery level, uptime)
- **Logs:** Last 100 log entries stored locally; uploadable to cloud on demand
- **Remote Reboot:** Admin can trigger device reboot via dashboard
- **Camera Preview:** ESP32-CAM #2 can send live snapshot on demand for troubleshooting

---

### IoT Device Types & Capabilities

| Device Type               | Function                                | Hardware                                             | Cloud Integration                            |
| ------------------------- | --------------------------------------- | ---------------------------------------------------- | -------------------------------------------- |
| **Scanner / Access Gate** | QR validation + entry control           | ESP32-CAM #1 + DC motor gate + relay + LED/buzzer    | Real-time ticket validation, entry logging   |
| **Turnstile Controller**  | High-throughput automated entry         | Motorized turnstile + ESP32 + RFID reader (optional) | Ticket validation + throughput analytics     |
| **Crowd Monitor**         | Occupancy tracking + density heatmaps   | ESP32-CAM #2 + 2-axis gimbal + AI inference          | Real-time crowd data + occupancy alerts      |
| **Display Board**         | Event information + alerts              | DVD player + ESP32 IR controller + LCD               | Remote content update + emergency messaging  |
| **Environmental Sensor**  | Temperature + humidity + gas monitoring | DHT22 + MQ-2 + ESP32                                 | Environmental data logging + safety alerts   |
| **Security Checkpoint**   | Metal detection screening               | Metal detector coil + ESP32 + alert system           | Security incident logging + personnel alerts |

---

### Real-Time Device Monitoring Dashboard

**For each connected device, organizers and admins see:**

| Metric                                    | Update Frequency      | Purpose                    |
| ----------------------------------------- | --------------------- | -------------------------- |
| **Status** (Online/Offline/Maintenance)   | Real-time (WebSocket) | Device availability        |
| **Last Ping**                             | Real-time             | Connection health          |
| **Battery Level**                         | Every 5 minutes       | Power management           |
| **Firmware Version**                      | On status update      | Update compliance tracking |
| **Scans Today** (for scanners)            | Every scan            | Entry throughput metrics   |
| **Current Occupancy** (for crowd monitor) | Every 10 seconds      | Capacity management        |
| **Temperature** (for env sensors)         | Every 2 minutes       | Climate monitoring         |
| **Gas Level** (for MQ-2)                  | Every 30 seconds      | Safety monitoring          |
| **WiFi Signal Strength (RSSI)**           | Every 60 seconds      | Network health             |
| **Uptime**                                | Continuous            | Reliability metric         |

**Device Health Alerts:**

- **Offline >5 minutes:** Yellow warning (connectivity issue)
- **Battery <20%:** Orange alert (charge device)
- **Battery <10%:** Red alert (imminent shutdown)
- **Firmware outdated:** Blue notification (update available)
- **Sensor failure:** Red alert (DHT22/MQ-2 reading error)

---

### Web-Based Scanner (Fallback / Supplementary)

For venues without dedicated hardware or as a supplementary scanning option, FlowGateX includes a **browser-based QR scanner**:

**Access:** `/organizer/scan` (role: Organizer or Admin)

**Technology:**

- **Camera API:** `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })`
- **QR Library:** `html5-qrcode` (Zxing-based decoder)
- **Validation:** Same SHA-256 verification pipeline as hardware scanner
- **UI:** Full-screen camera preview with auto-focus box, torch toggle (if supported)

**Features:**

- **Real-Time Feedback:** Green check / red X overlay on scan result
- **Scan Log:** List of recent scans with timestamp and result
- **Offline Support:** Queue scans locally; sync when connected
- **Multi-Device:** Multiple organizers can scan simultaneously

---

## 🔐 Security Architecture

### Cryptographic QR Ticket Security

Every ticket issued by FlowGateX is protected by a multi-layer security mechanism:

1. **Payload Construction:** `ticketId` + `userId` + `eventId` + `transactionId` + `bookingId` + `timestamp` + `gateAccessLevel`
2. **SHA-256 Hashing:** The payload is hashed using the Web Crypto API (`crypto.subtle.digest`)
3. **Tamper-Proof Encoding:** Payload and hash are combined, then Base64-encoded into the QR code
4. **Verification on Scan:** The hash is recomputed from the decoded payload and compared — any modification invalidates the ticket
5. **Regeneration Support:** Tickets can be regenerated with new QR codes (old ones are instantly invalidated), with a `regeneratedCount` tracker
6. **Expiry Enforcement:** QR codes have embedded expiry timestamps; expired tickets are auto-rejected even if otherwise valid

### Platform Security

| Layer                 | Implementation                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| **Authentication**    | Firebase Auth with Email/Password + Google OAuth + Facebook OAuth                                 |
| **Firestore Rules**   | Role-based read/write with `isAdmin()`, `isOwner()`, `canAccessDevice()` helper functions         |
| **Storage Security**  | File type validation, size limits (2MB avatars, 5MB event images), ownership enforcement          |
| **App Check**         | ReCAPTCHA v3 integration for bot protection                                                       |
| **Route Protection**  | `ProtectedRoute` (auth + maintenance mode) and `RoleRoute` (auth + role + permissions) components |
| **Self-Healing Auth** | Auto-creates missing Firestore profiles on login to prevent broken states                         |
| **Feature Flags**     | Platform-level toggles for registration, event creation, IoT, AI chatbot, social login, analytics |
| **Device Auth**       | Each IoT device has unique API key stored in ESP32 flash (never transmitted in plaintext)         |
| **MQTT TLS**          | End-to-end encryption for all IoT-cloud communication                                             |
| **Audit Trail**       | All IoT commands, sensor alerts, and gate operations logged to `audit_logs` collection            |

---

## 🛠️ Technology Stack

### Frontend

| Technology                          | Purpose                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| **React 18** + **TypeScript**       | UI framework with full type safety                                              |
| **Vite**                            | Lightning-fast build tool and dev server                                        |
| **Tailwind CSS** + **Material UI**  | Utility-first styling with enterprise component library                         |
| **Zustand**                         | Lightweight state management (Auth, Theme, Cart, Sidebar, Settings, IoT stores) |
| **TanStack React Query**            | Server state management with caching and background refetching                  |
| **React Hook Form** + **Zod**       | Performant form handling with schema-based validation                           |
| **Framer Motion**                   | Fluid animations and page transitions                                           |
| **Chart.js** + **D3.js**            | Interactive data visualization (revenue trends, crowd heatmaps)                 |
| **html5-qrcode** + **qrcode.react** | QR scanning (camera-based) and QR code generation                               |
| **Fuse.js**                         | Client-side fuzzy search                                                        |
| **dayjs**                           | Date/time manipulation with timezone support                                    |

### Backend & Cloud Services

| Service                     | Purpose                                               |
| --------------------------- | ----------------------------------------------------- |
| **Firebase Authentication** | Multi-provider auth (Email, Google, Facebook)         |
| **Cloud Firestore**         | NoSQL real-time database (12+ collections)            |
| **Firebase Storage**        | Secure file storage with size/type enforcement        |
| **Firebase Functions**      | Serverless backend (payment webhooks, IoT management) |
| **Firebase Hosting**        | Production deployment target                          |
| **Razorpay**                | Primary payment gateway (client-side checkout)        |
| **Cashfree**                | Secondary payment gateway (server-side orders)        |
| **MQTT Broker (Mosquitto)** | Real-time IoT device communication                    |
| **Twilio**                  | SMS alerts for security incidents                     |

### IoT & Embedded

| Technology                | Purpose                                             |
| ------------------------- | --------------------------------------------------- |
| **Arduino Framework**     | ESP32 firmware development                          |
| **ESP32-CAM**             | Camera modules for QR scanning and crowd monitoring |
| **YOLOv8-Nano**           | Edge AI person detection                            |
| **TensorFlow Lite Micro** | AI inference on ESP32                               |
| **ESP-NOW**               | Peer-to-peer mesh networking (offline resilience)   |
| **MQTT (Paho)**           | Cloud-device messaging protocol                     |
| **mbedTLS**               | Cryptographic library for SHA-256 hashing           |
| **OTA Updates**           | Remote firmware deployment                          |

### DevOps & Quality

| Tool                                       | Purpose                                               |
| ------------------------------------------ | ----------------------------------------------------- |
| **Docker** + **nginx**                     | Containerized multi-stage production deployment       |
| **Netlify** / **Vercel**                   | Alternative deployment targets with edge optimization |
| **Vitest** + **Testing Library** + **MSW** | Unit testing with API mocking                         |
| **ESLint** + **Prettier**                  | Code quality and formatting enforcement               |
| **Husky** + **lint-staged**                | Pre-commit hooks for automated quality gates          |
| **Workbox (PWA)**                          | Service worker caching for offline capability         |

---

## 📱 User Experience Highlights

### For Attendees

- **Discover** events through intelligent search, category browsing, trending collections, and capacity indicators
- **Book securely** with multi-tier ticket selection, promo codes, dual payment gateway support
- **Receive** cryptographically signed QR tickets synced across all devices with expiry info
- **Enter** events with instant QR validation — scan and walk through in <2 seconds
- **Monitor** venue crowding in real-time (some events may display live occupancy %)
- **Manage** bookings, favorites, wallet, and profile from a personalized dashboard

### For Organizers

- **Create** events with an intuitive 8-step wizard (Google Maps venue integration, IoT device assignment)
- **Manage** ticket tiers, promo codes, attendee lists, and gate access permissions in real-time
- **Monitor** IoT infrastructure — see gate status, battery levels, firmware versions, scan counts, and sensor readings
- **View** live crowd heatmaps and occupancy metrics (powered by ESP32-CAM #2 AI monitoring)
- **Scan** tickets directly from browser or through connected ESP32-CAM hardware
- **Analyze** revenue trends, attendance patterns, entry/exit throughput, and crowd density with interactive dashboards
- **Receive** proactive alerts for safety incidents (gas detection, overcrowding, metal detector triggers)
- **Process** refunds with automated cascade (booking → transaction → tickets → inventory)

### For Security Personnel

- **Monitor** real-time alerts from metal detectors, gas sensors, and crowd monitoring systems
- **View** live camera feeds from ESP32-CAM #2 with gimbal control
- **Respond** to incidents with precise location data (which gate, sensor, or zone triggered alert)
- **Review** incident logs with timestamps, camera snapshots, and sensor readings

### For Admins

- **Govern** the platform with granular RBAC (40+ permissions across 12 resource domains)
- **Moderate** events, approve organizers, manage user accounts, and configure IoT devices
- **Configure** platform settings, payment parameters, security policies, feature flags, and IoT thresholds
- **Monitor** system health through admin dashboards, device uptime reports, and audit logs
- **Deploy** firmware updates to all ESP32 devices remotely with version rollback capability

### For Super Admins

- **Bypass** all permission checks with unconditional system-wide access
- **Manage** admin roles and escalate/revoke platform-level privileges
- **Override** feature flags, platform locks, and emergency configurations in real time

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER (Web + Mobile)                         │
│                                                                               │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌──────────┐  ┌─────────┐ │
│  │  React   │  │   Zustand    │  │   React    │  │   PWA    │  │  Push   │ │
│  │  18 +    │  │   Stores     │  │   Query    │  │  Service │  │  Notif. │ │
│  │TypeScript│  │  (6 stores)  │  │ (caching)  │  │  Worker  │  │  (FCM)  │ │
│  └──────────┘  └──────────────┘  └────────────┘  └──────────┘  └─────────┘ │
│                                                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        Feature Modules                                │  │
│  │  Auth │ Events │ Booking │ Payment │ IoT │ Analytics │ Crowd Monitor  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬───────────────────────────────────────────────┘
                                │
                      ══════════╧══════════
                       Firebase SDK +
                        REST APIs +
                       WebSocket (IoT)
                      ═══════════════════════
                                │
┌───────────────────────────────┴───────────────────────────────────────────────┐
│                       CLOUD LAYER (Firebase + Functions)                      │
│                                                                               │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌──────────────┐ │
│  │   Firebase    │  │    Cloud      │  │    Firebase   │  │   Firebase   │ │
│  │     Auth      │  │  Firestore    │  │    Storage    │  │   Functions  │ │
│  │  (3 providers)│  │ (12+ colls)   │  │  (5 buckets)  │  │ (Serverless) │ │
│  └───────────────┘  └───────┬───────┘  └───────────────┘  └──────────────┘ │
│                             │                                                │
│  ┌───────────────┐  ┌───────┴───────┐  ┌───────────────┐  ┌──────────────┐ │
│  │   Razorpay    │  │  Real-Time    │  │    Cashfree   │  │     MQTT     │ │
│  │   Gateway     │  │  Listeners    │  │    Gateway    │  │    Broker    │ │
│  └───────────────┘  └───────┬───────┘  └───────────────┘  └──────┬───────┘ │
└────────────────────────────┬┼──────────────────────────────────────┼─────────┘
                             ││                                      │
                   ══════════╧╧══════════                  ══════════╧═════════
                    Real-Time Firestore                     MQTT over TLS
                         Sync                                (Port 8883)
                   ═══════════════════════                 ══════════════════
                             ││                                      │
┌────────────────────────────┴┴──────────────────────────────────────┴─────────┐
│                      IoT DEVICE LAYER (ESP32 Ecosystem)                      │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                  GATE CONTROL SYSTEM (Entry/Exit)                   │    │
│  │  ┌────────────────┐  ┌────────────────┐  ┌─────────────────────┐   │    │
│  │  │ ESP32-CAM #1   │  │  2x DC Motor   │  │  4-CH Relay Module  │   │    │
│  │  │ (QR Scanner)   │  │  Gates + Enc   │  │  (Gate + Alert Ctrl)│   │    │
│  │  │ + LED/Buzzer   │  │  (12V, 10kg-cm)│  │  (10A switching)    │   │    │
│  │  └────────────────┘  └────────────────┘  └─────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │              AI CROWD MONITORING (Computer Vision)                  │    │
│  │  ┌────────────────┐  ┌────────────────┐  ┌─────────────────────┐   │    │
│  │  │ ESP32-CAM #2   │  │  2-Axis Gimbal │  │  YOLOv8-Nano AI     │   │    │
│  │  │ (Person Detect)│  │  (Pan/Tilt)    │  │  (Person Counting)  │   │    │
│  │  │ + Night Vision │  │  MG996R + SG90 │  │  + Density Heatmap  │   │    │
│  │  └────────────────┘  └────────────────┘  └─────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    SENSOR NETWORK (Safety & Environment)            │    │
│  │  ┌────────────────┐  ┌────────────────┐  ┌─────────────────────┐   │    │
│  │  │  DHT22 Sensor  │  │ Metal Detector │  │  MQ-2 Gas Sensor    │   │    │
│  │  │  (Temp+Humid)  │  │ (Induction)    │  │  (Smoke+LPG+CO)     │   │    │
│  │  │  ESP32 Control │  │  + ESP32 GPIO  │  │  + ESP32 ADC Read   │   │    │
│  │  └────────────────┘  └────────────────┘  └─────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                   DISPLAY & INFORMATION SYSTEMS                     │    │
│  │  ┌────────────────┐  ┌────────────────┐  ┌─────────────────────┐   │    │
│  │  │  DVD Player    │  │  LED Status    │  │  High-Decibel       │   │    │
│  │  │  (Event Info)  │  │  Array (5x RGB)│  │  Alarm Buzzer       │   │    │
│  │  │  ESP32 IR Ctrl │  │  WS2812B Strip │  │  (90dB Emergency)   │   │    │
│  │  └────────────────┘  └────────────────┘  └─────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                   POWER & CONNECTIVITY                              │    │
│  │  ┌────────────────┐  ┌────────────────┐  ┌─────────────────────┐   │    │
│  │  │  12V DC Supply │  │ LiPo Battery   │  │  WiFi 2.4GHz +      │   │    │
│  │  │  (5A, 60W)     │  │ (11.1V 5Ah)    │  │  ESP-NOW Mesh       │   │    │
│  │  │  + Solar Panel │  │  + TP4056 Chg  │  │  (Offline Fallback) │   │    │
│  │  └────────────────┘  └────────────────┘  └─────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Architecture

### Firestore Collections

| Collection       | Path                | Purpose                                                        |
| ---------------- | ------------------- | -------------------------------------------------------------- |
| **Users**        | `users/{uid}`       | Profiles, roles, preferences, security settings                |
| **Events**       | `events/{id}`       | Event details, ticket tiers, venue, organizer info, IoT config |
| **Bookings**     | `bookings/{id}`     | User bookings with ticket and attendee details                 |
| **Tickets**      | `tickets/{id}`      | Individual tickets with QR data and scan status                |
| **Transactions** | `transactions/{id}` | Payment records with fee breakdowns                            |
| **Devices**      | `devices/{id}`      | IoT device configuration and real-time status                  |
| **Sensors**      | `sensors/{id}`      | Sensor telemetry data (temperature, gas, etc.)                 |
| **Crowd Data**   | `crowd/{venueId}`   | Real-time occupancy and density data                           |
| **Cart**         | `cart/{uid}`        | Real-time synced shopping cart per user                        |
| **Settings**     | `SettingInfo/{doc}` | Platform and organization-level configuration                  |
| **Promo Codes**  | `promo_codes/{id}`  | Promotional code definitions and usage tracking                |
| **Audit Logs**   | `audit_logs/{id}`   | System activity, security events, IoT commands                 |

### Firebase Storage Buckets

| Path                     | Content                                 | Limit |
| ------------------------ | --------------------------------------- | ----- |
| `/users/{uid}/profile/*` | Profile avatars                         | 2 MB  |
| `/events/{eventId}/*`    | Event cover images and galleries        | 5 MB  |
| `/tickets/{ticketId}/*`  | Generated QR code images                | —     |
| `/documents/{userId}/*`  | Private documents (backend access only) | —     |
| `/public/*`              | General platform assets                 | —     |
| `/firmware/*`            | ESP32 firmware binaries for OTA updates | 2 MB  |

---

## 🌐 Deployment Architecture

FlowGateX supports **multi-target deployment** for maximum flexibility:

| Target               | Configuration               | Use Case                              |
| -------------------- | --------------------------- | ------------------------------------- |
| **Firebase Hosting** | `firebase.json`             | Primary production deployment         |
| **Docker + nginx**   | `Dockerfile` + `nginx.conf` | Containerized deployment, self-hosted |
| **Netlify**          | `netlify.toml`              | Edge-optimized CDN deployment         |
| **Vercel**           | `vercel.json`               | Serverless edge deployment            |

---

## 🔄 Complete Event Lifecycle with IoT Integration

```
   ┌──────────┐     ┌───────────┐     ┌──────────────┐
   │ DISCOVER │ ──▶ │   BOOK    │ ──▶ │    PAY       │
   │  Events  │     │  Tickets  │     │  (Razorpay/  │
   │  Search  │     │  Select   │     │   Cashfree)  │
   │  Browse  │     │  Tiers    │     │              │
   └──────────┘     └───────────┘     └──────┬───────┘
                                             │
                                             ▼
   ┌──────────┐     ┌───────────┐     ┌──────────────┐
   │  ENTER   │ ◀── │  RECEIVE  │ ◀── │   CONFIRM    │
   │  Venue   │     │  QR Code  │     │   Booking    │
   │  (ESP32  │     │  (SHA-256 │     │   Generate   │
   │  Scan)   │     │  Signed)  │     │   Tickets    │
   └────┬─────┘     └───────────┘     └──────────────┘
        │
        ▼
   ┌────────────────────────────────────────────────┐
   │         GATE VALIDATION PIPELINE               │
   │  ESP32-CAM #1 QR Scan → SHA-256 Verify →      │
   │  Firestore Check → Relay Trigger → Gate Open  │
   └────────────────────────────────────────────────┘
        │
        ▼
   ┌────────────────────────────────────────────────┐
   │        REAL-TIME MONITORING & SAFETY           │
   │  ESP32-CAM #2 (Crowd Count + Density Heat) →  │
   │  DHT22 (Temp/Humidity) → MQ-2 (Gas Level) →   │
   │  Metal Detector (Security) → Alert System     │
   └────────────────────────────────────────────────┘
        │
        ▼
   ┌────────────────────────────────────────────────┐
   │            ANALYTICS & INSIGHTS                │
   │  Gate Throughput │ Occupancy Trends │         │
   │  Revenue Metrics │ Safety Incidents │         │
   │  Crowd Heatmaps  │ Device Health    │         │
   └────────────────────────────────────────────────┘
```

---

## 💡 Innovation Highlights

| Innovation                       | Impact                                                                                                                                                           |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **IoT-Software Convergence**     | First platform to unify digital ticketing with ESP32-powered physical access control, crowd monitoring, and comprehensive sensor networks in a single ecosystem  |
| **AI-Powered Crowd Management**  | YOLOv8-Nano person detection on ESP32-CAM enables real-time occupancy tracking, density heatmaps, and overcapacity prevention                                    |
| **Dual ESP32-CAM Architecture**  | Dedicated cameras for QR validation (CAM #1) and AI crowd analytics (CAM #2) enable simultaneous entry control and venue intelligence                            |
| **2-Axis Gimbal Vision System**  | Robotic pan/tilt camera automatically focuses on high-density crowd zones for proactive safety monitoring                                                        |
| **Cryptographic QR Security**    | SHA-256 hashed, Base64-encoded tickets that are mathematically impossible to forge or duplicate                                                                  |
| **Atomic Inventory**             | Firestore transactions eliminate race conditions — no overselling, even under peak concurrent load                                                               |
| **Multi-Layered Safety Network** | DHT22 temperature, MQ-2 gas, and metal detector create comprehensive threat detection with automated response (gate auto-open on fire/gas alert)                 |
| **Automated Gate Control**       | DC motor-driven gates with relay control respond to valid QR scans in <2 seconds, with IR safety sensors                                                         |
| **Real-Time Everything**         | Live device monitoring, crowd density, sensor telemetry, cart sync, settings propagation via Firestore + MQTT                                                    |
| **Self-Healing Authentication**  | Automatically recovers from broken states by regenerating missing user profiles                                                                                  |
| **4-Tier Permission Engine**     | Streamlined RBAC with account status, Super Admin override, feature flags, org policies, and role defaults — covering Attendee → Organizer → Admin → Super Admin |
| **Offline-First IoT**            | Devices queue scans locally during connectivity loss and sync when back online; ESP-NOW mesh for peer-to-peer communication                                      |
| **Progressive Enhancement**      | Full PWA support — installable, offline-capable, and responsive across all devices                                                                               |
| **OTA Firmware Updates**         | Remote firmware deployment to all ESP32 devices with SHA-256 verification and automatic rollback on failure                                                      |
| **DVD Player Integration**       | Repurposed LCD DVD player controlled by ESP32 IR blaster for dynamic event information display at gates                                                          |
| **Solar + Battery Backup**       | Hybrid power system ensures IoT infrastructure remains operational during grid failures                                                                          |

---

## 📈 Scalability & Enterprise Readiness

- **Horizontal Scaling:** Firestore auto-scales with demand — no manual provisioning required
- **Multi-Deployment:** Docker, Firebase, Netlify, and Vercel support enables deployment flexibility across any infrastructure
- **Feature Flags:** Toggle platform capabilities (registration, IoT, analytics, AI chatbot, crowd monitoring) without code deployment
- **Modular Architecture:** Feature-based folder structure allows independent development and deployment of modules
- **Code Splitting:** React.lazy + Suspense ensures only needed code is loaded, maintaining performance at scale
- **Caching Strategy:** React Query with 5-minute stale times and Workbox service worker caching for optimal performance
- **Audit Trail:** Comprehensive logging via `audit_logs` collection for compliance, debugging, and incident forensics
- **IoT Device Scalability:** MQTT broker + ESP-NOW mesh enables hundreds of devices per venue without performance degradation
- **Edge AI Processing:** On-device YOLOv8 inference eliminates cloud latency and bandwidth costs for crowd monitoring

---

## 🎬 Built for Demonstration

FlowGateX is designed to showcase the full potential of IoT-integrated event management with hardware-software synergy:

- **Live QR Scanning Demo:** Scan a generated ticket QR code with ESP32-CAM #1 and watch the relay trigger, gate open, and entry log update in real-time on the dashboard
- **Device Monitoring Demo:** Connect multiple devices and observe live status (online/offline), battery levels, sensor readings, and scan counts updating in real-time
- **Crowd Analytics Demo:** Walk in front of ESP32-CAM #2 and watch the AI detect persons, increment occupancy count, and update the crowd heatmap on the dashboard
- **Gimbal Tracking Demo:** Observe the 2-axis gimbal automatically pan and tilt to focus on high-density zones in the venue
- **Safety Alert Demo:** Trigger the MQ-2 gas sensor (with lighter flame near sensor) and watch the emergency alarm activate, gates auto-open, and alert sent to dashboard
- **Metal Detector Demo:** Pass a metal object near the inductive coil and observe the buzzer alert, LED flash, and security notification
- **Automated Gate Demo:** Watch DC motor gates open on valid QR scan, remain open for 5 seconds with visual countdown, then auto-close with safety sensor check
- **End-to-End Flow:** Create an event → Configure IoT devices → Book a ticket → Generate QR → Scan at ESP32-CAM gate → See analytics + crowd data update — all in one seamless demonstration
- **Security Demo:** Attempt to modify a QR code and watch the SHA-256 hash verification reject the tampered ticket instantly with red LED + error buzzer
- **Temperature Alert Demo:** Use heat source near DHT22 sensor to simulate fire condition and watch the rapid-temperature-rise detection trigger evacuation protocol

---

## 👨‍💻 About the Developer

FlowGateX is a solo full-stack engineering project that demonstrates expertise across:

- **Frontend Engineering:** React, TypeScript, state management, responsive UI/UX design
- **Backend Architecture:** Firebase services, real-time databases, cloud storage, authentication, serverless functions
- **IoT Prototyping:** ESP32-CAM programming, QR code scanning hardware, motorized gate control, sensor integration, device-cloud communication
- **Embedded AI:** YOLOv8-Nano deployment on ESP32, TensorFlow Lite Micro optimization, real-time person detection
- **Robotics:** 2-axis gimbal control with servo motors, autonomous zone-tracking algorithms
- **Payment Integration:** Multi-gateway payment processing with Razorpay and Cashfree
- **Security Engineering:** Cryptographic ticket verification, RBAC systems, secure authentication flows, tamper detection
- **DevOps:** Docker containerization, multi-platform deployment, CI/CD with pre-commit hooks, OTA firmware updates

---

## 📋 Quick Facts

| Attribute                 | Value                                   |
| ------------------------- | --------------------------------------- |
| **Platform Type**         | Progressive Web Application (PWA)       |
| **Version**               | 2.0.0                                   |
| **Status**                | Production Ready + IoT Prototype        |
| **Frontend**              | React 18 + TypeScript + Vite            |
| **Database**              | Cloud Firestore (NoSQL, real-time)      |
| **Authentication**        | Firebase Auth (Email, Google, Facebook) |
| **Payment**               | Razorpay + Cashfree                     |
| **IoT Hardware**          | 2x ESP32-CAM + DC Motors + Sensors      |
| **AI**                    | YOLOv8-Nano (person detection)          |
| **Gimbal**                | 2-axis servo-controlled robotic holder  |
| **Sensors**               | DHT22, MQ-2, Metal Detector             |
| **Power**                 | 12V DC + LiPo battery + Solar charging  |
| **Connectivity**          | WiFi 2.4GHz + MQTT + ESP-NOW mesh       |
| **User Roles**            | 4-tier hierarchical RBAC                |
| **Permissions**           | 40+ granular permissions                |
| **Event Categories**      | 12 categories                           |
| **Firestore Collections** | 12+ collections                         |
| **Deployment Targets**    | Firebase, Docker, Netlify, Vercel       |
| **Testing**               | Vitest + Testing Library + MSW          |
| **Code Quality**          | ESLint + Prettier + Husky               |

---

> **FlowGateX** — Transforming event access from a bottleneck into an intelligent, safe, and seamless experience.  
> _Enterprise-grade platform. IoT-powered gates. AI crowd monitoring. Cryptographic security. Real-time intelligence._

---

_© 2026 FlowGateX. All rights reserved._
