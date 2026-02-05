import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateEvent as useCreateEventMutation } from './useEvents';
import { useAppSelector } from '@/store/redux/hooks';
import type { CreateEventData } from '../types/event.types';

export function useCreateEvent() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const createEventMutation = useCreateEventMutation();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<CreateEventData>>({});

  const steps = ['Basic Info', 'Venue', 'Tickets', 'Review'];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (data: Partial<CreateEventData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const submitEvent = async () => {
    if (!user) return;

    await createEventMutation.mutateAsync({
      ...(formData as CreateEventData),
      organizerId: user.uid,
      organizerName: user.displayName || 'Unknown Organizer',
    });

    navigate('/organizer/events');
  };

  return {
    currentStep,
    steps,
    formData,
    nextStep,
    prevStep,
    updateFormData,
    submitEvent,
    isSubmitting: createEventMutation.isPending,
  };
}

export default useCreateEvent;
