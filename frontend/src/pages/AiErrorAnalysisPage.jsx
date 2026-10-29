import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Activity,
  Layers,
  BarChart3,
  Clock,
  Info,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Fingerprint,
  Zap,
  ArrowRight,
  PieChart as PieIcon,
  Sliders
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
  Legend,
  AreaChart,
  Area
} from 'recharts';
import {
  analyzeErrorPatternsApi,
  fetchPatternHistoryApi,
  fetchPatternStatsApi
} from '../services/api';

// ─── Constants & Styles ────────────────────────────────────────────────────────

const ERROR_TYPE_COLORS = {
  SINGLE_BIT: '#06b6d4', // Cyan
  MULTI_BIT:  '#f59e0b', // Amber
  BURST:      '#8b5cf6', // Purple/Violet
  RANDOM:     '#10b981', // Emerald
  UNKNOWN:    '#64748b'  // Slate
};

const ERROR_TYPE_LABELS = {
  SINGLE_BIT: 'Single-Bit Flip',
  MULTI_BIT:  'Multi-Bit Inversion',
  BURST:      'Contiguous Burst',
  RANDOM:     'Random Gaussian',
  UNKNOWN:    'Unknown Pattern'
};

const formatTimestamp = (ts) => {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'medium'
    });
  } catch {
    return ts;
  }
};

const getDominantBadgeStyle = (classification) => {
  if (!classification || classification === 'INSUFFICIENT DATA') {
    return {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      icon: HelpCircle
    };
  }
  if (classification.includes('BURST')) {
    return {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      icon: Zap
    };
  }
  if (classification.includes('SINGLE-BIT')) {
    return {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      icon: Fingerprint
    };
  }
  if (classification.includes('MULTI-BIT')) {
    return {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      icon: Layers
    };
  }
  if (classification.includes('RANDOM')) {
    return {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      icon: Activity
    };
  }
  return {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    icon: Sparkles
  };
};

export const AiErrorAnalysisPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  // Load existing history and stats on mount
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [histRes, statsRes] = await Promise.all([
        fetchPatternHistoryApi(20),
        fetchPatternStatsApi()
      ]);

      if (histRes.success && histRes.history.length > 0) {
        setHistory(histRes.history);
        setAnalysis(histRes.history[0]);
      }
      if (statsRes.success) {
        setStats(statsRes.stats);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch pattern analysis records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Trigger fresh analysis
  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await analyzeErrorPatternsApi();
      if (res.success && res.data) {
        setAnalysis(res.data);
        // Refresh history & stats in background
        const [histRes, statsRes] = await Promise.all([
          fetchPatternHistoryApi(20),
          fetchPatternStatsApi()
        ]);
        if (histRes.success) setHistory(histRes.history);
        if (statsRes.success) setStats(statsRes.stats);
      } else {
        setError(res.error || 'Analysis failed to complete');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while running pattern analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  const isInsufficient = analysis?.status === 'INSUFFICIENT DATA';
  const dominantStyle = getDominantBadgeStyle(analysis?.dominantPattern?.classification);
  const DominantIcon = dominantStyle.icon;

  // Chart data formatting
  const pieData = (analysis?.errorTypeDistribution || [])
    .filter(item => item.count > 0)
    .map(item => ({
      name: ERROR_TYPE_LABELS[item.errorType] || item.errorType,
      value: item.count,
      pct: item.pct,
      color: ERROR_TYPE_COLORS[item.errorType] || '#64748b'
    }));

  const algorithmData = (analysis?.algorithmBreakdown || []).map(algo => ({
    name: algo.algorithm,
    total: algo.total,
    detected: algo.detected,
    notDetected: algo.notDetected,
    rate: algo.detectionRate !== null ? algo.detectionRate : 0
  }));

  const trendData = (analysis?.timeTrend || []).map((t, idx) => ({
    label: t.label || `T${idx + 1}`,
    injections: t.count,
    detected: t.detectedCount
  }));

  const bitDistData = (analysis?.bitChangeStats?.distribution || []).map(b => ({
    bits: `${b.bits} bit${b.bits > 1 ? 's' : ''}`,
    count: b.count,
    pct: b.pct
  }));

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Module 6
            </span>
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Statistical Pattern Intelligence
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-purple-400" />
            AI Error Pattern Analysis
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Statistical classification of error signatures, bit-corruption histograms, and empirical CRC resilience profiles across simulated telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center">
          <button
            onClick={loadData}
            disabled={loading || analyzing}
            className="p-2.5 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition disabled:opacity-50"
            title="Refresh Analysis Records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          </button>

          <button
            onClick={handleRunAnalysis}
            disabled={analyzing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium shadow-lg shadow-purple-900/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
            {analyzing ? 'Analyzing Telemetry...' : 'Run Pattern Analysis'}
          </button>
        </div>
      </div>

      {/* ─── Error Notification ─── */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Insufficient Data Notice ─── */}
      {isInsufficient && (
        <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-amber-300">
                  Insufficient Error Telemetry (Requires ≥ 3 Injections)
                </h3>
                <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  The pattern engine requires at least 3 recorded error injection events to detect statistical distributions.
                  Currently, <span className="font-semibold text-white">{analysis.injectionCount}</span> injection(s) and{' '}
                  <span className="font-semibold text-white">{analysis.transmissionCount}</span> transmission(s) are recorded.
                </p>
              </div>
            </div>
            <Link
              to="/error-injection"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-sm font-medium transition"
            >
              Go to Error Injector <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* ─── Key Metrics Summary Row ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Dominant Pattern */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Dominant Pattern</span>
            <div className={`p-2 rounded-lg ${dominantStyle.bg} ${dominantStyle.text}`}>
              <DominantIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-white tracking-tight truncate">
              {analysis?.dominantPattern?.classification || 'Awaiting Analysis'}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              {analysis?.dominantPattern?.confidence !== null && analysis?.dominantPattern?.confidence !== undefined ? (
                <>
                  <span className="font-semibold text-purple-400">{analysis.dominantPattern.confidence}%</span> share of injections
                </>
              ) : (
                'Need ≥ 3 injections'
              )}
            </div>
          </div>
        </div>

        {/* CRC Detection Rate */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Empirical Detection Rate</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">
              {analysis?.overallDetectionRate !== null && analysis?.overallDetectionRate !== undefined
                ? `${analysis.overallDetectionRate}%`
                : '—'}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {analysis?.detectedCount !== undefined
                ? `${analysis.detectedCount} detected / ${analysis.notDetectedCount || 0} bypassed`
                : 'Run analysis to compute'}
            </div>
          </div>
        </div>

        {/* Total Injections Analyzed */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Injections Analyzed</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">
              {analysis?.injectionCount ?? 0}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Out of {analysis?.totalEvents ?? 0} total telemetry events
            </div>
          </div>
        </div>

        {/* Analyses Recorded */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Pattern Runs (Session)</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">
              {stats?.totalAnalyses ?? history.length}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {stats?.completeCount ?? 0} complete reports stored
            </div>
          </div>
        </div>
      </div>

      {/* ─── Navigation Tabs ─── */}
      <div className="flex border-b border-slate-800 overflow-x-auto gap-2">
        {[
          { id: 'overview', label: 'Pattern Overview', icon: Sparkles },
          { id: 'distributions', label: 'Distributions & Bit Stats', icon: PieIcon },
          { id: 'algorithms', label: 'Algorithm Resilience', icon: ShieldCheck },
          { id: 'trends', label: 'Time Trend', icon: TrendingUp },
          { id: 'insights', label: `AI Insights (${analysis?.insights?.length || 0})`, icon: Cpu },
          { id: 'history', label: `Analysis History (${history.length})`, icon: Clock }
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-4 font-medium text-sm transition-all border-b-2 -mb-px whitespace-nowrap ${
                isActive
                  ? 'border-purple-500 text-purple-400 bg-purple-500/5 rounded-t-lg'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: Pattern Overview ─── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dominant Pattern Detailed Card */}
          <div className="lg:col-span-2 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Dominant Pattern Diagnosis
              </h2>
              {analysis?.analysisId && (
                <span className="font-mono text-xs px-2.5 py-1 bg-slate-800 text-slate-300 rounded-md border border-slate-700">
                  {analysis.analysisId}
                </span>
              )}
            </div>

            <div className={`p-4 rounded-xl border ${dominantStyle.bg} ${dominantStyle.border}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg bg-slate-900/80 ${dominantStyle.text}`}>
                  <DominantIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className={`text-base font-bold ${dominantStyle.text}`}>
                    {analysis?.dominantPattern?.classification || 'INSUFFICIENT DATA'}
                  </div>
                  <p className="text-sm text-slate-300 mt-0.5">
                    {analysis?.dominantPattern?.note ||
                      'Execute error injection simulations to establish a pattern profile.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Error Type Distribution Breakdown */}
            <div className="pt-2">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Error Type Share</h3>
              <div className="space-y-3">
                {(analysis?.errorTypeDistribution || []).map((item) => {
                  const color = ERROR_TYPE_COLORS[item.errorType] || '#64748b';
                  return (
                    <div key={item.errorType} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-300">
                          {ERROR_TYPE_LABELS[item.errorType] || item.errorType}
                        </span>
                        <span className="text-slate-400 font-mono">
                          {item.count} events ({item.pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${item.pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Insights Card */}
          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              Automated Insights
            </h2>

            {analysis?.insights && analysis.insights.length > 0 ? (
              <div className="space-y-3">
                {analysis.insights.slice(0, 4).map((insight, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 flex items-start gap-2.5 leading-relaxed"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-sm">
                <Info className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                No insights generated yet. Click "Run Pattern Analysis" to inspect telemetry.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: Distributions & Bit Stats ─── */}
      {activeTab === 'distributions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart: Error Type Proportions */}
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-purple-400" />
                Error Type Proportion
              </h3>
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
                  Insufficient error type data to chart.
                </div>
              )}
            </div>

            {/* Bit-Change Distribution Histogram */}
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                Bit-Change Frequency Histogram
              </h3>
              {bitDistData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bitDistData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="bits" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '0.75rem',
                          color: '#fff'
                        }}
                      />
                      <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
                  No bit-change count data available.
                </div>
              )}
            </div>
          </div>

          {/* Statistical Metrics Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bit-Change Statistics */}
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                Bit-Change Statistical Profile
              </h3>
              {analysis?.bitChangeStats?.available ? (
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
                    <span className="text-xs text-slate-400">Mean Bits</span>
                    <p className="text-lg font-bold text-white mt-1">{analysis.bitChangeStats.mean}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
                    <span className="text-xs text-slate-400">Median Bits</span>
                    <p className="text-lg font-bold text-white mt-1">{analysis.bitChangeStats.median}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
                    <span className="text-xs text-slate-400">Mode Bits</span>
                    <p className="text-lg font-bold text-white mt-1">{analysis.bitChangeStats.mode ?? '—'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
                    <span className="text-xs text-slate-400">Min Injected</span>
                    <p className="text-lg font-bold text-white mt-1">{analysis.bitChangeStats.min} bit</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
                    <span className="text-xs text-slate-400">Max Injected</span>
                    <p className="text-lg font-bold text-white mt-1">{analysis.bitChangeStats.max} bits</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
                    <span className="text-xs text-slate-400">Sample Size</span>
                    <p className="text-lg font-bold text-white mt-1">{analysis.bitChangeStats.count}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Bit-change telemetry not available in current sample.</p>
              )}
            </div>

            {/* Burst Statistics */}
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                Burst-Length Profile (BURST Events)
              </h3>
              {analysis?.burstStats?.available ? (
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
                    <span className="text-xs text-slate-400">Mean Length</span>
                    <p className="text-lg font-bold text-white mt-1">{analysis.burstStats.mean} bits</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
                    <span className="text-xs text-slate-400">Median</span>
                    <p className="text-lg font-bold text-white mt-1">{analysis.burstStats.median}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
                    <span className="text-xs text-slate-400">Mode Length</span>
                    <p className="text-lg font-bold text-white mt-1">{analysis.burstStats.mode ?? '—'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
                    <span className="text-xs text-slate-400">Min Burst</span>
                    <p className="text-lg font-bold text-white mt-1">{analysis.burstStats.min} bits</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
                    <span className="text-xs text-slate-400">Max Burst</span>
                    <p className="text-lg font-bold text-white mt-1">{analysis.burstStats.max} bits</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
                    <span className="text-xs text-slate-400">Burst Count</span>
                    <p className="text-lg font-bold text-white mt-1">{analysis.burstStats.burstCount}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  No burst-error events have been recorded yet. Use Module 3 with "Burst Error" to generate telemetry.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: Algorithm Resilience ─── */}
      {activeTab === 'algorithms' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Detection Rate by CRC Polynomial
              </h3>
              {algorithmData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={algorithmData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" />
                      <YAxis stroke="#64748b" unit="%" domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '0.75rem',
                          color: '#fff'
                        }}
                      />
                      <Bar dataKey="rate" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Detection Rate %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
                  No algorithm-specific events recorded.
                </div>
              )}
            </div>

            {/* Algorithm Details List */}
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm space-y-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                Observed Performance
              </h3>
              <div className="space-y-3">
                {algorithmData.map((algo) => (
                  <div
                    key={algo.name}
                    className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white text-sm">{algo.name}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {algo.rate}% Caught
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Tested: {algo.total}</span>
                      <span className="text-emerald-400">Detected: {algo.detected}</span>
                      <span className="text-rose-400">Missed: {algo.notDetected}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: Time Trends ─── */}
      {activeTab === 'trends' && (
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
          <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            Error Injection & Detection Progression (6 Time Buckets)
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Shows temporal concentration of error injections across chronological buckets within the current session.
          </p>

          {trendData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="injGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="detGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
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
                    dataKey="injections"
                    stroke="#8b5cf6"
                    fillOpacity={1}
                    fill="url(#injGrad)"
                    name="Injections In Window"
                  />
                  <Area
                    type="monotone"
                    dataKey="detected"
                    stroke="#06b6d4"
                    fillOpacity={1}
                    fill="url(#detGrad)"
                    name="CRC Detected"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
              Insufficient timestamps to plot temporal trends.
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 5: AI Insights ─── */}
      {activeTab === 'insights' && (
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-400" />
                Evidence-Based Pattern Insights
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Deterministic findings derived from descriptive statistics over recorded telemetry.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {analysis?.insights?.length || 0} findings
            </span>
          </div>

          {analysis?.insights && analysis.insights.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.insights.map((insight, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-start gap-3 hover:border-purple-500/40 transition"
                >
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Observation #{idx + 1}
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed">{insight}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-sm">
              No insights available. Record telemetry and run an analysis to populate findings.
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 6: Analysis History ─── */}
      {activeTab === 'history' && (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 backdrop-blur-sm overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              Historical Pattern Runs
            </h2>
            <span className="text-xs text-slate-400">
              Showing last {history.length} records (max 100 stored)
            </span>
          </div>

          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/50 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Analysis ID</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Injections</th>
                    <th className="py-3 px-4">Dominant Pattern</th>
                    <th className="py-3 px-4">Detection Rate</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {history.map((record) => {
                    const isSelected = selectedHistoryItem?.analysisId === record.analysisId;
                    return (
                      <tr
                        key={record.analysisId}
                        className={`hover:bg-slate-800/30 transition ${
                          isSelected ? 'bg-purple-500/10' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-white">
                          {record.analysisId}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {formatTimestamp(record.timestamp)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              record.status === 'COMPLETE'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {record.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-200">
                          {record.injectionCount}
                        </td>
                        <td className="py-3 px-4 font-medium text-purple-300">
                          {record.dominantPattern?.classification || '—'}
                        </td>
                        <td className="py-3 px-4 font-mono text-cyan-400">
                          {record.overallDetectionRate !== null && record.overallDetectionRate !== undefined
                            ? `${record.overallDetectionRate}%`
                            : '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setAnalysis(record);
                              setSelectedHistoryItem(record);
                              setActiveTab('overview');
                            }}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm">
              No historical analyses found. Run your first analysis above.
            </div>
          )}
        </div>
      )}

      {/* ─── Academic Methodology & Limitations ─── */}
      <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-slate-300 font-semibold">
          <Info className="w-4 h-4 text-purple-400" />
          <span>Academic & Methodological Transparency</span>
        </div>
        <ul className="list-disc pl-5 space-y-1 text-slate-400">
          <li>
            Analysis is computed using native statistical aggregation (frequencies, distributions, histograms) across live telemetry records.
          </li>
          <li>
            Telemetry is tracked in-memory for the current server session and resets upon server restart.
          </li>
          <li>
            No artificial weights or unverified causal claims are made; all findings represent observed sample behaviour.
          </li>
        </ul>
      </div>
    </div>
  );
};
