import React from 'react';
import { useLocation } from 'react-router-dom';
import { Construction, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const SuperAdminPlaceholder = () => {
  const location = useLocation();
  const pageName = location.pathname.split('/').pop()?.replace(/-/g, ' ').toUpperCase();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 space-y-6">
      <div className="p-6 bg-slate-800/50 rounded-full border border-slate-700/50">
        <Construction className="w-16 h-16 text-emerald-400 animate-pulse" />
      </div>
      
      <div className="space-y-2 max-w-md">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
          {pageName}
        </h1>
        <p className="text-slate-400 text-lg">
          This Super Admin module is currently under development.
        </p>
      </div>

      <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800 text-sm font-mono text-slate-500">
        Route: <span className="text-emerald-500">{location.pathname}</span>
      </div>

      <Link 
        to="/superadmin" 
        className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Dashboard
      </Link>
    </div>
  );
};

export default SuperAdminPlaceholder;
