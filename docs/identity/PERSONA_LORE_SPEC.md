# 📜 Identity Lore — Persona, Skills, Traits & Biography Builder Specification (space-station)

Technical specification for narrative persona attributes, content safety moderation, revision history, and strict segregation between declared skills and technical capabilities in **MyZubster Space Station** (resolves Issue #26).

---

## 📌 Architecture
- **Versioned Lore Entity (`v1.0.0`)**: Rigorously tracks biography, origins, traits, and affiliations across revisions.
- **Content Moderation & Sanitization**: Proactively traps and sanitizes script injection and prompt overrides into `[MODERATED_CONTENT]`.
- **Strict Skill Boundary Principle**: Declared narrative skills (`narrativeSkills`) reside in descriptive metadata and never grant authenticated system access.
- **Responsive Dossier Preview UI**: Integrated terminal editor with live dossier preview.
