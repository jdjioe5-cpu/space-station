# 🪐 Metaverse Bounty Engine Specification (space-station)

Technical specification for the core Metaverse Bounty Engine, 10-state deterministic lifecycle, proof validation routing, and cryptographic reward disbursement receipts in **MyZubster Space Station** (resolves Issue #38).

---

## 📌 Architecture
- **Lifecycle State Machine**: `DRAFT` -> `PUBLISHED` -> `AVAILABLE` -> `CLAIMED` -> `IN_PROGRESS` -> `SUBMITTED` -> `VALIDATION` -> `APPROVED` -> `REWARDED` (with terminal states `REJECTED`, `EXPIRED`, `CANCELLED`, `REVOKED`).
- **Proof Dispatching**: Supports `SYSTEM_EVENT`, `QUEST_COMPLETION`, `CREATED_OBJECT`, `MULTIPLAYER_EVENT`, `USER_SUBMISSION`, `SENSOR_DATA`, and `PARTNER_VALIDATION`.
- **Anti-Replay Security**: Deterministic single-payout constraint per identity claim key.
