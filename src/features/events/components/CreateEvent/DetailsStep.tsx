import { Box, Typography, TextField, Chip } from '@mui/material';
import type { CreateEventData } from '../../types/event.types';
import { useState } from 'react';

interface Props {
  data: CreateEventData;
  onUpdate: (data: Partial<CreateEventData>) => void;
}

export default function DetailsStep({ data, onUpdate }: Props) {
  const [tagInput, setTagInput] = useState('');

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

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Event Details</Typography>

      <TextField
        fullWidth multiline rows={6}
        label="Event Description"
        placeholder="Tell people what makes your event special..."
        value={data.description}
        onChange={(e) => onUpdate({ description: e.target.value })}
        sx={{ mb: 3 }}
      />

      <Typography variant="subtitle2" sx={{ mb: 1 }}>Event Tags (Press Enter to add)</Typography>
      <TextField
        fullWidth
        value={tagInput}
        onChange={(e) => setTagInput(e.target.value)}
        onKeyDown={addTag}
        placeholder="e.g. #concert #jazz"
        sx={{ mb: 2 }}
      />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {data.tags.map(tag => (
          <Chip key={tag} label={tag} onDelete={() => removeTag(tag)} />
        ))}
      </Box>
    </Box>
  );
}