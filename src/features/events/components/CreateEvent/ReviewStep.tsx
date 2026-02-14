import { ClipboardCheck, AlertTriangle } from 'lucide-react';
import type { CreateEventData } from '../../types/event.types';

interface Props {
  data: CreateEventData;
  onPrev: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export default function ReviewStep({ data, onPrev, onSubmit, isSubmitting }: Props) {
  const isValid = data.title && data.startDate && data.ticketTiers.length > 0;

  return (
    <div>
      <div className="ce-step-title">
        <div className="ce-step-title-icon">
          <ClipboardCheck size={20} />
        </div>
        Review & Publish
      </div>
      <p className="ce-step-subtitle">
        Please review all details before publishing your event.
      </p>

      {!isValid && (
        <div className="ce-alert is-warning">
          <AlertTriangle size={18} />
          <span>Your event seems to be missing some required fields (Title, Date, or Tickets).</span>
        </div>
      )}

      <div className="ce-review-summary">
        <h3 className="ce-review-summary-title">{data.title || 'Untitled Event'}</h3>
        <p className="ce-review-summary-subtitle">{data.subtitle || 'No tagline'}</p>

        <div className="ce-review-divider" />

        <div className="ce-review-row">
          <strong>Date</strong>
          <span>{data.startDate ? new Date(data.startDate).toLocaleString() : 'Not set'}</span>
        </div>
        <div className="ce-review-row">
          <strong>Venue</strong>
          <span>{data.locationType === 'online' ? 'Online' : (data.venue?.name || 'Not set')}</span>
        </div>
        <div className="ce-review-row">
          <strong>Tickets</strong>
          <span>{data.ticketTiers.length} tier{data.ticketTiers.length !== 1 ? 's' : ''} configured</span>
        </div>
        <div className="ce-review-row">
          <strong>Category</strong>
          <span style={{ textTransform: 'capitalize' }}>{data.category || 'Not set'}</span>
        </div>
        <div className="ce-review-row">
          <strong>Organizer</strong>
          <span>{data.organizer.name || 'Not set'}</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
        <button className="btn btn-ghost" onClick={onPrev} disabled={isSubmitting}>
          Back
        </button>
        <button
          className="btn btn-primary btn-lg"
          onClick={onSubmit}
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? 'Publishing...' : '🚀 Publish Event'}
        </button>
      </div>
    </div>
  );
}