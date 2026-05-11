// =============================================================================
// AiHeatmapPage.tsx — Standalone page wrapper for Ai_heatmap component
// =============================================================================
// When accessed via /organizer/ai-heatmap, this page manages its own device
// state. It discovers connected ESP32-CAM devices and passes the esp32Url
// and deviceId props to the underlying AiHeatmap component.
// =============================================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AiHeatmap from './AiHeatmap';
import { collection, getDocs, query, where, Firestore } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { IoTDevice } from '@/features/iot/types/iot.types';

export default function AiHeatmapPage() {
    const [esp32Url, setEsp32Url] = useState<string | null>(null);
    const [deviceId, setDeviceId] = useState('FlowGateX-CAM-001');
    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;

        const discoverCamera = async () => {
            try {
                // Check Firestore for camera-type devices
                const firestoreDb = db as Firestore;
                const q = query(collection(firestoreDb, 'iot_devices'), where('type', '==', 'camera'));
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const device = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as IoTDevice;
                    if (device.ipAddress && mounted) {
                        setEsp32Url(`http://${device.ipAddress}`);
                        setDeviceId(device.name || device.id);
                        return;
                    }
                }

                // Fallback: try common ESP32-CAM AP addresses
                const candidates = [
                    'http://192.168.5.1',   // FlowGateX_CAM AP
                    'http://192.168.4.1',   // Default ESP32 AP
                ];

                for (const url of candidates) {
                    if (!mounted) break;
                    try {
                        const controller = new AbortController();
                        const timeout = setTimeout(() => controller.abort(), 2000);
                        const res = await fetch(`${url}/ping`, {
                            signal: controller.signal,
                            cache: 'no-store',
                        });
                        clearTimeout(timeout);
                        if (res.ok) {
                            const data = await res.json();
                            if ((data.camera || data.stream) && mounted) {
                                setEsp32Url(url);
                                setDeviceId(data.id || data.deviceId || 'FlowGateX-CAM-001');
                                return;
                            }
                        }
                    } catch {
                        // Try next candidate
                    }
                }
            } catch {
                // Discovery failed — component will show "no device" state
            }
        };

        discoverCamera();

        return () => {
            mounted = false;
        };
    }, []);

    return (
        <AiHeatmap
            deviceId={deviceId}
            esp32Url={esp32Url}
            onTabSwitch={(tab) => {
                if (tab === 'connect') {
                    navigate('/organizer/gateway');
                }
            }}
        />
    );
}
