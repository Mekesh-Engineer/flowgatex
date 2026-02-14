import { useRef } from 'react';
import { ImageIcon, UploadCloud, X, Youtube } from 'lucide-react';
import type { CreateEventData } from '../../types/event.types';

interface Props {
  data: CreateEventData;
  onUpdate: (data: Partial<CreateEventData>) => void;
}

export default function MediaStep({ data, onUpdate }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpdate({ coverImage: url });
    }
  };

  return (
    <div>
      <div className="ce-step-title">
        <div className="ce-step-title-icon">
          <ImageIcon size={20} />
        </div>
        Media
      </div>
      <p className="ce-step-subtitle">Upload a cover image and add a video link to make your event stand out.</p>

      <label className="label" style={{ marginBottom: '0.75rem' }}>Cover Image</label>

      {data.coverImage ? (
        <div className="ce-cover-preview">
          <img src={data.coverImage} alt="Cover" />
          <button
            className="ce-cover-preview-remove"
            onClick={() => onUpdate({ coverImage: '' })}
            title="Remove cover image"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          className="ce-upload-zone"
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') fileInputRef.current?.click(); }}
        >
          <input
            type="file"
            hidden
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileSelect}
          />
          <div className="ce-upload-zone-icon">
            <UploadCloud size={28} />
          </div>
          <span className="ce-upload-zone-text">Click to upload cover image</span>
          <span className="ce-upload-zone-hint">PNG, JPG, WEBP up to 5MB</span>
        </div>
      )}

      <div className="form-row" style={{ marginTop: '1.5rem' }}>
        <label className="label">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
            <Youtube size={14} /> Video URL (Optional)
          </span>
        </label>
        <input
          className="input"
          type="url"
          placeholder="YouTube or Vimeo link"
          value={data.videoUrl || ''}
          onChange={(e) => onUpdate({ videoUrl: e.target.value })}
        />
      </div>
    </div>
  );
}