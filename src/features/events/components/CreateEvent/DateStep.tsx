import { Clock, Globe, Repeat } from 'lucide-react';
import type { CreateEventData } from '../../types/event.types';

interface Props {
  data: CreateEventData;
  onUpdate: (data: Partial<CreateEventData>) => void;
}

const toLocalISOString = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  // Adjust for local timezone offset
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export default function DateStep({ data, onUpdate }: Props) {
  return (
    <div>
      <div className="ce-step-title">
        <div className="ce-step-title-icon">
          <Clock size={20} />
        </div>
        Date & Time
      </div>
      <p className="ce-step-subtitle">When is your event happening? Set the schedule.</p>

      <div className="form-grid form-grid-2">
        <div className="form-row">
          <label className="label label-required">Start Date & Time</label>
          <div className="relative">
             <input
              className="input pl-10 h-12 text-base font-medium"
              type="datetime-local"
              value={toLocalISOString(data.startDate)}
              onChange={(e) => {
                const date = new Date(e.target.value);
                if (!isNaN(date.getTime())) {
                   onUpdate({ startDate: date.toISOString() });
                }
              }}
            />
            <Clock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          </div>
        </div>
        <div className="form-row">
          <label className="label label-required">End Date & Time</label>
          <div className="relative">
            <input
              className="input pl-10 h-12 text-base font-medium"
              type="datetime-local"
              value={toLocalISOString(data.endDate)}
              onChange={(e) => {
                 const date = new Date(e.target.value);
                 if (!isNaN(date.getTime())) {
                    onUpdate({ endDate: date.toISOString() });
                 }
              }}
            />
             <Clock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="form-row">
        <label className="label">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
            <Globe size={14} /> Timezone
          </span>
        </label>
        <input
          className="input"
          type="text"
          placeholder="e.g., Asia/Kolkata, America/New_York"
          value={data.timezone}
          onChange={(e) => onUpdate({ timezone: e.target.value })}
        />
        <span className="helper-text">Enter the IANA timezone identifier</span>
      </div>

      <div className="ce-toggle-row">
        <label className="ce-toggle">
          <input
            type="checkbox"
            checked={data.isRecurring}
            onChange={(e) => onUpdate({ isRecurring: e.target.checked })}
          />
          <div className="ce-toggle-track" />
        </label>
        <span className="ce-toggle-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
          <Repeat size={14} /> This is a recurring event
        </span>
      </div>
    </div>
  );
}