# 📥 Sensor & Partner API Ingestion Pipeline Specification (P0.2 — Issue #11)

## 1. Executive Summary
The Ingestion Pipeline acts as the secure, validated gateway for all real and synthetic environmental telemetry in MyZubster Space Station. It ingests multi-source data from IoT gateways, municipal utilities, and certified chemical laboratories, normalizing all telemetry to the canonical LIFE schema while enforcing strict deduplication and Dead-Letter Queue (DLQ) fault tolerance.

## 2. Pipeline Capabilities
- **REST/JSON Ingestion (`POST /observations`)**: Real-time synchronous telemetry ingestion.
- **CSV Batch Import (`POST /observations/batch`)**: Bulk import supporting CSV streams and JSON arrays.
- **Idempotency & Deduplication**: Cryptographic hash fingerprints prevent double-counting or skewed metrics.
- **Dead-Letter Queue (DLQ)**: Malformed or unparsable payloads are isolated with human-readable error reasons without halting the pipeline.
- **Partner Adapters**: Specialized converters for IoT edge sensors, utility billing meters, and laboratory reports.
- **Source Health Monitoring (`GET /sources/{source_id}/status`)**: Real-time observability over data stream health.
