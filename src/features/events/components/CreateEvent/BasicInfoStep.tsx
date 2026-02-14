import { FileText, Type, Layers } from 'lucide-react';
import type { CreateEventData } from '../../types/event.types';

const CATEGORIES = ['Music', 'Tech', 'Business', 'Sports', 'Arts', 'Workshop', 'Other'];
const AGES = ['all', '18+', '21+'];

interface Props {
  data: CreateEventData;
  onUpdate: (data: Partial<CreateEventData>) => void;
}

export default function BasicInfoStep({ data, onUpdate }: Props) {
  return (
    <div>
      <div className="ce-step-title">
        <div className="ce-step-title-icon">
          <FileText size={20} />
        </div>
        Basic Information
      </div>
      <p className="ce-step-subtitle">Start with the essentials — give your event a name and category.</p>

      <div className="form-row">
        <label className="label label-required">Event Title</label>
        <input
          className="input"
          type="text"
          placeholder="Give your event a catchy title"
          value={data.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
        />
      </div>

      <div className="form-row">
        <label className="label">Short Tagline / Subtitle</label>
        <input
          className="input"
          type="text"
          placeholder="A brief subtitle or tagline"
          value={data.subtitle}
          onChange={(e) => onUpdate({ subtitle: e.target.value })}
        />
      </div>

      <div className="form-grid form-grid-2">
        <div className="form-row">
          <label className="label label-required">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
              <Layers size={14} /> Category
            </span>
          </label>
          <select
            className="select"
            value={data.category}
            onChange={(e) => onUpdate({ category: e.target.value as any })}
          >
            <option value="">Select category</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c.toLowerCase()}>{c}</option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label className="label">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
              <Type size={14} /> Age Restriction
            </span>
          </label>
          <select
            className="select"
            value={data.ageRestriction}
            onChange={(e) => onUpdate({ ageRestriction: e.target.value as any })}
          >
            {AGES.map(a => (
              <option key={a} value={a}>{a === 'all' ? 'All Ages' : a}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}