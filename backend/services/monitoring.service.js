/**
 * Monitoring Service — Module 7
 *
 * Consolidates live metrics and activity from existing subsystems:
 *  - Module 2 (Transmission Simulator): transmissionStats & recordTransmissionEvent
 *  - Module 3 (Error Injection Simulator): errorInjectionStats & recordInjectionEvent
 *  - Module 5 (AI Anomaly Detection): getAnomalyStats & getAnalysisHistory
 *  - Module 6 (AI Error Pattern Analysis): getPatternStats & getPatternHistory
 *  - Core Telemetry: getTelemetryHistory & getTelemetryStats
 *  - Health Service: getSystemHealthStatus
 *
 * Pure aggregation service — does not recalculate CRCs or duplicate telemetry buffers.
 */

import { getTelemetryHistory, getTelemetryStats } from './telemetry.service.js';
import { getTransmissionStats } from './transmission.service.js';
import { getErrorInjectionStats } from './errorInjection.service.js';
import { getAnomalyStats, getAnalysisHistory } from './anomalyDetection.service.js';
import { getPatternStats, getPatternHistory } from './errorPatternAnalysis.service.js';
import { getSystemHealthStatus } from './health.service.js';

// ─── 1. Overview Aggregation ───────────────────────────────────────────────────

/**
 * Returns comprehensive live overview metrics aggregated from active modules.
 * @returns {object}
 */
export const getMonitoringOverview = () => {
  const telemetryStats = getTelemetryStats();
  const telemetryHistory = getTelemetryHistory();
  const txStats = getTransmissionStats();
  const injStats = getErrorInjectionStats();
  const anomalyStats = getAnomalyStats();
  const patternStats = getPatternStats();
  const healthStatus = getSystemHealthStatus();

  // Aggregate transmission metrics
  const txEvents = telemetryHistory.filter(e => e.eventType === 'TRANSMISSION');
  const totalTransmissions = Math.max(txStats.totalTransmissions, txEvents.length);
  const successfulTransmissions = txStats.totalTransmissions > 0
    ? txStats.successfulTransmissions
    : txEvents.filter(e => e.crcMatch === true).length;
  const crcErrors = txStats.totalTransmissions > 0
    ? txStats.crcErrors
    : txEvents.filter(e => e.errorDetected === true).length;
  const txErrorRate = totalTransmissions > 0
    ? `${((crcErrors / totalTransmissions) * 100).toFixed(2)}%`
    : '0.00%';

  // Aggregate error injection metrics
  const injEvents = telemetryHistory.filter(e => e.eventType === 'ERROR_INJECTION');
  const totalInjections = Math.max(injStats.totalInjections, injEvents.length);
  const errorsDetected = injStats.totalInjections > 0
    ? injStats.errorsDetected
    : injEvents.filter(e => e.errorDetected === true).length;
  const errorsNotDetected = injStats.totalInjections > 0
    ? injStats.errorsNotDetected
    : injEvents.filter(e => e.errorDetected === false).length;

  let empiricalDetectionRate = null;
  if (totalInjections > 0) {
    empiricalDetectionRate = parseFloat(((errorsDetected / totalInjections) * 100).toFixed(1));
  }

  return {
    timestamp: new Date().toISOString(),
    systemHealth: {
      status: healthStatus.status,
      uptimeSeconds: healthStatus.uptimeSeconds,
      modules: healthStatus.modules
    },
    transmissions: {
      total: totalTransmissions,
      successful: successfulTransmissions,
      crcErrors: crcErrors,
      errorRate: txErrorRate
    },
    errorInjections: {
      total: totalInjections,
      detected: errorsDetected,
      notDetected: errorsNotDetected,
      detectionRate: empiricalDetectionRate !== null ? `${empiricalDetectionRate}%` : 'N/A',
      detectionRateNumeric: empiricalDetectionRate
    },
    telemetry: {
      totalEvents: telemetryStats.totalEvents,
      transmissionEvents: telemetryStats.transmissionEvents,
      injectionEvents: telemetryStats.injectionEvents,
      maxHistorySize: telemetryStats.maxHistorySize
    },
    aiIntelligence: {
      anomaliesDetected: anomalyStats.anomalyCount,
      anomalyAnalysesPerformed: anomalyStats.totalAnalyses,
      latestAnomalyStatus: anomalyStats.totalAnalyses > 0 ? (getAnalysisHistory(1)[0]?.status || null) : null,
      patternAnalysesPerformed: patternStats.totalAnalyses,
      latestDominantPattern: patternStats.latestDominantPattern || null
    }
  };
};

// ─── 2. Recent Unified Activity Feed ──────────────────────────────────────────

/**
 * Normalizes a telemetry event into a consistent Activity item.
 * @param {object} event
 * @returns {object}
 */
const formatTelemetryActivity = (event) => {
  const isTransmission = event.eventType === 'TRANSMISSION';
  return {
    activityId: event.eventId,
    eventType: event.eventType,
    sourceId: event.sourceId || null,
    timestamp: event.timestamp || null,
    algorithm: event.algorithm || 'UNKNOWN',
    status: event.status || (event.crcMatch ? 'SUCCESS' : 'ERROR'),
    errorDetected: event.errorDetected ?? false,
    crcMatch: event.crcMatch ?? true,
    errorType: event.errorType || null,
    payloadSize: event.payloadSize ?? 0,
    details: isTransmission
      ? `Transmission stream processed via ${event.algorithm || 'CRC'}. Status: ${event.status || 'OK'}`
      : `Injected ${event.errorType || 'error'} (${event.changedBitCount ?? 1} bits). Result: ${event.errorDetected ? 'Detected' : 'Bypassed'}`
  };
};

/**
 * Normalizes an anomaly detection run into an Activity item.
 * @param {object} item
 * @returns {object}
 */
const formatAnomalyActivity = (item) => ({
  activityId: item.analysisId,
  eventType: 'ANOMALY_DETECTION',
  sourceId: item.analysisId,
  timestamp: item.timestamp || null,
  algorithm: 'AI-MODEL',
  status: item.status,
  errorDetected: item.status === 'ANOMALY',
  crcMatch: null,
  errorType: null,
  payloadSize: item.eventCount ?? 0,
  details: `AI Anomaly evaluation: ${item.status}. Score: ${typeof item.score === 'number' ? item.score.toFixed(3) : 'N/A'}`
});

/**
 * Normalizes an error pattern analysis run into an Activity item.
 * @param {object} item
 * @returns {object}
 */
const formatPatternActivity = (item) => ({
  activityId: item.analysisId,
  eventType: 'PATTERN_ANALYSIS',
  sourceId: item.analysisId,
  timestamp: item.timestamp || null,
  algorithm: 'AI-PATTERNS',
  status: item.status,
  errorDetected: false,
  crcMatch: null,
  errorType: item.dominantPattern?.classification || null,
  payloadSize: item.injectionCount ?? 0,
  details: `Pattern Analysis: ${item.dominantPattern?.classification || item.status} (${item.injectionCount ?? 0} injections analyzed)`
});

/**
 * Retrieves a unified chronological activity feed merged across telemetry and AI records.
 * Supports filtering and bounding.
 *
 * @param {object} options
 * @param {number} [options.limit=20] - Max events to return (1-100)
 * @param {string} [options.eventType] - Optional filter by eventType ('TRANSMISSION', 'ERROR_INJECTION', etc.)
 * @param {string} [options.algorithm] - Optional filter by CRC algorithm ('CRC-8', 'CRC-16', 'CRC-32')
 * @returns {object}
 */
export const getRecentActivity = ({ limit = 20, eventType = null, algorithm = null } = {}) => {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  // 1. Gather events from telemetry
  const telemetryEvents = getTelemetryHistory().map(formatTelemetryActivity);

  // 2. Gather recent AI runs
  const anomalyRuns = getAnalysisHistory(20).map(formatAnomalyActivity);
  const patternRuns = getPatternHistory(20).map(formatPatternActivity);

  // 3. Merge all activities
  let allActivities = [...telemetryEvents, ...anomalyRuns, ...patternRuns];

  // 4. Sort reverse-chronologically by timestamp
  allActivities.sort((a, b) => {
    const timeA = a.timestamp ? Date.parse(a.timestamp) : 0;
    const timeB = b.timestamp ? Date.parse(b.timestamp) : 0;
    return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
  });

  const totalBeforeFilter = allActivities.length;

  // 5. Apply filters if provided
  if (eventType && typeof eventType === 'string' && eventType.trim() !== '') {
    const targetType = eventType.trim().toUpperCase();
    allActivities = allActivities.filter(a => a.eventType === targetType);
  }

  if (algorithm && typeof algorithm === 'string' && algorithm.trim() !== '') {
    const targetAlgo = algorithm.trim().toUpperCase();
    allActivities = allActivities.filter(a => (a.algorithm || '').toUpperCase() === targetAlgo);
  }

  const filteredCount = allActivities.length;
  const items = allActivities.slice(0, safeLimit);

  return {
    activities: items,
    count: items.length,
    totalAvailable: totalBeforeFilter,
    filteredCount
  };
};

// ─── 3. Timeline Aggregation ───────────────────────────────────────────────────

/**
 * Partitions recorded telemetry events into equal-width chronological buckets
 * to show event trends over time.
 *
 * @param {number} [bucketCount=8] - Number of time slots (2-20)
 * @returns {object[]}
 */
export const getMonitoringTimeline = (bucketCount = 8) => {
  const safeBuckets = Math.min(Math.max(parseInt(bucketCount, 10) || 8, 2), 20);
  const allEvents = getTelemetryHistory();

  // Filter to events with valid timestamps
  const timedEvents = allEvents.filter(e => {
    if (!e.timestamp) return false;
    const t = Date.parse(e.timestamp);
    return !isNaN(t);
  });

  if (timedEvents.length === 0) {
    return [];
  }

  const timestamps = timedEvents.map(e => Date.parse(e.timestamp));
  const tMin = Math.min(...timestamps);
  const tMax = Math.max(...timestamps);

  // If all events occurred in the exact same millisecond
  if (tMin === tMax) {
    const txCount = timedEvents.filter(e => e.eventType === 'TRANSMISSION').length;
    const injCount = timedEvents.filter(e => e.eventType === 'ERROR_INJECTION').length;
    const detectedCount = timedEvents.filter(e => e.errorDetected === true).length;
    return [{
      label: 'Window 1',
      startMs: tMin,
      endMs: tMax,
      totalEvents: timedEvents.length,
      transmissions: txCount,
      injections: injCount,
      detectedErrors: detectedCount
    }];
  }

  const span = tMax - tMin;
  const bucketWidth = span / safeBuckets;

  const buckets = Array.from({ length: safeBuckets }, (_, i) => ({
    label: `T${i + 1}`,
    startMs: Math.round(tMin + i * bucketWidth),
    endMs: Math.round(tMin + (i + 1) * bucketWidth),
    totalEvents: 0,
    transmissions: 0,
    successfulTransmissions: 0,
    injections: 0,
    detectedErrors: 0
  }));

  timedEvents.forEach(e => {
    const t = Date.parse(e.timestamp);
    let idx = Math.floor((t - tMin) / bucketWidth);
    if (idx >= safeBuckets) idx = safeBuckets - 1;

    buckets[idx].totalEvents++;
    if (e.eventType === 'TRANSMISSION') {
      buckets[idx].transmissions++;
      if (e.crcMatch) buckets[idx].successfulTransmissions++;
    } else if (e.eventType === 'ERROR_INJECTION') {
      buckets[idx].injections++;
      if (e.errorDetected) buckets[idx].detectedErrors++;
    }
  });

  return buckets.map(b => ({
    label: b.label,
    timeRange: `${new Date(b.startMs).toLocaleTimeString()} - ${new Date(b.endMs).toLocaleTimeString()}`,
    totalEvents: b.totalEvents,
    transmissions: b.transmissions,
    successfulTransmissions: b.successfulTransmissions,
    injections: b.injections,
    detectedErrors: b.detectedErrors
  }));
};
