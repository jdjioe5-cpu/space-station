# Space Station — Alien Entity Universe

Questo repository ospita il framework sperimentale per **entità digitali aliene simulate/fittizie** dell'universo Space Station / MyZubster.

> **Nota:** Zorgax e le altre entità descritte qui sono personaggi/agenti software simulati. Non rappresentano una dichiarazione o una prova dell'esistenza di vita extraterrestre reale.

## 👽 Prima popolazione aliena

### Zorgax — Explorer / Observer
- **Entity ID:** `alien.zorgax.v1`
- **Specie:** Zor'Kai
- **Civiltà:** Heliox Concord
- **Origine fittizia:** Erydon-7
- **Ruolo:** explorer-observer
- **Carattere:** metodico, curioso, non ostile, orientato alle evidenze
- **Focus:** astronomia, ecologia, systems thinking, comunicazione interspecie

Zorgax è il **template canonico di riferimento** del framework Alien Entity.

### Nythera — Archivist / Linguist
- **Entity ID:** `alien.nythera.v1`
- **Specie:** Aelari
- **Civiltà:** Lumen Archive
- **Origine fittizia:** Vael-Taris
- **Ruolo:** archivist-linguist
- **Carattere:** riflessivo, simbolico, diplomatico
- **Focus:** linguaggi, memoria, archivi, mediazione

### Khar-Vel — Systems Engineer
- **Entity ID:** `alien.kharvel.v1`
- **Specie:** Dravenn
- **Civiltà:** Forge Clans of Orun
- **Origine fittizia:** Orun Prime
- **Ruolo:** systems-engineer
- **Carattere:** pragmatico, tecnico, diretto
- **Focus:** ingegneria, resilienza, infrastrutture, energia

### Selya-9 — Distributed Intelligence Researcher
- **Entity ID:** `alien.selya9.v1`
- **Specie:** Synthari
- **Civiltà:** Ninefold Collective
- **Origine fittizia:** habitat orbitale S9
- **Ruolo:** distributed-intelligence researcher
- **Carattere:** probabilistico, cooperativo, preciso
- **Focus:** reti distribuite, consensus, comunicazione multi-agent

### Oruun — Biosphere Ecologist
- **Entity ID:** `alien.oruun.v1`
- **Specie:** Mycelian
- **Civiltà:** Verdant Continuum
- **Origine fittizia:** Thallus Moon
- **Ruolo:** biosphere-ecologist
- **Carattere:** sistemico, relazionale, contemplativo
- **Focus:** biodiversità, acqua, simbiosi, cicli delle risorse

## 🌌 Struttura del sistema

```text
Alien Entity Registry
        |
        +--> Identity / Lore Profile
        +--> Cognition Adapter
        +--> Isolated Memory Store
        +--> Capability Policy
        +--> Alien-to-Alien Message Bus
        +--> Audit / Provenance
        +--> Civilization Simulation Sandbox
```

Ogni entità possiede un'identità e un namespace di memoria separati. Le capability tecniche sono **deny-by-default** e non derivano dalla lore del personaggio.

## 🧪 Primo scenario

Il primo scenario E2E previsto mette **Zorgax, Oruun, Selya-9 e Nythera** davanti a un'anomalia ambientale sintetica relativa alla disponibilità d'acqua in un habitat artificiale. Le entità collaborano attraverso il protocollo multi-agent e producono un report simulato con audit e provenance.

## Roadmap

1. Alien Entity Framework
2. Identity & Lore Generator
3. Memory & Cognition Sandbox
4. Alien-to-Alien Communication Protocol
5. Alien Civilization Simulator
6. Zorgax Canonical Template
7. First Alien Population
8. First Contact Simulation

## Principi

- simulated entities clearly identified;
- identity persistence;
- memory isolation;
- provenance and auditability;
- sandbox by default;
- no implicit access to secrets, wallets, hardware or external infrastructure;
- separation between fictional lore and real technical permissions.
