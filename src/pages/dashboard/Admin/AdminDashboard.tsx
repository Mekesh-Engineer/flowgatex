// =============================================================================
// ADMIN DASHBOARD — Real-time command center for platform health & key metrics
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Calendar, TrendingUp, Shield, Zap, CreditCard,
  ArrowRight, Bell, CheckCircle2, XCircle, AlertTriangle,
  Clock, Activity, RefreshCw, Send, Download, FileText,
} from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import { formatCurrency } from '@/lib/utils';
import { subscribeToAdminStats, type AdminStats } from '@/services/adminService';
import { subscribeToRecentActivity } from '@/services/auditService';
import { useAdminStore } from '@/store/zustand/adminStore';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import type { AuditLogEntry } from '@/types/admin.types';
import { checkSystemHealth, type SystemStatus } from '@/services/healthService';

// =============================================================================
// ACTIVITY FEED ITEM
// =============================================================================

const actionTypeColors: Record<string, string> = {
  create: 'text-emerald-400 bg-emerald-500/15',
  approve: 'text-emerald-400 bg-emerald-500/15',
  delete: 'text-red-400 bg-red-500/15',
  reject: 'text-red-400 bg-red-500/15',
  update: 'text-blue-400 bg-blue-500/15',
  auth: 'text-purple-400 bg-purple-500/15',
  finance: 'text-amber-400 bg-amber-500/15',
  refund: 'text-amber-400 bg-amber-500/15',
};

function getActionIcon(action: string) {
  if (action.includes('approve') || action.includes('create')) return <CheckCircle2 size={14} />;
  if (action.includes('reject') || action.includes('delete')) return <XCircle size={14} />;
  if (action.includes('refund') || action.includes('finance')) return <CreditCard size={14} />;
  if (action.includes('auth')) return <Shield size={14} />;
  return <Activity size={14} />;
}

function getActionColorClass(action: string): string {
  for (const key of Object.keys(actionTypeColors)) {
    if (action.toLowerCase().includes(key)) return actionTypeColors[key];
  }
  return 'text-slate-400 bg-slate-500/15';
}

function ActivityItem({ entry }: { entry: AuditLogEntry }) {
  let time = '';
  try {
    const ts = entry.timestamp?.toDate?.();
    if (ts) {
      time = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: 'numeric' }).format(ts);
    }
  } catch { /* ignore */ }

  return (
    <div className="flex items-start gap-3 py-3 border-b border-[var(--border-default)]/50 last:border-0
                    hover:bg-[var(--bg-surface-hover)]/50 px-3 -mx-3 rounded-lg transition-colors">
      <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${getActionColorClass(entry.action)}`}>
        {getActionIcon(entry.action)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--text-primary)]">
          <span className="font-medium">{entry.action.replace(/[_:]/g, ' ')}</span>
        </p>
        <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
          {entry.resource} • {entry.performedByEmail || entry.performedBy}
        </p>
      </div>
      <span className="text-xs text-[var(--text-muted)] shrink-0">{time}</span>
    </div>
  );
}

// =============================================================================
// QUICK ACTIONS
// =============================================================================

function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    { label: 'Review Pending Events', icon: <Calendar size={18} />, onClick: () => navigate(ROUTES.ADMIN_EVENTS), color: 'from-blue-500 to-cyan-500' },
    { label: 'Organizer Applications', icon: <Shield size={18} />, onClick: () => navigate(ROUTES.ADMIN_ORGANIZERS), color: 'from-purple-500 to-pink-500' },
    { label: 'Transaction Monitor', icon: <CreditCard size={18} />, onClick: () => navigate(ROUTES.ADMIN_TRANSACTIONS), color: 'from-amber-500 to-orange-500' },
    { label: 'Export Report', icon: <Download size={18} />, onClick: () => navigate(ROUTES.ADMIN_REPORTS), color: 'from-emerald-500 to-teal-500' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          className="group flex items-center gap-3 p-4 rounded-xl
                     bg-[var(--bg-surface)] border border-[var(--border-default)]
                     hover:border-[var(--color-primary)]/30 hover:shadow-lg
                     transition-all duration-200 text-left"
        >
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color}
                         flex items-center justify-center text-white shadow-lg
                         group-hover:scale-110 transition-transform duration-200`}>
            {action.icon}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-[var(--text-primary)] block truncate">
              {action.label}
            </span>
          </div>
          <ArrowRight size={16} className="text-[var(--text-muted)] group-hover:text-[var(--color-primary)]
                                           group-hover:translate-x-1 transition-all" />
        </button>
      ))}
    </div>
  );
}

// =============================================================================
// PLATFORM STATUS BAR
// =============================================================================

function PlatformStatusBar() {
  const [statuses, setStatuses] = useState<SystemStatus>({
    firestore: 'operational',
    razorpay: 'operational',
    email: 'operational',
  });
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const check = async () => {
      setChecking(true);
      const res = await checkSystemHealth();
      setStatuses(res);
      setChecking(false);
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);

  const list = [
    { label: 'Firestore', status: statuses.firestore },
    { label: 'Razorpay', status: statuses.razorpay },
    { label: 'Email', status: statuses.email },
  ];

  return (
    <div className="flex items-center gap-3 flex-wrap mb-6">
      {list.map((svc) => (
        <StatusBadge key={svc.label} status={svc.status} size="sm" />
      ))}
      <span className="text-xs text-[var(--text-muted)] ml-auto flex items-center gap-1">
        <RefreshCw size={12} className={checking ? "animate-spin" : ""} />
        {checking ? 'Checking...' : 'Auto-refreshes every 60s'}
      </span>
    </div>
  );
}

// =============================================================================
// MAIN DASHBOARD COMPONENT
// =============================================================================

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { setStats, setRecentActivity } = useAdminStore();
  const [statsData, setStatsData] = useState<AdminStats>({
    totalUsers: 0,
    totalEvents: 0,
    platformRevenue: 0,
    activeOrganizers: 0,
    pendingApprovals: 0,
    bookingsToday: 0,
    loading: true,
  });
  const [activity, setActivity] = useState<AuditLogEntry[]>([]);

  const handleStatsUpdate = useCallback((stats: AdminStats) => {
    setStatsData(stats);
    setStats(stats);
  }, [setStats]);

  const handleActivityUpdate = useCallback((logs: AuditLogEntry[]) => {
    setActivity(logs);
    setRecentActivity(logs);
  }, [setRecentActivity]);

  useEffect(() => {
    const unsubStats = subscribeToAdminStats(handleStatsUpdate);
    const unsubActivity = subscribeToRecentActivity(handleActivityUpdate);
    return () => {
      unsubStats();
      unsubActivity();
    };
  }, [handleStatsUpdate, handleActivityUpdate]);

  const statCards = [
    {
      title: 'Total Users',
      value: statsData.loading ? '—' : statsData.totalUsers.toLocaleString(),
      icon: <Users size={20} />,
      color: 'blue' as const,
      onClick: () => navigate(ROUTES.ADMIN_USERS),
    },
    {
      title: 'Active Events',
      value: statsData.loading ? '—' : statsData.totalEvents.toLocaleString(),
      icon: <Calendar size={20} />,
      color: 'cyan' as const,
      onClick: () => navigate(ROUTES.ADMIN_EVENTS),
    },
    {
      title: 'Platform Revenue',
      value: statsData.loading ? '—' : formatCurrency(statsData.platformRevenue),
      icon: <TrendingUp size={20} />,
      color: 'green' as const,
      onClick: () => navigate(ROUTES.ADMIN_TRANSACTIONS),
    },
    {
      title: 'Active Organizers',
      value: statsData.loading ? '—' : statsData.activeOrganizers.toLocaleString(),
      icon: <Shield size={20} />,
      color: 'purple' as const,
      onClick: () => navigate(ROUTES.ADMIN_ORGANIZERS),
    },
    {
      title: 'Pending Approvals',
      value: statsData.loading ? '—' : (statsData.pendingApprovals || 0).toLocaleString(),
      icon: <Clock size={20} />,
      color: statsData.pendingApprovals > 0 ? 'amber' as const : 'blue' as const,
      onClick: () => navigate(ROUTES.ADMIN_ORGANIZERS),
    },
    {
      title: 'Bookings Today',
      value: statsData.loading ? '—' : (statsData.bookingsToday || 0).toLocaleString(),
      icon: <Zap size={20} />,
      color: 'amber' as const,
      onClick: () => navigate(ROUTES.ADMIN_ATTENDEES),
    },
  ];

  return (
    <div className="min-h-screen">
      <AdminPageHeader
        title="Admin Dashboard"
        subtitle="Platform management, analytics & moderation"
        breadcrumbs={[{ label: 'Admin', href: ROUTES.ADMIN }, { label: 'Dashboard' }]}
        primaryAction={{
          label: 'Send Announcement',
          icon: <Send size={16} />,
          onClick: () => { },
        }}
        secondaryActions={[
          {
            label: 'Export Report',
            icon: <FileText size={16} />,
            onClick: () => navigate(ROUTES.ADMIN_REPORTS),
          },
        ]}
      />

      {/* Platform Status */}
      <PlatformStatusBar />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Content — 75% */}
        <div className="xl:col-span-3 space-y-6">
          {/* KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {statCards.map((card) => (
              <AdminStatCard
                key={card.title}
                title={card.title}
                value={card.value}
                icon={card.icon}
                color={card.color}
                loading={statsData.loading}
                onClick={card.onClick}
              />
            ))}
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Quick Actions</h2>
              <Bell size={18} className="text-[var(--text-muted)]" />
            </div>
            <QuickActions />
          </div>

          {/* Admin Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'User Management', desc: 'Manage users, roles & suspensions', icon: <Users size={24} />, route: ROUTES.ADMIN_USERS, color: 'from-blue-600 to-blue-700' },
              { title: 'Event Moderation', desc: 'Approve, reject & flag events', icon: <Calendar size={24} />, route: ROUTES.ADMIN_EVENTS, color: 'from-cyan-600 to-cyan-700' },
              { title: 'Organizer Oversight', desc: 'Applications & active organizers', icon: <Shield size={24} />, route: ROUTES.ADMIN_ORGANIZERS, color: 'from-purple-600 to-purple-700' },
              { title: 'Attendee Records', desc: 'Bookings, check-ins & tickets', icon: <Users size={24} />, route: ROUTES.ADMIN_ATTENDEES, color: 'from-teal-600 to-teal-700' },
              { title: 'Transactions', desc: 'Payments, refunds & payouts', icon: <CreditCard size={24} />, route: ROUTES.ADMIN_TRANSACTIONS, color: 'from-amber-600 to-amber-700' },
              { title: 'Audit Logs', desc: 'Activity tracking & compliance', icon: <FileText size={24} />, route: ROUTES.ADMIN_AUDIT_LOGS, color: 'from-slate-600 to-slate-700' },
            ].map((nav) => (
              <button
                key={nav.title}
                onClick={() => navigate(nav.route)}
                className="group relative overflow-hidden rounded-2xl border border-[var(--border-default)]
                           bg-[var(--bg-surface)] p-6 text-left
                           hover:border-[var(--color-primary)]/30 hover:shadow-lg
                           transition-all duration-300"
              >
                <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-10
                               group-hover:opacity-20 transition-opacity bg-gradient-to-br ${nav.color}`} />

                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${nav.color}
                               flex items-center justify-center text-white shadow-lg mb-4
                               group-hover:scale-110 transition-transform duration-200`}>
                  {nav.icon}
                </div>
                <h3 className="font-bold text-[var(--text-primary)] mb-1">{nav.title}</h3>
                <p className="text-sm text-[var(--text-muted)]">{nav.desc}</p>
                <ArrowRight size={16} className="absolute bottom-6 right-6 text-[var(--text-muted)]
                                                  group-hover:text-[var(--color-primary)]
                                                  group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </div>

        {/* Right Sidebar — 25% */}
        <div className="xl:col-span-1 space-y-6">
          {/* Recent Activity Feed */}
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Recent Activity
              </h2>
              <button
                onClick={() => navigate(ROUTES.ADMIN_AUDIT_LOGS)}
                className="text-xs text-[var(--color-primary)] hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-0">
              {activity.length === 0 ? (
                <div className="py-8 text-center">
                  <Activity size={32} className="mx-auto text-[var(--text-muted)] opacity-40 mb-3" />
                  <p className="text-sm text-[var(--text-muted)]">No recent activity</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Admin actions will appear here in real-time
                  </p>
                </div>
              ) : (
                activity.slice(0, 10).map((entry) => (
                  <ActivityItem key={entry.id} entry={entry} />
                ))
              )}
            </div>
          </div>

          {/* Alert Summary */}
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5">
            <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">
              Alerts
            </h2>
            <div className="space-y-3">
              {statsData.pendingApprovals > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-300">
                      {statsData.pendingApprovals} Pending Approval{statsData.pendingApprovals > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-amber-400/70">Organizer applications waiting</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-300">All systems operational</p>
                  <p className="text-xs text-emerald-400/70">No critical alerts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
