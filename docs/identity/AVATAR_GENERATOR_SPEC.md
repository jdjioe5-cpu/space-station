# 🎨 Identity Visuals — Avatar Generator & Style System Specification (space-station)

Technical specification for deterministic avatar generation, visual families, 1:1 portrait and full-body composition rendering, and JSON configuration serialization in **MyZubster Space Station** (resolves Issue #24).

---

## 📌 Architecture
- **3 Distinct Visual Families**:
  - `CYBERPUNK`: Neon accents, netrunner archetypes, high-contrast dark backdrops.
  - `HUMAN`: Organic palettes, space cadet & commander archetypes.
  - `ALIEN`: Bioluminescent teal/purple palettes, xeno-synthetic archetypes.
- **100% Deterministic Seed PRNG**: Generates identical configurations and graphics from the same seed string.
- **Dual Vector Rendering**: Produces 1:1 square portraits and complete full-body figures.
- **Capability Isolation**: Visual styles are aesthetic layers and convey zero privileged system capabilities.
