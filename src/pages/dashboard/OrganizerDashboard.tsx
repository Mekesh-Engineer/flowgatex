import { Container, Typography, Box, Button, Grid } from '@mui/material';
import { Plus, TrendingUp, Users, Ticket, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/common/Card';
import Dashboard from '@/features/analytics/components/Dashboard';

function OrganizerDashboard() {
  const stats = [
    { label: 'Total Revenue', value: '₹2,45,000', change: '+12%', icon: <DollarSign size={24} /> },
    { label: 'Active Events', value: 5, change: '+2', icon: <Ticket size={24} /> },
    { label: 'Total Attendees', value: 1240, change: '+8%', icon: <Users size={24} /> },
    { label: 'Sales Growth', value: '24%', change: '+5%', icon: <TrendingUp size={24} /> },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
            Organizer Dashboard
          </Typography>
          <Typography color="text.secondary">Manage your events and track performance</Typography>
        </Box>
        <Button
          component={Link}
          to="/organizer/events/create"
          variant="contained"
          startIcon={<Plus size={20} />}
        >
          Create Event
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 6 }}>
        {stats.map((stat) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={stat.label}>
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
                    <Typography variant="caption\" sx={{ color: 'success.main' }}>
                      {stat.change}
                    </Typography>
                  </Box>
                  <Box sx={{ color: 'primary.main' }}>{stat.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dashboard />
    </Container>
  );
}

export default OrganizerDashboard;
