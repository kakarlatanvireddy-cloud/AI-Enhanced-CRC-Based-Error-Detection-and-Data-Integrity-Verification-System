import React, { useState, useEffect } from 'react';
import { ShieldCheck, Server, Activity, RefreshCw } from 'lucide-react';
import { fetchHealthCheck } from '../../services/api';

export const Header = () => {
  const [health, setHealth] = useState({ loading: true, online: false, data: null });

  const checkStatus = async () => {
    setHealth(prev => ({ ...prev, loading: true }));
    const result = await fetchHealthCheck();
    if (result.success) {
      setHealth({ loading: false, online: true, data: result.data });
    } else {
      setHealth({ loading: false, online: false, data: null });
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30 shadow-md">
      {/* Brand / System Name */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-100 leading-tight">
            AI-Enhanced CRC Verification System
          </h1>
          <p className="text-xs text-slate-400">Data Integrity & Error Detection Architecture</p>
        </div>
      </div>

      {/* Backend Health Badge & Controls */}
      <div className="flex items-center gap-4">
        {/* Backend Connectivity Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 rounded-full border border-slate-700 text-xs">
          <Server className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Backend API:</span>
          {health.loading ? (
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Checking...
            </span>
          ) : health.online ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Online (Express)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-rose-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Offline
            </span>
          )}
          <button 
            onClick={checkStatus} 
            className="ml-1 p-1 hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-200 transition-colors"
            title="Refresh backend status"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        {/* Phase / Build Badge */}
        <div className="px-3 py-1.5 bg-indigo-950/60 border border-indigo-700/50 rounded-full text-xs text-indigo-300 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />
          <span>Stage 1: Foundation</span>
        </div>
      </div>
    </header>
  );
};
