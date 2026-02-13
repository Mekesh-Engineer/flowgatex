import { Box, TextField, Typography, MenuItem, Grid } from '@mui/material';
import type { CreateEventData } from '../../types/event.types';

const CATEGORIES = ['Music', 'Tech', 'Business', 'Sports', 'Arts', 'Workshop', 'Other'];
const AGES = ['all', '18+', '21+'];

interface Props {
  data: CreateEventData;
  onUpdate: (data: Partial<CreateEventData>) => void;
}

export default function BasicInfoStep({ data, onUpdate }: Props) {
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Basic Information</Typography>
      
      <TextField
        fullWidth label="Event Title"
        value={data.title}
        onChange={(e) => onUpdate({ title: e.target.value })}
        sx={{ mb: 3 }}
      />
      
      <TextField
        fullWidth label="Short Tagline / Subtitle"
        value={data.subtitle}
        onChange={(e) => onUpdate({ subtitle: e.target.value })}
        sx={{ mb: 3 }}
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            select fullWidth label="Category"
            value={data.category}
            onChange={(e) => onUpdate({ category: e.target.value as any })}
          >
            {CATEGORIES.map(c => <MenuItem key={c} value={c.toLowerCase()}>{c}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            select fullWidth label="Age Restriction"
            value={data.ageRestriction}
            onChange={(e) => onUpdate({ ageRestriction: e.target.value as any })}
          >
            {AGES.map(a => <MenuItem key={a} value={a}>{a === 'all' ? 'All Ages' : a}</MenuItem>)}
          </TextField>
        </Grid>
      </Grid>
    </Box>
  );
}