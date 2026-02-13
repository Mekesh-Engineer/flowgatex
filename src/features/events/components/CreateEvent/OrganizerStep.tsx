import { Box, Typography, TextField, Grid } from '@mui/material';
import type { CreateEventData } from '../../types/event.types';

interface Props {
  data: CreateEventData;
  onUpdate: (data: Partial<CreateEventData>) => void;
}

export default function OrganizerStep({ data, onUpdate }: Props) {
  const handleOrgChange = (field: string, value: string) => {
    onUpdate({ organizer: { ...data.organizer, [field]: value } });
  };

  const handleSocialChange = (field: string, value: string) => {
    onUpdate({ 
      organizer: { 
        ...data.organizer, 
        socials: { ...data.organizer.socials, [field]: value } 
      } 
    });
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Organizer Information</Typography>

      <TextField
        fullWidth label="Organizer Name"
        value={data.organizer.name}
        onChange={(e) => handleOrgChange('name', e.target.value)}
        sx={{ mb: 3 }}
      />
      
      <TextField
        fullWidth label="Contact Email"
        value={data.organizer.email}
        onChange={(e) => handleOrgChange('email', e.target.value)}
        sx={{ mb: 3 }}
      />

      <Typography variant="subtitle2" sx={{ mb: 2 }}>Social Links</Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth label="Website"
            value={data.organizer.socials.website || ''}
            onChange={(e) => handleSocialChange('website', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth label="Instagram"
            value={data.organizer.socials.instagram || ''}
            onChange={(e) => handleSocialChange('instagram', e.target.value)}
          />
        </Grid>
      </Grid>
    </Box>
  );
}