import { MapPin, Video, ParkingCircle } from 'lucide-react';
import type { CreateEventData } from '../../types/event.types';

interface Props {
  data: CreateEventData;
  onUpdate: (data: Partial<CreateEventData>) => void;
}

const PLATFORMS = [
  { value: 'zoom', label: 'Zoom' },
  { value: 'meet', label: 'Google Meet' },
  { value: 'teams', label: 'Microsoft Teams' },
  { value: 'custom', label: 'Custom Link' },
];

export default function VenueStep({ data, onUpdate }: Props) {
  const handleVenueChange = (field: string, value: any) => {
    onUpdate({ venue: { ...data.venue!, [field]: value } });
  };

  const handleOnlineChange = (field: string, value: string) => {
    onUpdate({
      onlineDetails: { ...(data.onlineDetails ?? { platform: 'zoom', link: '' }), [field]: value },
    });
  };

  return (
    <div>
      <div className="ce-step-title">
        <div className="ce-step-title-icon">
          <MapPin size={20} />
        </div>
        Venue / Location
      </div>
      <p className="ce-step-subtitle">Where will your event take place?</p>

      <div className="form-row">
        <label className="label label-required">Location Type</label>
        <select
          className="select"
          value={data.locationType}
          onChange={(e) => onUpdate({ locationType: e.target.value as any })}
        >
          <option value="physical">In-Person (Physical Venue)</option>
          <option value="online">Online / Virtual</option>
          <option value="tba">To Be Announced</option>
        </select>
      </div>

      {/* Physical venue fields */}
      {data.locationType === 'physical' && (
        <>
          <div className="form-row">
            <label className="label label-required">Venue Name</label>
            <input
              className="input"
              type="text"
              placeholder="Name of the venue"
              value={data.venue?.name || ''}
              onChange={(e) => handleVenueChange('name', e.target.value)}
            />
          </div>

          <div className="form-row">
            <label className="label">Address</label>
            <input
              className="input"
              type="text"
              placeholder="Street address"
              value={data.venue?.address || ''}
              onChange={(e) => handleVenueChange('address', e.target.value)}
            />
          </div>

          <div className="form-grid form-grid-3">
            <div className="form-row">
              <label className="label">City</label>
              <input
                className="input"
                type="text"
                value={data.venue?.city || ''}
                onChange={(e) => handleVenueChange('city', e.target.value)}
              />
            </div>
            <div className="form-row">
              <label className="label">State</label>
              <input
                className="input"
                type="text"
                value={data.venue?.state || ''}
                onChange={(e) => handleVenueChange('state', e.target.value)}
              />
            </div>
            <div className="form-row">
              <label className="label">ZIP / Pin Code</label>
              <input
                className="input"
                type="text"
                value={data.venue?.zipCode || ''}
                onChange={(e) => handleVenueChange('zipCode', e.target.value)}
              />
            </div>
          </div>

          <div className="form-grid form-grid-2">
            <div className="form-row">
              <label className="label">Country</label>
              <input
                className="input"
                type="text"
                value={data.venue?.country || ''}
                onChange={(e) => handleVenueChange('country', e.target.value)}
              />
            </div>
            <div className="form-row">
              <label className="label">Capacity</label>
              <input
                className="input"
                type="number"
                placeholder="Max attendees"
                value={data.venue?.capacity ?? ''}
                onChange={(e) => handleVenueChange('capacity', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>

          <div className="form-grid form-grid-2">
            <div className="form-row">
              <label className="label">Latitude</label>
              <input
                className="input"
                type="number"
                placeholder="e.g. 37.7749"
                value={data.venue?.mapCoordinates?.lat ?? ''}
                onChange={(e) => handleVenueChange('mapCoordinates', { ...data.venue?.mapCoordinates, lat: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="form-row">
               <label className="label">Longitude</label>
               <input
                 className="input"
                 type="number"
                 placeholder="e.g. -122.4194"
                 value={data.venue?.mapCoordinates?.lng ?? ''}
                 onChange={(e) => handleVenueChange('mapCoordinates', { ...(data.venue?.mapCoordinates || { lat: 0 }), lng: parseFloat(e.target.value) || 0 })}
               />
            </div>
          </div>

          <div className="ce-toggle-row">
            <label className="ce-toggle">
              <input
                type="checkbox"
                checked={data.venue?.hasParking ?? false}
                onChange={(e) => handleVenueChange('hasParking', e.target.checked)}
              />
              <div className="ce-toggle-track" />
            </label>
            <span className="ce-toggle-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
              <ParkingCircle size={14} /> Parking available at venue
            </span>
          </div>
        </>
      )}

      {/* Online fields */}
      {data.locationType === 'online' && (
        <div className="form-grid form-grid-2">
          <div className="form-row">
            <label className="label">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                <Video size={14} /> Platform
              </span>
            </label>
            <select
              className="select"
              value={data.onlineDetails?.platform || 'zoom'}
              onChange={(e) => handleOnlineChange('platform', e.target.value)}
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label className="label">Meeting Link</label>
            <input
              className="input"
              type="url"
              placeholder="https://..."
              value={data.onlineDetails?.link || ''}
              onChange={(e) => handleOnlineChange('link', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* TBA message */}
      {data.locationType === 'tba' && (
        <div style={{ padding: '2rem 0', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Location details will be shared with attendees later.
          </p>
        </div>
      )}
    </div>
  );
}