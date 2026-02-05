import { Box, TextField, Typography, Grid, Button } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CreateEventData } from '../../types/event.types';

const venueSchema = z.object({
  name: z.string().min(2, 'Venue name is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
});

interface VenueStepProps {
  data: Partial<CreateEventData>;
  onUpdate: (data: Partial<CreateEventData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

function VenueStep({ data, onUpdate, onNext, onPrev }: VenueStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(venueSchema),
    defaultValues: {
      name: data.venue?.name || '',
      address: data.venue?.address || '',
      city: data.venue?.city || '',
      state: data.venue?.state || '',
      capacity: data.venue?.capacity || 100,
    },
  });

  const onSubmit = (formData: z.infer<typeof venueSchema>) => {
    onUpdate({ venue: formData });
    onNext();
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Typography variant="h5" sx={{ mb: 4 }}>
        Venue Details
      </Typography>

      <TextField
        fullWidth
        label="Venue Name"
        {...register('name')}
        error={!!errors.name}
        helperText={errors.name?.message}
        sx={{ mb: 3 }}
      />

      <TextField
        fullWidth
        label="Address"
        {...register('address')}
        error={!!errors.address}
        helperText={errors.address?.message}
        sx={{ mb: 3 }}
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="City"
            {...register('city')}
            error={!!errors.city}
            helperText={errors.city?.message}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="State"
            {...register('state')}
            error={!!errors.state}
            helperText={errors.state?.message}
          />
        </Grid>
      </Grid>

      <TextField
        fullWidth
        label="Capacity"
        type="number"
        {...register('capacity', { valueAsNumber: true })}
        error={!!errors.capacity}
        helperText={errors.capacity?.message}
        sx={{ mt: 3 }}
      />

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined" onClick={onPrev}>
          Back
        </Button>
        <button type="submit" className="btn-glow">
          Next: Tickets
        </button>
      </Box>
    </Box>
  );
}

export default VenueStep;
