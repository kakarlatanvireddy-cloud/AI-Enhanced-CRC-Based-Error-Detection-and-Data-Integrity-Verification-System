/**
 * Historical Analytics Service — Module 8
 *
 * Performs retrospective analytical queries and aggregations across telemetry records,
 * error distributions, polynomial resilience profiles, and alerts.
 *
 * All metrics are derived from actual in-memory telemetry records and alert histories
 * collected during the current backend session.
 *
 * Date Range Handling:
 *  - Safely parses and bounds start/end ISO date filters.
 *  - Handles missing timestamps, empty histories, and malformed dates gracefully.
 */

import { getTelemetryHistory, getTelemetryStats } from './telemetry.service.js';
import { getAlerts, getAlertStats } from './alert.service.js';
import { getAnomalyStats, getAnalysisHistory } from './anomalyDetection.service.js';
import { getPatternStats, getPatternHistory } from './errorPatternAnalysis.service.js';

// ─── Helper: Filter Events by Date Range ───────────────────────────────────────

/**
 * Filters an array of timestamped objects by an optional [startDate, endDate] window.
 * @param {object[]} items
 * @param {string} [startDate]
 * @param {string} [endDate]
 * @returns {object[]}
 */
const filterByDateRange = (items, startDate, endDate) => {
  let filtered = [...items];

  if (startDate) {
    const startMs = Date.parse(startDate);
    if (!isNaN(startMs)) {
      filtered = filtered.filter(item => {
        if (!item.timestamp) return false;
        const t = Date.parse(item.timestamp);
        return !isNaN(t) && t >= startMs;
      });
    }
  }

  if (endDate) {
    const endMs = Date.parse(endDate);
    if (!isNaN(endMs)) {
      filtered = filtered.filter(item => {
        if (!item.timestamp) return false;
        const t = Date.parse(item.timestamp);
        return !isNaN(t) && t <= endMs;
      });
    }
  }

  return filtered;
};

// ─── 1. Historical Overview ───────────────────────────────────────────────────

/**
 * Returns aggregated historical metrics bounded by an optional date window.
 * @param {object} [options]
 * @param {string} [options.startDate]
 * @param {string} [options.endDate]
 * @returns {object}
 */
export const getHistoricalOverview = ({ startDate = null, endDate = null } = {}) => {
  const allEvents = getTelemetryHistory();
  const events = filterByDateRange(allEvents, startDate, endDate);

  const transmissions = events.filter(e => e.eventType === 'TRANSMISSION');
  const injections = events.filter(e => e.eventType === 'ERROR_INJECTION');

  const totalTransmissions = transmissions.length;
  const successfulTransmissions = transmissions.filter(e => e.crcMatch === true).length;
  const failedTransmissions = transmissions.filter(e => e.crcMatch === false || e.errorDetected === true).length;
  const txErrorRate = totalTransmissions > 0
    ? parseFloat(((failedTransmissions / totalTransmissions) * 100).toFixed(2))
    : 0.0;

  const totalInjections = injections.length;
  const detectedInjections = injections.filter(e => e.errorDetected === true).length;
  const undetectedInjections = injections.filter(e => e.errorDetected === false).length;
  const empiricalDetectionRate = totalInjections > 0
    ? parseFloat(((detectedInjections / totalInjections) * 100).toFixed(1))
    : null;

  // Alerts in range
  const alertsData = getAlerts({ startDate, endDate, limit: 100 });
  const alertStats = getAlertStats();

  // AI anomalies in range
  const anomalyHistory = filterByDateRange(getAnalysisHistory(100), startDate, endDate);
  const anomaliesFlagged = anomalyHistory.filter(a => a.status === 'ANOMALY').length;

  return {
    queryRange: {
      startDate: startDate || null,
      endDate: endDate || null,
      isFiltered: Boolean(startDate || endDate)
    },
    totalEvents: events.length,
    transmissions: {
      total: totalTransmissions,
      successful: successfulTransmissions,
      failed: failedTransmissions,
      errorRate: `${txErrorRate}%`,
      errorRateNumeric: txErrorRate
    },
    errorInjections: {
      total: totalInjections,
      detected: detectedInjections,
      undetected: undetectedInjections,
      detectionRate: empiricalDetectionRate !== null ? `${empiricalDetectionRate}%` : 'N/A',
      detectionRateNumeric: empiricalDetectionRate
    },
    alerts: {
      totalInRange: alertsData.filteredCount,
      unacknowledged: alertStats.unacknowledged,
      acknowledged: alertStats.acknowledged,
      bySeverity: alertStats.bySeverity
    },
    aiIntelligence: {
      anomaliesFlagged,
      evaluationsCount: anomalyHistory.length
    }
  };
};

// ─── 2. Historical Timeline Trends ─────────────────────────────────────────────

/**
 * Generates time-bucketed event volume, transmission outcomes, and injection detections.
 * @param {object} [options]
 * @param {string} [options.startDate]
 * @param {string} [options.endDate]
 * @param {number} [options.buckets=8]
 * @returns {object[]}
 */
export const getHistoricalTimeline = ({ startDate = null, endDate = null, buckets = 8 } = {}) => {
  const safeBuckets = Math.min(Math.max(parseInt(buckets, 10) || 8, 2), 24);
  const allEvents = getTelemetryHistory();
  const events = filterByDateRange(allEvents, startDate, endDate);

  const timedEvents = events.filter(e => {
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

  if (tMin === tMax) {
    return [{
      bucketIndex: 1,
      label: 'Single Period',
      timeRange: new Date(tMin).toLocaleTimeString(),
      totalEvents: timedEvents.length,
      transmissions: timedEvents.filter(e => e.eventType === 'TRANSMISSION').length,
      successfulTransmissions: timedEvents.filter(e => e.eventType === 'TRANSMISSION' && e.crcMatch).length,
      failedTransmissions: timedEvents.filter(e => e.eventType === 'TRANSMISSION' && !e.crcMatch).length,
      injections: timedEvents.filter(e => e.eventType === 'ERROR_INJECTION').length,
      detectedErrors: timedEvents.filter(e => e.eventType === 'ERROR_INJECTION' && e.errorDetected).length,
      undetectedErrors: timedEvents.filter(e => e.eventType === 'ERROR_INJECTION' && !e.errorDetected).length
    }];
  }

  const span = tMax - tMin;
  const bucketWidth = span / safeBuckets;

  const bucketList = Array.from({ length: safeBuckets }, (_, i) => ({
    bucketIndex: i + 1,
    label: `P${i + 1}`,
    startMs: Math.round(tMin + i * bucketWidth),
    endMs: Math.round(tMin + (i + 1) * bucketWidth),
    totalEvents: 0,
    transmissions: 0,
    successfulTransmissions: 0,
    failedTransmissions: 0,
    injections: 0,
    detectedErrors: 0,
    undetectedErrors: 0
  }));

  timedEvents.forEach(e => {
    const t = Date.parse(e.timestamp);
    let idx = Math.floor((t - tMin) / bucketWidth);
    if (idx >= safeBuckets) idx = safeBuckets - 1;

    bucketList[idx].totalEvents++;
    if (e.eventType === 'TRANSMISSION') {
      bucketList[idx].transmissions++;
      if (e.crcMatch) bucketList[idx].successfulTransmissions++;
      else bucketList[idx].failedTransmissions++;
    } else if (e.eventType === 'ERROR_INJECTION') {
      bucketList[idx].injections++;
      if (e.errorDetected) bucketList[idx].detectedErrors++;
      else bucketList[idx].undetectedErrors++;
    }
  });

  return bucketList.map(b => ({
    bucketIndex: b.bucketIndex,
    label: b.label,
    timeRange: `${new Date(b.startMs).toLocaleTimeString()} - ${new Date(b.endMs).toLocaleTimeString()}`,
    totalEvents: b.totalEvents,
    transmissions: b.transmissions,
    successfulTransmissions: b.successfulTransmissions,
    failedTransmissions: b.failedTransmissions,
    injections: b.injections,
    detectedErrors: b.detectedErrors,
    undetectedErrors: b.undetectedErrors
  }));
};

// ─── 3. Historical Error Distribution ──────────────────────────────────────────

/**
 * Returns error-type frequency breakdown and bit-alteration summaries.
 * @param {object} [options]
 * @param {string} [options.startDate]
 * @param {string} [options.endDate]
 * @returns {object}
 */
export const getHistoricalErrorDistribution = ({ startDate = null, endDate = null } = {}) => {
  const allEvents = getTelemetryHistory();
  const events = filterByDateRange(allEvents, startDate, endDate);
  const injectionEvents = events.filter(e => e.eventType === 'ERROR_INJECTION');

  const errorTypes = ['SINGLE_BIT', 'MULTI_BIT', 'BURST', 'RANDOM'];
  const counts = {};
  errorTypes.forEach(t => { counts[t] = 0; });

  injectionEvents.forEach(e => {
    const type = e.errorType || 'UNKNOWN';
    counts[type] = (counts[type] || 0) + 1;
  });

  const total = injectionEvents.length;
  const distribution = Object.entries(counts).map(([type, count]) => ({
    errorType: type,
    count,
    percentage: total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0.0
  }));

  // Changed bit stats
  const bitCounts = injectionEvents
    .map(e => e.changedBitCount)
    .filter(v => typeof v === 'number' && v > 0);

  let bitStats = { count: 0, mean: null, min: null, max: null };
  if (bitCounts.length > 0) {
    const sum = bitCounts.reduce((a, b) => a + b, 0);
    bitStats = {
      count: bitCounts.length,
      mean: parseFloat((sum / bitCounts.length).toFixed(2)),
      min: Math.min(...bitCounts),
      max: Math.max(...bitCounts)
    };
  }

  return {
    totalInjections: total,
    distribution,
    bitStats
  };
};

// ─── 4. Historical Algorithm Outcomes ──────────────────────────────────────────

/**
 * Returns recorded CRC algorithm detection rates and trial counts.
 * @param {object} [options]
 * @param {string} [options.startDate]
 * @param {string} [options.endDate]
 * @returns {object[]}
 */
export const getHistoricalAlgorithmOutcomes = ({ startDate = null, endDate = null } = {}) => {
  const allEvents = getTelemetryHistory();
  const events = filterByDateRange(allEvents, startDate, endDate);

  const algorithms = ['CRC-8', 'CRC-16', 'CRC-32'];
  const statsMap = {};

  algorithms.forEach(algo => {
    statsMap[algo] = {
      algorithm: algo,
      transmissions: 0,
      transmissionErrors: 0,
      injections: 0,
      injectionsDetected: 0,
      injectionsUndetected: 0,
      empiricalDetectionRate: null
    };
  });

  events.forEach(e => {
    const algo = e.algorithm || 'CRC-32';
    if (!statsMap[algo]) {
      statsMap[algo] = {
        algorithm: algo,
        transmissions: 0,
        transmissionErrors: 0,
        injections: 0,
        injectionsDetected: 0,
        injectionsUndetected: 0,
        empiricalDetectionRate: null
      };
    }

    if (e.eventType === 'TRANSMISSION') {
      statsMap[algo].transmissions++;
      if (!e.crcMatch || e.errorDetected) statsMap[algo].transmissionErrors++;
    } else if (e.eventType === 'ERROR_INJECTION') {
      statsMap[algo].injections++;
      if (e.errorDetected) statsMap[algo].injectionsDetected++;
      else statsMap[algo].injectionsUndetected++;
    }
  });

  return Object.values(statsMap).map(record => {
    const rate = record.injections > 0
      ? parseFloat(((record.injectionsDetected / record.injections) * 100).toFixed(1))
      : null;
    return {
      ...record,
      empiricalDetectionRate: rate
    };
  });
};

// ─── 5. Data Export (CSV & JSON) ──────────────────────────────────────────────

/**
 * Exports historical analytics or alert summaries into CSV format.
 *
 * @param {object} options
 * @param {string} [options.type='alerts'] - 'alerts' | 'telemetry' | 'summary'
 * @param {string} [options.startDate]
 * @param {string} [options.endDate]
 * @returns {string} CSV formatted content
 */
export const exportHistoricalCsv = ({ type = 'alerts', startDate = null, endDate = null } = {}) => {
  if (type === 'alerts') {
    const { alerts } = getAlerts({ startDate, endDate, limit: 100 });
    const headers = ['Alert ID', 'Severity', 'Type', 'Title', 'Source Module', 'Related ID', 'Timestamp', 'Acknowledged', 'Acknowledged At'];
    const rows = alerts.map(a => [
      `"${a.alertId}"`,
      `"${a.severity}"`,
      `"${a.alertType}"`,
      `"${(a.title || '').replace(/"/g, '""')}"`,
      `"${(a.sourceModule || '').replace(/"/g, '""')}"`,
      `"${a.relatedId || ''}"`,
      `"${a.timestamp || ''}"`,
      `"${a.acknowledged ? 'TRUE' : 'FALSE'}"`,
      `"${a.acknowledgedAt || ''}"`
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  if (type === 'telemetry') {
    const allEvents = getTelemetryHistory();
    const events = filterByDateRange(allEvents, startDate, endDate);
    const headers = ['Event ID', 'Event Type', 'Source ID', 'Algorithm', 'Status', 'CRC Match', 'Error Detected', 'Error Type', 'Changed Bits', 'Timestamp'];
    const rows = events.map(e => [
      `"${e.eventId}"`,
      `"${e.eventType}"`,
      `"${e.sourceId || ''}"`,
      `"${e.algorithm || ''}"`,
      `"${e.status || ''}"`,
      `"${e.crcMatch !== undefined ? e.crcMatch : ''}"`,
      `"${e.errorDetected !== undefined ? e.errorDetected : ''}"`,
      `"${e.errorType || ''}"`,
      `"${e.changedBitCount !== undefined && e.changedBitCount !== null ? e.changedBitCount : ''}"`,
      `"${e.timestamp || ''}"`
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  // Summary Export
  const overview = getHistoricalOverview({ startDate, endDate });
  const headers = ['Metric Category', 'Metric Name', 'Value'];
  const rows = [
    ['"Transmissions"', '"Total"', `"${overview.transmissions.total}"`],
    ['"Transmissions"', '"Successful"', `"${overview.transmissions.successful}"`],
    ['"Transmissions"', '"Failed"', `"${overview.transmissions.failed}"`],
    ['"Transmissions"', '"Error Rate"', `"${overview.transmissions.errorRate}"`],
    ['"Error Injections"', '"Total"', `"${overview.errorInjections.total}"`],
    ['"Error Injections"', '"Detected"', `"${overview.errorInjections.detected}"`],
    ['"Error Injections"', '"Undetected"', `"${overview.errorInjections.undetected}"`],
    ['"Error Injections"', '"Detection Rate"', `"${overview.errorInjections.detectionRate}"`],
    ['"Alerts"', '"Total In Range"', `"${overview.alerts.totalInRange}"`],
    ['"Alerts"', '"Unacknowledged"', `"${overview.alerts.unacknowledged}"`],
    ['"Alerts"', '"Acknowledged"', `"${overview.alerts.acknowledged}"`]
  ];
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};
