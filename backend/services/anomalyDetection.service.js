/**
 * Anomaly Detection Service — Module 5
 *
 * Orchestrates the AI anomaly detection workflow:
 *  1. Reads current telemetry from telemetry.service.js
 *  2. Calls the detection algorithm from ml-pipeline/anomaly_detection.js
 *  3. Persists results in an in-memory analysis history (max 100 entries)
 *  4. Provides history and statistics for the API layer
 *
 * The anomaly detection algorithm is implemented in pure JavaScript because
 * Python is not available in this environment. See ml-pipeline/anomaly_detection.js
 * for the full algorithm description and score interpretation.
 */

import { getTelemetryHistory, getTelemetryStats } from './telemetry.service.js';
import { detectAnomaly } from '../../ml-pipeline/anomaly_detection.js';

const MAX_ANALYSIS_HISTORY = 100;

/** @type {object[]} In-memory store of past analysis results. */
let analysisHistory = [];
let analysisCounter = 0;

/**
 * Generates a unique, formatted analysis ID.
 * Example: ANL-20261001-0007
 * @returns {string}
 */
const generateAnalysisId = () => {
  analysisCounter++;
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `ANL-${dateStr}-${String(analysisCounter).padStart(4, '0')}`;
};

// ─── Core Analysis ─────────────────────────────────────────────────────────────

/**
 * Runs anomaly detection on the current telemetry history.
 *
 * Telemetry is read from telemetry.service.js — it contains only real events
 * recorded by Modules 2 and 3 during this server session.
 * The result is stored in the local analysis history.
 *
 * @returns {object} Complete anomaly detection result including analysisId
 */
export const analyzeTransmissions = () => {
  const events = getTelemetryHistory();
  const detectionResult = detectAnomaly(events);

  const analysisId = generateAnalysisId();
  const record = { analysisId, ...detectionResult };

  analysisHistory.push(record);
  if (analysisHistory.length > MAX_ANALYSIS_HISTORY) {
    analysisHistory.shift();
  }

  return record;
};

// ─── History ───────────────────────────────────────────────────────────────────

/**
 * Returns recent analysis results in reverse-chronological order.
 *
 * @param {number} [limit=50] - Maximum number of records to return (capped at 100)
 * @returns {object[]}
 */
export const getAnalysisHistory = (limit = 50) => {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
  return [...analysisHistory].reverse().slice(0, safeLimit);
};

// ─── Statistics ────────────────────────────────────────────────────────────────

/**
 * Returns aggregated statistics across all stored analysis results.
 * Detection rate is only computed when its denominator is positive
 * (i.e., at least one conclusive NORMAL or ANOMALY result exists).
 *
 * @returns {object}
 */
export const getAnomalyStats = () => {
  const total               = analysisHistory.length;
  const telemetryStats      = getTelemetryStats();

  if (total === 0) {
    return {
      totalAnalyses:         0,
      normalCount:           0,
      anomalyCount:          0,
      insufficientDataCount: 0,
      detectionRate:         null,
      detectionRateNote:     'No analyses performed yet.',
      telemetryStats
    };
  }

  const normalCount           = analysisHistory.filter(a => a.status === 'NORMAL').length;
  const anomalyCount          = analysisHistory.filter(a => a.status === 'ANOMALY').length;
  const insufficientDataCount = analysisHistory.filter(a => a.status === 'INSUFFICIENT DATA').length;

  const conclusiveDenominator = normalCount + anomalyCount;
  const detectionRate = conclusiveDenominator > 0
    ? parseFloat(((anomalyCount / conclusiveDenominator) * 100).toFixed(2))
    : null;

  return {
    totalAnalyses:         total,
    normalCount,
    anomalyCount,
    insufficientDataCount,
    detectionRate,
    detectionRateNote: conclusiveDenominator > 0
      ? `${detectionRate}% of conclusive analyses (${conclusiveDenominator} total) detected an anomaly.`
      : 'Detection rate unavailable: no conclusive (NORMAL or ANOMALY) analyses yet.',
    telemetryStats
  };
};

/**
 * Clears the analysis history and resets the counter.
 * Intended for test isolation only; do not call in production paths.
 */
export const clearAnalysisHistory = () => {
  analysisHistory = [];
  analysisCounter = 0;
};
