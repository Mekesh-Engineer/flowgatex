import React, { useState } from 'react';
import { 
  Cpu, Activity, Wifi, Battery, MapPin, 
  RefreshCw, Power, AlertTriangle, Search, Filter 
} from 'lucide-react';
import { motion } from 'framer-motion';

import { Card } from '@/components/common/Card';
import Button from '@/components/common/Button';

// Mock Devices
const DEVICES = [
  { id: 'IOT-001', name: 'Main Gate Scanner', type: 'Scanner', venue: 'Convention Center', status: 'online', firmware: 'v2.1.0', battery: 98, lastPing: '2s ago', alerts: 0 },
  { id: 'IOT-002', name: 'Crowd Mon A', type: 'Crowd Monitor', venue: 'Main Hall', status: 'online', firmware: 'v2.1.0', battery: 85, lastPing: '5s ago', alerts: 0 },
  { id: 'IOT-003', name: 'Temp Sensor 1', type: 'Env Sensor', venue: 'Food Court', status: 'offline', firmware: 'v1.9.8', battery: 12, lastPing: '2h ago', alerts: 1 },
  { id: 'IOT-004', name: 'VIP Gate', type: 'Scanner', venue: 'VIP Lounge', status: 'maintenance', firmware: 'v2.1.0', battery: 100, lastPing: '1m ago', alerts: 0 },
];

const IoTFleetManagementPage = () => {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  return (
    <div className="space-y-6 p-6 min-h-screen">
       <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            IoT Fleet Command
          </h1>
          <p className="text-slate-400">Monitor and control physical infrastructure.</p>
        </div>
        <div className="flex gap-2 bg-slate-800 p-1 rounded-lg">
           <button 
             onClick={() => setViewMode('list')}
             className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
           >
             List View
           </button>
           <button 
             onClick={() => setViewMode('map')}
             className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'map' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
           >
             Map View
           </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <Card className="p-4 bg-slate-900/50 border-slate-800 flex items-center justify-between">
            <div>
               <p className="text-sm text-slate-500 font-medium">Total Devices</p>
               <h3 className="text-2xl font-bold text-white">1,245</h3>
            </div>
            <div className="p-3 rounded-full bg-slate-800 text-blue-400">
               <Cpu size={24} />
            </div>
         </Card>
         <Card className="p-4 bg-slate-900/50 border-slate-800 flex items-center justify-between">
            <div>
               <p className="text-sm text-slate-500 font-medium">Online</p>
               <h3 className="text-2xl font-bold text-emerald-400">1,180</h3>
            </div>
            <div className="p-3 rounded-full bg-slate-800 text-emerald-400">
               <Wifi size={24} />
            </div>
         </Card>
         <Card className="p-4 bg-slate-900/50 border-slate-800 flex items-center justify-between">
            <div>
               <p className="text-sm text-slate-500 font-medium">Offline</p>
               <h3 className="text-2xl font-bold text-red-400">45</h3>
            </div>
            <div className="p-3 rounded-full bg-slate-800 text-red-400">
               <Power size={24} />
            </div>
         </Card>
         <Card className="p-4 bg-slate-900/50 border-slate-800 flex items-center justify-between">
            <div>
               <p className="text-sm text-slate-500 font-medium">Active Alerts</p>
               <h3 className="text-2xl font-bold text-yellow-400">12</h3>
            </div>
            <div className="p-3 rounded-full bg-slate-800 text-yellow-400 animate-pulse">
               <AlertTriangle size={24} />
            </div>
         </Card>
      </div>

      {/* Main Content */}
       <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-md overflow-hidden min-h-[500px]">
          {viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/50 text-xs uppercase tracking-wider text-slate-400">
                     <th className="p-4 font-medium">Device Name</th>
                     <th className="p-4 font-medium">Type</th>
                     <th className="p-4 font-medium">Venue</th>
                     <th className="p-4 font-medium">Status</th>
                     <th className="p-4 font-medium">Firmware</th>
                     <th className="p-4 font-medium">Battery</th>
                     <th className="p-4 font-medium">Last Ping</th>
                     <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                   {DEVICES.map((device) => (
                      <motion.tr 
                         key={device.id}
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         className="group hover:bg-slate-800/30 transition-colors"
                      >
                         <td className="p-4">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-400">
                                  <Cpu size={16} />
                               </div>
                               <div>
                                  <p className="font-medium text-slate-200">{device.name}</p>
                                  <p className="text-xs text-slate-500 font-mono">{device.id}</p>
                               </div>
                            </div>
                         </td>
                         <td className="p-4 text-slate-400">{device.type}</td>
                          <td className="p-4 text-slate-400 flex items-center gap-2">
                             <MapPin size={12} /> {device.venue}
                          </td>
                         <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                               device.status === 'online' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                               device.status === 'offline' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                               'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                            }`}>
                               {device.status}
                            </span>
                         </td>
                         <td className="p-4 font-mono text-purple-400">{device.firmware}</td>
                         <td className="p-4">
                            <div className="flex items-center gap-2">
                               <div className="w-16 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${device.battery > 50 ? 'bg-emerald-500' : device.battery > 20 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                    style={{ width: `${device.battery}%` }} 
                                  />
                               </div>
                               <span className="text-xs text-slate-400">{device.battery}%</span>
                            </div>
                         </td>
                         <td className="p-4 text-slate-500">{device.lastPing}</td>
                         <td className="p-4 text-right">
                            <button className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors">
                               <Activity size={16} />
                            </button>
                         </td>
                      </motion.tr>
                   ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="w-full h-[500px] flex items-center justify-center bg-slate-900/50">
               <div className="text-center space-y-4">
                  <MapPin size={48} className="mx-auto text-slate-700" />
                  <p className="text-slate-500">Geospatial view is currently initializing...</p>
               </div>
            </div>
          )}
       </div>
    </div>
  );
};

export default IoTFleetManagementPage;
