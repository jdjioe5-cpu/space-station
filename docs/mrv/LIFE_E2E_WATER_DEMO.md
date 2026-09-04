# 🌊 LIFE MVP E2E Pipeline & Synthetic Water Demo (P0.8 — Issue #17)

## 1. Overview
This module demonstrates the complete end-to-end LIFE MVP scientific telemetry flow:
```text
Synthetic Dataset → Ingestion & Unit Normalisation → QA/QC Anomaly Isolation → 
SHA-256 Provenance Ledger → MRV Engine → Baseline vs Intervention → KPI Calculator → 
Single Source-of-Truth Dashboard & Official LIFE Export
```

## 2. Zero Confused Data Guarantee
Every observation and output payload contains the mandatory explicit attribute:
`"isSynthetic": true`
This prevents any synthetic simulation dataset from ever polluting real-world partner telemetry.

## 3. How to Run E2E Verification
```bash
node tests/test_life_e2e_water_demo.js
```
