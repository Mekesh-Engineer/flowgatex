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
    QrCode,
    Camera,
    MonitorSmartphone,
    ScanLine,
    MoreVertical,
    RefreshCw,
    Eye,
    Unlink,
    AlertTriangle,
    MapPin,
    Clock,
    Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import StatsCard from '@/components/common/StatsCard';
import Modal from '@/components/common/Modal';
import EmptyState from '@/components/common/EmptyState';
import { Skeleton, SkeletonCard } from '@/components/common/Skeleton';
import { DeviceType, DeviceStatus } from '@/lib/constants';

// =============================================================================
// TYPES & MOCK DATA
// =============================================================================

interface IoTDevice {
    id: string;
    name: string;
    type: string;
    status: string;
    event: string;
    location: string;
    lastSync: string;
    battery: number;
    scansToday: number;
    firmware: string;
}

const MOCK_DEVICES: IoTDevice[] = [
    { id: 'DEV-001', name: 'Main Gate Scanner', type: DeviceType.ACCESS_GATE, status: DeviceStatus.ONLINE, event: 'Tech Summit 2026', location: 'Main Entrance', lastSync: '2 min ago', battery: 85, scansToday: 342, firmware: 'v2.4.1' },
    { id: 'DEV-002', name: 'VIP Gate Scanner', type: DeviceType.ACCESS_GATE, status: DeviceStatus.ONLINE, event: 'Tech Summit 2026', location: 'VIP Entrance', lastSync: '1 min ago', battery: 92, scansToday: 87, firmware: 'v2.4.1' },
    { id: 'DEV-003', name: 'Lobby Camera', type: DeviceType.CAMERA, status: DeviceStatus.ONLINE, event: 'Tech Summit 2026', location: 'Lobby', lastSync: '5 min ago', battery: 100, scansToday: 0, firmware: 'v1.8.3' },
    { id: 'DEV-004', name: 'Crowd Sensor A1', type: DeviceType.SENSOR, status: DeviceStatus.OFFLINE, event: 'Jazz Night Live', location: 'Hall A', lastSync: '2 hours ago', battery: 12, scansToday: 0, firmware: 'v3.1.0' },
    { id: 'DEV-005', name: 'Stage Display', type: DeviceType.DISPLAY, status: DeviceStatus.ONLINE, event: 'Tech Summit 2026', location: 'Main Stage', lastSync: '30 sec ago', battery: 100, scansToday: 0, firmware: 'v1.2.0' },
    { id: 'DEV-006', name: 'Exit Gate Scanner', type: DeviceType.ACCESS_GATE, status: DeviceStatus.ERROR, event: 'Tech Summit 2026', location: 'Exit A', lastSync: '30 min ago', battery: 45, scansToday: 128, firmware: 'v2.3.8' },
    { id: 'DEV-007', name: 'Parking Sensor', type: DeviceType.SENSOR, status: DeviceStatus.MAINTENANCE, event: 'Jazz Night Live', location: 'Parking Lot', lastSync: '1 day ago', battery: 0, scansToday: 0, firmware: 'v3.0.5' },
    { id: 'DEV-008', name: 'Info Display', type: DeviceType.DISPLAY, status: DeviceStatus.ONLINE, event: 'Tech Summit 2026', location: 'Foyer', lastSync: '1 min ago', battery: 100, scansToday: 0, firmware: 'v1.2.0' },
];

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
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [addDeviceOpen, setAddDeviceOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<IoTDevice | null>(null);
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);

    useEffect(() => { const t = setTimeout(() => setLoading(false), 600); return () => clearTimeout(t); }, []);

    const filtered = MOCK_DEVICES.filter(d => {
        if (statusFilter !== 'all' && d.status !== statusFilter) return false;
        if (typeFilter !== 'all' && d.type !== typeFilter) return false;
        if (search.trim()) {
            const q = search.toLowerCase();
            if (!d.name.toLowerCase().includes(q) && !d.id.toLowerCase().includes(q) && !d.event.toLowerCase().includes(q)) return false;
        }
        return true;
    });

    const onlineCount = MOCK_DEVICES.filter(d => d.status === DeviceStatus.ONLINE).length;
    const offlineCount = MOCK_DEVICES.filter(d => d.status === DeviceStatus.OFFLINE).length;
    const totalScans = MOCK_DEVICES.reduce((s, d) => s + d.scansToday, 0);
    const errorCount = MOCK_DEVICES.filter(d => d.status === DeviceStatus.ERROR).length;

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" rounded="lg" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} className="h-28" />)}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} className="h-56" />)}</div>
            </div>
        );
    }

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* ── Header ── */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">IoT Devices</h1>
                    <p className="text-gray-500 dark:text-neutral-400 mt-1">Manage smart devices for your events</p>
                </div>
                <Button variant="primary" onClick={() => setAddDeviceOpen(true)}><Plus size={14} className="mr-1.5" /> Add Device</Button>
            </motion.div>

            {/* ── Stats ── */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard label="Online" value={onlineCount} icon={<Wifi size={20} />} color="text-green-600 dark:text-green-400" bgColor="bg-green-50 dark:bg-green-500/10" borderColor="border-green-100 dark:border-green-500/20" />
                <StatsCard label="Offline" value={offlineCount} icon={<WifiOff size={20} />} color="text-red-600 dark:text-red-400" bgColor="bg-red-50 dark:bg-red-500/10" borderColor="border-red-100 dark:border-red-500/20" />
                <StatsCard label="Scans Today" value={totalScans} icon={<QrCode size={20} />} trend="+24% vs yesterday" trendUp />
                <StatsCard label="Errors" value={errorCount} icon={<AlertTriangle size={20} />} color="text-amber-600 dark:text-amber-400" bgColor="bg-amber-50 dark:bg-amber-500/10" borderColor="border-amber-100 dark:border-amber-500/20" />
            </motion.div>

            {/* ── Filters ── */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search devices..." className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white placeholder:text-gray-400" />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500" aria-label="Filter by status">
                    <option value="all">All Status</option>
                    <option value={DeviceStatus.ONLINE}>Online</option>
                    <option value={DeviceStatus.OFFLINE}>Offline</option>
                    <option value={DeviceStatus.ERROR}>Error</option>
                    <option value={DeviceStatus.MAINTENANCE}>Maintenance</option>
                </select>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500" aria-label="Filter by type">
                    <option value="all">All Types</option>
                    <option value={DeviceType.ACCESS_GATE}>Gate</option>
                    <option value={DeviceType.CAMERA}>Camera</option>
                    <option value={DeviceType.SENSOR}>Sensor</option>
                    <option value={DeviceType.DISPLAY}>Display</option>
                </select>
            </motion.div>

            {/* ── Device Cards ── */}
            {filtered.length === 0 ? (
                <EmptyState
                    variant={search ? 'search' : 'default'}
                    title={search ? 'No devices found' : 'No devices yet'}
                    description={search ? 'Try different search terms.' : 'Add your first IoT device to get started.'}
                    action={!search ? <Button variant="primary" onClick={() => setAddDeviceOpen(true)}><Plus size={14} className="mr-1.5" /> Add Device</Button> : undefined}
                />
            ) : (
                <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filtered.map(device => {
                        const sc = statusConfig(device.status);
                        return (
                            <motion.div key={device.id} variants={itemVariants}>
                                <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-sm hover:shadow-lg transition-all p-5 relative">
                                    {/* Status dot */}
                                    <div className={cn('absolute top-4 right-4 w-2.5 h-2.5 rounded-full', sc.dot)} />

                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            'w-12 h-12 rounded-xl flex items-center justify-center',
                                            device.status === DeviceStatus.ONLINE ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400'
                                                : device.status === DeviceStatus.ERROR ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600'
                                                    : 'bg-gray-100 dark:bg-neutral-700 text-gray-400'
                                        )}>
                                            {deviceIcon(device.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 dark:text-white">{device.name}</h3>
                                            <p className="text-xs text-gray-400 font-mono">{device.id}</p>
                                        </div>
                                        <div className="relative">
                                            <button onClick={() => setActionMenuId(actionMenuId === device.id ? null : device.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700" aria-label="More actions"><MoreVertical size={16} className="text-gray-400" /></button>
                                            {actionMenuId === device.id && (
                                                <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-xl z-30 py-1">
                                                    <button onClick={() => { setSelectedDevice(device); setActionMenuId(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700"><Eye size={14} /> View Details</button>
                                                    <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700"><Settings2 size={14} /> Configure</button>
                                                    <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700"><RefreshCw size={14} /> Test Device</button>
                                                    <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700"><Unlink size={14} /> Unlink</button>
                                                    <hr className="my-1 border-gray-100 dark:border-neutral-700" />
                                                    <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 size={14} /> Delete</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-2.5">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={sc.badge}>{sc.label}</Badge>
                                            <Badge variant="default">{device.type.replace('_', ' ')}</Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-neutral-400">
                                            <span className="flex items-center gap-1"><MapPin size={12} /> {device.location}</span>
                                            <span className="flex items-center gap-1"><Clock size={12} /> {device.lastSync}</span>
                                        </div>
                                        <p className="text-xs text-gray-400">Event: {device.event}</p>

                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-neutral-700">
                                            <div className="flex items-center gap-1.5">
                                                {device.battery <= 20 ? <BatteryLow size={14} className="text-red-500" /> : <Battery size={14} className="text-green-500" />}
                                                <span className={cn('text-xs font-medium', device.battery <= 20 ? 'text-red-500' : 'text-gray-600 dark:text-neutral-300')}>{device.battery}%</span>
                                            </div>
                                            {device.scansToday > 0 && (
                                                <span className="text-xs text-gray-500 flex items-center gap-1"><QrCode size={12} /> {device.scansToday} scans</span>
                                            )}
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
                <form onSubmit={(e) => { e.preventDefault(); setAddDeviceOpen(false); }} className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Device ID / Serial</label><input type="text" placeholder="DEV-XXX or serial number" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Device Name</label><input type="text" placeholder="e.g. Main Gate Scanner" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Device Type</label><select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"><option value={DeviceType.ACCESS_GATE}>Access Gate</option><option value={DeviceType.CAMERA}>Camera</option><option value={DeviceType.SENSOR}>Sensor</option><option value={DeviceType.DISPLAY}>Display</option></select></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Assign to Event</label><select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"><option>Tech Summit 2026</option><option>Jazz Night Live</option><option>AI Conference</option></select></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Location</label><input type="text" placeholder="e.g. Main Entrance" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    <div className="flex gap-3 pt-2">
                        <Button type="submit" variant="primary" className="flex-1"><Zap size={14} className="mr-1.5" /> Pair Device</Button>
                        <Button type="button" variant="ghost" onClick={() => setAddDeviceOpen(false)}>Cancel</Button>
                    </div>
                </form>
            </Modal>

            {/* ── Device Details Modal ── */}
            <Modal isOpen={!!selectedDevice} onClose={() => setSelectedDevice(null)} title="Device Details" size="lg">
                {selectedDevice && (
                    <div className="space-y-5">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400">{deviceIcon(selectedDevice.type)}</div>
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{selectedDevice.name}</h3>
                                <p className="text-xs text-gray-400 font-mono">{selectedDevice.id} • Firmware {selectedDevice.firmware}</p>
                            </div>
                            <Badge variant={statusConfig(selectedDevice.status).badge} className="ml-auto">{statusConfig(selectedDevice.status).label}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-neutral-700/40 rounded-xl p-4 text-sm">
                            <div><p className="text-gray-400 text-xs mb-1">Type</p><p className="font-medium text-gray-900 dark:text-white capitalize">{selectedDevice.type.replace('_', ' ')}</p></div>
                            <div><p className="text-gray-400 text-xs mb-1">Event</p><p className="font-medium text-gray-900 dark:text-white">{selectedDevice.event}</p></div>
                            <div><p className="text-gray-400 text-xs mb-1">Location</p><p className="font-medium text-gray-900 dark:text-white">{selectedDevice.location}</p></div>
                            <div><p className="text-gray-400 text-xs mb-1">Last Sync</p><p className="font-medium text-gray-900 dark:text-white">{selectedDevice.lastSync}</p></div>
                            <div><p className="text-gray-400 text-xs mb-1">Battery</p><p className="font-medium text-gray-900 dark:text-white">{selectedDevice.battery}%</p></div>
                            <div><p className="text-gray-400 text-xs mb-1">Scans Today</p><p className="font-medium text-gray-900 dark:text-white">{selectedDevice.scansToday}</p></div>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="primary" className="flex-1"><Settings2 size={14} className="mr-1.5" /> Configure</Button>
                            <Button variant="ghost" className="flex-1"><Activity size={14} className="mr-1.5" /> View Logs</Button>
                            <Button variant="ghost" className="flex-1"><RefreshCw size={14} className="mr-1.5" /> Test</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </motion.div>
    );
}
