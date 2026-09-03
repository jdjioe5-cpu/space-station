# 🌿 Environmental MRV Core, Provenance & Evidence Packages Specification (space-station)

Technical specification for environmental observation schemas, cryptographic provenance chain hashing, and MRV evidence packaging in **MyZubster Space Station** (resolves Issue #42).

---

## 📌 Architecture
- **Schemas**:
  - `schemas/environmental-observation.schema.json`: Formal JSON Schema for raw & normalized telemetry.
  - `schemas/mrv-evidence-package.schema.json`: Schema for cryptographically bound audit packages.
- **Cryptographic Provenance Chaining**:
  - Each evidence bundle calculates a SHA-256 payload digest.
  - Bundles are chained deterministically (`blockHash = SHA-256(provenanceHash + prevHash)`).
- **Validation State Machine**: `COLLECTED` -> `HASH_VERIFIED` -> `ACCREDITED` / `REJECTED`.
