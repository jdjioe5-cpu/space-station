# 🪪 Identity Card — Public Profile, Badge & QR/Share View Specification (space-station)

Technical specification for responsive identity cards, SVG image export, deep link routes, status badges (`SIMULATED`/`HUMAN`, `VERIFIED`/`UNVERIFIED`), and server-side privacy masking in **MyZubster Space Station** (resolves Issue #25).

---

## 📌 Architecture
- **Responsive Card Geometry**: Tailored for social preview sharing, mobile rendering, and holographic terminal display.
- **SVG Image Exporter**: Generates vector SVG cards with embedded styling, linear gradients, and badge highlights.
- **Universal Deep Linking**: Supports web URL routes (`https://spacestation.myzubster.io/id/...`) and native desktop URIs (`myz://identity/...`).
- **Server-Side Privacy Guard**: Strictly excludes private wallets, internal IP coordinates, and legal documents.
