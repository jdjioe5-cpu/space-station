/**
 * 🌐 Metaverse Core Persistent World & Spatial Architecture Engine
 * Resolves Issue #31 (P1)
 */

class MetaverseCoreEngine {
    constructor(worldId = 'MYZ_SPACE_STATION_CORE') {
        this.worldId = worldId;
        this.version = '1.0.0';
        this.zones = new Map();
        this.activeAvatars = new Map(); // identityId -> { zoneId, x, y }
        this._initDemoInterconnectedZones();
    }

    // Initialize 3 interconnected zones demo
    _initDemoInterconnectedZones() {
        // Zone 1: Central Hub
        this.registerZone({
            zoneId: 'ZONE_HUB_CENTRAL',
            name: 'Promenade Central Hub',
            accessPolicy: 'PUBLIC',
            portals: [
                { portalId: 'PORTAL_TO_LAB', targetZoneId: 'ZONE_RESEARCH_LAB', spawnCoords: { x: 5, y: 5 } },
                { portalId: 'PORTAL_TO_ORTO', targetZoneId: 'ZONE_ORTO_PILOT', spawnCoords: { x: 2, y: 2 } }
            ],
            persistentObjects: [
                { objectId: 'OBJ_MONUMENT', name: 'Cosmic Obelisk', state: { glowing: true, charges: 100 } }
            ]
        });

        // Zone 2: Research Lab
        this.registerZone({
            zoneId: 'ZONE_RESEARCH_LAB',
            name: 'Bio-Regenerative Lab',
            accessPolicy: 'PUBLIC',
            portals: [
                { portalId: 'PORTAL_TO_HUB_FROM_LAB', targetZoneId: 'ZONE_HUB_CENTRAL', spawnCoords: { x: 0, y: 0 } }
            ],
            persistentObjects: [
                { objectId: 'OBJ_MICROSCOPE', name: 'Quantum Spectrometer', state: { activeSample: null } }
            ]
        });

        // Zone 3: LIFE Pilot Botanical Zone
        this.registerZone({
            zoneId: 'ZONE_ORTO_PILOT',
            name: 'LIFE Pilot Botanical Canopy',
            accessPolicy: 'PUBLIC',
            portals: [
                { portalId: 'PORTAL_TO_HUB_FROM_ORTO', targetZoneId: 'ZONE_HUB_CENTRAL', spawnCoords: { x: 0, y: 0 } }
            ],
            persistentObjects: [
                { objectId: 'OBJ_CANOPY_SENSOR', name: 'Canopy Telemetry Logger', state: { operational: true } }
            ]
        });
    }

    registerZone(zoneConfig) {
        if (!zoneConfig.zoneId) throw new Error('Missing zoneId');
        this.zones.set(zoneConfig.zoneId, {
            zoneId: zoneConfig.zoneId,
            name: zoneConfig.name || 'Station Sector',
            accessPolicy: zoneConfig.accessPolicy || 'PUBLIC',
            portals: zoneConfig.portals || [],
            persistentObjects: zoneConfig.persistentObjects || [],
            occupants: new Set()
        });
        return this.zones.get(zoneConfig.zoneId);
    }

    // 1. Join Zone API
    joinZone(identityId, zoneId) {
        const zone = this.zones.get(zoneId);
        if (!zone) throw new Error(`Zone ${zoneId} does not exist`);

        // Check permission
        if (zone.accessPolicy === 'PRIVATE') {
            throw new Error(`Zone ${zoneId} is private`);
        }

        // Leave previous zone if any
        if (this.activeAvatars.has(identityId)) {
            this.leaveZone(identityId);
        }

        zone.occupants.add(identityId);
        const avatarState = { zoneId, x: 0.0, y: 0.0, joinedAt: new Date().toISOString() };
        this.activeAvatars.set(identityId, avatarState);

        return { identityId, zoneId, status: 'JOINED', totalOccupants: zone.occupants.size };
    }

    // 2. Leave Zone API
    leaveZone(identityId) {
        const current = this.activeAvatars.get(identityId);
        if (!current) return { identityId, status: 'NOT_IN_ANY_ZONE' };

        const zone = this.zones.get(current.zoneId);
        if (zone) zone.occupants.delete(identityId);
        this.activeAvatars.delete(identityId);

        return { identityId, leftZoneId: current.zoneId, status: 'LEFT' };
    }

    // 3. Move Avatar API
    move(identityId, x, y) {
        const current = this.activeAvatars.get(identityId);
        if (!current) throw new Error(`Avatar ${identityId} is not in any active zone`);

        current.x = Number(x.toFixed(2));
        current.y = Number(y.toFixed(2));
        return { identityId, zoneId: current.zoneId, x: current.x, y: current.y };
    }

    // 4. Portal Teleport API
    teleport(identityId, portalId) {
        const current = this.activeAvatars.get(identityId);
        if (!current) throw new Error('Avatar not spawned in world');

        const currentZone = this.zones.get(current.zoneId);
        const portal = currentZone.portals.find(p => p.portalId === portalId);
        if (!portal) throw new Error(`Portal ${portalId} not found in ${current.zoneId}`);

        const targetZone = this.zones.get(portal.targetZoneId);
        if (!targetZone) throw new Error(`Target zone ${portal.targetZoneId} does not exist`);

        // Relocate
        currentZone.occupants.delete(identityId);
        targetZone.occupants.add(identityId);

        current.zoneId = portal.targetZoneId;
        current.x = portal.spawnCoords.x;
        current.y = portal.spawnCoords.y;

        return {
            identityId,
            originZoneId: currentZone.zoneId,
            destinationZoneId: targetZone.zoneId,
            spawnCoords: portal.spawnCoords,
            status: 'TELEPORTED'
        };
    }

    // 5. Persistent Object State Manipulation
    updateObjectState(zoneId, objectId, stateUpdate) {
        const zone = this.zones.get(zoneId);
        if (!zone) throw new Error(`Zone ${zoneId} not found`);

        const obj = zone.persistentObjects.find(o => o.objectId === objectId);
        if (!obj) throw new Error(`Object ${objectId} not found in ${zoneId}`);

        obj.state = { ...obj.state, ...stateUpdate };
        obj.updatedAt = new Date().toISOString();
        return obj;
    }
}

module.exports = MetaverseCoreEngine;
