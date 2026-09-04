# 🌐 LIFE Canonical Environmental Data Model & Schema Specification (P0.1 — Issue #10)

## 1. Executive Summary
This document defines the canonical JSON data models for the LIFE project in MyZubster Space Station. It ensures structural interoperability between field telemetry, anomaly events, and synthesized MRV indicators across four key environmental domains: **Water**, **Energy**, **Waste**, and **Biodiversity**.

## 2. Canonical Schemas

### A. `schemas/sensor-observation.schema.json`
Defines discrete environmental telemetry observations:
- `observation_id`: Unique identifier (`OBS_<domain>_<hash>`).
- `pilot_id`: Identifier of the territorial deployment (e.g. `PILOT_LIFE_ES_001`).
- `source_id`: Physical or virtual sensor identifier (e.g. `SENSOR_FLOW_01`).
- `domain`: `WATER`, `ENERGY`, `WASTE`, `BIODIVERSITY`.
- `parameter`: Standardized parameter name (`water_flow_rate`, `ph`, `energy_consumption`, `organic_fraction`, `species_richness`).
- `value`: Numerical measurement.
- `unit`: Unambiguous SI / environmental unit string (`L/h`, `m3/h`, `kWh`, `kg`, `index`).
- `timestamp`: Strict ISO 8601 UTC timestamp (`YYYY-MM-DDTHH:mm:ss.sssZ`).
- `location`: Structured geolocation (`latitude`, `longitude`, `elevation_m`, `zone_id`).
- `quality_flag`: `VALID`, `OUTLIER`, `CALIBRATION_SUSPECT`, `MISSING_VALUE`, `LAB_VERIFIED`.
- `provenance_ref`: Immutable cryptographic lineage identifier.

### B. `schemas/environmental-event.schema.json`
Defines critical operational and threshold events:
- `event_id`: Unique identifier (`EVT_<type>_<hash>`).
- `event_type`: `THRESHOLD_EXCEEDED`, `LEAK_DETECTED`, `FILTER_MAINTENANCE`, `SENSOR_ANOMALY`.
- `severity`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- `related_observations`: Array of `observation_id`s triggering the event.

### C. `schemas/mrv-indicator.schema.json`
Defines synthesized environmental KPIs:
- `indicator_id`: Unique identifier (`IND_<kpi>_<hash>`).
- `kpi_type`: `CONSUMPTION_REDUCTION`, `REUSE_EFFICIENCY`, `NET_SAVINGS`.
- `formula_version`: Exact semantic version of calculation formula (`v1.0-life-water`).
- `calculation_trace`: Step-by-step intermediate variables and input references.

## 3. Raw to Canonical Transformation Pipeline
Raw payload formats (Modbus registers, proprietary IoT JSON, utility billing CSVs) are normalized by ingestion adapters into canonical `SensorObservation` objects before downstream MRV calculations.
