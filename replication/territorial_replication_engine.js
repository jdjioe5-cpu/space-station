/**
 * 🌍 Territorial Scaling & Pilot Replication Engine
 * Resolves Issue #47 (P2)
 */
const crypto = require('crypto');

class TerritorialReplicationEngine {
    constructor() {
        this.templates = new Map();
        this.replicatedZones = new Map();
        this.registerDefaultTemplate();
    }

    registerDefaultTemplate() {
        const defaultBlueprint = {
            templateId: 'LIFE_TERRITORIAL_BLUEPRINT_V1',
            version: '1.0.0',
            standardKPIs: {
                maxCO2Ppm: 450,
                minHumidityPct: 45,
                maxHumidityPct: 80,
                targetBiodiversityScore: 85
            },
            requiredValidatorRoles: ['ACADEMIC_PARTNER', 'INDEPENDENT_AUDITOR'],
            defaultSensors: ['ATMOSPHERIC_TEMP', 'CANOPY_HUMIDITY', 'CO2_NDIR']
        };
        this.templates.set(defaultBlueprint.templateId, defaultBlueprint);
    }

    // Clone and instantiate new territory
    instantiateTerritory(territoryConfig) {
        if (!territoryConfig || !territoryConfig.territoryId) {
            throw new Error('Missing territoryId in configuration');
        }

        const templateId = territoryConfig.templateId || 'LIFE_TERRITORIAL_BLUEPRINT_V1';
        const template = this.templates.get(templateId);
        if (!template) throw new Error(`Template not found: ${templateId}`);

        const replicaId = `REPLICA_${territoryConfig.territoryId}_${Date.now().toString(36)}`;
        const replicaPayload = {
            replicaId,
            territoryId: territoryConfig.territoryId,
            regionName: territoryConfig.regionName || 'Alpine Pilot Zone',
            templateUsed: templateId,
            partnerOrganization: territoryConfig.partnerOrganization || 'Local Territorial Consortium',
            customKPIs: { ...template.standardKPIs, ...(territoryConfig.kpiOverrides || {}) },
            assignedValidators: territoryConfig.assignedValidators || ['VAL_ROMA_TRE'],
            registeredSensors: territoryConfig.sensors || template.defaultSensors,
            instantiatedAt: new Date().toISOString()
        };

        const replicaHash = crypto.createHash('sha256').update(JSON.stringify(replicaPayload)).digest('hex').substring(0, 16);
        const replica = {
            ...replicaPayload,
            provenanceHash: replicaHash,
            status: 'ACTIVE'
        };

        this.replicatedZones.set(replica.replicaId, replica);
        return replica;
    }

    // Multi-territory benchmark comparison
    compareTerritories() {
        const list = Array.from(this.replicatedZones.values());
        return {
            totalReplicas: list.length,
            territories: list.map(r => ({
                replicaId: r.replicaId,
                regionName: r.regionName,
                partner: r.partnerOrganization,
                kpiCO2Max: r.customKPIs.maxCO2Ppm,
                sensorCount: r.registeredSensors.length,
                provenanceHash: r.provenanceHash
            }))
        };
    }
}

module.exports = TerritorialReplicationEngine;
