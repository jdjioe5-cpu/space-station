const assert = require('assert');
const MetaverseCoreEngine = require('../core/metaverse_core_engine');

async function runCoreTests() {
    console.log('🧪 Starting Metaverse Core Persistent World Tests...');

    const engine = new MetaverseCoreEngine();

    // 1. Verify Interconnected Zones (At least 3 linked zones)
    assert.strictEqual(engine.zones.size, 3);
    assert(engine.zones.has('ZONE_HUB_CENTRAL'));
    assert(engine.zones.has('ZONE_RESEARCH_LAB'));
    assert(engine.zones.has('ZONE_ORTO_PILOT'));
    console.log('  ✅ 1. Persistent world initialized with 3 interconnected zones');

    // 2. Avatar Join Zone
    const joinRes = engine.joinZone('EXPLORER_NEIL', 'ZONE_HUB_CENTRAL');
    assert.strictEqual(joinRes.status, 'JOINED');
    assert.strictEqual(joinRes.totalOccupants, 1);
    console.log('  ✅ 2. Avatar successfully joined CENTRAL_HUB');

    // 3. Move Within Zone
    const moveRes = engine.move('EXPLORER_NEIL', 12.5, 34.0);
    assert.strictEqual(moveRes.x, 12.5);
    assert.strictEqual(moveRes.y, 34.0);
    console.log('  ✅ 3. Spatial movement tracked authoritatively');

    // 4. Teleport via Portal to RESEARCH_LAB
    const tpRes = engine.teleport('EXPLORER_NEIL', 'PORTAL_TO_LAB');
    assert.strictEqual(tpRes.status, 'TELEPORTED');
    assert.strictEqual(tpRes.destinationZoneId, 'ZONE_RESEARCH_LAB');
    assert.strictEqual(engine.zones.get('ZONE_HUB_CENTRAL').occupants.size, 0);
    assert.strictEqual(engine.zones.get('ZONE_RESEARCH_LAB').occupants.size, 1);
    console.log('  ✅ 4. Portal teleportation executed: Avatar relocated to RESEARCH_LAB');

    // 5. Persistent Object State Update
    const obj = engine.updateObjectState('ZONE_RESEARCH_LAB', 'OBJ_MICROSCOPE', { activeSample: 'SAMPLE_ALGAE_LIFE_09' });
    assert.strictEqual(obj.state.activeSample, 'SAMPLE_ALGAE_LIFE_09');
    console.log('  ✅ 5. Persistent world object state successfully updated and persisted');

    // 6. Avatar Leave Zone
    const leaveRes = engine.leaveZone('EXPLORER_NEIL');
    assert.strictEqual(leaveRes.status, 'LEFT');
    assert.strictEqual(engine.zones.get('ZONE_RESEARCH_LAB').occupants.size, 0);
    console.log('  ✅ 6. Avatar leave zone cleanly unmounted occupancy state');

    console.log('🎉 All Metaverse Core Persistent World tests passed 100%!');
}

runCoreTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
