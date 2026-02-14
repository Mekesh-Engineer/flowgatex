// =============================================================================
// CALENDAR MODAL — Monthly calendar view with 24-hour format event display
// Uses CSS classes from calendar.css for consistent styling
// =============================================================================

import { useState, useMemo, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Clock, MapPin } from 'lucide-react';

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
}

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  events = [],
  title = 'Event Calendar',
}: CalendarModalProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

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

  // Navigate months
  const goToPreviousMonth = useCallback(() => {
    setCurrentDate(new Date(year, month - 1, 1));
  }, [year, month]);

  const goToNextMonth = useCallback(() => {
    setCurrentDate(new Date(year, month + 1, 1));
  }, [year, month]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
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
    <div className="calendar-overlay" role="dialog" aria-modal="true" aria-labelledby="calendar-title">
      {/* Backdrop */}
      <div className="calendar-backdrop" onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div className="calendar-modal-container">
        {/* Header */}
        <header className="calendar-header">
          <h2 id="calendar-title" className="calendar-title">{title}</h2>

          <nav className="calendar-nav" aria-label="Calendar navigation">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="calendar-nav-btn"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="calendar-month-display" aria-live="polite">
              {MONTHS[month]} {year}
            </span>

            <button
              type="button"
              onClick={goToNextMonth}
              className="calendar-nav-btn"
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>

            <button
              type="button"
              onClick={goToToday}
              className="calendar-today-btn"
            >
              Today
            </button>
          </nav>

          <button
            type="button"
            onClick={onClose}
            className="calendar-nav-btn"
            aria-label="Close calendar"
          >
            <X size={16} />
          </button>
        </header>

        {/* Scrollable Body */}
        <div className="calendar-body">
          {/* Calendar Grid */}
          <div className="calendar-grid" role="grid" aria-label="Calendar">
            {/* Weekday Headers */}
            {WEEKDAYS.map((day) => (
              <div key={day} className="calendar-weekday-header" role="columnheader">
                {day}
              </div>
            ))}

            {/* Day Cells */}
            {calendarDays.map(({ date, isCurrentMonth }, index) => {
              const dayEvents = getEventsForDate(date);

              return (
                <div
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  className={getDayClassName(date, isCurrentMonth)}
                  role="gridcell"
                  tabIndex={isCurrentMonth ? 0 : -1}
                  aria-label={`${formatDateForDisplay(date)}${dayEvents.length > 0 ? `, ${dayEvents.length} events` : ''}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedDate(date);
                    }
                  }}
                >
                  <span className="calendar-day-number">{date.getDate()}</span>

                  {/* Events Preview */}
                  <div className="calendar-events">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className={getEventClassName(event.type)}
                      >
                        <span className="calendar-event-time">{event.startTime}</span>
                        <span className="calendar-event-title">{event.title}</span>
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="calendar-more-events">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Date Details */}
          {selectedDate && (
            <div className="calendar-event-panel">
              <h3 className="calendar-event-panel-title">
                Events for {formatDateForDisplay(selectedDate)}
              </h3>
              
              {selectedDateEvents.length > 0 ? (
                <div className="calendar-event-list">
                  {selectedDateEvents.map((event) => (
                    <div key={event.id} className="calendar-event-item">
                      <div className={`calendar-event-dot ${event.type ? `is-${event.type}` : ''}`} />
                      <div className="calendar-event-info">
                        <div className="calendar-event-info-title">{event.title}</div>
                        <div className="calendar-event-info-time">
                          <Clock size={12} />
                          <span>{event.startTime} – {event.endTime}</span>
                          {event.location && (
                            <>
                              <span className="calendar-event-info-separator">•</span>
                              <MapPin size={12} />
                              <span>{event.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="calendar-no-events">No events scheduled for this day.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
