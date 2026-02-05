import { Box, Typography, Button, Divider } from '@mui/material';
import { formatCurrency } from '@/lib/utils';
import type { CreateEventData } from '../../types/event.types';

interface ReviewStepProps {
  data: Partial<CreateEventData>;
  onPrev: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

function ReviewStep({ data, onPrev, onSubmit, isSubmitting }: ReviewStepProps) {
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 4 }}>
        Review Your Event
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Event Title
        </Typography>
        <Typography variant="h6">{data.title}</Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Category
        </Typography>
        <Typography sx={{ textTransform: 'capitalize' }}>{data.category}</Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Description
        </Typography>
        <Typography color="text.secondary">{data.description}</Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Venue
        </Typography>
        <Typography>{data.venue?.name}</Typography>
        <Typography variant="body2" color="text.secondary">
          {data.venue?.address}, {data.venue?.city}, {data.venue?.state}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Capacity: {data.venue?.capacity}
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
          Ticket Tiers
        </Typography>
        {data.ticketTiers?.map((tier, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              py: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box>
              <Typography>{tier.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {tier.quantity} tickets
              </Typography>
            </Box>
            <Typography fontWeight={600} color="primary.main">
              {formatCurrency(tier.price)}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined" onClick={onPrev} disabled={isSubmitting}>
          Back
        </Button>
        <button
          type="button"
          onClick={onSubmit}
          className="btn-glow"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Event...' : 'Create Event'}
        </button>
      </Box>
    </Box>
  );
}

export default ReviewStep;
