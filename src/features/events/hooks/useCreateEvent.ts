import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '@/features/auth/hooks/useAuth';
import { eventService } from '../services/eventService';
import { INITIAL_EVENT_DATA } from '../types/event.types';
import type { CreateEventData } from '../types/event.types';

/**
 * Convenience hook encapsulating the multi-step create-event flow.
 * Manages step navigation, form state, and submission.
 */
export function useCreateEvent() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const STEPS = ['Basic', 'Time', 'Venue', 'Tickets', 'Details', 'Media', 'Organizer', 'Settings', 'Review'];

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<CreateEventData>(INITIAL_EVENT_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const updateFormData = (data: Partial<CreateEventData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const submitEvent = async () => {
    if (!user) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await eventService.publishEvent(formData, user.uid);
      navigate('/organizer/events', { state: { success: 'Event published!' } });
    } catch (err: any) {
      setError(err.message || 'Failed to publish event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveDraft = async () => {
    if (!user) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await eventService.saveDraft(formData, user.uid);
      navigate('/organizer/events', { state: { success: 'Draft saved!' } });
    } catch (err: any) {
      setError(err.message || 'Failed to save draft');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    currentStep,
    steps: STEPS,
    formData,
    nextStep,
    prevStep,
    updateFormData,
    submitEvent,
    saveDraft,
    isSubmitting,
    error,
    setError,
  };
}

export default useCreateEvent;
