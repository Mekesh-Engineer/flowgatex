// =============================================================================
// GatewayPage.tsx — Standalone page wrapper for Gateway component
// =============================================================================
// When accessed via /organizer/gateway, this page provides its own device
// selection UI since Gateway.tsx requires a `device` prop. It lists discovered
// IoT devices and lets the organizer pick one to connect.
// =============================================================================

import { useState, useEffect, useCallback, ComponentProps } from 'react';
import { motion } from 'framer-motion';
import {
    Cpu,
    Wifi,
    WifiOff,
    RefreshCw,
    ChevronRight,
    Router,
    Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Gateway from './Gateway';
import type { IoTDevice } from '@/features/iot/types/iot.types';
import { collection, getDocs, query, where, Firestore } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 22 } },
};

export default function GatewayPage() {
    const [devices, setDevices] = useState<IoTDevice[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<IoTDevice | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch IoT devices from Firestore
    const fetchDevices = useCallback(async () => {
        setLoading(true);
        try {
            const firestoreDb = db as Firestore;
            const q = query(collection(firestoreDb, 'iot_devices'), where('type', '==', 'access_gate'));
            const snapshot = await getDocs(q);
            const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as IoTDevice));

            // Also try fetching camera-type devices
            const q2 = query(collection(firestoreDb, 'iot_devices'), where('type', '==', 'camera'));
            const snapshot2 = await getDocs(q2);
            const cameras = snapshot2.docs.map((doc) => ({ id: doc.id, ...doc.data() } as IoTDevice));

            setDevices([...list, ...cameras]);
        } catch {
            // If Firestore fails, show demo device
            setDevices([
                {
                    id: 'esp32_001',
                    name: 'FlowGateX-ESP32',
                    type: 'access_gate' as string,
                    status: 'offline',
                    eventId: '',
                    location: 'Main Gate',
                    organizerId: '',
                    ipAddress: '192.168.4.1',
                } as unknown as IoTDevice,
            ]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDevices();
    }, [fetchDevices]);

    // If a device is selected, show Gateway component
    if (selectedDevice) {
        return (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
                {/* Back button */}
                <motion.div variants={itemVariants}>
                    <button
                        onClick={() => {
                            setSelectedDevice(null);
                        }}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        ← Back to Device List
                    </button>
                </motion.div>

                {/* Gateway component with actual props */}
                <Gateway
                    device={selectedDevice as unknown as ComponentProps<typeof Gateway>['device']}
                    onConnected={() => { }}
                    onDisconnected={() => { }}
                />
            </motion.div>
        );
    }

    // Device selection list
    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* Header */}
            <motion.div
                variants={itemVariants}
                className="bg-neutral-800/70 border border-neutral-700/50 rounded-2xl p-6"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                            <Router size={20} className="text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">ESP32 Gateway Connection</h2>
                            <p className="text-xs text-gray-500">
                                Select a device to establish a direct connection
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={fetchDevices}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-neutral-700/50 border border-neutral-600/50 text-gray-300 hover:text-white transition-colors"
                    >
                        <RefreshCw size={14} className={cn(loading && 'animate-spin')} />
                        Refresh
                    </button>
                </div>
            </motion.div>

            {/* Device list */}
            {loading ? (
                <motion.div variants={itemVariants} className="flex items-center justify-center py-20">
                    <RefreshCw size={24} className="animate-spin text-cyan-400" />
                </motion.div>
            ) : devices.length === 0 ? (
                <motion.div
                    variants={itemVariants}
                    className="flex flex-col items-center justify-center py-20 text-center"
                >
                    <WifiOff size={48} className="text-gray-600 mb-4" />
                    <h3 className="text-white font-semibold mb-2">No Devices Found</h3>
                    <p className="text-gray-400 text-sm max-w-xs">
                        Add IoT devices from the IoT Devices page first, then return here to connect.
                    </p>
                </motion.div>
            ) : (
                <div className="grid gap-3">
                    {devices.map((device) => (
                        <motion.button
                            key={device.id}
                            variants={itemVariants}
                            onClick={() => setSelectedDevice(device)}
                            className="w-full bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-4 flex items-center gap-4 hover:bg-neutral-700/50 hover:border-cyan-500/30 transition-all group text-left"
                        >
                            <div className="w-10 h-10 rounded-lg bg-neutral-700/50 flex items-center justify-center">
                                {device.type === 'camera' ? (
                                    <Radio size={18} className="text-orange-400" />
                                ) : (
                                    <Cpu size={18} className="text-cyan-400" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-white font-medium">{device.name || device.id}</span>
                                    <span
                                        className={cn(
                                            'inline-block w-2 h-2 rounded-full',
                                            device.status === 'online' ? 'bg-emerald-400' : 'bg-gray-500',
                                        )}
                                    />
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                    <span className="flex items-center gap-1">
                                        <Wifi size={10} />
                                        {device.ipAddress || 'No IP set'}
                                    </span>
                                    <span className="capitalize">{device.type?.replace('_', ' ')}</span>
                                </div>
                            </div>
                            <ChevronRight
                                size={16}
                                className="text-gray-600 group-hover:text-cyan-400 transition-colors"
                            />
                        </motion.button>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
