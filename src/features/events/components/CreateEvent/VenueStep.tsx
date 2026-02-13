import { Box, Typography, TextField, Grid, MenuItem, FormControlLabel, Switch } from '@mui/material';
import type { CreateEventData } from '../../types/event.types';

interface Props {
  data: CreateEventData;
  onUpdate: (data: Partial<CreateEventData>) => void;
}

const PLATFORMS = [
  { value: 'zoom', label: 'Zoom' },
  { value: 'meet', label: 'Google Meet' },
  { value: 'teams', label: 'Microsoft Teams' },
  { value: 'custom', label: 'Custom Link' },
];

export default function VenueStep({ data, onUpdate }: Props) {
  const handleVenueChange = (field: string, value: any) => {
    onUpdate({ venue: { ...data.venue!, [field]: value } });
  };

  const handleOnlineChange = (field: string, value: string) => {
    onUpdate({
      onlineDetails: { ...(data.onlineDetails ?? { platform: 'zoom', link: '' }), [field]: value },
    });
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Venue / Location</Typography>

      <TextField
        select fullWidth label="Location Type"
        value={data.locationType}
        onChange={(e) => onUpdate({ locationType: e.target.value as any })}
        sx={{ mb: 3 }}
      >
        <MenuItem value="physical">In-Person (Physical Venue)</MenuItem>
        <MenuItem value="online">Online / Virtual</MenuItem>
        <MenuItem value="tba">To Be Announced</MenuItem>
      </TextField>

      {/* ── Physical venue fields ──────────────────────────────────── */}
      {data.locationType === 'physical' && (
        <>
          <TextField
            fullWidth label="Venue Name"
            value={data.venue?.name || ''}
            onChange={(e) => handleVenueChange('name', e.target.value)}
            sx={{ mb: 3 }}
          />

          <TextField
            fullWidth label="Address"
            value={data.venue?.address || ''}
            onChange={(e) => handleVenueChange('address', e.target.value)}
            sx={{ mb: 3 }}
          />

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth label="City"
                value={data.venue?.city || ''}
                onChange={(e) => handleVenueChange('city', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth label="State"
                value={data.venue?.state || ''}
                onChange={(e) => handleVenueChange('state', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth label="ZIP / Pin Code"
                value={data.venue?.zipCode || ''}
                onChange={(e) => handleVenueChange('zipCode', e.target.value)}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth label="Country"
                value={data.venue?.country || ''}
                onChange={(e) => handleVenueChange('country', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth label="Capacity" type="number"
                value={data.venue?.capacity ?? ''}
                onChange={(e) => handleVenueChange('capacity', e.target.value ? Number(e.target.value) : undefined)}
              />
            </Grid>
          </Grid>

          <FormControlLabel
            control={
              <Switch
                checked={data.venue?.hasParking ?? false}
                onChange={(e) => handleVenueChange('hasParking', e.target.checked)}
              />
            }
            label="Parking available at venue"
          />
        </>
      )}

      {/* ── Online fields ──────────────────────────────────────────── */}
      {data.locationType === 'online' && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select fullWidth label="Platform"
              value={data.onlineDetails?.platform || 'zoom'}
              onChange={(e) => handleOnlineChange('platform', e.target.value)}
            >
              {PLATFORMS.map((p) => (
                <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth label="Meeting Link"
              placeholder="https://..."
              value={data.onlineDetails?.link || ''}
              onChange={(e) => handleOnlineChange('link', e.target.value)}
            />
          </Grid>
        </Grid>
      )}

      {/* ── TBA message ────────────────────────────────────────────── */}
      {data.locationType === 'tba' && (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          Location details will be shared with attendees later.
        </Typography>
      )}
    </Box>
  );
}