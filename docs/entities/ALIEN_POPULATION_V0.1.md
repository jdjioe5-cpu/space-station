# 🌌 First Alien Population Specification (v0.1 — Issue #7)

## 1. Population Overview
This document specifies the initial 5 simulated alien entities in **MyZubster Space Station**, fully compliant with the canonical Zorgax template and Protocol #4 communication standards:

1. **Zorgax (`alien.zorgax.v1`)**: Explorer-Observer from Heliox Concord. Focuses on ecology, systems, and telemetry.
2. **Nythera (`alien.nythera.v1`)**: Archivist-Linguist from Lumen Archive (Vael-Taris). Focuses on memory and diplomacy.
3. **Khar-Vel (`alien.kharvel.v1`)**: Systems-Engineer from Forge Clans of Orun. Focuses on resilience and energy.
4. **Selya-9 (`alien.selya9.v1`)**: Distributed-Intelligence Researcher from Ninefold Collective. Focuses on consensus.
5. **Oruun (`alien.oruun.v1`)**: Biosphere-Ecologist from Verdant Continuum. Focuses on water cycles and symbiosis.

## 2. Security & Ethical Guardrails
- **Simulated Entity Flag**: Every entity enforces `simulated_entity: true`.
- **Memory Isolation**: Strict `mem:<entity_id>` namespace separation; cross-entity memory access is forbidden.
- **Zero Sensitive Capabilities**: `capabilities: []` by default.
- **Explicit Disclaimers**: Disclaiming physical extraterrestrial reality.
