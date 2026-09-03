# 🎯 Metaverse Missions & Quests Specification (space-station)

Technical specification for cooperative multiplayer questing, specialist NPC entity hooks, LIFE evidence level boundaries, and event scheduling windows in **MyZubster Space Station** (resolves Issue #36).

---

## 📌 Architecture
- **7 Mission Archetypes**: `ONBOARDING`, `EXPLORATION`, `ENTITY_DRIVEN`, `COOPERATIVE_CHALLENGE`, `BUILD_CHALLENGE`, `LIFE_ENVIRONMENTAL`, and `EVENT_LIMITED`.
- **NPC Integration**: Autonomous NPCs (e.g. Pytho Scout) act as quest givers without leaking administrative world privileges.
- **LIFE Regulatory Boundary**: `SIMULATED` demo runs are strictly barred from MYZ token rewards; only `USER_REPORTED`, `SENSOR_BACKED`, and `PARTNER_VALIDATED` streams qualify.
