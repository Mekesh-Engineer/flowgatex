import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/redux/hooks';
import { createBooking, updateBookingStatus } from '../services/bookingService';
import { useCart } from './useCart';
import { showSuccess, showError } from '@/components/common/Toast';
import { BookingStatus } from '@/lib/constants';
import type { Attendee } from '../types/booking.types';

export function useCheckout() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { items, emptyCart, totalPrice } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const initiateCheckout = async (attendees: Attendee[], eventTitle: string, eventDate: string) => {
    if (!user) {
      showError('Please login to continue');
      navigate('/login');
      return null;
    }

    if (items.length === 0) {
      showError('Your cart is empty');
      return null;
    }

    setIsLoading(true);

    try {
      const tickets = items.map((item) => ({
        tierId: item.tierId,
        tierName: item.tierName,
        quantity: item.quantity,
        price: item.price,
      }));

      const id = await createBooking(
        user.uid,
        { eventId: items[0].eventId, tickets, attendees },
        eventTitle,
        eventDate
      );

      setBookingId(id);
      return id;
    } catch (error) {
      console.error('Checkout error:', error);
      showError('Failed to create booking');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const confirmPayment = async (paymentId: string) => {
    if (!bookingId) return;

    try {
      await updateBookingStatus(bookingId, BookingStatus.CONFIRMED, paymentId);
      emptyCart();
      showSuccess('Booking confirmed!');
      navigate(`/booking/success?id=${bookingId}`);
    } catch (error) {
      console.error('Payment confirmation error:', error);
      showError('Failed to confirm payment');
    }
  };

  return {
    items,
    totalPrice,
    isLoading,
    bookingId,
    initiateCheckout,
    confirmPayment,
  };
}

export default useCheckout;
