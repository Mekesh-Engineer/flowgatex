import { Container, Typography, Box, Tabs, Tab, Grid } from '@mui/material';
import { useState } from 'react';
import { Users, Calendar, Settings, Shield, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/common/Card';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(0);

  const stats = [
    { label: 'Total Users', value: '12,450', icon: <Users size={24} /> },
    { label: 'Total Events', value: '348', icon: <Calendar size={24} /> },
    { label: 'Platform Revenue', value: '₹45,00,000', icon: <TrendingUp size={24} /> },
    { label: 'Active Organizers', value: '156', icon: <Shield size={24} /> },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
        Admin Dashboard
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 6 }}>
        Platform management and analytics
      </Typography>

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
                  </Box>
                  <Box sx={{ color: 'primary.main' }}>{stat.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab icon={<Users size={18} />} iconPosition="start" label="Users" />
          <Tab icon={<Calendar size={18} />} iconPosition="start" label="Events" />
          <Tab icon={<TrendingUp size={18} />} iconPosition="start" label="Analytics" />
          <Tab icon={<Settings size={18} />} iconPosition="start" label="Settings" />
        </Tabs>
      </Box>

      <Box
        sx={{
          p: 4,
          borderRadius: 3,
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {activeTab === 0 && <Typography>User Management Panel</Typography>}
        {activeTab === 1 && <Typography>Event Management Panel</Typography>}
        {activeTab === 2 && <Typography>Platform Analytics</Typography>}
        {activeTab === 3 && <Typography>System Settings</Typography>}
      </Box>
    </Container>
  );
}

export default AdminDashboard;
