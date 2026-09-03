# 🪙 Environmental Bounty Validation & MYZ Reward Policy (space-station)

Technical specification for evidence-tier reward calculations, anti-replay idempotency enforcement, and cryptographic reward disbursement receipts in **MyZubster Space Station** (resolves Issue #43).

---

## 📌 Reward Policy Tiers
- `UNVERIFIED`: **0 MYZ** (Strict anti-spam policy: unverified environmental claims yield zero payout).
- `SELF_REPORTED`: **25 MYZ** (Community baseline data submissions).
- `VERIFIED_PHYSICAL`: **100 MYZ** (Authenticated hardware IoT telemetry).
- `PARTNER_VALIDATED`: **250 MYZ** (Institutional/academic scientific attestation).

## 📌 Idempotency & Replay Attack Prevention
- Claims are tracked via an in-memory and persistent hash index.
- Duplicate submission attempts fail deterministically with `Double-reward attempt rejected`.
