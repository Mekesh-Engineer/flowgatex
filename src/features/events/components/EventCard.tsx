import { Card, CardContent, CardMedia, Box, Typography, Chip, Stack } from '@mui/material';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Event } from '../types/event.types';

interface EventCardProps {
  event: Event;
}

function EventCard({ event }: EventCardProps) {
  const lowestPrice = Math.min(...event.ticketTiers.map((t) => t.price));
  const totalTickets = event.ticketTiers.reduce((sum, t) => sum + t.available, 0);

  return (
    <Card
      component={Link}
      to={`/events/${event.id}`}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          borderColor: 'primary.main',
          boxShadow: '0 0 20px rgba(34, 211, 238, 0.15)',
        },
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="180"
          image={event.images[0] || '/placeholder-event.jpg'}
          alt={event.title}
          sx={{ objectFit: 'cover' }}
        />
        {event.featured && (
          <Chip
            label="Featured"
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
            }}
          />
        )}
        <Chip
          label={event.category}
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            textTransform: 'capitalize',
          }}
        />
      </Box>

      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, lineHeight: 1.3 }}>
          {event.title}
        </Typography>

        <Stack spacing={1} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Calendar size={16} className="text-primary-400" />
            <Typography variant="body2" color="text.secondary">
              {formatDate(event.dates.start, 'MMM DD, YYYY • h:mm A')}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MapPin size={16} className="text-primary-400" />
            <Typography variant="body2" color="text.secondary" noWrap>
              {event.venue.name}, {event.venue.city}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Users size={16} className="text-primary-400" />
            <Typography variant="body2" color="text.secondary">
              {totalTickets} tickets available
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            From
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {formatCurrency(lowestPrice)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default EventCard;
