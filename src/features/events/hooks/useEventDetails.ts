import { useQuery } from '@tanstack/react-query';
import { eventService } from '../services/eventService';
import { EVENT_KEYS } from './useEvents';

export function useEventDetails(eventId: string) {
  return useQuery({
    queryKey: EVENT_KEYS.detail(eventId),
    queryFn: () => eventService.getEventById(eventId),
    enabled: !!eventId,
  });
}

export default useEventDetails;
