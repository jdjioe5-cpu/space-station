# 🛰️ Metaverse Bounty Board Specification (space-station)

Technical specification for the Metaverse Bounty Board engine, dual-scope (Global & Zone-specific) filtering, distinct multi-asset reward accounting, and Cyberpunk responsive terminal interfaces in **MyZubster Space Station** (resolves Issue #39).

---

## 📌 Architecture
- **Dual-Scope Discovery**:
  - Global Board: All open ecosystem missions.
  - Zone-Specific Board: Scoped to designated LIFE Pilot Reserves (e.g. `ZONE_ORTO_ROMA`, `TRENTINO_ALPINE_01`).
- **Multi-Asset Separation**:
  - `MYZ Token`: Liquid on-chain / EVM settlement asset.
  - `XP (Experience Points)`: Non-transferable progression level inside the Metaverse canvas.
  - `Reputation Score`: Sybil-resistant merit rating determining validator & issuer privileges.
