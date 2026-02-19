// =============================================================================
// ADMIN TYPES — All Admin Dashboard TypeScript Interfaces
// =============================================================================

import { Timestamp } from 'firebase/firestore';

// =============================================================================
// ADMIN STATS & DASHBOARD
// =============================================================================

export interface AdminStats {
  totalUsers: number;
  totalEvents: number;
  platformRevenue: number;
  activeOrganizers: number;
  pendingApprovals: number;
  bookingsToday: number;
  loading: boolean;
}

export interface AdminStatDelta {
  totalUsersDelta: number;
  totalEventsDelta: number;
  revenueDelta: number;
  organizersDelta: number;
}

export interface PlatformHealthStatus {
  firestore: 'operational' | 'degraded' | 'down';
  razorpay: 'operational' | 'degraded' | 'down';
  email: 'operational' | 'degraded' | 'down';
  pendingApprovals: number;
  lastChecked: Date;
}

export interface DailyStat {
  date: string;
  newUsers: number;
  activeUsers: number;
  newEvents: number;
  publishedEvents: number;
  newBookings: number;
  platformRevenue: number;
  refundsIssued: number;
  organizerApprovals: number;
}

// =============================================================================
// USER MANAGEMENT
// =============================================================================

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: 'attendee' | 'organizer' | 'admin' | 'super_admin';
  accountStatus: 'active' | 'suspended' | 'deleted';
  suspensionReason?: string | null;
  suspendedAt?: Timestamp | null;
  suspendedBy?: string | null;
  emailVerified: boolean;
  twoFactorEnabled?: boolean;
  lastLoginAt?: Timestamp;
  lastLoginIp?: string;
  bookingCount: number;
  totalSpent: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  phone?: string;
}

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  dateFrom?: Date;
  dateTo?: Date;
}

// =============================================================================
// EVENT MODERATION
// =============================================================================

export interface AdminEvent {
  id: string;
  title: string;
  description: string;
  organizerId: string;
  organizerName: string;
  category: string;
  status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'cancelled' | 'completed' | 'flagged';
  rejectionReason?: string | null;
  approvedAt?: Timestamp | null;
  approvedBy?: string | null;
  adminNote?: string | null;
  flags?: {
    count: number;
    reasons: string[];
    dismissedAt?: Timestamp | null;
    dismissedBy?: string | null;
  };
  ticketTiers: {
    name: string;
    price: number;
    capacity: number;
    available: number;
  }[];
  startDate: Timestamp;
  endDate: Timestamp;
  venue: { name: string; address: string; city: string };
  bannerUrl?: string;
  submittedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface EventFilters {
  status?: string;
  category?: string;
  organizerId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
}

// =============================================================================
// ORGANIZER APPLICATIONS & OVERSIGHT
// =============================================================================

export interface OrganizerApplication {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  organizationName: string;
  description: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'info_requested';
  submittedAt: Timestamp;
  reviewedAt?: Timestamp | null;
  reviewedBy?: string | null;
  reviewNote?: string | null;
  documents: {
    type: 'kyc' | 'business_registration' | 'other';
    storagePath: string;
    fileName: string;
    uploadedAt: Timestamp;
  }[];
}

export interface OrganizerProfile {
  uid: string;
  organizationName: string;
  ownerName: string;
  ownerEmail: string;
  totalEvents: number;
  activeEvents: number;
  totalRevenue: number;
  pendingPayout: number;
  status: 'active' | 'suspended' | 'revoked';
  createdAt: Timestamp;
}

// =============================================================================
// ATTENDEE / BOOKING MANAGEMENT
// =============================================================================

export interface AttendeeRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  eventId: string;
  eventTitle: string;
  ticketCount: number;
  ticketTier?: string;
  totalAmount: number;
  platformFee?: number;
  organizerAmount?: number;
  status: 'confirmed' | 'checked_in' | 'cancelled' | 'refunded' | 'pending';
  checkedInAt?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface AttendeeFilters {
  eventId?: string;
  userId?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  ticketType?: string;
}

// =============================================================================
// TRANSACTIONS & PAYMENTS
// =============================================================================

export interface AdminTransaction {
  id: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature?: string;
  bookingId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  eventId: string;
  eventTitle?: string;
  organizerName?: string;
  amount: number;
  platformFee: number;
  organizerAmount: number;
  currency: string;
  status: 'paid' | 'refunded' | 'failed' | 'pending' | 'partially_refunded';
  gateway: 'razorpay' | 'mock';
  paymentMethod?: 'upi' | 'card' | 'netbanking' | 'wallet';
  refundId?: string;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: Timestamp;
  webhookEvents?: WebhookEvent[];
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface WebhookEvent {
  event: string;
  receivedAt: Timestamp;
  payload?: Record<string, unknown>;
}

export interface TransactionFilters {
  status?: string;
  gateway?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  eventId?: string;
}

export interface FinancialSummary {
  period: 'today' | '7d' | '30d' | '90d' | 'all_time';
  grossRevenue: number;
  platformFee: number;
  organizerAmount: number;
  totalRefunds: number;
  netRevenue: number;
  transactionCount: number;
  failedCount: number;
  updatedAt?: Timestamp;
}

export interface RefundParams {
  transactionId: string;
  amount: number;
  reason: string;
  notify: boolean;
}

export interface RefundResult {
  refundId: string;
  refundedAmount: number;
}

// =============================================================================
// PAYOUTS
// =============================================================================

export interface Payout {
  id: string;
  organizerId: string;
  organizerName: string;
  amount: number;
  currency: string;
  eventIds: string[];
  status: 'pending' | 'processing' | 'completed' | 'blocked' | 'failed';
  razorpayTransferId?: string | null;
  requestedAt: Timestamp;
  processedAt?: Timestamp | null;
  processedBy?: string | null;
  blockReason?: string | null;
}

// =============================================================================
// AUDIT LOGS
// =============================================================================

export interface AuditLogEntry {
  id: string;
  action: string;
  resource: string;
  resourceType: 'user' | 'event' | 'organizer' | 'booking' | 'transaction' | 'settings';
  performedBy: string;
  performedByEmail?: string;
  performedByRole: 'admin' | 'super_admin';
  bypassedViaRole?: 'super_admin' | null;
  details: {
    previousValue?: Record<string, unknown> | null;
    newValue?: Record<string, unknown> | null;
    reason?: string | null;
  };
  severity: 'info' | 'warning' | 'critical';
  ipAddress?: string;
  sessionId?: string;
  timestamp: Timestamp;
}

export interface AuditLogFilters {
  actionType?: string;
  resourceType?: string;
  dateFrom?: Date;
  dateTo?: Date;
  actor?: string;
  severity?: string;
}

// =============================================================================
// REPORTS
// =============================================================================

export type ReportType =
  | 'revenue'
  | 'user_growth'
  | 'event_performance'
  | 'booking_conversion'
  | 'refund_analytics'
  | 'organizer_activity'
  | 'transaction_reconciliation';

export interface ReportLog {
  id: string;
  reportType: ReportType;
  period: { from: Date; to: Date };
  format: 'pdf' | 'csv';
  generatedAt: Timestamp;
  generatedBy: string;
  fileSize?: number;
  status: 'generating' | 'ready' | 'failed' | 'expired';
  downloadUrl?: string;
  expiresAt?: Timestamp;
}

export interface ScheduledReport {
  id: string;
  reportType: ReportType;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  timeUtc: string;
  recipients: string[];
  format: 'pdf' | 'csv';
  createdBy: string;
  isActive: boolean;
}

// =============================================================================
// PLATFORM SETTINGS
// =============================================================================

export interface PlatformSettings {
  appName: string;
  supportEmail: string;
  defaultTimezone: string;
  tosUrl: string;
  privacyPolicyUrl: string;
  cookieBannerEnabled: boolean;
  serviceFeePerTicket: number;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  maintenanceEndTime?: Timestamp;
  updatedAt?: Timestamp;
  updatedBy?: string;
  passwordMinLength: number;
  twoFactorEnforcedRoles: string[];
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  accountLockoutMinutes: number;
}

// =============================================================================
// PROMO CODES
// =============================================================================

export interface PromoCode {
  id: string;
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  minOrderValue: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: Timestamp;
  eventScope: string[];
  isActive: boolean;
  createdAt: Timestamp;
  createdBy?: string;
}

// =============================================================================
// SERVICE RESULT PATTERN
// =============================================================================

export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================================================
// ADMIN STORE STATE
// =============================================================================

export interface AdminStoreState {
  // Stats
  stats: AdminStats;
  statsDelta: AdminStatDelta | null;
  
  // Platform health
  platformHealth: PlatformHealthStatus | null;
  
  // Pending counts for nav badges
  pendingApprovals: number;
  pendingPayouts: number;
  
  // Activity feed
  recentActivity: AuditLogEntry[];
  
  // Global loading
  isInitialized: boolean;
  
  // Actions
  setStats: (stats: AdminStats) => void;
  setStatsDelta: (delta: AdminStatDelta) => void;
  setPlatformHealth: (health: PlatformHealthStatus) => void;
  setPendingApprovals: (count: number) => void;
  setPendingPayouts: (count: number) => void;
  setRecentActivity: (activity: AuditLogEntry[]) => void;
  setInitialized: (value: boolean) => void;
}
