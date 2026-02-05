import { useState } from 'react';
import { Container, Typography } from '@mui/material';
import EventGrid from '@/features/events/components/EventGrid';
import EventFilters from '@/features/events/components/EventFilters';
import { useEvents } from '@/features/events/hooks/useEvents';
import type { EventFilters as EventFiltersType } from '@/features/events/types/event.types';

function EventsPage() {
  const [filters, setFilters] = useState<EventFiltersType>({});
  const { data, isLoading } = useEvents(filters);

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography variant="h3" sx={{ fontWeight: 700, mb: 4 }}>
        Discover Events
      </Typography>

      <EventFilters filters={filters} onFilterChange={setFilters} />

      <EventGrid
        events={data?.events || []}
        isLoading={isLoading}
        emptyMessage="No events found matching your criteria"
      />
    </Container>
  );
}

export default EventsPage;
