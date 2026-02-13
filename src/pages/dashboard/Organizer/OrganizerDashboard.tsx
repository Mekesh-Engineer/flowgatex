import { Link } from 'react-router-dom';
import {
  Plus, Calendar, Users, TrendingUp, DollarSign,
  QrCode, BarChart3, Ticket, ArrowRight,
} from 'lucide-react';
import useAuth from '@/features/auth/hooks/useAuth';
import Dashboard from '@/features/analytics/components/Dashboard';

/* ─────────────────────────────────────────────
   Quick-action card data
   ───────────────────────────────────────────── */
const QUICK_ACTIONS = [
  {
    label: 'Create Event',
    description: 'Launch a new event listing',
    icon: Plus,
    to: '/organizer/events/create',
    gradient: 'from-[#00A3DB] to-[#0082af]',
    glow: 'shadow-[#00A3DB]/20 hover:shadow-[#00A3DB]/40',
  },
  {
    label: 'My Events',
    description: 'Manage your active events',
    icon: Ticket,
    to: '/organizer/events',
    gradient: 'from-[#A3D639] to-[#82ab2e]',
    glow: 'shadow-[#A3D639]/20 hover:shadow-[#A3D639]/40',
  },
  {
    label: 'Scan QR',
    description: 'Verify attendee tickets',
    icon: QrCode,
    to: '/organizer/scan',
    gradient: 'from-[#8B5CF6] to-[#6D28D9]',
    glow: 'shadow-[#8B5CF6]/20 hover:shadow-[#8B5CF6]/40',
  },
  {
    label: 'Reports',
    description: 'View detailed analytics',
    icon: BarChart3,
    to: '/organizer/reports',
    gradient: 'from-[#F59E0B] to-[#D97706]',
    glow: 'shadow-[#F59E0B]/20 hover:shadow-[#F59E0B]/40',
  },
] as const;

/* ─────────────────────────────────────────────
   Stat summary data (hero metrics)
   ───────────────────────────────────────────── */
const STATS = [
  { label: 'Total Revenue', value: '₹2,45,000', change: '+12%', icon: DollarSign, color: '#00A3DB' },
  { label: 'Active Events', value: '5', change: '+2', icon: Calendar, color: '#A3D639' },
  { label: 'Total Attendees', value: '1,240', change: '+8%', icon: Users, color: '#8B5CF6' },
  { label: 'Sales Growth', value: '24%', change: '+5%', icon: TrendingUp, color: '#F59E0B' },
];

/* ═════════════════════════════════════════════
   OrganizerDashboard
   ═════════════════════════════════════════════ */
function OrganizerDashboard() {
  const { user } = useAuth();
  const firstName = user?.displayName?.split(' ')[0] || 'Organizer';
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-8">

      {/* ── Welcome Banner ────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#00A3DB]/10 via-[var(--bg-card)] to-[#A3D639]/10 border border-[var(--border-primary)] p-6 sm:p-8">
        {/* decorative blobs */}
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-[#00A3DB]/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-[#A3D639]/5 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--text-muted)] mb-1">{today}</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              Welcome back, <span className="bg-gradient-to-r from-[#00A3DB] to-[#A3D639] bg-clip-text text-transparent">{firstName}</span> 👋
            </h1>
            <p className="mt-1 text-[var(--text-secondary)] text-sm">
              Here's what's happening with your events today
            </p>
          </div>

          <Link
            to="/organizer/events/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00A3DB] to-[#007AA3] text-white font-semibold shadow-lg shadow-[#00A3DB]/20 hover:shadow-[#00A3DB]/30 transition-all duration-300 hover:scale-[1.02] whitespace-nowrap"
          >
            <Plus size={18} />
            Create Event
          </Link>
        </div>
      </section>

      {/* ── Stat Cards ─────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="group relative overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5 transition-all duration-300 hover:border-[color:var(--border-accent)] hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[var(--text-muted)] mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
                </div>
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-xl transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${stat.color}15`, color: stat.color }}
                >
                  <Icon size={20} />
                </div>
              </div>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-500">
                <TrendingUp size={12} />
                {stat.change}
                <span className="text-[var(--text-muted)] font-normal ml-1">vs last period</span>
              </span>
              {/* decorative bottom bar */}
              <div
                className="absolute bottom-0 left-0 h-0.5 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, ${stat.color}, transparent)` }}
              />
            </div>
          );
        })}
      </section>

      {/* ── Quick Actions ──────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                to={action.to}
                className={`group relative flex flex-col gap-3 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5 transition-all duration-300 hover:border-transparent hover:shadow-xl ${action.glow}`}
              >
                <div className={`flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${action.gradient} text-white shadow-md transition-transform duration-300 group-hover:scale-110`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="font-semibold text-[var(--text-primary)] group-hover:text-[#00A3DB] transition-colors">
                    {action.label}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{action.description}</p>
                </div>
                <ArrowRight
                  size={16}
                  className="absolute top-5 right-5 text-[var(--text-disabled)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"
                />
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Analytics (Revenue + Metrics) ──────────── */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Analytics Overview</h2>
        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4 sm:p-6">
          <Dashboard />
        </div>
      </section>
    </div>
  );
}

export default OrganizerDashboard;
