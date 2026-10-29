import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  RefreshCw,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle2,
  Radio,
  Zap,
  BrainCircuit,
  BarChart3,
  ShieldCheck,
  Cpu,
  Clock,
  Server,
  ArrowUpRight,
  TrendingUp,
  Info
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  fetchMonitoringOverviewApi,
  fetchMonitoringActivityApi,
  fetchMonitoringTimelineApi,
  fetchMonitoringHealthApi
} from '../services/api';

const EVENT_TYPE_STYLES = {
  TRANSMISSION: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    icon: Radio,
    label: 'Transmission'
  },
  ERROR_INJECTION: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    icon: Zap,
    label: 'Error Injection'
  },
  ANOMALY_DETECTION: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    icon: BrainCircuit,
    label: 'AI Anomaly'
  },
  PATTERN_ANALYSIS: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    icon: BarChart3,
    label: 'Pattern Run'
  }
};

const formatTime = (ts) => {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return ts;
  }
};

export const RealTimeMonitoringPage = () => {
  // Core state
  const [overview, setOverview] = useState(null);
  const [activities, setActivities] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);

  // UX & Polling state
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [isStale, setIsStale] = useState(false);

  // Filters state
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [algorithmFilter, setAlgorithmFilter] = useState('');
  const [rowLimit, setRowLimit] = useState(20);

  // Polling guard
  const inFlightRef = useRef(false);

  // Fetch all monitoring telemetry
  const fetchAllData = useCallback(async (isManual = false) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    if (isManual) {
      setRefreshing(true);
    }

    try {
      const [overviewRes, activityRes, timelineRes, healthRes] = await Promise.all([
        fetchMonitoringOverviewApi(),
        fetchMonitoringActivityApi({
          limit: rowLimit,
          eventType: eventTypeFilter,
          algorithm: algorithmFilter
        }),
        fetchMonitoringTimelineApi(8),
        fetchMonitoringHealthApi()
      ]);

      if (overviewRes.success) {
        setOverview(overviewRes.data);
      }
      if (activityRes.success) {
        setActivities(activityRes.activities);
      }
      if (timelineRes.success) {
        setTimeline(timelineRes.timeline);
      }
      if (healthRes.success) {
        setSystemHealth(healthRes.health);
      }

      setLastUpdated(new Date());
      setIsStale(false);
      setError(null);
    } catch (err) {
      setError(err.message || 'Telemetry connection error');
      setIsStale(true);
    } finally {
      inFlightRef.current = false;
      setRefreshing(false);
    }
  }, [rowLimit, eventTypeFilter, algorithmFilter]);

  // Initial load & filter change reload
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Live polling interval (every 5 seconds)
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      fetchAllData(false);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [autoRefresh, fetchAllData]);

  const clearFilters = () => {
    setEventTypeFilter('');
    setAlgorithmFilter('');
    setRowLimit(20);
  };

  const isOnline = systemHealth?.status === 'OK';

  return (
    <div className="space-y-6">
      {/* ─── 1. Header & Live Stream Controls ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              Module 7
            </span>
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              Live Telemetry Stream
            </span>
            {isStale && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Stale Data
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Activity className="w-7 h-7 text-indigo-400" />
            Real-Time Monitoring Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Live telemetry visualizer consolidating packet streams, error injections, AI anomaly classifications, and CRC integrity profiles across all active subsystems.
          </p>
        </div>

        {/* Polling & Manual Refresh Controls */}
        <div className="flex items-center gap-3 self-start md:self-center">
          <div className="text-right text-xs hidden sm:block">
            <div className="text-slate-400">
              {lastUpdated ? `Updated ${formatTime(lastUpdated)}` : 'Connecting...'}
            </div>
            <div className="text-slate-500 text-[10px]">
              {autoRefresh ? 'Polling every 5s' : 'Auto-refresh paused'}
            </div>
          </div>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
              autoRefresh
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title={autoRefresh ? 'Pause Auto-Refresh' : 'Resume Auto-Refresh'}
          >
            {autoRefresh ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {autoRefresh ? 'Live' : 'Paused'}
          </button>

          <button
            onClick={() => fetchAllData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-900/20 transition disabled:opacity-50"
            title="Force immediate telemetry poll"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ─── Error Notification Banner ─── */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span>Telemetry polling failed: {error}. Showing last cached records.</span>
          </div>
          <button
            onClick={() => fetchAllData(true)}
            className="text-xs px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded font-medium text-rose-200 border border-rose-500/40"
          >
            Retry
          </button>
        </div>
      )}

      {/* ─── 2. Key Metric Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Transmissions */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Transmissions</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">
              {overview?.transmissions?.total ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {overview?.transmissions?.successful ?? 0} verified intact
            </div>
          </div>
        </div>

        {/* Successful Transmissions */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">CRC Matched</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">
              {overview?.transmissions?.successful ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {overview?.transmissions?.crcErrors ?? 0} channel errors
            </div>
          </div>
        </div>

        {/* Error Injections */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Injections Tested</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">
              {overview?.errorInjections?.total ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Module 3 error runs
            </div>
          </div>
        </div>

        {/* Errors Detected */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Injections Caught</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-purple-400 tracking-tight">
              {overview?.errorInjections?.detected ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {overview?.errorInjections?.notDetected ?? 0} bypassed CRC
            </div>
          </div>
        </div>

        {/* Empirical Detection Rate */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Empirical Det. Rate</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-cyan-400 tracking-tight">
              {overview?.errorInjections?.detectionRate ?? 'N/A'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              On injected corruption
            </div>
          </div>
        </div>

        {/* Detected Anomalies */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">AI Anomalies</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <BrainCircuit className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-400 tracking-tight">
              {overview?.aiIntelligence?.anomaliesDetected ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {overview?.aiIntelligence?.anomalyAnalysesPerformed ?? 0} runs performed
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. Timeline Chart & AI Intelligence Status ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-Time Event Timeline */}
        <div className="lg:col-span-2 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Transmission & Injection Event Activity Timeline
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Dynamic aggregation over chronological telemetry buckets across the current session.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400 px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700">
              {timeline.length} time windows
            </span>
          </div>

          {timeline.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline}>
                  <defs>
                    <linearGradient id="txColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="injColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="detColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="transmissions"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#txColor)"
                    name="Transmissions"
                  />
                  <Area
                    type="monotone"
                    dataKey="injections"
                    stroke="#f59e0b"
                    fillOpacity={1}
                    fill="url(#injColor)"
                    name="Error Injections"
                  />
                  <Area
                    type="monotone"
                    dataKey="detectedErrors"
                    stroke="#8b5cf6"
                    fillOpacity={1}
                    fill="url(#detColor)"
                    name="Detected By CRC"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">
              <Clock className="w-8 h-8 text-slate-600 mb-2" />
              <span>No timeline records available yet.</span>
              <span className="text-xs text-slate-500 mt-1">
                Run transmissions in Module 2 or error injections in Module 3.
              </span>
            </div>
          )}
        </div>

        {/* AI & Subsystem Intelligence Status Widget */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            AI Subsystem Intelligence
          </h2>

          <div className="space-y-3">
            {/* Anomaly Module Status */}
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <BrainCircuit className="w-3.5 h-3.5 text-rose-400" />
                  Module 5 Anomaly Engine
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  overview?.aiIntelligence?.latestAnomalyStatus === 'ANOMALY'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : overview?.aiIntelligence?.latestAnomalyStatus === 'NORMAL'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {overview?.aiIntelligence?.latestAnomalyStatus || 'NO RUNS'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {overview?.aiIntelligence?.anomaliesDetected ?? 0} anomaly occurrences flagged across {overview?.aiIntelligence?.anomalyAnalysesPerformed ?? 0} total evaluations.
              </p>
              <Link
                to="/ai-anomaly-detection"
                className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition"
              >
                Inspect Anomaly Engine <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Pattern Analysis Module Status */}
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
                  Module 6 Pattern Classifier
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 truncate max-w-[120px]">
                  {overview?.aiIntelligence?.latestDominantPattern || 'NO RUNS'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {overview?.aiIntelligence?.patternAnalysesPerformed ?? 0} pattern assessments conducted this session.
              </p>
              <Link
                to="/ai-error-analysis"
                className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-medium text-purple-400 hover:text-purple-300 transition"
              >
                Inspect Pattern Engine <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. Live Unified Activity Feed & Filtering ─── */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 backdrop-blur-sm overflow-hidden space-y-4 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Unified Real-Time Event Stream
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Chronological feed merging transmissions, injections, anomaly runs, and pattern reports.
            </p>
          </div>

          {/* Activity Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Event Type Filter */}
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Events</option>
              <option value="TRANSMISSION">Transmissions</option>
              <option value="ERROR_INJECTION">Injections</option>
              <option value="ANOMALY_DETECTION">AI Anomalies</option>
              <option value="PATTERN_ANALYSIS">Pattern Analyses</option>
            </select>

            {/* Algorithm Filter */}
            <select
              value={algorithmFilter}
              onChange={(e) => setAlgorithmFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Algorithms</option>
              <option value="CRC-8">CRC-8</option>
              <option value="CRC-16">CRC-16</option>
              <option value="CRC-32">CRC-32</option>
            </select>

            {/* Limit Selector */}
            <select
              value={rowLimit}
              onChange={(e) => setRowLimit(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value={10}>10 Rows</option>
              <option value={20}>20 Rows</option>
              <option value={50}>50 Rows</option>
            </select>

            {(eventTypeFilter || algorithmFilter || rowLimit !== 20) && (
              <button
                onClick={clearFilters}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800/80 hover:bg-slate-800 rounded border border-slate-700 transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Activities Table */}
        {activities.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/50 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Identifier</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Subsystem / Algorithm</th>
                  <th className="py-3 px-4">Result / Status</th>
                  <th className="py-3 px-4">Telemetry Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {activities.map((item, idx) => {
                  const style = EVENT_TYPE_STYLES[item.eventType] || EVENT_TYPE_STYLES.TRANSMISSION;
                  const Icon = style.icon;
                  return (
                    <tr key={item.activityId || idx} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border ${style.bg} ${style.border} ${style.text}`}>
                          <Icon className="w-3 h-3" />
                          {style.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-white text-[11px]">
                        {item.sourceId || item.activityId}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {formatTime(item.timestamp)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-200">
                        {item.algorithm}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'SUCCESS' || item.status === 'NORMAL' || item.status === 'COMPLETE' || item.errorDetected
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                        {item.details}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">
            <Info className="w-6 h-6 mx-auto mb-2 text-slate-600" />
            No events match the active filters or no telemetry has been recorded yet.
          </div>
        )}
      </div>

      {/* ─── 5. System Health Status Panel ─── */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            System & Subsystem Operational Health
          </h2>
          <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
            isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            Backend {isOnline ? 'Online' : 'Degraded'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { key: 'crcGenerator', label: '1. CRC Engine' },
            { key: 'transmissionSimulator', label: '2. Transmission' },
            { key: 'errorInjector', label: '3. Error Injector' },
            { key: 'algorithmComparison', label: '4. Comparison' },
            { key: 'aiAnomalyDetection', label: '5. AI Anomaly' },
            { key: 'aiErrorPatternAnalysis', label: '6. AI Patterns' },
            { key: 'monitoringDashboard', label: '7. Monitoring' }
          ].map((mod) => {
            const status = systemHealth?.modules?.[mod.key] || 'unknown';
            const isActive = status === 'active';
            return (
              <div
                key={mod.key}
                className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 flex flex-col justify-between"
              >
                <span className="text-[11px] font-semibold text-slate-300 truncate">
                  {mod.label}
                </span>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span className={`text-[10px] font-bold uppercase ${isActive ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
          <span>Server Uptime: {systemHealth?.uptimeSeconds ? `${systemHealth.uptimeSeconds} seconds` : '—'}</span>
          <span>Node.js / Express Architecture</span>
        </div>
      </div>
    </div>
  );
};
