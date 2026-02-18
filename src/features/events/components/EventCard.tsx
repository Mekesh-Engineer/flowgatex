import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Star, Ticket, Clock, Heart } from 'lucide-react';
import type { EventItem } from './events-page/types';

interface EventCardProps {
  event: EventItem;
}

function EventCard({ event }: EventCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);

  // Format price
  const formattedPrice = event.price === 0
    ? 'Free'
    : new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: event.currency || 'INR',
      maximumFractionDigits: 0
    }).format(event.price);

  // Compute capacity ratio
  const capacityRatio = event.capacity > 0 ? event.attendees / event.capacity : 0;
  const isSoldOut = event.capacity > 0 && event.attendees >= event.capacity;

  return (
    <>
      <div className="group relative flex flex-col bg-[var(--bg-card)] rounded-2xl border border-[var(--border-primary)] overflow-hidden hover:shadow-2xl hover:border-[var(--color-primary)]/50 hover:scale-[1.02] transition-all duration-300 h-full">
        {/* Sold Out Overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center rounded-2xl">
            <span className="bg-red-600 text-white text-sm font-black px-6 py-2 rounded-xl tracking-wider uppercase shadow-lg">
              Sold Out
            </span>
          </div>
        )}

        {/* Image Section */}
        <div className="relative h-48 overflow-hidden shrink-0">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {event.featured && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-lg backdrop-blur-sm">
                <Star size={10} fill="currentColor" /> Featured
              </span>
            )}
          </div>

          {/* Favorite Heart Icon */}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsFavorited(!isFavorited); }}
            className="absolute top-3 right-12 p-1.5 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 transition-all z-10"
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              size={16}
              className={isFavorited ? 'text-red-500 fill-red-500' : 'text-white'}
            />
          </button>

          <span className="absolute top-3 right-3 bg-white/90 dark:bg-black/60 backdrop-blur-md text-xs font-bold px-2.5 py-1 rounded-lg text-[var(--text-primary)] capitalize shadow-sm border border-white/20">
            {event.category}
          </span>

          {/* Floating Date/Time on Image */}
          <div className="absolute bottom-3 left-3 text-white">
            <p className="font-bold text-lg leading-tight drop-shadow-md">{event.date}</p>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5 flex flex-col gap-3 flex-grow">
          <Link to={`/events/${event.id}`} className="group/title">
            <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover/title:text-[var(--color-primary)] transition-colors line-clamp-1" title={event.title}>
              {event.title}
            </h3>
          </Link>

          {/* Meta Info */}
          <div className="flex flex-col gap-2 text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-[var(--color-primary)] shrink-0" />
              <span className="truncate">{event.city || event.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-[var(--color-primary)] shrink-0" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={14} className="text-[var(--color-primary)] shrink-0" />
              <span>{event.attendees} attending</span>
            </div>
          </div>

          {/* Capacity Progress Bar */}
          {event.capacity > 0 && (
            <div className="mt-1">
              <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] mb-1">
                <span>{event.attendees}/{event.capacity} booked</span>
                {event.capacity - event.attendees <= 20 && event.capacity - event.attendees > 0 && (
                  <span className="text-amber-500 font-bold">Filling Fast!</span>
                )}
              </div>
              <div className="w-full h-1.5 bg-[var(--bg-surface)] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${capacityRatio >= 0.9 ? 'bg-red-500' : capacityRatio >= 0.7 ? 'bg-amber-500' : 'bg-[var(--color-primary)]'
                    }`}
                  style={{ width: `${Math.min(capacityRatio * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="my-auto pt-4 border-t border-[var(--border-primary)] border-dashed opacity-50" />

          {/* Footer: Price + Actions */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">Starting from</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{formattedPrice}</p>
            </div>
          </div>

          {/* Buttons Grid */}
          <div className="grid grid-cols-2 gap-3 mt-1">
            <Link
              to={`/events/${event.id}`}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[var(--border-primary)] text-[var(--text-primary)] text-sm font-semibold hover:bg-[var(--bg-surface)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all"
            >
              View Details
            </Link>

            <Link
              to={`/events/${event.id}`}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white text-sm font-bold shadow-lg hover:shadow-xl hover:translate-y-[-1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Ticket size={16} />
              Book Now
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default EventCard;
