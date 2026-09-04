# 🎛️ LIFE Water Pilot Dashboard Specification (P0.6 — Issue #15)

## 1. Executive Summary
The **LIFE Water Pilot Dashboard** provides interactive visual analytics and empirical evidence drill-downs for pilot operators, scientific review bodies, and LIFE project auditors.

## 2. Mandatory Architectural Guardrails
- **Zero Hardcoded Values**: All metrics, graphs, and warnings are dynamically evaluated from live MRV payloads or Sprint 1 API datasets.
- **Explicit Telemetry State**: The operational mode (`SYNTHETIC`, `PILOT`, or `VALIDATED`) is permanently pinned in the top navigation bar to ensure full disclosure.
- **Evidence Drill-Down**: Every KPI card exposes clickable cryptographic SHA-256 evidence package hashes for granular sensor-level audits.
- **Responsive Layout**: Designed for seamless viewing across Desktop (1920x1080) and Tablet (768px+) viewports.
