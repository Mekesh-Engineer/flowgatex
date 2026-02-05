import { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { FILE_LIMITS } from '@/lib/constants';

interface FileUploadProps {
  label?: string;
  error?: string;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  onChange?: (files: File[]) => void;
}

function FileUpload({
  label,
  error,
  accept = 'image/*',
  multiple = false,
  maxFiles = 5,
  onChange,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      const validFiles = droppedFiles.filter(
        (file) =>
          FILE_LIMITS.acceptedImageTypes.includes(file.type) &&
          file.size <= FILE_LIMITS.maxImageSize
      );

      const newFiles = multiple
        ? [...files, ...validFiles].slice(0, maxFiles)
        : validFiles.slice(0, 1);

      setFiles(newFiles);
      onChange?.(newFiles);
    },
    [files, multiple, maxFiles, onChange]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files);
    const newFiles = multiple
      ? [...files, ...selectedFiles].slice(0, maxFiles)
      : selectedFiles.slice(0, 1);

    setFiles(newFiles);
    onChange?.(newFiles);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onChange?.(newFiles);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-dark-300 mb-1.5">{label}</label>
      )}

      <div
        className={cn(
          'border-2 border-dashed rounded-xl p-6 text-center transition-colors',
          isDragging
            ? 'border-primary-400 bg-primary-400/5'
            : 'border-dark-700 hover:border-dark-600',
          error && 'border-red-500'
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload size={32} className="mx-auto text-dark-500 mb-2" />
          <p className="text-dark-400">
            Drag & drop files here, or{' '}
            <span className="text-primary-400">browse</span>
          </p>
          <p className="text-sm text-dark-500 mt-1">
            PNG, JPG, WEBP up to 5MB
          </p>
        </label>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-dark-800 rounded-lg"
            >
              <ImageIcon size={20} className="text-dark-500" />
              <span className="flex-1 truncate text-sm">{file.name}</span>
              <span className="text-xs text-dark-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </span>
              <button
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-dark-700 rounded"
              >
                <X size={16} className="text-dark-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
    </div>
  );
}

export default FileUpload;
