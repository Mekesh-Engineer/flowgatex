import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/zustand/stores';
import { getTicketsByUser } from '../services/ticketService';
import type { Ticket } from '../types/ticket.types';

export function useTickets() {
  const { user } = useAuthStore();

  const {
    data: tickets = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Ticket[]>({
    queryKey: ['tickets', user?.uid],
    queryFn: () => getTicketsByUser(user!.uid),
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
  });

  // Categorize tickets
  const now = new Date();
  const upcoming = tickets.filter((t) => {
    if (t.status !== 'valid') return false;
    const eventDate = new Date(t.eventDate);
    return eventDate >= now;
  });

  const past = tickets.filter((t) => {
    const eventDate = new Date(t.eventDate);
    return eventDate < now || t.status === 'used';
  });

  const cancelled = tickets.filter((t) => t.status === 'cancelled');

  return {
    tickets,
    upcoming,
    past,
    cancelled,
    isLoading,
    error,
    refetch,
  };
}

export default useTickets;
