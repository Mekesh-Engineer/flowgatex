import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import {
  Calendar as CalendarIcon, Users, TrendingUp, DollarSign,
  Plus, Filter, MoreVertical, Download,
  PieChart, ChevronLeft, ChevronRight,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { useOrganizerEvents } from '@/features/events/hooks/useEvents';
import { useAuthStore } from '@/store/zustand/stores';
import { formatDate, formatCurrency } from '@/lib/utils';
import LoadingScreen from '@/components/common/LoadingScreen';
import { FloatingElement } from '@/features/home/components/ui/SharedComponents';
import { GridCanvas, ParticleCanvas } from '@/features/home/components/canvas/CanvasEffects';

// ─── Design Variants & Animations ─────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' }
  })
};



// ─── Sub-Components ──────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, subtext, trend, colorClass, index }: any) => (
  <motion.div
    custom={index}
    variants={fadeInUp}
    initial="hidden"
    animate="visible"
    whileHover={{ y: -5, boxShadow: 'var(--shadow-glow)' }}
    className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 transition-all duration-300 group relative overflow-hidden"
  >
    {/* Background Glow Effect */}
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-5 blur-2xl transition-opacity group-hover:opacity-10 ${colorClass.replace('text-', 'bg-')}`} />

    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 backdrop-blur-sm`}>
        <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
      </div>
      <span className="text-xs font-semibold bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-primary)] px-2.5 py-1 rounded-full">
        This Month
      </span>
    </div>

    <div className="flex flex-col mb-1 relative z-10">
      <p className="text-sm font-medium text-[var(--text-muted)] mb-1">{label}</p>
      <h3 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">{value}</h3>
    </div>

    <div className="text-xs text-[var(--text-secondary)] flex items-center gap-2 relative z-10">
      {trend != null && (
        <span className={`font-bold flex items-center gap-0.5 ${trend > 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
          {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend)}%
        </span>
      )}
      <span className="text-[var(--text-muted)]">{subtext}</span>
    </div>
  </motion.div>
);

const ActivityItem = ({ title, time, type, index }: any) => {
  // Define complete class names based on type
  let borderClass = 'border-[var(--color-primary)]';
  let dotClass = 'bg-[var(--color-primary)]';
  let borderOpacityClass = 'border-opacity-30';
  let hoverBorderClass = 'group-hover:border-[var(--color-primary)]';

  if (type === 'payment') {
    borderClass = 'border-[var(--color-success)]';
    dotClass = 'bg-[var(--color-success)]';
    borderOpacityClass = 'border-opacity-30';
    hoverBorderClass = 'group-hover:border-[var(--color-success)]';
  }
  if (type === 'alert') {
    borderClass = 'border-[var(--color-warning)]';
    dotClass = 'bg-[var(--color-warning)]';
    borderOpacityClass = 'border-opacity-30';
    hoverBorderClass = 'group-hover:border-[var(--color-warning)]';
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative flex items-start gap-4 group"
    >
      <div className={`relative z-10 size-6 rounded-full bg-[var(--bg-card)] border-2 ${borderClass} ${borderOpacityClass} ${hoverBorderClass} transition-colors flex items-center justify-center shrink-0 mt-0.5`}>
        <div className={`size-2 ${dotClass} rounded-full shadow-[0_0_8px_currentColor] opacity-70 group-hover:opacity-100 transition-opacity`}></div>
      </div>
      <div>
        <p className="text-sm text-[var(--text-primary)] font-medium leading-snug group-hover:text-[var(--color-primary)] transition-colors duration-200">{title}</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">{time}</p>
      </div>
    </motion.div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Calendar State
  const [currentDate, setCurrentDate] = useState(dayjs());

  // Fetch events for this specific organizer
  // Note: Using the hook that wraps React Query for efficient caching and updates
  const { data: events, isLoading } = useOrganizerEvents(user?.uid || '');

  // ─── Derived Data & Metrics ───

  const metrics = useMemo(() => {
    if (!events) return { total: 0, active: 0, drafts: 0, past: 0, revenue: 0, attendees: 0, topEvents: [] };

    // Events are already filtered by organizerId via the backend/service query
    const myEvents = events;

    const total = myEvents.length;
    const active = myEvents.filter(e => e.status === 'published').length;
    const drafts = myEvents.filter(e => e.status === 'draft').length;
    const past = myEvents.filter(e => dayjs(e.endDate).isBefore(dayjs())).length;

    // Aggregations based on stats (handling optional fields safely)
    const attendees = myEvents.reduce((acc, curr) => acc + (curr.stats?.ticketsSold || 0), 0);
    const revenue = myEvents.reduce((acc, curr) => acc + (curr.stats?.revenue || 0), 0);

    // Top Performing
    const topEvents = [...myEvents]
      .sort((a, b) => (b.stats?.revenue || 0) - (a.stats?.revenue || 0))
      .slice(0, 3);

    return { total, active, drafts, past, revenue, attendees, topEvents };
  }, [events]);

  // Calendar Logic
  const calendarDays = useMemo(() => {
    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');
    const daysInMonth = endOfMonth.date();
    const startDay = startOfMonth.day(); // 0 (Sunday) to 6 (Saturday)

    const days = [];

    // Pad previous month days
    for (let i = 0; i < startDay; i++) {
      days.push({ day: null, key: `prev-${i}` });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = currentDate.date(i);
      // Find events on this day
      const daysEvents = events?.filter(e => dayjs(e.startDate).isSame(date, 'day')) || [];
      days.push({
        day: i,
        date: date,
        events: daysEvents,
        hasEvent: daysEvents.length > 0,
        isToday: date.isSame(dayjs(), 'day'),
        key: `day-${i}`
      });
    }

    return days;
  }, [currentDate, events]);

  const nextMonth = () => setCurrentDate(currentDate.add(1, 'month'));
  const prevMonth = () => setCurrentDate(currentDate.subtract(1, 'month'));

  // Get user's first name for personal greeting
  const firstName = user?.firstName || user?.displayName?.split(' ')[0] || 'Organizer';

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans selection:bg-[var(--color-primary)] selection:text-white pb-12 relative overflow-hidden">

      <div className="fixed inset-0 z-0 pointer-events-none">
        <GridCanvas />
        <ParticleCanvas />
      </div>

      <div className="relative z-10 container mx-auto px-6 pt-8">

        {/* ── Header ── */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10"
        >
          <FloatingElement duration={5}>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
                Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]">{firstName}</span>!
              </h1>
              <p className="text-[var(--text-secondary)] text-base max-w-2xl">
                Here's your performance overview. You have <span className="font-bold text-[var(--text-primary)]">{metrics.active} active events</span> scheduled properly.
              </p>
            </div>
          </FloatingElement>

          <div className="flex gap-3">
            <Link to="/organizer/events" className="hidden sm:flex items-center gap-2 bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] px-4 py-3.5 rounded-xl font-bold border border-[var(--border-primary)] transition-all" title="View Attendees">
              <Users size={20} /> <span className="hidden xl:inline">Attendees</span>
            </Link>
            <Link to="/organizer/payouts" className="hidden sm:flex items-center gap-2 bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] px-4 py-3.5 rounded-xl font-bold border border-[var(--border-primary)] transition-all" title="Check Payouts">
              <DollarSign size={20} /> <span className="hidden xl:inline">Payouts</span>
            </Link>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/organizer/events/create')}
              className="flex items-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-focus)] text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-[var(--color-primary)]/25 transition-all"
            >
              <Plus size={20} strokeWidth={2.5} />
              <span>Create Event</span>
            </motion.button>
          </div>
        </motion.header>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          <StatCard
            index={0}
            icon={CalendarIcon}
            colorClass="text-[var(--color-primary)]"
            value={metrics.total}
            label="Total Events"
            subtext={`${metrics.active} Active • ${metrics.drafts} Draft • ${metrics.past} Past`}
          />

          {/* Revenue Card (Special Styling) */}
          <motion.div
            custom={1}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -5, boxShadow: 'var(--shadow-glow-secondary)' }}
            className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 transition-all duration-300 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-secondary-faint)]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="flex justify-between items-start mb-2 relative z-10">
              <div className="bg-[var(--color-success)]/10 p-3 rounded-xl text-[var(--color-success)] backdrop-blur-sm">
                <DollarSign size={24} />
              </div>
              <div className="flex items-center text-[var(--color-success)] text-xs font-bold bg-[var(--color-success)]/10 px-2.5 py-1 rounded-full border border-[var(--color-success)]/20">
                <TrendingUp size={14} className="mr-1" /> +12.5%
              </div>
            </div>

            <div className="relative z-10 mt-4">
              <h3 className="text-3xl font-bold text-[var(--text-primary)] mb-1">{formatCurrency(metrics.revenue)}</h3>
              <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">Total Revenue</p>
            </div>

            {/* Decorative Sparkline */}
            <div className="absolute bottom-0 right-0 left-0 h-16 opacity-20 pointer-events-none">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 200 60">
                <path d="M0 45 Q 20 35, 40 40 T 80 30 T 120 45 T 160 20 T 200 35 V 60 H 0 Z" fill="url(#sparkGradient)" />
                <path d="M0 45 Q 20 35, 40 40 T 80 30 T 120 45 T 160 20 T 200 35" fill="none" stroke="var(--color-success)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                <defs>
                  <linearGradient id="sparkGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-success)" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="var(--color-success)" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </motion.div>

          <StatCard
            index={2}
            icon={Users}
            colorClass="text-[var(--color-secondary)]"
            value={metrics.attendees}
            label="Total Attendees"
            trend={8.2}
            subtext="vs last month"
          />

          <StatCard
            index={3}
            icon={PieChart}
            colorClass="text-[var(--color-primary)]"
            value="3.4%"
            label="Conversion Rate"
            trend={-1.1}
            subtext="vs last month"
          />
        </div>

        {/* ── Main Content Area ── */}
        <div className="grid grid-cols-12 gap-8 mb-10">

          {/* Revenue Chart Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="col-span-12 lg:col-span-8 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-sm hover:shadow-[var(--shadow-card)] transition-shadow"
          >
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Revenue Overview</h3>
                <p className="text-sm text-[var(--text-muted)]">Monthly earnings report</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex bg-[var(--bg-surface)] p-1 rounded-xl border border-[var(--border-primary)]">
                  <button className="px-3 py-1.5 text-xs font-semibold rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors">Daily</button>
                  <button className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm border border-[var(--border-primary)]">Weekly</button>
                  <button className="px-3 py-1.5 text-xs font-semibold rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors">Monthly</button>
                </div>
                <button className="flex items-center gap-2 text-xs font-bold text-[var(--color-primary)] px-3 py-2 rounded-xl border border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/10 transition-colors">
                  <Download size={14} /> Export
                </button>
              </div>
            </div>

            {/* Chart Graphic Area */}
            <div className="relative w-full h-[320px] min-h-[320px] bg-[var(--bg-surface)] rounded-xl border border-[var(--border-primary)] overflow-hidden">
              <div className="absolute inset-0 flex flex-col justify-between py-6 px-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-full h-px bg-[var(--border-subtle)]/30 border-dashed" />
                ))}
              </div>

              {/* SVG Chart */}
              <svg
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="none"
                viewBox="0 0 900 320"
              >
                <defs>
                  <linearGradient id="chartGradientMain" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,280 C100,250 200,300 300,200 C400,100 500,180 600,140 C700,100 800,40 900,80 L900,320 L0,320 Z"
                  fill="url(#chartGradientMain)"
                />
                <path
                  d="M0,280 C100,250 200,300 300,200 C400,100 500,180 600,140 C700,100 800,40 900,80"
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="3"
                  vectorEffect="non-scaling-stroke"
                />
                <circle
                  cx="600"
                  cy="140"
                  r="6"
                  stroke="var(--color-primary)"
                  strokeWidth="3"
                  className="fill-[var(--bg-card)]"
                />
              </svg>

              {/* Floating Tooltip */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="absolute top-[100px] left-[60%] bg-[var(--bg-card)] border border-[var(--border-primary)] px-4 py-2.5 rounded-xl shadow-xl text-xs z-10 transform -translate-x-1/2 flex flex-col items-center"
              >
                <p className="text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider mb-0.5">
                  Current Week
                </p>
                <p className="font-bold text-[var(--text-primary)] text-base">
                  {formatCurrency(4250)}
                </p>
                <div className="w-2 h-2 bg-[var(--bg-card)] border-r border-b border-[var(--border-primary)] absolute -bottom-1 rotate-45"></div>
              </motion.div>
            </div>
          </motion.div>

          {/* Sidebar Widgets (Calendar & Activity) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="col-span-12 lg:col-span-4 space-y-6"
          >
            {/* Top Performing Events */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-[var(--text-primary)] mb-4">Top Performing</h3>
              <div className="space-y-3">
                {metrics.topEvents.map((e, i) => (
                  <Link key={e.id} to={`/organizer/events/${e.id}/analytics`} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] hover:border-[var(--color-primary)] transition-colors group">
                    <div className="font-bold text-lg text-[var(--text-muted)] w-6 text-center">#{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-[var(--text-primary)] truncate group-hover:text-[var(--color-primary)] transition-colors">{e.title}</p>
                      <p className="text-xs text-[var(--text-muted)]">{formatCurrency(e.stats?.revenue || 0)} • <span className="text-[var(--color-success)]">4.8 ★</span></p>
                    </div>
                    <ArrowUpRight size={16} className="text-[var(--text-muted)] group-hover:text-[var(--color-primary)]" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Calendar Widget (Integrated) */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-sm h-full max-h-[400px] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-bold text-[var(--text-primary)]">{currentDate.format('MMMM YYYY')}</h4>
                <div className="flex gap-1.5">
                  <button
                    onClick={prevMonth}
                    className="p-1.5 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-secondary)] transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-1.5 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-secondary)] transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wide font-bold text-[var(--text-muted)] mb-3">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-sm flex-1">
                {calendarDays.map((item) => {
                  if (item.day === null) {
                    return <div key={item.key} className="h-8" />;
                  }

                  return (
                    <motion.div
                      key={item.key}
                      whileHover={{ scale: 1.1, backgroundColor: 'var(--bg-hover)' }}
                      className={`
                      h-9 w-9 mx-auto rounded-full flex flex-col items-center justify-center cursor-pointer relative transition-colors
                      ${item.isToday ? 'bg-[var(--color-primary)] text-white font-bold shadow-md shadow-[var(--color-primary)]/30' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}
                    `}
                      title={item.events?.length ? `${item.events.length} events` : ''}
                    >
                      <span>{item.day}</span>
                      {item.hasEvent && !item.isToday && (
                        <span className="absolute bottom-1.5 size-1 rounded-full bg-[var(--color-secondary)]" />
                      )}
                      {item.hasEvent && item.isToday && (
                        <span className="absolute bottom-1 size-1 rounded-full bg-white" />
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Calendar Footer Info */}
              <div className="mt-6 pt-4 border-t border-[var(--border-primary)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[var(--color-secondary)]" />
                  <span>Published Event</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[var(--color-primary)]" />
                  <span>Today</span>
                </div>
              </div>
            </div>

            {/* Activity Widget */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-[var(--text-primary)]">Recent Activity</h3>
                <Link to="/organizer" className="text-xs text-[var(--color-primary)] font-bold hover:underline">View All</Link>
              </div>

              <div className="relative space-y-6 pl-2.5">
                <div className="absolute left-[13px] top-3 bottom-3 w-px bg-[var(--border-primary)]"></div>

                {/* Mock Activity Data (Ideally this comes from a hook) */}
                <ActivityItem
                  index={0}
                  title={<>New booking for <span className="font-semibold text-[var(--color-primary)]">Neon Nights</span></>}
                  time="2 minutes ago"
                  type="booking"
                />
                <ActivityItem
                  index={1}
                  title="Payment received: $450.00"
                  time="15 minutes ago"
                  type="payment"
                />
                <ActivityItem
                  index={2}
                  title={<>Low ticket alert: <span className="font-semibold text-[var(--color-secondary)]">Tech Summit</span></>}
                  time="1 hour ago"
                  type="alert"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Recent Events Table ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl overflow-hidden shadow-sm"
        >
          <div className="p-6 border-b border-[var(--border-primary)] flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Recent Events</h3>
              <p className="text-sm text-[var(--text-muted)]">Manage your latest events and their status</p>
            </div>
            <div className="flex gap-2">
              <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 rounded-lg hover:bg-[var(--bg-hover)] border border-transparent hover:border-[var(--border-primary)] transition-all">
                <Filter size={18} />
              </button>
              <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 rounded-lg hover:bg-[var(--bg-hover)] border border-transparent hover:border-[var(--border-primary)] transition-all">
                <MoreVertical size={18} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-primary)] text-xs uppercase tracking-wider text-[var(--text-muted)] font-bold bg-[var(--bg-surface)]">
                  <th className="px-6 py-4">Event Name</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Tickets Sold</th>
                  <th className="px-6 py-4">Revenue</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-primary)]">
                {events && events.slice(0, 5).map((event) => {
                  const sold = event.stats?.ticketsSold || 0;
                  const total = event.stats?.capacity || 100;
                  const percentage = (sold / total) * 100;
                  const statusColor = event.status === 'published' ? 'text-[var(--color-success)] bg-[var(--color-success)]/10 border-[var(--color-success)]/20'
                    : event.status === 'draft' ? 'text-[var(--text-muted)] bg-[var(--text-muted)]/10 border-[var(--text-muted)]/20'
                      : 'text-[var(--color-error)] bg-[var(--color-error)]/10 border-[var(--color-error)]/20';

                  return (
                    <motion.tr
                      key={event.id}
                      whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                      className="group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl bg-[var(--bg-surface)] bg-cover bg-center border border-[var(--border-primary)] shadow-sm"
                            style={{ backgroundImage: `url(${event.coverImage || '/placeholder-event.jpg'})` }}
                          />
                          <div>
                            <p className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors">{event.title}</p>
                            <p className="text-xs text-[var(--text-muted)] capitalize">{event.category} • {event.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)] font-medium">
                        {event.startDate ? formatDate(event.startDate) : 'TBA'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-[var(--bg-surface)] rounded-full overflow-hidden border border-[var(--border-primary)]">
                            <div
                              className={`h-full rounded-full ${percentage > 80 ? 'bg-[var(--color-secondary)]' : 'bg-[var(--color-primary)]'}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-[var(--text-muted)] font-medium">{sold}/{total}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-[var(--text-primary)]">
                        {formatCurrency(event.stats?.revenue || 0)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold border ${statusColor} transition-colors`}>
                          {event.status === 'published' && <span className="size-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />}
                          <span className="capitalize">{event.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => navigate(`/organizer/events/${event.id}/analytics`)}
                            className="text-[var(--text-secondary)] hover:text-[var(--color-primary)] p-1.5 rounded-lg hover:bg-[var(--color-primary)]/10 transition-colors"
                            title="View Analytics"
                          >
                            <TrendingUp size={16} />
                          </button>
                          <button
                            onClick={() => navigate(`/organizer/events/${event.id}/edit`)}
                            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                            title="Edit Event"
                          >
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
                {(!events || events.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-[var(--text-muted)]">
                      <div className="flex flex-col items-center justify-center">
                        <div className="bg-[var(--bg-surface)] p-4 rounded-full mb-3 border border-[var(--border-primary)]">
                          <CalendarIcon size={32} className="text-[var(--text-muted)] opacity-50" />
                        </div>
                        <p className="font-medium">No events found</p>
                        <p className="text-sm mt-1 mb-4">You haven't created any events yet.</p>
                        <button
                          onClick={() => navigate('/organizer/events/create')}
                          className="text-xs font-bold text-[var(--color-primary)] hover:underline"
                        >
                          Create your first event
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}