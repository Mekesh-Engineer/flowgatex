import React, { useState } from 'react';
import { 
  Settings, Flag, Shield, Lock, CreditCard, Cpu, Bell, 
  Save, AlertTriangle, Monitor, Globe, Mail 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Card } from '@/components/common/Card';
import Button from '@/components/common/Button';

// Mock feature flags
const FLAGS = [
  { id: 'enableRegistration', label: 'User Registration', desc: 'Allow new user sign-ups', active: true },
  { id: 'enableSocialLogin', label: 'Social Login', desc: 'Google / Facebook OAuth', active: true },
  { id: 'enableEventCreation', label: 'Event Creation', desc: 'Organizers can create events', active: true },
  { id: 'enableIoTIntegration', label: 'IoT Module', desc: 'Device management features', active: true },
  { id: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Block all non-superadmin access', active: false, danger: true },
];

const TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'features', label: 'Feature Flags', icon: Flag },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'iot', label: 'IoT Thresholds', icon: Cpu },
  { id: 'notify', label: 'Notifications', icon: Bell },
];

const PlatformSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);

  return (
    <div className="space-y-6 p-6 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            Platform Settings
          </h1>
          <p className="text-slate-400">Global configuration for FlowGateX.</p>
        </div>
        {hasChanges && (
           <Button icon={Save} className="animate-pulse shadow-emerald-500/50 shadow-lg">Save Configuration</Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[600px]">
        {/* Navigation Sidebar */}
        <Card className="col-span-1 p-4 bg-slate-900/50 border-slate-800 backdrop-blur-md h-fit sticky top-20">
           <nav className="space-y-2">
             {TABS.map((tab) => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                   activeTab === tab.id 
                     ? 'bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20' 
                     : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                 }`}
               >
                 <tab.icon size={18} />
                 {tab.label}
               </button>
             ))}
           </nav>
        </Card>

        {/* Content Area */}
        <Card className="col-span-3 p-8 bg-slate-900/30 border-slate-800 relative overflow-hidden">
          <AnimatePresence mode="wait">
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               transition={{ duration: 0.2 }}
               className="space-y-8"
             >
               {/* GENERAL SETTINGS */}
               {activeTab === 'general' && (
                 <div className="space-y-6">
                   <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                     <Settings className="text-emerald-500" /> General Configuration
                   </h2>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                       <label className="text-sm font-medium text-slate-300">Platform Name</label>
                       <input type="text" defaultValue="FlowGateX" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200" />
                     </div>
                     <div className="space-y-2">
                       <label className="text-sm font-medium text-slate-300">Support Email</label>
                       <input type="email" defaultValue="support@flowgatex.com" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200" />
                     </div>
                     <div className="space-y-2">
                       <label className="text-sm font-medium text-slate-300">Default Timezone</label>
                       <select className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200">
                         <option>Asia/Kolkata (IST)</option>
                         <option>UTC</option>
                       </select>
                     </div>
                     <div className="space-y-2">
                       <label className="text-sm font-medium text-slate-300">Brand Color</label>
                       <div className="flex gap-2">
                         <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-500/50" />
                         <input type="text" defaultValue="#10B981" className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 text-slate-200" />
                       </div>
                     </div>
                   </div>
                 </div>
               )}

               {/* FEATURE FLAGS */}
               {activeTab === 'features' && (
                 <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                     <Flag className="text-yellow-500" /> Feature Flags
                   </h2>
                   <p className="text-slate-400">Toggle platform-wide features instantly. Changes propagate within 30 seconds.</p>
                   
                   <div className="space-y-4">
                     {FLAGS.map((flag) => (
                       <div key={flag.id} className={`flex items-center justify-between p-4 rounded-xl border ${flag.danger ? 'border-red-900/50 bg-red-900/10' : 'border-slate-800 bg-slate-800/50'}`}>
                         <div>
                            <p className={`font-bold ${flag.danger ? 'text-red-400' : 'text-slate-200'}`}>{flag.label}</p>
                            <p className="text-sm text-slate-500">{flag.desc}</p>
                         </div>
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked={flag.active} onChange={() => setHasChanges(true)} />
                            <div className={`w-14 h-7 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600 ${flag.danger ? 'peer-checked:bg-red-600' : ''}`}></div>
                         </label>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               {/* SECURITY POLICY */}
               {activeTab === 'security' && (
                 <div className="space-y-6">
                   <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                     <Shield className="text-blue-500" /> Security Policy
                   </h2>
                   <div className="space-y-6">
                      <div className="p-4 rounded-xl border border-slate-800 bg-slate-800/30">
                        <h3 className="font-bold text-slate-300 mb-4">Password Strength</h3>
                        <div className="flex items-center gap-4">
                          <input type="range" min="8" max="16" defaultValue="10" className="w-64 accent-emerald-500" />
                          <span className="text-emerald-400 font-mono">Min 10 chars</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-slate-800 bg-slate-800/30">
                          <label className="flex items-center justify-between mb-2">
                            <span className="font-bold text-slate-300">2FA Enforcement</span>
                            <Lock size={16} className="text-slate-500" />
                          </label>
                          <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-300">
                             <option>Super Admin Only (Locked)</option>
                             <option>High Privileged Roles</option>
                             <option>All Users</option>
                          </select>
                        </div>

                         <div className="p-4 rounded-xl border border-slate-800 bg-slate-800/30">
                          <label className="flex items-center justify-between mb-2">
                            <span className="font-bold text-slate-300">Session Timeout</span>
                            <Monitor size={16} className="text-slate-500" />
                          </label>
                          <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-300">
                             <option>30 Minutes</option>
                             <option>1 Hour</option>
                             <option>4 Hours</option>
                             <option>24 Hours</option>
                          </select>
                        </div>
                      </div>
                   </div>
                 </div>
               )}

               {/* IOT SETTINGS */}
               {activeTab === 'iot' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Cpu className="text-purple-500" /> IoT Global Thresholds
                    </h2>
                    <div className="space-y-8 p-6 rounded-xl border border-slate-800 bg-slate-900/50">
                       <div className="space-y-2">
                         <div className="flex justify-between">
                            <label className="text-sm font-medium text-slate-300">Temperature Warning (°C)</label>
                            <span className="text-yellow-400 font-mono">35°C</span>
                         </div>
                         <input type="range" min="20" max="50" defaultValue="35" className="w-full accent-yellow-500" />
                       </div>

                       <div className="space-y-2">
                         <div className="flex justify-between">
                            <label className="text-sm font-medium text-slate-300">Crowd Density Critical (%)</label>
                            <span className="text-red-400 font-mono">90%</span>
                         </div>
                         <input type="range" min="50" max="100" defaultValue="90" className="w-full accent-red-500" />
                       </div>

                       <div className="space-y-2">
                         <div className="flex justify-between">
                            <label className="text-sm font-medium text-slate-300">Offline Device Alert Delay (min)</label>
                            <span className="text-slate-400 font-mono">5 min</span>
                         </div>
                         <input type="range" min="1" max="60" defaultValue="5" className="w-full accent-blue-500" />
                       </div>
                    </div>
                  </div>
               )}
             </motion.div>
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
};

export default PlatformSettingsPage;
