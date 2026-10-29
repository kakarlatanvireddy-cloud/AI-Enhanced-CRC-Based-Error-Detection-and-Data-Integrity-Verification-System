import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { CrcGeneratorPage } from './pages/CrcGeneratorPage';
import { TransmissionSimPage } from './pages/TransmissionSimPage';
import { ErrorInjectorPage } from './pages/ErrorInjectorPage';
import { AlgorithmComparisonPage } from './pages/AlgorithmComparisonPage';
import { AiAnomalyDetectionPage } from './pages/AiAnomalyDetectionPage';
import { AiErrorAnalysisPage } from './pages/AiErrorAnalysisPage';
import { RealTimeMonitoringPage } from './pages/RealTimeMonitoringPage';
import { AnalyticsAlertsPage } from './pages/AnalyticsAlertsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="crc-generator" element={<CrcGeneratorPage />} />
          <Route path="transmission-sim" element={<TransmissionSimPage />} />
          <Route path="error-injector" element={<ErrorInjectorPage />} />
          <Route path="algorithm-comparison" element={<AlgorithmComparisonPage />} />
          <Route path="ai-anomaly-detection" element={<AiAnomalyDetectionPage />} />
          <Route path="ai-error-analysis" element={<AiErrorAnalysisPage />} />
          <Route path="realtime-monitoring" element={<RealTimeMonitoringPage />} />
          <Route path="analytics-alerts" element={<AnalyticsAlertsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
