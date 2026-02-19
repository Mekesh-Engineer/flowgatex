/**
 * EventGrid — Renders a responsive grid/list of EventCards with:
 *   • Animated loading skeletons
 *   • Empty-state illustration
 *   • Optional "Load More" pagination
 *   • Grid + List layout support
 *
 * Uses EventItem type from the events-page module.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Frown, ArrowDown } from 'lucide-react';
import EventCard from './EventCard';
import type { EventItem } from './events-page/types';

// ── Animation variants ──────────────────────────────────────────────
const cardVariant = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
};

// ── Props ────────────────────────────────────────────────────────────
interface EventGridProps {
  events: EventItem[];
  isLoading?: boolean;
  emptyMessage?: string;
  /** 'grid' (default) or 'list' layout */
  viewMode?: 'grid' | 'list';
  /** Total available items (for "Load More" logic). */
  totalCount?: number;
  /** Whether more items are being loaded. */
  isLoadingMore?: boolean;
  /** Callback to load more items. */
  onLoadMore?: () => void;
  /** Callback when "Clear Filters" is clicked on empty state. */
  onClearFilters?: () => void;
}

// ── Skeleton ─────────────────────────────────────────────────────────
function SkeletonCard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.08 }}
      className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-primary)] overflow-hidden"
    >
      <div className="h-48 bg-[var(--bg-surface)] animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-[var(--bg-surface)] rounded-lg w-3/4 animate-pulse" />
        <div className="h-3 bg-[var(--bg-surface)] rounded-lg w-1/2 animate-pulse" />
        <div className="h-3 bg-[var(--bg-surface)] rounded-lg w-2/3 animate-pulse" />
        <div className="flex justify-between items-center mt-4">
          <div className="h-8 bg-[var(--bg-surface)] rounded-lg w-20 animate-pulse" />
          <div className="h-8 bg-[var(--bg-surface)] rounded-lg w-24 animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
}

// ── Component ────────────────────────────────────────────────────────
export default function EventGrid({
  events,
  isLoading = false,
  emptyMessage = 'No events found',
  viewMode = 'grid',
  totalCount,
  isLoadingMore = false,
  onLoadMore,
  onClearFilters,
}: EventGridProps) {
  // ── Loading state ──
  if (isLoading) {
    return (
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6'
            : 'flex flex-col gap-4 sm:gap-5'
        }
      >
        {[...Array(6)].map((_, i) => (
          <SkeletonCard key={i} index={i} />
        ))}
      </div>
    );
  }

  // ── Empty state ──
  if (events.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center py-20 px-6 text-center bg-[var(--bg-card)] rounded-2xl border border-[var(--border-primary)]"
      >
        <div className="size-16 rounded-full bg-[var(--bg-surface)] flex items-center justify-center mb-5">
          <Frown size={28} className="text-[var(--text-muted)]" />
        </div>
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
          {emptyMessage}
        </h3>
        <p className="text-sm text-[var(--text-muted)] mb-6 max-w-sm">
          Try adjusting your filters or search query to discover more events.
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-cyan-500 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
          >
            Clear All Filters
          </button>
        )}
      </motion.div>
    );
  }

  // ── Events grid / list ──
  const hasMore = totalCount !== undefined && events.length < totalCount;

  return (
    <>
      <motion.div
        layout
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6'
            : 'flex flex-col gap-4 sm:gap-5'
        }
      >
        <AnimatePresence mode="popLayout">
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              custom={i}
              variants={cardVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout
            >
              <EventCard event={event} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Load More */}
      {hasMore && onLoadMore && (
        <div className="flex justify-center mt-10">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="group flex items-center gap-2 px-8 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] text-[var(--text-primary)] font-semibold text-sm hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all disabled:opacity-50 disabled:cursor-wait"
          >
            {isLoadingMore ? (
              <>
                <div className="size-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ArrowDown size={16} className="group-hover:translate-y-0.5 transition-transform" />
                Load More Events
              </>
            )}
          </button>
        </div>
      )}

      {/* Result count */}
      <p className="text-center text-xs text-[var(--text-muted)] mt-4">
        Showing {events.length}
        {totalCount !== undefined ? ` of ${totalCount}` : ''} event
        {events.length !== 1 ? 's' : ''}
      </p>
    </>
  );
}
