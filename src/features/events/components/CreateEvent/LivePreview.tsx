import { Box, Typography, Chip, Paper, Divider } from '@mui/material';
import { Calendar, MapPin, Globe } from 'lucide-react';
import type { CreateEventData } from '../../types/event.types';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function LivePreview({ data }: { data: CreateEventData }) {
  const coverImage = data.coverImage || 'https://via.placeholder.com/800x400?text=Cover+Image';

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        position: 'sticky', top: 24, 
        borderRadius: 2, overflow: 'hidden', 
        maxHeight: 'calc(100vh - 48px)', overflowY: 'auto' 
      }}
    >
      <Box sx={{ bgcolor: 'grey.100', p: 1, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>LIVE PREVIEW</Typography>
      </Box>

      {/* Cover */}
      <Box sx={{ height: 200, bgcolor: 'grey.200', backgroundImage: `url(${coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
        <Chip label={data.category} color="primary" size="small" sx={{ position: 'absolute', top: 16, right: 16 }} />
      </Box>

      <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{data.title || 'Event Title'}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{data.subtitle || 'Tagline...'}</Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Calendar size={18} className="text-primary-500" />
            <Box>
              <Typography variant="body2" fontWeight={600}>{data.startDate ? formatDate(data.startDate) : 'Date TBD'}</Typography>
              <Typography variant="caption" color="text.secondary">{data.timezone}</Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            {data.locationType === 'online' ? <Globe size={18} className="text-primary-500" /> : <MapPin size={18} className="text-primary-500" />}
            <Typography variant="body2">
              {data.locationType === 'online' ? 'Online Event' : (data.venue?.name || 'Venue Name')}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" sx={{ mb: 1 }}>Tickets</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {data.ticketTiers.length > 0 ? (
            data.ticketTiers.filter(t => t.visibility === 'public').map((tier, idx) => (
              <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span className="text-gray-600">{tier.name}</span>
                <span className="font-semibold">{formatCurrency(tier.price)}</span>
              </Box>
            ))
          ) : (
            <Typography variant="caption" color="text.secondary">No tickets added yet</Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" sx={{ mb: 1 }}>About</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {data.description || 'Description will appear here...'}
        </Typography>
      </Box>
    </Paper>
  );
}