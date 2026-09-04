# 🛡️ P1.5 — Nullify Integration: Privacy-by-Design & Data Minimisation Layer
## Master Orchestration & Architecture (Resolves Issue #18)

---

## 1. System Role & Architecture
The Privacy-by-Design & Data Minimisation Layer acts as a secure boundary between incoming station stakeholder/telemetry data and the downstream scientific MRV engine:

```text
[ Incoming Data Packet ]
           │
           ▼
[ 1. PII Classification Engine ] ─── Identifies Operator PII vs Scientific Sensor Telemetry
           │
           ▼
[ 2. Redaction & Pseudonymization ] ─ Salting, SHA-256 Hashing, Zero-Leak Minimisation
           │
           ├─── (Optional Privacy Removal Flow) ──> [ Human Approval Gate ] ──> [ Nullify Adapter ]
           ▼
[ 3. Zero-PII Audit Ledger ] ─────── Tamper-proof cryptographic provenance logging
           │
           ▼
[ 4. Clean MRV Dataset ] ────────── 100% Decoupled, Scientific KPIs Calculated Unconditionally
```

---

## 2. Key Non-Negotiable Guarantees
1. **Zero Environmental Telemetry Dependency**: No scientific KPI (water quality, carbon, sensor metrics) ever relies on Nullify.
2. **Resilient Fallback**: If Nullify is disabled, offline, or returns 5xx errors, the MRV engine operates seamlessly with zero data disruption.
3. **Mandatory Human-in-the-Loop**: External removal requests require explicit operator sign-off.
4. **Strict Data Minimisation**: Only salted hashes leave the station boundary; raw PII is never stored in audit trails or exported externally.
