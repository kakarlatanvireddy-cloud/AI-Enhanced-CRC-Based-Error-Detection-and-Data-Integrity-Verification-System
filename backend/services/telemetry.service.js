/**
 * Telemetry Service — Module 5
 *
 * Collects per-event records from Module 2 (Transmission Simulator) and
 * Module 3 (Error Injection Simulator) for use by the AI Anomaly Detection engine.
 *
 * Design decisions:
 *  - In-memory circular buffer; no external database required.
 *  - Maximum size (MAX_HISTORY_SIZE) prevents unbounded memory growth.
 *  - Does NOT duplicate CRC or transmission logic — records outcomes only.
 *  - Events are recorded only when actual operations occur (called from services).
 *  - Empty history is handled safely; all getters return sensible defaults.
 *  - Exported clearTelemetry() is provided for test isolation.
 */

const MAX_HISTORY_SIZE = 500;

/** @type {object[]} In-memory circular event buffer. */
let telemetryHistory = [];
let eventCounter = 0;

/**
 * Generates a unique, formatted telemetry event ID.
 * Example: TEL-20261001-00042
 * @returns {string}
 */
const generateEventId = () => {
  eventCounter++;
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `TEL-${dateStr}-${String(eventCounter).padStart(5, '0')}`;
};

/**
 * Appends an event to the history buffer, evicting the oldest entry if full.
 * @param {object} event
 */
const appendEvent = (event) => {
  telemetryHistory.push(event);
  if (telemetryHistory.length > MAX_HISTORY_SIZE) {
    telemetryHistory.shift();
  }
};

// ─── Public Recording API ──────────────────────────────────────────────────────

/**
 * Records a completed transmission event from Module 2.
 * Called by transmission.service.js after each successful simulation.
 *
 * @param {object} transmission - The `transmission` sub-object from simulateTransmission()
 */
export const recordTransmissionEvent = (transmission) => {
  appendEvent({
    eventId:        generateEventId(),
    eventType:      'TRANSMISSION',
    sourceId:       transmission.transmissionId,
    timestamp:      transmission.timestamp || new Date().toISOString(),
    payloadSize:    transmission.payloadSize || 0,
    algorithm:      transmission.algorithm,
    status:         transmission.status,
    crcMatch:       transmission.match,
    errorDetected:  transmission.errorDetected,
    // Injection-specific fields are null for plain transmissions
    errorType:      null,
    changedBitCount: null,
    burstLength:    null
  });
};

/**
 * Records a completed error injection event from Module 3.
 * Called by errorInjection.service.js after each successful simulation.
 *
 * @param {object} result - The `result` sub-object from injectErrorAndSimulate()
 */
export const recordInjectionEvent = (result) => {
  // Derive payload size from totalBits (origBuffer.length * 8), which is always present.
  const payloadSize = typeof result.totalBits === 'number'
    ? Math.floor(result.totalBits / 8)
    : Buffer.byteLength(result.data || '', 'utf-8');

  appendEvent({
    eventId:        generateEventId(),
    eventType:      'ERROR_INJECTION',
    sourceId:       result.injectionId,
    timestamp:      result.timestamp || new Date().toISOString(),
    payloadSize,
    algorithm:      result.algorithm,
    status:         result.status,
    crcMatch:       result.match,
    errorDetected:  result.errorDetected,
    errorType:      result.errorType,
    changedBitCount: result.changedBitCount,
    burstLength:    result.burstDetails ? result.burstDetails.burstLength : null
  });
};

// ─── Public Query API ──────────────────────────────────────────────────────────

/**
 * Returns a shallow copy of all collected telemetry events.
 * Consumers receive a copy; the internal buffer is not exposed directly.
 * @returns {object[]}
 */
export const getTelemetryHistory = () => [...telemetryHistory];

/**
 * Returns the current number of collected events.
 * @returns {number}
 */
export const getTelemetryCount = () => telemetryHistory.length;

/**
 * Returns aggregate statistics about the collected telemetry.
 * All values are computed from actual recorded events.
 * @returns {object}
 */
export const getTelemetryStats = () => {
  const total = telemetryHistory.length;

  if (total === 0) {
    return {
      totalEvents:        0,
      transmissionEvents: 0,
      injectionEvents:    0,
      crcErrorCount:      0,
      crcErrorRate:       0,
      maxHistorySize:     MAX_HISTORY_SIZE
    };
  }

  const transmissionEvents = telemetryHistory.filter(e => e.eventType === 'TRANSMISSION').length;
  const injectionEvents    = telemetryHistory.filter(e => e.eventType === 'ERROR_INJECTION').length;
  const crcErrorCount      = telemetryHistory.filter(e => e.errorDetected === true).length;

  return {
    totalEvents:        total,
    transmissionEvents,
    injectionEvents,
    crcErrorCount,
    crcErrorRate:       parseFloat(((crcErrorCount / total) * 100).toFixed(2)),
    maxHistorySize:     MAX_HISTORY_SIZE
  };
};

/**
 * Clears the telemetry history and resets the counter.
 * Intended for use in tests to ensure isolation between test cases.
 * Should NOT be called in production code paths.
 */
export const clearTelemetry = () => {
  telemetryHistory = [];
  eventCounter = 0;
};
