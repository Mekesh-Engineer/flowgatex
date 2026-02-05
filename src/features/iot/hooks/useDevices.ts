import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { getDevicesByEvent, subscribeToDevices } from '../services/iotService';
import type { IoTDevice } from '../types/iot.types';

export const DEVICE_KEYS = {
  all: ['devices'] as const,
  byEvent: (eventId: string) => [...DEVICE_KEYS.all, 'event', eventId] as const,
};

export function useDevices(eventId: string) {
  return useQuery({
    queryKey: DEVICE_KEYS.byEvent(eventId),
    queryFn: () => getDevicesByEvent(eventId),
    enabled: !!eventId,
  });
}

export function useRealtimeDevices(eventId: string) {
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;

    const unsubscribe = subscribeToDevices(eventId, (updatedDevices) => {
      setDevices(updatedDevices);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [eventId]);

  return { devices, isLoading };
}

export default useDevices;
