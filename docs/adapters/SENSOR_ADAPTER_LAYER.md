# 🛰️ Sensor & Environmental Data Adapter Layer (space-station)

Technical specification and implementation guide for the multi-source environmental ingestion layer in **MyZubster Space Station / LIFE Ecosystem** (resolves Issue #44).

---

## 📌 Features
- **Unified Adapter Interface (`adapters/base_adapter.js`)**: Enforces consistent lifecycle, quality validation, and provenance hashing.
- **3 Concrete Demo Adapters**:
  1. `ApiAdapter`: Ingests REST API payloads with unit metadata.
  2. `CsvAdapter`: Batch ingestion for time-series tabular sensor logs.
  3. `IotAdapter`: Ultra-compact JSON/IoT telemetry packets (`ESP32`, Arduino, LoRaWAN).
- **Unit Normalization & Boundary Protection**:
  - Auto-converts Fahrenheit / Kelvin to standard Celsius (`-60°C` to `+80°C`).
  - Auto-bounds relative humidity (`0%` - `100%`).
  - Normalizes CO2 from ppb/ppm with outlier thresholds.
- **Provenance & Integrity**: SHA-256 cryptographic origin hash generated for every incoming sample.
