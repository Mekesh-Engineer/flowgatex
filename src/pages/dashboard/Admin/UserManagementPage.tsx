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
    Download,
    MoreVertical,
    AlertTriangle
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { UserRole } from '@/lib/constants';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import Avatar from '@/components/common/Avatar';
import StatsCard from '@/components/common/StatsCard';
import DataTable, { type Column } from '@/components/common/DataTable';
import SearchInput from '@/components/common/SearchInput';
import { Skeleton, SkeletonCard, SkeletonTable } from '@/components/common/Skeleton';
import { getAllUsers, updateUserRole, updateAccountStatus } from '@/services/userService';
import type { FirestoreUser, AccountStatus } from '@/types/rbac.types';
import { logger } from '@/lib/logger';
import { useAuth } from '@/features/auth/hooks/useAuth';

// =============================================================================
// HELPER MAPS
// =============================================================================

const ROLE_BADGE: Record<string, { variant: 'info' | 'success' | 'warning' | 'default'; label: string }> = {
    [UserRole.USER]: { variant: 'info', label: 'User' },
    [UserRole.ORGANIZER]: { variant: 'success', label: 'Organizer' },
    [UserRole.ORG_ADMIN]: { variant: 'success', label: 'Org Admin' },
    [UserRole.ADMIN]: { variant: 'warning', label: 'Admin' },
    [UserRole.SUPER_ADMIN]: { variant: 'default', label: 'Super Admin' },
};

const STATUS_BADGE: Record<string, 'success' | 'error' | 'default'> = { 
    active: 'success', 
    suspended: 'error', 
    deleted: 'default' 
};

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 22 } } };

// =============================================================================
// ACTION MENU
// =============================================================================
function ActionMenu({ user, onView, onStatusChange, onDelete, canEdit, canDelete }: { 
    user: FirestoreUser; 
    onView: () => void; 
    onStatusChange: (status: AccountStatus) => void;
    onDelete: () => void;
    canEdit: boolean;
    canDelete: boolean;
}) {
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
                            
                            {canEdit && (
                                <>
                                    <button onClick={() => setOpen(false)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700/60"><Edit size={14} /> Edit User</button>
                                    <button 
                                        onClick={() => { onStatusChange(user.accountStatus === 'suspended' ? 'active' : 'suspended'); setOpen(false); }} 
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700/60"
                                    >
                                        {user.accountStatus === 'suspended' ? <><UserCheck size={14} /> Activate</> : <><UserX size={14} /> Suspend</>}
                                    </button>
                                </>
                            )}
                            
                            <hr className="border-gray-100 dark:border-neutral-700" />
                            
                            {canDelete && (
                                <button onClick={() => { onDelete(); setOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 size={14} /> Delete User</button>
                            )}
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
    const { user: currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<FirestoreUser[]>([]);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedUser, setSelectedUser] = useState<FirestoreUser | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Permissions
    const canEdit = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.SUPER_ADMIN;
    const canDelete = currentUser?.role === UserRole.SUPER_ADMIN;

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getAllUsers();
            setUsers(data);
        } catch (error) {
            logger.error('Failed to load users', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRoleUpdate = async (uid: string, newRole: string) => {
        if (!canEdit) return;
        setActionLoading(true);
        try {
            await updateUserRole(uid, newRole);
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole as any } : u));
            logger.log('Role updated');
        } catch (error) {
            logger.error('Failed to update role', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleStatusUpdate = async (uid: string, newStatus: AccountStatus) => {
        if (!canEdit) return;
        setActionLoading(true);
        try {
            await updateAccountStatus(uid, newStatus);
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, accountStatus: newStatus } : u));
            if (selectedUser?.uid === uid) {
                setSelectedUser(prev => prev ? { ...prev, accountStatus: newStatus } : null);
            }
        } catch (error) {
            logger.error('Failed to update status', error);
        } finally {
            setActionLoading(false);
        }
    };

    const filtered = users.filter(u => {
        const matchesSearch = !search || 
            (u.profile.fullName?.toLowerCase().includes(search.toLowerCase()) ?? false) || 
            (u.profile.email?.toLowerCase().includes(search.toLowerCase()) ?? false);
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        const matchesStatus = statusFilter === 'all' || u.accountStatus === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
    });

    const columns: Column<FirestoreUser>[] = [
        {
            key: 'profile', header: 'User', render: (row) => (
                <div className="flex items-center gap-3">
                    <Avatar name={row.profile.fullName || row.displayName || 'User'} src={row.profile.avatarUrl || row.photoURL || undefined} size="sm" />
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{row.profile.fullName || row.displayName || 'Unknown'}</p>
                        <p className="text-xs text-gray-400">{row.profile.email || row.email}</p>
                    </div>
                </div>
            )
        },
        { key: 'role', header: 'Role', width: '110px', render: (row) => { const r = ROLE_BADGE[row.role] || ROLE_BADGE['user']; return <Badge variant={r.variant}>{r.label}</Badge>; } },
        { key: 'createdAt', header: 'Registered', width: '120px', sortable: true, render: (row) => <span className="text-xs text-gray-500 dark:text-neutral-400">{typeof row.createdAt === 'string' ? formatDate(row.createdAt) : 'Recently'}</span> },
        { key: 'accountStatus', header: 'Status', width: '100px', align: 'center', render: (row) => <Badge variant={STATUS_BADGE[row.accountStatus] || 'default'}>{row.accountStatus}</Badge> },
        { 
            key: 'uid', header: '', width: '50px', render: (row) => (
                <ActionMenu 
                    user={row} 
                    onView={() => { setSelectedUser(row); setDetailOpen(true); }} 
                    onStatusChange={(s) => handleStatusUpdate(row.uid, s)}
                    onDelete={() => handleStatusUpdate(row.uid, 'deleted')} // Soft delete
                    canEdit={canEdit}
                    canDelete={canDelete}
                />
            ) 
        },
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
                </div>
            </motion.div>

            {/* ── Stats ── */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard label="Total Users" value={users.length.toString()} icon={<Users size={20} />} />
                <StatsCard label="Active" value={users.filter(u => u.accountStatus === 'active').length.toString()} icon={<UserCheck size={20} />} color="text-green-600 dark:text-green-400" bgColor="bg-green-50 dark:bg-green-500/10" borderColor="border-green-100 dark:border-green-500/20" />
                <StatsCard label="Suspended" value={users.filter(u => u.accountStatus === 'suspended').length.toString()} icon={<UserX size={20} />} color="text-red-600 dark:text-red-400" bgColor="bg-red-50 dark:bg-red-500/10" borderColor="border-red-100 dark:border-red-500/20" />
                <StatsCard label="Organizers" value={users.filter(u => u.role === UserRole.ORGANIZER).length.toString()} icon={<Shield size={20} />} color="text-violet-600 dark:text-violet-400" bgColor="bg-violet-50 dark:bg-violet-500/10" borderColor="border-violet-100 dark:border-violet-500/20" />
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
                <DataTable<FirestoreUser>
                    columns={columns}
                    data={filtered}
                    keyExtractor={(row) => row.uid}
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
                            <Avatar name={selectedUser.profile.fullName || selectedUser.displayName || 'User'} src={selectedUser.profile.avatarUrl || selectedUser.photoURL || undefined} size="xl" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedUser.profile.fullName || selectedUser.displayName}</h3>
                                <p className="text-sm text-gray-500 dark:text-neutral-400">{selectedUser.profile.email || selectedUser.email}</p>
                                <div className="flex gap-2 mt-2">
                                    <Badge variant={ROLE_BADGE[selectedUser.role]?.variant}>{ROLE_BADGE[selectedUser.role]?.label}</Badge>
                                    <Badge variant={STATUS_BADGE[selectedUser.accountStatus]}>{selectedUser.accountStatus}</Badge>
                                </div>
                            </div>
                        </div>

                        {/* Role management */}
                        {canEdit && (
                            <div className="p-4 bg-gray-50 dark:bg-neutral-700/30 rounded-xl border border-gray-100 dark:border-neutral-700">
                                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Change Role</label>
                                <div className="flex gap-3">
                                    <select 
                                        value={selectedUser.role} 
                                        onChange={(e) => handleRoleUpdate(selectedUser.uid, e.target.value)}
                                        disabled={actionLoading || !canEdit}
                                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                                    >
                                        <option value={UserRole.USER}>User</option>
                                        <option value={UserRole.ORGANIZER}>Organizer</option>
                                        <option value={UserRole.ORG_ADMIN}>Org Admin</option>
                                        <option value={UserRole.ADMIN}>Admin</option>
                                        {currentUser?.role === UserRole.SUPER_ADMIN && <option value={UserRole.SUPER_ADMIN}>Super Admin</option>}
                                    </select>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                    <AlertTriangle size={12} />
                                    Changing role will update user permissions immediately.
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        {canEdit && (
                            <div className="flex gap-3 pt-2">
                                <Button 
                                    variant="primary" 
                                    onClick={() => setDetailOpen(false)}
                                >
                                    Done
                                </Button>
                                <Button 
                                    variant="ghost"
                                    className={selectedUser.accountStatus === 'suspended' ? "bg-green-600 hover:bg-green-700 text-white" : "text-amber-600 hover:text-amber-700 border-amber-200 hover:bg-amber-50"}
                                    onClick={() => handleStatusUpdate(selectedUser.uid, selectedUser.accountStatus === 'suspended' ? 'active' : 'suspended')}
                                    isLoading={actionLoading}
                                >
                                    {selectedUser.accountStatus === 'suspended' ? 'Activate User' : 'Suspend User'}
                                </Button>
                                {canDelete && (
                                    <Button 
                                        variant="ghost" 
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => { handleStatusUpdate(selectedUser.uid, 'deleted'); setDetailOpen(false); }}
                                    >
                                        <Trash2 size={14} className="mr-1" /> Delete
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </motion.div>
    );
}

