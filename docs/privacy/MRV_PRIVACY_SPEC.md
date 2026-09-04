# 🔒 Privacy Classification, Redaction & MRV-Safe Export Specification (space-station)

Technical specification for field classification, PII pseudonymization, and tamper-proof MRV-safe export workflows in **MyZubster Space Station** (resolves Issue #21).

---

## 📌 Architecture
- **4-Tier Data Classification Matrix**:
  - `ENVIRONMENTAL`: Public water & atmospheric telemetry (pH, dissolved oxygen, flow rate) — **100% exact & unaltered**.
  - `OPERATIONAL`: Hardware status and telemetry diagnostics.
  - `PERSONAL`: Operator identities — **irreversibly pseudonymised**.
  - `SENSITIVE`: Wallets, private IPs, credentials — **strictly purged**.
- **Audit Provenance Hash**: Every MRV export bundle is cryptographically verified with a chained SHA-256 signature.
- **Leakage Prevention**: Built-in boundary controls prevent raw PII from reaching downstream partner reports or replication kits.
