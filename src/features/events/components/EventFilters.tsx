import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  InputAdornment,
} from '@mui/material';
import { Search, X } from 'lucide-react';
import { EVENT_CATEGORIES } from '@/lib/constants';
import type { EventFilters as EventFiltersType } from '../types/event.types';

interface EventFiltersProps {
  filters: EventFiltersType;
  onFilterChange: (filters: EventFiltersType) => void;
}

function EventFilters({ filters, onFilterChange }: EventFiltersProps) {
  const handleChange = (key: keyof EventFiltersType, value: string | undefined) => {
    onFilterChange({ ...filters, [key]: value || undefined });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const hasFilters = Object.values(filters).some((v) => v !== undefined);

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        flexWrap: 'wrap',
        alignItems: 'center',
        mb: 4,
        p: 3,
        backgroundColor: 'background.paper',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <TextField
        placeholder="Search events..."
        size="small"
        value={filters.search || ''}
        onChange={(e) => handleChange('search', e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search size={18} />
            </InputAdornment>
          ),
        }}
        sx={{ minWidth: 250, flex: 1 }}
      />

      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Category</InputLabel>
        <Select
          value={filters.category || ''}
          label="Category"
          onChange={(e) => handleChange('category', e.target.value)}
        >
          <MenuItem value="">All Categories</MenuItem>
          {EVENT_CATEGORIES.map((cat) => (
            <MenuItem key={cat.id} value={cat.id}>
              {cat.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        placeholder="City"
        size="small"
        value={filters.city || ''}
        onChange={(e) => handleChange('city', e.target.value)}
        sx={{ minWidth: 120 }}
      />

      <TextField
        type="date"
        size="small"
        label="From Date"
        value={filters.startDate || ''}
        onChange={(e) => handleChange('startDate', e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{ minWidth: 150 }}
      />

      {hasFilters && (
        <Button
          variant="text"
          onClick={clearFilters}
          startIcon={<X size={16} />}
          sx={{ color: 'text.secondary' }}
        >
          Clear
        </Button>
      )}
    </Box>
  );
}

export default EventFilters;
