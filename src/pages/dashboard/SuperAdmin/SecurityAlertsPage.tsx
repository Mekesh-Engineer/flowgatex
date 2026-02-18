import React, { useState } from 'react';
import { 
  ShieldAlert, ShieldCheck, Lock, Globe, UserX, AlertOctagon, Check, X, Eye 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/common/Card';
import Button from '@/components/common/Button';

// Mock Security Alerts
const ALERTS = [
  { id: 'SEC-001', type: 'Brute Force Attempt', severity: 'critical', status: 'open', source: '45.22.19.112', details: '50 failed login attempts in 1 minute.', timestamp: '10 mins ago' },
  { id: 'SEC-002', type: 'Suspicious Role Elevation', severity: 'high', status: 'investigating', source: 'admin@flowgate.com', details: 'User modified their own role to Super Admin.', timestamp: '1 hour ago' },
  { id: 'SEC-003', type: 'API Rate Limit Exceeded', severity: 'medium', status: 'resolved', source: 'Service: Payment Sync', details: '1000 requests / min detected.', timestamp: '3 hours ago' },
  { id: 'SEC-004', type: 'Unusual Geo-Location', severity: 'low', status: 'open', source: 'User: 1024', details: 'Login from Moscow, Russia (unexpected).', timestamp: '5 hours ago' },
  { id: 'SEC-005', type: 'SQL Injection Pattern', severity: 'critical', status: 'resolved', source: '192.168.1.50', details: 'Malicious payload detected in search query.', timestamp: '1 day ago' },
];

const SecurityAlertsPage = () => {
  const [activeTab, setActiveTab] = useState('active');

  const filteredAlerts = activeTab === 'active' 
    ? ALERTS.filter(a => a.status !== 'resolved')
    : ALERTS.filter(a => a.status === 'resolved');

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  const getIcon = (type: string) => {
    if (type.includes('Brute')) return <UserX />;
    if (type.includes('Role')) return <Lock />;
    if (type.includes('Geo')) return <Globe />;
    return <AlertOctagon />;
  };

  return (
    <div className="space-y-6 p-6 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            Security Center
          </h1>
          <p className="text-slate-400">Monitor and respond to security threats in real-time.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="danger" icon={ShieldAlert}>Lockdown Mode</Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <Card className="p-6 bg-red-500/5 border-red-500/20 items-center flex gap-4">
            <div className="p-3 bg-red-500/10 rounded-full text-red-500">
               <ShieldAlert size={32} />
            </div>
            <div>
               <h3 className="text-2xl font-bold text-white">3 Active</h3>
               <p className="text-sm text-slate-400">Critical Threats</p>
            </div>
         </Card>
         <Card className="p-6 bg-orange-500/5 border-orange-500/20 items-center flex gap-4">
            <div className="p-3 bg-orange-500/10 rounded-full text-orange-500">
               <AlertOctagon size={32} />
            </div>
            <div>
               <h3 className="text-2xl font-bold text-white">5 Pending</h3>
               <p className="text-sm text-slate-400">Investigations</p>
            </div>
         </Card>
         <Card className="p-6 bg-emerald-500/5 border-emerald-500/20 items-center flex gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-500">
               <ShieldCheck size={32} />
            </div>
            <div>
               <h3 className="text-2xl font-bold text-white">98% Score</h3>
               <p className="text-sm text-slate-400">System Integrity</p>
            </div>
         </Card>
      </div>

      {/* Alert Feed */}
      <Card className="border-slate-800 bg-slate-900/50">
         <div className="p-4 border-b border-slate-800 flex gap-6">
            <button 
               className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'active' ? 'text-emerald-400 border-emerald-400' : 'text-slate-400 border-transparent hover:text-white'}`}
               onClick={() => setActiveTab('active')}
            >
               Active Threats
            </button>
            <button 
               className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'history' ? 'text-emerald-400 border-emerald-400' : 'text-slate-400 border-transparent hover:text-white'}`}
               onClick={() => setActiveTab('history')}
            >
               Resolved History
            </button>
         </div>

         <div className="divide-y divide-slate-800">
            {filteredAlerts.map((alert) => (
               <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={alert.id} 
                  className="p-4 hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
               >
                  <div className="flex gap-4 items-start">
                     <div className={`p-3 rounded-lg ${getSeverityColor(alert.severity)}`}>
                        {getIcon(alert.type)}
                     </div>
                     <div>
                        <div className="flex items-center gap-2">
                           <h4 className="font-bold text-white">{alert.type}</h4>
                           <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getSeverityColor(alert.severity)}`}>
                              {alert.severity}
                           </span>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">{alert.details}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-mono">
                           <span>Source: {alert.source}</span>
                           <span>•</span>
                           <span>{alert.timestamp}</span>
                        </div>
                     </div>
                  </div>

                  <div className="flex gap-2 self-end md:self-center">
                     {alert.status === 'open' && (
                        <>
                           <Button size="sm" variant="outline" icon={Eye}>Investigate</Button>
                           <Button size="sm" variant="primary" icon={Check}>Resolve</Button>
                        </>
                     )}
                     {alert.status === 'investigating' && (
                        <div className="flex items-center gap-2 text-orange-400 text-sm font-medium px-4">
                           <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                           Under Investigation
                        </div>
                     )}
                     {alert.status === 'resolved' && (
                        <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium px-4">
                           <Check size={16} />
                           Resolved
                        </div>
                     )}
                  </div>
               </motion.div>
            ))}

            {filteredAlerts.length === 0 && (
               <div className="p-12 text-center text-slate-500">
                  <ShieldCheck size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No alerts found in this category.</p>
               </div>
            )}
         </div>
      </Card>
    </div>
  );
};

export default SecurityAlertsPage;
