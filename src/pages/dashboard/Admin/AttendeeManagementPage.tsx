// =============================================================================
// ATTENDEE MANAGEMENT PAGE — View and manage all attendee records & bookings
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
    Users, Search, CheckCircle2, XCircle, Eye, Download,
    TicketCheck, CreditCard, ChevronDown,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { DetailDrawer } from '@/components/admin/DetailDrawer';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { subscribeToAttendees, cancelBooking, manualCheckIn } from '@/services/attendeeService';
import { useAuthStore } from '@/store/zustand/stores';
import type { AttendeeRecord, AttendeeFilters } from '@/types/admin.types';

// =============================================================================
// FILTER BAR
// =============================================================================

function AttendeeFilterBar({
    filters,
    onFilterChange,
}: {
    filters: AttendeeFilters;
    onFilterChange: (filters: AttendeeFilters) => void;
}) {
    return (
        <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                    type="text"
                    placeholder="Search by attendee name or email..."
                    value={filters.search || ''}
                    onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-[var(--bg-surface)]
                     border border-[var(--border-default)] rounded-xl
                     text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                     focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40
                     transition-all"
                />
            </div>

            {/* Status Filter */}
            <div className="relative">
                <select
                    title="Filter by status"
                    value={filters.status || ''}
                    onChange={(e) => onFilterChange({ ...filters, status: e.target.value || undefined })}
                    className="appearance-none pl-3 pr-8 py-2.5 text-sm bg-[var(--bg-surface)]
                     border border-[var(--border-default)] rounded-xl
                     text-[var(--text-primary)]
                     focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
                >
                    <option value="">All Statuses</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="checked_in">Checked In</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                    <option value="pending">Pending</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            </div>

            {/* Clear */}
            {(filters.search || filters.status) && (
                <button
                    onClick={() => onFilterChange({})}
                    className="px-3 py-2.5 text-xs font-medium text-[var(--text-muted)]
                     hover:text-[var(--text-primary)] transition-colors"
                >
                    Clear filters
                </button>
            )}
        </div>
    );
}

// =============================================================================
// ATTENDEE TABLE
// =============================================================================

function AttendeeTable({
    attendees,
    loading,
    onViewDetail,
    onCancelBooking,
    onCheckIn,
}: {
    attendees: AttendeeRecord[];
    loading: boolean;
    onViewDetail: (a: AttendeeRecord) => void;
    onCancelBooking: (a: AttendeeRecord) => void;
    onCheckIn: (a: AttendeeRecord) => void;
}) {
    if (loading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse h-16 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)]" />
                ))}
            </div>
        );
    }

    if (attendees.length === 0) {
        return (
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-12 text-center">
                <Users size={48} className="mx-auto text-[var(--text-muted)] opacity-30 mb-4" />
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No attendees found</h3>
                <p className="text-sm text-[var(--text-muted)]">
                    Attendee records will appear here when bookings are made
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-[var(--border-default)] bg-[var(--bg-base)]">
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Attendee</th>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Event</th>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Tickets</th>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Amount</th>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Status</th>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Check-in</th>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Date</th>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-default)]">
                        {attendees.map((a) => (
                            <tr key={a.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500
                                    flex items-center justify-center text-white text-xs font-bold">
                                            {a.userName?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-[var(--text-primary)] text-sm">{a.userName || 'Unknown'}</p>
                                            <p className="text-xs text-[var(--text-muted)]">{a.userEmail}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    <p className="text-sm text-[var(--text-primary)] max-w-[200px] truncate">{a.eventTitle}</p>
                                    {a.ticketTier && <p className="text-xs text-[var(--text-muted)]">{a.ticketTier}</p>}
                                </td>
                                <td className="px-5 py-4 text-sm text-[var(--text-primary)] tabular-nums">{a.ticketCount}</td>
                                <td className="px-5 py-4 text-sm font-medium text-[var(--text-primary)] tabular-nums">
                                    {formatCurrency(a.totalAmount)}
                                </td>
                                <td className="px-5 py-4">
                                    <StatusBadge status={a.status} size="sm" />
                                </td>
                                <td className="px-5 py-4">
                                    {a.status === 'checked_in' || a.checkedInAt ? (
                                        <span className="flex items-center gap-1 text-emerald-400 text-xs">
                                            <CheckCircle2 size={14} /> Checked In
                                        </span>
                                    ) : (
                                        <span className="text-xs text-[var(--text-muted)]">—</span>
                                    )}
                                </td>
                                <td className="px-5 py-4 text-xs text-[var(--text-muted)]">
                                    {a.createdAt?.toDate ? formatDate(a.createdAt.toDate()) : '—'}
                                </td>
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => onViewDetail(a)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors" title="View Details">
                                            <Eye size={15} />
                                        </button>
                                        {a.status === 'confirmed' && (
                                            <button onClick={() => onCheckIn(a)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="Manual Check-in">
                                                <TicketCheck size={15} />
                                            </button>
                                        )}
                                        {(a.status === 'confirmed' || a.status === 'pending') && (
                                            <button onClick={() => onCancelBooking(a)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Cancel Booking">
                                                <XCircle size={15} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function AttendeeManagementPage() {
    const user = useAuthStore((s) => s.user);
    const [attendees, setAttendees] = useState<AttendeeRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<AttendeeFilters>({});
    const [selectedAttendee, setSelectedAttendee] = useState<AttendeeRecord | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelTarget, setCancelTarget] = useState<AttendeeRecord | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const handleFilterChange = useCallback((newFilters: AttendeeFilters) => {
        setFilters(newFilters);
    }, []);

    useEffect(() => {
        const unsub = subscribeToAttendees(filters, (data) => {
            setAttendees(data);
            setLoading(false);
        });
        return () => unsub();
    }, [filters]);

    const handleViewDetail = useCallback((a: AttendeeRecord) => {
        setSelectedAttendee(a);
        setDrawerOpen(true);
    }, []);

    const handleCancelBooking = useCallback((a: AttendeeRecord) => {
        setCancelTarget(a);
        setCancelModalOpen(true);
    }, []);

    const confirmCancel = useCallback(async () => {
        if (!cancelTarget || !user) return;
        setActionLoading(true);
        await cancelBooking(cancelTarget.id, user.uid, user.email || '');
        setActionLoading(false);
        setCancelModalOpen(false);
        setCancelTarget(null);
    }, [cancelTarget, user]);

    const handleCheckIn = useCallback(async (a: AttendeeRecord) => {
        if (!user) return;
        await manualCheckIn(a.id, user.uid, user.email || '');
    }, [user]);

    // Stats
    const totalBooked = attendees.length;
    const checkedIn = attendees.filter((a) => a.status === 'checked_in' || a.checkedInAt).length;
    const totalRevenue = attendees.reduce((sum, a) => sum + a.totalAmount, 0);

    return (
        <div className="min-h-screen">
            <AdminPageHeader
                title="Attendee Management"
                subtitle="View and manage all attendee records, bookings & check-ins"
                breadcrumbs={[
                    { label: 'Admin', href: '/admin' },
                    { label: 'Attendees' },
                ]}
                primaryAction={{
                    label: 'Export CSV',
                    icon: <Download size={16} />,
                    onClick: () => { },
                }}
                badge={totalBooked > 0 ? { count: totalBooked, label: 'Total Bookings', color: 'blue' } : undefined}
            />

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
                        <Users size={20} className="text-blue-400" />
                    </div>
                    <div>
                        <p className="text-xs text-[var(--text-muted)]">Total Bookings</p>
                        <p className="text-lg font-bold text-[var(--text-primary)] tabular-nums">{totalBooked}</p>
                    </div>
                </div>
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                        <CheckCircle2 size={20} className="text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-xs text-[var(--text-muted)]">Checked In</p>
                        <p className="text-lg font-bold text-[var(--text-primary)] tabular-nums">
                            {checkedIn} / {totalBooked}
                        </p>
                    </div>
                </div>
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
                        <CreditCard size={20} className="text-amber-400" />
                    </div>
                    <div>
                        <p className="text-xs text-[var(--text-muted)]">Total Revenue</p>
                        <p className="text-lg font-bold text-[var(--text-primary)] tabular-nums">{formatCurrency(totalRevenue)}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <AttendeeFilterBar filters={filters} onFilterChange={handleFilterChange} />

            {/* Table */}
            <AttendeeTable
                attendees={attendees}
                loading={loading}
                onViewDetail={handleViewDetail}
                onCancelBooking={handleCancelBooking}
                onCheckIn={handleCheckIn}
            />

            {/* Detail Drawer */}
            <DetailDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                title="Booking Details"
                subtitle={selectedAttendee?.userName || ''}
            >
                {selectedAttendee && (
                    <div className="space-y-5">
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Attendee</h3>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500
                                flex items-center justify-center text-white font-bold">
                                    {selectedAttendee.userName?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div>
                                    <p className="font-medium text-[var(--text-primary)]">{selectedAttendee.userName}</p>
                                    <p className="text-sm text-[var(--text-muted)]">{selectedAttendee.userEmail}</p>
                                </div>
                            </div>
                        </div>

                        <hr className="border-[var(--border-default)]" />

                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Event</h3>
                            <p className="text-[var(--text-primary)] font-medium">{selectedAttendee.eventTitle}</p>
                            {selectedAttendee.ticketTier && (
                                <p className="text-sm text-[var(--text-muted)]">Tier: {selectedAttendee.ticketTier}</p>
                            )}
                        </div>

                        <hr className="border-[var(--border-default)]" />

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-[var(--text-muted)]">Tickets</p>
                                <p className="text-lg font-bold text-[var(--text-primary)]">{selectedAttendee.ticketCount}</p>
                            </div>
                            <div>
                                <p className="text-xs text-[var(--text-muted)]">Total Paid</p>
                                <p className="text-lg font-bold text-[var(--text-primary)]">{formatCurrency(selectedAttendee.totalAmount)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-[var(--text-muted)]">Status</p>
                                <StatusBadge status={selectedAttendee.status} />
                            </div>
                            <div>
                                <p className="text-xs text-[var(--text-muted)]">Booking Date</p>
                                <p className="text-sm text-[var(--text-primary)]">
                                    {selectedAttendee.createdAt?.toDate ? formatDate(selectedAttendee.createdAt.toDate()) : '—'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </DetailDrawer>

            {/* Cancel Booking Modal */}
            <ConfirmModal
                isOpen={cancelModalOpen}
                title="Cancel Booking"
                description={`Cancel booking for ${cancelTarget?.userName}? This will notify the attendee.`}
                confirmLabel="Cancel Booking"
                confirmVariant="danger"
                loading={actionLoading}
                onConfirm={confirmCancel}
                onCancel={() => { setCancelModalOpen(false); setCancelTarget(null); }}
            />
        </div>
    );
}
