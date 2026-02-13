import { Box, Typography, Button, Divider, Alert } from '@mui/material';
import type { CreateEventData } from '../../types/event.types';

interface Props {
  data: CreateEventData;
  onPrev: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export default function ReviewStep({ data, onPrev, onSubmit, isSubmitting }: Props) {
  // Simple validation check
  const isValid = data.title && data.startDate && data.ticketTiers.length > 0;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Review & Publish</Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Please review all details before publishing your event.
      </Typography>

      {!isValid && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Your event seems to be missing some required fields (Title, Date, or Tickets).
        </Alert>
      )}

      <Box sx={{ bgcolor: 'grey.50', p: 3, borderRadius: 2, mb: 4 }}>
        <Typography variant="subtitle1" fontWeight={600}>{data.title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{data.subtitle}</Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="body2">
          <strong>Date:</strong> {new Date(data.startDate).toLocaleString()}
        </Typography>
        <Typography variant="body2">
          <strong>Venue:</strong> {data.locationType === 'online' ? 'Online' : data.venue?.name}
        </Typography>
        <Typography variant="body2">
          <strong>Tickets:</strong> {data.ticketTiers.length} tiers configured
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={onPrev} disabled={isSubmitting}>Back</Button>
        <Button 
          variant="contained" 
          onClick={onSubmit} 
          disabled={!isValid || isSubmitting}
          size="large"
          className="btn-glow"
        >
          {isSubmitting ? 'Publishing...' : 'Publish Event'}
        </Button>
      </Box>
    </Box>
  );
}