import { Box, Typography, Grid, FormControlLabel, Switch, TextField } from '@mui/material';
import type { CreateEventData } from '../../types/event.types';

interface Props {
  data: CreateEventData;
  onUpdate: (data: Partial<CreateEventData>) => void;
}

export default function DateStep({ data, onUpdate }: Props) {
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Date & Time</Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth type="datetime-local" label="Start Date & Time"
            InputLabelProps={{ shrink: true }}
            value={data.startDate.slice(0, 16)}
            onChange={(e) => onUpdate({ startDate: new Date(e.target.value).toISOString() })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth type="datetime-local" label="End Date & Time"
            InputLabelProps={{ shrink: true }}
            value={data.endDate.slice(0, 16)}
            onChange={(e) => onUpdate({ endDate: new Date(e.target.value).toISOString() })}
          />
        </Grid>
      </Grid>

      <TextField
        fullWidth label="Timezone"
        value={data.timezone}
        onChange={(e) => onUpdate({ timezone: e.target.value })}
        helperText="e.g., Asia/Kolkata, America/New_York"
        sx={{ mb: 3 }}
      />

      <FormControlLabel
        control={
          <Switch 
            checked={data.isRecurring} 
            onChange={(e) => onUpdate({ isRecurring: e.target.checked })} 
          />
        }
        label="This is a recurring event"
      />
    </Box>
  );
}