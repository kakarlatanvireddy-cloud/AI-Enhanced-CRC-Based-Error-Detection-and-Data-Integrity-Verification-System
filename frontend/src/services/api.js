/**
 * API Service for interacting with Node.js Express Backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Health check endpoint
 */
export const fetchHealthCheck = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to connect to backend server'
    };
  }
};

/**
 * Generate CRC for string data
 */
export const generateCrcApi = async (data, algorithm = 'CRC-32') => {
  try {
    const response = await fetch(`${API_BASE_URL}/crc/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, algorithm })
    });
    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.error || `HTTP error! status: ${response.status}`);
    }
    return { success: true, data: resData };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to generate CRC'
    };
  }
};

/**
 * Verify CRC for string data against expected CRC
 */
export const verifyCrcApi = async (data, algorithm = 'CRC-32', expectedCrc = '') => {
  try {
    const response = await fetch(`${API_BASE_URL}/crc/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, algorithm, expectedCrc })
    });
    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.error || `HTTP error! status: ${response.status}`);
    }
    return { success: true, data: resData };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to verify CRC'
    };
  }
};

/**
 * Fetch supported algorithms metadata
 */
export const fetchCrcAlgorithmsApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/crc/algorithms`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return { success: true, data: data.algorithms };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch algorithms'
    };
  }
};

/**
 * Simulate end-to-end transmission (Module 2)
 */
export const sendTransmissionApi = async (data, algorithm = 'CRC-32') => {
  try {
    const response = await fetch(`${API_BASE_URL}/transmission/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, algorithm })
    });
    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.error || `HTTP error! status: ${response.status}`);
    }
    return { success: true, data: resData };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to simulate transmission'
    };
  }
};

/**
 * Fetch live in-memory transmission telemetry stats
 */
export const fetchTransmissionStatsApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/transmission/stats`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return { success: true, stats: data.stats };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch transmission stats'
    };
  }
};

/**
 * Simulate bit-level error injection (Module 3)
 */
export const simulateErrorInjectionApi = async (payload) => {
  try {
    const response = await fetch(`${API_BASE_URL}/error-injection/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.error || `HTTP error! status: ${response.status}`);
    }
    return { success: true, data: resData };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to simulate error injection'
    };
  }
};

/**
 * Fetch error injection telemetry stats
 */
export const fetchErrorInjectionStatsApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/error-injection/stats`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return { success: true, stats: data.stats };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch error injection stats'
    };
  }
};

/**
 * Compare CRC-8, CRC-16, and CRC-32 algorithms (Module 4)
 * POST /api/crc/compare
 */
export const compareCrcAlgorithmsApi = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/crc/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.error || `HTTP error! status: ${response.status}`);
    }
    return { success: true, data: resData };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to compare CRC algorithms'
    };
  }
};

/**
 * Fetch algorithm comparison telemetry stats (Module 4)
 * GET /api/crc/compare/stats
 */
export const fetchComparisonStatsApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/crc/compare/stats`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return { success: true, stats: data.stats };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch comparison stats'
    };
  }
};

/**
 * Run AI anomaly detection on current telemetry (Module 5)
 * POST /api/anomaly-detection/analyze
 */
export const analyzeAnomalyApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/anomaly-detection/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.error || `HTTP error! status: ${response.status}`);
    }
    return { success: true, data: resData };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to run anomaly analysis'
    };
  }
};

/**
 * Fetch anomaly detection analysis history (Module 5)
 * GET /api/anomaly-detection/history
 */
export const fetchAnomalyHistoryApi = async (limit = 20) => {
  try {
    const response = await fetch(`${API_BASE_URL}/anomaly-detection/history?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return { success: true, history: data.history, count: data.count };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch anomaly history'
    };
  }
};

/**
 * Fetch anomaly detection statistics (Module 5)
 * GET /api/anomaly-detection/stats
 */
export const fetchAnomalyStatsApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/anomaly-detection/stats`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return { success: true, stats: data.stats };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch anomaly stats'
    };
  }
};

/**
 * Run AI Error Pattern Analysis (Module 6)
 * GET /api/error-patterns/analyze
 */
export const analyzeErrorPatternsApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/error-patterns/analyze`);
    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.error || `HTTP error! status: ${response.status}`);
    }
    return { success: true, data: resData.analysis };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to run error pattern analysis'
    };
  }
};

/**
 * Fetch AI Error Pattern Analysis History (Module 6)
 * GET /api/error-patterns/history?limit={limit}
 */
export const fetchPatternHistoryApi = async (limit = 20) => {
  try {
    const response = await fetch(`${API_BASE_URL}/error-patterns/history?limit=${limit}`);
    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.error || `HTTP error! status: ${response.status}`);
    }
    return { success: true, history: resData.history, count: resData.count };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch pattern history'
    };
  }
};

/**
 * Fetch AI Error Pattern Analysis Aggregate Stats (Module 6)
 * GET /api/error-patterns/stats
 */
export const fetchPatternStatsApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/error-patterns/stats`);
    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.error || `HTTP error! status: ${response.status}`);
    }
    return { success: true, stats: resData.stats };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch pattern stats'
    };
  }
};

/**
 * Fetch Real-Time Monitoring Overview (Module 7)
 * GET /api/monitoring/overview
 */
export const fetchMonitoringOverviewApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/monitoring/overview`);
    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.error || `HTTP error! status: ${response.status}`);
    }
    return { success: true, data: resData.data };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch monitoring overview'
    };
  }
};

/**
 * Fetch Real-Time Monitoring Activity Feed (Module 7)
 * GET /api/monitoring/activity?limit={limit}&eventType={eventType}&algorithm={algorithm}
 */
export const fetchMonitoringActivityApi = async ({ limit = 20, eventType = '', algorithm = '' } = {}) => {
  try {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (eventType) params.append('eventType', eventType);
    if (algorithm) params.append('algorithm', algorithm);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/monitoring/activity${qs}`);
    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.error || `HTTP error! status: ${response.status}`);
    }
    return {
      success: true,
      activities: resData.activities,
      count: resData.count,
      totalAvailable: resData.totalAvailable,
      filteredCount: resData.filteredCount
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch monitoring activity feed'
    };
  }
};

/**
 * Fetch Real-Time Monitoring Timeline (Module 7)
 * GET /api/monitoring/timeline?buckets={buckets}
 */
export const fetchMonitoringTimelineApi = async (buckets = 8) => {
  try {
    const response = await fetch(`${API_BASE_URL}/monitoring/timeline?buckets=${buckets}`);
    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.error || `HTTP error! status: ${response.status}`);
    }
    return {
      success: true,
      timeline: resData.timeline,
      bucketCount: resData.bucketCount
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch monitoring timeline'
    };
  }
};

/**
 * Fetch Real-Time Monitoring System Health (Module 7)
 * GET /api/monitoring/health
 */
export const fetchMonitoringHealthApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/monitoring/health`);
    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.error || `HTTP error! status: ${response.status}`);
    }
    return { success: true, health: resData.health };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch monitoring health status'
    };
  }
};

/**
 * Fetch Alerts with Multi-Dimensional Filtering (Module 8)
 * GET /api/alerts
 */
export const fetchAlertsApi = async ({
  severity = '',
  alertType = '',
  acknowledged = '',
  startDate = '',
  endDate = '',
  limit = 50
} = {}) => {
  try {
    const params = new URLSearchParams();
    if (severity) params.append('severity', severity);
    if (alertType) params.append('alertType', alertType);
    if (acknowledged !== '' && acknowledged !== null && acknowledged !== undefined) {
      params.append('acknowledged', acknowledged);
    }
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (limit) params.append('limit', limit);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/alerts${qs}`);
    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.error || `HTTP error! status: ${response.status}`);
    }
    return {
      success: true,
      alerts: resData.alerts,
      count: resData.count,
      totalAvailable: resData.totalAvailable,
      filteredCount: resData.filteredCount
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch alerts'
    };
  }
};

/**
 * Fetch Alert Aggregate Statistics (Module 8)
 * GET /api/alerts/stats
 */
export const fetchAlertStatsApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/alerts/stats`);
    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.error || `HTTP error! status: ${response.status}`);
    }
    return { success: true, stats: resData.stats };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch alert statistics'
    };
  }
};

/**
 * Fetch Single Alert Details (Module 8)
 * GET /api/alerts/:id
 */
export const fetchAlertByIdApi = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/alerts/${id}`);
    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.error || `HTTP error! status: ${response.status}`);
    }
    return { success: true, alert: resData.alert };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch alert details'
    };
  }
};

/**
 * Acknowledge an Alert (Module 8)
 * PATCH /api/alerts/:id/acknowledge
 */
export const acknowledgeAlertApi = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/alerts/${id}/acknowledge`, {
      method: 'PATCH'
    });
    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.error || `HTTP error! status: ${response.status}`);
    }
    return { success: true, alert: resData.alert, message: resData.message };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to acknowledge alert'
    };
  }
};

/**
 * Fetch Historical Overview Analytics (Module 8)
 * GET /api/historical-analytics/overview
 */
export const fetchHistoricalOverviewApi = async ({ startDate = '', endDate = '' } = {}) => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/historical-analytics/overview${qs}`);
    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.error || `HTTP error! status: ${response.status}`);
    }
    return { success: true, data: resData.data };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch historical overview'
    };
  }
};

/**
 * Fetch Historical Timeline Trends (Module 8)
 * GET /api/historical-analytics/timeline
 */
export const fetchHistoricalTimelineApi = async ({ startDate = '', endDate = '', buckets = 8 } = {}) => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (buckets) params.append('buckets', buckets);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/historical-analytics/timeline${qs}`);
    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.error || `HTTP error! status: ${response.status}`);
    }
    return {
      success: true,
      timeline: resData.timeline,
      bucketCount: resData.bucketCount
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch historical timeline'
    };
  }
};

/**
 * Fetch Historical Error Distribution (Module 8)
 * GET /api/historical-analytics/errors
 */
export const fetchHistoricalErrorsApi = async ({ startDate = '', endDate = '' } = {}) => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/historical-analytics/errors${qs}`);
    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.error || `HTTP error! status: ${response.status}`);
    }
    return { success: true, data: resData.data };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch historical error distribution'
    };
  }
};

/**
 * Fetch Historical CRC Algorithm Outcomes (Module 8)
 * GET /api/historical-analytics/algorithms
 */
export const fetchHistoricalAlgorithmsApi = async ({ startDate = '', endDate = '' } = {}) => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/historical-analytics/algorithms${qs}`);
    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.error || `HTTP error! status: ${response.status}`);
    }
    return { success: true, algorithms: resData.algorithms };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch historical algorithm outcomes'
    };
  }
};

/**
 * Export Historical Analytics as CSV (Module 8)
 * GET /api/historical-analytics/export
 */
export const exportHistoricalDataApi = async ({ type = 'alerts', startDate = '', endDate = '' } = {}) => {
  try {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/historical-analytics/export${qs}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const csvBlob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(csvBlob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `crc-integrity-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to export historical CSV report'
    };
  }
};



