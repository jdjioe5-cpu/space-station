/**
 * 🪐 Metaverse Spaces & World Zones Engine
 * Resolves Issue #33 (P2)
 */

class MetaverseSpacesEngine {
    constructor() {
        this.spaces = new Map();
        this._initDefaultLifePilotZone();
    }

    _initDefaultLifePilotZone() {
        const pilot = {
            spaceId: 'ZONE_ORTO_ROMA_PILOT',
            name: 'Orto Botanico Roma LIFE Digital Twin',
            template: 'LIFE_PILOT_ZONE',
            ownerId: 'SYSTEM_LIFE_OPERATOR',
            accessPolicy: 'PUBLIC',
            maxOccupancy: 200,
            placedObjects: [
                {
                    objectId: 'OBJ_CANOPY_MONITOR_01',
                    name: 'Microclimate Canopy Probe',
                    spatialX: 10.5,
                    spatialY: 22.0,
                    isDemoData: true,
                    metrics: { temperatureC: 24.2, humidityPct: 62.0 }
                }
            ],
            isDemoData: true,
            createdAt: new Date().toISOString()
        };
        this.spaces.set(pilot.spaceId, pilot);
    }

    // 1. Create Space
    createSpace(payload) {
        if (!payload.spaceId || !payload.ownerId) {
            throw new Error('spaceId and ownerId are required');
        }

        const space = {
            spaceId: payload.spaceId,
            name: payload.name || 'Orbital Station Compartment',
            template: payload.template || 'PERSONAL_HOME',
            ownerId: payload.ownerId,
            accessPolicy: payload.accessPolicy || 'PUBLIC',
            maxOccupancy: payload.maxOccupancy || 50,
            members: new Set([payload.ownerId]),
            placedObjects: [],
            createdAt: new Date().toISOString()
        };

        this.spaces.set(space.spaceId, space);
        return space;
    }

    // 2. Edit Space Properties
    editSpace(spaceId, editorId, updates) {
        const space = this.spaces.get(spaceId);
        if (!space) throw new Error(`Space ${spaceId} not found`);
        if (space.ownerId !== editorId) throw new Error('Unauthorized: only owner can edit space');

        if (updates.name) space.name = updates.name;
        if (updates.accessPolicy) space.accessPolicy = updates.accessPolicy;
        if (updates.maxOccupancy) space.maxOccupancy = updates.maxOccupancy;
        space.updatedAt = new Date().toISOString();
        return space;
    }

    // 3. Delete Space
    deleteSpace(spaceId, requesterId) {
        const space = this.spaces.get(spaceId);
        if (!space) throw new Error(`Space ${spaceId} not found`);
        if (space.ownerId !== requesterId) throw new Error('Unauthorized: only owner can delete space');

        this.spaces.delete(spaceId);
        return { spaceId, deleted: true };
    }

    // 4. Object Placement & Interaction
    placeObject(spaceId, requesterId, objectPayload) {
        const space = this.spaces.get(spaceId);
        if (!space) throw new Error(`Space ${spaceId} not found`);
        if (space.ownerId !== requesterId) throw new Error('Unauthorized: only owner can place objects');

        const obj = {
            objectId: objectPayload.objectId || `OBJ_${Date.now().toString(36)}`,
            name: objectPayload.name || 'Station Console',
            spatialX: Number(objectPayload.spatialX || 0).toFixed(2),
            spatialY: Number(objectPayload.spatialY || 0).toFixed(2),
            interactive: Boolean(objectPayload.interactive),
            isDemoData: Boolean(objectPayload.isDemoData)
        };

        space.placedObjects.push(obj);
        return obj;
    }

    // 5. Access Permission Checker
    canAccess(spaceId, identityId) {
        const space = this.spaces.get(spaceId);
        if (!space) return false;

        switch (space.accessPolicy) {
            case 'PUBLIC': return true;
            case 'PRIVATE_OWNER': return space.ownerId === identityId;
            case 'MEMBERS_ONLY': return space.members.has(identityId);
            default: return false;
        }
    }

    // 6. Deep Link Routing Generator
    generateDeepLink(spaceId) {
        return `metaverse://space-station.internal/zones/${spaceId}`;
    }
}

module.exports = MetaverseSpacesEngine;
