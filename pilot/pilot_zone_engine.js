/**
 * 🛰️ LIFE Metaverse Pilot Zone & Environmental Digital Twin Engine
 * Resolves Issue #45 (P1)
 */
const crypto = require('crypto');

class LifePilotZoneEngine {
    constructor(config = {}) {
        this.zoneId = config.zoneId || 'LIFE_PILOT_ZONE_ALPHA';
        this.zoneName = config.zoneName || 'Orto Botanico Digital Twin #1';
        this.accessMode = config.accessMode || 'public'; // public, partner, private
        this.telemetryStore = [];
        this.missions = [
            {
                id: 'MISSION_CO2_REDUCTION',
                title: 'CO2 Sequestration Pilot',
                targetPpmMax: 450,
                bountyReward: '150 MYZ',
                status: 'ACTIVE'
            },
            {
                id: 'MISSION_HUMIDITY_STABILITY',
                title: 'Canopy Microclimate Preservation',
                targetHumidityRange: [50, 75],
                bountyReward: '100 MYZ',
                status: 'ACTIVE'
            }
        ];
        this.npcGuide = {
            name: 'Pytho Entity Guardian',
            role: 'LIFE Metaverse Curator',
            status: 'ONLINE',
            dialogue: 'Benvenuto nella Pilot Zone LIFE! Monitoriamo costantemente la salute del gemello digitale.'
        };
    }

    // Ingest telemetry with mandatory simulation/real tagging
    ingestTelemetry(sample) {
        if (!sample || typeof sample !== 'object') {
            throw new Error('Invalid telemetry sample');
        }

        const isVerified = Boolean(sample.isVerifiedPhysical);
        const dataMode = isVerified ? 'VERIFIED_PHYSICAL' : 'SIMULATED';

        const record = {
            id: `TLM_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            timestamp: sample.timestamp || new Date().toISOString(),
            dataMode,
            source: sample.source || 'IoT_Sensor_Node',
            metrics: {
                temperature: Number(sample.temperature || 20),
                humidity: Number(sample.humidity || 50),
                co2: Number(sample.co2 || 400)
            },
            provenanceHash: crypto.createHash('sha256').update(JSON.stringify(sample)).digest('hex').substring(0, 16)
        };

        this.telemetryStore.push(record);
        return record;
    }

    // Compute MRV (Monitoring, Reporting, Verification) status
    computeMrvStatus() {
        if (this.telemetryStore.length === 0) {
            return { mrvStatus: 'INSUFFICIENT_DATA', score: 0, verifiedRatio: 0 };
        }

        const verifiedCount = this.telemetryStore.filter(r => r.dataMode === 'VERIFIED_PHYSICAL').length;
        const verifiedRatio = Number((verifiedCount / this.telemetryStore.length).toFixed(2));

        // Evaluate mission targets against latest telemetry
        const latest = this.telemetryStore[this.telemetryStore.length - 1];
        let targetsMet = 0;

        if (latest.metrics.co2 <= 450) targetsMet++;
        if (latest.metrics.humidity >= 50 && latest.metrics.humidity <= 75) targetsMet++;

        let score = (verifiedRatio * 50) + (targetsMet * 25);
        let mrvStatus = 'ACCREDITED';
        if (score < 50) mrvStatus = 'PENDING_VALIDATION';
        if (score < 25) mrvStatus = 'FLAGGED';

        return {
            zoneId: this.zoneId,
            mrvStatus,
            score: Math.min(100, score),
            totalSamples: this.telemetryStore.length,
            verifiedCount,
            verifiedRatio,
            latestMetrics: latest.metrics,
            activeMissions: this.missions.length
        };
    }

    // Get Zone State Snapshot
    getZoneSnapshot() {
        const mrv = this.computeMrvStatus();
        return {
            zoneId: this.zoneId,
            zoneName: this.zoneName,
            accessMode: this.accessMode,
            npcGuide: this.npcGuide,
            mrvSummary: mrv,
            missionBoard: this.missions,
            recentTelemetry: this.telemetryStore.slice(-5)
        };
    }
}

module.exports = LifePilotZoneEngine;
