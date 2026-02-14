import { User, Globe, Instagram } from 'lucide-react';
import type { CreateEventData } from '../../types/event.types';

interface Props {
  data: CreateEventData;
  onUpdate: (data: Partial<CreateEventData>) => void;
}

export default function OrganizerStep({ data, onUpdate }: Props) {
  const handleOrgChange = (field: string, value: string) => {
    onUpdate({ organizer: { ...data.organizer, [field]: value } });
  };

  const handleSocialChange = (field: string, value: string) => {
    onUpdate({
      organizer: {
        ...data.organizer,
        socials: { ...data.organizer.socials, [field]: value }
      }
    });
  };

  return (
    <div>
      <div className="ce-step-title">
        <div className="ce-step-title-icon">
          <User size={20} />
        </div>
        Organizer Information
      </div>
      <p className="ce-step-subtitle">Tell attendees who's behind this event.</p>

      <div className="form-row">
        <label className="label label-required">Organizer Name</label>
        <input
          className="input"
          type="text"
          placeholder="Your name or organization"
          value={data.organizer.name}
          onChange={(e) => handleOrgChange('name', e.target.value)}
        />
      </div>

      <div className="form-row">
        <label className="label label-required">Contact Email</label>
        <input
          className="input"
          type="email"
          placeholder="contact@example.com"
          value={data.organizer.email}
          onChange={(e) => handleOrgChange('email', e.target.value)}
        />
      </div>

      <label className="label" style={{ marginBottom: '0.75rem', marginTop: '0.5rem' }}>Social Links</label>
      <div className="form-grid form-grid-2">
        <div className="form-row">
          <label className="label">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
              <Globe size={14} /> Website
            </span>
          </label>
          <input
            className="input"
            type="url"
            placeholder="https://yoursite.com"
            value={data.organizer.socials.website || ''}
            onChange={(e) => handleSocialChange('website', e.target.value)}
          />
        </div>
        <div className="form-row">
          <label className="label">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
              <Instagram size={14} /> Instagram
            </span>
          </label>
          <input
            className="input"
            type="text"
            placeholder="@handle"
            value={data.organizer.socials.instagram || ''}
            onChange={(e) => handleSocialChange('instagram', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}