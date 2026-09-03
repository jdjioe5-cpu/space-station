# 🛡️ MYZ Bounty Security & Anti-Sybil Specification (space-station)

Technical specification for Sybil resistance, double-spend prevention, idempotency verification, risk anomaly scoring, and cryptographic reward ledgers in **MyZubster Space Station** (resolves Issue #30).

---

## 📌 Architecture
- **Tuple Lock**: Hard database guard on `(identityId, bountyId)` preventing repeated extraction.
- **Idempotent Dispatch**: Replay requests with identical `idempotencyKey` return cached receipts without double disbursement.
- **Non-Invasive Privacy Shield**: Evaluates behavioral burst velocity and telemetry integrity without intrusive legal KYC documents.
- **Auditable Ledger**: Every reward payout generates a 64-character SHA-256 provenance signature.
- **Dual-State Processing**: High-risk claims ($\ge 70$) are safely isolated in `FLAGGED_MANUAL_REVIEW`.
