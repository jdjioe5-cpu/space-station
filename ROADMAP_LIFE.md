# LIFE Integration Roadmap — Space Station / MyZubster

Questa roadmap ordina le funzionalità necessarie per integrare il framework multi-agent di Space Station nel sistema **LIFE MyZubster**.

> Le entità Zorgax, Oruun, Selya-9, Khar-Vel e Nythera restano personaggi/agenti software simulati. Nella proposta LIFE il loro valore deve essere espresso in termini tecnici: MRV, monitoraggio ambientale, validazione, decision support, interoperabilità e replicazione.

## Obiettivo

Costruire una pipeline dimostrabile end-to-end:

```text
Sensor / Utility / Laboratory
            ↓
      Data ingestion
            ↓
   Normalisation + QA/QC
            ↓
        Provenance
            ↓
       MRV Engine
            ↓
 Baseline ↔ Intervention
            ↓
 Environmental KPI
            ↓
 Dashboard + LIFE Report
```

La prima domanda che il sistema deve saper rispondere in modo verificabile è:

> **Quanto abbiamo ridotto consumo/spreco di acqua e con quale qualità dei dati possiamo dimostrarlo?**

---

# P0 — LIFE MVP obbligatorio

## 1. Environmental Data Model
**Deliverable**
- `schemas/environmental-event.schema.json`
- `schemas/sensor-observation.schema.json`
- `schemas/mrv-indicator.schema.json`
- `schemas/pilot.schema.json`

**Definition of Done**
- [ ] schema versionati;
- [ ] validazione automatica;
- [ ] esempi sintetici validi/non validi;
- [ ] campi minimi per timestamp, unità, sorgente, qualità e provenance.

## 2. Sensor / API ingestion
**Deliverable**
- API `/observations`
- adapter CSV/JSON
- adapter sensor gateway
- fixture dati sintetici water pilot

**Definition of Done**
- [ ] ingestione dati timestamped;
- [ ] unit normalization;
- [ ] deduplica;
- [ ] source attribution;
- [ ] error handling e rejected-record log.

## 3. Provenance & Audit Trail
**Responsabile logico:** Selya-9

**Deliverable**
- immutable-style audit log applicativo;
- source ID;
- transformation history;
- validation status;
- actor/process provenance.

**Definition of Done**
- [ ] ogni KPI è riconducibile alle osservazioni sorgente;
- [ ] modifiche e ricalcoli sono tracciati;
- [ ] nessun overwrite silenzioso;
- [ ] export audit disponibile.

## 4. MRV Engine
**Responsabile logico:** Selya-9 + Core

**Deliverable**
- calculation engine;
- indicator registry;
- quality flags;
- uncertainty/validation metadata.

**Definition of Done**
- [ ] almeno 3 indicatori ambientali calcolati;
- [ ] input → formula → output completamente tracciabile;
- [ ] test deterministici;
- [ ] indicator versioning.

## 5. Baseline vs Intervention
**Deliverable**
- API `/baseline`
- API `/intervention`
- API `/indicators`

**Definition of Done**
- [ ] periodo baseline configurabile;
- [ ] periodo intervento configurabile;
- [ ] delta assoluto e percentuale;
- [ ] quality/confidence metadata;
- [ ] confronto replicabile.

## 6. Water Pilot Dashboard
**Deliverable**
Dashboard con almeno:
- consumo/portata acqua;
- qualità dato;
- baseline;
- intervento;
- delta;
- KPI;
- provenance link;
- alert/anomaly placeholder.

**Definition of Done**
- [ ] dashboard alimentata da API reali/mock compatibili;
- [ ] nessun KPI hardcoded;
- [ ] drill-down fino alla sorgente;
- [ ] export CSV/JSON.

## 7. LIFE Report Export
**Deliverable**
- export KPI table;
- baseline/intervention table;
- provenance summary;
- data quality summary.

**Definition of Done**
- [ ] output machine-readable;
- [ ] output human-readable;
- [ ] indicator IDs/versioni inclusi;
- [ ] data lineage incluso.

---

# P1 — Water, validation e multi-agent

## 8. Oruun — Water & Ecosystem Agent
Funzioni:
- quality checks;
- water-use interpretation;
- biodiversity/resource-cycle context;
- anomaly explanation;
- evidence-linked summaries.

**DoD**
- [ ] usa solo dati disponibili nel sistema;
- [ ] distingue fatto, calcolo e inferenza;
- [ ] cita observation/indicator IDs;
- [ ] nessuna modifica autonoma dei dati sorgente.

## 9. Scientific Validation Workflow
Pipeline:

```text
Sensor observation
      ↓
QA/QC
      ↓
Reference laboratory / partner value
      ↓
Comparison
      ↓
Validation state
      ↓
MRV indicator eligibility
```

**DoD**
- [ ] supporto reference measurement;
- [ ] discrepancy threshold configurabile;
- [ ] reviewer identity/provenance;
- [ ] stati `PENDING`, `VALIDATED`, `REJECTED`, `REVIEW_REQUIRED`.

## 10. Multi-Agent Environmental Analysis
Ruoli:
- **Zorgax:** Environmental Observer
- **Oruun:** Water & Ecosystem
- **Selya-9:** MRV / Provenance / Distributed Data
- **Khar-Vel:** Infrastructure & Replication
- **Nythera:** Knowledge & Reporting

**DoD**
- [ ] ogni agent ha scope/capability esplicito;
- [ ] messaggi via protocollo tracciabile;
- [ ] no cross-memory leakage;
- [ ] human approval per azioni sensibili;
- [ ] report finale con provenance.

## 11. Human Approval Gates
**DoD**
- [ ] nessuna decisione critica autonoma;
- [ ] approval per publish/validate/escalate;
- [ ] reviewer audit trail;
- [ ] deny-by-default per capability non dichiarate.

---

# P2 — Territorio, replicazione e interoperabilità

## 12. GIS / Territorial Layer
**Deliverable**
- pilot locations;
- catchment/territorial layers;
- sensor locations;
- facility/pilot metadata;
- indicator overlays.

## 13. Khar-Vel — Replication Agent
Funzioni:
- deployment checklist;
- interoperability profile;
- pilot requirements;
- replication gap analysis;
- configuration portability.

## 14. Interoperability API
**Deliverable**
- documented REST/JSON interface;
- versioning;
- schema compatibility;
- partner adapter contract;
- import/export profiles.

## 15. Anomaly Detection
**Responsabile logico:** Zorgax

**DoD**
- [ ] deterministic baseline rule first;
- [ ] false-positive tracking;
- [ ] anomaly provenance;
- [ ] human review state;
- [ ] no automated operational control.

## 16. Scenario Simulator
Usare solo dopo che i dati reali/sintetici P0 sono stabili.

**DoD**
- [ ] baseline scenario;
- [ ] intervention scenario;
- [ ] scenario assumptions explicit;
- [ ] simulation outputs clearly separated from measured facts.

---

# P3 — Distributed resilience e UX avanzata

## 17. Tor / Onion resilient access
- optional transport;
- no security/compliance bypass;
- independent HTTPS operation;
- health/failover tests.

## 18. Decentralized Node Federation
- multiple approved nodes;
- signed advertisements;
- identity verification;
- health scoring;
- bounded failover;
- no single-point dependency demonstrated in tests.

## 19. Alien Persona / Engagement UI
Le identità narrative possono essere usate per:
- citizen engagement;
- dissemination;
- education;
- explainable agent roles.

Non devono essere necessarie per il funzionamento MRV.

---

# Sprint 1 — Da fare per primo

## Deliverable tecnici
1. `environmental-event.schema.json`
2. `sensor-observation.schema.json`
3. `mrv-indicator.schema.json`
4. API `/observations`, `/indicators`, `/baseline`, `/pilot`
5. provenance/audit service
6. Water Pilot Dashboard
7. demo sintetica baseline → intervention → KPI → report

## Demo target
Dataset sintetico con:
- 30 giorni baseline;
- 30 giorni intervention;
- consumo idrico;
- qualità dato;
- almeno un'anomalia;
- almeno un reference measurement;
- KPI finale di riduzione;
- audit trail completo.

## Sprint 1 Definition of Done
- [ ] dataset ingerito senza hardcoding nel frontend;
- [ ] KPI calcolato dal MRV Engine;
- [ ] provenance completa;
- [ ] dashboard mostra baseline/intervention/delta;
- [ ] export LIFE disponibile;
- [ ] Oruun produce una sintesi evidence-linked;
- [ ] Selya-9 verifica lineage e quality state;
- [ ] tutte le inferenze sono distinguibili dai dati misurati.

---

# Sequenza di esecuzione

```text
DATA
  ↓
MRV
  ↓
WATER PILOT
  ↓
SCIENTIFIC VALIDATION
  ↓
IMPACT
  ↓
REPLICATION
  ↓
DISTRIBUTED RESILIENCE
  ↓
AGENT UX
```

## Regola di priorità

Nessun lavoro P2/P3 deve bloccare P0/P1.

In particolare **Onion, token, wallet, DAO, lore complessa e autonomia avanzata non sono requisiti del LIFE MVP**.

Il criterio guida è semplice:

> Se un partner LIFE apre il sistema, deve poter vedere immediatamente come un dato ambientale entra, viene validato, trasformato in KPI e riportato con provenance verificabile.
