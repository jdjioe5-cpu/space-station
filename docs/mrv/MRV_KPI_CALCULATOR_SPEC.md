# 📊 LIFE MRV Engine & Environmental KPI Calculator Specification (P0.4 — Issue #13)

## 1. Executive Summary
This document specifies the deterministic, versioned, and machine-readable calculation engine for core environmental KPIs within the LIFE pilot of MyZubster Space Station.

## 2. Core MVP Water KPIs & Formulas (`v1.0-life-water`)

All mathematical formulas are versioned and zero KPIs are hardcoded:

1. **Water Consumed ($V_{consumed}$)**:
   $$V_{consumed} = \sum_{i=1}^{n} (Q_{in, i} \times \Delta t_i)$$
   Total direct consumption across the evaluation period (in Liters or $m^3$).

2. **Water Reused ($V_{reused}$)**:
   $$V_{reused} = \sum_{j=1}^{m} V_{greywater, j}$$
   Total volume recovered and recycled through on-site treatment systems.

3. **Water Saved ($V_{saved}$)**:
   $$V_{saved} = V_{reused} + \max(0, V_{baseline} - V_{consumed})$$
   Aggregates both direct efficiency reduction against baseline and circular reuse substitution.

4. **Reuse Rate ($R_{reuse}$)**:
   $$R_{reuse} = \left( \frac{V_{reused}}{V_{consumed} + V_{reused}} \right) \times 100\%$$

5. **Reduction vs Baseline ($R_{baseline}$)**:
   $$R_{baseline} = \left( \frac{V_{baseline} - V_{consumed}}{V_{baseline}} \right) \times 100\%$$

6. **Data Completeness ($C_{data}$)**:
   $$C_{data} = \left( \frac{N_{valid\_intervals}}{N_{expected\_intervals}} \right) \times 100\%$$

7. **Data Quality & Confidence Indicator ($Q_{confidence}$)**:
   $$Q_{confidence} = \frac{1}{n} \sum_{i=1}^{n} S_{quality, i}$$
   Decoupled from physical impact; reflects sensor telemetry validity, calibration state, and physical range checks.

## 3. API Contract
- `POST /indicators/calculate`: Executes deterministic KPI pipeline from validated observations.
- `GET /indicators`: Lists all generated indicator runs.
- `GET /indicators/{id}/evidence`: Returns calculation trace, formula references, and input provenance hashes.
- `GET /indicators/{id}/export?format=json|csv`: Generates auditor-grade JSON or CSV representations.
