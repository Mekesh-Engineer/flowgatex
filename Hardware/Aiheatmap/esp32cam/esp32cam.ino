/*
 * ============================================================================
 *  FlowGateX · ESP32-CAM — People Detection & Counting
 * ============================================================================
 *  Board:    AI Thinker ESP32-CAM
 *  Platform: arduino-esp32 v2.x
 *
 *  Architecture:
 *    - Camera snapshot every INFER_INTERVAL_MS → base64 → Roboflow HTTPS POST
 *    - Roboflow JSON parsed → person count + bounding boxes
 *    - WebSocket broadcasts detection payload to all dashboard clients
 *    - Dashboard: live JPEG snapshot + canvas overlay + charts (all embedded)
 *    - SoftAP (192.168.4.1) always on, STA for internet Roboflow calls
 *    - mDNS: flowgatex-cam.local
 *
 *  Web Endpoints:
 *    GET  /           → Dashboard HTML (PROGMEM)
 *    GET  /snapshot   → Latest JPEG frame (for live view refresh)
 *    GET  /stream     → MJPEG stream
 *    GET  /detections → Latest detection JSON
 *    GET  /system     → System info JSON
 *    GET  /history    → Count history JSON (ring buffer)
 *
 *  Libraries required (Arduino Library Manager):
 *    - esp32 board package (espressif/arduino-esp32 ≥2.0.0)
 *    - ArduinoJson  (Benoit Blanchon, ≥6.x)
 *    - WebSockets   (Markus Sattler, ≥2.3.x)
 *
 *  v1.0.0 — Feb 2026
 * ============================================================================
 */

// ============================================================================
//  CONFIGURATION
// ============================================================================

// ── WiFi ─────────────────────────────────────────────────────────────────────
#define WIFI_STA_SSID  "Mekesh"
#define WIFI_STA_PASS  "12345678"
#define WIFI_AP_SSID   "FlowGateX-CAM"
#define WIFI_AP_PASS   "flowgatex2026"

// ── Roboflow ─────────────────────────────────────────────────────────────────
#define RF_API_KEY     "CM623xO6Bi12TX2pUm5u"
#define RF_MODEL       "crowd-ql12a-g1ff3"
#define RF_VERSION     "1"
#define RF_URL         "https://serverless.roboflow.com/" RF_MODEL "/" RF_VERSION
#define RF_MIN_CONF    0.40f      // Minimum confidence to keep a detection

// ── Inference ────────────────────────────────────────────────────────────────
#define INFER_INTERVAL_MS   3000  // How often to POST to Roboflow (ms)
#define INFER_STACK         8192  // FreeRTOS task stack for inference
#define SNAPSHOT_QUALITY    12    // JPEG quality 0-63 (lower = better, more RAM)

// ── History ring buffer ───────────────────────────────────────────────────────
#define HIST_SIZE  60             // Data points kept for chart

// ── Flash LED ────────────────────────────────────────────────────────────────
#define FLASH_PIN  4

// ── AI Thinker ESP32-CAM pin map ─────────────────────────────────────────────
#define PWDN_GPIO  32
#define RESET_GPIO -1
#define XCLK_GPIO   0
#define SIOD_GPIO  26
#define SIOC_GPIO  27
#define Y9_GPIO    35
#define Y8_GPIO    34
#define Y7_GPIO    39
#define Y6_GPIO    36
#define Y5_GPIO    21
#define Y4_GPIO    19
#define Y3_GPIO    18
#define Y2_GPIO     5
#define VSYNC_GPIO 25
#define HREF_GPIO  23
#define PCLK_GPIO  22

// ============================================================================
//  INCLUDES
// ============================================================================

#include "esp_camera.h"
#include "esp_timer.h"
#include "img_converters.h"
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <WebServer.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <ESPmDNS.h>
#include "mbedtls/base64.h"

// ============================================================================
//  EMBEDDED DASHBOARD  (PROGMEM)
// ============================================================================

static const char DASHBOARD[] PROGMEM = R"rawhtml(
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>FlowGateX · People Counter</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#080c12;--bg2:#0f1520;--card:#131d2e;--card2:#182236;
  --border:#1e2d42;--txt:#dde4f0;--txt2:#7a8fa8;--muted:#4a5e74;
  --cyan:#00e5ff;--blue:#3b82f6;--green:#10b981;--orange:#f59e0b;
  --red:#ef4444;--purple:#a855f7;--yellow:#eab308;
  --r:12px;--rs:8px;--sh:0 8px 32px rgba(0,0,0,.5);--tr:.22s ease
}
html{font-size:14px}
body{font-family:'Segoe UI',system-ui,sans-serif;background:var(--bg);
  color:var(--txt);min-height:100vh;line-height:1.5;-webkit-font-smoothing:antialiased}
header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;
  padding:12px 20px;background:linear-gradient(135deg,#0a1220,#0f1a2e);
  border-bottom:1px solid var(--border);position:sticky;top:0;z-index:200;backdrop-filter:blur(12px)}
.hl{display:flex;align-items:center;gap:10px}
.hl h1{font-size:1.2rem;background:linear-gradient(90deg,var(--cyan),var(--blue));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.sub{font-size:.68rem;color:var(--muted)}
.logo{width:34px;height:34px;display:grid;place-items:center;
  background:rgba(0,229,255,.07);border-radius:var(--rs)}
.hr{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;
  font-size:.67rem;font-weight:600;background:var(--card);border:1px solid var(--border);color:var(--txt2)}
.on{background:rgba(16,185,129,.1);border-color:rgba(16,185,129,.3);color:var(--green)}
.off{background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.3);color:var(--red)}
.inf{background:rgba(234,179,8,.1);border-color:rgba(234,179,8,.3);color:var(--yellow)}
main{max-width:1080px;margin:0 auto;padding:16px;display:flex;flex-direction:column;gap:18px}
/* ── Big stats row ── */
.stats-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.stat-card{background:var(--card);border:1px solid var(--border);border-radius:var(--r);
  padding:16px 14px;display:flex;flex-direction:column;gap:4px;animation:fi .4s ease both}
.stat-card:hover{background:var(--card2);box-shadow:var(--sh)}
.stat-lbl{font-size:.67rem;color:var(--muted);text-transform:uppercase;letter-spacing:.5px}
.stat-val{font-size:2rem;font-weight:800;color:var(--cyan);font-variant-numeric:tabular-nums;
  line-height:1.1;transition:.4s}
.stat-val.pulse{animation:numPop .35s ease}
.stat-sub{font-size:.68rem;color:var(--txt2)}
.sv-green{color:var(--green)}.sv-red{color:var(--red)}.sv-orange{color:var(--orange)}
/* ── Camera + overlay ── */
.cam-section{display:grid;grid-template-columns:1fr 320px;gap:14px;align-items:start}
@media(max-width:720px){.cam-section{grid-template-columns:1fr}}
.cam-card{background:#000;border:1px solid var(--border);border-radius:var(--r);overflow:hidden;
  position:relative;animation:fi .4s ease .06s both}
.cam-header{display:flex;align-items:center;justify-content:space-between;
  padding:8px 12px;background:var(--card);border-bottom:1px solid var(--border)}
.cam-title{font-size:.78rem;font-weight:600}
.cam-controls{display:flex;gap:6px}
.live-dot{width:8px;height:8px;border-radius:50%;background:var(--red);
  box-shadow:0 0 8px var(--red);animation:blink .8s infinite;flex-shrink:0}
.cam-wrap{position:relative;background:#000;min-height:240px;display:flex;align-items:center;justify-content:center}
#cam-img{width:100%;height:auto;display:block;opacity:1;transition:opacity .1s}
#overlay{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none}
.cam-footer{padding:6px 12px;background:var(--card);border-top:1px solid var(--border);
  font-size:.67rem;color:var(--muted);display:flex;justify-content:space-between}
/* ── Side panel ── */
.side-panel{display:flex;flex-direction:column;gap:12px}
.card{background:var(--card);border:1px solid var(--border);border-radius:var(--r);
  padding:14px;animation:fi .4s ease .1s both;transition:background var(--tr),box-shadow var(--tr)}
.card:hover{background:var(--card2);box-shadow:var(--sh)}
.card-title{font-size:.82rem;font-weight:600;margin-bottom:10px;color:var(--txt)}
/* ── Chart ── */
#chart-canvas{width:100%;height:90px;display:block}
/* ── Detection list ── */
.det-list{display:flex;flex-direction:column;gap:5px;max-height:220px;overflow-y:auto}
.det-item{display:flex;align-items:center;gap:8px;padding:6px 8px;
  border-radius:var(--rs);background:rgba(255,255,255,.03);border:1px solid var(--border)}
.det-box{width:32px;height:32px;border-radius:4px;border:2px solid var(--cyan);flex-shrink:0;
  display:grid;place-items:center;font-size:.6rem;color:var(--cyan);font-weight:700}
.det-info{flex:1;min-width:0}
.det-cls{font-size:.75rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.det-conf{font-size:.65rem;color:var(--muted)}
.conf-bar{height:3px;background:rgba(255,255,255,.06);border-radius:2px;margin-top:3px;overflow:hidden}
.conf-fill{height:100%;border-radius:2px;background:linear-gradient(90deg,var(--cyan),var(--blue));transition:.4s}
.no-det{text-align:center;color:var(--muted);padding:16px;font-size:.75rem}
/* ── Log table ── */
.log-wrap{max-height:160px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--rs)}
table{width:100%;border-collapse:collapse;font-size:.7rem}
th{background:var(--bg2);color:var(--muted);text-transform:uppercase;font-size:.6rem;
  font-weight:600;padding:5px 10px;text-align:left;position:sticky;top:0;z-index:1;letter-spacing:.3px}
td{padding:4px 10px;border-top:1px solid var(--border);color:var(--txt2)}
tr:hover td{background:var(--card2)}
.empty{text-align:center;color:var(--muted);padding:14px!important}
/* ── System grid ── */
.sys-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.si{background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:var(--rs);
  padding:8px 10px;display:flex;flex-direction:column;gap:2px}
.sl{font-size:.6rem;color:var(--muted);text-transform:uppercase;letter-spacing:.4px}
.sv{font-size:.8rem;font-weight:600;color:var(--cyan);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* ── Buttons ── */
.btn{padding:5px 12px;border:none;border-radius:var(--rs);font-size:.72rem;font-weight:600;
  cursor:pointer;transition:all var(--tr);color:#fff}
.b-primary{background:linear-gradient(135deg,var(--blue),#1d4ed8)}
.b-primary:hover{box-shadow:0 4px 14px rgba(59,130,246,.4);transform:translateY(-1px)}
.b-sm{padding:3px 10px;font-size:.67rem;background:var(--card);border:1px solid var(--border);color:var(--txt2)}
.b-sm:hover{background:var(--card2);color:var(--txt)}
/* ── Flash toggle ── */
.flash-on{background:rgba(234,179,8,.15);border-color:rgba(234,179,8,.4);color:var(--yellow)}
/* ── Alert bar ── */
#alert-bar{display:flex;align-items:center;gap:10px;padding:9px 20px;
  background:linear-gradient(90deg,rgba(239,68,68,.2),rgba(239,68,68,.03));
  border-bottom:1px solid rgba(239,68,68,.3);color:var(--red);font-weight:600;font-size:.8rem;
  animation:pulse 2s infinite}
#alert-bar.hide{display:none}
#alert-bar button{margin-left:auto;background:none;border:none;color:var(--red);cursor:pointer}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.7}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
@keyframes fi{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
@keyframes numPop{0%{transform:scale(1)}50%{transform:scale(1.15)}100%{transform:scale(1)}}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
footer{display:flex;justify-content:space-between;padding:10px 20px;font-size:.66rem;
  color:var(--muted);border-top:1px solid var(--border);background:var(--bg2);flex-wrap:wrap;gap:4px}
</style>
</head>
<body>

<header>
  <div class="hl">
    <div class="logo">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="#00e5ff" stroke-width="1.8"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#00e5ff" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    </div>
    <div><h1>FlowGateX · People Counter</h1><span class="sub">ESP32-CAM &bull; Roboflow AI &bull; Local Dashboard</span></div>
  </div>
  <div class="hr">
    <span id="ws-badge" class="badge off">&#9679; Disconnected</span>
    <span id="inf-badge" class="badge">&#9650; Idle</span>
    <span id="up-badge"  class="badge">&#9201; 00:00:00</span>
  </div>
</header>

<div id="alert-bar" class="hide">
  <span>&#9888;</span>
  <span id="alert-txt">Alert</span>
  <button onclick="$('alert-bar').classList.add('hide')">&#10005;</button>
</div>

<main>

  <!-- Stats -->
  <div class="stats-row">
    <div class="stat-card">
      <span class="stat-lbl">&#128100; People Now</span>
      <span class="stat-val sv-cyan" id="s-now">0</span>
      <span class="stat-sub" id="s-now-sub">No detections</span>
    </div>
    <div class="stat-card">
      <span class="stat-lbl">&#128200; Peak Today</span>
      <span class="stat-val sv-orange" id="s-peak">0</span>
      <span class="stat-sub">Maximum observed</span>
    </div>
    <div class="stat-card">
      <span class="stat-lbl">&#128197; Total Scans</span>
      <span class="stat-val" id="s-scans">0</span>
      <span class="stat-sub">Inference calls</span>
    </div>
    <div class="stat-card">
      <span class="stat-lbl">&#9889; Confidence</span>
      <span class="stat-val" id="s-conf">--</span>
      <span class="stat-sub">Avg this scan</span>
    </div>
    <div class="stat-card">
      <span class="stat-lbl">&#128336; Infer Time</span>
      <span class="stat-val" id="s-dur">--</span>
      <span class="stat-sub">Roboflow latency</span>
    </div>
  </div>

  <!-- Camera + Side Panel -->
  <div class="cam-section">

    <!-- Camera feed -->
    <div class="cam-card">
      <div class="cam-header">
        <div style="display:flex;align-items:center;gap:8px">
          <div class="live-dot" id="live-dot"></div>
          <span class="cam-title">Live Camera Feed</span>
        </div>
        <div class="cam-controls">
          <button class="btn b-sm" id="flash-btn" onclick="toggleFlash()">&#9889; Flash</button>
          <button class="btn b-sm" onclick="refreshSnap()">&#8635; Refresh</button>
          <a class="btn b-sm" href="/stream" target="_blank">&#9654; Stream</a>
        </div>
      </div>
      <div class="cam-wrap" id="cam-wrap">
        <img id="cam-img" src="/snapshot" alt="Camera feed" onerror="snapError()">
        <canvas id="overlay"></canvas>
      </div>
      <div class="cam-footer">
        <span id="cam-res">--x-- px</span>
        <span id="cam-fps">-- FPS</span>
        <span id="cam-ts">--</span>
      </div>
    </div>

    <!-- Side panel -->
    <div class="side-panel">

      <!-- Count chart -->
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span class="card-title">Count History</span>
          <button class="btn b-sm" onclick="clearHistory()">Clear</button>
        </div>
        <canvas id="chart-canvas"></canvas>
      </div>

      <!-- Detections -->
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span class="card-title">Detections (<span id="det-count">0</span>)</span>
        </div>
        <div class="det-list" id="det-list">
          <div class="no-det">Awaiting inference...</div>
        </div>
      </div>

      <!-- System -->
      <div class="card">
        <div class="card-title">System</div>
        <div class="sys-grid">
          <div class="si"><span class="sl">Free Heap</span><span class="sv" id="sy-heap">--</span></div>
          <div class="si"><span class="sl">Chip ID</span><span class="sv" id="sy-chip">--</span></div>
          <div class="si"><span class="sl">STA IP</span><span class="sv" id="sy-ip">--</span></div>
          <div class="si"><span class="sl">AP IP</span><span class="sv">192.168.4.1</span></div>
          <div class="si"><span class="sl">RSSI</span><span class="sv" id="sy-rssi">--</span></div>
          <div class="si"><span class="sl">mDNS</span><span class="sv">fgx-cam.local</span></div>
        </div>
      </div>

    </div><!-- /side-panel -->
  </div><!-- /cam-section -->

  <!-- Scan Log -->
  <div class="card" style="animation-delay:.18s">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <span class="card-title">Inference Log</span>
      <button class="btn b-sm" onclick="clearLog()">Clear</button>
    </div>
    <div class="log-wrap">
      <table>
        <thead><tr><th>Time</th><th>Count</th><th>Conf Avg</th><th>Latency</th><th>Status</th></tr></thead>
        <tbody id="log-body"><tr><td colspan="5" class="empty">No scans yet</td></tr></tbody>
      </table>
    </div>
  </div>

</main>

<footer>
  <span>FlowGateX-CAM &bull; ESP32-CAM &bull; Roboflow crowd-ql12a-g1ff3/1</span>
  <span id="f-time">--</span>
</footer>

<script>
(function(){
'use strict';

// ── Config ──
var WS_PORT=81, SYS_INT=8000, SNAP_INT=1500, MAX_LOG=40, HIST_MAX=60;
var ws=null,wsCon=false,rAtt=0,MAX_R=15,RECONN=3000;
var snapT=null,sysT=null,upSec=0;
var logRows=[],histData=[];
var lastDets=[],totalScans=0,peakCount=0;
var flashOn=false;
var chartCtx=null;
var imgNatW=320,imgNatH=240;
var lastSnapMs=0,snapCount=0,snapFPS=0,fpsTimer=0;

var $=function(id){return document.getElementById(id);};

// ── Boot ──
document.addEventListener('DOMContentLoaded',function(){
  connect();
  sysT=setInterval(fetchSys,SYS_INT);
  fetchSys();
  setInterval(function(){upSec++;setUptime();},1000);
  setInterval(function(){$('f-time').textContent=new Date().toLocaleTimeString('en-US',{hour12:false});},1000);
  initChart();
  startSnapRefresh();
});

// ── WebSocket ──
function connect(){
  var host=window.location.hostname||'192.168.4.1';
  try{ws=new WebSocket('ws://'+host+':'+WS_PORT+'/');}catch(e){setBadge(false);return;}
  ws.onopen=function(){wsCon=true;rAtt=0;setBadge(true);ws.send(JSON.stringify({action:'ping'}));};
  ws.onmessage=function(ev){
    try{
      var d=JSON.parse(ev.data);
      if(d.pong)return;
      if(d.detections!==undefined) handleDetections(d);
    }catch(e){}
  };
  ws.onclose=function(){wsCon=false;setBadge(false);if(++rAtt<=MAX_R)setTimeout(connect,RECONN);};
  ws.onerror=function(){wsCon=false;setBadge(false);};
}
function setBadge(ok){
  var b=$('ws-badge');b.textContent=(ok?'\u25cf Connected':'\u25cf Disconnected');
  b.className='badge '+(ok?'on':'off');
}

// ── Detection handler ──
function handleDetections(data){
  var dets=data.detections||[];
  var cnt=data.person_count||0;
  var dur=data.infer_ms||0;
  var conf=data.conf_avg||0;
  var imgW=data.img_w||imgNatW;
  var imgH=data.img_h||imgNatH;
  lastDets=dets;
  totalScans++;
  if(cnt>peakCount){peakCount=cnt;}

  // Update stats
  animVal('s-now', cnt);
  animVal('s-peak', peakCount);
  sv('s-scans', totalScans);
  sv('s-conf', cnt>0?(conf*100).toFixed(0)+'%':'--');
  sv('s-dur', dur>0?dur+'ms':'--');
  var nowSub=cnt===0?'Area clear':cnt===1?'1 person detected':cnt+' people detected';
  $('s-now-sub').textContent=nowSub;

  // Inference badge
  var ib=$('inf-badge');
  ib.textContent='▲ '+cnt+' person'+(cnt!==1?'s':'');
  ib.className='badge '+(cnt>0?'inf':'');

  // Overlay bounding boxes
  drawBoxes(dets,imgW,imgH);

  // Detection list
  renderDetList(dets);

  // Chart history
  histData.push(cnt);
  if(histData.length>HIST_MAX)histData.shift();
  drawChart();

  // Log
  var ts=new Date().toLocaleTimeString('en-US',{hour12:false});
  var statusHtml=cnt>0?'<span style="color:var(--green)">OK</span>':'<span style="color:var(--muted)">Clear</span>';
  logRows.unshift({ts:ts,cnt:cnt,conf:cnt>0?(conf*100).toFixed(1)+'%':'--',dur:dur+'ms',html:statusHtml});
  if(logRows.length>MAX_LOG)logRows.pop();
  renderLog();

  // Alert if crowded
  if(cnt>=10){
    $('alert-txt').textContent='⚠ HIGH CROWD DENSITY — '+cnt+' people detected';
    $('alert-bar').classList.remove('hide');
  }

  if(data.uptime_s)upSec=data.uptime_s;
}

// ── Overlay Canvas ──
function drawBoxes(dets,srcW,srcH){
  var img=$('cam-img');
  var ov=$('overlay');
  var wrap=$('cam-wrap');
  ov.width=wrap.clientWidth;
  ov.height=wrap.clientHeight;
  var ctx=ov.getContext('2d');
  ctx.clearRect(0,0,ov.width,ov.height);
  if(!dets||!dets.length)return;

  var dispW=img.clientWidth||ov.width;
  var dispH=img.clientHeight||ov.height;
  var scaleX=dispW/(srcW||320);
  var scaleY=dispH/(srcH||240);
  var offX=(ov.width-dispW)/2;
  var offY=(ov.height-dispH)/2;

  dets.forEach(function(d,i){
    var x=(d.x-d.w/2)*scaleX+offX;
    var y=(d.y-d.h/2)*scaleY+offY;
    var w=d.w*scaleX;
    var h=d.h*scaleY;
    var conf=(d.conf*100).toFixed(0)+'%';
    var label=(d.cls||'person')+' '+conf;
    var hue=confColor(d.conf);

    ctx.save();
    // Box shadow glow
    ctx.shadowColor=hue;ctx.shadowBlur=8;
    ctx.strokeStyle=hue;ctx.lineWidth=2;
    ctx.strokeRect(x,y,w,h);
    ctx.shadowBlur=0;

    // Fill corner ticks
    var t=10;
    ctx.lineWidth=3;
    [[x,y,x+t,y,x,y+t],[x+w,y,x+w-t,y,x+w,y+t],
     [x,y+h,x+t,y+h,x,y+h-t],[x+w,y+h,x+w-t,y+h,x+w,y+h-t]].forEach(function(c){
      ctx.beginPath();ctx.moveTo(c[0],c[1]);ctx.lineTo(c[2],c[3]);ctx.stroke();
      ctx.beginPath();ctx.moveTo(c[0],c[1]);ctx.lineTo(c[4],c[5]);ctx.stroke();
    });

    // Label badge
    ctx.font='bold 11px Courier New,monospace';
    var tw=ctx.measureText(label).width;
    ctx.fillStyle='rgba(0,0,0,.75)';
    ctx.fillRect(x,y-18,tw+10,18);
    ctx.fillStyle=hue;
    ctx.fillText(label,x+5,y-4);

    // Index number
    ctx.fillStyle=hue;ctx.font='bold 10px sans-serif';
    ctx.fillText('#'+(i+1),x+3,y+14);
    ctx.restore();
  });
}

function confColor(c){
  if(c>=0.75)return'#10b981';
  if(c>=0.50)return'#00e5ff';
  return'#f59e0b';
}

// ── Chart ──
function initChart(){
  var cv=$('chart-canvas');
  if(!cv)return;
  chartCtx=cv.getContext('2d');
}

function drawChart(){
  var cv=$('chart-canvas');if(!cv||!chartCtx)return;
  cv.width=cv.clientWidth;cv.height=90;
  var W=cv.width,H=cv.height,ctx=chartCtx;
  ctx.clearRect(0,0,W,H);
  if(!histData.length)return;

  var mx=Math.max.apply(null,histData)||1;
  var pad=4,bw=Math.max(2,Math.floor((W-pad*(histData.length+1))/histData.length));
  var x=pad;

  // Gridlines
  ctx.strokeStyle='rgba(255,255,255,.05)';ctx.lineWidth=1;
  for(var g=0;g<=4;g++){
    var gy=H-Math.round((g/4)*H);
    ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(W,gy);ctx.stroke();
    if(g>0){
      ctx.fillStyle='rgba(255,255,255,.25)';ctx.font='9px sans-serif';
      ctx.fillText(Math.round(mx*g/4),2,gy-2);
    }
  }

  // Bars
  histData.forEach(function(v){
    var h=Math.max(2,Math.round((v/mx)*(H-6)));
    var grad=ctx.createLinearGradient(0,H-h,0,H);
    grad.addColorStop(0,'rgba(0,229,255,.9)');
    grad.addColorStop(1,'rgba(59,130,246,.4)');
    ctx.fillStyle=grad;
    ctx.fillRect(x,H-h,bw,h);
    x+=bw+pad;
  });
}

window.clearHistory=function(){histData=[];drawChart();};

// ── Snapshot auto-refresh ──
function startSnapRefresh(){
  if(snapT)clearInterval(snapT);
  snapT=setInterval(refreshSnap,SNAP_INT);
  refreshSnap();
}
window.refreshSnap=function(){
  var img=$('cam-img');
  var ts=Date.now();
  img.src='/snapshot?t='+ts;
  img.onload=function(){
    imgNatW=img.naturalWidth||imgNatW;
    imgNatH=img.naturalHeight||imgNatH;
    $('cam-res').textContent=imgNatW+'×'+imgNatH+' px';
    snapCount++;
    var now=Date.now();
    if(now-fpsTimer>=1000){
      snapFPS=(snapCount/(  (now-fpsTimer)/1000)).toFixed(1);
      $('cam-fps').textContent=snapFPS+' FPS';
      snapCount=0;fpsTimer=now;
    }
    $('cam-ts').textContent=new Date().toLocaleTimeString('en-US',{hour12:false});
    // Redraw boxes scaled to new image size
    if(lastDets.length)drawBoxes(lastDets,imgNatW,imgNatH);
  };
};
window.snapError=function(){$('cam-img').alt='Camera unavailable';};

// ── Flash ──
window.toggleFlash=function(){
  flashOn=!flashOn;
  fetch('/flash?state='+(flashOn?1:0));
  var b=$('flash-btn');
  b.textContent='⚡ Flash '+(flashOn?'ON':'');
  b.className='btn b-sm'+(flashOn?' flash-on':'');
};

// ── Detection list ──
function renderDetList(dets){
  var el=$('det-list');if(!el)return;
  $('det-count').textContent=dets.length;
  if(!dets.length){el.innerHTML='<div class="no-det">No detections in frame</div>';return;}
  el.innerHTML=dets.map(function(d,i){
    var pct=(d.conf*100).toFixed(1);
    var col=confColor(d.conf);
    return '<div class="det-item">'
      +'<div class="det-box" style="border-color:'+col+';color:'+col+'">#'+(i+1)+'</div>'
      +'<div class="det-info">'
      +'<div class="det-cls" style="color:'+col+'">'+(d.cls||'person')+'</div>'
      +'<div class="det-conf">Confidence: '+pct+'%</div>'
      +'<div class="conf-bar"><div class="conf-fill" style="width:'+pct+'%;background:'+col+'"></div></div>'
      +'</div>'
      +'</div>';
  }).join('');
}

// ── Log ──
function renderLog(){
  var tb=$('log-body');if(!tb)return;
  if(!logRows.length){tb.innerHTML='<tr><td colspan="5" class="empty">No scans yet</td></tr>';return;}
  tb.innerHTML=logRows.map(function(r){
    return '<tr><td>'+r.ts+'</td><td><b style="color:var(--cyan)">'+r.cnt+'</b></td>'
      +'<td>'+r.conf+'</td><td>'+r.dur+'</td><td>'+r.html+'</td></tr>';
  }).join('');
}
window.clearLog=function(){logRows=[];renderLog();};

// ── System ──
function fetchSys(){
  fetch('/system').then(function(r){return r.json();})
    .then(function(d){
      sv('sy-heap',fmtB(d.free_heap));sv('sy-chip',d.chip_id||'--');
      sv('sy-ip',d.sta_ip||'--');sv('sy-rssi',(d.sta_rssi||'--')+' dBm');
      if(d.uptime_s)upSec=d.uptime_s;
    }).catch(function(){});
}

// ── Helpers ──
function sv(id,val){var el=$(id);if(el)el.textContent=String(val);}
function animVal(id,val){
  var el=$(id);if(!el)return;
  var s=String(val);
  if(el.textContent!==s){
    el.textContent=s;
    el.classList.remove('pulse');void el.offsetWidth;el.classList.add('pulse');
  }
}
function setUptime(){sv('up-badge','\u23f1 '+dur(upSec));}
function dur(s){var h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sc=Math.floor(s%60);return p(h)+':'+p(m)+':'+p(sc);}
function p(n){return n<10?'0'+n:String(n);}
function fmtB(b){if(!b||isNaN(b))return'--';if(b<1024)return b+'B';if(b<1048576)return(b/1024).toFixed(0)+'KB';return(b/1048576).toFixed(1)+'MB';}

// Resize overlay when window resizes
window.addEventListener('resize',function(){if(lastDets.length)drawBoxes(lastDets,imgNatW,imgNatH);drawChart();});
})();
</script>
</body>
</html>
)rawhtml";

// ============================================================================
//  GLOBAL STATE
// ============================================================================

WebServer        server(80);
WebSocketsServer webSocket(81);

struct Detection {
  float x, y, w, h, conf;
  char  cls[32];
};

#define MAX_DETS 30
Detection  detections[MAX_DETS];
int        detectionCount = 0;
int        personCount    = 0;
int        peakCount      = 0;
int        totalScans     = 0;
float      confAvg        = 0.0f;
unsigned long inferMs     = 0;
int        imgW           = 320;
int        imgH           = 240;

bool       offlineMode    = false;
bool       flashOn        = false;

// Count history ring buffer
int  countHistory[HIST_SIZE];
int  histHead    = 0;
bool histFull    = false;

SemaphoreHandle_t detMutex;

// Latest snapshot buffer (protected by mutex)
uint8_t*  snapBuf  = nullptr;
size_t    snapLen  = 0;
SemaphoreHandle_t snapMutex;

// ============================================================================
//  FORWARD DECLARATIONS
// ============================================================================

void runInference();

// ============================================================================
//  CAMERA INIT
// ============================================================================

bool initCamera() {
  camera_config_t cfg;
  cfg.ledc_channel = LEDC_CHANNEL_0;
  cfg.ledc_timer   = LEDC_TIMER_0;
  cfg.pin_d0       = Y2_GPIO;
  cfg.pin_d1       = Y3_GPIO;
  cfg.pin_d2       = Y4_GPIO;
  cfg.pin_d3       = Y5_GPIO;
  cfg.pin_d4       = Y6_GPIO;
  cfg.pin_d5       = Y7_GPIO;
  cfg.pin_d6       = Y8_GPIO;
  cfg.pin_d7       = Y9_GPIO;
  cfg.pin_xclk     = XCLK_GPIO;
  cfg.pin_pclk     = PCLK_GPIO;
  cfg.pin_vsync    = VSYNC_GPIO;
  cfg.pin_href     = HREF_GPIO;
  cfg.pin_sscb_sda = SIOD_GPIO;
  cfg.pin_sscb_scl = SIOC_GPIO;
  cfg.pin_pwdn     = PWDN_GPIO;
  cfg.pin_reset    = RESET_GPIO;
  cfg.xclk_freq_hz = 20000000;
  cfg.pixel_format = PIXFORMAT_JPEG;

  // Use PSRAM if available for higher resolution
  if (psramFound()) {
    cfg.frame_size   = FRAMESIZE_QVGA;  // 320×240 — good balance for inference
    cfg.jpeg_quality = SNAPSHOT_QUALITY;
    cfg.fb_count     = 2;
  } else {
    cfg.frame_size   = FRAMESIZE_QVGA;
    cfg.jpeg_quality = 20;
    cfg.fb_count     = 1;
  }

  esp_err_t err = esp_camera_init(&cfg);
  if (err != ESP_OK) {
    Serial.printf("[CAM] Init failed: 0x%x\n", err);
    return false;
  }

  sensor_t* s = esp_camera_sensor_get();
  s->set_brightness(s, 0);
  s->set_contrast(s, 0);
  s->set_saturation(s, 0);
  s->set_special_effect(s, 0);
  s->set_whitebal(s, 1);
  s->set_awb_gain(s, 1);
  s->set_wb_mode(s, 0);
  s->set_exposure_ctrl(s, 1);
  s->set_aec2(s, 0);
  s->set_gain_ctrl(s, 1);
  s->set_agc_gain(s, 0);
  s->set_gainceiling(s, (gainceiling_t)0);
  s->set_bpc(s, 0);
  s->set_wpc(s, 1);
  s->set_raw_gma(s, 1);
  s->set_lenc(s, 1);
  s->set_hmirror(s, 0);
  s->set_vflip(s, 0);
  s->set_dcw(s, 1);
  s->set_colorbar(s, 0);

  Serial.println("[CAM] Initialized OK");
  return true;
}

// ============================================================================
//  SNAPSHOT CAPTURE & CACHE
// ============================================================================

bool captureSnapshot() {
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("[CAM] Frame capture failed");
    return false;
  }

  imgW = fb->width;
  imgH = fb->height;

  if (xSemaphoreTake(snapMutex, pdMS_TO_TICKS(500)) == pdTRUE) {
    if (snapBuf) free(snapBuf);
    snapBuf = (uint8_t*)ps_malloc(fb->len);
    if (snapBuf) {
      memcpy(snapBuf, fb->buf, fb->len);
      snapLen = fb->len;
    }
    xSemaphoreGive(snapMutex);
  }

  esp_camera_fb_return(fb);
  return (snapBuf != nullptr);
}

// ============================================================================
//  BASE64 ENCODE  (mbedtls)
// ============================================================================

char* encodeBase64(const uint8_t* src, size_t srcLen, size_t* outLen) {
  size_t needed = 0;
  mbedtls_base64_encode(nullptr, 0, &needed, src, srcLen);
  char* out = (char*)ps_malloc(needed + 1);
  if (!out) return nullptr;
  mbedtls_base64_encode((uint8_t*)out, needed + 1, outLen, src, srcLen);
  out[*outLen] = '\0';
  return out;
}

// ============================================================================
//  ROBOFLOW INFERENCE
// ============================================================================

void runInference() {
  if (!captureSnapshot()) return;

  // Take a local copy of the snapshot for inference
  uint8_t* buf = nullptr;
  size_t   len = 0;

  if (xSemaphoreTake(snapMutex, pdMS_TO_TICKS(500)) == pdTRUE) {
    if (snapBuf && snapLen) {
      buf = (uint8_t*)ps_malloc(snapLen);
      if (buf) { memcpy(buf, snapBuf, snapLen); len = snapLen; }
    }
    xSemaphoreGive(snapMutex);
  }

  if (!buf) return;

  // Base64 encode
  size_t encLen = 0;
  char* encoded = encodeBase64(buf, len, &encLen);
  free(buf);
  if (!encoded) { Serial.println("[RF] Base64 malloc failed"); return; }

  Serial.printf("[RF] Sending %u bytes base64 (%u raw) to Roboflow...\n", encLen, len);

  unsigned long t0 = millis();

  WiFiClientSecure client;
  client.setInsecure();   // Skip cert verification (acceptable for local IoT)
  client.setTimeout(15);

  HTTPClient http;
  String url = String(RF_URL) + "?api_key=" + RF_API_KEY
             + "&confidence=" + String((int)(RF_MIN_CONF * 100))
             + "&overlap=50";

  http.begin(client, url);
  http.addHeader("Content-Type", "application/x-www-form-urlencoded");
  http.setTimeout(12000);

  int code = http.POST((uint8_t*)encoded, encLen);
  free(encoded);

  inferMs = millis() - t0;
  Serial.printf("[RF] HTTP %d in %lu ms\n", code, inferMs);

  if (code != 200) {
    Serial.printf("[RF] Error: %s\n", http.errorToString(code).c_str());
    http.end();
    return;
  }

  String body = http.getString();
  http.end();

  // Parse Roboflow JSON
  DynamicJsonDocument doc(8192);
  if (deserializeJson(doc, body) != DeserializationError::Ok) {
    Serial.println("[RF] JSON parse error");
    return;
  }

  JsonArray preds = doc["predictions"].as<JsonArray>();
  int cnt    = 0;
  float cSum = 0.0f;

  if (xSemaphoreTake(detMutex, pdMS_TO_TICKS(500)) == pdTRUE) {
    detectionCount = 0;
    for (JsonObject p : preds) {
      float conf = p["confidence"] | 0.0f;
      if (conf < RF_MIN_CONF) continue;
      if (detectionCount >= MAX_DETS) break;

      Detection& d = detections[detectionCount];
      d.x    = p["x"]          | 0.0f;
      d.y    = p["y"]          | 0.0f;
      d.w    = p["width"]      | 0.0f;
      d.h    = p["height"]     | 0.0f;
      d.conf = conf;
      strlcpy(d.cls, p["class"] | "person", sizeof(d.cls));
      cSum += conf;
      detectionCount++;
      cnt++;
    }
    personCount = cnt;
    if (cnt > peakCount) peakCount = cnt;
    confAvg = cnt > 0 ? cSum / cnt : 0.0f;
    totalScans++;

    // Update history
    countHistory[histHead] = cnt;
    histHead = (histHead + 1) % HIST_SIZE;

    xSemaphoreGive(detMutex);
  }

  Serial.printf("[RF] People: %d  Conf avg: %.2f\n", cnt, confAvg);

  // Build WebSocket broadcast JSON
  DynamicJsonDocument out(4096);
  out["person_count"] = cnt;
  out["peak_count"]   = peakCount;
  out["infer_ms"]     = (int)inferMs;
  out["conf_avg"]     = confAvg;
  out["img_w"]        = imgW;
  out["img_h"]        = imgH;
  out["uptime_s"]     = (int)(millis() / 1000);

  JsonArray arr = out.createNestedArray("detections");
  if (xSemaphoreTake(detMutex, pdMS_TO_TICKS(200)) == pdTRUE) {
    for (int i = 0; i < detectionCount; i++) {
      JsonObject o = arr.createNestedObject();
      o["x"]    = detections[i].x;
      o["y"]    = detections[i].y;
      o["w"]    = detections[i].w;
      o["h"]    = detections[i].h;
      o["conf"] = detections[i].conf;
      o["cls"]  = detections[i].cls;
    }
    xSemaphoreGive(detMutex);
  }

  String wsMsg;
  serializeJson(out, wsMsg);
  webSocket.broadcastTXT(wsMsg);
}

// ============================================================================
//  INFERENCE TASK  (Core 0 — leaves Core 1 for HTTP/WS)
// ============================================================================

void inferenceTask(void* pv) {
  unsigned long lastRun = 0;
  for (;;) {
    if (millis() - lastRun >= INFER_INTERVAL_MS) {
      lastRun = millis();
      runInference();
    }
    vTaskDelay(200 / portTICK_PERIOD_MS);
  }
}

// ============================================================================
//  MJPEG STREAM
// ============================================================================

void handleStream() {
  WiFiClient client = server.client();
  client.println("HTTP/1.1 200 OK");
  client.println("Content-Type: multipart/x-mixed-replace;boundary=frame");
  client.println("Access-Control-Allow-Origin: *");
  client.println("Cache-Control: no-cache");
  client.println();

  while (client.connected()) {
    camera_fb_t* fb = esp_camera_fb_get();
    if (!fb) { delay(100); continue; }

    client.printf("--frame\r\nContent-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n", fb->len);
    client.write(fb->buf, fb->len);
    client.println();
    esp_camera_fb_return(fb);
    delay(50);  // ~20 FPS cap
  }
}

// ============================================================================
//  CORS + JSON HELPERS
// ============================================================================

void setCORS() {
  server.sendHeader("Access-Control-Allow-Origin",  "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  server.sendHeader("Cache-Control", "no-cache");
}

void sendJSON(int code, const String& json) {
  setCORS();
  server.send(code, "application/json", json);
}

// ============================================================================
//  WEB SERVER ROUTES
// ============================================================================

void setupRoutes() {

  // ── Dashboard ──
  server.on("/", HTTP_GET, []() {
    server.sendHeader("Content-Encoding", "identity");
    server.send_P(200, "text/html", DASHBOARD);
  });

  // ── Snapshot ──
  server.on("/snapshot", HTTP_GET, []() {
    if (xSemaphoreTake(snapMutex, pdMS_TO_TICKS(500)) == pdTRUE) {
      if (snapBuf && snapLen) {
        setCORS();
        server.sendHeader("Content-Type", "image/jpeg");
        server.send_P(200, "image/jpeg", (const char*)snapBuf, snapLen);
        xSemaphoreGive(snapMutex);
        return;
      }
      xSemaphoreGive(snapMutex);
    }
    // Fallback: capture fresh frame
    camera_fb_t* fb = esp_camera_fb_get();
    if (fb) {
      setCORS();
      server.sendHeader("Content-Type", "image/jpeg");
      server.send_P(200, "image/jpeg", (const char*)fb->buf, fb->len);
      esp_camera_fb_return(fb);
    } else {
      server.send(503, "text/plain", "Camera unavailable");
    }
  });

  // ── MJPEG stream ──
  server.on("/stream", HTTP_GET, handleStream);

  // ── Detections JSON ──
  server.on("/detections", HTTP_GET, []() {
    DynamicJsonDocument doc(2048);
    doc["person_count"] = personCount;
    doc["peak_count"]   = peakCount;
    doc["total_scans"]  = totalScans;
    doc["infer_ms"]     = (int)inferMs;
    doc["conf_avg"]     = confAvg;
    doc["img_w"]        = imgW;
    doc["img_h"]        = imgH;
    JsonArray arr = doc.createNestedArray("detections");
    if (xSemaphoreTake(detMutex, pdMS_TO_TICKS(200)) == pdTRUE) {
      for (int i = 0; i < detectionCount; i++) {
        JsonObject o = arr.createNestedObject();
        o["x"]=detections[i].x; o["y"]=detections[i].y;
        o["w"]=detections[i].w; o["h"]=detections[i].h;
        o["conf"]=detections[i].conf; o["cls"]=detections[i].cls;
      }
      xSemaphoreGive(detMutex);
    }
    String out; serializeJson(doc, out);
    sendJSON(200, out);
  });

  // ── History ──
  server.on("/history", HTTP_GET, []() {
    StaticJsonDocument<1024> doc;
    JsonArray arr = doc.createNestedArray("history");
    for (int i = 0; i < HIST_SIZE; i++) arr.add(countHistory[i]);
    String out; serializeJson(doc, out);
    sendJSON(200, out);
  });

  // ── System info ──
  server.on("/system", HTTP_GET, []() {
    StaticJsonDocument<512> doc;
    doc["fw_version"]  = "1.0.0";
    doc["uptime_s"]    = (int)(millis() / 1000);
    doc["free_heap"]   = (int)ESP.getFreeHeap();
    doc["chip_id"]     = String((uint32_t)(ESP.getEfuseMac() >> 32), HEX);
    doc["sta_ip"]      = WiFi.localIP().toString();
    doc["ap_ip"]       = "192.168.4.1";
    doc["sta_rssi"]    = (int)WiFi.RSSI();
    doc["offline"]     = offlineMode;
    doc["psram"]       = (int)ESP.getPsramSize();
    doc["psram_free"]  = (int)ESP.getFreePsram();
    doc["model"]       = RF_MODEL;
    doc["img_w"]       = imgW;
    doc["img_h"]       = imgH;
    String out; serializeJson(doc, out);
    sendJSON(200, out);
  });

  // ── Flash LED toggle ──
  server.on("/flash", HTTP_GET, []() {
    int state = server.hasArg("state") ? server.arg("state").toInt() : 0;
    flashOn = (state == 1);
    digitalWrite(FLASH_PIN, flashOn ? HIGH : LOW);
    sendJSON(200, flashOn ? "{\"flash\":true}" : "{\"flash\":false}");
  });

  // ── Options preflight ──
  server.onNotFound([]() {
    if (server.method() == HTTP_OPTIONS) { setCORS(); server.send(204); return; }
    setCORS(); server.send(404, "text/plain", "Not found");
  });

  server.begin();
  Serial.println("[HTTP] Server started — port 80");
}

// ============================================================================
//  WEBSOCKET
// ============================================================================

void webSocketEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length) {
  if (type == WStype_CONNECTED) {
    Serial.printf("[WS] #%u connected\n", num);
    webSocket.sendTXT(num, "{\"pong\":true}");
  } else if (type == WStype_TEXT) {
    StaticJsonDocument<64> cmd;
    if (!deserializeJson(cmd, payload, length)) {
      if (cmd["action"] == "ping")
        webSocket.sendTXT(num, "{\"pong\":true}");
    }
  }
}

// ============================================================================
//  WIFI
// ============================================================================

void setupWiFi() {
  Serial.println("[WiFi] Starting AP+STA...");
  WiFi.mode(WIFI_AP_STA);

  // SoftAP — always on so dashboard is reachable without internet
  WiFi.softAP(WIFI_AP_SSID, WIFI_AP_PASS);
  WiFi.softAPConfig(IPAddress(192,168,4,1), IPAddress(192,168,4,1), IPAddress(255,255,255,0));
  Serial.printf("[WiFi] AP: %s @ 192.168.4.1\n", WIFI_AP_SSID);

  // STA — needed to reach Roboflow cloud API
  WiFi.begin(WIFI_STA_SSID, WIFI_STA_PASS);
  int att = 0;
  while (WiFi.status() != WL_CONNECTED && att < 20) {
    delay(500); Serial.print('.'); att++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("[WiFi] STA: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("[WiFi] STA failed — OFFLINE. Roboflow inference disabled.");
    offlineMode = true;
  }

  if (MDNS.begin("fgx-cam")) {
    MDNS.addService("http", "tcp", 80);
    MDNS.addService("ws",   "tcp", 81);
    Serial.println("[mDNS] fgx-cam.local");
  }
}

// ============================================================================
//  SETUP
// ============================================================================

void setup() {
  Serial.begin(115200);
  Serial.println("\n╔══════════════════════════════════════╗");
  Serial.println("║  FlowGateX-CAM  People Counter  v1  ║");
  Serial.println("╚══════════════════════════════════════╝");

  // Flash LED
  pinMode(FLASH_PIN, OUTPUT);
  digitalWrite(FLASH_PIN, LOW);

  // Mutexes
  detMutex  = xSemaphoreCreateMutex();
  snapMutex = xSemaphoreCreateMutex();

  // History buffer
  memset(countHistory, 0, sizeof(countHistory));

  // Camera
  if (!initCamera()) {
    Serial.println("[FATAL] Camera init failed — halting");
    while (1) delay(1000);
  }

  // Initial snapshot (warms up camera)
  delay(500);
  captureSnapshot();

  // WiFi
  setupWiFi();

  // HTTP routes
  setupRoutes();

  // WebSocket
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  Serial.println("[WS] Server started — port 81");

  // Inference task on Core 0 (only if we have internet for Roboflow)
  if (!offlineMode) {
    xTaskCreatePinnedToCore(inferenceTask, "Inference", INFER_STACK, nullptr, 1, nullptr, 0);
    Serial.println("[RF] Inference task started on Core 0");
  } else {
    // Still capture snapshots for the dashboard feed
    xTaskCreatePinnedToCore([](void*){
      for(;;){captureSnapshot();vTaskDelay(1500/portTICK_PERIOD_MS);}
    }, "SnapTask", 4096, nullptr, 1, nullptr, 0);
  }

  Serial.println("╔═════════════════════════════════════════════╗");
  Serial.printf("║  Dashboard  → http://192.168.4.1/          ║\n");
  Serial.printf("║             → http://fgx-cam.local/         ║\n");
  if (WiFi.status() == WL_CONNECTED)
    Serial.printf("║             → http://%s/        ║\n", WiFi.localIP().toString().c_str());
  Serial.printf("║  Snapshot   → /snapshot                     ║\n");
  Serial.printf("║  Stream     → /stream                       ║\n");
  Serial.printf("║  Detections → /detections                   ║\n");
  Serial.printf("║  Model      → %s/%-3s          ║\n", RF_MODEL, RF_VERSION);
  Serial.println("╚═════════════════════════════════════════════╝");
}

// ============================================================================
//  LOOP
// ============================================================================

void loop() {
  server.handleClient();
  webSocket.loop();
}