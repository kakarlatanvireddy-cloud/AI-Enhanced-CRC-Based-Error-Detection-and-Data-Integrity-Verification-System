import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Binary, 
  Radio, 
  Zap, 
  GitCompare, 
  BrainCircuit, 
  BarChart3, 
  Activity, 
  BellRing 
} from 'lucide-react';

const navItems = [
  { name: 'System Dashboard', path: '/', icon: LayoutDashboard, exact: true },
  { name: '1. CRC Generator & Verifier', path: '/crc-generator', icon: Binary },
  { name: '2. Transmission Simulator', path: '/transmission-sim', icon: Radio },
  { name: '3. Error Injection Simulator', path: '/error-injector', icon: Zap },
  { name: '4. CRC Algorithm Comparison', path: '/algorithm-comparison', icon: GitCompare },
  { name: '5. AI Anomaly Detection', path: '/ai-anomaly-detection', icon: BrainCircuit, tag: 'AI' },
  { name: '6. AI Error-Pattern Analysis', path: '/ai-error-analysis', icon: BarChart3, tag: 'AI' },
  { name: '7. Real-Time Monitoring', path: '/realtime-monitoring', icon: Activity },
  { name: '8. Alerts & Analytics', path: '/analytics-alerts', icon: BellRing },
];

export const Sidebar = () => {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
      <div className="p-4">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">
          System Modules
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.tag && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] uppercase font-bold bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                    {item.tag}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
        <div className="font-semibold text-slate-400">CRC Integrity System</div>
        <div>College Project Architecture v1.0</div>
      </div>
    </aside>
  );
};
