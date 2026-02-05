import { useParams } from 'react-router-dom';
import { Container, Typography, Box, Tabs, Tab } from '@mui/material';
import { useState } from 'react';
import { useEventDetails } from '@/features/events/hooks/useEventDetails';

function ManageEventPage() {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading } = useEventDetails(id || '');
  const [activeTab, setActiveTab] = useState(0);

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (!event) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography>Event not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
        {event.title}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Manage your event settings, tickets, and analytics
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Overview" />
          <Tab label="Tickets" />
          <Tab label="Attendees" />
          <Tab label="Analytics" />
          <Tab label="Settings" />
        </Tabs>
      </Box>

      <Box>
        {activeTab === 0 && <Typography>Event Overview</Typography>}
        {activeTab === 1 && <Typography>Ticket Management</Typography>}
        {activeTab === 2 && <Typography>Attendee List</Typography>}
        {activeTab === 3 && <Typography>Event Analytics</Typography>}
        {activeTab === 4 && <Typography>Event Settings</Typography>}
      </Box>
    </Container>
  );
}

export default ManageEventPage;
