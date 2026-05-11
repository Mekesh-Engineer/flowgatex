/*
 * ============================================================================
 * FlowGateX Gate System — ESP32 Firmware (Standalone, No Firebase)
 * ============================================================================
 * Board:        ESP32 DevKit V1 (38-pin)
 * Framework:    Arduino (ESP-IDF via arduino-esp32 v3.x compatible)
 * Flash:        4MB — Partition: Default 4MB
 *
 * Architecture:
 * - Dual WiFi: SoftAP (192.168.4.1) always on + STA for uplink
 * - Web dashboard served from PROGMEM on port 80
 * - WebSocket server on port 81 (real-time sensor push + terminal feed)
 * - REST API for scanner app QR validation and gate control
 * - mDNS: flowgatex.local for easy discovery
 * - Zero cloud dependencies — fully local network operation
 * ============================================================================
 */

// ============================================================================
//  CONFIGURATION
// ============================================================================

#ifndef FLOWGATEX_CONFIG_H
#define FLOWGATEX_CONFIG_H

#define FIRMWARE_VERSION    "2.6.1"
#define DEVICE_ID           "FlowGateX-ESP32"
#define DEVICE_NAME         "FlowGateX Gate Controller"
#define FIRESTORE_DEV_ID    "esp32_001"

// ── Motor Driver (L298N) ─────────────────────────────────────────────────────
#define GATE1_ENA   5
#define GATE1_IN1   18
#define GATE1_IN2   19
#define GATE2_ENB   4
#define GATE2_IN3   16
#define GATE2_IN4   17

// ── PWM (ESP32 LEDC) ─────────────────────────────────────────────────────────
#define PWM_FREQ      5000
#define PWM_RES       8

// ── Sensors ──────────────────────────────────────────────────────────────────
#define IR1_PIN     34
#define IR2_PIN     35
#define MQ_PIN      36
#define DHT_PIN     13
#define DHT_TYPE    DHT11

// ── Buzzer ───────────────────────────────────────────────────────────────────
#define BUZZER_PIN  27
#define GRANT_TONE    0
#define DENY_TONE     1
#define COMPLETE_TONE 2
#define ALERT_TONE    3

// ── WiFi ─────────────────────────────────────────────────────────────────────
#define AP_SSID    "FlowGateX_4B2A"
#define AP_PASS    "flowgatex2026"
#define STA_SSID   "Mekesh"
#define STA_PASS   "12345678"

// ── Thresholds ───────────────────────────────────────────────────────────────
#define DEFAULT_GAS_WARN_PPM      500
#define DEFAULT_GAS_CRIT_PPM      2000
#define DEFAULT_TEMP_WARN_C       45.0f
#define DEFAULT_TEMP_CRIT_C       55.0f
#define DEFAULT_ROBOFLOW_THRESH   0.50f

// ── Gate States ──────────────────────────────────────────────────────────────
enum GateStateEnum {
  GATE_CLOSED  = 0,
  GATE_OPENING = 1,
  GATE_OPEN    = 2,
  GATE_CLOSING = 3,
  GATE_LOCKED  = 4
};

struct GateState {
  GateStateEnum state       = GATE_CLOSED;
  bool          locked      = false;
  unsigned long openedAt    = 0;
  int           autoCloseMs = 0;

  const char* statusStr() const {
    switch (state) {
      case GATE_CLOSED:  return "CLOSED";
      case GATE_OPENING: return "OPENING";
      case GATE_OPEN:    return "OPEN";
      case GATE_CLOSING: return "CLOSING";
      case GATE_LOCKED:  return "LOCKED";
      default:           return "UNKNOWN";
    }
  }
};

// ── Sensor Data ──────────────────────────────────────────────────────────────
struct SensorData {
  float  temp     = 0.0f;
  float  humidity = 0.0f;
  int    gasPPM   = 0;
  int    mqRaw    = 0;
  String ir1      = "clear";
  String ir2      = "clear";
};

// ── Access Log ───────────────────────────────────────────────────────────────
#define MAX_LOG_ENTRIES 100

struct LogEntry {
  String timestamp;
  String userID;
  String action;
  int    gate;
  String details;
};

// ── Heatmap ──────────────────────────────────────────────────────────────────
#define HEATMAP_ROWS 8
#define HEATMAP_COLS 10

// ── QR Cache (EEPROM) ────────────────────────────────────────────────────────
#define EEPROM_SIZE  4096

// ── FreeRTOS task stacks ─────────────────────────────────────────────────────
#define SENSOR_TASK_STACK  4096

// ── Roboflow prediction stub ─────────────────────────────────────────────────
struct RoboflowPrediction {
  float  x, y, width, height, confidence;
};
#define MAX_PREDICTIONS 20

#endif // FLOWGATEX_CONFIG_H

// ============================================================================
//  INCLUDES
// ============================================================================

#include <WiFi.h>
#include <ESPmDNS.h>
#include <WebServer.h>
#include <WebSocketsServer.h>
#include <DHT.h>
#include <ArduinoJson.h>
#include <EEPROM.h>
#include <time.h>

// ============================================================================
//  EMBEDDED DASHBOARD  (PROGMEM — no SPIFFS needed)
// ============================================================================

static const char DASHBOARD_HTML[] PROGMEM = R"rawhtml(
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>FlowGateX · Gate Dashboard</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0a0e17;--bg2:#111827;--card:#1a2235;--card2:#1f2a40;
  --border:#2a3548;--txt:#e4e8f1;--txt2:#8896aa;--muted:#5a6a80;
  --cyan:#00e5ff;--blue:#3b82f6;--green:#10b981;--orange:#f59e0b;
  --red:#ef4444;--purple:#a855f7;--termgreen:#39ff14;
  --r:12px;--rs:8px;--sh:0 4px 24px rgba(0,0,0,.45);--tr:.25s ease
}
html{font-size:14px;scroll-behavior:smooth}
body{font-family:'Segoe UI',system-ui,sans-serif;background:var(--bg);
  color:var(--txt);min-height:100vh;line-height:1.5;-webkit-font-smoothing:antialiased}
/* ── Header ── */
header{display:flex;align-items:center;justify-content:space-between;
  padding:12px 20px;background:linear-gradient(135deg,#0f1724,#152036);
  border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100;backdrop-filter:blur(12px)}
.hl{display:flex;align-items:center;gap:10px}
.hl h1{font-size:1.25rem;background:linear-gradient(90deg,var(--cyan),var(--blue));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.sub{font-size:.7rem;color:var(--muted)}
.logo{width:36px;height:36px;display:flex;align-items:center;justify-content:center;
  background:rgba(0,229,255,.08);border-radius:var(--rs)}
.hr{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
/* ── Badges ── */
.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;
  font-size:.68rem;font-weight:600;background:var(--card);border:1px solid var(--border);color:var(--txt2)}
.on{background:rgba(16,185,129,.12);border-color:rgba(16,185,129,.3);color:var(--green)}
.off{background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.3);color:var(--red)}
/* ── Alert banner ── */
#alert-bar{display:flex;align-items:center;gap:10px;padding:10px 20px;
  background:linear-gradient(90deg,rgba(239,68,68,.18),rgba(239,68,68,.04));
  border-bottom:1px solid rgba(239,68,68,.3);color:var(--red);font-weight:600;
  font-size:.82rem;animation:pulse 2s infinite}
#alert-bar.hide{display:none}
#alert-bar button{margin-left:auto;background:none;border:none;color:var(--red);cursor:pointer;font-size:1rem}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.7}}
/* ── Layout ── */
main{max-width:1000px;margin:0 auto;padding:16px;display:flex;flex-direction:column;gap:20px}
/* ── Cards ── */
.card{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:16px;
  transition:background var(--tr),box-shadow var(--tr);animation:fi .4s ease both}
.card:hover{background:var(--card2);box-shadow:var(--sh)}
/* ── Sensor grid ── */
.sgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
.scard{display:flex;flex-direction:column;gap:8px}
.icon{font-size:1.4rem}
.cb{display:flex;align-items:baseline;gap:4px}
.lbl{font-size:.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-right:auto}
.val{font-size:1.55rem;font-weight:700;color:var(--cyan);font-variant-numeric:tabular-nums}
.unit{font-size:.78rem;color:var(--txt2)}
.bar{height:4px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden}
.bf{height:100%;border-radius:2px;transition:width .6s ease}
.bc{background:linear-gradient(90deg,var(--cyan),var(--blue))}
.bb{background:linear-gradient(90deg,var(--blue),var(--purple))}
.bo{background:linear-gradient(90deg,var(--orange),var(--red))}
.dot{width:10px;height:10px;border-radius:50%;background:var(--green);
  box-shadow:0 0 8px rgba(16,185,129,.5);align-self:flex-end;margin-top:-18px;transition:.3s}
.dot.alert{background:var(--red);box-shadow:0 0 12px rgba(239,68,68,.6);animation:blink .8s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.25}}
/* ── Section titles ── */
.stitle{font-size:.95rem;font-weight:600;margin-bottom:12px}
.sheader{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
/* ── Gates ── */
.ggrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.gcard{text-align:center}
.gh{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.gname{font-size:.82rem;font-weight:600}
.gstat{font-size:.72rem;font-weight:700;padding:3px 10px;border-radius:20px;
  background:rgba(16,185,129,.12);color:var(--green);border:1px solid rgba(16,185,129,.3)}
.gstat.open{background:rgba(0,229,255,.12);color:var(--cyan);border-color:rgba(0,229,255,.3)}
.gstat.locked{background:rgba(239,68,68,.12);color:var(--red);border-color:rgba(239,68,68,.3)}
.gvis{height:56px;display:flex;align-items:flex-end;justify-content:center;margin:8px 0;position:relative}
.garm{width:80%;height:6px;background:linear-gradient(90deg,var(--cyan),var(--blue));
  border-radius:3px;transform-origin:left center;transform:rotate(0deg);
  transition:transform .6s cubic-bezier(.34,1.56,.64,1);box-shadow:0 0 12px rgba(0,229,255,.3)}
.garm.open{transform:rotate(-80deg)}
.garm.locked{background:linear-gradient(90deg,var(--red),var(--orange));box-shadow:0 0 12px rgba(239,68,68,.3)}
.gctrl{display:flex;gap:8px;margin-top:8px}
.btn{flex:1;padding:8px 12px;border:none;border-radius:var(--rs);font-size:.78rem;
  font-weight:600;cursor:pointer;transition:all var(--tr);color:#fff}
.bopen{background:linear-gradient(135deg,#10b981,#059669)}
.bopen:hover{box-shadow:0 4px 16px rgba(16,185,129,.4);transform:translateY(-1px)}
.bclose{background:linear-gradient(135deg,#ef4444,#dc2626)}
.bclose:hover{box-shadow:0 4px 16px rgba(239,68,68,.4);transform:translateY(-1px)}
.bsm{padding:4px 12px;font-size:.68rem;background:var(--card);border:1px solid var(--border);
  color:var(--txt2);flex:none}
.bsm:hover{background:var(--card2);color:var(--txt)}
.gmeta{font-size:.68rem;color:var(--muted);margin-top:8px}
/* ── Log table ── */
.lwrap{max-height:280px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--r)}
table{width:100%;border-collapse:collapse;font-size:.73rem}
th{background:var(--bg2);color:var(--muted);text-transform:uppercase;letter-spacing:.5px;
  font-size:.62rem;font-weight:600;padding:7px 12px;text-align:left;position:sticky;top:0;z-index:1}
td{padding:5px 12px;border-top:1px solid var(--border);color:var(--txt2)}
tr:hover td{background:var(--card2)}
.empty{text-align:center;color:var(--muted);padding:20px!important}
.lg{color:var(--green);font-weight:600}.ld{color:var(--red);font-weight:600}
.lc{color:var(--cyan);font-weight:600}.lt{color:var(--orange);font-weight:600}
/* ── QR feed ── */
.qrfeed{max-height:220px;overflow-y:auto;display:flex;flex-direction:column;gap:6px}
.qritem{display:flex;align-items:center;gap:10px;padding:8px 12px;
  border-radius:var(--rs);background:rgba(255,255,255,.03);border:1px solid var(--border)}
.qritem.grant{border-color:rgba(16,185,129,.3);background:rgba(16,185,129,.06)}
.qritem.deny{border-color:rgba(239,68,68,.3);background:rgba(239,68,68,.06)}
.qricon{font-size:1.2rem;flex-shrink:0}
.qrinfo{flex:1;min-width:0}
.qruid{font-size:.78rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.qrts{font-size:.65rem;color:var(--muted)}
.qrgate{font-size:.7rem;padding:2px 8px;border-radius:20px;background:rgba(255,255,255,.08)}
/* ── Network info ── */
.netgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px}
.ni{background:var(--card);border:1px solid var(--border);border-radius:var(--rs);
  padding:10px 12px;display:flex;flex-direction:column;gap:2px}
.nlbl{font-size:.62rem;color:var(--muted);text-transform:uppercase;letter-spacing:.5px}
.nval{font-size:.85rem;font-weight:600;color:var(--cyan);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* ── System grid ── */
.sysgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px}
.si{background:var(--card);border:1px solid var(--border);border-radius:var(--rs);
  padding:10px 12px;display:flex;flex-direction:column;gap:2px}
.sl{font-size:.62rem;color:var(--muted);text-transform:uppercase;letter-spacing:.5px}
.sv{font-size:.88rem;font-weight:600;color:var(--cyan);font-variant-numeric:tabular-nums}
/* ══ WEB TERMINAL ══════════════════════════════════════════════════════════ */
.term-wrap{
  background:#040d06;border:1px solid rgba(57,255,20,.2);border-radius:var(--r);
  overflow:hidden;box-shadow:0 0 24px rgba(57,255,20,.06)}
.term-header{
  display:flex;align-items:center;gap:8px;padding:8px 14px;
  background:rgba(57,255,20,.05);border-bottom:1px solid rgba(57,255,20,.15)}
.term-dots{display:flex;gap:6px}
.term-dot{width:10px;height:10px;border-radius:50%}
.td-r{background:#ff5f57}.td-y{background:#febc2e}.td-g{background:#28c840}
.term-title{font-size:.7rem;color:rgba(57,255,20,.5);font-family:monospace;margin-left:4px;letter-spacing:.5px}
.term-title span{color:rgba(57,255,20,.8)}
.term-body{
  font-family:'Courier New',Courier,monospace;font-size:.78rem;
  color:var(--termgreen);padding:12px 14px;height:220px;overflow-y:auto;
  line-height:1.7;letter-spacing:.3px}
.term-body::-webkit-scrollbar{width:4px}
.term-body::-webkit-scrollbar-track{background:transparent}
.term-body::-webkit-scrollbar-thumb{background:rgba(57,255,20,.2);border-radius:2px}
.tline{display:flex;gap:8px;white-space:pre-wrap;word-break:break-all}
.tline .ts{color:rgba(57,255,20,.35);flex-shrink:0;font-size:.72rem;margin-top:.1em}
.tline .msg{flex:1}
.tline.warn .msg{color:var(--orange)}
.tline.err  .msg{color:var(--red)}
.tline.info .msg{color:var(--cyan)}
.tline.ok   .msg{color:var(--green)}
.tline.sys  .msg{color:rgba(57,255,20,.55)}
.term-cursor{display:inline-block;width:7px;height:.9em;background:var(--termgreen);
  animation:cur .9s step-end infinite;vertical-align:text-bottom;margin-left:2px}
@keyframes cur{0%,100%{opacity:1}50%{opacity:0}}
.term-footer{
  display:flex;align-items:center;justify-content:space-between;
  padding:5px 14px;background:rgba(57,255,20,.03);
  border-top:1px solid rgba(57,255,20,.1);font-family:monospace}
.term-status{font-size:.65rem;color:rgba(57,255,20,.4)}
.term-count{font-size:.65rem;color:rgba(57,255,20,.35);font-variant-numeric:tabular-nums}
/* ── Footer ── */
footer{display:flex;justify-content:space-between;padding:10px 20px;font-size:.68rem;
  color:var(--muted);border-top:1px solid var(--border);background:var(--bg2)}
/* ── Scrollbar ── */
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}
/* ── Responsive ── */
@media(max-width:600px){.sgrid{grid-template-columns:1fr 1fr}.ggrid{grid-template-columns:1fr}
  .netgrid,.sysgrid{grid-template-columns:1fr 1fr}
  header{flex-direction:column;gap:8px;align-items:flex-start}.hr{width:100%;justify-content:flex-end}}
@media(max-width:400px){html{font-size:13px}.sgrid{grid-template-columns:1fr}.netgrid,.sysgrid{grid-template-columns:1fr}}
/* ── Animations ── */
@keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.card:nth-child(1){animation-delay:.04s}.card:nth-child(2){animation-delay:.08s}
.card:nth-child(3){animation-delay:.12s}.card:nth-child(4){animation-delay:.16s}
.card:nth-child(5){animation-delay:.20s}.card:nth-child(6){animation-delay:.24s}
.vu{animation:vp .4s ease}
@keyframes vp{0%{transform:scale(1)}50%{transform:scale(1.07)}100%{transform:scale(1)}}
</style>
</head>
<body>

<header>
  <div class="hl">
    <div class="logo">
      <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
        <rect x="2" y="2" width="24" height="24" rx="6" stroke="#00e5ff" stroke-width="2"/>
        <path d="M8 14h12M14 8v12" stroke="#00e5ff" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </div>
    <div><h1>FlowGateX</h1><span class="sub">Gate System &bull; Local Dashboard</span></div>
  </div>
  <div class="hr">
    <span id="conn-badge" class="badge off">&#9679; Disconnected</span>
    <span id="uptime-badge" class="badge">&#9201; --:--:--</span>
    <span id="ap-badge" class="badge">&#128225; 192.168.4.1</span>
  </div>
</header>

<div id="alert-bar" class="hide">
  <span id="alert-icon">&#9888;</span>
  <span id="alert-txt">Alert</span>
  <button onclick="dismissAlert()">&#10005;</button>
</div>

<main>

  <section class="sgrid" id="sensors">
    <div class="card scard">
      <div class="icon">&#127777;</div>
      <div class="cb"><span class="lbl">Temperature</span><span class="val" id="v-temp">--</span><span class="unit">&deg;C</span></div>
      <div class="bar"><div class="bf bc" id="b-temp" style="width:0%"></div></div>
    </div>
    <div class="card scard">
      <div class="icon">&#128167;</div>
      <div class="cb"><span class="lbl">Humidity</span><span class="val" id="v-hum">--</span><span class="unit">%</span></div>
      <div class="bar"><div class="bf bb" id="b-hum" style="width:0%"></div></div>
    </div>
    <div class="card scard" id="c-gas">
      <div class="icon">&#9729;</div>
      <div class="cb"><span class="lbl">Gas (MQ)</span><span class="val" id="v-gas">--</span><span class="unit">PPM</span></div>
      <div class="bar"><div class="bf bo" id="b-gas" style="width:0%"></div></div>
    </div>
    <div class="card scard">
      <div class="icon">&#128225;</div>
      <div class="cb"><span class="lbl">IR Beam 1 (Entry)</span><span class="val" id="v-ir1">Clear</span></div>
      <div class="dot" id="d-ir1"></div>
    </div>
    <div class="card scard">
      <div class="icon">&#128225;</div>
      <div class="cb"><span class="lbl">IR Beam 2 (Exit)</span><span class="val" id="v-ir2">Clear</span></div>
      <div class="dot" id="d-ir2"></div>
    </div>
  </section>

  <section>
    <h2 class="stitle">Gate Control</h2>
    <div class="ggrid">
      <div class="card gcard">
        <div class="gh"><span class="gname">Gate 1 &mdash; Entry</span><span class="gstat" id="g1s">CLOSED</span></div>
        <div class="gvis"><div class="garm" id="g1a"></div></div>
        <div class="gctrl">
          <button class="btn bopen" onclick="gateCmd(1,'open')">&#9650; Open</button>
          <button class="btn bclose" onclick="gateCmd(1,'close')">&#9660; Close</button>
        </div>
        <div class="gmeta" id="g1m">Status: Closed</div>
      </div>
      <div class="card gcard">
        <div class="gh"><span class="gname">Gate 2 &mdash; Exit</span><span class="gstat" id="g2s">CLOSED</span></div>
        <div class="gvis"><div class="garm" id="g2a"></div></div>
        <div class="gctrl">
          <button class="btn bopen" onclick="gateCmd(2,'open')">&#9650; Open</button>
          <button class="btn bclose" onclick="gateCmd(2,'close')">&#9660; Close</button>
        </div>
        <div class="gmeta" id="g2m">Status: Closed</div>
      </div>
    </div>
  </section>

  <section>
    <div class="sheader">
      <h2 class="stitle">&#9654; System Terminal</h2>
      <button class="btn bsm" onclick="clearTerm()">&#10006; Clear</button>
    </div>
    <div class="term-wrap">
      <div class="term-header">
        <div class="term-dots">
          <div class="term-dot td-r"></div>
          <div class="term-dot td-y"></div>
          <div class="term-dot td-g"></div>
        </div>
        <span class="term-title">flowgatex@esp32 — <span id="t-host">192.168.4.1</span></span>
      </div>
      <div class="term-body" id="term-body">
        <div class="tline sys"><span class="ts">--:--:--</span><span class="msg">FlowGateX v2.6.0 terminal ready. Awaiting connection...</span></div>
        <div class="tline sys"><span class="ts">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span><span class="msg"><span class="term-cursor"></span></span></div>
      </div>
      <div class="term-footer">
        <span class="term-status" id="t-status">&#9679; Connecting...</span>
        <span class="term-count"><span id="t-count">0</span> lines</span>
      </div>
    </div>
  </section>

  <section>
    <div class="sheader">
      <h2 class="stitle">QR Scan Feed</h2>
      <button class="btn bsm" onclick="clearQRFeed()">&#10006; Clear</button>
    </div>
    <div class="card" style="padding:12px">
      <div class="qrfeed" id="qr-feed">
        <div style="text-align:center;color:var(--muted);padding:16px;font-size:.78rem">
          Waiting for scans from the FlowGateX app&hellip;
        </div>
      </div>
    </div>
  </section>

  <section>
    <div class="sheader">
      <h2 class="stitle">Access Log</h2>
      <button class="btn bsm" onclick="fetchLogs()">&#8635; Refresh</button>
    </div>
    <div class="lwrap">
      <table>
        <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Gate</th></tr></thead>
        <tbody id="log-body"><tr><td colspan="4" class="empty">No logs yet</td></tr></tbody>
      </table>
    </div>
  </section>

  <section>
    <h2 class="stitle">Network</h2>
    <div class="netgrid">
      <div class="ni"><span class="nlbl">AP SSID</span><span class="nval" id="n-ssid">--</span></div>
      <div class="ni"><span class="nlbl">AP IP</span><span class="nval" id="n-apip">192.168.4.1</span></div>
      <div class="ni"><span class="nlbl">STA IP</span><span class="nval" id="n-staip">--</span></div>
      <div class="ni"><span class="nlbl">STA RSSI</span><span class="nval" id="n-rssi">--</span></div>
      <div class="ni"><span class="nlbl">AP Clients</span><span class="nval" id="n-clients">0</span></div>
      <div class="ni"><span class="nlbl">mDNS</span><span class="nval">flowgatex.local</span></div>
    </div>
  </section>

  <section>
    <h2 class="stitle">System</h2>
    <div class="sysgrid">
      <div class="si"><span class="sl">Firmware</span><span class="sv" id="s-fw">--</span></div>
      <div class="si"><span class="sl">Chip ID</span><span class="sv" id="s-chip">--</span></div>
      <div class="si"><span class="sl">Free Heap</span><span class="sv" id="s-heap">--</span></div>
      <div class="si"><span class="sl">Mode</span><span class="sv" id="s-mode">--</span></div>
      <div class="si"><span class="sl">Occupancy</span><span class="sv" id="s-occ">0</span></div>
      <div class="si"><span class="sl">Peak Today</span><span class="sv" id="s-peak">0</span></div>
    </div>
  </section>

</main>

<footer>
  <span>FlowGateX &bull; ESP32 &bull; <span id="f-ip">192.168.4.1</span> &bull; WS :81</span>
  <span id="f-time">--</span>
</footer>

<script>
(function(){
'use strict';
var WS_PORT=81, POLL=3000, LOG_POLL=12000, SYS_POLL=6000, RECONN=3000, MAX_R=12;
var TERM_MAX=200;
var ws=null,wsCon=false,rAttempts=0,pollT=null,logT=null,sysT=null,upSec=0;
var qrItems=[], termLines=[], termCount=0;
var $=function(id){return document.getElementById(id);};

// ── Boot ──
document.addEventListener('DOMContentLoaded',function(){
  connect();
  fetchSys();fetchLogs();
  logT=setInterval(fetchLogs,LOG_POLL);
  sysT=setInterval(fetchSys,SYS_POLL);
  setInterval(function(){upSec++;setUptime();},1000);
  setInterval(function(){var t=$('f-time');if(t)t.textContent=new Date().toLocaleTimeString('en-US',{hour12:false});},1000);
  termLog('sys','FlowGateX dashboard loaded. Connecting to device...');
});

// ── WebSocket ──
function connect(){
  var host=window.location.hostname||'192.168.4.1';
  var url='ws://'+host+':'+WS_PORT+'/';
  try{ws=new WebSocket(url);}catch(e){fallback();return;}
  ws.onopen=function(){
    wsCon=true;rAttempts=0;setBadge(true);stopFallback();
    ws.send(JSON.stringify({action:'ping'}));
    termLog('ok','WebSocket connected → ws://'+host+':'+WS_PORT);
    setTermStatus(true);
  };
  ws.onmessage=function(ev){
    try{
      var d=JSON.parse(ev.data);
      if(d.pong){termLog('sys','PONG received. RTT OK.');return;}
      if(d.term_line0!==undefined){handleTermMsg(d);return;}
      if(d.alert){handleAlert(d);return;}
      if(d.event){handleEvent(d);return;}
      if(d.sensors)updateSensors(d);
    }catch(e){}
  };
  ws.onclose=function(){wsCon=false;setBadge(false);setTermStatus(false);termLog('warn','WebSocket disconnected. Reconnecting...');reconnect();};
  ws.onerror=function(){wsCon=false;setBadge(false);};
}
function reconnect(){
  rAttempts++;
  if(rAttempts>MAX_R){fallback();return;}
  setTimeout(connect,RECONN);
}
function fallback(){if(pollT)return;pollT=setInterval(pollSensors,POLL);pollSensors();termLog('warn','WS failed. Falling back to REST polling.');}
function stopFallback(){if(pollT){clearInterval(pollT);pollT=null;}}
function pollSensors(){
  fetch('/sensors').then(function(r){return r.json();})
    .then(function(d){updateSensors(d);setBadge(true);})
    .catch(function(){setBadge(false);});
}

// ── Terminal ──
function tsNow(){return new Date().toLocaleTimeString('en-US',{hour12:false});}

function handleTermMsg(d){
  var l0=(d.term_line0||'').trim();
  var l1=(d.term_line1||'').trim();
  var cls=termClass(l0+' '+l1);
  var combined=l0+(l1.length?' │ '+l1:'');
  termLog(cls,combined);
}

function termClass(msg){
  var u=msg.toUpperCase();
  if(u.indexOf('ALERT')>=0||u.indexOf('DENIED')>=0||u.indexOf('LOCKED')>=0||u.indexOf('ERROR')>=0)return'err';
  if(u.indexOf('WARN')>=0||u.indexOf('TIMEOUT')>=0)return'warn';
  if(u.indexOf('GRANTED')>=0||u.indexOf('OPEN')>=0||u.indexOf('COMPLETE')>=0||u.indexOf('READY')>=0||u.indexOf('UNLOCKED')>=0)return'ok';
  if(u.indexOf('CALIBRAT')>=0||u.indexOf('BOOT')>=0||u.indexOf('WIFI')>=0||u.indexOf('AP')>=0||u.indexOf('GATE')>=0)return'info';
  return'sys';
}

function termLog(cls,msg){
  termLines.push({ts:tsNow(),cls:cls,msg:msg});
  if(termLines.length>TERM_MAX)termLines.shift();
  termCount++;
  renderTerm();
}

function renderTerm(){
  var el=$('term-body');if(!el)return;
  el.innerHTML=termLines.map(function(l){
    return '<div class="tline '+l.cls+'">'
      +'<span class="ts">'+esc(l.ts)+'</span>'
      +'<span class="msg">'+esc(l.msg)+'</span>'
      +'</div>';
  }).join('')
  +'<div class="tline sys"><span class="ts">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>'
  +'<span class="msg"><span class="term-cursor"></span></span></div>';
  el.scrollTop=el.scrollHeight;
  var tc=$('t-count');if(tc)tc.textContent=termCount;
}

window.clearTerm=function(){termLines=[];termCount=0;renderTerm();};

function setTermStatus(ok){
  var s=$('t-status');
  if(s)s.innerHTML=ok?'&#9679; Connected &mdash; live feed':'&#9679; Disconnected';
  s.style.color=ok?'rgba(57,255,20,.7)':'rgba(239,68,68,.7)';
}

// ── Sensor UI ──
function updateSensors(data){
  if(!data||!data.sensors)return;
  var s=data.sensors,g=data.gates,a=data.alerts,sys=data.system;
  sv('v-temp',fmt(s.dht11_temp,1));bar('b-temp',cl(s.dht11_temp/60*100,0,100));
  setAlert('c-gas',a&&a.gas_alert);
  sv('v-hum',fmt(s.dht11_humidity,0));bar('b-hum',cl(s.dht11_humidity,0,100));
  sv('v-gas',s.mq_gas_ppm);bar('b-gas',cl(s.mq_gas_ppm/5000*100,0,100));
  sv('v-ir1',cap(s.ir1_status));dot('d-ir1',s.ir1_status==='blocked');
  sv('v-ir2',cap(s.ir2_status));dot('d-ir2',s.ir2_status==='blocked');
  if(g){gateUI(1,g.gate1,g.gate1_uptime_ms);gateUI(2,g.gate2,g.gate2_uptime_ms);}
  if(a&&a.gas_alert)showAlert('&#9888; GAS ALERT &mdash; '+s.mq_gas_ppm+' PPM! Gates locked.');
  if(sys&&sys.uptime_s){upSec=sys.uptime_s;setUptime();}
}
function gateUI(n,status,ms){
  var su=$(('g'+n+'s')),ar=$(('g'+n+'a')),m=$(('g'+n+'m'));
  if(!su)return;
  var u=(status||'CLOSED').toUpperCase();
  su.textContent=u;su.className='gstat';ar.className='garm';
  if(u==='OPEN'||u==='OPENING'){su.classList.add('open');ar.classList.add('open');}
  else if(u==='LOCKED'){su.classList.add('locked');ar.classList.add('locked');}
  m.textContent=ms>0?'Open for: '+dur(ms/1000):'Status: '+u.charAt(0)+u.slice(1).toLowerCase();
}

// ── QR event ──
function handleEvent(d){
  var ev=d.event,uid=d.userID||'Unknown',gate=d.gate||'?';
  var isGrant=(ev==='qr_grant');
  var item={uid:uid,gate:gate,ts:tsNow(),grant:isGrant};
  qrItems.unshift(item);
  if(qrItems.length>20)qrItems.pop();
  renderQRFeed();
  termLog(isGrant?'ok':'err',(isGrant?'ACCESS GRANTED':'ACCESS DENIED')+' — User: '+uid+' Gate: '+gate);
}
function renderQRFeed(){
  var el=$('qr-feed');if(!el)return;
  if(qrItems.length===0){
    el.innerHTML='<div style="text-align:center;color:var(--muted);padding:16px;font-size:.78rem">Waiting for scans&hellip;</div>';return;
  }
  el.innerHTML=qrItems.map(function(it){
    return '<div class="qritem '+(it.grant?'grant':'deny')+'">'
      +'<div class="qricon">'+(it.grant?'&#9989;':'&#10060;')+'</div>'
      +'<div class="qrinfo"><div class="qruid">'+esc(it.uid)+'</div>'
      +'<div class="qrts">'+esc(it.ts)+'</div></div>'
      +'<div class="qrgate">Gate '+it.gate+'</div>'
      +'</div>';
  }).join('');
}
window.clearQRFeed=function(){qrItems=[];renderQRFeed();};

// ── Gate commands ──
window.gateCmd=function(gate,action){
  termLog('info','Command: '+(action==='open'?'OPEN':'CLOSE')+' Gate '+gate);
  if(wsCon&&ws&&ws.readyState===1){
    ws.send(JSON.stringify({action:action==='open'?'open_gate':'close_gate',gate:gate}));return;
  }
  fetch('/gates',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({gate:gate,action:action,duration:5000})})
    .catch(function(){showAlert('&#9888; Gate command failed &mdash; check connection');termLog('err','Gate command failed — REST error');});
};

// ── Logs ──
window.fetchLogs=function(){
  fetch('/logs').then(function(r){return r.json();})
    .then(function(d){renderLogs(d.logs||[]);}).catch(function(){});
};
function renderLogs(logs){
  var tb=$('log-body');if(!tb)return;
  if(!logs||!logs.length){tb.innerHTML='<tr><td colspan="4" class="empty">No logs yet</td></tr>';return;}
  tb.innerHTML=logs.slice().reverse().slice(0,50).map(function(l){
    var cls=lac(l.action);
    var t=(l.timestamp||'--');var st=t.indexOf('T')>=0?t.split('T')[1].replace('Z',''):t;
    return '<tr><td>'+esc(st)+'</td><td>'+esc(l.userID||'--')+'</td>'
      +'<td class="'+cls+'">'+esc(l.action||'--')+'</td><td>'+(l.gate||'--')+'</td></tr>';
  }).join('');
}
function lac(a){if(!a)return'';var u=a.toUpperCase();
  if(u==='GRANT'||u==='OPENED')return'lg';if(u==='DENY')return'ld';
  if(u==='COMPLETE')return'lc';if(u.indexOf('TIMEOUT')>=0)return'lt';return'';}

// ── System info ──
function fetchSys(){
  fetch('/system').then(function(r){return r.json();})
    .then(function(d){
      sv('s-fw',d.fw_version||'--');sv('s-chip',d.chip_id||'--');
      sv('s-heap',fmtBytes(d.free_heap));sv('s-mode',d.offline_mode?'Offline':'Online');
      sv('n-clients',d.ap_clients||'0');sv('n-rssi',(d.sta_rssi||'--')+' dBm');
      sv('n-staip',d.sta_ip||'--');sv('n-ssid',d.ap_ssid||'--');
      sv('n-apip',d.ap_ip||'192.168.4.1');
      var fi=$('f-ip');if(fi)fi.textContent=d.ap_ip||'192.168.4.1';
      var th=$('t-host');if(th)th.textContent=d.ap_ip||'192.168.4.1';
      if(d.uptime_s)upSec=d.uptime_s;
    }).catch(function(){});
  fetch('/heatmap').then(function(r){return r.json();})
    .then(function(d){
      sv('s-occ',d.total_detected||0);sv('s-peak',d.zone_summary&&d.zone_summary.peak||0);
    }).catch(function(){});
}

// ── Alerts ──
function handleAlert(data){
  var type=data.alert,msg='';
  if(type==='gas_critical'){msg='&#9888; GAS ALERT &mdash; '+(data.ppm||'?')+' PPM! Gates LOCKED.';termLog('err','GAS CRITICAL: '+(data.ppm||'?')+' PPM — All gates locked');}
  else if(type==='temp_warning'){msg='&#127777; TEMP WARNING &mdash; '+(data.temp||'?')+'&deg;C';termLog('warn','TEMP WARNING: '+(data.temp||'?')+'°C');}
  else if(type==='ir_timeout'){msg='&#128225; IR TIMEOUT &mdash; Gate '+(data.gate||'?')+'. Check passage.';termLog('warn','IR TIMEOUT Gate '+(data.gate||'?')+' — Passage check required');}
  else{msg='&#9888; Alert: '+type;termLog('warn','ALERT: '+type);}
  showAlert(msg);
}
function showAlert(msg){var b=$('alert-bar'),t=$('alert-txt');if(b&&t){t.innerHTML=msg;b.classList.remove('hide');}}
window.dismissAlert=function(){var b=$('alert-bar');if(b)b.classList.add('hide');};

// ── Helpers ──
function setBadge(ok){
  var b=$('conn-badge');if(!b)return;
  b.textContent=ok?'\u25cf Connected':'\u25cf Disconnected';
  b.className='badge '+(ok?'on':'off');
}
function sv(id,val){
  var el=$(id);if(!el)return;var s=String(val);
  if(el.textContent!==s){el.textContent=s;el.classList.remove('vu');void el.offsetWidth;el.classList.add('vu');}
}
function bar(id,pct){var el=$(id);if(el)el.style.width=cl(pct,0,100)+'%';}
function dot(id,active){var el=$(id);if(!el)return;if(active)el.classList.add('alert');else el.classList.remove('alert');}
function setAlert(id,isAlert){var el=$(id);if(!el)return;el.style.borderColor=isAlert?'rgba(239,68,68,.5)':'';}
function setUptime(){sv('uptime-badge','\u23f1 '+dur(upSec));}
function fmt(v,d){if(v===null||v===undefined||isNaN(v))return'--';return Number(v).toFixed(d||0);}
function fmtBytes(b){if(!b||isNaN(b))return'--';if(b<1024)return b+' B';return(b/1024).toFixed(1)+' KB';}
function dur(s){var h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sc=Math.floor(s%60);return p(h)+':'+p(m)+':'+p(sc);}
function p(n){return n<10?'0'+n:String(n);}
function cl(v,mn,mx){return Math.max(mn,Math.min(mx,v));}
function cap(s){if(!s)return'--';return s.charAt(0).toUpperCase()+s.slice(1);}
function esc(s){if(!s)return'';return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
})();
</script>
</body>
</html>
)rawhtml";

// ============================================================================
//  GLOBAL OBJECTS
// ============================================================================

WebServer        server(80);
WebSocketsServer webSocket = WebSocketsServer(81);
DHT              dht(DHT_PIN, DHT_TYPE);

// ============================================================================
//  GLOBAL STATE
// ============================================================================

bool          offlineMode = false;
unsigned long bootTime    = 0;

SensorData sensorData;
GateState  gate1State;
GateState  gate2State;

bool gasAlertActive = false;

int   gasWarnPPM        = DEFAULT_GAS_WARN_PPM;
int   gasCritPPM        = DEFAULT_GAS_CRIT_PPM;
float tempWarnC         = DEFAULT_TEMP_WARN_C;
float tempCritC         = DEFAULT_TEMP_CRIT_C;
float roboflowThreshold = DEFAULT_ROBOFLOW_THRESH;

int  heatmapGrid[HEATMAP_ROWS][HEATMAP_COLS];
int  totalOccupancy     = 0;
int  peakOccupancyToday = 0;
unsigned long lastInferenceMs = 0;

RoboflowPrediction roboflowResults[MAX_PREDICTIONS];
int roboflowCount = 0;

LogEntry accessLogs[MAX_LOG_ENTRIES];
int logHead  = 0;
int logCount = 0;

StaticJsonDocument<2048> offlineQRCache;

TimerHandle_t alarmTimer = NULL;
bool          alarmActive = false;

// Terminal rotation state
int           termRotateIdx  = 0;
unsigned long lastTermRotate = 0;

// ============================================================================
//  FORWARD DECLARATIONS
// ============================================================================

void closeGate(int gate);
void triggerGasAlert();
void triggerTempAlert();

// ============================================================================
//  UTILITY
// ============================================================================

String getISO8601() {
  struct tm ti;
  if (getLocalTime(&ti)) {
    char buf[30];
    strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &ti);
    return String(buf);
  }
  char buf[24];
  snprintf(buf, sizeof(buf), "T+%lus", millis() / 1000);
  return String(buf);
}

// ============================================================================
//  WEB TERMINAL 
// ============================================================================

String termLines[2] = {"", ""};

void termPrint(int row, const String& msg) {
  if (row < 0 || row > 1) return;
  termLines[row] = msg;
  StaticJsonDocument<128> d;
  d["term_line0"] = termLines[0];
  d["term_line1"] = termLines[1];
  String out; serializeJson(d, out);
  webSocket.broadcastTXT(out);
  Serial.printf("[TERM] [%d] %s\n", row, msg.c_str());
}

void termPrint(int row, const char* msg) { termPrint(row, String(msg)); }

// ============================================================================
//  EEPROM HELPERS
// ============================================================================

String readEEPROM(int start, int maxLen) {
  String r;
  for (int i = start; i < start + maxLen; i++) {
    char c = EEPROM.read(i);
    if (c == 0 || c == 255) break;
    r += c;
  }
  return r;
}
void writeEEPROM(int start, const String& data) {
  for (unsigned int i = 0; i < data.length(); i++) EEPROM.write(start + i, data[i]);
  EEPROM.write(start + data.length(), 0);
  EEPROM.commit();
}

// ============================================================================
//  GPIO INITIALIZATION
// ============================================================================

void setupGPIO() {
  Serial.println("[GPIO] Init...");
  pinMode(GATE1_ENA, OUTPUT); pinMode(GATE1_IN1, OUTPUT); pinMode(GATE1_IN2, OUTPUT);
  pinMode(GATE2_ENB, OUTPUT); pinMode(GATE2_IN3, OUTPUT); pinMode(GATE2_IN4, OUTPUT);
  
  digitalWrite(GATE1_IN1, LOW); digitalWrite(GATE1_IN2, LOW);
  digitalWrite(GATE2_IN3, LOW); digitalWrite(GATE2_IN4, LOW);

  // Updated ESP32 Core v3 API for PWM
  ledcAttach(GATE1_ENA, PWM_FREQ, PWM_RES);
  ledcWrite(GATE1_ENA, 0);
  
  ledcAttach(GATE2_ENB, PWM_FREQ, PWM_RES);
  ledcWrite(GATE2_ENB, 0);

  pinMode(IR1_PIN, INPUT); pinMode(IR2_PIN, INPUT);
  pinMode(MQ_PIN,  INPUT); pinMode(DHT_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT); digitalWrite(BUZZER_PIN, LOW);
  Serial.println("[GPIO] Done.");
}

// ============================================================================
//  MOTOR TEST
// ============================================================================

void motorTestCycle() {
  auto pulse = [](int in1, int in2, int pin, bool fwd) {
    digitalWrite(in1, fwd ? HIGH : LOW);
    digitalWrite(in2, fwd ? LOW  : HIGH);
    ledcWrite(pin, 100); delay(400); ledcWrite(pin, 0);
    digitalWrite(in1, LOW); digitalWrite(in2, LOW);
  };
  Serial.println("[MOTOR] Test...");
  pulse(GATE1_IN1, GATE1_IN2, GATE1_ENA, true);
  pulse(GATE1_IN1, GATE1_IN2, GATE1_ENA, false);
  pulse(GATE2_IN3, GATE2_IN4, GATE2_ENB, true);
  pulse(GATE2_IN3, GATE2_IN4, GATE2_ENB, false);
  Serial.println("[MOTOR] Done.");
}

// ============================================================================
//  BUZZER
// ============================================================================

void buzzerTone(int p) {
  switch (p) {
    case GRANT_TONE:    digitalWrite(BUZZER_PIN, HIGH); delay(200); digitalWrite(BUZZER_PIN, LOW); break;
    case DENY_TONE:     for (int i=0;i<2;i++){digitalWrite(BUZZER_PIN,HIGH);delay(100);digitalWrite(BUZZER_PIN,LOW);delay(100);} break;
    case COMPLETE_TONE: for (int i=0;i<2;i++){digitalWrite(BUZZER_PIN,HIGH);delay(300);digitalWrite(BUZZER_PIN,LOW);delay(150);} break;
    case ALERT_TONE:    digitalWrite(BUZZER_PIN, HIGH); delay(2000); digitalWrite(BUZZER_PIN, LOW); break;
  }
}

void alarmTimerCB(TimerHandle_t xTimer) {
  static bool toggle = false;
  toggle = !toggle;
  digitalWrite(BUZZER_PIN, toggle ? HIGH : LOW);
}
void buzzerAlarm() {
  if (!alarmTimer) alarmTimer = xTimerCreate("Alarm", pdMS_TO_TICKS(500), pdTRUE, NULL, alarmTimerCB);
  alarmActive = true;
  xTimerStart(alarmTimer, 0);
}
void buzzerAlarmStop() {
  if (alarmTimer) xTimerStop(alarmTimer, 0);
  alarmActive = false;
  digitalWrite(BUZZER_PIN, LOW);
}

// ============================================================================
//  ACCESS LOGGING
// ============================================================================

void logEntry(const String& userID, const String& action, int gate, const String& details = "") {
  int i = logHead;
  accessLogs[i].timestamp = getISO8601();
  accessLogs[i].userID    = userID;
  accessLogs[i].action    = action;
  accessLogs[i].gate      = gate;
  accessLogs[i].details   = details;
  logHead = (logHead + 1) % MAX_LOG_ENTRIES;
  if (logCount < MAX_LOG_ENTRIES) logCount++;
  Serial.printf("[LOG] %s | %s | Gate %d | %s\n",
    accessLogs[i].timestamp.c_str(), userID.c_str(), gate, action.c_str());
}

// ============================================================================
//  JSON BUILDERS
// ============================================================================

String buildSensorJson() {
  StaticJsonDocument<1024> doc;
  doc["timestamp"] = getISO8601();

  auto s = doc.createNestedObject("sensors");
  s["dht11_temp"]     = sensorData.temp;
  s["dht11_humidity"] = sensorData.humidity;
  s["mq_gas_ppm"]     = sensorData.gasPPM;
  s["mq_raw_adc"]     = sensorData.mqRaw;
  s["ir1_status"]     = sensorData.ir1;
  s["ir2_status"]     = sensorData.ir2;

  auto g = doc.createNestedObject("gates");
  g["gate1"]           = gate1State.statusStr();
  g["gate2"]           = gate2State.statusStr();
  g["gate1_uptime_ms"] = (gate1State.state == GATE_OPEN) ? (millis() - gate1State.openedAt) : 0;
  g["gate2_uptime_ms"] = (gate2State.state == GATE_OPEN) ? (millis() - gate2State.openedAt) : 0;

  auto a = doc.createNestedObject("alerts");
  a["gas_alert"]  = gasAlertActive;
  a["temp_alert"] = (sensorData.temp > tempWarnC);
  a["ir_timeout"] = false;

  auto sys = doc.createNestedObject("system");
  sys["status"]    = offlineMode ? "offline" : "online";
  sys["ap_clients"]= (int)WiFi.softAPgetStationNum();
  sys["uptime_s"]  = (int)(millis() / 1000);
  sys["free_heap"] = (int)ESP.getFreeHeap();
  sys["sta_rssi"]  = WiFi.RSSI();

  String out; serializeJson(doc, out); return out;
}

String buildHeatmapJson() {
  StaticJsonDocument<2048> doc;
  doc["timestamp"]            = getISO8601();
  doc["total_detected"]       = totalOccupancy;
  doc["inference_ms"]         = lastInferenceMs;
  doc["model"]                = "YOLOv8-Nano";
  doc["confidence_threshold"] = roboflowThreshold;

  auto zones = doc.createNestedArray("zones");
  for (int r = 0; r < HEATMAP_ROWS; r++)
    for (int c = 0; c < HEATMAP_COLS; c++) {
      auto z = zones.createNestedObject();
      z["row"]=r; z["col"]=c; z["count"]=heatmapGrid[r][c];
    }

  auto zs = doc.createNestedObject("zone_summary");
  int zA=0, zB=0, zC=0;
  for (int r=0;r<4;r++) for(int c=0;c<5;c++) zA+=heatmapGrid[r][c];
  for (int r=0;r<HEATMAP_ROWS;r++) for(int c=0;c<HEATMAP_COLS;c++) zB+=heatmapGrid[r][c];
  for (int r=4;r<8;r++) for(int c=5;c<HEATMAP_COLS;c++) zC+=heatmapGrid[r][c];
  zs["zone_a"]=zA; zs["zone_b"]=zB; zs["zone_c"]=zC; zs["peak"]=peakOccupancyToday;

  String out; serializeJson(doc, out); return out;
}

String buildLogsJson() {
  StaticJsonDocument<8192> doc;
  auto arr = doc.createNestedArray("logs");
  int start = (logCount < MAX_LOG_ENTRIES) ? 0 : logHead;
  for (int i = 0; i < logCount; i++) {
    int idx = (start + i) % MAX_LOG_ENTRIES;
    auto e = arr.createNestedObject();
    e["timestamp"] = accessLogs[idx].timestamp;
    e["userID"]    = accessLogs[idx].userID;
    e["action"]    = accessLogs[idx].action;
    e["gate"]      = accessLogs[idx].gate;
    if (accessLogs[idx].details.length()) e["details"] = accessLogs[idx].details;
  }
  doc["total"] = logCount;
  String out; serializeJson(doc, out); return out;
}

String buildDiscoverJson() {
  StaticJsonDocument<512> doc;
  doc["id"]          = DEVICE_ID;
  doc["name"]        = DEVICE_NAME;
  doc["fw"]          = FIRMWARE_VERSION;
  doc["type"]        = "gate_controller";
  doc["ap_ip"]       = "192.168.4.1";
  doc["sta_ip"]      = WiFi.localIP().toString();
  doc["ap_ssid"]     = AP_SSID;
  doc["ws_port"]     = 81;
  doc["api_version"] = "1";
  doc["endpoints"]   = "/ping,/sensors,/heatmap,/logs,/system,/qr,/gates,/config,/discover";
  doc["uptime_s"]    = (int)(millis() / 1000);
  doc["status"]      = "ready";
  String out; serializeJson(doc, out); return out;
}

// ============================================================================
//  HEATMAP DEMO
// ============================================================================

void updateHeatmapDemo() {
  memset(heatmapGrid, 0, sizeof(heatmapGrid));
  totalOccupancy = 0;
  if (sensorData.ir1 == "blocked") { heatmapGrid[1][1]++; heatmapGrid[1][2]++; totalOccupancy += 2; }
  if (sensorData.ir2 == "blocked") { heatmapGrid[6][8]++; heatmapGrid[6][9]++; totalOccupancy += 2; }
  int amb = random(1, 4);
  for (int i = 0; i < amb; i++) { heatmapGrid[random(2,6)][random(3,7)]++; totalOccupancy++; }
  if (totalOccupancy > peakOccupancyToday) peakOccupancyToday = totalOccupancy;
  lastInferenceMs = random(20, 80);
}

// ============================================================================
//  GATE MOTOR CONTROL
// ============================================================================

void openGate(int gate, int durationMs) {
  int in1   = (gate == 1) ? GATE1_IN1 : GATE2_IN3;
  int in2   = (gate == 1) ? GATE1_IN2 : GATE2_IN4;
  int enPin = (gate == 1) ? GATE1_ENA : GATE2_ENB;
  GateState* gs = (gate == 1) ? &gate1State : &gate2State;

  if (gs->locked) {
    Serial.printf("[GATE] Gate %d LOCKED\n", gate);
    termPrint(0, "GATE " + String(gate) + " IS LOCKED");
    termPrint(1, "Command rejected");
    return;
  }

  gs->state = GATE_OPENING;
  termPrint(0, "GATE " + String(gate) + " OPENING");
  termPrint(1, "Motor ramp-up...");

  digitalWrite(in1, HIGH); digitalWrite(in2, LOW);
  for (int spd = 0; spd <= 200; spd += 10) { ledcWrite(enPin, spd); delay(40); }

  gs->state = GATE_OPEN; gs->openedAt = millis();
  termPrint(0, "GATE " + String(gate) + " OPEN");
  termPrint(1, "Auto-close: " + String(durationMs) + "ms");
  buzzerTone(GRANT_TONE);
  logEntry("SYSTEM", "OPENED", gate, "dur=" + String(durationMs) + "ms");

  if (durationMs > 0) {
    gs->autoCloseMs = durationMs;
    TimerHandle_t t = xTimerCreate("AC", pdMS_TO_TICKS(durationMs), pdFALSE,
      (void*)(intptr_t)gate,
      [](TimerHandle_t xT){ int g=(int)(intptr_t)pvTimerGetTimerID(xT); closeGate(g); xTimerDelete(xT,0); });
    xTimerStart(t, 0);
  }

  String wsMsg = "{\"event\":\"gate_open\",\"gate\":" + String(gate) + "}";
  webSocket.broadcastTXT(wsMsg);
}

void closeGate(int gate) {
  int in1   = (gate == 1) ? GATE1_IN1 : GATE2_IN3;
  int in2   = (gate == 1) ? GATE1_IN2 : GATE2_IN4;
  int enPin = (gate == 1) ? GATE1_ENA : GATE2_ENB;
  GateState* gs = (gate == 1) ? &gate1State : &gate2State;

  gs->state = GATE_CLOSING;
  termPrint(0, "GATE " + String(gate) + " CLOSING");
  termPrint(1, "Reversing motor...");
  digitalWrite(in1, LOW); digitalWrite(in2, HIGH);
  ledcWrite(enPin, 180); delay(800); ledcWrite(enPin, 0);
  digitalWrite(in2, LOW);

  gs->state = GATE_CLOSED;
  termPrint(0, "GATE " + String(gate) + " CLOSED");
  termPrint(1, "Secured.");
  logEntry("SYSTEM", "CLOSED", gate);

  String wsMsg = "{\"event\":\"gate_close\",\"gate\":" + String(gate) + "}";
  webSocket.broadcastTXT(wsMsg);
}

void lockAllGates(const String& reason) {
  gate1State.locked = gate2State.locked = true;
  closeGate(1); closeGate(2);
  termPrint(0, "!! GATES LOCKED !!");
  termPrint(1, reason.substring(0, 16));
  buzzerAlarm();
}

void unlockAllGates() {
  gate1State.locked = gate2State.locked = false;
  gasAlertActive = false;
  buzzerAlarmStop();
  termPrint(0, "GATES UNLOCKED");
  termPrint(1, "System Reset OK");
  Serial.println("[GATE] Unlocked.");
}

// ============================================================================
//  ACCESS CONTROL
// ============================================================================

void grantAccess(const String& userID, int gateNum, int duration) {
  Serial.printf("[ACCESS] GRANT: %s → Gate %d\n", userID.c_str(), gateNum);
  termPrint(0, "ACCESS GRANTED");
  termPrint(1, userID.substring(0, 16));
  buzzerTone(GRANT_TONE);
  openGate(gateNum, duration);
  logEntry(userID, "GRANT", gateNum);

  if (gateNum == 1) {
    unsigned long t = millis();
    while (digitalRead(IR1_PIN) != LOW && millis() - t < 10000) delay(50);
    if (digitalRead(IR1_PIN) == LOW) {
      termPrint(1, "IR1 OK — SEC CHK...");
      delay(2000);
      t = millis();
      while (digitalRead(IR2_PIN) != LOW && millis() - t < 15000) delay(50);
      if (digitalRead(IR2_PIN) == LOW) {
        openGate(2, 3000);
        termPrint(0, "ACCESS COMPLETE");
        termPrint(1, "WELCOME");
        buzzerTone(COMPLETE_TONE);
        logEntry(userID, "COMPLETE", 2);
      } else {
        termPrint(0, "IR2 TIMEOUT");
        termPrint(1, "CHECK PASSAGE");
        buzzerTone(ALERT_TONE);
        logEntry(userID, "IR_TIMEOUT", 2);
        
        String alertMsg = "{\"alert\":\"ir_timeout\",\"gate\":2}";
        webSocket.broadcastTXT(alertMsg);
      }
    }
  }
}

void denyAccess(const String& userID) {
  termPrint(0, "ACCESS DENIED");
  termPrint(1, userID.substring(0, 16));
  buzzerTone(DENY_TONE);
  logEntry(userID, "DENY", 0);
}

// ============================================================================
//  ALERT PROTOCOLS
// ============================================================================

void triggerGasAlert() {
  lockAllGates("GAS ALERT");
  termPrint(0, "!! GAS ALERT !!");
  termPrint(1, String(sensorData.gasPPM) + " PPM DETECTED");
  
  String alertMsg = "{\"alert\":\"gas_critical\",\"ppm\":" + String(sensorData.gasPPM) + "}";
  webSocket.broadcastTXT(alertMsg);
  buzzerAlarm();
}

void triggerTempAlert() {
  termPrint(0, "!! TEMP ALERT !!");
  char msg[17]; snprintf(msg, 17, "%.1f C — HOT!", sensorData.temp);
  termPrint(1, msg);
  
  String alertMsg = "{\"alert\":\"temp_warning\",\"temp\":" + String(sensorData.temp) + "}";
  webSocket.broadcastTXT(alertMsg);
}

void checkAlerts() {
  if (sensorData.gasPPM > gasCritPPM && !gasAlertActive) {
    gasAlertActive = true; triggerGasAlert();
  } else if (sensorData.gasPPM < gasWarnPPM) {
    gasAlertActive = false;
  }
  if (sensorData.temp > tempCritC) triggerTempAlert();
}

// ============================================================================
//  TERMINAL STATUS ROTATION
// ============================================================================

void rotateTerminal() {
  if (millis() - lastTermRotate < 10000) return;   // every 10 s
  lastTermRotate = millis();
  char l1[17], l2[17];
  switch (termRotateIdx) {
    case 0:
      termPrint(0, "READY · LOCAL");
      termPrint(1, "FlowGateX v2.6");
      break;
    case 1:
      snprintf(l1, 17, "G1: %s", gate1State.statusStr());
      snprintf(l2, 17, "G2: %s", gate2State.statusStr());
      termPrint(0, l1); termPrint(1, l2);
      break;
    case 2:
      snprintf(l1, 17, "T:%.1fC H:%.0f%%", sensorData.temp, sensorData.humidity);
      snprintf(l2, 17, "Gas:%dppm", sensorData.gasPPM);
      termPrint(0, l1); termPrint(1, l2);
      break;
    case 3:
      snprintf(l1, 17, "AP: %s", AP_SSID);
      termPrint(0, l1); termPrint(1, "192.168.4.1");
      break;
    case 4:
      snprintf(l1, 17, "Heap: %uB", ESP.getFreeHeap());
      snprintf(l2, 17, "Up: %lus", millis()/1000);
      termPrint(0, l1); termPrint(1, l2);
      break;
  }
  termRotateIdx = (termRotateIdx + 1) % 5;
}

// ============================================================================
//  IR TIMEOUT CHECK
// ============================================================================

void checkIRTimeout() {
  if (gate1State.state == GATE_OPEN && sensorData.ir1 == "blocked" &&
      millis() - gate1State.openedAt > 15000) {
    termPrint(0, "IR1 TIMEOUT");
    termPrint(1, "CHECK PASSAGE");
    
    String alertMsg = "{\"alert\":\"ir_timeout\",\"gate\":1}";
    webSocket.broadcastTXT(alertMsg);
  }
}

// ============================================================================
//  OFFLINE QR CACHE
// ============================================================================

void loadOfflineQRCache() {
  EEPROM.begin(EEPROM_SIZE);
  String cached = readEEPROM(0, EEPROM_SIZE);
  if (cached.length() > 10) {
    DeserializationError err = deserializeJson(offlineQRCache, cached);
    if (!err) {
      Serial.printf("[QR] Loaded %d offline codes\n", offlineQRCache.as<JsonArray>().size());
      return;
    }
  }
  Serial.println("[QR] No cache.");
}

bool validateQROffline(const String& hash) {
  for (JsonVariant v : offlineQRCache.as<JsonArray>())
    if (v.as<String>() == hash) return true;
  return false;
}

// ============================================================================
//  WIFI SETUP
// ============================================================================

void setupWiFi() {
  Serial.println("[WiFi] Starting AP+STA...");
  WiFi.mode(WIFI_AP_STA);

  WiFi.softAP(AP_SSID, AP_PASS);
  WiFi.softAPConfig(IPAddress(192,168,4,1), IPAddress(192,168,4,1), IPAddress(255,255,255,0));
  Serial.printf("[WiFi] AP: %s @ 192.168.4.1\n", AP_SSID);

  WiFi.begin(STA_SSID, STA_PASS);
  int att = 0;
  while (WiFi.status() != WL_CONNECTED && att < 20) { delay(500); Serial.print('.'); att++; }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("[WiFi] STA: %s @ %s\n", STA_SSID, WiFi.localIP().toString().c_str());
    configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  } else {
    Serial.println("[WiFi] STA failed → offline mode.");
    offlineMode = true;
  }

  if (MDNS.begin("flowgatex")) {
    MDNS.addService("http", "tcp", 80);
    MDNS.addService("ws",   "tcp", 81);
    Serial.println("[mDNS] flowgatex.local registered.");
  }
}

// ============================================================================
//  CORS + RESPONSE HELPERS
// ============================================================================

void setCORS() {
  server.sendHeader("Access-Control-Allow-Origin",  "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  server.sendHeader("Access-Control-Max-Age",       "86400");
}

void sendJSON(int code, const String& json) {
  setCORS();
  server.sendHeader("Cache-Control", "no-cache");
  server.send(code, "application/json", json);
}

// ============================================================================
//  WEB SERVER ROUTES
// ============================================================================

void setupRoutes() {

  auto serveDash = []() {
    server.sendHeader("Content-Encoding", "identity");
    server.send_P(200, "text/html", DASHBOARD_HTML);
  };
  server.on("/",         HTTP_GET, serveDash);
  server.on("/dashboard",  HTTP_GET, serveDash);
  server.on("/index.html", HTTP_GET, serveDash);

  server.on("/discover", HTTP_GET, []() { sendJSON(200, buildDiscoverJson()); });

  server.on("/ping", HTTP_GET, []() {
    StaticJsonDocument<256> d;
    d["id"]      = DEVICE_ID;
    d["fw"]      = FIRMWARE_VERSION;
    d["status"]  = "online";
    d["type"]    = "gate";
    d["ap_ssid"] = AP_SSID;
    d["uptime"]  = (int)(millis()/1000);
    String out; serializeJson(d, out);
    sendJSON(200, out);
  });

  server.on("/sensors", HTTP_GET, []() { sendJSON(200, buildSensorJson()); });
  server.on("/heatmap", HTTP_GET, []() { sendJSON(200, buildHeatmapJson()); });
  server.on("/logs",    HTTP_GET, []() { sendJSON(200, buildLogsJson()); });

  server.on("/system", HTTP_GET, []() {
    StaticJsonDocument<512> d;
    d["uptime_s"]    = (int)(millis()/1000);
    d["free_heap"]   = (int)ESP.getFreeHeap();
    d["chip_id"]     = String((uint32_t)ESP.getEfuseMac(), HEX);
    d["fw_version"]  = FIRMWARE_VERSION;
    d["ap_clients"]  = (int)WiFi.softAPgetStationNum();
    d["sta_rssi"]    = WiFi.RSSI();
    d["sta_ip"]      = WiFi.localIP().toString();
    d["ap_ip"]       = "192.168.4.1";
    d["ap_ssid"]     = AP_SSID;
    d["offline_mode"]= offlineMode;
    d["ws_port"]     = 81;
    d["mdns"]        = "flowgatex.local";
    String out; serializeJson(d, out);
    sendJSON(200, out);
  });

  server.on("/qr", HTTP_POST, []() {
    if (!server.hasArg("plain")) { sendJSON(400, "{\"error\":\"No body\"}"); return; }
    StaticJsonDocument<512> body;
    if (deserializeJson(body, server.arg("plain"))) { sendJSON(400, "{\"error\":\"Bad JSON\"}"); return; }

    String userID    = body["userID"]      | "UNKNOWN";
    bool   valid     = body["valid"]       | false;
    int    accessLvl = body["accessLevel"] | 0;
    int    gateNum   = body["gate"]        | 1;
    int    duration  = body["duration"]    | 5000;
    String ticketId  = body["ticketId"]    | "";

    StaticJsonDocument<384> resp;
    resp["timestamp"] = getISO8601();
    resp["userID"]    = userID;
    resp["deviceId"]  = DEVICE_ID;

    if (valid) {
      Serial.printf("[QR] GRANT → %s (access=%d gate=%d dur=%d)\n",
        userID.c_str(), accessLvl, gateNum, duration);
      grantAccess(userID, gateNum, duration);
      resp["result"]      = "GRANT";
      resp["gateOpened"]  = gateNum;
      resp["duration"]    = duration;
      resp["accessLevel"] = accessLvl;
      if (ticketId.length()) resp["ticketId"] = ticketId;
      
      String wsMsg = "{\"event\":\"qr_grant\",\"userID\":\"" + userID + "\",\"gate\":" + String(gateNum) + ",\"accessLevel\":" + String(accessLvl) + "}";
      webSocket.broadcastTXT(wsMsg);
    } else {
      Serial.printf("[QR] DENY → %s\n", userID.c_str());
      denyAccess(userID);
      resp["result"] = "DENY";
      
      String wsMsg = "{\"event\":\"qr_deny\",\"userID\":\"" + userID + "\"}";
      webSocket.broadcastTXT(wsMsg);
    }

    String out; serializeJson(resp, out);
    sendJSON(200, out);
  });

  server.on("/gates", HTTP_POST, []() {
    if (!server.hasArg("plain")) { sendJSON(400, "{\"error\":\"No body\"}"); return; }
    StaticJsonDocument<128> body;
    if (deserializeJson(body, server.arg("plain"))) { sendJSON(400, "{\"error\":\"Bad JSON\"}"); return; }

    int    gate = body["gate"]   | 0;
    String act  = body["action"].as<String>();
    int    dur  = body["duration"] | 5000;

    if      (gate == 1 && act == "open")  openGate(1, dur);
    else if (gate == 1 && act == "close") closeGate(1);
    else if (gate == 2 && act == "open")  openGate(2, dur);
    else if (gate == 2 && act == "close") closeGate(2);
    else { sendJSON(400, "{\"error\":\"Invalid gate or action\"}"); return; }

    sendJSON(200, "{\"ok\":true}");
  });

  server.on("/config", HTTP_POST, []() {
    if (!server.hasArg("plain")) { sendJSON(400, "{\"error\":\"No body\"}"); return; }
    StaticJsonDocument<256> body;
    deserializeJson(body, server.arg("plain"));

    if (body.containsKey("sensitivity")) {
      String sv = body["sensitivity"].as<String>();
      if      (sv == "low")    roboflowThreshold = 0.30f;
      else if (sv == "medium") roboflowThreshold = 0.50f;
      else if (sv == "high")   roboflowThreshold = 0.70f;
    }
    if (body.containsKey("gas_warning"))  gasWarnPPM = body["gas_warning"];
    if (body.containsKey("gas_critical")) gasCritPPM = body["gas_critical"];
    if (body.containsKey("temp_warning")) tempWarnC  = body["temp_warning"];
    if (body.containsKey("unlock") && (bool)body["unlock"]) unlockAllGates();

    sendJSON(200, "{\"ok\":true}");
  });

  server.onNotFound([]() {
    if (server.method() == HTTP_OPTIONS) { setCORS(); server.send(204); return; }
    setCORS();
    server.send(404, "text/plain", "Not found");
  });

  server.begin();
  Serial.println("[HTTP] Server started — port 80");
}

// ============================================================================
//  WEBSOCKET SERVER
// ============================================================================

void webSocketEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED: {
      Serial.printf("[WS] #%u connected from %s\n", num, webSocket.remoteIP(num).toString().c_str());
      String initJson = buildSensorJson();
      webSocket.sendTXT(num, initJson);
      // Send current terminal state to new client
      {
        StaticJsonDocument<128> td;
        td["term_line0"] = termLines[0];
        td["term_line1"] = termLines[1];
        String tout; serializeJson(td, tout);
        webSocket.sendTXT(num, tout);
      }
      break;
    }

    case WStype_DISCONNECTED:
      Serial.printf("[WS] #%u disconnected\n", num);
      break;

    case WStype_TEXT: {
      StaticJsonDocument<128> cmd;
      if (!deserializeJson(cmd, payload, length)) {
        String action = cmd["action"].as<String>();
        if (action == "open_gate")  openGate(cmd["gate"]  | 1, cmd["duration"] | 5000);
        if (action == "close_gate") closeGate(cmd["gate"] | 1);
        if (action == "unlock")     unlockAllGates();
        if (action == "ping") {
          String pingMsg = "{\"pong\":true,\"ts\":" + String(millis()) + "}";
          webSocket.sendTXT(num, pingMsg);
        }
      }
      break;
    }

    case WStype_ERROR:
      Serial.printf("[WS] Error #%u\n", num);
      break;

    default: break;
  }
}

void setupWebSocket() {
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  Serial.println("[WS] Server started — port 81");
}

// ============================================================================
//  FREERTOS TASKS
// ============================================================================

void sensorTask(void* pv) {
  DHT dhtSensor(DHT_PIN, DHT_TYPE);
  dhtSensor.begin();
  unsigned long lastDHT = 0;

  for (;;) {
    unsigned long now = millis();

    if (now - lastDHT >= 2000) {
      float t = dhtSensor.readTemperature();
      float h = dhtSensor.readHumidity();
      if (!isnan(t) && !isnan(h)) { sensorData.temp = t; sensorData.humidity = h; }
      lastDHT = now;
    }

    int raw = analogRead(MQ_PIN);
    sensorData.gasPPM = map(raw, 0, 4095, 0, 10000);
    sensorData.mqRaw  = raw;

    sensorData.ir1 = (digitalRead(IR1_PIN) == LOW) ? "blocked" : "clear";
    sensorData.ir2 = (digitalRead(IR2_PIN) == LOW) ? "blocked" : "clear";

    updateHeatmapDemo();
    checkAlerts();

    String currentSensorJson = buildSensorJson();
    webSocket.broadcastTXT(currentSensorJson);

    vTaskDelay(1000 / portTICK_PERIOD_MS);
  }
}

// ============================================================================
//  SETUP
// ============================================================================

void setup() {
  Serial.begin(115200);
  Serial.println("\n╔══════════════════════════════╗");
  Serial.println("║  FlowGateX v2.6.1 Booting    ║");
  Serial.println("╚══════════════════════════════╝");
  Serial.printf("Chip: %s | FW: %s\n",
    String((uint32_t)ESP.getEfuseMac(), HEX).c_str(), FIRMWARE_VERSION);

  bootTime = millis();

  // 1. GPIO
  setupGPIO();
  termPrint(0, "GPIO Init OK");
  termPrint(1, "Pins configured");

  // 2. Sensor warm-up
  termPrint(0, "Calibrating...");
  termPrint(1, "Please wait 5s");
  delay(5000);

  // 3. Motor test
  termPrint(0, "Motor Test");
  termPrint(1, "G1 + G2...");
  motorTestCycle();
  termPrint(0, "Motor Test OK");
  termPrint(1, "Gates verified");

  // 4. WiFi
  setupWiFi();
  if (offlineMode) {
    termPrint(0, "WiFi: AP Only");
    termPrint(1, "STA failed-offline");
  } else {
    termPrint(0, "WiFi: AP + STA");
    termPrint(1, WiFi.localIP().toString());
  }

  // 5. HTTP server (port 80)
  setupRoutes();
  termPrint(0, "HTTP :80 Ready");
  termPrint(1, "flowgatex.local");

  // 6. WebSocket (port 81)
  setupWebSocket();
  termPrint(0, "WebSocket :81 OK");
  termPrint(1, "Dashboard live");

  // 7. Offline QR cache (EEPROM)
  loadOfflineQRCache();

  // 8. Init heatmap
  memset(heatmapGrid, 0, sizeof(heatmapGrid));

  // 9. Sensor task — Core 0
  xTaskCreatePinnedToCore(sensorTask, "SensorTask", SENSOR_TASK_STACK, NULL, 1, NULL, 0);

  // 10. Ready
  termPrint(0, "READY · LOCAL");
  termPrint(1, AP_SSID);
  buzzerTone(GRANT_TONE);

  Serial.println("╔═══════════════════════════════════════════╗");
  Serial.println("║  Boot complete!  No cloud dependencies.  ║");
  Serial.printf("║  Dashboard  → http://192.168.4.1/        ║\n");
  Serial.printf("║  mDNS       → http://flowgatex.local/    ║\n");
  Serial.printf("║  WebSocket  → ws://192.168.4.1:81/       ║\n");
  Serial.printf("║  Terminal   → embedded in dashboard      ║\n");
  Serial.println("╚═══════════════════════════════════════════╝");
}

// ============================================================================
//  LOOP
// ============================================================================

void loop() {
  server.handleClient();   // HTTP requests
  webSocket.loop();        // WebSocket events
  rotateTerminal();        // Status broadcast every 10 s
  checkIRTimeout();        // IR passage timeout alert
}