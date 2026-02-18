import React, { useState } from 'react';
import { 
  Search, Filter, Calendar, AlertTriangle, CheckCircle, XCircle, Info, MoreHorizontal, Download 
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import Button from '@/components/common/Button';

// Mock Audit Logs Data
const AUDIT_LOGS = [
  { id: 'LOG-001', timestamp: '2023-10-25 14:30:05', user: 'admin@flowgate.com', action: 'USER_ROLE_UPDATE', resource: 'User: 1024', status: 'success', ip: '192.168.1.10', details: 'Promoted user to Organizer.' },
  { id: 'LOG-002', timestamp: '2023-10-25 14:28:12', user: 'mekesh.engineer@gmail.com', action: 'LOGIN_ATTEMPT', resource: 'Auth System', status: 'failure', ip: '45.12.34.89', details: 'Invalid password. 3rd attempt.' },
  { id: 'LOG-003', timestamp: '2023-10-25 13:15:00', user: 'system', action: 'CRON_JOB: PAYMENT_SYNC', resource: 'Payment Gateway', status: 'success', ip: 'internal', details: 'Synced 45 transactions.' },
  { id: 'LOG-004', timestamp: '2023-10-25 12:00:00', user: 'organizer@event.com', action: 'EVENT_CREATED', resource: 'Event: EVT-882', status: 'success', ip: '10.0.0.5', details: 'Created "Tech Summit 2024".' },
  { id: 'LOG-005', timestamp: '2023-10-24 16:45:22', user: 'support@flowgate.com', action: 'REFUND_PROCESSED', resource: 'Transaction: TXN-992', status: 'success', ip: '192.168.1.15', details: 'Refunded ₹500 to user.' },
];

const AuditLogViewerPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');

  const filteredLogs = AUDIT_LOGS.filter(log => 
    (log.user.toLowerCase().includes(searchTerm.toLowerCase()) || 
     log.action.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterSeverity === 'all' ? true : log.status === filterSeverity) 
  );

  return (
    <div className="space-y-6 p-6 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            System Audit Logs
          </h1>
          <p className="text-slate-400">Track all user activities, system events, and security alerts.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" icon={Download}>Export Logs</Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="p-4 bg-slate-900/50 border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by User, Action, or IP..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
           <select 
             className="bg-slate-800 border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none"
             value={filterSeverity}
             onChange={(e) => setFilterSeverity(e.target.value)}
           >
             <option value="all">All Status</option>
             <option value="success">Success</option>
             <option value="failure">Failure</option>
             <option value="warning">Warning</option>
           </select>
           
           <Button variant="secondary" icon={Calendar} className="bg-slate-800 border-slate-700">Date Range</Button>
           <Button variant="secondary" icon={Filter} className="bg-slate-800 border-slate-700">More Filters</Button>
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="border-slate-800 bg-slate-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-800/50 text-xs uppercase text-slate-400 font-medium">
              <tr>
                <th className="p-4 border-b border-slate-800">Status</th>
                <th className="p-4 border-b border-slate-800">Timestamp</th>
                <th className="p-4 border-b border-slate-800">User / Actor</th>
                <th className="p-4 border-b border-slate-800">Action</th>
                <th className="p-4 border-b border-slate-800">Resource</th>
                <th className="p-4 border-b border-slate-800">IP Address</th>
                <th className="p-4 border-b border-slate-800">Details</th>
                <th className="p-4 border-b border-slate-800 w-10"></th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="p-4">
                     {log.status === 'success' && <CheckCircle size={18} className="text-emerald-500" />}
                     {log.status === 'failure' && <XCircle size={18} className="text-red-500" />}
                     {log.status === 'warning' && <AlertTriangle size={18} className="text-yellow-500" />}
                  </td>
                  <td className="p-4 text-slate-400 font-mono text-xs whitespace-nowrap">{log.timestamp}</td>
                  <td className="p-4 font-medium text-white">{log.user}</td>
                  <td className="p-4 text-emerald-400 font-mono text-xs bg-emerald-500/5 px-2 py-1 rounded w-fit capitalize">
                    {log.action.replace('_', ' ')}
                  </td>
                  <td className="p-4 text-slate-400">{log.resource}</td>
                  <td className="p-4 text-slate-500 font-mono text-xs">{log.ip}</td>
                  <td className="p-4 text-slate-400 truncate max-w-xs" title={log.details}>
                    {log.details}
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-white transition-colors">
                       <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredLogs.length === 0 && (
            <div className="p-8 text-center text-slate-500">
               <Info className="mx-auto mb-2 opacity-50" size={32} />
               <p>No audit logs found matching your filters.</p>
            </div>
          )}
        </div>
        
        {/* Pagination Placeholder */}
        <div className="p-4 border-t border-slate-800 flex justify-between items-center text-sm text-slate-400">
           <span>Showing {filteredLogs.length} of {AUDIT_LOGS.length} results</span>
           <div className="flex gap-2">
              <button disabled className="px-3 py-1 border border-slate-700 rounded opacity-50 cursor-not-allowed">Previous</button>
              <button className="px-3 py-1 border border-slate-700 rounded hover:bg-slate-800 text-white">Next</button>
           </div>
        </div>
      </Card>
    </div>
  );
};


export default AuditLogViewerPage;
