/**
 * Error Pattern Analysis Service — Module 6
 *
 * Orchestrates the error pattern analysis workflow:
 *  1. Reads telemetry from telemetry.service.js (Module 5 foundation)
 *  2. Calls the analysis algorithm in ml-pipeline/error_pattern_analysis.js
 *  3. Stores a bounded history of analysis results (max 100)
 *  4. Exposes aggregate statistics across all stored analyses
 *
 * Does NOT duplicate CRC logic, telemetry collection, or anomaly detection.
 * Does NOT store error injection events — reads them from telemetry.service.js.
 */

import { getTelemetryHistory, getTelemetryStats } from './telemetry.service.js';
import { analyzeErrorPatterns } from '../../ml-pipeline/error_pattern_analysis.js';

const MAX_ANALYSIS_HISTORY = 100;

/** @type {object[]} In-memory store of past analysis results. */
let analysisHistory = [];
let analysisCounter = 0;

/**
 * Generates a unique, formatted analysis ID.
 * Example: EPA-20261001-0003
 * @returns {string}
 */
const generateAnalysisId = () => {
  analysisCounter++;
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `EPA-${dateStr}-${String(analysisCounter).padStart(4, '0')}`;
};

// ─── Core Analysis ─────────────────────────────────────────────────────────────

/**
 * Runs error pattern analysis on the current telemetry history.
 *
 * @returns {object} Full analysis result including analysisId
 */
export const analyzePatterns = () => {
  const events = getTelemetryHistory();
  const result = analyzeErrorPatterns(events);

  const analysisId = generateAnalysisId();
  const record = { analysisId, ...result };

  analysisHistory.push(record);
  if (analysisHistory.length > MAX_ANALYSIS_HISTORY) {
    analysisHistory.shift();
  }

  return record;
};

// ─── History ───────────────────────────────────────────────────────────────────

/**
 * Returns recent analyses in reverse-chronological order.
 * @param {number} [limit=20] - Max records to return, capped at 100
 * @returns {object[]}
 */
export const getPatternHistory = (limit = 20) => {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  return [...analysisHistory].reverse().slice(0, safeLimit);
};

// ─── Statistics ────────────────────────────────────────────────────────────────

/**
 * Returns aggregate statistics across all stored analysis results.
 * @returns {object}
 */
export const getPatternStats = () => {
  const total          = analysisHistory.length;
  const telemetryStats = getTelemetryStats();

  if (total === 0) {
    return {
      totalAnalyses:         0,
      completeCount:         0,
      insufficientDataCount: 0,
      totalInjectionsSeen:   0,
      totalTransmissionsSeen: 0,
      telemetryStats
    };
  }

  const completeAnalyses         = analysisHistory.filter(a => a.status === 'COMPLETE');
  const completeCount            = completeAnalyses.length;
  const insufficientDataCount    = analysisHistory.filter(a => a.status === 'INSUFFICIENT DATA').length;

  // Summarise across complete analyses (latest wins for non-additive metrics)
  const latest = completeAnalyses.length > 0 ? completeAnalyses[completeAnalyses.length - 1] : null;

  return {
    totalAnalyses:          total,
    completeCount,
    insufficientDataCount,
    totalInjectionsSeen:    latest?.injectionCount  ?? 0,
    totalTransmissionsSeen: latest?.transmissionCount ?? 0,
    latestStatus:           latest?.status           ?? null,
    latestDominantPattern:  latest?.dominantPattern?.classification ?? null,
    latestInsightCount:     latest?.insights?.length ?? 0,
    telemetryStats
  };
};

/**
 * Clears analysis history. For test isolation only.
 */
export const clearPatternHistory = () => {
  analysisHistory = [];
  analysisCounter = 0;
};
