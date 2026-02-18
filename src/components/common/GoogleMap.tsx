import { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';

interface MapCoordinate {
  lat: number;
  lng: number;
}

interface MapProps {
  center: MapCoordinate;
  zoom?: number;
  markers?: Array<{
    position: MapCoordinate;
    title?: string;
    onClick?: () => void;
  }>;
  className?: string;
  height?: string | number;
}

const libraries: ('places' | 'geometry' | 'drawing' | 'visualization' | 'marker')[] = ['marker'];

export default function GoogleMapComponent({
  center,
  zoom = 14,
  markers = [],
  className = '',
  height = '100%'
}: MapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const [authError, setAuthError] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  // Capture Google Maps Auth Errors
  useEffect(() => {
    const originalHandler = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      const message = "The Google Maps JavaScript API could not load. This usually means the API key is not valid, lacks billing, or the 'Referer' is restricted.";
      console.error(message);
      setAuthError(message);
      if (originalHandler) originalHandler();
    };

    return () => {
      (window as any).gm_authFailure = originalHandler;
    };
  }, []);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
    // Cleanup markers
    markersRef.current.forEach(marker => marker.map = null);
    markersRef.current = [];
  }, []);

  // Handle Advanced Markers
  useEffect(() => {
    if (!mapRef.current || !window.google?.maps?.marker?.AdvancedMarkerElement) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.map = null);
    markersRef.current = [];

    // Add new markers
    markers.forEach(markerData => {
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: markerData.position,
        title: markerData.title,
      });

      if (markerData.onClick) {
        marker.addListener('click', markerData.onClick);
      }

      markersRef.current.push(marker);
    });

  }, [markers, isLoaded]); // Re-run when markers change or API loads

  const mapContainerStyle = useMemo(() => ({
    width: '100%',
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: '0.75rem',
  }), [height]);

  const options = useMemo(() => ({
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID',
    styles: [ /* Classic styles are ignored when mapId is used for vector maps, but kept for fallback */
      { featureType: 'all', elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
      { featureType: 'all', elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
      { featureType: 'all', elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
      { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
      { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
      { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
      { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
      { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
      { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
      { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
      { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
      { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
      { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
      { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] }
    ]
  }), []);

  // Handle case where API key is missing
  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return (
      <div className={`relative flex items-center justify-center bg-slate-800 rounded-xl overflow-hidden ${className}`} style={{ height }}>
        <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/San_Francisco_OpenStreetMap.png')] bg-cover bg-center grayscale invert" />
        <div className="z-10 text-center p-4 bg-black/60 backdrop-blur rounded-lg border border-white/10 max-w-sm">
          <MapPin className="mx-auto text-yellow-500 mb-2" size={32} />
          <h3 className="text-white font-bold">Google Maps API Key Missing</h3>
          <p className="text-gray-300 text-sm mt-1">
            Please add VITE_GOOGLE_MAPS_API_KEY to your .env file to enable real-time maps.
          </p>
        </div>
      </div>
    );
  }

  if (loadError || authError) {
    const errorMessage = authError || loadError?.message || "Unknown error";

    console.error('Google Maps Load Error:', loadError);
    return (
      <div className={`flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/10 text-red-500 rounded-xl p-6 ${className}`} style={{ height }}>
        <p className="font-bold">Error loading Google Maps</p>
        <p className="text-sm mt-2 text-center max-w-xs wrap-break-word">{errorMessage}</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse ${className}`} style={{ height }}>
        <MapPin className="text-gray-400 animate-bounce" size={32} />
      </div>
    );
  }

  return (
    <div className={`rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={options}
      >

      </GoogleMap>
    </div>
  );
}
