# 🎮 Character Quests, Levels & Interactive Milestones Specification (space-station)

Technical specification for cadet progression, level curves, quest milestone validation, and strict XP vs MYZ token segregation in **MyZubster Space Station** (resolves Issue #29).

---

## 📌 Architecture
- **Non-Financial XP Curve**: XP governs non-transferable titles, cosmetics, and space access privileges; MYZ tokens represent real rewards.
- **7 Character Quests**: Spanning profile completion, interactive onboarding walkthroughs, community challenges, and verified LIFE MRV milestones.
- **Level Engine**: Dynamic square-root scaling `Level = floor(sqrt(XP / 100)) + 1`.
- **Cosmetic & Badge Unlocks**: Automatically awards soulbound badges and cosmetic gear upon achieving milestone completions.
