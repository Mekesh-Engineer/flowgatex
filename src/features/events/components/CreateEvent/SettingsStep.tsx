import { Settings, Lock, FileText } from 'lucide-react';
import type { CreateEventData } from '../../types/event.types';

interface Props {
  data: CreateEventData;
  onUpdate: (data: Partial<CreateEventData>) => void;
}

export default function SettingsStep({ data, onUpdate }: Props) {
  return (
    <div>
      <div className="ce-step-title">
        <div className="ce-step-title-icon">
          <Settings size={20} />
        </div>
        Additional Settings
      </div>
      <p className="ce-step-subtitle">Configure refund policies and event visibility.</p>

      <div className="form-row">
        <label className="label">Refund Policy</label>
        <select
          className="select"
          value={data.refundPolicy}
          onChange={(e) => onUpdate({ refundPolicy: e.target.value as any })}
        >
          <option value="none">No Refunds</option>
          <option value="partial">Partial Refund</option>
          <option value="full">Full Refund</option>
        </select>
      </div>

      <div className="ce-toggle-row">
        <label className="ce-toggle">
          <input
            type="checkbox"
            checked={data.isPrivate}
            onChange={(e) => onUpdate({ isPrivate: e.target.checked })}
          />
          <div className="ce-toggle-track" />
        </label>
        <span className="ce-toggle-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
          <Lock size={14} /> Private Event (Invite Only)
        </span>
      </div>

      <div className="ce-toggle-row">
        <label className="ce-toggle">
          <input
            type="checkbox"
            checked={data.hasTerms}
            onChange={(e) => onUpdate({ hasTerms: e.target.checked })}
          />
          <div className="ce-toggle-track" />
        </label>
        <span className="ce-toggle-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
          <FileText size={14} /> I have specific Terms & Conditions
        </span>
      </div>
    </div>
  );
}