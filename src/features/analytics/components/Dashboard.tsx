import { Box, Grid, Typography } from '@mui/material';
import { DollarSign, Calendar, Users, Ticket } from 'lucide-react';
import { useAnalyticsOverview } from '../hooks/useAnalytics';
import MetricsCard from './MetricsCard';
import RevenueChart from './RevenueChart';

function Dashboard() {
  const { data, isLoading } = useAnalyticsOverview();

  if (isLoading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="text.secondary">Loading analytics...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricsCard
            title="Total Revenue"
            value={data?.totalRevenue || 0}
            change={data?.revenueGrowth}
            isCurrency
            icon={<DollarSign size={20} />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricsCard
            title="Total Bookings"
            value={data?.totalBookings || 0}
            change={data?.bookingsGrowth}
            icon={<Ticket size={20} />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricsCard
            title="Total Attendees"
            value={data?.totalAttendees || 0}
            icon={<Users size={20} />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricsCard
            title="Active Events"
            value={data?.totalEvents || 0}
            icon={<Calendar size={20} />}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <RevenueChart />
      </Box>
    </Box>
  );
}

export default Dashboard;
