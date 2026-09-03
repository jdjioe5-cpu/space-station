const assert = require('assert');
const MetaverseSpacesEngine = require('../spaces/metaverse_spaces_engine');

async function runSpacesTests() {
    console.log('🧪 Starting Metaverse Spaces & Zones Tests...');

    const engine = new MetaverseSpacesEngine();

    // 1. Verify Preconfigured LIFE Pilot Zone
    const pilot = engine.spaces.get('ZONE_ORTO_ROMA_PILOT');
    assert.strictEqual(pilot.template, 'LIFE_PILOT_ZONE');
    assert.strictEqual(pilot.isDemoData, true);
    assert.strictEqual(pilot.placedObjects[0].isDemoData, true);
    console.log('  ✅ 1. Preconfigured LIFE pilot zone initialized with clearly tagged demo telemetry');

    // 2. Create Personal Room
    const room = engine.createSpace({
        spaceId: 'ROOM_CADET_ALICE',
        name: 'Cadet Alice Living Quarters',
        template: 'PERSONAL_HOME',
        ownerId: 'ALICE_01',
        accessPolicy: 'PRIVATE_OWNER'
    });
    assert.strictEqual(room.ownerId, 'ALICE_01');
    console.log('  ✅ 2. Private personal room created with OWNER access control');

    // 3. Test Access Controls
    assert.strictEqual(engine.canAccess('ROOM_CADET_ALICE', 'ALICE_01'), true);
    assert.strictEqual(engine.canAccess('ROOM_CADET_ALICE', 'INTRUDER_BOB'), false);
    console.log('  ✅ 3. Access control enforced: Owner authorized, unauthorized visitor denied');

    // 4. Object Placement by Owner
    const obj = engine.placeObject('ROOM_CADET_ALICE', 'ALICE_01', {
        name: 'Bonsai Life Pod',
        spatialX: 5.2,
        spatialY: 8.4,
        interactive: true
    });
    assert.strictEqual(obj.name, 'Bonsai Life Pod');
    console.log('  ✅ 4. Interactive prop placed in personal room by owner');

    // 5. Deep Link Generation
    const link = engine.generateDeepLink('ROOM_CADET_ALICE');
    assert.strictEqual(link, 'metaverse://space-station.internal/zones/ROOM_CADET_ALICE');
    console.log(`  ✅ 5. Deep link route generated: [${link}]`);

    // 6. Unauthorized Edit Blocked
    assert.throws(() => {
        engine.editSpace('ROOM_CADET_ALICE', 'HACKER_BOB', { name: 'Compromised Room' });
    }, /Unauthorized: only owner can edit space/);
    console.log('  ✅ 6. Unauthorized room modification blocked');

    console.log('🎉 All Metaverse Spaces & Zones tests passed 100%!');
}

runSpacesTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
