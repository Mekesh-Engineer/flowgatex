# Ai_heatmap.tsx — ESP32-CAM AI People Detection & Heatmap Dashboard

> **Component File:** `src/components/iot/Ai_heatmap.tsx`
> **Parent:** `IoTDevicesPage.tsx` → Device Detail Panel → Tab: "Live Heatmap"
> **Tab Icon:** 🔥
> **Prerequisite:** `Gateway.tsx` must be connected first (provides `esp32Url` prop)
> **Hardware:** ESP32-CAM (OV2640 sensor) + Roboflow YOLOv8-Nano inference
> **Theme:** Dark, tactical operations aesthetic — neon accents on deep navy background

---

## 1. System Overview

The AI Heatmap Dashboard is a real-time people detection and crowd density visualization system. It chains together three layers of technology:

```
LAYER 1 — CAPTURE
  ESP32-CAM (OV2640 lens)
  ↓ Captures JPEG frame (320×240 or 640×480)
  ↓ Every 2–3 seconds (inference rate limited by ESP32 memory)

LAYER 2 — INFERENCE
  ESP32 sends frame to Roboflow Hosted API
  ↓ POST https://detect.roboflow.com/{model}/{version}
  ↓ YOLOv8-Nano model (trained on people detection dataset)
  ↓ Returns JSON: bounding boxes + confidence scores
  ↓ ESP32 maps detections → 8×10 spatial zone grid
  ↓ Stores result in memory, serves at /heatmap endpoint

LAYER 3 — VISUALIZATION
  Ai_heatmap.tsx polls http://{esp32Url}/heatmap every 3s
  ↓ Canvas renders 8×10 heat grid with radial gradient cells
  ↓ SVG overlay renders bounding boxes (Raw Detection View)
  ↓ Stats bar, zone breakdown, peak counter update
  ↓ WebSocket receives push if browser is on same network
```

This creates a live, organizer-facing crowd intelligence dashboard embedded inside the FlowGateX IoT Devices page — no separate app or screen required.

---

## 2. Hardware: ESP32-CAM Module

### Module Specifications

```
Board:          AI-Thinker ESP32-CAM
MCU:            ESP32-S (dual-core 240MHz, 520KB SRAM)
Camera:         OV2640 image sensor
Resolutions:    QQVGA (160×120) up to UXGA (1600×1200)
Flash LED:      Built-in white LED (GPIO 4) — for low light
PSRAM:          4MB (critical — required for image buffering)
WiFi:           802.11 b/g/n 2.4GHz
No USB:         Requires FTDI adapter for flashing
Power:          5V via VIN (3.3V logic — do NOT exceed)
```

### Why ESP32-CAM for this system

The OV2640 sensor captures JPEG-compressed frames directly in hardware, reducing the ESP32's memory burden. The 4MB PSRAM allows buffering full frames without fragmenting the 520KB internal SRAM. At 320×240 resolution, a JPEG frame compresses to ~8–15KB — small enough to POST to Roboflow's API over WiFi in under 500ms per request.

### Camera Pin Configuration (AI-Thinker layout)

```cpp
// OV2640 camera pin config for AI-Thinker ESP32-CAM
camera_config_t config;
config.ledc_channel  = LEDC_CHANNEL_0;
config.ledc_timer    = LEDC_TIMER_0;
config.pin_d0        = 5;
config.pin_d1        = 18;
config.pin_d2        = 19;
config.pin_d3        = 21;
config.pin_d4        = 36;
config.pin_d5        = 39;
config.pin_d6        = 34;
config.pin_d7        = 35;
config.pin_xclk      = 0;
config.pin_pclk      = 22;
config.pin_vsync     = 25;
config.pin_href      = 23;
config.pin_sscb_sda  = 26;
config.pin_sscb_scl  = 27;
config.pin_pwdn      = 32;
config.pin_reset     = -1;  // Software reset only
config.xclk_freq_hz  = 20000000;
config.pixel_format  = PIXFORMAT_JPEG;

// Use PSRAM for larger frames when available
if (psramFound()) {
  config.frame_size   = FRAMESIZE_VGA;   // 640×480
  config.jpeg_quality = 12;              // 0–63, lower = better quality
  config.fb_count     = 2;              // Double buffer in PSRAM
} else {
  config.frame_size   = FRAMESIZE_QVGA; // 320×240 (fallback without PSRAM)
  config.jpeg_quality = 20;
  config.fb_count     = 1;
}
```

---

## 3. Roboflow Model — Training & Integration

### Model Architecture

```
Model:      YOLOv8-Nano (smallest YOLO v8 variant)
Task:       Object Detection → class: "person"
Dataset:    Roboflow Universe "People Detection" dataset
            + custom frames from venue/gate environment
Training:   Roboflow Train (cloud) — 50 epochs, 640px input
Export:     Roboflow Hosted API (no local inference needed)
            ↳ No TFLITE on ESP32-CAM — API handles compute
Latency:    ~80–200ms per frame (Roboflow API round-trip)
Accuracy:   mAP@0.5 ≈ 0.72 (on venue/indoor scenes)
```

### Why Roboflow Hosted API (not on-device TFLite)

Running YOLOv8-Nano locally on ESP32 requires quantization to INT8 TFLite. Even at INT8, the model is ~1.5MB and inference takes 3–8 seconds per frame on the ESP32's Xtensa cores — too slow for real-time use. The Roboflow Hosted API offloads all compute to Roboflow's GPU servers, reducing ESP32 work to: capture JPEG → HTTP POST → parse JSON response. This is 10× faster in practice.

### Roboflow API Call from ESP32

```cpp
// Called every 2s from inference task
void runRoboflowInference() {
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed");
    return;
  }

  // Base64-encode JPEG frame for API transmission
  String encoded = base64::encode(fb->buf, fb->len);
  esp_camera_fb_return(fb);  // Release frame buffer IMMEDIATELY

  // Build HTTP POST to Roboflow
  HTTPClient http;
  String apiUrl = "https://detect.roboflow.com/"
                  + String(ROBOFLOW_MODEL) + "/"
                  + String(ROBOFLOW_VERSION)
                  + "?api_key=" + ROBOFLOW_API_KEY
                  + "&confidence=" + String(int(roboflowThreshold * 100))
                  + "&overlap=30"           // NMS overlap threshold
                  + "&format=json";

  http.begin(apiUrl);
  http.addHeader("Content-Type", "application/x-www-form-urlencoded");

  unsigned long t = millis();
  int httpCode = http.POST("image=" + encoded);
  lastInferenceMs = millis() - t;

  if (httpCode == 200) {
    String response = http.getString();
    parseRoboflowResponse(response);  // Updates heatmapGrid[] and roboflowResults[]
  } else {
    Serial.printf("Roboflow error: HTTP %d\n", httpCode);
    inferenceErrorCount++;
  }

  http.end();
}
```

### Roboflow Response JSON Shape

```json
{
  "time": 0.142,
  "image": { "width": 640, "height": 480 },
  "predictions": [
    {
      "x": 320.5,
      "y": 240.1,
      "width": 85.2,
      "height": 210.6,
      "confidence": 0.876,
      "class": "person",
      "class_id": 0,
      "detection_id": "det_001"
    },
    {
      "x": 128.3,
      "y": 198.7,
      "width": 72.1,
      "height": 195.3,
      "confidence": 0.731,
      "class": "person",
      "class_id": 0,
      "detection_id": "det_002"
    }
  ]
}
```

### Bounding Box → 8×10 Zone Grid Mapping

```cpp
void parseRoboflowResponse(String jsonStr) {
  StaticJsonDocument<4096> doc;
  deserializeJson(doc, jsonStr);

  int frameW = doc["image"]["width"];
  int frameH = doc["image"]["height"];

  // Clear grid
  memset(heatmapGrid, 0, sizeof(heatmapGrid));
  roboflowResults.clear();
  totalOccupancy = 0;

  JsonArray predictions = doc["predictions"];
  for (JsonObject pred : predictions) {
    float confidence = pred["confidence"];
    if (confidence < roboflowThreshold) continue;

    float cx = pred["x"];   // Bounding box center x (pixels)
    float cy = pred["y"];   // Bounding box center y (pixels)

    // Map pixel coordinates → 8-row × 10-column grid indices
    //   Grid column = floor(cx / frameW × 10)
    //   Grid row    = floor(cy / frameH × 8)
    int col = constrain((int)(cx / frameW * 10), 0, 9);
    int row = constrain((int)(cy / frameH * 8), 0, 7);

    heatmapGrid[row][col]++;
    totalOccupancy++;

    // Store for raw detection view
    DetectionResult r;
    r.x          = (cx / frameW) * 100;          // Convert to %
    r.y          = (cy / frameH) * 100;
    r.width      = (pred["width"].as<float>() / frameW) * 100;
    r.height     = (pred["height"].as<float>() / frameH) * 100;
    r.confidence = confidence;
    roboflowResults.push_back(r);
  }

  // Update peak tracker
  if (totalOccupancy > peakOccupancyToday) {
    peakOccupancyToday = totalOccupancy;
    peakOccupancyTime  = getISO8601();
  }
}
```

---

## 4. Component Props & State Interface

```typescript
// Ai_heatmap.tsx

interface AiHeatmapProps {
  deviceId: string; // Firestore device ID (e.g. "SCAN-001")
  esp32Url: string | null; // Base URL from Gateway.tsx (e.g. "http://192.168.4.1")
  sensitivity?: 'low' | 'medium' | 'high'; // Default: 'medium'
}

interface HeatmapState {
  // Connection
  connected: boolean;
  connectionError: string | null;
  lastUpdated: Date | null;
  inferenceMs: number | null;
  consecutiveFails: number;

  // View mode
  viewMode: 'heatmap' | 'rawdetection';

  // Data
  heatmapGrid: number[][]; // 8 rows × 10 cols
  predictions: BoundingBox[]; // Raw detections for overlay
  totalDetected: number;
  zoneSummary: ZoneSummary;
  peakToday: number;
  peakTime: string | null;

  // Controls
  sensitivity: 'low' | 'medium' | 'high';
  autoRefresh: boolean;
  refreshInterval: number; // ms — 3000 default

  // UI
  isExporting: boolean;
  isRescanning: boolean;
}

interface BoundingBox {
  x: number; // Center x (0–100%)
  y: number; // Center y (0–100%)
  width: number; // Box width (0–100%)
  height: number; // Box height (0–100%)
  confidence: number; // 0.0–1.0
}

interface ZoneSummary {
  zone_a: number; // Left zone count
  zone_b: number; // Center zone count
  zone_c: number; // Right zone count
  peak: number; // Session peak
}
```

---

## 5. Full Visual Layout

```
┌───────────────────────────────────────────────────────────────────────┐
│ HEADER                                                                │
│ 🔥 AI HEATMAP — PEOPLE COUNT              🟢 CONNECTED  ·  142ms     │
│ Device: FlowGateX-001  ·  Model: YOLOv8-Nano  ·  QVGA 320×240       │
├───────────────────────────────────────────────────────────────────────┤
│ VIEW TOGGLE                                                           │
│  [ 🔥 Heatmap View ●──── ]   [ 👁 Raw Detection ────○ ]             │
├───────────────────────────────────────────────────────────────────────┤
│ MAIN CANVAS AREA                                                      │
│ ┌─────────────────────────────────────────────────────────────────┐  │
│ │                                                                 │  │
│ │   [HEATMAP VIEW]                                                │  │
│ │   8 rows × 10 columns canvas, radial gradient cells            │  │
│ │                                                                 │  │
│ │   ░░▒▒▓█████▓▒▒░░    ← heat intensity increases inward         │  │
│ │   ░░▒▓████████▓▒░░                                             │  │
│ │   ░░░▒▒▓████▓▒▒░░                                              │  │
│ │                                                                 │  │
│ │   [CENTER OVERLAY]                                              │  │
│ │           24                                                    │  │
│ │       DETECTED                                                  │  │
│ │                                                                 │  │
│ │   [COLOR LEGEND — bottom of canvas]                             │  │
│ │   🔵 0–2   🟢 3–5   🟡 6–8   🟠 9–11   🔴 12+                 │  │
│ │                                                                 │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│ [RAW DETECTION VIEW — when toggled]                                   │
│ ┌─────────────────────────────────────────────────────────────────┐  │
│ │  Dark background (simulated camera feed)                        │  │
│ │                                                                 │  │
│ │  ┌─────────┐    ┌──────┐    ┌───────────┐                      │  │
│ │  │PERSON   │    │PERSON│    │ PERSON    │                      │  │
│ │  │ 0.876   │    │ 0.73 │    │  0.651    │                      │  │
│ │  └─────────┘    └──────┘    └───────────┘                      │  │
│ │   ← green bounding boxes with confidence label                 │  │
│ │                                                                 │  │
│ └─────────────────────────────────────────────────────────────────┘  │
├───────────────────────────────────────────────────────────────────────┤
│ CONTROLS PANEL                                                        │
│  [ 🔄 Rescan ]    Sensitivity: [ Medium ▼ ]    [ 📷 Export PNG ]     │
│  Auto-refresh: 🟢 ON (every 3s)   [ Pause ]                          │
├───────────────────────────────────────────────────────────────────────┤
│ STATS BAR                                                             │
│  ┌──────────────┬──────────────┬──────────────┬──────────────────┐   │
│  │  Zone A: 8   │  Zone B: 12  │  Zone C: 4   │  Peak Today: 28  │   │
│  │  (left)      │  (center)    │  (right)      │  at 3:15 PM      │   │
│  └──────────────┴──────────────┴──────────────┴──────────────────┘   │
├───────────────────────────────────────────────────────────────────────┤
│ FOOTER                                                                │
│  Device: ESP32-CAM-001  ·  FW: v2.3.1  ·  Model: YOLOv8-Nano/v3     │
│  Last Updated: 10:52:34 AM  ·  Inference: 142ms  ·  Fails: 0        │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 6. Heatmap Canvas Renderer — HeatmapRenderer Component

The heatmap is rendered on an HTML `<canvas>` element using 2D context API. Each of the 80 cells (8×10) is drawn as a radial gradient centered on the cell midpoint, with color determined by person count vs maximum observed count.

### Color scale

```typescript
// Heat color scale — maps count/maxCount ratio (0.0–1.0) to RGBA color
const heatColor = (value: number, max: number): string => {
  const t = Math.min(value / Math.max(max, 1), 1);

  if (t === 0) return 'rgba(15, 23, 42, 0)'; // Empty — transparent
  if (t < 0.2) return `rgba(0, 200, 255, ${0.15 + t * 1.5})`; // Cyan — 1–2
  if (t < 0.4) return `rgba(0, 255, 120, ${0.3 + t})`; // Green — 3–5
  if (t < 0.6) return `rgba(255, 220, 0, ${0.5 + t * 0.7})`; // Yellow — 6–8
  if (t < 0.8) return `rgba(255, 120, 0, ${0.65 + t * 0.4})`; // Orange — 9–11
  return `rgba(255, 40, 40, ${0.8 + t * 0.2})`; // Red — 12+
};
```

### Canvas drawing loop

```typescript
const drawHeatmap = (
  canvas: HTMLCanvasElement,
  grid: number[][], // 8×10 grid
  prevGrid: number[][], // Previous frame (for animation interpolation)
  animProgress: number // 0.0–1.0 interpolation factor
) => {
  const ctx = canvas.getContext('2d')!;
  const ROWS = 8,
    COLS = 10;
  const cw = canvas.width / COLS;
  const ch = canvas.height / ROWS;

  // Find maximum value for normalization
  const maxVal = Math.max(...grid.flat(), 1);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background grid lines
  ctx.strokeStyle = 'rgba(0, 220, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * cw, 0);
    ctx.lineTo(c * cw, canvas.height);
    ctx.stroke();
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * ch);
    ctx.lineTo(canvas.width, r * ch);
    ctx.stroke();
  }

  // Heat cells — interpolated between prevGrid and grid
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const prev = prevGrid[r]?.[c] ?? 0;
      const curr = grid[r][c];
      const value = prev + (curr - prev) * animProgress; // Smooth interpolation

      if (value < 0.1) continue; // Skip empty cells

      const x = c * cw,
        y = r * ch;
      const cx = x + cw / 2,
        cy = y + ch / 2;

      // Radial gradient — spills into adjacent cells for natural heat diffusion
      const radius = Math.max(cw, ch) * 0.85;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, heatColor(value, maxVal));
      grad.addColorStop(1, 'transparent');

      ctx.fillStyle = grad;
      ctx.fillRect(x - cw * 0.4, y - ch * 0.4, cw * 1.8, ch * 1.8);

      // Count label (only for non-zero cells)
      if (curr > 0) {
        ctx.fillStyle = curr > maxVal * 0.5 ? '#ffffff' : 'rgba(255,255,255,0.5)';
        ctx.font = `bold ${Math.max(11, cw * 0.3)}px 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(curr), cx, cy);
      }
    }
  }

  // Center overlay — total people count
  const total = grid.flat().reduce((a, b) => a + b, 0);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 55, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.floor(canvas.width * 0.1)}px 'JetBrains Mono', monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(total), canvas.width / 2, canvas.height / 2 - 10);
  ctx.font = `${Math.floor(canvas.width * 0.035)}px sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('DETECTED', canvas.width / 2, canvas.height / 2 + 28);
};
```

### Animation loop

```typescript
// Smooth cell-level animation when new data arrives
const animateHeatmapUpdate = (
  newGrid: number[][],
  prevGrid: number[][],
  canvasRef: RefObject<HTMLCanvasElement>
) => {
  const duration = 400; // 400ms transition
  const start = performance.now();

  const frame = (timestamp: number) => {
    const progress = Math.min((timestamp - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // Ease-out cubic

    drawHeatmap(canvasRef.current!, newGrid, prevGrid, eased);

    if (progress < 1) requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
};
```

---

## 7. Raw Detection View — DetectionOverlay Component

When the view toggle switches to "Raw Detection", the canvas is replaced by an SVG overlay on a dark background, rendering bounding boxes from the `predictions` array.

```tsx
const DetectionOverlay: React.FC<{ boxes: BoundingBox[] }> = ({ boxes }) => (
  <div
    className="relative w-full h-full bg-gray-950 rounded-lg overflow-hidden"
    style={{ minHeight: 400 }}
  >
    {/* Scanline overlay — simulates camera feed texture */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,100,0.012) 4px)',
        zIndex: 1,
      }}
    />

    {/* Bounding boxes */}
    <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 2 }}>
      {boxes.map((box, i) => {
        const x = `${box.x - box.width / 2}%`;
        const y = `${box.y - box.height / 2}%`;
        const confColor =
          box.confidence > 0.8 ? '#00ff88' : box.confidence > 0.6 ? '#fbbf24' : '#f87171';
        return (
          <g key={i}>
            {/* Main bounding box */}
            <rect
              x={x}
              y={y}
              width={`${box.width}%`}
              height={`${box.height}%`}
              fill="none"
              stroke={confColor}
              strokeWidth="1.5"
              style={{ filter: `drop-shadow(0 0 4px ${confColor}80)` }}
            />
            {/* Confidence label */}
            <foreignObject
              x={x}
              y={`calc(${box.y - box.height / 2}% - 20px)`}
              width="80"
              height="20"
            >
              <div
                style={{
                  background: confColor,
                  color: '#000',
                  fontSize: '9px',
                  fontWeight: 800,
                  fontFamily: "'JetBrains Mono', monospace",
                  padding: '1px 5px',
                  borderRadius: '2px 2px 2px 0',
                  whiteSpace: 'nowrap',
                }}
              >
                PERSON {(box.confidence * 100).toFixed(0)}%
              </div>
            </foreignObject>
            {/* Corner markers */}
            {[
              [-1, -1],
              [1, -1],
              [-1, 1],
              [1, 1],
            ].map(([dx, dy], j) => (
              <line
                key={j}
                x1={`calc(${box.x + (dx * box.width) / 2}% + ${dx * 0}px)`}
                y1={`calc(${box.y + (dy * box.height) / 2}% + ${dy * 0}px)`}
                x2={`calc(${box.x + (dx * box.width) / 2}% + ${dx * 8}px)`}
                y2={`calc(${box.y + (dy * box.height) / 2}% + 0px)`}
                stroke={confColor}
                strokeWidth="2"
              />
            ))}
          </g>
        );
      })}
    </svg>

    {/* No detections state */}
    {boxes.length === 0 && (
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="text-center">
          <div className="text-5xl mb-3">👁</div>
          <p className="text-green-400 font-mono text-sm">SCANNING...</p>
          <p className="text-gray-500 text-xs mt-1">No persons detected</p>
        </div>
      </div>
    )}
  </div>
);
```

---

## 8. Data Polling — Fetch & WebSocket Strategy

```typescript
// Ai_heatmap.tsx — data fetching
useEffect(() => {
  if (!esp32Url) return;

  let pollInterval: NodeJS.Timer;
  let ws: WebSocket;
  let wsConnected = false;

  // ── Strategy 1: WebSocket (preferred — zero-polling overhead) ────────────
  try {
    ws = new WebSocket(`ws://${new URL(esp32Url).hostname}/ws`);

    ws.onopen = () => {
      wsConnected = true;
      setConnected(true);
      appendLog('WebSocket connected');
    };

    ws.onmessage = event => {
      const data = JSON.parse(event.data);
      // WebSocket payload includes full sensor data + heatmap if inference ran
      if (data.heatmap) {
        updateHeatmap(data.heatmap);
      }
      setLastUpdated(new Date());
    };

    ws.onerror = () => {
      wsConnected = false;
      // Fall back to HTTP polling
      startPolling();
    };

    ws.onclose = () => {
      wsConnected = false;
      startPolling(); // Fall back on disconnect
    };
  } catch {
    startPolling();
  }

  // ── Strategy 2: HTTP Polling (fallback) ──────────────────────────────────
  const startPolling = () => {
    pollInterval = setInterval(async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(`${esp32Url}/heatmap`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        clearTimeout(timeout);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: HeatmapResponse = await res.json();

        updateHeatmap(data);
        setConsecutiveFails(0);
        setConnected(true);
      } catch (err) {
        setConsecutiveFails(prev => {
          const next = prev + 1;
          if (next >= 3) {
            setConnected(false);
            setConnectionError('Device unreachable — check network');
          }
          return next;
        });
      }
    }, refreshInterval);
  };

  return () => {
    clearInterval(pollInterval);
    ws?.close();
  };
}, [esp32Url, refreshInterval]);

// Update state and trigger animation
const updateHeatmap = (data: HeatmapResponse) => {
  setPrevGrid(heatmapGrid); // Save current as previous for animation
  setHeatmapGrid(
    data.zones.reduce(
      (grid, z) => {
        grid[z.row][z.col] = z.count;
        return grid;
      },
      Array.from({ length: 8 }, () => Array(10).fill(0))
    )
  );

  setPredictions(data.predictions);
  setTotalDetected(data.total_detected);
  setZoneSummary(data.zone_summary);
  setInferenceMs(data.inference_ms);
  setLastUpdated(new Date());
};
```

---

## 9. Controls Panel Implementation

### Sensitivity Control

Sends POST to `/config` on ESP32, updating the Roboflow confidence threshold:

```typescript
const handleSensitivityChange = async (level: 'low' | 'medium' | 'high') => {
  setSensitivity(level);
  try {
    await fetch(`${esp32Url}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sensitivity: level }),
    });
  } catch {
    // Config update failed — ESP32 still uses previous threshold
    console.warn('Sensitivity update failed — ESP32 unreachable');
  }
};
```

Threshold values applied server-side:

| Setting | Confidence Threshold | Effect                                             |
| ------- | -------------------- | -------------------------------------------------- |
| Low     | 0.30                 | Catches more people, higher false positives        |
| Medium  | 0.50                 | Balanced (default)                                 |
| High    | 0.70                 | Only high-confidence detections, misses edge cases |

### Export PNG

```typescript
const handleExport = async () => {
  setIsExporting(true);
  const canvas = canvasRef.current!;

  // Draw timestamp watermark on export
  const ctx = canvas.getContext('2d')!;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, canvas.height - 28, canvas.width, 28);
  ctx.fillStyle = '#00ff88';
  ctx.font = '11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(
    `FlowGateX · ${new Date().toLocaleString()} · Detected: ${totalDetected}`,
    10,
    canvas.height - 10
  );
  ctx.restore();

  // Trigger download
  const link = document.createElement('a');
  link.download = `heatmap_${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();

  // Optional: Upload to Firebase Storage for record
  const blob = await new Promise<Blob>(res => canvas.toBlob(res as any, 'image/png'));
  const storageRef = ref(storage, `snapshots/${deviceId}/${Date.now()}.png`);
  await uploadBytes(storageRef, blob);

  setIsExporting(false);
};
```

### Rescan / Force Refresh

```typescript
const handleRescan = async () => {
  setIsRescanning(true);
  try {
    const res = await fetch(`${esp32Url}/heatmap?force=true`, { cache: 'no-store' });
    const data = await res.json();
    updateHeatmap(data);
  } finally {
    setIsRescanning(false);
  }
};
```

---

## 10. Connection Status Logic

The header status indicator reflects connection health:

| State        | Indicator                 | Condition                                  |
| ------------ | ------------------------- | ------------------------------------------ |
| Connected    | 🟢 `CONNECTED · Xms`      | Last response < 5s ago, no errors          |
| Slow         | 🟡 `SLOW · Xms`           | Response > 1000ms OR consecutive fails = 1 |
| Reconnecting | 🔵 `RECONNECTING...`      | Consecutive fails = 2, retry in progress   |
| Disconnected | 🔴 `DISCONNECTED`         | Consecutive fails ≥ 3                      |
| No Device    | ⚪ `CONNECT DEVICE FIRST` | `esp32Url` prop is null                    |

```tsx
// ConnectionStatus subcomponent
const ConnectionStatus: React.FC<{
  connected: boolean;
  inferenceMs: number | null;
  consecutiveFails: number;
  esp32Url: string | null;
}> = ({ connected, inferenceMs, consecutiveFails, esp32Url }) => {
  if (!esp32Url)
    return (
      <span className="text-gray-400 text-xs font-mono flex items-center gap-1">
        ⚪ CONNECT DEVICE FIRST
      </span>
    );

  const color = !connected
    ? 'text-red-400'
    : consecutiveFails > 0
      ? 'text-yellow-400'
      : 'text-emerald-400';
  const label = !connected
    ? '🔴 DISCONNECTED'
    : consecutiveFails === 1
      ? '🟡 SLOW'
      : `🟢 CONNECTED`;
  const latency = inferenceMs ? ` · ${inferenceMs}ms` : '';

  return (
    <span className={`${color} text-xs font-mono flex items-center gap-1`}>
      <span
        className={`inline-block w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`}
      />
      {label}
      {latency}
    </span>
  );
};
```

---

## 11. Disconnected / No-Device State

When `esp32Url` is null (Gateway.tsx hasn't connected yet):

```tsx
if (!esp32Url) {
  return (
    <div className="flex flex-col items-center justify-center h-96 gap-6 text-center">
      <div className="text-7xl opacity-30">📡</div>
      <div>
        <h3 className="text-white font-semibold text-lg mb-2">No Device Connected</h3>
        <p className="text-gray-400 text-sm max-w-xs">
          Connect to an ESP32-CAM device first using the Device Connect tab, then return here to
          view live heatmap data.
        </p>
      </div>
      <button
        onClick={() => setActiveTab('connect')} // Switches to Gateway.tsx tab
        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white
                   rounded-lg text-sm font-semibold transition-colors"
      >
        Go to Device Connect →
      </button>
    </div>
  );
}
```

---

## 12. Full Heatmap Response Schema (ESP32 → React)

```typescript
// Shape of GET /heatmap response
interface HeatmapResponse {
  timestamp: string; // ISO 8601
  total_detected: number; // Sum of all zone counts
  inference_ms: number; // Roboflow API round-trip time
  model: string; // "YOLOv8-Nano"
  confidence_threshold: number; // Active threshold (0.0–1.0)

  zones: Array<{
    row: number; // 0–7
    col: number; // 0–9
    count: number; // People count in this zone
  }>;

  predictions: Array<{
    x: number; // Bounding box center x (0–100%)
    y: number; // Bounding box center y (0–100%)
    w: number; // Width %
    h: number; // Height %
    confidence: number; // 0.0–1.0
  }>;

  zone_summary: {
    zone_a: number; // Rows 0–3 aggregate
    zone_b: number; // All cols center aggregate
    zone_c: number; // Rows 4–7 aggregate
    peak: number; // Session peak total
  };
}
```

---

## 13. Performance Constraints & Optimizations

### ESP32-CAM limitations

| Constraint               | Value               | Impact                         |
| ------------------------ | ------------------- | ------------------------------ |
| PSRAM                    | 4MB                 | Limits frame buffer count to 2 |
| HTTPClient for Roboflow  | ~200–500ms          | Minimum inference cycle = 2s   |
| JSON parse (ArduinoJson) | ~15ms               | Negligible                     |
| WebSocket broadcast      | ~5ms                | Negligible                     |
| Concurrent HTTP clients  | ~5 (AsyncWebServer) | Sufficient for dashboard       |
| JPEG frame size (VGA)    | 8–20KB              | Fits in single POST easily     |

### Optimizations applied

```
1. Frame resolution: QVGA (320×240) for fast inference, VGA for export snapshot
2. JPEG quality: 12–20 (lower = smaller payload = faster API round-trip)
3. Double buffer: fb_count=2 lets camera capture next frame while first is being sent
4. Release frame buffer immediately after encoding (esp_camera_fb_return)
5. Base64 encoding done in chunks to avoid heap fragmentation
6. Roboflow overlap=30 (NMS) reduces redundant detections on same person
7. heatmapGrid stored as flat uint8 array on ESP32 (not JSON until /heatmap called)
8. React canvas: only redraws cells with changed values (dirty-cell optimization)
9. prevGrid interpolation at 400ms gives perception of faster updates
10. WebSocket preferred over polling — eliminates HTTP overhead for connected clients
```

---

## 14. File Structure Reference

```
src/
├── components/
│   └── iot/
│       ├── Ai_heatmap.tsx              ← This component (main page)
│       ├── Gateway.tsx                 ← Provides esp32Url prop
│       └── subcomponents/
│           ├── HeatmapRenderer.tsx     ← Canvas drawing + animation loop
│           ├── DetectionOverlay.tsx    ← SVG bounding box view
│           ├── ConnectionStatus.tsx    ← Header status indicator
│           ├── ControlsPanel.tsx       ← Sensitivity, export, rescan
│           ├── StatsBar.tsx            ← Zone A/B/C + peak counter
│           └── HeatmapLegend.tsx       ← Color scale legend bar
└── hooks/
    └── useHeatmapData.ts               ← Data fetch + WebSocket logic (extracted)
```

---

## 15. ESP32-CAM Firmware — Inference Task

```cpp
// Separate FreeRTOS task on Core 0 — runs every 2s
void inferenceTask(void* pvParameters) {
  // Camera init
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed: 0x%x\n", err);
    vTaskDelete(NULL);
    return;
  }
  Serial.println("OV2640 camera initialized");

  for (;;) {
    if (WiFi.status() == WL_CONNECTED) {
      runRoboflowInference();   // Capture → POST → Parse → Update grid
    } else {
      // WiFi down — clear grid, serve empty heatmap
      memset(heatmapGrid, 0, sizeof(heatmapGrid));
      totalOccupancy = 0;
    }
    vTaskDelay(2000 / portTICK_PERIOD_MS);
  }
}
```

---

_Last updated: Feb 2026 · FlowGateX IoT Module · ai_heatmap.md v1.0_
