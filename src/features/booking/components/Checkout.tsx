import { useState } from 'react';
import { Box, Typography, TextField, Button, Grid, Divider } from '@mui/material';
import { useCheckout } from '../hooks/useCheckout';
import { formatCurrency } from '@/lib/utils';
import type { Attendee } from '../types/booking.types';

function Checkout() {
  const { items, totalPrice, isLoading, initiateCheckout } = useCheckout();
  const [attendees, setAttendees] = useState<Attendee[]>([{ name: '', email: '', phone: '' }]);

  const totalTickets = items.reduce((sum, item) => sum + item.quantity, 0);

  const updateAttendee = (index: number, field: keyof Attendee, value: string) => {
    const updated = [...attendees];
    updated[index] = { ...updated[index], [field]: value };
    setAttendees(updated);
  };

  const handleCheckout = async () => {
    const eventTitle = items[0]?.eventTitle || 'Event';
    const eventDate = new Date().toISOString(); // Should come from event
    await initiateCheckout(attendees, eventTitle, eventDate);
  };

  if (items.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Typography variant="h6" color="text.secondary">
          No items in cart
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Checkout
      </Typography>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Attendee Information
            </Typography>

            {attendees.map((attendee, index) => (
              <Box
                key={index}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  mb: 2,
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Attendee {index + 1}
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={attendee.name}
                      onChange={(e) => updateAttendee(index, 'name', e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={attendee.email}
                      onChange={(e) => updateAttendee(index, 'email', e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Phone (Optional)"
                      value={attendee.phone || ''}
                      onChange={(e) => updateAttendee(index, 'phone', e.target.value)}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Box
            sx={{
              p: 3,
              borderRadius: 3,
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              position: 'sticky',
              top: 100,
            }}
          >
            <Typography variant="h6" sx={{ mb: 3 }}>
              Order Summary
            </Typography>

            {items.map((item) => (
              <Box
                key={`${item.eventId}-${item.tierId}`}
                sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}
              >
                <Box>
                  <Typography variant="body2">{item.tierName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    x{item.quantity}
                  </Typography>
                </Box>
                <Typography>{formatCurrency(item.price * item.quantity)}</Typography>
              </Box>
            ))}

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Subtotal</Typography>
              <Typography>{formatCurrency(totalPrice)}</Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Total</Typography>
              <Typography variant="h6" color="primary.main">
                {formatCurrency(totalPrice)}
              </Typography>
            </Box>

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleCheckout}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : `Pay ${formatCurrency(totalPrice)}`}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Checkout;
