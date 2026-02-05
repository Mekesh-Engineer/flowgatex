import { useParams } from 'react-router-dom';
import EventDetails from '@/features/events/components/EventDetails';
import { useEventDetails } from '@/features/events/hooks/useEventDetails';

function EventDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading } = useEventDetails(id || '');

  return <EventDetails event={event} isLoading={isLoading} />;
}

export default EventDetailsPage;
