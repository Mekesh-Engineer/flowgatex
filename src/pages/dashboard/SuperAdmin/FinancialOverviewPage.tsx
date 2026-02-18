import React from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, CreditCard, 
  ArrowUpRight, ArrowDownRight, Download, RefreshCw 
} from 'lucide-react';
import { motion } from 'framer-motion';

import { Card } from '@/components/common/Card';
import Button from '@/components/common/Button';
import { formatCurrency } from '@/lib/utils'; // Assuming this utility exists

// Mock Financial Data
const TRANSACTIONS = [
  { id: 'TXN-001', user: 'Alice', event: 'Tech Summit', amount: 1500, status: 'success', gateway: 'Razorpay', date: '2023-10-15' },
  { id: 'TXN-002', user: 'Bob', event: 'Music Fest', amount: 2500, status: 'success', gateway: 'Cashfree', date: '2023-10-14' },
  { id: 'TXN-003', user: 'Charlie', event: 'Art Expo', amount: 500, status: 'refunded', gateway: 'Razorpay', date: '2023-10-12' },
  { id: 'TXN-004', user: 'David', event: 'Yoga Workshop', amount: 800, status: 'failed', gateway: 'Razorpay', date: '2023-10-10' },
];

const FinancialOverviewPage = () => {
  return (
    <div className="space-y-6 p-6 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            Financial Command
          </h1>
          <p className="text-slate-400">Platform-wide revenue, payouts, and reconciliation.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" icon={Download}>Export Report</Button>
           <Button icon={RefreshCw}>Sync Gateways</Button>
        </div>
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <Card className="p-6 bg-slate-900/50 border-slate-800 relative overflow-hidden group">
            <div className="absolute right-4 top-4 p-3 rounded-xl bg-orange-500/10 text-orange-500 group-hover:bg-orange-500/20 transition-colors">
               <DollarSign size={24} />
            </div>
            <p className="text-sm font-medium text-slate-400">Gross Volume</p>
            <h3 className="text-3xl font-bold text-white mt-1">₹45.2L</h3>
            <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-400">
               <TrendingUp size={12} /> +12.5% <span className="text-slate-500">vs last month</span>
            </div>
         </Card>

         <Card className="p-6 bg-slate-900/50 border-slate-800 relative overflow-hidden group">
            <div className="absolute right-4 top-4 p-3 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20 transition-colors">
               <CreditCard size={24} />
            </div>
            <p className="text-sm font-medium text-slate-400">Net Revenue</p>
            <h3 className="text-3xl font-bold text-white mt-1">₹3.8L</h3>
            <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-400">
               <TrendingUp size={12} /> +8.2% <span className="text-slate-500">vs last month</span>
            </div>
         </Card>

         <Card className="p-6 bg-slate-900/50 border-slate-800 relative overflow-hidden group">
            <div className="absolute right-4 top-4 p-3 rounded-xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20 transition-colors">
               <ArrowUpRight size={24} />
            </div>
             <p className="text-sm font-medium text-slate-400">Pending Payouts</p>
            <h3 className="text-3xl font-bold text-white mt-1">₹12.5L</h3>
            <div className="mt-2 text-xs font-medium text-slate-500">
               Across 15 Organizers
            </div>
         </Card>

         <Card className="p-6 bg-slate-900/50 border-slate-800 relative overflow-hidden group">
            <div className="absolute right-4 top-4 p-3 rounded-xl bg-red-500/10 text-red-500 group-hover:bg-red-500/20 transition-colors">
               <ArrowDownRight size={24} />
            </div>
             <p className="text-sm font-medium text-slate-400">Refunds Issued</p>
            <h3 className="text-3xl font-bold text-white mt-1">₹42k</h3>
            <div className="flex items-center gap-1 mt-2 text-xs font-medium text-red-400">
               <TrendingDown size={12} /> +2.1% <span className="text-slate-500">vs last month</span>
            </div>
         </Card>
      </div>

      {/* Chart Placeholder */}
      <Card className="p-6 border-slate-800 bg-slate-900/50 min-h-[300px] flex items-center justify-center relative">
         <div className="absolute top-6 left-6">
            <h3 className="text-lg font-bold text-white">Revenue Trends</h3>
             <p className="text-sm text-slate-400">Gross vs Net Revenue (Last 6 Months)</p>
         </div>
         {/* Simple SVG Chart approximation */}
         <div className="w-full h-full pt-16 flex items-end gap-2 px-4">
             {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end gap-1 h-full group">
                   <div 
                     className="w-full bg-emerald-500/20 rounded-t-sm group-hover:bg-emerald-500/40 transition-colors relative"
                     style={{ height: `${h}%` }}
                   >
                     <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-slate-700">
                        ₹{h * 1000}
                     </div>
                   </div>
                   <div 
                     className="w-full bg-blue-500/20 rounded-t-sm group-hover:bg-blue-500/40 transition-colors"
                     style={{ height: `${h * 0.4}%` }}
                   />
                </div>
             ))}
         </div>
      </Card>

      {/* Recent Transactions */}
      <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-md overflow-hidden">
         <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
            <h3 className="font-bold text-white">Recent Transactions</h3>
            <span className="text-xs text-emerald-400 cursor-pointer hover:underline">View All</span>
         </div>
         <table className="w-full text-left">
            <thead className="bg-slate-800/50 text-xs uppercase text-slate-400 font-medium">
               <tr>
                  <th className="p-4">Transaction ID</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Event</th>
                  <th className="p-4">Gateway</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-right">Status</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
               {TRANSACTIONS.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-800/30 transition-colors">
                     <td className="p-4 font-mono text-slate-500">{txn.id}</td>
                     <td className="p-4 text-white font-medium">{txn.user}</td>
                     <td className="p-4 text-slate-400">{txn.event}</td>
                     <td className="p-4 text-slate-400">{txn.gateway}</td>
                     <td className="p-4 text-slate-500">{txn.date}</td>
                     <td className={`p-4 text-right font-mono font-bold ${txn.status === 'refunded' ? 'text-red-400' : 'text-emerald-400'}`}>
                        {txn.status === 'refunded' ? '-' : '+'}₹{txn.amount}
                     </td>
                     <td className="p-4 text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${
                           txn.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                           txn.status === 'refunded' ? 'bg-red-500/10 text-red-400' :
                           'bg-yellow-500/10 text-yellow-400'
                        }`}>
                           {txn.status}
                        </span>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </Card>
    </div>
  );
};

export default FinancialOverviewPage;
