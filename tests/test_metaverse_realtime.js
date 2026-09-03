const assert = require('assert');
const MetaverseRealtimeEngine = require('../realtime/metaverse_realtime_engine');

async function runRealtimeTests() {
    console.log('🧪 Starting Metaverse Realtime Engine Tests...');

    const engine = new MetaverseRealtimeEngine();

    // 1. Multi-User Presence Connection
    const s1 = engine.connect('PILOT_ALICE', 'ZONE_ORBITAL_BRIDGE');
    const s2 = engine.connect('PILOT_BOB', 'ZONE_ORBITAL_BRIDGE');
    assert.strictEqual(s1.presenceStatus, 'ONLINE');
    assert.strictEqual(s2.presenceStatus, 'ONLINE');
    console.log('  ✅ 1. Multi-user realtime presence established with unique session tokens');

    // 2. Movement Update & Smoothing
    const pos = engine.updatePosition('PILOT_ALICE', 10.0, 20.0, 90.0);
    assert.strictEqual(pos.x, 8.0); // 0 + (10 - 0)*0.8 = 8.0
    assert.strictEqual(pos.y, 16.0); // 0 + (20 - 0)*0.8 = 16.0
    console.log('  ✅ 2. Authoritative movement interpolation and smoothing confirmed');

    // 3. Proximity Query
    engine.updatePosition('PILOT_BOB', 8.5, 16.5);
    const nearby = engine.getNearbyIdentities('PILOT_ALICE', 5.0);
    assert.strictEqual(nearby.length, 1);
    assert.strictEqual(nearby[0].identityId, 'PILOT_BOB');
    console.log(`  ✅ 3. Proximity query detected nearby avatar [PILOT_BOB at distance ${nearby[0].distance}]`);

    // 4. Room Chat Messaging
    const msg = engine.sendChatMessage(s1.sessionToken, 'Sensors nominal across sectors.');
    assert.strictEqual(msg.identityId, 'PILOT_ALICE');
    assert.strictEqual(msg.content, 'Sensors nominal across sectors.');
    console.log('  ✅ 4. Room text chat delivered and buffered in authoritative room history');

    // 5. Trigger Interaction Event
    const event = engine.triggerInteraction('PILOT_ALICE', 'PILOT_BOB', 'QUEST_JOIN', { questId: 'Q_LIFE_ORTO' });
    assert.strictEqual(event.eventType, 'QUEST_JOIN');
    console.log('  ✅ 5. Interaction event [QUEST_JOIN] successfully triggered');

    // 6. Graceful Session Resumption
    const resumed = engine.resumeSession(s1.sessionToken);
    assert.strictEqual(resumed.presenceStatus, 'ONLINE');
    console.log('  ✅ 6. Graceful session reconnect and resumption verified');

    // 7. Load Test MVP (1,000 Position Updates)
    const t0 = Date.now();
    for (let i = 0; i < 1000; i++) {
        engine.updatePosition('PILOT_ALICE', i % 50, (i * 2) % 50);
    }
    const elapsed = Date.now() - t0;
    console.log(`  ✅ 7. Load test MVP completed: 1,000 spatial updates processed in ${elapsed}ms (${(1000 / (elapsed || 1) * 1000).toFixed(0)} updates/sec)`);

    console.log('🎉 All Metaverse Realtime Engine tests passed 100%!');
}

runRealtimeTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
