import { useSearchParams, Navigate } from 'react-router-dom';
import { Container, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import BookingConfirmation from '@/features/booking/components/BookingConfirmation';
import { getBookingById } from '@/features/booking/services/bookingService';
import LoadingSpinner from '@/components/common/LoadingSpinner';

function BookingSuccessPage() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('id');

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => getBookingById(bookingId!),
    enabled: !!bookingId,
  });

  if (!bookingId) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading booking details..." />;
  }

  if (!booking) {
    return (
      <Container maxWidth="lg" sx={{ py: 10, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary">
          Booking not found
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <BookingConfirmation booking={booking} />
    </Container>
  );
}

export default BookingSuccessPage;
