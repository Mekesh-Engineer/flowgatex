import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import type { LucideIcon } from 'lucide-react';
import {
  Ticket,
  Calendar as CalendarIcon,
  CreditCard,
  Heart,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Clock,
  MoreVertical,
  Search,
  Wallet,
  QrCode,
  TrendingUp,
  TrendingDown,
  Bell,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Button from '@/components/common/Button';
import { Card, CardContent } from '@/components/common/Card';

// Ensure this file exists in your project with the styles defined previously
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
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
}

interface EventItem {
  id: number;
  title: string;
  category: string;
  date: string;
  time: string;
  location: string;
  image: string;
  price: string;
}

interface BookingItem {
  id: string;
  event: string;
  date: string;
  amount: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled';
  image: string;
}

interface DashboardData {
  stats: StatItem[];
  upcomingEvents: EventItem[];
  recentBookings: BookingItem[];
}

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100, damping: 15 },
  },
};

// =============================================================================
// MOCK API SERVICE (Simulating Backend)
// =============================================================================

const fetchDashboardData = (): Promise<DashboardData> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        stats: [
          {
            id: 1,
            label: 'Total Bookings',
            value: '12',
            trend: '+12%',
            trendUp: true,
            icon: Ticket,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-500/10',
            border: 'border-blue-100 dark:border-blue-500/20',
          },
          {
            id: 2,
            label: 'Upcoming Events',
            value: '3',
            trend: '+2%',
            trendUp: true,
            icon: CalendarIcon,
            color: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-50 dark:bg-purple-500/10',
            border: 'border-purple-100 dark:border-purple-500/20',
          },
          {
            id: 3,
            label: 'Total Spent',
            value: '$450',
            trend: '+5%',
            trendUp: true,
            icon: CreditCard,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-500/10',
            border: 'border-emerald-100 dark:border-emerald-500/20',
          },
          {
            id: 4,
            label: 'Favorites',
            value: '8',
            trend: '-1%',
            trendUp: false,
            icon: Heart,
            color: 'text-pink-600 dark:text-pink-400',
            bg: 'bg-pink-50 dark:bg-pink-500/10',
            border: 'border-pink-100 dark:border-pink-500/20',
          },
        ],
        upcomingEvents: [
          {
            id: 1,
            title: 'Summer Jazz Festival',
            category: 'Music',
            date: 'Aug 12',
            time: '18:00',
            location: 'Central Park, NY',
            image:
              'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=800',
            price: '$120',
          },
          {
            id: 2,
            title: 'Global Tech Summit 2024',
            category: 'Technology',
            date: 'Sep 05',
            time: '09:00',
            location: 'Moscone Center, SF',
            image:
              'https://images.unsplash.com/photo-1540575467063-178a509371f7?auto=format&fit=crop&q=80&w=800',
            price: '$299',
          },
          {
            id: 3,
            title: 'Neon Night Run',
            category: 'Sports',
            date: 'Oct 15',
            time: '20:00',
            location: 'Downtown District',
            image:
              'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800',
            price: '$45',
          },
        ],
        recentBookings: [
          {
            id: 'ORD-7729',
            event: 'Summer Jazz Festival',
            date: 'Aug 12, 2024',
            amount: '$120.00',
            status: 'Confirmed',
            image:
              'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=100',
          },
          {
            id: 'ORD-8102',
            event: 'Global Tech Summit',
            date: 'Sep 05, 2024',
            amount: '$299.00',
            status: 'Pending',
            image:
              'https://images.unsplash.com/photo-1540575467063-178a509371f7?auto=format&fit=crop&q=80&w=100',
          },
          {
            id: 'ORD-6651',
            event: 'Design Systems Workshop',
            date: 'Jul 20, 2024',
            amount: '$45.00',
            status: 'Confirmed',
            image:
              'https://images.unsplash.com/photo-1591115765373-5207764f72e7?auto=format&fit=crop&q=80&w=100',
          },
        ],
      });
    }, 1200); // Simulate network delay
  });
};

const QUICK_ACTIONS = [
  { label: 'Find Events', icon: Search, color: 'text-blue-500' },
  { label: 'My Tickets', icon: Ticket, color: 'text-purple-500' },
  { label: 'Wallet', icon: Wallet, color: 'text-green-500' },
  { label: 'Scan Entry', icon: QrCode, color: 'text-orange-500' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export default function UserDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Dynamic Data Fetching Effect
  useEffect(() => {
    const loadData = async () => {
      try {
        const dashboardData = await fetchDashboardData();
        setData(dashboardData);
      } catch (error) {
        logger.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Scroll Handler for Events
  const scrollEvents = (direction: 'left' | 'right') => {
    const container = document.getElementById('events-container');
    if (container) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <motion.div
      className="flex flex-1 w-full gap-8 p-4 md:p-0"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ─── Left Main Content Area ─── */}
      <div className="flex-1 flex flex-col gap-8 min-w-0">
        {/* ─── Hero Section ─── */}
        <motion.section variants={itemVariants} className="@container">
          <div className="relative w-full rounded-2xl overflow-hidden min-h-[300px] flex flex-col justify-end p-8 shadow-2xl group transition-all duration-500 hover:shadow-primary-900/20">
            {/* Background Image with Gradient Overlay */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-1000 group-hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-900/95 via-purple-900/90 to-transparent mix-blend-multiply" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex flex-col gap-3 max-w-2xl">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 w-fit"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-xs font-medium text-white/90">Account Active</span>
                </motion.div>

                <h1 className="text-white text-3xl md:text-5xl font-black tracking-tight drop-shadow-lg leading-tight">
                  Welcome back, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 animate-gradient-x">
                    Alex!
                  </span>
                </h1>

                <p className="text-blue-50/80 text-base md:text-lg font-medium max-w-lg leading-relaxed">
                  Ready for your next adventure? You have{' '}
                  <span className="text-white font-bold underline decoration-purple-400 decoration-2 underline-offset-4">
                    {data?.upcomingEvents.length} upcoming events
                  </span>{' '}
                  scheduled for this month.
                </p>
              </div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="secondary"
                  className="bg-white text-violet-700 hover:bg-blue-50 border-none shadow-xl shadow-violet-900/20 font-bold px-8 py-4 rounded-xl h-auto text-base group/btn"
                >
                  <span>Explore Events</span>
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* ─── Stats Grid ─── */}
        <motion.section
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {data?.stats.map(stat => (
            <motion.div
              key={stat.id}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Card
                className={cn(
                  'border bg-white dark:bg-neutral-800 shadow-sm hover:shadow-md transition-all duration-300',
                  stat.border
                )}
              >
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className={cn('p-2.5 rounded-xl shadow-inner', stat.bg, stat.color)}>
                      <stat.icon size={22} strokeWidth={2.5} />
                    </div>
                    <div
                      className={cn(
                        'px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border',
                        stat.trendUp
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20'
                          : 'text-rose-700 bg-rose-50 border-rose-100 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20'
                      )}
                    >
                      {stat.trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {stat.trend}
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-neutral-400 text-sm font-medium tracking-wide">
                      {stat.label}
                    </p>
                    <p className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mt-1 tracking-tight">
                      {stat.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.section>

        {/* ─── Upcoming Events Carousel ─── */}
        <motion.section variants={itemVariants}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Ticket className="text-primary-600 size-5" />
                Upcoming Events
              </h3>
              <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
                Don't miss out on your scheduled activities
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => scrollEvents('left')}
                className="size-9 rounded-full border border-slate-200 dark:border-neutral-700 flex items-center justify-center hover:bg-white dark:hover:bg-neutral-800 hover:shadow-md transition-all text-slate-600 dark:text-neutral-300"
              >
                <ArrowLeft size={16} />
              </button>
              <button
                onClick={() => scrollEvents('right')}
                className="size-9 rounded-full border border-slate-200 dark:border-neutral-700 flex items-center justify-center hover:bg-white dark:hover:bg-neutral-800 hover:shadow-md transition-all text-slate-600 dark:text-neutral-300"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <div
            id="events-container"
            className="flex gap-6 overflow-x-auto pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide snap-x"
          >
            {data?.upcomingEvents.map(event => (
              <motion.div
                key={event.id}
                whileHover={{ scale: 1.02 }}
                className="min-w-[300px] md:min-w-[340px] snap-center bg-white dark:bg-neutral-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-neutral-700 shadow-sm hover:shadow-xl dark:hover:shadow-neutral-900/50 transition-all duration-300 flex flex-col group"
              >
                {/* Image Section */}
                <div className="h-40 bg-gray-100 relative overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

                  <div className="absolute top-3 right-3 bg-white/90 dark:bg-neutral-900/90 backdrop-blur text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm border border-white/20">
                    {event.category}
                  </div>

                  <div className="absolute bottom-3 left-4 text-white">
                    <p className="text-xs font-medium opacity-90 uppercase tracking-wider">
                      {event.date}
                    </p>
                    <p className="text-sm font-bold">{event.time}</p>
                  </div>
                </div>

                {/* Info Section */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {event.title}
                    </h4>
                    <div className="flex items-start gap-2 text-slate-500 dark:text-neutral-400 text-sm">
                      <MapPin size={16} className="shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-neutral-700 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {event.price}
                    </span>
                    <button className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1 hover:underline">
                      View Ticket <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ─── Recent Bookings Table ─── */}
        <motion.section
          variants={itemVariants}
          className="bg-white dark:bg-neutral-800 rounded-2xl border border-slate-200 dark:border-neutral-700 overflow-hidden shadow-sm"
        >
          <div className="px-6 py-5 border-b border-slate-200 dark:border-neutral-700 flex items-center justify-between bg-slate-50/50 dark:bg-neutral-800/50">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="text-slate-400" size={20} />
              Recent Bookings
            </h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-slate-500 hover:text-slate-700 dark:text-neutral-400"
              >
                <Filter size={16} className="mr-2" /> Filter
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="border-slate-200 dark:border-neutral-700"
              >
                View All
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-neutral-900/50 text-slate-500 dark:text-neutral-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="px-6 py-4 rounded-tl-lg">Event Name</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right rounded-tr-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-700">
                {data?.recentBookings.map(booking => (
                  <motion.tr
                    key={booking.id}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="group hover:bg-slate-50 dark:hover:bg-neutral-700/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div
                          className="size-10 rounded-lg bg-cover bg-center shadow-sm border border-slate-100 dark:border-neutral-700"
                          style={{ backgroundImage: `url('${booking.image}')` }}
                        />
                        <span className="font-semibold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">
                          {booking.event}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-neutral-400">
                      {booking.date}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="font-mono text-slate-500 dark:text-neutral-500 bg-slate-50 dark:bg-neutral-900 px-2 py-1 rounded inline-block">
                        {booking.id}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                      {booking.amount}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border',
                          booking.status === 'Confirmed'
                            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                        )}
                      >
                        <span
                          className={cn(
                            'size-1.5 rounded-full animate-pulse',
                            booking.status === 'Confirmed' ? 'bg-green-500' : 'bg-amber-500'
                          )}
                        />
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-neutral-700 dark:hover:text-white transition-all">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>

      {/* ─── Right Sidebar (Desktop Only) ─── */}
      <motion.aside variants={itemVariants} className="hidden xl:flex w-80 flex-col gap-6 pt-0">
        <div className="sticky top-28 space-y-6">
          {/* Quick Actions Widget */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-slate-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary-500/10 to-purple-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 relative z-10">
              Quick Actions
            </h3>

            <div className="grid grid-cols-1 gap-3 relative z-10">
              {QUICK_ACTIONS.map(action => (
                <motion.button
                  key={action.label}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-4 w-full p-3.5 rounded-xl bg-slate-50 dark:bg-neutral-900/50 hover:bg-white dark:hover:bg-neutral-700 border border-transparent hover:border-slate-200 dark:hover:border-neutral-600 hover:shadow-md transition-all duration-200 text-left group/btn"
                >
                  <div
                    className={cn(
                      'size-10 rounded-xl bg-white dark:bg-neutral-800 flex items-center justify-center shadow-sm group-hover/btn:scale-110 transition-transform',
                      action.color
                    )}
                  >
                    <action.icon size={20} strokeWidth={2.5} />
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-neutral-200 group-hover/btn:text-primary-600 dark:group-hover/btn:text-white transition-colors">
                    {action.label}
                  </span>
                  <ChevronRight
                    className="ml-auto text-slate-300 group-hover/btn:text-primary-500 opacity-0 group-hover/btn:opacity-100 transition-all"
                    size={16}
                  />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Calendar Widget (Applies glass-panel styling from CSS) */}
          <div className="glass-panel bg-gradient-to-b from-slate-900 to-slate-800 dark:from-neutral-800 dark:to-neutral-900 rounded-2xl p-6 text-white shadow-xl border border-slate-700/50">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-bold text-lg">August 2026</h4>
              <button className="text-slate-400 hover:text-white transition-colors">
                <MoreVertical size={18} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center text-sm">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                <span key={d} className="text-slate-500 font-medium text-xs">
                  {d}
                </span>
              ))}
              {/* Calendar Days Logic (Visual Only) */}
              {[...Array(31)].map((_, i) => {
                const day = i + 1;
                const isToday = day === 12;
                const hasEvent = [5, 12, 15].includes(day);
                return (
                  <div key={day} className="relative flex justify-center">
                    <span
                      className={cn(
                        'flex size-8 items-center justify-center rounded-full text-sm transition-all cursor-pointer hover:bg-white/10',
                        isToday
                          ? 'bg-primary-600 text-white font-bold shadow-lg shadow-primary-900/50'
                          : 'text-slate-300'
                      )}
                    >
                      {day}
                    </span>
                    {hasEvent && !isToday && (
                      <span className="absolute -bottom-1 size-1 bg-primary-400 rounded-full" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                <div className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
                <div>
                  <p className="text-sm font-medium">Summer Jazz Festival</p>
                  <p className="text-xs text-slate-400">Today, 18:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications Card (Applies widget-scroll from CSS) */}
          <div className="bg-orange-50 dark:bg-orange-500/10 rounded-2xl p-5 border border-orange-100 dark:border-orange-500/20 flex items-start gap-4 widget-scroll">
            <div className="p-2 bg-orange-100 dark:bg-orange-500/20 rounded-lg text-orange-600 dark:text-orange-400 shrink-0">
              <Bell size={20} />
            </div>
            <div>
              <h5 className="font-bold text-orange-900 dark:text-orange-100 text-sm">New Alert</h5>
              <p className="text-xs text-orange-800/80 dark:text-orange-200/70 mt-1 leading-relaxed">
                Your ticket for "Neon Night Run" is ready for download.
              </p>
            </div>
          </div>
        </div>
      </motion.aside>
    </motion.div>
  );
}

// =============================================================================
// LOADING SKELETON
// =============================================================================

function DashboardSkeleton() {
  return (
    <div className="flex flex-1 w-full gap-8 p-4">
      <div className="flex-1 flex flex-col gap-8">
        {/* Hero Skeleton */}
        <div className="w-full h-[300px] rounded-2xl bg-slate-200 dark:bg-neutral-800 animate-pulse" />
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="h-32 rounded-xl bg-slate-200 dark:bg-neutral-800 animate-pulse"
            />
          ))}
        </div>
        {/* Carousel Skeleton */}
        <div className="flex gap-6 overflow-hidden">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="min-w-[300px] h-80 rounded-2xl bg-slate-200 dark:bg-neutral-800 animate-pulse"
            />
          ))}
        </div>
      </div>
      {/* Sidebar Skeleton */}
      <div className="hidden xl:flex w-80 flex-col gap-6">
        <div className="h-64 rounded-2xl bg-slate-200 dark:bg-neutral-800 animate-pulse" />
        <div className="h-80 rounded-2xl bg-slate-200 dark:bg-neutral-800 animate-pulse" />
      </div>
    </div>
  );
}
