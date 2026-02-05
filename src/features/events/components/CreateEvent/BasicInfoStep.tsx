import { Box, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Select from '@/components/forms/Select';
import { EVENT_CATEGORIES } from '@/lib/constants';
import type { CreateEventData } from '../../types/event.types';

const basicInfoSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  category: z.string().min(1, 'Please select a category'),
});

interface BasicInfoStepProps {
  data: Partial<CreateEventData>;
  onUpdate: (data: Partial<CreateEventData>) => void;
  onNext: () => void;
}

function BasicInfoStep({ data, onUpdate, onNext }: BasicInfoStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      title: data.title || '',
      description: data.description || '',
      category: data.category || '',
    },
  });

  const onSubmit = (formData: z.infer<typeof basicInfoSchema>) => {
    onUpdate(formData);
    onNext();
  };

  const categoryOptions = EVENT_CATEGORIES.map((cat) => ({
    value: cat.id,
    label: cat.label,
  }));

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Typography variant="h5" sx={{ mb: 4 }}>
        Basic Information
      </Typography>

      <TextField
        fullWidth
        label="Event Title"
        {...register('title')}
        error={!!errors.title}
        helperText={errors.title?.message}
        sx={{ mb: 3 }}
      />

      <Select
        label="Category"
        options={categoryOptions}
        placeholder="Select a category"
        {...register('category')}
        error={errors.category?.message}
      />

      <TextField
        fullWidth
        label="Description"
        multiline
        rows={6}
        {...register('description')}
        error={!!errors.description}
        helperText={errors.description?.message}
        sx={{ mt: 3 }}
      />

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" className="btn-glow">
          Next: Venue Details
        </button>
      </Box>
    </Box>
  );
}

export default BasicInfoStep;
