import { Box, Typography, Button, Divider } from '@mui/material';
import { CheckCircle, Download, Calendar, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { Booking } from '../types/booking.types';

interface BookingConfirmationProps {
  booking: Booking;
}

function BookingConfirmation({ booking }: BookingConfirmationProps) {
  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center', py: 4 }}>
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          backgroundColor: 'success.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 3,
        }}
      >
        <CheckCircle size={40} color="white" />
      </Box>

      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Booking Confirmed!
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Your tickets have been sent to your email
      </Typography>

      <Box
        sx={{
          p: 4,
          borderRadius: 4,
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          textAlign: 'left',
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          {booking.eventTitle}
        </Typography>

        <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Calendar size={18} className="text-primary-400" />
            <Typography variant="body2">{formatDateTime(booking.eventDate)}</Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* QR Codes */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Your Tickets
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            {booking.tickets.map((ticket) =>
              ticket.qrCodes?.map((qr, index) => (
                <Box
                  key={qr}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: 'white',
                    textAlign: 'center',
                  }}
                >
                  <QRCodeSVG value={qr} size={100} />
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'black' }}>
                    {ticket.tierName} #{index + 1}
                  </Typography>
                </Box>
              ))
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography>Booking ID</Typography>
          <Typography fontWeight={600}>{booking.id}</Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography>Total Paid</Typography>
          <Typography fontWeight={600} color="primary.main">
            {formatCurrency(booking.finalAmount)}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'center' }}>
        <Button variant="outlined" startIcon={<Download size={18} />}>
          Download Tickets
        </Button>
        <Button component={Link} to="/dashboard" variant="contained">
          View My Bookings
        </Button>
      </Box>
    </Box>
  );
}

export default BookingConfirmation;
