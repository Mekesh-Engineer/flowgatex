export type TicketStatus = 'valid' | 'used' | 'expired' | 'cancelled';

export interface Ticket {
  id: string;
  userId: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  bookingId: string;
  transactionId: string;
  tierId: string;
  tierName: string;
  qrData: string;
  qrHash: string;
  qrCodeImage?: string; // Base64 QR image for offline display
  status: TicketStatus;
  generatedAt: string | any;
  scannedAt?: string | any;
  scannedBy?: string;
  regeneratedCount: number;
  attendeeName?: string;
  attendeeEmail?: string;
  /** Gate access level: 0=General, 1=VIP, 2=All-Access */
  gateAccessLevel?: number;
  expiresAt?: string | any;
}

export interface CreateTicketData {
  userId: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  bookingId: string;
  transactionId: string;
  tierId: string;
  tierName: string;
  attendeeName?: string;
  attendeeEmail?: string;
  /** Gate access level: 0=General, 1=VIP, 2=All-Access */
  gateAccessLevel?: number;
  expiresAt?: string;
}
