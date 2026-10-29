import { Router } from 'express';
import healthRoutes from './health.routes.js';
import crcRoutes from './crc.routes.js';
import transmissionRoutes from './transmission.routes.js';
import errorInjectionRoutes from './errorInjection.routes.js';
import algorithmComparisonRoutes from './algorithmComparison.routes.js';
import anomalyDetectionRoutes from './anomalyDetection.routes.js';
import errorPatternAnalysisRoutes from './errorPatternAnalysis.routes.js';
import monitoringRoutes from './monitoring.routes.js';
import alertRoutes from './alert.routes.js';
import historicalAnalyticsRoutes from './historicalAnalytics.routes.js';

const apiRouter = Router();

// Mount health routes (/api/health)
apiRouter.use('/', healthRoutes);

// Mount CRC engine routes (/api/crc/generate, /api/crc/verify, /api/crc/algorithms)
apiRouter.use('/crc', crcRoutes);

// Mount Transmission Simulator routes (/api/transmission/send, /api/transmission/stats)
apiRouter.use('/transmission', transmissionRoutes);

// Mount Error Injection Simulator routes (/api/error-injection/simulate, /api/error-injection/stats)
apiRouter.use('/error-injection', errorInjectionRoutes);

// Mount Algorithm Comparison routes (/api/crc/compare, /api/crc/compare/stats)
apiRouter.use('/crc', algorithmComparisonRoutes);

// Mount AI Anomaly Detection routes (/api/anomaly-detection/analyze, /history, /stats)
apiRouter.use('/anomaly-detection', anomalyDetectionRoutes);

// Mount AI Error Pattern Analysis routes (/api/error-patterns/analyze, /history, /stats)
apiRouter.use('/error-patterns', errorPatternAnalysisRoutes);

// Mount Real-Time Monitoring Dashboard routes (/api/monitoring/overview, /activity, /timeline, /health)
apiRouter.use('/monitoring', monitoringRoutes);

// Mount Alerts & Incident Management routes (/api/alerts, /stats, /:id/acknowledge)
apiRouter.use('/alerts', alertRoutes);

// Mount Historical Analytics routes (/api/historical-analytics/overview, /timeline, /errors, /algorithms, /export)
apiRouter.use('/historical-analytics', historicalAnalyticsRoutes);

export default apiRouter;

