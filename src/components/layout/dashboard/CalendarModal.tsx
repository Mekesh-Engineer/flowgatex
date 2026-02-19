// =============================================================================
// CALENDAR MODAL — Monthly calendar view with 24-hour format event display
// Uses CSS classes from calendar.css for consistent styling
// =============================================================================

import { useState, useMemo, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Clock, MapPin, ExternalLink, Calendar as CalendarIcon } from 'lucide-react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';

// =============================================================================
// TYPES
// =============================================================================

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  startTime: string; // 24-hour format "HH:mm"
  endTime: string; // 24-hour format "HH:mm"
  type?: 'default' | 'success' | 'warning' | 'info';
  location?: string;
  // Enhanced properties
  organizer?: string;
  description?: string;
  coverImage?: string;
  venue?: {
    city?: string;
    state?: string;
  };
  endDate?: Date;
}

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  // External events not required anymore as we fetch internally, but kept for backward compatibility if needed
  events?: CalendarEvent[];
  title?: string;
}

// =============================================================================
// UTILITIES
// =============================================================================

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function CalendarModal({
  isOpen,
  onClose,
  events: propEvents = [],
  title = 'Event Calendar',
}: CalendarModalProps) {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [fetchedEvents, setFetchedEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Combine prop events with fetched events
  const events = useMemo(() => [...propEvents, ...fetchedEvents], [propEvents, fetchedEvents]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch events from Firebase
  useEffect(() => {
    if (!isOpen || !db) return; // Ensure db is initialized

    setLoading(true);

    // Calculate start and end of the current view (including buffer for prev/next month days)
    // For simplicity, we'll fetch a broad range or all. 
    // Given the prompt asks for "dynamic... from Firebase events collection", we'll try to query efficiently.
    // However, since `startDate` is a string in the DB (usually ISO), string comparison works.

    // Start of the month
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

    // Add buffer for the grid (approx start of first grid cell to end of last)
    const startGrid = new Date(startOfMonth);
    startGrid.setDate(startGrid.getDate() - 7);

    const endGrid = new Date(endOfMonth);
    endGrid.setDate(endGrid.getDate() + 14);

    const startIso = startGrid.toISOString();
    const endIso = endGrid.toISOString();

    // Query Firestore
    const q = query(
      collection(db, 'events'),
      where('startDate', '>=', startIso),
      where('startDate', '<=', endIso)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newEvents: CalendarEvent[] = snapshot.docs.map(doc => {
        const data = doc.data();

        // Parse date
        const startDate = data.startDate ? new Date(data.startDate) : new Date();
        const endDate = data.endDate ? new Date(data.endDate) : undefined;

        // Format time
        const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

        return {
          id: doc.id,
          title: data.title || 'Untitled Event',
          date: startDate,
          endDate: endDate,
          startTime: formatTime(startDate),
          endTime: endDate ? formatTime(endDate) : '—',
          type: 'info', // Default type
          location: data.venue?.city || data.locationType,
          venue: data.venue,
          organizer: data.organizer?.name,
          description: data.description,
          coverImage: data.coverImage
        };
      });

      setFetchedEvents(newEvents);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching calendar events:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, year, month]);

  // Navigate months
  const goToPreviousMonth = useCallback(() => {
    setCurrentDate(new Date(year, month - 1, 1));
  }, [year, month]);

  const goToNextMonth = useCallback(() => {
    setCurrentDate(new Date(year, month + 1, 1));
  }, [year, month]);

  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  }, []);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    const daysInPrevMonth = getDaysInMonth(year, month - 1);

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true,
      });
    }

    // Next month days (to fill remaining cells)
    const remainingCells = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingCells; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month]);

  // Get events for a specific date
  const getEventsForDate = useCallback(
    (date: Date) => events.filter((event) => isSameDay(event.date, date)),
    [events]
  );

  // Get events for selected date
  const selectedDateEvents = useMemo(
    () => (selectedDate ? getEventsForDate(selectedDate) : []),
    [selectedDate, getEventsForDate]
  );

  // Build CSS class string for day cells
  const getDayClassName = (date: Date, isCurrentMonth: boolean): string => {
    const classes = ['calendar-day'];

    if (!isCurrentMonth) classes.push('is-other-month');
    if (isToday(date)) classes.push('is-today');
    if (selectedDate && isSameDay(date, selectedDate)) classes.push('is-selected');

    return classes.join(' ');
  };

  // Build CSS class string for events
  const getEventClassName = (type?: string): string => {
    const classes = ['calendar-event'];
    if (type && type !== 'default') classes.push(`is-${type}`);
    return classes.join(' ');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="calendar-title">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div className="relative z-10 bg-[var(--bg-card)] max-w-6xl w-full h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-[var(--border-primary)] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <header className="p-4 sm:p-6 border-b border-[var(--border-primary)] flex flex-col sm:flex-row items-center justify-between gap-4 bg-[var(--bg-surface)] shrink-0">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <h2 id="calendar-title" className="text-xl sm:text-2xl font-black text-[var(--text-primary)] flex items-center gap-2">
              <CalendarIcon className="text-[var(--color-primary)]" size={24} />
              {title}
            </h2>
            {loading && <span className="text-xs font-medium text-[var(--text-muted)] animate-pulse bg-[var(--bg-base)] px-2 py-1 rounded-md border border-[var(--border-primary)]">Syncing...</span>}
            {/* Close button for mobile */}
            <button
              type="button"
              onClick={onClose}
              className="sm:hidden p-2 hover:bg-red-500/10 hover:text-red-500 rounded-xl text-[var(--text-muted)] transition-colors"
              aria-label="Close calendar"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
            <nav className="flex items-center bg-[var(--bg-base)] rounded-xl border border-[var(--border-primary)] p-1" aria-label="Calendar navigation">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-secondary)] transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft size={18} />
              </button>

              <span className="px-2 sm:px-4 text-sm font-bold text-[var(--text-primary)] min-w-[120px] text-center" aria-live="polite">
                {MONTHS[month]} {year}
              </span>

              <button
                type="button"
                onClick={goToNextMonth}
                className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-secondary)] transition-colors"
                aria-label="Next month"
              >
                <ChevronRight size={18} />
              </button>
            </nav>

            <button
              type="button"
              onClick={goToToday}
              className="hidden sm:block px-4 py-2 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-xl text-sm font-bold hover:bg-[var(--color-primary)]/20 transition-colors"
            >
              Today
            </button>

            <button
              type="button"
              onClick={onClose}
              className="hidden sm:block ml-2 p-2 hover:bg-red-500/10 hover:text-red-500 rounded-xl text-[var(--text-muted)] transition-colors"
              aria-label="Close calendar"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Scrollable Body */}
        <div className="flex flex-col lg:flex-row h-full overflow-hidden">
          {/* Calendar Grid */}
          <div className="grow p-4 sm:p-6 overflow-y-auto w-full min-w-0" role="grid" aria-label="Calendar">

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 mb-2 gap-1 sm:gap-2 w-full">
              {WEEKDAYS.map((day) => (
                <div key={day} className="text-center text-[10px] sm:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider py-2 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-primary)]" role="columnheader">
                  {day}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 auto-rows-[minmax(80px,1fr)] sm:auto-rows-[minmax(100px,1fr)] w-full">
              {calendarDays.map(({ date, isCurrentMonth }, index) => {
                const dayEvents = getEventsForDate(date);
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const isTodayDate = isToday(date);

                return (
                  <div
                    key={index}
                    onClick={() => setSelectedDate(date)}
                    className={`
                      relative p-2 rounded-xl transition-all cursor-pointer border
                      ${!isCurrentMonth ? 'bg-[var(--bg-base)]/30 text-[var(--text-muted)] border-transparent' : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-primary)]'}
                      ${isSelected ? 'ring-2 ring-[var(--color-primary)] border-transparent z-10' : 'hover:border-[var(--color-primary)]/50'}
                      ${isTodayDate ? 'bg-[var(--color-primary)]/5 border-[var(--color-primary)]/30' : ''}
                    `}
                    role="gridcell"
                    tabIndex={isCurrentMonth ? 0 : -1}
                  >
                    <span className={`
                      text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1
                      ${isTodayDate ? 'bg-[var(--color-primary)] text-white' : ''}
                    `}>
                      {date.getDate()}
                    </span>

                    {/* Events Preview (Dots/Bars) */}
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className="text-[10px] truncate px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-primary)] text-[var(--text-secondary)] font-medium"
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[10px] text-[var(--text-muted)] pl-1">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Details Panel */}
          <div className="w-full lg:w-96 bg-[var(--bg-surface)] border-t lg:border-t-0 lg:border-l border-[var(--border-primary)] flex flex-col h-full shrink-0">
            {selectedDate ? (
              <div className="flex flex-col h-full">
                <div className="p-6 border-b border-[var(--border-primary)]">
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">
                    {formatDateForDisplay(selectedDate)}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    {selectedDateEvents.length} events scheduled
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {selectedDateEvents.length > 0 ? (
                    selectedDateEvents.map((event) => (
                      <div key={event.id} className="group p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[var(--color-primary)] hover:shadow-lg transition-all">
                        <div className="flex gap-4">
                          {/* Time */}
                          <div className="shrink-0 flex flex-col items-center">
                            <span className="text-sm font-black text-[var(--text-primary)]">{event.startTime}</span>
                            <div className="w-0.5 h-full bg-[var(--border-primary)] my-1"></div>
                          </div>

                          {/* Details */}
                          <div className="grow min-w-0">
                            <h4 className="font-bold text-[var(--text-primary)] line-clamp-2">{event.title}</h4>

                            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mt-2">
                              <MapPin size={12} className="shrink-0" />
                              <span className="truncate">{event.location || event.venue?.city || 'TBD'}</span>
                            </div>

                            {event.organizer && (
                              <div className="text-xs text-[var(--text-muted)] mt-1 truncate">
                                by {event.organizer}
                              </div>
                            )}

                            {event.description && (
                              <p className="text-xs text-[var(--text-muted)] mt-2 line-clamp-2" dangerouslySetInnerHTML={{ __html: event.description.replace(/<[^>]*>?/gm, '') }} />
                            )}

                            <button
                              onClick={() => navigate(`/events/${event.id}`)}
                              className="mt-3 text-xs font-bold text-[var(--color-primary)] flex items-center gap-1 hover:underline"
                            >
                              View Details <ExternalLink size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-center text-[var(--text-muted)] opacity-60">
                      <div className="p-3 bg-[var(--bg-base)] rounded-full mb-3">
                        <CalendarIcon size={24} />
                      </div>
                      <p>No events scheduled for this day.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] p-6 text-center">
                <p>Select a date to view events</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

