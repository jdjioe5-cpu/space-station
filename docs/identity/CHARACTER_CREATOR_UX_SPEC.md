# 🕹️ Identity UX — Character Creator Visual Flow Specification (space-station)

Technical specification for the mobile-first character creation wizard, 7-step state machine, live preview synchronization, and JSON bundle export in **MyZubster Space Station** (resolves Issue #22).

---

## 📌 Architecture
- **Canonical 7-Step UX Flow**:
  `START → ARCHETYPE → APPEARANCE → STYLE → IDENTITY_DETAILS → PREVIEW → CONFIRM`.
- **Draft & Published Lifecycle**: Supports non-destructive draft preservation across session interruptions.
- **Mobile-First Responsive Wireframe**: Tailored for touch displays and terminal viewports with accessible keyboard controls.
- **Unified Configuration Bundle**: Exports complete synchronized avatar visuals and identity parameters as a single portable JSON asset.
