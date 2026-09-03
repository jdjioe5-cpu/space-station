const assert = require('assert');
const MetaverseSafetyEngine = require('../safety/metaverse_safety_engine');

async function runSafetyTests() {
    console.log('🧪 Starting Metaverse Safety & Moderation Tests...');

    const engine = new MetaverseSafetyEngine();

    // 1. Test Moderation Permission Matrix
    assert.strictEqual(engine.hasPermission('MODERATOR', 'MUTE'), true);
    assert.strictEqual(engine.hasPermission('MODERATOR', 'BAN'), false);
    assert.strictEqual(engine.hasPermission('ADMIN', 'BAN'), true);
    console.log('  ✅ 1. Role-based moderation permissions verified');

    // 2. Test Mute Flow
    const muteRes = engine.muteUser('MODERATOR', 'USER_TROLL_01', 60);
    assert.strictEqual(muteRes.status, 'MUTED');
    assert.strictEqual(engine.isMuted('USER_TROLL_01'), true);
    console.log('  ✅ 2. Target user successfully muted with expiry tracking');

    // 3. Test Block Flow
    engine.blockUser('ALICE_01', 'BOB_SPAMMER');
    assert.strictEqual(engine.isBlocked('ALICE_01', 'BOB_SPAMMER'), true);
    assert.strictEqual(engine.isBlocked('BOB_SPAMMER', 'ALICE_01'), false);
    console.log('  ✅ 3. Directional user-to-user blocking verified');

    // 4. Test Abuse Reporting
    const rep = engine.reportAbuse('CHARLIE_01', 'BNT_FRAUD_99', 'Fake IoT Telemetry');
    assert.strictEqual(rep.status, 'PENDING_REVIEW');
    console.log('  ✅ 4. Abuse report recorded with audit trace');

    // 5. Test Rate Limiting
    for (let i = 0; i < 5; i++) {
        assert.strictEqual(engine.checkRateLimit('SPEEDY_USER', 5).allowed, true);
    }
    assert.strictEqual(engine.checkRateLimit('SPEEDY_USER', 5).allowed, false);
    console.log('  ✅ 5. Sliding-window anti-spam rate limiter blocked excessive traffic');

    // 6. Test Privacy Shield
    const raw = {
        avatarId: 'pytho_scout',
        zoneId: 'ZONE_ORTO_ROMA',
        spatialX: 12.3456,
        spatialY: 78.9101,
        clientIp: '192.168.1.100',
        realGpsLocation: '41.8933, 12.4828',
        privateWalletKey: '0xabc123secret'
    };
    const clean = engine.sanitizePresence(raw);
    assert.strictEqual(clean.clientIp, undefined);
    assert.strictEqual(clean.realGpsLocation, undefined);
    assert.strictEqual(clean.privateWalletKey, undefined);
    assert.strictEqual(clean.spatialX, '12.35');
    console.log('  ✅ 6. Privacy shield sanitized presence: IP, GPS and Wallet stripped');

    console.log('🎉 All Metaverse Safety & Moderation tests passed 100%!');
}

runSafetyTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
