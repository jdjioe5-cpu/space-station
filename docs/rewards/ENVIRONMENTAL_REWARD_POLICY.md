# Environmental Reward Policy & Trust Model Specification

Resolves Issue #43 (P0).

## Trust Model & Validator Verification Boundaries

To prevent unauthorized economic payouts, the reward engine enforces a strict **fail-closed trust model**:

1. **Independent Validator Requirement**:
   - `PARTNER_VALIDATED` tier (250 MYZ) CANNOT be self-declared by callers.
   - Requires registered validator identity (e.g. `VALIDATOR_ARPA_01`, `VALIDATOR_CNR_02`).
   - Requires valid HMAC-SHA256 attestation over `claimId:validatorId:evidenceHash:tier`.
   - Caller-controlled self-declarations fail closed immediately.

2. **Cryptographic Receipt Digest**:
   - `receiptDigest` contains the 256-bit SHA-256 digest of the canonical disbursement payload.
   - Payout transactions are strictly idempotent and protected by anti-replay memory barriers.

3. **Evidence Linkage**:
   - `evidenceHash` links every claim cryptographically to the immutable MRV dataset.
