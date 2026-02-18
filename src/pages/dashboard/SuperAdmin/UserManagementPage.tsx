import React, { useState } from 'react';
import { 
  Search, Filter, MoreVertical, Shield, UserX, 
  Trash2, Download, Eye, Edit, UserCheck 
} from 'lucide-react';
import { motion } from 'framer-motion';

import { FloatingElement } from '@/features/home/components/ui/SharedComponents';
import Button from '@/components/common/Button';
import { Card } from '@/components/common/Card';

const UserManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  // Mock data based on documentation
  const users = [
    { id: '1', name: 'Mekesh Kumar', email: 'mekesh...@gmail.com', role: 'superadmin', status: 'active', joined: '2023-01-01', bookings: 12 },
    { id: '2', name: 'Jane Doe', email: 'jane.doe@example.com', role: 'admin', status: 'active', joined: '2023-03-15', bookings: 5 },
    { id: '3', name: 'John Smith', email: 'john.smith@example.com', role: 'organizer', status: 'suspended', joined: '2023-06-10', bookings: 0 },
    { id: '4', name: 'Alice Johnson', email: 'alice.j@example.com', role: 'user', status: 'active', joined: '2023-08-22', bookings: 3 },
  ];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'admin': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'organizer': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500';
      case 'suspended': return 'bg-yellow-500';
      case 'deleted': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6 p-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            User Management
          </h1>
          <p className="text-slate-400 mt-1">
            Manage all user accounts across the platform.
          </p>
        </div>
        <div className="flex gap-3">
           <Button variant="outline" icon={Download}>Export CSV</Button>
           <Button icon={UserCheck}>Bulk Actions</Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Filters */}
        <Card className="w-full lg:w-64 p-4 h-fit space-y-6 border-slate-800 bg-slate-900/50 backdrop-blur-md">
           <div className="space-y-2">
             <label className="text-sm font-medium text-slate-300">Search</label>
             <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
               <input 
                 type="text" 
                 placeholder="Name, Email, UID" 
                 className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
           </div>

           <div className="space-y-2">
             <label className="text-sm font-medium text-slate-300">Role</label>
             <select 
               className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
               value={filterRole}
               onChange={(e) => setFilterRole(e.target.value)}
             >
               <option value="all">All Roles</option>
               <option value="attendee">Attendee</option>
               <option value="organizer">Organizer</option>
               <option value="admin">Admin</option>
               <option value="superadmin">Super Admin</option>
             </select>
           </div>
           
           <div className="space-y-2">
             <label className="text-sm font-medium text-slate-300">Status</label>
             <div className="space-y-1">
               <label className="flex items-center gap-2 text-sm text-slate-400">
                 <input type="checkbox" className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-offset-slate-900" defaultChecked />
                 Active
               </label>
               <label className="flex items-center gap-2 text-sm text-slate-400">
                 <input type="checkbox" className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-offset-slate-900" />
                 Suspended
               </label>
             </div>
           </div>
        </Card>

        {/* Main Data Table */}
        <div className="flex-1 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/50 text-xs uppercase tracking-wider text-slate-400">
                  <th className="p-4 font-medium">User</th>
                  <th className="p-4 font-medium">Role</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Joined</th>
                  <th className="p-4 font-medium">Bookings</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {users.map((user) => (
                  <motion.tr 
                    key={user.id} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="group hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${getStatusDotColor(user.status)}`} />
                        <span className="capitalize text-slate-400">{user.status}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-400">{user.joined}</td>
                    <td className="p-4 text-slate-400">{user.bookings}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-emerald-400 transition-colors" title="View Profile">
                          <Eye size={16} />
                        </button>
                        <button className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-blue-400 transition-colors" title="Edit Role">
                          <Edit size={16} />
                        </button>
                        <button className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-red-400 transition-colors" title="Suspend/Delete">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Placeholder */}
          <div className="p-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
            <span>Showing 4 of 124 users</span>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-slate-800 rounded hover:bg-slate-700 transition-colors">Previous</button>
              <button className="px-3 py-1 bg-slate-800 rounded hover:bg-slate-700 transition-colors">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
