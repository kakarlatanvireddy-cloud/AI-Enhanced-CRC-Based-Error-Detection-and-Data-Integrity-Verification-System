/**
 * ML Pipeline — AI Error Pattern Analysis
 * Module 6: AI-Enhanced CRC-Based Error Detection System
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PURPOSE
 * ─────────────────────────────────────────────────────────────────────────────
 * Where Module 5 (Anomaly Detection) asks "Is the *recent* behaviour unusual
 * compared to the baseline?", Module 6 asks "What *kinds* of errors have been
 * occurring, and what patterns can be observed across the full history?"
 *
 * This module analyses all error-injection and transmission records stored by
 * telemetry.service.js and produces:
 *   • Frequency distributions by error type
 *   • Bit-change and burst-length histograms
 *   • Detection outcome summaries per error type and per CRC algorithm
 *   • Time-based error activity trends
 *   • Concise, evidence-based human-readable insights
 *   • A dominant pattern classification
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * IMPLEMENTATION NOTE — No Python / No ML Model Training
 * ─────────────────────────────────────────────────────────────────────────────
 * Python is not available in this environment. No ML model is trained here.
 * All analysis is deterministic statistical computation over the telemetry
 * records collected during the current server session.
 * All insights are labelled with the number of supporting records.
 * No causal claims are made; the module only describes observed patterns.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TELEMETRY SCHEMA (from telemetry.service.js)
 * ─────────────────────────────────────────────────────────────────────────────
 * Each event object has the following fields (all read safely with fallbacks):
 *   eventId, eventType ('TRANSMISSION' | 'ERROR_INJECTION'),
 *   sourceId, timestamp, payloadSize, algorithm, status,
 *   crcMatch, errorDetected,
 *   errorType  (null for TRANSMISSION; 'SINGLE_BIT' | 'MULTI_BIT' | 'BURST' | 'RANDOM')
 *   changedBitCount (null for TRANSMISSION; integer for injections)
 *   burstLength     (null unless errorType === 'BURST')
 */

// ─── Constants ─────────────────────────────────────────────────────────────────

/** Minimum injection events required to produce a pattern report. */
export const MIN_INJECTION_EVENTS = 3;

/** Known error types (for canonical ordering in distributions). */
export const KNOWN_ERROR_TYPES = ['SINGLE_BIT', 'MULTI_BIT', 'BURST', 'RANDOM'];

/** Known CRC algorithms (for canonical ordering in per-algorithm tables). */
export const KNOWN_ALGORITHMS = ['CRC-8', 'CRC-16', 'CRC-32'];

/**
 * Number of equal-width time buckets for the trend analysis.
 * Kept small so that even modest histories produce visible trends.
 */
const TIME_BUCKETS = 6;

// ─── Statistical Utilities ─────────────────────────────────────────────────────

/**
 * Arithmetic mean (0 for empty array).
 * @param {number[]} arr
 */
const mean = (arr) => (arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length);

/**
 * Median (returns 0 for empty array).
 * @param {number[]} arr
 */
const median = (arr) => {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

/**
 * Mode — returns the most frequent value, or null if no elements.
 * On ties, the smallest value wins (deterministic).
 * @param {number[]} arr
 * @returns {number|null}
 */
const mode = (arr) => {
  if (arr.length === 0) return null;
  const freq = {};
  arr.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
  return Number(Object.entries(freq).sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0]);
};

/**
 * Counts occurrences of each unique value in an array.
 * Returns an array of {value, count, pct} sorted by count descending.
 * @param {Array} arr
 * @returns {Array<{value: *, count: number, pct: number}>}
 */
const frequencyTable = (arr) => {
  if (arr.length === 0) return [];
  const freq = {};
  arr.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
  const total = arr.length;
  return Object.entries(freq)
    .map(([value, count]) => ({
      value,
      count,
      pct: parseFloat(((count / total) * 100).toFixed(1))
    }))
    .sort((a, b) => b.count - a.count || String(a.value).localeCompare(String(b.value)));
};

// ─── Time Bucketing ────────────────────────────────────────────────────────────

/**
 * Bins events into TIME_BUCKETS equal-width time slots.
 * Returns an array of {label, count, detectedCount} objects.
 * Events with invalid or missing timestamps are omitted from trend analysis.
 *
 * @param {object[]} events
 * @returns {Array<{label: string, count: number, detectedCount: number}>}
 */
const buildTimeTrend = (events) => {
  // Filter to events with parseable timestamps
  const timed = events.filter(e => {
    if (!e.timestamp) return false;
    const t = Date.parse(e.timestamp);
    return !isNaN(t);
  });

  if (timed.length < 2) return [];

  const timestamps = timed.map(e => Date.parse(e.timestamp));
  const tMin = Math.min(...timestamps);
  const tMax = Math.max(...timestamps);

  // Avoid division by zero when all events share the same millisecond
  if (tMax === tMin) {
    return [{ label: 'All Events', count: timed.length, detectedCount: timed.filter(e => e.errorDetected).length }];
  }

  const bucketWidth = (tMax - tMin) / TIME_BUCKETS;
  const buckets = Array.from({ length: TIME_BUCKETS }, (_, i) => ({
    label: `T${i + 1}`,
    count: 0,
    detectedCount: 0,
    startMs: tMin + i * bucketWidth,
    endMs:   tMin + (i + 1) * bucketWidth
  }));

  timed.forEach(e => {
    const ts = Date.parse(e.timestamp);
    // Clamp last event into last bucket
    let idx = Math.floor((ts - tMin) / bucketWidth);
    if (idx >= TIME_BUCKETS) idx = TIME_BUCKETS - 1;
    buckets[idx].count++;
    if (e.errorDetected) buckets[idx].detectedCount++;
  });

  return buckets.map(({ label, count, detectedCount }) => ({ label, count, detectedCount }));
};

// ─── Core Analysis ─────────────────────────────────────────────────────────────

/**
 * Computes error-type frequency distribution.
 * Ensures all known error types appear in the output (with count=0 if absent).
 * @param {object[]} injectionEvents
 */
const computeErrorTypeDistribution = (injectionEvents) => {
  const raw = frequencyTable(injectionEvents.map(e => e.errorType || 'UNKNOWN'));
  const map = Object.fromEntries(raw.map(r => [r.value, r]));
  const total = injectionEvents.length;

  return KNOWN_ERROR_TYPES.map(t => ({
    errorType: t,
    count:     map[t]?.count || 0,
    pct:       total > 0 ? parseFloat(((map[t]?.count || 0) / total * 100).toFixed(1)) : 0
  })).concat(
    // Include unknown types if any appear
    raw.filter(r => !KNOWN_ERROR_TYPES.includes(r.value)).map(r => ({
      errorType: r.value,
      count:     r.count,
      pct:       r.pct
    }))
  );
};

/**
 * Computes bit-change distribution statistics.
 * @param {object[]} injectionEvents
 */
const computeBitChangeStats = (injectionEvents) => {
  const counts = injectionEvents
    .map(e => e.changedBitCount)
    .filter(v => typeof v === 'number' && v > 0);

  if (counts.length === 0) {
    return { available: false, count: 0, mean: null, median: null, mode: null, min: null, max: null, distribution: [] };
  }

  return {
    available:    true,
    count:        counts.length,
    mean:         parseFloat(mean(counts).toFixed(2)),
    median:       parseFloat(median(counts).toFixed(2)),
    mode:         mode(counts),
    min:          Math.min(...counts),
    max:          Math.max(...counts),
    distribution: frequencyTable(counts).map(r => ({ bits: Number(r.value), count: r.count, pct: r.pct }))
  };
};

/**
 * Computes burst-length distribution statistics (only for BURST events).
 * @param {object[]} injectionEvents
 */
const computeBurstStats = (injectionEvents) => {
  const burstEvents = injectionEvents.filter(e => e.errorType === 'BURST');
  const lengths = burstEvents
    .map(e => e.burstLength)
    .filter(v => typeof v === 'number' && v > 0);

  if (lengths.length === 0) {
    return {
      available:    false,
      burstCount:   burstEvents.length,
      mean:         null,
      median:       null,
      mode:         null,
      min:          null,
      max:          null,
      distribution: []
    };
  }

  return {
    available:    true,
    burstCount:   burstEvents.length,
    mean:         parseFloat(mean(lengths).toFixed(2)),
    median:       parseFloat(median(lengths).toFixed(2)),
    mode:         mode(lengths),
    min:          Math.min(...lengths),
    max:          Math.max(...lengths),
    distribution: frequencyTable(lengths).map(r => ({ length: Number(r.value), count: r.count, pct: r.pct }))
  };
};

/**
 * Groups detection outcomes by CRC algorithm.
 * Returns an array with one entry per observed algorithm.
 * @param {object[]} injectionEvents
 */
const computeAlgorithmBreakdown = (injectionEvents) => {
  const byAlgo = {};
  injectionEvents.forEach(e => {
    const algo = e.algorithm || 'UNKNOWN';
    if (!byAlgo[algo]) byAlgo[algo] = { total: 0, detected: 0, notDetected: 0 };
    byAlgo[algo].total++;
    if (e.errorDetected) byAlgo[algo].detected++;
    else                  byAlgo[algo].notDetected++;
  });

  const result = [];

  // Output in canonical order first, then any extras
  [...KNOWN_ALGORITHMS, ...Object.keys(byAlgo).filter(k => !KNOWN_ALGORITHMS.includes(k))].forEach(algo => {
    if (!byAlgo[algo]) return;
    const { total, detected, notDetected } = byAlgo[algo];
    result.push({
      algorithm:        algo,
      total,
      detected,
      notDetected,
      detectionRate:    total > 0 ? parseFloat(((detected / total) * 100).toFixed(1)) : null
    });
  });

  return result;
};

/**
 * Determines the dominant pattern classification based on error-type distribution.
 *
 * Rules (applied in priority order):
 *   1. INSUFFICIENT DATA — fewer than MIN_INJECTION_EVENTS events.
 *   2. BURST DOMINANT    — BURST events account for > 50 % of injections.
 *   3. MULTI-BIT DOMINANT— MULTI_BIT events account for > 50 % of injections.
 *   4. RANDOM DOMINANT   — RANDOM events account for > 50 % of injections.
 *   5. SINGLE-BIT DOMINANT — SINGLE_BIT events account for > 50 % of injections.
 *   6. MIXED PATTERNS    — no single type exceeds 50 %.
 *
 * @param {object[]} injectionEvents
 * @param {object[]} errorTypeDist - Pre-computed distribution array
 */
const classifyDominantPattern = (injectionEvents, errorTypeDist) => {
  const N = injectionEvents.length;

  if (N < MIN_INJECTION_EVENTS) {
    return {
      classification: 'INSUFFICIENT DATA',
      confidence:     null,
      note:           `Only ${N} injection event(s) recorded. At least ${MIN_INJECTION_EVENTS} are required for pattern classification.`
    };
  }

  const topType = errorTypeDist.reduce((a, b) => (b.count > a.count ? b : a), { count: 0, errorType: 'NONE' });

  const DOMINANT_THRESHOLD = 50;

  if (topType.pct >= DOMINANT_THRESHOLD) {
    const labels = {
      BURST:      'BURST DOMINANT',
      MULTI_BIT:  'MULTI-BIT DOMINANT',
      RANDOM:     'RANDOM DOMINANT',
      SINGLE_BIT: 'SINGLE-BIT DOMINANT'
    };
    return {
      classification: labels[topType.errorType] || `${topType.errorType} DOMINANT`,
      dominantType:   topType.errorType,
      confidence:     topType.pct,
      note: `${topType.errorType} errors account for ${topType.pct}% of all ${N} recorded injection events.`
    };
  }

  return {
    classification: 'MIXED PATTERNS',
    dominantType:   topType.errorType,
    confidence:     topType.pct,
    note: `No single error type dominates (highest: ${topType.errorType} at ${topType.pct}%). Error behaviour appears mixed across ${N} injection events.`
  };
};

// ─── Insight Generation ────────────────────────────────────────────────────────

/**
 * Generates a list of human-readable, evidence-based insights.
 * Each insight states what was observed and on how many records.
 *
 * @param {object} analysisData - The full computed analysis object
 * @returns {string[]}
 */
const generateInsights = ({
  injectionCount,
  transmissionCount,
  errorTypeDistribution,
  bitChangeStats,
  burstStats,
  algorithmBreakdown,
  detectedCount,
  notDetectedCount,
  dominantPattern
}) => {
  const insights = [];
  const total = injectionCount;
  if (total === 0) return insights;

  // 1. Most frequent error type
  const topType = errorTypeDistribution.find(d => d.count > 0);
  if (topType) {
    insights.push(
      `${topType.errorType.replace('_', '-')} errors are the most frequently recorded injection type, ` +
      `accounting for ${topType.pct}% (${topType.count} of ${total} injection events).`
    );
  }

  // 2. Overall detection rate
  const totalConclusive = detectedCount + notDetectedCount;
  if (totalConclusive > 0) {
    const detRate = parseFloat(((detectedCount / totalConclusive) * 100).toFixed(1));
    insights.push(
      `CRC detected errors in ${detectedCount} of ${totalConclusive} injection events (${detRate}% detection rate). ` +
      (notDetectedCount > 0
        ? `${notDetectedCount} injection event(s) did not trigger a CRC mismatch.`
        : 'All recorded injection events were detected by CRC.')
    );
  }

  // 3. Bit-change pattern
  if (bitChangeStats.available) {
    insights.push(
      `Across ${bitChangeStats.count} injection events with bit-change records, ` +
      `the median number of altered bits is ${bitChangeStats.median} and ` +
      `the most common count is ${bitChangeStats.mode} bit(s). ` +
      `Range: ${bitChangeStats.min}–${bitChangeStats.max} bits.`
    );
  }

  // 4. Burst characterisation
  if (burstStats.available && burstStats.burstCount > 0) {
    insights.push(
      `${burstStats.burstCount} burst-error event(s) recorded. ` +
      `Burst lengths range from ${burstStats.min} to ${burstStats.max} bits ` +
      `(median ${burstStats.median}, mode ${burstStats.mode}).`
    );
  } else if (burstStats.burstCount > 0 && !burstStats.available) {
    insights.push(
      `${burstStats.burstCount} burst-error event(s) recorded, but burst-length data is not available for these events.`
    );
  }

  // 5. Per-algorithm detection rate differences (if more than one algorithm present)
  const algosWithData = algorithmBreakdown.filter(a => a.total > 0);
  if (algosWithData.length >= 2) {
    const sorted = [...algosWithData].sort((a, b) => (b.detectionRate ?? 0) - (a.detectionRate ?? 0));
    const best  = sorted[0];
    const worst = sorted[sorted.length - 1];
    if (best.detectionRate !== worst.detectionRate) {
      insights.push(
        `Based on recorded events, ${best.algorithm} has the highest observed detection rate ` +
        `(${best.detectionRate}% over ${best.total} event(s)), ` +
        `while ${worst.algorithm} has the lowest (${worst.detectionRate}% over ${worst.total} event(s)). ` +
        `Note: these recordings are not from a controlled experiment; results may reflect workload differences.`
      );
    }
  }

  // 6. Transmission vs injection ratio
  if (transmissionCount > 0 && total > 0) {
    const injRatio = parseFloat(((total / (total + transmissionCount)) * 100).toFixed(1));
    insights.push(
      `Injection events represent ${injRatio}% of all ${total + transmissionCount} telemetry records ` +
      `(${total} injections, ${transmissionCount} transmissions).`
    );
  }

  // 7. Dominant pattern note
  if (dominantPattern.classification !== 'INSUFFICIENT DATA') {
    insights.push(dominantPattern.note);
  }

  return insights;
};

// ─── Main Analysis Function ────────────────────────────────────────────────────

/**
 * Performs comprehensive error pattern analysis on the provided telemetry events.
 *
 * This is the primary entry point used by errorPatternAnalysis.service.js.
 * The function is pure: it does not modify external state.
 *
 * @param {object[]} allEvents - All telemetry events from telemetry.service.js
 * @returns {object} Structured error pattern analysis result
 */
export const analyzeErrorPatterns = (allEvents) => {
  const timestamp = new Date().toISOString();

  const injectionEvents    = allEvents.filter(e => e.eventType === 'ERROR_INJECTION');
  const transmissionEvents = allEvents.filter(e => e.eventType === 'TRANSMISSION');

  const injectionCount    = injectionEvents.length;
  const transmissionCount = transmissionEvents.length;
  const totalEvents       = allEvents.length;

  // ── Insufficient Data Check ──────────────────────────────────────────────
  if (injectionCount < MIN_INJECTION_EVENTS) {
    return {
      status:           'INSUFFICIENT DATA',
      injectionCount,
      transmissionCount,
      totalEvents,
      message:          `Only ${injectionCount} error injection event(s) available. ` +
                        `At least ${MIN_INJECTION_EVENTS} are required for meaningful pattern analysis. ` +
                        `Use the Error Injection Simulator (Module 3) to record more events.`,
      analysisMethod:   'Statistical Frequency Analysis (JavaScript-native)',
      timestamp,
      limitations: [
        'Analysis requires at least MIN_INJECTION_EVENTS injection events.',
        'Analysis covers only the current server session; telemetry resets on restart.',
        'No ML model is trained; all patterns are computed from descriptive statistics.',
        'No causal claims are made; observed patterns describe recorded data only.'
      ]
    };
  }

  // ── Core Computations ────────────────────────────────────────────────────
  const errorTypeDistribution = computeErrorTypeDistribution(injectionEvents);
  const bitChangeStats        = computeBitChangeStats(injectionEvents);
  const burstStats            = computeBurstStats(injectionEvents);
  const algorithmBreakdown    = computeAlgorithmBreakdown(injectionEvents);
  const timeTrend             = buildTimeTrend(allEvents);

  const detectedCount    = injectionEvents.filter(e => e.errorDetected === true).length;
  const notDetectedCount = injectionEvents.filter(e => e.errorDetected === false).length;
  const overallDetectionRate = injectionCount > 0
    ? parseFloat(((detectedCount / injectionCount) * 100).toFixed(1))
    : null;

  const dominantPattern = classifyDominantPattern(injectionEvents, errorTypeDistribution);

  const insights = generateInsights({
    injectionCount,
    transmissionCount,
    errorTypeDistribution,
    bitChangeStats,
    burstStats,
    algorithmBreakdown,
    detectedCount,
    notDetectedCount,
    dominantPattern
  });

  return {
    status:               'COMPLETE',
    injectionCount,
    transmissionCount,
    totalEvents,
    detectedCount,
    notDetectedCount,
    overallDetectionRate,
    errorTypeDistribution,
    bitChangeStats,
    burstStats,
    algorithmBreakdown,
    timeTrend,
    dominantPattern,
    insights,
    patternCount:         errorTypeDistribution.filter(d => d.count > 0).length,
    analysisMethod:       'Statistical Frequency Analysis (JavaScript-native; Python not available)',
    timestamp,
    limitations: [
      'Analysis covers only the current server session; telemetry resets on restart.',
      'No ML model is trained; all patterns are computed from descriptive statistics.',
      'No causal claims are made; observed patterns describe recorded data only.',
      'Per-algorithm detection rates reflect observed workloads, not controlled experiments.'
    ]
  };
};
