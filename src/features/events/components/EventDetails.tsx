import { Box, Container, Typography, Grid, Chip, Button, Skeleton } from '@mui/material';
import { Calendar, MapPin, Users, Share2, Heart, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils';
import type { Event } from '../types/event.types';

interface EventDetailsProps {
  event: Event | null | undefined;
  isLoading?: boolean;
}

function EventDetails({ event, isLoading }: EventDetailsProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4, mb: 4 }} />
        <Skeleton variant="text" height={60} width="60%" />
        <Skeleton variant="text" height={30} width="40%" />
      </Container>
    );
  }

  if (!event) {
    return (
      <Container maxWidth="lg" sx={{ py: 10, textAlign: 'center' }}>
        <Typography variant="h5">Event not found</Typography>
        <Button onClick={() => navigate('/events')} sx={{ mt: 2 }} startIcon={<ArrowLeft />}>
          Back to Events
        </Button>
      </Container>
    );
  }

  return (
    <Box>
      {/* Hero Image */}
      <Box
        sx={{
          height: { xs: 250, md: 400 },
          backgroundImage: `url(${event.images[0] || '/placeholder-event.jpg'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, transparent 50%, rgba(10, 10, 15, 0.95) 100%)',
          }}
        />
      </Box>

      <Container maxWidth="lg" sx={{ mt: -10, position: 'relative', zIndex: 1 }}>
        <Grid container spacing={4}>
          {/* Main Content */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Box sx={{ mb: 4 }}>
              <Chip
                label={event.category}
                sx={{
                  backgroundColor: 'rgba(34, 211, 238, 0.2)',
                  color: 'primary.main',
                  mb: 2,
                  textTransform: 'capitalize',
                }}
              />
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
                {event.title}
              </Typography>
              <Typography color="text.secondary">
                Organized by <strong>{event.organizerName}</strong>
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                gap: 4,
                mb: 4,
                flexWrap: 'wrap',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: 'rgba(34, 211, 238, 0.1)',
                  }}
                >
                  <Calendar size={24} className="text-primary-400" />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Date & Time
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formatDateTime(event.dates.start)}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: 'rgba(34, 211, 238, 0.1)',
                  }}
                >
                  <MapPin size={24} className="text-primary-400" />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Location
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {event.venue.name}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Description */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                About This Event
              </Typography>
              <Typography color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                {event.description}
              </Typography>
            </Box>

            {/* Tags */}
            {event.tags.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {event.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}
          </Grid>

          {/* Sidebar - Ticket Selection */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{
                position: 'sticky',
                top: 100,
                backgroundColor: 'background.paper',
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                p: 3,
              }}
            >
              <Typography variant="h6" sx={{ mb: 3 }}>
                Select Tickets
              </Typography>

              {event.ticketTiers.map((tier) => (
                <Box
                  key={tier.id}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    mb: 2,
                    '&:hover': { borderColor: 'primary.main' },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography fontWeight={600}>{tier.name}</Typography>
                    <Typography fontWeight={700} color="primary.main">
                      {formatCurrency(tier.price)}
                    </Typography>
                  </Box>
                  {tier.description && (
                    <Typography variant="body2" color="text.secondary">
                      {tier.description}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {tier.available} tickets left
                  </Typography>
                </Box>
              ))}

              <Button
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 2 }}
              >
                Book Now
              </Button>

              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Heart size={18} />}
                >
                  Save
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Share2 size={18} />}
                >
                  Share
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default EventDetails;
