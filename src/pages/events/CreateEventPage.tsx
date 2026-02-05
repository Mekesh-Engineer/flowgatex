import { Container, Typography, Box, Stepper, Step, StepLabel } from '@mui/material';
import { useCreateEvent } from '@/features/events/hooks/useCreateEvent';
import BasicInfoStep from '@/features/events/components/CreateEvent/BasicInfoStep';
import VenueStep from '@/features/events/components/CreateEvent/VenueStep';
import TicketsStep from '@/features/events/components/CreateEvent/TicketsStep';
import ReviewStep from '@/features/events/components/CreateEvent/ReviewStep';

function CreateEventPage() {
  const {
    currentStep,
    steps,
    formData,
    nextStep,
    prevStep,
    updateFormData,
    submitEvent,
    isSubmitting,
  } = useCreateEvent();

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <BasicInfoStep data={formData} onUpdate={updateFormData} onNext={nextStep} />;
      case 1:
        return (
          <VenueStep data={formData} onUpdate={updateFormData} onNext={nextStep} onPrev={prevStep} />
        );
      case 2:
        return (
          <TicketsStep
            data={formData}
            onUpdate={updateFormData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 3:
        return (
          <ReviewStep
            data={formData}
            onPrev={prevStep}
            onSubmit={submitEvent}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h3" sx={{ fontWeight: 700, mb: 4 }}>
        Create Event
      </Typography>

      <Box sx={{ mb: 6 }}>
        <Stepper activeStep={currentStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <Box
        sx={{
          p: 4,
          borderRadius: 4,
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {renderStep()}
      </Box>
    </Container>
  );
}

export default CreateEventPage;
