import { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import type { EventItem } from './types';
import GoogleMap from '@/components/common/GoogleMap';

interface Props {
  events: EventItem[];
}

function isMappableCoordinates(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
}

export default function MapView({ events }: Props) {
  const mappableEvents = useMemo(() => {
    return events.filter((event) => isMappableCoordinates(event.coordinates.lat, event.coordinates.lng));
  }, [events]);

  const markers = useMemo(() => {
    return mappableEvents.map(event => ({
      position: event.coordinates,
      title: event.title,
      onClick: () => {
        // Could navigate or open a modal or scroll to list item
      }
    }));
  }, [mappableEvents]);

  // Determine center based on efficient calculation or default to US center
  const center = useMemo(() => {
    if (mappableEvents.length > 0) {
      // Simple average for now
      const lat = mappableEvents.reduce((sum, e) => sum + e.coordinates.lat, 0) / mappableEvents.length;
      const lng = mappableEvents.reduce((sum, e) => sum + e.coordinates.lng, 0) / mappableEvents.length;
      return { lat, lng };
    }
    return { lat: 39.8283, lng: -98.5795 };
  }, [mappableEvents]);

  const zoom = mappableEvents.length > 0 ? 5 : 4; // Rudimentary zoom logic

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[var(--border-primary)] bg-[var(--bg-card)]">
      <div className="h-125">
        {mappableEvents.length > 0 ? (
          <GoogleMap
            center={center}
            zoom={zoom}
            markers={markers}
            height="100%"
            className="w-full h-full"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="text-center p-6 bg-[var(--bg-card)]/85 backdrop-blur-sm rounded-2xl border border-[var(--border-primary)] shadow-lg pointer-events-auto">
              <MapPin size={32} className="mx-auto text-[var(--color-primary)] mb-3" />
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Map View</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1 max-w-xs">
                No mappable event coordinates to display.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
