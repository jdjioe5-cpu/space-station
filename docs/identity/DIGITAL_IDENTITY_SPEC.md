# 🆔 Identity Core — Persistent Digital Identity Profile Specification (space-station)

Technical specification for persistent digital identities, decoupled visual references, field-level privacy matrices, and SHA-256 provenance chains in **MyZubster Space Station** (resolves Issue #23).

---

## 📌 Architecture
- **Immutable Canonical Identity Identifier (`myz:id:<hash>`)**: The primary key of the digital citizen that persists across visual modifications and avatar migrations.
- **Decoupled Visual Profile**: Visual styles and avatar configs are stored as decoupled reference pointers, preventing avatar changes from altering the core identity.
- **Field-Level Privacy Enforcement**: Granular privacy controls (`PUBLIC`, `AUTHORIZED_ONLY`, `PRIVATE_STATION_ONLY`). Sensitive fields (wallets, telemetry) fail closed to private.
- **Cryptographic Provenance Chaining**: Genesis and subsequent modifications form a chained SHA-256 merkle-like audit trail.
- **Human & Simulated Entity Support**: Native modeling for both human pioneers and synthetic/alien simulation agents.
