import React, { useState } from 'react';
import { Shield, Lock, Users, Edit, Crown, Check, X, Save } from 'lucide-react';
import { motion } from 'framer-motion';

import { Card } from '@/components/common/Card';
import Button from '@/components/common/Button';

// Mock permissions structure
const PERMISSION_GROUPS = [
  {
    id: 'events',
    label: 'Event Management',
    permissions: [
      { id: 'event:create', label: 'Create Events', desc: 'Create events under any organization' },
      { id: 'event:update', label: 'Edit Events', desc: 'Modify event details regardless of ownership' },
      { id: 'event:delete', label: 'Delete Events', desc: 'Permanently remove events and bookings' },
      { id: 'event:publish', label: 'Publish/Unpublish', desc: 'Force publish status change' },
    ]
  },
  {
    id: 'users',
    label: 'User Management',
    permissions: [
      { id: 'user:read', label: 'View Profiles', desc: 'Read any user profile including private data' },
      { id: 'user:suspend', label: 'Suspend Users', desc: 'Block user login access' },
      { id: 'user:impersonate', label: 'Impersonate', desc: 'Login as user for debugging' },
    ]
  },
  {
    id: 'finance',
    label: 'Finance & Payments',
    permissions: [
      { id: 'finance:read', label: 'View Transactions', desc: 'View global transaction history' },
      { id: 'finance:refund', label: 'Issue Refunds', desc: 'Force issue refunds' },
      { id: 'finance:configure', label: 'Configure Fees', desc: 'Set platform service fees' },
    ]
  }
];

const ROLES = [
  { id: 'attendee', name: 'Attendee', count: 1250, color: 'border-slate-700' },
  { id: 'organizer', name: 'Organizer', count: 45, color: 'border-blue-500/50' },
  { id: 'admin', name: 'Admin', count: 8, color: 'border-orange-500/50' },
  { id: 'superadmin', name: 'Super Admin', count: 2, color: 'border-red-500', isSuper: true },
];

const RoleManagementPage = () => {
  const [selectedRole, setSelectedRole] = useState('superadmin');
  const [hasChanges, setHasChanges] = useState(false);

  // Helper to check if permission is active (mock logic)
  const isPermActive = (roleId: string, permId: string) => {
    if (roleId === 'superadmin') return true;
    if (roleId === 'admin') return true; // Most permissions active for admin
    return false;
  };

  return (
    <div className="space-y-6 p-6 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            Role & Permissions
          </h1>
          <p className="text-slate-400">Manage access control and role definitions.</p>
        </div>
        {hasChanges && (
          <Button icon={Save} className="animate-pulse">Save Changes</Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role List (Left Panel) */}
        <div className="lg:col-span-1 space-y-4">
          {ROLES.map((role) => (
            <motion.div
              key={role.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedRole(role.id)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedRole === role.id 
                  ? `${role.color} bg-slate-800 shadow-lg shadow-emerald-900/20` 
                  : 'border-slate-800 bg-slate-900/40 hover:bg-slate-800/80'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {role.isSuper ? (
                    <div className="p-2 rounded-lg bg-red-500/20 text-red-500">
                      <Crown size={20} />
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-slate-700/50 text-slate-400">
                      <Shield size={20} />
                    </div>
                  )}
                  <div>
                    <h3 className={`font-bold ${role.isSuper ? 'text-red-400' : 'text-slate-200'}`}>
                      {role.name}
                    </h3>
                    <p className="text-xs text-slate-500">{role.count} users assigned</p>
                  </div>
                </div>
                {selectedRole === role.id && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
              </div>
            </motion.div>
          ))}
          
          <div className="mt-8 p-4 rounded-xl border border-slate-800 bg-slate-900/30">
            <h4 className="text-sm font-bold text-slate-300 mb-3">Role Hierarchy</h4>
            <div className="space-y-4 pl-2 border-l-2 border-slate-700">
              {ROLES.slice().reverse().map((role, idx) => (
                 <div key={idx} className="relative pl-4">
                   <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-slate-800 border-2 border-slate-600" />
                   <span className="text-xs font-mono text-emerald-500">Level {ROLES.length - idx}</span>
                   <p className="text-sm text-slate-400">{role.name}</p>
                 </div>
              ))}
            </div>
          </div>
        </div>

        {/* Permission Matrix (Right Panel) */}
        <Card className="lg:col-span-2 p-6 border-slate-800 bg-slate-900/50 backdrop-blur-md h-full">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Permissions for <span className="text-emerald-400">{ROLES.find(r => r.id === selectedRole)?.name}</span>
              </h2>
              <p className="text-sm text-slate-400">Configure what this role can do across the platform.</p>
            </div>
            {selectedRole === 'superadmin' && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 text-red-400 rounded-lg text-xs border border-red-500/30">
                <Lock size={12} />
                <span>Unconditional Access</span>
              </div>
            )}
          </div>

          <div className="space-y-8 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.id} className="space-y-3">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider sticky top-0 bg-slate-900/95 py-2 z-10">
                  {group.label}
                </h3>
                <div className="grid gap-3">
                  {group.permissions.map((perm) => {
                    const isActive = isPermActive(selectedRole, perm.id);
                    const isLocked = selectedRole === 'superadmin'; // Superadmin always locked

                    return (
                      <div key={perm.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition-colors">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-200">{perm.label}</p>
                          <p className="text-xs text-slate-500">{perm.desc}</p>
                          <p className="text-[10px] font-mono text-slate-600 mt-1">{perm.id}</p>
                        </div>
                        
                        <label className={`relative inline-flex items-center cursor-${isLocked ? 'not-allowed' : 'pointer'}`}>
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={isActive}
                            disabled={isLocked}
                            onChange={() => !isLocked && setHasChanges(true)}
                          />
                          <div className={`w-11 h-6 rounded-full peer peer-focus:ring-4 peer-focus:ring-emerald-800 dark:peer-focus:ring-emerald-800 
                            ${isActive ? 'bg-emerald-600' : 'bg-slate-700'} 
                            peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600
                            ${isLocked && isActive ? 'opacity-80' : ''}`}
                          ></div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RoleManagementPage;
