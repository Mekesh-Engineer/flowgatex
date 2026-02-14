import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Shield,
    UserX,
    UserCheck,
    Eye,
    Edit,
    Trash2,
    Send,
    Download,
    MoreVertical,
    Mail,
    CalendarDays,
    Clock,
    Ticket,
    DollarSign,
    Activity,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { UserRole } from '@/lib/constants';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import Avatar from '@/components/common/Avatar';
import StatsCard from '@/components/common/StatsCard';
import DataTable, { type Column } from '@/components/common/DataTable';
import SearchInput from '@/components/common/SearchInput';
import { Skeleton, SkeletonCard, SkeletonTable } from '@/components/common/Skeleton';

// =============================================================================
// TYPES & MOCK DATA
// =============================================================================

interface PlatformUser {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role: UserRole;
    registeredAt: string;
    lastActive: string;
    totalBookings: number;
    totalSpent: number;
    status: 'active' | 'suspended' | 'deleted';
    phone?: string;
    [key: string]: unknown;
}

const MOCK_USERS: PlatformUser[] = [
    { id: 'u-1', name: 'Alice Johnson', email: 'alice@example.com', avatar: '', role: UserRole.USER, registeredAt: '2025-09-15', lastActive: '2026-01-28', totalBookings: 12, totalSpent: 459.99, status: 'active', phone: '+1 555-0101' },
    { id: 'u-2', name: 'Bob Smith', email: 'bob@example.com', avatar: '', role: UserRole.ORGANIZER, registeredAt: '2025-06-10', lastActive: '2026-01-27', totalBookings: 3, totalSpent: 120.00, status: 'active', phone: '+1 555-0102' },
    { id: 'u-3', name: 'Carol Danvers', email: 'carol@example.com', avatar: '', role: UserRole.ADMIN, registeredAt: '2025-01-05', lastActive: '2026-01-28', totalBookings: 0, totalSpent: 0, status: 'active' },
    { id: 'u-4', name: 'Dave Wilson', email: 'dave@example.com', avatar: '', role: UserRole.USER, registeredAt: '2025-11-22', lastActive: '2026-01-10', totalBookings: 5, totalSpent: 189.50, status: 'suspended' },
    { id: 'u-5', name: 'Eve Martinez', email: 'eve@example.com', avatar: '', role: UserRole.ORGANIZER, registeredAt: '2025-08-03', lastActive: '2025-12-15', totalBookings: 2, totalSpent: 80.00, status: 'active' },
    { id: 'u-6', name: 'Frank Lee', email: 'frank@example.com', avatar: '', role: UserRole.USER, registeredAt: '2025-10-01', lastActive: '2025-11-20', totalBookings: 1, totalSpent: 35.00, status: 'deleted' },
];

const ROLE_BADGE: Record<UserRole, { variant: 'info' | 'success' | 'warning' | 'default'; label: string }> = {
    [UserRole.USER]: { variant: 'info', label: 'User' },
    [UserRole.ORGANIZER]: { variant: 'success', label: 'Organizer' },
    [UserRole.ORG_ADMIN]: { variant: 'success', label: 'Org Admin' },
    [UserRole.ADMIN]: { variant: 'warning', label: 'Admin' },
    [UserRole.SUPER_ADMIN]: { variant: 'default', label: 'Super Admin' },
};

const STATUS_BADGE: Record<string, 'success' | 'error' | 'default'> = { active: 'success', suspended: 'error', deleted: 'default' };

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 22 } } };

// =============================================================================
// ACTION MENU
// =============================================================================
function ActionMenu({ user, onView, onSuspend }: { user: PlatformUser; onView: () => void; onSuspend: () => void }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button onClick={() => setOpen(!open)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors" aria-label="User actions"><MoreVertical size={16} /></button>
            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 top-8 z-50 w-48 rounded-xl bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 shadow-xl overflow-hidden">
                            <button onClick={() => { onView(); setOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700/60"><Eye size={14} /> View Profile</button>
                            <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700/60"><Edit size={14} /> Edit User</button>
                            <button onClick={() => { onSuspend(); setOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700/60">{user.status === 'suspended' ? <><UserCheck size={14} /> Activate</> : <><UserX size={14} /> Suspend</>}</button>
                            <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700/60"><Send size={14} /> Send Message</button>
                            <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700/60"><Activity size={14} /> Activity Log</button>
                            <hr className="border-gray-100 dark:border-neutral-700" />
                            <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 size={14} /> Delete User</button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

// =============================================================================
// COMPONENT
// =============================================================================
export default function UserManagementPage() {
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    useEffect(() => { const t = setTimeout(() => setLoading(false), 600); return () => clearTimeout(t); }, []);

    const filtered = MOCK_USERS.filter(u => {
        if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
        if (roleFilter !== 'all' && u.role !== roleFilter) return false;
        if (statusFilter !== 'all' && u.status !== statusFilter) return false;
        return true;
    });

    const columns: Column<PlatformUser>[] = [
        {
            key: 'name', header: 'User', render: (row) => (
                <div className="flex items-center gap-3">
                    <Avatar name={row.name} size="sm" />
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{row.name}</p>
                        <p className="text-xs text-gray-400">{row.email}</p>
                    </div>
                </div>
            )
        },
        { key: 'role', header: 'Role', width: '110px', render: (row) => { const r = ROLE_BADGE[row.role]; return <Badge variant={r.variant}>{r.label}</Badge>; } },
        { key: 'registeredAt', header: 'Registered', width: '120px', sortable: true, render: (row) => <span className="text-xs text-gray-500 dark:text-neutral-400">{formatDate(row.registeredAt)}</span> },
        { key: 'lastActive', header: 'Last Active', width: '120px', render: (row) => <span className="text-xs text-gray-500 dark:text-neutral-400">{formatDate(row.lastActive)}</span> },
        { key: 'totalBookings', header: 'Bookings', width: '80px', align: 'center', sortable: true },
        { key: 'totalSpent', header: 'Spent', width: '100px', align: 'right', sortable: true, render: (row) => <span className="font-medium">{formatCurrency(row.totalSpent)}</span> },
        { key: 'status', header: 'Status', width: '100px', align: 'center', render: (row) => <Badge variant={STATUS_BADGE[row.status]}>{row.status}</Badge> },
        { key: 'id', header: '', width: '50px', render: (row) => <ActionMenu user={row} onView={() => { setSelectedUser(row); setDetailOpen(true); }} onSuspend={() => { }} /> },
    ];

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-56" rounded="lg" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} className="h-28" />)}</div>
                <SkeletonTable rows={5} cols={6} />
            </div>
        );
    }

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* ── Header ── */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
                    <p className="text-gray-500 dark:text-neutral-400 mt-1">Manage all platform users, roles, and permissions</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost"><Download size={14} className="mr-1.5" /> Export</Button>
                    <Button variant="ghost"><Mail size={14} className="mr-1.5" /> Bulk Email</Button>
                </div>
            </motion.div>

            {/* ── Stats ── */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard label="Total Users" value={MOCK_USERS.length.toString()} icon={<Users size={20} />} />
                <StatsCard label="Active" value={MOCK_USERS.filter(u => u.status === 'active').length.toString()} icon={<UserCheck size={20} />} color="text-green-600 dark:text-green-400" bgColor="bg-green-50 dark:bg-green-500/10" borderColor="border-green-100 dark:border-green-500/20" />
                <StatsCard label="Suspended" value={MOCK_USERS.filter(u => u.status === 'suspended').length.toString()} icon={<UserX size={20} />} color="text-red-600 dark:text-red-400" bgColor="bg-red-50 dark:bg-red-500/10" borderColor="border-red-100 dark:border-red-500/20" />
                <StatsCard label="Organizers" value={MOCK_USERS.filter(u => u.role === UserRole.ORGANIZER).length.toString()} icon={<Shield size={20} />} color="text-violet-600 dark:text-violet-400" bgColor="bg-violet-50 dark:bg-violet-500/10" borderColor="border-violet-100 dark:border-violet-500/20" />
            </motion.div>

            {/* ── Filters ── */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
                <SearchInput placeholder="Search by name or email..." value={search} onChange={setSearch} className="flex-1" />
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" aria-label="Filter by role">
                    <option value="all">All Roles</option>
                    <option value={UserRole.USER}>User</option>
                    <option value={UserRole.ORGANIZER}>Organizer</option>
                    <option value={UserRole.ADMIN}>Admin</option>
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" aria-label="Filter by status">
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="deleted">Deleted</option>
                </select>
            </motion.div>

            {/* ── Table ── */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
                <DataTable<PlatformUser>
                    columns={columns}
                    data={filtered}
                    keyExtractor={(row) => row.id}
                    pageSize={10}
                    emptyMessage="No users match your filters"
                />
            </motion.div>

            {/* ── User Detail Modal ── */}
            <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="User Details" size="lg">
                {selectedUser && (
                    <div className="space-y-6">
                        {/* Profile header */}
                        <div className="flex items-center gap-4">
                            <Avatar name={selectedUser.name} size="xl" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedUser.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-neutral-400">{selectedUser.email}</p>
                                <div className="flex gap-2 mt-2">
                                    <Badge variant={ROLE_BADGE[selectedUser.role].variant}>{ROLE_BADGE[selectedUser.role].label}</Badge>
                                    <Badge variant={STATUS_BADGE[selectedUser.status]}>{selectedUser.status}</Badge>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-neutral-700/40">
                                <p className="text-xs text-gray-500 dark:text-neutral-400 flex items-center gap-1"><CalendarDays size={12} /> Registered</p>
                                <p className="font-semibold text-gray-900 dark:text-white mt-1">{formatDate(selectedUser.registeredAt)}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-neutral-700/40">
                                <p className="text-xs text-gray-500 dark:text-neutral-400 flex items-center gap-1"><Clock size={12} /> Last Active</p>
                                <p className="font-semibold text-gray-900 dark:text-white mt-1">{formatDate(selectedUser.lastActive)}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-neutral-700/40">
                                <p className="text-xs text-gray-500 dark:text-neutral-400 flex items-center gap-1"><Ticket size={12} /> Total Bookings</p>
                                <p className="font-semibold text-gray-900 dark:text-white mt-1">{selectedUser.totalBookings}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-neutral-700/40">
                                <p className="text-xs text-gray-500 dark:text-neutral-400 flex items-center gap-1"><DollarSign size={12} /> Total Spent</p>
                                <p className="font-semibold text-gray-900 dark:text-white mt-1">{formatCurrency(selectedUser.totalSpent)}</p>
                            </div>
                        </div>

                        {/* Role management */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Change Role</label>
                            <select defaultValue={selectedUser.role} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                                <option value={UserRole.USER}>User</option>
                                <option value={UserRole.ORGANIZER}>Organizer</option>
                                <option value={UserRole.ADMIN}>Admin</option>
                            </select>
                        </div>

                        {/* Admin notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Admin Notes</label>
                            <textarea rows={3} placeholder="Internal admin notes..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <Button variant="primary" onClick={() => setDetailOpen(false)}>Save Changes</Button>
                            <Button variant="ghost">{selectedUser.status === 'suspended' ? 'Activate User' : 'Suspend User'}</Button>
                            <Button variant="ghost" className="text-red-600 hover:text-red-700"><Trash2 size={14} className="mr-1" /> Delete</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </motion.div>
    );
}
