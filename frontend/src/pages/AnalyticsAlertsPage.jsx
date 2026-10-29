import React, { useState, useEffect, useCallback } from 'react';
import {
  BellRing,
  AlertTriangle,
  ShieldAlert,
  Info,
  CheckCircle2,
  RefreshCw,
  Clock,
  Download,
  Activity,
  Layers,
  BarChart3,
  Sliders,
  FileSpreadsheet,
  Cpu,
  Radio,
  Zap,
  Check,
  X
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  fetchAlertsApi,
  fetchAlertStatsApi,
  acknowledgeAlertApi,
  fetchHistoricalOverviewApi,
  fetchHistoricalTimelineApi,
  fetchHistoricalErrorsApi,
  fetchHistoricalAlgorithmsApi,
  exportHistoricalDataApi,
  fetchHealthCheck
} from '../services/api';

const SEVERITY_STYLES = {
  CRITICAL: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    icon: ShieldAlert,
    label: 'Critical'
  },
  HIGH: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    icon: AlertTriangle,
    label: 'High'
  },
  WARNING: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    icon: Sliders,
    label: 'Warning'
  },
  INFO: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    icon: Info,
    label: 'Info'
  }
};

const ERROR_TYPE_COLORS = {
  SINGLE_BIT: '#06b6d4',
  MULTI_BIT: '#f59e0b',
  BURST: '#8b5cf6',
  RANDOM: '#10b981',
  UNKNOWN: '#64748b'
};

const formatTimestamp = (ts) => {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString('en-US', {
      dateStyle: 'short',
      timeStyle: 'medium'
    });
  } catch {
    return ts;
  }
};

export const AnalyticsAlertsPage = () => {
  // Navigation tab
  const [activeTab, setActiveTab] = useState('alerts');

  // Alert state
  const [alerts, setAlerts] = useState([]);
  const [alertStats, setAlertStats] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [acknowledgingId, setAcknowledgingId] = useState(null);

  // Historical Analytics state
  const [historicalOverview, setHistoricalOverview] = useState(null);
  const [historicalTimeline, setHistoricalTimeline] = useState([]);
  const [historicalErrors, setHistoricalErrors] = useState(null);
  const [historicalAlgos, setHistoricalAlgos] = useState([]);

  // UX & Filters state
  const [backendOnline, setBackendOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [exportingType, setExportingType] = useState(null);

  // Alert filters
  const [severityFilter, setSeverityFilter] = useState('');
  const [ackFilter, setAckFilter] = useState('');
  const [alertTypeFilter, setAlertTypeFilter] = useState('');

  // Load all module data
  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setErrorMsg(null);

    try {
      const [
        healthRes,
        alertsRes,
        statsRes,
        overviewRes,
        timelineRes,
        errorsRes,
        algosRes
      ] = await Promise.all([
        fetchHealthCheck(),
        fetchAlertsApi({
          severity: severityFilter,
          acknowledged: ackFilter,
          alertType: alertTypeFilter,
          limit: 100
        }),
        fetchAlertStatsApi(),
        fetchHistoricalOverviewApi(),
        fetchHistoricalTimelineApi({ buckets: 8 }),
        fetchHistoricalErrorsApi(),
        fetchHistoricalAlgorithmsApi()
      ]);

      setBackendOnline(healthRes.success);

      if (alertsRes.success) {
        setAlerts(alertsRes.alerts);
      }
      if (statsRes.success) {
        setAlertStats(statsRes.stats);
      }
      if (overviewRes.success) {
        setHistoricalOverview(overviewRes.data);
      }
      if (timelineRes.success) {
        setHistoricalTimeline(timelineRes.timeline);
      }
      if (errorsRes.success) {
        setHistoricalErrors(errorsRes.data);
      }
      if (algosRes.success) {
        setHistoricalAlgos(algosRes.algorithms);
      }

      setLastRefreshed(new Date());
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load alert and analytics records.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [severityFilter, ackFilter, alertTypeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle alert acknowledgement
  const handleAcknowledge = async (alertId) => {
    setAcknowledgingId(alertId);
    try {
      const res = await acknowledgeAlertApi(alertId);
      if (res.success && res.alert) {
        // Update in local state
        setAlerts(prev => prev.map(a => a.alertId === alertId ? res.alert : a));
        if (selectedAlert && selectedAlert.alertId === alertId) {
          setSelectedAlert(res.alert);
        }
        // Refresh stats
        const statsRes = await fetchAlertStatsApi();
        if (statsRes.success) setAlertStats(statsRes.stats);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to acknowledge alert.');
    } finally {
      setAcknowledgingId(null);
    }
  };

  // Handle CSV Export
  const handleExport = async (type) => {
    setExportingType(type);
    try {
      await exportHistoricalDataApi({ type });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to trigger CSV export.');
    } finally {
      setExportingType(null);
    }
  };

  // Format chart pie data
  const pieData = (historicalErrors?.distribution || [])
    .filter(d => d.count > 0)
    .map(d => ({
      name: d.errorType.replace('_', ' '),
      value: d.count,
      pct: d.percentage,
      color: ERROR_TYPE_COLORS[d.errorType] || '#64748b'
    }));

  const severityPieData = alertStats?.bySeverity
    ? [
        { name: 'Critical', value: alertStats.bySeverity.critical, color: '#f43f5e' },
        { name: 'High', value: alertStats.bySeverity.high, color: '#f97316' },
        { name: 'Warning', value: alertStats.bySeverity.warning, color: '#f59e0b' },
        { name: 'Info', value: alertStats.bySeverity.info, color: '#3b82f6' }
      ].filter(d => d.value > 0)
    : [];

  return (
    <div className="space-y-6">
      {/* ─── 1. Header & Controls ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5">
              <BellRing className="w-3.5 h-3.5" />
              Module 8
            </span>
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-indigo-400" /> Incident Response & Retrospective Audit
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <BellRing className="w-7 h-7 text-rose-400" />
            Alerts & Historical Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Centralized data-integrity incident management, automated threshold anomaly triggers, and retrospective telemetry analytics across recorded transmission logs.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center">
          <div className="text-right text-xs hidden sm:block">
            <div className="text-slate-400">
              {lastRefreshed ? `Updated ${lastRefreshed.toLocaleTimeString()}` : 'Loading...'}
            </div>
            <div className="text-slate-500 text-[10px]">
              {backendOnline ? 'Backend Connected (In-Memory Scope)' : 'Offline'}
            </div>
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition disabled:opacity-50"
            title="Refresh Alert & Analytics Records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-rose-400' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ─── Error Banner ─── */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-xs px-2 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded text-rose-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ─── 2. Key Metric Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Alerts */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Alerts</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <BellRing className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">
              {alertStats?.totalAlerts ?? alerts.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Generated this session
            </div>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Critical Incidents</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-400 tracking-tight">
              {alertStats?.bySeverity?.critical ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Undetected corruptions
            </div>
          </div>
        </div>

        {/* High Severity */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">High Severity</span>
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-orange-400 tracking-tight">
              {alertStats?.bySeverity?.high ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              AI anomalies & bursts
            </div>
          </div>
        </div>

        {/* Unacknowledged */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Unacknowledged</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-400 tracking-tight">
              {alertStats?.unacknowledged ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Require review
            </div>
          </div>
        </div>

        {/* Acknowledged */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Acknowledged</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">
              {alertStats?.acknowledged ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Marked as reviewed
            </div>
          </div>
        </div>

        {/* Telemetry Scope */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Historical Events</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">
              {historicalOverview?.totalEvents ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Total session records
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. Navigation Tabs ─── */}
      <div className="flex border-b border-slate-800 overflow-x-auto gap-2">
        {[
          { id: 'alerts', label: `Alert Center (${alerts.length})`, icon: BellRing },
          { id: 'analytics', label: 'Historical Analytics Dashboard', icon: BarChart3 },
          { id: 'insights', label: 'Analytical Findings & Insights', icon: Cpu },
          { id: 'export', label: 'Data Export & Audit CSV', icon: FileSpreadsheet }
        ].map(tab => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-4 font-medium text-sm transition-all border-b-2 -mb-px whitespace-nowrap ${
                isActive
                  ? 'border-rose-500 text-rose-400 bg-rose-500/5 rounded-t-lg'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: Alert Center ─── */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
                Filters:
              </span>

              {/* Severity Filter */}
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-rose-500"
              >
                <option value="">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="WARNING">Warning</option>
                <option value="INFO">Info</option>
              </select>

              {/* Status Filter */}
              <select
                value={ackFilter}
                onChange={(e) => setAckFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-rose-500"
              >
                <option value="">All Statuses</option>
                <option value="false">Unacknowledged</option>
                <option value="true">Acknowledged</option>
              </select>

              {/* Alert Type Filter */}
              <select
                value={alertTypeFilter}
                onChange={(e) => setAlertTypeFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-rose-500"
              >
                <option value="">All Types</option>
                <option value="CRC_BYPASS_UNDETECTED">Undetected Corruption</option>
                <option value="CORRUPTED_FRAME_CAUGHT">Corrupted Frame Caught</option>
                <option value="AI_ANOMALY_FLAGGED">AI Anomaly Flagged</option>
                <option value="BURST_NOISE_DOMINANT">Burst Noise Dominant</option>
                <option value="TRANSMISSION_CRC_MISMATCH">Transmission Mismatch</option>
              </select>

              {(severityFilter || ackFilter || alertTypeFilter) && (
                <button
                  onClick={() => {
                    setSeverityFilter('');
                    setAckFilter('');
                    setAlertTypeFilter('');
                  }}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded border border-slate-700 transition"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <span className="text-xs text-slate-400">
              Showing {alerts.length} incident records
            </span>
          </div>

          {/* Alerts Table */}
          {alerts.length > 0 ? (
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 backdrop-blur-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/50 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                    <tr>
                      <th className="py-3 px-4">Severity</th>
                      <th className="py-3 px-4">Alert ID</th>
                      <th className="py-3 px-4">Incident Title & Description</th>
                      <th className="py-3 px-4">Source Module</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {alerts.map((alert) => {
                      const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.INFO;
                      const Icon = style.icon;
                      const isAcking = acknowledgingId === alert.alertId;
                      return (
                        <tr key={alert.alertId} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border ${style.badge}`}>
                              <Icon className="w-3 h-3" />
                              {alert.severity}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                            {alert.alertId}
                          </td>
                          <td className="py-3 px-4 max-w-sm">
                            <div className="font-semibold text-slate-200">{alert.title}</div>
                            <div className="text-[11px] text-slate-400 truncate">{alert.description}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                            {alert.sourceModule}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                            {formatTimestamp(alert.timestamp)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {alert.acknowledged ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                <Check className="w-3 h-3" /> Acknowledged
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                <Clock className="w-3 h-3" /> Unacknowledged
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                            <button
                              onClick={() => setSelectedAlert(alert)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium border border-slate-700 transition"
                            >
                              Details
                            </button>
                            {!alert.acknowledged && (
                              <button
                                onClick={() => handleAcknowledge(alert.alertId)}
                                disabled={isAcking}
                                className="px-2.5 py-1 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded text-xs font-semibold shadow-sm transition disabled:opacity-50"
                              >
                                {isAcking ? 'Saving...' : 'Acknowledge'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-sm bg-slate-900/60 rounded-2xl border border-dashed border-slate-800">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <div className="font-semibold text-slate-300">No Alerts Recorded</div>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No active incidents match the selected filter. Run error injections in Module 3 or AI anomaly analysis in Module 5 to trigger alerts.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: Historical Analytics Dashboard ─── */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Timeline AreaChart */}
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm space-y-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                Transmission Success vs Channel Errors Over Time
              </h2>
              {historicalTimeline.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historicalTimeline}>
                      <defs>
                        <linearGradient id="txSuccGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="txFailGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
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
                          color: '#fff'
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="successfulTransmissions"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#txSuccGrad)"
                        name="Successful Packets"
                      />
                      <Area
                        type="monotone"
                        dataKey="failedTransmissions"
                        stroke="#f43f5e"
                        fillOpacity={1}
                        fill="url(#txFailGrad)"
                        name="CRC Failures"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
                  Insufficient historical timeline records.
                </div>
              )}
            </div>

            {/* Algorithm Resilience BarChart */}
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm space-y-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-purple-400" />
                Empirical Detection Rate by CRC Polynomial
              </h2>
              {historicalAlgos.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={historicalAlgos}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="algorithm" stroke="#64748b" />
                      <YAxis stroke="#64748b" unit="%" domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '0.75rem',
                          color: '#fff'
                        }}
                      />
                      <Bar
                        dataKey="empiricalDetectionRate"
                        fill="#8b5cf6"
                        radius={[6, 6, 0, 0]}
                        name="Detection Rate %"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
                  No algorithm trials recorded.
                </div>
              )}
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Error Distribution PieChart */}
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm space-y-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Historical Injected Corruption Distribution
              </h2>
              {pieData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={50}
                        paddingAngle={4}
                        label={({ name, pct }) => `${name}: ${pct}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '0.75rem',
                          color: '#fff'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
                  No error injections recorded in current session.
                </div>
              )}
            </div>

            {/* Alert Severity Breakdown PieChart */}
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm space-y-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Alert Distribution by Severity
              </h2>
              {severityPieData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={severityPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={50}
                        paddingAngle={4}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {severityPieData.map((entry, index) => (
                          <Cell key={`sev-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '0.75rem',
                          color: '#fff'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
                  No alert severity records available.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: Analytical Findings & Insights ─── */}
      {activeTab === 'insights' && (
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                Retrospective Data Integrity Findings
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Deterministic conclusions derived from descriptive statistical aggregations over recorded session telemetry.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Finding 1: Transmission Integrity */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" /> Transmission Integrity Summary
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Across {historicalOverview?.transmissions?.total ?? 0} total transmission packet streams,{' '}
                {historicalOverview?.transmissions?.successful ?? 0} packets were verified completely intact, representing a{' '}
                {historicalOverview?.transmissions?.total > 0
                  ? (100 - (historicalOverview?.transmissions?.errorRateNumeric || 0)).toFixed(2)
                  : 100}% channel pass rate.
              </p>
            </div>

            {/* Finding 2: Error Injection Resilience */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
                <Zap className="w-4 h-4" /> Empirical CRC Detection Resilience
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {historicalOverview?.errorInjections?.total ?? 0} deliberate error corruptions tested.{' '}
                {historicalOverview?.errorInjections?.detected ?? 0} were caught by receiver CRC validation (
                {historicalOverview?.errorInjections?.detectionRate ?? 'N/A'} catch rate).
                {historicalOverview?.errorInjections?.undetected > 0 &&
                  ` Note: ${historicalOverview.errorInjections.undetected} corruption(s) bypassed CRC checksum validation.`}
              </p>
            </div>

            {/* Finding 3: Alert Operational Status */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" /> Incident Response Backlog
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {alertStats?.unacknowledged ?? 0} unacknowledged data integrity incident(s) currently require operator review{' '}
                ({alertStats?.bySeverity?.critical ?? 0} Critical, {alertStats?.bySeverity?.high ?? 0} High).
              </p>
            </div>

            {/* Finding 4: Error Distribution Pattern */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                <BarChart3 className="w-4 h-4" /> Bit Mutation Profile
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {historicalErrors?.bitStats?.count > 0
                  ? `Average of ${historicalErrors.bitStats.mean} bits altered per injection event (range ${historicalErrors.bitStats.min}–${historicalErrors.bitStats.max} bits).`
                  : 'No bit alteration telemetry recorded yet.'}
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
            <div className="font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-400" /> Scientific & Methodological Transparency Note
            </div>
            Findings represent observed historical performance within the current in-memory simulation session. Observed correlations describe empirical test bounds and do not make unverified causal claims.
          </div>
        </div>
      )}

      {/* ─── TAB 4: Data Export & Audit CSV ─── */}
      {activeTab === 'export' && (
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              Export Historical Audit Reports (CSV)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Download sanitized, structured CSV reports for offline compliance auditing and external analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Export 1: Alerts */}
            <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-between space-y-4">
              <div>
                <div className="p-2 w-fit rounded-lg bg-rose-500/10 text-rose-400 mb-3">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Incident Alerts Log</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Export complete alert records including alert IDs, severity, source modules, timestamps, and acknowledgement status.
                </p>
              </div>
              <button
                onClick={() => handleExport('alerts')}
                disabled={exportingType === 'alerts'}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-900/20 transition disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {exportingType === 'alerts' ? 'Generating CSV...' : 'Download Alerts CSV'}
              </button>
            </div>

            {/* Export 2: Telemetry */}
            <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-between space-y-4">
              <div>
                <div className="p-2 w-fit rounded-lg bg-blue-500/10 text-blue-400 mb-3">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Raw Telemetry Event Stream</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Export all recorded transmission and error-injection event records with CRC match statuses, altered bit counts, and algorithms.
                </p>
              </div>
              <button
                onClick={() => handleExport('telemetry')}
                disabled={exportingType === 'telemetry'}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-900/20 transition disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {exportingType === 'telemetry' ? 'Generating CSV...' : 'Download Telemetry CSV'}
              </button>
            </div>

            {/* Export 3: Summary */}
            <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-between space-y-4">
              <div>
                <div className="p-2 w-fit rounded-lg bg-emerald-500/10 text-emerald-400 mb-3">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Executive Metrics Summary</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Export key aggregate performance indicators including total packets, detection rates, and unacknowledged alert counts.
                </p>
              </div>
              <button
                onClick={() => handleExport('summary')}
                disabled={exportingType === 'summary'}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/20 transition disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {exportingType === 'summary' ? 'Generating CSV...' : 'Download Summary CSV'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 4. Alert Details Modal ─── */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${SEVERITY_STYLES[selectedAlert.severity]?.badge}`}>
                  {selectedAlert.severity}
                </span>
                <span className="font-mono font-bold text-white text-sm">
                  {selectedAlert.alertId}
                </span>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-base font-bold text-white">{selectedAlert.title}</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedAlert.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 block">Source Module:</span>
                  <span className="text-slate-200 font-semibold">{selectedAlert.sourceModule}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Related Event / ID:</span>
                  <span className="text-slate-200 font-mono">{selectedAlert.relatedId || 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Incident Timestamp:</span>
                  <span className="text-slate-200 font-mono">{formatTimestamp(selectedAlert.timestamp)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Acknowledgement Status:</span>
                  <span className={selectedAlert.acknowledged ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                    {selectedAlert.acknowledged ? `Acknowledged (${formatTimestamp(selectedAlert.acknowledgedAt)})` : 'Unacknowledged'}
                  </span>
                </div>
              </div>

              {selectedAlert.metadata && Object.keys(selectedAlert.metadata).length > 0 && (
                <div>
                  <span className="text-xs text-slate-400 font-semibold mb-1 block">Event Metadata:</span>
                  <pre className="p-3 rounded-lg bg-slate-950 text-[11px] font-mono text-cyan-300 overflow-x-auto border border-slate-800/80">
                    {JSON.stringify(selectedAlert.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              {!selectedAlert.acknowledged && (
                <button
                  onClick={() => handleAcknowledge(selectedAlert.alertId)}
                  disabled={acknowledgingId === selectedAlert.alertId}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition disabled:opacity-50"
                >
                  {acknowledgingId === selectedAlert.alertId ? 'Acknowledging...' : 'Acknowledge Incident'}
                </button>
              )}
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
