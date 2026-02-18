import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket,
  Calendar as CalendarIcon,
  CreditCard,
  Heart,
  Search,
  Wallet,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Clock,
  MoreVertical,
  TrendingUp,
  Bell,
  ChevronRight,
  Zap,
  Shield,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/store/zustand/stores';
import { getUserBookings } from '@/features/booking/services/bookingService';
import { eventService } from '@/features/events/services/eventService';
import { useEvents } from '@/features/events/hooks/useEvents';
import { toEventItems } from '@/features/events/utils/eventMapper';
import { fadeInUp, staggerContainer, FloatingElement } from '@/features/home/components/ui/SharedComponents';
import { GridCanvas, ParticleCanvas } from '@/features/home/components/canvas/CanvasEffects';

// Ensure styles are loaded
import '@/styles/features/userdashboard.css';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface StatItem {
  id: number;
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: any;
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'info';
  color: string;
}

interface DashboardEvent {
  id: string;
  title: string;
  category: string;
  date: string;
  time: string;
  location: string;
  image: string;
  price: string;
  rating?: number;
  attendees?: number;
  isBooked?: boolean;
}

interface BookingTableItem {
  id: string;
  event: string;
  date: string;
  amount: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled';
  image: string;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

const MetricCard = ({ stat }: { stat: StatItem }) => (
  <motion.div
    variants={fadeInUp}
    whileHover={{ y: -5 }}
    className={`metric-card metric-card-${stat.variant} relative overflow-hidden group`}
  >
    {/* Background Pattern */}
    <div className="absolute top-0 right-0 p-4 opacity-5 transform group-hover:scale-110 transition-transform duration-500">
      <stat.icon size={80} />
    </div>

    <div className="metric-card-header relative z-10">
      <div className={`metric-card-icon shadow-lg shadow-${stat.variant}/20`}>
        <stat.icon size={22} />
      </div>
      <span className={cn(
        "metric-card-trend px-2 py-0.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/10",
        stat.trendUp ? "text-green-500" : "text-red-500"
      )}>
        {stat.trendUp ? <TrendingUp size={12} /> : <Activity size={12} />}
        {stat.trend}
      </span>
    </div>

    <div className="relative z-10 mt-4">
      <h3 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
        {stat.value}
      </h3>
      <p className="metric-card-label mt-1 text-[var(--text-secondary)] font-medium">
        {stat.label}
      </p>
    </div>

    {/* Hover Glow Effect */}
    <div
      className="absolute -inset-0.5 blur opacity-0 group-hover:opacity-20 transition duration-500"
      style={{ background: `linear-gradient(to right, ${stat.color}, transparent)` }}
    />
  </motion.div>
);

const EventCard = ({ event, isBooked = false }: { event: DashboardEvent, isBooked?: boolean }) => (
  <motion.div
    variants={fadeInUp}
    whileHover={{ y: -8 }}
    className="group relative flex flex-col h-full min-w-[280px] md:min-w-[320px] rounded-2xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[var(--color-primary)] transition-all duration-300 shadow-lg hover:shadow-[var(--shadow-lg)] cursor-pointer snap-center"
  >
    <div className="relative h-48 overflow-hidden shrink-0">
      <img
        src={event.image}
        alt={event.title}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent opacity-80" />

      <div className="absolute top-3 left-3 flex gap-2">
        <span className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-bold border border-white/20 shadow-lg">
          {event.category}
        </span>
        {isBooked && (
          <span className="px-2.5 py-1 rounded-full bg-green-500 text-white text-xs font-bold shadow-lg flex items-center gap-1">
            <Ticket size={12} /> Booked
          </span>
        )}
      </div>

      <button className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-red-500 transition-all transform hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100">
        <Heart size={16} />
      </button>
    </div>

    <div className="p-5 flex flex-col flex-grow relative">
      <div className="flex justify-between items-start mb-2 text-xs font-medium text-[var(--text-muted)]">
        <span className="flex items-center gap-1.5">
          <CalendarIcon size={14} className="text-[var(--color-primary)]" />
          {event.date}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={14} className="text-[var(--color-secondary)]" />
          {event.time}
        </span>
      </div>

      <h4 className="text-lg font-bold text-[var(--text-primary)] mb-2 group-hover:text-[var(--color-primary)] transition-colors line-clamp-1">
        {event.title}
      </h4>

      <div className="text-sm text-[var(--text-secondary)] flex items-center gap-2 mb-4">
        <MapPin size={14} className="shrink-0" />
        <span className="truncate">{event.location}</span>
      </div>

      <div className="mt-auto pt-4 border-t border-[var(--border-primary)] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Price</p>
            <p className="text-lg font-bold text-[var(--text-primary)]">{event.price}</p>
          </div>
          {isBooked && (
            <button className="btn btn-sm btn-secondary gap-1 group-hover:translate-x-1 transition-transform">
              View Ticket <ArrowRight size={14} />
            </button>
          )}
        </div>

        {!isBooked && (
          <div className="grid grid-cols-2 gap-2 w-full mt-1">
            <Link
              to={`/events/${event.id}`}
              className="btn btn-sm btn-outline border-[var(--border-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] w-full justify-center"
            >
              Details
            </Link>
            <Link
              to={`/booking/${event.id}`}
              className="btn btn-sm btn-primary shadow-md shadow-primary/20 w-full justify-center"
            >
              Book
            </Link>
          </div>
        )}
      </div>
    </div>
  </motion.div>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function UserDashboard() {
  const { user } = useAuthStore();
  const [bookingsData, setBookingsData] = useState<{
    stats: StatItem[];
    activeBookings: DashboardEvent[];
    recentBookings: BookingTableItem[];
  } | null>(null);

  const [loading, setLoading] = useState(true);

  // Fetch Recommended Events
  const { data: recommendedEventsRaw } = useEvents(8);
  const recommendedEvents = toEventItems(recommendedEventsRaw || []);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const bookings = await getUserBookings(user.uid);

        // Process Bookings
        const bookingsWithEventData = await Promise.all(bookings.slice(0, 10).map(async (b) => {
          try {
            const event = await eventService.getEventById(b.eventId);
            return { ...b, eventDetails: event };
          } catch {
            return { ...b, eventDetails: null };
          }
        }));

        const totalSpent = bookings.reduce((sum, b) => sum + (b.finalAmount || 0), 0);
        const upcomingBookings = bookings.filter(b => {
          const date = new Date(b.eventDate);
          return !isNaN(date.getTime()) && date > new Date();
        });

        const stats: StatItem[] = [
          {
            id: 1,
            label: 'Bookings',
            value: bookings.length.toString(),
            trend: '+12%',
            trendUp: true,
            icon: Ticket,
            variant: 'primary',
            color: '#00A3DB'
          },
          {
            id: 2,
            label: 'Upcoming',
            value: upcomingBookings.length.toString(),
            trend: 'Next: 2d',
            trendUp: true,
            icon: CalendarIcon,
            variant: 'secondary',
            color: '#A3D639'
          },
          {
            id: 3,
            label: 'Wallet',
            value: formatCurrency(2450), // Mock wallet
            trend: '+5%',
            trendUp: true,
            icon: Wallet,
            variant: 'info',
            color: '#3B82F6'
          },
          {
            id: 4,
            label: 'Spent',
            value: formatCurrency(totalSpent),
            trend: 'Last 30d',
            trendUp: false,
            icon: CreditCard,
            variant: 'warning',
            color: '#F59E0B'
          },
        ];

        const activeBookingsUI: DashboardEvent[] = upcomingBookings.map(b => {
          const detail = bookingsWithEventData.find(ebd => ebd.id === b.id)?.eventDetails;
          const d = new Date(b.eventDate);
          return {
            id: b.eventId,
            title: b.eventTitle,
            category: detail?.category || 'Event',
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            location: detail?.venue?.city || 'Online',
            image: detail?.coverImage || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80',
            price: formatCurrency(b.finalAmount),
            isBooked: true
          };
        });

        const recentBookingsUI: BookingTableItem[] = bookingsWithEventData.slice(0, 5).map(b => {
          let dateStr = 'Unknown';
          if (b.bookingDate) {
            if (typeof b.bookingDate === 'string') {
              dateStr = new Date(b.bookingDate).toLocaleDateString();
            } else if (typeof b.bookingDate === 'object' && 'seconds' in b.bookingDate) {
              dateStr = new Date((b.bookingDate as any).seconds * 1000).toLocaleDateString();
            }
          }

          return {
            id: b.id,
            event: b.eventTitle,
            date: dateStr,
            amount: formatCurrency(b.finalAmount),
            status: (b.status.charAt(0).toUpperCase() + b.status.slice(1)) as any,
            image: b.eventDetails?.coverImage || 'https://images.unsplash.com/photo-1540575467063-178a509371f7?auto=format&fit=crop&q=80&w=100'
          };
        });

        setBookingsData({
          stats,
          activeBookings: activeBookingsUI,
          recentBookings: recentBookingsUI
        });

      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const scrollContainer = (id: string, direction: 'left' | 'right') => {
    const container = document.getElementById(id);
    if (container) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] relative overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <GridCanvas />
        <ParticleCanvas />
      </div>

    <motion.div
      className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 relative z-10"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-col xl:flex-row gap-8">

        {/* ─── Left Main Content Area ─── */}
        <div className="flex-1 flex flex-col gap-8 min-w-0">

          {/* ─── Hero Section ─── */}
          <motion.div variants={fadeInUp} className="relative rounded-3xl overflow-hidden min-h-[280px] flex items-center shadow-2xl group text-left">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-transparent" />

            <div className="absolute inset-0 opacity-20"><GridCanvas /></div>
            <div className="absolute inset-0 opacity-30"><ParticleCanvas /></div>

            <div className="relative z-10 p-8 md:p-12 w-full max-w-3xl">
              <FloatingElement duration={4}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/30 backdrop-blur-md mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-primary)]"></span>
                  </span>
                  <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider">Attendee Access</span>
                </div>
              </FloatingElement>

              <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4">
                Welcome back, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]">
                  {user?.displayName || 'Guest'}
                </span>
              </h1>

              <p className="text-gray-300 text-lg mb-8 max-w-lg leading-relaxed">
                Discover the best events happening around you. You have <strong className="text-white font-medium">{bookingsData?.activeBookings.length} upcoming events</strong> on your schedule.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link to="/events" className="btn btn-primary rounded-xl px-6 py-3 shadow-lg shadow-[var(--color-primary)]/25 font-bold hover:scale-105 transition-transform">
                  Explore Events
                </Link>
                <button className="btn btn-outline border-white/20 text-white hover:bg-white/10 rounded-xl px-6 py-3 backdrop-blur-sm font-bold">
                  View My Tickets
                </button>
              </div>
            </div>
          </motion.div>

          {/* ─── Stats Grid ─── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {bookingsData?.stats.map(stat => (
              <MetricCard key={stat.id} stat={stat} />
            ))}
          </div>

          {/* ─── My Agenda (Booked Events) ─── */}
          {bookingsData?.activeBookings.length ? (
            <motion.section variants={fadeInUp} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)]">My Agenda</h2>
                  <p className="text-[var(--text-secondary)] text-sm">Your confirmed upcoming events</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => scrollContainer('agenda-scroll', 'left')} className="p-2 rounded-full hover:bg-[var(--bg-secondary)] border border-[var(--border-primary)] transition-colors">
                    <ArrowLeft size={18} />
                  </button>
                  <button onClick={() => scrollContainer('agenda-scroll', 'right')} className="p-2 rounded-full hover:bg-[var(--bg-secondary)] border border-[var(--border-primary)] transition-colors">
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>

              <div id="agenda-scroll" className="flex gap-6 overflow-x-auto pb-6 px-1 -mx-1 scrollbar-hide snap-x">
                {bookingsData.activeBookings.map(event => (
                  <EventCard key={event.id} event={event} isBooked={true} />
                ))}
              </div>
            </motion.section>
          ) : null}

          {/* ─── Recommended For You ─── */}
          <motion.section variants={fadeInUp} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                  Recommended For You <Zap className="text-yellow-400 fill-yellow-400" size={20} />
                </h2>
                <p className="text-[var(--text-secondary)] text-sm">Curated events based on your interests</p>
              </div>
              <Link to="/events" className="text-[var(--color-primary)] text-sm font-bold hover:underline flex items-center gap-1">
                View All <ChevronRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedEvents.slice(0, 6).map(event => (
                <EventCard
                  key={event.id}
                  event={{
                    id: event.id,
                    title: event.title,
                    category: event.category,
                    date: event.date,
                    time: event.time,
                    location: event.venue,
                    image: event.image,
                    price: formatCurrency(event.price),
                  }}
                />
              ))}
            </div>
          </motion.section>

          {/* ─── Recent Activity Table ─── */}
          <motion.section variants={fadeInUp} className="card overflow-hidden border-[var(--border-primary)]">
            <div className="p-6 border-b border-[var(--border-primary)] flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Recent Activity</h3>
                <p className="text-sm text-[var(--text-secondary)]">Your latest transactions and bookings</p>
              </div>
              <button className="btn btn-sm btn-ghost">View All History</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4">Event</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 hidden sm:table-cell">Order ID</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-primary)]">
                  {bookingsData?.recentBookings.map(booking => (
                    <tr key={booking.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={booking.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          <span className="font-semibold text-[var(--text-primary)]">{booking.event}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[var(--text-muted)] font-medium">{booking.date}</td>
                      <td className="px-6 py-4 text-xs font-mono text-[var(--text-muted)] hidden sm:table-cell">{booking.id.substring(0, 8)}</td>
                      <td className="px-6 py-4 font-bold text-[var(--text-primary)]">{booking.amount}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-bold",
                          booking.status === 'Confirmed' ? "bg-green-500/10 text-green-500" :
                            booking.status === 'Cancelled' ? "bg-red-500/10 text-red-500" : "bg-yellow-500/10 text-yellow-500"
                        )}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-full hover:bg-[var(--bg-tertiary)] transition-colors">
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!bookingsData?.recentBookings.length && (
                <div className="text-center py-12 text-[var(--text-muted)]">No recent activity found.</div>
              )}
            </div>
          </motion.section>

        </div>

        {/* ─── Right Sidebar ─── */}
        <motion.aside variants={fadeInUp} className="hidden xl:flex w-80 flex-col gap-6">
          <div className="sticky top-24 space-y-6">

            {/* User Profile Summary */}
            <div className="card p-6 flex flex-col items-center text-center">
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-secondary)] p-1 mb-4">
                <img
                  src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || 'User'}&background=random`}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover border-4 border-[var(--bg-card)]"
                />
                <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-[var(--bg-card)] rounded-full"></div>
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">{user?.displayName || 'User'}</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">{user?.email}</p>
              <div className="flex gap-2 w-full">
                <button className="btn btn-sm btn-outline flex-1 rounded-lg">Edit Profile</button>
                <button className="btn btn-sm btn-ghost p-2 rounded-lg border border-[var(--border-primary)]"><Shield size={16} /></button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card p-5">
              <h3 className="font-bold text-[var(--text-primary)] mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: 'Browse Events', icon: Search, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                  { label: 'My Tickets', icon: Ticket, color: 'text-green-500', bg: 'bg-green-500/10' },
                  { label: 'Wallet', icon: Wallet, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                ].map((action, i) => (
                  <button key={i} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors text-left group">
                    <div className={`p-2.5 rounded-lg ${action.bg} ${action.color} group-hover:scale-110 transition-transform`}>
                      <action.icon size={18} />
                    </div>
                    <span className="font-medium text-[var(--text-primary)]">{action.label}</span>
                    <ChevronRight size={16} className="ml-auto text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Widget */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#00A3DB] to-[#0082b0] p-6 text-white shadow-lg">
              <Bell size={24} className="mb-4" />
              <h4 className="font-bold text-lg mb-1">Enable Notifications</h4>
              <p className="text-sm text-white/80 mb-4">Get updates on your favorite events and ticket status.</p>
              <button className="w-full py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-sm font-bold transition-colors">
                Turn On
              </button>
            </div>

          </div>
        </motion.aside>

      </div>
    </motion.div>
    </div>
  );
}

// =============================================================================
// LOADING SKELETON
// =============================================================================

function DashboardSkeleton() {
  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto flex gap-8">
      <div className="flex-1 flex flex-col gap-8">
        <div className="skeleton w-full h-[300px] rounded-3xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-36 rounded-2xl" />)}
        </div>
        <div className="skeleton h-80 rounded-2xl" />
      </div>
      <div className="hidden xl:block w-80 space-y-6">
        <div className="skeleton h-64 rounded-2xl" />
        <div className="skeleton h-48 rounded-2xl" />
      </div>
    </div>
  );
}