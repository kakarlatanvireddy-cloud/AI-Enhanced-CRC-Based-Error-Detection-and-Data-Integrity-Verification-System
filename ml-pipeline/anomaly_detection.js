/**
 * ML Pipeline — AI Anomaly Detection Algorithm
 * Module 5: AI-Enhanced CRC-Based Error Detection System
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * IMPLEMENTATION NOTE — Why JavaScript instead of Python / Isolation Forest
 * ─────────────────────────────────────────────────────────────────────────────
 * The original design specified Python + scikit-learn (Isolation Forest).
 * Python is NOT installed in this deployment environment (confirmed: `python`
 * and `python3` commands both return "Python was not found").
 *
 * This module therefore implements an equivalent statistical anomaly detection
 * approach in pure JavaScript:
 *
 *   Method: Multi-Feature Z-Score Statistical Anomaly Detection
 *   ────────────────────────────────────────────────────────────
 *   • Five transmission features are extracted from the collected telemetry.
 *   • The event history is split into a baseline window (earlier 70%) and a
 *     recent window (latest 30%).
 *   • For each feature, a Z-score measures how far the recent window deviates
 *     from the baseline distribution.
 *   • Z-scores are capped and weighted to produce a composite anomaly score
 *     in the range [0.0, 1.0].
 *   • Scores ≥ ANOMALY_THRESHOLD are classified as ANOMALY.
 *
 * This is conceptually analogous to the statistical outlier scoring performed
 * by Isolation Forest's path-length metric, but does not use a tree ensemble.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * SCORE INTERPRETATION
 * ─────────────────────
 * • Range: [0.0, 1.0]
 * • This is NOT a probability.
 * • It is a weighted composite deviation index.
 * • A score of 0.0 means the recent window is statistically identical to the
 *   baseline. A score of 1.0 means maximum measured deviation across all features.
 * • Threshold: scores ≥ ANOMALY_THRESHOLD → ANOMALY; below → NORMAL.
 *
 * DATA SOURCE
 * ────────────
 * All feature values are derived from actual telemetry collected by
 * telemetry.service.js during live use of Modules 2 and 3.
 * No historical data is fabricated or pre-loaded.
 * The baseline is the earlier portion of actual collected events.
 */

// ─── Configuration ────────────────────────────────────────────────────────────

/** Minimum number of telemetry events required to attempt analysis. */
export const MIN_EVENTS_REQUIRED = 5;

/** Score threshold above which transmission patterns are classified as ANOMALY. */
export const ANOMALY_THRESHOLD = 0.55;

/** Fraction of the most-recent events forming the "current" window. */
const RECENT_WINDOW_RATIO = 0.30;

/** Minimum size of the recent window even if the ratio produces fewer events. */
const MIN_RECENT_WINDOW = 2;

/**
 * Feature weights — must sum to exactly 1.0.
 * CRC error rate carries the highest weight because it is the most direct
 * signal of data corruption anomaly in a CRC-based system.
 */
const FEATURE_WEIGHTS = {
  crcErrorRate:       0.35, // Proportion of events with CRC mismatch
  injectionFrequency: 0.25, // Proportion of error-injection events
  avgPayloadSize:     0.15, // Mean payload size in bytes
  avgBitChanges:      0.15, // Mean altered bit count per injection
  burstActivity:      0.10  // Proportion of BURST-type injections
};

/**
 * Z-score cap: a z-score of this magnitude maps to a normalised deviation of 1.0.
 * Using 3 standard deviations as the cap is a conventional statistical threshold.
 */
const Z_SCORE_CAP = 3.0;

// ─── Statistical Utilities ────────────────────────────────────────────────────

/**
 * Arithmetic mean of an array. Returns 0 for empty arrays.
 * @param {number[]} arr
 * @returns {number}
 */
const mean = (arr) => {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
};

/**
 * Population standard deviation. Returns a minimum epsilon to prevent
 * division-by-zero when all values in the window are identical.
 * @param {number[]} arr
 * @param {number} [epsilon=0.001]
 * @returns {number}
 */
const stddev = (arr, epsilon = 0.001) => {
  if (arr.length < 2) return epsilon;
  const m = mean(arr);
  const variance = arr.reduce((acc, v) => acc + (v - m) ** 2, 0) / arr.length;
  return Math.max(Math.sqrt(variance), epsilon);
};

// ─── Feature Extraction ───────────────────────────────────────────────────────

/**
 * Extracts the five anomaly detection features from a window of telemetry events.
 *
 * @param {object[]} events - Telemetry event records from telemetry.service.js
 * @returns {object} Feature values keyed by feature name
 */
export const extractFeatures = (events) => {
  const total = events.length;
  if (total === 0) {
    return {
      crcErrorRate:       0,
      injectionFrequency: 0,
      avgPayloadSize:     0,
      avgBitChanges:      0,
      burstActivity:      0
    };
  }

  // F1 — CRC Error Rate
  const errorCount  = events.filter(e => e.errorDetected === true).length;
  const crcErrorRate = errorCount / total;

  // F2 — Injection Frequency
  const injEvents        = events.filter(e => e.eventType === 'ERROR_INJECTION');
  const injectionFrequency = injEvents.length / total;

  // F3 — Average Payload Size (bytes)
  const sizes        = events.map(e => e.payloadSize || 0);
  const avgPayloadSize = mean(sizes);

  // F4 — Average Bit Changes per injection event
  const bitChanges   = injEvents.map(e => e.changedBitCount || 0);
  const avgBitChanges = mean(bitChanges);

  // F5 — Burst Activity (proportion of BURST-type among all injections)
  const burstCount   = injEvents.filter(e => e.errorType === 'BURST').length;
  const burstActivity = injEvents.length > 0 ? burstCount / injEvents.length : 0;

  return {
    crcErrorRate:       parseFloat(crcErrorRate.toFixed(6)),
    injectionFrequency: parseFloat(injectionFrequency.toFixed(6)),
    avgPayloadSize:     parseFloat(avgPayloadSize.toFixed(4)),
    avgBitChanges:      parseFloat(avgBitChanges.toFixed(4)),
    burstActivity:      parseFloat(burstActivity.toFixed(6))
  };
};

// ─── Per-Event Raw Values ─────────────────────────────────────────────────────

/**
 * Extracts per-event scalar values for each feature from a baseline window.
 * These are used to compute baseline mean and standard deviation.
 *
 * @param {object[]} events
 * @returns {object} Map of feature name → number[]
 */
const extractPerEventValues = (events) => ({
  crcErrorRate:       events.map(e => (e.errorDetected ? 1 : 0)),
  injectionFrequency: events.map(e => (e.eventType === 'ERROR_INJECTION' ? 1 : 0)),
  avgPayloadSize:     events.map(e => e.payloadSize || 0),
  avgBitChanges:      events.map(e => e.changedBitCount || 0),
  burstActivity:      events.map(e => (e.errorType === 'BURST' ? 1 : 0))
});

// ─── Explanation Generator ────────────────────────────────────────────────────

/**
 * Produces a human-readable explanation of the analysis result.
 *
 * @param {string} status        - 'NORMAL' | 'ANOMALY' | 'INSUFFICIENT DATA'
 * @param {number|null} score    - Composite anomaly score
 * @param {object|null} features - Feature comparison details
 * @param {number} eventCount    - Total events analysed
 * @returns {string}
 */
const generateExplanation = (status, score, features, eventCount) => {
  if (status === 'INSUFFICIENT DATA') {
    return (
      `Insufficient telemetry: ${eventCount} event(s) recorded. ` +
      `At least ${MIN_EVENTS_REQUIRED} events are required before anomaly analysis ` +
      `can produce meaningful results. ` +
      `Use the Transmission Simulator (Module 2) or Error Injection Simulator (Module 3) ` +
      `to generate more events, then run analysis again.`
    );
  }

  const scoreStr = score !== null ? score.toFixed(3) : 'N/A';

  if (status === 'ANOMALY') {
    const parts = [`Anomaly detected (composite score: ${scoreStr}). `];

    // Find features with |z| ≥ 1.5 and sort by severity
    const flagged = Object.entries(features)
      .filter(([, v]) => Math.abs(v.zScore) >= 1.5)
      .sort((a, b) => Math.abs(b[1].zScore) - Math.abs(a[1].zScore));

    const labels = {
      crcErrorRate:       'CRC error rate',
      injectionFrequency: 'error injection frequency',
      avgPayloadSize:     'average payload size',
      avgBitChanges:      'average bit-change magnitude',
      burstActivity:      'burst error activity'
    };

    if (flagged.length > 0) {
      const descriptions = flagged.map(([name, v]) => {
        const direction = v.zScore > 0 ? 'increased' : 'decreased';
        return `${labels[name] || name} has significantly ${direction} (z = ${v.zScore.toFixed(1)})`;
      });
      parts.push(`Contributing factors: ${descriptions.join('; ')}. `);
    }

    parts.push(
      'This indicates recent transmission patterns deviate significantly from ' +
      'the baseline established in earlier collected events. ' +
      'An anomaly does not necessarily indicate a security attack — it may also ' +
      'reflect a change in test conditions, payload characteristics, or workload intensity.'
    );

    return parts.join('');
  }

  // NORMAL
  return (
    `No anomaly detected (composite score: ${scoreStr}). ` +
    'Recent transmission patterns are statistically consistent with the baseline ' +
    'established from earlier collected telemetry. ' +
    'CRC error rates, injection frequencies, payload sizes, and bit-change magnitudes ' +
    'are all within normal statistical ranges relative to the observed baseline.'
  );
};

// ─── Main Detection Function ───────────────────────────────────────────────────

/**
 * Performs anomaly detection on the provided telemetry event history.
 *
 * This function is the primary entry point used by anomalyDetection.service.js.
 * It accepts an array of telemetry events and returns a structured detection result.
 * It does NOT modify any external state.
 *
 * @param {object[]} events - Telemetry events from telemetry.service.js
 * @returns {object} Structured anomaly detection result
 */
export const detectAnomaly = (events) => {
  const N = events.length;
  const timestamp = new Date().toISOString();

  const commonMeta = {
    detectionMethod: 'Multi-Feature Z-Score Statistical Anomaly Detection ' +
      '(JavaScript-native; Python not available in this environment)',
    featuresConsidered: Object.keys(FEATURE_WEIGHTS),
    scoreInterpretation:
      `Composite weighted deviation index in [0.0, 1.0]. ` +
      `NOT a probability. Scores ≥ ${ANOMALY_THRESHOLD} are classified as ANOMALY.`,
    limitations: [
      'Python runtime unavailable; scikit-learn Isolation Forest replaced by ' +
      'JavaScript multi-feature Z-score statistical detection.',
      'Baseline is derived from earlier collected telemetry events, ' +
      'NOT pre-trained on real historical data.',
      `Reliable detection requires significantly more than ${MIN_EVENTS_REQUIRED} events; ` +
      '20+ events recommended.',
      'In-memory telemetry resets on server restart; restarting clears the baseline.'
    ],
    timestamp
  };

  // ── Insufficient Data ────────────────────────────────────────────────────
  if (N < MIN_EVENTS_REQUIRED) {
    return {
      status: 'INSUFFICIENT DATA',
      score: null,
      featureComparison: null,
      eventCount: N,
      baselineWindowSize: 0,
      recentWindowSize: 0,
      explanation: generateExplanation('INSUFFICIENT DATA', null, null, N),
      ...commonMeta
    };
  }

  // ── Window Partitioning ──────────────────────────────────────────────────
  const recentWindowSize  = Math.max(Math.floor(N * RECENT_WINDOW_RATIO), MIN_RECENT_WINDOW);
  const baselineWindowSize = N - recentWindowSize;

  const baselineEvents = events.slice(0, baselineWindowSize);
  const recentEvents   = events.slice(baselineWindowSize);

  // ── Feature Extraction ───────────────────────────────────────────────────
  const recentFeatures      = extractFeatures(recentEvents);
  const baselinePerEvtVals  = extractPerEventValues(baselineEvents);

  // ── Per-Feature Z-Score and Weighted Deviation ───────────────────────────
  const featureComparison = {};
  let weightedScore = 0;

  for (const [fname, weight] of Object.entries(FEATURE_WEIGHTS)) {
    const baselineVals  = baselinePerEvtVals[fname];
    const baselineMean_ = mean(baselineVals);
    const baselineStd   = stddev(baselineVals);
    const recentVal     = recentFeatures[fname];

    const zScore    = (recentVal - baselineMean_) / baselineStd;
    const deviation = Math.min(Math.abs(zScore) / Z_SCORE_CAP, 1.0);

    featureComparison[fname] = {
      baselineMean:  parseFloat(baselineMean_.toFixed(4)),
      recentValue:   recentVal,
      zScore:        parseFloat(zScore.toFixed(3)),
      deviation:     parseFloat(deviation.toFixed(4)),
      weight
    };

    weightedScore += deviation * weight;
  }

  const compositeScore = parseFloat(Math.min(weightedScore, 1.0).toFixed(4));

  // ── Classification ───────────────────────────────────────────────────────
  const status = compositeScore >= ANOMALY_THRESHOLD ? 'ANOMALY' : 'NORMAL';

  return {
    status,
    score: compositeScore,
    featureComparison,
    eventCount: N,
    baselineWindowSize,
    recentWindowSize,
    explanation: generateExplanation(status, compositeScore, featureComparison, N),
    ...commonMeta
  };
};
