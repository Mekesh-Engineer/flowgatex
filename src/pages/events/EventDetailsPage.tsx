import { useParams } from 'react-router-dom';
import EventDetails from '@/features/events/components/EventDetails';
import { useEventDetails } from '@/features/events/hooks/useEventDetails';

function EventDetailsPage() {
  const { id } = useParams<{ id: string }>();
  // Ensure we pass the ID string safely; hook handles undefined/null logic
  const { data: event, isLoading } = useEventDetails(id || '');

  return <EventDetails event={event} isLoading={isLoading} />;
}

export default EventDetailsPage;