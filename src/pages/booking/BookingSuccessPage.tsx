import { useSearchParams, Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, CheckCircle2, Ticket } from 'lucide-react';
import BookingConfirmation from '@/features/booking/components/BookingConfirmation';
import { getBookingById } from '@/features/booking/services/bookingService';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ParticleCanvas } from '@/features/home/components/canvas/CanvasEffects';
import { FloatingElement } from '@/features/home/components/ui/SharedComponents';

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
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4 transition-colors duration-300 relative overflow-hidden">
        <ParticleCanvas particleCount={30} className="pointer-events-none opacity-50" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-md relative z-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] mb-6 shadow-lg">
            <AlertCircle size={28} className="text-[var(--text-muted)]" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Booking not found</h2>
          <p className="text-[var(--text-muted)] mb-6">The booking you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold bg-[var(--color-primary)] hover:shadow-lg hover:shadow-[var(--shadow-primary)] transition-all duration-300"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300 relative overflow-hidden">
        {/* Celebration Effects */}
        <ParticleCanvas particleCount={50} className="pointer-events-none opacity-40" />
        
        <FloatingElement className="absolute top-20 left-10 hidden lg:block opacity-30 pointer-events-none" delay={0}>
             <CheckCircle2 className="text-green-500" size={64} />
        </FloatingElement>
        <FloatingElement className="absolute bottom-20 right-10 hidden lg:block opacity-30 pointer-events-none" delay={1}>
             <Ticket className="text-[var(--color-primary)]" size={64} />
        </FloatingElement>
        
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <BookingConfirmation booking={booking} />
      </div>
    </div>
  );
}

export default BookingSuccessPage;
