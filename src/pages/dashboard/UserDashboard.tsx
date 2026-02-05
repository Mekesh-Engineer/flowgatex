import { Container, Typography, Grid, Box } from '@mui/material';
import { Ticket, Calendar, CreditCard } from 'lucide-react';
import { Card, CardContent } from '@/components/common/Card';
import { useAuth } from '@/features/auth/hooks/useAuth';

function UserDashboard() {
  const { user } = useAuth();

  const stats = [
    { label: 'Upcoming Events', value: 3, icon: <Calendar size={24} /> },
    { label: 'Tickets Purchased', value: 12, icon: <Ticket size={24} /> },
    { label: 'Total Spent', value: '₹15,000', icon: <CreditCard size={24} /> },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
          Welcome back, {user?.displayName || 'User'}!
        </Typography>
        <Typography color="text.secondary">
          Manage your bookings and discover new events
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 6 }}>
        {stats.map((stat) => (
          <Grid size={{ xs: 12, sm: 4 }} key={stat.label}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {stat.label}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: 'primary.main' }}>{stat.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h5" sx={{ mb: 3 }}>
        Upcoming Events
      </Typography>
      <Box
        sx={{
          p: 4,
          borderRadius: 3,
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        <Typography color="text.secondary">No upcoming events</Typography>
      </Box>
    </Container>
  );
}

export default UserDashboard;
