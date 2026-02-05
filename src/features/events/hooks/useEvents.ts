import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEvents,
  getFeaturedEvents,
  getEventsByOrganizer,
  createEvent,
  updateEvent,
  deleteEvent,
  publishEvent,
} from '../services/eventService';
import type { EventFilters, CreateEventData, Event } from '../types/event.types';
import { showSuccess, showError } from '@/components/common/Toast';

export const EVENT_KEYS = {
  all: ['events'] as const,
  lists: () => [...EVENT_KEYS.all, 'list'] as const,
  list: (filters: EventFilters) => [...EVENT_KEYS.lists(), filters] as const,
  featured: () => [...EVENT_KEYS.all, 'featured'] as const,
  organizer: (id: string) => [...EVENT_KEYS.all, 'organizer', id] as const,
  details: () => [...EVENT_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...EVENT_KEYS.details(), id] as const,
};

// Hook to fetch events with filters
export function useEvents(filters: EventFilters = {}) {
  return useQuery({
    queryKey: EVENT_KEYS.list(filters),
    queryFn: () => getEvents(filters),
  });
}

// Hook to fetch featured events
export function useFeaturedEvents(count?: number) {
  return useQuery({
    queryKey: EVENT_KEYS.featured(),
    queryFn: () => getFeaturedEvents(count),
  });
}

// Hook to fetch organizer's events
export function useOrganizerEvents(organizerId: string) {
  return useQuery({
    queryKey: EVENT_KEYS.organizer(organizerId),
    queryFn: () => getEventsByOrganizer(organizerId),
    enabled: !!organizerId,
  });
}

// Hook to create event
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEventData & { organizerId: string; organizerName: string }) =>
      createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENT_KEYS.all });
      showSuccess('Event created successfully!');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to create event');
    },
  });
}

// Hook to update event
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Event> }) => updateEvent(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: EVENT_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: EVENT_KEYS.lists() });
      showSuccess('Event updated successfully!');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to update event');
    },
  });
}

// Hook to delete event
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENT_KEYS.all });
      showSuccess('Event deleted successfully!');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to delete event');
    },
  });
}

// Hook to publish event
export function usePublishEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => publishEvent(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: EVENT_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: EVENT_KEYS.lists() });
      showSuccess('Event published successfully!');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to publish event');
    },
  });
}

export default useEvents;
