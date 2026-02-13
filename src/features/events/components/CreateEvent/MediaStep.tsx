import { useRef } from 'react';
import { Box, Typography, Paper, IconButton, TextField } from '@mui/material';
import { UploadCloud, X } from 'lucide-react';
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
      // Create local preview URL
      const url = URL.createObjectURL(file);
      onUpdate({ coverImage: url });
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Media</Typography>

      <Typography variant="subtitle2" sx={{ mb: 2 }}>Cover Image</Typography>
      {data.coverImage ? (
        <Box sx={{ position: 'relative', height: 300, borderRadius: 2, overflow: 'hidden', mb: 4 }}>
          <img src={data.coverImage} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <IconButton 
            onClick={() => onUpdate({ coverImage: '' })}
            sx={{ position: 'absolute', top: 10, right: 10, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}
          >
            <X size={20} />
          </IconButton>
        </Box>
      ) : (
        <Paper 
          variant="outlined" 
          onClick={() => fileInputRef.current?.click()}
          sx={{ 
            height: 250, mb: 4, borderStyle: 'dashed', 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
            cursor: 'pointer', '&:hover': { bgcolor: 'grey.50' } 
          }}
        >
          <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleFileSelect} />
          <UploadCloud size={40} className="text-gray-400" />
          <Typography color="text.secondary" sx={{ mt: 2 }}>Click to upload cover image</Typography>
        </Paper>
      )}

      <TextField
        fullWidth label="YouTube/Vimeo Video URL (Optional)"
        value={data.videoUrl || ''}
        onChange={(e) => onUpdate({ videoUrl: e.target.value })}
      />
    </Box>
  );
}