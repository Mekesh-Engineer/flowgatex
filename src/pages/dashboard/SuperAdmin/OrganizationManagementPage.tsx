import React, { useState } from 'react';
import { 
  Building2, User, Users, Calendar, DollarSign, 
  Search, Eye, Edit, Trash2, MoreVertical 
} from 'lucide-react';
import { motion } from 'framer-motion';

import { Card } from '@/components/common/Card';
import Button from '@/components/common/Button';

// Mock Organizations
const ORGS = [
  { id: '1', name: 'Global Tech Summits', owner: 'Alice Wonder', members: 12, events: 5, revenue: '$150,000', status: 'active', created: '2023-01' },
  { id: '2', name: 'Music Mania Inc.', owner: 'Bob Marley', members: 34, events: 12, revenue: '$450,000', status: 'active', created: '2023-02' },
  { id: '3', name: 'Local Art Co.', owner: 'Charlie Brown', members: 3, events: 1, revenue: '$5,000', status: 'suspended', created: '2023-05' },
];

const OrganizationManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6 p-6 min-h-screen">
       <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            Organizations
          </h1>
          <p className="text-slate-400">Manage organizer accounts and their entities.</p>
        </div>
        <div className="flex gap-4">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                 type="text" 
                 placeholder="Search organizations..." 
                 className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-64"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <Button icon={Building2}>Create Organization</Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-md overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-800/50 text-xs uppercase tracking-wider text-slate-400">
               <th className="p-4 font-medium">Organization</th>
               <th className="p-4 font-medium">Owner</th>
               <th className="p-4 font-medium">Members</th>
               <th className="p-4 font-medium">Active Events</th>
               <th className="p-4 font-medium">Total Revenue</th>
               <th className="p-4 font-medium">Status</th>
               <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-sm">
            {ORGS.map((org) => (
               <motion.tr 
                 key={org.id} 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }}
                 className="group hover:bg-slate-800/30 transition-colors"
               >
                 <td className="p-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-lg bg-emerald-900/20 flex items-center justify-center text-emerald-400">
                         <Building2 size={20} />
                       </div>
                       <div>
                         <p className="font-bold text-slate-200">{org.name}</p>
                         <p className="text-xs text-slate-500">Founded {org.created}</p>
                       </div>
                    </div>
                 </td>
                 <td className="p-4">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs">
                          {org.owner.charAt(0)}
                       </div>
                       <span className="text-slate-300">{org.owner}</span>
                    </div>
                 </td>
                 <td className="p-4 text-slate-400">{org.members}</td>
                 <td className="p-4 text-slate-400">{org.events}</td>
                 <td className="p-4 font-mono text-emerald-400">{org.revenue}</td>
                 <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${org.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {org.status}
                    </span>
                 </td>
                 <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-emerald-400 transition-colors" title="View Details">
                         <Eye size={16} />
                      </button>
                      <button className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-blue-400 transition-colors" title="Edit Org">
                         <Edit size={16} />
                      </button>
                      <button className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-red-400 transition-colors" title="Delete">
                         <MoreVertical size={16} />
                      </button>
                    </div>
                 </td>
               </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrganizationManagementPage;
