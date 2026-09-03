const assert = require('assert');
const DigitalIdentityCore = require('../identity/digital_identity_core');

async function runIdentityCoreTests() {
    console.log('🧪 Starting Digital Identity Core Tests...');

    const core = new DigitalIdentityCore();

    // 1. Create Human Citizen Digital Identity
    const humanId = core.createIdentity({
        displayName: 'Commander Elena Woods',
        handle: 'elena_woods',
        entityType: 'HUMAN',
        verificationStatus: 'SYSTEM_VERIFIED',
        avatarId: 'AVT_HUMAN_001',
        visualFamily: 'HUMAN',
        biography: 'Chief astrobiologist on Station Orbit-7.',
        walletAddress: '0x9999888877776666555544443333222211110000',
        telemetryCoordinates: { lat: 45.2, lon: 9.18 }
    });

    assert(humanId.identityId.startsWith('myz:id:'));
    assert.strictEqual(humanId.entityType, 'HUMAN');
    assert.strictEqual(humanId.version, 1);
    console.log(`  ✅ 1. Human citizen persistent identity created: ${humanId.identityId}`);

    // 2. Create Simulated AI Entity Identity
    const simEntity = core.createIdentity({
        displayName: 'Zorgax Sentinel AI',
        handle: 'zorgax_core',
        entityType: 'SIMULATED_ENTITY',
        verificationStatus: 'CRYPTOGRAPHICALLY_PROVEN',
        avatarId: 'AVT_ALIEN_99',
        visualFamily: 'ALIEN',
        biography: 'Autonomous environmental guardian entity.'
    });

    assert.strictEqual(simEntity.entityType, 'SIMULATED_ENTITY');
    assert.strictEqual(simEntity.verificationStatus, 'CRYPTOGRAPHICALLY_PROVEN');
    console.log(`  ✅ 2. Simulated entity identity created: ${simEntity.identityId}`);

    // 3. Decoupled Visual Profile Update (ID remains immutable)
    const originalId = humanId.identityId;
    const updated = core.updateVisualProfile(originalId, {
        avatarId: 'AVT_HUMAN_EXPEDITION',
        visualFamily: 'CYBERPUNK'
    });

    assert.strictEqual(updated.identityId, originalId); // ID unchanged
    assert.strictEqual(updated.version, 2);
    assert.strictEqual(updated.visualProfileRef.avatarId, 'AVT_HUMAN_EXPEDITION');
    console.log('  ✅ 3. Visual profile updated while core identity ID remained strictly immutable');

    // 4. Provenance Chaining Verification
    const chain = core.provenanceChain.get(originalId);
    assert.strictEqual(chain.length, 2);
    assert.strictEqual(chain[0].changeType, 'GENESIS');
    assert.strictEqual(chain[1].changeType, 'VISUAL_UPDATE');
    console.log(`  ✅ 4. Provenance audit chain recorded ${chain.length} cryptographic revisions`);

    // 5. Public Profile Privacy Masking Enforcement
    const publicProfile = core.exportPublicProfile(originalId);
    assert.strictEqual(publicProfile.fields.biography, 'Chief astrobiologist on Station Orbit-7.');
    assert.strictEqual(publicProfile.fields.walletAddress, '[REDACTED_PRIVACY_BY_DESIGN]');
    assert.strictEqual(publicProfile.fields.telemetryCoordinates, '[REDACTED_PRIVACY_BY_DESIGN]');
    console.log('  ✅ 5. Field-level privacy enforced: Wallet and telemetry redacted on public view');

    console.log('🎉 All Digital Identity Core tests passed 100%!');
}

runIdentityCoreTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
