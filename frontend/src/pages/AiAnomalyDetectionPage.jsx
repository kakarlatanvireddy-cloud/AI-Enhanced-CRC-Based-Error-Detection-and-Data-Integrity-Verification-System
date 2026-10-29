import React, { useState, useEffect, useCallback } from 'react';
import {
  BrainCircuit,
  ScanSearch,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Activity,
  Zap,
  Radio,
  BarChart2,
  Clock,
  Info,
  BookOpen,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import {
  analyzeAnomalyApi,
  fetchAnomalyHistoryApi,
  fetchAnomalyStatsApi
} from '../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTimestamp = (ts) => {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString('en-IN', {
      dateStyle: 'medium', timeStyle: 'medium'
    });
  } catch {
    return ts;
  }
};

const statusConfig = {
  'NORMAL': {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    barColor: '#34d399',
    icon: CheckCircle2,
    label: 'NORMAL'
  },
  'ANOMALY': {
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    barColor: '#fb7185',
    icon: AlertTriangle,
    label: 'ANOMALY'
  },
  'INSUFFICIENT DATA': {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    barColor: '#fbbf24',
    icon: HelpCircle,
    label: 'INSUFFICIENT DATA'
  }
};

const featureLabels = {
  crcErrorRate:       'CRC Error Rate',
  injectionFrequency: 'Injection Frequency',
  avgPayloadSize:     'Avg Payload Size (bytes)',
  avgBitChanges:      'Avg Bit Changes',
  burstActivity:      'Burst Activity'
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge = ({ status, large = false }) => {
  if (!status) return null;
  const cfg = statusConfig[status] || statusConfig['INSUFFICIENT DATA'];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold border ${cfg.bg} ${cfg.color} ${cfg.border} ${large ? 'text-sm' : 'text-xs'}`}>
      <Icon className={large ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      {cfg.label}
    </span>
  );
};

const ScoreGauge = ({ score }) => {
  if (score === null || score === undefined) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2.5 bg-slate-800 rounded-full" />
        <span className="text-xs text-slate-500 w-10 text-right">—</span>
      </div>
    );
  }
  const pct = Math.round(score * 100);
  const isAnomaly = score >= 0.55;
  const barColor = score >= 0.55 ? 'bg-rose-500' : score >= 0.35 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-bold w-10 text-right ${isAnomaly ? 'text-rose-400' : 'text-emerald-400'}`}>
        {score.toFixed(3)}
      </span>
    </div>
  );
};

const FeatureTable = ({ featureComparison }) => {
  if (!featureComparison) return null;
  const rows = Object.entries(featureComparison);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-800">
            <th className="text-left py-2 pr-4 text-slate-400 font-semibold uppercase tracking-wider">Feature</th>
            <th className="text-right py-2 px-3 text-slate-400 font-semibold uppercase tracking-wider">Baseline</th>
            <th className="text-right py-2 px-3 text-slate-400 font-semibold uppercase tracking-wider">Recent</th>
            <th className="text-right py-2 px-3 text-slate-400 font-semibold uppercase tracking-wider">Z-Score</th>
            <th className="text-right py-2 pl-3 text-slate-400 font-semibold uppercase tracking-wider">Deviation</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([key, val]) => {
            const isHighDeviation = Math.abs(val.zScore) >= 2.0;
            return (
              <tr key={key} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td className={`py-2.5 pr-4 font-medium ${isHighDeviation ? 'text-rose-400' : 'text-slate-300'}`}>
                  {featureLabels[key] || key}
                  {isHighDeviation && <span className="ml-1.5 text-[10px] text-rose-400/80 font-bold">⚠ HIGH</span>}
                </td>
                <td className="py-2.5 px-3 text-right text-slate-400 font-mono">{val.baselineMean}</td>
                <td className={`py-2.5 px-3 text-right font-mono font-semibold ${isHighDeviation ? 'text-rose-300' : 'text-slate-200'}`}>{val.recentValue}</td>
                <td className={`py-2.5 px-3 text-right font-mono ${val.zScore > 0 ? 'text-amber-400' : val.zScore < 0 ? 'text-blue-400' : 'text-slate-400'}`}>{val.zScore > 0 ? '+' : ''}{val.zScore}</td>
                <td className="py-2.5 pl-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${val.deviation >= 0.67 ? 'bg-rose-500' : val.deviation >= 0.33 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.round(val.deviation * 100)}%` }}
                      />
                    </div>
                    <span className="text-slate-400 font-mono w-10 text-right">{val.deviation}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const AiAnomalyDetectionPage = () => {
  const [analysis, setAnalysis]           = useState(null);
  const [stats, setStats]                 = useState(null);
  const [history, setHistory]             = useState([]);
  const [loading, setLoading]             = useState(false);
  const [statsLoading, setStatsLoading]   = useState(true);
  const [errorMsg, setErrorMsg]           = useState('');

  // Fetch current stats and history on mount
  const loadStatsAndHistory = useCallback(async () => {
    setStatsLoading(true);
    const [statsRes, histRes] = await Promise.all([
      fetchAnomalyStatsApi(),
      fetchAnomalyHistoryApi(15)
    ]);
    if (statsRes.success) setStats(statsRes.stats);
    if (histRes.success)  setHistory(histRes.history);
    setStatsLoading(false);
  }, []);

  useEffect(() => { loadStatsAndHistory(); }, [loadStatsAndHistory]);

  // Run analysis
  const handleAnalyze = async () => {
    setLoading(true);
    setErrorMsg('');

    const res = await analyzeAnomalyApi();
    setLoading(false);

    if (res.success) {
      setAnalysis(res.data);
      // Refresh stats and history after analysis
      loadStatsAndHistory();
    } else {
      setErrorMsg(res.error || 'Analysis failed. Ensure the backend server is running.');
    }
  };

  // ── Derived Chart Data ────────────────────────────────────────────────────
  const telemetryStats = stats?.telemetryStats || {};

  const eventTypeData = [
    { name: 'Transmissions', value: telemetryStats.transmissionEvents || 0, color: '#60a5fa' },
    { name: 'Injections',    value: telemetryStats.injectionEvents    || 0, color: '#f472b6' }
  ].filter(d => d.value > 0);

  const historyChartData = [...history].reverse().slice(-10).map((h, i) => ({
    name:   `#${i + 1}`,
    score:  h.score ?? 0,
    status: h.status,
    color:  statusConfig[h.status]?.barColor || '#94a3b8'
  }));

  const latestAnalysis = analysis?.analysis;
  const latestStatus   = latestAnalysis?.status;
  const latestCfg      = latestStatus ? statusConfig[latestStatus] : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <BrainCircuit className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 uppercase tracking-wider">Module 05</span>
                <span className="text-[10px] text-slate-500">AI • Statistical Detection</span>
              </div>
              <h1 className="text-xl font-bold text-slate-100">AI Anomaly Detection</h1>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Analyzes transmission telemetry from Modules 2 &amp; 3 to detect unusual patterns across multiple events — 
                CRC detects corruption in individual packets; AI detects anomalies across transmission <em>behaviour</em>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] rounded-lg font-bold uppercase tracking-wider">
              Multi-Feature Z-Score
            </span>
          </div>
        </div>
      </div>

      {/* ── Analyze Button + Error ─────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <ScanSearch className="w-4 h-4 text-purple-400" />
              Transmission Analysis
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Analyzes all telemetry collected during this session. Use Modules 2 &amp; 3 to generate events first.
              {telemetryStats.totalEvents > 0 && (
                <span className="ml-1 text-slate-400">
                  ({telemetryStats.totalEvents} event{telemetryStats.totalEvents !== 1 ? 's' : ''} in telemetry store.)
                </span>
              )}
            </p>
          </div>
          <button
            id="btn-analyze-anomaly"
            onClick={handleAnalyze}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-all shadow-md shadow-purple-900/30 shrink-0"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <BrainCircuit className="w-4 h-4" />
                Analyze Transmissions
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* ── Analysis Result ───────────────────────────────────────────────── */}
      {latestAnalysis && latestCfg && (
        <div className={`bg-slate-900 border rounded-xl p-6 shadow-lg ${latestCfg.border}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              Analysis Result
              <span className="text-[10px] text-slate-500 font-normal">{latestAnalysis.analysisId}</span>
            </h2>
            <StatusBadge status={latestStatus} large />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Score + Explanation */}
            <div className="space-y-4">
              {latestAnalysis.score !== null && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Anomaly Score</span>
                    <span className="text-[10px] text-slate-600">0.0 = identical to baseline · 1.0 = maximum deviation</span>
                  </div>
                  <ScoreGauge score={latestAnalysis.score} />
                  <p className="text-[10px] text-slate-600 mt-1">{latestAnalysis.scoreInterpretation}</p>
                </div>
              )}

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pattern Explanation</span>
                <p className={`mt-1.5 text-sm leading-relaxed ${latestCfg.color}`}>
                  {latestAnalysis.explanation}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-slate-500 mb-0.5">Events Analyzed</div>
                  <div className="text-slate-200 font-bold text-base">{latestAnalysis.eventCount}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-slate-500 mb-0.5">Baseline Window</div>
                  <div className="text-slate-200 font-bold text-base">{latestAnalysis.baselineWindowSize || '—'}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-slate-500 mb-0.5">Recent Window</div>
                  <div className="text-slate-200 font-bold text-base">{latestAnalysis.recentWindowSize || '—'}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-slate-500 mb-0.5">Timestamp</div>
                  <div className="text-slate-300 font-mono text-[10px] leading-snug mt-0.5">{formatTimestamp(latestAnalysis.timestamp)}</div>
                </div>
              </div>

              <div className="bg-slate-800/40 rounded-lg p-3">
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Detection Method</div>
                <div className="text-[11px] text-slate-400">{latestAnalysis.detectionMethod}</div>
              </div>
            </div>

            {/* Right: Feature Comparison */}
            {latestAnalysis.featureComparison && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <BarChart2 className="w-3.5 h-3.5" />
                  Feature Deviation Table
                </div>
                <FeatureTable featureComparison={latestAnalysis.featureComparison} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Statistics Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            id: 'stat-total-analyses',
            title: 'Total Analyses',
            value: statsLoading ? '…' : String(stats?.totalAnalyses ?? 0),
            icon: ScanSearch,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/20'
          },
          {
            id: 'stat-normal-count',
            title: 'Normal Events',
            value: statsLoading ? '…' : String(stats?.normalCount ?? 0),
            icon: CheckCircle2,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20'
          },
          {
            id: 'stat-anomaly-count',
            title: 'Anomalies Detected',
            value: statsLoading ? '…' : String(stats?.anomalyCount ?? 0),
            icon: AlertTriangle,
            color: 'text-rose-400',
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/20'
          },
          {
            id: 'stat-detection-rate',
            title: 'Detection Rate',
            value: statsLoading
              ? '…'
              : stats?.detectionRate !== null
                ? `${stats.detectionRate}%`
                : '—',
            subtext: stats?.detectionRate === null ? 'Needs conclusive analyses' : 'Of conclusive analyses',
            icon: Activity,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20'
          }
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              id={card.id}
              className={`bg-slate-900 border ${card.border} rounded-xl p-4 shadow-sm`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{card.title}</span>
                <div className={`p-1.5 rounded-lg ${card.bg} border ${card.border}`}>
                  <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                </div>
              </div>
              <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
              {card.subtext && <div className="text-[10px] text-slate-600 mt-1">{card.subtext}</div>}
            </div>
          );
        })}
      </div>

      {/* ── Telemetry + History Charts ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Telemetry Composition Pie Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            Telemetry Event Composition
          </h3>
          {eventTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={eventTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {eventTypeData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-slate-600 text-xs">
              <Radio className="w-6 h-6 mb-2 opacity-40" />
              No telemetry collected yet.<br />Use Modules 2 &amp; 3 to generate events.
            </div>
          )}
          {telemetryStats.totalEvents > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-slate-800/60 rounded-lg p-2 text-center">
                <div className="text-[10px] text-slate-500">Total Events</div>
                <div className="text-sm font-bold text-slate-200">{telemetryStats.totalEvents}</div>
              </div>
              <div className="bg-slate-800/60 rounded-lg p-2 text-center">
                <div className="text-[10px] text-slate-500">CRC Error Rate</div>
                <div className="text-sm font-bold text-rose-400">{telemetryStats.crcErrorRate}%</div>
              </div>
            </div>
          )}
        </div>

        {/* Anomaly Score History Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            Anomaly Score History (Last 10)
          </h3>
          {historyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={historyChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(value, name) => [value.toFixed(3), 'Score']}
                />
                {/* Threshold reference line */}
                <Bar dataKey="score" radius={[3, 3, 0, 0]}>
                  {historyChartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-slate-600 text-xs">
              <BarChart2 className="w-6 h-6 mb-2 opacity-40" />
              No analyses performed yet.<br />Click "Analyze Transmissions" to begin.
            </div>
          )}
          <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-600">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" /> Anomaly</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Normal</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> Insufficient Data</span>
            <span className="ml-auto">Threshold: 0.55</span>
          </div>
        </div>
      </div>

      {/* ── Analysis History Table ────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            Recent Analyses
          </h3>
          <button
            id="btn-refresh-history"
            onClick={loadStatsAndHistory}
            className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-slate-200 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-10 text-slate-600 text-xs">
            <ScanSearch className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No analyses have been performed yet in this session.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-2 pr-4 text-slate-500 font-semibold uppercase tracking-wider">Analysis ID</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-semibold uppercase tracking-wider">Status</th>
                  <th className="text-right py-2 px-3 text-slate-500 font-semibold uppercase tracking-wider">Score</th>
                  <th className="text-right py-2 px-3 text-slate-500 font-semibold uppercase tracking-wider">Events</th>
                  <th className="text-left py-2 pl-3 text-slate-500 font-semibold uppercase tracking-wider">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, idx) => {
                  const cfg = statusConfig[h.status] || statusConfig['INSUFFICIENT DATA'];
                  return (
                    <tr key={h.analysisId || idx} className="border-b border-slate-800/40 hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 pr-4 font-mono text-slate-400">{h.analysisId}</td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={h.status} />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`font-mono font-semibold ${cfg.color}`}>
                          {h.score !== null && h.score !== undefined ? h.score.toFixed(3) : '—'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400">{h.eventCount}</td>
                      <td className="py-2.5 pl-3 text-slate-500 font-mono">{formatTimestamp(h.timestamp)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Educational Panel ─────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-indigo-500/20 rounded-xl p-6 shadow-md">
        <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          How AI Anomaly Detection Works — &amp; How It Differs from CRC
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-400 leading-relaxed">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="font-semibold text-slate-300">CRC Verification (Modules 1–4)</span>
            </div>
            <p>
              CRC checks <strong className="text-slate-300">individual packets</strong>. It computes a checksum before
              transmission and recomputes it on arrival. If the checksums differ, corruption is detected in that packet.
              CRC has no memory — it treats every packet independently and cannot detect patterns across multiple events.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <BrainCircuit className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="font-semibold text-slate-300">AI Anomaly Detection (Module 5)</span>
            </div>
            <p>
              This module looks at <strong className="text-slate-300">patterns across many events</strong>. It collects
              transmission and injection telemetry over time, then asks: "Is the recent behaviour statistically unusual
              compared to earlier baseline behaviour?" It can detect things like a sudden spike in error rates or an
              unusual burst of injection events that CRC alone would not flag.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-semibold text-slate-300">Detection Technique</span>
            </div>
            <p>
              Uses <strong className="text-slate-300">multi-feature Z-score statistical anomaly detection</strong>. Five
              features are extracted from each event window: CRC error rate, injection frequency, average payload size,
              average bit-change count, and burst activity. Each feature is compared between the baseline (earlier 70%)
              and recent (latest 30%) windows using Z-scores. A weighted composite score determines the classification.
            </p>
            <p className="mt-2 text-slate-500">
              Note: Python (scikit-learn Isolation Forest) was the planned implementation but is not available in this
              environment. The JavaScript Z-score approach is a documented, equivalent alternative.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-300">Anomaly Score Interpretation</span>
            </div>
            <ul className="space-y-1.5 text-slate-500">
              <li><span className="text-emerald-400 font-mono">0.00–0.54</span> → <span className="text-emerald-400">NORMAL</span> — recent behaviour consistent with baseline</li>
              <li><span className="text-rose-400 font-mono">0.55–1.00</span> → <span className="text-rose-400">ANOMALY</span> — significant statistical deviation detected</li>
              <li><span className="text-amber-400">null</span> → <span className="text-amber-400">INSUFFICIENT DATA</span> — fewer than 5 events recorded</li>
            </ul>
            <p className="mt-2 text-slate-600">
              The score is a <strong>weighted composite deviation index</strong>, not a probability.
              An anomaly does not automatically indicate an attack — it may reflect a change in test conditions.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
