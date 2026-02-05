export type DeviceStatus = 'online' | 'offline' | 'maintenance';
export type DeviceType = 'scanner' | 'turnstile' | 'display';

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
