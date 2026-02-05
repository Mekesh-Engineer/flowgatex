import { useState } from 'react';
import { Box, TextField, Typography, Button, IconButton, Grid } from '@mui/material';
import { Plus, Trash2 } from 'lucide-react';
import type { CreateEventData, TicketTier } from '../../types/event.types';

interface TicketsStepProps {
  data: Partial<CreateEventData>;
  onUpdate: (data: Partial<CreateEventData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

type PartialTicketTier = Omit<TicketTier, 'id' | 'sold' | 'available'>;

function TicketsStep({ data, onUpdate, onNext, onPrev }: TicketsStepProps) {
  const [tiers, setTiers] = useState<PartialTicketTier[]>(
    (data.ticketTiers as PartialTicketTier[]) || [
      { name: 'General', price: 500, quantity: 100, currency: 'INR' },
    ]
  );

  const addTier = () => {
    setTiers([...tiers, { name: '', price: 0, quantity: 0, currency: 'INR' }]);
  };

  const removeTier = (index: number) => {
    if (tiers.length > 1) {
      setTiers(tiers.filter((_, i) => i !== index));
    }
  };

  const updateTier = (index: number, field: keyof PartialTicketTier, value: string | number) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value };
    setTiers(updated);
  };

  const handleNext = () => {
    const isValid = tiers.every((t) => t.name && t.price >= 0 && t.quantity > 0);
    if (isValid) {
      onUpdate({ ticketTiers: tiers });
      onNext();
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 4 }}>
        Ticket Tiers
      </Typography>

      {tiers.map((tier, index) => (
        <Box
          key={index}
          sx={{
            p: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Tier {index + 1}
            </Typography>
            {tiers.length > 1 && (
              <IconButton onClick={() => removeTier(index)} size="small" color="error">
                <Trash2 size={18} />
              </IconButton>
            )}
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Tier Name"
                value={tier.name}
                onChange={(e) => updateTier(index, 'name', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField
                fullWidth
                label="Price (₹)"
                type="number"
                value={tier.price}
                onChange={(e) => updateTier(index, 'price', Number(e.target.value))}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={tier.quantity}
                onChange={(e) => updateTier(index, 'quantity', Number(e.target.value))}
                size="small"
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            label="Description (Optional)"
            value={tier.description || ''}
            onChange={(e) => updateTier(index, 'description', e.target.value)}
            size="small"
            sx={{ mt: 2 }}
          />
        </Box>
      ))}

      <Button
        variant="outlined"
        startIcon={<Plus size={18} />}
        onClick={addTier}
        sx={{ mb: 4 }}
      >
        Add Tier
      </Button>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined" onClick={onPrev}>
          Back
        </Button>
        <button type="button" onClick={handleNext} className="btn-glow">
          Next: Review
        </button>
      </Box>
    </Box>
  );
}

export default TicketsStep;
