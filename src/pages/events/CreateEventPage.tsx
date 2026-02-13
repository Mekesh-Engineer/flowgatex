import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box, Container, Grid, Step, StepLabel, Stepper, Button,
  Typography, Alert, Paper
} from '@mui/material';
import { Upload, ChevronLeft, ChevronRight, Save } from 'lucide-react';

import useAuth from '@/features/auth/hooks/useAuth';
import { eventService } from '@/features/events/services/eventService';
import { INITIAL_EVENT_DATA, CreateEventData } from '@/features/events/types/event.types';

// Steps
import BasicInfoStep from '@/features/events/components/CreateEvent/BasicInfoStep';
import DateStep from '@/features/events/components/CreateEvent/DateStep';
import VenueStep from '@/features/events/components/CreateEvent/VenueStep';
import TicketsStep from '@/features/events/components/CreateEvent/TicketsStep';
import DetailsStep from '@/features/events/components/CreateEvent/DetailsStep';
import MediaStep from '@/features/events/components/CreateEvent/MediaStep';
import OrganizerStep from '@/features/events/components/CreateEvent/OrganizerStep';
import SettingsStep from '@/features/events/components/CreateEvent/SettingsStep';
import ReviewStep from '@/features/events/components/CreateEvent/ReviewStep';
import LivePreview from '@/features/events/components/CreateEvent/LivePreview';

const STEPS = [
  'Basic', 'Time', 'Venue', 'Tickets', 'Details', 'Media', 'Organizer', 'Settings', 'Review'
];

export default function CreateEventPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<CreateEventData>(INITIAL_EVENT_DATA);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateFormData = (newData: Partial<CreateEventData>) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };

  const handleNext = () => {
    setActiveStep(prev => Math.min(prev + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setActiveStep(prev => Math.max(prev - 1, 0));
  };

  // JSON Upload Handler
  const handleJsonUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsPublishing(true);
      const parsedData = await eventService.parseEventJson(file);
      await eventService.publishEvent(parsedData, user.uid);
      navigate('/organizer/events', { state: { success: 'Event imported successfully!' } });
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message || 'Failed to import JSON');
      } else {
        setError('Failed to import JSON');
      }
    } finally {
      setIsPublishing(false);
    }
  };

  // Publish Handler
  const handlePublish = async () => {
    if (!user) return;
    setIsPublishing(true);
    setError(null);
    try {
      await eventService.publishEvent(formData, user.uid);
      navigate('/organizer/events', { state: { success: 'Event published!' } });
    } catch (error) {
      setError('Failed to publish. Please check your connection.');
    } finally {
      setIsPublishing(false);
    }
  };

  const renderStep = () => {
    const props = { data: formData, onUpdate: updateFormData, onNext: handleNext, onPrev: handleBack };

    switch (activeStep) {
      case 0: return <BasicInfoStep {...props} />;
      case 1: return <DateStep {...props} />;
      case 2: return <VenueStep {...props} />;
      case 3: return <TicketsStep {...props} />;
      case 4: return <DetailsStep {...props} />;
      case 5: return <MediaStep {...props} />;
      case 6: return <OrganizerStep {...props} />;
      case 7: return <SettingsStep {...props} />;
      case 8: return <ReviewStep {...props} onSubmit={handlePublish} isSubmitting={isPublishing} />;
      default: return null;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4, minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} className="text-gradient">
            Create Event
          </Typography>
          <Typography color="text.secondary">
            Step {activeStep + 1} of {STEPS.length}: {STEPS[activeStep]}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button component="label" variant="outlined" startIcon={<Upload size={18} />} disabled={isPublishing}>
            Import JSON
            <input type="file" hidden accept=".json" onChange={handleJsonUpload} />
          </Button>
          <Button variant="outlined" startIcon={<Save size={18} />} onClick={() => console.log('Draft saved')}>
            Save Draft
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

      <Grid container spacing={4}>
        {/* Main Form Area */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4, display: { xs: 'none', md: 'flex' } }}>
            {STEPS.map((label) => (
              <Step key={label}><StepLabel>{label}</StepLabel></Step>
            ))}
          </Stepper>

          <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, border: '1px solid', borderColor: 'divider', borderRadius: 3, minHeight: 600 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {/* Global Nav Buttons (for steps that don't have their own) */}
            <Box sx={{ mt: 6, display: 'flex', justifyContent: 'space-between' }}>
              <Button disabled={activeStep === 0} onClick={handleBack} startIcon={<ChevronLeft />}>
                Back
              </Button>
              {activeStep !== STEPS.length - 1 && (
                <Button variant="contained" onClick={handleNext} endIcon={<ChevronRight />} className="btn-glow">
                  Next Step
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Live Preview Panel */}
        <Grid size={{ xs: 12, lg: 4 }} sx={{ display: { xs: 'none', lg: 'block' } }}>
          <LivePreview data={formData} />
        </Grid>
      </Grid>
    </Container>
  );
}