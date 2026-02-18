import React from 'react';
import { 
  UserCheck, Plus, MoreVertical, Shield, 
  Building2, Calendar, Lock, Activity 
} from 'lucide-react';
import { motion } from 'framer-motion';

import { Card } from '@/components/common/Card';
import Button from '@/components/common/Button';

// Mock Admins
const ADMINS = [
  { 
    id: '1', 
    name: 'Sarah Connor', 
    email: 'sarah@skynet.com', 
    photo: null,
    org: 'Cyberdyne Systems', 
    promotedBy: 'Mekesh Kumar',
    promotedDate: '2025-08-29',
    status: 'active',
    lastActive: '2 mins ago',
    permissions: '45/48'
  },
  { 
    id: '2', 
    name: 'Bruce Wayne', 
    email: 'bruce@wayne.ent', 
    photo: null, 
    org: 'Wayne Enterprises', 
    promotedBy: 'Mekesh Kumar',
    promotedDate: '2024-05-12',
    status: 'active',
    lastActive: '1 day ago',
    permissions: '48/48'
  },
  { 
    id: '3', 
    name: 'Lex Luthor', 
    email: 'lex@lexcorp.com', 
    photo: null, 
    org: 'LexCorp', 
    promotedBy: 'Superman',
    promotedDate: '2025-01-01',
    status: 'suspended',
    lastActive: '3 months ago',
    permissions: '12/48'
  },
];

const AdminManagementPage = () => {
  return (
    <div className="space-y-6 p-6 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            Admin Management
          </h1>
          <p className="text-slate-400">Manage high-level administrators and their privileges.</p>
        </div>
        <Button icon={Plus} className="bg-emerald-600 hover:bg-emerald-500">Create New Admin</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ADMINS.map((admin) => (
          <motion.div 
            key={admin.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative"
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${admin.status === 'suspended' ? 'from-red-500/10 to-orange-500/10' : 'from-emerald-500/10 to-cyan-500/10'} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity`} />
            
            <Card className="relative h-full border-slate-800 bg-slate-900/80 backdrop-blur-md overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                 <button className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                   <MoreVertical size={18} />
                 </button>
              </div>

              <div className="p-6 flex flex-col items-center text-center space-y-4">
                 <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-2xl font-bold text-slate-400">
                      {admin.name.charAt(0)}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-4 border-slate-900 ${admin.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                 </div>

                 <div>
                   <h3 className="text-xl font-bold text-white">{admin.name}</h3>
                   <p className="text-sm text-slate-400">{admin.email}</p>
                 </div>

                 <div className="w-full pt-4 border-t border-slate-800 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 flex items-center gap-2"><Building2 size={14} /> Org</span>
                      <span className="text-slate-300 font-medium">{admin.org}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 flex items-center gap-2"><Shield size={14} /> Promoted</span>
                      <span className="text-slate-300">{admin.promotedDate}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 flex items-center gap-2"><Lock size={14} /> Permissions</span>
                      <span className="text-emerald-400 font-mono">{admin.permissions}</span>
                    </div>
                     <div className="flex justify-between text-sm">
                      <span className="text-slate-500 flex items-center gap-2"><Activity size={14} /> Last Active</span>
                      <span className="text-slate-300">{admin.lastActive}</span>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3 w-full mt-4">
                    <button className="py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors border border-slate-700">
                      View Log
                    </button>
                    <button className="py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-400 transition-colors border border-slate-700">
                      Edit Roles
                    </button>
                 </div>
              </div>
            </Card>
          </motion.div>
        ))}
        
        {/* Placeholder Card for "Add New" */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-full min-h-[360px] rounded-2xl border-2 border-dashed border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all flex flex-col items-center justify-center cursor-pointer group"
        >
           <div className="p-4 rounded-full bg-slate-800 group-hover:bg-emerald-500/20 text-slate-400 group-hover:text-emerald-400 transition-colors mb-4">
             <Plus size={32} />
           </div>
           <h3 className="font-bold text-slate-300 group-hover:text-emerald-400 transition-colors">Promote User to Admin</h3>
           <p className="text-sm text-slate-500 mt-2 text-center max-w-[200px]">Grant administrative privileges to an existing user.</p>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminManagementPage;
