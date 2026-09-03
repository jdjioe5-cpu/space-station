# 🎒 Metaverse Inventory & Wearables Specification (space-station)

Technical specification for persistent multi-category inventories, avatar cosmetic equipping slots, SHA-256 provenance verification, and soulbound reward protections in **MyZubster Space Station** (resolves Issue #34).

---

## 📌 Architecture
- **5 Equipping Slots**: `HEAD`, `TORSO`, `LEGS`, `BADGE`, `PROP`.
- **Cryptographic Provenance**: Every item is hashed with owner ID, source, and acquisition timestamp.
- **Soulbound Protection**: Milestones and LIFE achievement badges are marked `isTransferable: false` preventing secondary market exploitation.
- **Character Creator Interoperability**: Seamlessly mounts cosmetic skins to spatial presence cards.
