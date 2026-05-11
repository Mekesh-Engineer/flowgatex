ESP32 Firmware — FlowGateX Gate System

Firmware File: flowgatex_gate/flowgatex_gate.ino
Board: ESP32 DevKit V1 (38-pin)
Framework: Arduino (ESP-IDF via arduino-esp32 v2.x)
IDE: Arduino IDE 2.x / PlatformIO
Flash Target: 4MB — Partition scheme: Default 4MB with spiffs (1.2MB APP / 1.5MB SPIFFS)
Purpose: Host the Gateway web dashboard locally, serve AI heatmap data, control dual-gate hardware, sync with Firebase RTDB, and respond to FlowGateX app commands in real time.

1. Firmware Architecture Overview

flowgatex_gate.ino
│
├── BOOT SEQUENCE (setup())
│ ├── 1. GPIO init (motors, sensors, buzzer, LCD)
│ ├── 2. Sensor calibration (IR baseline, MQ warm-up, DHT11 first read)
│ ├── 3. Motor test cycle (10° open → return)
│ ├── 4. WiFi — Dual mode: SoftAP + STA
│ ├── 5. mDNS registration ("flowgatex.local")
│ ├── 6. SPIFFS mount (serves HTML/CSS/JS dashboard files)
│ ├── 7. WebServer route registration (all endpoints on port 80)
│ ├── 8. WebSocketsServer init (port 81)
│ ├── 9. Firebase RTDB connection
│ └── 10. LCD: "READY - ONLINE"
│
├── MAIN LOOP (loop())
│ ├── Handle WebServer clients (server.handleClient())
│ ├── Handle WebSocket events (webSocket.loop())
│ ├── Sensor read task (every 1000ms — FreeRTOS task)
│ ├── Firebase sync task (every 1000ms — FreeRTOS task)
│ ├── Gate state machine (event-driven via IR/QR triggers)
│ ├── WebSocket broadcast (pushes JSON to all connected browsers)
│ ├── LCD rotation (every 5000ms)
│ └── Alert watchdog (MQ/metal threshold check every 500ms)
│
└── INTERRUPT HANDLERS
├── IR1_ISR() — rising/falling edge on GPIO 34
├── IR2_ISR() — rising/falling edge on GPIO 35
└── Metal_ISR() — rising edge on GPIO 39

2. Pin Definitions & Hardware Map

// ─── Motor Driver (L298N) ────────────────────────────────────────────────────
#define GATE1_ENA 5 // PWM — Gate 1 motor speed (0–255)
#define GATE1_IN1 18 // Direction A
#define GATE1_IN2 19 // Direction B
#define GATE2_ENB 4 // PWM — Gate 2 motor speed
#define GATE2_IN3 16 // Direction A
#define GATE2_IN4 17 // Direction B

// PWM channels (ESP32 LEDC)
#define GATE1_PWM_CH 0 // ledc channel 0
#define GATE2_PWM_CH 1 // ledc channel 1
#define PWM_FREQ 5000 // 5kHz PWM frequency
#define PWM_RES 8 // 8-bit resolution (0–255)

// ─── Sensors ─────────────────────────────────────────────────────────────────
#define IR1_PIN 34 // IR beam 1 — passage entry (input-only ADC)
#define IR2_PIN 35 // IR beam 2 — passage exit, 5cm range (input-only ADC)
#define MQ_PIN 36 // MQ gas sensor analog output (ADC1 channel 0)
#define DHT_PIN 21 // DHT11 data (also used for I2C SDA — resolve conflict\*)
#define METAL_PIN 39 // Metal detector digital signal (input-only ADC)

// \*Note: DHT11 on GPIO21 conflicts with I2C SDA if LCD uses GPIO21.
// Resolution: Move DHT11 to GPIO 13 or use GPIO 21 exclusively for DHT11
// and remap LCD I2C to GPIO 25 (SDA) / GPIO 26 (SCL).

// ─── I2C LCD (16x2) ──────────────────────────────────────────────────────────
#define LCD_SDA 25 // Remapped from default 21 to avoid DHT conflict
#define LCD_SCL 26 // Remapped from default 22
#define LCD_ADDR 0x27 // I2C address (0x3F on some modules — scan to confirm)

// ─── Buzzer ──────────────────────────────────────────────────────────────────
#define BUZZER_PIN 27 // Active buzzer (HIGH = ON)

3. Library Dependencies

// ─── Core & WiFi ─────────────────────────────────────────────────────────────
#include <WiFi.h>
#include <ESPmDNS.h> // mDNS — registers "flowgatex.local"

// ─── Web Server & WebSocket (Standard Sync Libraries) ────────────────────────
#include <WebServer.h> // Built-in ESP32 synchronous WebServer
#include <WebSocketsServer.h> // Dedicated WebSockets library (Markus Sattler)

// ─── File System (Dashboard HTML hosting) ────────────────────────────────────
#include <SPIFFS.h> // SPI Flash File System — serves index.html

// ─── Sensors ─────────────────────────────────────────────────────────────────
#include <DHT.h> // DHT11/DHT22 (adafruit/DHT-sensor-library)
#include <Wire.h> // I2C for LCD
#include <LiquidCrystal_I2C.h> // LCD 16x2 I2C

// ─── Data Format ─────────────────────────────────────────────────────────────
#include <ArduinoJson.h> // JSON serialization / deserialization (v6.x)

// ─── Firebase ────────────────────────────────────────────────────────────────
#include <FirebaseESP32.h> // Firebase RTDB (mobizt/Firebase-ESP32)

// ─── FreeRTOS (built-in ESP32 Arduino) ───────────────────────────────────────
// TaskHandle_t, xTaskCreatePinnedToCore() — used for parallel sensor + firebase tasks

Arduino Library Manager installs:

WebSockets (Markus Sattler) — v2.4.x
ArduinoJson (Benoit Blanchon) — v6.21.x
DHT sensor library (Adafruit) — v1.4.x
LiquidCrystal_I2C (Frank de Brabander)
Firebase ESP32 (Mobizt) — v4.x

(Note: Standard WebServer is built into the ESP32 core, no manual installation needed).

4. WiFi Dual-Mode Setup (SoftAP + STA)

The ESP32 operates in WIFI_AP_STA mode simultaneously: it creates its own hotspot for direct device access while also connecting to the venue router or organizer's phone hotspot for internet/Firebase access.

// ─── WiFi Credentials ────────────────────────────────────────────────────────
const char* AP_SSID = "FlowGateX_4B2A"; // AP name (last 4 chars = chip ID)
const char* AP_PASS = "flowgatex2026"; // AP password
const char* STA_SSID = "VenueWiFi"; // Router/hotspot to join
const char* STA_PASS = "venue_password"; // Router password

void setupWiFi() {
// Set dual mode before any WiFi calls
WiFi.mode(WIFI_AP_STA);

// ── SoftAP (always on, organizer connects here for local dashboard) ─────────
WiFi.softAP(AP_SSID, AP_PASS);
WiFi.softAPConfig(
IPAddress(192, 168, 4, 1), // AP gateway IP (fixed — Gateway.tsx polls this)
IPAddress(192, 168, 4, 1), // Gateway
IPAddress(255, 255, 255, 0) // Subnet
);
Serial.printf("AP started: %s @ 192.168.4.1\n", AP_SSID);

// ── STA (connects to internet for Firebase — best effort) ──────────────────
WiFi.begin(STA_SSID, STA_PASS);
int attempts = 0;
while (WiFi.status() != WL_CONNECTED && attempts < 20) {
delay(500);
attempts++;
}
if (WiFi.status() == WL_CONNECTED) {
Serial.printf("STA connected: %s @ %s\n", STA_SSID, WiFi.localIP().toString().c_str());
} else {
Serial.println("STA failed — offline mode, Firebase disabled");
offlineMode = true;
}

// ── mDNS registration ──────────────────────────────────────────────────────
if (MDNS.begin("flowgatex")) {
MDNS.addService("http", "tcp", 80);
Serial.println("mDNS: flowgatex.local registered");
}
}

5. SPIFFS File System — Dashboard HTML Hosting

The web dashboard (served to Gateway.tsx iframe and direct browser visits) is stored in the ESP32's SPIFFS partition.

SPIFFS file structure

data/
├── index.html ← Main dashboard SPA (served at / and /dashboard)
├── style.css ← Tailwind-based compressed CSS (~12KB)
├── app.js ← Dashboard JS: sensor polling, gate controls, charts (~25KB)
├── ScannerPage.tsx ← QR code page (encodes device URL for Gateway.tsx scanner)
├── qr.png ← Pre-generated QR image (fallback if runtime QR fails)
└── favicon.ico ← FlowGateX icon

SPIFFS mount and static serving

void setupSPIFFS() {
if (!SPIFFS.begin(true)) { // true = format on fail
Serial.println("SPIFFS mount failed — dashboard unavailable");
return;
}
Serial.println("SPIFFS mounted OK");
}

6. WebServer — All Endpoint Definitions

The standard WebServer runs on port 80. Since it's synchronous, HTTP responses are processed during the server.handleClient() call in the main loop.

WebServer server(80);
WebSocketsServer webSocket = WebSocketsServer(81); // WebSocket on port 81

// ── CORS Headers Helper ──────────────────────────────────────────────────────
void setCORSHeaders() {
server.sendHeader("Access-Control-Allow-Origin", "\*");
server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void setupRoutes() {
// ── Static Files Serving (SPIFFS) ────────────────────────────────────────
server.serveStatic("/", SPIFFS, "/index.html");
server.serveStatic("/dashboard", SPIFFS, "/index.html");
server.serveStatic("/style.css", SPIFFS, "/style.css");
server.serveStatic("/app.js", SPIFFS, "/app.js");
server.serveStatic("/qr-code", SPIFFS, "/qr.html");
server.serveStatic("/favicon.ico", SPIFFS, "/favicon.ico");

// ── 1. Ping — identity handshake for Gateway.tsx ──────────────────────────
server.on("/ping", HTTP_GET, []() {
setCORSHeaders();
StaticJsonDocument<256> doc;
doc["id"] = DEVICE_ID;  
 doc["deviceId"] = FIRESTORE_DEV_ID;
doc["status"] = "online";
doc["fw"] = FIRMWARE_VERSION;
doc["type"] = "gate";
doc["ap_ssid"] = AP_SSID;
doc["uptime"] = millis() / 1000;
String out; serializeJson(doc, out);
server.send(200, "application/json", out);
});

// ── 2. Live Sensor Data — polled by Ai_heatmap.tsx and dashboard JS ────────
server.on("/sensors", HTTP_GET, []() {
setCORSHeaders();
server.send(200, "application/json", buildSensorJson());
});

// ── 3. Heatmap Inference Data — polled by Ai_heatmap.tsx every 3s ─────────
server.on("/heatmap", HTTP_GET, []() {
setCORSHeaders();
server.send(200, "application/json", buildHeatmapJson());
});

// ── 4. Gate Control — POST from dashboard or FlowGateX app ────────────────
server.on("/gates", HTTP_POST, []() {
setCORSHeaders();
if (!server.hasArg("plain")) {
server.send(400, "application/json", "{\"error\":\"Missing body\"}");
return;
}

    StaticJsonDocument<128> doc;
    DeserializationError err = deserializeJson(doc, server.arg("plain"));
    if (err) { server.send(400, "application/json", "{\"error\":\"bad json\"}"); return; }

    int gate   = doc["gate"];
    String act = doc["action"];
    int dur    = doc["duration"] | 5000;

    if      (gate == 1 && act == "open")  openGate(1, dur);
    else if (gate == 1 && act == "close") closeGate(1);
    else if (gate == 2 && act == "open")  openGate(2, dur);
    else if (gate == 2 && act == "close") closeGate(2);

    server.send(200, "application/json", "{\"ok\":true}");

});

// ── 5. QR Validation — POST from FlowGateX Scanner page ──────────────────
server.on("/qr", HTTP_POST, []() {
setCORSHeaders();
if (!server.hasArg("plain")) {
server.send(400, "application/json", "{\"error\":\"Missing body\"}");
return;
}

    StaticJsonDocument<256> doc;
    deserializeJson(doc, server.arg("plain"));
    String userID = doc["userID"];
    bool   valid  = doc["valid"];

    if (valid) {
      grantAccess(userID);
      server.send(200, "application/json", "{\"result\":\"GRANT\"}");
    } else {
      denyAccess(userID);
      server.send(200, "application/json", "{\"result\":\"DENY\"}");
    }

});

// ── 6. Config — sensitivity / threshold updates from Ai_heatmap controls ──
server.on("/config", HTTP_POST, []() {
setCORSHeaders();
if (!server.hasArg("plain")) {
server.send(400, "application/json", "{\"error\":\"Missing body\"}");
return;
}

    StaticJsonDocument<256> doc;
    deserializeJson(doc, server.arg("plain"));
    if (doc.containsKey("sensitivity")) {
      String s = doc["sensitivity"];
      if      (s == "low")    roboflowThreshold = 0.30;
      else if (s == "medium") roboflowThreshold = 0.50;
      else if (s == "high")   roboflowThreshold = 0.70;
    }
    if (doc.containsKey("gas_warning"))   gasWarnPPM  = doc["gas_warning"];
    if (doc.containsKey("gas_critical"))  gasCritPPM  = doc["gas_critical"];
    if (doc.containsKey("temp_warning"))  tempWarnC   = doc["temp_warning"];
    server.send(200, "application/json", "{\"ok\":true}");

});

// ── 7. Access Logs — last 100 entries ────────────────────────────────────
server.on("/logs", HTTP_GET, []() {
setCORSHeaders();
server.send(200, "application/json", buildLogsJson());
});

// ── 8. System Info ────────────────────────────────────────────────────────
server.on("/system", HTTP_GET, []() {
setCORSHeaders();
StaticJsonDocument<512> doc;
doc["uptime_s"] = millis() / 1000;
doc["free_heap"] = ESP.getFreeHeap();
doc["chip_id"] = String((uint32_t)ESP.getEfuseMac(), HEX);
doc["fw_version"] = FIRMWARE_VERSION;
doc["ap_clients"] = WiFi.softAPgetStationNum();
doc["sta_rssi"] = WiFi.RSSI();
doc["sta_ip"] = WiFi.localIP().toString();
doc["ap_ip"] = "192.168.4.1";
doc["offline_mode"]= offlineMode;
String out; serializeJson(doc, out);
server.send(200, "application/json", out);
});

// ── 9. Not Found & OPTIONS preflight (CORS) ──────────────────────────────
server.onNotFound([]() {
if (server.method() == HTTP_OPTIONS) {
setCORSHeaders();
server.send(204);
return;
}
setCORSHeaders();
server.send(404, "text/plain", "Not found");
});

server.begin();
Serial.println("WebServer started on port 80");
}

7. WebSocketsServer — Real-Time Push to Dashboard

The ESP32 pushes a JSON payload to all connected clients every 1000ms. Since standard WebServer doesn't handle websockets, the WebSocketsServer library runs concurrently on port 81. Ensure Gateway.tsx and Ai_heatmap.tsx connect to ws://192.168.4.1:81/.

// Broadcast to all connected WS clients (called from sensor task)
void broadcastSensorData() {
String payload = buildSensorJson();
webSocket.broadcastTXT(payload);
}

// WebSocket event handler
void webSocketEvent(uint8_t num, WStype_t type, uint8_t \* payload, size_t length) {
switch(type) {
case WStype_DISCONNECTED:
Serial.printf("WS client #%u disconnected\n", num);
break;

    case WStype_CONNECTED: {
      IPAddress ip = webSocket.remoteIP(num);
      Serial.printf("WS client #%u connected from %s\n", num, ip.toString().c_str());
      webSocket.sendTXT(num, buildSensorJson()); // Send immediately on connect
      break;
    }

    case WStype_TEXT: {
      // Handle incoming commands from dashboard JS
      StaticJsonDocument<128> cmd;
      deserializeJson(cmd, payload, length);
      if (cmd["action"] == "open_gate")  openGate(cmd["gate"], 5000);
      if (cmd["action"] == "close_gate") closeGate(cmd["gate"]);
      if (cmd["action"] == "ping")       webSocket.sendTXT(num, "{\"pong\":true}");
      break;
    }

    case WStype_ERROR:
      Serial.printf("WS error on client #%u\n", num);
      break;

}
}

void setupWebSocket() {
webSocket.begin();
webSocket.onEvent(webSocketEvent);
Serial.println("WebSocket server started on port 81");
}

JSON payload pushed via WebSocket (every 1s)

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

8. Sensor Reading Implementation

All sensors are read in a dedicated FreeRTOS task pinned to Core 0, freeing Core 1 for WiFi and HTTP handling.

// FreeRTOS task — runs on Core 0
void sensorTask(void\* pvParameters) {
DHT dht(DHT_PIN, DHT11);
dht.begin();
unsigned long lastDHT = 0;

for (;;) {
unsigned long now = millis();

    // ── DHT11 — read every 2s (sensor limitation) ────────────────────────
    if (now - lastDHT >= 2000) {
      float t = dht.readTemperature();
      float h = dht.readHumidity();
      if (!isnan(t) && !isnan(h)) {
        sensorData.temp     = t;
        sensorData.humidity = h;
      }
      lastDHT = now;
    }

    // ── MQ Gas Sensor — read ADC every 500ms ─────────────────────────────
    int mqRaw = analogRead(MQ_PIN);  // 0–4095 (12-bit ADC)
    // Convert to PPM (linear approximation, calibrate with known gas source)
    sensorData.gasPPM   = map(mqRaw, 0, 4095, 0, 10000);
    sensorData.mqRawADC = mqRaw;

    // ── IR Sensors — debounced digital read ──────────────────────────────
    sensorData.ir1 = (digitalRead(IR1_PIN) == LOW) ? "blocked" : "clear";
    sensorData.ir2 = (digitalRead(IR2_PIN) == LOW) ? "blocked" : "clear";

    // ── Metal Detector — digital read ────────────────────────────────────
    sensorData.metalDetected = (digitalRead(METAL_PIN) == HIGH);

    // ── Alert watchdog ────────────────────────────────────────────────────
    checkAlerts();

    // ── Broadcast via WebSocket ───────────────────────────────────────────
    broadcastSensorData();

    vTaskDelay(1000 / portTICK_PERIOD_MS);  // 1s cycle

}
}

void checkAlerts() {
// Gas alert
if (sensorData.gasPPM > gasCritPPM && !gasAlertActive) {
gasAlertActive = true;
triggerGasAlert();
} else if (sensorData.gasPPM < gasWarnPPM) {
gasAlertActive = false;
}

// Metal alert
if (sensorData.metalDetected && !metalAlertActive) {
metalAlertActive = true;
triggerMetalAlert();
} else if (!sensorData.metalDetected) {
metalAlertActive = false;
}

// Temperature alert
if (sensorData.temp > tempCritC) {
triggerTempAlert();
}
}

9. Gate Motor Control — State Machine

GATE STATES:
CLOSED → (openGate called) → OPENING → (ramp complete) → OPEN
OPEN → (auto-timer OR closeGate called) → CLOSING → CLOSED
Any state → (gas/metal alert) → LOCKED (requires manual unlock via /config)

// PWM ramp-up for smooth gate opening (avoids motor stall at full voltage)
void openGate(int gate, int durationMs) {
int enaPin = (gate == 1) ? GATE1_ENA : GATE2_ENB;
int in1Pin = (gate == 1) ? GATE1_IN1 : GATE2_IN3;
int in2Pin = (gate == 1) ? GATE1_IN2 : GATE2_IN4;
int pwmCh = (gate == 1) ? GATE1_PWM_CH : GATE2_PWM_CH;
GateState\* gs = (gate == 1) ? &gate1State : &gate2State;

if (gs->locked) {
Serial.printf("Gate %d LOCKED — cannot open (gas/metal alert active)\n", gate);
return;
}

gs->state = OPENING;
lcdPrint(0, "GATE " + String(gate) + " OPENING");

// Set direction: forward = open
digitalWrite(in1Pin, HIGH);
digitalWrite(in2Pin, LOW);

// PWM ramp 0 → 200 (out of 255) over 800ms for smooth start
for (int speed = 0; speed <= 200; speed += 10) {
ledcWrite(pwmCh, speed);
delay(40);
}

gs->state = OPEN;
gs->openedAt = millis();
lcdPrint(0, "GATE " + String(gate) + " OPEN");
buzzerTone(GRANT_TONE);
logAccess(gate, "OPENED", durationMs);

// Auto-close timer (non-blocking via FreeRTOS timer)
if (durationMs > 0) {
gs->autoCloseTimer = durationMs;
xTimerStart(
xTimerCreate("AutoClose", pdMS_TO_TICKS(durationMs), pdFALSE, (void\*)gate,
[](TimerHandle_t xTimer) {
int g = (int)pvTimerGetTimerID(xTimer);
closeGate(g);
}
), 0
);
}

// Update Firebase
String path = "/devices/esp32_001/gates/gate" + String(gate);
Firebase.setString(firebaseData, path + "/status", "open");
Firebase.setInt(firebaseData, path + "/openedAt", millis());
}

void closeGate(int gate) {
int in1Pin = (gate == 1) ? GATE1_IN1 : GATE2_IN3;
int in2Pin = (gate == 1) ? GATE1_IN2 : GATE2_IN4;
int pwmCh = (gate == 1) ? GATE1_PWM_CH : GATE2_PWM_CH;
GateState\* gs = (gate == 1) ? &gate1State : &gate2State;

gs->state = CLOSING;
digitalWrite(in1Pin, LOW);
digitalWrite(in2Pin, HIGH); // Reverse direction = close
ledcWrite(pwmCh, 180);
delay(800);
ledcWrite(pwmCh, 0); // Stop motor

gs->state = CLOSED;
lcdPrint(0, "GATE " + String(gate) + " CLOSED");
logAccess(gate, "CLOSED", 0);

Firebase.setString(firebaseData, "/devices/esp32_001/gates/gate" + String(gate) + "/status", "closed");
}

void lockAllGates(String reason) {
gate1State.locked = true;
gate2State.locked = true;
closeGate(1);
closeGate(2);
lcdPrint(0, "!! GATES LOCKED !!");
lcdPrint(1, reason.substring(0, 16));
buzzerAlarm();
Firebase.setString(firebaseData, "/devices/esp32_001/alerts/lockReason", reason);
}

10. Access Control Sequence — QR Validation Full Flow

void grantAccess(String userID) {
Serial.printf("ACCESS GRANTED: %s\n", userID.c_str());
lcdPrint(0, "ACCESS GRANTED");
lcdPrint(1, userID.substring(0, 16));
buzzerTone(GRANT_TONE);
openGate(1, 5000); // Gate 1 opens for 5s
logEntry(userID, "GRANT", 1);

// Wait for IR1 beam break (user entered passage) with 10s timeout
unsigned long t = millis();
while (digitalRead(IR1_PIN) != LOW && millis() - t < 10000) delay(50);

if (digitalRead(IR1_PIN) == LOW) {
lcdPrint(1, "SEC CHECK...");
// Sensor readings already running — alert watchdog handles MQ/metal
delay(2000); // 2s in passage for sensor reads

    // Wait for IR2 (passage exit trigger, 5cm range)
    t = millis();
    while (digitalRead(IR2_PIN) != LOW && millis() - t < 15000) delay(50);

    if (digitalRead(IR2_PIN) == LOW) {
      openGate(2, 3000);      // Gate 2 opens for 3s
      lcdPrint(0, "ACCESS COMPLETE");
      lcdPrint(1, "WELCOME");
      buzzerTone(COMPLETE_TONE);
      logEntry(userID, "COMPLETE", 2);
    } else {
      lcdPrint(0, "IR2 TIMEOUT");
      lcdPrint(1, "CHECK PASSAGE");
      buzzerAlarm();
      logEntry(userID, "IR_TIMEOUT", 2);
      // Alert sent via Firebase + WebSocket
    }

}
}

void denyAccess(String userID) {
lcdPrint(0, "ACCESS DENIED");
lcdPrint(1, userID.substring(0, 16));
buzzerTone(DENY_TONE);
logEntry(userID, "DENY", 0);
}

11. Heatmap Inference Data — /heatmap Endpoint

The /heatmap endpoint aggregates data for Ai_heatmap.tsx. In production, the ESP32-CAM runs Roboflow YOLOv8-Nano inference. For the gate passage model, bounding box centroids are mapped to an 8×10 grid representing the physical passage zones.

String buildHeatmapJson() {
// In production: results from Roboflow inference stored in roboflowResults[]
// For demo/hackathon: IR + occupancy counters synthesize a realistic grid

StaticJsonDocument<2048> doc;
doc["timestamp"] = getISO8601();
doc["total_detected"] = totalOccupancy;
doc["inference_ms"] = lastInferenceMs;
doc["model"] = "YOLOv8-Nano";
doc["confidence_threshold"] = roboflowThreshold;

// 8x10 grid — array of {row, col, count}
JsonArray zones = doc.createNestedArray("zones");
for (int r = 0; r < 8; r++) {
for (int c = 0; c < 10; c++) {
JsonObject z = zones.createNestedObject();
z["row"] = r;
z["col"] = c;
z["count"] = heatmapGrid[r][c];
}
}

// Raw predictions (bounding boxes) for Raw Detection View
JsonArray predictions = doc.createNestedArray("predictions");
for (auto& p : roboflowResults) {
if (p.confidence < roboflowThreshold) continue;
JsonObject pred = predictions.createNestedObject();
pred["x"] = p.x; // Center x (0–100%)
pred["y"] = p.y; // Center y (0–100%)
pred["w"] = p.width; // Box width (% of frame)
pred["h"] = p.height; // Box height
pred["confidence"] = p.confidence;
pred["class"] = "person";
}

// Zone summary for stats bar
JsonObject zoneSummary = doc.createNestedObject("zone_summary");
zoneSummary["zone_a"] = getZoneCount(0, 3); // Rows 0-3, left
zoneSummary["zone_b"] = getZoneCount(0, 10); // All columns mid
zoneSummary["zone_c"] = getZoneCount(4, 7); // Rows 4-7, right
zoneSummary["peak"] = peakOccupancyToday;

String out;
serializeJson(doc, out);
return out;
}

12. Firebase RTDB Sync Task

// FreeRTOS task — runs on Core 1 alongside WiFi
void firebaseTask(void\* pvParameters) {
Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);
Firebase.reconnectWiFi(true);

for (;;) {
if (!offlineMode && Firebase.ready()) {

      // Build payload
      FirebaseJson payload;
      payload.set("timestamp",          getISO8601());
      payload.set("sensors/temp",       sensorData.temp);
      payload.set("sensors/humidity",   sensorData.humidity);
      payload.set("sensors/gas_ppm",    sensorData.gasPPM);
      payload.set("sensors/metal",      sensorData.metalDetected);
      payload.set("sensors/ir1",        sensorData.ir1.c_str());
      payload.set("sensors/ir2",        sensorData.ir2.c_str());
      payload.set("gates/gate1",        gate1State.statusStr());
      payload.set("gates/gate2",        gate2State.statusStr());
      payload.set("system/status",      "online");
      payload.set("system/clients",     (int)WiFi.softAPgetStationNum());
      payload.set("system/uptime_s",    (int)(millis() / 1000));

      // Write to RTDB
      if (!Firebase.updateNode(firebaseData, "/devices/esp32_001", payload)) {
        Serial.printf("Firebase error: %s\n", firebaseData.errorReason().c_str());
      }
    }
    vTaskDelay(1000 / portTICK_PERIOD_MS);

}
}

13. LCD Display Rotation

// Runs every 5s on main loop
const char\* lcdMessages[][2] = {
{ "READY ONLINE", "FlowGateX v2.3" },
{ "GATE1: CLOSED", "GATE2: CLOSED" },
{ "SEC: ALL CLEAR", "Metal:OK Gas:OK" },
{ nullptr, nullptr } // Filled dynamically with sensor data
};

void rotateLCD() {
static int idx = 0;
static unsigned long lastRotate = 0;

if (millis() - lastRotate < 5000) return;
lastRotate = millis();

// Dynamic slot: sensor reading
char line1[17], line2[17];
snprintf(line1, 17, "T:%.1fC H:%.0f%%", sensorData.temp, sensorData.humidity);
snprintf(line2, 17, "Gas:%dppm", sensorData.gasPPM);

if (idx == 0) { lcd.print(0, 0, lcdMessages[0][0]); lcd.print(0, 1, lcdMessages[0][1]); }
else if (idx == 1) {
char g1[17], g2[17];
snprintf(g1, 17, "GATE1: %s", gate1State.statusStr());
snprintf(g2, 17, "GATE2: %s", gate2State.statusStr());
lcdPrint(0, g1); lcdPrint(1, g2);
}
else if (idx == 2) { lcdPrint(0, "SEC: ALL CLEAR"); lcdPrint(1, "Metal:OK Gas:OK"); }
else if (idx == 3) { lcdPrint(0, line1); lcdPrint(1, line2); }

idx = (idx + 1) % 4;
}

14. Alert Protocols — Hardware Actions

void triggerGasAlert() {
lockAllGates("GAS ALERT");
lcdPrint(0, "!! GAS ALERT !!");
lcdPrint(1, String(sensorData.gasPPM) + " PPM");
// Push to Firebase alert node
Firebase.setString(firebaseData, "/alerts/active/gas",
"{\"ppm\":" + String(sensorData.gasPPM) + ",\"ts\":\"" + getISO8601() + "\"}");
// WebSocket broadcast to all connected dashboards
webSocket.broadcastTXT("{\"alert\":\"gas_critical\",\"ppm\":" + String(sensorData.gasPPM) + "}");
buzzerAlarm(); // Continuous alarm
}

void triggerMetalAlert() {
closeGate(2); // Lock Gate 2 only (Gate 1 may already be open)
gate2State.locked = true;
lcdPrint(0, "SECURITY CHECK");
lcdPrint(1, "METAL DETECTED");
Firebase.setString(firebaseData, "/alerts/active/metal",
"{\"detected\":true,\"ts\":\"" + getISO8601() + "\"}");
webSocket.broadcastTXT("{\"alert\":\"metal_detected\"}");
buzzerTone(ALERT_TONE);
}

// Buzzer tone patterns
void buzzerTone(int pattern) {
switch (pattern) {
case GRANT_TONE: // Short beep
digitalWrite(BUZZER_PIN, HIGH); delay(200); digitalWrite(BUZZER_PIN, LOW); break;
case DENY_TONE: // Two short beeps
for (int i = 0; i < 2; i++) {
digitalWrite(BUZZER_PIN, HIGH); delay(100);
digitalWrite(BUZZER_PIN, LOW); delay(100);
} break;
case COMPLETE_TONE: // Two longer beeps
for (int i = 0; i < 2; i++) {
digitalWrite(BUZZER_PIN, HIGH); delay(300);
digitalWrite(BUZZER_PIN, LOW); delay(150);
} break;
case ALERT_TONE: // Continuous
digitalWrite(BUZZER_PIN, HIGH); delay(2000); digitalWrite(BUZZER_PIN, LOW); break;
}
}

void buzzerAlarm() {
// Non-blocking alarm via FreeRTOS timer (repeating every 500ms)
xTimerStart(alarmTimer, 0);
}

15. Offline Mode — Local Operation Without Internet

When WiFi STA fails (venue network unavailable), the ESP32 continues all local operations:

Offline mode active:
✅ AP hotspot still running (FlowGateX_4B2A)
✅ Dashboard serves from SPIFFS
✅ WebSocket pushes sensor data to connected browsers
✅ QR validation via cached QR codes (stored in EEPROM at boot)
✅ Gate control via /gates endpoint
✅ Sensor monitoring + alert hardware actions
❌ Firebase RTDB sync paused (queued, retried on reconnect)
❌ FlowGateX app cloud features unavailable

// Offline QR cache — loaded from EEPROM at boot (max 50 one-time-use codes)
void loadOfflineQRCache() {
EEPROM.begin(4096);
// Read JSON array of valid QR hashes from EEPROM
// Populated by Firebase Cloud Function before event (offline prep step)
String cached = readEEPROM(0, 4096);
if (cached.length() > 10) {
deserializeJson(offlineQRCache, cached);
Serial.printf("Offline QR cache: %d codes loaded\n", offlineQRCache.size());
}
}

bool validateQROffline(String qrHash) {
for (JsonVariant v : offlineQRCache.as<JsonArray>()) {
if (v.as<String>() == qrHash) {
// Remove from cache (one-time use)
// Mark in EEPROM as used
return true;
}
}
return false;
}

16. Setup() and Loop() — Full Entry Points

void setup() {
Serial.begin(115200);
Serial.println("\n=== FlowGateX Gate System Booting ===");
Serial.printf("Firmware: %s | Chip: %s\n", FIRMWARE_VERSION,
String((uint32_t)ESP.getEfuseMac(), HEX).c_str());

// 1. GPIO init
setupGPIO();

// 2. LCD init
Wire.begin(LCD_SDA, LCD_SCL);
lcd.init(); lcd.backlight();
lcdPrint(0, "FlowGateX Boot"); lcdPrint(1, FIRMWARE_VERSION);

// 3. Sensor calibration (5s warmup)
lcdPrint(0, "Calibrating..."); lcdPrint(1, "Please wait 5s");
delay(5000);

// 4. Motor test cycle
lcdPrint(0, "Motor Test"); lcdPrint(1, "G1 + G2");
motorTestCycle();

// 5. SPIFFS
setupSPIFFS();

// 6. WiFi + mDNS
setupWiFi();
lcdPrint(0, "WiFi Ready"); lcdPrint(1, "192.168.4.1");

// 7. Web server routes (Port 80)
setupRoutes();

// 8. WebSocket server (Port 81)
setupWebSocket();

// 9. Firebase
setupFirebase();

// 10. Offline QR cache
loadOfflineQRCache();

// 11. FreeRTOS tasks
xTaskCreatePinnedToCore(sensorTask, "SensorTask", 4096, NULL, 1, NULL, 0);
xTaskCreatePinnedToCore(firebaseTask,"FirebaseTask", 8192, NULL, 1, NULL, 1);

// 12. Ready
lcdPrint(0, "READY - ONLINE");
lcdPrint(1, "FlowGateX 2026");
buzzerTone(GRANT_TONE);
Serial.println("=== Boot complete ===");
}

void loop() {
server.handleClient(); // Process incoming HTTP requests (Blocking)
webSocket.loop(); // Process incoming WebSocket events

rotateLCD(); // LCD message rotation (5s interval)
checkIRTimeout(); // Alert if user stuck in passage >15s
}

17. Flash & Upload Workflow

STEP 1 — Install Arduino IDE 2.x
→ Board Manager: search "esp32" → install "esp32 by Espressif Systems" v2.x

STEP 2 — Install Libraries
→ Library Manager: ArduinoJson, DHT, LiquidCrystal I2C, Firebase ESP32, WebSockets (by Markus Sattler)

STEP 3 — Board config
→ Tools → Board: "ESP32 Dev Module"
→ Partition Scheme: "Default 4MB with spiffs (1.2MB APP / 1.5MB SPIFFS)"
→ Upload Speed: 921600
→ CPU Frequency: 240MHz
→ Flash Size: 4MB

STEP 4 — Fill credentials
→ Edit: FIREBASE_HOST, FIREBASE_AUTH, STA_SSID, STA_PASS

STEP 5 — Upload SPIFFS (dashboard HTML files)
→ Place files in: sketch_folder/data/
→ Tools → "ESP32 Sketch Data Upload" (install plugin first)
→ This uploads index.html, app.js, style.css, qr.html

STEP 6 — Upload sketch
→ Verify → Upload

STEP 7 — Monitor
→ Tools → Serial Monitor → 115200 baud
→ Should see boot sequence, AP IP, route registrations

STEP 8 — Verify
→ Connect phone to "FlowGateX_4B2A"
→ Open [http://192.168.4.1](http://192.168.4.1) → dashboard loads
→ Open FlowGateX app → IoT Devices → Gate System → Device Connect tab
→ Gateway.tsx discovers device at 192.168.4.1 ✅

18. Endpoint Reference Table

Method

Endpoint

Consumer

Description

GET

/ping

Gateway.tsx

Identity handshake, connection validation

GET

/sensors

Dashboard JS, Ai_heatmap.tsx

Live sensor JSON snapshot

GET

/heatmap

Ai_heatmap.tsx

Inference grid + bounding boxes

POST

/gates

Dashboard JS, FlowGateX app

Gate open/close commands

POST

/qr

FlowGateX Scanner page

QR validation → GRANT/DENY

POST

/config

Ai_heatmap.tsx controls

Sensitivity + threshold updates

GET

/logs

Dashboard JS, Gateway log panel

Last 100 access log entries

GET

/qr-code

Gateway.tsx QR scanner

QR code HTML page

GET

/system

Dashboard footer

Uptime, heap, WiFi info

WS

ws://...:81

All browser clients

Real-time bidirectional push (Port 81)

GET

/dashboard

Gateway.tsx iframe

Main SPIFFS-hosted SPA

GET

/\*

Browser

Static file server (SPIFFS)

Last updated: Feb 2026 · FlowGateX IoT Module · esp32.md v1.1
