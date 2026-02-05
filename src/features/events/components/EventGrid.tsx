import { Grid, Box, Typography, Skeleton } from '@mui/material';
import EventCard from './EventCard';
import type { Event } from '../types/event.types';

interface EventGridProps {
  events: Event[];
  isLoading?: boolean;
  emptyMessage?: string;
}

function EventGrid({ events, isLoading, emptyMessage = 'No events found' }: EventGridProps) {
  if (isLoading) {
    return (
      <Grid container spacing={3}>
        {[...Array(6)].map((_, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
            <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 4 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (events.length === 0) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 10,
          px: 4,
          backgroundColor: 'background.paper',
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {events.map((event) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={event.id}>
          <EventCard event={event} />
        </Grid>
      ))}
    </Grid>
  );
}

export default EventGrid;
