import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import type { AnalyticsData, RevenueDataPoint, AttendanceDataPoint } from '../types/analytics.types';

export const ANALYTICS_KEYS = {
  all: ['analytics'] as const,
  overview: () => [...ANALYTICS_KEYS.all, 'overview'] as const,
  revenue: (period: string) => [...ANALYTICS_KEYS.all, 'revenue', period] as const,
  attendance: (eventId: string) => [...ANALYTICS_KEYS.all, 'attendance', eventId] as const,
};

const fetchAnalyticsOverview = async (): Promise<AnalyticsData> => {
  const response = await api.get('/analytics/overview');
  return response.data;
};

const fetchRevenueData = async (period: string): Promise<RevenueDataPoint[]> => {
  const response = await api.get(`/analytics/revenue?period=${period}`);
  return response.data;
};

const fetchAttendanceData = async (eventId: string): Promise<AttendanceDataPoint[]> => {
  const response = await api.get(`/analytics/attendance/${eventId}`);
  return response.data;
};

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ANALYTICS_KEYS.overview(),
    queryFn: fetchAnalyticsOverview,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRevenueAnalytics(period: string = '30d') {
  return useQuery({
    queryKey: ANALYTICS_KEYS.revenue(period),
    queryFn: () => fetchRevenueData(period),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAttendanceAnalytics(eventId: string) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.attendance(eventId),
    queryFn: () => fetchAttendanceData(eventId),
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000,
  });
}

export default useAnalyticsOverview;
