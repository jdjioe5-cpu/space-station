const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { AlienEntityManager } = require('../core/alien_entity_framework');

async function runTestSuite() {
    console.log('🧪 Starting Alien Population v0.1 & Protocol #4 Comprehensive Suite (solves #7)...');

    const manager = new AlienEntityManager();
    const populationPath = path.join(__dirname, '../entities/population_v0.1.json');
    const popData = JSON.parse(fs.readFileSync(populationPath, 'utf8'));

    assert.strictEqual(popData.entities.length, 5);

    // 1. Validate Schema Conformance & Registration for 5 standard entities
    for (const ent of popData.entities) {
        assert.strictEqual(ent.simulated_entity, true);
        assert(ent.disclaimer.length > 20);
        assert(Array.isArray(ent.focus_areas) && ent.focus_areas.length > 0);
        manager.registerEntity(ent);
    }
    console.log('  ✅ 1. Positive Registration: All 5 canonical entities registered with unique IDs and namespaces');

    // 2. Negative Tests: Namespace and ID collision resistance
    let caughtCollision = false;
    try {
        manager.registerEntity({
            entity_id: 'alien.clone.v1',
            simulated_entity: true,
            memory_namespace: 'mem:alien.zorgax.v1', // Collides with zorgax!
            name: 'Colliding Clone',
            species: 'Silicon-Crystalline',
            role: 'Scientist',
            disclaimer: 'SIMULATED ENTITY: Test clone disclaimer long text',
            focus_areas: ['Water Efficiency']
        });
    } catch (e) {
        if (e.message.includes('Collision detected: memory_namespace')) {
            caughtCollision = true;
        }
    }
    assert.strictEqual(caughtCollision, true, 'Must reject duplicate memory namespace');
    console.log('  ✅ 2a. Negative Test: Correctly rejected duplicate memory_namespace registration');

    let caughtEmptyNs = false;
    try {
        manager.registerEntity({
            entity_id: 'alien.empty.v1',
            simulated_entity: true,
            memory_namespace: '   ', // Empty namespace!
            name: 'Empty Namespace Clone',
            species: 'Humanoid',
            role: 'Observer',
            disclaimer: 'SIMULATED ENTITY: Test clone disclaimer long text',
            focus_areas: ['Energy']
        });
    } catch (e) {
        if (e.message.includes('memory_namespace must be a non-empty string')) {
            caughtEmptyNs = true;
        }
    }
    assert.strictEqual(caughtEmptyNs, true, 'Must reject empty memory namespace');
    console.log('  ✅ 2b. Negative Test: Correctly rejected empty/whitespace memory_namespace registration');

    // 3. Memory Isolation Verification
    const zorgaxMem = manager.getMemory('alien.zorgax.v1');
    const selyaMem = manager.getMemory('alien.selya9.v1');

    zorgaxMem.set('classified_telemetry', { waterFlowLh: 1250 });
    assert.strictEqual(zorgaxMem.get('classified_telemetry').waterFlowLh, 1250);
    assert.strictEqual(selyaMem.get('classified_telemetry'), null); // Must NOT leak
    console.log('  ✅ 3. Memory Isolation Guard: Zero cross-namespace memory contamination verified');

    // 4. Protocol #4 Content Hash Integrity & Tamper Defense
    const message = manager.sendMessage(
        'alien.zorgax.v1',
        'alien.oruun.v1',
        'ENVIRONMENTAL_WATER_OBSERVATION',
        { pilotId: 'PILOT_LIFE_ES_001', flowDeltaL: -1340 }
    );
    assert.strictEqual(message.protocol_version, 'protocol.v4');
    assert.strictEqual(message.content_hash.length, 64);
    assert.strictEqual(manager.verifyMessage(message), true);
    console.log('  ✅ 4a. Protocol #4 Content Hash: Verified authentic, untampered message hash');

    // Negative Tamper Test
    const tamperedMessage = JSON.parse(JSON.stringify(message));
    tamperedMessage.payload.flowDeltaL = +999999; // Maliciously altered payload
    assert.strictEqual(manager.verifyMessage(tamperedMessage), false, 'Tampered message must fail verification');
    console.log('  ✅ 4b. Negative Test: Tampered Protocol #4 payload successfully detected and rejected');

    // 5. Multi-Entity Simulation (Zorgax + Selya-9 + Oruun)
    const simResult = manager.runMultiEntitySimulation(
        'alien.zorgax.v1',
        ['alien.selya9.v1', 'alien.oruun.v1'],
        { title: 'LIFE Pilot Water Efficiency Verification', deltaSavedLiters: 1920 }
    );
    assert.strictEqual(simResult.status, 'COMPLETED_CONSENSUS');
    assert.strictEqual(simResult.participants.length, 3);
    assert.strictEqual(simResult.exchanges_count, 3);
    console.log('  ✅ 5. Multi-Entity Consensus: Multi-party collaboration completed successfully');

    console.log('🎉 All Alien Population v0.1 tests (including all Negative Tests) passed 100%!');
}

runTestSuite().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
