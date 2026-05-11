export type DeviceStatus = 'online' | 'offline' | 'maintenance';
export type DeviceType = 'scanner' | 'turnstile' | 'display' | 'camera' | 'access_gate';

export interface IoTDevice {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  eventId: string;
  location: string;
  lastPing?: string;
  batteryLevel?: number;
  firmwareVersion?: string;
  scansToday?: number;
  /** Local IP address of the ESP32 device (e.g. "192.168.4.1") */
  ipAddress?: string;
  /** WebSocket port for real-time push (default: 81) */
  wsPort?: number;
}

export interface ScanResult {
  success: boolean;
  ticketId?: string;
  attendeeName?: string;
  tierName?: string;
  error?: string;
  timestamp: string;
}

export interface DeviceConfig {
  scanMode: 'entry' | 'exit' | 'both';
  soundEnabled: boolean;
  autoReconnect: boolean;
  reportInterval: number;
}
