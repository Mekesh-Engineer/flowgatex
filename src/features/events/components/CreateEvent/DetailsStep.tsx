import { useState } from 'react';
import { AlignLeft, Hash, X } from 'lucide-react';
import type { CreateEventData } from '../../types/event.types';

interface Props {
  data: CreateEventData;
  onUpdate: (data: Partial<CreateEventData>) => void;
}

export default function DetailsStep({ data, onUpdate }: Props) {
  const [tagInput, setTagInput] = useState('');
  const [highlightInput, setHighlightInput] = useState('');

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!data.tags.includes(tagInput.trim())) {
        onUpdate({ tags: [...data.tags, tagInput.trim()] });
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    onUpdate({ tags: data.tags.filter(t => t !== tag) });
  };

  const addHighlight = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && highlightInput.trim()) {
      e.preventDefault();
      // Avoid duplicates
      if (!data.highlights?.includes(highlightInput.trim())) {
        const current = data.highlights || [];
        onUpdate({ highlights: [...current, highlightInput.trim()] });
      }
      setHighlightInput('');
    }
  };

  const removeHighlight = (highlight: string) => {
    const current = data.highlights || [];
    onUpdate({ highlights: current.filter(h => h !== highlight) });
  };

  return (
    <div>
      <div className="ce-step-title">
        <div className="ce-step-title-icon">
          <AlignLeft size={20} />
        </div>
        Event Details
      </div>
      <p className="ce-step-subtitle">Describe your event and add discoverable tags.</p>

      <div className="form-row">
        <label className="label label-required">Event Description</label>
        <textarea
          className="textarea"
          rows={6}
          placeholder="Tell people what makes your event special..."
          value={data.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
        />
      </div>

      <div className="form-row">
        <label className="label">Event Highlights</label>
        <input
          className="input"
          type="text"
          value={highlightInput}
          onChange={(e) => setHighlightInput(e.target.value)}
          onKeyDown={addHighlight}
          placeholder="Type a highlight (e.g. '50+ Speakers') and press Enter"
        />
        <span className="helper-text">Press Enter to add each highlight</span>
      </div>

      {data.highlights && data.highlights.length > 0 && (
        <div className="ce-tags mb-6">
          {data.highlights.map((highlight, idx) => (
            <span key={idx} className="ce-tag bg-blue-50 text-blue-700 border-blue-200">
              {highlight}
              <button onClick={() => removeHighlight(highlight)} title="Remove highlight">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="form-row">
        <label className="label">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
            <Hash size={14} /> Event Tags
          </span>
        </label>
        <input
          className="input"
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={addTag}
          placeholder="Type a tag and press Enter"
        />
        <span className="helper-text">Press Enter to add each tag</span>
      </div>

      {data.tags.length > 0 && (
        <div className="ce-tags">
          {data.tags.map(tag => (
            <span key={tag} className="ce-tag">
              {tag}
              <button onClick={() => removeTag(tag)} title="Remove tag">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}