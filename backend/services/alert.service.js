/**
 * Alert Service — Module 8
 *
 * Generates and manages alerts derived from real telemetry, transmission,
 * error-injection, AI anomaly, and pattern analysis events.
 *
 * Severity Rules:
 *  - CRITICAL: Undetected corruption (payload corrupted but CRC matched), or subsystem degradation.
 *  - HIGH:     AI Anomaly detected (score >= threshold), or BURST DOMINANT pattern detected.
 *  - WARNING:  CRC mismatch in transmission stream, or high-bit corruption detected.
 *  - INFO:     Normal transmission stream verified, or routine analysis completed.
 *
 * Deduplication:
 *  - Uses sourceEventId + alertType composite keys to prevent duplicate alert generation
 *    during repeated polling or analysis passes.
 *
 * In-Memory Persistence:
 *  - Alerts are stored in memory for the current backend session (max 500 records).
 */

import { getTelemetryHistory } from './telemetry.service.js';
import { getAnalysisHistory } from './anomalyDetection.service.js';
import { getPatternHistory } from './errorPatternAnalysis.service.js';
import { getSystemHealthStatus } from './health.service.js';

const MAX_ALERT_HISTORY = 500;

/** @type {object[]} In-memory alert store. */
let alertHistory = [];
let alertCounter = 0;

/** @type {Set<string>} Track generated event alerts to avoid duplicates. */
const seenEventAlerts = new Set();

/**
 * Generates a unique, formatted Alert ID.
 * Example: ALT-20261001-0001
 * @returns {string}
 */
const generateAlertId = () => {
  alertCounter++;
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `ALT-${dateStr}-${String(alertCounter).padStart(4, '0')}`;
};

/**
 * Adds an alert to the store if it has not already been recorded.
 * @param {object} alertData
 * @returns {object|null}
 */
export const createAlert = ({
  alertType,
  severity,
  title,
  description,
  sourceModule,
  relatedId = null,
  timestamp = null,
  metadata = {}
}) => {
  const dedupeKey = `${relatedId || title}_${alertType}`;
  if (seenEventAlerts.has(dedupeKey)) {
    return null;
  }
  seenEventAlerts.add(dedupeKey);

  const alertRecord = {
    alertId: generateAlertId(),
    alertType,
    severity: severity.toUpperCase(), // 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL'
    title,
    description,
    sourceModule,
    relatedId,
    timestamp: timestamp || new Date().toISOString(),
    acknowledged: false,
    acknowledgedAt: null,
    metadata
  };

  alertHistory.push(alertRecord);
  if (alertHistory.length > MAX_ALERT_HISTORY) {
    alertHistory.shift();
  }

  return alertRecord;
};

// ─── Subsystem Event Alert Synchronization ─────────────────────────────────────

/**
 * Scans existing telemetry and AI outputs to synchronize alerts for new events.
 * Safe to call repeatedly due to deduplication.
 */
export const syncAlertsFromSubsystems = () => {
  // 1. Scan Telemetry Events (Transmissions & Injections)
  const telemetry = getTelemetryHistory();
  telemetry.forEach(event => {
    if (event.eventType === 'ERROR_INJECTION') {
      // Critical: Injected error bypassed CRC check
      if (event.errorDetected === false) {
        createAlert({
          alertType: 'CRC_BYPASS_UNDETECTED',
          severity: 'CRITICAL',
          title: 'Undetected Payload Corruption Detected',
          description: `Payload corrupted via ${event.errorType || 'injection'} (${event.changedBitCount ?? 1} bits), but ${event.algorithm || 'CRC'} returned a valid checksum match.`,
          sourceModule: 'Module 3 (Error Injection)',
          relatedId: event.sourceId || event.eventId,
          timestamp: event.timestamp,
          metadata: { algorithm: event.algorithm, errorType: event.errorType, changedBitCount: event.changedBitCount }
        });
      } else {
        // Warning: Corrupted bits were detected by CRC
        createAlert({
          alertType: 'CORRUPTED_FRAME_CAUGHT',
          severity: 'WARNING',
          title: `Corrupted Frame Intercepted by ${event.algorithm}`,
          description: `CRC intercepted ${event.errorType || 'injected'} corruption (${event.changedBitCount ?? 1} altered bits). Integrity verification preserved.`,
          sourceModule: 'Module 3 (Error Injection)',
          relatedId: event.sourceId || event.eventId,
          timestamp: event.timestamp,
          metadata: { algorithm: event.algorithm, errorType: event.errorType }
        });
      }
    } else if (event.eventType === 'TRANSMISSION') {
      if (event.errorDetected === true || event.crcMatch === false) {
        createAlert({
          alertType: 'TRANSMISSION_CRC_MISMATCH',
          severity: 'WARNING',
          title: 'Transmission Channel CRC Mismatch',
          description: `Receiver checksum mismatch detected on transmission stream ${event.sourceId || event.eventId}.`,
          sourceModule: 'Module 2 (Transmission Simulator)',
          relatedId: event.sourceId || event.eventId,
          timestamp: event.timestamp,
          metadata: { algorithm: event.algorithm }
        });
      }
    }
  });

  // 2. Scan AI Anomaly Evaluations (Module 5)
  const anomalies = getAnalysisHistory(50);
  anomalies.forEach(anom => {
    if (anom.status === 'ANOMALY') {
      createAlert({
        alertType: 'AI_ANOMALY_FLAGGED',
        severity: 'HIGH',
        title: 'AI Anomaly Detected in Telemetry Stream',
        description: `Anomaly engine flagged statistical divergence (Score: ${typeof anom.score === 'number' ? anom.score.toFixed(3) : 'High'}). Pattern exceeds baseline bounds.`,
        sourceModule: 'Module 5 (AI Anomaly Detection)',
        relatedId: anom.analysisId,
        timestamp: anom.timestamp,
        metadata: { score: anom.score, dominantAnomalyType: anom.featureComparison?.dominantAnomalyType }
      });
    }
  });

  // 3. Scan AI Error Pattern Runs (Module 6)
  const patterns = getPatternHistory(50);
  patterns.forEach(pat => {
    if (pat.dominantPattern?.classification?.includes('BURST')) {
      createAlert({
        alertType: 'BURST_NOISE_DOMINANT',
        severity: 'HIGH',
        title: 'Burst Error Signature Dominance Observed',
        description: `Pattern classifier diagnosed ${pat.dominantPattern.classification} across ${pat.injectionCount} injections (${pat.dominantPattern.confidence}% share).`,
        sourceModule: 'Module 6 (Error Pattern Analysis)',
        relatedId: pat.analysisId,
        timestamp: pat.timestamp,
        metadata: { dominantPattern: pat.dominantPattern.classification, confidence: pat.dominantPattern.confidence }
      });
    }
  });

  // 4. Scan Subsystem Health (Module 7)
  const health = getSystemHealthStatus();
  if (health.status !== 'OK') {
    createAlert({
      alertType: 'SYSTEM_HEALTH_DEGRADED',
      severity: 'CRITICAL',
      title: 'Backend Subsystem Health Degradation',
      description: `Backend health status reported as ${health.status}. Some modules may be unavailable.`,
      sourceModule: 'Module 7 (Health & Monitoring)',
      relatedId: 'HEALTH-CHECK',
      timestamp: health.timestamp,
      metadata: { modules: health.modules }
    });
  }
};

// ─── Query & Management APIs ──────────────────────────────────────────────────

/**
 * Retrieves alerts with multi-dimensional filtering.
 *
 * @param {object} options
 * @param {string} [options.severity] - 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL'
 * @param {string} [options.alertType] - Filter by specific alertType
 * @param {boolean|string} [options.acknowledged] - Filter by acknowledgement status
 * @param {string} [options.startDate] - ISO date or string
 * @param {string} [options.endDate] - ISO date or string
 * @param {number} [options.limit=50] - Maximum records to return (1-100)
 * @returns {object}
 */
export const getAlerts = ({
  severity = null,
  alertType = null,
  acknowledged = null,
  startDate = null,
  endDate = null,
  limit = 50
} = {}) => {
  // Sync latest alerts from subsystems
  syncAlertsFromSubsystems();

  let results = [...alertHistory];

  // Filter: Severity
  if (severity && typeof severity === 'string' && severity.trim() !== '') {
    const sevUpper = severity.trim().toUpperCase();
    results = results.filter(a => a.severity === sevUpper);
  }

  // Filter: Alert Type
  if (alertType && typeof alertType === 'string' && alertType.trim() !== '') {
    const typeUpper = alertType.trim().toUpperCase();
    results = results.filter(a => a.alertType === typeUpper);
  }

  // Filter: Acknowledged
  if (acknowledged !== null && acknowledged !== undefined && acknowledged !== '') {
    const ackBool = String(acknowledged).toLowerCase() === 'true';
    results = results.filter(a => a.acknowledged === ackBool);
  }

  // Filter: Start Date
  if (startDate) {
    const startMs = Date.parse(startDate);
    if (!isNaN(startMs)) {
      results = results.filter(a => {
        const t = Date.parse(a.timestamp);
        return !isNaN(t) && t >= startMs;
      });
    }
  }

  // Filter: End Date
  if (endDate) {
    const endMs = Date.parse(endDate);
    if (!isNaN(endMs)) {
      results = results.filter(a => {
        const t = Date.parse(a.timestamp);
        return !isNaN(t) && t <= endMs;
      });
    }
  }

  // Sort reverse-chronologically (newest first)
  results.sort((a, b) => {
    const tA = a.timestamp ? Date.parse(a.timestamp) : 0;
    const tB = b.timestamp ? Date.parse(b.timestamp) : 0;
    return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
  });

  const totalFiltered = results.length;
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
  const paginated = results.slice(0, safeLimit);

  return {
    alerts: paginated,
    count: paginated.length,
    totalAvailable: alertHistory.length,
    filteredCount: totalFiltered
  };
};

/**
 * Retrieves a single alert by its unique alertId.
 * @param {string} alertId
 * @returns {object|null}
 */
export const getAlertById = (alertId) => {
  syncAlertsFromSubsystems();
  if (!alertId || typeof alertId !== 'string') return null;
  return alertHistory.find(a => a.alertId === alertId.trim()) || null;
};

/**
 * Acknowledges an alert by setting acknowledged: true and acknowledgedAt timestamp.
 * @param {string} alertId
 * @returns {object|null}
 */
export const acknowledgeAlert = (alertId) => {
  syncAlertsFromSubsystems();
  if (!alertId || typeof alertId !== 'string') return null;
  const alert = alertHistory.find(a => a.alertId === alertId.trim());
  if (!alert) return null;

  alert.acknowledged = true;
  alert.acknowledgedAt = new Date().toISOString();
  return alert;
};

/**
 * Returns summary counts across all alerts by severity and acknowledgement status.
 * @returns {object}
 */
export const getAlertStats = () => {
  syncAlertsFromSubsystems();
  const total = alertHistory.length;

  const criticalCount = alertHistory.filter(a => a.severity === 'CRITICAL').length;
  const highCount     = alertHistory.filter(a => a.severity === 'HIGH').length;
  const warningCount  = alertHistory.filter(a => a.severity === 'WARNING').length;
  const infoCount     = alertHistory.filter(a => a.severity === 'INFO').length;

  const acknowledgedCount   = alertHistory.filter(a => a.acknowledged === true).length;
  const unacknowledgedCount = alertHistory.filter(a => a.acknowledged === false).length;

  // Breakdown by Alert Type
  const byType = {};
  alertHistory.forEach(a => {
    byType[a.alertType] = (byType[a.alertType] || 0) + 1;
  });

  return {
    totalAlerts: total,
    unacknowledged: unacknowledgedCount,
    acknowledged: acknowledgedCount,
    bySeverity: {
      critical: criticalCount,
      high: highCount,
      warning: warningCount,
      info: infoCount
    },
    byType
  };
};

/**
 * Clears in-memory alert history. Intended for test isolation only.
 */
export const clearAlertHistory = () => {
  alertHistory = [];
  alertCounter = 0;
  seenEventAlerts.clear();
};
