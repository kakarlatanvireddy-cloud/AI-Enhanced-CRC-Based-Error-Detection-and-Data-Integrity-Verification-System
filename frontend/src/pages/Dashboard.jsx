import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  Percent, 
  BrainCircuit, 
  Activity, 
  ArrowUpRight,
  Server,
  Layers
} from 'lucide-react';
import { fetchHealthCheck, fetchTransmissionStatsApi } from '../services/api';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const [backendStatus, setBackendStatus] = useState({ loading: true, online: false, data: null });
  const [txStats, setTxStats] = useState({
    totalTransmissions: 0,
    successfulTransmissions: 0,
    crcErrors: 0,
    errorRate: "0.00%"
  });

  useEffect(() => {
    const fetchData = async () => {
      const healthRes = await fetchHealthCheck();
      if (healthRes.success) {
        setBackendStatus({ loading: false, online: true, data: healthRes.data });
      } else {
        setBackendStatus({ loading: false, online: false, data: null });
      }

      const statsRes = await fetchTransmissionStatsApi();
      if (statsRes.success) {
        setTxStats(statsRes.stats);
      }
    };

    fetchData();
  }, []);

  const metricCards = [
    {
      title: "Total Transmissions",
      value: String(txStats.totalTransmissions),
      subtext: txStats.totalTransmissions > 0 ? "Simulated live stream" : "Simulation active",
      icon: Radio,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      isLive: true
    },
    {
      title: "Successful Transmissions",
      value: String(txStats.successfulTransmissions),
      subtext: txStats.totalTransmissions > 0 ? "Packets verified intact" : "No packets processed",
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      isLive: true
    },
    {
      title: "CRC Errors",
      value: String(txStats.crcErrors),
      subtext: txStats.crcErrors > 0 ? "Corruption detected" : "No errors detected",
      icon: AlertTriangle,
      color: txStats.crcErrors > 0 ? "text-rose-400" : "text-slate-400",
      bg: txStats.crcErrors > 0 ? "bg-rose-500/10" : "bg-slate-800/40",
      border: txStats.crcErrors > 0 ? "border-rose-500/20" : "border-slate-700/50",
      isLive: true
    },
    {
      title: "Current Error Rate",
      value: txStats.errorRate,
      subtext: "Live BER telemetry",
      icon: Percent,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      isLive: true
    },
    {
      title: "AI Status",
      value: "Standby",
      subtext: "Module reserved (Python)",
      icon: BrainCircuit,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      isLive: false
    },
    {
      title: "System Status",
      value: backendStatus.online ? "Backend Online" : "Backend Offline",
      subtext: backendStatus.online ? "Node.js API Active" : "Express server unreachable",
      icon: Activity,
      color: backendStatus.online ? "text-emerald-400" : "text-rose-400",
      bg: backendStatus.online ? "bg-emerald-500/10" : "bg-rose-500/10",
      border: backendStatus.online ? "border-emerald-500/20" : "border-rose-500/20",
      isLive: true
    }
  ];

  const plannedModules = [
    { num: '01', title: 'CRC Generator & Verifier', path: '/crc-generator', desc: 'Compute & verify bit-level checksums', active: true },
    { num: '02', title: 'Transmission Simulator', path: '/transmission-sim', desc: 'Stream simulated binary packets', active: true },
    { num: '03', title: 'Error Injection Simulator', path: '/error-injector', desc: 'Inject single, burst, and random errors', active: true },
    { num: '04', title: 'CRC Algorithm Comparison', path: '/algorithm-comparison', desc: 'Compare CRC-8, CRC-16, and CRC-32', active: true },
    { num: '05', title: 'AI Anomaly Detection', path: '/ai-anomaly-detection', desc: 'Detect abnormal packet structures', active: true },
    { num: '06', title: 'AI Error-Pattern Analysis', path: '/ai-error-analysis', desc: 'Analyze error distribution patterns', active: true },
    { num: '07', title: 'Real-Time Monitoring', path: '/realtime-monitoring', desc: 'Live visual throughput telemetry', active: true },
    { num: '08', title: 'Alerts & Analytics', path: '/analytics-alerts', desc: 'Log analysis and alert thresholds', active: true },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100">
              System Overview & Metrics
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Modules 01 & 02 active. Real-time packet telemetry & CRC verification engine active.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs rounded-lg font-medium">
              Vite + React Frontend
            </span>
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-lg font-medium">
              Express REST Backend
            </span>
          </div>
        </div>
      </div>

      {/* 6 Required Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`p-2 rounded-lg ${card.bg} ${card.color} border ${card.border}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-100 tracking-tight">
                  {card.value}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                  <span>{card.subtext}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    card.isLive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800/80 text-slate-600'
                  }`}>
                    {card.isLive ? 'Live Telemetry' : 'Placeholder'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Backend API Connection Verification Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Server className="w-4 h-4 text-indigo-400" />
          Backend REST API Diagnostics
        </h3>
        
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 space-y-2 overflow-x-auto">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-slate-500">Endpoint: GET /api/health</span>
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
              backendStatus.online ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {backendStatus.online ? 'Connected (200 OK)' : 'Disconnected'}
            </span>
          </div>
          {backendStatus.loading ? (
            <div className="text-slate-500 italic">Pinging backend API...</div>
          ) : backendStatus.online ? (
            <pre className="text-emerald-300 text-[11px] leading-relaxed">
              {JSON.stringify(backendStatus.data, null, 2)}
            </pre>
          ) : (
            <div className="text-rose-400">
              Backend not responding on http://localhost:5000. Please start the backend server with `npm start` or `npm run dev` inside `/backend`.
            </div>
          )}
        </div>
      </div>

      {/* Planned 8 Modules Architecture Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            System Modules Architecture Matrix
          </h3>
          <span className="text-xs text-slate-400">8 Modules Registered</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plannedModules.map((mod) => (
            <Link
              key={mod.num}
              to={mod.path}
              className="group bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/40 rounded-lg p-4 transition-all hover:bg-slate-900"
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                  mod.active 
                    ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' 
                    : 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20'
                }`}>
                  M{mod.num} {mod.active ? '• Active' : ''}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </div>
              <h4 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors mb-1 truncate">
                {mod.title}
              </h4>
              <p className="text-[11px] text-slate-400 line-clamp-2">
                {mod.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
