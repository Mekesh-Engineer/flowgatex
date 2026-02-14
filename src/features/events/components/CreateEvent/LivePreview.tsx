import { Calendar, MapPin, Globe } from 'lucide-react';
import type { CreateEventData } from '../../types/event.types';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function LivePreview({ data }: { data: CreateEventData }) {
  const coverImage = data.coverImage || '';

  return (
    <div className="ce-preview">
      <div className="ce-preview-header">
        <span>Live Preview</span>
      </div>

      {/* Cover */}
      <div className="ce-preview-cover">
        {coverImage ? (
          <img src={coverImage} alt="Cover" />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-disabled)',
              fontSize: '0.8125rem',
            }}
          >
            No cover image
          </div>
        )}
        {data.category && (
          <span className="ce-preview-cover-badge">{data.category}</span>
        )}
      </div>

      <div className="ce-preview-body">
        <h3 className="ce-preview-title">{data.title || 'Event Title'}</h3>
        <p className="ce-preview-tagline">{data.subtitle || 'Tagline...'}</p>

        {/* Date */}
        <div className="ce-preview-detail">
          <span className="ce-preview-detail-icon"><Calendar size={16} /></span>
          <div className="ce-preview-detail-text">
            <strong>{data.startDate ? formatDate(data.startDate) : 'Date TBD'}</strong>
            {data.timezone}
          </div>
        </div>

        {/* Location */}
        <div className="ce-preview-detail">
          <span className="ce-preview-detail-icon">
            {data.locationType === 'online' ? <Globe size={16} /> : <MapPin size={16} />}
          </span>
          <div className="ce-preview-detail-text">
            {data.locationType === 'online' ? 'Online Event' : (data.venue?.name || 'Venue Name')}
          </div>
        </div>

        <div className="ce-preview-divider" />

        {/* Tickets */}
        <h4 className="ce-preview-section-title">Tickets</h4>
        {data.ticketTiers.length > 0 ? (
          data.ticketTiers
            .filter(t => t.visibility === 'public')
            .map((tier, idx) => (
              <div key={idx} className="ce-preview-ticket-row">
                <span className="ce-preview-ticket-name">{tier.name}</span>
                <span className="ce-preview-ticket-price">{formatCurrency(tier.price)}</span>
              </div>
            ))
        ) : (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-disabled)', margin: 0 }}>
            No tickets added yet
          </p>
        )}

        <div className="ce-preview-divider" />

        {/* About */}
        <h4 className="ce-preview-section-title">About</h4>
        <p className="ce-preview-description">
          {data.description || 'Description will appear here...'}
        </p>
      </div>
    </div>
  );
}