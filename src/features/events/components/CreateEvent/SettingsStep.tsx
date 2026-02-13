import { Box, Typography, TextField, FormControlLabel, Switch, MenuItem } from '@mui/material';
import type { CreateEventData } from '../../types/event.types';

interface Props {
  data: CreateEventData;
  onUpdate: (data: Partial<CreateEventData>) => void;
}

export default function SettingsStep({ data, onUpdate }: Props) {
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Additional Settings</Typography>

      <TextField
        select fullWidth label="Refund Policy"
        value={data.refundPolicy}
        onChange={(e) => onUpdate({ refundPolicy: e.target.value as any })}
        sx={{ mb: 3 }}
      >
        <MenuItem value="none">No Refunds</MenuItem>
        <MenuItem value="partial">Partial Refund</MenuItem>
        <MenuItem value="full">Full Refund</MenuItem>
      </TextField>

      <FormControlLabel
        control={<Switch checked={data.isPrivate} onChange={(e) => onUpdate({ isPrivate: e.target.checked })} />}
        label="Private Event (Invite Only)"
        sx={{ display: 'block', mb: 2 }}
      />

      <FormControlLabel
        control={<Switch checked={data.hasTerms} onChange={(e) => onUpdate({ hasTerms: e.target.checked })} />}
        label="I have specific Terms & Conditions"
        sx={{ display: 'block' }}
      />
    </Box>
  );
}