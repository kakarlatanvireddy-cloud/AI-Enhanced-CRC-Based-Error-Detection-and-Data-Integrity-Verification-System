# AI-Enhanced CRC-Based Error Detection and Data Integrity Verification System

A full-stack web application designed for simulating, analyzing, and verifying binary frame integrity using Cyclic Redundancy Check (CRC) algorithms and AI/ML anomaly detection models.

---

## 📌 Project Purpose

In high-speed digital communications and industrial networking (such as Ethernet, CAN bus, and satellite links), data transmission is vulnerable to bit corruption caused by noise, signal degradation, and electromagnetic interference. Standard Cyclic Redundancy Checks (CRC) are fast and effective at detecting random bit flips, but traditional systems lack predictive insight into error patterns and failure trends.

This project implements a **full-stack architecture** that combines:
1. **Mathematical CRC algorithms** (CRC-8, CRC-16, CRC-32) for hardware-level data integrity verification.
2. **Interactive digital transmission & error injection simulators** to test error bounds under real-world conditions.
3. **AI/ML predictive models** to analyze error distributions, classify noise sources, and detect anomalous transmission corruptions.

---

## 🛠 Technology Stack

### Frontend
- **Framework**: React 19 (via Vite 6)
- **Styling**: Tailwind CSS v4 + Custom Modern Dark Design System
- **Routing**: React Router v7
- **Visualization**: Recharts
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js (v24+)
- **Framework**: Express.js v4 (REST API Architecture)
- **Middleware**: CORS, Dotenv, Express JSON

### AI / ML Pipeline *(Future Phase)*
- **Language**: Python 3.10+
- **Planned Libraries**: Scikit-Learn, PyTorch/TensorFlow, Pandas, NumPy
- **Role**: Anomaly detection & error pattern classification microservices

### Database *(Future Phase)*
- **Database**: MongoDB / Mongoose

---

## 🧩 Planned 8 System Modules

1. **CRC Generator & Verifier** (`/crc-generator`) — **[COMPLETED]**  
   Generates bit-level checksums for payload streams using polynomial division and verifies frame integrity at the receiver.
2. **Real-Time Transmission Simulator** (`/transmission-sim`) — **[COMPLETED]**  
   Simulates frame streaming over communication channels with unique Transmission IDs (`TXN-YYYYMMDD-XXXX`) and receiver CRC verification.
3. **Error Injection Simulator** (`/error-injector`) — **[COMPLETED]**  
   Injects single-bit flips, multi-bit noise, consecutive burst errors, and random bit mutations into payload streams to test CRC detection boundaries.
4. **CRC Algorithm Comparison** (`/algorithm-comparison`)  
   Benchmarks detection rates, computation latency, and undetected error probability across CRC-8, CRC-16, and CRC-32 polynomials.
5. **AI Anomaly Detection** (`/ai-anomaly-detection`)  
   ML-powered detection engine for identifying irregular frame structures or corruptions that bypass traditional checksums.
6. **AI Error-Pattern Analysis** (`/ai-error-analysis`)  
   Classifies environmental noise patterns (e.g. burst noise vs. hardware fault) and predicts Bit Error Rates (BER).
7. **Real-Time Monitoring Dashboard** (`/realtime-monitoring`)  
   Live telemetry visualizer showing packet throughput rates, pass/fail status, and line speed.
8. **Alerts & Historical Analytics** (`/analytics-alerts`)  
   Configurable error threshold triggers, audit log search, and report exports.

---

## 🚀 Current Development Stage

**Stage 8: All 8 System Modules Completed & Verified**

- ✅ **Frontend Structure**: Clean React + Vite application with responsive Sidebar, Header, dynamic backend status badge, and routing.
- ✅ **Dashboard**: System overview displaying live metrics for Total Transmissions, Successful Transmissions, CRC Errors, Error Rate, AI Status, and System Status.
- ✅ **Module 1 (CRC Engine)**: Fully functional CRC-8, CRC-16, and CRC-32 bitwise calculation engine with API endpoints (`/api/crc/generate`, `/api/crc/verify`). Verified against standard test vector `"123456789"` $\rightarrow$ `CBF43926`.
- ✅ **Module 2 (Transmission Simulator)**: Fully functional end-to-end packet streaming simulator (`/api/transmission/send`, `/api/transmission/stats`). Generates unique `TXN-YYYYMMDD-XXXX` IDs and verifies receiver checksum matching.
- ✅ **Module 3 (Error Injection Simulator)**: Fully functional bit-level error injection engine (`/api/error-injection/simulate`, `/api/error-injection/stats`). Supports Single-Bit, Multi-Bit, Burst, and Random error modes with bitwise highlight comparisons.
- ✅ **Module 4 (CRC Algorithm Comparison)**: Empirical benchmarking across CRC-8, CRC-16, and CRC-32 polynomials (`/api/crc/compare`, `/api/crc/compare/stats`).
- ✅ **Module 5 (AI Anomaly Detection)**: Statistical anomaly scoring engine evaluating burst lengths, corruption clusters, and error rate drift (`/api/anomaly-detection/analyze`, `/history`, `/stats`).
- ✅ **Module 6 (AI Error-Pattern Analysis)**: Deterministic pattern engine diagnosing dominant error signatures (burst vs single-bit vs mixed) and bit-corruption histograms (`/api/error-patterns/analyze`, `/history`, `/stats`).
- ✅ **Module 7 (Real-Time Monitoring Dashboard)**: Live centralized operational dashboard consolidating transmissions, error injections, AI anomaly diagnostics, and CRC resilience metrics with 5-second polling and interactive filtering (`/api/monitoring/overview`, `/activity`, `/timeline`, `/health`).
- ✅ **Module 8 (Alerts & Historical Analytics)**: Data integrity incident alert management with multi-level severity classification (`CRITICAL`, `HIGH`, `WARNING`, `INFO`), deduplication, inline acknowledgement, retrospective analytics dashboards, and CSV data export (`/api/alerts`, `/stats`, `/:id/acknowledge`, `/api/historical-analytics/overview`, `/timeline`, `/errors`, `/algorithms`, `/export`).
- ✅ **Health Check Endpoint**: Functional `GET /api/health` endpoint returning server status, uptime, and active module status for all 8 modules (`crcGenerator`, `transmissionSimulator`, `errorInjector`, `algorithmComparison`, `aiAnomalyDetection`, `aiErrorPatternAnalysis`, `monitoringDashboard`, `analytics`).

---

## 💻 How to Run the Project

### 1. Run the Backend API & Tests

```bash
# Navigate to the backend directory
cd backend

# Install dependencies (if not already installed)
npm install

# Run automated test suite (All 9 unit and integration suites)
npm test

# Start the development server
npm run dev
```
- **Backend URL**: `http://localhost:5000`
- **Health Check Endpoint**: `http://localhost:5000/api/health`

---

### 2. Run the Frontend Application

Open a **separate terminal** window:

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Start the Vite development server
npm run dev
```
- **Frontend URL**: `http://localhost:3000` (or `http://localhost:5173`)
- **API Proxy**: Frontend automatically proxies `/api/*` requests to `http://localhost:5000`.

---

## 📊 Module 7: Real-Time Monitoring Dashboard (`/realtime-monitoring`)

### Purpose & Objective
Consolidates live telemetry from Modules 1–6 into a unified operational monitor. Provides network operators and analysts with a bird's-eye view of transmission throughput, CRC integrity failures, error-injection boundaries, and AI anomaly classifications.

### Features
1. **Live Telemetry Stream Controls**: 5-second automatic background polling with live/pause toggle, manual force-refresh, and stale-data indicators.
2. **6 Key Telemetry Metric Cards**: Total Transmissions, CRC Matched (Successful), Error Injections, Injections Caught, Empirical Detection Rate (%), and AI Anomalies Detected.
3. **Transmission & Injection Activity Timeline**: Dynamic Recharts AreaChart partitioning recorded events into chronological time windows.
4. **Unified Chronological Activity Stream**: Filterable event feed merging raw telemetry with AI anomaly and pattern classifications.
   - Filter by Event Type (`TRANSMISSION`, `ERROR_INJECTION`, `ANOMALY_DETECTION`, `PATTERN_ANALYSIS`)
   - Filter by CRC Algorithm (`CRC-8`, `CRC-16`, `CRC-32`)
   - Adjustable row limit (10, 20, 50 rows)
5. **AI Subsystem Intelligence Widget**: Direct status cards for Module 5 (Anomaly Engine) and Module 6 (Pattern Classifier) with direct deep-links.
6. **Subsystem Operational Health**: Real-time operational status indicators for all active modules with server uptime.

### API Endpoints
- `GET /api/monitoring/overview`: Aggregated metric counts, health status, and AI summaries.
- `GET /api/monitoring/activity?limit=N&eventType=TYPE&algorithm=ALGO`: Filtered chronological feed.
- `GET /api/monitoring/timeline?buckets=8`: Equal-width time-bucketed event counts.
- `GET /api/monitoring/health`: System health and active module status.

---

## 🚨 Module 8: Alerts & Historical Analytics (`/analytics-alerts`)

### Purpose & Objective
Provides an incident response center for integrity violations and a retrospective historical analytics suite for long-term transmission and error analysis.

### Severity Rules & Classification
- `CRITICAL`: Undetected corruptions (payload mutated but CRC matched — true data integrity breach) or subsystem degradation.
- `HIGH`: AI Anomaly detected by Module 5 (`score >= threshold`) or `BURST DOMINANT` recurring noise pattern.
- `WARNING`: Receiver CRC mismatches in standard transmission streams or intercepted bit corruptions.
- `INFO`: Routine baseline events and analysis completion notifications.

### Key Features
1. **Incident Alert Center**: Filter alerts by severity (`CRITICAL`, `HIGH`, `WARNING`, `INFO`), type, acknowledgement status (`Unacknowledged`, `Acknowledged`), and date range.
2. **One-Click Acknowledgement**: Mark alerts as acknowledged with instant server-side timestamp recording (`acknowledgedAt`).
3. **Trace Metadata Inspector**: Full modal dialog displaying raw event metadata, source transaction IDs, and timestamps.
4. **Historical Analytics Visualizations**:
   - AreaChart: Packet throughput vs CRC failure volume over time.
   - BarChart: Empirical detection rate (%) comparison across CRC-8, CRC-16, and CRC-32.
   - PieChart: Injected error type distribution (Single-Bit, Multi-Bit, Burst, Random).
   - PieChart: Alert frequency breakdown by severity.
5. **Analytical Insights**: Deterministic findings calculated from recorded metrics.
6. **Audit Data Export (CSV)**: Export Incident Alerts, Raw Telemetry, or Summary metrics directly to CSV files for compliance auditing.

### API Endpoints
- `GET /api/alerts`: Filterable alert records (`?severity=&alertType=&acknowledged=&startDate=&endDate=&limit=`).
- `GET /api/alerts/stats`: Aggregate counts by severity, type, and acknowledgement status.
- `GET /api/alerts/:id`: Full details for a single alert.
- `PATCH /api/alerts/:id/acknowledge`: Acknowledge an alert.
- `GET /api/historical-analytics/overview`: Date-bounded historical metrics.
- `GET /api/historical-analytics/timeline?buckets=8`: Time-bucketed historical trend volume.
- `GET /api/historical-analytics/errors`: Historical error distribution and bit statistics.
- `GET /api/historical-analytics/algorithms`: CRC algorithm resilience stats.
- `GET /api/historical-analytics/export?type=alerts|telemetry|summary`: CSV audit report download.

---

## 📂 Project Directory Structure

```
AI-Enhanced CRC-Based Error Detection and Data Integrity Verification System/
├── README.md
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   ├── server.js
│   ├── controllers/
│   │   ├── alert.controller.js
│   │   ├── algorithmComparison.controller.js
│   │   ├── anomalyDetection.controller.js
│   │   ├── crc.controller.js
│   │   ├── errorInjection.controller.js
│   │   ├── errorPatternAnalysis.controller.js
│   │   ├── health.controller.js
│   │   ├── historicalAnalytics.controller.js
│   │   ├── monitoring.controller.js
│   │   └── transmission.controller.js
│   ├── routes/
│   │   ├── alert.routes.js
│   │   ├── algorithmComparison.routes.js
│   │   ├── anomalyDetection.routes.js
│   │   ├── crc.routes.js
│   │   ├── errorInjection.routes.js
│   │   ├── errorPatternAnalysis.routes.js
│   │   ├── health.routes.js
│   │   ├── historicalAnalytics.routes.js
│   │   ├── index.js
│   │   ├── monitoring.routes.js
│   │   └── transmission.routes.js
│   ├── services/
│   │   ├── alert.service.js
│   │   ├── algorithmComparison.service.js
│   │   ├── anomalyDetection.service.js
│   │   ├── crc.service.js
│   │   ├── errorInjection.service.js
│   │   ├── errorPatternAnalysis.service.js
│   │   ├── health.service.js
│   │   ├── historicalAnalytics.service.js
│   │   ├── monitoring.service.js
│   │   ├── telemetry.service.js
│   │   └── transmission.service.js
│   ├── tests/
│   │   ├── alert.test.js
│   │   ├── algorithmComparison.test.js
│   │   ├── anomalyDetection.test.js
│   │   ├── crc.test.js
│   │   ├── errorInjection.test.js
│   │   ├── errorPatternAnalysis.test.js
│   │   ├── health.test.js
│   │   ├── historicalAnalytics.test.js
│   │   ├── monitoring.test.js
│   │   └── transmission.test.js
│   └── utils/
│       └── logger.js
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── index.css
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Header.jsx
│       │   │   ├── Layout.jsx
│       │   │   └── Sidebar.jsx
│       │   └── ui/
│       │       └── ModulePlaceholderCard.jsx
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── CrcGeneratorPage.jsx
│       │   ├── TransmissionSimPage.jsx
│       │   ├── ErrorInjectorPage.jsx
│       │   ├── AlgorithmComparisonPage.jsx
│       │   ├── AiAnomalyDetectionPage.jsx
│       │   ├── AiErrorAnalysisPage.jsx
│       │   ├── RealTimeMonitoringPage.jsx
│       │   ├── AnalyticsAlertsPage.jsx
│       │   └── NotFoundPage.jsx
│       └── services/
│           └── api.js
└── ml-pipeline/
    ├── README.md
    ├── anomaly_detection.js
    └── error_pattern_analysis.js
```
