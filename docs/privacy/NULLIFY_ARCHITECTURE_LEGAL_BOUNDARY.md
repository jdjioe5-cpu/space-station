# 🛡️ Nullify Architecture, API, Security & Legal Boundary Specification
## Resolves Issue #19 (P1.5a — MyZubster Space Station / LIFE MRV)

---

## 1. Executive Summary & Objective
Before integrating **Nullify** into MyZubster Space Station or LIFE environmental workflows, this document formalizes the architectural provenance, API contract expectations, GDPR/EU legal boundaries, threat model, and a deterministic **Go/No-Go decision framework**.

Until explicit Go-conditions are satisfied, **all Nullify operations remain restricted to hermetic sandbox/mock implementations with strictly synthetic/anonymized data**.

---

## 2. Technical Profile & API Contract Matrix
| Dimension | Specification & Status |
|---|---|
| **Maintainer & Provenance** | Proprietary/External Service Provider (`nullify-platform`). |
| **API Contract Status** | `UNKNOWN_OR_DRAFT` (Strict isolation layer implemented in `privacy/nullify_adapter.js`). |
| **Authentication** | Bearer Token / HMAC signed requests over TLS 1.3. |
| **Payload Ingestion** | Cryptographic hash identifiers (`targetHash`) only; Zero raw PII. |
| **Data Transit & Hosting** | Must be EU-hosted (GDPR Article 44-49 compliance). |
| **Retention Policy** | Ephemeral processing; retention strictly capped to request confirmation audit window. |
| **Subprocessors** | Unknown; mandatory subprocessor notification required before Go-Live. |

---

## 3. GDPR & Governance Boundary
- **Role Allocation**: MyZubster acts as **Data Controller**; Nullify acts as **Data Processor** under standard EU Data Processing Agreements (DPA).
- **GDPR Article 17 (Right to Erasure)**: Nullify serves solely as a removal dispatcher. Station state must independently record removal certificates.
- **Never-Export Boundary**: Raw email, private keys, station biometric coordinates, and real-world geolocation MUST NEVER leave MyZubster core boundaries.
- **DPIA (Data Protection Impact Assessment)**: Required if real sensor telemetry correlates with identified individuals.

---

## 4. Threat Model (STRIDE Assessment)
- **Spoofing**: Mitigation via signed JWT credentials and operator role-based access control.
- **Tampering**: Mitigation via SHA-256 digital signature chains on all privacy audit entries.
- **Repudiation**: Mitigation via immutable audit trail logged before provider dispatch.
- **Information Disclosure**: Complete elimination of PII; only anonymized hashes are dispatched.
- **Denial of Service**: Provider downtime is non-blocking; MRV scientific telemetry never halts.
- **Elevation of Privilege**: Human approval gate prevents automated unauthorized data purges.

---

## 5. Go / No-Go Decision Matrix
| Criterion | Required Condition | Current Status | Gate Verdict |
|---|---|---|---|
| **Architecture Isolation** | Complete decoupling via `PrivacyRemovalProvider` | **Satisfied** (PR #79) | ✅ PASS |
| **Zero Raw PII Protocol** | Strictly hash-only payloads dispatched | **Satisfied** (PR #79) | ✅ PASS |
| **Signed DPA & Subprocessor Audit** | DPA executed with EU hosting guarantee | **Pending Review** | ⏳ PENDING |
| **Deterministic Error Fallback** | Non-blocking offline mode on provider outage | **Satisfied** (PR #79) | ✅ PASS |
| **Overall Integration Mode** | **SANDBOX_ONLY (MOCK & SYNTHETIC)** | Active Mode | 🔒 **NO_GO_SANDBOX_ONLY** |
