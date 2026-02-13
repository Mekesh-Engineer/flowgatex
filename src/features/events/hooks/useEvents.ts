import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService } from '../services/eventService';
import type { CreateEventData } from '../types/event.types';
import { showSuccess, showError } from '@/components/common/Toast';

export const EVENT_KEYS = {
  all: ['events'] as const,
  lists: () => [...EVENT_KEYS.all, 'list'] as const,
  organizer: (id: string) => [...EVENT_KEYS.all, 'organizer', id] as const,
  details: () => [...EVENT_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...EVENT_KEYS.details(), id] as const,
};

// ── Queries ────────────────────────────────────────────────────────

/** Fetch published events. */
export function useEvents(count?: number) {
  return useQuery({
    queryKey: EVENT_KEYS.lists(),
    queryFn: () => eventService.getEvents(count),
  });
}

/** Fetch all events for a specific organizer. */
export function useOrganizerEvents(organizerId: string) {
  return useQuery({
    queryKey: EVENT_KEYS.organizer(organizerId),
    queryFn: () => eventService.getEventsByOrganizer(organizerId),
    enabled: !!organizerId,
  });
}

/** Fetch a single event by ID. */
export function useEventById(eventId: string) {
  return useQuery({
    queryKey: EVENT_KEYS.detail(eventId),
    queryFn: () => eventService.getEventById(eventId),
    enabled: !!eventId,
  });
}

// ── Mutations ──────────────────────────────────────────────────────

/** Publish a new event. */
export function usePublishEvent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ data, userId }: { data: CreateEventData; userId: string }) =>
      eventService.publishEvent(data, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EVENT_KEYS.all });
      showSuccess('Event published successfully!');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to publish event');
    },
  });
}

/** Save an event as a draft. */
export function useSaveDraft() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ data, userId }: { data: CreateEventData; userId: string }) =>
      eventService.saveDraft(data, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EVENT_KEYS.all });
      showSuccess('Draft saved!');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to save draft');
    },
  });
}

/** Update an existing event. */
export function useUpdateEvent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateEventData> }) =>
      eventService.updateEvent(id, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: EVENT_KEYS.detail(variables.id) });
      qc.invalidateQueries({ queryKey: EVENT_KEYS.lists() });
      showSuccess('Event updated!');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to update event');
    },
  });
}

/** Delete an event. */
export function useDeleteEvent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => eventService.deleteEvent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EVENT_KEYS.all });
      showSuccess('Event deleted!');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to delete event');
    },
  });
}

export default useEvents;
