export interface AnalyticsData {
  totalRevenue: number;
  totalBookings: number;
  totalAttendees: number;
  totalEvents: number;
  revenueGrowth: number;
  bookingsGrowth: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  tickets: number;
}

export interface AttendanceDataPoint {
  date: string;
  attended: number;
  registered: number;
}

export interface TicketDistribution {
  tierName: string;
  sold: number;
  percentage: number;
}

export interface EventAnalytics {
  eventId: string;
  eventTitle: string;
  totalRevenue: number;
  totalTickets: number;
  soldTickets: number;
  attendanceRate: number;
  revenueByTier: { tier: string; revenue: number }[];
}
