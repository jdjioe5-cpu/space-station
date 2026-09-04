# ⚖️ Baseline vs Intervention Comparison Engine Specification (P0.5 — Issue #14)

## 1. Objective
Quantitatively demonstrate the empirical environmental impact of LIFE pilot interventions by executing deterministic, versioned, and reproducible comparisons between pre-intervention baselines and active project phases.

## 2. Methodology & Guardrails
- **Comparable-Period Validation**: Verifies that baseline and intervention windows share compatible seasonalities, observation durations, or sampling frequencies. Issues explicit warnings if data points are skewed.
- **Delta Mathematics**:
  - `Absolute Delta`: $Delta_{abs} = V_{baseline} - V_{intervention}$
  - `Percentage Delta`: $Delta_{\%} = (Delta_{abs} / V_{baseline}) \times 100$
- **Normalized Efficiency Metrics**: Normalizes savings against surface area ($m^3/m^2$) or occupant days ($L/person\cdot day$).
- **API Endpoints**: REST-compliant handlers for `POST /baseline`, `POST /comparisons`, and `GET /comparisons/{id}`.
- **Cryptographic Provenance**: Every comparison records an immutable SHA-256 signature binding baseline and intervention input hashes.
