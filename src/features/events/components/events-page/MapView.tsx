import React, { useEffect, useMemo, useRef } from 'react';
import { MapPin } from 'lucide-react';
import type { EventItem } from './types';

interface Props {
  events: EventItem[];
}

type LeafletLatLngTuple = [number, number];

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function isMappableCoordinates(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
}

export default function MapView({ events }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  const mappableEvents = useMemo(() => {
    return events.filter((event) => isMappableCoordinates(event.coordinates.lat, event.coordinates.lng));
  }, [events]);

  const leafletAvailable = typeof window !== 'undefined' && typeof (window as any).L !== 'undefined';

  useEffect(() => {
    if (!leafletAvailable) return undefined;
    if (!containerRef.current) return undefined;

    const L = (window as any).L;

    const map = L.map(containerRef.current, {
      center: [39.8283, -98.5795], // US center
      zoom: 4,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);

    mapRef.current = map;
    markersLayerRef.current = markersLayer;

    return () => {
      markersLayerRef.current = null;
      mapRef.current = null;
      map.remove();
    };
  }, [leafletAvailable]);

  useEffect(() => {
    if (!leafletAvailable) return;
    if (!mapRef.current || !markersLayerRef.current) return;

    const L = (window as any).L;
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;

    markersLayer.clearLayers();

    const points: LeafletLatLngTuple[] = [];

    mappableEvents.forEach((event) => {
      const { lat, lng } = event.coordinates;
      points.push([lat, lng]);

      const popupHtml = `
        <div style="min-width: 180px">
          <div style="font-weight: 700; margin-bottom: 2px;">${escapeHtml(event.title)}</div>
          <div style="opacity: 0.8; font-size: 12px;">${escapeHtml(event.location)}</div>
          <div style="margin-top: 6px; font-weight: 700;">$${event.price}</div>
        </div>
      `.trim();

      L.marker([lat, lng]).bindPopup(popupHtml).addTo(markersLayer);
    });

    if (points.length === 0) {
      map.setView([39.8283, -98.5795], 4);
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 12);
      return;
    }

    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
  }, [leafletAvailable, mappableEvents]);

  if (!leafletAvailable) {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-[var(--border-primary)] bg-[var(--bg-card)]">
        <div className="h-[500px] bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-base)] flex flex-col items-center justify-center p-6 text-center">
          <MapPin size={32} className="text-[var(--color-primary)] mb-3" />
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Map View</h3>
          <p className="text-sm text-[var(--text-muted)] mt-1 max-w-md">
            Map unavailable. Leaflet failed to load (check CSP / network), or the Leaflet script tag is missing in <code>index.html</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[var(--border-primary)] bg-[var(--bg-card)]">
      <div className="h-[500px]" ref={containerRef} aria-label="Event locations map (Leaflet + OpenStreetMap)" />
      {mappableEvents.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center p-6 bg-[var(--bg-card)]/85 backdrop-blur-sm rounded-2xl border border-[var(--border-primary)] shadow-lg">
            <MapPin size={32} className="mx-auto text-[var(--color-primary)] mb-3" />
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Map View</h3>
            <p className="text-sm text-[var(--text-muted)] mt-1 max-w-xs">
              No mappable event coordinates to display.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
