import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Plus,
    Search,
    Wifi,
    WifiOff,
    Battery,
    BatteryLow,
    Settings2,
    Trash2,
    Activity,
    Camera,
    MonitorSmartphone,
    ScanLine,
    MoreVertical,
    RefreshCw,
    Eye,
    AlertTriangle,
    MapPin,
    Clock,
    Zap,
    Cpu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import StatsCard from '@/components/common/StatsCard';
import Modal from '@/components/common/Modal';
import EmptyState from '@/components/common/EmptyState';
import { SkeletonCard } from '@/components/common/Skeleton';
import { Tabs, TabItem } from '@/components/common/Tabs';
import { DeviceType, DeviceStatus } from '@/lib/constants';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { db } from '@/lib/firebase';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    deleteDoc,
    updateDoc,
    doc,
    serverTimestamp,
    Firestore
} from 'firebase/firestore';
import { showSuccess, showError } from '@/components/common/Toast';
import Gateway from './Gateway';

// =============================================================================
// TYPES
// =============================================================================

export interface IoTDevice {
    id: string; // Firestore Doc ID
    name: string;
    type: string; // DeviceType
    status: string; // DeviceStatus
    event: string;
    location: string;
    lastSync: string;
    battery: number;
    scansToday: number;
    firmware: string;
    ownerId: string;
    serialNumber?: string;
    lastKnownIp?: string;
    createdAt?: { toMillis?: () => number } | string | unknown;
}

const deviceIcon = (type: string) => {
    switch (type) {
        case DeviceType.ACCESS_GATE: return <ScanLine size={20} />;
        case DeviceType.CAMERA: return <Camera size={20} />;
        case DeviceType.SENSOR: return <Activity size={20} />;
        case DeviceType.DISPLAY: return <MonitorSmartphone size={20} />;
        default: return <Zap size={20} />;
    }
};

const statusConfig = (status: string) => {
    switch (status) {
        case DeviceStatus.ONLINE: return { label: 'Online', color: 'bg-green-500', badge: 'success' as const, dot: 'bg-green-500 animate-pulse' };
        case DeviceStatus.OFFLINE: return { label: 'Offline', color: 'bg-red-500', badge: 'error' as const, dot: 'bg-red-500' };
        case DeviceStatus.ERROR: return { label: 'Error', color: 'bg-amber-500', badge: 'warning' as const, dot: 'bg-amber-500 animate-pulse' };
        case DeviceStatus.MAINTENANCE: return { label: 'Maintenance', color: 'bg-blue-500', badge: 'info' as const, dot: 'bg-blue-500' };
        default: return { label: status, color: 'bg-gray-500', badge: 'default' as const, dot: 'bg-gray-500' };
    }
};

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 22 } } };

// =============================================================================
// COMPONENT
// =============================================================================

export default function IoTDevicesPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [devices, setDevices] = useState<IoTDevice[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [addDeviceOpen, setAddDeviceOpen] = useState(false);

    // Add Device Form State
    const [newDevice, setNewDevice] = useState({
        name: '',
        type: DeviceType.ACCESS_GATE as string,
        event: '',
        location: '',
        serialNumber: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const [selectedDevice, setSelectedDevice] = useState<IoTDevice | null>(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);

    // ── Fetch Devices ──
    useEffect(() => {
        if (authLoading) return; // Wait for auth to finish resolving

        if (!user) {
            setLoading(false);
            return;
        }

        let unsubscribe: (() => void) | null = null;
        let isSetup = true;

        try {
            setLoading(true);
            const firestoreDb = db as Firestore;
            if (!firestoreDb) {
                setLoading(false);
                return;
            }

            const q = query(
                collection(firestoreDb, 'iot_devices'),
                where('organizerId', '==', user.uid)
            );

            unsubscribe = onSnapshot(q, (snapshot) => {
                if (!isSetup) return;
                const fetchedDevices: IoTDevice[] = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        name: data.name || 'Unnamed Device',
                        type: data.type || DeviceType.ACCESS_GATE,
                        status: data.status || DeviceStatus.OFFLINE,
                        event: data.event || 'Unassigned',
                        location: data.location || 'Unknown',
                        lastSync: data.lastSync ? (data.lastSync.toDate ? data.lastSync.toDate().toLocaleString() : data.lastSync) : 'Never',
                        battery: data.battery ?? 0,
                        scansToday: data.scansToday ?? 0,
                        firmware: data.firmware || 'v1.0.0',
                        ownerId: data.organizerId || data.ownerId,
                        serialNumber: data.serialNumber,
                        lastKnownIp: data.ipAddress || data.lastKnownIp,
                        createdAt: data.createdAt
                    };
                });

                // Client-side sort safely handling dates
                fetchedDevices.sort((a, b) => {
                    const timeA = (a.createdAt as { toMillis?: () => number })?.toMillis ? (a.createdAt as { toMillis?: () => number }).toMillis!() : 0;
                    const timeB = (b.createdAt as { toMillis?: () => number })?.toMillis ? (b.createdAt as { toMillis?: () => number }).toMillis!() : 0;
                    return timeB - timeA;
                });

                setDevices(fetchedDevices);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching devices:", error);
                if (isSetup) setLoading(false);
            });

            // Failsafe timeout in case Firestore hangs or is blocked
            setTimeout(() => {
                if (isSetup) setLoading(false);
            }, 6000); // Increased timeout to 6s to account for slower networks

        } catch (error) {
            console.error("Synchronous error during query setup:", error);
            setLoading(false);
        }

        return () => {
            isSetup = false;
            if (unsubscribe) unsubscribe();
        };
    }, [user, authLoading]);

    // ── Create Device ──
    const handleAddDevice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSubmitting(true);

        try {
            const firestoreDb = db as Firestore;
            await addDoc(collection(firestoreDb, 'iot_devices'), {
                ...newDevice,
                organizerId: user.uid,
                status: DeviceStatus.OFFLINE,
                battery: 100,
                scansToday: 0,
                firmware: 'v1.0.0',
                createdAt: serverTimestamp(),
                lastSync: null
            });
            showSuccess('Device added successfully');
            setAddDeviceOpen(false);
            setNewDevice({ name: '', type: DeviceType.ACCESS_GATE, event: '', location: '', serialNumber: '' });
        } catch (error) {
            console.error("Error adding device:", error);
            showError('Failed to add device');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Delete Device ──
    const handleDeleteDevice = async (id: string) => {
        if (!confirm('Are you sure you want to remove this device?')) return;
        try {
            const firestoreDb = db as Firestore;
            await deleteDoc(doc(firestoreDb, 'iot_devices', id));
            showSuccess('Device removed');
            if (selectedDevice?.id === id) setSelectedDevice(null);
            setActionMenuId(null);
        } catch (error) {
            console.error("Error deleting device:", error);
            showError('Failed to remove device');
        }
    };

    const handleDeviceConnected = async (ip: string) => {
        if (!selectedDevice) return;
        try {
            const firestoreDb = db as Firestore;
            await updateDoc(doc(firestoreDb, 'iot_devices', selectedDevice.id), {
                status: DeviceStatus.ONLINE,
                lastKnownIp: ip,
                lastSync: serverTimestamp()
            });
            showSuccess(`Device connected at ${ip}`);
        } catch (error) {
            console.error("Error updating device status:", error);
            // Non-blocking error
            showSuccess(`Device connected at ${ip}`);
        }
    };

    // ── Filtering ──
    const filteredDevices = devices.filter(device => {
        const matchesSearch = device.name.toLowerCase().includes(search.toLowerCase()) ||
            device.location.toLowerCase().includes(search.toLowerCase()) ||
            device.serialNumber?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || device.status === statusFilter;
        const matchesType = typeFilter === 'all' || device.type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
    });

    const onlineCount = devices.filter(d => d.status === DeviceStatus.ONLINE).length;
    const offlineCount = devices.filter(d => d.status === DeviceStatus.OFFLINE).length;
    const errorCount = devices.filter(d => d.status === DeviceStatus.ERROR).length;

    // Tabs
    const detailTabs: TabItem[] = [
        { id: 'overview', label: 'Overview', icon: <Activity size={16} /> },
        { id: 'gateway', label: 'Connection', icon: <Cpu size={16} /> },
        { id: 'logs', label: 'Logs', icon: <MonitorSmartphone size={16} />, disabled: true },
    ];

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* ── Header ── */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">IoT Fleet</h1>
                    <p className="text-gray-500 dark:text-neutral-400 mt-1">Manage smart devices for your events</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="hidden sm:flex" onClick={() => { }}><RefreshCw size={16} className="mr-2" /> Sync</Button>
                    <Button variant="primary" onClick={() => setAddDeviceOpen(true)}><Plus size={16} className="mr-1.5" /> Add Device</Button>
                </div>
            </motion.div>

            {/* ── Stats ── */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard label="Devices" value={devices.length.toString()} icon={<Cpu size={20} />} trend="+2 new" trendUp={true} color="blue" />
                <StatsCard label="Online" value={onlineCount.toString()} icon={<Wifi size={20} />} trend="Active" trendUp={true} color="green" />
                <StatsCard label="Offline" value={offlineCount.toString()} icon={<WifiOff size={20} />} trend="Inactive" trendUp={false} color="gray" />
                <StatsCard label="Issues" value={errorCount.toString()} icon={<AlertTriangle size={20} />} trend="Errors" trendUp={false} color="red" />
            </motion.div>

            {/* ── Filters ── */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3 bg-white dark:bg-neutral-800/50 p-4 rounded-xl border border-gray-100 dark:border-neutral-700/50 shadow-sm backdrop-blur-sm">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search devices..." className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-700/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white placeholder:text-gray-400" />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-700/50 text-sm text-gray-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="all">All Status</option>
                    <option value={DeviceStatus.ONLINE}>Online</option>
                    <option value={DeviceStatus.OFFLINE}>Offline</option>
                    <option value={DeviceStatus.ERROR}>Error</option>
                    <option value={DeviceStatus.MAINTENANCE}>Maintenance</option>
                </select>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-700/50 text-sm text-gray-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="all">All Types</option>
                    <option value={DeviceType.ACCESS_GATE}>Gate</option>
                    <option value={DeviceType.CAMERA}>Camera</option>
                    <option value={DeviceType.SENSOR}>Sensor</option>
                    <option value={DeviceType.DISPLAY}>Display</option>
                </select>
            </motion.div>

            {/* ── Device Grid ── */}
            {authLoading || loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <SkeletonCard key={i} className="h-48" />)}
                </div>
            ) : filteredDevices.length === 0 ? (
                <EmptyState
                    title={search || statusFilter !== 'all' ? "No devices found" : "No devices yet"}
                    description={search || statusFilter !== 'all' ? "Try adjusting your filters" : "Add your first IoT device to get started"}
                    icon={<Cpu size={48} />}
                    action={search || statusFilter !== 'all' ? undefined : <Button variant="primary" onClick={() => setAddDeviceOpen(true)}>Add Device</Button>}
                />
            ) : (
                <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredDevices.map((device, index) => {
                        const sc = statusConfig(device.status);
                        return (
                            <motion.div key={`${device.id}-${index}`} variants={itemVariants} layoutId={`${device.id}-${index}`} className="group relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-purple-600/5 rounded-2xl transform transition-transform group-hover:scale-[1.02] duration-300" />
                                <div className="relative bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("p-2.5 rounded-xl transition-colors duration-300", device.status === DeviceStatus.ONLINE ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-gray-50 dark:bg-neutral-700 text-gray-500 dark:text-neutral-400')}>
                                                {deviceIcon(device.type)}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-gray-900 dark:text-white truncate">{device.name}</h3>
                                                <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">{device.serialNumber || device.id}</p>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <button onClick={() => setActionMenuId(actionMenuId === device.id ? null : device.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg text-gray-400 relative z-10 transition-colors">
                                                <MoreVertical size={16} />
                                            </button>

                                            {actionMenuId === device.id && (
                                                <>
                                                    <div className="fixed inset-0 z-20" onClick={() => setActionMenuId(null)} />
                                                    <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-xl z-30 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                                        <button
                                                            onClick={() => { setSelectedDevice(device); setActiveTab('overview'); setActionMenuId(null); }}
                                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700 text-left transition-colors"
                                                        >
                                                            <Eye size={14} className="text-gray-400" /> View Details
                                                        </button>
                                                        <button
                                                            onClick={() => { setSelectedDevice(device); setActiveTab('gateway'); setActionMenuId(null); }}
                                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700 text-left transition-colors"
                                                        >
                                                            <Settings2 size={14} className="text-gray-400" /> Configure
                                                        </button>
                                                        <hr className="my-1 border-gray-100 dark:border-neutral-700" />
                                                        <button
                                                            onClick={() => handleDeleteDevice(device.id)}
                                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 text-left transition-colors"
                                                        >
                                                            <Trash2 size={14} /> Delete
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={sc.badge as "default" | "success" | "warning" | "error" | "info" | "primary"} className="pl-1.5 pr-2.5 py-0.5">
                                                <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", sc.dot)} />
                                                {sc.label}
                                            </Badge>
                                            <Badge variant="default" className="text-xs uppercase tracking-wider">{device.type.replace('_', ' ')}</Badge>
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-neutral-400 pt-1">
                                            <span className="flex items-center gap-1.5"><MapPin size={12} /> {device.location}</span>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-neutral-700/50">
                                            <div className="flex items-center gap-1.5" title="Battery Level">
                                                {device.battery <= 20 ? <BatteryLow size={14} className="text-red-500" /> : <Battery size={14} className="text-green-500" />}
                                                <span className={cn('text-xs font-medium', device.battery <= 20 ? 'text-red-500' : 'text-gray-600 dark:text-neutral-300')}>{device.battery}%</span>
                                            </div>
                                            <span className="text-xs text-gray-400 flex items-center gap-1" title="Last Sync">
                                                <Clock size={12} /> {device.lastSync}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}

            {/* ── Add Device Modal ── */}
            <Modal isOpen={addDeviceOpen} onClose={() => setAddDeviceOpen(false)} title="Add Device" size="md">
                <form onSubmit={handleAddDevice} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Device Name</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Main Gate Scanner"
                            value={newDevice.name}
                            onChange={e => setNewDevice({ ...newDevice, name: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Serial Number / ID</label>
                        <input
                            type="text"
                            placeholder="e.g. SN-2026-X99"
                            value={newDevice.serialNumber}
                            onChange={e => setNewDevice({ ...newDevice, serialNumber: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Device Type</label>
                            <select
                                value={newDevice.type}
                                onChange={e => setNewDevice({ ...newDevice, type: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                            >
                                <option value={DeviceType.ACCESS_GATE}>Access Gate</option>
                                <option value={DeviceType.CAMERA}>Camera</option>
                                <option value={DeviceType.SENSOR}>Sensor</option>
                                <option value={DeviceType.DISPLAY}>Display</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Location</label>
                            <input
                                type="text"
                                placeholder="e.g. Entrance"
                                value={newDevice.location}
                                onChange={e => setNewDevice({ ...newDevice, location: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Assign to Event (Optional)</label>
                        <input
                            type="text"
                            placeholder="Event Name"
                            value={newDevice.event}
                            onChange={e => setNewDevice({ ...newDevice, event: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="submit" variant="primary" disabled={submitting} className="flex-1">
                            {submitting ? 'Adding...' : <><Plus size={16} className="mr-1.5" /> Add Device</>}
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setAddDeviceOpen(false)}>Cancel</Button>
                    </div>
                </form>
            </Modal>

            {/* ── Device Details Modal ── */}
            <Modal isOpen={!!selectedDevice} onClose={() => setSelectedDevice(null)} title="Device Details" size="xl">
                {selectedDevice && (
                    <div className="flex flex-col h-[70vh]">
                        {/* Header Section of Modal */}
                        <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-100 dark:border-neutral-700">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400">
                                    {deviceIcon(selectedDevice.type)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-gray-900 dark:text-white">{selectedDevice.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="default" className="font-mono text-xs">{selectedDevice.serialNumber || selectedDevice.id}</Badge>
                                        <Badge variant={statusConfig(selectedDevice.status).badge as "default" | "success" | "warning" | "error" | "info" | "primary"}>{statusConfig(selectedDevice.status).label}</Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="mb-6">
                            <Tabs items={detailTabs} activeTab={activeTab} onChange={setActiveTab} variant="underline" />
                        </div>

                        {/* Content Area - Scrollable */}
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {activeTab === 'overview' && (
                                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-xl">
                                            <p className="text-gray-400 text-xs mb-1">Type</p>
                                            <p className="font-medium text-gray-900 dark:text-white capitalize">{selectedDevice.type.replace('_', ' ')}</p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-xl">
                                            <p className="text-gray-400 text-xs mb-1">Location</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{selectedDevice.location}</p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-xl">
                                            <p className="text-gray-400 text-xs mb-1">Battery</p>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                                    <div className={cn("h-full rounded-full", selectedDevice.battery <= 20 ? 'bg-red-500' : 'bg-green-500')} style={{ width: `${selectedDevice.battery}%` }} />
                                                </div>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedDevice.battery}%</span>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-xl">
                                            <p className="text-gray-400 text-xs mb-1">Firmware</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{selectedDevice.firmware}</p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-xl">
                                            <p className="text-gray-400 text-xs mb-1">Last Sync</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{selectedDevice.lastSync}</p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-xl">
                                            <p className="text-gray-400 text-xs mb-1">Event</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{selectedDevice.event || 'None'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <Button variant="primary" onClick={() => setActiveTab('gateway')} className="flex-1">
                                            <Zap size={16} className="mr-2" /> Connect & Manage
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'gateway' && (
                                <div className="h-full animate-in slide-in-from-bottom-2 duration-300">
                                    <Gateway
                                        device={selectedDevice}
                                        onConnected={handleDeviceConnected}
                                        onDisconnected={() => { }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </motion.div>
    );
}
