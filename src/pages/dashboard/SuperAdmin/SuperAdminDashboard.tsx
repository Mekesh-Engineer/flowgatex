import { motion } from 'framer-motion';
import { 
  Users, Calendar, TrendingUp, Shield, Activity, 
  Server, HardDrive, Wifi, Bell, UserPlus, Power 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { GridCanvas, ParticleCanvas } from '@/features/home/components/canvas/CanvasEffects';
import { FloatingElement } from '@/features/home/components/ui/SharedComponents';
import { Card, CardContent } from '@/components/common/Card';
import Button from '@/components/common/Button';
import { formatCurrency } from '@/lib/utils';
import { ROUTES } from '@/routes/paths';

// ─── Animations ──────────────────────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

// ─── Mock Data ───────────

const HEALTH_METRICS = [
  { label: 'Firebase', status: 'operational', color: 'text-green-500', bg: 'bg-green-500/10' },
  { label: 'MQTT Broker', status: 'operational', color: 'text-green-500', bg: 'bg-green-500/10' },
  { label: 'Razorpay', status: 'operational', color: 'text-green-500', bg: 'bg-green-500/10' },
  { label: 'Cashfree', status: 'degraded', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  { label: 'IoT Network', status: 'operational', color: 'text-green-500', bg: 'bg-green-500/10' },
];

const KPI_METRICS = [
  { label: 'Total Users', value: '14,205', delta: '+12%', icon: Users, color: 'text-blue-500' },
  { label: 'Active Events', value: '342', delta: '+5%', icon: Calendar, color: 'text-purple-500' },
  { label: 'Platform Revenue', value: formatCurrency(4500000), delta: '+18%', icon: TrendingUp, color: 'text-green-500' },
  { label: 'Devices Online', value: '1,024 / 1,200', delta: '85%', icon: Wifi, color: 'text-cyan-500' },
  { label: 'Security Alerts', value: '3', delta: 'Critical', icon: Shield, color: 'text-red-500' },
  { label: 'Pending Approvals', value: '12', delta: 'Urgent', icon: UserPlus, color: 'text-orange-500' },
];

const RECENT_AUDIT_LOGS = [
  { id: 1, user: 'Admin User', action: 'Promoted User', resource: 'user:123', time: '2 mins ago', type: 'update' },
  { id: 2, user: 'System', action: 'Auto-scaled DB', resource: 'db:shard-1', time: '15 mins ago', type: 'system' },
  { id: 3, user: 'Organizer A', action: 'Deleted Event', resource: 'event:999', time: '1 hour ago', type: 'delete' },
  { id: 4, user: 'Super Admin', action: 'Forced Refund', resource: 'payment:555', time: '2 hours ago', type: 'critical' },
];

export default function SuperAdminDashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans relative overflow-hidden pb-12">
      
      {/* ─── Background Effects ─── */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <GridCanvas />
        <ParticleCanvas />
      </div>

      <div className="relative z-10 container mx-auto px-6 pt-8 space-y-8">
        
        {/* ─── Header Section ─── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <FloatingElement duration={5}>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="p-2 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
                  <Activity size={20} />
                </span>
                <span className="text-xs font-bold text-red-500 uppercase tracking-wider border border-red-500/20 px-2 py-0.5 rounded-full bg-red-500/5">
                  Super Admin Mode
                </span>
              </div>
              <h1 className="text-4xl font-black tracking-tight">
                System <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Overview</span>
              </h1>
              <p className="text-[var(--text-secondary)] mt-1">
                Full system authority active. Audit logging enabled.
              </p>
            </div>
          </FloatingElement>

          <div className="flex gap-3">
             <Button 
               variant="danger" 
               className="shadow-lg shadow-red-500/20"
               onClick={() => alert('Enter Maintenance Mode?')} // Replace with modal
             >
               <Power size={18} className="mr-2" /> Maintenance Mode
             </Button>
             <Button variant="secondary" onClick={() => navigate(ROUTES.ADMIN_SETTINGS)}>
               System Settings
             </Button>
          </div>
        </div>

        {/* ─── Platform Health Strip ─── */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4"
        >
          {HEALTH_METRICS.map((metric) => (
            <div key={metric.label} className={`flex items-center justify-between p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]/50 backdrop-blur-sm`}>
              <span className="text-xs font-bold text-[var(--text-secondary)]">{metric.label}</span>
              <span className={`w-2.5 h-2.5 rounded-full ${metric.status === 'operational' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-yellow-500 animate-pulse'}`} />
            </div>
          ))}
        </motion.div>

        {/* ─── KPI Cards ─── */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
        >
          {KPI_METRICS.map((kpi, idx) => (
            <motion.div key={idx} variants={fadeInUp}>
              <Card className="h-full border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-[var(--color-primary)] transition-colors group">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-2 rounded-lg ${kpi.color.replace('text-', 'bg-')}/10 ${kpi.color}`}>
                      <kpi.icon size={20} />
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${kpi.delta.includes('+') ? 'bg-green-500/10 text-green-500' : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'}`}>
                      {kpi.delta}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-[var(--text-primary)]">{kpi.value}</h3>
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-semibold mt-1">{kpi.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* ─── Revenue Trend (Placeholder Chart) ─── */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-2 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 relative overflow-hidden"
          >
             <div className="flex justify-between items-center mb-6 relative z-10">
               <h3 className="font-bold text-lg flex items-center gap-2">
                 <TrendingUp className="text-green-500" size={20} /> Revenue Trend
               </h3>
               <select className="bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-lg text-sm px-3 py-1.5 focus:outline-none">
                 <option>Last 7 Days</option>
                 <option>Last 30 Days</option>
                 <option>All Time</option>
               </select>
             </div>
             
             {/* Mock Chart Area */}
             <div className="h-[300px] w-full bg-[var(--bg-surface)]/50 rounded-xl border border-[var(--border-subtle)] flex items-center justify-center relative">
                <div className="absolute inset-x-0 bottom-0 h-full opacity-20 bg-gradient-to-t from-green-500/20 to-transparent" />
                <svg className="w-full h-full absolute inset-0 text-green-500" preserveAspectRatio="none">
                   <path d="M0,280 C150,250 300,320 450,200 C600,80 750,150 900,50 L900,300 L0,300 Z" fill="currentColor" fillOpacity="0.1" />
                   <path d="M0,280 C150,250 300,320 450,200 C600,80 750,150 900,50" fill="none" stroke="currentColor" strokeWidth="3" />
                </svg>
                <p className="relative z-10 text-[var(--text-muted)] font-medium">Interactive Chart.js Component Here</p>
             </div>
          </motion.div>

          {/* ─── Recent Audit Logs ─── */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Server className="text-[var(--text-primary)]" size={20} /> System Activity
              </h3>
              <Button size="sm" variant="ghost" className="text-xs">View All</Button>
            </div>

            <div className="space-y-4">
              {RECENT_AUDIT_LOGS.map((log) => (
                <div key={log.id} className="flex gap-4 items-start p-3 hover:bg-[var(--bg-surface)] rounded-xl transition-colors border border-transparent hover:border-[var(--border-subtle)]">
                   <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                     log.type === 'critical' ? 'bg-red-500 shadow-[0_0_8px_red]' : 
                     log.type === 'delete' ? 'bg-orange-500' : 
                     log.type === 'update' ? 'bg-blue-500' : 'bg-green-500'
                   }`} />
                   <div>
                     <p className="text-sm font-bold text-[var(--text-primary)]">
                       {log.action} <span className="font-normal text-[var(--text-muted)]">by {log.user}</span>
                     </p>
                     <p className="text-xs text-[var(--text-secondary)] font-mono mt-0.5">{log.resource}</p>
                     <p className="text-[10px] text-[var(--text-muted)] mt-1">{log.time}</p>
                   </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>

        {/* ─── IoT Fleet Status ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           {['Scanners', 'Crowd Monitors', 'Env Sensors', 'Security'].map((type, i) => (
             <Card key={type} className="bg-[var(--bg-card)] border-[var(--border-primary)]">
               <CardContent className="p-4 flex items-center gap-4">
                 <div className="p-3 bg-[var(--bg-surface)] rounded-xl text-[var(--color-primary)]">
                   <HardDrive size={20} />
                 </div>
                 <div>
                   <p className="text-xs font-bold text-[var(--text-muted)] uppercase">{type}</p>
                   <p className="text-lg font-black text-[var(--text-primary)]">
                     {Math.floor(Math.random() * 200) + 50} <span className="text-xs font-normal text-green-500">98% Online</span>
                   </p>
                 </div>
               </CardContent>
             </Card>
           ))}
        </div>

      </div>
    </div>
  );
}
