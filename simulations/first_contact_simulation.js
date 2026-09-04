/**
 * 🧪 First Contact Multi-Agent Simulation Engine
 * Resolves Issue #8 (First Contact Simulation — Zorgax, Nythera, Selya-9 e Oruun)
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { AlienEntityManager } = require('../core/alien_entity_framework');

class FirstContactSimulationRunner {
    constructor(seed = 'seed_first_contact_default') {
        this.seed = seed;
        this.manager = new AlienEntityManager();
        this.baseTimestamp = 1788500000000;
        this.loadEntities();
    }

    getDeterministicTimestamp(stepOffset) {
        return new Date(this.baseTimestamp + stepOffset * 1000).toISOString();
    }

    loadEntities() {
        const entitiesDir = path.join(__dirname, '../entities');
        const entityFiles = [
            'alien.zorgax.v1.json',
            'alien.nythera.v1.json',
            'alien.selya9.v1.json',
            'alien.oruun.v1.json'
        ];

        for (const file of entityFiles) {
            const fullPath = path.join(entitiesDir, file);
            if (fs.existsSync(fullPath)) {
                const config = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                this.manager.registerEntity(config);
            }
        }
    }

    computeHash(data) {
        return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    }

    runSimulation(fixture) {
        if (!fixture || !fixture.is_synthetic) {
            throw new Error('Simulation strictly requires synthetic fixture input');
        }

        const transcript = {
            simulation_id: `SIM_CONTACT_${this.seed}`,
            is_synthetic: true,
            fixture_id: fixture.scenario_id,
            seed: this.seed,
            exchanges: [],
            ground_truth_facts: fixture.ground_truth_facts,
            inferences: {},
            final_report: null
        };

        // 1. Zorgax Observes and Triages
        const zorgaxMem = this.manager.getMemory('alien.zorgax.v1');
        zorgaxMem.set('active_anomaly', fixture);
        
        transcript.exchanges.push({
            step: 1,
            sender: 'alien.zorgax.v1',
            role: 'explorer-observer',
            action: 'OBSERVE_ANOMALY',
            timestamp: this.getDeterministicTimestamp(1),
            summary: `Zorgax detected Sector 4 closed-loop water drop of ${fixture.ground_truth_facts.deficit_percentage}%. Initiating Protocol #4 multi-entity consultation.`
        });

        // 2. Oruun Ecological Assessment
        const msgToOruun = this.manager.sendMessage(
            'alien.zorgax.v1',
            'alien.oruun.v1',
            'ECOLOGICAL_ASSESSMENT_REQ',
            { facts: fixture.ground_truth_facts },
            this.getDeterministicTimestamp(2),
            `MSG_${this.seed}_ORUUN`
        );
        const oruunMem = this.manager.getMemory('alien.oruun.v1');
        const oruunInference = {
            perspective: 'biosphere-ecologist',
            finding: 'Microbial bio-filters demonstrate elevated transpiration buffering. Water is bound in biomass rather than lost to external hull breach.',
            action: 'Recommend gradual osmotic rebalancing over 12 daylight cycles.'
        };
        oruunMem.set('inference', oruunInference);
        transcript.inferences['alien.oruun.v1'] = oruunInference;
        transcript.exchanges.push({
            step: 2,
            sender: 'alien.oruun.v1',
            recipient: 'alien.zorgax.v1',
            message_id: msgToOruun.message_id,
            timestamp: this.getDeterministicTimestamp(2),
            content: oruunInference
        });

        // 3. Selya-9 Distributed Sensing & Consensus Plan
        const msgToSelya = this.manager.sendMessage(
            'alien.zorgax.v1',
            'alien.selya9.v1',
            'DISTRIBUTED_PLAN_REQ',
            { facts: fixture.ground_truth_facts },
            this.getDeterministicTimestamp(3),
            `MSG_${this.seed}_SELYA9`
        );
        const selyaMem = this.manager.getMemory('alien.selya9.v1');
        const selyaInference = {
            perspective: 'distributed-intelligence',
            finding: 'Sector 4 telemetry nodes display timestamp jitter (+142ms). Sensor drift likely exaggerating vapor deficit by 12.3%.',
            action: 'Deploy 8 virtual observer consensus probes to triangulate vapor condensation.'
        };
        selyaMem.set('inference', selyaInference);
        transcript.inferences['alien.selya9.v1'] = selyaInference;
        transcript.exchanges.push({
            step: 3,
            sender: 'alien.selya9.v1',
            recipient: 'alien.zorgax.v1',
            message_id: msgToSelya.message_id,
            timestamp: this.getDeterministicTimestamp(3),
            content: selyaInference
        });

        // 4. Nythera Synthesis & Mediation
        const msgToNythera = this.manager.sendMessage(
            'alien.zorgax.v1',
            'alien.nythera.v1',
            'SYNTHESIS_MEDIATION_REQ',
            { oruun: oruunInference, selya9: selyaInference },
            this.getDeterministicTimestamp(4),
            `MSG_${this.seed}_NYTHERA`
        );
        const nytheraMem = this.manager.getMemory('alien.nythera.v1');
        const nytheraInference = {
            perspective: 'archivist-linguist',
            finding: 'Harmonization achieved: biological absorption (Oruun) and sensor calibration offset (Selya-9) fully account for observed deficit without systemic failure.',
            action: 'Record unified consensus into Lumen Archives as Non-Catastrophic Environmental Shift.'
        };
        nytheraMem.set('inference', nytheraInference);
        transcript.inferences['alien.nythera.v1'] = nytheraInference;
        transcript.exchanges.push({
            step: 4,
            sender: 'alien.nythera.v1',
            recipient: 'alien.zorgax.v1',
            message_id: msgToNythera.message_id,
            timestamp: this.getDeterministicTimestamp(4),
            content: nytheraInference
        });

        // 5. Zorgax Final Simulated Report
        transcript.final_report = {
            simulated_world_facts: {
                scenario_id: fixture.scenario_id,
                measured_deficit: fixture.ground_truth_facts.deficit_liters,
                physical_leak_detected: fixture.ground_truth_facts.leak_detected
            },
            entity_consensus_inferences: {
                biological_cause: oruunInference.finding,
                technical_sensor_drift: selyaInference.finding,
                archival_resolution: nytheraInference.finding
            },
            status: 'CONSENSUS_REACHED',
            confidence: 0.98
        };

        transcript.transcript_hash = this.computeHash(transcript);
        return transcript;
    }

    exportTranscriptJson(transcript) {
        return JSON.stringify(transcript, null, 2);
    }
}

module.exports = {
    FirstContactSimulationRunner
};
