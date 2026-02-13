import { Box, Typography, TextField, Button, Grid, IconButton, Paper, MenuItem } from '@mui/material';
import { Plus, Trash2 } from 'lucide-react';
import type { CreateEventData, TicketTier } from '../../types/event.types';

interface Props {
  data: CreateEventData;
  onUpdate: (data: Partial<CreateEventData>) => void;
}

export default function TicketsStep({ data, onUpdate }: Props) {
  const addTier = () => {
    const newTier: TicketTier = {
      id: crypto.randomUUID(),
      name: 'General Admission',
      price: 0,
      quantity: 100,
      sold: 0,
      benefits: [],
      minPerOrder: 1,
      maxPerOrder: 10,
      visibility: 'public',
    };
    onUpdate({ ticketTiers: [...data.ticketTiers, newTier] });
  };

  const updateTier = (index: number, field: keyof TicketTier, value: any) => {
    const updatedTiers = [...data.ticketTiers];
    updatedTiers[index] = { ...updatedTiers[index], [field]: value };
    onUpdate({ ticketTiers: updatedTiers });
  };

  const removeTier = (index: number) => {
    onUpdate({ ticketTiers: data.ticketTiers.filter((_, i) => i !== index) });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Tickets &amp; Pricing</Typography>
        <Button startIcon={<Plus size={16} />} variant="outlined" onClick={addTier}>Add Tier</Button>
      </Box>

      {data.ticketTiers.map((tier, index) => (
        <Paper key={tier.id} variant="outlined" sx={{ p: 3, mb: 3, position: 'relative' }}>
          <IconButton
            size="small"
            onClick={() => removeTier(index)}
            sx={{ position: 'absolute', top: 10, right: 10, color: 'error.main' }}
          >
            <Trash2 size={16} />
          </IconButton>

          <Grid container spacing={3} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth label="Tier Name"
                value={tier.name}
                onChange={(e) => updateTier(index, 'name', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField
                fullWidth label="Price (₹)" type="number"
                value={tier.price}
                onChange={(e) => updateTier(index, 'price', parseFloat(e.target.value) || 0)}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField
                fullWidth label="Quantity" type="number"
                value={tier.quantity}
                onChange={(e) => updateTier(index, 'quantity', parseInt(e.target.value) || 0)}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mb: 2 }}>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField
                fullWidth label="Min per Order" type="number"
                value={tier.minPerOrder}
                onChange={(e) => updateTier(index, 'minPerOrder', parseInt(e.target.value) || 1)}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField
                fullWidth label="Max per Order" type="number"
                value={tier.maxPerOrder}
                onChange={(e) => updateTier(index, 'maxPerOrder', parseInt(e.target.value) || 10)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select fullWidth label="Visibility"
                value={tier.visibility}
                onChange={(e) => updateTier(index, 'visibility', e.target.value)}
              >
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="hidden">Hidden</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <TextField
            fullWidth label="Description (Optional)"
            value={tier.description || ''}
            onChange={(e) => updateTier(index, 'description', e.target.value)}
            size="small"
          />
        </Paper>
      ))}

      {data.ticketTiers.length === 0 && (
        <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
          No ticket tiers created. Add one to get started.
        </Typography>
      )}
    </Box>
  );
}
